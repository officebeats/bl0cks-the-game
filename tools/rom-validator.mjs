#!/usr/bin/env node

/**
 * BL0CKS ROM Validator
 * 
 * Validates a ROM package against the engine's expected structure.
 * Checks manifest schema, file references, level format, faction definitions,
 * and provides warnings for common mistakes.
 * 
 * Usage: node tools/rom-validator.mjs <rom-path>
 * Example: node tools/rom-validator.mjs roms/chicago
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { resolve, join, basename } from 'path';

const romPath = process.argv[2];
if (!romPath) {
  console.error('\n  Usage: node tools/rom-validator.mjs <rom-path>\n');
  process.exit(1);
}

const absPath = resolve(romPath);
if (!existsSync(absPath)) {
  console.error(`\n  ❌ ROM path not found: ${absPath}\n`);
  process.exit(1);
}

const errors = [];
const warnings = [];
const info = [];

function err(msg) { errors.push(msg); }
function warn(msg) { warnings.push(msg); }
function ok(msg) { info.push(msg); }

// ── 1. Manifest ──
const manifestPath = join(absPath, 'manifest.json');
if (!existsSync(manifestPath)) {
  err('manifest.json not found');
  printResults();
  process.exit(1);
}

let manifest;
try {
  manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
  ok('manifest.json — valid JSON');
} catch (e) {
  err(`manifest.json — invalid JSON: ${e.message}`);
  printResults();
  process.exit(1);
}

// Required fields
const requiredFields = ['format_version', 'id', 'name', 'description', 'author', 'engine', 'levels'];
for (const field of requiredFields) {
  if (manifest[field] === undefined || manifest[field] === null) {
    err(`manifest.json — missing required field: "${field}"`);
  }
}

// ID format
if (manifest.id) {
  if (manifest.id.includes('{{')) {
    warn(`manifest.json — id contains unfilled placeholder: "${manifest.id}"`);
  } else if (!/^[a-z0-9-]+$/.test(manifest.id)) {
    warn(`manifest.json — id should be kebab-case: "${manifest.id}"`);
  } else {
    ok(`manifest.json — id: "${manifest.id}"`);
  }
}

// Engine version
if (manifest.engine?.min_version) {
  ok(`manifest.json — engine min_version: ${manifest.engine.min_version}`);
} else {
  warn('manifest.json — engine.min_version not specified');
}

// ── 2. Levels ──
if (Array.isArray(manifest.levels)) {
  ok(`manifest.json — ${manifest.levels.length} level(s) declared`);
  
  const levelIds = new Set();
  for (const level of manifest.levels) {
    if (!level.id) err(`Level missing "id" field`);
    if (!level.file) err(`Level "${level.id}" missing "file" field`);
    if (!level.name) warn(`Level "${level.id}" missing "name" field`);
    if (!level.type) warn(`Level "${level.id}" missing "type" (tutorial|standard|boss)`);
    
    if (levelIds.has(level.id)) {
      err(`Duplicate level id: "${level.id}"`);
    }
    levelIds.add(level.id);

    if (level.file) {
      const levelPath = join(absPath, level.file);
      if (!existsSync(levelPath)) {
        err(`Level "${level.id}" file not found: ${level.file}`);
      } else {
        ok(`Level "${level.id}" — file exists: ${level.file}`);
        
        // Check level content for required sections
        const content = readFileSync(levelPath, 'utf-8');
        
        if (!content.includes('## Parameters') && !content.includes('## 1. Level Parameters')) {
          warn(`Level "${level.id}" — missing "## Parameters" section`);
        }
        if (!content.includes('Clock:') && !content.includes('Clock :')) {
          warn(`Level "${level.id}" — no Clock defined`);
        }
        if (!content.includes('Win Condition') && !content.includes('win condition') && !content.includes('Tutorial')) {
          warn(`Level "${level.id}" — no Win Conditions section`);
        }
        if (!content.includes('Loss Condition') && !content.includes('loss condition') && !content.includes('Tutorial')) {
          warn(`Level "${level.id}" — no Loss Conditions section`);
        }
        if (!content.includes('Starting Hand') && !content.includes('starting hand') && !content.includes('Tutorial Sequence')) {
          warn(`Level "${level.id}" — no Starting Hand section`);
        }
        
        // Check for unfilled placeholders
        const placeholders = content.match(/\{\{[A-Z_]+\}\}/g);
        if (placeholders) {
          warn(`Level "${level.id}" — ${placeholders.length} unfilled placeholder(s): ${[...new Set(placeholders)].join(', ')}`);
        }
      }
    }
  }
} else {
  err('manifest.json — "levels" must be an array');
}

// ── 3. World Files ──
if (manifest.world) {
  for (const [key, file] of Object.entries(manifest.world)) {
    if (file) {
      const worldPath = join(absPath, file);
      if (!existsSync(worldPath)) {
        err(`World file not found: ${file} (declared as "${key}")`);
      } else {
        ok(`World "${key}" — file exists: ${file}`);
        
        const content = readFileSync(worldPath, 'utf-8');
        const placeholders = content.match(/\{\{[A-Z_]+\}\}/g);
        if (placeholders) {
          warn(`World "${key}" — ${placeholders.length} unfilled placeholder(s)`);
        }
      }
    }
  }
}

// ── 4. Prompts ──
if (manifest.prompts) {
  for (const [key, file] of Object.entries(manifest.prompts)) {
    if (file && !key.startsWith('_')) {
      const promptPath = join(absPath, file);
      if (!existsSync(promptPath)) {
        err(`Prompt not found: ${file} (declared as "${key}")`);
      } else {
        const content = readFileSync(promptPath, 'utf-8');
        ok(`Prompt "${key}" — ${content.length} bytes`);
        
        if (content.length < 100) {
          warn(`Prompt "${key}" — very short (${content.length} bytes). Consider adding more detail.`);
        }
        
        const placeholders = content.match(/\{\{[A-Z_]+\}\}/g);
        if (placeholders) {
          warn(`Prompt "${key}" — ${placeholders.length} unfilled placeholder(s)`);
        }
      }
    }
  }
} else {
  warn('manifest.json — no prompts declared');
}

// ── 5. Cards ──
if (manifest.cards?.templates_dir) {
  const cardsDir = join(absPath, manifest.cards.templates_dir);
  if (!existsSync(cardsDir)) {
    warn(`Cards template directory not found: ${manifest.cards.templates_dir}`);
  } else {
    const cardFiles = readdirSync(cardsDir).filter(f => f.endsWith('.md'));
    if (cardFiles.length === 0) {
      warn('Cards template directory is empty — AI will generate all cards from scratch');
    } else {
      ok(`Cards — ${cardFiles.length} template file(s): ${cardFiles.join(', ')}`);
    }
  }
}

// ── 6. Theme ──
if (manifest.assets?.theme) {
  const themePath = join(absPath, manifest.assets.theme);
  if (!existsSync(themePath)) {
    warn(`Theme file not found: ${manifest.assets.theme}`);
  } else {
    try {
      const theme = JSON.parse(readFileSync(themePath, 'utf-8'));
      ok('Theme — valid JSON');
      
      if (!theme.palette && !theme.colors) {
        warn('Theme — no "palette" or "colors" defined');
      }
      if (!theme.factions) {
        warn('Theme — no "factions" color map defined');
      }
    } catch (e) {
      err(`Theme — invalid JSON: ${e.message}`);
    }
  }
}

// ── 7. Branding ──
if (manifest.branding) {
  if (!manifest.branding.badge_icon) warn('Branding — no badge_icon');
  if (!manifest.branding.badge_label || manifest.branding.badge_label.includes('{{')) {
    warn('Branding — badge_label not set');
  }
  if (!manifest.branding.accent_color) warn('Branding — no accent_color');
  if (!manifest.branding.splash_tagline || manifest.branding.splash_tagline.includes('{{')) {
    warn('Branding — splash_tagline not set');
  }
  
  if (manifest.branding.badge_label && !manifest.branding.badge_label.includes('{{')) {
    ok(`Branding — badge: ${manifest.branding.badge_icon || ''} ${manifest.branding.badge_label}`);
  }
}

// ── 8. DLC checks ──
if (manifest.extends) {
  ok(`DLC — extends: "${manifest.extends}"`);
  if (!manifest.branding) {
    warn('DLC ROMs should define custom branding for HUD badges');
  }
}

// ── 9. AI requirements ──
if (manifest.ai) {
  ok(`AI — min_tier: ${manifest.ai.min_tier || 'unspecified'}, budget: ${manifest.ai.context_budget || 'unspecified'}`);
}

// ── Print Results ──
printResults();

function printResults() {
  const romName = manifest?.name || basename(absPath);
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  BL0CKS ROM VALIDATOR — ${romName}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  for (const msg of info) {
    console.log(`  ✅ ${msg}`);
  }

  if (warnings.length > 0) {
    console.log('');
    for (const msg of warnings) {
      console.log(`  ⚠️  ${msg}`);
    }
  }

  if (errors.length > 0) {
    console.log('');
    for (const msg of errors) {
      console.log(`  ❌ ${msg}`);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  RESULTS: ${info.length} ok, ${warnings.length} warning(s), ${errors.length} error(s)`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (errors.length > 0) {
    process.exit(1);
  }
}
