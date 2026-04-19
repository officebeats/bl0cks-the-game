/**
 * BL0CKS CLI — Input Handler
 * 
 * Raw-mode keyboard input handler for terminal interactions.
 * Provides animated menu, animated prompt, and simple ask() utilities.
 */

import { createInterface } from 'readline';
import { A } from './renderer.js';

// ── Shared readline interface ────────────────────────────────────
let _rl = null;

export function getRL() {
  if (!_rl) {
    _rl = createInterface({ input: process.stdin, output: process.stdout });
  }
  return _rl;
}

export function closeRL() {
  _rl?.close();
  _rl = null;
}

/**
 * Simple line-based prompt.
 * @param {string} question
 * @returns {Promise<string>}
 */
export function ask(question) {
  return new Promise(resolve => getRL().question(question, resolve));
}

/**
 * Clear the terminal screen.
 */
export function clear() {
  process.stdout.write('\x1b[2J\x1b[H');
}

/**
 * Show an animated keyboard-navigated menu.
 * @param {string} title - Menu title
 * @param {object[]} options - Array of { label, value }
 * @param {function} renderFn - Menu render function (title, options, focus, frame) => string
 * @returns {Promise<any>} Selected option's value
 */
export async function showAnimatedMenu(title, options, renderFn) {
  return new Promise((resolve) => {
    let focus = 0;
    let frame = 0;
    let timer;

    const rl = getRL();
    rl.pause();
    process.stdin.setRawMode(true);
    process.stdin.resume();

    const keyListener = (str, key) => {
      if (key && key.name === 'up') focus = (focus - 1 + options.length) % options.length;
      else if (key && key.name === 'down') focus = (focus + 1) % options.length;
      else if (key && key.name === 'return') { cleanup(); resolve(options[focus].value); }
      else if (key && key.ctrl && key.name === 'c') { cleanup(); process.exit(1); }
    };

    const cleanup = () => {
      clearInterval(timer);
      process.stdin.removeListener('keypress', keyListener);
      process.stdin.setRawMode(false);
      process.stdout.write('\x1b[?25h');
      rl.resume();
    };

    process.stdin.on('keypress', keyListener);
    process.stdout.write('\x1b[?25l');
    clear();

    timer = setInterval(() => {
      process.stdout.write('\x1b[H');
      console.log(renderFn(title, options, focus, frame));
      frame++;
    }, 70);
  });
}

/**
 * Show an animated text input prompt.
 * @param {string} title - Prompt title
 * @param {string} subtitle - Instruction text
 * @param {function} renderFn - Menu render function
 * @returns {Promise<string>} User input
 */
export async function showAnimatedPrompt(title, subtitle, renderFn) {
  return new Promise((resolve) => {
    let input = '';
    let frame = 0;
    let timer;

    const rl = getRL();
    rl.pause();
    process.stdin.setRawMode(true);
    process.stdin.resume();

    const keyListener = (str, key) => {
      if (key && key.name === 'return') { cleanup(); resolve(input); }
      else if (key && key.name === 'backspace') { input = input.slice(0, -1); }
      else if (key && key.ctrl && key.name === 'c') { cleanup(); process.exit(1); }
      else if (str) {
        const charCode = str.charCodeAt(0);
        if (charCode >= 32 && charCode <= 126) input += str;
      }
    };

    const cleanup = () => {
      clearInterval(timer);
      process.stdin.removeListener('keypress', keyListener);
      process.stdin.setRawMode(false);
      process.stdout.write('\x1b[?25h');
      rl.resume();
    };

    process.stdin.on('keypress', keyListener);
    process.stdout.write('\x1b[?25l');
    clear();

    timer = setInterval(() => {
      process.stdout.write('\x1b[H');
      const options = [
        { label: subtitle, value: null },
        { label: (input || '') + '█', value: null }
      ];
      console.log(renderFn(title, options, 1, frame));
      frame++;
    }, 70);
  });
}

/**
 * Non-blocking key listener for the Real-Time Battle Loop.
 * @param {function} onKey - Callback (keyName, char) => void
 */
export function listenForKeys(onKey) {
  process.stdin.setRawMode(true);
  process.stdin.setEncoding('utf8');
  process.stdin.resume();

  const listener = (str, key) => {
    // Standard cleanup handler
    if (key && key.ctrl && key.name === 'c') {
      process.stdin.setRawMode(false);
      process.exit();
    }
    onKey(key?.name, str);
  };

  process.stdin.on('keypress', listener);

  return () => {
    process.stdin.removeListener('keypress', listener);
    process.stdin.setRawMode(false);
  };
}
