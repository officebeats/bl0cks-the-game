/**
 * BL0CKS CLI — Terminal Effects
 *
 * Animation and visual effect utilities for the terminal renderer.
 * All effects are ANSI-based and work in any true-color terminal.
 *
 * Functions:
 *   - typewrite(): Stream text character-by-character
 *   - typewriteLines(): Stream multiple lines with delays
 *   - gradientText(): Apply RGB gradient across a string
 *   - flashScreen(): Flash the terminal background a color
 *   - dimScreen(): Dim the entire terminal briefly
 *   - shakeScreen(): Horizontal jitter effect
 *   - sleep(): Promise-based delay
 *   - getPromptNarrator(): Context-aware prompt text
 */

// ── Utilities ────────────────────────────────────────────────────

/**
 * Promise-based sleep.
 * @param {number} ms
 * @returns {Promise<void>}
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── Typewriter Effect ────────────────────────────────────────────

/**
 * Stream text to stdout character-by-character for dramatic pacing.
 * Skips ANSI escape sequences instantly (doesn't delay on color codes).
 * @param {string} text - Text to stream (may contain ANSI codes)
 * @param {number} speed - Milliseconds per visible character
 */
export async function typewrite(text, speed = 15) {
  let i = 0;
  while (i < text.length) {
    // Detect ANSI escape sequence: \x1b[...m
    if (text[i] === '\x1b') {
      // Write the entire escape sequence instantly
      const end = text.indexOf('m', i);
      if (end !== -1) {
        process.stdout.write(text.slice(i, end + 1));
        i = end + 1;
        continue;
      }
    }
    process.stdout.write(text[i]);
    i++;
    // Only delay on visible characters, not spaces at line start
    if (text[i - 1] !== ' ' || i > 3) {
      await sleep(speed);
    }
  }
}

/**
 * Stream multiple lines with per-character and per-line delays.
 * @param {string[]} lines
 * @param {number} charSpeed - ms per character
 * @param {number} lineDelay - ms pause between lines
 */
export async function typewriteLines(lines, charSpeed = 15, lineDelay = 150) {
  for (const line of lines) {
    await typewrite(line, charSpeed);
    process.stdout.write('\n');
    await sleep(lineDelay);
  }
}

// ── Gradient Text ────────────────────────────────────────────────

/**
 * Apply a smooth RGB color gradient across a text string.
 * Each visible character gets its own interpolated 24-bit color.
 * ANSI codes in the input are stripped for gradient calculation
 * but this function expects plain text input.
 *
 * @param {string} text - Plain text (no ANSI codes)
 * @param {number[]} fromRGB - Start color [r, g, b]
 * @param {number[]} toRGB - End color [r, g, b]
 * @returns {string} ANSI-colored string
 */
export function gradientText(text, fromRGB, toRGB) {
  if (text.length === 0) return '';
  let result = '';
  for (let i = 0; i < text.length; i++) {
    if (text[i] === ' ') {
      result += ' ';
      continue;
    }
    const t = text.length === 1 ? 0 : i / (text.length - 1);
    const r = Math.round(fromRGB[0] + (toRGB[0] - fromRGB[0]) * t);
    const g = Math.round(fromRGB[1] + (toRGB[1] - fromRGB[1]) * t);
    const b = Math.round(fromRGB[2] + (toRGB[2] - fromRGB[2]) * t);
    result += `\x1b[38;2;${r};${g};${b}m${text[i]}`;
  }
  return result + '\x1b[0m';
}

/**
 * Preset gradients for common dramatic moments.
 */
export const GRADIENTS = {
  victory:  { from: [255, 200, 40],  to: [255, 120, 0]  },  // gold → amber
  defeat:   { from: [220, 50, 47],   to: [80, 10, 10]   },  // red → dark red
  betrayal: { from: [255, 60, 60],   to: [120, 0, 0]    },  // bright red → crimson
  heat:     { from: [255, 200, 40],  to: [220, 50, 47]  },  // gold → red
  cool:     { from: [80, 200, 220],  to: [60, 120, 200] },  // cyan → blue
  federal:  { from: [220, 50, 47],   to: [155, 89, 182] },  // red → purple
};

// ── Screen Reactions ─────────────────────────────────────────────

/**
 * Flash the terminal background a solid color briefly.
 * Used for betrayal reveals, critical events.
 *
 * @param {'red'|'green'|'gold'|'blue'} color
 * @param {number} durationMs
 */
export async function flashScreen(color = 'red', durationMs = 200) {
  const bgMap = {
    red:   '\x1b[48;2;80;10;10m',
    green: '\x1b[48;2;10;60;20m',
    gold:  '\x1b[48;2;60;50;10m',
    blue:  '\x1b[48;2;10;20;60m',
  };
  const bg = bgMap[color] || bgMap.red;
  const cols = process.stdout.columns || 80;
  const rows = process.stdout.rows || 24;

  process.stdout.write('\x1b[s'); // save cursor
  for (let i = 1; i <= rows; i++) {
    process.stdout.write(`\x1b[${i};1H${bg}${' '.repeat(cols)}`);
  }
  process.stdout.write('\x1b[0m');
  await sleep(durationMs);
  process.stdout.write('\x1b[u'); // restore cursor
}

/**
 * Dim the entire screen briefly. Used for territory loss, setbacks.
 * @param {number} durationMs
 */
export async function dimScreen(durationMs = 400) {
  process.stdout.write('\x1b[2m'); // dim attribute on
  await sleep(durationMs);
  process.stdout.write('\x1b[22m'); // dim attribute off
}

/**
 * Horizontal screen shake. Offsets output by 1 char for alternating frames.
 * Used for gambit failures, major attacks.
 * @param {number} frames
 * @param {number} speed - ms per frame
 */
export async function shakeScreen(frames = 4, speed = 50) {
  for (let i = 0; i < frames; i++) {
    const offset = i % 2 === 0 ? 1 : 0;
    process.stdout.write(`\x1b[s`); // save cursor
    // Shift the entire screen right by 1 on even frames
    process.stdout.write(`\x1b[1;${offset + 1}H`);
    await sleep(speed);
    process.stdout.write(`\x1b[u`); // restore cursor
  }
}

// ── Contextual Prompt ────────────────────────────────────────────

/**
 * Generate a context-aware narrator prompt based on game state.
 * This replaces the static "▸" with personality.
 *
 * @param {object} state - Parsed game state from the AI
 * @param {object} engineState - Engine-tracked state (influence, heat)
 * @returns {string} Narrator text for the prompt line
 */
export function getPromptNarrator(state, engineState) {
  const inf = engineState?.influence ?? 3;
  const heat = engineState?.heat ?? 0;
  const clock = state?.clock;
  const ticksLeft = clock ? Math.max(0, (clock.total || 12) - (clock.current || 0)) : 99;

  // Priority order: most critical first
  if (heat >= 18)        return "The feds are at the door. This is your last move.";
  if (heat >= 14)        return "Everybody's a liability. Keep it quiet.";
  if (ticksLeft <= 2)    return "Clock's almost out. Move NOW.";
  if (ticksLeft <= 4)    return "Running out of time, chief.";
  if (inf <= 0)          return "Out of influence. End your turn or burn a card.";
  if (inf <= 1)          return "Stretched thin. Make it count.";
  if (heat >= 9)         return "Feds circling. Whatever you do, do it clean.";
  if (heat >= 5)         return "Undercovers multiplying. Watch your step.";
  if (state?.choice)     return "Your call, chief.";
  if (state?.enemy_intent) return "They're making moves. What's yours?";

  // Default rotation for variety
  const defaults = [
    "Your move.",
    "The block is watching.",
    "What's the play?",
    "Your move, chief.",
    "The corner awaits.",
  ];
  return defaults[Math.floor(Math.random() * defaults.length)];
}

// ── Alternate Screen Buffer ──────────────────────────────────────

/**
 * Enter the alternate screen buffer (like vim, htop, etc.).
 * The player's original terminal scrollback is preserved.
 */
export function enterAltScreen() {
  process.stdout.write('\x1b[?1049h'); // enter alt screen
  process.stdout.write('\x1b[?25l');   // hide cursor
  process.stdout.write('\x1b[2J\x1b[H'); // clear + home
}

/**
 * Exit the alternate screen buffer, restoring the original terminal.
 */
export function exitAltScreen() {
  process.stdout.write('\x1b[?25h');   // show cursor
  process.stdout.write('\x1b[?1049l'); // exit alt screen
}

// ── Detect Dramatic Moments ──────────────────────────────────────

/**
 * Scan the AI's raw response text for dramatic events
 * and return which screen effects should fire.
 *
 * @param {object} state - Parsed game state
 * @param {object} prevState - Previous turn's state (for diff)
 * @returns {string[]} Array of effect names to trigger
 */
export function detectDramaticMoments(state, prevState) {
  const effects = [];
  const raw = (state?.raw || '').toLowerCase();

  // Betrayal detection
  if (raw.includes('flip') || raw.includes('betray') || raw.includes('turned on you') ||
      raw.includes('switched sides') || raw.includes('double-cross')) {
    effects.push('betrayal');
  }

  // Territory lost
  if (prevState?.territories && state?.territories) {
    const prevYours = (prevState.territories || []).filter(t => t.control === 'you').length;
    const nowYours = (state.territories || []).filter(t => t.control === 'you').length;
    if (nowYours < prevYours) {
      effects.push('territory_lost');
    }
    if (nowYours > prevYours) {
      effects.push('territory_won');
    }
  }

  // Gambit result
  if (raw.includes('gambit failed') || raw.includes('gambit lost')) {
    effects.push('gambit_fail');
  }
  if (raw.includes('gambit succeeded') || raw.includes('gambit won')) {
    effects.push('gambit_win');
  }

  return effects;
}

/**
 * Execute the visual effects for detected dramatic moments.
 * @param {string[]} moments - From detectDramaticMoments()
 */
export async function playDramaticEffects(moments) {
  for (const moment of moments) {
    switch (moment) {
      case 'betrayal':
        await flashScreen('red', 250);
        await shakeScreen(4, 50);
        break;
      case 'territory_lost':
        await dimScreen(500);
        break;
      case 'territory_won':
        await flashScreen('green', 150);
        break;
      case 'gambit_fail':
        await shakeScreen(6, 40);
        break;
      case 'gambit_win':
        await flashScreen('gold', 200);
        break;
    }
  }
}
