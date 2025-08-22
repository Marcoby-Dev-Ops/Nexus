const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/vector_db',
});

async function testProfileCreation() {
  const client = await pool.connect();
  try {
    console.log('Testing profile creation...');
    
    const testUserId = 'd2770389274aad9319e41dc713cb5c8206cc84f0cadf10e49c17dc329e66eec3';
    
    // Test 1: Check if function exists
    console.log('\n1. Checking if ensure_user_profile function exists...');
    const functionCheck = await client.query(`
      SELECT routine_name, routine_type 
      FROM information_schema.routines 
      WHERE routine_name = 'ensure_user_profile'
    `);
    console.log('Functions found:', functionCheck.rows);
    
    // Test 2: Check user_profiles table structure
    console.log('\n2. Checking user_profiles table structure...');
    const tableCheck = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'user_profiles' 
      ORDER BY ordinal_position
    `);
    console.log('Table columns:', tableCheck.rows.map(r => `${r.column_name} (${r.data_type})`));
    
    // Test 3: Try to call the function directly
    console.log('\n3. Testing ensure_user_profile function...');
    try {
      const result = await client.query('SELECT * FROM ensure_user_profile($1)', [testUserId]);
      console.log('Function result:', result.rows);
    } catch (error) {
      console.error('Function call failed:', error.message);
    }
    
    // Test 4: Check if profile exists manually
    console.log('\n4. Checking if profile exists manually...');
    const profileCheck = await client.query('SELECT * FROM user_profiles WHERE user_id = $1', [testUserId]);
    console.log('Existing profiles:', profileCheck.rows);
    
    // Test 5: Try to insert profile manually
    console.log('\n5. Testing manual profile insertion...');
    try {
      const insertResult = await client.query(`
        INSERT INTO user_profiles (user_id, email, first_name, last_name, display_name, onboarding_completed, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        ON CONFLICT (user_id) DO NOTHING
        RETURNING *
      `, [testUserId, `${testUserId}@authentik.local`, null, null, null, false]);
      console.log('Manual insert result:', insertResult.rows);
    } catch (error) {
      console.error('Manual insert failed:', error.message);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

testProfileCreation();
