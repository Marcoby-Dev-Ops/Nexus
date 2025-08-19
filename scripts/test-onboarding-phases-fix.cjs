const { Pool } = require('pg');

async function testOnboardingPhasesFix() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/vector_db'
  });

  try {
    console.log('🧪 Testing onboarding phases fix...\n');

    // The external user ID from the error logs
    const externalUserId = 'd2770389274aad9319e41dc713cb5c8206cc84f0cadf10e49c17dc329e66eec3';
    
    // First, check if the user exists in user_profiles
    const userQuery = `
      SELECT user_id 
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
        INSERT INTO user_profiles (user_id, created_at, updated_at)
        VALUES ($1, NOW(), NOW())
        RETURNING user_id;
      `;
      
      const createResult = await pool.query(createUserQuery, [externalUserId]);
      console.log('✅ Created test user profile:', createResult.rows[0]);
    } else {
      console.log('✅ Found user profile:', userResult.rows[0]);
    }

    // Test data for user_onboarding_phases
    const testPhaseData = {
      user_id: externalUserId,
      phase_id: 'fast-wins-context',
      phase_data: {
        userId: externalUserId,
        completed: true,
        timestamp: new Date().toISOString()
      },
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('📝 Test phase data:', JSON.stringify(testPhaseData, null, 2));

    // Test the INSERT operation directly in the database
    const insertQuery = `
      INSERT INTO user_onboarding_phases (user_id, phase_id, phase_data, completed_at, updated_at)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id, phase_id) 
      DO UPDATE SET 
        phase_data = EXCLUDED.phase_data,
        completed_at = EXCLUDED.completed_at,
        updated_at = EXCLUDED.updated_at
      RETURNING *;
    `;

    const insertResult = await pool.query(insertQuery, [
      testPhaseData.user_id,
      testPhaseData.phase_id,
      JSON.stringify(testPhaseData.phase_data),
      testPhaseData.completed_at,
      testPhaseData.updated_at
    ]);

    console.log('✅ Phase data inserted successfully:', insertResult.rows[0]);

    // Test the SELECT operation
    const selectQuery = `
      SELECT * FROM user_onboarding_phases 
      WHERE user_id = $1 AND phase_id = $2;
    `;

    const selectResult = await pool.query(selectQuery, [externalUserId, testPhaseData.phase_id]);
    console.log('✅ Phase data retrieved successfully:', selectResult.rows[0]);

    // Clean up test data
    const cleanupQuery = `
      DELETE FROM user_onboarding_phases 
      WHERE user_id = $1 AND phase_id = $2;
    `;
    
    await pool.query(cleanupQuery, [externalUserId, testPhaseData.phase_id]);
    console.log('🧹 Test data cleaned up');

    console.log('\n🎉 All tests passed! The onboarding phases fix is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await pool.end();
  }
}

// Run the test
testOnboardingPhasesFix();
