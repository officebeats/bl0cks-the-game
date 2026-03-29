# AI Adapter Guide — BL0CKS v2

> How to add a new AI provider to the BL0CKS engine.

---

## Architecture

The engine uses a **provider-agnostic adapter interface**. Each AI provider (Gemini, Claude, OpenAI) implements the same contract, and the engine's router auto-detects which adapter to use based on the API key format.

```
engine/ai/
├── router.js           # Auto-detection + adapter factory
├── prompt-builder.js   # ROM → system prompt assembly
├── response-parser.js  # AI output → game state parsing
└── adapters/
    ├── adapter.interface.js  # Interface contract
    ├── gemini.js             # Google Gemini adapter
    ├── claude.js             # Anthropic Claude adapter
    ├── openai.js             # OpenAI GPT adapter
    └── mock.js               # Deterministic testing adapter
```

---

## Adapter Interface

Every adapter must implement:

```js
export class MyAdapter {
  /** Human-readable name */
  get name() { return 'My Provider'; }

  /** Tier: 'free', 'silver', 'gold', 'platinum' */
  get tier() { return 'gold'; }

  /**
   * Start a new conversation with system prompt + first user message.
   * @param {string} systemPrompt - Full system instruction
   * @param {string} userMessage - First user message (level content)
   * @returns {Promise<string>} AI response text
   */
  async start(systemPrompt, userMessage) { }

  /**
   * Send a follow-up message in the existing conversation.
   * @param {string} message - Player input
   * @returns {Promise<string>} AI response text
   */
  async send(message) { }

  /**
   * Export conversation state for save/resume.
   * @returns {object} Serializable state
   */
  exportState() { }

  /**
   * Resume from exported state.
   * @param {object} state - Previously exported state
   * @returns {string} Last AI response text
   */
  resume(state) { }

  /** Cleanup resources */
  destroy() { }
}
```

---

## Adding a New Provider

### 1. Create the adapter file

```bash
# engine/ai/adapters/my-provider.js
```

```js
export class MyProviderAdapter {
  #history = [];
  #sdk = null;

  constructor(apiKey) {
    // Initialize your SDK
    this.#sdk = new MySDK({ apiKey });
  }

  get name() { return 'My Provider'; }
  get tier() { return 'gold'; }

  async start(systemPrompt, userMessage) {
    this.#history = [];
    const response = await this.#sdk.chat({
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }]
    });
    this.#history.push(
      { role: 'user', content: userMessage },
      { role: 'assistant', content: response.text }
    );
    return response.text;
  }

  async send(message) {
    this.#history.push({ role: 'user', content: message });
    const response = await this.#sdk.chat({
      messages: this.#history
    });
    this.#history.push({ role: 'assistant', content: response.text });
    return response.text;
  }

  exportState() {
    return { history: [...this.#history] };
  }

  resume(state) {
    this.#history = state.history || [];
    return this.#history[this.#history.length - 1]?.content || '';
  }

  destroy() {
    this.#history = [];
  }
}
```

### 2. Register in the router

Edit `engine/ai/router.js`:

```js
// Add key detection pattern
{ prefix: 'mp-', id: 'my-provider', name: 'My Provider' }

// Add to createAdapter switch
case 'my-provider': return new MyProviderAdapter(apiKey);
```

### 3. Add to PROVIDERS list

```js
PROVIDERS.push({
  id: 'my-provider',
  name: 'My Provider',
  tier: 'gold',
  keyHint: 'mp-...',
  keyUrl: 'https://my-provider.com/api-keys',
  color: '\x1b[38;2;100;200;255m',
});
```

---

## Response Format

The AI must return game state in one of two formats:

### JSON Block (Preferred)

````
```json
{
  "type": "board",
  "levelName": "The Corner",
  "territories": [...],
  "hand": [...],
  "clock": { "current": 3, "total": 12 },
  "event": { "name": "...", "description": "..." },
  "scanner": "...",
  "choice": { "optionA": "...", "optionB": "..." }
}
```
````

### Text Fallback

The response parser also handles free-form text responses and extracts structured data using regex patterns. See `engine/ai/response-parser.js` for the full parsing logic.

---

## Testing

Use the mock adapter for deterministic testing:

```js
const engine = await BL0CKS.boot('./roms/chicago', {
  provider: 'mock',
  apiKey: 'mock'
});
```

The mock adapter returns pre-scripted responses that exercise all game mechanics.
