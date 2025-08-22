const { Pool } = require('pg');

async function checkOnboardingData() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/vector_db'
  });

  try {
    console.log('🔍 Checking onboarding data...\n');

    const externalUserId = 'd2770389274aad9319e41dc713cb5c8206cc84f0cadf10e49c17dc329e66eec3';
    
    // Check user profile
    console.log('📋 User Profile:');
    const userProfileQuery = `SELECT * FROM user_profiles WHERE user_id = $1`;
    const userProfileResult = await pool.query(userProfileQuery, [externalUserId]);
    console.log(userProfileResult.rows[0] || 'No user profile found');

    // Check onboarding steps
    console.log('\n📝 Onboarding Steps:');
    const stepsQuery = `SELECT * FROM user_onboarding_steps WHERE user_id = $1 ORDER BY completed_at`;
    const stepsResult = await pool.query(stepsQuery, [externalUserId]);
    console.log(`Found ${stepsResult.rows.length} completed steps:`);
    stepsResult.rows.forEach(step => {
      console.log(`  - ${step.step_id}: ${step.completed_at}`);
    });

    // Check onboarding phases
    console.log('\n🎯 Onboarding Phases:');
    const phasesQuery = `SELECT * FROM user_onboarding_phases WHERE user_id = $1 ORDER BY completed_at`;
    const phasesResult = await pool.query(phasesQuery, [externalUserId]);
    console.log(`Found ${phasesResult.rows.length} completed phases:`);
    phasesResult.rows.forEach(phase => {
      console.log(`  - ${phase.phase_id}: ${phase.completed_at}`);
    });

    // Check onboarding completions
    console.log('\n✅ Onboarding Completions:');
    const completionsQuery = `SELECT * FROM user_onboarding_completions WHERE user_id = $1 ORDER BY completed_at`;
    const completionsResult = await pool.query(completionsQuery, [externalUserId]);
    console.log(`Found ${completionsResult.rows.length} completion records:`);
    completionsResult.rows.forEach(completion => {
      console.log(`  - Completed at: ${completion.completed_at}`);
    });

    // Check if user profile shows onboarding as completed
    console.log('\n🏁 Onboarding Status:');
    if (userProfileResult.rows.length > 0) {
      const profile = userProfileResult.rows[0];
      console.log(`  - onboarding_completed: ${profile.onboarding_completed}`);
      console.log(`  - onboarding_started_at: ${profile.onboarding_started_at}`);
      console.log(`  - onboarding_completed_at: ${profile.onboarding_completed_at}`);
    }

  } catch (error) {
    console.error('❌ Error checking onboarding data:', error.message);
  } finally {
    await pool.end();
  }
}

checkOnboardingData();
