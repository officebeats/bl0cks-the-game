# ROM Specification — BL0CKS v2

> Version: 1.0 | Engine: 2.0.0+

A **ROM** (Read-Only Module) is a self-contained game content package that the BL0CKS engine loads at boot. ROMs define the world, levels, factions, cards, prompts, and visual theme — the engine handles all game logic.

---

## Directory Structure

```
my-rom/
├── manifest.json          # Required: ROM metadata and file references
├── levels/                # Required: Level definition files (.md)
│   ├── level_01.md
│   └── level_02.md
├── world/                 # Required: World-building files
│   ├── factions.md        # Faction definitions
│   └── territories.md    # Territory/block layout
├── prompts/               # Required: AI prompt files
│   ├── system.md          # System prompt (injected first)
│   └── narrator.md        # Narrator voice/tone override
├── cards/                 # Optional: Card templates
│   ├── templates/         # People/Move card definitions
│   └── custom/            # ROM-specific custom cards
└── assets/                # Optional: Visual and audio assets
    ├── theme.json         # Color palette and UI overrides
    └── audio/             # Audio file references
```

---

## manifest.json Schema

```json
{
  "$schema": "https://bl0cks.game/schemas/rom-manifest-v1.json",
  "format_version": 1,
  "version": "1.0.0",

  "id": "unique-rom-id",
  "name": "Display Name",
  "description": "Short description of the ROM.",
  "author": "Author Name",
  "license": "MIT",
  "tags": ["strategy", "urban"],

  "engine": {
    "min_version": "2.0.0",
    "max_version": "3.x"
  },

  "extends": null,

  "world": {
    "factions": "world/factions.md",
    "territories": "world/territories.md"
  },

  "levels": [
    { "id": "01", "file": "levels/level_01.md", "type": "standard", "name": "Level Name" }
  ],

  "prompts": {
    "system": "prompts/system.md",
    "narrator": "prompts/narrator.md"
  },

  "cards": {
    "templates_dir": "cards/templates/",
    "custom_dir": "cards/custom/"
  },

  "assets": {
    "theme": "assets/theme.json"
  },

  "ai": {
    "min_tier": "silver",
    "recommended_tier": "platinum",
    "required_capabilities": ["chat", "system_instruction"],
    "context_budget": 32000
  },

  "difficulty": {
    "estimated_playtime_minutes": 60,
    "level_count": 3,
    "hidden_ratio_range": [0.2, 0.8],
    "recommended_experience": "beginner"
  },

  "branding": {
    "badge_icon": "🎮",
    "badge_label": "ROM NAME",
    "accent_color": "#C0392B",
    "credit_line": "by Author",
    "splash_tagline": "Your tagline here."
  }
}
```

### Key Fields

| Field | Required | Description |
|---|---|---|
| `id` | ✅ | Unique identifier (kebab-case) |
| `name` | ✅ | Display name shown in menus |
| `extends` | ❌ | ID of base ROM this extends (for DLC/overlays) |
| `levels[]` | ✅ | Array of level definitions |
| `levels[].type` | ✅ | `tutorial`, `standard`, or `boss` |
| `ai.min_tier` | ❌ | Minimum AI provider tier (`free`, `silver`, `gold`, `platinum`) |
| `ai.context_budget` | ❌ | Maximum tokens the system prompt should consume |
| `branding` | ❌ | Visual identity for HUD badges and splash screen |

---

## Level File Format (.md)

Levels are Markdown files with structured sections:

```markdown
# Level 01 — The Corner

## Parameters
- Clock: 12
- StartingInfluence: 3
- StartingHeat: 0
- Territory: Auburn Gresham, Woodlawn
- Factions: The Governors, The Lords
- Difficulty: Beginner

## Narrative Hook
[Free-form text describing the opening scenario]

## Starting Hand
- People: Name (Role, Loyalty X, Hidden: Y)
- Move: CARD_NAME
- Status: STATUS_NAME

## Special Rules
[Optional level-specific rule overrides]

## Win Conditions
- Condition 1
- Condition 2

## Loss Conditions
- Condition 1
- Condition 2
```

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `Clock` | int | Total turn clock ticks for this level |
| `StartingInfluence` | int | Influence at level start (default: 3) |
| `StartingHeat` | int | Heat at level start (default: 0) |
| `Territory` | string | Comma-separated territory names |
| `Factions` | string | Comma-separated faction names |
| `Difficulty` | string | Beginner, Intermediate, Hard, Boss |

### Starting Hand Format

```
- People: Name (Role, Loyalty X, Hidden: Y)
```
- `Role`: enforcer, broker, informant, runner
- `Loyalty X`: Visible loyalty (0-10)
- `Hidden: Y`: True hidden loyalty (0-10)

---

## DLC / Overlay ROMs

An overlay ROM **extends** a base ROM. Set `"extends": "base-rom-id"` in the manifest.

### Merge Rules

| Content | Behavior |
|---|---|
| Levels | **Appended** to base level list |
| Prompts | **Replaced** key-by-key (e.g., narrator override) |
| World | **Replaced** if declared (full swap) |
| Cards | **Merged** into base card pool |
| Theme | **Replaced** during DLC play |
| Branding | **Replaced** — DLC badge shown in HUD |

### Loading an Overlay

```bash
# CLI
bl0cks play chicago --overlay deception-arc

# Engine API
const engine = await BL0CKS.boot('./roms/chicago', {
  apiKey: '...',
  overlays: ['deception-arc']
});
```

---

## Validation

Use the ROM validator to check your package:

```bash
node tools/rom-validator.mjs roms/my-rom
```

Or from the CLI:
```bash
bl0cks rom validate roms/my-rom
```

---

## Quick Start Template

Copy `roms/_template` and modify:

```bash
cp -r roms/_template roms/my-new-rom
# Edit manifest.json
# Add levels, world, prompts
node tools/rom-validator.mjs roms/my-new-rom
```
