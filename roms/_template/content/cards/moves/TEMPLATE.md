---
# Move Card Template
# Actions players can take

type: move
id: unique_id_here
name: Move Name
version: 1.0

# Basic Stats
cost: 1              # Influence cost (0-6)
category: action     # action, attack, defense, utility

# Base Effect
effect:
  type: generate_resource
  amount: 1
  resource: influence
  
# Powered Effect (when conditions met)
powered:
  condition: "control_3_territories"
  effect:
    type: generate_resource
    amount: 3
    resource: influence
  bonus: "+1 influence next turn"

# Keywords
keywords:
  - echo           # Card replays next turn
  - momentum       # Costs less each turn played

# Timing
timing:
  phase: act       # dawn, draw, act, combo, burn
  priority: 1       # Lower = earlier

# Requirements
requires:
  territory: any   # any, controlled, contested, enemy
  min_territories: 0
  faction: null    # null = any, or specific faction

# Effects on other cards
combos:
  - keyword: block
    effect: "+2 bonus block"
  - keyword: rally
    effect: "All allies +1 loyalty"

# Heat generated (negative = reduces heat)
heat: 0

# Clock cost
clock_cost: 1

# Narration
narration:
  on_play: "You [action]..."
  on_powered: "Your power grows! You [enhanced action]..."
  on_combo: "Combined force! [combo effect]..."
---
