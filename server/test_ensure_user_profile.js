const { query } = require('./src/database/connection');

async function testEnsureUserProfile() {
  try {
    console.log('Testing ensure_user_profile function...');
    
    // Check if there are any user profiles
    const userProfiles = await query(`
      SELECT user_id, email, first_name, last_name 
      FROM user_profiles 
      LIMIT 5
    `);
    
    console.log('User profiles:', userProfiles);
    
    // Test the function with a known user ID (call it with specific columns)
    if (userProfiles.data && userProfiles.data.length > 0) {
      const testUserId = userProfiles.data[0].user_id;
      console.log(`Testing with user ID: ${testUserId}`);
      
      // Test the function by calling it with specific columns
      const result = await query(`
        SELECT 
          id,
          user_id,
          first_name,
          last_name,
          email,
          phone,
          avatar_url,
          bio,
          company_name,
          job_title,
          location,
          website,
          social_links,
          preferences,
          created_at,
          updated_at,
          onboarding_completed,
          company_id,
          onboarding_started_at,
          onboarding_completed_at,
          display_name,
          organization_id
        FROM ensure_user_profile($1)
      `, [testUserId]);
      
      console.log('Function result:', result);
      
      if (result.error) {
        console.error('Function error:', result.error);
      }
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testEnsureUserProfile();
