const fs = require('fs');
const path = require('path');

// Common patterns for missing dependencies
const commonDeps = [
  'dispatch',
  'setState',
  'ref',
  'callback',
  'handler',
  'function',
  'async',
  'await'
];

function findMissingDependencies(body, fullContent) {
  const deps = [];
  
  // Look for common dependency patterns
  commonDeps.forEach(dep => {
    if (body.includes(dep) && fullContent.includes(dep)) {
      deps.push(dep);
    }
  });
  
  return deps;
}

function fixHookDependencies(content, filePath) {
  let modified = false;
  
  // Fix useEffect dependencies - empty dependency array
  content = content.replace(
    /useEffect\s*\(\s*\(\)\s*=>\s*\{([^}]+)\}\s*,\s*\[\s*\]\s*\)/g,
    (match, body) => {
      const missingDeps = findMissingDependencies(body, content);
      if (missingDeps.length > 0) {
        modified = true;
        console.log(`  Found useEffect with missing deps: ${missingDeps.join(', ')}`);
        return `useEffect(() => {${body}}, [${missingDeps.join(', ')}])`;
      }
      return match;
    }
  );
  
  // Fix useCallback dependencies - empty dependency array
  content = content.replace(
    /useCallback\s*\(\s*\([^)]*\)\s*=>\s*\{([^}]+)\}\s*,\s*\[\s*\]\s*\)/g,
    (match, body) => {
      const missingDeps = findMissingDependencies(body, content);
      if (missingDeps.length > 0) {
        modified = true;
        console.log(`  Found useCallback with missing deps: ${missingDeps.join(', ')}`);
        return `useCallback((...args) => {${body}}, [${missingDeps.join(', ')}])`;
      }
      return match;
    }
  );
  
  return { content, modified };
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const { content: newContent, modified } = fixHookDependencies(content, filePath);
    
    if (modified) {
      fs.writeFileSync(filePath, newContent);
      console.log(`✅ Fixed hook dependencies in: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Use PowerShell to find files
const { execSync } = require('child_process');

try {
  const filesOutput = execSync('powershell -Command "Get-ChildItem -Path \\"src\\" -Recurse -Include \\"*.ts\\",\\"*.tsx\\",\\"*.js\\",\\"*.jsx\\" | Select-Object -ExpandProperty FullName"', { encoding: 'utf8' });
  const files = filesOutput.trim().split('\n').filter(f => f.trim());
  
  console.log(`🔍 Found ${files.length} files to check for hook dependency issues...`);
  
  let fixedCount = 0;
  files.forEach(file => {
    if (processFile(file)) {
      fixedCount++;
    }
  });
  
  console.log(`\n🎉 Fixed hook dependencies in ${fixedCount} files!`);
  console.log('⚠️  Please review the changes and test your application.');
} catch (error) {
  console.error('❌ Error:', error.message);
}
