/**
 * BL0CKS Engine Smoke Test
 * Verifies all 14 new engine modules load and work correctly.
 */

import { createState, updateState, validateState } from '../engine/core/state.js';
import { PHASES, TurnPhaseRunner } from '../engine/core/phases.js';
import { calculateBaseInfluence, spendInfluence, MOVE_COSTS } from '../engine/core/influence.js';
import { getHeatThreshold, increaseHeat, HEAT_CAP } from '../engine/core/heat.js';
import { createLedger, addGrudge, serializeLedger } from '../engine/core/ledger.js';
import { resolveWar, isBlitzActive } from '../engine/core/combat.js';
import { calculateLevelScore } from '../engine/core/scoring.js';
import { CARD_TYPES, createPeopleCard, createMoveCard } from '../engine/cards/types.js';
import { createDeck, drawToFill, playCard, exhaustCard } from '../engine/cards/deck.js';
import { KEYWORDS, detectCombos } from '../engine/cards/keywords.js';
import { MOVE_SPECS, isPowered } from '../engine/cards/moves.js';
import { shouldOfferGambit, generateGambit, resolveGambit } from '../engine/cards/gambit.js';
import { ASSET_POOL, generateStashOffers, detectAssetSynergies } from '../engine/cards/stash.js';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (err) {
    console.log(`  ❌ ${name}: ${err.message}`);
    failed++;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}

console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  BL0CKS ENGINE — SMOKE TEST');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');

console.log('  ── core/state.js ──');
test('createState returns frozen object with defaults', () => {
  const state = createState();
  assert(state.influence === 3, `influence should be 3, got ${state.influence}`);
  assert(state.heat === 0, `heat should be 0, got ${state.heat}`);
  assert(Object.isFrozen(state), 'state should be frozen');
});

test('updateState returns new frozen object', () => {
  const state = createState();
  const next = updateState(state, { heat: 10, influence: 2 });
  assert(next.heat === 10, 'heat should be 10');
  assert(next.influence === 2, 'influence should be 2');
  assert(state.heat === 0, 'original should be unchanged');
  assert(Object.isFrozen(next), 'updated state should be frozen');
});

test('validateState catches missing fields', () => {
  const result = validateState({});
  assert(!result.valid, 'empty object should be invalid');
  assert(result.errors.length > 0, 'should have errors');
});

console.log('');
console.log('  ── core/phases.js ──');
test('PHASES has 10 entries Dawn→Dusk', () => {
  assert(PHASES.length === 10, `should have 10, got ${PHASES.length}`);
  assert(PHASES[0].id === 'dawn', `first should be dawn, got ${PHASES[0].id}`);
  assert(PHASES[9].id === 'dusk', `last should be dusk, got ${PHASES[9].id}`);
});

test('TurnPhaseRunner.isPlayerPhase identifies player phases', () => {
  assert(TurnPhaseRunner.isPlayerPhase('act'), 'act should be player');
  assert(TurnPhaseRunner.isPlayerPhase('scheme'), 'scheme should be player');
  assert(TurnPhaseRunner.isPlayerPhase('burn'), 'burn should be player');
  assert(!TurnPhaseRunner.isPlayerPhase('dawn'), 'dawn should not be player');
});

console.log('');
console.log('  ── core/influence.js ──');
test('calculateBaseInfluence returns 3 default, 4 with OG Status', () => {
  assert(calculateBaseInfluence() === 3, 'default should be 3');
  assert(calculateBaseInfluence([{ id: 'og_status' }]) === 4, 'with OG Status should be 4');
});

test('spendInfluence validates budget', () => {
  const ok = spendInfluence({ influence: 3 }, 2);
  assert(ok.success, 'should succeed with enough influence');
  const fail = spendInfluence({ influence: 1 }, 3);
  assert(!fail.success, 'should fail without enough influence');
});

console.log('');
console.log('  ── core/heat.js ──');
test('getHeatThreshold maps correctly', () => {
  assert(getHeatThreshold(0).id === 'low', '0 should be low');
  assert(getHeatThreshold(6).id === 'warm', '6 should be warm');
  assert(getHeatThreshold(10).id === 'hot', '10 should be hot');
  assert(getHeatThreshold(15).id === 'on_fire', '15 should be on_fire');
  assert(getHeatThreshold(19).id === 'federal', '19 should be federal');
});

test('increaseHeat caps at 20', () => {
  const result = increaseHeat({ heat: 18 }, 5, 'test');
  assert(result.heat === 20, `should cap at 20, got ${result.heat}`);
});

console.log('');
console.log('  ── core/ledger.js ──');
test('createLedger has all required fields', () => {
  const l = createLedger();
  assert(Array.isArray(l.grudges), 'grudges should be array');
  assert(Array.isArray(l.debts), 'debts should be array');
  assert(l.reputation === 0, 'reputation should start at 0');
  assert(l.bodyCount === 0, 'bodyCount should start at 0');
});

test('serializeLedger produces markdown', () => {
  const l = addGrudge(createLedger(), 'lords', 'level_03', 'high');
  const md = serializeLedger(l);
  assert(md.includes('LEDGER'), 'should include LEDGER header');
  assert(md.includes('lords'), 'should include faction');
});

console.log('');
console.log('  ── core/combat.js ──');
test('resolveWar determines winner by combined loyalty', () => {
  const result = resolveWar({
    targetTerritory: 'Auburn Gresham',
    playerCards: [{ loyalty: 8 }, { loyalty: 5 }],
    rivalCards: [{ loyalty: 6 }],
  });
  assert(result.outcome === 'victory', `should be victory, got ${result.outcome}`);
  assert(result.playerStrength === 13, `player should be 13, got ${result.playerStrength}`);
  assert(result.rivalStrength === 6, `rival should be 6, got ${result.rivalStrength}`);
});

console.log('');
console.log('  ── core/scoring.js ──');
test('calculateLevelScore computes total and grade', () => {
  const score = calculateLevelScore({
    outcome: 'win',
    territories: [{ control: 'you' }, { control: 'you' }, { control: 'rival' }],
    clockRemaining: 4,
    heat: 6,
  });
  assert(score.total > 0, 'score should be positive');
  assert(score.grade, 'should have a grade');
  assert(score.title, 'should have a title');
});

test('calculateLevelScore returns 0 on loss', () => {
  const score = calculateLevelScore({ outcome: 'loss' });
  assert(score.total === 0, 'loss should be 0');
  assert(score.grade === 'F', 'loss should be F');
});

console.log('');
console.log('  ── cards/types.js ──');
test('createPeopleCard with hidden layer', () => {
  const card = createPeopleCard({ name: 'Darius Webb', role: 'broker', loyalty: 8, loyalty_hidden: 5 });
  assert(card.type === 'people', 'type should be people');
  assert(card.loyalty === 8, 'visible loyalty should be 8');
  assert(card._hidden.loyaltyTrue === 5, 'hidden loyalty should be 5');
  assert(card.cost === 1, 'broker cost should be 1');
});

test('createMoveCard with correct costs', () => {
  const war = createMoveCard({ name: 'WAR' });
  assert(war.cost === 3, 'WAR should cost 3');
  const ghost = createMoveCard({ name: 'GHOST' });
  assert(ghost.cost === 0, 'GHOST should cost 0');
});

console.log('');
console.log('  ── cards/deck.js ──');
test('createDeck and drawToFill', () => {
  const cards = Array.from({ length: 8 }, (_, i) => createMoveCard({ name: 'TAX', id: `tax_${i}` }));
  const deck = createDeck(cards);
  assert(deck.drawPile.length === 8, 'draw pile should have 8');
  const { deck: filled } = drawToFill(deck);
  assert(filled.hand.length === 5, `hand should be 5, got ${filled.hand.length}`);
  assert(filled.drawPile.length === 3, `draw pile should be 3, got ${filled.drawPile.length}`);
});

test('exhaustCard permanently removes card', () => {
  const cards = [createMoveCard({ name: 'TAX' })];
  const deck = createDeck(cards);
  const { deck: filled } = drawToFill(deck);
  const cardId = filled.hand[0].id;
  const { deck: after, card } = exhaustCard(filled, cardId);
  assert(after.hand.length === 0, 'hand should be empty after exhaust');
  assert(after.exhaustPile.length === 1, 'exhaust pile should have 1');
  assert(card._exhausted === true, 'card should be marked exhausted');
});

console.log('');
console.log('  ── cards/keywords.js ──');
test('detectCombos finds Block+Stack combo', () => {
  const combos = detectCombos([
    { type: 'people', keywords: ['block'] },
    { type: 'move', name: 'STACK', keywords: [] },
  ]);
  assert(combos.length >= 1, `should detect combo, got ${combos.length}`);
  assert(combos.some(c => c.keyword === 'block' || c.partner === 'block'), 'should involve block');
});

test('7 keywords defined', () => {
  assert(Object.keys(KEYWORDS).length === 7, `should have 7, got ${Object.keys(KEYWORDS).length}`);
});

console.log('');
console.log('  ── cards/moves.js ──');
test('MOVE_SPECS has all 7 moves', () => {
  const names = Object.keys(MOVE_SPECS);
  assert(names.length === 7, `should have 7, got ${names.length}`);
  assert(names.includes('TAX'), 'should include TAX');
  assert(names.includes('WAR'), 'should include WAR');
});

test('isPowered checks conditions', () => {
  const powered = isPowered('TAX', {
    territories: [{ control: 'you' }, { control: 'you' }, { control: 'you' }],
  });
  assert(powered, 'TAX should be powered with 3+ blocks');
  const notPowered = isPowered('TAX', { territories: [{ control: 'you' }] });
  assert(!notPowered, 'TAX should not be powered with 1 block');
});

console.log('');
console.log('  ── cards/gambit.js ──');
test('generateGambit returns valid structure', () => {
  const card = createPeopleCard({ name: 'Test', role: 'enforcer', loyalty: 7, loyalty_hidden: 4 });
  const gambit = generateGambit({ card, territory: 'Woodlawn' });
  assert(gambit.description, 'should have description');
  assert(gambit.successOutcome, 'should have success outcome');
  assert(gambit.failureOutcome, 'should have failure outcome');
  assert(typeof gambit.threshold === 'number', 'threshold should be number');
});

test('resolveGambit checks hidden stats', () => {
  const card = createPeopleCard({ name: 'High', role: 'enforcer', loyalty: 7, loyalty_hidden: 8 });
  const gambit = { hiddenCheck: 'loyaltyTrue', threshold: 6 };
  const result = resolveGambit(gambit, card);
  assert(result.success, 'should succeed with hidden loyalty 8 >= threshold 6');

  const card2 = createPeopleCard({ name: 'Low', role: 'runner', loyalty: 7, loyalty_hidden: 3 });
  const result2 = resolveGambit(gambit, card2);
  assert(!result2.success, 'should fail with hidden loyalty 3 < threshold 6');
});

console.log('');
console.log('  ── cards/stash.js ──');
test('ASSET_POOL has 12 assets', () => {
  assert(ASSET_POOL.length === 12, `should have 12, got ${ASSET_POOL.length}`);
});

test('generateStashOffers returns 3 valid offers', () => {
  const offers = generateStashOffers(5, []);
  assert(offers.length === 3, `should offer 3, got ${offers.length}`);
  assert(offers.every(a => a.name && a.icon), 'all should have name and icon');
});

test('detectAssetSynergies finds combos', () => {
  const synergies = detectAssetSynergies(['wire_tap', 'greek_diner', 'corner_armory', 'safe_house']);
  assert(synergies.length >= 2, `should find 2+ synergies, got ${synergies.length}`);
});

console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

if (failed > 0) process.exit(1);
