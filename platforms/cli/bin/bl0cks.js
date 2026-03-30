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

import { existsSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { BL0CKS, PROVIDERS } from '../../../engine/index.js';
import { A } from '../lib/renderer.js';
import { ask, clear, closeRL } from '../lib/input.js';
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
      displayResponse(state, engine.getROMInfo());
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
      levelId = levels[idx + 1].id;
      
      const ledger = engine.getLedger();
      // Inform the player
      clear();
      console.log(`\n  ${A.gray}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${A.reset}`);
      console.log(`  ${A.gold}${A.bold}Accessing Next Sequence: ${levels[idx+1].name}${A.reset}`);
      console.log(`  ${A.gray}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${A.reset}\n`);
      
      await new Promise(r => setTimeout(r, 1500));
      
      // Start the new level (the engine retains the ledger internally if passed, or we set it)
      engine.setLedger(ledger);
      nextAction = await gameLoop(engine, levelId, romPath);
    } else {
      clear();
      console.log(`\n  ${A.gold}☆ CAMPAIGN COMPLETE ☆${A.reset}`);
      console.log(`  ${A.dim}You survived. The block remembers.${A.reset}\n`);
      break;
    }
  }

  closeRL();
  import('../lib/audio.js').then(m => m.stopAudio());
  process.exit(0);
}

// Ensure audio is killed even if the player presses Ctrl+C
process.on('SIGINT', () => {
  import('../lib/audio.js').then(m => m.stopAudio());
  process.exit();
});
process.on('exit', () => {
  import('../lib/audio.js').then(m => m.stopAudio());
});

main().catch(err => {
  console.error(`\n${A.red}Fatal: ${err.message}${A.reset}`);
  import('../lib/audio.js').then(m => m.stopAudio());
  process.exit(1);
});
