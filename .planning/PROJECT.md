# BL0CKS

**Core Value Proposition:** A CLI-based roguelike card game set in a cyberpunk/noir Chicago, combining the deep mechanical rigor of a deckbuilder (Slay the Spire) with generative AI-driven dynamic narrative content.

## What This Project Is
BL0CKS uses a unique Engine + ROM architecture. The engine handles the mechanical progression, ASCII rendering, and state management, while the AI parses ROMs (`manifest.md`, `theme.json`) to generate unpredictable flavor, encounters, and dynamic territory scenarios on top of the strict ruleset.

## What This Project Is Not
- NOT a purely textual "Choose Your Own Adventure" simulator.
- NOT a traditional GUI app (strictly ANSI terminal CLI).

## Current Milestone: v1.1 Mechanics & Map Overhaul

**Goal:** Transform the game from a narrative text simulator into a mechanically rigorous, spatially aware card battler with a fun Slay the Spire-esque loop.

**Target features:**
- Geographic Map Renderer (ASCII node paths).
- Influence/Energy mechanics for distinct card block/attack costs.
- Predictive enemy intent visualization.
- Phased turns (Draw → Play → Resolve → Enemy Intent).

## Active Requirements
*See REQUIREMENTS.md for full tracking.*

## Key Decisions
- **AI Adapters:** Modular integration allows swapping between Gemini, Claude, and local Ollama. Testing must adhere to strict rate limits.
- **E2E Testing:** Handled by Puppeteer capturing ANSI-to-HTML screenshots in CI. Avoid purely textual unit tests.
- **CLI Renderer:** Manual computation of UI layouts using fixed ANSI coordinates so we can draw overlapping hands.

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state
