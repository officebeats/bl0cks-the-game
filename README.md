# BL0CKS — The AI Strategy Card Game

> **Territory. Trust. Time.**

BL0CKS is the first strategy card game built natively on AI — powered by any major LLM provider. Set against the hyper-specific geography of Chicago's South Side, it asks players to manage alliances, information, and loyalty in a world where everyone is playing their own game.

Every character has a **visible loyalty score** and a **hidden true motive** known only to the AI. Every decision costs clock ticks. Betrayals aren't random — they're earned outcomes of your own risk tolerance.

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
```

You'll be prompted to enter an API key from any supported provider:
- **Gemini** (`AIza...`) — Recommended
- **Claude** (`sk-ant-...`)
- **OpenAI** (`sk-...`)

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
│   │   ├── levels/            #   Level definition files
│   │   ├── world/             #   Factions & territory definitions
│   │   ├── cards/             #   Card templates & custom cards
│   │   ├── prompts/           #   AI prompt files
│   │   └── assets/            #   Theme, audio, visual assets
│   └── _template/             # Starter kit for community ROMs
│
├── platforms/                 # Platform shells
│   ├── cli/                   # Terminal interface
│   │   ├── bin/bl0cks.js      #   CLI entry point
│   │   └── lib/renderer.js    #   Terminal renderer
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
| **Cards** | People (hidden loyalty), Moves (7 types), Events, Status, Intel |
| **Keywords** | Block ⛨ · Connect ◆ · Flip ☠ · Hustle 💰 · Fortify 🏰 · Shadow 👻 · Rally 📢 |
| **Heat Meter** | Global escalation: Low → Warm → Hot → On Fire → Federal |
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
