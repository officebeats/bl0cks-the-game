# {{ROM_NAME}} — Starter Card Pool

## People Card Templates

These templates define the initial pool of characters the AI can draw from.
The AI will use these as a base and generate variations.

---

### {{CHARACTER_1}} — The Broker
- Role: Broker
- Faction: {{FACTION_1}}
- Block: {{TERRITORY_1}}
- Loyalty (visible): 7
- Loyalty (hidden): 5
- Keywords: Connect, Hustle
- True Motive: "{{HIDDEN_MOTIVE}}"
- Flip Trigger: "If home territory is lost while they're in hand"
- Betrayal Threshold: 3
- Cost: 1

### {{CHARACTER_2}} — The Enforcer
- Role: Enforcer
- Faction: {{FACTION_1}}
- Block: {{TERRITORY_1}}
- Loyalty (visible): 5
- Loyalty (hidden): 8
- Keywords: Block
- True Motive: "{{HIDDEN_MOTIVE}}"
- Flip Trigger: "Never — this one's a soldier"
- Betrayal Threshold: 8
- Cost: 2

### {{CHARACTER_3}} — The Informant
- Role: Informant
- Faction: Neutral
- Block: {{TERRITORY_4}}
- Loyalty (visible): 6
- Loyalty (hidden): 4
- Keywords: Connect
- True Motive: "Selling information to whoever pays. No allegiance."
- Flip Trigger: "If SNITCH is played on them"
- Betrayal Threshold: 4
- Cost: 1

### Rival Enforcer — {{FACTION_2}}
- Role: Enforcer
- Faction: {{FACTION_2}}
- Block: {{TERRITORY_2}}
- Loyalty (visible): 8
- Loyalty (hidden): 7
- Keywords: Block, Fortify
- True Motive: "Loyal to the cause. Will defend territory to the end."
- Flip Trigger: "If their faction leader is killed"
- Betrayal Threshold: 9
- Cost: 2

### Rival Broker — {{FACTION_3}}
- Role: Broker
- Faction: {{FACTION_3}}
- Block: {{TERRITORY_5}}
- Loyalty (visible): 9
- Loyalty (hidden): 3
- Keywords: Shadow
- True Motive: "Working for {{FACTION_3}} but planning a personal exit. Will sell out anyone."
- Flip Trigger: "If offered PEACE"
- Betrayal Threshold: 2
- Cost: 1

### Street Runner — Neutral
- Role: Runner
- Faction: Neutral
- Block: {{TERRITORY_6}}
- Loyalty (visible): 4
- Loyalty (hidden): 6
- Keywords: Hustle
- True Motive: "Just trying to eat. Will follow strength."
- Flip Trigger: "If your faction controls 0 territories"
- Betrayal Threshold: 5
- Cost: 1

---

## Move Card Templates

The 7 base Move Cards are built into the engine. These are always available:

| Move | Cost | Clock | Effect |
|---|---|---|---|
| **TAX** | 1 | 1 | Collect from a block. Powered: 3+ blocks = all. |
| **GHOST** | 0 | 0 | Leave a block. Powered: 0 status = silent. |
| **SNITCH** | 2 | 2 | Reveal 1 hidden stat. Powered: loyalty ≤4 = all. |
| **STACK** | 2 | 2 | +2 Block Points. Powered: Enforcer = +4. |
| **WAR** | 3 | 1 | Attack. Powered: consecutive = Blitz (cost 2). |
| **PEACE** | 1 | 1 | Alliance (3 turns). Powered: both ≥7 = 5 turns. |
| **BURN** | 0 | 0 | Exhaust card. Powered: Status = +1 Influence. |

### Custom Move Cards (Optional)
<!-- Add ROM-specific Move Cards here if you want. Delete if using defaults. -->

---

## Status Card Templates

Status Cards are injected by the engine when Heat rises. Customize to fit your world:

### PARANOIA
- Description: "You're second-guessing every move. Trust is a luxury you can't afford."

### HEAT SIGNATURE
- Description: "They know you're here. Every action leaves footprints."

### SURVEILLANCE
- Description: "Eyes everywhere. Intel costs are doubled this turn."

### {{CUSTOM_STATUS}}
<!-- Add a status card specific to your world -->
- Description: "{{STATUS_DESCRIPTION}}"
