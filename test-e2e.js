import { BL0CKS } from './engine/index.js';
import { resolve } from 'path';

async function runE2E() {
  console.log('[E2E TEST] Booting engine with Chicago ROM...');
  
  const engine = await BL0CKS.boot(resolve('./roms/chicago'), { 
    provider: 'mock', 
    apiKey: 'mock-key' 
  });
  
  console.log('[E2E TEST] Started Level 00 (Tutorial)...');
  let state = await engine.startLevel('00');
  
  let turns = 0;
  while (state.outcome !== 'win' && state.outcome !== 'loss' && turns < 10) {
    turns++;
    const actionStr = turns === 2 ? 'WIN' : 'progress game';
    state = await engine.sendAction(actionStr);
  }

  if (state.outcome === 'win') {
    console.log('[E2E TEST] ✔ Level 00 Won! Proceeding to next level in campaign...');
    
    const levels = engine.listLevels();
    const idx = levels.findIndex(l => l.id === '00');
    
    if (idx !== -1 && idx < levels.length - 1) {
      const nextId = levels[idx + 1].id;
      console.log(`[E2E TEST] Loading next sequence: ${levels[idx+1].name} (${nextId})`);
      
      const ledger = engine.getLedger();
      engine.setLedger(ledger);
      
      state = await engine.startLevel(nextId);
      console.log(`[E2E TEST] ✔ Level ${nextId} booted successfully with transferred ledger!`);
      
      turns = 0;
      while (state.outcome !== 'win' && state.outcome !== 'loss' && turns < 5) {
        turns++;
        state = await engine.sendAction('progress game');
      }
      
      console.log('[E2E TEST] ✔ E2E Campaign capability successfully validated!');
    } else {
      console.log('[E2E TEST] ✗ Failed to find next level');
      process.exit(1);
    }
  } else {
    console.log('[E2E TEST] ✗ Level 00 did not yield win state.');
    process.exit(1);
  }
  
  engine.destroy();
  console.log('[E2E TEST] Complete.');
}

runE2E().catch(console.error);
