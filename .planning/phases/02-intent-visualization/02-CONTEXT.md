# Phase 2: Intent Visualization - Context

**Gathered:** Today
**Status:** Ready for planning

<domain>
## Phase Boundary
Implement predictive AI generation and UI representation of enemy intent.

</domain>

<decisions>
## Implementation Decisions

### Intent Visualization Schema
- **D-01:** The AI prompt needs a specific `enemyIntent` field added to the schema.
- **D-02:** The object should explicitly state `"next_turn_action"` (e.g. "Attack with 3 Heat" or "Defend Woodlawn") so players know the stakes of pressing "End Turn".

### UI Drawing
- **D-03:** The CLI renderer should display this intent prominently next to the enemy/boss stats or in the scanner alert area.
</decisions>
