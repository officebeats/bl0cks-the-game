/**
 * BL0CKS — Engine Public API
 * 
 * This is the single entry point that platform shells import.
 * It wires together the content loader, AI router, game controller, and event bus.
 * 
 * Usage:
 *   import { BL0CKS } from '@bl0cks/engine';
 *   const engine = await BL0CKS.boot('./roms/chicago', { apiKey: 'AIza...' });
 *   const state = await engine.startLevel('01');
 */

import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadROM, scanInstalledROMs } from './content/loader.js';
import { autoCreateAdapter, createAdapter, detectProvider, PROVIDERS } from './ai/router.js';
import { checkAdapterCompatibility } from './ai/adapters/adapter.interface.js';
import { GameController } from './core/game.js';
import { EventBus } from './events/emitter.js';
import { Events } from './events/events.js';

// Re-export engine subsystems for advanced consumers (ROM creators, tools, tests)
export { CARD_TYPES, ROLES, createPeopleCard, createMoveCard, createStatusCard, createEventCard, createIntelCard, validateCard } from './cards/types.js';
export { KEYWORDS, KEYWORD_MAP, detectCombos, applyCombos, formatKeywords, hasKeyword } from './cards/keywords.js';
export { MOVE_SPECS, isPowered, getEffectiveCost, getMoveHeat, getMoveSpec } from './cards/moves.js';
export { ASSET_POOL, generateStashOffers, getAsset, getEffectiveHandSize, detectAssetSynergies, formatStashScreen } from './cards/stash.js';
export { shouldOfferGambit, generateGambit, resolveGambit, formatGambitChoice } from './cards/gambit.js';
export { createDeck, drawToFill, drawCards, playCard, exhaustCard, injectCard, getDeckSummary, findInHand } from './cards/deck.js';
export { HEAT_THRESHOLDS, getHeatThreshold, getActiveModifiers } from './core/heat.js';
export { serializeLedger, createLedger } from './core/ledger.js';
export { calculateLevelScore } from './core/scoring.js';
export { PHASES, TurnPhaseRunner } from './core/phases.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export { Events, PROVIDERS };

export class BL0CKS {
  #controller = null;
  #adapter = null;
  #provider = null;
  #rom = null;
  #romInfo = null;
  #events = new EventBus();
  #engineRoot = __dirname;

  /**
   * Boot the engine with a ROM and AI configuration.
   * 
   * @param {string} romPath - Path to ROM directory or ROM id
   * @param {object} options
   * @param {string} [options.apiKey] - AI provider API key
   * @param {string} [options.provider] - Explicit provider id (gemini, claude, openai, mock)
   * @param {string[]} [options.overlays] - DLC overlay ROM ids to load
   * @returns {Promise<BL0CKS>}
   */
  static async boot(romPath, options = {}) {
    const instance = new BL0CKS();
    await instance.#initialize(romPath, options);
    return instance;
  }

  async #initialize(romPath, options) {
    // ── Load ROM ──
    const { rom, info, errors, warnings } = await loadROM(
      romPath,
      this.#engineRoot,
      { overlays: options.overlays || [] }
    );

    if (!rom) {
      const err = new Error(`Failed to load ROM: ${errors.join('; ')}`);
      this.#events.emit(Events.ROM_ERROR, { errors, warnings });
      throw err;
    }

    this.#rom = rom;
    this.#romInfo = info;

    if (warnings.length > 0) {
      this.#events.emit(Events.ROM_VALIDATED, { warnings });
    }
    this.#events.emit(Events.ROM_LOADED, { romId: rom._manifest.id, info });

    // ── Create AI adapter ──
    if (options.apiKey) {
      if (options.provider) {
        this.#adapter = createAdapter(options.provider, options.apiKey);
        this.#provider = { id: options.provider, name: this.#adapter.name, tier: this.#adapter.tier };
      } else {
        const { adapter, provider } = autoCreateAdapter(options.apiKey);
        this.#adapter = adapter;
        this.#provider = provider;
      }

      // Check ROM compatibility
      const compat = checkAdapterCompatibility(this.#adapter, rom._manifest.ai);
      if (!compat.compatible) {
        this.#events.emit(Events.ENGINE_ERROR, {
          type: 'compatibility',
          issues: compat.issues,
        });
        // Don't throw — warn but allow play (degraded experience)
      }
    }

    // ── Create game controller ──
    if (this.#adapter) {
      this.#controller = new GameController(
        this.#adapter,
        this.#rom,
        this.#romInfo,
        this.#events,
      );
    }

    this.#events.emit(Events.ENGINE_READY, {
      romId: rom._manifest.id,
      provider: this.#provider?.name || 'none',
    });
  }

  /**
   * Set or change the AI adapter after boot (e.g., deferred API key entry).
   * @param {string} apiKey
   * @param {string} [providerId]
   */
  setAdapter(apiKey, providerId) {
    if (providerId) {
      this.#adapter = createAdapter(providerId, apiKey);
      this.#provider = { id: providerId, name: this.#adapter.name, tier: this.#adapter.tier };
    } else {
      const { adapter, provider } = autoCreateAdapter(apiKey);
      this.#adapter = adapter;
      this.#provider = provider;
    }

    this.#controller = new GameController(
      this.#adapter,
      this.#rom,
      this.#romInfo,
      this.#events,
    );
  }

  // ── Game Session Delegation ──

  async startLevel(levelId, ledger) {
    if (!this.#controller) throw new Error('No AI adapter configured. Call setAdapter() or pass apiKey to boot().');
    return this.#controller.startLevel(levelId, ledger);
  }

  async sendAction(input) {
    if (!this.#controller) throw new Error('No active game controller.');
    return this.#controller.sendAction(input);
  }

  tick(ms) {
    if (!this.#controller) return null;
    return this.#controller.tick(ms);
  }

  getState() {
    return this.#controller?.getState() || null;
  }

  getEngineState() {
    return this.#controller?.getEngineState() || null;
  }

  // ── ROM Identity (for title screen, settings, HUD) ──

  getROMInfo() {
    if (this.#controller) {
      const info = this.#controller.getROMInfo();
      info.edition = this.#provider?.id || null;
      return info;
    }

    // Pre-game ROM info (no level selected yet)
    return {
      base: this.#romInfo.base,
      activeOverlays: this.#romInfo.activeOverlays,
      currentLevel: null,
      edition: this.#provider?.id || null,
      displayBadge: null,
      branding: this.#romInfo.branding,
    };
  }

  getProviderInfo() {
    return this.#provider ? { ...this.#provider } : null;
  }

  listLevels() {
    if (!this.#controller) {
      return this.#rom.levels.map(l => ({
        id: l.id,
        name: l.name,
        type: l.type,
        isDLC: l._isDLC || false,
        isCommunity: l._isCommunity || false,
        sourceROM: l._sourceROM || this.#rom._manifest.id,
      }));
    }
    return this.#controller.listLevels();
  }

  // ── Session Persistence ──

  exportSession() {
    if (!this.#controller) return null;
    return this.#controller.exportSession();
  }

  resumeSession(session) {
    if (!this.#controller) throw new Error('No AI adapter configured.');
    return this.#controller.resumeSession(session);
  }

  // ── Ledger ──

  getLedger() { return this.#controller?.getLedger() || {}; }
  setLedger(ledger) { this.#controller?.setLedger(ledger); }

  // ── Event Bus ──

  on(event, callback) {
    return this.#events.on(event, callback);
  }

  once(event, callback) {
    return this.#events.once(event, callback);
  }

  // ── Static Utilities (no boot required) ──

  /**
   * Scan all ROM search paths and return installed ROM metadata.
   * Used by title screen and settings before a ROM is loaded.
   */
  static scanROMs() {
    const engineRoot = dirname(fileURLToPath(import.meta.url));
    return scanInstalledROMs(engineRoot);
  }

  /**
   * Get the list of supported AI providers (for settings UI).
   */
  static getProviders() {
    return [...PROVIDERS];
  }

  /**
   * Detect which AI provider an API key belongs to.
   */
  static detectProvider(apiKey) {
    return detectProvider(apiKey);
  }

  // ── Cleanup ──

  destroy() {
    this.#adapter?.destroy();
    this.#events.removeAll();
    this.#controller = null;
    this.#adapter = null;
  }
}
