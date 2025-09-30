const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find all TypeScript/JavaScript files
const filesOutput = execSync('powershell -Command "Get-ChildItem -Path \\"src\\" -Recurse -Include \\"*.ts\\",\\"*.tsx\\",\\"*.js\\",\\"*.jsx\\" | Select-Object -ExpandProperty FullName"', { encoding: 'utf8' });
const files = filesOutput.trim().split('\n').filter(f => f.trim() && fs.existsSync(f));

console.log(`🔍 Found ${files.length} files to check for critical issues...`);

let fixedCount = 0;
let consoleRemoved = 0;
let unusedVarsRemoved = 0;

function fixCriticalIssues(content, filePath) {
  let modified = false;
  let originalContent = content;

  // 1. Remove console statements (except console.error for debugging)
  content = content.replace(/console\.(log|warn|info|debug)\s*\([^)]*\);?\s*/g, (match) => {
    consoleRemoved++;
    modified = true;
    return '';
  });

  // 2. Remove unused imports (basic pattern)
  content = content.replace(/import\s*\{[^}]*\}\s*from\s*['"][^'"]*['"];?\s*/g, (match) => {
    // Check if any of the imported items are actually used
    const importMatch = match.match(/import\s*\{([^}]*)\}\s*from/);
    if (importMatch) {
      const imports = importMatch[1].split(',').map(i => i.trim());
      const unusedImports = imports.filter(imp => {
        const cleanImp = imp.replace(/\s+as\s+\w+/, ''); // Remove "as" aliases
        return !content.includes(cleanImp) || content.indexOf(cleanImp) === content.indexOf(match);
      });
      
      if (unusedImports.length > 0) {
        unusedVarsRemoved += unusedImports.length;
        modified = true;
        console.log(`  Removed unused imports: ${unusedImports.join(', ')} from ${path.basename(filePath)}`);
        return '';
      }
    }
    return match;
  });

  // 3. Fix simple hook dependency issues
  content = content.replace(
    /useEffect\s*\(\s*\(\)\s*=>\s*\{([^}]+)\}\s*,\s*\[\s*\]\s*\)/g,
    (match, body) => {
      // Check for common dependencies that should be included
      const commonDeps = ['dispatch', 'setState', 'ref', 'callback', 'handler'];
      const missingDeps = commonDeps.filter(dep => body.includes(dep));
      
      if (missingDeps.length > 0) {
        modified = true;
        console.log(`  Fixed useEffect dependencies: ${missingDeps.join(', ')} in ${path.basename(filePath)}`);
        return `useEffect(() => {${body}}, [${missingDeps.join(', ')}])`;
      }
      return match;
    }
  );

  return { content, modified };
}

files.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const { content: newContent, modified } = fixCriticalIssues(content, file);
    
    if (modified) {
      fs.writeFileSync(file, newContent);
      console.log(`✅ Fixed critical issues in: ${path.basename(file)}`);
      fixedCount++;
    }
  } catch (error) {
    console.error(`❌ Error processing ${file}:`, error.message);
  }
});

console.log(`\n🎉 Summary:`);
console.log(`   Files fixed: ${fixedCount}`);
console.log(`   Console statements removed: ${consoleRemoved}`);
console.log(`   Unused imports removed: ${unusedVarsRemoved}`);
console.log(`\n⚠️  Please review the changes and test your application.`);
