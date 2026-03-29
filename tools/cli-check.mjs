/**
 * Quick import check for refactored CLI modules.
 * Verifies all modules parse and export correctly without starting interactive I/O.
 */

// Engine modules (already tested in smoke-test.mjs, just verify re-exports)
import { BL0CKS, Events, PROVIDERS } from '../engine/index.js';
console.log('✅ engine/index.js — BL0CKS class, Events, PROVIDERS');

// CLI renderer (no I/O side effects)
import { renderBoard, renderNarrative, renderWin, renderLoss, renderSplash, renderMenu, renderHelp, A } from '../platforms/cli/lib/renderer.js';
console.log('✅ cli/lib/renderer.js — renderBoard, renderMenu, A (ANSI codes)');

// CLI input (exports functions, no auto-start)
import { ask, clear, showAnimatedMenu, showAnimatedPrompt, getRL, closeRL } from '../platforms/cli/lib/input.js';
console.log('✅ cli/lib/input.js — ask, clear, showAnimatedMenu, showAnimatedPrompt');

// CLI menus (exports functions, no auto-start)
import { loadConfig, saveConfig, loadSession, saveSession, selectProvider, getApiKey, showMainMenu, renderTitleInfo } from '../platforms/cli/lib/menus.js';
console.log('✅ cli/lib/menus.js — loadConfig, selectProvider, getApiKey, showMainMenu');

// CLI splash (exports functions, no auto-start)
import { playSplash, runTutorial } from '../platforms/cli/lib/splash.js';
console.log('✅ cli/lib/splash.js — playSplash, runTutorial');

// CLI play command (exports functions, no auto-start)
import { gameLoop, inputLoop, displayResponse } from '../platforms/cli/commands/play.js';
console.log('✅ cli/commands/play.js — gameLoop, inputLoop, displayResponse');

console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  ALL CLI MODULES LOADED SUCCESSFULLY');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// Close any readline that was lazily created
closeRL();
process.exit(0);
