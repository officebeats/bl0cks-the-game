---
# Companion Template (v4.0)
# Summonable allies that fight alongside you

type: companion
id: unique_id_here
name: Companion Name
version: 1.0

# Stats
hp: 15              # Starting/max HP
attack: 3           # Damage dealt at end of turn
block_per_turn: 2   # Block generated automatically

# Special Ability
special: "Absorbs first hit each turn"  # One-line description
ability:
  type: damage_absorb   # damage_absorb, regeneration, buff_aura, sacrifice
  value: 1              # Depends on type
  trigger: start_of_turn

# Keywords
keywords:
  - tank              # Can absorb damage
  - regeneration      # Heals over time
  - aggressive        # High attack, low HP

# Spawn Conditions
spawn:
  type: card_play     # card_play, event, quest, asset, manual
  trigger: "First Intel played"
  card_types: [intel]
  
# Despawn Conditions
despawn:
  type: hp_zero       # hp_zero, level_end, manual, duration
  message: "Companion has fallen."

# Persistence
persistence: act       # combat, level, act, permanent

# Synergies
synergies:
  - card_keyword: rally
    effect: "Companion gains +1 attack per ally"
  - companion_keyword: tank
    effect: "Block also applies to allies"

# Art
art:
  style: companion_portrait
  color: warm
  
# Narration
narration:
  on_spawn: "A companion joins your side!"
  on_attack: "[Name] attacks!"
  on_absorb: "[Name] takes the blow!"
  on_death: "[Name] falls..."
---
