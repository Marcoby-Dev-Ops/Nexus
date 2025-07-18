#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// Import path mappings to fix
const importMappings = [
  // Fix @shared/shared/ to @/shared/
  { from: '@shared/shared/', to: '@/shared/' },
  
  // Fix @admin/ to @/domains/admin/
  { from: '@admin/', to: '@/domains/admin/' },
  
  // Fix @core/ to @/core/ (already correct, but check for consistency)
  { from: '@core/', to: '@/core/' },
  
  // Fix @domains/ to @/domains/
  { from: '@domains/', to: '@/domains/' },
];

// File patterns to process
const filePatterns = [
  'src/**/*.ts',
  'src/**/*.tsx',
  'src/**/*.js',
  'src/**/*.jsx'
];

function fixImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // Apply each import mapping
    importMappings.forEach(mapping => {
      const regex = new RegExp(`import\\s+.*?from\\s+['"]${mapping.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
      const newContent = content.replace(regex, (match) => {
        return match.replace(mapping.from, mapping.to);
      });
      
      if (newContent !== content) {
        content = newContent;
        hasChanges = true;
        console.log(`Fixed imports in ${filePath}`);
      }
    });
    
    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🔧 Fixing import paths across the codebase...\n');
  
  let totalFiles = 0;
  let fixedFiles = 0;
  
  filePatterns.forEach(pattern => {
    const files = glob.sync(pattern, { ignore: ['node_modules/**', 'dist/**', 'build/**'] });
    
    files.forEach(file => {
      totalFiles++;
      if (fixImportsInFile(file)) {
        fixedFiles++;
      }
    });
  });
  
  console.log(`\n✅ Import fix complete!`);
  console.log(`📊 Processed ${totalFiles} files`);
  console.log(`🔧 Fixed ${fixedFiles} files`);
  
  if (fixedFiles > 0) {
    console.log(`\n🎉 Successfully updated import paths!`);
    console.log(`💡 Run your development server to verify the fixes.`);
  } else {
    console.log(`\n✨ No import path issues found!`);
  }
}

main(); 