/**
 * BL0CKS Game Controller
 * 
 * The master game state machine. Manages the turn loop, session lifecycle,
 * and coordinates between the AI adapter, ROM content, and event bus.
 * 
 * This module owns GAME LOGIC. It does not own rendering, input, or AI communication.
 */

import { parseResponse } from '../ai/response-parser.js';
import { buildSystemPrompt } from '../ai/prompt-builder.js';

/**
 * @typedef {Object} GameSession
 * @property {string} romId
 * @property {string} levelId
 * @property {object} state - Current parsed game state
 * @property {object} ledger - Persistent consequence tracker
 * @property {number} turnCount
 * @property {string} adapterName
 */

export class GameController {
  #adapter = null;
  #rom = null;
  #romInfo = null;
  #events = null;
  #currentLevel = null;
  #currentState = null;
  #ledger = {};
  #turnCount = 0;
  #sessionActive = false;

  /**
   * @param {object} adapter - AI adapter (implements adapter interface)
   * @param {object} rom - Loaded ROM content
   * @param {object} romInfo - ROM identity info
   * @param {import('../events/emitter.js').EventBus} events - Engine event bus
   */
  constructor(adapter, rom, romInfo, events) {
    this.#adapter = adapter;
    this.#rom = rom;
    this.#romInfo = romInfo;
    this.#events = events;
  }

  /**
   * Start a new game session with a specific level.
   * @param {string} levelId - Level id from the ROM manifest
   * @param {object} [existingLedger] - Carry-forward ledger from prior sessions
   * @returns {Promise<object>} Initial game state
   */
  async startLevel(levelId, existingLedger = null) {
    const level = this.#rom.levels.find(l => l.id === levelId);
    if (!level) {
      const available = this.#rom.levels.map(l => l.id).join(', ');
      throw new Error(`Level "${levelId}" not found in ROM. Available: ${available}`);
    }

    this.#currentLevel = level;
    this.#ledger = existingLedger || {};
    this.#turnCount = 0;
    this.#sessionActive = true;

    // Build system prompt from ROM + engine directives
    const systemPrompt = buildSystemPrompt(this.#rom, {
      romInfo: this.#romInfo,
      currentLevel: level,
      ledger: Object.keys(this.#ledger).length > 0 ? this.#ledger : null,
    });

    this.#events.emit('session.start', {
      romId: this.#rom._manifest.id,
      levelId,
      levelName: level.name,
      isDLC: level._isDLC || false,
      isCommunity: level._isCommunity || false,
      sourceROM: level._sourceROM || this.#rom._manifest.id,
    });

    this.#events.emit('ai.thinking', { action: 'initializing' });

    const aiResponse = await this.#adapter.start(systemPrompt, level.content);
    const state = parseResponse(aiResponse);

    // Augment state with ROM identity
    state._romInfo = this.#buildLevelROMInfo();

    this.#currentState = state;
    this.#turnCount = 1;

    this.#events.emit('ai.response', { raw: aiResponse });
    this.#events.emit('turn.rendered', state);

    return state;
  }

  /**
   * Send a player action and receive the updated game state.
   * @param {string} input - Player's raw input
   * @returns {Promise<object>} Updated game state
   */
  async sendAction(input) {
    if (!this.#sessionActive) {
      throw new Error('No active session. Call startLevel() first.');
    }

    this.#events.emit('action.sent', { input, turn: this.#turnCount });
    this.#events.emit('ai.thinking', { action: input });

    const aiResponse = await this.#adapter.send(input);
    const state = parseResponse(aiResponse);

    // Augment with ROM identity
    state._romInfo = this.#buildLevelROMInfo();

    this.#currentState = state;
    this.#turnCount++;

    this.#events.emit('ai.response', { raw: aiResponse });
    this.#events.emit('action.resolved', { input, state });
    this.#events.emit('turn.rendered', state);

    // Check for game end
    if (state.outcome === 'win') {
      this.#events.emit('game.win', state);
      this.#events.emit('game.over', { outcome: 'win', state });
      this.#sessionActive = false;
    } else if (state.outcome === 'loss') {
      this.#events.emit('game.loss', state);
      this.#events.emit('game.over', { outcome: 'loss', state });
      this.#sessionActive = false;
    }

    return state;
  }

  /**
   * Get current game state snapshot.
   * @returns {object | null}
   */
  getState() {
    return this.#currentState;
  }

  /**
   * Get ROM identity info for the current level (for HUD rendering).
   * @returns {object}
   */
  getROMInfo() {
    return {
      base: this.#romInfo.base,
      activeOverlays: this.#romInfo.activeOverlays,
      currentLevel: this.#currentLevel
        ? {
            id: this.#currentLevel.id,
            name: this.#currentLevel.name,
            sourceROM: this.#currentLevel._sourceROM || this.#rom._manifest.id,
            isDLC: this.#currentLevel._isDLC || false,
            isCommunity: this.#currentLevel._isCommunity || false,
          }
        : null,
      edition: null, // Set by engine after adapter detection
      displayBadge: this.#buildDisplayBadge(),
      branding: this.#romInfo.branding,
    };
  }

  /**
   * List all levels available in the loaded ROM (including overlays).
   * @returns {object[]}
   */
  listLevels() {
    return this.#rom.levels.map(l => ({
      id: l.id,
      name: l.name,
      type: l.type,
      isDLC: l._isDLC || false,
      isCommunity: l._isCommunity || false,
      sourceROM: l._sourceROM || this.#rom._manifest.id,
    }));
  }

  /**
   * Export session state for save/resume.
   * @returns {object}
   */
  exportSession() {
    return {
      romId: this.#rom._manifest.id,
      levelId: this.#currentLevel?.id,
      adapterName: this.#adapter.name,
      adapterState: this.#adapter.exportState(),
      ledger: this.#ledger,
      turnCount: this.#turnCount,
      timestamp: Date.now(),
    };
  }

  /**
   * Resume a session from saved state.
   * @param {object} session - Previously exported session
   * @returns {string} Last AI response text
   */
  resumeSession(session) {
    this.#currentLevel = this.#rom.levels.find(l => l.id === session.levelId);
    this.#ledger = session.ledger || {};
    this.#turnCount = session.turnCount || 0;
    this.#sessionActive = true;

    const lastResponse = this.#adapter.resume(session.adapterState);
    this.#currentState = parseResponse(lastResponse);
    this.#currentState._romInfo = this.#buildLevelROMInfo();

    this.#events.emit('session.resume', {
      romId: session.romId,
      levelId: session.levelId,
      turnCount: this.#turnCount,
    });

    return this.#currentState;
  }

  /**
   * Get / set the persistent ledger.
   */
  getLedger() { return { ...this.#ledger }; }
  setLedger(ledger) { this.#ledger = { ...ledger }; }

  /**
   * Whether a game session is currently active.
   */
  get isActive() { return this.#sessionActive; }

  /**
   * Current turn count.
   */
  get turnCount() { return this.#turnCount; }

  // ── Private helpers ──

  #buildLevelROMInfo() {
    if (!this.#currentLevel) return null;

    const isDLC = this.#currentLevel._isDLC || false;
    const isCommunity = this.#currentLevel._isCommunity || false;

    if (!isDLC && !isCommunity) return null;

    return {
      sourceROM: this.#currentLevel._sourceROM,
      isDLC,
      isCommunity,
      badge: this.#buildDisplayBadge(),
    };
  }

  #buildDisplayBadge() {
    if (!this.#currentLevel) return null;

    const isDLC = this.#currentLevel._isDLC || false;
    const isCommunity = this.#currentLevel._isCommunity || false;

    if (!isDLC && !isCommunity) return null;

    // Check overlays for branding
    const overlay = this.#romInfo.activeOverlays?.find(
      o => o.id === this.#currentLevel._sourceROM
    );

    if (overlay) return overlay.badge;

    // Fallback
    const icon = isCommunity ? '🌐' : '🔓';
    const label = this.#currentLevel._sourceROM || 'DLC';
    return `${icon} ${label.toUpperCase()}`;
  }
}
