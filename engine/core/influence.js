/**
 * BL0CKS Influence Economy
 * 
 * Influence is the per-turn action currency. The single most important number in the game.
 * 
 * Rules (from GDD §4.7):
 * - Base Influence per turn: 3 (modifiable by assets like OG Status → 4)
 * - Max Influence per turn: 6 (hard cap, no stacking beyond)
 * - Unspent Influence does NOT carry over
 * - Generation: Powered Tax (+1 next turn), Burn Status Card (+1 immediate), asset effects
 */

/** Default base influence per turn */
export const BASE_INFLUENCE = 3;

/** Hard cap — cannot exceed this regardless of assets/bonuses */
export const MAX_INFLUENCE = 6;

/**
 * Move card influence costs from GDD §4.4
 */
export const MOVE_COSTS = Object.freeze({
  TAX:    1,
  GHOST:  0,
  SNITCH: 2,
  STACK:  2,
  WAR:    3,
  PEACE:  1,
  BURN:   0,
});

/**
 * People card influence costs by role (from GDD §4.7 example)
 */
export const ROLE_COSTS = Object.freeze({
  enforcer:  2,
  broker:    1,
  informant: 1,
  runner:    1,
});

/**
 * Calculate the base influence for a turn, considering assets.
 * @param {object[]} assets - Active stash assets
 * @returns {number}
 */
export function calculateBaseInfluence(assets = []) {
  let base = BASE_INFLUENCE;

  // OG Status: +1 base influence per turn
  if (assets.some(a => a.id === 'og_status')) {
    base += 1;
  }

  return Math.min(base, MAX_INFLUENCE);
}

/**
 * Reset influence at dawn phase (start of turn).
 * @param {object} state - Current game state
 * @returns {object} Patch with updated influence
 */
export function resetInfluence(state) {
  const base = calculateBaseInfluence(state.assets || []);

  // Check for influence bonus from previous turn (e.g., Powered Tax)
  const bonus = state._influenceBonus || 0;
  const total = Math.min(base + bonus, MAX_INFLUENCE);

  return {
    influence: total,
    baseInfluence: base,
    _influenceBonus: 0, // Clear the bonus after applying
  };
}

/**
 * Spend influence to play a card.
 * @param {object} state - Current game state
 * @param {number} cost - Influence cost
 * @returns {{ success: boolean, state?: object, error?: string }}
 */
export function spendInfluence(state, cost) {
  if (cost < 0) {
    return { success: false, error: 'Cost cannot be negative' };
  }

  if (cost === 0) {
    return { success: true, state: {} };
  }

  if (state.influence < cost) {
    return {
      success: false,
      error: `Not enough Influence. Need ${cost}, have ${state.influence}.`,
    };
  }

  return {
    success: true,
    state: { influence: state.influence - cost },
  };
}

/**
 * Generate influence (from Hustle keyword, Burn bonus, etc.).
 * @param {object} state - Current game state
 * @param {number} amount - Influence to generate
 * @param {string} source - What generated it (for event logging)
 * @returns {object} State patch
 */
export function generateInfluence(state, amount, source = 'unknown') {
  const newInfluence = Math.min(state.influence + amount, MAX_INFLUENCE);
  return {
    influence: newInfluence,
    _lastInfluenceSource: source,
  };
}

/**
 * Set a deferred influence bonus for next turn (e.g., from Powered Tax).
 * @param {object} state - Current game state
 * @param {number} bonus
 * @returns {object} State patch
 */
export function deferInfluenceBonus(state, bonus) {
  return {
    _influenceBonus: (state._influenceBonus || 0) + bonus,
  };
}

/**
 * Get the influence cost for a card.
 * @param {object} card - Card object
 * @returns {number}
 */
export function getCardCost(card) {
  if (card.type === 'move') {
    return MOVE_COSTS[card.name?.toUpperCase()] ?? 1;
  }

  if (card.type === 'people') {
    return card.cost ?? ROLE_COSTS[card.role?.toLowerCase()] ?? 1;
  }

  // Status cards cannot be played normally
  if (card.type === 'status') {
    return Infinity;
  }

  return card.cost ?? 1;
}

/**
 * Check if a card can be afforded.
 * @param {object} state - Current game state
 * @param {object} card
 * @returns {boolean}
 */
export function canAfford(state, card) {
  const cost = getCardCost(card);
  return state.influence >= cost;
}
