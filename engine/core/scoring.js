/**
 * BL0CKS Scoring System
 * 
 * Calculates scores based on level performance, tracks win/loss conditions,
 * and determines final campaign ranking.
 * 
 * Scoring is multi-dimensional:
 * - Territory control efficiency
 * - Information utilization (intel usage)
 * - Trust management (loyalty preservation)
 * - Tempo (clock efficiency)
 * - Risk-reward (gambit success rate)
 */

/**
 * @typedef {Object} LevelScore
 * @property {number} total - Overall score for the level
 * @property {object} breakdown - Category scores
 * @property {string} grade - Letter grade (S/A/B/C/D/F)
 * @property {string} title - Achievement title
 */

/**
 * Score weight multipliers.
 */
const WEIGHTS = Object.freeze({
  territory: 30,      // Points per controlled territory at level end
  clockBonus: 5,       // Points per unused clock tick
  loyaltyAvg: 10,      // Points per average loyalty point in hand
  intelUsed: 15,       // Points per intel card wisely spent
  gambitsWon: 25,      // Points per successful gambit
  gambitsLost: -10,    // Penalty per failed gambit
  burnEfficiency: 5,   // Points per strategic exhaust
  heatPenalty: -2,     // Penalty per heat point at level end
  bodyPenalty: -15,    // Penalty per people card lost
  peaceBonus: 20,      // Bonus per honored alliance at level end
  noWarBonus: 50,      // Bonus for winning without playing War
  perfectRun: 100,     // Bonus for no territory losses
});

/**
 * Grade thresholds.
 */
const GRADES = Object.freeze([
  { min: 500, grade: 'S', title: 'Ghost of the South Side' },
  { min: 400, grade: 'A', title: 'Block Captain' },
  { min: 300, grade: 'B', title: 'Connected' },
  { min: 200, grade: 'C', title: 'Street Smart' },
  { min: 100, grade: 'D', title: 'Corner Boy' },
  { min: 0,   grade: 'F', title: 'Folded' },
]);

/**
 * Calculate the score for a completed level.
 * @param {object} params
 * @param {string} params.outcome - 'win' | 'loss'
 * @param {object[]} params.territories - Territory states at level end
 * @param {number} params.clockRemaining - Unused clock ticks
 * @param {object[]} params.hand - Cards in hand at level end
 * @param {number} params.intelUsed - Intel cards spent during level
 * @param {number} params.gambitsWon - Successful gambits
 * @param {number} params.gambitsLost - Failed gambits
 * @param {number} params.cardsExhausted - Cards burned during level
 * @param {number} params.heat - Heat at level end
 * @param {number} params.bodyCount - People cards lost this level
 * @param {number} params.peacesHonored - Alliances honored
 * @param {boolean} params.usedWar - Whether War was played
 * @param {number} params.territoriesLost - Territories lost during level
 * @returns {LevelScore}
 */
export function calculateLevelScore(params) {
  const {
    outcome,
    territories = [],
    clockRemaining = 0,
    hand = [],
    intelUsed = 0,
    gambitsWon = 0,
    gambitsLost = 0,
    cardsExhausted = 0,
    heat = 0,
    bodyCount = 0,
    peacesHonored = 0,
    usedWar = false,
    territoriesLost = 0,
  } = params;

  // Base score: 0 if loss
  if (outcome === 'loss') {
    return {
      total: 0,
      breakdown: { outcome: 'loss' },
      grade: 'F',
      title: 'Folded',
    };
  }

  const controlled = territories.filter(t => t.control === 'you').length;
  const avgLoyalty = calculateAverageLoyalty(hand);

  const breakdown = {
    territory: controlled * WEIGHTS.territory,
    clockBonus: clockRemaining * WEIGHTS.clockBonus,
    loyalty: Math.round(avgLoyalty * WEIGHTS.loyaltyAvg),
    intel: intelUsed * WEIGHTS.intelUsed,
    gambits: (gambitsWon * WEIGHTS.gambitsWon) + (gambitsLost * WEIGHTS.gambitsLost),
    burns: cardsExhausted * WEIGHTS.burnEfficiency,
    heatPenalty: heat * WEIGHTS.heatPenalty,
    bodyPenalty: bodyCount * WEIGHTS.bodyPenalty,
    peaceBonus: peacesHonored * WEIGHTS.peaceBonus,
    noWarBonus: !usedWar ? WEIGHTS.noWarBonus : 0,
    perfectRun: territoriesLost === 0 ? WEIGHTS.perfectRun : 0,
  };

  const total = Math.max(0, Object.values(breakdown).reduce((sum, v) => sum + v, 0));

  const { grade, title } = getGrade(total);

  return { total, breakdown, grade, title };
}

/**
 * Calculate campaign score across all levels.
 * @param {LevelScore[]} levelScores
 * @returns {{ total: number, average: number, grade: string, title: string, levelsCompleted: number }}
 */
export function calculateCampaignScore(levelScores) {
  const completed = levelScores.filter(s => s.grade !== 'F');
  const total = completed.reduce((sum, s) => sum + s.total, 0);
  const average = completed.length > 0 ? Math.round(total / completed.length) : 0;

  const { grade, title } = getGrade(average);

  return {
    total,
    average,
    grade,
    title,
    levelsCompleted: completed.length,
  };
}

/**
 * Check win conditions for a level.
 * @param {object} params
 * @param {object} params.levelConfig - Level config from ROM
 * @param {object} params.state - Current game state
 * @returns {{ met: boolean, type: string, description: string }[]}
 */
export function checkWinConditions({ levelConfig, state }) {
  const conditions = [];

  // Parse win conditions from level config
  // Standard conditions from GDD:
  const territories = state.territories || [];
  const controlled = territories.filter(t => t.control === 'you');

  // Aggressive win: control target territory before clock limit
  if (levelConfig.winConditionAggressive?.territory) {
    const target = territories.find(t =>
      t.name?.toLowerCase().includes(levelConfig.winConditionAggressive.territory.toLowerCase())
    );
    if (target && target.control === 'you') {
      conditions.push({ met: true, type: 'aggressive', description: `Took control of ${target.name}` });
    }
  }

  // Defensive win: survive all clock ticks while holding home territory
  if (levelConfig.winConditionDefensive?.territory) {
    const home = territories.find(t =>
      t.name?.toLowerCase().includes(levelConfig.winConditionDefensive.territory.toLowerCase())
    );
    if (home && home.control === 'you' && state.clock >= state.clockTotal) {
      conditions.push({ met: true, type: 'defensive', description: `Survived while holding ${home.name}` });
    }
  }

  // Generic: control N blocks
  if (levelConfig.winConditionControlCount) {
    if (controlled.length >= levelConfig.winConditionControlCount) {
      conditions.push({
        met: true,
        type: 'control',
        description: `Control ${controlled.length}/${levelConfig.winConditionControlCount} territories`,
      });
    }
  }

  return conditions;
}

/**
 * Check loss conditions for a level.
 * @param {object} params
 * @returns {{ met: boolean, type: string, description: string }[]}
 */
export function checkLossConditions({ levelConfig, state }) {
  const conditions = [];
  const territories = state.territories || [];

  // Lost home territory
  if (levelConfig.lossConditionTerritory) {
    const home = territories.find(t =>
      t.name?.toLowerCase().includes(levelConfig.lossConditionTerritory.toLowerCase())
    );
    if (home && home.control !== 'you') {
      conditions.push({ met: true, type: 'territory_lost', description: `Lost control of ${home.name}` });
    }
  }

  // Federal Indictment timeout
  if (state.heat >= 18 && state._federalTurnsRemaining <= 0) {
    conditions.push({ met: true, type: 'federal', description: 'Federal Indictment — time ran out' });
  }

  // Clock expired without meeting win condition
  if (state.clock >= state.clockTotal && !state.outcome) {
    conditions.push({ met: true, type: 'clock', description: 'Clock ran out' });
  }

  return conditions;
}

/**
 * Get grade and title for a score.
 * @param {number} score
 * @returns {{ grade: string, title: string }}
 */
function getGrade(score) {
  for (const g of GRADES) {
    if (score >= g.min) return g;
  }
  return GRADES[GRADES.length - 1];
}

/**
 * Calculate average loyalty of People Cards in hand.
 * @param {object[]} hand
 * @returns {number}
 */
function calculateAverageLoyalty(hand) {
  const people = hand.filter(c => c.type === 'people');
  if (people.length === 0) return 0;

  const total = people.reduce((sum, c) => {
    const loyalty = typeof c.loyalty === 'number' ? c.loyalty : parseInt(c.loyalty) || 0;
    return sum + loyalty;
  }, 0);

  return total / people.length;
}
