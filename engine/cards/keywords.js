/**
 * BL0CKS Keyword & Synergy System
 * 
 * Keywords are formalized mechanical effects on People and Move cards
 * that chain off each other when played in combination during the Combo phase.
 * 
 * From GDD §4.8:
 * Block, Connect, Flip, Hustle, Fortify, Shadow, Rally
 */

/**
 * All keyword definitions.
 */
export const KEYWORDS = Object.freeze({
  BLOCK: {
    id: 'block',
    icon: '⛨',
    name: 'Block',
    effect: 'Generates Block Points (temporary shields) on a territory.',
    comboWith: ['stack'],
    comboEffect: 'Stack + Block = double Block Points (4 instead of 2).',
  },
  CONNECT: {
    id: 'connect',
    icon: '◆',
    name: 'Connect',
    effect: 'Reveals 1 hidden stat on a People Card in the same block. Free intel.',
    comboWith: ['connect'],
    comboEffect: 'Connect + Connect (same turn) = reveal 1 additional stat.',
  },
  FLIP: {
    id: 'flip',
    icon: '☠',
    name: 'Flip',
    effect: 'If target People Card hidden/visible loyalty differ by 3+, trigger betrayal.',
    comboWith: ['snitch'],
    comboEffect: 'Flip + Snitch = betrayal is revealed before it fires, giving player a chance to Burn.',
  },
  HUSTLE: {
    id: 'hustle',
    icon: '💰',
    name: 'Hustle',
    effect: 'Generates +1 Influence immediately when played. Partially self-funding.',
    comboWith: ['tax'],
    comboEffect: 'Hustle + Tax = net positive Influence turn (fuels aggressive plays).',
  },
  FORTIFY: {
    id: 'fortify',
    icon: '🏰',
    name: 'Fortify',
    effect: 'Territory where this card is played cannot be contested by War for 1 turn.',
    comboWith: ['peace'],
    comboEffect: 'Fortify + Peace = unbreakable shared territory for 1 turn.',
  },
  SHADOW: {
    id: 'shadow',
    icon: '👻',
    name: 'Shadow',
    effect: "This card's play is hidden from rival factions. No Heat generated.",
    comboWith: ['war'],
    comboEffect: 'Shadow + War = surprise attack — rival cannot prepare Block Points.',
  },
  RALLY: {
    id: 'rally',
    icon: '📢',
    name: 'Rally',
    effect: '+1 visible loyalty to ALL People Cards in the same block.',
    comboWith: ['rally'],
    comboEffect: 'Rally + Rally (two cards with Rally) = +2 loyalty each (squad buff).',
  },
});

/**
 * Map of keyword id → keyword definition.
 */
export const KEYWORD_MAP = Object.freeze(
  Object.fromEntries(Object.values(KEYWORDS).map(k => [k.id, k]))
);

/**
 * Detect keyword combos from cards played this turn.
 * @param {object[]} playedCards - Cards played during the Act phase
 * @returns {object[]} Array of triggered combos
 */
export function detectCombos(playedCards) {
  const combos = [];
  const activeKeywords = new Set();
  const keywordCounts = {};

  // Collect all keywords from played cards
  for (const card of playedCards) {
    const keywords = card.keywords || [];
    for (const kw of keywords) {
      const kwLower = kw.toLowerCase();
      activeKeywords.add(kwLower);
      keywordCounts[kwLower] = (keywordCounts[kwLower] || 0) + 1;
    }

    // Move cards also count as keyword-like triggers
    if (card.type === 'move') {
      const moveName = card.name?.toLowerCase();
      activeKeywords.add(moveName);
      keywordCounts[moveName] = (keywordCounts[moveName] || 0) + 1;
    }
  }

  // Check each keyword's combo potential
  for (const kwId of activeKeywords) {
    const kwDef = KEYWORD_MAP[kwId];
    if (!kwDef) continue;

    for (const comboPartner of kwDef.comboWith) {
      // Self-combo (e.g., Rally + Rally)
      if (comboPartner === kwId && keywordCounts[kwId] >= 2) {
        combos.push({
          keyword: kwId,
          partner: comboPartner,
          type: 'self_combo',
          effect: kwDef.comboEffect,
        });
      }
      // Cross-combo (e.g., Block + Stack)
      else if (comboPartner !== kwId && activeKeywords.has(comboPartner)) {
        // Avoid duplicate combos (A+B is same as B+A)
        const key = [kwId, comboPartner].sort().join('+');
        if (!combos.find(c => [c.keyword, c.partner].sort().join('+') === key)) {
          combos.push({
            keyword: kwId,
            partner: comboPartner,
            type: 'cross_combo',
            effect: kwDef.comboEffect,
          });
        }
      }
    }
  }

  return combos;
}

/**
 * Apply combo effects to the game state.
 * @param {object} state - Current game state
 * @param {object[]} combos - Detected combos from detectCombos()
 * @returns {{ statePatch: object, effects: string[] }}
 */
export function applyCombos(state, combos) {
  const effects = [];
  const patch = {};

  for (const combo of combos) {
    switch (combo.type === 'cross_combo' ? `${combo.keyword}+${combo.partner}` : combo.keyword) {
      case 'block+stack': {
        // Double Block Points (handled in combat.js, signal here)
        effects.push('⛨ BLOCK + STACK: +4 Block Points (doubled)');
        patch._comboBlockDoubled = true;
        break;
      }

      case 'connect': {
        // Double connect = reveal extra stat
        effects.push('◆ CONNECT × 2: Extra hidden stat revealed');
        patch._comboExtraConnect = true;
        break;
      }

      case 'flip+snitch': {
        // Betrayal preview before it fires
        effects.push('☠ FLIP + SNITCH: Betrayal revealed early — chance to Burn');
        patch._comboBetrayalPreview = true;
        break;
      }

      case 'hustle+tax': {
        // Net positive influence
        effects.push('💰 HUSTLE + TAX: Net positive Influence turn');
        patch._comboHustleTax = true;
        break;
      }

      case 'fortify+peace': {
        // Unbreakable shared territory
        effects.push('🏰 FORTIFY + PEACE: Unbreakable shared territory for 1 turn');
        patch._comboFortifyPeace = true;
        break;
      }

      case 'shadow+war': {
        // Surprise attack
        effects.push('👻 SHADOW + WAR: Surprise attack — rival cannot prepare Block Points');
        patch._comboShadowWar = true;
        break;
      }

      case 'rally': {
        // Squad buff
        effects.push('📢 RALLY × 2: +2 loyalty to all People Cards in block (squad buff)');
        patch._comboDoubleRally = true;
        break;
      }

      default:
        effects.push(`COMBO: ${combo.effect}`);
    }
  }

  return { statePatch: patch, effects };
}

/**
 * Get the display string for a card's keywords.
 * @param {string[]} keywords
 * @returns {string}
 */
export function formatKeywords(keywords) {
  return keywords
    .map(kw => {
      const def = KEYWORD_MAP[kw.toLowerCase()];
      return def ? `${def.icon} ${def.name.toUpperCase()}` : kw;
    })
    .join('  ');
}

/**
 * Check if a card has a specific keyword.
 * @param {object} card
 * @param {string} keyword
 * @returns {boolean}
 */
export function hasKeyword(card, keyword) {
  return (card.keywords || []).some(k => k.toLowerCase() === keyword.toLowerCase());
}
