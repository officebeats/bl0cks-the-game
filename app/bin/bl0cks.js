#!/usr/bin/env node

import { createInterface } from 'readline';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';
import { createGeminiAdapter } from '../lib/adapters/gemini.js';
import { createClaudeAdapter } from '../lib/adapters/claude.js';
import { createOpenAIAdapter } from '../lib/adapters/openai.js';
import { parseResponse } from '../lib/parser.js';
import {
  renderBoard, renderNarrative, renderWin, renderLoss,
  renderSplash, renderProviderSelect, renderMenu, renderHelp, A,
} from '../lib/renderer.js';
import { fetchPacks, installPack, fetchLeaderboard, submitScore } from '../lib/cloud.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..', '..');

// ── Config persistence ──────────────────────────────────────────
const CONFIG_DIR = join(homedir(), '.bl0cks');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

function loadConfig() {
  try {
    if (existsSync(CONFIG_FILE)) {
      return JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'));
    }
  } catch { /* fresh start */ }
  return {};
}

function saveConfig(config) {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

// ── Session persistence ─────────────────────────────────────────
const SAVE_FILE = join(CONFIG_DIR, 'save_game.json');

function loadSession() {
  try {
    if (existsSync(SAVE_FILE)) {
      return JSON.parse(readFileSync(SAVE_FILE, 'utf-8'));
    }
  } catch { /* ignored */ }
  return null;
}

function saveSession(adapterName, adapterState, levelPath) {
  mkdirSync(CONFIG_DIR, { recursive: true });
  const data = { timestamp: Date.now(), adapterName, levelPath, adapterState };
  writeFileSync(SAVE_FILE, JSON.stringify(data, null, 2));
}

// ── Terminal helpers ─────────────────────────────────────────────
const rl = createInterface({ input: process.stdin, output: process.stdout });
function ask(question) {
  return new Promise(resolve => rl.question(question, resolve));
}
function clear() {
  process.stdout.write('\x1b[2J\x1b[H');
}

// ── Game file loader ─────────────────────────────────────────────
function loadGameFile(relativePath) {
  const fullPath = join(ROOT, relativePath);
  if (!existsSync(fullPath)) {
    console.error(`${A.red}Missing game file: ${relativePath}${A.reset}`);
    process.exit(1);
  }
  return readFileSync(fullPath, 'utf-8');
}

// ── Provider definitions ─────────────────────────────────────────
const PROVIDERS = [
  { id: 'gemini',  name: 'Google Gemini',    tier: 'Platinum', color: A.blue,  keyHint: 'AIza...',    keyUrl: 'https://aistudio.google.com/app/apikey' },
  { id: 'claude',  name: 'Anthropic Claude', tier: 'Platinum', color: A.red,   keyHint: 'sk-ant-...', keyUrl: 'https://console.anthropic.com/settings/keys' },
  { id: 'openai',  name: 'OpenAI GPT',       tier: 'Platinum', color: A.green, keyHint: 'sk-...',     keyUrl: 'https://platform.openai.com/api-keys' },
];

// ── Provider selection ───────────────────────────────────────────
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
    console.log(`\n  ${A.red}Connection severed. No cypher provided. Exiting.${A.reset}`);
    process.exit(1);
  }

  if (!config.keys) config.keys = {};
  config.keys[provider.id] = key.trim();
  config.provider = provider.id;
  saveConfig(config);
  
  clear();
  console.log(`\n  ${A.green}✓${A.reset} Cypher encrypted and saved to ${A.dim}~/.bl0cks/config.json${A.reset}`);
  await new Promise(r => setTimeout(r, 800));
  return key.trim();
}

// ── Animated Menu ────────────────────────────────────────────────
async function showAnimatedMenu(title, options) {
  return new Promise((resolve) => {
    let focus = 0;
    let frame = 0;
    let timer;

    rl.pause();
    process.stdin.setRawMode(true);
    process.stdin.resume();

    const keyListener = (str, key) => {
      if (key && key.name === 'up') focus = (focus - 1 + options.length) % options.length;
      else if (key && key.name === 'down') focus = (focus + 1) % options.length;
      else if (key && key.name === 'return') {
         cleanup();
         resolve(options[focus].value);
      } else if (key && key.ctrl && key.name === 'c') {
         cleanup();
         process.exit(1);
      }
    };

    const cleanup = () => {
       clearInterval(timer);
       process.stdin.removeListener('keypress', keyListener);
       process.stdin.setRawMode(false);
       process.stdout.write('\x1b[?25h'); // show cursor
       rl.resume();
    };

    process.stdin.on('keypress', keyListener);
    process.stdout.write('\x1b[?25l'); // hide cursor
    clear();

    timer = setInterval(() => {
      process.stdout.write('\x1b[H');
      console.log(renderMenu(title, options, focus, frame));
      frame++;
    }, 70);
  });
}

async function showAnimatedPrompt(title, subtitle) {
  return new Promise((resolve) => {
    let input = '';
    let frame = 0;
    let timer;

    rl.pause();
    process.stdin.setRawMode(true);
    process.stdin.resume();

    const keyListener = (str, key) => {
      if (key && key.name === 'return') {
         cleanup();
         resolve(input);
      } else if (key && key.name === 'backspace') {
         input = input.slice(0, -1);
      } else if (key && key.ctrl && key.name === 'c') {
         cleanup();
         process.exit(1);
      } else if (str) {
         const charCode = str.charCodeAt(0);
         if (charCode >= 32 && charCode <= 126) {
           input += str;
         }
      }
    };

    const cleanup = () => {
       clearInterval(timer);
       process.stdin.removeListener('keypress', keyListener);
       process.stdin.setRawMode(false);
       process.stdout.write('\x1b[?25h'); // show cursor
       rl.resume();
    };

    process.stdin.on('keypress', keyListener);
    process.stdout.write('\x1b[?25l'); // hide cursor
    clear();

    timer = setInterval(() => {
      process.stdout.write('\x1b[H');
      // We pass 1 as focusIdx so the second line (the input) gets the highlight arrow
      const options = [
        { label: subtitle, value: null },
        { label: (input || '') + '█', value: null } // Blinking cursor or solid block
      ];
      console.log(renderMenu(title, options, 1, frame));
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

// ── Build system prompt with JSON output instructions ────────────
function buildSystemPrompt() {
  const systemPrompt = loadGameFile('SYSTEM_PROMPT.md');
  const territories = loadGameFile('world/territories.md');
  const factions = loadGameFile('world/factions.md');

  // Wrap original prompt with CLI-specific JSON output instruction
  const jsonDirective = `
## CRITICAL: Machine-Readable Output

You are being accessed through a CLI game client. Along with your narrative text output, you MUST also output a JSON block at the END of every response. This JSON block allows the client to render the game board visually.

Wrap the JSON in a code fence like this:

\`\`\`json
{
  "level_number": 1,
  "level_name": "The Corner",
  "clock": { "current": 0, "total": 12, "status": "CALM" },
  "territories": [
    { "name": "Woodlawn", "control": "you", "faction": "Governors", "intersection": "63rd & King" },
    { "name": "Englewood", "control": "rival", "faction": "Lords", "intersection": "69th & Halsted" },
    { "name": "Auburn Gresham", "control": "contested", "faction": "", "intersection": "79th & Halsted" },
    { "name": "Chatham", "control": "contested", "faction": "", "intersection": "79th & Cottage" },
    { "name": "Hyde Park", "control": "neutral", "faction": "", "intersection": "53rd & Harper" },
    { "name": "Roseland", "control": "rival", "faction": "Stones", "intersection": "111th & State" }
  ],
  "scanner": "All quiet on the South Side... for now.",
  "event": { "name": "POWER VACUUM", "description": "The Governors just lost their top lieutenant..." },
  "hand": [
    { "type": "people", "name": "Darius Webb", "role": "Broker", "block": "Woodlawn", "loyalty": 8, "faction": "Governors" },
    { "type": "people", "name": "Marcus Cole", "role": "Enforcer", "block": "Woodlawn", "loyalty": 5, "faction": "Governors" },
    { "type": "people", "name": "Tanya Rivers", "role": "Informant", "block": "A. Gresham", "loyalty": 7, "faction": "Governors" },
    { "type": "move", "name": "TAX", "description": "Collect from a controlled block" },
    { "type": "move", "name": "WAR", "description": "Challenge a rival block" }
  ],
  "intel": 2,
  "choice": null,
  "outcome": null
}
\`\`\`

RULES FOR THE JSON:
- "control" values: "you", "rival", "contested", "neutral"
- "hand" must always include ALL cards the player currently holds
- When a choice is pending, set "choice": { "description": "...", "optionA": "...", "optionB": "..." }
- When the player wins set "outcome": "win", when they lose set "outcome": "loss"
- Always include the JSON block even on follow-up turns
- The JSON must reflect the CURRENT game state AFTER resolving the player's action
`;

  return `${systemPrompt}\n\n${jsonDirective}\n\n---\n\n${territories}\n\n---\n\n${factions}`;
}

function loadLevel(pathOrId) {
  if (pathOrId === '0' || pathOrId === 0) {
    return loadGameFile('levels/level_00_tutorial.md');
  }
  if (pathOrId === '1' || pathOrId === 1) {
    return loadGameFile('levels/level_01_the_corner.md');
  }
  if (pathOrId === '2' || pathOrId === 2) {
    return loadGameFile('levels/level_02_the_wire.md');
  }

  const fullPath = resolve(process.cwd(), String(pathOrId));
  if (!existsSync(fullPath)) {
    console.log(`  ${A.red}Cannot find level cartridge at: ${fullPath}${A.reset}`);
    return null;
  }
  return readFileSync(fullPath, 'utf-8');
}

// ── Create AI adapter ────────────────────────────────────────────
function createAdapter(providerId, apiKey) {
  switch (providerId) {
    case 'gemini':  return createGeminiAdapter(apiKey);
    case 'claude':  return createClaudeAdapter(apiKey);
    case 'openai':  return createOpenAIAdapter(apiKey);
    default:
      console.error(`${A.red}Unknown provider: ${providerId}${A.reset}`);
      process.exit(1);
  }
}

// ── Process AI response and render ───────────────────────────────
function displayResponse(text) {
  const state = parseResponse(text);

  if (state.type === 'board') {
    // Check for win/loss
    if (state.outcome === 'win') {
      console.log(renderWin(state.event?.description || ''));
      return state;
    }
    if (state.outcome === 'loss') {
      console.log(renderLoss(state.event?.description || ''));
      return state;
    }

    // Render the game board — it already shows everything
    clear();
    console.log(renderBoard(state));
    return state;
  }

  // Narrative-only response (no JSON parsed)
  console.log(renderNarrative(state.raw));
  return state;
}

// ── Help screen ──────────────────────────────────────────────────
function showHelp() {
  console.log(renderHelp());
}

// ── Game loop ────────────────────────────────────────────────────
async function gameLoop(adapter, levelPath, resumeSession = null) {
  const systemPrompt = buildSystemPrompt();

  let levelContent;
  if (!resumeSession) {
    levelContent = loadLevel(levelPath);
    if (!levelContent) process.exit(1);
  }

  clear();
  console.log(`\n  ${A.gray}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${A.reset}`);
  let bootName = levelPath;
  if (levelPath === '0' || levelPath === 0) bootName = 'Level 0: The Wiretap (Tutorial)';
  if (levelPath === '1' || levelPath === 1) bootName = 'Level 1: The Corner';
  if (levelPath === '2' || levelPath === 2) bootName = 'Level 2: The Wire';
  console.log(`  ${A.gold}${A.bold}Booting BL0CKS Cartridge: ${bootName}${A.reset}`);
  console.log(`  ${A.dim}Connecting to ${adapter.name}...${A.reset}`);
  console.log(`  ${A.gray}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${A.reset}\n`);

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
    console.error(`\n  ${A.red}${A.bold}Neural Link Severed:${A.reset} ${A.red}${err.message}${A.reset}`);
    if (err.message.includes('401') || err.message.includes('403') || err.message.includes('invalid')) {
      console.log(`  ${A.red}[!] The intel was bad. Your authorization cypher was rejected.${A.reset}`);
      console.log(`  ${A.gray}Clear your saved cypher in Settings or check your provider dashboard.${A.reset}\n`);
    } else {
      console.log(`  ${A.gray}Check your connection or API provider status.${A.reset}\n`);
    }
    process.exit(1);
  }

  // Main input loop
  while (true) {
    const input = await ask(`\n  ${A.gold}▸${A.reset} `);
    const trimmed = input.trim().toLowerCase();

    if (trimmed === 'quit' || trimmed === 'exit' || trimmed === 'q') {
      console.log(`\n  ${A.gray}${A.italic}The block remembers.${A.reset}\n`);
      break;
    }
    if (trimmed === 'help' || trimmed === '?') {
      showHelp();
      continue;
    }
    if (!trimmed) continue;

    try {
      process.stdout.write(`\n  ${A.dim}⠋ The block is thinking...${A.reset}`);
      const response = await adapter.send(input);
      process.stdout.write('\r\x1b[K');
      const state = displayResponse(response);
      saveSession(adapter.name, adapter.exportState(), levelPath);

      // Check for game end
      if (state.outcome === 'win' || state.outcome === 'loss') {
        if (state.outcome === 'win') {
          // Calculate score
          const tTicks = state.clock?.total || 12;
          const cTicks = state.clock?.current || 0;
          const ticks = Math.max(0, tTicks - cTicks);
          const territories = (state.territories || []).filter(t => t.control === 'you').length;
          const peopleCards = (state.hand || []).filter(c => c.type === 'people');
          const loyAvg = peopleCards.reduce((acc, c) => acc + (c.loyalty && c.loyalty !== '?' ? c.loyalty : 0), 0) / Math.max(1, peopleCards.length);
          const totalScore = (ticks * 1000) + (territories * 2000) + (loyAvg * 500);
          
          console.log(`\n  ${A.gold}★ FINAL SCORE: ${Math.round(totalScore)} ★${A.reset}`);
          const alias = await ask(`  ${A.green}Enter your tag for the streets (Leaderboard):${A.reset} `);
          if (alias.trim()) {
            await submitScore(levelPath, alias.trim(), {
              levelName: state.levelName,
              total: Math.round(totalScore),
              ticks, territories, loyalty: loyAvg
            });
            console.log(`  ${A.dim}Score submitted to the underground.${A.reset}`);
          }
        }
        console.log(`\n  ${A.dim}Press Enter to exit.${A.reset}`);
        await ask('');
        break;
      }
    } catch (err) {
      process.stdout.write('\r\x1b[K');
      console.error(`  ${A.red}Error: ${err.message}${A.reset}`);
    }
  }

  rl.close();
  process.exit(0);
}

// ── Main ─────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  let levelPath = '0';

  // ── Process Core Cloud Commands ──
  if (args.length > 0) {
    if (args[0] === 'cloud' && args[1] === 'login') {
      const tempConfig = loadConfig();
      console.log(`\n  ${A.gold}🔌 Accessing Supabase Backend${A.reset}\n`);
      console.log(`  ${A.dim}Create a free project at supabase.com to get these keys.${A.reset}`);
      const url = await ask(`  ${A.green}Supabase URL:${A.reset} `);
      const key = await ask(`  ${A.green}Supabase Anon Key:${A.reset} `);
      
      if (url.trim() && key.trim()) {
        tempConfig.supabaseUrl = url.trim();
        tempConfig.supabaseKey = key.trim();
        saveConfig(tempConfig);
        console.log(`\n  ${A.green}✓${A.reset} Cloud configuration saved to ${A.dim}~/.bl0cks/config.json${A.reset}\n`);
      } else {
        console.log(`\n  ${A.red}Login aborted.${A.reset}\n`);
      }
      process.exit(0);
    }
    
    if (args[0] === 'market' && args[1] === 'browse') {
      console.log(`\n  ${A.gold}🔌 Accessing The Streets (Marketplace)...${A.reset}\n`);
      const packs = await fetchPacks();
      for (const p of packs) {
        console.log(`  ${A.green}• ${A.bold}${p.pack_id}${A.reset}`);
        console.log(`    ${A.white}${p.title}${A.reset} ${A.dim}by @${p.author}${A.reset}`);
        console.log(`    ${A.gray}${p.description}${A.reset}`);
        console.log(`    ${A.dim}↓ ${p.downloads} downloads${A.reset}\n`);
      }
      console.log(`  ${A.dim}Type \`bl0cks market install <pack_id>\` to download.${A.reset}\n`);
      process.exit(0);
    }
    
    if (args[0] === 'market' && args[1] === 'install') {
      const targetPack = args[2];
      if (!targetPack) {
        console.log(`  ${A.red}Please specify a pack_id to install.${A.reset}`);
        process.exit(1);
      }
      console.log(`\n  ${A.gold}🔌 Downloading ${targetPack}...${A.reset}`);
      const dest = await installPack(targetPack);
      console.log(`  ${A.green}✓ Installed to ${dest}${A.reset}`);
      console.log(`  ${A.dim}Type \`bl0cks play ${dest}\` to start.${A.reset}\n`);
      process.exit(0);
    }

    if (args[0] === 'leaderboard') {
      const targetPack = args[1] || 'base-chicago';
      console.log(`\n  ${A.gold}🏆 THE WIRE: Global Rankings for ${targetPack}${A.reset}\n`);
      const board = await fetchLeaderboard(targetPack);
      let rank = 1;
      for (const score of board) {
        console.log(`  ${A.dim}${rank}.${A.reset} ${A.bold}${score.player_alias}${A.reset} — ${A.green}${score.score_total}${A.reset} ${A.dim}(T:${score.territories_held}  Date:${new Date(score.run_date).toLocaleDateString()})${A.reset}`);
        rank++;
      }
      console.log('');
      process.exit(0);
    }

    // Otherwise treat as a game execution command
    if (args[0] === 'play' && args[1]) {
      levelPath = args[1];
    } else if (args[0] !== 'play') {
      levelPath = args[0];
    }
  }

  // ── Regular Game Flow ──
  clear();
  // ── Variable Typographic Slash Animation ──
  for (let f = 0; f < 70; f++) {
    // Reset cursor to top to avoid flicker
    process.stdout.write('\x1b[H');
    console.log(renderSplash(f));
    await new Promise(r => setTimeout(r, 70));
  }
  let config = loadConfig();

  // ── Main Menu Loop ──
  let provider;
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

    if (menuSelection === "quit") {
       console.log(`\n  ${A.gray}The block remembers.${A.reset}`);
       process.exit(0);
    } 
    
    if (menuSelection === "resume") {
       const session = loadSession();
       if (!session || !session.adapterState) {
          console.log(`\n  ${A.red}No saved session found in your stash.${A.reset}`);
          await ask(`  ${A.dim}Press Enter to return.${A.reset}`);
          continue;
       }
       if (session.adapterName !== currentProv) {
          console.log(`\n  ${A.gold}Warning:${A.reset} This run was saved using ${session.adapterName}. Proceeding with ${currentProv} may crash the neural link.`);
          const force = await ask(`  ${A.dim}Force load anyway? (y/N) ${A.reset}`);
          if (force.trim().toLowerCase() !== 'y') continue;
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
  }

  if (config.provider) {
    provider = PROVIDERS.find(p => p.id === config.provider);
  }
  if (!provider) {
    provider = await selectProvider(config);
  }

  const apiKey = await getApiKey(provider, config);
  const adapter = createAdapter(provider.id, apiKey);

  console.log(`\n  ${A.green}✓${A.reset} ${A.bold}${provider.name}${A.reset} connected · ${A.dim}${provider.tier} tier${A.reset}`);

  if (levelPath === '0') {
    await runTutorial();
    levelPath = '1'; // Drop into Level 1 after tutorial completes
  }

  await gameLoop(adapter, levelPath, resumeSessionPayload);
}

main().catch(err => {
  console.error(`\n${A.red}Fatal: ${err.message}${A.reset}`);
  process.exit(1);
});
