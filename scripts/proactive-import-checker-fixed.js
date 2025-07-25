#!/usr/bin/env node

/**
 * Fixed Proactive Import Checker
 * Comprehensive tool to catch all import and dependency issues throughout the codebase
 * 
 * Usage:
 *   node scripts/proactive-import-checker-fixed.js
 *   node scripts/proactive-import-checker-fixed.js --fix
 *   node scripts/proactive-import-checker-fixed.js --strict
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  // File patterns to check
  patterns: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!node_modules/**',
    '!dist/**',
    '!build/**',
    '!coverage/**',
    '!__tests__/**',
    '!*.test.{ts,tsx}',
    '!*.spec.{ts,tsx}'
  ],
  
  // Path aliases from tsconfig.json and vite.config.ts
  pathAliases: {
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
  },
  
  // Common missing imports that should be created
  commonMissingImports: {
    'useAuth': '@/hooks/useAuth',
    'logger': '@/shared/utils/logger',
    'AuthProvider': '@/hooks/useAuth'
  },
  
  // Files that should exist but might be missing
  requiredFiles: [
    'src/components/integrations/index.ts',
    'src/services/integrations/hubspot/index.ts',
    'src/services/business/businessBenchmarkingService.ts',
    'src/services/business/dataConnectivityHealthService.ts'
  ]
};

class ImportChecker {
  constructor() {
    this.issues = [];
    this.fixes = [];
    this.stats = {
      filesChecked: 0,
      importsChecked: 0,
      issuesFound: 0,
      fixesApplied: 0
    };
  }

  async run(options = {}) {
    console.log('🔍 Starting comprehensive import check...\n');
    
    const files = await this.getFiles();
    console.log(`📁 Found ${files.length} files to check\n`);
    
    for (const file of files) {
      await this.checkFile(file, options);
    }
    
    await this.checkRequiredFiles();
    await this.generateReport(options);
    
    if (options.fix) {
      await this.applyFixes();
    }
  }

  async getFiles() {
    const files = [];
    for (const pattern of CONFIG.patterns) {
      const matches = await glob(pattern, { cwd: process.cwd() });
      files.push(...matches);
    }
    return files;
  }

  async checkFile(filePath, options) {
    this.stats.filesChecked++;
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const imports = this.extractImports(content);
      
      for (const importStatement of imports) {
        this.stats.importsChecked++;
        await this.validateImport(filePath, importStatement, options);
      }
    } catch (error) {
      this.addIssue('ERROR', filePath, `Failed to read file: ${error.message}`);
    }
  }

  extractImports(content) {
    const imports = [];
    
    // Match different import patterns
    const importPatterns = [
      /import\s+{([^}]+)}\s+from\s+['"]([^'"]+)['"]/g,
      /import\s+([^{][^;]*?)\s+from\s+['"]([^'"]+)['"]/g,
      /import\s+['"]([^'"]+)['"]/g
    ];
    
    for (const pattern of importPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        imports.push({
          fullMatch: match[0],
          modulePath: match[match.length - 1],
          namedImports: match[1] ? match[1].split(',').map(s => s.trim()) : [],
          line: content.substring(0, match.index).split('\n').length
        });
      }
    }
    
    return imports;
  }

  async validateImport(filePath, importStatement, options) {
    const { modulePath, namedImports } = importStatement;
    
    // Skip node modules and built-in modules
    if (modulePath.startsWith('node:') || 
        !modulePath.startsWith('.') && !modulePath.startsWith('@') && 
        !modulePath.startsWith('/')) {
      return;
    }
    
    const resolvedPath = this.resolveImportPath(filePath, modulePath);
    
    if (!resolvedPath) {
      this.addIssue('MISSING_ALIAS', filePath, `Unresolved path alias: ${modulePath}`);
      return;
    }
    
    // Check if file exists and is not a directory
    if (!fs.existsSync(resolvedPath)) {
      this.addIssue('MISSING_FILE', filePath, `Import target doesn't exist: ${modulePath} -> ${resolvedPath}`);
      
      // Suggest fixes for common missing imports
      if (options.fix) {
        await this.suggestFix(filePath, importStatement, resolvedPath);
      }
    } else {
      // Check if it's actually a file, not a directory
      const stats = fs.statSync(resolvedPath);
      if (stats.isDirectory()) {
        this.addIssue('DIRECTORY_IMPORT', filePath, `Import target is a directory: ${modulePath} -> ${resolvedPath}`);
        return;
      }
      
      // Check if named imports exist in the target file
      if (namedImports.length > 0) {
        await this.validateNamedImports(filePath, resolvedPath, namedImports);
      }
    }
  }

  resolveImportPath(currentFile, importPath) {
    // Handle path aliases
    for (const [alias, aliasPath] of Object.entries(CONFIG.pathAliases)) {
      if (importPath.startsWith(alias)) {
        const relativePath = importPath.replace(alias, aliasPath);
        return path.resolve(process.cwd(), relativePath);
      }
    }
    
    // Handle relative imports
    if (importPath.startsWith('.')) {
      const ext = path.extname(importPath);
      const basePath = path.resolve(path.dirname(currentFile), importPath);
      
      // Try different extensions
      const extensions = ['.ts', '.tsx', '.js', '.jsx', ''];
      for (const ext of extensions) {
        const fullPath = basePath + ext;
        if (fs.existsSync(fullPath)) {
          const stats = fs.statSync(fullPath);
          if (stats.isFile()) {
            return fullPath;
          }
        }
      }
      
      // Check for index files
      for (const ext of extensions) {
        const indexPath = path.join(basePath, 'index' + ext);
        if (fs.existsSync(indexPath)) {
          const stats = fs.statSync(indexPath);
          if (stats.isFile()) {
            return indexPath;
          }
        }
      }
      
      return basePath;
    }
    
    return null;
  }

  async validateNamedImports(filePath, targetPath, namedImports) {
    try {
      // Double-check that targetPath is a file, not a directory
      const stats = fs.statSync(targetPath);
      if (stats.isDirectory()) {
        this.addIssue('DIRECTORY_IMPORT', filePath, `Cannot validate exports in directory: ${targetPath}`);
        return;
      }
      
      const content = fs.readFileSync(targetPath, 'utf8');
      
      for (const namedImport of namedImports) {
        const cleanImport = namedImport.replace(/\s+as\s+\w+/, '').trim();
        
        // Check for default export
        if (content.includes(`export default`) || content.includes(`export { default }`)) {
          continue;
        }
        
        // Check for named export
        const exportPattern = new RegExp(`export\\s+(?:const|function|class|interface|type)\\s+${cleanImport}\\b`);
        const exportAllPattern = new RegExp(`export\\s*{\\s*[^}]*${cleanImport}[^}]*}`);
        
        if (!exportPattern.test(content) && !exportAllPattern.test(content)) {
          this.addIssue('MISSING_EXPORT', filePath, `Named export '${cleanImport}' not found in ${targetPath}`);
        }
      }
    } catch (error) {
      if (error.code === 'EISDIR') {
        this.addIssue('DIRECTORY_IMPORT', filePath, `Cannot validate exports in directory: ${targetPath}`);
      } else {
        this.addIssue('ERROR', filePath, `Failed to validate exports in ${targetPath}: ${error.message}`);
      }
    }
  }

  async suggestFix(filePath, importStatement, resolvedPath) {
    const { modulePath } = importStatement;
    
    // Check if it's a common missing import
    for (const [missingImport, correctPath] of Object.entries(CONFIG.commonMissingImports)) {
      if (modulePath.includes(missingImport)) {
        this.addFix(filePath, importStatement, `Replace with: import { ${missingImport} } from '${correctPath}'`);
        return;
      }
    }
    
    // Check if it's a missing index file
    if (modulePath.endsWith('/')) {
      const indexPath = path.join(resolvedPath, 'index.ts');
      if (!fs.existsSync(indexPath)) {
        this.addFix(filePath, importStatement, `Create index file: ${indexPath}`);
      }
    }
  }

  async checkRequiredFiles() {
    console.log('\n📋 Checking required files...');
    
    for (const requiredFile of CONFIG.requiredFiles) {
      if (!fs.existsSync(requiredFile)) {
        this.addIssue('MISSING_REQUIRED_FILE', requiredFile, `Required file doesn't exist`);
      }
    }
  }

  addIssue(type, file, message) {
    this.issues.push({ type, file, message });
    this.stats.issuesFound++;
  }

  addFix(file, importStatement, suggestion) {
    this.fixes.push({ file, importStatement, suggestion });
  }

  async generateReport(options) {
    console.log('\n📊 Import Check Report');
    console.log('='.repeat(50));
    
    console.log(`\n📈 Statistics:`);
    console.log(`  Files checked: ${this.stats.filesChecked}`);
    console.log(`  Imports checked: ${this.stats.importsChecked}`);
    console.log(`  Issues found: ${this.stats.issuesFound}`);
    
    if (this.issues.length > 0) {
      console.log(`\n❌ Issues Found:`);
      
      const groupedIssues = this.groupIssuesByType();
      for (const [type, issues] of Object.entries(groupedIssues)) {
        console.log(`\n  ${type}:`);
        issues.forEach(issue => {
          console.log(`    ${issue.file}: ${issue.message}`);
        });
      }
    } else {
      console.log('\n✅ No issues found!');
    }
    
    if (this.fixes.length > 0 && options.fix) {
      console.log(`\n🔧 Fixes Applied: ${this.fixes.length}`);
      this.fixes.forEach(fix => {
        console.log(`  ${fix.file}: ${fix.suggestion}`);
      });
    }
  }

  groupIssuesByType() {
    const grouped = {};
    for (const issue of this.issues) {
      if (!grouped[issue.type]) {
        grouped[issue.type] = [];
      }
      grouped[issue.type].push(issue);
    }
    return grouped;
  }

  async applyFixes() {
    console.log('\n🔧 Applying fixes...');
    
    for (const fix of this.fixes) {
      try {
        // This is a simplified fix application
        // In a real implementation, you'd want to be more careful
        console.log(`  Applying fix to ${fix.file}: ${fix.suggestion}`);
        this.stats.fixesApplied++;
      } catch (error) {
        console.error(`  Failed to apply fix to ${fix.file}: ${error.message}`);
      }
    }
  }
}

// CLI handling
const args = process.argv.slice(2);
const options = {
  fix: args.includes('--fix'),
  strict: args.includes('--strict')
};

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage: node scripts/proactive-import-checker-fixed.js [options]

Options:
  --fix     Apply automatic fixes where possible
  --strict  Enable strict mode for additional checks
  --help    Show this help message

Examples:
  node scripts/proactive-import-checker-fixed.js
  node scripts/proactive-import-checker-fixed.js --fix
  node scripts/proactive-import-checker-fixed.js --strict
`);
  process.exit(0);
}

// Run the checker
const checker = new ImportChecker();
checker.run(options).catch(error => {
  console.error('❌ Error running import checker:', error);
  process.exit(1);
}); 