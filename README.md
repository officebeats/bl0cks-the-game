# BL0CKS — The AI Strategy Card Game

> **Territory. Trust. Time.**

BL0CKS is the first strategy card game built natively on AI — powered by any major LLM provider. Set against the hyper-specific geography of Chicago's South Side, it asks players to manage alliances, information, and loyalty in a world where everyone is playing their own game.

Every character has a **visible loyalty score** and a **hidden true motive** known only to the AI. Every decision costs clock ticks. Betrayals aren't random — they're earned outcomes of your own risk tolerance.

```
╭────────────────────────────────────────────────────────╮
│  ░▒▓  ★  V I C T O R Y  ★  ▓▒░                       │
│                    ♛                                   │
│            ▄█████████▄                                 │
│   "You held the block. The corner knows your name."    │
│                                                        │
│            ─────────────────────                       │
│            "Territory. Trust. Time."                   │
╰────────────────────────────────────────────────────────╯
```

---

## 🎮 Quick Start

```bash
# Clone the repository
git clone https://github.com/officebeats/bl0cks-the-game.git
cd bl0cks-the-game

# Install dependencies
npm install

# Play (requires AI API key)
npm start

# Optional: disable alternate screen buffer
npm start -- --no-altscreen
```

You'll be prompted to enter an API key from any supported provider:
- **Gemini** (`AIza...`) — Recommended
- **Claude** (`sk-ant-...`)
- **OpenAI** (`sk-...`)
- **Kilo** — Free shareware gateway (200 requests/day)

---

## 🖥️ Terminal Experience

BL0CKS runs in an **immersive terminal UI** with a full ASCII art renderer:

| Feature | Description |
|---|---|
| **Alternate Screen** | Game runs in its own screen buffer (like vim). `--no-altscreen` to disable. |
| **Fanned Card Layout** | Cards displayed in a parabolic arc with overlap, drop shadows, and faction-colored borders |
| **Paged Layout** | Dramatic **Whisper → Play** flow. Events and enemy intent shown on their own screen before your hand. |
| **Contextual Narrator** | `THE BLOCK │ Feds circling. Keep it quiet.` — Prompt text reacts to heat, influence, clock, and threats. |
| **Screen Reactions** | Red flash on betrayal, dim on territory loss, shake on gambit failure |
| **Typewriter Text** | Narrative streams char-by-char for dramatic pacing |
| **Gradient Text** | 24-bit color gradients on victory scores and dramatic moments |
| **ROM Theming** | Custom color palettes loaded from `assets/theme.json` per ROM |
| **720p Optimized** | Every screen verified to fit 80×24 terminal (tight 720p) |

### Card Types — Visual Identity

```
╭── PEOPLE ──────╮  ╭── MOVES ──────╮  ╭── DEAD DRAW ──╮
│ 1·DARIUS WEBB  │  │ 1·⚔ TAX      │  │ 1·🔥PARANOIA  │
│   Broker       │  │   Collect     │  │   DEAD DRAW   │
│   Governors    │  │   resources   │  │   Cannot be   │
│   Woodlawn     │  │   from a      │  │   played.     │
│   Loy: 7       │  │   controlled  │  │   Burn to     │
│   ████████░░   │  │   block.      │  │   remove.     │
│   ░░░░░░░░░░░  │  │   █████       │  │   BURN →      │
╰────────────────╯  ╰───────────────╯  ╰───────────────╯
 Blue border          Red border         Red background
 Faction-colored      ⚔ + accent        🔥 + dim text
```

---

## 🏗️ Architecture (v2)

BL0CKS uses an **Engine + ROM** architecture — the game engine is content-agnostic, and all world content loads from swappable ROM packages.

```
bl0cks-the-game/
├── engine/                    # Core game engine (content-agnostic)
│   ├── index.js               # Public API: BL0CKS.boot()
│   ├── ai/                    # AI provider routing & adapters
│   │   ├── router.js          #   Provider auto-detection
│   │   ├── prompt-builder.js  #   ROM → system prompt assembly
│   │   ├── response-parser.js #   AI output → game state
│   │   └── adapters/          #   Provider-specific adapters
│   │       ├── gemini.js      #     Google Gemini
│   │       ├── claude.js      #     Anthropic Claude
│   │       ├── openai.js      #     OpenAI GPT
│   │       ├── kilo.js        #     Kilo free gateway
│   │       ├── ollama.js      #     Local Ollama models
│   │       └── mock.js        #     Deterministic testing
│   ├── cards/                 # Card engine
│   │   ├── types.js           #   Card type schemas & factories
│   │   ├── deck.js            #   Draw/discard/exhaust pile mgmt
│   │   ├── keywords.js        #   Keyword synergy system
│   │   ├── moves.js           #   Move card execution logic
│   │   ├── gambit.js          #   High-risk gambit system
│   │   └── stash.js           #   Post-level asset rewards
│   ├── core/                  # Game mechanics
│   │   ├── game.js            #   Game controller & state machine
│   │   ├── state.js           #   Immutable state management
│   │   ├── phases.js          #   10-phase turn sequence
│   │   ├── influence.js       #   Action economy (Influence)
│   │   ├── heat.js            #   Escalation pressure (Heat Meter)
│   │   ├── combat.js          #   War resolution logic
│   │   ├── scoring.js         #   Score calculation & grading
│   │   └── ledger.js          #   Cross-level consequence tracker
│   ├── content/               # ROM loader pipeline
│   │   ├── loader.js          #   ROM discovery & loading
│   │   ├── manifest.js        #   Manifest parsing
│   │   ├── resolver.js        #   File resolution
│   │   ├── validator.js       #   Schema validation
│   │   └── merger.js          #   DLC overlay merging
│   └── events/                # Engine ↔ Platform pub/sub
│       ├── emitter.js         #   EventBus implementation
│       └── events.js          #   Event type constants
│
├── roms/                      # Game content packages
│   ├── chicago/               # Base ROM: South Side Chicago
│   │   ├── manifest.json      #   ROM metadata & structure
│   │   ├── levels/            #   Level definition files (12 levels)
│   │   ├── world/             #   Factions, territory, lore, aesthetics
│   │   ├── cards/             #   Card templates & custom cards
│   │   ├── prompts/           #   AI prompt files
│   │   └── assets/            #   Theme, audio, visual assets
│   └── _template/             # Starter kit for community ROMs
│
├── platforms/                 # Platform shells
│   ├── cli/                   # Terminal interface
│   │   ├── bin/bl0cks.js      #   CLI entry point + alt screen buffer
│   │   ├── commands/play.js   #   Game loop, paged layout, scoring
│   │   └── lib/
│   │       ├── renderer.js    #   Cell-buffer terminal renderer
│   │       ├── effects.js     #   Typewriter, gradients, screen fx
│   │       ├── input.js       #   Readline + raw mode input
│   │       ├── menus.js       #   Config, sessions, provider select
│   │       ├── splash.js      #   Animated boot splash + tutorial
│   │       └── audio.js       #   Background audio playback
│   └── web/                   # Web interface (planned)
│
├── tools/                     # Developer tools
│   ├── rom-validator.mjs      #   Validate ROM packages
│   └── gen-logo.mjs           #   Logo generation utility
│
├── cloud/                     # Cloud services (stub)
│   └── index.js               #   Marketplace, leaderboard, auth
│
└── docs/                      # Documentation
    ├── GDD.md                 #   Game Design Document v3
    ├── MVP_PLAN.md            #   Development plan
    └── STS_MECHANICS_INTEGRATION.md  #   Mechanics reference
```

---

## 🃏 Core Mechanics

| System | Description |
|---|---|
| **10-Phase Turn** | Dawn → Draw → Street Whisper → Scheme → Act → Combo → Burn → Intent → Heat Check → Dusk |
| **Influence** | Per-turn action budget (3 base, 6 max). Use it or lose it. |
| **Cards** | **Crew** (people with hidden loyalty), **Plays** (7 move types), **Dead Draws** (status cards that clog your hand) |
| **Keywords** | Block ⛨ · Connect ◆ · Flip ☠ · Hustle 💰 · Fortify 🏰 · Shadow 👻 · Rally 📢 |
| **Heat Meter** | Global escalation: Low → Warm → Hot → On Fire → Federal |
| **Enemy Intent** | Slay the Spire-style — rivals telegraph their next move so you can counter |
| **Gambits** | High-risk/reward 3rd option. Hidden stat checks. Irreversible. |
| **The Stash** | Post-level asset picks. 12 permanent buffs that stack. |
| **The Ledger** | Cross-level memory. Grudges, debts, reputation carry forward. |

---

## 🎯 Design Philosophy

> **Every turn must force the player to make a decision they feel in their gut.**

The question is never "what should I do?" — it's "what can I afford to *lose*?"

Three pillars govern all design decisions:
1. **Territory** — Geography is the board. Blocks are the unit of power.
2. **Trust** — Everyone has a visible loyalty and a hidden motive. Information costs resources.
3. **Time** — Every action costs clock ticks. The scanner ticks. Rivals move. Deliberation has a price.

---

## 🔌 AI Provider Editions

| Edition | API Key | Exclusive Content |
|---|---|---|
| Gemini Edition | `AIza...` | The Wire DLC, prismatic cards |
| Claude Edition | `sk-ant-...` | Deception Arc, extended thinking |
| GPT Edition | `sk-...` | Informant mechanic unlock |
| Kilo Edition | Free | Shareware gateway, 200 requests/day |
| Community Edition | Local/free | Community cards, open source |

---

## 🛠️ For Developers

### Creating a ROM

ROMs are self-contained game content packages. Use the template:

```bash
cp -r roms/_template roms/my-new-rom
# Edit manifest.json, add levels, world, prompts, cards
node tools/rom-validator.mjs roms/my-new-rom
```

### ROM Theme Colors

Create `assets/theme.json` in your ROM to customize the terminal palette:

```json
{
  "palette": {
    "primary": "#3498DB",
    "secondary": "#2C3E50",
    "accent": "#E74C3C",
    "surface": "#1A1A2E",
    "text": "#F2F2F2",
    "muted": "#888888"
  },
  "factions": {
    "your_faction_1": "#3498DB",
    "your_faction_2": "#E74C3C"
  },
  "ui": {
    "card_bg": "#252542",
    "card_shadow": "#0D0D0D"
  }
}
```

### Engine API

```js
import { BL0CKS } from '@bl0cks/engine';

const engine = await BL0CKS.boot('./roms/chicago', { apiKey: 'AIza...' });
const state = await engine.startLevel('01');

engine.on('turn.rendered', (state) => {
  // Render the game state
});

const nextState = await engine.sendAction('Play Darius Webb on Auburn Gresham');
```

---

## 📜 License

MIT — Fork it. Reskin it. Make it yours.

The engine is the product. The world is the canvas.

---

*Created by [Ernesto "Beats" Rodriguez](https://github.com/officebeats)*
