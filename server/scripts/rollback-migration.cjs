#!/usr/bin/env node

/**
 * Rollback Script: Restore original structure
 * 
 * This script restores the original structure by moving files back from client/ to root.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = process.cwd();
const CLIENT_DIR = path.join(ROOT_DIR, 'client');
const BACKUP_DIR = path.join(ROOT_DIR, 'backup-before-migration');

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    warning: '\x1b[33m', // Yellow
    error: '\x1b[31m',   // Red
    reset: '\x1b[0m'     // Reset
  };
  
  console.log(`${colors[type]}${message}${colors.reset}`);
}

function checkPrerequisites() {
  log('Checking prerequisites for rollback...', 'info');
  
  // Check if client directory exists
  if (!fs.existsSync(CLIENT_DIR)) {
    log('❌ Client directory not found. Nothing to rollback.', 'error');
    process.exit(1);
  }
  
  // Check if backup exists
  if (!fs.existsSync(BACKUP_DIR)) {
    log('⚠️  Backup directory not found. Will attempt rollback from client directory.', 'warning');
  }
  
  log('✅ Prerequisites check passed', 'success');
}

function rollbackFromBackup() {
  log('Rolling back from backup...', 'info');
  
  if (!fs.existsSync(BACKUP_DIR)) {
    log('❌ Backup directory not found', 'error');
    return false;
  }
  
  const filesToRestore = [
    'src',
    'public',
    'package.json',
    'vite.config.ts',
    'tsconfig.json',
    'tsconfig.app.json',
    'tsconfig.test.json',
    'tailwind.config.ts',
    'postcss.config.cjs',
    'index.html',
    'eslint.config.js',
    'jest.config.ts',
    'cypress.config.ts',
    '.storybook',
    '__tests__',
    'cypress',
    'test',
    'coverage',
    '.swcrc',
    'deno.lock',
    'pnpm-lock.yaml',
    'node_modules'
  ];
  
  let restoredCount = 0;
  let skippedCount = 0;
  
  for (const file of filesToRestore) {
    const backupPath = path.join(BACKUP_DIR, file);
    const restorePath = path.join(ROOT_DIR, file);
    
    if (fs.existsSync(backupPath)) {
      try {
        // Remove existing file/directory if it exists
        if (fs.existsSync(restorePath)) {
          if (fs.statSync(restorePath).isDirectory()) {
            execSync(`rm -rf "${restorePath}"`, { stdio: 'inherit' });
          } else {
            fs.unlinkSync(restorePath);
          }
        }
        
        // Create parent directory if it doesn't exist
        const restoreDir = path.dirname(restorePath);
        if (!fs.existsSync(restoreDir)) {
          fs.mkdirSync(restoreDir, { recursive: true });
        }
        
        // Restore the file/directory
        if (fs.statSync(backupPath).isDirectory()) {
          execSync(`cp -r "${backupPath}" "${restorePath}"`, { stdio: 'inherit' });
        } else {
          fs.copyFileSync(backupPath, restorePath);
        }
        
        log(`  ✅ Restored: ${file}`, 'success');
        restoredCount++;
      } catch (error) {
        log(`  ❌ Failed to restore ${file}: ${error.message}`, 'error');
      }
    } else {
      log(`  ⚠️  Skipped: ${file} (not found in backup)`, 'warning');
      skippedCount++;
    }
  }
  
  log(`✅ Backup restoration complete: ${restoredCount} restored, ${skippedCount} skipped`, 'success');
  return true;
}

function rollbackFromClient() {
  log('Rolling back from client directory...', 'info');
  
  if (!fs.existsSync(CLIENT_DIR)) {
    log('❌ Client directory not found', 'error');
    return false;
  }
  
  const filesToRestore = [
    'src',
    'public',
    'package.json',
    'vite.config.ts',
    'tsconfig.json',
    'tsconfig.app.json',
    'tsconfig.test.json',
    'tailwind.config.ts',
    'postcss.config.cjs',
    'index.html',
    'eslint.config.js',
    'jest.config.ts',
    'cypress.config.ts',
    '.storybook',
    '__tests__',
    'cypress',
    'test',
    'coverage',
    '.swcrc',
    'deno.lock',
    'pnpm-lock.yaml',
    'node_modules'
  ];
  
  let restoredCount = 0;
  let skippedCount = 0;
  
  for (const file of filesToRestore) {
    const clientPath = path.join(CLIENT_DIR, file);
    const restorePath = path.join(ROOT_DIR, file);
    
    if (fs.existsSync(clientPath)) {
      try {
        // Remove existing file/directory if it exists
        if (fs.existsSync(restorePath)) {
          if (fs.statSync(restorePath).isDirectory()) {
            execSync(`rm -rf "${restorePath}"`, { stdio: 'inherit' });
          } else {
            fs.unlinkSync(restorePath);
          }
        }
        
        // Create parent directory if it doesn't exist
        const restoreDir = path.dirname(restorePath);
        if (!fs.existsSync(restoreDir)) {
          fs.mkdirSync(restoreDir, { recursive: true });
        }
        
        // Move the file/directory back to root
        fs.renameSync(clientPath, restorePath);
        
        log(`  ✅ Restored: ${file}`, 'success');
        restoredCount++;
      } catch (error) {
        log(`  ❌ Failed to restore ${file}: ${error.message}`, 'error');
      }
    } else {
      log(`  ⚠️  Skipped: ${file} (not found in client)`, 'warning');
      skippedCount++;
    }
  }
  
  log(`✅ Client restoration complete: ${restoredCount} restored, ${skippedCount} skipped`, 'success');
  return true;
}

function cleanupAfterRollback() {
  log('Cleaning up after rollback...', 'info');
  
  // Remove client directory if it's empty
  if (fs.existsSync(CLIENT_DIR)) {
    try {
      const clientContents = fs.readdirSync(CLIENT_DIR);
      if (clientContents.length === 0) {
        fs.rmdirSync(CLIENT_DIR);
        log('  ✅ Removed empty client directory', 'success');
      } else {
        log(`  ⚠️  Client directory not empty (${clientContents.length} items remaining)`, 'warning');
      }
    } catch (error) {
      log(`  ❌ Failed to remove client directory: ${error.message}`, 'error');
    }
  }
  
  // Remove root package.json if it was created by migration
  const rootPackagePath = path.join(ROOT_DIR, 'package.json');
  if (fs.existsSync(rootPackagePath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(rootPackagePath, 'utf8'));
      if (packageJson.name === 'nexus-platform' && packageJson.workspaces) {
        fs.unlinkSync(rootPackagePath);
        log('  ✅ Removed migration-created root package.json', 'success');
      }
    } catch (error) {
      log(`  ⚠️  Could not check root package.json: ${error.message}`, 'warning');
    }
  }
  
  log('✅ Cleanup complete', 'success');
}

function restoreOriginalConfigs() {
  log('Restoring original configurations...', 'info');
  
  // Restore original vite.config.ts paths
  const viteConfigPath = path.join(ROOT_DIR, 'vite.config.ts');
  if (fs.existsSync(viteConfigPath)) {
    try {
      let content = fs.readFileSync(viteConfigPath, 'utf8');
      
      // Revert __dirname changes
      content = content.replace(
        /const __dirname = dirname\(fileURLToPath\(import\.meta\.url\)\)/g,
        'const __dirname = dirname(import.meta.url)'
      );
      
      fs.writeFileSync(viteConfigPath, content);
      log('  ✅ Restored vite.config.ts', 'success');
    } catch (error) {
      log(`  ❌ Failed to restore vite.config.ts: ${error.message}`, 'error');
    }
  }
  
  // Restore original package.json name
  const packageJsonPath = path.join(ROOT_DIR, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      if (packageJson.name === 'nexus-client') {
        packageJson.name = 'nexus-dashboard';
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
        log('  ✅ Restored package.json name', 'success');
      }
    } catch (error) {
      log(`  ❌ Failed to restore package.json: ${error.message}`, 'error');
    }
  }
  
  log('✅ Configuration restoration complete', 'success');
}

function runRollback() {
  try {
    log('🔄 Starting Nexus Migration Rollback', 'info');
    log('====================================', 'info');
    
    checkPrerequisites();
    
    // Try to rollback from backup first, then from client
    let rollbackSuccess = false;
    
    if (fs.existsSync(BACKUP_DIR)) {
      log('Found backup directory, attempting rollback from backup...', 'info');
      rollbackSuccess = rollbackFromBackup();
    }
    
    if (!rollbackSuccess && fs.existsSync(CLIENT_DIR)) {
      log('Attempting rollback from client directory...', 'info');
      rollbackSuccess = rollbackFromClient();
    }
    
    if (rollbackSuccess) {
      cleanupAfterRollback();
      restoreOriginalConfigs();
      
      log('', 'info');
      log('🎉 Rollback completed successfully!', 'success');
      log('', 'info');
      log('The project structure has been restored to its original state.', 'success');
      log('You can now run: pnpm install && pnpm dev', 'info');
    } else {
      log('❌ Rollback failed - no valid source found', 'error');
      process.exit(1);
    }
    
  } catch (error) {
    log(`❌ Rollback failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

if (require.main === module) {
  runRollback();
}

module.exports = { runRollback };
