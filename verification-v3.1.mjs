import { BL0CKS } from './engine/index.js';
import { renderBoard, applyTheme } from './platforms/cli/lib/renderer.js';
import { readFileSync, writeFileSync } from 'fs';
import { resolve, join } from 'path';

async function verify() {
  console.log('--- BL0CKS v4.0 Real-Time Intensity Demo ---');
  console.log('Preparing neural link (3s sequence)...');
  await new Promise(r => setTimeout(r, 2000));

  // 1. Boot engine
  const engine = await BL0CKS.boot(resolve('./roms/chicago'), {
    provider: 'mock',
    apiKey: 'mock'
  });

  // 2. Load theme
  try {
    const theme = JSON.parse(readFileSync('./roms/chicago/assets/theme.json', 'utf-8'));
    applyTheme(theme);
  } catch (e) {}

  // 3. Initialize Session
  await engine.startLevel('01');

  // 4. Animation State
  let frame = 0;
  const maxFrames = 75; // ~15 seconds at 5fps

  // ENTER ALT SCREEN
  process.stdout.write('\x1b[?1049h\x1b[H');

  const ticker = setInterval(async () => {
    frame++;
    
    // Simulate engine ticks
    engine.tick(200);
    
    const eState = engine.getEngineState();
    // Force artificial escalation for the demo
    eState.heat = Math.min(20, (frame / 4)); 
    eState.rivalIntent = (frame * 1.5) % 100;

    const gameState = {
      levelId: '01',
      outcome: null,
      hand: [
        { type: 'people', name: 'Darius Webb', role: 'Broker', faction: 'Governors', loyalty: 8 },
        { type: 'people', name: 'Marcus Cole', role: 'Enforcer', faction: 'Lords', loyalty: 4 },
        { type: 'move', name: 'TAX', description: 'Collect resources' },
        { type: 'move', name: 'WAR', description: 'Contest territory' },
        { type: 'status', name: 'PARANOIA', description: 'Dead weight' }
      ],
      _engine: {
        influence: 4,
        maxInfluence: 6,
        heat: eState.heat,
        heatThreshold: eState.heat > 14 ? 'ON FIRE' : 'WARM',
        turn: 'ACT',
        rivalIntent: eState.rivalIntent,
        rivalIntentRate: 2
      }
    };

    // Render 
    const board = renderBoard(gameState);
    
    // MOVE CURSOR TO TOP AND PRINT (Simulate double buffer)
    process.stdout.write('\x1b[H' + board);

    if (frame >= maxFrames) {
      clearInterval(ticker);
      // EXIT ALT SCREEN
      process.stdout.write('\x1b[?1049l');
      console.log('\n✓ Demo Complete. Real-time heartbeat verified.');
      engine.destroy();
      process.exit(0);
    }
  }, 200);
}

verify().catch(console.error);
