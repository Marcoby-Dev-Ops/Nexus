#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all test files
const testFiles = glob.sync('**/*.test.{ts,tsx}', { ignore: ['node_modules/**'] });

testFiles.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace Vitest syntax with Jest
  content = content
    .replace(/\bvi\.fn\(/g, 'jest.fn(')
    .replace(/\bvi\.mock\(/g, 'jest.mock(')
    .replace(/\bexpect\(([^)]+)\)\.toBeTruthy\(\)/g, 'expect($1).toBe(true)')
    .replace(/\bimport\.meta\b/g, 'importMeta'); // will hit the shim
  
  fs.writeFileSync(filePath, content);
  console.log(`Updated: ${filePath}`);
});

console.log(`Processed ${testFiles.length} test files`); 