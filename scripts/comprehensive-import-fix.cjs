#!/usr/bin/env node

/**
 * Comprehensive Import Fix Script
 * Fixes all import alias issues across the codebase with correct folder structure
 * 
 * Usage: node scripts/comprehensive-import-fix.cjs [--dry-run]
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

const SRC_DIR = path.resolve(__dirname, '../src');

// Correct mapping based on actual folder structure
const ALIAS_REPLACEMENTS = {
  // Core aliases
  '@core/': '@/core/',
  '@core/supabase': '@/core/supabase',
  '@core/environment': '@/core/environment',
  '@core/auth/': '@/core/auth/',
  '@core/hooks/': '@/core/hooks/',
  '@core/services/': '@/core/services/',
  '@core/constants/': '@/core/constants/',
  '@core/types/': '@/core/types/',
  
  // Domain aliases (correct structure)
  '@domains/': '@/domains/',
  '@domains/admin/': '@/domains/admin/',
  '@domains/ai/': '@/domains/ai/',
  '@domains/analytics/': '@/domains/analytics/',
  '@domains/automation/': '@/domains/automation/',
  '@domains/dashboard/': '@/domains/dashboard/',
  '@domains/integrations/': '@/domains/integrations/',
  '@domains/knowledge/': '@/domains/knowledge/',
  '@domains/marketplace/': '@/domains/marketplace/',
  '@domains/workspace/': '@/domains/workspace/',
  '@domains/help-center/': '@/domains/help-center/',
  '@domains/departments/': '@/domains/departments/',
  
  // Shared aliases
  '@shared/': '@/shared/',
  '@shared/components/': '@/shared/components/',
  '@shared/hooks/': '@/shared/hooks/',
  '@shared/services/': '@/shared/services/',
  '@shared/utils/': '@/shared/utils/',
  '@shared/stores/': '@/shared/stores/',
  '@shared/assets/': '@/shared/assets/',
  '@shared/callbacks/': '@/shared/callbacks/',
  '@shared/layouts/': '@/shared/layouts/',
  '@shared/pages/': '@/shared/pages/',
  '@shared/lib/': '@/shared/lib/',
  
  // App aliases
  '@app/': '@/app/',
  
  // Old incorrect aliases to fix
  '@/integrations/': '@/domains/integrations/',
  '@/shared/integrations/': '@/domains/integrations/',
  '@/features/integrations/': '@/domains/integrations/',
  '@/components/integrations/': '@/domains/integrations/components/',
  
  // Old domain aliases
  '@admin/': '@/domains/admin/',
  '@ai/': '@/domains/ai/',
  '@analytics/': '@/domains/analytics/',
  '@automation/': '@/domains/automation/',
  '@dashboard/': '@/domains/dashboard/',
  '@knowledge/': '@/domains/knowledge/',
  '@marketplace/': '@/domains/marketplace/',
  '@workspace/': '@/domains/workspace/',
  '@help-center/': '@/domains/help-center/',
  '@departments/': '@/domains/departments/',
  
  // Old shared aliases
  '@components/': '@/shared/components/',
  '@hooks/': '@/shared/hooks/',
  '@services/': '@/shared/services/',
  '@utils/': '@/shared/utils/',
  '@stores/': '@/shared/stores/',
  '@assets/': '@/shared/assets/',
  '@callbacks/': '@/shared/callbacks/',
  '@layouts/': '@/shared/layouts/',
  '@pages/': '@/shared/pages/',
  '@lib/': '@/shared/lib/',
  
  // Old feature aliases
  '@features/': '@/shared/features/',
  '@shared/features/': '@/shared/features/',
  
  // Old user aliases
  '@user/': '@/domains/admin/user/',
  '@admin/user/': '@/domains/admin/user/',
  
  // Old billing aliases
  '@billing/': '@/domains/admin/billing/',
  '@admin/billing/': '@/domains/admin/billing/',
  
  // Old org aliases
  '@org/': '@/domains/admin/org/',
  '@admin/org/': '@/domains/admin/org/',
  
  // Old onboarding aliases
  '@onboarding/': '@/domains/admin/onboarding/',
  '@admin/onboarding/': '@/domains/admin/onboarding/',
  
  // Old assessment aliases
  '@assessment/': '@/domains/assessment/',
  
  // Old inbox aliases
  '@inbox/': '@/domains/inbox/',
  
  // Old services aliases
  '@services/': '@/domains/services/',
  
  // Old hooks aliases
  '@hooks/': '@/domains/hooks/',
  
  // Old components aliases
  '@components/': '@/domains/components/',
  
  // Old pages aliases
  '@pages/': '@/domains/pages/',
};

// Specific file path corrections
const FILE_PATH_CORRECTIONS = {
  // Integration-related files
  '@/shared/integrations/': '@/domains/integrations/',
  '@/shared/features/integrations/': '@/domains/integrations/features/',
  '@/shared/components/integrations/': '@/domains/integrations/components/',
  '@/shared/services/integrations/': '@/domains/integrations/services/',
  '@/shared/hooks/integrations/': '@/domains/integrations/hooks/',
  
  // AI-related files
  '@/shared/ai/': '@/domains/ai/',
  '@/shared/features/ai/': '@/domains/ai/features/',
  '@/shared/components/ai/': '@/domains/ai/components/',
  '@/shared/services/ai/': '@/domains/ai/services/',
  '@/shared/hooks/ai/': '@/domains/ai/hooks/',
  
  // Analytics-related files
  '@/shared/analytics/': '@/domains/analytics/',
  '@/shared/features/analytics/': '@/domains/analytics/features/',
  '@/shared/components/analytics/': '@/domains/analytics/components/',
  '@/shared/services/analytics/': '@/domains/analytics/services/',
  '@/shared/hooks/analytics/': '@/domains/analytics/hooks/',
  
  // Dashboard-related files
  '@/shared/dashboard/': '@/domains/dashboard/',
  '@/shared/features/dashboard/': '@/domains/dashboard/features/',
  '@/shared/components/dashboard/': '@/domains/dashboard/components/',
  '@/shared/services/dashboard/': '@/domains/dashboard/services/',
  '@/shared/hooks/dashboard/': '@/domains/dashboard/hooks/',
  
  // Workspace-related files
  '@/shared/workspace/': '@/domains/workspace/',
  '@/shared/features/workspace/': '@/domains/workspace/features/',
  '@/shared/components/workspace/': '@/domains/workspace/components/',
  '@/shared/services/workspace/': '@/domains/workspace/services/',
  '@/shared/hooks/workspace/': '@/domains/workspace/hooks/',
  
  // Knowledge-related files
  '@/shared/knowledge/': '@/domains/knowledge/',
  '@/shared/features/knowledge/': '@/domains/knowledge/features/',
  '@/shared/components/knowledge/': '@/domains/knowledge/components/',
  '@/shared/services/knowledge/': '@/domains/knowledge/services/',
  '@/shared/hooks/knowledge/': '@/domains/knowledge/hooks/',
  
  // Admin-related files
  '@/shared/admin/': '@/domains/admin/',
  '@/shared/features/admin/': '@/domains/admin/features/',
  '@/shared/components/admin/': '@/domains/admin/components/',
  '@/shared/services/admin/': '@/domains/admin/services/',
  '@/shared/hooks/admin/': '@/domains/admin/hooks/',
  
  // User-related files
  '@/shared/user/': '@/domains/admin/user/',
  '@/shared/features/user/': '@/domains/admin/user/features/',
  '@/shared/components/user/': '@/domains/admin/user/components/',
  '@/shared/services/user/': '@/domains/admin/user/services/',
  '@/shared/hooks/user/': '@/domains/admin/user/hooks/',
  
  // Billing-related files
  '@/shared/billing/': '@/domains/admin/billing/',
  '@/shared/features/billing/': '@/domains/admin/billing/features/',
  '@/shared/components/billing/': '@/domains/admin/billing/components/',
  '@/shared/services/billing/': '@/domains/admin/billing/services/',
  '@/shared/hooks/billing/': '@/domains/admin/billing/hooks/',
  
  // Org-related files
  '@/shared/org/': '@/domains/admin/org/',
  '@/shared/features/org/': '@/domains/admin/org/features/',
  '@/shared/components/org/': '@/domains/admin/org/components/',
  '@/shared/services/org/': '@/domains/admin/org/services/',
  '@/shared/hooks/org/': '@/domains/admin/org/hooks/',
  
  // Onboarding-related files
  '@/shared/onboarding/': '@/domains/admin/onboarding/',
  '@/shared/features/onboarding/': '@/domains/admin/onboarding/features/',
  '@/shared/components/onboarding/': '@/domains/admin/onboarding/components/',
  '@/shared/services/onboarding/': '@/domains/admin/onboarding/services/',
  '@/shared/hooks/onboarding/': '@/domains/admin/onboarding/hooks/',
  
  // Assessment-related files
  '@/shared/assessment/': '@/domains/assessment/',
  '@/shared/features/assessment/': '@/domains/assessment/features/',
  '@/shared/components/assessment/': '@/domains/assessment/components/',
  '@/shared/services/assessment/': '@/domains/assessment/services/',
  '@/shared/hooks/assessment/': '@/domains/assessment/hooks/',
  
  // Inbox-related files
  '@/shared/inbox/': '@/domains/inbox/',
  '@/shared/features/inbox/': '@/domains/inbox/features/',
  '@/shared/components/inbox/': '@/domains/inbox/components/',
  '@/shared/services/inbox/': '@/domains/inbox/services/',
  '@/shared/hooks/inbox/': '@/domains/inbox/hooks/',
  
  // Services-related files
  '@/shared/services/': '@/domains/services/',
  '@/shared/features/services/': '@/domains/services/features/',
  '@/shared/components/services/': '@/domains/services/components/',
  '@/shared/hooks/services/': '@/domains/services/hooks/',
  
  // Hooks-related files
  '@/shared/hooks/': '@/domains/hooks/',
  '@/shared/features/hooks/': '@/domains/hooks/features/',
  '@/shared/components/hooks/': '@/domains/hooks/components/',
  '@/shared/services/hooks/': '@/domains/hooks/services/',
  
  // Components-related files
  '@/shared/components/': '@/domains/components/',
  '@/shared/features/components/': '@/domains/components/features/',
  '@/shared/services/components/': '@/domains/components/services/',
  '@/shared/hooks/components/': '@/domains/components/hooks/',
  
  // Pages-related files
  '@/shared/pages/': '@/domains/pages/',
  '@/shared/features/pages/': '@/domains/pages/features/',
  '@/shared/components/pages/': '@/domains/pages/components/',
  '@/shared/services/pages/': '@/domains/pages/services/',
  '@/shared/hooks/pages/': '@/domains/pages/hooks/',
};

function fixImportsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Apply alias replacements
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

  // Apply file path corrections
  for (const [oldPath, newPath] of Object.entries(FILE_PATH_CORRECTIONS)) {
    const regex = new RegExp(`import\\s+([^'"]*)\\s+from\\s+['"]${oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^'"]*)['"]`, 'g');
    const matches = content.match(regex);
    if (matches) {
      content = content.replace(regex, `import $1 from '${newPath}$2'`);
      changed = true;
    }
    
    // Also fix dynamic imports
    const dynamicRegex = new RegExp(`import\\s*\\(\\s*['"]${oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^'"]*)['"]\\s*\\)`, 'g');
    const dynamicMatches = content.match(dynamicRegex);
    if (dynamicMatches) {
      content = content.replace(dynamicRegex, `import('${newPath}$1')`);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated imports in: ${filePath}`);
  }
}

async function main() {
  console.log('🔧 Fixing all import aliases with correct folder structure...\n');
  
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  
  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No files will be modified\n');
  }
  
  try {
    const files = await glob(path.join(SRC_DIR, '**/*.{ts,tsx}'), {
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/archive/**']
    });
    
    let updatedFiles = 0;
    
    for (const file of files) {
      const originalContent = fs.readFileSync(file, 'utf8');
      
      if (!dryRun) {
        fixImportsInFile(file);
      }
      
      // Check if file was actually changed
      const newContent = fs.readFileSync(file, 'utf8');
      if (originalContent !== newContent) {
        updatedFiles++;
      }
    }
    
    console.log(`\n✅ Import fix complete!`);
    console.log(`📊 Files processed: ${files.length}`);
    console.log(`📝 Files updated: ${updatedFiles}`);
    
    if (dryRun) {
      console.log('\n💡 Run without --dry-run to apply these changes');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { fixImportsInFile, ALIAS_REPLACEMENTS, FILE_PATH_CORRECTIONS }; 