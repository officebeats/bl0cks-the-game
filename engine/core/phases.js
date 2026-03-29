/**
 * BL0CKS Phase System
 * 
 * Implements the 10-phase turn sequence from the GDD:
 * Dawn → Draw → Street Whisper → Scheme → Act → Combo → Burn → Intent Resolves → Heat Check → Dusk
 * 
 * Player has agency in phases 4–7 (Scheme, Act, Combo, Burn).
 * All other phases are engine-resolved.
 */

/**
 * The 10 phases of a BL0CKS turn, in execution order.
 */
export const PHASES = Object.freeze([
  { id: 'dawn',           index: 0, name: 'Dawn',            actor: 'engine', description: 'Influence resets to base. Start-of-turn Asset effects trigger.' },
  { id: 'draw',           index: 1, name: 'Draw',            actor: 'engine', description: 'Fill hand to limit (5 cards). Status cards count against hand limit.' },
  { id: 'street_whisper', index: 2, name: 'Street Whisper',  actor: 'engine', description: 'AI broadcasts predictive intent — what rivals will do if unblocked.' },
  { id: 'scheme',         index: 3, name: 'Scheme',          actor: 'player', description: 'Player surveys board. Plans turn. No Influence spent yet.' },
  { id: 'act',            index: 4, name: 'Act',             actor: 'player', description: 'Player plays cards. Each costs Influence. Triggers choices/gambits.' },
  { id: 'combo',          index: 5, name: 'Combo',           actor: 'engine', description: 'Keyword triggers chain-resolve. Bonus effects apply.' },
  { id: 'burn',           index: 6, name: 'Burn',            actor: 'player', description: 'Optional: Exhaust one card permanently from deck.' },
  { id: 'intent_resolve', index: 7, name: 'Intent Resolves', actor: 'engine', description: 'Unblocked Street Whisper intents execute. Territory flips, loyalty drops.' },
  { id: 'heat_check',     index: 8, name: 'Heat Check',      actor: 'engine', description: 'Global Heat Meter advances. Threshold modifiers checked.' },
  { id: 'dusk',           index: 9, name: 'Dusk',            actor: 'engine', description: 'Clock ticks by action cost. Win/loss checked. Next turn or level end.' },
]);

/**
 * Map of phase id → phase object for fast lookup.
 */
export const PHASE_MAP = Object.freeze(
  Object.fromEntries(PHASES.map(p => [p.id, p]))
);

/**
 * Phase lifecycle manager for a single turn.
 */
export class TurnPhaseRunner {
  #currentIndex = -1;
  #handlers = new Map();
  #events = null;
  #turnNumber = 0;

  /**
   * @param {import('../events/emitter.js').EventBus} events
   */
  constructor(events) {
    this.#events = events;
  }

  /**
   * Register a handler for a specific phase.
   * @param {string} phaseId - Phase id (e.g., 'dawn', 'act')
   * @param {function} handler - Async function(state) → state
   */
  onPhase(phaseId, handler) {
    if (!PHASE_MAP[phaseId]) {
      throw new Error(`Unknown phase: "${phaseId}". Valid: ${PHASES.map(p => p.id).join(', ')}`);
    }
    if (!this.#handlers.has(phaseId)) {
      this.#handlers.set(phaseId, []);
    }
    this.#handlers.get(phaseId).push(handler);
  }

  /**
   * Execute a complete turn through all 10 phases.
   * @param {object} state - Current game state
   * @param {object} [context] - Additional context (player input, etc.)
   * @returns {Promise<object>} Final state after all phases
   */
  async executeTurn(state, context = {}) {
    this.#turnNumber++;
    let currentState = { ...state, turn: this.#turnNumber };

    this.#events?.emit('turn.start', { turn: this.#turnNumber });

    for (let i = 0; i < PHASES.length; i++) {
      const phase = PHASES[i];
      this.#currentIndex = i;

      currentState = { ...currentState, phase: phase.id };
      this.#events?.emit('phase.enter', { phase: phase.id, name: phase.name, turn: this.#turnNumber });

      // Run registered handlers for this phase
      const handlers = this.#handlers.get(phase.id) || [];
      for (const handler of handlers) {
        const result = await handler(currentState, { ...context, phase, turn: this.#turnNumber });
        if (result) {
          currentState = { ...currentState, ...result };
        }
      }

      this.#events?.emit('phase.exit', { phase: phase.id, name: phase.name, turn: this.#turnNumber });

      // Check for early termination (win/loss)
      if (currentState.outcome) {
        this.#events?.emit('turn.end', { turn: this.#turnNumber, outcome: currentState.outcome });
        return currentState;
      }
    }

    this.#events?.emit('turn.end', { turn: this.#turnNumber, outcome: null });
    return currentState;
  }

  /**
   * Get the current phase.
   * @returns {object|null}
   */
  get currentPhase() {
    return this.#currentIndex >= 0 ? PHASES[this.#currentIndex] : null;
  }

  /**
   * Get the current turn number.
   */
  get turnNumber() {
    return this.#turnNumber;
  }

  /**
   * Check if a phase requires player input.
   * @param {string} phaseId
   * @returns {boolean}
   */
  static isPlayerPhase(phaseId) {
    return PHASE_MAP[phaseId]?.actor === 'player';
  }

  /**
   * Get the next phase after the given one, or null if at end of turn.
   * @param {string} phaseId
   * @returns {object|null}
   */
  static nextPhase(phaseId) {
    const phase = PHASE_MAP[phaseId];
    if (!phase) return null;
    return PHASES[phase.index + 1] || null;
  }
}
