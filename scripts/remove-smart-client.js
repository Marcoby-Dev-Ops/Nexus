#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('🧹 Removing smartClient from all files...');
console.log('=====================================');

// Find all TypeScript/JavaScript files that import smartClient
const findSmartClientFiles = () => {
  try {
    const result = execSync('grep -r "smartClient" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" | cut -d: -f1 | sort | uniq', { 
      encoding: 'utf8' 
    });
    return result.trim().split('\n').filter(Boolean);
  } catch {
    return [];
  }
};

// Find all files that import smartClient
const findImportFiles = () => {
  try {
    const result = execSync('grep -r "import.*smartClient" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" | cut -d: -f1 | sort | uniq', { 
      encoding: 'utf8' 
    });
    return result.trim().split('\n').filter(Boolean);
  } catch {
    return [];
  }
};

// Process a single file
const processFile = (filePath) => {
  console.log(`📝 Processing: ${filePath}`);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Remove smartClient from imports
    const importRegex = /import\s*{\s*([^}]*)\s*}\s*from\s*['"]@\/core\/supabase['"];?/g;
    const matches = content.match(importRegex);
    
    if (matches) {
      matches.forEach(match => {
        if (match.includes('smartClient')) {
          // Remove smartClient from the import
          const newImport = match.replace(/,\s*smartClient/, '').replace(/smartClient\s*,/, '');
          content = content.replace(match, newImport);
          modified = true;
        }
      });
    }
    
    // Replace smartClient usage with supabase
    const smartClientRegex = /smartClient\./g;
    if (smartClientRegex.test(content)) {
      content = content.replace(smartClientRegex, 'supabase.');
      modified = true;
    }
    
    // Replace await smartClient with await supabase
    const awaitSmartClientRegex = /await\s+smartClient/g;
    if (awaitSmartClientRegex.test(content)) {
      content = content.replace(awaitSmartClientRegex, 'await supabase');
      modified = true;
    }
    
    // Replace const { data, error } = await smartClient with const { data, error } = await supabase
    const destructureRegex = /const\s*{\s*([^}]*)\s*}\s*=\s*await\s+smartClient/g;
    if (destructureRegex.test(content)) {
      content = content.replace(destructureRegex, 'const { $1 } = await supabase');
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
      return true;
    } else {
      console.log(`⏭️ No changes needed: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
};

// Main execution
const main = () => {
  console.log('🔍 Finding files with smartClient usage...');
  
  const allFiles = findSmartClientFiles();
  const importFiles = findImportFiles();
  
  console.log(`\n📦 Found ${allFiles.length} files with smartClient usage:`);
  allFiles.forEach(file => console.log(`  - ${file}`));
  
  console.log(`\n📦 Found ${importFiles.length} files importing smartClient:`);
  importFiles.forEach(file => console.log(`  - ${file}`));
  
  console.log('\n🔄 Processing files...');
  
  let processedCount = 0;
  let updatedCount = 0;
  
  allFiles.forEach(file => {
    processedCount++;
    if (processFile(file)) {
      updatedCount++;
    }
  });
  
  console.log('\n📊 Summary:');
  console.log(`- Processed ${processedCount} files`);
  console.log(`- Updated ${updatedCount} files`);
  console.log(`- ${processedCount - updatedCount} files unchanged`);
  
  console.log('\n🧹 Next steps:');
  console.log('1. Remove smartClient export from src/core/supabase.ts');
  console.log('2. Run "pnpm install" to clean up');
  console.log('3. Test the application');
};

main(); 