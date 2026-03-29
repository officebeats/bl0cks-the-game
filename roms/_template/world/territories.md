# {{ROM_NAME}} — Territories

**Instructions for Game Engine:** These are the locations players fight over. Each territory is a strategic node with unique properties.

---

## Territory Map

| # | Territory | Type | Starting Control | Faction Presence | Key Landmark | Resource Value |
|---|---|---|---|---|---|---|
| 1 | {{TERRITORY_1}} | Home Base | YOU ({{FACTION_1}}) | Strong | {{LANDMARK}} | ★★★ |
| 2 | {{TERRITORY_2}} | Rival Stronghold | {{FACTION_2}} | Strong | {{LANDMARK}} | ★★★ |
| 3 | {{TERRITORY_3}} | Contested | Split (Mixed) | Tense | {{LANDMARK}} | ★★ |
| 4 | {{TERRITORY_4}} | Neutral | None | Quiet | {{LANDMARK}} | ★ |
| 5 | {{TERRITORY_5}} | Rival Outpost | {{FACTION_3}} | Moderate | {{LANDMARK}} | ★★ |
| 6 | {{TERRITORY_6}} | Expansion | Uncontrolled | Sparse | {{LANDMARK}} | ★ |

---

## Territory Details

### {{TERRITORY_1}} — Home Base
<!-- Describe this territory in 2-3 sentences. What does it look like? Feel like? -->
- **Adjacent to:** {{TERRITORY_3}}, {{TERRITORY_4}}
- **Strategic value:** Safe haven. TAX here generates bonus resources.
- **Vulnerability:** If lost, player loses -2 Influence per turn (morale collapse)
- **Landmark:** {{LANDMARK}} — <!-- What's iconic about this place? -->

### {{TERRITORY_2}} — Rival Stronghold
<!-- The enemy's home turf. Hard to take, valuable to hold. -->
- **Adjacent to:** {{TERRITORY_3}}, {{TERRITORY_5}}
- **Strategic value:** Capturing this cripples {{FACTION_2}}'s economy
- **Defenses:** +3 Block Points for {{FACTION_2}} when defending here
- **Landmark:** {{LANDMARK}}

### {{TERRITORY_3}} — Contested Zone
<!-- The flashpoint. This is where most early conflicts happen. -->
- **Adjacent to:** {{TERRITORY_1}}, {{TERRITORY_2}}, {{TERRITORY_6}}
- **Strategic value:** Controls access between home base and rival territory
- **Instability:** Control changes hands more easily here (-1 to defender's Block Points)
- **Landmark:** {{LANDMARK}}

### {{TERRITORY_4}} — Neutral Ground
<!-- Quiet, but strategically useful. Easy to take, low reward. -->
- **Adjacent to:** {{TERRITORY_1}}, {{TERRITORY_6}}
- **Strategic value:** Low resources but no combat needed to claim
- **Special:** {{NEUTRAL_FORCE}} has permanent presence here
- **Landmark:** {{LANDMARK}}

### {{TERRITORY_5}} — Rival Outpost
<!-- Secondary rival territory. Less defended than the stronghold. -->
- **Adjacent to:** {{TERRITORY_2}}, {{TERRITORY_6}}
- **Strategic value:** Flanking position. Taking this isolates {{FACTION_2}}
- **Defenses:** Moderate — {{FACTION_3}} has informants here
- **Landmark:** {{LANDMARK}}

### {{TERRITORY_6}} — Expansion Zone
<!-- Unclaimed territory. First to move wins. -->
- **Adjacent to:** {{TERRITORY_3}}, {{TERRITORY_4}}, {{TERRITORY_5}}
- **Strategic value:** Connects to multiple territories (hub)
- **Risk:** High Heat generation when contested (everyone notices expansion)
- **Landmark:** {{LANDMARK}}

---

## Territory Rules

- **Adjacency matters:** WAR can only target territories adjacent to one you control
- **Controlling 3+ territories:** TAX generates double resources (powered condition)
- **Contested territories:** Change hands more easily during WAR (-1 defender Block Points)
- **Neutral territories:** Can be claimed without combat (just deploy a People Card) but generate fewer resources
- **Losing your home base:** -2 Influence per turn until recaptured

## Map Layout (ASCII)
<!-- Optional: Draw a simple adjacency map -->
```
    [{{TERRITORY_1}}]────[{{TERRITORY_3}}]────[{{TERRITORY_2}}]
         │                    │                    │
    [{{TERRITORY_4}}]────[{{TERRITORY_6}}]────[{{TERRITORY_5}}]
```
