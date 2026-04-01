# Phase 3: Geographic Layout

We're shifting spatial logic from mid-battle 3x2 blocks to a broader campaign run tree-map (á la Slay the Spire Acts).

<task type="auto">
  <name>Build Campaign Node Map and Trim Battle HUD</name>
  <files>platforms/cli/lib/renderer.js, platforms/cli/commands/play.js</files>
  <action>
    1. Update `renderBoard()` in `renderer.js` to strip out the 3x2 "Territory Map" rendering logic, shifting battle focus to enemy intents and narrative logs.
    2. Add `renderActMap(levels, currentIndex)` in `renderer.js` which draws a beautiful ASCII branching node tree showing the path to the Boss node.
    3. Modify `play.js` so that after a `win` outcome, instead of immediately returning `action: 'next'`, it clears the screen, prints the `renderActMap()`, and prompts the user to select the next branching node using an animated menu or simple text input.
  </action>
  <done>Game loop supports choosing paths through an Act map and battle boards are clean and StS-focused.</done>
</task>
