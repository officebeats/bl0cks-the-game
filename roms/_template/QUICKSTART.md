# BL0CKS ROM Quickstart Guide

## Build Your Own Game in 5 Minutes

This template contains everything you need to create a complete, playable BL0CKS ROM (game content package).

---

## Step 1: Name Your World

Edit `rom.json` with your game details:

```json
{
  "id": "my_world",
  "name": "My Awesome World",
  "author": "Your Name"
}
```

---

## Step 2: Define Your Territories

Edit `content/territories.md`:

```markdown
# Territories

| ID | Name | Faction | Type |
|----|------|---------|------|
| base_camp | Base Camp | neutral | start |
| enemy_hq | Enemy HQ | villains | boss |
```

---

## Step 3: Create Factions

Edit `content/factions.md`:

```markdown
# Factions

| ID | Name | Color | Trait |
|----|------|-------|-------|
| heroes | Heroes | #00ff00 | defensive |
| villains | Villains | #ff0000 | aggressive |
```

---

## Step 4: Design Your First Cards

Create `content/cards/people/my_first_character.md`:

```markdown
---
type: people
name: "Sample Hero"
cost: 2
loyalty: 7
faction: heroes
keywords: [block]
---

A simple hero card for demonstration.

## Scenario

Sample Hero wants to join your cause.
They offer their loyalty in exchange for protection.

- Accept: +1 loyalty, gains Rally keyword
- Deny: No change
- Gambit: Offer them leadership (+3 loyalty, becomes permanent ally)
```

---

## Step 5: Create Your First Level

Create `levels/level_01_intro.md`:

```markdown
---
level: 01
title: "The Beginning"
difficulty: easy
territories: [base_camp]
enemies: 2
clock_ticks: 12
---

## Story

Welcome to my world! Your journey begins here.

## Win Condition

Control base_camp for 3 turns.

## Loss Condition

Lose all territories.
```

---

## Step 6: Run Your ROM

```bash
npm run play --rom=my_world
```

---

## File Structure

```
roms/_template/
├── rom.json              # ROM metadata
├── QUICKSTART.md         # This guide
├── content/
│   ├── territories.md    # Board locations
│   ├── factions.md       # Teams/sides
│   ├── cards/           # All card types
│   ├── companions/       # Summonable allies
│   └── enchantments/     # Card modifications
├── levels/              # Level definitions
├── prompts/             # AI instructions
└── config/             # Game rules
```

---

## What's Included

### Card Types
- **People Cards**: Characters with loyalty and keywords
- **Move Cards**: Actions like attack, defend, special moves
- **Event Cards**: Random events that affect gameplay
- **Quest Cards**: Objectives with rewards (v4.0)

### v4.0 Features
- Companions (summonable allies with HP)
- Quests (objective-based rewards)
- Asset Forging (upgrade relics)
- Enchantments (modify cards)
- Dynamic Intent (AI adapts to you)
- Multi-Phase Bosses

---

## Need Help?

- Check `docs/ROM_SPEC.md` for full specification
- Look at `roms/chicago/` for a complete example
- Join our Discord for community support
