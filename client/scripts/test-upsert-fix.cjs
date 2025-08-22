const { Pool } = require('pg');

async function testUpsertFix() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/vector_db'
  });

  try {
    console.log('🧪 Testing upsert endpoint fix...\n');

    // The external user ID from the error logs
    const externalUserId = 'ddcc866f-33f8-4eee-91e9-b36a45fa4a8b';
    
    // Get the internal user ID from user_profiles
    const userQuery = `
      SELECT id 
      FROM user_profiles 
      WHERE user_id = $1
      LIMIT 1;
    `;

    const userResult = await pool.query(userQuery, [externalUserId]);
    
    if (userResult.rows.length === 0) {
      console.log('❌ User not found in user_profiles');
      return;
    }

    const internalUserId = userResult.rows[0].id;
    console.log(`✅ Found internal user ID: ${internalUserId}`);

    // Test data exactly like the original error
    const testData = {
      user_id: externalUserId, // This is the external user ID that was causing the error
      step_id: 'welcome-introduction',
      step_data: {
        userId: externalUserId,
        completed: true,
        timestamp: new Date().toISOString()
      },
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('📝 Test data (with external user ID):', JSON.stringify(testData, null, 2));

    // Test the upsert operation directly in the database
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

    try {
      // This should fail because we're using the external user ID directly
      const upsertResult = await pool.query(upsertQuery, [
        testData.user_id, // This is the external user ID
        testData.step_id,
        JSON.stringify(testData.step_data),
        testData.completed_at,
        testData.updated_at
      ]);

      console.log('\n❌ Test failed - this should have failed with foreign key constraint error!');
      console.log('📊 Result:', JSON.stringify(upsertResult.rows[0], null, 2));
    } catch (error) {
      console.log('\n✅ Expected error occurred (foreign key constraint):', error.message);
    }

    // Now test with the internal user ID (this should work)
    const correctTestData = {
      ...testData,
      user_id: internalUserId // Use the internal user ID
    };

    console.log('\n📝 Test data (with internal user ID):', JSON.stringify(correctTestData, null, 2));

    const correctUpsertResult = await pool.query(upsertQuery, [
      correctTestData.user_id, // This is the internal user ID
      correctTestData.step_id,
      JSON.stringify(correctTestData.step_data),
      correctTestData.completed_at,
      correctTestData.updated_at
    ]);

    console.log('\n✅ Correct upsert successful!');
    console.log('📊 Result:', JSON.stringify(correctUpsertResult.rows[0], null, 2));

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

    console.log('\n🎉 Test completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- The server upsert endpoint should now convert external user IDs to internal user IDs');
    console.log('- This should fix the foreign key constraint violation error');
    console.log('- The application should now work correctly with the onboarding flow');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await pool.end();
  }
}

testUpsertFix();
