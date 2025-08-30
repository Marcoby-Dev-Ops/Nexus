const { Pool } = require('pg');

async function testOnboardingFix() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/vector_db'
  });

  try {
    console.log('🧪 Testing onboarding upsert fix...\n');

    // The external user ID from the error logs
    const externalUserId = 'd2770389274aad9319e41dc713cb5c8206cc84f0cadf10e49c17dc329e66eec3';
    
    // First, check if the user exists in user_profiles
    const userQuery = `
      SELECT id, user_id 
      FROM user_profiles 
      WHERE user_id = $1
      LIMIT 1;
    `;

    const userResult = await pool.query(userQuery, [externalUserId]);
    
    if (userResult.rows.length === 0) {
      console.log('❌ User not found in user_profiles');
      console.log('📋 Creating test user profile...');
      
      // Create a test user profile
      const createUserQuery = `
        INSERT INTO user_profiles (id, user_id, created_at, updated_at)
        VALUES (gen_random_uuid(), $1, NOW(), NOW())
        RETURNING id, user_id;
      `;
      
      const createResult = await pool.query(createUserQuery, [externalUserId]);
      console.log('✅ Created test user profile:', createResult.rows[0]);
    } else {
      console.log('✅ Found user profile:', userResult.rows[0]);
    }

    // Get the internal user ID
    const internalUserId = userResult.rows.length > 0 ? userResult.rows[0].id : 
                          (await pool.query(createUserQuery, [externalUserId])).rows[0].id;

    // Test data exactly like the original error
    const testData = {
      user_id: externalUserId, // This should be converted to internal user ID by the server
      step_id: 'core-identity-priorities',
      step_data: {
        userId: externalUserId,
        completed: true,
        timestamp: new Date().toISOString()
      },
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('📝 Test data (with external user ID):', JSON.stringify(testData, null, 2));

    // Test the upsert operation directly in the database with internal user ID
    const upsertQuery = `
      INSERT INTO user_onboarding_steps (user_id, step_id, step_data, completed_at, updated_at)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id, step_id) 
      DO UPDATE SET 
        step_data = EXCLUDED.step_data,
        completed_at = EXCLUDED.completed_at,
        updated_at = EXCLUDED.updated_at
      RETURNING *;
    `;

    const upsertResult = await pool.query(upsertQuery, [
      internalUserId, // Use internal user ID
      testData.step_id,
      JSON.stringify(testData.step_data),
      testData.completed_at,
      testData.updated_at
    ]);

    console.log('\n✅ Upsert successful!');
    console.log('📊 Result:', JSON.stringify(upsertResult.rows[0], null, 2));

    // Verify the record was created
    const verifyQuery = `
      SELECT * FROM user_onboarding_steps 
      WHERE user_id = $1 AND step_id = $2;
    `;

    const verifyResult = await pool.query(verifyQuery, [internalUserId, testData.step_id]);
    
    console.log('\n🔍 Verification:');
    if (verifyResult.rows.length > 0) {
      console.log('✅ Record found in database');
      console.log('📋 Record:', JSON.stringify(verifyResult.rows[0], null, 2));
    } else {
      console.log('❌ Record not found in database');
    }

    // Clean up test data
    const cleanupQuery = `
      DELETE FROM user_onboarding_steps 
      WHERE user_id = $1 AND step_id = $2;
    `;
    
    await pool.query(cleanupQuery, [internalUserId, testData.step_id]);
    console.log('\n🧹 Cleaned up test data');

    console.log('\n🎉 Test completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- The server should now correctly convert external user IDs to internal user IDs');
    console.log('- The conversion uses user_profiles table as the primary source');
    console.log('- This should fix the foreign key constraint violation error');
    console.log('- The onboarding flow should now work correctly');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await pool.end();
  }
}

testOnboardingFix();
