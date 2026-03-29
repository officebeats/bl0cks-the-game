/**
 * BL0CKS ROM Content Validator
 * 
 * Performs content-level integrity checks on resolved ROM files.
 * Goes beyond manifest schema — actually reads files and validates structure.
 */

import { readFileSync } from 'fs';

/**
 * Validate the contents of a resolved ROM.
 * @param {object} resolved - Output from resolver.resolveROMFiles()
 * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
 */
export function validateContent(resolved) {
  const errors = [];
  const warnings = [];

  // ── System prompt must exist and have content ──
  if (resolved.prompts.system) {
    const content = readFileSync(resolved.prompts.system, 'utf-8').trim();
    if (content.length < 100) {
      warnings.push('System prompt is very short (<100 chars). AI may not have enough context.');
    }
  }

  // ── Level files should have basic structure ──
  for (const level of resolved.levels) {
    try {
      const content = readFileSync(level.path, 'utf-8');

      // Check for a heading
      if (!content.match(/^#\s+/m)) {
        warnings.push(`Level ${level.id} (${level.name}) has no markdown heading.`);
      }

      // Check for territory references (at minimum, levels should reference territories)
      if (!content.toLowerCase().includes('territory') && !content.toLowerCase().includes('block')) {
        warnings.push(`Level ${level.id} doesn't reference any territory or block state.`);
      }
    } catch (err) {
      errors.push(`Failed to read level ${level.id}: ${err.message}`);
    }
  }

  // ── World files should have content ──
  for (const [key, path] of Object.entries(resolved.world)) {
    try {
      const content = readFileSync(path, 'utf-8').trim();
      if (content.length < 50) {
        warnings.push(`World file "${key}" is very short (<50 chars).`);
      }
    } catch (err) {
      errors.push(`Failed to read world file "${key}": ${err.message}`);
    }
  }

  // ── Theme should have required color tokens ──
  if (resolved.assets.theme) {
    try {
      const theme = JSON.parse(readFileSync(resolved.assets.theme, 'utf-8'));
      const requiredColors = ['bg_base', 'bg_surface', 'accent_red', 'text_primary'];
      if (theme.colors) {
        for (const key of requiredColors) {
          if (!theme.colors[key]) {
            warnings.push(`Theme missing recommended color token: "${key}"`);
          }
        }
      } else {
        warnings.push('Theme file has no "colors" object.');
      }
    } catch (err) {
      errors.push(`Failed to parse theme.json: ${err.message}`);
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}
