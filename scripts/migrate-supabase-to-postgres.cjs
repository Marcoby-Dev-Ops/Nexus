#!/usr/bin/env node

/**
 * Migration Script: Replace Supabase calls with PostgreSQL
 * 
 * This script replaces all remaining this.supabase calls with the new
 * this.database interface to complete the migration to PostgreSQL.
 */

const fs = require('fs');
const path = require('path');

// Migration patterns
const MIGRATION_PATTERNS = [
  // Basic CRUD operations
  {
    pattern: /this\.supabase\.from\(['"`]([^'"`]+)['"`]\)\.select\(['"`]([^'"`]*)['"`]\)\.eq\(['"`]([^'"`]+)['"`],\s*([^)]+)\)\.single\(\)/g,
    replacement: 'await this.database.select($1, "$2", { $3: $4 })',
    description: 'Select single record'
  },
  {
    pattern: /this\.supabase\.from\(['"`]([^'"`]+)['"`]\)\.select\(['"`]([^'"`]*)['"`]\)\.eq\(['"`]([^'"`]+)['"`],\s*([^)]+)\)/g,
    replacement: 'await this.database.select($1, "$2", { $3: $4 })',
    description: 'Select records with filter'
  },
  {
    pattern: /this\.supabase\.from\(['"`]([^'"`]+)['"`]\)\.select\(['"`]([^'"`]*)['"`]\)/g,
    replacement: 'await this.database.select($1, "$2")',
    description: 'Select all records'
  },
  {
    pattern: /this\.supabase\.from\(['"`]([^'"`]+)['"`]\)\.insert\(([^)]+)\)/g,
    replacement: 'await this.database.insert($1, $2)',
    description: 'Insert records'
  },
  {
    pattern: /this\.supabase\.from\(['"`]([^'"`]+)['"`]\)\.update\(([^)]+)\)\.eq\(['"`]([^'"`]+)['"`],\s*([^)]+)\)/g,
    replacement: 'await this.database.update($1, $2, { $3: $4 })',
    description: 'Update records'
  },
  {
    pattern: /this\.supabase\.from\(['"`]([^'"`]+)['"`]\)\.delete\(\)\.eq\(['"`]([^'"`]+)['"`],\s*([^)]+)\)/g,
    replacement: 'await this.database.delete($1, { $2: $3 })',
    description: 'Delete records'
  },
  // RPC calls
  {
    pattern: /this\.supabase\.rpc\(['"`]([^'"`]+)['"`],\s*([^)]*)\)/g,
    replacement: 'await this.database.rpc("$1", $2)',
    description: 'RPC calls'
  }
];

function migrateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let changes = 0;

    console.log(`\n🔧 Migrating: ${filePath}`);

    // Apply each migration pattern
    MIGRATION_PATTERNS.forEach(({ pattern, replacement, description }) => {
      const matches = content.match(pattern);
      if (matches) {
        console.log(`  📝 ${description}: ${matches.length} matches`);
        content = content.replace(pattern, replacement);
        changes += matches.length;
      }
    });

    // Write back if changes were made
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`  ✅ Applied ${changes} changes`);
      return changes;
    } else {
      console.log(`  ⏭️  No changes needed`);
      return 0;
    }
  } catch (error) {
    console.error(`  ❌ Error processing ${filePath}:`, error.message);
    return 0;
  }
}

function findServiceFiles(dir) {
  const files = [];
  
  function scanDirectory(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        scanDirectory(fullPath);
      } else if (stat.isFile() && item.endsWith('.ts') && !item.endsWith('.d.ts')) {
        files.push(fullPath);
      }
    }
  }
  
  scanDirectory(dir);
  return files;
}

function main() {
  console.log('🚀 Supabase to PostgreSQL Migration Script');
  console.log('==========================================\n');

  const srcDir = path.join(__dirname, '..', 'src');
  const serviceFiles = findServiceFiles(srcDir);
  
  console.log(`📁 Found ${serviceFiles.length} TypeScript files to scan`);

  let totalChanges = 0;
  let filesChanged = 0;

  for (const file of serviceFiles) {
    const changes = migrateFile(file);
    if (changes > 0) {
      filesChanged++;
      totalChanges += changes;
    }
  }

  console.log('\n📊 Migration Summary');
  console.log('===================');
  console.log(`✅ Files processed: ${serviceFiles.length}`);
  console.log(`✅ Files changed: ${filesChanged}`);
  console.log(`✅ Total changes: ${totalChanges}`);

  if (totalChanges > 0) {
    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Review the changes in your services');
    console.log('2. Test the migrated services');
    console.log('3. Remove any remaining Supabase imports');
    console.log('4. Update any remaining Supabase references');
  } else {
    console.log('\n✨ No migration needed - all files are already using PostgreSQL!');
  }
}

if (require.main === module) {
  main();
}

module.exports = { migrateFile, findServiceFiles };
