import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Gemini adapter — uses Google's Generative AI SDK.
 * Maintains chat history for multi-turn conversation.
 */
export function createGeminiAdapter(apiKey) {
  const genAI = new GoogleGenerativeAI(apiKey);
  let chat = null;
  let systemPrompt = '';
  let internalHistory = [];

  return {
    name: 'Google Gemini',

    async start(systemInstruction, levelContent) {
      systemPrompt = systemInstruction;
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: systemPrompt,
      });

      chat = model.startChat({
        history: [],
      });

      internalHistory = [{ role: 'user', parts: [{ text: levelContent }] }];
      const result = await chat.sendMessage(levelContent);
      const assistantText = result.response.text();
      internalHistory.push({ role: 'model', parts: [{ text: assistantText }] });

      return assistantText;
    },

    async send(userMessage) {
      if (!chat) throw new Error('Game not started. Call start() first.');
      
      internalHistory.push({ role: 'user', parts: [{ text: userMessage }] });
      const result = await chat.sendMessage(userMessage);
      const assistantText = result.response.text();
      internalHistory.push({ role: 'model', parts: [{ text: assistantText }] });

      return assistantText;
    },

    exportState() {
      return { systemPrompt, internalHistory };
    },

    resume(state) {
      systemPrompt = state.systemPrompt;
      internalHistory = state.internalHistory;

      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: systemPrompt,
      });

      // Gemini allows starting a chat with pre-filled history 
      // excluding the final model message if we want to "continue"
      // actually, we can literally just pass the full history!
      chat = model.startChat({
        history: internalHistory,
      });

      // Return the very last generated text as the "resumed" text
      const last = internalHistory[internalHistory.length - 1];
      return last.parts[0].text;
    }
  };
}
