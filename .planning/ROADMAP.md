# Roadmap

**4 phases** | **9 requirements mapped** | All covered ✓

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|------------------|
| 1 | System Mechanics Foundation | Implement Influence budgeting and phase logic in the engine. | ENG-01, ENG-02, ENG-03 | Engine Tracks Influence, Validates Card Plays, Defines Turns |
| 2 | Intent Visualization | Implement predictive AI generation and UI representation of enemy intent. | ENG-04, RND-01, ROM-01 | Adapters return intent schemas, Renderer draws them clearly |
| 3 | Geographic Layout | Overhaul spatial renderer. | RND-02 | 3x2 grid replaced by node map, Screenshots parse successfully |
| 4 | Integration & Feedback Loop | Add card costs to ROM and polish UI feedback loops. | RND-03, ROM-02 | Complete Slay the Spire mechanical loop is playable |

### Phase Details

**Phase 1: System Mechanics Foundation**
Goal: Implement Influence budgeting and phase logic in the engine.
Requirements: ENG-01, ENG-02, ENG-03
Success criteria:
1. Player starts turn with full Influence.
2. Playing cards depletes Influence; prevents play if insufficient.
3. Engine explicitly transitions between Draw/Play/Resolve correctly.

**Phase 2: Intent Visualization**
Goal: Implement predictive AI generation and UI representation of enemy intent.
Requirements: ENG-04, RND-01, ROM-01
Success criteria:
1. Enemy generation prompt schema asks for deterministic intent.
2. Renderer parses JSON action structure and displays "Next turn: [Action]".

**Phase 3: Geographic Layout**
Goal: Overhaul spatial renderer.
Requirements: RND-02
Success criteria:
1. `renderer.js` computes visual ASCII node paths instead of boxes.
2. E2E Playwright test takes a screenshot of the new map structure without crashing.

**Phase 4: Integration & Feedback Loop**
Goal: Add card costs to ROM and polish UI feedback loops.
Requirements: RND-03, ROM-02
Success criteria:
1. Cards generated have visible costs [X].
2. Influence point bar is bold and animated inside the terminal UI.
