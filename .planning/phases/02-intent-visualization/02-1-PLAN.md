# Phase 2: Intent Visualization

We need to add Slay the Spire predictive intents to the engine and visuals.

<task type="auto">
  <name>Inject Enemy Intent into AI Schema</name>
  <files>engine/ai/prompt-builder.js, platforms/cli/lib/renderer.js</files>
  <action>
    1. Modify `engine/ai/prompt-builder.js` inside `getOutputFormatDirective()` to include an `"enemy_intent"` field in the example JSON, detailing what the primary rival faction will do on their next turn.
    2. Add rules explaining that `"enemy_intent"` must be deterministic and specific (like "Attack 5" or "Takes control of block").
    3. Modify `platforms/cli/lib/renderer.js` to parse `state.enemy_intent` and render it clearly. We can put it right below the scanner or next to the territories. Red text or noticeable colors.
  </action>
  <done>Prompt explicitly forces LLMs to generate `enemy_intent`, and the terminal renderer paints it.</done>
</task>
