const { query } = require('./src/database/connection');

async function checkOrganizationStructure() {
  try {
    console.log('=== Checking Organization Structure ===\n');
    
    // Check organizations table
    const orgsTable = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'organizations'
      ORDER BY ordinal_position
    `);
    
    if (orgsTable.data.length > 0) {
      console.log('Organizations table structure:');
      orgsTable.data.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    } else {
      console.log('Organizations table not found');
    }
    
    // Check user_organizations table
    const userOrgsTable = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'user_organizations'
      ORDER BY ordinal_position
    `);
    
    if (userOrgsTable.data.length > 0) {
      console.log('\nUser_organizations table structure:');
      userOrgsTable.data.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    } else {
      console.log('\nUser_organizations table not found');
    }
    
    // Check foreign key constraints
    const fkConstraints = await query(`
      SELECT 
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = 'user_organizations'
    `);
    
    console.log('\nForeign key constraints on user_organizations:');
    fkConstraints.data.forEach(fk => {
      console.log(`  - ${fk.constraint_name}: ${fk.table_name}.${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
    });
    
    // Check existing data
    const orgCount = await query('SELECT COUNT(*) as count FROM organizations');
    const userOrgCount = await query('SELECT COUNT(*) as count FROM user_organizations');
    const userProfileCount = await query('SELECT COUNT(*) as count FROM user_profiles');
    
    console.log('\nExisting data counts:');
    console.log(`  - Organizations: ${orgCount.data[0].count}`);
    console.log(`  - User Organizations: ${userOrgCount.data[0].count}`);
    console.log(`  - User Profiles: ${userProfileCount.data[0].count}`);
    
  } catch (error) {
    console.error('Error checking organization structure:', error);
  }
}

checkOrganizationStructure();
