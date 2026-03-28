/**
 * BL0CKS CLI Renderer — v3 "Fanned Hand"
 *
 * Polished terminal rendering inspired by Termcraft's techniques:
 * - Cell-buffer system for compositing overlapping cards
 * - Fanned card layout with parabolic arc (center raised, edges lowered)
 * - Drop shadows on cards for 3D depth
 * - FIGlet-style ASCII logo with gradient
 * - Textured Unicode characters (▓▒░▀█)
 * - Full 24-bit RGB color throughout
 * - Faction-tinted card headers
 * - Rounded card corners (╭╮╰╯)
 */

const W = 80; // Terminal width

// ── ANSI True-Color Palette ──────────────────────────────────────
const A = {
  reset:     '\x1b[0m',
  bold:      '\x1b[1m',
  dim:       '\x1b[2m',
  italic:    '\x1b[3m',
  underline: '\x1b[4m',
  inv:       '\x1b[7m',

  // ── Primary palette (24-bit RGB) ──
  red:       '\x1b[38;2;220;50;47m',
  crimson:   '\x1b[38;2;160;30;30m',
  gold:      '\x1b[38;2;255;200;40m',
  amber:     '\x1b[38;2;212;172;13m',
  blue:      '\x1b[38;2;60;120;200m',
  navy:      '\x1b[38;2;31;78;121m',
  green:     '\x1b[38;2;46;204;113m',
  emerald:   '\x1b[38;2;39;174;96m',
  gray:      '\x1b[38;2;100;100;110m',
  slate:     '\x1b[38;2;70;74;82m',
  white:     '\x1b[38;2;235;235;240m',
  chalk:     '\x1b[38;2;200;200;210m',
  cyan:      '\x1b[38;2;80;200;220m',
  teal:      '\x1b[38;2;60;160;180m',
  purple:    '\x1b[38;2;155;89;182m',
  orange:    '\x1b[38;2;230;126;34m',
  rust:      '\x1b[38;2;180;90;40m',
  smoke:     '\x1b[38;2;58;58;68m',
  ember:     '\x1b[38;2;255;120;40m',
  shadow:    '\x1b[38;2;30;30;40m',

  // ── Background fills ──
  bgBlack:   '\x1b[48;2;10;10;16m',
  bgDark:    '\x1b[48;2;18;18;28m',
  bgSurface: '\x1b[48;2;26;26;42m',
  bgPanel:   '\x1b[48;2;28;30;44m',
  bgCard:    '\x1b[48;2;32;34;50m',
  bgRed:     '\x1b[48;2;50;18;18m',
  bgGold:    '\x1b[48;2;50;42;14m',
  bgGreen:   '\x1b[48;2;14;44;28m',
  bgBlue:    '\x1b[48;2;14;22;46m',
  bgSlate:   '\x1b[48;2;32;34;44m',
  bgEmber:   '\x1b[48;2;46;22;12m',
  bgShadow:  '\x1b[48;2;12;12;18m',
};

// ── Faction Color Map ────────────────────────────────────────────
const FACTION_STYLE = {
  'governors':  { fg: A.blue,   bg: A.bgBlue,   accent: '\x1b[38;2;80;140;220m' },
  'lords':      { fg: A.gold,   bg: A.bgGold,   accent: '\x1b[38;2;255;210;60m' },
  'stones':     { fg: A.red,    bg: A.bgRed,     accent: '\x1b[38;2;240;70;60m'  },
  'cpd':        { fg: A.slate,  bg: A.bgSlate,   accent: A.gray  },
  'law':        { fg: A.slate,  bg: A.bgSlate,   accent: A.gray  },
  'commission': { fg: A.purple, bg: A.bgSlate,   accent: A.purple },
  'neutral':    { fg: A.teal,   bg: A.bgSlate,   accent: A.teal  },
  'you':        { fg: A.green,  bg: A.bgGreen,   accent: A.green },
  'default':    { fg: A.chalk,  bg: A.bgSlate,   accent: A.chalk },
};

function factionStyle(faction) {
  if (!faction) return FACTION_STYLE.default;
  const key = faction.toLowerCase().replace(/^the\s+/, '');
  return FACTION_STYLE[key] || FACTION_STYLE.default;
}

function factionColor(faction) {
  return factionStyle(faction).fg;
}

// ── String Utilities ─────────────────────────────────────────────
function stripAnsi(str) {
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

function visLen(str) {
  return stripAnsi(str).length;
}

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
  return str.substring(0, max - 1) + '\u2026';
}

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

// ── Box Drawing ──────────────────────────────────────────────────
const BOX = {
  tl: '\u2554', tr: '\u2557', bl: '\u255a', br: '\u255d', h: '\u2550', v: '\u2551',
  ml: '\u2560', mr: '\u2563',
  // Rounded corners for cards
  ctl: '\u256d', ctr: '\u256e', cbl: '\u2570', cbr: '\u256f',
  sh: '\u2500', sv: '\u2502',
  sml: '\u251c', smr: '\u2524',
  // Textures
  dense: '\u2593', medium: '\u2592', light: '\u2591', half: '\u2580', full: '\u2588',
};

function doubleTop(innerW) {
  return `${A.smoke}${BOX.tl}${BOX.h.repeat(innerW)}${BOX.tr}${A.reset}`;
}
function doubleBot(innerW) {
  return `${A.smoke}${BOX.bl}${BOX.h.repeat(innerW)}${BOX.br}${A.reset}`;
}
function doubleMid(innerW) {
  return `${A.smoke}${BOX.ml}${BOX.h.repeat(innerW)}${BOX.mr}${A.reset}`;
}
function doubleRow(content, innerW) {
  return `${A.smoke}${BOX.v}${A.reset}${A.bgDark}${pad(content, innerW)}${A.reset}${A.smoke}${BOX.v}${A.reset}`;
}
function innerDivider(innerW) {
  const bar = `${A.smoke}${BOX.v}${A.reset}${A.bgDark}  ${A.slate}`;
  const line = BOX.sh.repeat(innerW - 4);
  return `${bar}${line}${A.reset}${A.bgDark}  ${A.reset}${A.smoke}${BOX.v}${A.reset}`;
}

function singleBox(lines, boxW) {
  const inner = boxW - 2;
  const out = [];
  out.push(`${A.slate}${BOX.ctl}${BOX.sh.repeat(inner)}${BOX.ctr}${A.reset}`);
  for (const line of lines) {
    out.push(`${A.slate}${BOX.sv}${A.reset}${pad(line, inner)}${A.slate}${BOX.sv}${A.reset}`);
  }
  out.push(`${A.slate}${BOX.cbl}${BOX.sh.repeat(inner)}${BOX.cbr}${A.reset}`);
  return out;
}

// ══════════════════════════════════════════════════════════════════
//  CELL BUFFER SYSTEM — Termcraft-inspired compositing
//
//  Each cell stores a character and its ANSI fg/bg color sequences.
//  Cards are "painted" left-to-right into a shared buffer.
//  Later cards overwrite earlier ones → natural fan z-ordering.
// ══════════════════════════════════════════════════════════════════

function createBuf(w, h) {
  return Array.from({ length: h }, () =>
    Array.from({ length: w }, () => ({ ch: ' ', fg: '', bg: '' }))
  );
}

function bPut(buf, x, y, ch, fg, bg) {
  if (y >= 0 && y < buf.length && x >= 0 && x < buf[0].length) {
    buf[y][x] = { ch, fg: fg || '', bg: bg || '' };
  }
}

function bStr(buf, x, y, str, fg, bg) {
  for (let i = 0; i < str.length; i++) {
    bPut(buf, x + i, y, str.charAt(i), fg, bg);
  }
}

// Fill a rectangular region
function bFill(buf, x, y, w, h, ch, fg, bg) {
  for (let row = 0; row < h; row++) {
    for (let col = 0; col < w; col++) {
      bPut(buf, x + col, y + row, ch, fg, bg);
    }
  }
}

// Convert buffer to ANSI strings — batches adjacent same-color cells
function bufToLines(buf, defaultBg) {
  const lines = [];
  for (const row of buf) {
    let line = '';
    let pFg = null, pBg = null;
    for (const cell of row) {
      const fg = cell.fg || '';
      const bg = cell.bg || defaultBg || '';
      if (fg !== pFg) { line += fg; pFg = fg; }
      if (bg !== pBg) { line += bg; pBg = bg; }
      line += cell.ch;
    }
    line += A.reset;
    lines.push(line);
  }
  return lines;
}

// ══════════════════════════════════════════════════════════════════
//  CARD PAINTING — paint individual cards into the cell buffer
// ══════════════════════════════════════════════════════════════════

const CARD_W = 16;
const CARD_H = 8;

// ── Loyalty Bar (gradient) ───────────────────────────────────────
function loyaltyBarCells(buf, x, y, value, max = 10, barW = 10) {
  const filled = Math.round((value / max) * barW);
  let color;
  if (value >= 8) color = '\x1b[38;2;46;204;113m';
  else if (value >= 6) color = '\x1b[38;2;130;200;80m';
  else if (value >= 4) color = '\x1b[38;2;255;200;40m';
  else if (value >= 2) color = '\x1b[38;2;230;126;34m';
  else color = '\x1b[38;2;220;50;47m';

  for (let i = 0; i < barW; i++) {
    if (i < filled) {
      bPut(buf, x + i, y, BOX.full, color, A.bgCard);
    } else {
      bPut(buf, x + i, y, BOX.light, A.smoke, A.bgCard);
    }
  }
}

// ── Paint People Card ────────────────────────────────────────────
function paintPeopleCard(buf, cx, cy, card, idx) {
  const w = CARD_W, h = CARD_H, inner = w - 2;
  const style = factionStyle(card.faction);
  const accent = style.accent || style.fg;
  const cardBg = A.bgCard;
  const border = A.slate;

  // Background fill
  bFill(buf, cx, cy, w, h, ' ', '', cardBg);

  // Top border — rounded corners, faction-colored line
  bPut(buf, cx, cy, BOX.ctl, accent, cardBg);
  for (let i = 1; i < w - 1; i++) bPut(buf, cx + i, cy, BOX.sh, accent, cardBg);
  bPut(buf, cx + w - 1, cy, BOX.ctr, accent, cardBg);

  // Bottom border
  bPut(buf, cx, cy + h - 1, BOX.cbl, border, cardBg);
  for (let i = 1; i < w - 1; i++) bPut(buf, cx + i, cy + h - 1, BOX.sh, border, cardBg);
  bPut(buf, cx + w - 1, cy + h - 1, BOX.cbr, border, cardBg);

  // Side borders
  for (let r = 1; r < h - 1; r++) {
    bPut(buf, cx, cy + r, BOX.sv, border, cardBg);
    bPut(buf, cx + w - 1, cy + r, BOX.sv, border, cardBg);
  }

  // Row 1: Index + Name
  const name = (card.name || '???').substring(0, inner - 4);
  bStr(buf, cx + 1, cy + 1, ` ${idx}`, A.gold, cardBg);
  bPut(buf, cx + 3, cy + 1, '\u00b7', A.smoke, cardBg);
  bStr(buf, cx + 4, cy + 1, name.toUpperCase().padEnd(inner - 4), accent + A.bold, cardBg);

  // Row 2: Role
  const role = (card.role || '').substring(0, inner - 3);
  bStr(buf, cx + 1, cy + 2, `  ${role.padEnd(inner - 3)}`, A.chalk, cardBg);

  // Row 3: Faction
  const faction = (card.faction || '').substring(0, inner - 3);
  bStr(buf, cx + 1, cy + 3, `  ${faction.padEnd(inner - 3)}`, style.fg, cardBg);

  // Row 4: Block/Location
  const block = (card.block || '').substring(0, inner - 3);
  bStr(buf, cx + 1, cy + 4, `  ${block.padEnd(inner - 3)}`, A.chalk, cardBg);

  // Row 5: Loyalty label
  const loy = card.loyalty != null ? card.loyalty : '?';
  const loyStr = `  Loy: ${loy}`;
  bStr(buf, cx + 1, cy + 5, loyStr.padEnd(inner), A.chalk, cardBg);

  // Row 6: Loyalty bar
  const loyVal = typeof loy === 'number' ? loy : 5;
  bStr(buf, cx + 1, cy + 6, '  ', '', cardBg);
  loyaltyBarCells(buf, cx + 3, cy + 6, loyVal, 10, 10);
  bStr(buf, cx + 13, cy + 6, ' ', '', cardBg);

  // Drop shadow (right edge + bottom)
  for (let r = 1; r < h; r++) bPut(buf, cx + w, cy + r, BOX.light, A.shadow, A.bgDark);
  for (let c = 1; c <= w; c++) bPut(buf, cx + c, cy + h, BOX.light, A.shadow, A.bgDark);
}

// ── Paint Move Card ──────────────────────────────────────────────
function paintMoveCard(buf, cx, cy, card, idx) {
  const w = CARD_W, h = CARD_H, inner = w - 2;
  const cardBg = A.bgCard;
  const border = A.slate;
  const accent = A.red;

  // Background fill
  bFill(buf, cx, cy, w, h, ' ', '', cardBg);

  // Top border — red accent
  bPut(buf, cx, cy, BOX.ctl, accent, cardBg);
  for (let i = 1; i < w - 1; i++) bPut(buf, cx + i, cy, BOX.sh, accent, cardBg);
  bPut(buf, cx + w - 1, cy, BOX.ctr, accent, cardBg);

  // Bottom border
  bPut(buf, cx, cy + h - 1, BOX.cbl, border, cardBg);
  for (let i = 1; i < w - 1; i++) bPut(buf, cx + i, cy + h - 1, BOX.sh, border, cardBg);
  bPut(buf, cx + w - 1, cy + h - 1, BOX.cbr, border, cardBg);

  // Side borders
  for (let r = 1; r < h - 1; r++) {
    bPut(buf, cx, cy + r, BOX.sv, border, cardBg);
    bPut(buf, cx + w - 1, cy + r, BOX.sv, border, cardBg);
  }

  // Row 1: Index + Sword + Name
  const name = (card.name || '???').substring(0, inner - 6);
  bStr(buf, cx + 1, cy + 1, ` ${idx}`, A.gold, cardBg);
  bPut(buf, cx + 3, cy + 1, '\u00b7', A.smoke, cardBg);
  bStr(buf, cx + 4, cy + 1, '\u2694 ', accent, cardBg);
  bStr(buf, cx + 6, cy + 1, name.toUpperCase().padEnd(inner - 6), accent + A.bold, cardBg);

  // Rows 2-5: Description word-wrapped
  const desc = card.description || '';
  const descLines = wordWrap(desc, inner - 3);
  for (let i = 0; i < 4; i++) {
    const text = (descLines[i] || '').padEnd(inner - 3);
    bStr(buf, cx + 1, cy + 2 + i, `  ${text}`, A.chalk, cardBg);
  }

  // Row 6: Texture bar
  bStr(buf, cx + 1, cy + 6, '  ', '', cardBg);
  for (let i = 0; i < 5; i++) bPut(buf, cx + 3 + i, cy + 6, BOX.medium, A.crimson, cardBg);
  bStr(buf, cx + 8, cy + 6, '      ', '', cardBg);

  // Drop shadow
  for (let r = 1; r < h; r++) bPut(buf, cx + w, cy + r, BOX.light, A.shadow, A.bgDark);
  for (let c = 1; c <= w; c++) bPut(buf, cx + c, cy + h, BOX.light, A.shadow, A.bgDark);
}

// ── Paint Status Card ────────────────────────────────────────────
function paintStatusCard(buf, cx, cy, card, idx) {
  const w = CARD_W, h = CARD_H, inner = w - 2;
  const cardBg = A.bgCard;
  const border = A.slate;
  const accent = A.orange;

  bFill(buf, cx, cy, w, h, ' ', '', cardBg);

  // Top border — orange accent
  bPut(buf, cx, cy, BOX.ctl, accent, cardBg);
  for (let i = 1; i < w - 1; i++) bPut(buf, cx + i, cy, BOX.sh, accent, cardBg);
  bPut(buf, cx + w - 1, cy, BOX.ctr, accent, cardBg);

  // Bottom border
  bPut(buf, cx, cy + h - 1, BOX.cbl, border, cardBg);
  for (let i = 1; i < w - 1; i++) bPut(buf, cx + i, cy + h - 1, BOX.sh, border, cardBg);
  bPut(buf, cx + w - 1, cy + h - 1, BOX.cbr, border, cardBg);

  // Side borders
  for (let r = 1; r < h - 1; r++) {
    bPut(buf, cx, cy + r, BOX.sv, border, cardBg);
    bPut(buf, cx + w - 1, cy + r, BOX.sv, border, cardBg);
  }

  // Row 1: Index + Warning + Name
  const name = (card.name || '???').substring(0, inner - 6);
  bStr(buf, cx + 1, cy + 1, ` ${idx}`, A.gold, cardBg);
  bPut(buf, cx + 3, cy + 1, '\u00b7', A.smoke, cardBg);
  bStr(buf, cx + 4, cy + 1, '\u26a0 ', accent, cardBg);
  bStr(buf, cx + 6, cy + 1, name.toUpperCase().padEnd(inner - 6), accent + A.bold, cardBg);

  // Rows 2-5: Description
  const desc = card.description || '';
  const descLines = wordWrap(desc, inner - 3);
  for (let i = 0; i < 4; i++) {
    const text = (descLines[i] || '').padEnd(inner - 3);
    bStr(buf, cx + 1, cy + 2 + i, `  ${text}`, A.chalk, cardBg);
  }

  // Row 6: Texture bar
  bStr(buf, cx + 1, cy + 6, '  ', '', cardBg);
  for (let i = 0; i < 5; i++) bPut(buf, cx + 3 + i, cy + 6, BOX.light, A.rust, cardBg);

  // Drop shadow
  for (let r = 1; r < h; r++) bPut(buf, cx + w, cy + r, BOX.light, A.shadow, A.bgDark);
  for (let c = 1; c <= w; c++) bPut(buf, cx + c, cy + h, BOX.light, A.shadow, A.bgDark);
}

// ══════════════════════════════════════════════════════════════════
//  FANNED HAND LAYOUT
//
//  Cards are positioned in a horizontal fan with:
//  - Overlap: each card covers ~7 columns of the previous card
//  - Arc: parabolic curve — center cards raised, edge cards lowered
//  - Z-order: left-painted first, right cards "on top"
//  - Drop shadows: subtle ░ on right edge + bottom of each card
//
//  Visual example (3 cards, shown schematically):
//
//              ╭──────────────╮
//    ╭────────╮│              │
//    │  1     ││  3  ⚔ TAX   │
//    │  DARIU ╭──────────────╮│
//    │  Broke ││  2  MARCUS  ││
//    │  Gover ││  Enforcer   ││
//    │  █████ ││  Governors  ││
//    ╰────────╯│  ████░░░░░░ ││
//     ░░░░░░░░ ╰──────────────╯
//               ░░░░░░░░░░░░░░░
// ══════════════════════════════════════════════════════════════════

function renderFannedHand(cards, innerWidth) {
  const n = cards.length;
  if (n === 0) return [];

  const cW = CARD_W;
  const cH = CARD_H;

  // Determine minimal overlap to ensure text remains fully visible
  // We want the maximum possible step between cards, constrained by innerWidth.
  let overlap;
  if (n <= 1) {
    overlap = 0;
  } else {
    const maxFanW = innerWidth - 2; // use most of available width
    const maxStep = Math.floor((maxFanW - cW - 1) / (n - 1));
    const requiredOverlap = cW - maxStep;
    
    // We want at least 1 column of overlap so they visually connect (hide right border)
    overlap = Math.max(1, requiredOverlap);
    // Don't overlap so much that the card becomes unreadable
    overlap = Math.min(overlap, cW - 6); 
  }

  const step = cW - overlap;
  const fanWidth = (n - 1) * step + cW + 1; // +1 for shadow
  const startX = Math.floor((innerWidth - fanWidth) / 2);

  // Arc offsets — parabolic: center cards at y=0, edge cards pushed down
  const center = (n - 1) / 2;
  const arcOffsets = [];
  let maxArc = 0;
  for (let i = 0; i < n; i++) {
    const dist = center > 0 ? Math.abs(i - center) / center : 0;
    const arc = Math.round(dist * dist * 2); // 0, 1, or 2
    arcOffsets.push(arc);
    if (arc > maxArc) maxArc = arc;
  }

  const bufH = cH + maxArc + 1; // +1 for shadow row
  const buf = createBuf(innerWidth, bufH);

  // Paint cards left-to-right (later cards paint over earlier = on top)
  for (let i = 0; i < n; i++) {
    const cx = startX + i * step;
    const cy = arcOffsets[i];
    const card = cards[i];

    if (card.type === 'move') {
      paintMoveCard(buf, cx, cy, card, i + 1);
    } else if (card.type === 'status') {
      paintStatusCard(buf, cx, cy, card, i + 1);
    } else {
      paintPeopleCard(buf, cx, cy, card, i + 1);
    }
  }

  return bufToLines(buf, A.bgDark);
}

// ══════════════════════════════════════════════════════════════════
//  TERRITORY TILES (kept from v2, slightly refined)
// ══════════════════════════════════════════════════════════════════

function renderTerritoryTile(territory, tileW = 24) {
  const inner = tileW - 2;
  const name = truncate(territory.name || 'Unknown', inner);
  const ctrl = (territory.control || '').toLowerCase();

  let controlIcon, controlText, controlColor;
  if (ctrl === 'you' || ctrl === 'player') {
    controlIcon = '\u25cf'; controlText = 'YOU'; controlColor = A.green;
  } else if (ctrl === 'contested') {
    controlIcon = '\u25d0'; controlText = 'CONTESTED'; controlColor = A.amber;
  } else if (ctrl === 'neutral') {
    controlIcon = '\u25c7'; controlText = 'NEUTRAL'; controlColor = A.teal;
  } else {
    controlIcon = '\u25cb'; controlText = territory.control || 'RIVAL'; controlColor = A.red;
  }

  const faction = territory.faction ? ` ${BOX.medium} ${territory.faction}` : '';
  const intersection = territory.intersection || '';
  const headerBg = ctrl === 'you' ? A.bgGreen : ctrl === 'contested' ? A.bgGold : ctrl === 'neutral' ? A.bgSlate : A.bgRed;
  const textureLine = `${headerBg}${BOX.light}${A.bold}${A.white}${pad(name.toUpperCase(), inner - 2)}${BOX.light}${A.reset}`;

  const lines = [
    textureLine,
    ` ${controlColor}${controlIcon} ${pad(controlText + faction, inner - 3)}${A.reset}`,
    ` ${A.smoke}${pad(truncate(intersection, inner - 2), inner - 1)}${A.reset}`,
  ];

  return singleBox(lines, tileW);
}

// ══════════════════════════════════════════════════════════════════
//  FULL BOARD RENDER
// ══════════════════════════════════════════════════════════════════

export function renderBoard(state) {
  const iW = W - 2;
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

  let clockColor;
  if (clockRatio > 0.75) clockColor = '\x1b[38;2;220;50;47m';
  else if (clockRatio > 0.5) clockColor = '\x1b[38;2;230;126;34m';
  else if (clockRatio > 0.25) clockColor = '\x1b[38;2;255;200;40m';
  else clockColor = '\x1b[38;2;46;204;113m';

  const clockBarW = 12;
  const clockFilled = Math.round(clockRatio * clockBarW);
  const clockEmpty = clockBarW - clockFilled;
  const clockBar = `${clockColor}${BOX.full.repeat(clockFilled)}${A.smoke}${BOX.light.repeat(clockEmpty)}${A.reset}`;

  const headerLeft = `  ${A.red}${A.bold}BL0CKS${A.reset} ${A.smoke}\u2502${A.reset} ${A.white}Lv.${levelNum} ${A.chalk}${levelName}${A.reset}`;
  const headerRight = `${clockColor}\u23f1 ${clockCurrent}/${clockTotal}${A.reset} ${A.smoke}${clockStatus}${A.reset}  `;
  const headerGap = iW - visLen(headerLeft) - visLen(headerRight);
  out.push(doubleRow(headerLeft + ' '.repeat(Math.max(1, headerGap)) + headerRight, iW));
  out.push(doubleRow(`  ${A.smoke}TIME${A.reset} ${clockBar}`, iW));
  out.push(doubleMid(iW));

  // ── Territory Map ──
  out.push(doubleRow(`  ${A.bold}${A.chalk}\u2b21 TERRITORY MAP${A.reset}`, iW));
  out.push(doubleRow('', iW));

  const territories = state.territories || [];
  const tileW = 24;
  const tilesPerRow = 3;
  for (let rowStart = 0; rowStart < territories.length; rowStart += tilesPerRow) {
    const rowTs = territories.slice(rowStart, rowStart + tilesPerRow);
    const boxes = rowTs.map(t => renderTerritoryTile(t, tileW));
    const tileH = boxes[0]?.length || 0;
    for (let line = 0; line < tileH; line++) {
      let rowStr = '  ';
      for (let t = 0; t < boxes.length; t++) {
        rowStr += (boxes[t][line] || pad('', tileW)) + ' ';
      }
      out.push(doubleRow(rowStr, iW));
    }
    if (rowStart + tilesPerRow < territories.length) out.push(doubleRow('', iW));
  }
  out.push(doubleRow('', iW));
  out.push(doubleMid(iW));

  // ── Event ──
  if (state.event) {
    const evtName = (state.event.name || 'UNKNOWN').toUpperCase();
    out.push(doubleRow(`  ${A.ember}${A.bold}\u26a1 EVENT: ${evtName}${A.reset}`, iW));
    const desc = state.event.description || '';
    const descLines = wordWrap(desc, iW - 6);
    for (const dl of descLines) {
      out.push(doubleRow(`  ${A.chalk}${BOX.sv} ${dl}${A.reset}`, iW));
    }
    out.push(doubleMid(iW));
  }

  // ── Scanner ──
  if (state.scanner) {
    const isIntent = state.scanner.includes('[INTENT');
    const icon = isIntent ? '\u26a0' : '\ud83d\udcfb';
    const color = isIntent ? A.orange : A.crimson;
    out.push(doubleRow(`  ${color}${A.bold}${icon} SCANNER${A.reset}`, iW));
    const scanLines = wordWrap(`"${state.scanner}"`, iW - 8);
    for (let i = 0; i < scanLines.length; i++) {
      const pfx = i === 0 ? `${A.smoke}${BOX.medium} ` : '    ';
      out.push(doubleRow(`  ${pfx}${A.italic}${A.chalk}${scanLines[i]}${A.reset}`, iW));
    }
    out.push(doubleMid(iW));
  }

  // ── Fanned Hand ──
  const intelCount = state.intel ?? '?';
  const intelColor = intelCount === 0 ? A.red : A.gold;
  const handTitle = `  ${A.bold}${A.chalk}\ud83c\udccf YOUR HAND${A.reset}`;
  const intelStr = `${intelColor}${A.bold}\u29be${A.reset} ${intelColor}Intel: ${intelCount}${A.reset}  `;
  const handGap = iW - visLen(handTitle) - visLen(intelStr);
  out.push(doubleRow(handTitle + ' '.repeat(Math.max(1, handGap)) + intelStr, iW));

  const hand = state.hand || [];
  const fanLines = renderFannedHand(hand, iW);
  for (const fl of fanLines) {
    out.push(doubleRow(fl, iW));
  }

  out.push(innerDivider(iW));

  // ── Choice / Prompt ──
  if (state.choice) {
    if (state.choice.description) {
      out.push(doubleRow('', iW));
      const choiceDesc = wordWrap(state.choice.description, iW - 6);
      for (const cl of choiceDesc) {
        out.push(doubleRow(`  ${A.white}${cl}${A.reset}`, iW));
      }
      out.push(doubleRow('', iW));
    }
    if (state.choice.optionA) {
      out.push(doubleRow(`  ${A.blue}${A.bold}\u25c4 [A]${A.reset} ${A.chalk}${state.choice.optionA}${A.reset}`, iW));
    }
    if (state.choice.optionB) {
      out.push(doubleRow(`  ${A.red}${A.bold}\u25ba [B]${A.reset} ${A.chalk}${state.choice.optionB}${A.reset}`, iW));
    }
    if (state.choice.optionBurn) {
      out.push(doubleRow(`  ${A.orange}${A.bold}\ud83d\uddd1 [BURN]${A.reset} ${A.smoke}${state.choice.optionBurn}${A.reset}`, iW));
    }
    out.push(doubleRow('', iW));
    out.push(doubleRow(`  ${A.gold}${A.bold}\u25b8 Your call? (A, B, or BURN)${A.reset}`, iW));
  } else {
    out.push(doubleRow('', iW));
    const prompt = `  ${A.gold}${A.bold}\u25b8${A.reset} ${A.chalk}Play a card ${A.gold}(1-${hand.length || 5})${A.reset}${A.chalk}, or ${A.gold}INTEL [Name]${A.reset}`;
    out.push(doubleRow(prompt, iW));
  }

  out.push(doubleBot(iW));
  out.push('');
  return out.join('\n');
}

// ══════════════════════════════════════════════════════════════════
//  NARRATIVE, WIN/LOSS, SPLASH, PROVIDER SELECT, HELP
// ══════════════════════════════════════════════════════════════════

export function renderNarrative(text) {
  const iW = W - 2;
  const out = [];
  out.push(innerDivider(iW));
  const lines = wordWrap(text, iW - 6);
  for (const line of lines) {
    out.push(doubleRow(`  ${A.chalk}${line}${A.reset}`, iW));
  }
  out.push(doubleBot(iW));
  return out.join('\n');
}

export function renderWin(message) {
  const iW = W - 2;
  const out = [];
  out.push('');
  out.push(doubleTop(iW));
  out.push(doubleRow('', iW));

  const glow = `${A.green}${A.bold}`;
  const glowLine = `${BOX.light}${BOX.medium}${BOX.dense} \u2605  V I C T O R Y  \u2605 ${BOX.dense}${BOX.medium}${BOX.light}`;
  out.push(doubleRow(padCenter(`${glow}${glowLine}${A.reset}`, iW), iW));
  out.push(doubleRow('', iW));
  out.push(doubleRow(padCenter(`${A.gold}        \u265b${A.reset}`, iW), iW));
  out.push(doubleRow(padCenter(`${A.gold}${A.bold}   \u2584${BOX.full.repeat(9)}\u2584${A.reset}`, iW), iW));
  out.push(doubleRow('', iW));

  const lines = wordWrap(message || 'You held the block. The corner is yours.', iW - 10);
  for (const l of lines) {
    out.push(doubleRow(padCenter(`${A.chalk}${l}${A.reset}`, iW), iW));
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

  const lossGlow = `${A.red}${A.bold}`;
  const lossLine = `${BOX.dense}${BOX.medium}${BOX.light} \u2716  D E F E A T  \u2716 ${BOX.light}${BOX.medium}${BOX.dense}`;
  out.push(doubleRow(padCenter(`${lossGlow}${lossLine}${A.reset}`, iW), iW));
  out.push(doubleRow('', iW));
  out.push(doubleRow(padCenter(`${A.crimson}${A.dim}${BOX.dense}${BOX.medium}${BOX.light}  ${BOX.light}${BOX.medium}${BOX.dense}${A.reset}`, iW), iW));
  out.push(doubleRow('', iW));

  const lines = wordWrap(message || 'The block moved without you.', iW - 10);
  for (const l of lines) {
    out.push(doubleRow(padCenter(`${A.chalk}${l}${A.reset}`, iW), iW));
  }
  out.push(doubleRow('', iW));
  out.push(doubleBot(iW));
  return out.join('\n');
}

export function renderLoading() {
  return `  ${A.smoke}${BOX.medium} The block is thinking...${A.reset}`;
}

export function renderSplash(frame = 0) {
  const iW = W - 2;
  const out = [];

  out.push('');
  out.push(doubleTop(iW));
  out.push(doubleRow('', iW));

  // ── Variable Typographic ASCII Effect ──
  // A solid block representation of BL0CKS
  const mask = [
    '██████╗ ██╗      ██████╗  ██████╗██╗  ██╗███████╗',
    '██╔══██╗██║     ██╔═══██╗██╔════╝██║ ██╔╝██╔════╝',
    '██████╔╝██║     ██║   ██║██║     █████╔╝ ███████╗',
    '██╔══██╗██║     ██║   ██║██║     ██╔═██╗ ╚════██║',
    '██████╔╝███████╗╚██████╔╝╚██████╗██║  ██╗███████║',
    '╚═════╝ ╚══════╝ ╚═════╝  ╚═════╝╚═╝  ╚═╝╚══════╝'
  ];

  const palette = " .:-=+*#%@";
  const logoColors = [A.red, A.red, A.crimson, A.crimson, A.rust, A.rust];

  for (let y = 0; y < mask.length; y++) {
    let lineStr = "";
    for (let x = 0; x < mask[y].length; x++) {
      const ch = mask[y][x];
      // If the character is not empty space, map it to the variable typography palette
      if (ch !== ' ') {
        // Create an organic wave/noise field
        const t = frame * 0.15;
        const nx = x * 0.15;
        const ny = y * 0.3;
        const noise = (Math.sin(nx + t) + Math.cos(ny - t) + Math.sin(nx * 0.5 - ny * 0.5 + t * 1.5)) / 3;
        
        // Map noise [-1, 1] to palette index
        const pIdx = Math.floor(((noise + 1) / 2) * (palette.length - 1));
        const safeIdx = Math.max(0, Math.min(palette.length - 1, pIdx));
        lineStr += palette[safeIdx];
      } else {
        lineStr += " ";
      }
    }
    
    // Some minor shadow effect padding
    const color = logoColors[y];
    const styledLine = `${color}${A.bold}${lineStr}${A.reset}`;
    out.push(doubleRow(padCenter(styledLine, iW), iW));
  }

  out.push(doubleRow('', iW));

  const tagDiv = `${A.smoke}${BOX.light}${BOX.medium}${BOX.dense}${BOX.dense}${BOX.dense}${BOX.medium}${BOX.light}`;
  out.push(doubleRow(padCenter(`${tagDiv} ${A.gold}${A.italic}Territory. Trust. Time.${A.reset} ${tagDiv}`, iW), iW));
  out.push(doubleRow('', iW));
  out.push(doubleRow(padCenter(`${A.chalk}The first AI-powered strategy card game${A.reset}`, iW), iW));
  out.push(doubleRow(padCenter(`${A.smoke}where every decision costs you something.${A.reset}`, iW), iW));
  out.push(doubleRow('', iW));

  // Street atmosphere
  const skyline = `${A.smoke}${BOX.light} ${BOX.light}  ${BOX.light}  ${A.slate}\u25c6${A.smoke}  ${BOX.light}  ${BOX.light} ${BOX.light}`;
  out.push(doubleRow(padCenter(skyline, iW), iW));

  out.push(doubleRow('', iW));
  out.push(doubleMid(iW));
  out.push(doubleRow(padCenter(`${A.smoke}South Side, Chicago  ${A.slate}\u00b7${A.smoke}  Season 1${A.reset}`, iW), iW));
  out.push(doubleBot(iW));
  out.push('');

  return out.join('\n');
}

// ── Provider Selection Screen ────────────────────────────────────
export function renderProviderSelect(providers, savedProvider) {
  const iW = W - 2;
  const out = [];
  out.push(doubleTop(iW));
  out.push(doubleRow(`  ${A.bold}${A.white}Choose Your Engine${A.reset}`, iW));
  out.push(doubleRow(`  ${A.smoke}Bring your own LLM \u2014 your key never leaves your machine.${A.reset}`, iW));
  out.push(doubleRow('', iW));
  out.push(innerDivider(iW));
  out.push(doubleRow('', iW));

  for (let i = 0; i < providers.length; i++) {
    const p = providers[i];
    const saved = savedProvider === p.id ? ` ${A.green}${A.bold}\u2713${A.reset} ${A.green}saved${A.reset}` : '';
    const bullet = `${A.gold}${A.bold}[${i + 1}]${A.reset}`;
    const providerName = `${p.color}${A.bold}${p.name}${A.reset}`;
    const tier = `${A.smoke}${BOX.sv} ${p.tier}${A.reset}`;
    out.push(doubleRow(`  ${bullet} ${providerName} ${tier}${saved}`, iW));
    out.push(doubleRow('', iW));
  }

  out.push(doubleBot(iW));
  return out.join('\n');
}

// ── Help Screen ──────────────────────────────────────────────────
export function renderHelp() {
  const iW = W - 2;
  const out = [];
  out.push('');
  out.push(doubleTop(iW));
  out.push(doubleRow(`  ${A.bold}${A.white}BL0CKS \u2014 Command Reference${A.reset}`, iW));
  out.push(doubleMid(iW));

  const cmds = [
    [`${A.gold}1-5${A.reset}`,          'Play a card from your hand'],
    [`${A.gold}A${A.reset} or ${A.gold}B${A.reset}`, 'Make a choice when prompted'],
    [`${A.gold}INTEL [Name]${A.reset}`, 'Reveal hidden character stats'],
    [`${A.gold}help${A.reset}`,         'Show this screen'],
    [`${A.gold}quit${A.reset}`,         'Exit the game'],
  ];
  for (const [cmd, desc] of cmds) {
    out.push(doubleRow(`  ${pad(cmd, 18)} ${A.chalk}${desc}${A.reset}`, iW));
  }
  out.push(doubleRow('', iW));
  out.push(innerDivider(iW));
  out.push(doubleRow(`  ${A.smoke}${A.italic}The AI is the game engine. You can also type naturally \u2014${A.reset}`, iW));
  out.push(doubleRow(`  ${A.smoke}${A.italic}it understands strategy, threats, and negotiations.${A.reset}`, iW));
  out.push(doubleBot(iW));
  out.push('');
  return out.join('\n');
}

// Re-export
export { A, factionColor };
