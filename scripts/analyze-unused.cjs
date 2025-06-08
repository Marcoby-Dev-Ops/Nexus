const fs = require('fs');
const path = require('path');

// Directories to analyze
const SOURCE_DIRS = ['src', 'public'];
const IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '__tests__',
  '__snapshots__',
  '.test.',
  '.spec.',
  'coverage',
  'scripts'
];

class UnusedAnalyzer {
  constructor() {
    this.allFiles = new Set();
    this.importedFiles = new Set();
    this.componentExports = new Map();
    this.componentImports = new Map();
    this.unusedFiles = [];
    this.unusedComponents = [];
    this.deadCode = [];
  }

  // Get all files in the project
  getAllFiles(dir = '.', extensions = ['.ts', '.tsx', '.js', '.jsx']) {
    const files = [];
    
    try {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const relativePath = path.relative('.', fullPath);
        
        // Skip ignored patterns
        if (IGNORE_PATTERNS.some(pattern => relativePath.includes(pattern))) {
          continue;
        }
        
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          files.push(...this.getAllFiles(fullPath, extensions));
        } else if (extensions.some(ext => item.endsWith(ext))) {
          files.push(relativePath);
          this.allFiles.add(relativePath);
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
    
    return files;
  }

  // Analyze imports and exports in a file
  analyzeFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const analysis = {
        imports: [],
        exports: [],
        components: [],
        hasDefaultExport: false,
        isEmpty: content.trim().length < 50
      };

      // Find imports
      const importRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:\{[^}]*\}|\*\s+as\s+\w+|\w+))*\s+from\s+)?['"`]([^'"`]+)['"`]/g;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];
        if (importPath.startsWith('.') || importPath.startsWith('@/')) {
          analysis.imports.push(importPath);
          this.importedFiles.add(this.resolveImportPath(importPath, filePath));
        }
      }

      // Find React components
      const componentRegex = /(?:export\s+(?:default\s+)?(?:const|function|class)\s+(\w+))|(?:const\s+(\w+)\s*:\s*React\.FC)|(?:function\s+(\w+)\s*\([^)]*\)\s*(?::\s*JSX\.Element)?)/g;
      while ((match = componentRegex.exec(content)) !== null) {
        const componentName = match[1] || match[2] || match[3];
        if (componentName && componentName[0] === componentName[0].toUpperCase()) {
          analysis.components.push(componentName);
        }
      }

      // Check for default export
      analysis.hasDefaultExport = /export\s+default/.test(content);

      // Find named exports
      const exportRegex = /export\s+(?:const|function|class)\s+(\w+)/g;
      while ((match = exportRegex.exec(content)) !== null) {
        analysis.exports.push(match[1]);
      }

      return analysis;
    } catch (error) {
      return null;
    }
  }

  // Resolve relative import paths
  resolveImportPath(importPath, fromFile) {
    if (importPath.startsWith('@/')) {
      // Handle @ alias
      return path.join('src', importPath.slice(2));
    } else if (importPath.startsWith('.')) {
      // Handle relative imports
      const dir = path.dirname(fromFile);
      const resolved = path.join(dir, importPath);
      
      // Try different extensions
      const extensions = ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx'];
      for (const ext of extensions) {
        const withExt = resolved + ext;
        if (fs.existsSync(withExt)) {
          return withExt;
        }
      }
      
      return resolved;
    }
    
    return importPath;
  }

  // Check if a component is used
  isComponentUsed(componentName, allContent) {
    // Look for JSX usage: <ComponentName or {ComponentName}
    const jsxRegex = new RegExp(`<${componentName}[\\s>]|\\{\\s*${componentName}\\s*\\}`, 'g');
    return jsxRegex.test(allContent);
  }

  // Analyze the entire codebase
  analyze() {
    console.log('🔍 Analyzing codebase for unused files and components...\n');
    
    const files = this.getAllFiles();
    const allContent = files.map(f => {
      try {
        return fs.readFileSync(f, 'utf-8');
      } catch {
        return '';
      }
    }).join('\n');

    // Analyze each file
    for (const file of files) {
      const analysis = this.analyzeFile(file);
      if (!analysis) continue;

      // Store component exports
      for (const component of analysis.components) {
        if (!this.componentExports.has(component)) {
          this.componentExports.set(component, []);
        }
        this.componentExports.get(component).push(file);
      }

      // Check for empty or minimal files
      if (analysis.isEmpty) {
        this.deadCode.push({
          file,
          reason: 'File is empty or contains minimal content'
        });
      }
    }

    // Find unused files
    for (const file of this.allFiles) {
      const normalizedFile = file.replace(/\\/g, '/');
      
      // Skip certain file types that are always "used"
      if (file.includes('index.') || 
          file.includes('main.') || 
          file.includes('App.') ||
          file.includes('.d.ts') ||
          file.includes('vite.config') ||
          file.includes('tailwind.config') ||
          file.includes('tsconfig')) {
        continue;
      }

      let isImported = false;
      for (const importedFile of this.importedFiles) {
        const normalizedImported = importedFile.replace(/\\/g, '/');
        if (normalizedFile === normalizedImported || 
            normalizedFile === normalizedImported + '.tsx' ||
            normalizedFile === normalizedImported + '.ts') {
          isImported = true;
          break;
        }
      }

      if (!isImported) {
        this.unusedFiles.push(file);
      }
    }

    // Find unused components
    for (const [componentName, files] of this.componentExports) {
      if (!this.isComponentUsed(componentName, allContent)) {
        this.unusedComponents.push({
          component: componentName,
          files: files
        });
      }
    }

    this.generateReport();
  }

  generateReport() {
    const report = [];
    
    report.push('# Unused Code Analysis Report 📊\n');
    report.push(`> **Generated on:** ${new Date().toISOString()}\n`);
    
    report.push('## Summary\n');
    report.push(`- **Total Files Analyzed:** ${this.allFiles.size}`);
    report.push(`- **Unused Files:** ${this.unusedFiles.length}`);
    report.push(`- **Unused Components:** ${this.unusedComponents.length}`);
    report.push(`- **Dead Code Files:** ${this.deadCode.length}\n`);

    if (this.unusedFiles.length > 0) {
      report.push('## 🗑️ Unused Files\n');
      report.push('Files that are not imported anywhere:\n');
      for (const file of this.unusedFiles) {
        report.push(`- \`${file}\``);
      }
      report.push('');
    }

    if (this.unusedComponents.length > 0) {
      report.push('## 🧩 Unused Components\n');
      report.push('Components that are exported but never used:\n');
      for (const { component, files } of this.unusedComponents) {
        report.push(`### ${component}`);
        report.push('**Defined in:**');
        for (const file of files) {
          report.push(`- \`${file}\``);
        }
        report.push('');
      }
    }

    if (this.deadCode.length > 0) {
      report.push('## 💀 Dead Code\n');
      report.push('Files with minimal or empty content:\n');
      for (const { file, reason } of this.deadCode) {
        report.push(`- \`${file}\` - ${reason}`);
      }
      report.push('');
    }

    // Recommendations
    report.push('## 🎯 Cleanup Recommendations\n');
    
    if (this.unusedFiles.length > 0) {
      report.push('### Delete Unused Files');
      report.push('```bash');
      for (const file of this.unusedFiles) {
        report.push(`rm "${file}"`);
      }
      report.push('```\n');
    }

    if (this.unusedComponents.length > 0) {
      report.push('### Remove Unused Components');
      report.push('These components can be safely removed from their files:\n');
      for (const { component, files } of this.unusedComponents) {
        report.push(`- Remove \`${component}\` from: ${files.join(', ')}`);
      }
      report.push('');
    }

    // Write report
    const reportPath = 'docs/UNUSED_CODE_REPORT.md';
    fs.writeFileSync(reportPath, report.join('\n'));
    
    console.log(`📊 **Cleanup Summary:**`);
    console.log(`   Unused Files: ${this.unusedFiles.length}`);
    console.log(`   Unused Components: ${this.unusedComponents.length}`);
    console.log(`   Dead Code Files: ${this.deadCode.length}`);
    console.log(`\n✅ Report saved to ${reportPath}`);
  }
}

// Run analysis
const analyzer = new UnusedAnalyzer();
analyzer.analyze(); 