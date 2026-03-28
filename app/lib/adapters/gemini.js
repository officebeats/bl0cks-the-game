import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Gemini adapter — uses Google's Generative AI SDK.
 * Maintains chat history for multi-turn conversation.
 */
export function createGeminiAdapter(apiKey) {
  const genAI = new GoogleGenerativeAI(apiKey);
  let chat = null;

  return {
    name: 'Google Gemini',

    async start(systemPrompt, levelContent) {
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: systemPrompt,
      });

      chat = model.startChat({
        history: [],
      });

      const result = await chat.sendMessage(levelContent);
      return result.response.text();
    },

    async send(userMessage) {
      if (!chat) throw new Error('Game not started. Call start() first.');
      const result = await chat.sendMessage(userMessage);
      return result.response.text();
    },
  };
}
