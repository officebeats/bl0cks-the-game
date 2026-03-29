#!/usr/bin/env node

/**
 * BL0CKS CLI — Thin Platform Shell
 * 
 * This is the terminal client for the BL0CKS game engine.
 * It handles:
 *   - Terminal I/O (raw mode keyboard, ANSI rendering)
 *   - Boot animation and menus
 *   - API key entry and persistence
 *   - Delegates ALL game logic to the engine
 */

import { createInterface } from 'readline';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';
import { BL0CKS, Events, PROVIDERS } from '../../../engine/index.js';
import {
  renderBoard, renderNarrative, renderWin, renderLoss,
  renderSplash, renderMenu, renderHelp, A,
} from '../lib/renderer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, '..', '..', '..');

// ── Config persistence ──────────────────────────────────────────
const CONFIG_DIR = join(homedir(), '.bl0cks');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');
const SAVE_FILE = join(CONFIG_DIR, 'save_game.json');

function loadConfig() {
  try {
    if (existsSync(CONFIG_FILE)) return JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'));
  } catch { /* fresh start */ }
  return {};
}

function saveConfig(config) {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

function loadSession() {
  try {
    if (existsSync(SAVE_FILE)) return JSON.parse(readFileSync(SAVE_FILE, 'utf-8'));
  } catch { /* ignored */ }
  return null;
}

function saveSession(data) {
  mkdirSync(CONFIG_DIR, { recursive: true });
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
      console.log(renderMenu(title, options, 1, frame));
      frame++;
    }, 70);
  });
}

// ── Provider selection ───────────────────────────────────────────
async function selectProvider(config) {
  const options = PROVIDERS.map((p) => {
    const isSaved = config.provider === p.id ? ' [Saved]' : '';
    return { label: `${p.name}${isSaved}`, value: p };
  });
  return showAnimatedMenu("ESTABLISH NEURAL LINK", options);
}

async function getApiKey(provider, config) {
  if (config.keys?.[provider.id]) {
    const reuseOptions = [
      { label: `Boot with saved cypher? (Y/n) - Yes`, value: true },
      { label: `Enter new cypher`, value: false }
    ];
    const reuse = await showAnimatedMenu("ESTABLISH NEURAL LINK", reuseOptions);
    if (reuse) return config.keys[provider.id];
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

// ── Tutorial ─────────────────────────────────────────────────────
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

// ── Render game state from engine ────────────────────────────────
function displayResponse(state, romInfo) {
  if (state.type === 'board') {
    if (state.outcome === 'win') {
      console.log(renderWin(state.event?.description || ''));
      return state;
    }
    if (state.outcome === 'loss') {
      console.log(renderLoss(state.event?.description || ''));
      return state;
    }

    clear();

    // ── DLC/Community badge rendering ──
    if (romInfo?.displayBadge) {
      const badge = romInfo.displayBadge;
      const credit = romInfo.branding?.credit_line || '';
      console.log(`  ${A.gray}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${A.reset}`);
      console.log(`  ${A.gold}${badge}${credit ? ` · ${A.dim}${credit}` : ''}${A.reset}`);
      console.log(`  ${A.gray}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${A.reset}`);
    }

    console.log(renderBoard(state));
    return state;
  }

  // Narrative-only
  console.log(renderNarrative(state.raw));
  return state;
}

// ── Render title screen with ROM info ────────────────────────────
function renderTitleInfo(romInfo, installedROMs) {
  let lines = [];
  lines.push(`  ${A.dim}Base: ${romInfo.base.name} v${romInfo.base.version}${A.reset}`);

  // Show active overlays
  if (romInfo.activeOverlays?.length > 0) {
    for (const overlay of romInfo.activeOverlays) {
      lines.push(`  ${A.gold}🔓 DLC: ${overlay.name}${A.reset}  ${A.green}[Active]${A.reset}`);
    }
  }

  // Show other installed ROMs
  const otherROMs = installedROMs.filter(r => r.id !== romInfo.base.id);
  for (const rom of otherROMs) {
    const icon = rom.contentType === 'community' ? '🌐' : '🎮';
    const status = rom.extends ? `[Extends: ${rom.extends}]` : '[Installed]';
    lines.push(`  ${A.dim}${icon} ${rom.name}  ${status}${A.reset}`);
  }

  return lines.join('\n');
}

// ── Game Loop ────────────────────────────────────────────────────
async function gameLoop(engine, levelId) {
  const romInfo = engine.getROMInfo();
  const levelList = engine.listLevels();
  const level = levelList.find(l => l.id === levelId);
  const levelName = level ? level.name : `Level ${levelId}`;

  clear();
  console.log(`\n  ${A.gray}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${A.reset}`);

  // Show DLC badge if this level is from a DLC/community ROM
  if (level?.isDLC || level?.isCommunity) {
    const icon = level.isCommunity ? '🌐' : '🔓';
    const source = level.sourceROM || 'DLC';
    console.log(`  ${A.gold}${icon} ${source.toUpperCase()} CONTENT${A.reset}`);
  }

  console.log(`  ${A.gold}${A.bold}Booting BL0CKS Cartridge: ${levelName}${A.reset}`);
  console.log(`  ${A.dim}Connecting to ${engine.getProviderInfo()?.name || 'AI'}...${A.reset}`);
  console.log(`  ${A.gray}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${A.reset}\n`);

  try {
    const initialState = await engine.startLevel(levelId);
    displayResponse(initialState, engine.getROMInfo());
    saveSession(engine.exportSession());
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
      console.log(renderHelp());
      continue;
    }
    if (!trimmed) continue;

    try {
      process.stdout.write(`\n  ${A.dim}⠋ The block is thinking...${A.reset}`);
      const state = await engine.sendAction(input);
      process.stdout.write('\r\x1b[K');
      displayResponse(state, engine.getROMInfo());
      saveSession(engine.exportSession());

      if (state.outcome === 'win' || state.outcome === 'loss') {
        if (state.outcome === 'win') {
          const tTicks = state.clock?.total || 12;
          const cTicks = state.clock?.current || 0;
          const ticks = Math.max(0, tTicks - cTicks);
          const territories = (state.territories || []).filter(t => t.control === 'you').length;
          const peopleCards = (state.hand || []).filter(c => c.type === 'people');
          const loyAvg = peopleCards.reduce((acc, c) => acc + (c.loyalty && c.loyalty !== '?' ? c.loyalty : 0), 0) / Math.max(1, peopleCards.length);
          const totalScore = (ticks * 1000) + (territories * 2000) + (loyAvg * 500);
          console.log(`\n  ${A.gold}★ FINAL SCORE: ${Math.round(totalScore)} ★${A.reset}`);
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

  engine.destroy();
  rl.close();
  process.exit(0);
}

// ── Main ─────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);

  // ── Default ROM path ──
  let romPath = join(REPO_ROOT, 'roms', 'chicago');
  let levelId = '00'; // Tutorial by default
  let skipToLevel = null;

  // Parse arguments
  if (args.length > 0) {
    if (args[0] === 'play') {
      if (args[1]) {
        // Check if it's a ROM path or a level id
        const candidate = resolve(args[1]);
        if (existsSync(join(candidate, 'manifest.json'))) {
          romPath = candidate;
        } else if (existsSync(join(REPO_ROOT, 'roms', args[1], 'manifest.json'))) {
          romPath = join(REPO_ROOT, 'roms', args[1]);
        } else {
          // Treat as level id for the default ROM
          skipToLevel = args[1];
        }
      }
      if (args[2]) skipToLevel = args[2];
    } else if (args[0] === 'rom' && args[1] === 'validate') {
      const target = args[2] || '.';
      console.log(`\n  Validating ROM at: ${resolve(target)}\n`);
      // Quick inline validation
      const { loadROM } = await import('../../../engine/content/loader.js');
      const result = await loadROM(resolve(target), join(REPO_ROOT, 'engine'));
      if (result.errors.length > 0) {
        for (const e of result.errors) console.log(`  ${A.red}✗ ${e}${A.reset}`);
      }
      if (result.warnings.length > 0) {
        for (const w of result.warnings) console.log(`  ${A.gold}⚠ ${w}${A.reset}`);
      }
      if (result.rom) {
        console.log(`  ${A.green}✓ ROM "${result.info.base.name}" is valid. ${result.info.levelCount} levels loaded.${A.reset}`);
      }
      process.exit(result.errors.length > 0 ? 1 : 0);
    } else {
      // Direct level id shorthand: `bl0cks 1`
      skipToLevel = args[0];
    }
  }

  // ── Boot splash ──
  clear();
  for (let f = 0; f < 70; f++) {
    process.stdout.write('\x1b[H');
    console.log(renderSplash(f));
    await new Promise(r => setTimeout(r, 70));
  }

  let config = loadConfig();

  // ── Boot engine with ROM (no adapter yet — deferred until key entry) ──
  let engine;
  try {
    engine = await BL0CKS.boot(romPath, {});
  } catch (err) {
    console.error(`\n  ${A.red}Failed to load ROM: ${err.message}${A.reset}`);
    process.exit(1);
  }

  const romInfo = engine.getROMInfo();
  const installedROMs = BL0CKS.scanROMs();

  // ── Main Menu Loop ──
  let provider;
  let resumeSessionPayload = null;

  while (true) {
    config = loadConfig();
    const currentProv = config.provider
      ? PROVIDERS.find(p => p.id === config.provider)?.name || 'None'
      : 'None';

    // Build title info string
    const titleInfo = renderTitleInfo(romInfo, installedROMs);

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
      resumeSessionPayload = session;
      levelId = session.levelId;
      break;
    }

    if (menuSelection === "settings") {
      clear();
      const newProv = await selectProvider(config);
      await getApiKey(newProv, config);
      continue;
    }

    if (menuSelection === "new") {
      if (skipToLevel) {
        levelId = skipToLevel;
      } else {
        levelId = '00';
      }
      break;
    }
  }

  // ── Get provider + API key ──
  config = loadConfig();
  if (config.provider) {
    provider = PROVIDERS.find(p => p.id === config.provider);
  }
  if (!provider) {
    provider = await selectProvider(config);
  }

  const apiKey = await getApiKey(provider, config);

  // ── Set adapter on the engine ──
  engine.setAdapter(apiKey, provider.id);

  console.log(`\n  ${A.green}✓${A.reset} ${A.bold}${provider.name}${A.reset} connected · ${A.dim}${provider.tier} tier${A.reset}`);

  // ── Handle tutorial → Level 1 flow ──
  if (levelId === '00' && !skipToLevel) {
    await runTutorial();
    levelId = '01';
  }

  // ── Handle resume ──
  if (resumeSessionPayload) {
    try {
      const state = engine.resumeSession(resumeSessionPayload);
      clear();
      displayResponse(state, engine.getROMInfo());
    } catch (err) {
      console.error(`\n  ${A.red}Failed to resume: ${err.message}${A.reset}`);
      console.log(`  ${A.dim}Starting fresh instead...${A.reset}`);
      resumeSessionPayload = null;
    }
  }

  if (!resumeSessionPayload) {
    await gameLoop(engine, levelId);
  } else {
    // Resume into the game loop's input phase
    while (true) {
      const input = await ask(`\n  ${A.gold}▸${A.reset} `);
      const trimmed = input.trim().toLowerCase();
      if (trimmed === 'quit' || trimmed === 'exit' || trimmed === 'q') break;
      if (trimmed === 'help' || trimmed === '?') { console.log(renderHelp()); continue; }
      if (!trimmed) continue;

      try {
        process.stdout.write(`\n  ${A.dim}⠋ The block is thinking...${A.reset}`);
        const state = await engine.sendAction(input);
        process.stdout.write('\r\x1b[K');
        displayResponse(state, engine.getROMInfo());
        saveSession(engine.exportSession());
        if (state.outcome) { await ask(`\n  ${A.dim}Press Enter to exit.${A.reset}`); break; }
      } catch (err) {
        process.stdout.write('\r\x1b[K');
        console.error(`  ${A.red}Error: ${err.message}${A.reset}`);
      }
    }
    engine.destroy();
    rl.close();
    process.exit(0);
  }
}

main().catch(err => {
  console.error(`\n${A.red}Fatal: ${err.message}${A.reset}`);
  process.exit(1);
});
