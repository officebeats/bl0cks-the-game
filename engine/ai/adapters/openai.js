import OpenAI from 'openai';

/**
 * OpenAI GPT adapter for the BL0CKS engine.
 * Implements the adapter interface contract.
 */
export function createOpenAIAdapter(apiKey) {
  const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
  let systemPrompt = '';
  let history = [];

  return {
    name: 'OpenAI GPT',
    tier: 'platinum',
    capabilities: ['chat', 'system_instruction', 'tool_use'],

    async start(system, levelContent) {
      systemPrompt = system;
      history = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: levelContent },
      ];

      const response = await client.chat.completions.create({
        model: 'gpt-4o',
        messages: history,
      });

      const assistantText = response.choices[0].message.content;
      history.push({ role: 'assistant', content: assistantText });
      return assistantText;
    },

    async send(userMessage) {
      if (!systemPrompt) throw new Error('Game not started. Call start() first.');

      history.push({ role: 'user', content: userMessage });

      const response = await client.chat.completions.create({
        model: 'gpt-4o',
        messages: history,
      });

      const assistantText = response.choices[0].message.content;
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
