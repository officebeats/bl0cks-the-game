/**
 * BL0CKS Gambit System
 * 
 * The high-risk/high-reward third option on critical People Card decisions.
 * Creates the viral "stories players tell each other" moments.
 * 
 * From GDD §4.9:
 * - 40% chance of appearing on People Card decisions
 * - Boss encounters ALWAYS offer a Gambit
 * - Success/failure gated by hidden stats (information asymmetry)
 * - Consequences are irreversible
 */

/** Default gambit appearance chance */
export const GAMBIT_CHANCE = 0.4;

/**
 * @typedef {Object} GambitOption
 * @property {string} description - What the player sees
 * @property {string} successOutcome - What happens if the hidden stat check passes
 * @property {string} failureOutcome - What happens if the check fails
 * @property {string} hiddenCheck - Which hidden stat is checked (e.g., 'loyalty', 'betrayalThreshold')
 * @property {number} threshold - Value the hidden stat must meet or exceed
 * @property {boolean} resolved - Whether this gambit has been resolved
 * @property {'success'|'failure'|null} result
 */

/**
 * Determine if a gambit should be offered for a given People Card decision.
 * @param {object} params
 * @param {object} params.card - The People Card triggering the decision
 * @param {boolean} params.isBossEncounter - Whether this is a boss level
 * @param {number} [params.gambitChance] - Override gambit chance (from level config)
 * @returns {boolean}
 */
export function shouldOfferGambit({ card, isBossEncounter = false, gambitChance = GAMBIT_CHANCE }) {
  if (isBossEncounter) return true;
  if (card?.type !== 'people') return false;

  return Math.random() < gambitChance;
}

/**
 * Generate a gambit option for a People Card decision.
 * @param {object} params
 * @param {object} params.card - The People Card
 * @param {string} params.territory - Current territory context
 * @param {object} [params.levelConfig] - Level configuration
 * @returns {GambitOption}
 */
export function generateGambit({ card, territory, levelConfig }) {
  const loyalty = card._hidden?.loyaltyTrue ?? parseInt(card.loyalty) ?? 5;
  const role = card.role?.toLowerCase() || 'runner';

  // Generate gambit based on role archetype
  const gambits = getGambitTemplates(card, territory);
  const template = gambits[Math.floor(Math.random() * gambits.length)];

  return {
    description: template.description,
    successOutcome: template.successOutcome,
    failureOutcome: template.failureOutcome,
    hiddenCheck: template.hiddenCheck || 'loyaltyTrue',
    threshold: template.threshold ?? 6,
    resolved: false,
    result: null,
  };
}

/**
 * Resolve a gambit against the card's hidden stats.
 * @param {GambitOption} gambit
 * @param {object} card - The People Card (with _hidden layer)
 * @returns {{ success: boolean, outcome: string, consequences: object }}
 */
export function resolveGambit(gambit, card) {
  const hiddenValue = card._hidden?.[gambit.hiddenCheck] ?? 5;
  const success = hiddenValue >= gambit.threshold;

  const consequences = {};

  if (success) {
    consequences.loyaltyChange = 4;  // Massive loyalty boost
    consequences.keywordGain = true; // Card gains a new keyword
    consequences.allyStatus = true;  // Permanent ally status
  } else {
    consequences.loyaltyChange = -10; // Card flips completely
    consequences.cardLost = true;     // Card is removed from hand
    consequences.territoryLost = true; // Territory may be lost
  }

  return {
    success,
    outcome: success ? gambit.successOutcome : gambit.failureOutcome,
    consequences,
  };
}

/**
 * Format a gambit choice for display.
 * @param {object} choice - The binary choice (A/B)
 * @param {GambitOption} gambit - The gambit option
 * @param {object} card - The People Card
 * @returns {string}
 */
export function formatGambitChoice(choice, gambit, card) {
  const lines = [
    `> You played: 👤 ${card.name}`,
    '',
    choice.description || '',
    '',
    `  ← [A] ${choice.optionA}`,
    `  → [B] ${choice.optionB}`,
  ];

  if (gambit) {
    lines.push(`  🎲 [G] GAMBIT: ${gambit.description}`);
    lines.push(`     Success: ${gambit.successOutcome}`);
    lines.push(`     Failure: ${gambit.failureOutcome}`);
  }

  lines.push('');
  lines.push('Your call? (A, B, or G)');

  return lines.join('\n');
}

/**
 * Get gambit templates based on card role and context.
 * @private
 */
function getGambitTemplates(card, territory) {
  const name = card.name || 'this character';
  const role = card.role?.toLowerCase() || 'runner';

  const templates = {
    enforcer: [
      {
        description: `DOUBLE DOWN — Give ${name} command of the entire block.`,
        successOutcome: `${name} swears a blood oath. +4 loyalty, Block keyword activates, permanent ally.`,
        failureOutcome: `${name} takes the block and turns it against you. You lose the territory AND ${name}.`,
        hiddenCheck: 'loyaltyTrue',
        threshold: 6,
      },
      {
        description: `WAR CHIEF — Send ${name} on a solo raid against ${territory || 'the rival block'}.`,
        successOutcome: `${name} takes the block single-handed. +3 loyalty, gains Fortify keyword.`,
        failureOutcome: `${name} gets caught. Removed from game. +3 Heat.`,
        hiddenCheck: 'loyaltyTrue',
        threshold: 7,
      },
    ],
    broker: [
      {
        description: `ALL IN — Offer ${name} a full partnership. Equal cut, equal risk.`,
        successOutcome: `${name} connects you to a new faction. +4 loyalty, gains Connect keyword, opens new alliance.`,
        failureOutcome: `${name} takes the deal to your rival. Loses -10 loyalty, leaks your intel.`,
        hiddenCheck: 'loyaltyTrue',
        threshold: 6,
      },
    ],
    informant: [
      {
        description: `THE WIRE — Ask ${name} to wear a wire on the rival faction.`,
        successOutcome: `${name} delivers a full dossier. Reveal ALL hidden stats on rival NPCs this level.`,
        failureOutcome: `${name} is a double agent. Your hand is revealed to the rival faction. +4 Heat.`,
        hiddenCheck: 'loyaltyTrue',
        threshold: 5,
      },
    ],
    runner: [
      {
        description: `PROMOTION — Elevate ${name} to Broker. Higher risk, higher reward.`,
        successOutcome: `${name} proves worthy. Role changes to Broker, +3 loyalty, gains Hustle keyword.`,
        failureOutcome: `${name} can't handle the pressure. Flips to rival faction. Lost.`,
        hiddenCheck: 'loyaltyTrue',
        threshold: 6,
      },
    ],
  };

  return templates[role] || templates.runner;
}
