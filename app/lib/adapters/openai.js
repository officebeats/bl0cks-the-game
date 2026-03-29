import OpenAI from 'openai';

/**
 * OpenAI adapter — uses the OpenAI SDK.
 * Manually manages conversation history for multi-turn.
 */
export function createOpenAIAdapter(apiKey) {
  const client = new OpenAI({ apiKey });
  let history = [];

  return {
    name: 'OpenAI GPT',

    async start(systemPrompt, levelContent) {
      history = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: levelContent },
      ];

      const response = await client.chat.completions.create({
        model: 'gpt-4o',
        messages: history,
        max_tokens: 4096,
      });

      const assistantText = response.choices[0]?.message?.content || '';
      history.push({ role: 'assistant', content: assistantText });
      return assistantText;
    },

    async send(userMessage) {
      if (history.length === 0) throw new Error('Game not started. Call start() first.');

      history.push({ role: 'user', content: userMessage });

      const response = await client.chat.completions.create({
        model: 'gpt-4o',
        messages: history,
        max_tokens: 4096,
      });

      const assistantText = response.choices[0]?.message?.content || '';
      history.push({ role: 'assistant', content: assistantText });
      return assistantText;
    },

    exportState() {
      return { history };
    },

    resume(state) {
      history = state.history;
      return history[history.length - 1].content;
    }
  };
}
