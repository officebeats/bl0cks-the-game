/**
 * BL0CKS Move Cards
 * 
 * Move card execution logic. Each move has a base effect and a "powered" effect
 * that triggers when specific board conditions are met.
 * 
 * From GDD §4.4:
 * TAX, GHOST, SNITCH, STACK, WAR, PEACE, BURN
 */

import { getHeatForAction } from '../core/heat.js';

/**
 * Full move card specifications from GDD §4.4.
 */
export const MOVE_SPECS = Object.freeze({
  TAX: {
    name: 'TAX',
    cost: 1,
    clockCost: 1,
    baseEffect: 'Collect 1 resource from a controlled block.',
    poweredCondition: 'You control 3+ blocks.',
    poweredEffect: 'Collect from ALL controlled blocks. +1 Influence next turn.',
    heat: 0,
  },
  GHOST: {
    name: 'GHOST',
    cost: 0,
    clockCost: 0,
    baseEffect: 'Disappear from a block. Remove your marker. Block becomes uncontrolled.',
    poweredCondition: 'You have 0 Status Cards in hand.',
    poweredEffect: 'Ghost is silent — no Heat generated. Rival factions don\'t notice for 1 turn.',
    heat: -1, // Ghost reduces heat
  },
  SNITCH: {
    name: 'SNITCH',
    cost: 2,
    clockCost: 2,
    baseEffect: 'Reveal one hidden stat on any People Card (free Intel).',
    poweredCondition: 'Target has Loyalty ≤ 4.',
    poweredEffect: 'Reveal ALL hidden stats. But betrayal threshold drops by 3.',
    heat: 0,
  },
  STACK: {
    name: 'STACK',
    cost: 2,
    clockCost: 2,
    baseEffect: 'Fortify a block. +2 Block Points (temporary shields).',
    poweredCondition: 'An Enforcer is active in the target block.',
    poweredEffect: '+4 Block Points instead. Combo: triggers Enforcer\'s keyword.',
    heat: 0,
  },
  WAR: {
    name: 'WAR',
    cost: 3,
    clockCost: 1,
    baseEffect: 'Challenge a rival block. AI resolves combat. Winner takes territory.',
    poweredCondition: 'You\'ve played War in 2 consecutive turns.',
    poweredEffect: 'Blitz — War costs 2 Influence instead of 3. But generates +2 Heat.',
    heat: 1,
  },
  PEACE: {
    name: 'PEACE',
    cost: 1,
    clockCost: 1,
    baseEffect: 'Broker a temporary alliance. Contested block becomes shared for 3 turns.',
    poweredCondition: 'Both factions have People Cards with Loyalty ≥ 7.',
    poweredEffect: 'Alliance lasts 5 turns. Shared block generates resources for both.',
    heat: -1, // Peace reduces heat
  },
  BURN: {
    name: 'BURN',
    cost: 0,
    clockCost: 0,
    baseEffect: 'Exhaust a card from hand or deck. Permanent removal.',
    poweredCondition: 'Card being burned is a Status Card (Paranoia/Heat).',
    poweredEffect: 'Burning a Status Card grants +1 Influence immediately (relief bonus).',
    heat: 0,
  },
});

/**
 * Check if a move's powered condition is met.
 * @param {string} moveName - Move name (uppercase)
 * @param {object} context - Board context { territories, hand, warTurns, currentTurn, targetCard }
 * @returns {boolean}
 */
export function isPowered(moveName, context) {
  const name = moveName.toUpperCase();
  const { territories = [], hand = [], warTurns = [], currentTurn = 0, targetCard = null } = context;

  switch (name) {
    case 'TAX': {
      const controlled = territories.filter(t => t.control === 'you').length;
      return controlled >= 3;
    }

    case 'GHOST': {
      const statusInHand = hand.filter(c => c.type === 'status').length;
      return statusInHand === 0;
    }

    case 'SNITCH': {
      if (!targetCard) return false;
      const loyalty = typeof targetCard.loyalty === 'number' ? targetCard.loyalty : parseInt(targetCard.loyalty) || 5;
      return loyalty <= 4;
    }

    case 'STACK': {
      // Check if an enforcer is in the target block
      return hand.some(c => c.type === 'people' && c.role?.toLowerCase() === 'enforcer');
    }

    case 'WAR': {
      return warTurns.includes(currentTurn - 1);
    }

    case 'PEACE': {
      // Both factions need People Cards with loyalty >= 7
      const highLoyalty = hand.filter(c =>
        c.type === 'people' && (typeof c.loyalty === 'number' ? c.loyalty : parseInt(c.loyalty) || 0) >= 7
      );
      return highLoyalty.length >= 2; // At least 2 high-loyalty characters
    }

    case 'BURN': {
      return targetCard?.type === 'status';
    }

    default:
      return false;
  }
}

/**
 * Get the effective cost of a move (accounting for powered conditions).
 * @param {string} moveName
 * @param {object} context
 * @returns {number}
 */
export function getEffectiveCost(moveName, context) {
  const name = moveName.toUpperCase();
  const spec = MOVE_SPECS[name];
  if (!spec) return 1;

  // Blitz War: cost 2 instead of 3
  if (name === 'WAR' && isPowered('WAR', context)) {
    return 2;
  }

  return spec.cost;
}

/**
 * Get the heat impact of a move.
 * @param {string} moveName
 * @param {boolean} isPowered
 * @returns {number}
 */
export function getMoveHeat(moveName, powered = false) {
  const name = moveName.toUpperCase();

  if (name === 'WAR' && powered) return 2; // Blitz generates +2
  if (name === 'WAR') return 1;
  if (name === 'GHOST') return -1;
  if (name === 'PEACE') return -1;

  return 0;
}

/**
 * Get the move spec for display/rendering.
 * @param {string} moveName
 * @returns {object|null}
 */
export function getMoveSpec(moveName) {
  return MOVE_SPECS[moveName?.toUpperCase()] || null;
}
