/**
 * BL0CKS AI Adapter Interface
 * 
 * Defines the contract all AI adapters must implement.
 * This is documentation + a factory helper, not a class to extend.
 * 
 * Every adapter is a plain object with these methods:
 * 
 * {
 *   name: string,                              // Human-readable name (e.g., "Google Gemini")
 *   tier: 'platinum' | 'gold' | 'silver' | 'free',
 *   capabilities: string[],                    // ['chat', 'system_instruction', 'extended_thinking', 'vision']
 * 
 *   start(systemPrompt, levelContent) → Promise<string>
 *     Initialize a game session. Returns the AI's first response.
 * 
 *   send(userMessage) → Promise<string>
 *     Send player input during gameplay. Returns AI response.
 * 
 *   exportState() → object
 *     Serialize conversation state for save/resume.
 * 
 *   resume(state) → string
 *     Restore from serialized state. Returns last AI response.
 * 
 *   destroy() → void
 *     Clean up resources.
 * }
 */

/**
 * Validate that an adapter object implements the required interface.
 * Throws if any methods are missing.
 * @param {object} adapter
 */
export function validateAdapter(adapter) {
  const required = ['name', 'tier', 'capabilities', 'start', 'send', 'exportState', 'resume', 'destroy'];
  const missing = required.filter(key => !(key in adapter));
  if (missing.length > 0) {
    throw new Error(`Adapter "${adapter.name || 'unknown'}" missing required interface members: ${missing.join(', ')}`);
  }

  const methods = ['start', 'send', 'exportState', 'resume', 'destroy'];
  for (const m of methods) {
    if (typeof adapter[m] !== 'function') {
      throw new Error(`Adapter "${adapter.name}" member "${m}" must be a function.`);
    }
  }

  if (!Array.isArray(adapter.capabilities)) {
    throw new Error(`Adapter "${adapter.name}" capabilities must be an array.`);
  }
}

/**
 * Check if an adapter meets the requirements of a ROM.
 * @param {object} adapter - The adapter object
 * @param {object} romAI - The manifest.ai block from a ROM
 * @returns {{ compatible: boolean, issues: string[] }}
 */
export function checkAdapterCompatibility(adapter, romAI = {}) {
  const tierRank = { free: 0, silver: 1, gold: 2, platinum: 3 };
  const issues = [];

  if (romAI.min_tier && tierRank[adapter.tier] < tierRank[romAI.min_tier]) {
    issues.push(`ROM requires ${romAI.min_tier} tier AI (you have ${adapter.tier})`);
  }

  if (romAI.required_capabilities) {
    for (const cap of romAI.required_capabilities) {
      if (!adapter.capabilities.includes(cap)) {
        issues.push(`ROM requires AI capability: "${cap}"`);
      }
    }
  }

  return { compatible: issues.length === 0, issues };
}
