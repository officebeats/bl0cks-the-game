import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';

// ── Xterm Setup ──────────────────────────────────────────────────
export const term = new Terminal({
  cursorBlink: true,
  theme: {
    background: '#09090b',
    foreground: '#a1a1aa',
    black: '#18181b',
    red: '#e11d48',
    green: '#10b981',
    yellow: '#d4af37',
    blue: '#3b82f6',
    magenta: '#d946ef',
    cyan: '#06b6d4',
    white: '#fafafa'
  },
  fontFamily: 'monospace',
  fontSize: 14,
  allowProposedApi: true
});

const fitAddon = new FitAddon();
term.loadAddon(fitAddon);

let currentResolver = null;

export function initIO() {
  const container = document.getElementById('terminal-container');
  term.open(container);
  fitAddon.fit();

  window.addEventListener('resize', () => {
    fitAddon.fit();
  });

  // Basic xterm input handling (for physical keyboard)
  term.onData(data => {
    // If we're waiting for animated prompt keys, we shouldn't handle it here directly,
    // wait, we need a global key interceptor for `showAnimatedPrompt`.
    // We can dispatch custom events to make it look exactly like Node's process.stdin
    const event = new CustomEvent('xterm_keypress', { detail: data });
    window.dispatchEvent(event);
  });

  setupVirtualKeyboard();
}

function setupVirtualKeyboard() {
  const inputEl = document.getElementById('deck-input');
  
  // Virtual Buttons
  document.querySelectorAll('.deck-btn[data-val]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const val = btn.getAttribute('data-val');
      
      // If we are currently handling a standard "ask", we just append to the input buffer
      // But if we're in "raw mode" (like showAnimatedPrompt), we emit raw characters
      if (rawMode) {
        // Synthesize single characters
        for (let i = 0; i < val.length; i++) {
          window.dispatchEvent(new CustomEvent('xterm_keypress', { detail: val[i] }));
        }
      } else {
        inputEl.value += val;
        inputEl.focus();
      }
    });
  });

  // Enter button
  document.getElementById('deck-enter').addEventListener('click', (e) => {
    e.preventDefault();
    if (rawMode) {
       window.dispatchEvent(new CustomEvent('xterm_keypress', { detail: '\r' })); // return key
    } else {
       if (currentResolver) {
         const val = inputEl.value;
         inputEl.value = '';
         term.write(val + '\r\n'); // echo it
         currentResolver(val);
         currentResolver = null;
       }
    }
  });

  // Physical Enter key in input field
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (rawMode) {
         window.dispatchEvent(new CustomEvent('xterm_keypress', { detail: '\r' }));
      } else {
         if (currentResolver) {
           const val = inputEl.value;
           inputEl.value = '';
           term.write(val + '\r\n');
           currentResolver(val);
           currentResolver = null;
         }
      }
    }
    // Also proxy backspace/chars for raw mode if focused
    if (rawMode && e.key !== 'Enter') {
       if (e.key === 'Backspace') {
         window.dispatchEvent(new CustomEvent('xterm_keypress', { detail: '\x7f' }));
         e.preventDefault();
       } else if (e.key.length === 1) {
         window.dispatchEvent(new CustomEvent('xterm_keypress', { detail: e.key }));
         e.preventDefault();
       }
    }
  });
}

// ── Async IO ─────────────────────────────────────────────────────

export function ask(promptText) {
  // Ensure the terminal is updated
  if (promptText) {
    term.write(promptText);
  }
  return new Promise(resolve => {
    currentResolver = resolve;
  });
}

export function clear() {
  term.clear();
  term.write('\x1b[H\x1b[2J');
}

export function write(str) {
  // Translate \n to \r\n for xterm.js
  const formatted = String(str).replace(/\r?\n/g, '\r\n');
  term.write(formatted);
}

// Emulate process hooks for raw mode parsing
let rawMode = false;
let keyListeners = [];

export const processEmu = {
  stdout: {
    write: write
  },
  stdin: {
    setRawMode: (bool) => {
      rawMode = bool;
    },
    resume: () => {},
    on: (evt, cb) => {
      if (evt === 'keypress') {
        const handler = (e) => {
           let str = e.detail;
           // decode backspace
           if (str === '\x7f' || str === '\b') {
             cb(null, { name: 'backspace' });
             return;
           }
           if (str === '\r' || str === '\n') {
             cb(null, { name: 'return' });
             return;
           }
           if (str === '\x1b[A') { cb(null, { name: 'up' }); return; }
           if (str === '\x1b[B') { cb(null, { name: 'down' }); return; }
           
           if (str === '\x03') { cb(null, { name: 'c', ctrl: true }); return; }

           cb(str, { name: 'char' });
        };
        keyListeners.push({ cb, handler });
        window.addEventListener('xterm_keypress', handler);
      }
    },
    removeListener: (evt, cb) => {
      if (evt === 'keypress') {
         const idx = keyListeners.findIndex(l => l.cb === cb);
         if (idx !== -1) {
           window.removeEventListener('xterm_keypress', keyListeners[idx].handler);
           keyListeners.splice(idx, 1);
         }
      }
    }
  },
  exit: (code) => {
    term.write(`\r\n\x1b[31m[Process Exited with code ${code}]\x1b[0m\r\n`);
  }
};

// ── Storage Emulation ────────────────────────────────────────────

export function saveConfig(config) {
  localStorage.setItem('bl0cks_config', JSON.stringify(config));
}

export function loadConfig() {
  const v = localStorage.getItem('bl0cks_config');
  return v ? JSON.parse(v) : {};
}

export function saveSession(adapterName, state, lvlPath) {
  localStorage.setItem('bl0cks_session', JSON.stringify({ adapterName, adapterState: state, levelPath: lvlPath }));
}

export function loadSession() {
  const v = localStorage.getItem('bl0cks_session');
  return v ? JSON.parse(v) : null;
}

// ── File System Emulation (fetch from public/) ───────────────────
// We will serve the world/ and levels/ markdown files from the Vite public dir
export async function loadGameFileAsync(path) {
  try {
    const res = await fetch(`/${path}`);
    if (!res.ok) return null;
    return await res.text();
  } catch(e) {
    return null;
  }
}
