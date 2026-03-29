/**
 * BL0CKS Combat System
 * 
 * War resolution logic. When a player plays WAR against a rival territory,
 * combat resolves by comparing combined loyalty of the player's People Cards
 * in/adjacent to the target vs. rival NPCs.
 * 
 * From GDD §4.4 (War card spec):
 * - Cost: 3 Influence (2 with Blitz from consecutive Wars)
 * - Resolution: Highest combined visible loyalty wins
 * - Winner takes territory
 * - War generates +1 Heat (Blitz: +2 Heat)
 * - Clock cost: 1 tick
 */

/**
 * @typedef {Object} CombatResult
 * @property {'victory'|'defeat'|'stalemate'} outcome
 * @property {number} playerStrength
 * @property {number} rivalStrength
 * @property {string} territory - Territory fought over
 * @property {object[]} casualties - People cards lost
 * @property {number} heatGenerated
 * @property {string} narrative - Flavor text seed for AI
 */

/**
 * Resolve a War action against a territory.
 * @param {object} params
 * @param {string} params.targetTerritory - Territory being attacked
 * @param {object[]} params.playerCards - Player's People Cards (with loyalty, block, keywords)
 * @param {object[]} params.rivalCards - Rival NPCs in the target territory
 * @param {object[]} [params.assets] - Player's active assets
 * @param {number} [params.blockPoints] - Block Points defending the territory
 * @param {boolean} [params.isBlitz] - Whether Blitz is active (consecutive Wars)
 * @param {boolean} [params.isShadow] - Whether Shadow keyword was used (surprise)
 * @returns {CombatResult}
 */
export function resolveWar(params) {
  const {
    targetTerritory,
    playerCards = [],
    rivalCards = [],
    assets = [],
    blockPoints = 0,
    isBlitz = false,
    isShadow = false,
  } = params;

  // Calculate player strength: sum of visible loyalty of attacking People Cards
  let playerStrength = playerCards.reduce((sum, card) => {
    const loyalty = typeof card.loyalty === 'number' ? card.loyalty : parseInt(card.loyalty) || 0;
    return sum + loyalty;
  }, 0);

  // Corner Armory asset: Enforcers gain +1
  if (assets.some(a => a.id === 'corner_armory')) {
    const enforcerBonus = playerCards.filter(c => c.role?.toLowerCase() === 'enforcer').length;
    playerStrength += enforcerBonus;
  }

  // Calculate rival strength: sum of loyalty + block points
  let rivalStrength = rivalCards.reduce((sum, card) => {
    const loyalty = typeof card.loyalty === 'number' ? card.loyalty : parseInt(card.loyalty) || 0;
    return sum + loyalty;
  }, 0);

  // Block points absorb damage (effectively increase rival defense)
  if (!isShadow) {
    // Shadow keyword bypasses block points
    rivalStrength += blockPoints;
  }

  // Determine outcome
  let outcome;
  const casualties = [];
  let heatGenerated = isBlitz ? 2 : 1;

  if (playerStrength > rivalStrength) {
    outcome = 'victory';
  } else if (playerStrength === rivalStrength) {
    outcome = 'stalemate';
    // In a stalemate, both sides lose their weakest card
    const weakestPlayer = getWeakestCard(playerCards);
    if (weakestPlayer) casualties.push({ ...weakestPlayer, side: 'player' });
  } else {
    outcome = 'defeat';
    // Defeat: player loses their weakest card
    const weakestPlayer = getWeakestCard(playerCards);
    if (weakestPlayer) casualties.push({ ...weakestPlayer, side: 'player' });
  }

  // Bail Money asset: once per level, prevent a People Card loss in failed War
  if (casualties.some(c => c.side === 'player') && assets.some(a => a.id === 'bail_money' && !a._usedThisLevel)) {
    const playerCasualty = casualties.findIndex(c => c.side === 'player');
    if (playerCasualty >= 0) {
      casualties[playerCasualty]._savedByBailMoney = true;
    }
  }

  // Generate narrative seed
  const narrative = generateNarrative(outcome, targetTerritory, playerStrength, rivalStrength, isBlitz, isShadow);

  return {
    outcome,
    playerStrength,
    rivalStrength,
    territory: targetTerritory,
    casualties: casualties.filter(c => !c._savedByBailMoney),
    heatGenerated,
    narrative,
  };
}

/**
 * Check if Blitz condition is met (War played in 2 consecutive turns).
 * @param {number[]} warTurns - Turn numbers where War was played
 * @param {number} currentTurn
 * @returns {boolean}
 */
export function isBlitzActive(warTurns, currentTurn) {
  return warTurns.includes(currentTurn - 1);
}

/**
 * Calculate Block Points for a territory.
 * Block Points are temporary shields from Stack + Enforcer keywords.
 * @param {object} params
 * @param {boolean} params.stackPlayed - Was Stack played this turn?
 * @param {boolean} params.enforcerInBlock - Is an Enforcer in this block?
 * @param {object[]} [params.assets] - Active assets
 * @returns {number} Block Points
 */
export function calculateBlockPoints({ stackPlayed, enforcerInBlock, assets = [] }) {
  if (!stackPlayed) return 0;

  // Base: Stack = +2 BP, Stack + Enforcer combo = +4 BP
  let bp = enforcerInBlock ? 4 : 2;

  // Corner Armory: Enforcers gain +1 BP when defending
  if (enforcerInBlock && assets.some(a => a.id === 'corner_armory')) {
    bp += 1;
  }

  return bp;
}

/**
 * Get the weakest card from a set (lowest loyalty).
 * @param {object[]} cards
 * @returns {object|null}
 */
function getWeakestCard(cards) {
  if (cards.length === 0) return null;

  return cards.reduce((weakest, card) => {
    const loyalty = typeof card.loyalty === 'number' ? card.loyalty : parseInt(card.loyalty) || 0;
    const weakestLoyalty = typeof weakest.loyalty === 'number' ? weakest.loyalty : parseInt(weakest.loyalty) || 0;
    return loyalty < weakestLoyalty ? card : weakest;
  });
}

/**
 * Generate a narrative seed for the AI to expand upon.
 * @returns {string}
 */
function generateNarrative(outcome, territory, playerStr, rivalStr, isBlitz, isShadow) {
  const diff = Math.abs(playerStr - rivalStr);
  const margin = diff <= 2 ? 'narrow' : diff <= 5 ? 'clear' : 'dominant';

  if (outcome === 'victory') {
    if (isShadow) return `Shadow war on ${territory}. They never saw it coming. ${margin} victory.`;
    if (isBlitz) return `Blitz assault on ${territory}. Relentless pressure. ${margin} takeover.`;
    return `War for ${territory}. Your crew held it down. ${margin} victory.`;
  }

  if (outcome === 'defeat') {
    return `War for ${territory} went sideways. Rival crew held the block. ${margin} loss.`;
  }

  return `Stalemate at ${territory}. Both sides took hits. Nobody's claiming that corner tonight.`;
}
