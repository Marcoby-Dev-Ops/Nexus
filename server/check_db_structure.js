const { query } = require('./src/database/connection');

async function checkDatabaseStructure() {
  try {
    console.log('=== Checking Database Structure ===\n');
    
    // Check user-related tables
    const userTables = await query(`
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%user%'
      ORDER BY table_name
    `);
    
    console.log('User-related tables:');
    userTables.data.forEach(table => {
      console.log(`  - ${table.table_name} (${table.table_type})`);
    });
    
    // Check if users table exists and its structure
    const usersTable = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'users'
      ORDER BY ordinal_position
    `);
    
    if (usersTable.data.length > 0) {
      console.log('\nUsers table structure:');
      usersTable.data.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    } else {
      console.log('\nUsers table not found');
    }
    
    // Check user_profiles table
    const userProfilesTable = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'user_profiles'
      ORDER BY ordinal_position
    `);
    
    if (userProfilesTable.data.length > 0) {
      console.log('\nUser_profiles table structure:');
      userProfilesTable.data.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    } else {
      console.log('\nUser_profiles table not found');
    }
    
    // Check organizations table
    const orgsTable = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'organizations'
      ORDER BY ordinal_position
    `);
    
    if (orgsTable.data.length > 0) {
      console.log('\nOrganizations table structure:');
      orgsTable.data.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    } else {
      console.log('\nOrganizations table not found');
    }
    
  } catch (error) {
    console.error('Error checking database structure:', error);
  }
}

checkDatabaseStructure();
