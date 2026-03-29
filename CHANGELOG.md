# Changelog

All notable changes to BL0CKS are documented in this file.

## [2.0.0-alpha.2] — 2026-03-29

### Added
- **Engine Core** — 8 new modules in `engine/core/`:
  - `state.js` — Immutable frozen state container with createState/updateState
  - `phases.js` — 10-phase turn sequence (Dawn → Draw → Street Whisper → Scheme → Act → Combo → Burn → Intent → Heat Check → Dusk)
  - `influence.js` — Action economy with base/max calculations and asset integration
  - `heat.js` — 5-threshold escalation system (Low → Warm → Hot → On Fire → Federal)
  - `ledger.js` — Persistent cross-level consequence tracker (grudges, debts, reputation)
  - `combat.js` — War resolution with loyalty comparison and Block Points
  - `scoring.js` — Multi-dimensional performance grading (S → F)
- **Card Engine** — 6 new modules in `engine/cards/`:
  - `types.js` — 7 card type factories with hidden stat layers
  - `deck.js` — Draw/discard/exhaust pile management with Fisher-Yates shuffle
  - `keywords.js` — 7 keywords (Block, Connect, Flip, Hustle, Fortify, Shadow, Rally) with combo detection
  - `moves.js` — TAX/GHOST/SNITCH/STACK/WAR/PEACE/BURN with base and powered effects
  - `gambit.js` — High-risk third option system (40% chance, always on boss encounters)
  - `stash.js` — The Stash with 12 permanent post-level assets
- **GameController v2** — Full integration of all engine modules into the live game loop
- **CLI Modularization** — Split monolithic bl0cks.js (554 lines) into 5 focused modules
- **Engine HUD** — Influence bar, heat meter, and phase indicator in CLI board render
- **Deception Arc DLC** — Sample 3-level DLC ROM with custom factions, cards, and narrator
- **Documentation** — ROM_SPEC.md, ADAPTER_GUIDE.md, CHANGELOG.md
- **Test Suite** — 27 engine smoke tests + 6 CLI module import tests

### Changed
- `engine/index.js` — Re-exports all card, keyword, stash, scoring, heat, ledger modules
- `engine/core/game.js` — Rewritten to use immutable state, per-turn influence reset, auto-incrementing heat
- `platforms/cli/bin/bl0cks.js` — Refactored from 554 to 140 lines (thin orchestrator)
- `README.md` — Complete rewrite for v2 architecture
- `.gitignore` — Updated for new structure

### Removed
- `app/` — Deprecated monolithic CLI application
- `levels/` — Root-level level files (moved to ROM)
- `world/` — Root-level world files (moved to ROM)
- `GDD.md`, `MVP_PLAN.md`, `STS_MECHANICS_INTEGRATION.md`, `SYSTEM_PROMPT.md` — Moved to docs/

## [2.0.0-alpha.1] — 2026-03-28

### Added
- Engine + ROM architecture
- AI provider router with Gemini, Claude, OpenAI adapters
- ROM content loader with manifest validation
- DLC overlay merger
- Event bus for engine ↔ platform communication
- CLI platform with animated menus and fanned card renderer
- Chicago base ROM with 3 levels

---

*Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).*
