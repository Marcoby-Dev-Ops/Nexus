#!/usr/bin/env node
/**
 * migrate-to-domains-structure.js
 *
 * Moves business domains, platform code, shared UI, and ambiguous code to the new Nexus structure.
 * Prints out each move for review. Does not update imports (for safety).
 *
 * Usage: node migrate-to-domains-structure.js
 */

const fs = require('fs-extra');
const path = require('path');

const ROOT = path.resolve(__dirname, 'src');
const DOMAINS = [
  'user', 'ai', 'analytics', 'assessment', 'automation', 'admin', 'dashboard', 'departments',
  'help-center', 'integrations', 'knowledge', 'marketplace', 'onboarding', 'workspace', 'inbox',
  'billing', 'operations', 'org', 'notifications'
];
const CORE = ['auth', 'config', 'constants', 'types', 'services'];
const SHARED = ['assets', 'components', 'hooks', 'layouts', 'stories', 'utils'];
const ARCHIVE = ['features'];

function moveDir(src, dest) {
  if (fs.existsSync(src)) {
    fs.mkdirpSync(path.dirname(dest));
    fs.moveSync(src, dest, { overwrite: false });
    console.log(`Moved: ${src} -> ${dest}`);
  }
}

// 1. Move business domains to src/domains/
for (const domain of DOMAINS) {
  const srcPath = path.join(ROOT, domain);
  const destPath = path.join(ROOT, 'domains', domain);
  moveDir(srcPath, destPath);
}

// 2. Move platform/core code to src/core/
for (const core of CORE) {
  const srcPath = path.join(ROOT, core);
  const destPath = path.join(ROOT, 'core', core);
  moveDir(srcPath, destPath);
}

// 3. Move shared UI/utils to src/shared/
for (const shared of SHARED) {
  const srcPath = path.join(ROOT, shared);
  const destPath = path.join(ROOT, 'shared', shared);
  moveDir(srcPath, destPath);
}

// 4. Move ambiguous/legacy code to src/archive/features/
for (const arch of ARCHIVE) {
  const srcPath = path.join(ROOT, arch);
  const destPath = path.join(ROOT, 'archive', 'features', arch);
  moveDir(srcPath, destPath);
}

console.log('\nMigration complete! Review the moves above. Update your import paths and aliases as needed.'); 