#!/usr/bin/env node

/**
 * BL0CKS ROM Validator — Standalone Tool
 * 
 * Usage: node tools/rom-validator.mjs <path-to-rom>
 * 
 * Validates a ROM directory against the manifest spec:
 *   1. Parses manifest.json
 *   2. Validates schema
 *   3. Resolves all declared files
 *   4. Validates content integrity
 */

import { resolve, join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadROM } from '../engine/content/loader.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENGINE_ROOT = join(__dirname, '..', 'engine');

const RED = '\x1b[38;2;220;50;47m';
const GREEN = '\x1b[38;2;46;204;113m';
const GOLD = '\x1b[38;2;255;200;40m';
const GRAY = '\x1b[38;2;100;100;110m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

async function main() {
  const target = process.argv[2] || '.';
  const romPath = resolve(target);

  console.log(`\n  ${BOLD}BL0CKS ROM Validator${RESET}`);
  console.log(`  ${GRAY}${'─'.repeat(40)}${RESET}`);
  console.log(`  ${GRAY}Path: ${romPath}${RESET}\n`);

  const result = await loadROM(romPath, ENGINE_ROOT);

  // Errors
  if (result.errors.length > 0) {
    console.log(`  ${RED}${BOLD}ERRORS:${RESET}`);
    for (const err of result.errors) {
      console.log(`    ${RED}✗${RESET} ${err}`);
    }
    console.log('');
  }

  // Warnings
  if (result.warnings.length > 0) {
    console.log(`  ${GOLD}${BOLD}WARNINGS:${RESET}`);
    for (const warn of result.warnings) {
      console.log(`    ${GOLD}⚠${RESET} ${warn}`);
    }
    console.log('');
  }

  // Result
  if (result.rom) {
    const info = result.info;
    console.log(`  ${GREEN}${BOLD}✓ ROM is valid${RESET}`);
    console.log(`  ${GRAY}${'─'.repeat(40)}${RESET}`);
    console.log(`  ${GRAY}ID:${RESET}      ${info.base.id}`);
    console.log(`  ${GRAY}Name:${RESET}    ${info.base.name}`);
    console.log(`  ${GRAY}Author:${RESET}  ${info.base.author}`);
    console.log(`  ${GRAY}Version:${RESET} ${info.base.version}`);
    console.log(`  ${GRAY}Type:${RESET}    ${info.base.contentType}`);
    console.log(`  ${GRAY}Levels:${RESET}  ${info.levelCount}`);
    if (info.dlcLevelCount > 0) {
      console.log(`  ${GOLD}DLC:${RESET}     ${info.dlcLevelCount} DLC levels`);
    }
    console.log(`  ${GRAY}Branding:${RESET} ${info.branding.badge_icon} ${info.branding.badge_label}`);
    console.log(`  ${GRAY}Tagline:${RESET} "${info.branding.splash_tagline}"`);
    console.log('');
    process.exit(0);
  } else {
    console.log(`  ${RED}${BOLD}✗ ROM is invalid${RESET}\n`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error(`\n  ${RED}Fatal: ${err.message}${RESET}\n`);
  process.exit(1);
});
