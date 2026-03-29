/**
 * BL0CKS AI Provider Router
 * 
 * Detects the AI provider from API key patterns and creates the appropriate adapter.
 * Also supports explicit provider override and Ollama local execution.
 */

import { createGeminiAdapter } from './adapters/gemini.js';
import { createClaudeAdapter } from './adapters/claude.js';
import { createOpenAIAdapter } from './adapters/openai.js';
import { createMockAdapter } from './adapters/mock.js';
import { validateAdapter } from './adapters/adapter.interface.js';

/**
 * API key pattern matchers for auto-detection.
 */
const KEY_PATTERNS = [
  { id: 'gemini',  pattern: /^AIza/,     name: 'Google Gemini',    tier: 'platinum' },
  { id: 'claude',  pattern: /^sk-ant-/,  name: 'Anthropic Claude', tier: 'platinum' },
  { id: 'openai',  pattern: /^sk-/,      name: 'OpenAI GPT',       tier: 'platinum' },
  { id: 'ollama',  pattern: /^ollama:/,   name: 'Ollama (Local)',   tier: 'free' },
  { id: 'mock',    pattern: /^mock$/i,    name: 'Mock (Testing)',   tier: 'platinum' },
];

/**
 * Provider definitions for UI rendering (title screen, settings, etc).
 */
export const PROVIDERS = [
  { id: 'gemini',  name: 'Google Gemini',    tier: 'Platinum', keyHint: 'AIza...',    keyUrl: 'https://aistudio.google.com/app/apikey' },
  { id: 'claude',  name: 'Anthropic Claude', tier: 'Platinum', keyHint: 'sk-ant-...', keyUrl: 'https://console.anthropic.com/settings/keys' },
  { id: 'openai',  name: 'OpenAI GPT',       tier: 'Platinum', keyHint: 'sk-...',     keyUrl: 'https://platform.openai.com/api-keys' },
];

/**
 * Detect the AI provider from an API key string.
 * @param {string} apiKey
 * @returns {{ id: string, name: string, tier: string } | null}
 */
export function detectProvider(apiKey) {
  for (const entry of KEY_PATTERNS) {
    if (entry.pattern.test(apiKey)) {
      return { id: entry.id, name: entry.name, tier: entry.tier };
    }
  }
  return null;
}

/**
 * Create an AI adapter from a provider id and API key.
 * @param {string} providerId - Provider identifier (gemini, claude, openai, mock)
 * @param {string} apiKey - The API key
 * @returns {object} Adapter implementing the interface contract
 */
export function createAdapter(providerId, apiKey) {
  let adapter;

  switch (providerId) {
    case 'gemini':
      adapter = createGeminiAdapter(apiKey);
      break;
    case 'claude':
      adapter = createClaudeAdapter(apiKey);
      break;
    case 'openai':
      adapter = createOpenAIAdapter(apiKey);
      break;
    case 'mock':
      adapter = createMockAdapter();
      break;
    default:
      throw new Error(`Unknown AI provider: "${providerId}". Supported: gemini, claude, openai, mock`);
  }

  validateAdapter(adapter);
  return adapter;
}

/**
 * Auto-detect provider and create adapter in one step.
 * @param {string} apiKey
 * @returns {{ adapter: object, provider: object }}
 */
export function autoCreateAdapter(apiKey) {
  const provider = detectProvider(apiKey);
  if (!provider) {
    throw new Error('Unrecognized API key format. Supported prefixes: AIza (Gemini), sk-ant- (Claude), sk- (OpenAI)');
  }

  const adapter = createAdapter(provider.id, apiKey);
  return { adapter, provider };
}
