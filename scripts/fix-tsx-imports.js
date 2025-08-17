const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all TypeScript and TSX files
const files = glob.sync('src/**/*.{ts,tsx}', {
  ignore: ['node_modules/**', 'dist/**', 'coverage/**', '**/*.test.ts', '**/*.test.tsx']
});

let totalFixed = 0;

files.forEach(file => {
  try {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;
    
    // Fix imports with .tsx extensions
    content = content.replace(
      /from\s+['"]([^'"]*\.tsx)['"]/g,
      (match, importPath) => {
        const newPath = importPath.replace(/\.tsx$/, '');
        console.log(`Fixing import in ${file}: ${importPath} -> ${newPath}`);
        return `from '${newPath}'`;
      }
    );
    
    // Fix imports with .ts extensions (for TypeScript files)
    content = content.replace(
      /from\s+['"]([^'"]*\.ts)['"]/g,
      (match, importPath) => {
        const newPath = importPath.replace(/\.ts$/, '');
        console.log(`Fixing import in ${file}: ${importPath} -> ${newPath}`);
        return `from '${newPath}'`;
      }
    );
    
    if (content !== originalContent) {
      fs.writeFileSync(file, content, 'utf8');
      totalFixed++;
    }
  } catch (error) {
    console.error(`Error processing ${file}:`, error.message);
  }
});

console.log(`\n✅ Fixed imports in ${totalFixed} files`);
