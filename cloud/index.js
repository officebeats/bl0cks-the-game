/**
 * BL0CKS Cloud Module
 * 
 * Placeholder for Phase 3+ implementation.
 * 
 * Planned features:
 *   - ROM market registry (publish, discover, install community ROMs)
 *   - Leaderboard submissions (score, ROM id, edition)
 *   - Edition validation (JWT-based key → tier detection)
 *   - Cloud save sync
 */

export class BL0CKSCloud {
  constructor(baseUrl = 'https://api.bl0cks.game') {
    this.baseUrl = baseUrl;
  }

  async submitScore(/* score, romId, editionKey */) {
    throw new Error('Cloud module not yet implemented. Coming in v2.1.');
  }

  async fetchROMs(/* query */) {
    throw new Error('Cloud module not yet implemented. Coming in v2.1.');
  }

  async publishROM(/* romPath, authToken */) {
    throw new Error('Cloud module not yet implemented. Coming in v2.1.');
  }
}
