# Codebase Conventions

## Styling & Layout
- Pure ES modules (`.js` files with `.mjs` optionally used for tools).
- No semicolons or simple standard configs. Code is organized minimally.
- ANSI escape strings for the terminal are manually constructed inside `platforms/cli/lib/renderer.js`.

## API Keys
- Never check in API keys. Keys reside locally in `~/.bl0cks/config.json`.
- The engine supports failing gracefully if no valid API key is present by deferring to `mock` adapters.

## AI Communication
- JSON formatting is mandated via Markdown schemas injected into AI prompts.
- Output MUST be requested as a JSON code block, stripped natively via regex matching \`\`\`json(.*?)\`\`\` in `engine/ai/router.js`.
