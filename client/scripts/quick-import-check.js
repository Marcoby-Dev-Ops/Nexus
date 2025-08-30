#!/usr/bin/env node

/**
 * Quick Import Checker
 * Fast tool to identify missing files and critical import issues
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// Path aliases
const pathAliases = {
  '@': 'src',
  '@/': 'src/',
  '@app': 'src/app',
  '@core': 'src/core',
  '@/shared': 'src/shared',
  '@/hooks': 'src/hooks',
  '@/components': 'src/components',
  '@/lib': 'src/lib',
  '@/domains': 'src/domains',
  '@/pages': 'src/pages',
  '@/services': 'src/services',
  '@/utils': 'src/utils',
  '@/types': 'src/types',
  '@/styles': 'src/styles',
  '@dashboard': 'src/domains/dashboard',
  '@workspace': 'src/domains/workspace',
  '@marketplace': 'src/domains/marketplace',
  '@business': 'src/domains/business',
  '@admin': 'src/domains/admin',
  '@ai': 'src/domains/ai',
  '@analytics': 'src/domains/analytics',
  '@integrations': 'src/domains/integrations',
  '@help-center': 'src/domains/help-center',
  '@knowledge': 'src/domains/knowledge',
  '@automation': 'src/domains/automation',
  '@fire-cycle': 'src/domains/fire-cycle',
  '@waitlist': 'src/domains/waitlist',
  '@hype': 'src/domains/hype',
  '@entrepreneur': 'src/domains/entrepreneur',
  '@development': 'src/domains/development',
  '@departments': 'src/domains/departments',
  '@domains': 'src/domains'
};

function resolvePath(importPath, currentFile) {
  // Handle path aliases
  for (const [alias, aliasPath] of Object.entries(pathAliases)) {
    if (importPath.startsWith(alias)) {
      const relativePath = importPath.replace(alias, aliasPath);
      return path.resolve(relativePath);
    }
  }
  
  // Handle relative imports
  if (importPath.startsWith('.')) {
    return path.resolve(path.dirname(currentFile), importPath);
  }
  
  return null;
}

function checkFileExists(filePath) {
  // Try different extensions
  const extensions = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js', '/index.jsx'];
  
  for (const ext of extensions) {
    const fullPath = filePath + ext;
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      if (stats.isFile()) {
        return { exists: true, path: fullPath };
      }
    }
  }
  
  return { exists: false, path: filePath };
}

function extractImports(content) {
  const importRegex = /import\s+(?:.*?\s+from\s+)?['"]([^'"]+)['"]/g;
  const imports = [];
  let match;
  
  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  
  return imports;
}

async function main() {
  console.log('🔍 Quick import check...\n');
  
  // Find all TypeScript and TSX files
  const files = await glob('src/**/*.{ts,tsx}', { 
    ignore: ['node_modules/**', 'dist/**', 'build/**', 'coverage/**', '**/*.d.ts'] 
  });
  
  let totalIssues = 0;
  const missingFiles = new Set();
  const directoryImports = new Set();
  
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const imports = extractImports(content);
      
      for (const importPath of imports) {
        // Skip node_modules and external packages
        if (importPath.startsWith('@') || importPath.startsWith('.')) {
          const resolvedPath = resolvePath(importPath, file);
          
          if (resolvedPath) {
            const { exists, path: checkedPath } = checkFileExists(resolvedPath);
            
            if (!exists) {
              missingFiles.add(`${importPath} -> ${checkedPath}`);
              totalIssues++;
            } else {
              // Check if it's a directory
              const stats = fs.statSync(checkedPath);
              if (stats.isDirectory()) {
                directoryImports.add(`${importPath} -> ${checkedPath}`);
                totalIssues++;
              }
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error processing ${file}:`, error.message);
    }
  }
  
  console.log(`📊 Quick Import Check Results:`);
  console.log(`   - Files checked: ${files.length}`);
  console.log(`   - Total issues: ${totalIssues}`);
  console.log(`   - Missing files: ${missingFiles.size}`);
  console.log(`   - Directory imports: ${directoryImports.size}`);
  
  if (missingFiles.size > 0) {
    console.log(`\n❌ Missing Files:`);
    Array.from(missingFiles).slice(0, 20).forEach(issue => {
      console.log(`   - ${issue}`);
    });
    if (missingFiles.size > 20) {
      console.log(`   ... and ${missingFiles.size - 20} more`);
    }
  }
  
  if (directoryImports.size > 0) {
    console.log(`\n⚠️  Directory Imports:`);
    Array.from(directoryImports).slice(0, 10).forEach(issue => {
      console.log(`   - ${issue}`);
    });
    if (directoryImports.size > 10) {
      console.log(`   ... and ${directoryImports.size - 10} more`);
    }
  }
  
  if (totalIssues === 0) {
    console.log('\n✅ No critical import issues found!');
  } else {
    console.log(`\n💡 Run 'pnpm run check:imports' for detailed analysis`);
  }
}

main().catch(console.error); 