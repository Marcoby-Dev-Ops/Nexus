const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function applyCriticalMigration() {
  const client = await pool.connect();
  
  try {
    console.log('Applying critical migration: 075_fix_ensure_user_profile_parameter_mismatch.sql');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', '075_fix_ensure_user_profile_parameter_mismatch.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Apply the migration
    await client.query(migrationSQL);
    
    console.log('✅ Critical migration applied successfully');
    
    // Test the function
    console.log('Testing ensure_user_profile function...');
    const testResult = await client.query('SELECT ensure_user_profile($1)', ['test-user-id']);
    console.log('✅ Function test successful:', testResult.rows);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

// Run the migration
applyCriticalMigration()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
