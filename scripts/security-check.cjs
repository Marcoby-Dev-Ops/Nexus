/**
 * Security Check Script
 * Scans for potential secret leaks and security issues
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Patterns that might indicate secrets
const SECRET_PATTERNS = [
  /sk-[a-zA-Z0-9]{48}/,           // OpenAI API keys
  /pk_[a-zA-Z0-9]{24}/,           // Stripe publishable keys
  /sk_[a-zA-Z0-9]{24}/,           // Stripe secret keys
  /whsec_[a-zA-Z0-9]{24}/,        // Stripe webhook secrets
  /[a-zA-Z0-9]{32,}/,             // Generic long strings
  /password\s*[:=]\s*['"][^'"]+['"]/, // Hardcoded passwords
  /secret\s*[:=]\s*['"][^'"]+['"]/,   // Hardcoded secrets
  /api_key\s*[:=]\s*['"][^'"]+['"]/,  // Hardcoded API keys
];

// Files to exclude from scanning
const EXCLUDE_PATTERNS = [
  /node_modules/,
  /\.git/,
  /dist/,
  /build/,
  /coverage/,
  /\.env/,
  /package-lock\.json/,
  /pnpm-lock\.yaml/,
  /yarn\.lock/,
];

// Directories to scan
const SCAN_DIRECTORIES = [
  'src',
  'scripts',
  'docs',
  'supabase',
];

function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const issues = [];

    lines.forEach((line, index) => {
      SECRET_PATTERNS.forEach(pattern => {
        if (pattern.test(line)) {
          issues.push({
            line: index + 1,
            content: line.trim(),
            pattern: pattern.toString()
          });
        }
      });
    });

    return issues;
  } catch (error) {
    console.warn(`Warning: Could not read ${filePath}: ${error.message}`);
    return [];
  }
}

function shouldExcludeFile(filePath) {
  return EXCLUDE_PATTERNS.some(pattern => pattern.test(filePath));
}

function scanDirectory(dirPath) {
  const issues = [];
  
  try {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (!shouldExcludeFile(fullPath)) {
          issues.push(...scanDirectory(fullPath));
        }
      } else if (stat.isFile()) {
        if (!shouldExcludeFile(fullPath)) {
          const fileIssues = scanFile(fullPath);
          if (fileIssues.length > 0) {
            issues.push({
              file: fullPath,
              issues: fileIssues
            });
          }
        }
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not scan directory ${dirPath}: ${error.message}`);
  }
  
  return issues;
}

function checkGitHistory() {
  try {
    console.log('🔍 Checking Git history for potential secrets...');
    
    // Check for .env files in git history
    const envFiles = execSync('git log --all --full-history --name-only --pretty=format: | grep -E "\\.env" | sort | uniq', { encoding: 'utf8' });
    
    if (envFiles.trim()) {
      console.log('⚠️  Found .env files in Git history:');
      console.log(envFiles);
    } else {
      console.log('✅ No .env files found in Git history');
    }
  } catch (error) {
    console.log('ℹ️  Could not check Git history (not a Git repository or no .env files)');
  }
}

function checkEnvironmentFiles() {
  console.log('\n🔍 Checking environment files...');
  
  const envFiles = [
    '.env',
    '.env.local',
    '.env.production',
    '.env.staging',
    '.env.development'
  ];
  
  envFiles.forEach(file => {
    if (fs.existsSync(file)) {
      const stat = fs.statSync(file);
      console.log(`📁 ${file} exists (${stat.size} bytes)`);
      
      // Check if it's gitignored
      try {
        const gitStatus = execSync(`git status --porcelain ${file}`, { encoding: 'utf8' });
        if (gitStatus.trim()) {
          console.log(`⚠️  ${file} is tracked by Git!`);
        } else {
          console.log(`✅ ${file} is properly gitignored`);
        }
      } catch (error) {
        console.log(`ℹ️  Could not check Git status for ${file}`);
      }
    } else {
      console.log(`❌ ${file} does not exist`);
    }
  });
}

function main() {
  console.log('🔐 Nexus Security Check\n');
  
  // Check environment files
  checkEnvironmentFiles();
  
  // Check Git history
  checkGitHistory();
  
  // Scan code for potential secrets
  console.log('\n🔍 Scanning code for potential secrets...');
  const allIssues = [];
  
  SCAN_DIRECTORIES.forEach(dir => {
    if (fs.existsSync(dir)) {
      const issues = scanDirectory(dir);
      allIssues.push(...issues);
    }
  });
  
  if (allIssues.length > 0) {
    console.log('\n⚠️  Potential security issues found:');
    allIssues.forEach(({ file, issues }) => {
      console.log(`\n📄 ${file}:`);
      issues.forEach(({ line, content, pattern }) => {
        console.log(`   Line ${line}: ${content}`);
        console.log(`   Pattern: ${pattern}`);
      });
    });
    
    console.log('\n🚨 Please review these potential issues:');
    console.log('   - Remove any hardcoded secrets');
    console.log('   - Move secrets to environment variables');
    console.log('   - Use placeholder values in examples');
    
    process.exit(1);
  } else {
    console.log('\n✅ No obvious security issues found in code');
  }
  
  console.log('\n🎉 Security check completed!');
  console.log('\n📚 Next steps:');
  console.log('   1. Review the security guidelines in docs/current/SECURITY_GUIDELINES.md');
  console.log('   2. Set up pre-commit hooks for automated scanning');
  console.log('   3. Consider using a secret management service for production');
}

if (require.main === module) {
  main();
}

module.exports = { scanFile, scanDirectory, checkEnvironmentFiles };
