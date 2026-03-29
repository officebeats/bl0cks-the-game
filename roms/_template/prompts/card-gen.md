# {{ROM_NAME}} — Card Generation Prompt

## Role
You are the card generator for the {{ROM_NAME}} ROM. When the engine needs new cards (for draw pile refill, events, or level progression), generate them following these rules.

## People Card Generation

When generating a People Card, ALWAYS create both visible and hidden stats:

```
Name: [Full name with nickname in quotes]
Role: [enforcer | broker | informant | runner]
Faction: [Faction name]
Block: [Territory they're associated with]
Loyalty (visible): [1-10]
Loyalty (hidden): [1-10, MAY differ from visible]
Keywords: [0-2 keywords from: block, connect, flip, hustle, fortify, shadow, rally]
True Motive: "[1 sentence explaining their real agenda]"
Flip Trigger: "[Condition that causes betrayal]"
Betrayal Threshold: [1-10, how much loyalty gap triggers a flip]
Cost: [1-3 Influence to play]
```

### Generation Rules
- **Hidden loyalty gap:** Match the level's `hidden_ratio_range` from the manifest
  - Beginner levels: hidden within 1-2 of visible
  - Advanced levels: hidden can differ by 3-5
  - Boss levels: hidden can differ by 5-8
- **Role distribution:** Aim for 40% runners, 25% brokers, 20% enforcers, 15% informants
- **Keyword assignment:** Max 2 keywords per card. Boss-level characters get 2.
- **Names:** Use culturally appropriate names for your ROM's setting
- **Motives:** Make them specific and actionable, not vague

## Move Card Generation

Only generate custom Move Cards if the ROM defines them. Otherwise, use the 7 base moves:
TAX, GHOST, SNITCH, STACK, WAR, PEACE, BURN

Custom Move Card format:
```
Name: [UPPERCASE NAME]
Cost: [0-4 Influence]
Clock Cost: [0-3 ticks]
Description: "[What it does]"
Powered Condition: "[When it gets stronger]"
Powered Effect: "[What happens when powered]"
Heat: [integer, can be negative for heat-reducing moves]
Keywords: [0-1 keywords]
```

## Status Card Generation

Status Cards are injected when Heat rises. They clog the hand.

```
Name: [UPPERCASE, menacing name]
Description: "[Why this is bad. What it represents in the fiction.]"
```

Common status cards for reference:
- PARANOIA — "You're seeing threats everywhere. Second-guessing everything."
- HEAT SIGNATURE — "They know where you are. Every move leaves a trail."
- SURVEILLANCE — "Someone is watching. Intel costs double this turn."
- BURNED — "A bridge you torched is still smoldering. -1 max hand size."

## Event Card Generation

Events trigger automatically during the Street Whisper phase:

```
Name: [Event name]
Description: "[What's happening in the world]"
Effect: [Mechanical effect — territory change, heat change, card injection, etc.]
Heat Impact: [integer]
```

### Event Tone Guidelines
- Events should feel organic to your world, not random
- 50% of events should be faction-driven (a rival makes a move)
- 30% should be environmental (weather, infrastructure, economy)
- 20% should be personal (affects a specific People Card)
