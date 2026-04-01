# Codebase Structure

## Root Directories
- `/engine`: The core orchestration library that interfaces with AI providers and loads ROM definitions.
- `/engine/ai`: AI routing logic, interface definition, and vendor-specific adapters.
- `/engine/content`: Handles ROM manifest validation and level parsing.
- `/platforms/cli`: Terminal interface handling ASCII graphics, inputs, and game loop screens.
- `/platforms/web`: Placeholder for web client.
- `/cloud`: Placeholder for future backend services (leaderboards, marketplace).
- `/roms`: Game content. The first campaign is `/roms/chicago/`.
- `/test`: Quality assurance scripts, Playwright/Puppeteer configurations, screenshots.
- `/tools`: Utility scripts for compilation, ROM validation (`rom-validator.mjs`).

## ROM Structure
Inside `roms/chicago/`:
- `manifest.md`: AI system prompt, constraints, output schemas, thematic tone.
- `theme.json`: Contains CLI colors and stylistic constants.
- `levels/`: Contains 13 `.md` files detailing specific encounter logic per stage.
