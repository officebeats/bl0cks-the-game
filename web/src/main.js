import { term, initIO, ask, clear, write, processEmu, loadConfig, saveConfig, loadSession, saveSession, loadGameFileAsync } from './io.js';

// We import the unmodified parsers, adapters, and renderer strings!
// Note: Vite will bundle these automatically.
import { createGeminiAdapter } from './lib/adapters/gemini.js';
import { createClaudeAdapter } from './lib/adapters/claude.js';
import { createOpenAIAdapter } from './lib/adapters/openai.js';
import { parseResponse } from './lib/parser.js';
import {
  renderBoard, renderNarrative, renderWin, renderLoss,
  renderSplash, renderProviderSelect, renderMenu, renderHelp, A,
} from './lib/renderer.js';

// Setup IO
initIO();

// Process emulation for renderer components that expect process.stdout
const process = processEmu;

// ── Provider definitions ─────────────────────────────────────────
const PROVIDERS = [
  { id: 'gemini',  name: 'Google Gemini',    tier: 'Platinum', color: A.blue,  keyHint: 'AIza...',    keyUrl: 'https://aistudio.google.com/app/apikey' },
  { id: 'claude',  name: 'Anthropic Claude', tier: 'Platinum', color: A.red,   keyHint: 'sk-ant-...', keyUrl: 'https://console.anthropic.com/settings/keys' },
  { id: 'openai',  name: 'OpenAI GPT',       tier: 'Platinum', color: A.green, keyHint: 'sk-...',     keyUrl: 'https://platform.openai.com/api-keys' },
];

async function selectProvider(config) {
  const options = PROVIDERS.map((p) => {
    const isSaved = config.provider === p.id ? ' [Saved]' : '';
    return { label: `${p.name}${isSaved}`, value: p };
  });

  const selected = await showAnimatedMenu("ESTABLISH NEURAL LINK", options);
  return selected;
}

async function getApiKey(provider, config) {
  if (config.keys?.[provider.id]) {
    const reuseOptions = [
      { label: `Boot with saved cypher? (Y/n) - Yes`, value: true },
      { label: `Enter new cypher`, value: false }
    ];
    const reuse = await showAnimatedMenu("ESTABLISH NEURAL LINK", reuseOptions);
    if (reuse) {
      return config.keys[provider.id];
    }
  }

  const subtitle = `Get Cypher: ${provider.keyUrl}\n  Format: ${provider.keyHint}\n\n  Paste Your Cypher:`;
  const key = await showAnimatedPrompt("ESTABLISH NEURAL LINK", subtitle);
  
  if (!key.trim()) {
    clear();
    write(`\r\n  ${A.red}Connection severed. No cypher provided. Exiting.${A.reset}\r\n`);
    throw new Error('Exit');
  }

  if (!config.keys) config.keys = {};
  config.keys[provider.id] = key.trim();
  config.provider = provider.id;
  saveConfig(config);
  
  clear();
  write(`\r\n  ${A.green}\u2713${A.reset} Cypher encrypted and saved to Secure Storage.\r\n`);
  await new Promise(r => setTimeout(r, 800));
  return key.trim();
}

async function showAnimatedMenu(title, options) {
  return new Promise((resolve) => {
    let focus = 0;
    let frame = 0;
    let timer;

    process.stdin.setRawMode(true);

    const keyListener = (str, key) => {
      if (key && key.name === 'up') focus = (focus - 1 + options.length) % options.length;
      else if (key && key.name === 'down') focus = (focus + 1) % options.length;
      else if (key && key.name === 'return') {
         cleanup();
         resolve(options[focus].value);
      }
    };

    const cleanup = () => {
       clearInterval(timer);
       process.stdin.removeListener('keypress', keyListener);
       process.stdin.setRawMode(false);
    };

    process.stdin.on('keypress', keyListener);
    clear();

    timer = setInterval(() => {
      write('\x1b[H');
      write(renderMenu(title, options, focus, frame) + '\r\n');
      frame++;
    }, 70);
  });
}

async function showAnimatedPrompt(title, subtitle) {
  return new Promise((resolve) => {
    let input = '';
    let frame = 0;
    let timer;

    process.stdin.setRawMode(true);

    const keyListener = (str, key) => {
      if (key && key.name === 'return') {
         cleanup();
         resolve(input);
      } else if (key && key.name === 'backspace') {
         input = input.slice(0, -1);
      } else if (str) {
         // handle visible chars only realistically
         if (str.length === 1 && str !== '\r' && str !== '\n') {
           input += str;
         }
      }
    };

    const cleanup = () => {
       clearInterval(timer);
       process.stdin.removeListener('keypress', keyListener);
       process.stdin.setRawMode(false);
    };

    process.stdin.on('keypress', keyListener);
    clear();

    timer = setInterval(() => {
      write('\x1b[H');
      const options = [
        { label: subtitle, value: null },
        { label: (input || '') + '\u2588', value: null } 
      ];
      write(renderMenu(title, options, 1, frame) + '\r\n');
      frame++;
    }, 70);
  });
}

async function runTutorial() {
  await showAnimatedPrompt("NEURAL LINK: WIRETAP (TUTORIAL)", "Connection secured to the South Side.\nThe Lords in Englewood are getting bold, but nothing is moving.\nThis is a safe block to learn the ropes.\n\nPress Enter to begin:");
  while (true) {
    const res = await showAnimatedPrompt("NEURAL LINK: WIRETAP", "First, you need to know who you're dealing with.\nDarius Webb is your Broker, but what is his true motive?\n\nType 'INTEL Darius' to inspect your asset:");
    if (res.toLowerCase().trim() === 'intel darius') break;
  }
  await showAnimatedPrompt("NEURAL LINK: WIRETAP", ">> INTEL ACQUIRED <<\nDARIUS WEBB [Broker]\nVisible Loyalty: 8/10\nHidden Motive: Terrified of the Lords. Will sell you out if they attack.\n\nPress Enter to continue:");
  while (true) {
    const res = await showAnimatedPrompt("NEURAL LINK: WIRETAP", "Good. Now let's grab some resources.\nYou have 2 action cards in your hand: [1] TAX and [2] WAR.\n\nType '1' to play the TAX card:");
    if (res.trim() === '1') break;
  }
  while (true) {
    const res = await showAnimatedPrompt("NEURAL LINK: WIRETAP", "TAX Card Played.\nWho do you want to send on the run?\n\nType 'Darius' to select him:");
    if (res.toLowerCase().trim() === 'darius') break;
  }
  await showAnimatedPrompt("NEURAL LINK: WIRETAP", ">> TAX COLLECTED <<\nDarius collected resources from Woodlawn.\nYour operation is funded.\n\nPress Enter to continue:");
  while (true) {
    const res = await showAnimatedPrompt("NEURAL LINK: WIRETAP", "Time to send a message.\n\nType '2' to play the WAR card:");
    if (res.trim() === '2') break;
  }
  while (true) {
    const res = await showAnimatedPrompt("NEURAL LINK: WIRETAP", "WAR Card Played.\nWhich block are you targeting?\n\nType 'Englewood' to attack the Lords:");
    if (res.toLowerCase().trim() === 'englewood') break;
  }
  await showAnimatedPrompt("NEURAL LINK: WIRETAP", ">> WAR DECLARED <<\nEnglewood is yours. The Lords are falling back.\nTutorial Complete. You are ready for the streets.\n\nPress Enter to boot Level 1:");
}

async function buildSystemPrompt() {
  const prompt = await loadGameFileAsync('SYSTEM_PROMPT.md');
  const territories = await loadGameFileAsync('world/territories.md');
  const factions = await loadGameFileAsync('world/factions.md');
  
  const jsonDirective = `
## CRITICAL: Machine-Readable Output

You are being accessed through a CLI game client. Along with your narrative text output, you MUST also output a JSON block at the END of every response. This JSON block allows the client to render the game board visually.

Wrap the JSON in a code fence like this:

\`\`\`json
{
  "level_number": 1,
  "level_name": "The Corner",
  ... (standard object details)
}
\`\`\`
`;
  return `${prompt}\n\n${jsonDirective}\n\n---\n\n${territories}\n\n---\n\n${factions}`;
}

function createAdapter(providerId, apiKey) {
  switch (providerId) {
    case 'gemini':  return createGeminiAdapter(apiKey);
    case 'claude':  return createClaudeAdapter(apiKey);
    case 'openai':  return createOpenAIAdapter(apiKey);
    default: throw new Error(`Unknown provider: ${providerId}`);
  }
}

function displayResponse(text) {
  const state = parseResponse(text);
  if (state.type === 'board') {
    if (state.outcome === 'win') {
      write(renderWin(state.event?.description || '') + '\r\n');
      return state;
    }
    if (state.outcome === 'loss') {
      write(renderLoss(state.event?.description || '') + '\r\n');
      return state;
    }
    clear();
    write(renderBoard(state) + '\r\n');
    return state;
  }
  write(renderNarrative(state.raw) + '\r\n');
  return state;
}

async function gameLoop(adapter, levelPath, resumeSession = null) {
  const systemPrompt = await buildSystemPrompt();
  
  let levelContent;
  if (!resumeSession) {
    const lPath = levelPath === '1' ? 'levels/level_01_the_corner.md' : 'levels/level_02_the_wire.md';
    levelContent = await loadGameFileAsync(lPath);
  }

  clear();
  write(`\r\n  ${A.gray}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${A.reset}\r\n`);
  write(`  ${A.gold}${A.bold}Booting BL0CKS Cartridge: Level ${levelPath}${A.reset}\r\n`);
  write(`  ${A.gray}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${A.reset}\r\n\r\n`);

  try {
    let initialResponse;
    if (resumeSession) {
      initialResponse = adapter.resume(resumeSession.adapterState);
    } else {
      initialResponse = await adapter.start(systemPrompt, levelContent);
    }
    displayResponse(initialResponse);
    saveSession(adapter.name, adapter.exportState(), levelPath);
  } catch (err) {
    write(`\r\n  ${A.red}${A.bold}Neural Link Severed:${A.reset} ${A.red}${err.message}${A.reset}\r\n`);
    throw new Error('Exit');
  }

  while (true) {
    const input = await ask(`\r\n  ${A.gold}\u25b8${A.reset} `);
    const trimmed = input.trim().toLowerCase();
    
    if (trimmed === 'quit' || trimmed === 'q') return;
    if (trimmed === 'help') {
      write(renderHelp() + '\r\n');
      continue;
    }
    if (!trimmed) continue;

    try {
      write(`\r\n  ${A.dim}⠋ The block is thinking...${A.reset}\r\n`);
      const response = await adapter.send(input);
      const state = displayResponse(response);
      saveSession(adapter.name, adapter.exportState(), levelPath);

      if (state.outcome === 'win' || state.outcome === 'loss') {
        const alias = await ask(`  ${A.green}Enter your tag for the streets:${A.reset} `);
        write(`  ${A.dim}Score submitted loosely to local storage.${A.reset}\r\n`);
        await ask('');
        break;
      }
    } catch (err) {
      write(`  ${A.red}Error: ${err.message}${A.reset}\r\n`);
    }
  }
}

async function main() {
  clear();
  for (let f = 0; f < 30; f++) {
    write('\x1b[H');
    write(renderSplash(f) + '\r\n');
    await new Promise(r => setTimeout(r, 70));
  }
  
  let config = loadConfig();
  let levelPath = '0';
  let resumeSessionPayload = null;

  while (true) {
    config = loadConfig();
    const currentProv = config.provider ? PROVIDERS.find(p => p.id === config.provider)?.name || 'None' : 'None';
    
    const menuSelection = await showAnimatedMenu("MAIN MENU", [
       { label: "New Run (Tutorial)", value: "new" },
       { label: "Resume Past Session", value: "resume" },
       { label: `Settings (Current AI: ${currentProv})`, value: "settings" },
       { label: "Quit", value: "quit" }
    ]);

    if (menuSelection === "resume") {
       const session = loadSession();
       if (!session || !session.adapterState) {
          await ask(`\r\n  ${A.red}No saved session found.\r\n  Press Enter to return.${A.reset}`);
          continue;
       }
       resumeSessionPayload = session;
       levelPath = session.levelPath;
       break;
    }

    if (menuSelection === "settings") {
       clear();
       const newProv = await selectProvider(config);
       await getApiKey(newProv, config);
       continue;
    }

    if (menuSelection === "new") {
       levelPath = '0';
       break;
    }
    
    if (menuSelection === "quit") return;
  }

  let provider = PROVIDERS.find(p => p.id === config.provider);
  if (!provider) provider = await selectProvider(config);

  const apiKey = await getApiKey(provider, config);
  const adapter = createAdapter(provider.id, apiKey);

  if (levelPath === '0') {
    await runTutorial();
    levelPath = '1'; 
  }

  await gameLoop(adapter, levelPath, resumeSessionPayload);
}

main().catch(err => {
  if (err.message !== 'Exit') {
    write(`\r\n${A.red}Fatal: ${err.message}${A.reset}\r\n`);
  }
});
