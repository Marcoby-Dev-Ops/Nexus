#!/usr/bin/env node

/**
 * Fix Hardcoded Colors Script
 * Automatically replaces hardcoded Tailwind color classes with design tokens
 */

const fs = require('fs');
const glob = require('glob');

// Color mappings from hardcoded colors to design tokens
const COLOR_MAPPINGS = {
  // Background colors
  'bg-blue-50': 'bg-primary/5',
  'bg-blue-100': 'bg-primary/10',
  'bg-blue-500': 'bg-primary',
  'bg-blue-600': 'bg-primary',
  'bg-blue-700': 'bg-primary/90',
  'bg-blue-800': 'bg-primary/80',
  'bg-blue-900': 'bg-primary/20',

  'bg-green-50': 'bg-success/5',
  'bg-green-100': 'bg-success/10',
  'bg-green-500': 'bg-success',
  'bg-green-600': 'bg-success',
  'bg-green-700': 'bg-success/90',
  'bg-green-800': 'bg-success/80',
  'bg-green-900': 'bg-success/20',

  'bg-red-50': 'bg-destructive/5',
  'bg-red-100': 'bg-destructive/10',
  'bg-red-500': 'bg-destructive',

  'bg-yellow-50': 'bg-warning/5',
  'bg-yellow-100': 'bg-warning/10',
  'bg-yellow-300': 'bg-warning/30',
  'bg-yellow-500': 'bg-warning',
  'bg-yellow-900': 'bg-warning/20',

  'bg-purple-500': 'bg-secondary',
  'bg-purple-700': 'bg-secondary/90',
  'bg-purple-900': 'bg-secondary/20',

  'bg-orange-100': 'bg-warning/10',
  'bg-orange-500': 'bg-warning',

  // Text colors
  'text-blue-400': 'text-primary',
  'text-blue-500': 'text-primary',
  'text-blue-600': 'text-primary',
  'text-blue-700': 'text-primary/90',
  'text-blue-800': 'text-primary/80',

  'text-green-400': 'text-success',
  'text-green-500': 'text-success',
  'text-green-600': 'text-success',

  'text-red-500': 'text-destructive',

  'text-yellow-500': 'text-warning',
  'text-yellow-700': 'text-warning/90',
  'text-yellow-800': 'text-warning/80',

  'text-purple-400': 'text-secondary',
  'text-purple-500': 'text-secondary',
  'text-purple-700': 'text-secondary/90',

  'text-orange-400': 'text-warning',
  'text-orange-500': 'text-warning',

  // Border colors
  'border-blue-200': 'border-primary/20',
  'border-blue-800': 'border-primary/80',
  'border-green-200': 'border-success/20',
  'border-red-200': 'border-destructive/20',
  'border-yellow-200': 'border-warning/20',
  'border-yellow-300': 'border-warning/30',
  'border-yellow-800': 'border-warning/80',

  // Hover states
  'hover:bg-blue-700': 'hover:bg-primary/90',
  'hover:bg-blue-800': 'hover:bg-primary/80',
  'hover:bg-green-700': 'hover:bg-success/90',
  'hover:bg-purple-700': 'hover:bg-secondary/90',

  // Dark mode variants
  'dark:bg-blue-900': 'dark:bg-primary/20',
  'dark:bg-green-900': 'dark:bg-success/20',
  'dark:bg-yellow-900': 'dark:bg-warning/20',
  'dark:bg-purple-900': 'dark:bg-secondary/20',

  'dark:text-blue-200': 'dark:text-primary',
  'dark:text-blue-300': 'dark:text-primary',
  'dark:text-blue-400': 'dark:text-primary',
  'dark:text-green-200': 'dark:text-success',
  'dark:text-green-300': 'dark:text-success',
  'dark:text-yellow-200': 'dark:text-warning',
  'dark:text-yellow-300': 'dark:text-warning',

  'dark:border-blue-700': 'dark:border-primary/70',
  'dark:border-blue-800': 'dark:border-primary/80',
  'dark:border-green-800': 'dark:border-success/80',
  'dark:border-yellow-800': 'dark:border-warning/80',
};

function fixColorsInContent(content) {
  let modifiedContent = content;
  const changes = [];

  // Sort mappings by length (longest first) to avoid partial replacements
  const sortedMappings = Object.entries(COLOR_MAPPINGS)
    .sort(([a], [b]) => b.length - a.length);

  for (const [hardcodedColor, designToken] of sortedMappings) {
    const regex = new RegExp(`\\b${hardcodedColor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
    
    if (regex.test(modifiedContent)) {
      const matches = modifiedContent.match(regex);
      if (matches) {
        changes.push({
          from: hardcodedColor,
          to: designToken,
          count: matches.length
        });
        modifiedContent = modifiedContent.replace(regex, designToken);
      }
    }
  }

  return { content: modifiedContent, changes };
}

function processFile(filePath, dryRun = false) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const { content: newContent, changes } = fixColorsInContent(content);

    if (changes.length === 0) {
      return { processed: true, changes: 0 };
    }

    if (dryRun) {
      console.log(`\n🔍 ${filePath}:`);
      changes.forEach(change => {
        console.log(`  ${change.from} → ${change.to} (${change.count}x)`);
      });
      return { processed: true, changes: changes.length };
    }

    fs.writeFileSync(filePath, newContent, 'utf8');
    
    console.log(`\n✅ Fixed ${filePath}:`);
    changes.forEach(change => {
      console.log(`  ${change.from} → ${change.to} (${change.count}x)`);
    });

    return { processed: true, changes: changes.length };
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return { processed: false, changes: 0 };
  }
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const fileArg = args.find(arg => arg.startsWith('--file='));
  
  console.log('🎨 Fixing Hardcoded Colors...\n');
  
  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No files will be modified\n');
  }

  let filesToProcess = [];
  
  if (fileArg) {
    const file = fileArg.split('=')[1] || '';
    if (fs.existsSync(file)) {
      filesToProcess = [file];
    } else {
      console.error(`❌ File not found: ${file}`);
      process.exit(1);
    }
  } else {
    const { sync } = glob;
    filesToProcess = sync('src/**/*.{ts,tsx}', {
      ignore: ['**/*.test.*', '**/__tests__/**', '**/node_modules/**']
    });
  }

  console.log(`📁 Processing ${filesToProcess.length} files...\n`);

  let totalProcessed = 0;
  let totalChanges = 0;
  let totalFixed = 0;

  filesToProcess.forEach(file => {
    const result = processFile(file, dryRun);
    if (result.processed) {
      totalProcessed++;
      totalChanges += result.changes;
      if (result.changes > 0) {
        totalFixed++;
      }
    }
  });

  console.log(`\n📊 Summary:`);
  console.log(`  Files processed: ${totalProcessed}`);
  console.log(`  Files with changes: ${totalFixed}`);
  console.log(`  Total color fixes: ${totalChanges}`);
  
  if (dryRun) {
    console.log(`\n💡 Run without --dry-run to apply these changes`);
  } else if (totalChanges > 0) {
    console.log(`\n✅ Color fixes applied successfully!`);
  }
}

if (require.main === module) {
  main();
}
