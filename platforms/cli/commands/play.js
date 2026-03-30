/**
 * BL0CKS CLI — Play Command
 * 
 * The core game loop: boots a level, renders state, handles player input.
 * `bl0cks play [rom] [level]`
 */

import { A, renderBoard, renderNarrative, renderWin, renderLoss, renderHelp } from '../lib/renderer.js';
import { ask, clear } from '../lib/input.js';
import { saveSession } from '../lib/menus.js';

/**
 * Display a game state response from the engine.
 * @param {object} state - Parsed game state
 * @param {object} romInfo - ROM identity info
 * @returns {object} The state (for chaining)
 */
export function displayResponse(state, romInfo) {
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

    // DLC/Community badge rendering
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

import { playAudio } from '../lib/audio.js';
import { join } from 'path';

/**
 * Run the main game loop for a level.
 * @param {object} engine - Booted BL0CKS engine instance
 * @param {string} levelId - Level to play
 * @param {string} romPath - Absolute path to the ROM directory
 */
export async function gameLoop(engine, levelId, romPath) {
  const romInfo = engine.getROMInfo();
  const levelList = engine.listLevels();
  const level = levelList.find(l => l.id === levelId);
  const levelName = level ? level.name : `Level ${levelId}`;

  try {
    if (romPath) {
      playAudio(join(romPath, 'assets', 'audio', `level-${levelId}.mp3`));
    }
  } catch (err) {}

  clear();
  console.log(`\n  ${A.gray}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${A.reset}`);

  // DLC badge for this level
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
  return await inputLoop(engine, levelId);
}


/**
 * Main player input loop — shared by fresh start and resume.
 * @param {object} engine
 * @param {string} levelId
 */
export async function inputLoop(engine, levelId) {
  while (true) {
    const input = await ask(`\n  ${A.gold}▸${A.reset} `);
    const trimmed = input.trim().toLowerCase();

    if (trimmed === 'quit' || trimmed === 'exit' || trimmed === 'q') {
      console.log(`\n  ${A.gray}${A.italic}The block remembers.${A.reset}\n`);
      return { action: 'quit' };
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
      
      // Don't save session if the level is over
      if (state.outcome !== 'win' && state.outcome !== 'loss') {
        saveSession(engine.exportSession());
      } else {
        // Clear session so resume isn't stuck on final screen
        saveSession(null);
      }

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
          console.log(`\n  ${A.dim}Press Enter to continue.${A.reset}`);
          await ask('');
          return { action: 'next', currentLevel: levelId };
        } else {
          console.log(`\n  ${A.dim}Press Enter to exit.${A.reset}`);
          await ask('');
          return { action: 'quit' };
        }
      }
    } catch (err) {
      process.stdout.write('\r\x1b[K');
      console.error(`  ${A.red}Error: ${err.message}${A.reset}`);
    }
  }

  engine.destroy();
  return { action: 'quit' };
}
