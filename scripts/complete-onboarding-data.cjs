const { Pool } = require('pg');

async function completeOnboardingData() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/vector_db'
  });

  try {
    console.log('🚀 Completing onboarding data...\n');

    const externalUserId = 'd2770389274aad9319e41dc713cb5c8206cc84f0cadf10e49c17dc329e66eec3';
    const now = new Date().toISOString();
    
    // 1. Update user profile with onboarding completion
    console.log('📋 Updating user profile...');
    const updateProfileQuery = `
      UPDATE user_profiles 
      SET 
        onboarding_completed = true,
        onboarding_started_at = $1,
        onboarding_completed_at = $2,
        updated_at = $3
      WHERE user_id = $4
      RETURNING *;
    `;
    
    const profileResult = await pool.query(updateProfileQuery, [
      now, now, now, externalUserId
    ]);
    console.log('✅ User profile updated:', profileResult.rows[0]);

    // 2. Create onboarding steps data
    console.log('\n📝 Creating onboarding steps...');
    
    const onboardingSteps = [
      {
        step_id: 'welcome-introduction',
        step_data: {
          userId: externalUserId,
          completed: true,
          timestamp: now
        }
      },
      {
        step_id: 'core-identity-priorities',
        step_data: {
          userId: externalUserId,
          firstName: 'Your',
          lastName: 'Name',
          company: 'Your Company',
          industry: 'Technology',
          companySize: '1-10',
          keyPriorities: ['Increase Revenue', 'Improve Efficiency'],
          completed: true,
          timestamp: now
        }
      },
      {
        step_id: 'quick-connect-integrations',
        step_data: {
          userId: externalUserId,
          selectedIntegrations: ['slack', 'gmail'],
          completed: true,
          timestamp: now
        }
      },
      {
        step_id: 'day-1-insight-preview',
        step_data: {
          userId: externalUserId,
          completed: true,
          timestamp: now
        }
      },
      {
        step_id: 'ai-goal-generation',
        step_data: {
          userId: externalUserId,
          selectedGoals: ['Increase Revenue by 25%', 'Improve Customer Satisfaction'],
          maturityScore: 75,
          completed: true,
          timestamp: now
        }
      },
      {
        step_id: 'action-plan-creation',
        step_data: {
          userId: externalUserId,
          selectedThoughts: ['Optimize pricing strategy', 'Improve customer onboarding'],
          nextSteps: ['Review current pricing', 'Analyze customer feedback'],
          completed: true,
          timestamp: now
        }
      }
    ];

    for (const step of onboardingSteps) {
      const insertStepQuery = `
        INSERT INTO user_onboarding_steps (user_id, step_id, step_data, completed_at, updated_at)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (user_id, step_id) 
        DO UPDATE SET 
          step_data = EXCLUDED.step_data,
          completed_at = EXCLUDED.completed_at,
          updated_at = EXCLUDED.updated_at
        RETURNING *;
      `;
      
      const stepResult = await pool.query(insertStepQuery, [
        externalUserId,
        step.step_id,
        JSON.stringify(step.step_data),
        now,
        now
      ]);
      console.log(`✅ Step ${step.step_id} created:`, stepResult.rows[0]);
    }

    // 3. Create onboarding phases data
    console.log('\n🎯 Creating onboarding phases...');
    
    const onboardingPhases = [
      {
        phase_id: 'fast-wins-context',
        phase_data: {
          userId: externalUserId,
          completed: true,
          stepsCompleted: ['welcome-introduction', 'core-identity-priorities', 'quick-connect-integrations', 'day-1-insight-preview'],
          timestamp: now
        }
      },
      {
        phase_id: 'ai-powered-goals',
        phase_data: {
          userId: externalUserId,
          completed: true,
          stepsCompleted: ['ai-goal-generation', 'action-plan-creation'],
          timestamp: now
        }
      },
      {
        phase_id: 'launch-and-first-steps',
        phase_data: {
          userId: externalUserId,
          completed: true,
          stepsCompleted: ['dashboard-introduction', 'first-action-guidance'],
          timestamp: now
        }
      }
    ];

    for (const phase of onboardingPhases) {
      const insertPhaseQuery = `
        INSERT INTO user_onboarding_phases (user_id, phase_id, phase_data, completed_at, updated_at)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (user_id, phase_id) 
        DO UPDATE SET 
          phase_data = EXCLUDED.phase_data,
          completed_at = EXCLUDED.completed_at,
          updated_at = EXCLUDED.updated_at
        RETURNING *;
      `;
      
      const phaseResult = await pool.query(insertPhaseQuery, [
        externalUserId,
        phase.phase_id,
        JSON.stringify(phase.phase_data),
        now,
        now
      ]);
      console.log(`✅ Phase ${phase.phase_id} created:`, phaseResult.rows[0]);
    }

    // 4. Create onboarding completion record
    console.log('\n✅ Creating onboarding completion record...');
    const completionData = {
      userId: externalUserId,
      completedSteps: onboardingSteps.map(s => s.step_id),
      completedPhases: onboardingPhases.map(p => p.phase_id),
      totalSteps: onboardingSteps.length,
      totalPhases: onboardingPhases.length,
      timestamp: now
    };

    const insertCompletionQuery = `
      INSERT INTO user_onboarding_completions (user_id, completed_at, onboarding_data, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        onboarding_data = EXCLUDED.onboarding_data,
        completed_at = EXCLUDED.completed_at,
        updated_at = EXCLUDED.updated_at
      RETURNING *;
    `;
    
    const completionResult = await pool.query(insertCompletionQuery, [
      externalUserId,
      now,
      JSON.stringify(completionData),
      now,
      now
    ]);
    console.log('✅ Completion record created:', completionResult.rows[0]);

    console.log('\n🎉 Onboarding data completed successfully!');
    console.log('📊 Summary:');
    console.log(`  - ${onboardingSteps.length} steps completed`);
    console.log(`  - ${onboardingPhases.length} phases completed`);
    console.log(`  - User profile updated with onboarding_completed = true`);

  } catch (error) {
    console.error('❌ Error completing onboarding data:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await pool.end();
  }
}

completeOnboardingData();
