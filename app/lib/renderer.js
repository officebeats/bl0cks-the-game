/**
 * BL0CKS CLI Renderer
 * Pokemon TCG Game Boy Color-style ASCII art rendering.
 * All rendering targets 80-column terminal width.
 */

const W = 80; // Terminal width

// ── ANSI Colors ──────────────────────────────────────────────────
const A = {
  reset:   '\x1b[0m',
  bold:    '\x1b[1m',
  dim:     '\x1b[2m',
  italic:  '\x1b[3m',
  inv:     '\x1b[7m',
  red:     '\x1b[38;2;192;57;43m',
  gold:    '\x1b[38;2;212;172;13m',
  blue:    '\x1b[38;2;31;78;121m',
  green:   '\x1b[38;2;39;174;96m',
  gray:    '\x1b[38;2;100;100;100m',
  white:   '\x1b[38;2;242;242;242m',
  cyan:    '\x1b[38;2;80;200;220m',
  purple:  '\x1b[38;2;155;89;182m',
  orange:  '\x1b[38;2;230;126;34m',
  bgRed:   '\x1b[48;2;60;20;20m',
  bgGold:  '\x1b[48;2;50;40;10m',
  bgGreen: '\x1b[48;2;15;50;30m',
  bgBlue:  '\x1b[48;2;15;25;50m',
  bgDark:  '\x1b[48;2;18;18;28m',
  bgSurface: '\x1b[48;2;26;26;46m',
};

// Faction colors
const FACTION_COLOR = {
  'governors': A.blue,
  'lords':     A.gold,
  'stones':    A.red,
  'cpd':       A.gray,
  'law':       A.gray,
  'commission': A.purple,
  'neutral':   A.cyan,
  'you':       A.green,
  'default':   A.white,
};

function factionColor(faction) {
  if (!faction) return FACTION_COLOR.default;
  const key = faction.toLowerCase().replace(/^the\s+/, '');
  return FACTION_COLOR[key] || FACTION_COLOR.default;
}

// ── String Utilities ─────────────────────────────────────────────
// Strip ANSI codes for length calculation
function stripAnsi(str) {
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

function visLen(str) {
  return stripAnsi(str).length;
}

// Pad string to width (accounting for ANSI codes)
function pad(str, width, ch = ' ') {
  const diff = width - visLen(str);
  if (diff <= 0) return str;
  return str + ch.repeat(diff);
}

function padCenter(str, width, ch = ' ') {
  const diff = width - visLen(str);
  if (diff <= 0) return str;
  const left = Math.floor(diff / 2);
  const right = diff - left;
  return ch.repeat(left) + str + ch.repeat(right);
}

function truncate(str, max) {
  if (stripAnsi(str).length <= max) return str;
  // Rough truncation — works for plain strings
  return str.substring(0, max - 1) + '…';
}

// ── Box Drawing ──────────────────────────────────────────────────
const BOX = {
  tl: '╔', tr: '╗', bl: '╚', br: '╝', h: '═', v: '║',
  ml: '╠', mr: '╣', // mid-left, mid-right connectors
  // Single-line for inner boxes (cards, territories)
  stl: '┌', str: '┐', sbl: '└', sbr: '┘', sh: '─', sv: '│',
  sml: '├', smr: '┤',
};

function doubleTop(innerW) {
  return `${A.gray}${BOX.tl}${BOX.h.repeat(innerW)}${BOX.tr}${A.reset}`;
}
function doubleBot(innerW) {
  return `${A.gray}${BOX.bl}${BOX.h.repeat(innerW)}${BOX.br}${A.reset}`;
}
function doubleMid(innerW) {
  return `${A.gray}${BOX.ml}${BOX.h.repeat(innerW)}${BOX.mr}${A.reset}`;
}
function doubleRow(content, innerW) {
  return `${A.gray}${BOX.v}${A.reset}${pad(content, innerW)}${A.gray}${BOX.v}${A.reset}`;
}

function singleBox(lines, boxW) {
  const inner = boxW - 2;
  const out = [];
  out.push(`${BOX.stl}${BOX.sh.repeat(inner)}${BOX.str}`);
  for (const line of lines) {
    out.push(`${BOX.sv}${pad(line, inner)}${BOX.sv}`);
  }
  out.push(`${BOX.sbl}${BOX.sh.repeat(inner)}${BOX.sbr}`);
  return out;
}

// ── Loyalty Bar ──────────────────────────────────────────────────
function loyaltyBar(value, max = 10, barWidth = 10) {
  const filled = Math.round((value / max) * barWidth);
  const empty = barWidth - filled;
  const color = value >= 7 ? A.green : value >= 4 ? A.gold : A.red;
  return `${color}${'█'.repeat(filled)}${'░'.repeat(empty)}${A.reset}`;
}

// ── Territory Tile ───────────────────────────────────────────────
function renderTerritoryTile(territory, tileW = 22) {
  const inner = tileW - 2;
  const name = truncate(territory.name || 'Unknown', inner);

  let controlIcon, controlText, controlColor;
  const ctrl = (territory.control || '').toLowerCase();

  if (ctrl === 'you' || ctrl === 'player') {
    controlIcon = '●'; controlText = 'YOU'; controlColor = A.green;
  } else if (ctrl === 'contested') {
    controlIcon = '◐'; controlText = 'CONTESTED'; controlColor = A.gold;
  } else if (ctrl === 'neutral') {
    controlIcon = '◇'; controlText = 'NEUTRAL'; controlColor = A.cyan;
  } else {
    controlIcon = '○'; controlText = territory.control || 'RIVAL'; controlColor = A.red;
  }

  const faction = territory.faction ? ` (${territory.faction})` : '';
  const intersection = territory.intersection || '';

  const lines = [
    ` ${A.bold}${A.white}${pad(name.toUpperCase(), inner - 1)}${A.reset}`,
    ` ${controlColor}${controlIcon} ${pad(controlText + faction, inner - 3)}${A.reset}`,
    ` ${A.dim}${pad(truncate(intersection, inner - 2), inner - 1)}${A.reset}`,
  ];

  return singleBox(lines, tileW);
}

// ── People Card ──────────────────────────────────────────────────
function renderPeopleCard(card, index, cardW = 14) {
  const inner = cardW - 2;
  const nameStr = truncate(card.name || '???', inner - 1);
  const role = truncate(card.role || '???', inner - 1);
  const block = truncate(card.block || '', inner - 1);
  const loy = card.loyalty != null ? card.loyalty : '?';
  const loyVal = typeof loy === 'number' ? loy : 5;
  const bar = loyaltyBar(loyVal, 10, inner - 2);

  const fColor = factionColor(card.faction);
  const idxStr = `${A.gold}${index}${A.reset}`;

  const lines = [
    `${idxStr}${A.dim}·${A.reset}${fColor}${A.bold}${pad(nameStr, inner - 2)}${A.reset}`,
    ` ${A.dim}${pad(role, inner - 1)}${A.reset}`,
    ` ${A.dim}${pad(block, inner - 1)}${A.reset}`,
    ` ${A.dim}Loy:${A.reset}${pad(String(loy), 3)}${pad('', inner - 8)}`,
    ` ${bar} `,
    ` ${A.gray}${pad('[HIDDEN]', inner - 1)}${A.reset}`,
  ];

  return singleBox(lines, cardW);
}

// ── Move Card ────────────────────────────────────────────────────
function renderMoveCard(card, index, cardW = 14) {
  const inner = cardW - 2;
  const name = truncate(card.name || '???', inner - 3);
  const desc = truncate(card.description || '', inner - 1);

  const idxStr = `${A.gold}${index}${A.reset}`;

  const lines = [
    `${idxStr}${A.dim}·${A.reset}${A.red}${A.bold}⚔ ${pad(name, inner - 4)}${A.reset}`,
    `${pad('', inner)}`,
    ` ${A.dim}${pad(desc, inner - 1)}${A.reset}`,
    `${pad('', inner)}`,
    `${pad('', inner)}`,
    `${pad('', inner)}`,
  ];

  return singleBox(lines, cardW);
}

// ── Status Card ──────────────────────────────────────────────────
function renderStatusCard(card, index, cardW = 14) {
  const inner = cardW - 2;
  const name = truncate(card.name || '???', inner - 3);
  // Break description into two lines if it's too long
  const desc = card.description || '';
  const desc1 = truncate(desc.substring(0, inner - 1), inner - 1);
  const desc2 = truncate(desc.substring(inner - 1), inner - 1);

  const idxStr = `${A.gold}${index}${A.reset}`;

  const lines = [
    `${idxStr}${A.dim}·${A.reset}${A.orange}${A.bold}⚠️ ${pad(name, inner - 4)}${A.reset}`,
    `${pad('', inner)}`,
    ` ${A.dim}${pad(desc1, inner - 1)}${A.reset}`,
    ` ${A.dim}${pad(desc2, inner - 1)}${A.reset}`,
    `${pad('', inner)}`,
    `${pad('', inner)}`,
  ];

  return singleBox(lines, cardW);
}

// ── Full Board Render ────────────────────────────────────────────
export function renderBoard(state) {
  const iW = W - 2; // inner width (inside double border)
  const out = [];

  // ── Header ──
  out.push('');
  out.push(doubleTop(iW));

  const levelName = state.levelName || 'The Corner';
  const levelNum = state.levelNumber || 1;
  const clockCurrent = state.clock?.current ?? '?';
  const clockTotal = state.clock?.total ?? '?';
  const clockStatus = state.clock?.status || '';
  const clockRatio = (typeof clockCurrent === 'number' && typeof clockTotal === 'number')
    ? clockCurrent / clockTotal : 0;
  const clockColor = clockRatio > 0.7 ? A.red : clockRatio > 0.4 ? A.gold : A.green;

  const headerLeft = `  ${A.red}${A.bold}BL0CKS${A.reset} ${A.dim}·${A.reset} ${A.white}Level ${levelNum} · ${levelName}${A.reset}`;
  const headerRight = `${clockColor}🕐 ${clockCurrent}/${clockTotal}${A.reset} ${A.dim}${clockStatus}${A.reset}  `;
  const headerGap = iW - visLen(headerLeft) - visLen(headerRight);
  out.push(doubleRow(headerLeft + ' '.repeat(Math.max(1, headerGap)) + headerRight, iW));

  out.push(doubleMid(iW));

  // ── Territory Map ──
  const mapTitle = `  ${A.bold}${A.white}📍 TERRITORY${A.reset}`;
  out.push(doubleRow(mapTitle, iW));
  out.push(doubleRow('', iW));

  const territories = state.territories || [];
  const tileW = 24;
  const tilesPerRow = 3;

  // Render territory tiles in rows of 3
  for (let rowStart = 0; rowStart < territories.length; rowStart += tilesPerRow) {
    const rowTerritories = territories.slice(rowStart, rowStart + tilesPerRow);
    const tileBoxes = rowTerritories.map(t => renderTerritoryTile(t, tileW));
    const tileHeight = tileBoxes[0]?.length || 0;

    for (let line = 0; line < tileHeight; line++) {
      let rowStr = '  ';
      for (let t = 0; t < tileBoxes.length; t++) {
        rowStr += (tileBoxes[t][line] || pad('', tileW)) + ' ';
      }
      out.push(doubleRow(rowStr, iW));
    }
    if (rowStart + tilesPerRow < territories.length) {
      out.push(doubleRow('', iW));
    }
  }

  out.push(doubleRow('', iW));
  out.push(doubleMid(iW));

  // ── Event ──
  if (state.event) {
    const evtTitle = `  ${A.gold}${A.bold}⚡ EVENT: ${(state.event.name || 'UNKNOWN').toUpperCase()}${A.reset}`;
    out.push(doubleRow(evtTitle, iW));

    // Word-wrap event description
    const desc = state.event.description || '';
    const descLines = wordWrap(desc, iW - 4);
    for (const dl of descLines) {
      out.push(doubleRow(`  ${A.white}${dl}${A.reset}`, iW));
    }
    out.push(doubleMid(iW));
  }

  // ── Street Whisper / Scanner ──
  if (state.scanner) {
    // If it's a predictive intent, highlight it orange
    const isIntent = state.scanner.includes('[INTENT');
    const icon = isIntent ? `⚠️` : `📻`;
    const color = isIntent ? A.orange : A.red;
    
    // Break into lines to prevent overflow
    const scanLines = wordWrap(`"${state.scanner}"`, iW - 6);
    out.push(doubleRow(`  ${color}${icon}${A.reset} ${A.dim}${scanLines[0]}${A.reset}`, iW));
    for (let i = 1; i < scanLines.length; i++) {
       out.push(doubleRow(`     ${A.dim}${scanLines[i]}${A.reset}`, iW));
    }
    out.push(doubleMid(iW));
  }

  // ── Hand ──
  const intelCount = state.intel ?? '?';
  const intelColor = intelCount === 0 ? A.red : A.gold;
  const handTitle = `  ${A.bold}${A.white}🃏 YOUR HAND${A.reset}`;
  const intelStr = `${intelColor}🔒 Intel: ${intelCount}${A.reset}  `;
  const handGap = iW - visLen(handTitle) - visLen(intelStr);
  out.push(doubleRow(handTitle + ' '.repeat(Math.max(1, handGap)) + intelStr, iW));
  out.push(doubleRow('', iW));

  const hand = state.hand || [];
  const cardW = 14;

  // Split hand into people cards and move cards, render side by side
  // Split hand into people cards, move cards, status cards
  const cardBoxes = hand.map((card, i) => {
    if (card.type === 'move') {
      return renderMoveCard(card, i + 1, cardW);
    }
    if (card.type === 'status') {
      return renderStatusCard(card, i + 1, cardW);
    }
    return renderPeopleCard(card, i + 1, cardW);
  });

  if (cardBoxes.length > 0) {
    const cardHeight = Math.max(...cardBoxes.map(b => b.length));
    for (let line = 0; line < cardHeight; line++) {
      let rowStr = '  ';
      for (let c = 0; c < cardBoxes.length; c++) {
        rowStr += (cardBoxes[c][line] || pad('', cardW)) + ' ';
      }
      out.push(doubleRow(rowStr, iW));
    }
  }

  out.push(doubleRow('', iW));
  out.push(doubleMid(iW));

  // ── Choice / Prompt ──
  if (state.choice) {
    if (state.choice.description) {
      const choiceDesc = wordWrap(state.choice.description, iW - 4);
      for (const cl of choiceDesc) {
        out.push(doubleRow(`  ${A.white}${cl}${A.reset}`, iW));
      }
      out.push(doubleRow('', iW));
    }

    if (state.choice.optionA) {
      const optA = `  ${A.blue}${A.bold}← [A]${A.reset} ${A.white}${state.choice.optionA}${A.reset}`;
      out.push(doubleRow(optA, iW));
    }
    if (state.choice.optionB) {
      const optB = `  ${A.red}${A.bold}→ [B]${A.reset} ${A.white}${state.choice.optionB}${A.reset}`;
      out.push(doubleRow(optB, iW));
    }
    if (state.choice.optionBurn) {
      const optBurn = `  ${A.orange}${A.bold}🗑️ [BURN]${A.reset} ${A.dim}${state.choice.optionBurn}${A.reset}`;
      out.push(doubleRow(optBurn, iW));
    }
    out.push(doubleRow('', iW));
    const prompt = `  ${A.gold}Your call? (A, B, or BURN)${A.reset}`;
    out.push(doubleRow(prompt, iW));
  } else {
    const prompt = `  ${A.gold}What do you play? (1-${hand.length || 5}, or INTEL [Name])${A.reset}`;
    out.push(doubleRow(prompt, iW));
  }

  out.push(doubleBot(iW));
  out.push('');

  return out.join('\n');
}

// ── Narrative Display (for non-board AI responses) ───────────────
export function renderNarrative(text) {
  const iW = W - 2;
  const out = [];
  out.push(doubleMid(iW));

  const lines = wordWrap(text, iW - 4);
  for (const line of lines) {
    out.push(doubleRow(`  ${A.white}${line}${A.reset}`, iW));
  }

  out.push(doubleBot(iW));
  return out.join('\n');
}

// ── Win / Loss Screens ──────────────────────────────────────────
export function renderWin(message) {
  const iW = W - 2;
  const out = [];
  out.push('');
  out.push(doubleTop(iW));
  out.push(doubleRow('', iW));
  out.push(doubleRow(padCenter(`${A.green}${A.bold}★ VICTORY ★${A.reset}`, iW), iW));
  out.push(doubleRow('', iW));
  const lines = wordWrap(message || 'You held the block.', iW - 8);
  for (const l of lines) {
    out.push(doubleRow(padCenter(`${A.white}${l}${A.reset}`, iW), iW));
  }
  out.push(doubleRow('', iW));
  out.push(doubleBot(iW));
  return out.join('\n');
}

export function renderLoss(message) {
  const iW = W - 2;
  const out = [];
  out.push('');
  out.push(doubleTop(iW));
  out.push(doubleRow('', iW));
  out.push(doubleRow(padCenter(`${A.red}${A.bold}✖ DEFEAT ✖${A.reset}`, iW), iW));
  out.push(doubleRow('', iW));
  const lines = wordWrap(message || 'The block moved without you.', iW - 8);
  for (const l of lines) {
    out.push(doubleRow(padCenter(`${A.white}${l}${A.reset}`, iW), iW));
  }
  out.push(doubleRow('', iW));
  out.push(doubleBot(iW));
  return out.join('\n');
}

// ── Loading Animation ───────────────────────────────────────────
export function renderLoading() {
  return `  ${A.dim}⠋ The block is thinking...${A.reset}`;
}

// ── Word Wrap ────────────────────────────────────────────────────
function wordWrap(text, maxW) {
  if (!text) return [''];
  const words = text.split(/\s+/);
  const lines = [];
  let current = '';

  for (const word of words) {
    if ((current + ' ' + word).trim().length > maxW) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = current ? current + ' ' + word : word;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [''];
}

// ── Splash Screen ────────────────────────────────────────────────
export function renderSplash() {
  const iW = W - 2;
  const out = [];
  out.push('');
  out.push(doubleTop(iW));
  out.push(doubleRow('', iW));
  // ASCII art logo
  const logo = [
    `${A.red}${A.bold}  ██████╗ ██╗      ██████╗  ██████╗██╗  ██╗███████╗${A.reset}`,
    `${A.red}${A.bold}  ██╔══██╗██║     ██╔═████╗██╔════╝██║ ██╔╝██╔════╝${A.reset}`,
    `${A.red}${A.bold}  ██████╔╝██║     ██║██╔██║██║     █████╔╝ ███████╗${A.reset}`,
    `${A.red}${A.bold}  ██╔══██╗██║     ████╔╝██║██║     ██╔═██╗ ╚════██║${A.reset}`,
    `${A.red}${A.bold}  ██████╔╝███████╗╚██████╔╝╚██████╗██║  ██╗███████║${A.reset}`,
    `${A.red}${A.bold}  ╚═════╝ ╚══════╝ ╚═════╝  ╚═════╝╚═╝  ╚═╝╚══════╝${A.reset}`,
  ];

  for (const l of logo) {
    out.push(doubleRow(padCenter(l, iW), iW));
  }
  out.push(doubleRow('', iW));
  out.push(doubleRow(padCenter(`${A.gray}${A.italic}Territory. Trust. Time.${A.reset}`, iW), iW));
  out.push(doubleRow('', iW));
  out.push(doubleRow(padCenter(`${A.dim}The first AI-powered strategy card game${A.reset}`, iW), iW));
  out.push(doubleRow(padCenter(`${A.dim}where every decision costs you something.${A.reset}`, iW), iW));
  out.push(doubleRow('', iW));
  out.push(doubleMid(iW));
  out.push(doubleRow(padCenter(`${A.dim}South Side, Chicago  ·  Season 1${A.reset}`, iW), iW));
  out.push(doubleBot(iW));
  out.push('');

  return out.join('\n');
}

// ── Provider Selection Screen ────────────────────────────────────
export function renderProviderSelect(providers, savedProvider) {
  const iW = W - 2;
  const out = [];
  out.push(doubleTop(iW));
  out.push(doubleRow(`  ${A.bold}${A.white}Choose Your Model${A.reset}`, iW));
  out.push(doubleRow(`  ${A.gray}Bring your own LLM — your key never leaves your machine.${A.reset}`, iW));
  out.push(doubleRow('', iW));
  out.push(doubleMid(iW));

  for (let i = 0; i < providers.length; i++) {
    const p = providers[i];
    const saved = savedProvider === p.id ? ` ${A.green}✓ saved${A.reset}` : '';
    const line = `  ${p.color}${A.bold}[${i + 1}]${A.reset} ${A.white}${p.name}${A.reset} ${A.dim}· ${p.tier}${A.reset}${saved}`;
    out.push(doubleRow(line, iW));
  }

  out.push(doubleRow('', iW));
  out.push(doubleBot(iW));

  return out.join('\n');
}

// Re-export colors for use in main CLI
export { A, factionColor };
