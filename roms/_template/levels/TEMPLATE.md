---
# Level Template
# Each level is a self-contained game scenario

level: 01
title: "Level Title"
subtitle: "Optional Subtitle"
version: 1.0

# Difficulty
difficulty: easy      # tutorial, easy, medium, hard, boss
act: 1                 # Which act (determines Heat scaling)
order: 1               # Order within act

# Territory Setup
territories:
  - id: starting_territory
    control: player
    initial_cards: 2
    
  - id: enemy_territory_1
    control: npc
    faction: villains
    initial_cards: 3
    
# NPCs
npcs:
  count: 4             # Number of NPC cards
  factions: [heroes, villains]
  hidden_ratio: 0.3    # 30% of stats hidden
  
# Resources
resources:
  influence: 3
  intel: 2
  heat: 0              # Starting heat
  
# Clock
clock:
  total: 12            # Total ticks available
  tick_rate: 1         # Ticks consumed per action
  
# Heat Mechanics
heat:
  gain_per_turn: 1
  thresholds:
    warm: 5
    hot: 10
    fire: 15
    
# Win/Loss Conditions
conditions:
  win:
    - type: control_territories
      count: 3
      duration: 1
  loss:
    - type: territories_zero
    - type: heat_max
    - type: clock_zero

# Events
events:
  - type: story
    trigger: start
    narration: "Welcome to this level..."
    
  - type: random
    chance: 0.2        # 20% per turn
    pool: common_events
    
# Special Rules
special_rules:
  - "War costs +1 influence in this level"
  - "All NPCs start with -2 loyalty"
  
# Rewards
rewards:
  on_complete:
    stash: true
    heat_reduction: 2
    progress: 1
---
