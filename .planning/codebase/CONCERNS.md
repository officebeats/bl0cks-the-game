# Tech Debt & Concerns

## Game Loop Execution
- Currently, the game consists of simple narrative prompts ("Choose Your Own Adventure" style) wearing card-game clothing.
- There is a distinct lack of deep mechanical rigor resembling "Slay the Spire" (no Action Points / Influence logic, card cost calculation, or predictive enemy intent that the player can mechanically block).

## Visual Presentation
- The `platforms/cli/lib/renderer.js` currently uses a flat 3x2 grid layout for rendering blocks.
- Since BL0CKS represents South Side Chicago geography, this grid fails to intuitively convey map adjacency, distances, or tactical chokepoints. Needs migration to a true ASCII geographic node map format.

## AI Quality and API Dependencies
- Real AI test execution (`bl0cks_real_playtest.js`, `e2e_playtest.js`) is vulnerable to provider rate limits (e.g. 15 RPM for Gemini free-tier).
- AI prompt structure lacks guardrails verifying exact schema structures on the backend if the model hallucinates a non-conformant key.

## Next Steps
- Implement `Slay the Spire` intent and influence calculations.
- Overhaul layout to Geographic map layout.
