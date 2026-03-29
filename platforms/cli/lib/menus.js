/**
 * BL0CKS CLI — Menu System
 * 
 * Main menu, provider selection, API key entry, and title screen rendering.
 * Uses the input handler for all interactive components.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { PROVIDERS } from '../../../engine/index.js';
import { A, renderMenu } from './renderer.js';
import { ask, clear, showAnimatedMenu, showAnimatedPrompt } from './input.js';

// ── Config persistence ──────────────────────────────────────────
const CONFIG_DIR = join(homedir(), '.bl0cks');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');
const SAVE_FILE = join(CONFIG_DIR, 'save_game.json');

export function loadConfig() {
  try {
    if (existsSync(CONFIG_FILE)) return JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'));
  } catch { /* fresh start */ }
  return {};
}

export function saveConfig(config) {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export function loadSession() {
  try {
    if (existsSync(SAVE_FILE)) return JSON.parse(readFileSync(SAVE_FILE, 'utf-8'));
  } catch { /* ignored */ }
  return null;
}

export function saveSession(data) {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(SAVE_FILE, JSON.stringify(data, null, 2));
}

/**
 * Show the provider selection menu.
 * @param {object} config
 * @returns {Promise<object>} Selected provider
 */
export async function selectProvider(config) {
  const options = PROVIDERS.map((p) => {
    const isSaved = config.provider === p.id ? ' [Saved]' : '';
    return { label: `${p.name}${isSaved}`, value: p };
  });
  return showAnimatedMenu("ESTABLISH NEURAL LINK", options, renderMenu);
}

/**
 * Get or enter an API key for a provider.
 * @param {object} provider
 * @param {object} config
 * @returns {Promise<string>} API key
 */
export async function getApiKey(provider, config) {
  if (config.keys?.[provider.id]) {
    const reuseOptions = [
      { label: `Boot with saved cypher? (Y/n) - Yes`, value: true },
      { label: `Enter new cypher`, value: false }
    ];
    const reuse = await showAnimatedMenu("ESTABLISH NEURAL LINK", reuseOptions, renderMenu);
    if (reuse) return config.keys[provider.id];
  }

  const subtitle = `Get Cypher: ${provider.keyUrl}\n  Format: ${provider.keyHint}\n\n  Paste Your Cypher:`;
  const key = await showAnimatedPrompt("ESTABLISH NEURAL LINK", subtitle, renderMenu);

  if (!key.trim()) {
    clear();
    console.log(`\n  ${A.red}Connection severed. No cypher provided. Exiting.${A.reset}`);
    process.exit(1);
  }

  if (!config.keys) config.keys = {};
  config.keys[provider.id] = key.trim();
  config.provider = provider.id;
  saveConfig(config);

  clear();
  console.log(`\n  ${A.green}✓${A.reset} Cypher encrypted and saved to ${A.dim}~/.bl0cks/config.json${A.reset}`);
  await new Promise(r => setTimeout(r, 800));
  return key.trim();
}

/**
 * Show the main menu and return the selection.
 * @param {object} config
 * @param {object} romInfo
 * @param {object[]} installedROMs
 * @returns {Promise<string>} 'new' | 'resume' | 'settings' | 'quit'
 */
export async function showMainMenu(config, romInfo, installedROMs) {
  const currentProv = config.provider
    ? PROVIDERS.find(p => p.id === config.provider)?.name || 'None'
    : 'None';

  return showAnimatedMenu("MAIN MENU", [
    { label: "New Run (Tutorial)", value: "new" },
    { label: "Resume Past Session", value: "resume" },
    { label: `Settings (Current AI: ${currentProv})`, value: "settings" },
    { label: "Quit", value: "quit" }
  ], renderMenu);
}

/**
 * Render title screen ROM info.
 * @param {object} romInfo
 * @param {object[]} installedROMs
 * @returns {string}
 */
export function renderTitleInfo(romInfo, installedROMs) {
  let lines = [];
  lines.push(`  ${A.dim}Base: ${romInfo.base.name} v${romInfo.base.version}${A.reset}`);

  if (romInfo.activeOverlays?.length > 0) {
    for (const overlay of romInfo.activeOverlays) {
      lines.push(`  ${A.gold}🔓 DLC: ${overlay.name}${A.reset}  ${A.green}[Active]${A.reset}`);
    }
  }

  const otherROMs = installedROMs.filter(r => r.id !== romInfo.base.id);
  for (const rom of otherROMs) {
    const icon = rom.contentType === 'community' ? '🌐' : '🎮';
    const status = rom.extends ? `[Extends: ${rom.extends}]` : '[Installed]';
    lines.push(`  ${A.dim}${icon} ${rom.name}  ${status}${A.reset}`);
  }

  return lines.join('\n');
}
