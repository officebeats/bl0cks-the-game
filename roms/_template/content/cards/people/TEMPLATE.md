---
# People Card Template
# Copy this file and fill in your details

type: people
id: unique_id_here
name: Character Name
version: 1.0

# Basic Stats
cost: 2              # Influence cost (0-6)
loyalty: 7           # Visible loyalty (0-10)
faction: heroes      # Faction ID
territory: capital   # Starting territory

# Keywords (comma-separated)
keywords:
  - block
  - rally
  - hustle

# Role (determines icon)
role: enforcer       # enforcer, broker, informant, runner

# Hidden Stats (AI generates these)
# visible: false = AI generates value
hidden:
  true_loyalty: ~    # AI generates if ~ (may differ from visible)
  motive: ~          # AI generates
  flip_trigger: ~    # AI generates condition
  betrayal_threshold: ~  # AI generates (0-10)

# Scenarios (choices player makes)
scenarios:
  - trigger: "appears"
    prompt: "Character wants to join your cause."
    left:
      label: "Accept"
      effect: "+1 loyalty, gains Rally keyword"
    right:
      label: "Decline"
      effect: "No change, character leaves"
    gambit:
      label: "Make them Leader"
      condition: "Hidden loyalty >= 6"
      success: "+3 loyalty, permanent ally"
      failure: "Character betrays you"

  - trigger: "combat"
    prompt: "Character is about to fight."
    left:
      label: "Hold Ground"
      effect: "Block +2, keep position"
    right:
      label: "Push Forward"
      effect: "Attack +2, take damage"

# Art (optional)
art:
  prompt: "Portrait of [name], [style]"
  style: "fantasy portrait, detailed"
  color_palette: warm

# Metadata
created_by: community
community_submitted: false
upvotes: 0
---
