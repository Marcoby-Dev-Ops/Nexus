#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Common patterns of undefined variables that need fixing
const UNDEFINED_VARIABLES = {
  'MOCK_BUSINESS_HEALTH': 'MOCKBUSINESS_HEALTH',
  'MOCK_INTEGRATIONS': 'MOCKINTEGRATIONS', 
  'MOCK_AI_INSIGHTS': 'MOCKAI_INSIGHTS',
  'authLoading': 'loading',
  'updates': 'updates',
  'email': 'email',
  'listener': 'listener',
  'event': 'event'
};

// Function to fix undefined variable references
function fixUndefinedVariables(content) {
  let modified = false;
  
  // Fix common undefined variable patterns
  for (const [undefinedVar, correctVar] of Object.entries(UNDEFINED_VARIABLES)) {
    const regex = new RegExp(`\\b${undefinedVar}\\b`, 'g');
    if (regex.test(content)) {
      content = content.replace(regex, correctVar);
      modified = true;
    }
  }
  
  return { content, modified };
}

// Function to process a file
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const { content: newContent, modified } = fixUndefinedVariables(content);
    
    if (modified) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`✅ Fixed undefined variables in: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Function to find all TypeScript/React files
function findTsFiles(dir) {
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
console.log('🔧 Fixing undefined variable references...');

const srcDir = path.join(__dirname, '..', 'src');
const files = findTsFiles(srcDir);

let fixedCount = 0;
for (const file of files) {
  if (processFile(file)) {
    fixedCount++;
  }
}

console.log(`\n✅ Fixed ${fixedCount} files with undefined variable issues`);
console.log('🎉 Undefined variable issues should now be resolved!'); 