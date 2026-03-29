/**
 * BL0CKS Deck Manager
 * 
 * Manages the draw pile, hand, exhaust pile, and shuffle logic.
 * The deck is the player's resource pool — managing it efficiently is core strategy.
 * 
 * Key mechanics:
 * - Hand fills to HAND_SIZE (5) at Draw phase
 * - Status cards count against hand limit
 * - Exhausted cards are permanently removed (burn/thin strategy)
 * - Deck reshuffles when draw pile is empty (minus exhausted cards)
 */

import { HAND_SIZE } from './types.js';

/**
 * Create a fresh deck state.
 * @param {object[]} cards - Initial card pool
 * @returns {{ drawPile: object[], hand: object[], discardPile: object[], exhaustPile: object[] }}
 */
export function createDeck(cards = []) {
  return {
    drawPile: shuffle([...cards]),
    hand: [],
    discardPile: [],
    exhaustPile: [],
  };
}

/**
 * Draw cards until hand reaches the hand limit.
 * @param {object} deck - Current deck state
 * @param {number} [handLimit] - Override hand limit (e.g., Burner Network = 6)
 * @returns {{ deck: object, drawn: object[] }}
 */
export function drawToFill(deck, handLimit = HAND_SIZE) {
  const result = { ...deck, drawPile: [...deck.drawPile], hand: [...deck.hand] };
  const drawn = [];

  while (result.hand.length < handLimit) {
    if (result.drawPile.length === 0) {
      // Reshuffle discard pile into draw pile
      if (result.discardPile.length === 0) break; // No cards left anywhere
      result.drawPile = shuffle([...result.discardPile]);
      result.discardPile = [];
    }

    const card = result.drawPile.shift();
    result.hand.push(card);
    drawn.push(card);
  }

  return { deck: result, drawn };
}

/**
 * Draw a specific number of cards (not fill-to-limit).
 * @param {object} deck
 * @param {number} count
 * @returns {{ deck: object, drawn: object[] }}
 */
export function drawCards(deck, count) {
  const result = { ...deck, drawPile: [...deck.drawPile], hand: [...deck.hand] };
  const drawn = [];

  for (let i = 0; i < count; i++) {
    if (result.drawPile.length === 0) {
      if (result.discardPile.length === 0) break;
      result.drawPile = shuffle([...result.discardPile]);
      result.discardPile = [];
    }

    const card = result.drawPile.shift();
    result.hand.push(card);
    drawn.push(card);
  }

  return { deck: result, drawn };
}

/**
 * Play a card from hand (move to discard pile).
 * @param {object} deck
 * @param {string} cardId - ID of the card to play
 * @returns {{ deck: object, card: object|null }}
 */
export function playCard(deck, cardId) {
  const idx = deck.hand.findIndex(c => c.id === cardId);
  if (idx === -1) return { deck, card: null };

  const result = { ...deck, hand: [...deck.hand], discardPile: [...deck.discardPile] };
  const [card] = result.hand.splice(idx, 1);
  result.discardPile.push(card);

  return { deck: result, card };
}

/**
 * Exhaust (burn) a card — permanently remove from all piles.
 * @param {object} deck
 * @param {string} cardId
 * @param {'hand'|'drawPile'|'discardPile'} [from] - Which pile to look in (default: hand)
 * @returns {{ deck: object, card: object|null }}
 */
export function exhaustCard(deck, cardId, from = 'hand') {
  const pile = deck[from];
  if (!pile) return { deck, card: null };

  const idx = pile.findIndex(c => c.id === cardId);
  if (idx === -1) return { deck, card: null };

  const result = {
    ...deck,
    [from]: [...pile],
    exhaustPile: [...deck.exhaustPile],
  };

  const [card] = result[from].splice(idx, 1);
  card._exhausted = true;
  result.exhaustPile.push(card);

  return { deck: result, card };
}

/**
 * Inject a card into the draw pile (e.g., Status cards from Heat).
 * @param {object} deck
 * @param {object} card
 * @param {'top'|'bottom'|'random'} [position='random']
 * @returns {object} Updated deck
 */
export function injectCard(deck, card, position = 'random') {
  const result = { ...deck, drawPile: [...deck.drawPile] };

  if (position === 'top') {
    result.drawPile.unshift(card);
  } else if (position === 'bottom') {
    result.drawPile.push(card);
  } else {
    // Random position
    const idx = Math.floor(Math.random() * (result.drawPile.length + 1));
    result.drawPile.splice(idx, 0, card);
  }

  return result;
}

/**
 * Get a summary of the deck state (for UI/debugging).
 * @param {object} deck
 * @returns {object}
 */
export function getDeckSummary(deck) {
  return {
    drawPileSize: deck.drawPile.length,
    handSize: deck.hand.length,
    discardPileSize: deck.discardPile.length,
    exhaustPileSize: deck.exhaustPile.length,
    totalCards: deck.drawPile.length + deck.hand.length + deck.discardPile.length,
    statusInHand: deck.hand.filter(c => c.type === 'status').length,
  };
}

/**
 * Find a card in hand by ID.
 * @param {object} deck
 * @param {string} cardId
 * @returns {object|null}
 */
export function findInHand(deck, cardId) {
  return deck.hand.find(c => c.id === cardId) || null;
}

/**
 * Fisher-Yates shuffle.
 * @param {any[]} array
 * @returns {any[]}
 */
function shuffle(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export { shuffle };
