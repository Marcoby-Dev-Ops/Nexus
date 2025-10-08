const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5433,
  user: 'postgres',
  password: 'postgres',
  database: 'vector_db'
});

async function migrateQuantumData() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Starting quantum profile data migration...');
    
    // Check if there are any records with company_id but no organization_id
    const recordsToMigrate = await client.query(`
      SELECT id, company_id, organization_id
      FROM quantum_business_profiles 
      WHERE company_id IS NOT NULL AND organization_id IS NULL;
    `);
    
    console.log(`📊 Found ${recordsToMigrate.rows.length} records to migrate`);
    
    if (recordsToMigrate.rows.length === 0) {
      console.log('✅ No records need migration');
      return;
    }
    
    // For each record, we need to find the corresponding organization_id
    // Since we don't have a direct mapping, we'll use the user_profiles table
    for (const record of recordsToMigrate.rows) {
      console.log(`🔄 Migrating record ${record.id}...`);
      
      // Find the organization_id from user_profiles where company_id matches
      const userProfile = await client.query(`
        SELECT organization_id 
        FROM user_profiles 
        WHERE company_id = $1 
        LIMIT 1;
      `, [record.company_id]);
      
      if (userProfile.rows.length > 0 && userProfile.rows[0].organization_id) {
        // Update the quantum profile with the organization_id
        await client.query(`
          UPDATE quantum_business_profiles 
          SET organization_id = $1 
          WHERE id = $2;
        `, [userProfile.rows[0].organization_id, record.id]);
        
        console.log(`✅ Migrated record ${record.id} to organization_id ${userProfile.rows[0].organization_id}`);
      } else {
        console.log(`⚠️ No organization_id found for company_id ${record.company_id}, skipping record ${record.id}`);
      }
    }
    
    // Verify migration
    const remainingRecords = await client.query(`
      SELECT COUNT(*) as count
      FROM quantum_business_profiles 
      WHERE company_id IS NOT NULL AND organization_id IS NULL;
    `);
    
    console.log(`📊 Migration complete. ${remainingRecords.rows[0].count} records still need organization_id`);
    
    // Show final table structure
    console.log('📋 Final table structure:');
    const structure = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'quantum_business_profiles' 
      ORDER BY ordinal_position;
    `);
    
    structure.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    console.log('✅ Quantum profile data migration completed!');
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrateQuantumData().catch(console.error);
