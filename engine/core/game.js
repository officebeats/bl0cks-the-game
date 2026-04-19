/**
 * BL0CKS Game Controller (v2)
 * 
 * The master game state machine. Manages the turn loop, session lifecycle,
 * and coordinates between the AI adapter, ROM content, and event bus.
 * 
 * v2 integrates all new engine modules:
 *   - State manager (immutable state)
 *   - Phase system (10-phase turn)
 *   - Influence economy (action budget)
 *   - Heat system (escalation pressure)
 *   - Ledger (persistent consequences)
 *   - Cards (keywords, combos, gambits)
 *   - Scoring (level grades)
 * 
 * This module owns GAME LOGIC. It does not own rendering, input, or AI communication.
 */

import { parseResponse } from '../ai/response-parser.js';
import { buildSystemPrompt } from '../ai/prompt-builder.js';
import { createState, updateState, exportState } from './state.js';
import { PHASES, TurnPhaseRunner } from './phases.js';
import { resetInfluence, calculateBaseInfluence } from './influence.js';
import { increaseHeat, decreaseHeat, heatCheckPhase, getHeatThreshold, getActiveModifiers, HEAT_CAP } from './heat.js';
import { createLedger, recordLevelComplete, serializeLedger, getLoyaltyModifier, addGrudge, addDebt, addBurnedBridge, updateReputation, addGhostTerritory, incrementBodyCount, recordAlliance, addAsset } from './ledger.js';
import { detectCombos, applyCombos } from '../cards/keywords.js';
import { calculateLevelScore } from './scoring.js';

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
  #ledger = null;
  #turnCount = 0;
  #sessionActive = false;

  // v2: Engine state tracking
  #engineState = null;
  #warTurns = [];      // Turn numbers where War was played
  #playedCards = [];    // Cards played this turn (for combo detection)
  #levelStats = null;   // Stats tracked for scoring

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
    this.#ledger = existingLedger || createLedger();
    this.#turnCount = 0;
    this.#sessionActive = true;
    this.#warTurns = [];
    this.#playedCards = [];
    this.#levelStats = {
      intelUsed: 0,
      gambitsWon: 0,
      gambitsLost: 0,
      cardsExhausted: 0,
      usedWar: false,
      territoriesLost: 0,
      peacesHonored: 0,
    };

    // Initialize engine state from level config and ledger
    const heatCarried = this.#ledger.heatCarried || 0;
    const baseInfluence = calculateBaseInfluence(
      this.#ledger.assetsHeld?.map(id => ({ id })) || []
    );

    this.#engineState = createState({
      influence: baseInfluence,
      baseInfluence,
      heat: heatCarried,
      clockTotal: level.content?.match(/Clock:\s*(\d+)/i)?.[1]
        ? parseInt(level.content.match(/Clock:\s*(\d+)/i)[1])
        : 12,
      _meta: { romId: this.#rom._manifest.id, levelId },
    });

    // Build system prompt from ROM + engine directives + ledger
    const ledgerMD = Object.keys(this.#ledger).length > 0 && this.#ledger.grudges?.length > 0
      ? serializeLedger(this.#ledger)
      : null;

    const heatThreshold = getHeatThreshold(heatCarried);
    const heatContext = heatCarried > 0
      ? `\n\n## Heat Status\nCurrent Heat: ${heatCarried}/${HEAT_CAP} — "${heatThreshold.name}"\n${heatThreshold.flavor}\n${heatThreshold.modifier ? 'Active modifiers: ' + JSON.stringify(heatThreshold.modifier) : ''}`
      : '';

    const systemPrompt = buildSystemPrompt(this.#rom, {
      romInfo: this.#romInfo,
      currentLevel: level,
      ledger: ledgerMD,
      engineContext: heatContext,
    });

    this.#events.emit('session.start', {
      romId: this.#rom._manifest.id,
      levelId,
      levelName: level.name,
      isDLC: level._isDLC || false,
      isCommunity: level._isCommunity || false,
      sourceROM: level._sourceROM || this.#rom._manifest.id,
      heat: heatCarried,
      influence: baseInfluence,
    });

    this.#events.emit('ai.thinking', { action: 'initializing' });

    const aiResponse = await this.#adapter.start(systemPrompt, level.content);
    const state = parseResponse(aiResponse);

    // Augment AI state with engine-tracked fields
    state._romInfo = this.#buildLevelROMInfo();
    state._engine = {
      influence: this.#engineState.influence,
      maxInfluence: this.#engineState.maxInfluence,
      heat: this.#engineState.heat,
      heatThreshold: heatThreshold.name,
      heatFlavor: heatThreshold.flavor,
      phase: 'scheme',
    };

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

    // --- Support Blitz Queuing (Multi-action) ---
    // Actions can be sent as an array or a string separated by "&&"
    const actions = Array.isArray(input) 
      ? input 
      : input.split('&&').map(a => a.trim()).filter(a => a.length > 0);

    const fullInput = actions.join(' && ');
    this.#events.emit('action.sent', { input: fullInput, turn: this.#turnCount, isBlitz: actions.length > 1 });
    this.#events.emit('ai.thinking', { action: fullInput });

    // --- Track all actions for engine systems ---
    for (const action of actions) {
      const upperInput = action.toUpperCase();

      // Detect War plays for Blitz tracking
      if (upperInput.includes('WAR') || (upperInput.match(/^\d+$/) && this.#currentState?.hand)) {
        const cardIdx = parseInt(upperInput) - 1;
        const card = this.#currentState.hand?.[cardIdx];
        if (card?.name?.toUpperCase() === 'WAR' || upperInput.includes('WAR')) {
          this.#warTurns.push(this.#turnCount);
          this.#levelStats.usedWar = true;
          
          // Blitzing War generates more heat
          const heatGain = actions.length > 1 ? 2 : 1;
          const heatResult = increaseHeat(this.#engineState, heatGain, actions.length > 1 ? 'war_blitz' : 'war');
          this.#engineState = updateState(this.#engineState, { heat: heatResult.heat });
          
          if (heatResult.thresholdCrossed) {
             this.#events.emit('heat.threshold', heatResult.thresholdCrossed);
             this.#events.emit('heat.beat', { threshold: heatResult.thresholdCrossed, source: 'war' });
          }
          this.#events.emit('heat.changed', { heat: heatResult.heat, source: 'war' });
        }
      }

      // Detect Intel usage
      if (upperInput.includes('INTEL')) {
        this.#levelStats.intelUsed++;
      }
    }

    // --- Auto heat tick (+1 per turn) ---
    const autoHeat = heatCheckPhase(this.#engineState);
    this.#engineState = updateState(this.#engineState, { heat: autoHeat.heat });
    if (autoHeat.thresholdCrossed) {
      this.#events.emit('heat.threshold', autoHeat.thresholdCrossed);
      this.#events.emit('heat.beat', { threshold: autoHeat.thresholdCrossed, source: 'time' });
    }

    // --- Influence reset at turn start ---
    const influenceReset = resetInfluence(this.#engineState);
    this.#engineState = updateState(this.#engineState, influenceReset);

    // --- Send to AI (as batch) ---
    const aiResponse = await this.#adapter.send(fullInput);
    const state = parseResponse(aiResponse);

    // Augment with ROM identity
    state._romInfo = this.#buildLevelROMInfo();

    // Augment with engine state
    const currentHeatThreshold = getHeatThreshold(this.#engineState.heat);
    state._engine = {
      influence: this.#engineState.influence,
      maxInfluence: this.#engineState.maxInfluence,
      heat: this.#engineState.heat,
      heatThreshold: currentHeatThreshold.name,
      heatFlavor: currentHeatThreshold.flavor,
      modifiers: getActiveModifiers(this.#engineState.heat),
      phase: 'scheme',
      turn: this.#turnCount,
    };

    this.#currentState = state;
    this.#turnCount++;

    this.#events.emit('ai.response', { raw: aiResponse });
    this.#events.emit('action.resolved', { input, state });
    this.#events.emit('turn.rendered', state);

    // ── Check for game end ──
    if (state.outcome === 'win') {
      // Calculate score
      const score = calculateLevelScore({
        outcome: 'win',
        territories: state.territories || [],
        clockRemaining: Math.max(0, (state.clock?.total || 12) - (state.clock?.current || 0)),
        hand: state.hand || [],
        heat: this.#engineState.heat,
        ...this.#levelStats,
      });

      state._score = score;

      // Update ledger
      this.#ledger = recordLevelComplete(
        this.#ledger,
        this.#currentLevel.id,
        'win',
        this.#engineState.heat
      );

      this.#events.emit('game.win', { ...state, score });
      this.#events.emit('game.over', { outcome: 'win', state, score });
      this.#sessionActive = false;

    } else if (state.outcome === 'loss') {
      const score = calculateLevelScore({ outcome: 'loss' });
      state._score = score;

      this.#ledger = recordLevelComplete(
        this.#ledger,
        this.#currentLevel.id,
        'loss',
        this.#engineState.heat
      );

      this.#events.emit('game.loss', { ...state, score });
      this.#events.emit('game.over', { outcome: 'loss', state, score });
      this.#sessionActive = false;
    }

    return state;
  }

  /**
   * Heartbeat for real-time battle system.
   * Updates AI intent and heat independently of player actions.
   * @param {number} ms - Milliseconds since last tick
   * @returns {object} Updated engine state
   */
  tick(ms) {
    if (!this.#sessionActive || !this.#engineState) return null;

    const eState = this.#engineState;
    const deltaSeconds = ms / 1000;

    // Accumulate intent and heat
    const intentGain = eState.rivalIntentRate * deltaSeconds;
    const heatGain = eState.heatRate * deltaSeconds;

    let nextIntent = (eState.rivalIntent || 0) + intentGain;
    let nextHeat = (eState.heat || 0) + heatGain;

    // Handle Intent Trigger
    let intentTriggered = false;
    if (nextIntent >= 100) {
      nextIntent = 0; // Reset after trigger
      intentTriggered = true;
      this.#events.emit('rival.intent_full', { 
        level: this.#currentLevel.id,
        heat: nextHeat 
      });
    }

    // Check for Heat Threshold crossings
    const oldThreshold = getHeatThreshold(eState.heat);
    const newThreshold = getHeatThreshold(nextHeat);
    if (oldThreshold.id !== newThreshold.id) {
      this.#events.emit('heat.threshold', newThreshold);
      this.#events.emit('heat.beat', { 
        threshold: newThreshold, 
        source: 'real_time' 
      });
    }

    // Update engine state
    this.#engineState = updateState(eState, {
      rivalIntent: nextIntent,
      // Refactor: Use central constant instead of hardcoded 20 (v4.0 fix)
      heat: Math.min(nextHeat, HEAT_CAP)
    });

    // Emit for UI feedback
    this.#events.emit('engine.heartbeat', {
      rivalIntent: nextIntent,
      heat: this.#engineState.heat,
      intentTriggered
    });

    return this.getEngineState();
  }

  /**
   * Get current game state snapshot.
   * @returns {object | null}
   */
  getState() {
    return this.#currentState;
  }

  /**
   * Get the engine-tracked state (influence, heat, etc.).
   * @returns {object | null}
   */
  getEngineState() {
    return this.#engineState ? exportState(this.#engineState) : null;
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
      engineState: this.#engineState ? exportState(this.#engineState) : null,
      warTurns: this.#warTurns,
      levelStats: this.#levelStats,
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
    this.#ledger = session.ledger || createLedger();
    this.#turnCount = session.turnCount || 0;
    this.#sessionActive = true;
    this.#warTurns = session.warTurns || [];
    this.#levelStats = session.levelStats || {
      intelUsed: 0, gambitsWon: 0, gambitsLost: 0,
      cardsExhausted: 0, usedWar: false, territoriesLost: 0, peacesHonored: 0,
    };

    if (session.engineState) {
      this.#engineState = createState(session.engineState);
    }

    const lastResponse = this.#adapter.resume(session.adapterState);
    this.#currentState = parseResponse(lastResponse);
    this.#currentState._romInfo = this.#buildLevelROMInfo();

    // Re-augment engine state
    if (this.#engineState) {
      const threshold = getHeatThreshold(this.#engineState.heat);
      this.#currentState._engine = {
        influence: this.#engineState.influence,
        maxInfluence: this.#engineState.maxInfluence,
        heat: this.#engineState.heat,
        heatThreshold: threshold.name,
        heatFlavor: threshold.flavor,
        phase: 'scheme',
        turn: this.#turnCount,
      };
    }

    this.#events.emit('session.resume', {
      romId: session.romId,
      levelId: session.levelId,
      turnCount: this.#turnCount,
      heat: this.#engineState?.heat || 0,
    });

    return this.#currentState;
  }

  /**
   * Get / set the persistent ledger.
   */
  getLedger() { return { ...(this.#ledger || createLedger()) }; }
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
