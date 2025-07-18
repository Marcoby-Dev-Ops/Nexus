const fs = require('fs');
const path = require('path');
const glob = require('glob');

const SRC_DIR = path.resolve(__dirname, '../src');

// Define your aliases here
const ALIAS_MAP = {
  '@shared/': path.join(SRC_DIR, 'shared') + '/',
  '@billing/': path.join(SRC_DIR, 'billing') + '/',
  '@dashboard/': path.join(SRC_DIR, 'dashboard') + '/',
  '@onboarding/': path.join(SRC_DIR, 'onboarding') + '/',
  '@features/': path.join(SRC_DIR, 'features') + '/',
  '@user/': path.join(SRC_DIR, 'user') + '/',
  '@/': SRC_DIR + '/', // fallback for everything else
};

function getAliasPath(absPath) {
  // Find the most specific (longest) matching alias
  let bestAlias = null;
  let bestAliasPath = '';
  for (const [alias, aliasAbsPath] of Object.entries(ALIAS_MAP)) {
    if (absPath.startsWith(aliasAbsPath) && aliasAbsPath.length > bestAliasPath.length) {
      bestAlias = alias;
      bestAliasPath = aliasAbsPath;
    }
  }
  if (bestAlias) {
    return bestAlias + path.relative(bestAliasPath, absPath).replace(/\\/g, '/');
  }
  return null;
}

function fixImportsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  content = content.replace(
    /import\s+([\s\S]+?)\s+from\s+['"](\.{1,2}\/[^'"\n]+)['"]/g,
    (match, imports, relPath) => {
      const absImportPath = path.resolve(path.dirname(filePath), relPath);
      // Try .ts, .tsx, .js, .jsx, /index.ts, /index.tsx, /index.js, /index.jsx
      const possibleExts = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js', '/index.jsx'];
      let target = null;
      for (const ext of possibleExts) {
        if (fs.existsSync(absImportPath + ext)) {
          target = absImportPath + ext;
          break;
        }
      }
      if (!target) return match; // leave unchanged if not found

      // Remove file extension for import
      const targetNoExt = target.replace(/\.(ts|tsx|js|jsx)$/, '');
      const aliasPath = getAliasPath(targetNoExt);
      if (aliasPath) {
        changed = true;
        return `import ${imports} from '${aliasPath}'`;
      }
      return match;
    }
  );

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated imports in: ${filePath}`);
  }
}

glob.sync(path.join(SRC_DIR, '**/*.{ts,tsx}')).forEach(fixImportsInFile);

console.log('Alias import fix complete.'); 