#!/usr/bin/env node
/**
 * scan-models.cjs — temporary stub
 * ---------------------------------
 * Intended to integrate ProtectAI modelscan once models exist.
 * For now, the script searches for serialized model files (*.pkl, *.h5, *.sav, *.pt)
 * under the `models/` and `supabase/` directories. If none are found it exits 0.
 * If files are present, it warns that scanning is not yet implemented and exits 1
 * so CI will remind us to wire in modelscan.
 */

const { execSync } = require('child_process');
const { globSync } = require('glob');
const path = require('path');

const patterns = [
  'models/**/*.{pkl,h5,pt,sav}',
  'supabase/**/*.{pkl,h5,pt,sav}',
];

const matches = patterns.flatMap((p) => globSync(p, { nodir: true }));

if (matches.length === 0) {
  console.log('🛡️  scan-models: No serialized model files found – skipping.');
  process.exit(0);
}

console.warn('⚠️  scan-models: Model files detected, running ProtectAI modelscan...');
console.warn('Files:', matches.map((m) => path.relative(process.cwd(), m)).join(', '));

try {
  // Check if modelscan is available
  execSync('pipx run modelscan --version', { stdio: 'pipe' });
  
  // Run modelscan on detected files
  const scanCommand = `pipx run modelscan ${matches.join(' ')}`;
  console.log('Running:', scanCommand);
  
  execSync(scanCommand, { stdio: 'inherit' });
  console.log('✅ scan-models: All model files passed security scan.');
  process.exit(0);
} catch (error) {
  console.error('❌ scan-models: Security scan failed or modelscan not available.');
  console.error('Error:', error.message);
  console.error('Install with: pipx install modelscan');
  process.exit(1);
} 