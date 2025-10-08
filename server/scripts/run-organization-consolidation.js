#!/usr/bin/env node

/**
 * Organization Consolidation Migration Script
 * 
 * This script safely migrates from the dual companies/organizations system
 * to a single consolidated organizations table.
 */

const { query } = require('../src/database/connection');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  console.log('🚀 Starting Organization Consolidation Migration...\n');

  try {
    // Step 1: Check current state
    console.log('📊 Checking current database state...');
    
    const companiesResult = await query('SELECT COUNT(*) as count FROM companies');
    const organizationsResult = await query('SELECT COUNT(*) as count FROM organizations');
    const userOrgsResult = await query('SELECT COUNT(*) as count FROM user_organizations');
    
    const companiesCount = companiesResult.rows?.[0]?.count || 0;
    const organizationsCount = organizationsResult.rows?.[0]?.count || 0;
    const userOrgsCount = userOrgsResult.rows?.[0]?.count || 0;
    
    console.log(`   Companies: ${companiesCount}`);
    console.log(`   Organizations: ${organizationsCount}`);
    console.log(`   User-Organization relationships: ${userOrgsCount}\n`);

    // Step 2: Extend organizations table
    console.log('🔧 Extending organizations table with company fields...');
    
    const extendTableSQL = fs.readFileSync(
      path.join(__dirname, '../migrations/070_extend_organizations_table.sql'), 
      'utf8'
    );
    
    await query(extendTableSQL);
    console.log('   ✅ Organizations table extended successfully\n');

    // Step 3: Migrate companies data
    console.log('🔄 Migrating companies data to organizations...');
    
    const migrateDataSQL = fs.readFileSync(
      path.join(__dirname, '../migrations/071_migrate_companies_to_organizations.sql'), 
      'utf8'
    );
    
    await query(migrateDataSQL);
    console.log('   ✅ Companies data migrated successfully\n');

    // Step 4: Verify migration
    console.log('✅ Verifying migration results...');
    
    const newOrganizationsResult = await query('SELECT COUNT(*) as count FROM organizations');
    const newUserOrgsResult = await query('SELECT COUNT(*) as count FROM user_organizations');
    const usersWithOrgsResult = await query(`
      SELECT COUNT(*) as count FROM user_profiles 
      WHERE organization_id IS NOT NULL
    `);
    
    const newOrganizationsCount = newOrganizationsResult.rows?.[0]?.count || 0;
    const newUserOrgsCount = newUserOrgsResult.rows?.[0]?.count || 0;
    const usersWithOrgs = usersWithOrgsResult.rows?.[0]?.count || 0;
    
    console.log(`   Organizations after migration: ${newOrganizationsCount}`);
    console.log(`   User-Organization relationships: ${newUserOrgsCount}`);
    console.log(`   Users with organization references: ${usersWithOrgs}\n`);

    // Step 5: Optional cleanup (commented out for safety)
    console.log('⚠️  Migration completed successfully!');
    console.log('   Note: Companies table still exists for rollback safety.');
    console.log('   To complete cleanup, manually drop the companies table after verification.\n');

    console.log('🎉 Organization consolidation migration completed successfully!');
    console.log('   Users should now see their organizations in the header instead of "No Organizations".');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('Error details:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run the migration
if (require.main === module) {
  runMigration().then(() => {
    console.log('\n✅ Migration script completed');
    process.exit(0);
  }).catch((error) => {
    console.error('\n❌ Migration script failed:', error);
    process.exit(1);
  });
}

module.exports = { runMigration };
