const { Pool } = require('pg');

async function debugUserMapping() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/vector_db'
  });

  try {
    console.log('🔍 Debugging user mapping issue...\n');

    const externalUserId = 'ddcc866f-33f8-4eee-91e9-b36a45fa4a8b';
    
    console.log(`External User ID: ${externalUserId}\n`);

    // Check user_mappings table
    console.log('1. Checking user_mappings table:');
    const userMappingsResult = await pool.query(
      'SELECT * FROM user_mappings WHERE external_user_id = $1',
      [externalUserId]
    );
    console.log('User mappings:', userMappingsResult.rows);

    // Check external_user_mappings table
    console.log('\n2. Checking external_user_mappings table:');
    const externalMappingsResult = await pool.query(
      'SELECT * FROM external_user_mappings WHERE external_user_id = $1',
      [externalUserId]
    );
    console.log('External mappings:', externalMappingsResult.rows);

    // Check user_profiles table
    console.log('\n3. Checking user_profiles table:');
    const userProfilesResult = await pool.query(
      'SELECT * FROM user_profiles WHERE user_id = $1',
      [externalUserId]
    );
    console.log('User profiles:', userProfilesResult.rows);

    // Check if the user exists in user_profiles with a different ID
    console.log('\n4. Checking all user_profiles entries:');
    const allProfilesResult = await pool.query(
      'SELECT id, user_id, created_at FROM user_profiles ORDER BY created_at DESC LIMIT 5'
    );
    console.log('Recent user profiles:', allProfilesResult.rows);

    // Check what the server thinks the internal user ID should be
    console.log('\n5. Checking what the server should use as internal user ID:');
    const serverUserResult = await pool.query(
      'SELECT get_current_user_id() as current_user_id'
    );
    console.log('Server current user ID:', serverUserResult.rows[0]);

    console.log('\n🎯 Analysis:');
    if (userMappingsResult.rows.length === 0 && externalMappingsResult.rows.length === 0) {
      console.log('❌ No user mapping found in either table');
      console.log('💡 The user ID conversion logic is failing because there\'s no mapping');
    } else {
      console.log('✅ User mapping found');
    }

    if (userProfilesResult.rows.length === 0) {
      console.log('❌ No user profile found with external user ID');
    } else {
      console.log('✅ User profile found');
    }

  } catch (error) {
    console.error('❌ Error during debugging:', error.message);
  } finally {
    await pool.end();
  }
}

debugUserMapping();
