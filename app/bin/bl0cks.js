#!/usr/bin/env node

import { createInterface } from 'readline';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';
import { createGeminiAdapter } from '../lib/adapters/gemini.js';
import { createClaudeAdapter } from '../lib/adapters/claude.js';
import { createOpenAIAdapter } from '../lib/adapters/openai.js';
import { parseResponse } from '../lib/parser.js';
import {
  renderBoard, renderNarrative, renderWin, renderLoss,
  renderSplash, renderProviderSelect, A,
} from '../lib/renderer.js';

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
  console.log(renderProviderSelect(PROVIDERS, config.provider));

  let choice;
  while (true) {
    const input = await ask(`  ${A.gold}▸${A.reset} Select provider (1-${PROVIDERS.length}): `);
    choice = parseInt(input, 10);
    if (choice >= 1 && choice <= PROVIDERS.length) break;
    console.log(`  ${A.red}Invalid choice.${A.reset}`);
  }
  return PROVIDERS[choice - 1];
}

async function getApiKey(provider, config) {
  if (config.keys?.[provider.id]) {
    console.log(`\n  ${A.green}✓${A.reset} Found saved API key for ${provider.name}`);
    const reuse = await ask(`  ${A.gold}▸${A.reset} Use saved key? (Y/n): `);
    if (reuse.toLowerCase() !== 'n') {
      return config.keys[provider.id];
    }
  }

  console.log(`\n  ${A.gray}Get your key at: ${A.white}${provider.keyUrl}${A.reset}`);
  console.log(`  ${A.gray}Format: ${provider.keyHint}${A.reset}\n`);

  const key = await ask(`  ${A.gold}▸${A.reset} Paste your API key: `);
  if (!key.trim()) {
    console.log(`  ${A.red}No key provided. Exiting.${A.reset}`);
    process.exit(1);
  }

  if (!config.keys) config.keys = {};
  config.keys[provider.id] = key.trim();
  config.provider = provider.id;
  saveConfig(config);
  console.log(`  ${A.green}✓${A.reset} Key saved to ${A.dim}~/.bl0cks/config.json${A.reset}`);

  return key.trim();
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

function loadLevel(levelNum) {
  const levelFiles = { 1: 'levels/level_01_the_corner.md' };
  const file = levelFiles[levelNum];
  if (!file) {
    console.log(`  ${A.red}Level ${levelNum} not available yet.${A.reset}`);
    return null;
  }
  return loadGameFile(file);
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

    // Render the game board
    clear();
    console.log(renderBoard(state));

    // Show narrative text if it's interesting (not just the JSON)
    const narrative = text.replace(/```json[\s\S]*?```/g, '').trim();
    // Only show narrative if it has substantial content beyond the board format
    const narrativeLines = narrative.split('\n').filter(l =>
      l.trim() &&
      !l.includes('━') &&
      !l.match(/^[●○◐◇]/) &&
      !l.match(/^\d+\./) &&
      !l.match(/BL0CKS/) &&
      !l.match(/Clock:/) &&
      !l.match(/TERRITORY/) &&
      !l.match(/YOUR HAND/) &&
      !l.match(/Intel Cards/) &&
      !l.match(/What do you play/)
    );

    if (narrativeLines.length > 2) {
      const narrativeText = narrativeLines.join('\n').trim();
      if (narrativeText.length > 50) {
        console.log(renderNarrative(narrativeText));
      }
    }

    return state;
  }

  // Narrative-only response
  console.log(renderNarrative(state.raw));
  return state;
}

// ── Help screen ──────────────────────────────────────────────────
function showHelp() {
  const iW = 78;
  console.log(`
${A.gray}╔${'═'.repeat(iW)}╗${A.reset}
${A.gray}║${A.reset}  ${A.bold}${A.white}BL0CKS — Commands${A.reset}${' '.repeat(iW - 21)}${A.gray}║${A.reset}
${A.gray}╠${'═'.repeat(iW)}╣${A.reset}
${A.gray}║${A.reset}  ${A.gold}1-5${A.reset}              Play a card from your hand${' '.repeat(iW - 46)}${A.gray}║${A.reset}
${A.gray}║${A.reset}  ${A.gold}A${A.reset} or ${A.gold}B${A.reset}           Make a choice when prompted${' '.repeat(iW - 48)}${A.gray}║${A.reset}
${A.gray}║${A.reset}  ${A.gold}INTEL [Name]${A.reset}     Reveal a character's hidden stats${' '.repeat(iW - 51)}${A.gray}║${A.reset}
${A.gray}║${A.reset}  ${A.gold}help${A.reset}             Show this help screen${' '.repeat(iW - 41)}${A.gray}║${A.reset}
${A.gray}║${A.reset}  ${A.gold}quit${A.reset}             Exit the game${' '.repeat(iW - 34)}${A.gray}║${A.reset}
${A.gray}║${A.reset}${' '.repeat(iW)}${A.gray}║${A.reset}
${A.gray}║${A.reset}  ${A.dim}The AI is the game engine. You can also type${' '.repeat(iW - 47)}${A.gray}║${A.reset}
${A.gray}║${A.reset}  ${A.dim}naturally — it understands strategy and threats.${' '.repeat(iW - 50)}${A.gray}║${A.reset}
${A.gray}╚${'═'.repeat(iW)}╝${A.reset}
`);
}

// ── Game loop ────────────────────────────────────────────────────
async function gameLoop(adapter) {
  const systemPrompt = buildSystemPrompt();
  const levelContent = loadLevel(1);
  if (!levelContent) process.exit(1);

  clear();
  console.log(`\n  ${A.gray}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${A.reset}`);
  console.log(`  ${A.gold}${A.bold}Loading Level 1: The Corner${A.reset}`);
  console.log(`  ${A.dim}Connecting to ${adapter.name}...${A.reset}`);
  console.log(`  ${A.gray}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${A.reset}\n`);

  try {
    const initialResponse = await adapter.start(systemPrompt, levelContent);
    displayResponse(initialResponse);
  } catch (err) {
    console.error(`\n  ${A.red}${A.bold}Connection failed:${A.reset} ${A.red}${err.message}${A.reset}`);
    if (err.message.includes('401') || err.message.includes('403') || err.message.includes('invalid')) {
      console.log(`  ${A.gray}Check that your API key is correct.${A.reset}`);
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

      // Check for game end
      if (state.outcome === 'win' || state.outcome === 'loss') {
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
  const config = loadConfig();

  clear();
  console.log(renderSplash());

  // Quick-start if provider is saved
  let provider;
  if (config.provider) {
    provider = PROVIDERS.find(p => p.id === config.provider);
    if (provider) {
      console.log(`  ${A.green}✓${A.reset} Last session: ${A.bold}${provider.name}${A.reset}`);
      const reuse = await ask(`  ${A.gold}▸${A.reset} Continue with ${provider.name}? (Y/n): `);
      if (reuse.toLowerCase() === 'n') {
        provider = null;
      }
    }
  }

  if (!provider) {
    provider = await selectProvider(config);
  }

  const apiKey = await getApiKey(provider, config);
  const adapter = createAdapter(provider.id, apiKey);

  console.log(`\n  ${A.green}✓${A.reset} ${A.bold}${provider.name}${A.reset} connected · ${A.dim}${provider.tier} tier${A.reset}`);

  await gameLoop(adapter);
}

main().catch(err => {
  console.error(`\n${A.red}Fatal: ${err.message}${A.reset}`);
  process.exit(1);
});
