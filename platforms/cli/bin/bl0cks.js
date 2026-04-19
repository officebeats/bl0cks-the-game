#!/usr/bin/env node

/**
 * BL0CKS CLI — Platform Shell (v2)
 * 
 * Thin orchestrator that delegates to modular components:
 *   - lib/input.js     — Raw-mode keyboard, menu navigation, prompts
 *   - lib/menus.js     — Main menu, provider selection, config persistence
 *   - lib/splash.js    — Boot animation, tutorial
 *   - lib/renderer.js  — ANSI terminal rendering
 *   - commands/play.js — Game loop, state display, scoring
 */

import { existsSync, readFileSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { BL0CKS, PROVIDERS } from '../../../engine/index.js';
import { A, renderActMap, applyTheme } from '../lib/renderer.js';
import { renderIntermissionHub } from '../lib/map-renderer.js';
import { generateStashOffers } from '../../../engine/cards/stash.js';
import { ask, clear, closeRL } from '../lib/input.js';
import { enterAltScreen, exitAltScreen } from '../lib/effects.js';
import {
  loadConfig, loadSession,
  selectProvider, getApiKey,
  showMainMenu, renderTitleInfo,
} from '../lib/menus.js';
import { playSplash, runTutorial } from '../lib/splash.js';
import { gameLoop, inputLoop, displayResponse } from '../commands/play.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, '..', '..', '..');

// ── Main ─────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);

  // ── Default ROM path ──
  let romPath = join(REPO_ROOT, 'roms', 'chicago');
  let levelId = '00'; // Tutorial by default
  let skipToLevel = null;

  // ── Parse arguments ──
  if (args.length > 0) {
    if (args[0] === 'play') {
      if (args[1]) {
        const candidate = resolve(args[1]);
        if (existsSync(join(candidate, 'manifest.json'))) {
          romPath = candidate;
        } else if (existsSync(join(REPO_ROOT, 'roms', args[1], 'manifest.json'))) {
          romPath = join(REPO_ROOT, 'roms', args[1]);
        } else {
          skipToLevel = args[1];
        }
      }
      if (args[2]) skipToLevel = args[2];
    } else if (args[0] === 'rom' && args[1] === 'validate') {
      // Inline ROM validation
      const target = args[2] || '.';
      console.log(`\n  Validating ROM at: ${resolve(target)}\n`);
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

  // ── Enter alternate screen buffer (like vim) ──
  const useAltScreen = !args.includes('--no-altscreen');
  if (useAltScreen) {
    enterAltScreen();
  }

  // ── Boot splash ──
  await playSplash();

  let config = loadConfig();

  // ── Boot engine with ROM (no adapter yet) ──
  let engine;
  try {
    engine = await BL0CKS.boot(romPath, {});
  } catch (err) {
    console.error(`\n  ${A.red}Failed to load ROM: ${err.message}${A.reset}`);
    process.exit(1);
  }

  const romInfo = engine.getROMInfo();
  const installedROMs = BL0CKS.scanROMs();

  // ── Apply ROM theme colors ──
  try {
    const themePath = join(romPath, 'assets', 'theme.json');
    if (existsSync(themePath)) {
      const themeJson = JSON.parse(readFileSync(themePath, 'utf-8'));
      applyTheme(themeJson);
    }
  } catch { /* theme loading is optional, fall through to defaults */ }

  // ── Main Menu Loop ──
  let provider;
  let resumeSessionPayload = null;

  while (true) {
    config = loadConfig();

    const menuSelection = await showMainMenu(config, romInfo, installedROMs);

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
      levelId = skipToLevel || '00';
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
  let nextAction = null;
  if (resumeSessionPayload) {
    try {
      const state = engine.resumeSession(resumeSessionPayload);
      clear();
      await displayResponse(state, engine.getROMInfo());
      nextAction = await inputLoop(engine, levelId);
    } catch (err) {
      console.error(`\n  ${A.red}Failed to resume: ${err.message}${A.reset}`);
      console.log(`  ${A.dim}Starting fresh instead...${A.reset}`);
      resumeSessionPayload = null;
    }
  }

  if (!resumeSessionPayload) {
    nextAction = await gameLoop(engine, levelId, romPath);
  }

  // ── Campaign Loop ──
  while (nextAction && nextAction.action === 'next') {
    const levels = engine.listLevels();
    const idx = levels.findIndex(l => l.id === nextAction.currentLevel);
    
    if (idx !== -1 && idx < levels.length - 1) {
      // --- Intermission Hub (The Fun Upgrade) ---
      const nextLevelIdx = idx + 1;
      const nextLevelId = levels[nextLevelIdx].id;
      
      const ledger = engine.getLedger();
      
      // Generate Stash Rewards
      const stashOffers = generateStashOffers(idx, ledger.assetsHeld || []);

      clear();
      console.log(renderIntermissionHub(engine.getROMInfo(), nextLevelId, ledger, stashOffers));
      
      if (stashOffers.length > 0) {
        const choice = await ask(`\n  ${A.gold}Select your Asset (1, 2, 3) or Enter to skip: ${A.reset}`);
        const pickIdx = parseInt(choice) - 1;
        if (!isNaN(pickIdx) && stashOffers[pickIdx]) {
          ledger.assetsHeld = [...(ledger.assetsHeld || []), stashOffers[pickIdx].id];
          engine.setLedger(ledger);
          console.log(`\n  ${A.green}✓ ${stashOffers[pickIdx].name} added to your stash.${A.reset}`);
          await sleep(1000);
        }
      }

      console.log(`\n  ${A.chalk}Embarking on: ${A.reset}${levels[nextLevelIdx].name}...`);
      await sleep(1500);
      
      clear();
      
      // Start the new level
      nextAction = await gameLoop(engine, nextLevelId, romPath);
    } else {
      clear();
      console.log(`\n  ${A.gold}☆ CAMPAIGN COMPLETE ☆${A.reset}`);
      console.log(`  ${A.dim}You survived. The block remembers.${A.reset}\n`);
      break;
    }
  }

  closeRL();
  if (useAltScreen) exitAltScreen();
  import('../lib/audio.js').then(m => m.stopAudio());
  process.exit(0);
}

// Ensure audio + alt screen are cleaned up even on Ctrl+C
process.on('SIGINT', () => {
  process.stdout.write('\x1b[?25h');   // show cursor
  process.stdout.write('\x1b[?1049l'); // exit alt screen
  import('../lib/audio.js').then(m => m.stopAudio());
  process.exit();
});
process.on('exit', () => {
  process.stdout.write('\x1b[?25h');   // show cursor (safety)
  import('../lib/audio.js').then(m => m.stopAudio());
});

main().catch(err => {
  console.error(`\n${A.red}Fatal: ${err.message}${A.reset}`);
  import('../lib/audio.js').then(m => m.stopAudio());
  process.exit(1);
});
