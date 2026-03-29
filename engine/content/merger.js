/**
 * BL0CKS ROM Merger
 * 
 * Handles overlay/DLC ROMs that extend a base ROM.
 * Merging rules:
 *   - Levels: overlay levels APPEND to base level list
 *   - Prompts: overlay prompts REPLACE base prompts (key-by-key)
 *   - World: overlay world files REPLACE base world files (full world swap)
 *   - Cards: overlay card templates MERGE into base pool
 *   - Assets: overlay theme REPLACES base theme; audio MERGES
 *   - Branding: overlay branding REPLACES base branding during DLC play
 */

/**
 * Merge an overlay ROM's content into a base ROM's content.
 * @param {object} baseContent - Loaded base ROM content
 * @param {object} overlayContent - Loaded overlay ROM content
 * @param {object} overlayManifest - The overlay's manifest
 * @returns {object} Merged ROM content
 */
export function mergeROMs(baseContent, overlayContent, overlayManifest) {
  const merged = {
    ...baseContent,
    _overlays: [...(baseContent._overlays || [])],
  };

  // Track this overlay
  merged._overlays.push({
    id: overlayManifest.id,
    name: overlayManifest.name,
    author: overlayManifest.author,
    type: overlayManifest.extends ? 'dlc' : 'community',
    branding: overlayManifest.branding || null,
  });

  // ── Levels: Append ──
  if (overlayContent.levels && overlayContent.levels.length > 0) {
    merged.levels = [...merged.levels, ...overlayContent.levels.map(l => ({
      ...l,
      _sourceROM: overlayManifest.id,
      _isDLC: true,
    }))];
  }

  // ── Prompts: Replace (key-by-key) ──
  if (overlayContent.prompts) {
    merged.prompts = { ...merged.prompts };
    for (const [key, value] of Object.entries(overlayContent.prompts)) {
      if (value) {
        merged.prompts[key] = value;
        merged.prompts[`_${key}_source`] = overlayManifest.id;
      }
    }
  }

  // ── World: Replace (full swap if declared) ──
  if (overlayContent.world && Object.keys(overlayContent.world).length > 0) {
    merged.world = { ...merged.world, ...overlayContent.world };
  }

  // ── Theme: Replace if overlay has one ──
  if (overlayContent.assets?.theme) {
    merged.assets = { ...merged.assets, theme: overlayContent.assets.theme };
  }

  return merged;
}

/**
 * Tag level entries with their source ROM for HUD display.
 * @param {object} level - A loaded level entry
 * @param {string} romId - The ROM id this level came from
 * @returns {object} Level entry with source metadata
 */
export function tagLevelSource(level, romId) {
  return {
    ...level,
    _sourceROM: romId,
    _isDLC: true,
  };
}
