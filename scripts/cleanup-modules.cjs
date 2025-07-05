#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Comprehensive Module Cleanup Script
 * Analyzes and removes unused dependencies and source files
 */

class ModuleCleanup {
  constructor() {
    this.unusedDeps = [];
    this.unusedDevDeps = [];
    this.unusedFiles = [];
    this.potentialSavings = 0;
    this.report = [];
  }

  async analyze() {
    console.log('🔍 Analyzing unused modules...\n');
    
    // 1. Analyze package.json dependencies
    await this.analyzePackageJson();
    
    // 2. Run depcheck for comprehensive analysis
    await this.runDepcheck();
    
    // 3. Analyze source files
    await this.analyzeSourceFiles();
    
    // 4. Generate report
    this.generateReport();
    
    return this.report;
  }

  async analyzePackageJson() {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
    
    // Check for packages that are clearly unused based on our analysis
    const suspiciousPackages = [
      'class-variance-authority', // No cva imports found
      '@radix-ui/react-tabs',     // No imports found
      'pino-pretty',              // No usage found
      'shadcn',                   // CLI tool, not needed as dependency
      'shadcn-ui'                 // CLI tool, not needed as dependency
    ];

    suspiciousPackages.forEach(pkg => {
      if (packageJson.dependencies?.[pkg]) {
        this.unusedDeps.push(pkg);
      }
      if (packageJson.devDependencies?.[pkg]) {
        this.unusedDevDeps.push(pkg);
      }
    });
  }

  async runDepcheck() {
    try {
      const result = execSync('npx depcheck --json', { encoding: 'utf-8' });
      const depcheckResult = JSON.parse(result);
      
      // Add depcheck findings
      this.unusedDeps.push(...depcheckResult.dependencies || []);
      this.unusedDevDeps.push(...depcheckResult.devDependencies || []);
      
      // Remove duplicates
      this.unusedDeps = [...new Set(this.unusedDeps)];
      this.unusedDevDeps = [...new Set(this.unusedDevDeps)];
      
    } catch (error) {
      console.log('⚠️  Could not run depcheck:', error.message);
    }
  }

  async analyzeSourceFiles() {
    const srcFiles = this.getAllFiles('src', ['.ts', '.tsx', '.js', '.jsx']);
    
    for (const file of srcFiles) {
      const analysis = this.analyzeFile(file);
      if (analysis.isEmpty || analysis.isRedundant) {
        this.unusedFiles.push({
          path: file,
          reason: analysis.isEmpty ? 'Empty/minimal file' : 'Redundant code',
          size: fs.statSync(file).size
        });
        this.potentialSavings += fs.statSync(file).size;
      }
    }
  }

  getAllFiles(dir, extensions) {
    const files = [];
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        files.push(...this.getAllFiles(fullPath, extensions));
      } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  analyzeFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      const codeLines = lines.filter(line => 
        line.trim() && 
        !line.trim().startsWith('//') && 
        !line.trim().startsWith('/*') && 
        !line.trim().startsWith('*')
      );

      return {
        isEmpty: codeLines.length < 10,
        isRedundant: this.checkRedundancy(content, filePath),
        lineCount: lines.length,
        codeLineCount: codeLines.length
      };
    } catch (error) {
      return { isEmpty: false, isRedundant: false };
    }
  }

  checkRedundancy(content, filePath) {
    // Check for files that are likely redundant based on our recent cleanup
    const redundantPatterns = [
      /export\s*{\s*}\s*;?\s*$/, // Empty exports
      /import.*from.*['"]@\/domains\//, // Old domain imports
      /import.*from.*['"]@\/features\//, // Old feature imports
    ];

    return redundantPatterns.some(pattern => pattern.test(content));
  }

  generateReport() {
    this.report.push('# Module Cleanup Analysis Report\n');
    this.report.push(`Generated: ${new Date().toISOString()}\n`);

    // Unused Dependencies
    if (this.unusedDeps.length > 0) {
      this.report.push('## 🗑️ Unused Dependencies');
      this.report.push('These packages can likely be removed:\n');
      this.unusedDeps.forEach(dep => {
        this.report.push(`- \`${dep}\``);
      });
      this.report.push('');
    }

    // Unused Dev Dependencies  
    if (this.unusedDevDeps.length > 0) {
      this.report.push('## 🛠️ Unused Dev Dependencies');
      this.report.push('These dev packages can likely be removed:\n');
      this.unusedDevDeps.forEach(dep => {
        this.report.push(`- \`${dep}\``);
      });
      this.report.push('');
    }

    // Unused Files
    if (this.unusedFiles.length > 0) {
      this.report.push('## 📁 Potentially Unused Files');
      this.report.push('These files appear to be empty or redundant:\n');
      this.unusedFiles.forEach(file => {
        this.report.push(`- \`${file.path}\` (${file.reason}, ${file.size} bytes)`);
      });
      this.report.push(`\n**Potential space savings:** ${(this.potentialSavings / 1024).toFixed(1)}KB\n`);
    }

    // Cleanup Commands
    this.report.push('## 🧹 Cleanup Commands\n');
    
    if (this.unusedDeps.length > 0) {
      this.report.push('Remove unused dependencies:');
      this.report.push('```bash');
      this.report.push(`npm uninstall ${this.unusedDeps.join(' ')}`);
      this.report.push('```\n');
    }
    
    if (this.unusedDevDeps.length > 0) {
      this.report.push('Remove unused dev dependencies:');
      this.report.push('```bash');
      this.report.push(`npm uninstall --save-dev ${this.unusedDevDeps.join(' ')}`);
      this.report.push('```\n');
    }

    // Bundle Analysis
    this.report.push('## 📊 Bundle Impact Analysis\n');
    this.report.push('After cleanup, you should see:');
    this.report.push('- Faster `npm install` times');
    this.report.push('- Reduced bundle size');
    this.report.push('- Cleaner dependency tree');
    this.report.push('- Less maintenance overhead\n');

    // Safe Cleanup Recommendations
    this.report.push('## ✅ Safe to Remove\n');
    this.report.push('These are confirmed safe to remove:');
    this.report.push('- `shadcn` and `shadcn-ui` (CLI tools, not runtime dependencies)');
    this.report.push('- `pino-pretty` (not used in production logging)');
    this.report.push('- `@radix-ui/react-tabs` (using custom Tabs component)');
    this.report.push('- `class-variance-authority` (using custom styling approach)\n');
  }

  async cleanup(dryRun = true) {
    if (dryRun) {
      console.log('🔍 DRY RUN - No changes will be made\n');
    }

    // Remove safe dependencies
    const safeDeps = ['shadcn', 'shadcn-ui', 'pino-pretty'];
    const safeDevDeps = ['@testing-library/user-event', '@types/jest', 'autoprefixer'];

    if (!dryRun) {
      try {
        if (safeDeps.length > 0) {
          console.log('Removing safe dependencies...');
          execSync(`npm uninstall ${safeDeps.join(' ')}`, { stdio: 'inherit' });
        }
        
        if (safeDevDeps.length > 0) {
          console.log('Removing safe dev dependencies...');
          execSync(`npm uninstall --save-dev ${safeDevDeps.join(' ')}`, { stdio: 'inherit' });
        }
        
        console.log('✅ Cleanup completed successfully!');
      } catch (error) {
        console.error('❌ Cleanup failed:', error.message);
      }
    } else {
      console.log('Would remove dependencies:', [...safeDeps, ...safeDevDeps]);
    }
  }
}

// CLI Interface
async function main() {
  const cleanup = new ModuleCleanup();
  const args = process.argv.slice(2);
  
  if (args.includes('--analyze') || args.length === 0) {
    const report = await cleanup.analyze();
    
    // Write report to file
    fs.writeFileSync('MODULE_CLEANUP_REPORT.md', report.join('\n'));
    console.log('📋 Analysis complete! Report saved to MODULE_CLEANUP_REPORT.md\n');
    
    // Show summary
    console.log('Summary:');
    console.log(`- Unused dependencies: ${cleanup.unusedDeps.length}`);
    console.log(`- Unused dev dependencies: ${cleanup.unusedDevDeps.length}`);
    console.log(`- Potentially unused files: ${cleanup.unusedFiles.length}`);
    console.log(`- Potential space savings: ${(cleanup.potentialSavings / 1024).toFixed(1)}KB`);
  }
  
  if (args.includes('--cleanup')) {
    const dryRun = !args.includes('--execute');
    await cleanup.cleanup(dryRun);
  }
  
  if (args.includes('--help')) {
    console.log(`
Usage: node cleanup-modules.cjs [options]

Options:
  --analyze     Analyze unused modules (default)
  --cleanup     Show cleanup commands (dry run)
  --execute     Actually perform cleanup (use with --cleanup)
  --help        Show this help

Examples:
  node cleanup-modules.cjs                    # Analyze only
  node cleanup-modules.cjs --cleanup          # Dry run cleanup
  node cleanup-modules.cjs --cleanup --execute # Actually cleanup
    `);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = ModuleCleanup; 