/**
 * BL0CKS CLI — Map Renderer
 * 
 * Renders the branching 12-level campaign map.
 * Used in the Intermission Hub between levels.
 */

import { A } from './renderer.js';

/**
 * Render the campaign map with branching paths.
 * @param {object[]} levels - All levels in the ROM
 * @param {string} currentLevelId - Level the player just finished or is starting
 * @param {object} ledger - Persistent game consequences
 * @returns {string} ANSI-rendered ASCI map
 */
export function renderCampaignMap(levels, currentLevelId, ledger = {}) {
  const completedLevels = ledger.completedLevels || [];
  const lines = [
    '',
    `  ${A.bold}${A.gold}--- THE CAMPAIGN MAP ---${A.reset}`,
    `  ${A.dim}Choose your next territory. The South Side respects territory, not intentions.${A.reset}`,
    '',
  ];

  // 12 levels arranged in a branching structure
  // Row 1: Intro (L00-L01)
  // Row 2: Choices (L02-L05)
  // Row 3: Mid-game (L06-L09)
  // Row 4: End-game (L10-L12)

  const getStatus = (id) => {
    if (id === currentLevelId) return `${A.gold}${A.bold}●${A.reset}`; // Current
    if (completedLevels.includes(id)) return `${A.green}✓${A.reset}`; // Done
    return `${A.blue}○${A.reset}`; // Available
  };

  const getName = (id) => {
    const level = levels.find(l => l.id === id);
    if (!level) return '???';
    return level.name;
  };

  // ASCII Layout logic (simplified for CLI 80x24)
  lines.push(`    ${getStatus('01')} ${getName('01')} [START]`);
  lines.push(`         │`);
  lines.push(`    ┌────┴────┐`);
  lines.push(`    ${getStatus('02')} L02       ${getStatus('03')} L03`);
  lines.push(`    │         │`);
  lines.push(`    ${getStatus('04')} L04       ${getStatus('05')} L05`);
  lines.push(`    └────┬────┘`);
  lines.push(`         ${getStatus('06')} ${getName('06')} [MIDPOINT]`);
  lines.push(`    ┌────┴────┐`);
  lines.push(`    ${getStatus('07')} L07       ${getStatus('08')} L08`);
  lines.push(`    │         │`);
  lines.push(`    ${getStatus('10')} L10       ${getStatus('11')} L11`);
  lines.push(`    └────┬────┘`);
  lines.push(`         ${getStatus('12')} ${getName('12')} [FINALE]`);
  lines.push('');
  lines.push(`  ${A.chalk}Current Objective: ${A.reset}${getName(currentLevelId)}`);
  
  return lines.join('\n');
}

/**
 * Format the full intermission hub screen.
 * Includes Stats, Stash Choice, and Map.
 */
export function renderIntermissionHub(engineInfo, currentLevelId, ledger, stashOffers = []) {
  const mapContent = renderCampaignMap(engineInfo.levels || [], currentLevelId, ledger);
  
  let stashContent = '';
  if (stashOffers.length > 0) {
    stashContent = [
      `  ${A.bold}${A.gold}THE STASH UNLOCKED${A.reset}`,
      `  ${A.dim}Choose an asset to strengthen your run.${A.reset}`,
      ...stashOffers.map((o, i) => `  [${i+1}] ${o.icon} ${o.name}: ${A.dim}${o.effect}${A.reset}`),
      '',
    ].join('\n');
  }

  return [
    '\x1b[2J\x1b[H', // Clear
    stashContent,
    mapContent,
    `  ${A.chalk}Press [ENTER] to continue your run...${A.reset}`,
  ].join('\n');
}
