const { Pool } = require('pg');

async function fixMissingCreatedAt() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/vector_db'
  });

  try {
    console.log('🔧 Fixing missing created_at column in user_onboarding_phases...\n');

    // Add the missing created_at column
    const addColumnQuery = `
      ALTER TABLE user_onboarding_phases 
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    `;

    console.log('📝 Adding created_at column...');
    await pool.query(addColumnQuery);
    console.log('✅ created_at column added successfully');

    // Update existing records to have a created_at value
    const updateQuery = `
      UPDATE user_onboarding_phases 
      SET created_at = COALESCE(completed_at, NOW())
      WHERE created_at IS NULL;
    `;

    console.log('📝 Updating existing records...');
    const updateResult = await pool.query(updateQuery);
    console.log(`✅ Updated ${updateResult.rowCount} existing records`);

    // Verify the fix
    const verifyQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'user_onboarding_phases' 
      AND column_name = 'created_at';
    `;

    const verifyResult = await pool.query(verifyQuery);
    
    if (verifyResult.rows.length > 0) {
      const column = verifyResult.rows[0];
      console.log('\n✅ Verification successful:');
      console.log(`  - created_at column exists: ${column.column_name}`);
      console.log(`  - Data type: ${column.data_type}`);
      console.log(`  - Nullable: ${column.is_nullable}`);
      console.log(`  - Default: ${column.column_default}`);
    } else {
      console.log('\n❌ created_at column still missing!');
    }

    // Test a query that was failing
    const testQuery = `
      SELECT phase_id, phase_data, completed_at, created_at 
      FROM user_onboarding_phases 
      WHERE user_id = $1 
      ORDER BY created_at DESC;
    `;

    console.log('\n🧪 Testing the query that was failing...');
    const testResult = await pool.query(testQuery, ['d2770389274aad9319e41dc713cb5c8206cc84f0cadf10e49c17dc329e66eec3']);
    console.log(`✅ Query successful! Found ${testResult.rows.length} records`);

    console.log('\n🎉 Fix completed successfully!');
    console.log('📋 Summary:');
    console.log('- Added missing created_at column');
    console.log('- Updated existing records with proper timestamps');
    console.log('- Verified the fix works');
    console.log('- The onboarding flow should now work correctly');

  } catch (error) {
    console.error('❌ Error fixing table:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await pool.end();
  }
}

fixMissingCreatedAt();
