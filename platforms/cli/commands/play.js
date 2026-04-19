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
import { ask, clear, listenForKeys } from '../lib/input.js';
import { saveSession, loadConfig } from '../lib/menus.js';
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
 * v4.0 Real-Time Battle Loop
 * Heartbeat-driven engine updates + Instant key handling.
 */
export async function inputLoop(engine, levelId) {
  let currentState = engine.getState();
  let isThinking = false;
  let ticker;
  let stopInput;
  let vibeFrame = 0;

  const result = await new Promise((resolve) => {
    const romInfo = engine.getROMInfo();

    // ── THE HEARTBEAT (5 FPS) ──
    ticker = setInterval(() => {
      // 1. Tick the engine
      engine.tick(200);
      
      // 2. Refresh the board
      currentState = engine.getState();
      const engState = engine.getEngineState();
      
      // Don't re-render if we are in an outcome state
      if (currentState.outcome) return;

      // 3. Visual Intensity Logic (Shake/Flash)
      // Trigger vibe if Heat is high or Rival is about to strike
      if (engState.heat >= 14 || engState.rivalIntent >= 80) {
        if (vibeFrame === 0) vibeFrame = 2; // Pulse the shake
      }

      const options = {
        shakeX: vibeFrame > 0 ? (vibeFrame % 2 === 0 ? 1 : -1) : 0,
        flash: engState.heat >= 18 && (Date.now() % 800 < 200) // Rapid flash at critical heat
      };

      if (vibeFrame > 0) vibeFrame--;

      // 4. Render
      process.stdout.write('\x1b[H'); // Jump to top
      console.log(renderBoard(currentState, options));
      
      if (isThinking) {
        process.stdout.write(`\n  ${A.dim}⠋ The block is processing...${A.reset}`);
      } else {
        const narratorText = getPromptNarrator(currentState, engState);
        process.stdout.write(`\n  ${A.smoke}THE BLOCK${A.reset} ${A.dim}│${A.reset} ${A.chalk}${narratorText}${A.reset}\n  ${A.gold}▸${A.reset} `);
      }
    }, 200);

    // ── THE INPUT HANDLER (Instant Keypress) ──
    stopInput = listenForKeys(async (key, char) => {
      if (isThinking) return; // Buffer moves? Or just ignore for now.

      let action = null;
      if (char >= '1' && char <= '5') action = char;
      else if (char === 'b' || char === 'B') action = 'BURN';
      else if (char === 'i' || char === 'I' || char === '?') {
         console.log(renderHelp());
         return;
      }
      else if (char === 'q' || char === 'Q') {
        cleanup();
        resolve({ action: 'quit' });
        return;
      }

      if (action) {
        isThinking = true;
        try {
          const nextState = await engine.sendAction(action);
          currentState = nextState;
          
          // PERSISTENCE FIX: Save session after each resolved action (v4.0 fix)
          if (saveSession) {
            saveSession(engine.exportSession());
          }
          
          isThinking = false;

          if (nextState.outcome) {
            cleanup();
            await displayResponse(nextState, romInfo);
            
            // Score handling
            if (nextState.outcome === 'win') {
              // ... score logic ... (collapsed for brevity in this PR)
              process.stdout.write(`\n  ${A.gold}★ LEVEL COMPLETE ★${A.reset}\n`);
              resolve({ action: 'next', currentLevel: levelId });
            } else {
              resolve({ action: 'quit' });
            }
          }
        } catch (err) {
          isThinking = false;
          // Show error briefly?
        }
      }
    });

    const cleanup = () => {
      clearInterval(ticker);
      stopInput();
      clear();
    };
  });

  // CLEANUP FIX: Ensure engine is destroyed and result is returned correctly (v4.0 fix)
  engine.destroy();
  return result;
}

