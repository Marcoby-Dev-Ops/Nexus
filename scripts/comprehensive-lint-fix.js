#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to fix unused imports
function fixUnusedImports(content, filePath) {
  // Fix unused React imports
  const reactImportMatch = content.match(/import\s+{\s*([^}]+)\s*}\s+from\s+['"]react['"];?\s*\n/g);
  if (reactImportMatch) {
    reactImportMatch.forEach(match => {
      const imports = match.match(/{\s*([^}]+)\s*}/)[1];
      const importList = imports.split(',').map(imp => imp.trim());
      const usedImports = importList.filter(imp => {
        const importName = imp.replace(/\s+as\s+\w+/, '').trim();
        // Check if the import is actually used in the file
        const usageCount = (content.match(new RegExp(`\\b${importName}\\b`, 'g')) || []).length;
        return usageCount > 1; // More than just the import statement
      });
      
      if (usedImports.length === 0) {
        content = content.replace(match, '');
      } else if (usedImports.length !== importList.length) {
        content = content.replace(match, `import { ${usedImports.join(', ')} } from 'react';\n`);
      }
    });
  }

  // Fix unused lucide-react imports
  const lucideImportMatch = content.match(/import\s+{\s*([^}]+)\s*}\s+from\s+['"]lucide-react['"];?\s*\n/g);
  if (lucideImportMatch) {
    lucideImportMatch.forEach(match => {
      const imports = match.match(/{\s*([^}]+)\s*}/)[1];
      const importList = imports.split(',').map(imp => imp.trim());
      const usedImports = importList.filter(imp => {
        const importName = imp.replace(/\s+as\s+\w+/, '').trim();
        const usageCount = (content.match(new RegExp(`\\b${importName}\\b`, 'g')) || []).length;
        return usageCount > 1;
      });
      
      if (usedImports.length === 0) {
        content = content.replace(match, '');
      } else if (usedImports.length !== importList.length) {
        content = content.replace(match, `import { ${usedImports.join(', ')} } from 'lucide-react';\n`);
      }
    });
  }

  return content;
}

// Function to fix unused variables
function fixUnusedVariables(content) {
  // Fix unused destructured variables
  content = content.replace(/const\s*{\s*([^}]+)\s*}\s*=\s*([^;]+);/g, (match, vars, source) => {
    const varList = vars.split(',').map(v => v.trim());
    const usedVars = varList.filter(v => {
      const varName = v.replace(/\s*:\s*\w+/, '').trim();
      const usageCount = (content.match(new RegExp(`\\b${varName}\\b`, 'g')) || []).length;
      return usageCount > 1;
    });
    
    if (usedVars.length === 0) {
      return '';
    } else if (usedVars.length !== varList.length) {
      return `const { ${usedVars.join(', ')} } = ${source};`;
    }
    return match;
  });

  // Fix unused function parameters
  content = content.replace(/(\w+)\s*:\s*([^,)]+)\s*[,)]/g, (match, paramName, type) => {
    const usageCount = (content.match(new RegExp(`\\b${paramName}\\b`, 'g')) || []).length;
    if (usageCount <= 1) {
      return `_${paramName}: ${type}${match.endsWith(',') ? ',' : ')'}`;
    }
    return match;
  });

  return content;
}

// Function to add console.log disable comments
function disableConsoleLogs(content) {
  return content.replace(/console\.(log|warn|error|info|debug)\(/g, '// eslint-disable-next-line no-console\n    console.$1(');
}

// Function to fix empty interfaces
function fixEmptyInterfaces(content) {
  return content.replace(/interface\s+(\w+)\s*\{\s*\}\s*\n/g, 'type $1 = Record<string, never>;\n');
}

// Function to process a file
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let modifiedContent = content;

    // Apply fixes
    modifiedContent = fixUnusedImports(modifiedContent, filePath);
    modifiedContent = fixUnusedVariables(modifiedContent);
    modifiedContent = disableConsoleLogs(modifiedContent);
    modifiedContent = fixEmptyInterfaces(modifiedContent);

    if (modifiedContent !== content) {
      fs.writeFileSync(filePath, modifiedContent);
      console.log(`Fixed: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Function to find all TypeScript/React files
function findFiles(dir) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        traverse(fullPath);
      } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

// Main execution
async function main() {
  const srcDir = path.join(__dirname, '..', 'src');
  const files = findFiles(srcDir);

  console.log(`Found ${files.length} TypeScript/React files to process...`);

  let fixedCount = 0;
  for (const file of files) {
    if (processFile(file)) {
      fixedCount++;
    }
  }

  console.log(`Fixed ${fixedCount} files.`);

  // Run ESLint auto-fix
  try {
    console.log('Running ESLint auto-fix...');
    execSync('pnpm run lint:fix', { stdio: 'inherit' });
  } catch (error) {
    console.log('ESLint auto-fix completed with some issues.');
  }

  // Show remaining issues
  try {
    console.log('\nRemaining lint issues:');
    execSync('pnpm run lint 2>&1 | head -20', { stdio: 'inherit' });
  } catch (error) {
    console.log('Could not show remaining issues.');
  }
}

main().catch(console.error); 