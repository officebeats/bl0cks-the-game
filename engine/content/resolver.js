import { existsSync, readFileSync } from 'fs';
import { join, resolve } from 'path';

/**
 * BL0CKS ROM File Resolver
 * 
 * Given a ROM directory and its manifest, resolves all declared file paths
 * to absolute paths and verifies they exist on disk.
 * 
 * @param {string} romDir - Absolute path to the ROM directory
 * @param {object} manifest - Parsed manifest.json
 * @returns {{ resolved: object, missing: string[] }}
 */
export function resolveROMFiles(romDir, manifest) {
  const missing = [];
  const resolved = {
    dir: romDir,
    world: {},
    levels: [],
    prompts: {},
    cards: {},
    assets: {},
  };

  // ── World files ──
  if (manifest.world) {
    for (const [key, relPath] of Object.entries(manifest.world)) {
      const absPath = join(romDir, relPath);
      if (existsSync(absPath)) {
        resolved.world[key] = absPath;
      } else {
        missing.push(`world.${key}: ${relPath}`);
      }
    }
  }

  // ── Level files ──
  if (manifest.levels) {
    for (const level of manifest.levels) {
      const absPath = join(romDir, level.file);
      if (existsSync(absPath)) {
        resolved.levels.push({
          id: level.id,
          name: level.name || level.id,
          type: level.type || 'standard',
          path: absPath,
        });
      } else {
        missing.push(`level ${level.id}: ${level.file}`);
      }
    }
  }

  // ── Prompt files (optional — narrator, card-gen may not exist) ──
  if (manifest.prompts) {
    for (const [key, relPath] of Object.entries(manifest.prompts)) {
      const absPath = join(romDir, relPath);
      if (existsSync(absPath)) {
        resolved.prompts[key] = absPath;
      } else if (key === 'system') {
        missing.push(`prompts.system: ${relPath} (REQUIRED)`);
      }
      // narrator and card_generator are optional — don't flag as missing
    }
  }

  // ── Card directories ──
  if (manifest.cards) {
    if (manifest.cards.templates_dir) {
      const dir = join(romDir, manifest.cards.templates_dir);
      resolved.cards.templates_dir = existsSync(dir) ? dir : null;
    }
    if (manifest.cards.custom_dir) {
      const dir = join(romDir, manifest.cards.custom_dir);
      resolved.cards.custom_dir = existsSync(dir) ? dir : null;
    }
  }

  // ── Assets ──
  if (manifest.assets) {
    if (manifest.assets.theme) {
      const absPath = join(romDir, manifest.assets.theme);
      resolved.assets.theme = existsSync(absPath) ? absPath : null;
    }
    if (manifest.assets.audio_dir) {
      const dir = join(romDir, manifest.assets.audio_dir);
      resolved.assets.audio_dir = existsSync(dir) ? dir : null;
    }
  }

  return { resolved, missing };
}

/**
 * Read and return the contents of a resolved ROM file.
 * @param {string} absPath - Absolute file path
 * @returns {string} File contents
 */
export function readROMFile(absPath) {
  return readFileSync(absPath, 'utf-8');
}
