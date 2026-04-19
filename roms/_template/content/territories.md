# Territories

Territories are the locations on your game board. Each territory can be controlled by factions and affects gameplay.

## Format

```markdown
| ID | Name | Faction | Type | Starting Control |
|----|------|---------|------|-----------------|
| id | Display Name | owner | start/boss/elite | player/npc/neutral |
```

## Example

```markdown
| ID | Name | Faction | Type | Starting Control |
|----|------|---------|------|-----------------|
| base_camp | Base Camp | neutral | start | player |
| forest | Dark Forest | villains | elite | npc |
| fortress | Enemy Fortress | villains | boss | npc |
```

## Territory Types

| Type | Description |
|------|-------------|
| start | Starting territory for player |
| normal | Standard gameplay territory |
| elite | Contains elite enemies |
| boss | Boss encounter location |
| neutral | No controlling faction |

## Territory Properties

Each territory can have these optional properties:

```markdown
# territory_config.md

territories:
  base_camp:
    name: "Base Camp"
    faction: neutral
    type: start
    control: player
    adjacent: [forest, village]  # Connected territories
    value: 10  # Strategic value
    defense_bonus: 0  # Extra defense when controlled
```

## Complete Example

```markdown
# Territories for My World

| ID | Name | Faction | Type | Starting Control | Adjacent |
|----|------|---------|------|-----------------|----------|
| capital | Capital City | heroes | start | player | [village, forest] |
| village | Peaceful Village | neutral | normal | player | [capital, mountains] |
| forest | Dark Forest | villains | elite | npc | [capital, fortress] |
| mountains | Mountain Pass | neutral | normal | neutral | [village, fortress] |
| fortress | Enemy Fortress | villains | boss | npc | [forest, mountains] |
```
