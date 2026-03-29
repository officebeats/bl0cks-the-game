/**
 * BL0CKS Ledger — Persistent Consequences
 * 
 * Cross-level memory system. Choices carry forward through the campaign.
 * The AI reads the Ledger at each level start and weaves it into narrative + mechanics.
 * 
 * From GDD §4.11:
 * Tracks: Grudges, Debts, Burned Bridges, Reputation, Ghost Status,
 *         Body Count, Alliance History, Heat Carried, Assets Held
 */

/**
 * Create a fresh empty ledger.
 * @returns {object}
 */
export function createLedger() {
  return {
    grudges: [],          // { faction, origin, severity }
    debts: [],            // { character, origin, type, bonusKeyword }
    burned: [],           // { role, count, loyaltyPenalty }
    reputation: 0,        // Running tally: territories won - lost
    territoriesWon: 0,
    territoriesLost: 0,
    ghostTerritories: [], // Territory ids ghosted
    bodyCount: 0,         // People cards lost in war
    alliances: [],        // { faction, status: 'honored'|'broken', levelsHeld }
    heatCarried: 0,       // Heat at end of last level
    assetsHeld: [],       // Asset ids collected from the stash
    levelHistory: [],     // { levelId, outcome, turn, timestamp }
  };
}

/**
 * Record a grudge against a faction (player warred against them).
 * @param {object} ledger
 * @param {string} faction
 * @param {string} origin - Level where grudge was created
 * @param {string} [severity='medium']
 * @returns {object} Updated ledger
 */
export function addGrudge(ledger, faction, origin, severity = 'medium') {
  const existing = ledger.grudges.find(g => g.faction === faction);
  if (existing) {
    // Escalate severity
    existing.severity = severity === 'high' ? 'high' : existing.severity === 'high' ? 'high' : severity;
    return { ...ledger, grudges: [...ledger.grudges] };
  }

  return {
    ...ledger,
    grudges: [...ledger.grudges, { faction, origin, severity }],
  };
}

/**
 * Record a debt — player gave a character something, they owe you.
 * @param {object} ledger
 * @param {string} character - Character id/name
 * @param {string} origin - Level id
 * @param {string} type - What was given (e.g., 'gave_cut', 'saved')
 * @param {string} [bonusKeyword] - Keyword bonus in future levels
 * @returns {object}
 */
export function addDebt(ledger, character, origin, type, bonusKeyword = null) {
  return {
    ...ledger,
    debts: [...ledger.debts, { character, origin, type, bonusKeyword }],
  };
}

/**
 * Record a burned bridge — player exhausted a character.
 * Similar role/faction characters get loyalty penalty in future levels.
 * @param {object} ledger
 * @param {string} role - Role of exhausted character
 * @returns {object}
 */
export function addBurnedBridge(ledger, role) {
  const existing = ledger.burned.find(b => b.role === role);
  if (existing) {
    return {
      ...ledger,
      burned: ledger.burned.map(b =>
        b.role === role
          ? { ...b, count: b.count + 1, loyaltyPenalty: -(b.count + 1) }
          : b
      ),
    };
  }

  return {
    ...ledger,
    burned: [...ledger.burned, { role, count: 1, loyaltyPenalty: -1 }],
  };
}

/**
 * Update reputation based on territory changes.
 * @param {object} ledger
 * @param {'won'|'lost'} outcome
 * @returns {object}
 */
export function updateReputation(ledger, outcome) {
  if (outcome === 'won') {
    return {
      ...ledger,
      reputation: ledger.reputation + 1,
      territoriesWon: ledger.territoriesWon + 1,
    };
  }

  return {
    ...ledger,
    reputation: ledger.reputation - 1,
    territoriesLost: ledger.territoriesLost + 1,
  };
}

/**
 * Record a ghosted territory (player abandoned it).
 * Rivals may claim it in the interim, starting fortified.
 * @param {object} ledger
 * @param {string} territoryId
 * @returns {object}
 */
export function addGhostTerritory(ledger, territoryId) {
  if (ledger.ghostTerritories.includes(territoryId)) return ledger;

  return {
    ...ledger,
    ghostTerritories: [...ledger.ghostTerritories, territoryId],
  };
}

/**
 * Increment body count (people card lost in war).
 * Higher body count → more frequent police events.
 * @param {object} ledger
 * @param {number} [count=1]
 * @returns {object}
 */
export function incrementBodyCount(ledger, count = 1) {
  return {
    ...ledger,
    bodyCount: ledger.bodyCount + count,
  };
}

/**
 * Record an alliance with a faction.
 * @param {object} ledger
 * @param {string} faction
 * @param {string} status - 'honored' | 'broken'
 * @returns {object}
 */
export function recordAlliance(ledger, faction, status) {
  const existing = ledger.alliances.find(a => a.faction === faction);
  if (existing) {
    return {
      ...ledger,
      alliances: ledger.alliances.map(a =>
        a.faction === faction
          ? { ...a, status, levelsHeld: status === 'honored' ? a.levelsHeld + 1 : 0 }
          : a
      ),
    };
  }

  return {
    ...ledger,
    alliances: [...ledger.alliances, { faction, status, levelsHeld: status === 'honored' ? 1 : 0 }],
  };
}

/**
 * Record a completed level in the ledger.
 * @param {object} ledger
 * @param {string} levelId
 * @param {string} outcome - 'win' | 'loss'
 * @param {number} finalHeat
 * @returns {object}
 */
export function recordLevelComplete(ledger, levelId, outcome, finalHeat) {
  return {
    ...ledger,
    heatCarried: finalHeat,
    levelHistory: [
      ...ledger.levelHistory,
      { levelId, outcome, timestamp: Date.now() },
    ],
  };
}

/**
 * Add an asset to the collection (from The Stash).
 * @param {object} ledger
 * @param {string} assetId
 * @returns {object}
 */
export function addAsset(ledger, assetId) {
  if (ledger.assetsHeld.includes(assetId)) return ledger;

  return {
    ...ledger,
    assetsHeld: [...ledger.assetsHeld, assetId],
  };
}

/**
 * Get loyalty modifier for a character based on ledger state.
 * @param {object} ledger
 * @param {object} character - { role, faction, name }
 * @returns {number} Loyalty modifier (positive = bonus, negative = penalty)
 */
export function getLoyaltyModifier(ledger, character) {
  let mod = 0;

  // Grudges: -2 loyalty for faction characters
  const grudge = ledger.grudges.find(g => g.faction === character.faction);
  if (grudge) {
    mod -= 2;
  }

  // Debts: +2 loyalty for owed characters
  const debt = ledger.debts.find(d => d.character === character.name);
  if (debt) {
    mod += 2;
  }

  // Burned bridges: penalty for same-role characters
  const burned = ledger.burned.find(b => b.role === character.role);
  if (burned) {
    mod += burned.loyaltyPenalty; // Already negative
  }

  // High reputation: auto-ally bonus
  if (ledger.reputation >= 5) {
    mod += 1;
  }

  return mod;
}

/**
 * Serialize the ledger to a markdown format for AI state block injection.
 * @param {object} ledger
 * @returns {string}
 */
export function serializeLedger(ledger) {
  const lines = ['<!-- LEDGER — Persistent across campaign run -->'];

  if (ledger.grudges.length > 0) {
    lines.push('grudges:');
    for (const g of ledger.grudges) {
      lines.push(`  - faction: ${g.faction}, origin: ${g.origin}, severity: ${g.severity}`);
    }
  }

  if (ledger.debts.length > 0) {
    lines.push('debts:');
    for (const d of ledger.debts) {
      lines.push(`  - character: ${d.character}, origin: ${d.origin}, type: ${d.type}${d.bonusKeyword ? ', bonus_keyword: ' + d.bonusKeyword : ''}`);
    }
  }

  if (ledger.burned.length > 0) {
    lines.push('burned:');
    for (const b of ledger.burned) {
      lines.push(`  - role: ${b.role}, count: ${b.count}, loyalty_penalty: ${b.loyaltyPenalty}`);
    }
  }

  lines.push(`reputation: ${ledger.reputation >= 0 ? '+' : ''}${ledger.reputation} (${ledger.territoriesWon} won, ${ledger.territoriesLost} lost)`);

  if (ledger.ghostTerritories.length > 0) {
    lines.push(`ghost_territories: [${ledger.ghostTerritories.join(', ')}]`);
  }

  lines.push(`body_count: ${ledger.bodyCount}`);

  if (ledger.alliances.length > 0) {
    lines.push('alliances:');
    for (const a of ledger.alliances) {
      lines.push(`  - faction: ${a.faction}, status: ${a.status}, levels_held: ${a.levelsHeld}`);
    }
  }

  lines.push(`heat_carried: ${ledger.heatCarried}`);

  if (ledger.assetsHeld.length > 0) {
    lines.push(`assets_held: [${ledger.assetsHeld.join(', ')}]`);
  }

  lines.push('<!-- END LEDGER -->');

  return lines.join('\n');
}
