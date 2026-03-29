/**
 * BL0CKS Stash System (Assets)
 * 
 * After completing each level, the player enters The Stash — a reward screen
 * where they choose 1 of 3 randomly offered Assets.
 * Assets are permanent, rule-breaking passive buffs for the entire run.
 * 
 * From GDD §4.5:
 * 12 assets total, unlocked at different level thresholds.
 * Assets stack and synergize.
 */

/**
 * Full asset pool from GDD §4.5.
 */
export const ASSET_POOL = Object.freeze([
  {
    id: 'greek_diner',
    name: 'The Greek Diner',
    icon: '🍽️',
    effect: 'First Intel card played each level costs 0 Influence.',
    category: 'information',
    unlockLevel: 2,
    mechanic: { firstIntelFree: true },
  },
  {
    id: 'crooked_alderman',
    name: 'Crooked Alderman',
    icon: '🏛️',
    effect: 'Ignore one Police-type Street Whisper intent per level.',
    category: 'defense',
    unlockLevel: 3,
    mechanic: { ignorePoliceWhisperCount: 1 },
  },
  {
    id: 'burner_network',
    name: 'Burner Network',
    icon: '📱',
    effect: 'Hand size +1 (6 cards). Must Exhaust 1 card at start of each level.',
    category: 'card_advantage',
    unlockLevel: 2,
    mechanic: { handSizeBonus: 1, exhaustAtLevelStart: 1 },
  },
  {
    id: 'corner_armory',
    name: 'Corner Armory',
    icon: '🔫',
    effect: 'All Enforcers gain +1 Block Point passive buff.',
    category: 'defense',
    unlockLevel: 3,
    mechanic: { enforcerBlockPointBonus: 1 },
  },
  {
    id: 'the_plug',
    name: 'The Plug',
    icon: '🔌',
    effect: 'Tax generates double resources from the first block taxed each turn.',
    category: 'economy',
    unlockLevel: 4,
    mechanic: { doubleTaxFirst: true },
  },
  {
    id: 'ghost_protocol',
    name: 'Ghost Protocol',
    icon: '🕶️',
    effect: 'Ghost move also clears 1 Status Card from hand for free.',
    category: 'utility',
    unlockLevel: 3,
    mechanic: { ghostClearsStatus: 1 },
  },
  {
    id: 'bail_money',
    name: 'Bail Money',
    icon: '💵',
    effect: 'Once per level, prevent a People Card from being lost in a failed War.',
    category: 'recovery',
    unlockLevel: 5,
    mechanic: { preventWarLossCount: 1 },
  },
  {
    id: 'wire_tap',
    name: 'Wire Tap',
    icon: '🎧',
    effect: 'At the start of each level, reveal 1 hidden stat on a random NPC for free.',
    category: 'information',
    unlockLevel: 4,
    mechanic: { freeRevealAtStart: 1 },
  },
  {
    id: 'og_status',
    name: 'OG Status',
    icon: '👑',
    effect: '+1 base Influence per turn (permanent 4 instead of 3).',
    category: 'economy',
    unlockLevel: 7,
    mechanic: { baseInfluenceBonus: 1 },
  },
  {
    id: 'safe_house',
    name: 'Safe House',
    icon: '🏠',
    effect: 'When you lose a territory, 1 People Card auto-escapes to your nearest block.',
    category: 'recovery',
    unlockLevel: 6,
    mechanic: { autoEscapeOnTerritoryLoss: 1 },
  },
  {
    id: 'inside_man',
    name: 'Inside Man',
    icon: '🕵️',
    effect: 'Peace alliances last +2 turns and cannot be broken by enemy intent.',
    category: 'diplomacy',
    unlockLevel: 5,
    mechanic: { peaceDurationBonus: 2, peaceUnbreakable: true },
  },
  {
    id: 'cold_hands',
    name: 'Cold Hands',
    icon: '🧊',
    effect: 'Burn moves grant +2 Influence instead of +1 when burning Status Cards.',
    category: 'deck_thinning',
    unlockLevel: 4,
    mechanic: { burnStatusInfluenceBonus: 1 },
  },
]);

/**
 * Generate 3 random asset offers for The Stash.
 * Filters by unlock level and excludes already-held assets.
 * @param {number} completedLevel - Level just completed
 * @param {string[]} heldAssetIds - Asset ids the player already has
 * @returns {object[]} 3 asset offers
 */
export function generateStashOffers(completedLevel, heldAssetIds = []) {
  const available = ASSET_POOL.filter(a =>
    a.unlockLevel <= completedLevel && !heldAssetIds.includes(a.id)
  );

  if (available.length <= 3) return [...available];

  // Fisher-Yates to pick 3
  const shuffled = [...available];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, 3);
}

/**
 * Get an asset by id.
 * @param {string} assetId
 * @returns {object|null}
 */
export function getAsset(assetId) {
  return ASSET_POOL.find(a => a.id === assetId) || null;
}

/**
 * Calculate the effective hand size considering assets.
 * @param {object[]} assets - Active assets
 * @returns {number}
 */
export function getEffectiveHandSize(assets) {
  let size = 5; // Default
  for (const asset of assets) {
    if (asset.mechanic?.handSizeBonus) {
      size += asset.mechanic.handSizeBonus;
    }
  }
  return size;
}

/**
 * Check for asset synergies (combos that are especially powerful).
 * @param {string[]} assetIds
 * @returns {string[]} Array of synergy descriptions
 */
export function detectAssetSynergies(assetIds) {
  const synergies = [];
  const set = new Set(assetIds);

  if (set.has('wire_tap') && set.has('greek_diner')) {
    synergies.push('Wire Tap + Greek Diner: Start each level knowing a hidden stat AND get first Intel free.');
  }

  if (set.has('burner_network') && set.has('cold_hands')) {
    synergies.push('Burner Network + Cold Hands: Extra draw + boosted Exhaust = aggressive deck-thinning.');
  }

  if (set.has('corner_armory') && set.has('safe_house')) {
    synergies.push('Corner Armory + Safe House: Territories nearly impossible to crack = fortress playstyle.');
  }

  if (set.has('og_status') && set.has('the_plug')) {
    synergies.push('OG Status + The Plug: 4 base Influence + double Tax = economic dominance.');
  }

  if (set.has('ghost_protocol') && set.has('cold_hands')) {
    synergies.push('Ghost Protocol + Cold Hands: Ghost clears Status AND Burn gives +2 Influence = clean deck, rich plays.');
  }

  if (set.has('inside_man') && set.has('safe_house')) {
    synergies.push('Inside Man + Safe House: Unbreakable alliances + auto-escape = diplomatic fortress.');
  }

  return synergies;
}

/**
 * Format The Stash screen for CLI rendering.
 * @param {number} completedLevel
 * @param {object[]} offers - 3 asset offers
 * @returns {string}
 */
export function formatStashScreen(completedLevel, offers) {
  const lines = [
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    `  THE STASH — LEVEL ${completedLevel} COMPLETE`,
    '  Choose 1 Asset. This is permanent.',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '',
  ];

  const labels = ['A', 'B', 'C'];
  for (let i = 0; i < offers.length; i++) {
    const asset = offers[i];
    lines.push(`  [${labels[i]}] ${asset.icon}  ${asset.name.toUpperCase()}`);
    lines.push(`      ${asset.effect}`);
    lines.push('');
  }

  lines.push('  Your pick? (A, B, or C)');
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  return lines.join('\n');
}
