import Anthropic from '@anthropic-ai/sdk';

/**
 * Claude adapter for the BL0CKS engine.
 * Implements the adapter interface contract.
 */
export function createClaudeAdapter(apiKey) {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  let systemPrompt = '';
  let history = [];

  return {
    name: 'Anthropic Claude',
    tier: 'platinum',
    capabilities: ['chat', 'system_instruction', 'extended_thinking'],

    async start(system, levelContent) {
      systemPrompt = system;
      history = [];
      history.push({ role: 'user', content: levelContent });

      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: systemPrompt,
        messages: history,
      });

      const assistantText = response.content
        .filter(block => block.type === 'text')
        .map(block => block.text)
        .join('\n');

      history.push({ role: 'assistant', content: assistantText });
      return assistantText;
    },

    async send(userMessage) {
      if (!systemPrompt) throw new Error('Game not started. Call start() first.');

      history.push({ role: 'user', content: userMessage });

      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: systemPrompt,
        messages: history,
      });

      const assistantText = response.content
        .filter(block => block.type === 'text')
        .map(block => block.text)
        .join('\n');

      history.push({ role: 'assistant', content: assistantText });
      return assistantText;
    },

    exportState() {
      return { systemPrompt, history };
    },

    resume(state) {
      systemPrompt = state.systemPrompt;
      history = state.history;
      return history[history.length - 1].content;
    },

    destroy() {
      history = [];
      systemPrompt = '';
    },
  };
}
