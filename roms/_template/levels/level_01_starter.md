# {{ROM_NAME}} — Level 1: {{LEVEL_NAME}}

## Parameters
- Clock: 12
- StartingInfluence: 3
- StartingHeat: 0
- Territory: {{TERRITORY_1}}, {{TERRITORY_2}}, {{TERRITORY_3}}, {{TERRITORY_4}}, {{TERRITORY_5}}, {{TERRITORY_6}}
- Factions: {{FACTION_1}}, {{FACTION_2}}, {{FACTION_3}}, {{NEUTRAL_FORCE}}
- Difficulty: Beginner

## Narrative Hook
<!-- Write 2-4 sentences that set the scene. What's happening RIGHT NOW? 
     Make it immediate and concrete — not backstory, but present tense. -->

{{OPENING_NARRATIVE}}

## Starting Hand

### People Cards
1. **{{CHARACTER_1}}**
   - Role: Broker
   - Faction: {{FACTION_1}}
   - Block: {{TERRITORY_1}}
   - Visible Loyalty: 7/10
   - Hidden Loyalty: 5/10
   - Keywords: Connect
   - True Motive: "{{HIDDEN_MOTIVE}}"
   - Flip Trigger: "If {{TERRITORY_1}} is attacked while they're deployed"
   - Betrayal Threshold: 3

2. **{{CHARACTER_2}}**
   - Role: Enforcer
   - Faction: {{FACTION_1}}
   - Block: {{TERRITORY_1}}
   - Visible Loyalty: 5/10
   - Hidden Loyalty: 8/10
   - Keywords: Block
   - True Motive: "{{HIDDEN_MOTIVE}}"
   - Flip Trigger: "Never — this one's solid"
   - Betrayal Threshold: 8

### Move Cards
3. **TAX** — Collect resources from a controlled block.
4. **WAR** — Challenge a rival block for control.

## Special Rules
<!-- Optional: Level-specific rule overrides. Delete this section if using defaults. -->
- None (standard rules apply)

## AI Card Generation
<!-- Tell the AI what kinds of cards to generate as the player draws -->
- New People Cards should be drawn from {{FACTION_1}} and neutral pools
- Hidden loyalty gap: 1-3 points (beginner-friendly)
- Keyword distribution: 50% Connect, 25% Block, 25% no keyword

## ⚡ Opening Event
**EVENT: {{EVENT_NAME}}**
"{{OPENING_NARRATIVE}}"

## Win Conditions
- Control {{TERRITORY_3}} before the Clock expires
- At least 1 People Card with loyalty ≥ 6 remaining in hand

## Loss Conditions
- Clock expires without controlling {{TERRITORY_3}}
- Lose {{TERRITORY_1}} (home base falls)
- Heat reaches Federal threshold (18+)

## Post-Level
<!-- What happens after the player wins this level? -->
- Proceed to The Stash (choose 1 of 3 Assets)
- Ledger updates: grudge if {{FACTION_2}} lost territory, debt if PEACE was used
- Advance to Level 2
