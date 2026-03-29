import { BL0CKS } from './engine/index.js';
import { resolve } from 'path';

async function runE2E() {
  console.log('[E2E TEST] Booting engine with Chicago ROM...');
  
  const engine = await BL0CKS.boot(resolve('./roms/chicago'), { 
    provider: 'mock', 
    apiKey: 'mock-key' 
  });
  
  const levels = engine.listLevels();
  let currentLevelIdx = 0;
  let currentState = await engine.startLevel(levels[currentLevelIdx].id);

  while (currentLevelIdx < levels.length) {
    const level = levels[currentLevelIdx];
    console.log(`[E2E TEST] Playing Level ${level.id}: ${level.name}...`);
    
    let turns = 0;
    while (currentState.outcome !== 'win' && currentState.outcome !== 'loss' && turns < 10) {
      turns++;
      const actionStr = turns === 2 ? 'WIN' : 'progress game';
      currentState = await engine.sendAction(actionStr);
    }

    if (currentState.outcome === 'win') {
      console.log(`[E2E TEST] ✔ Level ${level.id} Won!`);
      
      currentLevelIdx++;
      if (currentLevelIdx < levels.length) {
        const nextLevel = levels[currentLevelIdx];
        console.log(`[E2E TEST] Proceeding to next level: ${nextLevel.name} (${nextLevel.id})...`);
        
        const ledger = engine.getLedger();
        engine.setLedger(ledger);
        currentState = await engine.startLevel(nextLevel.id);
      } else {
        console.log('[E2E TEST] ✔ All levels completed! 100% campaign completion reached.');
      }
    } else {
      console.log(`[E2E TEST] ✗ Level ${level.id} did not yield win state.`);
      process.exit(1);
    }
  }
  
  engine.destroy();
  console.log('[E2E TEST] Regression test complete.');
}

runE2E().catch(console.error);
