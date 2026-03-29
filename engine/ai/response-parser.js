/**
 * BL0CKS AI Response Parser
 * 
 * Parses AI output into structured game state.
 * Migrated from app/lib/parser.js with no changes to parsing logic.
 * 
 * Strategy:
 *  1. Look for ```json block → parse as full game state
 *  2. Fallback: regex-parse the text output format from SYSTEM_PROMPT.md
 *  3. Last resort: return raw text as narrative
 */

/**
 * Parse AI response text into a game state object.
 * @param {string} text - Raw AI response
 * @returns {object} Structured game state
 */
export function parseResponse(text) {
  // 1. Try JSON extraction first
  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/);
  if (jsonMatch) {
    try {
      const data = JSON.parse(jsonMatch[1]);
      return normalizeJsonState(data, text);
    } catch {
      // JSON parse failed, fall through
    }
  }

  // 2. Try text format parsing
  const parsed = parseTextFormat(text);
  if (parsed) return parsed;

  // 3. Fallback — narrative
  return { type: 'narrative', raw: text };
}

function normalizeJsonState(data, rawText) {
  return {
    type: 'board',
    raw: rawText,
    levelNumber: data.level_number ?? data.levelNumber ?? data.level ?? 1,
    levelName: data.level_name ?? data.levelName ?? data.title ?? 'The Corner',
    clock: {
      current: data.clock?.current ?? data.clock_current ?? 0,
      total: data.clock?.total ?? data.clock_total ?? 12,
      status: data.clock?.status ?? data.clock_status ?? '',
    },
    territories: normalizeTerritories(data.territories ?? data.territory ?? []),
    scanner: data.scanner ?? data.police_scanner ?? '',
    event: data.event
      ? { name: data.event.name ?? data.event.title ?? 'UNKNOWN', description: data.event.description ?? data.event.text ?? '' }
      : null,
    hand: normalizeHand(data.hand ?? []),
    intel: data.intel ?? data.intel_remaining ?? data.intel_cards ?? 2,
    choice: data.choice ?? data.decision ?? null,
    outcome: data.outcome ?? null,
  };
}

function normalizeTerritories(territories) {
  if (Array.isArray(territories)) {
    return territories.map(t => ({
      name: t.name ?? t.neighborhood ?? 'Unknown',
      control: t.control ?? t.status ?? 'neutral',
      faction: t.faction ?? '',
      intersection: t.intersection ?? t.cross_streets ?? t.key_intersection ?? '',
    }));
  }

  if (typeof territories === 'object') {
    return Object.entries(territories).map(([name, value]) => {
      let control, faction;
      if (typeof value === 'string') {
        if (value === 'player' || value === 'you') { control = 'you'; }
        else if (value.startsWith('rival_')) { control = 'rival'; faction = value.replace('rival_', ''); }
        else if (value === 'contested') { control = 'contested'; }
        else if (value === 'neutral') { control = 'neutral'; }
        else { control = value; }
      } else if (typeof value === 'object') {
        control = value.control ?? value.status ?? 'neutral';
        faction = value.faction ?? '';
      }
      return {
        name: formatTerritoryName(name),
        control: control || 'neutral',
        faction: faction || '',
        intersection: '',
      };
    });
  }

  return [];
}

function normalizeHand(hand) {
  if (!Array.isArray(hand)) return [];

  return hand.map(card => {
    const moveNames = ['tax', 'war', 'ghost', 'snitch', 'stack', 'peace', 'intel'];
    const cardName = (card.name || '').toLowerCase();
    const cardType = (card.type || '').toLowerCase();

    if (cardType === 'move' || moveNames.includes(cardName)) {
      return {
        type: 'move',
        name: (card.name || 'Unknown').toUpperCase(),
        description: card.description ?? card.effect ?? card.desc ?? '',
      };
    }

    return {
      type: 'people',
      name: card.name ?? 'Unknown',
      role: card.role ?? '???',
      block: card.block ?? card.territory ?? '',
      loyalty: card.loyalty ?? card.loyalty_visible ?? card.visible_loyalty ?? '?',
      faction: card.faction ?? '',
    };
  });
}

function formatTerritoryName(raw) {
  return raw.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function parseTextFormat(text) {
  if (!text.includes('BL0CKS') && !text.includes('TERRITORY') && !text.includes('YOUR HAND')) {
    return null;
  }

  const state = {
    type: 'board',
    raw: text,
    levelNumber: 1,
    levelName: 'The Corner',
    clock: { current: 0, total: 12, status: '' },
    territories: [],
    scanner: '',
    event: null,
    hand: [],
    intel: 2,
    choice: null,
    outcome: null,
  };

  const headerMatch = text.match(/BL0CKS\s*·\s*Level\s*(\d+)\s*·\s*(.+?)(?:\n|$)/);
  if (headerMatch) {
    state.levelNumber = parseInt(headerMatch[1], 10);
    state.levelName = headerMatch[2].trim();
  }

  const clockMatch = text.match(/Clock:\s*(\d+)\/(\d+)\s*(?:ticks?\s*·?\s*)?(.+?)(?:\n|$)/i);
  if (clockMatch) {
    state.clock.current = parseInt(clockMatch[1], 10);
    state.clock.total = parseInt(clockMatch[2], 10);
    state.clock.status = clockMatch[3]?.trim() || '';
  }

  const territoryRegex = /([●○◐◇])\s+(.+?)\s*—\s*(YOU|RIVAL|CONTESTED|NEUTRAL)(?:\s*\((.+?)\))?/g;
  let tm;
  while ((tm = territoryRegex.exec(text)) !== null) {
    state.territories.push({
      name: tm[2].trim(),
      control: tm[3].toLowerCase() === 'you' ? 'you' : tm[3].toLowerCase(),
      faction: tm[4] || '',
      intersection: '',
    });
  }

  if (state.territories.length === 0) {
    state.territories = [
      { name: 'Woodlawn', control: 'you', faction: 'Governors', intersection: '63rd & King' },
      { name: 'Englewood', control: 'rival', faction: 'Lords', intersection: '69th & Halsted' },
      { name: 'Auburn Gresham', control: 'contested', faction: '', intersection: '79th & Halsted' },
      { name: 'Chatham', control: 'contested', faction: '', intersection: '79th & Cottage' },
      { name: 'Hyde Park', control: 'neutral', faction: '', intersection: '53rd & Harper' },
      { name: 'Roseland', control: 'rival', faction: 'Stones', intersection: '111th & State' },
    ];
  }

  const scannerMatch = text.match(/(?:STREET WHISPER|POLICE SCANNER|📻)[:\s]*"?(.+?)"?\s*(?:\n|$)/i);
  if (scannerMatch) {
    state.scanner = scannerMatch[1].replace(/^"|"$/g, '').trim();
  }

  const eventMatch = text.match(/EVENT:\s*(.+?)(?:\n)([\s\S]*?)(?=━|🃏|YOUR HAND|$)/i);
  if (eventMatch) {
    state.event = {
      name: eventMatch[1].trim(),
      description: eventMatch[2].trim().replace(/\n/g, ' '),
    };
  }

  const handRegex = /(\d+)\.\s*(?:👤|⚔️|⚔|⚠️)\s*(.+?)\s*(?:—|–|-)\s*(.+?)(?:\n|$)/g;
  let hm;
  while ((hm = handRegex.exec(text)) !== null) {
    const parts = hm[3].split(/\s*·\s*/);
    const firstName = hm[2].trim();
    const moveNames = ['TAX', 'WAR', 'GHOST', 'SNITCH', 'STACK', 'PEACE', 'INTEL'];
    const statusNames = ['PARANOIA', 'HEAT'];

    if (moveNames.includes(firstName.toUpperCase())) {
      state.hand.push({ type: 'move', name: firstName.toUpperCase(), description: parts.join(' ') });
    } else if (statusNames.includes(firstName.toUpperCase()) || text.substring(hm.index, hm.index + 5).includes('⚠️')) {
      state.hand.push({ type: 'status', name: firstName.toUpperCase(), description: parts.join(' ') });
    } else {
      const loyMatch = parts.join(' ').match(/Loyalty\s*(\d+)/i);
      state.hand.push({
        type: 'people',
        name: firstName,
        role: parts[0] || '???',
        block: parts[1] || '',
        loyalty: loyMatch ? parseInt(loyMatch[1], 10) : '?',
        faction: '',
      });
    }
  }

  const intelMatch = text.match(/Intel\s*(?:Cards?\s*)?remaining:\s*(\d+)/i);
  if (intelMatch) {
    state.intel = parseInt(intelMatch[1], 10);
  }

  const choiceAMatch = text.match(/←\s*\[A\]\s*(.+?)(?:\n|$)/);
  const choiceBMatch = text.match(/→\s*\[B\]\s*(.+?)(?:\n|$)/);
  const choiceBurnMatch = text.match(/(?:🗑️|🗑)\s*\[BURN\]\s*(?:—|-)\s*"?(.+?)"?(?:\n|$)/);
  if (choiceAMatch || choiceBMatch) {
    const choiceDescMatch = text.match(/(?:Your call|decide|choice|situation)[^:]*:\s*(.+?)(?=\s*←\s*\[A\])/is);
    state.choice = {
      description: choiceDescMatch ? choiceDescMatch[1].trim() : '',
      optionA: choiceAMatch ? choiceAMatch[1].trim() : '',
      optionB: choiceBMatch ? choiceBMatch[1].trim() : '',
      optionBurn: choiceBurnMatch ? choiceBurnMatch[1].trim() : '',
    };
  }

  if (/victory|you\s+win|you\s+won|level\s+complete/i.test(text)) {
    state.outcome = 'win';
  } else if (/defeat|you\s+lose|you\s+lost|game\s+over/i.test(text)) {
    state.outcome = 'loss';
  }

  return state;
}
