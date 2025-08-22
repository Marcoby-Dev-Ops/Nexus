#!/usr/bin/env node

/**
 * Database Access Pattern Verification Script
 * 
 * This script verifies that the codebase follows the standardized database access patterns:
 * - Components use api-client
 * - Services use this.database or this.postgres
 * - No direct Supabase imports
 */

const fs = require('fs');
const path = require('path');

// Pattern definitions
const PATTERNS = {
  // Forbidden patterns
  FORBIDDEN: {
    'direct-supabase-import': /import.*supabase.*from.*['"`]@\/lib\/supabase['"`]/g,
    'this-supabase-usage': /this\.supabase/g,
    'api-client-in-services': /import.*api-client.*from.*['"`]@\/lib\/api-client['"`]/g,
  },
  
  // Required patterns
  REQUIRED: {
    'api-client-in-components': /import.*api-client.*from.*['"`]@\/lib\/api-client['"`]/g,
    'this-database-usage': /this\.database/g,
    'this-postgres-usage': /this\.postgres/g,
    'base-service-extension': /extends BaseService/g,
  }
};

// File type rules
const FILE_RULES = {
  '*.tsx': {
    allowed: ['api-client-in-components'],
    forbidden: ['direct-supabase-import', 'this-supabase-usage', 'api-client-in-services'],
    description: 'React Components'
  },
  'services/*.ts': {
    allowed: ['this-database-usage', 'this-postgres-usage', 'base-service-extension'],
    forbidden: ['direct-supabase-import', 'this-supabase-usage', 'api-client-in-services'],
    description: 'Service Files'
  },
  'hooks/*.ts': {
    allowed: ['api-client-in-components'],
    forbidden: ['direct-supabase-import', 'this-supabase-usage', 'api-client-in-services'],
    description: 'Hook Files'
  },
  'pages/*.tsx': {
    allowed: ['api-client-in-components'],
    forbidden: ['direct-supabase-import', 'this-supabase-usage', 'api-client-in-services'],
    description: 'Page Files'
  }
};

function checkFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = filePath.replace(process.cwd() + '/', '');
    const issues = [];
    
    // Determine file type
    let fileType = 'unknown';
    for (const [pattern, rules] of Object.entries(FILE_RULES)) {
      if (relativePath.includes(pattern.replace('*', ''))) {
        fileType = pattern;
        break;
      }
    }
    
    if (fileType === 'unknown') {
      // Default rules for other files
      fileType = '*.ts';
    }
    
    const rules = FILE_RULES[fileType] || FILE_RULES['*.ts'];
    
    // Check forbidden patterns
    for (const forbiddenPattern of rules.forbidden || []) {
      const matches = content.match(PATTERNS.FORBIDDEN[forbiddenPattern]);
      if (matches) {
        issues.push({
          type: 'FORBIDDEN',
          pattern: forbiddenPattern,
          count: matches.length,
          description: `Found ${matches.length} forbidden ${forbiddenPattern} usage(s)`
        });
      }
    }
    
    // Check required patterns (warnings only)
    for (const requiredPattern of rules.allowed || []) {
      const matches = content.match(PATTERNS.REQUIRED[requiredPattern]);
      if (!matches) {
        issues.push({
          type: 'MISSING',
          pattern: requiredPattern,
          count: 0,
          description: `Missing recommended ${requiredPattern} usage`
        });
      }
    }
    
    return {
      file: relativePath,
      fileType: rules.description || fileType,
      issues,
      hasIssues: issues.length > 0
    };
  } catch (error) {
    return {
      file: filePath.replace(process.cwd() + '/', ''),
      fileType: 'ERROR',
      issues: [{
        type: 'ERROR',
        pattern: 'file-read',
        count: 0,
        description: `Failed to read file: ${error.message}`
      }],
      hasIssues: true
    };
  }
}

function findFiles(dir, extensions = ['.ts', '.tsx']) {
  const files = [];
  
  function scanDirectory(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        scanDirectory(fullPath);
      } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }
  
  scanDirectory(dir);
  return files;
}

function main() {
  console.log('🔍 Database Access Pattern Verification');
  console.log('=====================================\n');
  
  const srcDir = path.join(__dirname, '..', 'src');
  const files = findFiles(srcDir);
  
  console.log(`📁 Scanning ${files.length} TypeScript files...\n`);
  
  const results = files.map(checkFile);
  const filesWithIssues = results.filter(r => r.hasIssues);
  const filesWithoutIssues = results.filter(r => !r.hasIssues);
  
  // Group issues by type
  const forbiddenIssues = [];
  const missingIssues = [];
  const errors = [];
  
  filesWithIssues.forEach(result => {
    result.issues.forEach(issue => {
      if (issue.type === 'FORBIDDEN') {
        forbiddenIssues.push({ file: result.file, issue });
      } else if (issue.type === 'MISSING') {
        missingIssues.push({ file: result.file, issue });
      } else if (issue.type === 'ERROR') {
        errors.push({ file: result.file, issue });
      }
    });
  });
  
  // Report results
  console.log('📊 Verification Results');
  console.log('======================');
  console.log(`✅ Files compliant: ${filesWithoutIssues.length}`);
  console.log(`⚠️  Files with issues: ${filesWithIssues.length}`);
  console.log(`❌ Forbidden patterns: ${forbiddenIssues.length}`);
  console.log(`⚠️  Missing patterns: ${missingIssues.length}`);
  console.log(`💥 Errors: ${errors.length}\n`);
  
  // Report forbidden issues
  if (forbiddenIssues.length > 0) {
    console.log('❌ FORBIDDEN PATTERNS FOUND:');
    console.log('============================');
    forbiddenIssues.forEach(({ file, issue }) => {
      console.log(`  ${file}: ${issue.description}`);
    });
    console.log('');
  }
  
  // Report missing patterns
  if (missingIssues.length > 0) {
    console.log('⚠️  MISSING RECOMMENDED PATTERNS:');
    console.log('=================================');
    missingIssues.forEach(({ file, issue }) => {
      console.log(`  ${file}: ${issue.description}`);
    });
    console.log('');
  }
  
  // Report errors
  if (errors.length > 0) {
    console.log('💥 ERRORS:');
    console.log('==========');
    errors.forEach(({ file, issue }) => {
      console.log(`  ${file}: ${issue.description}`);
    });
    console.log('');
  }
  
  // Summary
  if (forbiddenIssues.length === 0 && errors.length === 0) {
    console.log('🎉 All files comply with database access patterns!');
    console.log('\n📝 Next steps:');
    console.log('1. Consider adding missing recommended patterns');
    console.log('2. Run ESLint to catch issues during development');
    console.log('3. Review the standardization guide: docs/current/development/DATABASE_ACCESS_PATTERNS.md');
  } else {
    console.log('🚨 Issues found! Please fix forbidden patterns before proceeding.');
    console.log('\n📝 How to fix:');
    console.log('1. Run migration script: node scripts/migrate-supabase-to-postgres.cjs');
    console.log('2. Update components to use api-client');
    console.log('3. Update services to use this.database or this.postgres');
    console.log('4. Remove direct Supabase imports');
    console.log('5. See: docs/current/development/DATABASE_ACCESS_PATTERNS.md');
  }
  
  // Exit with error code if forbidden patterns found
  if (forbiddenIssues.length > 0 || errors.length > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { checkFile, findFiles, PATTERNS, FILE_RULES };
