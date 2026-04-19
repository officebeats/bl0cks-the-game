/**
 * BL0CKS Prompt Builder
 * 
 * Assembles the system prompt from ROM content files.
 * This is the bridge between ROM content (world layer) and the AI.
 * 
 * The JSON output directive is ENGINE-owned (invariant across ROMs).
 * Everything else comes from the ROM's prompts/ and world/ directories.
 */

/**
 * Build the complete system prompt for an AI session.
 * @param {object} rom - Loaded ROM content object
 * @param {object} [options] - { romInfo, ledger, currentLevel }
 * @returns {string} The assembled system prompt
 */
export function buildSystemPrompt(rom, options = {}) {
  const sections = [];

  // 1. Game engine system prompt (from ROM)
  if (rom.prompts.system) {
    sections.push(rom.prompts.system);
  }

  // 2. Narrator voice (from ROM, optional)
  if (rom.prompts.narrator) {
    sections.push(rom.prompts.narrator);
  }

  // 3. JSON output directive (ENGINE-owned, invariant)
  sections.push(getOutputFormatDirective());

  // 4. ROM identity context (for DLC/community content awareness)
  if (options.romInfo && options.currentLevel) {
    const romContext = buildROMContextBlock(options.romInfo, options.currentLevel);
    if (romContext) sections.push(romContext);
  }

  // 5. Ledger state (persistent consequences from prior levels)
  if (options.ledger) {
    sections.push(buildLedgerBlock(options.ledger));
  }

  // 6. World files
  sections.push('---');
  if (rom.world.territories) sections.push(rom.world.territories);
  sections.push('---');
  if (rom.world.factions) sections.push(rom.world.factions);

  return sections.join('\n\n');
}

/**
 * Engine-owned JSON output format directive.
 * This is invariant — does not change between ROMs.
 */
function getOutputFormatDirective() {
  return `
## CRITICAL: Machine-Readable Output

You are being accessed through a game client. Along with your narrative text output, you MUST also output a JSON block at the END of every response. This JSON block allows the client to render the game board visually.

Wrap the JSON in a code fence like this:

\`\`\`json
{
  "level_number": 1,
  "level_name": "The Corner",
  "clock": { "current": 0, "total": 12, "status": "CALM" },
  "territories": [
    { "name": "Woodlawn", "control": "you", "faction": "Governors", "intersection": "63rd & King" }
  ],
  "scanner": "All quiet on the South Side... for now.",
  "event": { "name": "POWER VACUUM", "description": "The Governors just lost their top lieutenant..." },
  "hand": [
    { "type": "people", "name": "Darius Webb", "role": "Broker", "block": "Woodlawn", "loyalty": 8, "faction": "Governors" },
    { "type": "move", "name": "TAX", "description": "Collect resources from a controlled block" }
  ],
  "intel": 2,
  "choice": null,
  "outcome": null
}
\`\`\`

RULES FOR THE JSON:
- "control" values: "you", "rival", "contested", "neutral"
- "hand" must always include ALL cards the player currently holds
- When a choice is pending, set "choice": { "description": "...", "optionA": "...", "optionB": "..." }
- When the player wins set "outcome": "win", when they lose set "outcome": "loss"
- Always include the JSON block even on follow-up turns
- The JSON must reflect the CURRENT game state AFTER resolving the player's action
- **Blitz System (Queueing)**: If the player sends multiple actions (separated by "&&" or presented as a list),resolve them sequentially in one turn. Only output the narrative and JSON for the FINAL state after all actions in the queue have resolved. If an action in the queue triggers a Game Over or Level Clear, stop processing subsequent actions.
`;
}

/**
 * Build ROM identity context block for the AI.
 * Tells the AI it's running DLC/community content so it can subtly adapt.
 */
function buildROMContextBlock(romInfo, currentLevel) {
  if (!currentLevel._isDLC && !currentLevel._isCommunity) {
    return ''; // Base game — no extra context
  }

  const overlay = romInfo.activeOverlays?.[0];
  const source = currentLevel._isDLC ? 'expansion' : 'community content pack';
  const name = overlay?.name || currentLevel._sourceROM || 'custom content';

  return `
## CONTENT PACK CONTEXT

This level is from the "${name}" ${source}.
The narrative tone, characters, and scenarios in this level extend the base game.
When narrating, subtly acknowledge this is expanded content — reference events,
characters, or locations that are unique to this ${source}.
Do NOT break the fourth wall or say "this is DLC." Instead, treat the ${source}
content as a natural continuation of the world.
`;
}

/**
 * Build the Ledger context block from persistent state.
 */
function buildLedgerBlock(ledger) {
  if (!ledger || Object.keys(ledger).length === 0) return '';

  return `
## PERSISTENT STATE — THE LEDGER

The following state carries forward from previous levels. Read it and weave it
into your narrative and mechanical decisions:

\`\`\`
${typeof ledger === 'string' ? ledger : JSON.stringify(ledger, null, 2)}
\`\`\`
`;
}
