# Testing & QA

## Framework
- We utilize native Node testing tools `node --test`.
- E2E Testing has been augmented with Puppeteer (`test/e2e_playtest.js`), capturing visual regressions and parsing successes in `./test/screenshots/`.

## Quality
- E2E testing relies on real LLM API keys via `~/.bl0cks/config.json`.
- When CI or API rate limit issues occur, dummy fallbacks (mock) are used to prevent hanging. Puppeteer timeouts are set to avoid stalling during slow AI generation (e.g., 5s rate-limit timeouts).
