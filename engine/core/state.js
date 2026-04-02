/**
 * BL0CKS State Manager
 * 
 * Immutable game state container. All state mutations produce new state objects.
 * The engine never mutates state in place — this enables undo, replay, and debugging.
 * 
 * State shape mirrors the response-parser output but adds engine-tracked fields
 * (influence, heat, assets, deck, etc.) that the AI doesn't own.
 */

/**
 * @typedef {Object} GameState
 * @property {number} turn
 * @property {string} phase - Current phase name
 * @property {number} influence - Current influence budget
 * @property {number} maxInfluence - Max influence (default 6)
 * @property {number} baseInfluence - Base influence per turn (default 3)
 * @property {number} heat - Current heat level
 * @property {number} clock - Current clock ticks elapsed
 * @property {number} clockTotal - Total clock ticks for level
 * @property {Territory[]} territories
 * @property {Card[]} hand
 * @property {Card[]} deck
 * @property {Card[]} exhaustPile - Permanently removed cards
 * @property {Asset[]} assets - Active stash assets
 * @property {number} intel - Intel tokens remaining
 * @property {object|null} choice - Pending choice/gambit
 * @property {string|null} outcome - 'win' | 'loss' | null
 * @property {object} ledger - Persistent consequence tracker
 * @property {object} _meta - Engine metadata
 */

const INITIAL_STATE = Object.freeze({
  turn: 0,
  phase: 'idle',
  influence: 3,
  maxInfluence: 6,
  baseInfluence: 3,
  heat: 0,
  clock: 0,
  clockTotal: 12,
  territories: [],
  hand: [],
  deck: [],
  exhaustPile: [],
  assets: [],
  intel: 2,
  choice: null,
  outcome: null,
  ledger: {},
  _meta: {
    romId: null,
    levelId: null,
    stateVersion: 1,
  },
});

/**
 * Create a fresh initial game state.
 * @param {object} [overrides] - Partial state to merge onto defaults
 * @returns {GameState}
 */
export function createState(overrides = {}) {
  return deepFreeze({
    ...INITIAL_STATE,
    ...overrides,
    _meta: { ...INITIAL_STATE._meta, ...overrides._meta },
  });
}

/**
 * Immutably update state. Returns a new frozen state object.
 * @param {GameState} state - Current state
 * @param {object} patch - Partial update to merge
 * @returns {GameState}
 */
export function updateState(state, patch) {
  const next = { ...state };

  for (const [key, value] of Object.entries(patch)) {
    if (key === '_meta') {
      next._meta = { ...state._meta, ...value };
    } else if (key === 'ledger') {
      next.ledger = { ...state.ledger, ...value };
    } else if (Array.isArray(value)) {
      next[key] = [...value];
    } else if (value !== null && typeof value === 'object') {
      next[key] = { ...value };
    } else {
      next[key] = value;
    }
  }

  return deepFreeze(next);
}

/**
 * Create a state snapshot for save/export.
 * Strips internal metadata and freezing.
 *
 * Performance: Uses structuredClone when available (V8 >= 105, Node >= 17)
 * instead of JSON round-trip, which loses undefined values, functions, and
 * circular references. Falls back to JSON for older runtimes.
 * @param {GameState} state
 * @returns {object}
 */
export function exportState(state) {
  if (typeof structuredClone === 'function') {
    return structuredClone(state);
  }
  return JSON.parse(JSON.stringify(state));
}

/**
 * Validate that a state object has all required fields.
 * @param {object} state
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateState(state) {
  const errors = [];
  const required = ['turn', 'phase', 'influence', 'heat', 'clock', 'territories', 'hand'];

  for (const field of required) {
    if (state[field] === undefined) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  if (typeof state.influence === 'number' && state.influence < 0) {
    errors.push('Influence cannot be negative');
  }

  if (typeof state.heat === 'number' && state.heat < 0) {
    errors.push('Heat cannot be negative');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Deep freeze an object and all nested objects/arrays.
 * @param {object} obj
 * @returns {object}
 */
function deepFreeze(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  Object.freeze(obj);
  for (const value of Object.values(obj)) {
    if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
      deepFreeze(value);
    }
  }
  return obj;
}
