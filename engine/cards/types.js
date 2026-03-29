/**
 * BL0CKS Card Types
 * 
 * Defines all card type schemas, roles, and validation logic.
 * Cards are the atomic unit of gameplay — every interaction flows through cards.
 * 
 * From GDD §4.1:
 * Block Cards, People Cards, Move Cards, Event Cards, Status Cards, Intel Cards, DLC Cards
 */

/**
 * Card type enum.
 */
export const CARD_TYPES = Object.freeze({
  BLOCK:  'block',
  PEOPLE: 'people',
  MOVE:   'move',
  EVENT:  'event',
  STATUS: 'status',
  INTEL:  'intel',
  DLC:    'dlc',
});

/**
 * People Card roles.
 */
export const ROLES = Object.freeze({
  ENFORCER:  'enforcer',
  BROKER:    'broker',
  INFORMANT: 'informant',
  RUNNER:    'runner',
});

/**
 * Max cards in hand by type.
 */
export const HAND_LIMITS = Object.freeze({
  people: 5,
  move: 3,
  statusCountsAgainst: true, // Status cards eat into hand limit
});

/**
 * Default hand fill target.
 */
export const HAND_SIZE = 5;

/**
 * Role icons for CLI/UI rendering.
 */
export const ROLE_ICONS = Object.freeze({
  enforcer:  '⚔️',
  broker:    '🤝',
  informant: '👁️',
  runner:    '🏃',
});

/**
 * Create a People Card.
 * @param {object} data
 * @returns {object}
 */
export function createPeopleCard(data) {
  return {
    id: data.id || generateCardId(),
    type: CARD_TYPES.PEOPLE,
    name: data.name || 'Unknown',
    role: data.role || ROLES.RUNNER,
    faction: data.faction || '',
    block: data.block || '',
    loyalty: data.loyalty ?? data.loyalty_visible ?? 5,
    keywords: data.keywords || [],
    cost: data.cost ?? getRoleCost(data.role),
    // Hidden layer (engine-only, never rendered without Intel)
    _hidden: {
      loyaltyTrue: data.loyalty_hidden ?? data.loyalty ?? 5,
      trueMotive: data.true_motive || '',
      flipTrigger: data.flip_trigger || '',
      betrayalThreshold: data.betrayal_threshold ?? 5,
      secretAllegiance: data.secret_allegiance || data.faction || '',
    },
    _exhausted: false,
    _source: data._source || 'deck',
  };
}

/**
 * Create a Move Card.
 * @param {object} data
 * @returns {object}
 */
export function createMoveCard(data) {
  return {
    id: data.id || generateCardId(),
    type: CARD_TYPES.MOVE,
    name: (data.name || 'UNKNOWN').toUpperCase(),
    description: data.description || '',
    cost: data.cost ?? getMoveCost(data.name),
    clockCost: data.clockCost ?? getMoveClockCost(data.name),
    keywords: data.keywords || [],
    _exhausted: false,
    _source: data._source || 'deck',
  };
}

/**
 * Create a Status Card (Heat, Paranoia — dead draws that clog hand).
 * @param {object} data
 * @returns {object}
 */
export function createStatusCard(data) {
  return {
    id: data.id || generateCardId(),
    type: CARD_TYPES.STATUS,
    name: (data.name || 'UNKNOWN').toUpperCase(),
    description: data.description || '',
    // Status cards cannot be "played" — only exhausted (burned)
    cost: Infinity,
    _source: data._source || 'injected',
  };
}

/**
 * Create an Event Card (auto-triggered environmental chaos).
 * @param {object} data
 * @returns {object}
 */
export function createEventCard(data) {
  return {
    id: data.id || generateCardId(),
    type: CARD_TYPES.EVENT,
    name: data.name || 'Unknown Event',
    description: data.description || '',
    effect: data.effect || null,
    heatImpact: data.heatImpact ?? 0,
    _source: data._source || 'system',
  };
}

/**
 * Create an Intel Card.
 * @param {object} data
 * @returns {object}
 */
export function createIntelCard(data) {
  return {
    id: data.id || generateCardId(),
    type: CARD_TYPES.INTEL,
    name: data.name || 'INTEL',
    description: data.description || 'Reveal one hidden stat on any People Card.',
    cost: data.cost ?? 0, // Intel tokens are separate from Influence
    _source: data._source || 'earned',
  };
}

/**
 * Get the influence cost for a role.
 * @param {string} role
 * @returns {number}
 */
function getRoleCost(role) {
  const costs = { enforcer: 2, broker: 1, informant: 1, runner: 1 };
  return costs[role?.toLowerCase()] ?? 1;
}

/**
 * Get the influence cost for a move.
 * @param {string} move
 * @returns {number}
 */
function getMoveCost(move) {
  const costs = { TAX: 1, GHOST: 0, SNITCH: 2, STACK: 2, WAR: 3, PEACE: 1, BURN: 0 };
  return costs[move?.toUpperCase()] ?? 1;
}

/**
 * Get the clock cost for a move.
 * @param {string} move
 * @returns {number}
 */
function getMoveClockCost(move) {
  const costs = { TAX: 1, GHOST: 0, SNITCH: 2, STACK: 2, WAR: 1, PEACE: 1, BURN: 0 };
  return costs[move?.toUpperCase()] ?? 1;
}

/**
 * Validate a card object.
 * @param {object} card
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateCard(card) {
  const errors = [];

  if (!card.type || !Object.values(CARD_TYPES).includes(card.type)) {
    errors.push(`Invalid card type: ${card.type}`);
  }

  if (!card.name) {
    errors.push('Card must have a name');
  }

  if (card.type === 'people') {
    if (!card.role || !Object.values(ROLES).includes(card.role?.toLowerCase())) {
      errors.push(`Invalid role: ${card.role}. Must be one of: ${Object.values(ROLES).join(', ')}`);
    }

    const loyalty = typeof card.loyalty === 'number' ? card.loyalty : parseInt(card.loyalty);
    if (isNaN(loyalty) || loyalty < 0 || loyalty > 10) {
      errors.push(`Loyalty must be 0-10, got: ${card.loyalty}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Generate a unique card ID.
 * @returns {string}
 */
function generateCardId() {
  return `card_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}
