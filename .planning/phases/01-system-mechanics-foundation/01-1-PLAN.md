# Phase 1: System Mechanics Foundation

We are implementing explicit turn phrasing and Influence (energy) mechanic inside the BL0CKS engine, adhering to our StS goals.

<task type="auto">
  <name>Implement Turn Phasing and Influence Validation in GameController</name>
  <files>engine/core/game.js, platforms/cli/lib/loop.js</files>
  <action>
    Modify `engine/core/game.js` `sendAction(input)` to intercept inputs before sending them to the AI adapter.
    1. If input is 'END TURN' (or similar), pass a specific prompt to the AI to resolve enemy actions and progress the state. Reset Influence to max.
    2. If input is a card play (e.g. integer 1-5 corresponding to `this.#currentState.hand`), parse the chosen card.
    3. Check if card has a cost. If `engineState.influence` is strictly less than cost, throw an Error or return an engine-level state rejection {"_error": "Not enough Influence", "hand": [...]} synchronously without calling the AI, to prevent wasting rate limits.
    4. If affordable, deduct the Influence from `engineState` and continue to send the action to the AI adapter as normal.
    5. Update `platforms/cli/lib/loop.js` to catch engine validation errors natively, print them in red to the user, and prompt again without treating it as a new turn.
  </action>
  <verify>Run `node test/e2e_playtest.js` or manual CLI to verify typing a card index reduces Influence, and trying to play one without enough Influence throws a local validation rejection avoiding AI calls.</verify>
  <done>GameController explicitly rejects unaffordable plays and maintains local Influence decrementing smoothly.</done>
</task>
