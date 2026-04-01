# Phase 3: Geographic Layout - Context

**Gathered:** Today
**Status:** Ready for planning

<domain>
## Phase Boundary
Replace the 3x2 static game board representation with an Act-style progression map for the campaign (Slay the Spire style). Overhaul battle layout to drop territories.
</domain>

<decisions>
## Implementation Decisions

### 1. The Act-style Campaign Map
- **D-01:** Between levels or before the game starts, players should view an ASCII node tree map (Start -> Branch A / Branch B -> Boss) representing the levels.
- **D-02:** Use the `manifest.js` level array to dynamically construct or infer the nodes based on `id` string hierarchy (e.g. 01 -> 02 -> 03).
- **D-03:** An interactive menu should let the player pick their path/node to enter the next encounter.

### 2. The Battle Board Layout
- **D-04:** Since the campaign map governs locations, we remove the territory tiles from the live battle `renderBoard` to focus on Hand, Enemy Intent, Event, and Scanner.
</decisions>
