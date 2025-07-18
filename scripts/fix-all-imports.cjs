#!/usr/bin/env node

/**
 * Comprehensive Import Fix Script
 * Fixes all remaining import alias issues across the codebase
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

const SRC_DIR = path.resolve(__dirname, '../src');

// Comprehensive mapping of old aliases to new ones
const ALIAS_REPLACEMENTS = {
  // Old domain aliases
  '@admin/': '@/domains/admin/',
  '@ai/': '@/domains/ai/',
  '@analytics/': '@/domains/analytics/',
  '@assessment/': '@/domains/assessment/',
  '@automation/': '@/domains/automation/',
  '@billing/': '@/domains/billing/',
  '@chat/': '@/domains/chat/',
  '@core/': '@/core/',
  '@dashboard/': '@/domains/dashboard/',
  '@departments/': '@/domains/departments/',
  '@help-center/': '@/domains/help-center/',
  '@inbox/': '@/domains/inbox/',
  '@integrations/': '@/domains/integrations/',
  '@knowledge/': '@/domains/knowledge/',
  '@marketplace/': '@/domains/marketplace/',
  '@onboarding/': '@/domains/onboarding/',
  '@operations/': '@/domains/operations/',
  '@org/': '@/domains/org/',
  '@sales/': '@/domains/sales/',
  '@workspace/': '@/domains/workspace/',
  
  // Old shared aliases
  '@shared/': '@/shared/',
  '@shared/shared/': '@/shared/',
  
  // Old app aliases
  '@app/': '@/app/',
  
  // Old feature aliases
  '@features/': '@/shared/features/',
  
  // Old user aliases
  '@user/': '@/domains/admin/user/',
  
  // Old billing aliases (already defined above)
};

function fixImportsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Apply all alias replacements
  for (const [oldAlias, newAlias] of Object.entries(ALIAS_REPLACEMENTS)) {
    const regex = new RegExp(`import\\s+([^'"]*)\\s+from\\s+['"]${oldAlias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^'"]*)['"]`, 'g');
    const matches = content.match(regex);
    if (matches) {
      content = content.replace(regex, `import $1 from '${newAlias}$2'`);
      changed = true;
    }
    
    // Also fix dynamic imports
    const dynamicRegex = new RegExp(`import\\s*\\(\\s*['"]${oldAlias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^'"]*)['"]\\s*\\)`, 'g');
    const dynamicMatches = content.match(dynamicRegex);
    if (dynamicMatches) {
      content = content.replace(dynamicRegex, `import('${newAlias}$1')`);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated imports in: ${filePath}`);
  }
}

async function main() {
  console.log('🔧 Fixing all import aliases...\n');
  
  try {
    const files = await glob(path.join(SRC_DIR, '**/*.{ts,tsx}'), {
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
    });
    
    let updatedFiles = 0;
    
    for (const file of files) {
      const originalContent = fs.readFileSync(file, 'utf8');
      fixImportsInFile(file);
      
      // Check if file was actually changed
      const newContent = fs.readFileSync(file, 'utf8');
      if (originalContent !== newContent) {
        updatedFiles++;
      }
    }
    
    console.log(`\n✅ Import fix complete!`);
    console.log(`📊 Files processed: ${files.length}`);
    console.log(`📝 Files updated: ${updatedFiles}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { fixImportsInFile, ALIAS_REPLACEMENTS }; 