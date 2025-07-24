#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to fix export names that were incorrectly prefixed with underscores
function fixExportNames(content) {
  // Fix component exports that were prefixed with __
  content = content.replace(/export const __(\w+): React\.FC/g, 'export const $1: React.FC');
  
  // Fix function exports that were prefixed with __
  content = content.replace(/export function __(\w+)/g, 'export function $1');
  
  // Fix const exports that were prefixed with __
  content = content.replace(/export const __(\w+)/g, 'export const $1');
  
  // Fix default exports that were prefixed with __
  content = content.replace(/export default __(\w+)/g, 'export default $1');
  
  return content;
}

// Function to fix interface property names that were incorrectly prefixed
function fixInterfaceProperties(content) {
  // Fix property names that were prefixed with _
  content = content.replace(/(\w+):\s*_(\w+)/g, '$1: $2');
  content = content.replace(/_(\w+):/g, '$1:');
  
  return content;
}

// Function to fix object property names
function fixObjectProperties(content) {
  // Fix object properties that were prefixed with _
  content = content.replace(/(\s+)_(\w+):/g, '$1$2:');
  
  return content;
}

// Function to process a file
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let newContent = content;
    
    // Apply fixes
    const originalContent = newContent;
    newContent = fixExportNames(newContent);
    newContent = fixInterfaceProperties(newContent);
    newContent = fixObjectProperties(newContent);
    
    if (newContent !== originalContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      modified = true;
      console.log(`✅ Fixed: ${filePath}`);
    }
    
    return modified;
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
console.log('🔧 Fixing export issues caused by automated lint fixes...');

const srcDir = path.join(__dirname, '..', 'src');
const files = findTsFiles(srcDir);

let fixedCount = 0;
for (const file of files) {
  if (processFile(file)) {
    fixedCount++;
  }
}

console.log(`\n✅ Fixed ${fixedCount} files with export issues`);
console.log('🎉 Export issues should now be resolved!'); 