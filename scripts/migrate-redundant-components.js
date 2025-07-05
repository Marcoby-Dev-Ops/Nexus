#!/usr/bin/env node

/**
 * Migration Script: Redundant Component Consolidation
 * 
 * This script helps automate the migration from redundant components
 * to unified patterns across the codebase.
 * 
 * Usage: node scripts/migrate-redundant-components.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const DRY_RUN = process.argv.includes('--dry-run');
const SRC_DIR = path.join(__dirname, '../src');

// Migration patterns
const MIGRATIONS = {
  // Replace KpiCard and StatsCard imports with UnifiedMetricCard
  kpiCard: {
    pattern: /import\s*{\s*KpiCard\s*}\s*from\s*['"][^'"]*['"];?/g,
    replacement: "import { UnifiedMetricCard } from '@/components/patterns/UnifiedComponents';"
  },
  
  statsCard: {
    pattern: /import\s*{\s*StatsCard\s*}\s*from\s*['"][^'"]*['"];?/g,
    replacement: "import { UnifiedMetricCard } from '@/components/patterns/UnifiedComponents';"
  },

  // Replace Card usage patterns with ContentSection
  cardPattern: {
    pattern: /<Card>\s*<CardHeader>\s*<CardTitle>([^<]+)<\/CardTitle>\s*(?:<CardDescription>([^<]+)<\/CardDescription>\s*)?<\/CardHeader>\s*<CardContent>([\s\S]*?)<\/CardContent>\s*<\/Card>/g,
    replacement: (match, title, description, content) => {
      const desc = description ? `description="${description.trim()}"` : '';
      return `<ContentSection title="${title.trim()}" ${desc}>${content}</ContentSection>`;
    }
  },

  // Replace dashboard header patterns
  dashboardHeader: {
    pattern: /<div className="flex[^"]*justify-between[^"]*">\s*<div>\s*<h1[^>]*>([^<]+)<\/h1>\s*(?:<p[^>]*>([^<]+)<\/p>\s*)?<\/div>\s*(?:<div[^>]*>([\s\S]*?)<\/div>\s*)?<\/div>/g,
    replacement: (match, title, subtitle, actions) => {
      const sub = subtitle ? `subtitle="${subtitle.trim()}"` : '';
      const acts = actions ? `actions={${actions.trim()}}` : '';
      return `<DashboardHeader title="${title.trim()}" ${sub} ${acts} />`;
    }
  }
};

// File processing functions
function getAllFiles(dir, extensions = ['.tsx', '.ts']) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        traverse(fullPath);
      } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

function migrateFile(filePath) {
  const originalContent = fs.readFileSync(filePath, 'utf8');
  let content = originalContent;
  let hasChanges = false;
  
  // Track what imports we need to add
  const importsToAdd = new Set();
  
  // Apply migrations
  for (const [name, migration] of Object.entries(MIGRATIONS)) {
    if (typeof migration.replacement === 'function') {
      const newContent = content.replace(migration.pattern, migration.replacement);
      if (newContent !== content) {
        content = newContent;
        hasChanges = true;
        console.log(`  ✓ Applied ${name} migration`);
      }
    } else {
      if (migration.pattern.test(content)) {
        content = content.replace(migration.pattern, migration.replacement);
        hasChanges = true;
        console.log(`  ✓ Applied ${name} migration`);
        
        // Track imports that need to be added
        if (name === 'kpiCard' || name === 'statsCard') {
          importsToAdd.add("import { UnifiedMetricCard } from '@/components/patterns/UnifiedComponents';");
        }
      }
    }
  }
  
  // Replace component usage
  if (content.includes('<KpiCard')) {
    content = content.replace(/<KpiCard/g, '<UnifiedMetricCard');
    hasChanges = true;
    console.log('  ✓ Replaced KpiCard usage');
  }
  
  if (content.includes('<StatsCard')) {
    content = content.replace(/<StatsCard/g, '<UnifiedMetricCard');
    hasChanges = true;
    console.log('  ✓ Replaced StatsCard usage');
  }
  
  // Add required imports
  if (importsToAdd.size > 0 && hasChanges) {
    const imports = Array.from(importsToAdd).join('\n');
    const importSection = content.match(/^(import[\s\S]*?)(?=\n\n|\n\/\*|\nconst|\ninterface|\nexport)/m);
    
    if (importSection) {
      content = content.replace(importSection[1], `${importSection[1]}\n${imports}`);
    } else {
      content = `${imports}\n\n${content}`;
    }
  }
  
  return { content, hasChanges, originalContent };
}

// Analysis functions
function analyzeRedundancy() {
  console.log('🔍 Analyzing codebase redundancy...\n');
  
  const files = getAllFiles(SRC_DIR);
  const stats = {
    totalFiles: files.length,
    kpiCardUsage: 0,
    statsCardUsage: 0,
    cardImports: 0,
    dashboardComponents: 0
  };
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    
    if (content.includes('KpiCard')) stats.kpiCardUsage++;
    if (content.includes('StatsCard')) stats.statsCardUsage++;
    if (content.includes('Card, CardContent, CardHeader')) stats.cardImports++;
    if (content.includes('Dashboard') && content.includes('React.FC')) stats.dashboardComponents++;
  }
  
  console.log('📊 Redundancy Analysis Results:');
  console.log(`   Total files analyzed: ${stats.totalFiles}`);
  console.log(`   Files using KpiCard: ${stats.kpiCardUsage}`);
  console.log(`   Files using StatsCard: ${stats.statsCardUsage}`);
  console.log(`   Files with Card imports: ${stats.cardImports}`);
  console.log(`   Dashboard components: ${stats.dashboardComponents}`);
  console.log('');
  
  return stats;
}

// Main migration function
function runMigration() {
  console.log('🚀 Starting component migration...\n');
  
  const files = getAllFiles(SRC_DIR);
  let migratedFiles = 0;
  let totalChanges = 0;
  
  for (const file of files) {
    // Skip certain files
    const relativePath = path.relative(SRC_DIR, file);
    if (relativePath.includes('__tests__') || 
        relativePath.includes('.test.') || 
        relativePath.includes('.spec.') ||
        relativePath.includes('UnifiedComponents.tsx')) {
      continue;
    }
    
    console.log(`Processing: ${relativePath}`);
    
    const result = migrateFile(file);
    
    if (result.hasChanges) {
      if (!DRY_RUN) {
        fs.writeFileSync(file, result.content);
      }
      migratedFiles++;
      totalChanges++;
      console.log(`  ✅ Migrated successfully`);
    } else {
      console.log(`  ⏭️  No changes needed`);
    }
    
    console.log('');
  }
  
  console.log('🎉 Migration Summary:');
  console.log(`   Files processed: ${files.length}`);
  console.log(`   Files migrated: ${migratedFiles}`);
  console.log(`   Total changes: ${totalChanges}`);
  
  if (DRY_RUN) {
    console.log('\n⚠️  This was a dry run. No files were modified.');
    console.log('   Run without --dry-run to apply changes.');
  }
}

// Generate migration report
function generateReport() {
  const stats = analyzeRedundancy();
  
  const report = `
# Component Migration Report

Generated: ${new Date().toISOString()}

## Current State
- Total files: ${stats.totalFiles}
- KpiCard usage: ${stats.kpiCardUsage} files
- StatsCard usage: ${stats.statsCardUsage} files  
- Card imports: ${stats.cardImports} files
- Dashboard components: ${stats.dashboardComponents} files

## Estimated Impact
- Code reduction: ~${Math.round((stats.kpiCardUsage + stats.statsCardUsage) * 0.3)}% of metric card code
- Bundle size reduction: ~${Math.round(stats.cardImports * 2)}KB
- Maintenance reduction: ${stats.dashboardComponents} dashboard patterns unified

## Next Steps
1. Run migration script: \`node scripts/migrate-redundant-components.js\`
2. Test all dashboard components
3. Update documentation
4. Remove deprecated components
`;

  fs.writeFileSync(path.join(__dirname, '../docs/MIGRATION_REPORT.md'), report);
  console.log('📄 Migration report generated: docs/MIGRATION_REPORT.md');
}

// Main execution
function main() {
  console.log('🔧 Component Redundancy Migration Tool\n');
  
  if (process.argv.includes('--analyze')) {
    analyzeRedundancy();
  } else if (process.argv.includes('--report')) {
    generateReport();
  } else {
    analyzeRedundancy();
    runMigration();
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  analyzeRedundancy,
  runMigration,
  generateReport
}; 