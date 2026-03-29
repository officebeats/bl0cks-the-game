/**
 * BL0CKS Engine Event Types
 * 
 * All events the engine emits. Platform shells subscribe to these
 * to render UI updates without coupling to engine internals.
 */
export const Events = Object.freeze({
  // ── Lifecycle ──
  ENGINE_READY:       'engine.ready',
  ENGINE_ERROR:       'engine.error',

  // ── ROM ──
  ROM_LOADED:         'rom.loaded',
  ROM_VALIDATED:      'rom.validated',
  ROM_ERROR:          'rom.error',

  // ── Game Session ──
  SESSION_START:      'session.start',
  SESSION_RESUME:     'session.resume',
  SESSION_SAVE:       'session.save',
  SESSION_END:        'session.end',

  // ── Turn Phases ──
  TURN_START:         'turn.start',
  TURN_RENDERED:      'turn.rendered',
  TURN_END:           'turn.end',

  // ── Player Actions ──
  ACTION_SENT:        'action.sent',
  ACTION_RESOLVED:    'action.resolved',

  // ── Card Events ──
  CARD_PLAYED:        'card.played',
  CARD_EXHAUSTED:     'card.exhausted',
  CARD_DRAWN:         'card.drawn',

  // ── Choice / Gambit ──
  CHOICE_PENDING:     'choice.pending',
  CHOICE_MADE:        'choice.made',
  GAMBIT_OFFERED:     'gambit.offered',
  GAMBIT_RESOLVED:    'gambit.resolved',

  // ── Territory ──
  TERRITORY_GAINED:   'territory.gained',
  TERRITORY_LOST:     'territory.lost',
  TERRITORY_CONTESTED:'territory.contested',

  // ── Systems ──
  HEAT_CHANGED:       'heat.changed',
  HEAT_THRESHOLD:     'heat.threshold',
  INFLUENCE_SPENT:    'influence.spent',
  LEDGER_UPDATED:     'ledger.updated',
  STASH_OFFERED:      'stash.offered',

  // ── Game End ──
  GAME_WIN:           'game.win',
  GAME_LOSS:          'game.loss',
  GAME_OVER:          'game.over',

  // ── AI ──
  AI_THINKING:        'ai.thinking',
  AI_RESPONSE:        'ai.response',
  AI_ERROR:           'ai.error',
});
