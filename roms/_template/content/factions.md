# Factions

Factions are the teams/sides in your game. Players can belong to factions, control territories for factions, or fight against factions.

## Format

```markdown
| ID | Name | Color | Trait | Starting Attitude |
|----|------|-------|-------|-------------------|
| id | Display Name | hex | trait_name | friendly/hostile/neutral |
```

## Example

```markdown
| ID | Name | Color | Trait | Starting Attitude |
|----|------|-------|-------|-------------------|
| heroes | Heroes | #00ff00 | defensive | friendly |
| villains | Villains | #ff0000 | aggressive | hostile |
| merchants | Merchants | #ffd700 | neutral | neutral |
```

## Faction Traits

| Trait | Effect |
|-------|--------|
| defensive | +1 block when defending |
| aggressive | +1 attack damage |
| political | Better at alliances |
| economic | More resources from tax |
| stealth | Can use shadow moves |
| chaotic | Random event frequency +50% |

## Faction Relationships

```markdown
# faction_relationships.md

relationships:
  heroes:
    allies: [merchants]
    enemies: [villains]
    
  villains:
    allies: []
    enemies: [heroes, merchants]
    
  merchants:
    allies: [heroes]
    enemies: []
    trades_with: [villains]  # Can trade but not ally
```

## Complete Example

```markdown
# Factions for My World

| ID | Name | Color | Trait | Starting Attitude |
|----|------|-------|-------|-------------------|
| phoenix | Phoenix Guard | #ff4500 | defensive | friendly |
| shadow | Shadow Clan | #4b0082 | stealth | hostile |
| guild | Trade Guild | #daa520 | economic | neutral |
| crown | The Crown | #c0c0c0 | political | neutral |

## Relationships

- Phoenix Guard and Shadow Clan are eternal enemies
- Trade Guild works with whoever controls territories
- The Crown provides neutral events
```
