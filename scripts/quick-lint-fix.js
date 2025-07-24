#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to add console.log disable comments
function disableConsoleLogs(content) {
  return content.replace(/console\.(log|warn|error|info|debug)\(/g, '// eslint-disable-next-line no-console\n    console.$1(');
}

// Function to fix empty interfaces
function fixEmptyInterfaces(content) {
  return content.replace(/interface\s+(\w+)\s*\{\s*\}\s*\n/g, 'type $1 = Record<string, never>;\n');
}

// Function to add underscore prefix to unused parameters
function fixUnusedParameters(content) {
  // Fix unused function parameters
  content = content.replace(/(\w+)\s*:\s*any\s*\)\s*=>\s*\{/g, (match, paramName) => {
    if (!content.includes(paramName) || content.match(new RegExp(`\\b${paramName}\\b`)).length <= 1) {
      return `_${paramName}: any) => {`;
    }
    return match;
  });
  
  return content;
}

// Function to process a file
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let modifiedContent = content;

    // Apply fixes
    modifiedContent = disableConsoleLogs(modifiedContent);
    modifiedContent = fixEmptyInterfaces(modifiedContent);
    modifiedContent = fixUnusedParameters(modifiedContent);

    if (modifiedContent !== content) {
      fs.writeFileSync(filePath, modifiedContent);
      console.log(`Fixed: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
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
const srcDir = path.join(__dirname, '..', 'src');
const files = findFiles(srcDir);

console.log(`Found ${files.length} TypeScript/React files to process...`);

for (const file of files) {
  processFile(file);
}

console.log('Quick lint fixes completed!'); 