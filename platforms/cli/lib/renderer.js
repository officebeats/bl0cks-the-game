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

// ── Dynamic Terminal Width ───────────────────────────────────────
function getW() {
  const cols = process.stdout.columns || 80;
  return Math.max(50, Math.min(cols, 120));
}

// Legacy compat — some functions receive W as parameter
const W = 80; // fallback only, prefer getW()

// ── Hex Color Utilities ─────────────────────────────────────────
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

function hexToAnsi(hex) {
  const [r, g, b] = hexToRgb(hex);
  return `\x1b[38;2;${r};${g};${b}m`;
}

function hexToBgAnsi(hex) {
  const [r, g, b] = hexToRgb(hex);
  return `\x1b[48;2;${r};${g};${b}m`;
}

// Darken a hex color for background use (30% brightness)
function hexToBgDark(hex) {
  const [r, g, b] = hexToRgb(hex);
  return `\x1b[48;2;${Math.round(r * 0.3)};${Math.round(g * 0.3)};${Math.round(b * 0.3)}m`;
}

// ── ANSI True-Color Palette ──────────────────────────────────────
// Mutable so ROM themes can override via applyTheme()
let A = {
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
// Mutable — ROM themes can override via applyTheme()
let FACTION_STYLE = {
  'governors':  { fg: A.blue,   bg: A.bgBlue,   shade: A.navy,   accent: '\x1b[38;2;80;140;220m' },
  'lords':      { fg: A.gold,   bg: A.bgGold,   shade: A.amber,  accent: '\x1b[38;2;255;210;60m' },
  'stones':     { fg: A.red,    bg: A.bgRed,    shade: A.crimson, accent: '\x1b[38;2;240;70;60m'  },
  'cpd':        { fg: A.slate,  bg: A.bgSlate,  shade: A.gray,    accent: A.gray  },
  'law':        { fg: A.slate,  bg: A.bgSlate,  shade: A.gray,    accent: A.gray  },
  'commission': { fg: A.purple, bg: A.bgSlate,  shade: A.purple,  accent: A.purple },
  'neutral':    { fg: A.teal,   bg: A.bgSlate,  shade: A.teal,    accent: A.teal  },
  'you':        { fg: A.green,  bg: A.bgGreen,  shade: A.emerald, accent: A.green },
  'default':    { fg: A.chalk,  bg: A.bgSlate,  shade: A.smoke,   accent: A.chalk },
};

/**
 * Apply a ROM theme to override the default palette and faction colors.
 * Reads the theme.json format (supports both Chicago and template schemas).
 *
 * @param {object} themeJson - Parsed theme.json from ROM
 */
export function applyTheme(themeJson) {
  if (!themeJson) return;

  // Schema 1: template format (palette + factions + ui)
  if (themeJson.palette) {
    if (themeJson.palette.primary)   A.blue   = hexToAnsi(themeJson.palette.primary);
    if (themeJson.palette.secondary) A.navy   = hexToAnsi(themeJson.palette.secondary);
    if (themeJson.palette.accent)    A.red    = hexToAnsi(themeJson.palette.accent);
    if (themeJson.palette.surface)   A.bgSurface = hexToBgAnsi(themeJson.palette.surface);
    if (themeJson.palette.text)      A.chalk  = hexToAnsi(themeJson.palette.text);
    if (themeJson.palette.muted)     A.smoke  = hexToAnsi(themeJson.palette.muted);
  }

  // Schema 2: Chicago format (colors + factions)
  if (themeJson.colors) {
    if (themeJson.colors.bg_base)     A.bgBlack   = hexToBgAnsi(themeJson.colors.bg_base);
    if (themeJson.colors.bg_surface)  A.bgSurface  = hexToBgAnsi(themeJson.colors.bg_surface);
    if (themeJson.colors.bg_elevated) A.bgCard     = hexToBgAnsi(themeJson.colors.bg_elevated);
    if (themeJson.colors.accent_red)  A.red        = hexToAnsi(themeJson.colors.accent_red);
    if (themeJson.colors.accent_gold) A.gold       = hexToAnsi(themeJson.colors.accent_gold);
    if (themeJson.colors.accent_blue) A.blue       = hexToAnsi(themeJson.colors.accent_blue);
    if (themeJson.colors.text_primary)   A.chalk    = hexToAnsi(themeJson.colors.text_primary);
    if (themeJson.colors.text_secondary) A.gray     = hexToAnsi(themeJson.colors.text_secondary);
    if (themeJson.colors.border)      A.slate      = hexToAnsi(themeJson.colors.border);
    if (themeJson.colors.success)     A.green      = hexToAnsi(themeJson.colors.success);
    if (themeJson.colors.error)       A.red        = hexToAnsi(themeJson.colors.error);
    if (themeJson.colors.warning)     A.orange     = hexToAnsi(themeJson.colors.warning);
  }

  // UI-specific overrides
  if (themeJson.ui) {
    if (themeJson.ui.card_bg)     A.bgCard   = hexToBgAnsi(themeJson.ui.card_bg);
    if (themeJson.ui.card_shadow) A.bgShadow = hexToBgAnsi(themeJson.ui.card_shadow);
  }

  // Faction color overrides — works for both schemas
  const factionMap = themeJson.factions || {};
  for (const [factionId, hex] of Object.entries(factionMap)) {
    const key = factionId.toLowerCase().replace(/^the\s+/, '');
    if (key === 'you' || key === 'contested') continue; // system factions, skip
    
    const fg = hexToAnsi(hex);
    const bg = hexToBgDark(hex);
    FACTION_STYLE[key] = { fg, bg, accent: fg };
  }
}

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

function getCardW() {
  const w = getW();
  if (w < 60) return 13;
  if (w < 75) return 14;
  return 16;
}
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
  const w = getCardW(), h = CARD_H, inner = w - 2;
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

  // Row 1: Index + Icon + Name
  const name = (card.name || '???').substring(0, inner - 5);
  bStr(buf, cx + 1, cy + 1, ` ${idx}`, A.gold, cardBg);
  bPut(buf, cx + 3, cy + 1, '\u00b7', A.smoke, cardBg);
  bStr(buf, cx + 4, cy + 1, '\ud83d\udc64', accent, cardBg); // 👤
  bStr(buf, cx + 6, cy + 1, name.toUpperCase().padEnd(inner - 5), accent + A.bold, cardBg);

  // Row 2: Textured Header / Role
  const role = (card.role || '').substring(0, inner - 6);
  bStr(buf, cx + 1, cy + 2, ' ', '', cardBg);
  for (let i = 0; i < 4; i++) bPut(buf, cx + 2 + i, cy + 2, BOX.light, style.shade, cardBg);
  bStr(buf, cx + 7, cy + 2, role.padEnd(inner - 6), A.chalk, cardBg);

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
  const w = getCardW(), h = CARD_H, inner = w - 2;
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

  // Rows 2-5: Description word-wrapped with texture header
  const desc = card.description || '';
  const descLines = wordWrap(desc, inner - 3);
  
  // Textured Header in Row 2
  bStr(buf, cx + 1, cy + 2, ' ', '', cardBg);
  for (let i = 0; i < 4; i++) bPut(buf, cx + 2 + i, cy + 2, BOX.light, A.crimson, cardBg);
  bStr(buf, cx + 6, cy + 2, (descLines[0] || '').padEnd(inner - 5), A.chalk, cardBg);

  for (let i = 1; i < 4; i++) {
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

// ── Paint Status Card (Dead Draws — visually dangerous) ─────────
function paintStatusCard(buf, cx, cy, card, idx) {
  const w = getCardW(), h = CARD_H, inner = w - 2;
  const cardBg = A.bgRed;      // Red tint — these are BAD cards
  const border = A.crimson;
  const accent = A.red;

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

  // Row 1: Index + Icon + Name
  const name = (card.name || '???').substring(0, inner - 6);
  bStr(buf, cx + 1, cy + 1, ` ${idx}`, A.gold, cardBg);
  bPut(buf, cx + 3, cy + 1, '\u00b7', A.smoke, cardBg);
  bStr(buf, cx + 4, cy + 1, '\ud83d\udea8', accent, cardBg); // 🚨
  bStr(buf, cx + 6, cy + 1, name.toUpperCase().padEnd(inner - 6), accent + A.bold, cardBg);

  // Row 2: DEAD DRAW label with textured background
  bStr(buf, cx + 1, cy + 2, ' ', '', cardBg);
  for (let i = 0; i < 4; i++) bPut(buf, cx + 2 + i, cy + 2, BOX.light, border, cardBg);
  bStr(buf, cx + 7, cy + 2, 'DEAD DRAW'.padEnd(inner - 6), A.crimson + A.dim, cardBg);

  // Rows 3-5: Description (dimmed)
  const desc = card.description || 'Cannot be played. Burn to remove.';
  const descLines = wordWrap(desc, inner - 3);
  for (let i = 0; i < 3; i++) {
    const text = (descLines[i] || '').padEnd(inner - 3);
    bStr(buf, cx + 1, cy + 3 + i, `  ${text}`, A.smoke, cardBg);
  }

  // Row 6: Burn instruction
  const burnHint = 'BURN →'.padEnd(inner - 3);
  bStr(buf, cx + 1, cy + 6, `  ${burnHint}`, A.rust + A.dim, cardBg);

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

  const cW = getCardW();
  const cH = CARD_H;

  // For very narrow terminals, use compact list instead of fan
  if (innerWidth < 45 || n > 6) {
    return renderCompactHand(cards, innerWidth);
  }

  // Determine minimal overlap to ensure text remains fully visible
  let overlap;
  if (n <= 1) {
    overlap = 0;
  } else {
    const maxFanW = innerWidth - 2;
    const maxStep = Math.floor((maxFanW - cW - 1) / (n - 1));
    const requiredOverlap = cW - maxStep;
    overlap = Math.max(1, requiredOverlap);
    overlap = Math.min(overlap, cW - 6);
  }

  const step = cW - overlap;
  const fanWidth = (n - 1) * step + cW + 1;
  const startX = Math.max(0, Math.floor((innerWidth - fanWidth) / 2));

  // Arc offsets — parabolic: center cards raised, edges lowered
  const center = (n - 1) / 2;
  const arcOffsets = [];
  let maxArc = 0;
  for (let i = 0; i < n; i++) {
    const dist = center > 0 ? Math.abs(i - center) / center : 0;
  const arc = Math.round(dist * dist * 2);
    arcOffsets.push(arc);
    if (arc > maxArc) maxArc = arc;
  }

  // Final height check: The fan needs at least 8-10 rows to look "premium"
  const bufH = cH + maxArc + 1;
  const buf = createBuf(innerWidth, bufH);

  for (let i = 0; i < n; i++) {
    const cx = startX + i * step;
    const cy = arcOffsets[i];
    const card = cards[i];
    const isLower = cy > 0;
    const shadowToken = isLower ? BOX.dense : BOX.light;

    if (card.type === 'move') {
      paintMoveCard(buf, cx, cy, card, i + 1);
    } else if (card.type === 'status') {
      paintStatusCard(buf, cx, cy, card, i + 1);
    } else {
      paintPeopleCard(buf, cx, cy, card, i + 1);
    }

    // Apply arc-aware shadow (v3.1)
    for (let r = 1; r < cH; r++) bPut(buf, cx + cW, cy + r, shadowToken, A.shadow, A.bgDark);
    for (let c = 1; c <= cW; c++) bPut(buf, cx + c, cy + cH, shadowToken, A.shadow, A.bgDark);
  }

  return bufToLines(buf, A.bgDark);
}

/**
 * Tactical Mini-Map (v4.5 Visual Combat Update)
 * Renders a 3x2 grid of the South Side's 6 core neighborhoods.
 */
function renderMiniMap(territories = [], iW) {
  const sectors = [
    { id: '1', key: 'WD', name: 'Woodlawn' },
    { id: '2', key: 'EG', name: 'Englewood' },
    { id: '3', key: 'CH', name: 'Chatham' },
    { id: '4', key: 'AG', name: 'Auburn' },
    { id: '5', key: 'RS', name: 'Roseland' },
    { id: '6', key: 'HP', name: 'Hyde Pk' }
  ];

  const getSStatus = (name) => {
    const t = territories.find(tr => tr.name?.toLowerCase().includes(name.toLowerCase()));
    if (!t) return { icon: '.', color: A.smoke };
    if (t.contested) return { icon: '!', color: A.red };
    if (t.owner === 'YOU') return { icon: 'P', color: A.gold };
    if (t.owner?.startsWith('RIVAL')) return { icon: 'R', color: A.purple };
    return { icon: '.', color: A.smoke };
  };

  const lines = [];
  const sW = Math.floor((iW - 8) / 3); // Sector width
  
  // Row 1
  const r1 = sectors.slice(0, 3).map(s => {
    const status = getSStatus(s.name);
    const content = `${A.dim}${s.id}.${A.reset}${A.bold}${status.color}${status.icon}${A.reset} ${A.white}${s.key}${A.reset}`;
    const pad = sW - visLen(content);
    return `[ ${content}${' '.repeat(Math.max(0, pad - 2))} ]`;
  }).join(' ');

  // Row 2
  const r2 = sectors.slice(3, 6).map(s => {
    const status = getSStatus(s.name);
    const content = `${A.dim}${s.id}.${A.reset}${A.bold}${status.color}${status.icon}${A.reset} ${A.white}${s.key}${A.reset}`;
    const pad = sW - visLen(content);
    return `[ ${content}${' '.repeat(Math.max(0, pad - 2))} ]`;
  }).join(' ');

  lines.push(`  ${r1}`);
  lines.push(`  ${r2}`);
  
  return lines;
}

/**
 * Render act map (v4 tactical overview)
 */
export function renderActMap(state, iW) {
  return renderMiniMap(state.territories || [], iW).join('\n');
}

// ── Compact hand for narrow terminals ────────────────────────────
function renderCompactHand(cards, innerWidth) {
  const lines = [];
  for (let i = 0; i < cards.length; i++) {
    const c = cards[i];
    const idx = `${A.gold}${i + 1}${A.reset}`;
    if (c.type === 'people') {
      const style = factionStyle(c.faction);
      const loyStr = c.loyalty != null ? ` Loy:${c.loyalty}` : '';
      const name = truncate(c.name || '???', 14);
      const role = truncate(c.role || '???', 10);
      lines.push(`  ${idx} ${A.bold}${style.fg}${name}${A.reset} ${A.chalk}${role}${A.reset}${A.smoke}${loyStr}${A.reset}`);
    } else if (c.type === 'move') {
      const name = (c.name || '???').toUpperCase();
      const desc = truncate(c.description || '', innerWidth - 16);
      lines.push(`  ${idx} ${A.red}${A.bold}\u2694 ${name}${A.reset} ${A.smoke}${desc}${A.reset}`);
    } else {
      const name = (c.name || '???').toUpperCase();
      lines.push(`  ${idx} ${A.orange}\u26a0 ${name}${A.reset} ${A.smoke}${truncate(c.description || '', innerWidth - 14)}${A.reset}`);
    }
  }
  return lines;
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
//  WHISPER SCREEN — dramatic event/intent reveal before play
// ══════════════════════════════════════════════════════════════════

/**
 * Render a focused dramatic screen showing the event and enemy intent.
 * Displayed before the main board in the paged layout:
 *   Whisper (this) → Play (renderBoard)
 *
 * @param {object} state - Parsed game state
 * @returns {{ text: string, narrativeLines: string[] }} - rendered screen + lines to typewrite
 */
export function renderWhisper(state) {
  const termW = getW();
  const iW = termW - 2;
  const out = [];
  const narrativeLines = [];

  out.push(doubleTop(iW));
  out.push(doubleRow('', iW));

  // Event
  if (state.event) {
    const evtName = (state.event.name || 'UNKNOWN').toUpperCase();
    out.push(doubleRow(padCenter(`${A.ember}${A.bold}⚡ ${evtName}${A.reset}`, iW), iW));
    out.push(doubleRow('', iW));

    const desc = state.event.description || '';
    if (desc) {
      const descLines = wordWrap(`"${desc}"`, iW - 12);
      for (const dl of descLines) {
        out.push(doubleRow(padCenter(`${A.chalk}${A.italic}${dl}${A.reset}`, iW), iW));
        narrativeLines.push(dl);
      }
      out.push(doubleRow('', iW));
    }
  }

  // Scanner / Street Whisper
  if (state.scanner) {
    out.push(doubleRow(padCenter(`${A.smoke}─────────────────────${A.reset}`, iW), iW));
    out.push(doubleRow('', iW));
    const scannerText = state.scanner.replace(/^\"|\"$/g, '');
    const scanLines = wordWrap(scannerText, iW - 12);
    for (const sl of scanLines) {
      out.push(doubleRow(padCenter(`${A.orange}${A.italic}${sl}${A.reset}`, iW), iW));
      narrativeLines.push(sl);
    }
    out.push(doubleRow('', iW));
  }

  // Enemy Intent — the key Slay the Spire mechanic
  if (state.enemy_intent) {
    out.push(doubleRow(padCenter(`${A.smoke}─────────────────────${A.reset}`, iW), iW));
    out.push(doubleRow('', iW));
    out.push(doubleRow(padCenter(`${A.crimson}${A.bold}⚠ INCOMING THREAT${A.reset}`, iW), iW));
    out.push(doubleRow('', iW));
    const intentLines = wordWrap(state.enemy_intent, iW - 12);
    for (const il of intentLines) {
      out.push(doubleRow(padCenter(`${A.crimson}${il}${A.reset}`, iW), iW));
      narrativeLines.push(il);
    }
    out.push(doubleRow('', iW));

    // Intent countdown bar — purely visual urgency
    const barW = Math.min(20, iW - 20);
    const bar = `${'▰'.repeat(barW)}`;
    out.push(doubleRow(padCenter(`${A.crimson}${bar}${A.reset}  ${A.smoke}RESOLVES END OF TURN${A.reset}`, iW), iW));
  }

  out.push(doubleRow('', iW));
  out.push(doubleRow(padCenter(`${A.smoke}Press any key...${A.reset}`, iW), iW));
  out.push(doubleRow('', iW));
  out.push(doubleBot(iW));

  return { text: out.join('\n'), narrativeLines };
}

// ══════════════════════════════════════════════════════════════════
//  FULL BOARD RENDER
// ══════════════════════════════════════════════════════════════════

export function renderBoard(state, options = {}) {
  const iW = options.innerWidth || (process.stdout.columns ? Math.min(100, process.stdout.columns - 4) : 76);
  const rows = process.stdout.rows || 50;
  
  // FIX: Stabilize 'tight' detection for v4.5
  // Tight mode should only trigger if height < 22, giving 80x24 terminals the Premium UI.
  const tight = rows < 24; 
  const compact = iW < 60;

  const out = [];

  // ── Header ──
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

  const clockBarW = compact ? 6 : (tight ? 8 : 12);
  const clockFilled = Math.round(clockRatio * clockBarW);
  const clockEmpty = clockBarW - clockFilled;
  const clockBar = `${clockColor}${BOX.full.repeat(clockFilled)}${A.smoke}${BOX.light.repeat(clockEmpty)}${A.reset}`;

  // Single header line with clock embedded
  const headerLeft = `  ${A.red}${A.bold}BL0CKS${A.reset} ${A.smoke}\u2502${A.reset} ${A.white}Lv.${levelNum} ${A.chalk}${truncate(levelName, compact ? iW - 20 : 20)}${A.reset}`;
  const headerRight = `${clockBar} ${clockColor}${clockCurrent}/${clockTotal}${A.reset} ${A.smoke}${truncate(clockStatus, 8)}${A.reset} `;
  const headerGap = iW - visLen(headerLeft) - visLen(headerRight);
  out.push(doubleRow(headerLeft + ' '.repeat(Math.max(1, headerGap)) + headerRight, iW));
  out.push(doubleMid(iW));

  // ── Engine HUD (Influence / Heat / Phase) ──
  const eng = state._engine || null;
  if (eng) {
    // Influence bar
    const inf = eng.influence ?? 3;
    const maxInf = eng.maxInfluence ?? 6;
    const infBarW = compact ? 6 : 8;
    const infFilled = Math.round((inf / maxInf) * infBarW);
    const infEmpty = infBarW - infFilled;
    const infColor = inf >= 4 ? A.green : inf >= 2 ? A.gold : A.red;
    const infBar = `${infColor}${BOX.full.repeat(infFilled)}${A.smoke}${BOX.light.repeat(infEmpty)}${A.reset}`;
    const infLabel = `${A.cyan}\u25c8 INF${A.reset} ${infBar} ${infColor}${inf}/${maxInf}${A.reset}`;

    // Heat meter
    const heat = eng.heat ?? 0;
    const heatMax = 20;
    const heatBarW = compact ? 6 : 8;
    const heatFilled = Math.round((heat / heatMax) * heatBarW);
    const heatEmpty = heatBarW - heatFilled;
    let heatColor;
    if (heat >= 18) heatColor = A.purple;
    else if (heat >= 14) heatColor = '\x1b[38;2;220;50;47m';
    else if (heat >= 10) heatColor = A.orange;
    else if (heat >= 5) heatColor = A.gold;
    else heatColor = A.green;
    const heatBar = `${heatColor}${BOX.full.repeat(heatFilled)}${A.smoke}${BOX.light.repeat(heatEmpty)}${A.reset}`;
    const heatThresholdName = eng.heatThreshold || '';
    const heatLabel = `${A.ember}\u2668 HEAT${A.reset} ${heatBar} ${heatColor}${heat}/${heatMax}${A.reset}`;

    // Rival Intent (v4.0)
    const intent = eng.rivalIntent ?? 0;
    const intentBarW = compact ? 6 : 8;
    const intentFilled = Math.round((intent / 100) * intentBarW);
    const intentEmpty = intentBarW - intentFilled;
    const intentColor = intent >= 80 ? A.red : intent >= 50 ? A.gold : A.amber;
    const intentBar = `${intentColor}${BOX.full.repeat(intentFilled)}${A.smoke}${BOX.light.repeat(intentEmpty)}${A.reset}`;
    const intentLabel = `${A.rust}\u26a1 RIVAL${A.reset} ${intentBar} ${Math.round(intent)}%${A.reset}`;

    // Phase/Turn
    const turn = eng.turn ?? '';
    const phase = eng.phase ? eng.phase.toUpperCase() : '';
    const turnLabel = turn ? `${A.smoke}T${turn}${A.reset}` : '';
    const phaseLabel = phase ? `${A.slate}\u25b8${phase}${A.reset}` : '';

    // Compose HUD line
    const hudLeft = `  ${infLabel}`;
    const hudMid = `${heatLabel} ${intentLabel}`;
    const hudRight = `${turnLabel} ${phaseLabel} `;
    const hudGap1 = Math.max(1, Math.floor((iW - visLen(hudLeft) - visLen(hudMid) - visLen(hudRight)) / 2));
    const hudGap2 = Math.max(1, iW - visLen(hudLeft) - visLen(hudMid) - visLen(hudRight) - hudGap1);
    out.push(doubleRow(hudLeft + ' '.repeat(hudGap1) + hudMid + ' '.repeat(hudGap2) + hudRight, iW));
    out.push(doubleMid(iW));
  }
  // ── Event (capped to 2 lines when tight) ──
  if (state.event) {
    const evtName = (state.event.name || 'UNKNOWN').toUpperCase();
    const desc = state.event.description || '';
    if (tight) {
      const shortDesc = truncate(desc, iW - visLen(evtName) - 12);
      out.push(doubleRow(`  ${A.ember}${A.bold}\u26a1 ${evtName}${A.reset} ${A.chalk}${shortDesc}${A.reset}`, iW));
    } else {
      out.push(doubleRow(`  ${A.ember}${A.bold}\u26a1 EVENT: ${evtName}${A.reset}`, iW));
      const descLines = wordWrap(desc, iW - 6);
      for (const dl of descLines) {
        out.push(doubleRow(`  ${A.chalk}${BOX.sv} ${dl}${A.reset}`, iW));
      }
    }
    out.push(doubleMid(iW));
  }

  // ── Scanner (capped to 1 line when tight) ──
  if (state.scanner) {
    const isIntent = state.scanner.includes('[INTENT');
    const color = isIntent ? A.orange : A.crimson;
    const icon = isIntent ? '\u26a0' : '\ud83d\udcfb';
    if (tight) {
      out.push(doubleRow(`  ${color}${icon}${A.reset} ${A.italic}${A.chalk}${truncate(state.scanner, iW - 8)}${A.reset}`, iW));
    } else {
      out.push(doubleRow(`  ${color}${A.bold}${icon} SCANNER${A.reset}`, iW));
      const scanLines = wordWrap(`"${state.scanner}"`, iW - 8);
      for (let i = 0; i < scanLines.length; i++) {
        const pfx = i === 0 ? `${A.smoke}${BOX.medium} ` : '    ';
        out.push(doubleRow(`  ${pfx}${A.italic}${A.chalk}${scanLines[i]}${A.reset}`, iW));
      }
    }
    out.push(doubleMid(iW));
  }

  // ── Enemy Intent ──
  if (state.enemy_intent) {
    if (tight) {
      out.push(doubleRow(`  ${A.crimson}\u26a0${A.reset} ${A.bold}NEXT TURN:${A.reset} ${A.chalk}${truncate(state.enemy_intent, iW - 16)}${A.reset}`, iW));
    } else {
      out.push(doubleRow(`  ${A.crimson}${A.bold}\u26a0 ENEMY INTENT${A.reset}`, iW));
      const intentLines = wordWrap(state.enemy_intent, iW - 8);
      for (let i = 0; i < intentLines.length; i++) {
        const pfx = i === 0 ? `${A.smoke}${BOX.medium} ` : '    ';
        out.push(doubleRow(`  ${pfx}${A.crimson}${intentLines[i]}${A.reset}`, iW));
      }
      out.push(innerDivider(iW));
    }
  }

  // ── Tactical Mini-Map (v4.5 Visual Combat Update) ──
  if (!tight) {
    const mapTitle = `  ${A.bold}${A.gold}\u2316 SOUTH SIDE TACTICAL OVERVIEW${A.reset}`;
    out.push(doubleRow(mapTitle, iW));
    const mapLines = renderMiniMap(state.territories, iW);
    for (const ml of mapLines) {
      out.push(doubleRow(ml, iW));
    }
    out.push(innerDivider(iW));
  }

  // ── Hand ──
  const intelCount = state.intel ?? '?';
  const intelColor = intelCount === 0 ? A.red : A.gold;
  const handTitle = `  ${A.bold}${A.chalk}\ud83c\udccf HAND${A.reset}`;
  const intelStr = `${intelColor}\u29be Intel:${intelCount}${A.reset} `;
  const handGap = iW - visLen(handTitle) - visLen(intelStr);
  out.push(doubleRow(handTitle + ' '.repeat(Math.max(1, handGap)) + intelStr, iW));

  const hand = state.hand || [];
  if (tight) {
    // Always use compact hand when height-constrained
    const compactLines = renderCompactHand(hand, iW);
    for (const cl of compactLines) {
      out.push(doubleRow(cl, iW));
    }
  } else {
    const fanLines = renderFannedHand(hand, iW);
    for (const fl of fanLines) {
      out.push(doubleRow(fl, iW));
    }
  }

  out.push(innerDivider(iW));

  // ── Choice / Prompt ──
  if (state.choice) {
    if (state.choice.description && !tight) {
      const choiceDesc = wordWrap(state.choice.description, iW - 6);
      for (const cl of choiceDesc) {
        out.push(doubleRow(`  ${A.white}${cl}${A.reset}`, iW));
      }
    }
    if (state.choice.optionA) {
      out.push(doubleRow(`  ${A.blue}${A.bold}\u25c4 [A]${A.reset} ${A.chalk}${truncate(state.choice.optionA, iW - 12)}${A.reset}`, iW));
    }
    if (state.choice.optionB) {
      out.push(doubleRow(`  ${A.red}${A.bold}\u25ba [B]${A.reset} ${A.chalk}${truncate(state.choice.optionB, iW - 12)}${A.reset}`, iW));
    }
    if (state.choice.optionBurn && !tight) {
      out.push(doubleRow(`  ${A.orange}${A.bold}\ud83d\uddd1 [BURN]${A.reset} ${A.smoke}${state.choice.optionBurn}${A.reset}`, iW));
    }
    out.push(doubleRow(`  ${A.gold}${A.bold}\u25b8 Your call? (A, B, or BURN)${A.reset}`, iW));
  } else {
    const prompt = `  ${A.gold}${A.bold}\u25b8${A.reset} ${A.chalk}Play a card ${A.gold}(1-${hand.length || 5})${A.reset}${A.chalk}, or ${A.gold}INTEL [Name]${A.reset}`;
    out.push(doubleRow(prompt, iW));
  }

  out.push(doubleBot(iW));

  let finalOutput = out.join('\n');

  // --- Visual Intensity Effects (v4.5) ---
  const shakeX = options.shakeX || 0;
  if (shakeX !== 0) {
    const space = ' '.repeat(Math.abs(shakeX));
    finalOutput = finalOutput.split('\n').map(l => (shakeX > 0 ? space + l : l + space)).join('\n');
  }

  const flash = options.flash || false;
  if (flash) {
    finalOutput = `\x1b[7m${finalOutput}\x1b[27m`;
  }

  return finalOutput;
}

// ══════════════════════════════════════════════════════════════════
//  NARRATIVE, WIN/LOSS, SPLASH, PROVIDER SELECT, HELP
// ══════════════════════════════════════════════════════════════════

export function renderNarrative(text) {
  const iW = getW() - 2;
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
  const iW = getW() - 2;
  const compact = iW < 68;
  const out = [];
  out.push('');
  out.push(doubleTop(iW));
  out.push(doubleRow('', iW));

  if (!compact) {
    // Star burst pattern
    out.push(doubleRow(padCenter(`${A.gold}                ✦${A.reset}`, iW), iW));
    out.push(doubleRow(padCenter(`${A.gold}           ⊹  ${A.bold}★${A.reset}${A.gold}  ⊹${A.reset}`, iW), iW));
    out.push(doubleRow(padCenter(`${A.amber}      ✧                  ✧${A.reset}`, iW), iW));
  }

  // Victory header with texture
  const glow = `${A.green}${A.bold}`;
  const glowLine = `${BOX.light}${BOX.medium}${BOX.dense}  ★  V I C T O R Y  ★  ${BOX.dense}${BOX.medium}${BOX.light}`;
  out.push(doubleRow(padCenter(`${glow}${glowLine}${A.reset}`, iW), iW));

  if (!compact) {
    out.push(doubleRow(padCenter(`${A.amber}      ✧                  ✧${A.reset}`, iW), iW));
    out.push(doubleRow(padCenter(`${A.gold}           ⊹  ${A.bold}★${A.reset}${A.gold}  ⊹${A.reset}`, iW), iW));
    out.push(doubleRow(padCenter(`${A.gold}                ✦${A.reset}`, iW), iW));
  }

  out.push(doubleRow('', iW));

  // Trophy
  out.push(doubleRow(padCenter(`${A.gold}        ♛${A.reset}`, iW), iW));
  out.push(doubleRow(padCenter(`${A.gold}${A.bold}   ▄${BOX.full.repeat(9)}▄${A.reset}`, iW), iW));
  out.push(doubleRow('', iW));

  // Narrative message
  const lines = wordWrap(message || 'You held the block. The corner knows your name.', iW - 10);
  for (const l of lines) {
    out.push(doubleRow(padCenter(`${A.chalk}${A.italic}${l}${A.reset}`, iW), iW));
  }
  out.push(doubleRow('', iW));

  // Tagline
  out.push(doubleRow(padCenter(`${A.smoke}─────────────────────${A.reset}`, iW), iW));
  out.push(doubleRow(padCenter(`${A.smoke}${A.italic}"Territory. Trust. Time."${A.reset}`, iW), iW));
  out.push(doubleRow('', iW));
  out.push(doubleBot(iW));
  return out.join('\n');
}

export function renderLoss(message) {
  const iW = getW() - 2;
  const compact = iW < 68;
  const out = [];
  out.push('');
  out.push(doubleTop(iW));
  out.push(doubleRow('', iW));

  if (!compact) {
    // X pattern
    out.push(doubleRow(padCenter(`${A.crimson}       ╲         ╱${A.reset}`, iW), iW));
    out.push(doubleRow(padCenter(`${A.crimson}        ╲       ╱${A.reset}`, iW), iW));
    out.push(doubleRow(padCenter(`${A.crimson}         ╲     ╱${A.reset}`, iW), iW));
    out.push(doubleRow(padCenter(`${A.crimson}          ╲   ╱${A.reset}`, iW), iW));
    out.push(doubleRow(padCenter(`${A.crimson}           ╳${A.reset}`, iW), iW));
  }

  // Defeat header
  const lossGlow = `${A.red}${A.bold}`;
  const lossLine = `${BOX.dense}${BOX.medium}${BOX.light}  ✖  D E F E A T  ✖  ${BOX.light}${BOX.medium}${BOX.dense}`;
  out.push(doubleRow(padCenter(`${lossGlow}${lossLine}${A.reset}`, iW), iW));

  if (!compact) {
    out.push(doubleRow(padCenter(`${A.crimson}           ╳${A.reset}`, iW), iW));
    out.push(doubleRow(padCenter(`${A.crimson}          ╱   ╲${A.reset}`, iW), iW));
    out.push(doubleRow(padCenter(`${A.crimson}         ╱     ╲${A.reset}`, iW), iW));
  }

  out.push(doubleRow('', iW));

  // Narrative message
  const lines = wordWrap(message || 'The block moved without you.', iW - 10);
  for (const l of lines) {
    out.push(doubleRow(padCenter(`${A.chalk}${A.dim}${l}${A.reset}`, iW), iW));
  }
  out.push(doubleRow('', iW));

  // Tagline
  out.push(doubleRow(padCenter(`${A.smoke}─────────────────────${A.reset}`, iW), iW));
  out.push(doubleRow(padCenter(`${A.smoke}${A.italic}"The block remembers."${A.reset}`, iW), iW));
  out.push(doubleRow('', iW));
  out.push(doubleBot(iW));
  return out.join('\n');
}

export function renderLoading() {
  return `  ${A.smoke}${BOX.medium} The block is thinking...${A.reset}`;
}

export function renderSplash(frame = 0) {
  const iW = getW() - 2;
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
  const iW = getW() - 2;
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

// ── Animated Menu Screen ─────────────────────────────────────────
export function renderMenu(title, options, focusIdx, frame = 0) {
  const iW = getW() - 2;
  const out = [];

  out.push(doubleTop(iW));
  out.push(doubleRow('', iW));

  // Determine width of our content minus the edge bars
  const edgeW = 10;
  const innerContentW = iW - (edgeW * 2) - 4; // -4 for padding around edges

  // Prepare the block of lines we want to show
  const contentLines = [];
  contentLines.push(`${A.gold}${A.bold}${title}${A.reset}`);
  contentLines.push('');
  contentLines.push('');

  for (let i = 0; i < options.length; i++) {
    const isFocused = i === focusIdx;
    const prefix = isFocused ? `${A.green}${A.bold}▸${A.reset} ` : '  ';
    const textColor = isFocused ? A.white : A.gray;
    const label = `${prefix}${textColor}${options[i].label}${A.reset}`;
    contentLines.push(label);
    contentLines.push('');
  }

  // Ensure minimum height
  const minHeight = 16;
  while (contentLines.length < minHeight) {
    contentLines.push('');
  }

  // Generate left/right variable typographic edges and blend with content
  const palette = " .:-=+*#%@";
  for (let y = 0; y < contentLines.length; y++) {
    // Left edge
    let leftEdge = "";
    for (let x = 0; x < edgeW; x++) {
      const t = frame * 0.15;
      const noise = (Math.sin(x * 0.3 + t) + Math.cos(y * 0.3 - t) + Math.sin(x * 0.5 - y * 0.5 + t * 1.5)) / 3;
      const pIdx = Math.floor(((noise + 1) / 2) * (palette.length - 1));
      leftEdge += palette[Math.max(0, Math.min(palette.length - 1, pIdx))];
    }

    // Right edge
    let rightEdge = "";
    for (let x = 0; x < edgeW; x++) {
      const rx = x + edgeW + innerContentW;
      const t = frame * 0.15;
      const noise = (Math.sin(rx * 0.3 + t) + Math.cos(y * 0.3 - t) + Math.sin(rx * 0.5 - y * 0.5 + t * 1.5)) / 3;
      const pIdx = Math.floor(((noise + 1) / 2) * (palette.length - 1));
      rightEdge += palette[Math.max(0, Math.min(palette.length - 1, pIdx))];
    }

    const cLineRaw = contentLines[y] || '';
    const visCLine = visLen(cLineRaw);
    const contentPadLeft = ' '.repeat(Math.max(0, Math.floor((innerContentW - visCLine) / 2)));
    const contentPadRight = ' '.repeat(Math.max(0, Math.ceil((innerContentW - visCLine) / 2)));

    const styledLeft = `${A.rust}${A.bold}${leftEdge}${A.reset}`;
    const styledRight = `${A.rust}${A.bold}${rightEdge}${A.reset}`;

    out.push(doubleRow(` ${styledLeft} ${contentPadLeft}${cLineRaw}${contentPadRight} ${styledRight} `, iW));
  }

  out.push(doubleRow('', iW));
  out.push(doubleBot(iW));

  return out.join('\n');
}

// ── Help Screen ──────────────────────────────────────────────────
export function renderHelp() {
  const iW = getW() - 2;
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

// End of file cleanup (v4.5)
