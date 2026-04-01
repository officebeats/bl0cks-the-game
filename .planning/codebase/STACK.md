# Tech Stack

## Core
- **Runtime:** Node.js (>=18) / Bun (>=1.0)
- **Language:** JavaScript (ES Modules, `type: "module"` in package.json)
- **Environment:** CLI

## Dependencies
- `@anthropic-ai/sdk` (^0.39.0) - Claude adapter
- `@google/generative-ai` (^0.24.0) - Gemini adapter
- `openai` (^4.86.2) - OpenAI / OpenRouter adapters

## Development
- **Testing:** Native Node test runner (`node --test`)
- **Validation:** Custom ROM validation script (`tools/rom-validator.mjs`)
- **QA:** Puppeteer for E2E screenshots (added in `test/e2e_playtest.js`)

## Configuration
- Project configuration is stored in `~/.bl0cks/config.json` containing provider API keys.
