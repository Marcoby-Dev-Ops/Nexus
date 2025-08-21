import pg from 'pg';
const { Pool } = pg;

async function fixOnboardingStatus() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/vector_db'
  });

  try {
    console.log('🔍 Checking onboarding status...\n');

    const externalUserId = 'd2770389274aad9319e41dc713cb5c8206cc84f0cadf10e49c17dc329e66eec3';
    
    // 1. Check current user profile status
    console.log('📋 Checking user profile...');
    const profileQuery = `
      SELECT 
        user_id, 
        first_name, 
        last_name, 
        email, 
        onboarding_completed,
        company_id,
        organization_id,
        created_at,
        updated_at
      FROM user_profiles 
      WHERE user_id = $1
    `;
    
    const profileResult = await pool.query(profileQuery, [externalUserId]);
    
    if (profileResult.rows.length === 0) {
      console.log('❌ User profile not found!');
      return;
    }
    
    const profile = profileResult.rows[0];
    console.log('✅ User profile found:', {
      user_id: profile.user_id,
      name: `${profile.first_name || 'N/A'} ${profile.last_name || 'N/A'}`,
      email: profile.email,
      onboarding_completed: profile.onboarding_completed,
      company_id: profile.company_id,
      organization_id: profile.organization_id,
      created_at: profile.created_at
    });

    // 2. Check onboarding steps
    console.log('\n📝 Checking onboarding steps...');
    const stepsQuery = `
      SELECT step_id, completed_at, step_data
      FROM user_onboarding_steps 
      WHERE user_id = $1
      ORDER BY completed_at
    `;
    
    const stepsResult = await pool.query(stepsQuery, [externalUserId]);
    console.log(`✅ Found ${stepsResult.rows.length} completed onboarding steps:`);
    stepsResult.rows.forEach(step => {
      console.log(`  - ${step.step_id} (completed: ${step.completed_at})`);
    });

    // 3. Fix onboarding completion if needed
    if (profile.onboarding_completed !== true) {
      console.log('\n🔧 Fixing onboarding completion status...');
      
      const now = new Date().toISOString();
      const updateQuery = `
        UPDATE user_profiles 
        SET 
          onboarding_completed = true,
          onboarding_completed_at = $1,
          updated_at = $2
        WHERE user_id = $3
        RETURNING *
      `;
      
      const updateResult = await pool.query(updateQuery, [now, now, externalUserId]);
      console.log('✅ Onboarding completion status updated:', {
        onboarding_completed: updateResult.rows[0].onboarding_completed,
        onboarding_completed_at: updateResult.rows[0].onboarding_completed_at
      });
    } else {
      console.log('\n✅ Onboarding is already marked as completed!');
    }

    // 4. Ensure company_id exists (required for some routes)
    if (!profile.company_id) {
      console.log('\n🏢 Creating company profile...');
      
      const companyQuery = `
        INSERT INTO companies (name, industry, size, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `;
      
      const companyName = profile.company_name || `${profile.first_name || 'User'}'s Company`;
      const now = new Date().toISOString();
      
      const companyResult = await pool.query(companyQuery, [
        companyName,
        'Technology',
        'Small to Medium',
        now,
        now
      ]);
      
      const companyId = companyResult.rows[0].id;
      console.log('✅ Company created:', { id: companyId, name: companyName });
      
      // Update user profile with company_id
      const updateCompanyQuery = `
        UPDATE user_profiles 
        SET company_id = $1, updated_at = $2
        WHERE user_id = $3
        RETURNING *
      `;
      
      const updateCompanyResult = await pool.query(updateCompanyQuery, [companyId, now, externalUserId]);
      console.log('✅ User profile updated with company_id:', updateCompanyResult.rows[0].company_id);
    } else {
      console.log('\n✅ Company profile already exists:', profile.company_id);
    }

    console.log('\n🎉 Onboarding status check complete!');
    console.log('You should now be able to access the main application without being redirected to onboarding.');

  } catch (error) {
    console.error('❌ Error fixing onboarding status:', error);
  } finally {
    await pool.end();
  }
}

fixOnboardingStatus();
