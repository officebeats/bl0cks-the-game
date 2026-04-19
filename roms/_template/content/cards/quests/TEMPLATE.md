---
# Quest Card Template (v4.0)
# Unplayable cards that provide objectives with rewards

type: quest
id: unique_id_here
name: Quest Name
version: 1.0

# Quest Rules
playable: false       # Cannot be played, sits in hand
counts_toward_limit: true  # Counts toward hand size limit

# Objective
condition:
  type: maintain_stat      # maintain_stat, reach_stat, perform_action, survive
  stat: loyalty            # loyalty, territories, heat, custom
  target: 5                # Target value
  metric: min_all          # min_all, max_all, sum, count
  duration: until_level_end # until_level_end, permanent, X_turns
  
# Rewards (player chooses one)
rewards:
  - type: asset_unlock
    asset: new_asset_id
  - type: influence_boost
    amount: 2
    duration: next_turn
  - type: card_upgrade
    keyword: block
    value: +1

# Failure Penalty
failure:
  type: status_card
  card: paranoia
  count: 2

# Visual
visual:
  style: scroll
  color: gold
  
# Narration
narration:
  on_draw: "A new quest appears..."
  on_complete: "Quest complete! Choose your reward."
  on_fail: "Quest failed. You face consequences."
---
