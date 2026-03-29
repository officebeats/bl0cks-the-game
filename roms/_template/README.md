# 🎮 {{ROM_NAME}} — BL0CKS Community ROM

> Built with the [BL0CKS Engine v2](https://github.com/officebeats/bl0cks-the-game)

## About

{{ROM_DESCRIPTION}}

**Author:** {{AUTHOR_NAME}}
**Estimated Playtime:** ~30 minutes per level
**Difficulty:** Beginner → ★★★★★ (Boss)

---

## Quick Start

### 1. Copy this template
```bash
cp -r roms/_template roms/my-rom-name
cd roms/my-rom-name
```

### 2. Replace all `{{PLACEHOLDER}}` values
Every file in this template contains `{{PLACEHOLDER}}` tokens. Search and replace them with your content. Here's the full list:

| Placeholder | Where | What It Is |
|---|---|---|
| `{{ROM_ID}}` | manifest.json | Unique kebab-case identifier (e.g., `dystopia-nyc`) |
| `{{ROM_NAME}}` | Everywhere | Display name (e.g., `Dystopia: NYC`) |
| `{{ROM_DESCRIPTION}}` | manifest.json, README | One-line pitch |
| `{{AUTHOR_NAME}}` | manifest.json, README | Your name/handle |
| `{{BADGE_LABEL}}` | manifest.json | Short label for HUD badge (e.g., `NYC`) |
| `{{TAGLINE}}` | manifest.json | 3-5 word tagline |
| `{{FACTION_1-4}}` | world/, levels/ | Your faction names |
| `{{TERRITORY_1-6}}` | world/, levels/ | Your territory/block names |
| `{{CHARACTER_1-3}}` | levels/ | Starting hand character names |
| `{{LEVEL_NAME}}` | manifest.json, levels/ | Level display names |
| `{{HIDDEN_MOTIVE}}` | levels/ | Character hidden motives |
| `{{EVENT_NAME}}` | levels/ | Opening event names |
| `{{OPENING_NARRATIVE}}` | levels/ | Opening narrative text |
| `{{LANDMARK}}` | world/territories | Key landmarks per territory |

### 3. Validate your ROM
```bash
node tools/rom-validator.mjs roms/my-rom-name
# or
bl0cks rom validate roms/my-rom-name
```

### 4. Test locally
```bash
bl0cks play my-rom-name
```

### 5. Publish
```bash
bl0cks market publish roms/my-rom-name
```

---

## File Structure

```
my-rom/
├── manifest.json              ← ROM metadata, level list, AI requirements
├── README.md                  ← This file (your ROM's README)
│
├── world/                     ← World-building (factions + map)
│   ├── factions.md            ← 3-4 factions with mechanical hooks
│   └── territories.md         ← 4-6 territory definitions
│
├── levels/                    ← Playable levels
│   ├── level_00_tutorial.md   ← Optional tutorial (recommended)
│   ├── level_01_starter.md    ← First real level
│   └── level_02_*.md          ← Add as many as you want
│
├── cards/                     ← Card definitions
│   ├── templates/             ← People/Move card templates
│   │   └── starter_cards.md   ← Pre-built card pool
│   └── custom/                ← ROM-specific custom cards
│
├── prompts/                   ← AI behavior
│   ├── system.md              ← Engine rules (how the AI runs the game)
│   ├── narrator.md            ← Voice and tone (how the AI tells the story)
│   └── card-gen.md            ← How the AI generates cards mid-game
│
└── assets/                    ← Visual identity
    └── theme.json             ← Color palette for CLI/web rendering
```

---

## Design Tips

### Factions (3-5 recommended)
- Each faction needs a **unique mechanical hook** — e.g., one faction specializes in betrayal, another in economic dominance
- Include exactly ONE neutral/environmental force that can't be defeated (police, nature, corporate, etc)
- Define how each faction's NPCs behave when their hidden loyalty diverges from visible

### Territories (4-6 recommended)
- 6 territories is the sweet spot for 20-minute sessions
- Mix starting, rival, contested, and neutral territories
- Give each territory a landmark that makes it memorable

### Levels
- **Level structure:** Parameters → Narrative Hook → Starting Hand → Special Rules → Win/Loss
- **Clock:** 10-14 ticks per level. Lower = harder
- **Starting Heat:** 0 for early levels, 3-6 for mid-game, 6+ for boss
- **Hidden loyalty gap:** Beginner = 1-2 points divergence. Boss = 4-8 points
- **Gambit chance:** 40% default, 60%+ for deception-focused levels, 100% for boss

### Cards
- **People Cards:** Always define visible AND hidden loyalty. The gap IS the game.
- **Keywords:** Use the 7 built-in keywords: Block ⛨, Connect ◆, Flip ☠, Hustle 💰, Fortify 🏰, Shadow 👻, Rally 📢
- **Move Cards:** The 7 base moves (TAX/GHOST/SNITCH/STACK/WAR/PEACE/BURN) are always available. Add custom moves sparingly.

### Narrator
- The more specific your narrator prompt, the better the AI voice
- Ground narration in concrete sensory details from YOUR world
- Tell the AI how to handle betrayal reveals, combat, and quiet moments

---

## Engine Mechanics Reference

Your ROM runs on the BL0CKS v2 engine. These systems are automatic:

| System | Description |
|---|---|
| **10-Phase Turn** | Dawn → Draw → Street Whisper → Scheme → Act → Combo → Burn → Intent → Heat Check → Dusk |
| **Influence** | 3 base per turn (6 max). Use it or lose it. |
| **Heat Meter** | 0-20 scale: Low → Warm → Hot → On Fire → Federal |
| **Keywords** | 7 combo-able keywords on People + Move cards |
| **Gambits** | High-risk 3rd option on People Card decisions (40% default) |
| **The Stash** | 12 permanent assets offered between levels |
| **The Ledger** | Grudges, debts, reputation carry forward across levels |
| **Scoring** | Territory + Tempo + Trust + Risk = Letter Grade (S → F) |

See [ROM_SPEC.md](../../docs/ROM_SPEC.md) for the full specification.
