import { BL0CKS } from './engine/index.js';
import { renderBoard, applyTheme } from './platforms/cli/lib/renderer.js';
import { readFileSync, writeFileSync } from 'fs';
import { resolve, join } from 'path';

async function verify() {
  console.log('--- BL0CKS v3.1 Visual Verification ---');
  
  // 1. Boot engine
  const engine = await BL0CKS.boot(resolve('./roms/chicago'), {
    provider: 'mock',
    apiKey: 'mock'
  });

  // 2. Load theme to ensure correct colors are applied (simulating CLI boot)
  try {
    const theme = JSON.parse(readFileSync('./roms/chicago/assets/theme.json', 'utf-8'));
    applyTheme(theme);
  } catch (e) {
    console.warn('Theme load failed, using defaults.', e);
  }

  // 3. Force terminal dimensions for "Fan Out" layout
  process.stdout.columns = 100;
  process.stdout.rows = 50; // Disable 'tight' mode

  // 4. Start Level 01
  const state = await engine.startLevel('01');
  
  // 5. Simulate critical real-time intensity (v4.0)
  engine.tick(20000); // Extreme progression
  // Force critical engine state for visual test
  const eState = engine.getEngineState();
  eState.heat = 19;          // Should trigger Flash + Red Heat
  eState.rivalIntent = 95;   // Should trigger high intensity coloring
  // We can't easily capture the 'Shake' in a text file, but we can check the 'Flash' ANSI code

  // 6. Force a "Premium" hand state for the demo
  state.hand = [
    { type: 'people', name: 'Darius Webb', role: 'Broker', faction: 'Governors', loyalty: 8 },
    { type: 'people', name: 'Marcus Cole', role: 'Enforcer', faction: 'Lords', loyalty: 4 },
    { type: 'move', name: 'TAX', description: 'Collect resources from a controlled block' },
    { type: 'move', name: 'WAR', description: 'Contest a rival territory with your crew' },
    { type: 'status', name: 'PARANOIA', description: 'Dead weight. Cannot be played. Burn to remove.' }
  ];
  
  // Augment with engine info for HUD
  state._engine = {
    influence: 4,
    maxInfluence: 6,
    heat: 7,
    heatThreshold: 'Warm',
    turn: 'ACT'
  };

  // 5. Render board (which calls renderFannedHand)
  const board = renderBoard(state);
  
  // 6. Output to a text file
  writeFileSync('v3.1_visual_verification.txt', board);
  
  console.log('✓ Render complete. File saved to v3.1_visual_verification.txt');
  
  engine.destroy();
}

verify().catch(console.error);
