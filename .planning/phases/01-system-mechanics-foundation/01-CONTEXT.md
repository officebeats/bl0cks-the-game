# Phase 1: System Mechanics Foundation - Context

**Gathered:** Today
**Status:** Ready for planning

<domain>
## Phase Boundary

Engine logic for Influence budgeting, card play validation against costs, and State machine progression (Draw → Play → Resolve → Enemy Intent).

</domain>

<decisions>
## Implementation Decisions

### 1. Influence Reset Behavior
- **D-01:** Influence resets to maximum explicitly at the start of every Draw/Play turn, exactly like "Energy" in Slay the Spire.

### 2. Turn Progression Trigger
- **D-02:** Manual explicit "End Turn" mechanic. Players must distinctly end their turn to transition from Play phase to Enemy Intent / Resolve phase, preventing auto-skips.

### 3. Card Cost Failure Handling
- **D-03:** Trying to play an unaffordable card results in an explicit engine error returning the player to the prompt (e.g., "Not enough Influence"). No resources or cards are lost; they get another chance to pick.

### the agent's Discretion
- The specific string command to end the turn ("end", "end turn", "done") can be decided by the planner, as long as it handles aliases gracefully.
- Initial/Max Influence numeric values should be decided by the planner but easily configurable in the ROM constants.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Foundational Spec
- `.planning/PROJECT.md` — Overall project goals and value proposition (Slay the Spire mechanics).
- `.planning/REQUIREMENTS.md` — Target requirements ENG-01, ENG-02, ENG-03.
</canonical_refs>
