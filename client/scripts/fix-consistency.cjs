#!/usr/bin/env node

/**
 * Enhanced Consistency Fix Script
 * 
 * Automatically fixes common consistency issues found by the analysis script
 * Enhanced to handle the 80 remaining issues identified in the consistency report
 * Usage: node scripts/fix-consistency.cjs
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

// Configuration
const CONFIG = {
  sourceDir: 'src',
  excludePatterns: ['**/*.test.tsx', '**/__snapshots__/**', '**/node_modules/**'],
  includePatterns: ['**/*.tsx', '**/*.ts'],
  backupDir: 'backups'
};

// Enhanced color mappings covering all remaining issues
const COLOR_MAPPINGS = {
  // Background colors - existing
  'bg-gray-50': 'bg-background',
  'bg-gray-100': 'bg-muted',
  'bg-gray-900': 'bg-background',
  'bg-white': 'bg-card',
  'bg-blue-50': 'bg-primary/5',
  'bg-blue-100': 'bg-primary/10',
  'bg-blue-600': 'bg-primary',
  'bg-blue-700': 'bg-primary/90',
  'bg-green-50': 'bg-success/5',
  'bg-green-100': 'bg-success/10',
  'bg-green-500': 'bg-success',
  'bg-red-50': 'bg-destructive/5',
  'bg-red-100': 'bg-destructive/10',
  'bg-red-500': 'bg-destructive',
  'bg-yellow-50': 'bg-warning/5',
  'bg-yellow-100': 'bg-warning/10',
  'bg-yellow-500': 'bg-warning',
  'bg-purple-50': 'bg-secondary/5',
  'bg-purple-100': 'bg-secondary/10',
  'bg-purple-600': 'bg-secondary',
  
  // NEW: Additional background colors from remaining issues
  'bg-blue-500': 'bg-primary',
  'bg-indigo-500': 'bg-primary',
  'bg-indigo-600': 'bg-primary',
  'bg-indigo-50': 'bg-primary/5',
  'bg-emerald-500': 'bg-success',
  'bg-emerald-600': 'bg-success',
  'bg-orange-500': 'bg-warning',
  'bg-amber-600': 'bg-warning',
  'bg-rose-500': 'bg-destructive',
  'bg-red-600': 'bg-destructive',
  'bg-slate-100': 'bg-muted',
  'bg-slate-800': 'bg-background',
  'bg-slate-900': 'bg-background',
  'bg-gray-800': 'bg-background',
  
  // Text colors - existing  
  'text-gray-900': 'text-foreground',
  'text-gray-800': 'text-foreground',
  'text-gray-700': 'text-foreground/90',
  'text-gray-600': 'text-muted-foreground',
  'text-gray-500': 'text-muted-foreground',
  'text-gray-400': 'text-muted-foreground',
  'text-gray-300': 'text-muted-foreground/60',
  'text-white': 'text-primary-foreground',
  'text-blue-600': 'text-primary',
  'text-blue-500': 'text-primary',
  'text-green-600': 'text-success',
  'text-green-500': 'text-success',
  'text-red-600': 'text-destructive',
  'text-red-500': 'text-destructive',
  'text-yellow-600': 'text-warning',
  'text-yellow-500': 'text-warning',
  'text-purple-600': 'text-secondary',
  'text-purple-500': 'text-secondary',
  
  // NEW: Additional text colors from remaining issues
  'text-blue-700': 'text-primary',
  'text-blue-800': 'text-primary',
  'text-indigo-600': 'text-primary',
  'text-indigo-700': 'text-primary',
  'text-green-700': 'text-success',
  'text-green-800': 'text-success',
  'text-emerald-600': 'text-success',
  'text-red-700': 'text-destructive',
  'text-red-800': 'text-destructive',
  'text-orange-600': 'text-warning',
  'text-orange-700': 'text-warning',
  'text-amber-600': 'text-warning',
  'text-slate-600': 'text-muted-foreground',
  'text-slate-500': 'text-muted-foreground',
  'text-slate-400': 'text-muted-foreground',
  'text-black': 'text-foreground',
  
  // Border colors - existing
  'border-gray-200': 'border-border',
  'border-gray-300': 'border-border',
  'border-gray-700': 'border-border',
  'border-blue-500': 'border-primary',
  'border-green-500': 'border-success',
  'border-red-500': 'border-destructive',
  'border-yellow-500': 'border-warning',
  'border-purple-500': 'border-secondary',
  
  // NEW: Additional border colors
  'border-blue-200': 'border-border',
  'border-blue-300': 'border-border',
  'border-slate-200': 'border-border',
  'border-slate-300': 'border-border'
};

// Enhanced spacing mappings - standardizing problematic patterns
const SPACING_MAPPINGS = {
  // Non-standard spacings from the report
  'px-3': 'px-4',
  'py-1.5': 'py-2',
  'p-3': 'p-4',
  'p-5': 'p-6',
  'p-7': 'p-8',
  'px-5': 'px-6',
  'py-5': 'py-6',
  'px-7': 'px-8',
  'py-7': 'py-8',
  'gap-3': 'gap-4',
  'gap-5': 'gap-6',
  'gap-7': 'gap-8',
  'space-x-3': 'space-x-4',
  'space-y-3': 'space-y-4',
  'space-x-5': 'space-x-6',
  'space-y-5': 'space-y-6'
};

// Dark mode specific fixes - common patterns from remaining issues
const DARK_MODE_FIXES = [
  {
    pattern: /dark:bg-gray-700/g,
    replacement: 'dark:bg-background'
  },
  {
    pattern: /dark:bg-gray-800/g,
    replacement: 'dark:bg-background'
  },
  {
    pattern: /dark:bg-gray-900/g,
    replacement: 'dark:bg-background'
  },
  {
    pattern: /dark:text-gray-200/g,
    replacement: 'dark:text-foreground'
  },
  {
    pattern: /dark:text-gray-300/g,
    replacement: 'dark:text-muted-foreground'
  },
  {
    pattern: /dark:text-gray-400/g,
    replacement: 'dark:text-muted-foreground'
  },
  {
    pattern: /dark:text-white/g,
    replacement: 'dark:text-foreground'
  },
  {
    pattern: /dark:text-green-400/g,
    replacement: 'dark:text-success'
  },
  {
    pattern: /dark:text-red-400/g,
    replacement: 'dark:text-destructive'
  },
  {
    pattern: /dark:text-blue-400/g,
    replacement: 'dark:text-primary'
  },
  {
    pattern: /dark:bg-green-900\/20/g,
    replacement: 'dark:bg-success/20'
  },
  {
    pattern: /dark:bg-red-900\/20/g,
    replacement: 'dark:bg-destructive/20'
  }
];

// Manual card patterns to replace with ContentCard - enhanced
const CARD_PATTERNS = [
  {
    pattern: /<div className="rounded-xl border p-4 bg-card">/g,
    replacement: '<ContentCard variant="default">'
  },
  {
    pattern: /<div className="rounded-xl border p-6 bg-card">/g,
    replacement: '<ContentCard variant="default">'
  },
  {
    pattern: /<div className="rounded-xl border p-8 bg-card">/g,
    replacement: '<ContentCard variant="default">'
  },
  {
    pattern: /<div className="bg-card rounded-xl p-6 border border-border">/g,
    replacement: '<ContentCard variant="default">'
  },
  {
    pattern: /<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">/g,
    replacement: '<ContentCard variant="elevated">'
  },
  {
    pattern: /<div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8">/g,
    replacement: '<ContentCard variant="elevated">'
  },
  {
    pattern: /<div className="bg-card dark:bg-gray-800 rounded-2xl p-6">/g,
    replacement: '<ContentCard variant="elevated">'
  },
  {
    pattern: /<div className="bg-card dark:bg-gray-800 rounded-2xl p-8">/g,
    replacement: '<ContentCard variant="elevated">'
  }
];

// Loading state fixes - standardize to LoadingStates components
const LOADING_FIXES = [
  {
    pattern: /<div className="animate-spin.*?h-4 w-4.*?">/g,
    replacement: '<LoadingStates.ButtonSpinner />'
  },
  {
    pattern: /<div className="animate-spin.*?h-6 w-6.*?">/g,
    replacement: '<LoadingStates.Spinner />'
  },
  {
    pattern: /<div className="animate-pulse.*?">/g,
    replacement: '<LoadingStates.Skeleton />'
  }
];

// Error state fixes - standardize to Alert components
const ERROR_FIXES = [
  {
    pattern: /className=".*?bg-red-50.*?text-red-800.*?"/g,
    replacement: 'className="alert-error"'
  },
  {
    pattern: /className=".*?bg-red-100.*?text-red-900.*?"/g,
    replacement: 'className="alert-error"'
  }
];

/**
 * Main execution function
 */
async function main() {
  console.log('🔧 Starting Enhanced Consistency Fix Script...\n');
  
  try {
    // Create backup directory
    if (!fs.existsSync(CONFIG.backupDir)) {
      fs.mkdirSync(CONFIG.backupDir, { recursive: true });
    }
    
    // Get all files to process
    const files = await getFilesToProcess();
    console.log(`📁 Found ${files.length} files to process\n`);
    
    let totalFixes = 0;
    const fixCategories = {
      colors: 0,
      spacing: 0,
      darkMode: 0,
      cards: 0,
      loading: 0,
      errors: 0
    };
    
    for (const file of files) {
      const fixes = await processFile(file, fixCategories);
      totalFixes += fixes;
    }
    
    console.log(`\n✅ Enhanced consistency fixes complete!`);
    console.log(`📊 Total fixes applied: ${totalFixes}`);
    console.log(`\n📈 Fixes by category:`);
    console.log(`   🎨 Colors: ${fixCategories.colors}`);
    console.log(`   📏 Spacing: ${fixCategories.spacing}`);
    console.log(`   🌙 Dark Mode: ${fixCategories.darkMode}`);
    console.log(`   📦 Cards: ${fixCategories.cards}`);
    console.log(`   ⏳ Loading: ${fixCategories.loading}`);
    console.log(`   ❌ Errors: ${fixCategories.errors}`);
    console.log(`💾 Backups saved to: ${CONFIG.backupDir}/`);
    console.log(`\n🔍 Run 'npm run analyze:consistency' to see improvements`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

/**
 * Get all files to process
 */
async function getFilesToProcess() {
  const patterns = CONFIG.includePatterns.map(pattern => 
    path.join(CONFIG.sourceDir, pattern)
  );
  
  try {
    const files = await glob(patterns[0], { 
      ignore: CONFIG.excludePatterns.map(pattern => 
        path.join(CONFIG.sourceDir, pattern)
      )
    });
    return files;
  } catch (error) {
    throw error;
  }
}

/**
 * Process a single file with enhanced fixes
 */
async function processFile(filePath, fixCategories) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let updatedContent = content;
    let fixes = 0;
    
    // Create backup
    const backupPath = path.join(CONFIG.backupDir, path.basename(filePath));
    fs.writeFileSync(backupPath, content);
    
    // Apply color fixes
    for (const [oldColor, newColor] of Object.entries(COLOR_MAPPINGS)) {
      const regex = new RegExp(`\\b${oldColor}\\b`, 'g');
      const matches = updatedContent.match(regex);
      if (matches) {
        updatedContent = updatedContent.replace(regex, newColor);
        fixes += matches.length;
        fixCategories.colors += matches.length;
      }
    }
    
    // Apply dark mode fixes
    for (const { pattern, replacement } of DARK_MODE_FIXES) {
      const matches = updatedContent.match(pattern);
      if (matches) {
        updatedContent = updatedContent.replace(pattern, replacement);
        fixes += matches.length;
        fixCategories.darkMode += matches.length;
      }
    }
    
    // Apply spacing fixes
    for (const [oldSpacing, newSpacing] of Object.entries(SPACING_MAPPINGS)) {
      const regex = new RegExp(`\\b${oldSpacing}\\b`, 'g');
      const matches = updatedContent.match(regex);
      if (matches) {
        updatedContent = updatedContent.replace(regex, newSpacing);
        fixes += matches.length;
        fixCategories.spacing += matches.length;
      }
    }
    
    // Apply card pattern fixes
    for (const { pattern, replacement } of CARD_PATTERNS) {
      const matches = updatedContent.match(pattern);
      if (matches) {
        updatedContent = updatedContent.replace(pattern, replacement);
        fixes += matches.length;
        fixCategories.cards += matches.length;
        
        // Add ContentCard import if needed
        if (replacement.includes('ContentCard') && !updatedContent.includes('ContentCard')) {
          if (updatedContent.includes('import React from \'react\';')) {
            updatedContent = updatedContent.replace(
              'import React from \'react\';',
              'import React from \'react\';\nimport { ContentCard } from \'@/components/patterns/ContentCard\';'
            );
          }
        }
      }
    }
    
    // Apply loading state fixes
    for (const { pattern, replacement } of LOADING_FIXES) {
      const matches = updatedContent.match(pattern);
      if (matches) {
        updatedContent = updatedContent.replace(pattern, replacement);
        fixes += matches.length;
        fixCategories.loading += matches.length;
        
        // Add LoadingStates import if needed
        if (replacement.includes('LoadingStates') && !updatedContent.includes('LoadingStates')) {
          if (updatedContent.includes('import React from \'react\';')) {
            updatedContent = updatedContent.replace(
              'import React from \'react\';',
              'import React from \'react\';\nimport { LoadingStates } from \'@/components/patterns/LoadingStates\';'
            );
          }
        }
      }
    }
    
    // Apply error state fixes
    for (const { pattern, replacement } of ERROR_FIXES) {
      const matches = updatedContent.match(pattern);
      if (matches) {
        updatedContent = updatedContent.replace(pattern, replacement);
        fixes += matches.length;
        fixCategories.errors += matches.length;
      }
    }
    
    // Write updated content if changes were made
    if (fixes > 0) {
      fs.writeFileSync(filePath, updatedContent);
      console.log(`✅ ${path.relative(process.cwd(), filePath)}: ${fixes} fixes`);
    }
    
    return fixes;
    
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return 0;
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main }; 