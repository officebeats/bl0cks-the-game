/**
 * BL0CKS Mock AI Adapter
 * 
 * Deterministic adapter for testing. Returns predictable responses
 * based on input patterns. No external API calls.
 */
export function createMockAdapter() {
  let history = [];

  const MOCK_BOARD = JSON.stringify({
    level_number: 1,
    level_name: 'The Corner',
    clock: { current: 0, total: 12, status: 'CALM' },
    territories: [
      { name: 'Woodlawn', control: 'you', faction: 'Governors', intersection: '63rd & King' },
      { name: 'Englewood', control: 'rival', faction: 'Lords', intersection: '69th & Halsted' },
      { name: 'Auburn Gresham', control: 'contested', faction: '', intersection: '79th & Halsted' },
      { name: 'Chatham', control: 'contested', faction: '', intersection: '79th & Cottage' },
      { name: 'Hyde Park', control: 'neutral', faction: '', intersection: '53rd & Harper' },
      { name: 'Roseland', control: 'rival', faction: 'Stones', intersection: '111th & State' },
    ],
    scanner: 'All quiet on the South Side... for now.',
    event: { name: 'POWER VACUUM', description: 'The Governors just lost their top lieutenant on 63rd & King. Nobody knows who gave the order.' },
    hand: [
      { type: 'people', name: 'Darius Webb', role: 'Broker', block: 'Woodlawn', loyalty: 8, faction: 'Governors' },
      { type: 'people', name: 'Marcus Cole', role: 'Enforcer', block: 'Woodlawn', loyalty: 5, faction: 'Governors' },
      { type: 'move', name: 'TAX', description: 'Collect from a controlled block' },
      { type: 'move', name: 'WAR', description: 'Challenge a rival block' },
    ],
    intel: 2,
    choice: null,
    outcome: null,
  }, null, 2);

  return {
    name: 'Mock (Testing)',
    tier: 'platinum',
    capabilities: ['chat', 'system_instruction'],

    async start(_systemPrompt, _levelContent) {
      history = [];
      const response = `The Governors just lost their top lieutenant on 63rd & King.\n\n\`\`\`json\n${MOCK_BOARD}\n\`\`\``;
      history.push({ role: 'assistant', content: response });
      return response;
    },

    async send(userMessage) {
      history.push({ role: 'user', content: userMessage });
      const response = `Turn processed: ${userMessage}\n\n\`\`\`json\n${MOCK_BOARD}\n\`\`\``;
      history.push({ role: 'assistant', content: response });
      return response;
    },

    exportState() {
      return { history };
    },

    resume(state) {
      history = state.history;
      return history[history.length - 1].content;
    },

    destroy() {
      history = [];
    },
  };
}
