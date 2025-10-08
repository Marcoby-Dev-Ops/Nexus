const { Pool } = require('pg');
require('../loadEnv');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrateOnboardingToPlaybooks() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting onboarding to playbook migration...');
    
    // Get the onboarding journey playbook ID
    const playbookResult = await client.query(`
      SELECT id FROM playbook_templates 
      WHERE name = 'Nexus Business Onboarding Journey'
    `);
    
    if (playbookResult.rows.length === 0) {
      throw new Error('Onboarding journey playbook not found');
    }
    
    const playbookId = playbookResult.rows[0].id;
    console.log(`📋 Found playbook ID: ${playbookId}`);
    
    // Get all users with onboarding steps
    const usersResult = await client.query(`
      SELECT DISTINCT user_id 
      FROM user_onboarding_steps
    `);
    
    console.log(`👥 Found ${usersResult.rows.length} users with onboarding data`);
    
    // Mapping of onboarding steps to playbook items
    const stepMapping = {
      'welcome-introduction': ['Welcome to Your Business Journey'],
      'core-identity-priorities': ['About Your Business', 'New Business Setup'],
      'tool-identification': ['Your Business Tools'],
      'day-1-insight-preview': ['Your First Insights'],
      'ai-goal-generation': ['What Do You Want to Achieve?'],
      'action-plan-creation': ['Your Next Steps'],
      'dashboard-introduction': ['Your Business DNA'],
      'first-action-guidance': ['Business Context']
    };
    
    for (const userRow of usersResult.rows) {
      const userId = userRow.user_id;
      console.log(`\n🔄 Processing user: ${userId}`);
      
      // Get user's completed onboarding steps
      const stepsResult = await client.query(`
        SELECT step_id, completed_at 
        FROM user_onboarding_steps 
        WHERE user_id = $1
      `, [userId]);
      
      const completedSteps = stepsResult.rows.map(row => row.step_id);
      console.log(`   Completed steps: ${completedSteps.join(', ')}`);
      
      // Calculate playbook progress
      let completedPlaybookItems = 0;
      const totalRequiredItems = 16; // From playbook analysis
      
      for (const [onboardingStep, playbookItems] of Object.entries(stepMapping)) {
        if (completedSteps.includes(onboardingStep)) {
          completedPlaybookItems += playbookItems.length;
        }
      }
      
      const progressPercentage = Math.round((completedPlaybookItems / totalRequiredItems) * 100);
      const status = progressPercentage === 100 ? 'completed' : 'in_progress';
      
      console.log(`   Playbook progress: ${completedPlaybookItems}/${totalRequiredItems} (${progressPercentage}%)`);
      
      // Insert or update playbook progress
      await client.query(`
        INSERT INTO user_playbook_progress (
          user_id, organization_id, playbook_id, progress_percentage, 
          status, started_at, completed_at, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        ON CONFLICT (user_id, organization_id, playbook_id) 
        DO UPDATE SET 
          progress_percentage = EXCLUDED.progress_percentage,
          status = EXCLUDED.status,
          completed_at = EXCLUDED.completed_at,
          updated_at = NOW()
      `, [
        userId,
        'default-org-id', // You may need to get the actual org ID
        playbookId,
        progressPercentage,
        status,
        new Date().toISOString(),
        status === 'completed' ? new Date().toISOString() : null
      ]);
      
      console.log(`   ✅ Playbook progress saved`);
    }
    
    console.log('\n🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run migration
migrateOnboardingToPlaybooks()
  .then(() => {
    console.log('✅ Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  });
