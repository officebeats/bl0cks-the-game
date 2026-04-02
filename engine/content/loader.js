/**
 * BL0CKS ROM Loader
 *
 * The master content pipeline. Discovers, validates, resolves, and loads
 * ROM directories into a content object the engine can consume.
 *
 * Pipeline: discover → parse manifest → validate → resolve files → validate content → merge overlays
 *
 * Performance: In-memory ROM cache avoids redundant disk reads on repeated boots.
 */

import { existsSync, readFileSync, readdirSync } from 'fs';
import { readFile, readdir } from 'fs/promises';
import { join, resolve as pathResolve, basename } from 'path';
import { homedir } from 'os';
import { validateManifest, isOverlayROM, getContentType } from './manifest.js';
import { resolveROMFiles, readROMFile } from './resolver.js';
import { validateContent } from './validator.js';
import { mergeROMs } from './merger.js';

/** @type {Map<string, { rom: object, info: object, timestamp: number }>} */
const ROM_CACHE = new Map();

/** Cache TTL in milliseconds (5 minutes). ROM content is static during runtime. */
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Default ROM search paths, in priority order.
 */
function getSearchPaths(engineRoot) {
  return [
    join(homedir(), '.bl0cks', 'roms'),    // User-installed ROMs
    join(engineRoot, '..', 'roms'),         // Built-in ROMs (monorepo)
  ];
}

/**
 * Invalidate the ROM cache. Call this if ROM files change at runtime (e.g., hot-reload).
 */
export function invalidateROMCache(pathOrId = null) {
  if (pathOrId) {
    ROM_CACHE.delete(pathOrId);
  } else {
    ROM_CACHE.clear();
  }
}

/**
 * Load a ROM from a path or id.
 *
 * @param {string} pathOrId - Absolute path to ROM dir, or a ROM id to search for
 * @param {string} engineRoot - Absolute path to the engine directory
 * @param {object} [options] - { overlays: string[] } — additional overlay ROM ids to load
 * @returns {Promise<{ rom: object, info: object, errors: string[], warnings: string[] }>}
 */
export async function loadROM(pathOrId, engineRoot, options = {}) {
  // ── Cache check ──
  const cacheKey = `${pathOrId}:${JSON.stringify(options.overlays || [])}`;
  const cached = ROM_CACHE.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL_MS) {
    return { rom: cached.rom, info: cached.info, errors: [], warnings: [] };
  }

  const errors = [];
  const warnings = [];

  // ── Step 1: Discover the ROM directory ──
  const romDir = discoverROM(pathOrId, engineRoot);
  if (!romDir) {
    return { rom: null, info: null, errors: [`ROM not found: "${pathOrId}"`], warnings };
  }

  // ── Step 2: Parse manifest ──
  const manifestPath = join(romDir, 'manifest.json');
  if (!existsSync(manifestPath)) {
    return { rom: null, info: null, errors: [`No manifest.json in: ${romDir}`], warnings };
  }

  let manifest;
  try {
    const manifestRaw = await readFile(manifestPath, 'utf-8');
    manifest = JSON.parse(manifestRaw);
  } catch (err) {
    return { rom: null, info: null, errors: [`Failed to parse manifest.json: ${err.message}`], warnings };
  }

  // ── Step 3: Validate manifest ──
  const mResult = validateManifest(manifest);
  errors.push(...mResult.errors);
  warnings.push(...mResult.warnings);
  if (!mResult.valid) {
    return { rom: null, info: null, errors, warnings };
  }

  // ── Step 4: Resolve files ──
  const { resolved, missing } = resolveROMFiles(romDir, manifest);
  if (missing.length > 0) {
    for (const m of missing) {
      if (m.includes('REQUIRED')) {
        errors.push(`Missing required file: ${m}`);
      } else {
        warnings.push(`Missing optional file: ${m}`);
      }
    }
  }
  if (errors.length > 0) {
    return { rom: null, info: null, errors, warnings };
  }

  // ── Step 5: Validate content ──
  const cResult = validateContent(resolved);
  errors.push(...cResult.errors);
  warnings.push(...cResult.warnings);

  // ── Step 6: Build loaded ROM content object (async I/O) ──
  const rom = await buildROMContentAsync(resolved, manifest);

  // ── Step 7: Handle overlays ──
  let finalROM = rom;
  if (options.overlays && options.overlays.length > 0) {
    const overlayResults = await Promise.all(
      options.overlays.map(overlayId => loadROM(overlayId, engineRoot))
    );
    for (let i = 0; i < overlayResults.length; i++) {
      const overlayResult = overlayResults[i];
      if (overlayResult.rom) {
        finalROM = mergeROMs(finalROM, overlayResult.rom, overlayResult.rom._manifest);
        warnings.push(...overlayResult.warnings);
      } else {
        warnings.push(`Failed to load overlay "${options.overlays[i]}": ${overlayResult.errors.join(', ')}`);
      }
    }
  }

  // ── Build ROM info for identity surfacing ──
  const info = buildROMInfo(manifest, finalROM);

  // ── Populate cache ──
  ROM_CACHE.set(cacheKey, { rom: finalROM, info, timestamp: Date.now() });

  return { rom: finalROM, info, errors, warnings };
}

/**
 * Discover a ROM directory by path or id.
 */
function discoverROM(pathOrId, engineRoot) {
  // 1. Direct path
  const direct = pathResolve(pathOrId);
  if (existsSync(join(direct, 'manifest.json'))) {
    return direct;
  }

  // 2. Search in known paths
  const searchPaths = getSearchPaths(engineRoot);
  for (const base of searchPaths) {
    const candidate = join(base, pathOrId);
    if (existsSync(join(candidate, 'manifest.json'))) {
      return candidate;
    }
  }

  // 3. CWD probe (dev mode)
  const cwdProbe = join(process.cwd(), pathOrId);
  if (existsSync(join(cwdProbe, 'manifest.json'))) {
    return cwdProbe;
  }

  return null;
}

/**
 * Build the loaded ROM content from resolved file paths (async).
 * Uses parallel reads for independent file groups to minimize latency.
 */
async function buildROMContentAsync(resolved, manifest) {
  const rom = {
    _manifest: manifest,
    _dir: resolved.dir,
    _overlays: [],
    world: {},
    levels: [],
    prompts: {},
    cards: { templates_dir: resolved.cards.templates_dir, custom_dir: resolved.cards.custom_dir },
    assets: { theme: null, audio_dir: resolved.assets.audio_dir },
  };

  // Read world files, level files, and prompt files in parallel
  const worldEntries = Object.entries(resolved.world);
  const promptEntries = Object.entries(resolved.prompts);

  const [worldContents, levelContents, promptContents, themeContent] = await Promise.all([
    // World files
    Promise.all(
      worldEntries.map(([, path]) => readFile(path, 'utf-8'))
    ),
    // Level files
    Promise.all(
      resolved.levels.map(level => readFile(level.path, 'utf-8'))
    ),
    // Prompt files
    Promise.all(
      promptEntries.map(([, path]) => readFile(path, 'utf-8'))
    ),
    // Theme (optional)
    resolved.assets.theme
      ? readFile(resolved.assets.theme, 'utf-8').catch(() => null)
      : Promise.resolve(null),
  ]);

  // Assemble world
  for (let i = 0; i < worldEntries.length; i++) {
    rom.world[worldEntries[i][0]] = worldContents[i];
  }

  // Assemble levels
  for (let i = 0; i < resolved.levels.length; i++) {
    const level = resolved.levels[i];
    rom.levels.push({
      id: level.id,
      name: level.name,
      type: level.type,
      path: level.path,
      content: levelContents[i],
      _sourceROM: manifest.id,
      _isDLC: false,
      _isCommunity: getContentType(manifest) === 'community',
    });
  }

  // Assemble prompts
  for (let i = 0; i < promptEntries.length; i++) {
    rom.prompts[promptEntries[i][0]] = promptContents[i];
  }

  // Parse theme
  if (themeContent) {
    try {
      rom.assets.theme = JSON.parse(themeContent);
    } catch { rom.assets.theme = null; }
  }

  return rom;
}

/**
 * Synchronous fallback for contexts where async is not available.
 * Prefer buildROMContentAsync in API routes and boot sequences.
 */
function buildROMContent(resolved, manifest) {
  const rom = {
    _manifest: manifest,
    _dir: resolved.dir,
    _overlays: [],
    world: {},
    levels: [],
    prompts: {},
    cards: { templates_dir: resolved.cards.templates_dir, custom_dir: resolved.cards.custom_dir },
    assets: { theme: null, audio_dir: resolved.assets.audio_dir },
  };

  for (const [key, path] of Object.entries(resolved.world)) {
    rom.world[key] = readROMFile(path);
  }

  for (const level of resolved.levels) {
    rom.levels.push({
      id: level.id,
      name: level.name,
      type: level.type,
      path: level.path,
      content: readROMFile(level.path),
      _sourceROM: manifest.id,
      _isDLC: false,
      _isCommunity: getContentType(manifest) === 'community',
    });
  }

  for (const [key, path] of Object.entries(resolved.prompts)) {
    rom.prompts[key] = readROMFile(path);
  }

  if (resolved.assets.theme) {
    try {
      rom.assets.theme = JSON.parse(readROMFile(resolved.assets.theme));
    } catch { rom.assets.theme = null; }
  }

  return rom;
}

/**
 * Build ROM identity info for UI surfacing (title screen, HUD, settings).
 */
function buildROMInfo(manifest, rom) {
  return {
    base: {
      id: manifest.id,
      name: manifest.name,
      author: manifest.author,
      version: manifest.version,
      description: manifest.description,
      contentType: getContentType(manifest),
    },
    activeOverlays: (rom._overlays || []).map(o => ({
      id: o.id,
      name: o.name,
      author: o.author,
      type: o.type,
      badge: o.branding?.badge_icon
        ? `${o.branding.badge_icon} ${o.branding.badge_label || o.name}`
        : `🔓 ${o.name}`,
      themeAccent: o.branding?.accent_color || null,
    })),
    branding: manifest.branding || {
      badge_icon: '🎮',
      badge_label: manifest.name,
      accent_color: '#C0392B',
      credit_line: `by ${manifest.author}`,
      splash_tagline: manifest.description,
    },
    levelCount: rom.levels.length,
    dlcLevelCount: rom.levels.filter(l => l._isDLC).length,
    ai: manifest.ai || {},
    difficulty: manifest.difficulty || {},
  };
}

/**
 * Scan all ROM search paths and return installed ROM metadata.
 * Used by title screen and settings to enumerate available content.
 * 
 * @param {string} engineRoot
 * @returns {object[]} Array of { id, name, author, version, dir, contentType, branding, overlays }
 */
export function scanInstalledROMs(engineRoot) {
  const searchPaths = getSearchPaths(engineRoot);
  const roms = [];
  const seen = new Set();

  for (const base of searchPaths) {
    if (!existsSync(base)) continue;

    const entries = readdirSync(base, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name.startsWith('.') || entry.name.startsWith('_')) continue;

      const manifestPath = join(base, entry.name, 'manifest.json');
      if (!existsSync(manifestPath)) continue;

      try {
        const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
        if (seen.has(manifest.id)) continue;
        seen.add(manifest.id);

        roms.push({
          id: manifest.id,
          name: manifest.name,
          author: manifest.author,
          version: manifest.version,
          dir: join(base, entry.name),
          contentType: getContentType(manifest),
          extends: manifest.extends || null,
          branding: manifest.branding || null,
          ai: manifest.ai || {},
          levelCount: manifest.levels?.length || 0,
        });
      } catch {
        // Skip malformed manifests
      }
    }
  }

  return roms;
}
