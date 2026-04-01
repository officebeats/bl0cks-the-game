# Requirements

## Active Milestone: v1.1 Mechanics & Map Overhaul

### Engine
- [ ] **ENG-01**: Expand Engine state to track player `influence` (energy equivalent).
- [ ] **ENG-02**: Enforce card play validation based on current `influence` budget vs card cost.
- [ ] **ENG-03**: Support explicit Turn Phases (Draw, Play, Resolve, Enemy Intent).
- [ ] **ENG-04**: Parse LLM responses for predictive enemy intents (e.g. Next Turn: Attack 5, Block 3).

### UI/Renderer
- [ ] **RND-01**: Render enemy intents distinctly above or next to the enemy representations.
- [ ] **RND-02**: Overhaul the `board` screen to render a node-based geographic map instead of a 3x2 grid.
- [ ] **RND-03**: Display current/max Influence points boldly in the player's status bar.

### Content/ROM Data
- [ ] **ROM-01**: Update CHICAGO manifest and level themes to structure AI generation toward defining discrete intents instead of passive flavor text.
- [ ] **ROM-02**: Add numeric `cost` field to the card schema definitions.

## Future Milestones
- Cloud-based backend for leaderboards.
- Mod marketplace for downloading community ROMs.
- Inventory system and artifacts/relics system.

## Traceability
*Updated by roadmapper*
