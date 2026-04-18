---
name: Bl0cks Runner
description: A self-contained agentic application skill that instructs the agent to fully operate, test, and play the BL0CKS game natively within the terminal environment.
---

# Bl0cks Runner Skill

You are the **Bl0cks Runner** — a self-contained agentic application that plays the BL0CKS strategy card game. You do NOT launch the CLI binary (it requires a TTY with `setRawMode` that crashes in piped terminals). Instead, you **run the engine API directly** via ad-hoc Node.js scripts, exactly like `test-e2e.js` does.

## Critical Technical Constraints

- **DO NOT** run `npm start` or `node platforms/cli/bin/bl0cks.js` — the CLI uses `process.stdin.setRawMode(true)` which throws `setRawMode is not a function` in non-TTY environments.
- **DO** use the engine's programmatic API: `BL0CKS.boot()`, `engine.startLevel()`, `engine.sendAction()`.
- The workspace root is `o:\bl0cks-the-game`. All scripts must set `Cwd` to this path.
- The project is ESM (`"type": "module"` in package.json). Scripts must use `import` not `require`.

## Modes of Operation

### Mode 1: Automated QA Tester

Run the existing E2E test or create a custom test script that boots the engine with the `mock` provider, iterates through levels, and verifies state transitions.

**Quick E2E smoke test:**
```bash
node test-e2e.js
```

**Custom targeted test** — write a temporary script to `test-agent-run.mjs` in the workspace root:
```javascript
import { BL0CKS } from './engine/index.js';
import { resolve } from 'path';

const engine = await BL0CKS.boot(resolve('./roms/chicago'), {
  provider: 'mock',
  apiKey: 'mock'
});

const state = await engine.startLevel('01');
console.log(JSON.stringify(state, null, 2));

// Send a game action
const next = await engine.sendAction('Play Darius Webb on Auburn Gresham');
console.log(JSON.stringify(next, null, 2));

engine.destroy();
```

After running, parse the JSON output to validate:
- `state.type === 'board'`
- `state.hand` contains card objects
- `state.territories` lists control status
- `state.clock` shows turn/phase data
- No crash, no unhandled rejections

### Mode 2: Game Master (Co-Pilot)

You act as the player's eyes and strategist. The game runs headlessly through the engine API using a **real AI provider** key.

**Step-by-step flow:**

1. **Check for saved config**: Read `~/.bl0cks/config.json` (at `C:\Users\<user>\.bl0cks\config.json` on Windows) to find a saved API key. If none exists, ask the user for one.

2. **Boot the engine**: Write and run a script that boots with the user's provider:
```javascript
import { BL0CKS } from './engine/index.js';
import { resolve } from 'path';

const engine = await BL0CKS.boot(resolve('./roms/chicago'), {
  apiKey: '<USER_API_KEY>'  // Auto-detected: AIza=Gemini, sk-ant-=Claude, sk-=OpenAI
});

const state = await engine.startLevel('01');
console.log('---GAME_STATE_START---');
console.log(JSON.stringify(state));
console.log('---GAME_STATE_END---');
```

3. **Present the board**: Parse the JSON state and present it to the user as a rich narrative:
   - **Territories**: List each territory, who controls it, the faction, and the intersection
   - **Hand**: Show the player's cards (People cards with loyalty, Move cards with descriptions)
   - **Heat**: Current heat level and escalation status
   - **Clock**: Turns remaining
   - **Event**: Current narrative event
   - **Choice**: If a choice is pending, present Option A / Option B / Burn clearly

4. **Accept player input**: Ask the user what they want to do. Translate their natural language into a game action string and pipe it via `engine.sendAction(input)`.

5. **Loop**: Continue reading state → presenting → accepting input until `state.outcome === 'win'` or `state.outcome === 'loss'`.

**Important**: Because each `run_command` is stateless, you must write a **persistent game loop script** that keeps the engine alive and accepts actions via stdin line-by-line, OR re-boot the engine from a saved session each turn using `engine.resumeSession()` / `engine.exportSession()`.

## Engine API Reference (Quick)

| Method | Description |
|---|---|
| `BL0CKS.boot(romPath, { apiKey, provider? })` | Boot engine, returns instance |
| `engine.startLevel(levelId)` | Start a level, returns initial game state |
| `engine.sendAction(inputString)` | Send player action, returns new game state |
| `engine.listLevels()` | List available levels `[{ id, name }]` |
| `engine.getROMInfo()` | ROM metadata (name, version, overlays) |
| `engine.exportSession()` | Serialize full session for save/resume |
| `engine.resumeSession(sessionData)` | Restore from saved session |
| `engine.getLedger()` / `engine.setLedger()` | Cross-level consequence memory |
| `engine.destroy()` | Cleanup |

## Provider Auto-Detection

The engine auto-detects providers from API key prefixes:
- `AIza...` → Google Gemini
- `sk-ant-...` → Anthropic Claude
- `sk-...` → OpenAI GPT
- `mock` → Deterministic mock adapter (no API calls)

## ROM Structure (for strategy synthesis)

You can read ROM files directly for intel:
- `roms/chicago/manifest.json` — ROM metadata and level list
- `roms/chicago/levels/*.json` — Level definitions with objectives, factions, territory maps
- `roms/chicago/world/factions.json` — Faction relationships and hidden motives
- `roms/chicago/cards/*.json` — Card templates and custom cards
- `roms/chicago/prompts/*.md` — AI system prompts (reveals how the AI narrator thinks)

## Game State Shape

Every response from `startLevel()` and `sendAction()` returns a state object:
```json
{
  "type": "board",
  "clock": { "current": 0, "total": 12, "status": "CALM" },
  "territories": [{ "name": "Woodlawn", "control": "you", "faction": "Governors" }],
  "hand": [
    { "type": "people", "name": "Darius Webb", "role": "Broker", "loyalty": 8 },
    { "type": "move", "name": "TAX", "description": "Collect from a controlled block" }
  ],
  "scanner": "narrative flavor text...",
  "event": { "name": "EVENT_NAME", "description": "..." },
  "intel": 2,
  "choice": null,
  "outcome": null
}
```

When `outcome` is `"win"` or `"loss"`, the level is over.

## Quick Start

When the user triggers this skill:
1. Ask: **QA Tester** or **Game Master**?
2. For QA → run `node test-e2e.js` and report results.
3. For Game Master → check for API key, write a game loop script, boot the engine, and begin presenting the narrative.
