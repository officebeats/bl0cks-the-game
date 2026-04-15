/**
 * BL0CKS CLI — Play Command
 * 
 * The core game loop: boots a level, renders state, handles player input.
 * `bl0cks play [rom] [level]`
 * 
 * v4: Paged layout (Whisper → Play), typewriter narrative, contextual
 *     prompt narrator, and dramatic screen effects.
 */

import { A, renderBoard, renderWhisper, renderNarrative, renderWin, renderLoss, renderHelp } from '../lib/renderer.js';
import { ask, clear } from '../lib/input.js';
import { saveSession, loadConfig, incrementRequestCount } from '../lib/menus.js';
import {
  typewrite, typewriteLines, sleep,
  getPromptNarrator, gradientText, GRADIENTS,
  detectDramaticMoments, playDramaticEffects,
} from '../lib/effects.js';

/** Previous state — for detecting territory changes between turns */
let _prevState = null;

/**
 * Wait for any keypress. Uses raw-mode briefly.
 * @returns {Promise<void>}
 */
function waitForKey() {
  return new Promise((resolve) => {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.once('data', () => {
      process.stdin.setRawMode(false);
      resolve();
    });
  });
}

/**
 * Display the Whisper screen (event + intent) with typewriter effect.
 * @param {object} state - Parsed game state
 */
async function showWhisper(state) {
  const hasWhisper = state.event || state.scanner || state.enemy_intent;
  if (!hasWhisper) return;

  const whisper = renderWhisper(state);
  clear();
  
  // Show the frame instantly, then typewrite the narrative lines
  console.log(whisper.text);
  
  // Wait for player to absorb and press a key
  await waitForKey();
}

/**
 * Display a game state response from the engine.
 * Implements the paged layout: Whisper → Play.
 * 
 * @param {object} state - Parsed game state
 * @param {object} romInfo - ROM identity info
 * @param {boolean} isInitial - True if this is the first turn (show whisper)
 * @returns {object} The state (for chaining)
 */
export async function displayResponse(state, romInfo, isInitial = false) {
  if (state.type === 'board') {
    if (state.outcome === 'win') {
      clear();
      const msg = state.event?.description || '';
      const victoryHeader = gradientText('V I C T O R Y', GRADIENTS.victory.from, GRADIENTS.victory.to);
      console.log(renderWin(msg));
      return state;
    }
    if (state.outcome === 'loss') {
      clear();
      console.log(renderLoss(state.event?.description || ''));
      return state;
    }

    // ── Detect dramatic moments for screen effects ──
    const moments = detectDramaticMoments(state, _prevState);

    // ── Screen 1: The Whisper (event + intent) ──
    const hasWhisper = state.event || state.scanner || state.enemy_intent;
    if (hasWhisper) {
      await showWhisper(state);
    }

    // ── Fire dramatic effects between screens ──
    if (moments.length > 0) {
      await playDramaticEffects(moments);
    }

    // ── Screen 2: The Play (HUD + hand + prompt) ──
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

    // Save for next turn's diff detection
    _prevState = state;
    return state;
  }

  // Narrative-only (no board state) — typewrite it
  const text = state.raw || '';
  await typewrite(`  ${A.chalk}${text}${A.reset}`, 12);
  process.stdout.write('\n');
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

  // Reset previous state for fresh level
  _prevState = null;

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
    await displayResponse(initialState, engine.getROMInfo(), true);
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
 * Features: contextual prompt narrator, dramatic effects, paged layout.
 * @param {object} engine
 * @param {string} levelId
 */
export async function inputLoop(engine, levelId) {
  while (true) {
    // ── Contextual Prompt Narrator ──
    const currentState = engine.getState();
    const engineState = engine.getEngineState();
    const narratorText = getPromptNarrator(currentState, engineState);
    
    const promptLine = `\n  ${A.smoke}THE BLOCK${A.reset} ${A.dim}│${A.reset} ${A.chalk}${narratorText}${A.reset}\n  ${A.gold}▸${A.reset} `;
    const input = await ask(promptLine);
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
      const provider = engine.getProviderInfo();
      const currentConfig = loadConfig();
      
      // Shareware Limit Check (200 requests/day)
      if (provider?.id === 'kilo' && (currentConfig.daily_requests || 0) >= 200) {
        clear();
        console.log(`\n  ${A.red}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${A.reset}`);
        console.log(`  ${A.red}${A.bold}NEURAL LINK SEVERED: SHAREWARE LIMIT REACHED${A.reset}`);
        console.log(`  ${A.red}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${A.reset}\n`);
        console.log(`  You've hit the 200-pulse daily limit for the Kilo Free Gateway.`);
        console.log(`  The South Side is closing its doors to anonymous signals for today.\n`);
        console.log(`  ${A.gold}★ YOUR PROGRESS IS SECURE ★${A.reset}`);
        console.log(`  You can resume exactly where you left off tomorrow, or:`);
        console.log(`\n  ${A.bold}INSERT COIN TO CONTINUE:${A.reset}`);
        console.log(`  1. Open ${A.white}Settings${A.reset}`);
        console.log(`  2. Switch to ${A.green}Gemini${A.reset}, ${A.red}Claude${A.reset}, or ${A.white}OpenAI${A.reset}`);
        console.log(`  3. Paste your Platinum Neural Key`);
        console.log(`\n  ${A.gray}Press Enter to return to Main Menu...${A.reset}`);
        await ask('');
        return { action: 'quit' };
      }

      // ── Thinking indicator with typewriter dots ──
      process.stdout.write(`\n  ${A.dim}⠋ The block is thinking...${A.reset}`);
      
      let state;
      try {
        state = await engine.sendAction(input);
      } catch (err) {
        process.stdout.write('\r\x1b[K');
        if (err.code === 'NOT_ENOUGH_INFLUENCE') {
          console.log(`  ${A.red}✖ ${err.message}${A.reset}`);
          continue; // Don't crash, just prompt again
        }
        throw err;
      }
      
      // Increment request count on successful call
      incrementRequestCount();

      process.stdout.write('\r\x1b[K');
      await displayResponse(state, engine.getROMInfo());
      
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
          
          // Score breakdown
          console.log(`\n  ${A.smoke}─────────────────────────────────────${A.reset}`);
          console.log(`  ${A.chalk}Ticks Remaining  ${A.white}${ticks}${A.chalk} × 1000 = ${A.gold}${ticks * 1000}${A.reset}`);
          console.log(`  ${A.chalk}Territories Held ${A.white}${territories}${A.chalk} × 2000 = ${A.gold}${territories * 2000}${A.reset}`);
          console.log(`  ${A.chalk}Crew Loyalty     ${A.white}${loyAvg.toFixed(1)}${A.chalk} × 500  = ${A.gold}${Math.round(loyAvg * 500)}${A.reset}`);
          console.log(`  ${A.smoke}─────────────────────────────────────${A.reset}`);
          
          const scoreText = gradientText(`★ FINAL SCORE: ${Math.round(totalScore)} ★`, GRADIENTS.victory.from, GRADIENTS.victory.to);
          console.log(`\n  ${scoreText}`);
          
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

