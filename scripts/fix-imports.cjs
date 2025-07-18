#!/usr/bin/env node
/**
 * fix-imports.js
 *
 * Batch-rewrites old feature import paths to new @core/* and @core/auth/* aliases across the codebase.
 *
 * Usage:
 *   node fix-imports.js
 */

const fs = require('fs');
const path = require('path');

const exts = ['.ts', '.tsx', '.js', '.jsx'];
const root = path.resolve(__dirname, '../src');

// Map old import path (as substring) to new import path
const REPLACEMENTS = [
  // Core
  ['@/features/core/supabase', '@core/supabase'],
  ['@/features/core/backendConnector', '@core/backendConnector'],
  ['@/features/core/environment', '@core/environment'],
  // Security
  ['@/features/security/secureStorage', '@core/auth/secureStorage'],
  ['@/features/security/logger', '@core/auth/logger'],
  // Services
  ['@/features/services/dataService', '@core/dataService'],
  ['@/features/services/billingService', '@core/billingService'],
  ['@/features/services/googlePlacesService', '@core/googlePlacesService'],
  ['@/features/services/slashCommandService', '@core/slashCommandService'],
  // General
  ['@/features/core/', '@core/'],
  ['@/features/security/', '@core/auth/'],
  ['@/features/services/', '@core/'],
];

function walk(dir, callback) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, callback);
    } else if (exts.includes(path.extname(entry.name))) {
      callback(full);
    }
  });
}

let changed = 0;
walk(root, (file) => {
  let src = fs.readFileSync(file, 'utf8');
  let orig = src;
  for (const [from, to] of REPLACEMENTS) {
    src = src.split(from).join(to);
  }
  if (src !== orig) {
    fs.writeFileSync(file, src, 'utf8');
    console.log(`✔️  Updated imports in ${file}`);
    changed++;
  }
});

console.log(`\n✅ Import path fix complete. ${changed} files updated.`); 