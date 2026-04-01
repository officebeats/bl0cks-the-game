# Project Architecture

## Core Paradigm
**BL0CKS uses an Engine + ROM architecture.**
- **Engine:** Interprets data, manages state, routes AI calls, returns JSON structures representing the game.
- **ROM:** The game content strictly defined in Markdown. Contains Manifest (rules, system prompts) and Levels.

## Data Flow
1. **Boot:** `BL0CKS.boot(ROM_PATH)` loads markdown files.
2. **Level Start:** `engine.startLevel(id)` constructs a prompt combining the manifest rules + level content. The adapter calls the AI.
3. **Turn Loop:** `engine.sendAction(action)` takes player text, prepends "PLAYER ACTION: {action}", and asks the AI to generate the next state according to the JSON schema defined in the manifest.
4. **State Management:** The engine maintains an encrypted or structured history trace passed to each AI turn, allowing state per-level. Engine also manages `ledger` for cross-level progression.

## UI Abstraction
Currently, the UI is decoupled from the Engine.
`platforms/cli/lib/renderer.js` handles terminal UI rendering utilizing manual ANSI escape sequences.
`platforms/web/` is scaffolding for future web interface.
