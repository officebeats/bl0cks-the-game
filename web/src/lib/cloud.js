import { A } from './renderer.js';

function getCloudConfig() {
  return null;
}

/**
 * MARKETPLACE API
 */

// Simulated or Real Fetch of Community Packs
export async function fetchPacks() {
  const cloud = getCloudConfig();
  
  if (!cloud) {
    // If no backend is configured yet, mock a response to demonstrate the UI
    return [
      {
        pack_id: '@community/miami-vice',
        title: 'Miami Vice: 1984',
        author: 'neon_rider',
        description: 'Trade the cold Chicago wind for neon lights. Cartel mechanics.',
        downloads: 1402
      },
      {
        pack_id: '@community/cyberpunk-corp',
        title: 'Neon Megacorp',
        author: 'glitch22',
        description: 'Corp factions. Netrunner move cards. High lethality.',
        downloads: 853
      }
    ];
  }

  // Real Supabase REST API Call
  const response = await fetch(`${cloud.url}/rest/v1/packs?select=*&order=downloads.desc`, {
    headers: { 'apikey': cloud.key, 'Authorization': `Bearer ${cloud.key}` }
  });
  if (!response.ok) throw new Error('Failed to fetch marketplace packs.');
  return await response.json();
}

// Download and install a pack to ~/.bl0cks/packs
export async function installPack(packId) {
  mkdirSync(PACKS_DIR, { recursive: true });
  const packFolder = join(PACKS_DIR, packId.replace(/[^a-zA-Z0-9_-]/g, '_'));
  mkdirSync(packFolder, { recursive: true });

  const cloud = getCloudConfig();
  let markdownContent = '';

  if (!cloud) {
    // Mock download
    console.log(`  ${A.dim}Connecting to peer network for ${packId}...${A.reset}`);
    await new Promise(r => setTimeout(r, 1500)); // Simulate download time
    markdownContent = `# ${packId.toUpperCase()}\n\n<!-- Simulated custom level downloaded from marketplace -->\n[Level logic goes here]`;
  } else {
    // Real download logic here (ping storage URL or database snippet)
    // For this boilerplate, assuming we pull raw markdown from a specific Supabase storage bucket
    const url = `${cloud.url}/storage/v1/object/public/packs/${packId}.md`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Could not locate ${packId} on server.`);
    markdownContent = await response.text();
  }

  // Save the main level file
  const destFile = join(packFolder, 'level_01.md');
  writeFileSync(destFile, markdownContent);
  return destFile;
}

/**
 * LEADERBOARD API
 */

export async function fetchLeaderboard(packId = 'base-chicago') {
  const cloud = getCloudConfig();
  
  if (!cloud) {
    // Mock leaderboard
    return [
      { player_alias: 'GhostDog', score_total: 14200, territories_held: 5, run_date: '2026-03-27' },
      { player_alias: 'StringerB', score_total: 13800, territories_held: 4, run_date: '2026-03-26' },
      { player_alias: 'AvonBP',   score_total: 12100, territories_held: 3, run_date: '2026-03-28' },
    ];
  }

  const response = await fetch(`${cloud.url}/rest/v1/leaderboards?pack_id=eq.${packId}&select=*&order=score_total.desc&limit=10`, {
    headers: { 'apikey': cloud.key, 'Authorization': `Bearer ${cloud.key}` }
  });
  if (!response.ok) throw new Error('Failed to fetch leaderboard.');
  return await response.json();
}

export async function submitScore(packId, playerAlias, scoreData) {
  const cloud = getCloudConfig();
  if (!cloud) return; // Silent return if not connected

  const payload = {
    player_alias: playerAlias,
    pack_id: packId,
    level_name: scoreData.levelName,
    score_total: scoreData.total,
    ticks_remaining: scoreData.ticks,
    territories_held: scoreData.territories,
    loyalty_avg: scoreData.loyalty
  };

  await fetch(`${cloud.url}/rest/v1/leaderboards`, {
    method: 'POST',
    headers: { 
      'apikey': cloud.key, 
      'Authorization': `Bearer ${cloud.key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  }).catch(() => { /* Silent fail to not interupt user experience */ });
}
