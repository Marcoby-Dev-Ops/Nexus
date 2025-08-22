import pg from 'pg';
const { Pool } = pg;

async function checkDatabaseSchema() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/vector_db'
  });

  try {
    console.log('🔍 Checking database schema...\n');

    // Check user_profiles table structure
    console.log('📋 Checking user_profiles table structure...');
    const schemaQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'user_profiles' 
      ORDER BY ordinal_position
    `;
    
    const schemaResult = await pool.query(schemaQuery);
    console.log('✅ user_profiles table columns:');
    schemaResult.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // Check if user exists
    console.log('\n👤 Checking if user exists...');
    const externalUserId = 'd2770389274aad9319e41dc713cb5c8206cc84f0cadf10e49c17dc329e66eec3';
    
    const userQuery = `
      SELECT * FROM user_profiles 
      WHERE user_id = $1
      LIMIT 1
    `;
    
    const userResult = await pool.query(userQuery, [externalUserId]);
    
    if (userResult.rows.length > 0) {
      console.log('✅ User found:', userResult.rows[0]);
    } else {
      console.log('❌ User not found');
    }

    // Check onboarding steps table
    console.log('\n📝 Checking user_onboarding_steps table...');
    const stepsSchemaQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'user_onboarding_steps' 
      ORDER BY ordinal_position
    `;
    
    const stepsSchemaResult = await pool.query(stepsSchemaQuery);
    console.log('✅ user_onboarding_steps table columns:');
    stepsSchemaResult.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

  } catch (error) {
    console.error('❌ Error checking schema:', error);
  } finally {
    await pool.end();
  }
}

checkDatabaseSchema();
