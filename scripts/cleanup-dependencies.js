#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Packages that are definitely unused and can be removed
const UNUSED_PACKAGES = [
  '@azure/msal-browser',
  '@microsoft/mgt-components',
  '@microsoft/mgt-element', 
  '@microsoft/mgt-msal2-provider',
  '@microsoft/mgt-react',
  'react-hot-toast', // replaced by sonner
  'supabase', // CLI package, not needed in dependencies
];

// Packages that might be unused (need verification)
const POTENTIALLY_UNUSED = [
  'brace-expansion',
  'chalk',
  'fs-extra',
  'glob',
  'pino',
  'prop-types',
  'react-helmet-async',
  'react-use',
  'react-virtualized-auto-sizer',
  'react-window',
  'recharts',
  'rehype-highlight',
  'rehype-raw',
  'remark-gfm',
  'ts-morph',
  'vaul',
  'yargs',
];

console.log('🧹 Dependency Cleanup Script');
console.log('============================');

// Check if packages are actually used
function checkPackageUsage(packageName) {
  try {
    const result = execSync(`grep -r "from ['\"]${packageName}" src/ || grep -r "import.*${packageName}" src/ || grep -r "require.*${packageName}" src/`, { 
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore']
    });
    return result.trim().length > 0;
  } catch {
    return false;
  }
}

console.log('\n📦 Checking for unused packages...');

// Check definitely unused packages
console.log('\n❌ Definitely unused packages:');
UNUSED_PACKAGES.forEach(pkg => {
  const isUsed = checkPackageUsage(pkg);
  if (!isUsed) {
    console.log(`  - ${pkg} (not found in codebase)`);
  } else {
    console.log(`  - ${pkg} (FOUND - might be used)`);
  }
});

// Check potentially unused packages
console.log('\n⚠️ Potentially unused packages (verify before removing):');
POTENTIALLY_UNUSED.forEach(pkg => {
  const isUsed = checkPackageUsage(pkg);
  if (!isUsed) {
    console.log(`  - ${pkg} (not found in codebase)`);
  } else {
    console.log(`  - ${pkg} (FOUND - might be used)`);
  }
});

console.log('\n🔧 Recommendations:');
console.log('1. Remove definitely unused packages:');
UNUSED_PACKAGES.forEach(pkg => {
  console.log(`   pnpm remove ${pkg}`);
});

console.log('\n2. Consider removing potentially unused packages after verification');
console.log('\n3. Run "pnpm install" after removing packages');

console.log('\n📊 Summary:');
console.log(`- ${UNUSED_PACKAGES.length} definitely unused packages`);
console.log(`- ${POTENTIALLY_UNUSED.length} potentially unused packages`);
console.log('- Run "pnpm install" to clean up node_modules after removing packages'); 