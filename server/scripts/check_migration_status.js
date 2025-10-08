#!/usr/bin/env node

/**
 * Script to check migration status and debug migration issues
 */

require('../loadEnv');
const { query } = require('../src/database/connection');
const fs = require('fs').promises;
const path = require('path');

async function checkMigrationStatus() {
  try {
    console.log('🔍 Checking migration status...\n');

    // Get applied migrations from database
    const appliedResult = await query('SELECT version, name, applied_at FROM schema_migrations ORDER BY version');
    if (appliedResult.error) {
      console.error('❌ Failed to get applied migrations:', appliedResult.error);
      return;
    }

    const appliedMigrations = appliedResult.data || [];
    console.log('📋 Applied migrations:');
    appliedMigrations.forEach(migration => {
      console.log(`  ✅ ${migration.version} - ${migration.name} (${migration.applied_at})`);
    });

    // Get migration files from filesystem
    const migrationsPath = path.join(process.cwd(), 'migrations');
    const files = await fs.readdir(migrationsPath);
    const migrationFiles = files
      .filter(file => file.endsWith('.sql'))
      .sort((a, b) => {
        const aPrefix = parseInt(a.split('_')[0]) || 0;
        const bPrefix = parseInt(b.split('_')[0]) || 0;
        return aPrefix - bPrefix;
      })
      .map(file => ({
        filename: file,
        version: file.split('_')[0]
      }));

    console.log('\n📁 Migration files found:');
    migrationFiles.forEach(file => {
      console.log(`  📄 ${file.version} - ${file.filename}`);
    });

    // Find pending migrations
    const appliedVersions = new Set(appliedMigrations.map(m => m.version));
    const pendingMigrations = migrationFiles.filter(m => !appliedVersions.has(m.version));

    console.log('\n⏳ Pending migrations:');
    if (pendingMigrations.length === 0) {
      console.log('  ✅ No pending migrations');
    } else {
      pendingMigrations.forEach(migration => {
        console.log(`  ⏳ ${migration.version} - ${migration.filename}`);
      });
    }

    // Check specific migration 080
    console.log('\n🔍 Checking migration 080 specifically:');
    const migration080 = appliedMigrations.find(m => m.version === '080');
    if (migration080) {
      console.log(`  ✅ Migration 080 is applied: ${migration080.name} (${migration080.applied_at})`);
    } else {
      console.log('  ❌ Migration 080 is NOT applied');
    }

    const file080 = migrationFiles.find(f => f.version === '080');
    if (file080) {
      console.log(`  📄 Migration 080 file exists: ${file080.filename}`);
    } else {
      console.log('  ❌ Migration 080 file does NOT exist');
    }

  } catch (error) {
    console.error('❌ Error checking migration status:', error);
  }
}

checkMigrationStatus();
