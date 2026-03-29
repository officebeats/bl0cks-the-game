/**
 * BL0CKS ROM Manifest Schema & Validator
 * 
 * Validates a manifest.json against the ROM specification v1.
 * Returns { valid: boolean, errors: string[], warnings: string[] }
 */

const REQUIRED_FIELDS = [
  'format_version', 'version', 'id', 'name', 'description', 'author',
  'engine', 'world', 'levels', 'prompts',
];

const REQUIRED_WORLD_FILES = ['factions', 'territories'];
const VALID_LEVEL_TYPES = ['tutorial', 'standard', 'boss', 'dlc', 'event'];
const MAX_BADGE_LABEL_LENGTH = 24;

/**
 * Validate a parsed manifest object.
 * @param {object} manifest - Parsed manifest.json contents
 * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
 */
export function validateManifest(manifest) {
  const errors = [];
  const warnings = [];

  if (!manifest || typeof manifest !== 'object') {
    return { valid: false, errors: ['Manifest is not a valid JSON object.'], warnings };
  }

  // ── Required top-level fields ──
  for (const field of REQUIRED_FIELDS) {
    if (manifest[field] === undefined || manifest[field] === null) {
      errors.push(`Missing required field: "${field}"`);
    }
  }

  // ── format_version ──
  if (manifest.format_version !== undefined && manifest.format_version !== 1) {
    errors.push(`Unsupported format_version: ${manifest.format_version}. Engine supports v1.`);
  }

  // ── id validation ──
  if (manifest.id && !/^[a-z0-9][a-z0-9_-]*$/.test(manifest.id)) {
    errors.push(`ROM id "${manifest.id}" must be lowercase alphanumeric with hyphens/underscores, starting with a letter or number.`);
  }

  // ── engine compatibility ──
  if (manifest.engine) {
    if (!manifest.engine.min_version) {
      warnings.push('engine.min_version not specified. ROM may break on older engine versions.');
    }
  }

  // ── world files ──
  if (manifest.world) {
    for (const key of REQUIRED_WORLD_FILES) {
      if (!manifest.world[key]) {
        errors.push(`Missing required world file declaration: world.${key}`);
      }
    }
  }

  // ── levels ──
  if (manifest.levels) {
    if (!Array.isArray(manifest.levels) || manifest.levels.length === 0) {
      errors.push('levels must be a non-empty array.');
    } else {
      for (let i = 0; i < manifest.levels.length; i++) {
        const level = manifest.levels[i];
        if (!level.id) errors.push(`levels[${i}] missing required "id" field.`);
        if (!level.file) errors.push(`levels[${i}] missing required "file" field.`);
        if (level.type && !VALID_LEVEL_TYPES.includes(level.type)) {
          warnings.push(`levels[${i}] has unknown type "${level.type}". Valid: ${VALID_LEVEL_TYPES.join(', ')}`);
        }
      }
    }
  }

  // ── prompts ──
  if (manifest.prompts) {
    if (!manifest.prompts.system) {
      errors.push('Missing required prompt declaration: prompts.system');
    }
    if (!manifest.prompts.narrator) {
      warnings.push('prompts.narrator not specified. Engine will use default narrator voice.');
    }
  }

  // ── branding ──
  if (manifest.branding) {
    if (manifest.branding.badge_label && manifest.branding.badge_label.length > MAX_BADGE_LABEL_LENGTH) {
      errors.push(`branding.badge_label exceeds ${MAX_BADGE_LABEL_LENGTH} character limit: "${manifest.branding.badge_label}" (${manifest.branding.badge_label.length} chars)`);
    }
    if (manifest.branding.accent_color && !/^#[0-9A-Fa-f]{6}$/.test(manifest.branding.accent_color)) {
      errors.push(`branding.accent_color is not a valid hex color: "${manifest.branding.accent_color}"`);
    }
  }

  // ── ai requirements ──
  if (manifest.ai) {
    const validTiers = ['free', 'silver', 'gold', 'platinum'];
    if (manifest.ai.min_tier && !validTiers.includes(manifest.ai.min_tier)) {
      errors.push(`ai.min_tier "${manifest.ai.min_tier}" is invalid. Valid: ${validTiers.join(', ')}`);
    }
  }

  // ── extends (overlay ROM) ──
  if (manifest.extends && typeof manifest.extends !== 'string') {
    errors.push('extends must be a ROM id string (e.g., "base-chicago").');
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Check if a ROM's manifest is a DLC overlay (extends another ROM).
 * @param {object} manifest
 * @returns {boolean}
 */
export function isOverlayROM(manifest) {
  return !!manifest.extends;
}

/**
 * Get the content type badge for display purposes.
 * @param {object} manifest
 * @returns {'base' | 'dlc' | 'community' | 'edition'}
 */
export function getContentType(manifest) {
  if (manifest.extends) return 'dlc';
  if (manifest.tags?.includes('community') || manifest.id?.startsWith('@community/')) return 'community';
  if (manifest.tags?.includes('edition')) return 'edition';
  return 'base';
}
