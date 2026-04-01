# External Integrations

## AI Providers (Adapters)
The engine integrates with several generative AI APIs via the adapter interface (`engine/ai/adapters/`):
- **Gemini:** Google Generative AI (primary tested provider)
- **Claude:** Anthropic Messages API
- **OpenAI / OpenRouter:** standard OpenAI API interface
- **Ollama:** local LLM integration
- **Kilo:** A free/custom adapter pattern
- **Mock:** Deterministic offline adapter for UI testing and speedy fallbacks

These integrations are heavily bound by rate-limits in testing (e.g. Gemini 15 RPM). They are authenticated via user-provided keys saved in `~/.bl0cks/config.json`.
