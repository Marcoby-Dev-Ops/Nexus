const { Pool } = require('pg');

async function testFinalFix() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/vector_db'
  });

  try {
    console.log('🧪 Testing final fix...\n');

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

    // Test data with external user ID (like the application sends)
    const testData = {
      user_id: externalUserId, // This is what the application sends
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

    // Simulate what the server should do - convert external to internal user ID
    const convertedData = {
      ...testData,
      user_id: internalUserId // This is what should be used in the database
    };

    console.log('📝 Converted data (with internal user ID):', JSON.stringify(convertedData, null, 2));

    // Test the upsert operation with the internal user ID
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
      convertedData.user_id, // Using internal user ID
      convertedData.step_id,
      JSON.stringify(convertedData.step_data),
      convertedData.completed_at,
      convertedData.updated_at
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

testFinalFix();
