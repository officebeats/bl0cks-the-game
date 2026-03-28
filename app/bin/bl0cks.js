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
  renderSplash, renderProviderSelect, A,
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

function loadLevel(pathOrId) {
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
async function gameLoop(adapter, levelPath) {
  const systemPrompt = buildSystemPrompt();
  const levelContent = loadLevel(levelPath);
  if (!levelContent) process.exit(1);

  clear();
  console.log(`\n  ${A.gray}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${A.reset}`);
  let bootName = levelPath;
  if (levelPath === '1' || levelPath === 1) bootName = 'Level 1: The Corner';
  if (levelPath === '2' || levelPath === 2) bootName = 'Level 2: The Wire';
  console.log(`  ${A.gold}${A.bold}Booting BL0CKS Cartridge: ${bootName}${A.reset}`);
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
  let levelPath = '1';

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
  const config = loadConfig();

  clear();
  console.log(renderSplash());

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

  await gameLoop(adapter, levelPath);
}

main().catch(err => {
  console.error(`\n${A.red}Fatal: ${err.message}${A.reset}`);
  process.exit(1);
});
