const { Pool } = require('pg');

async function fixCompletionRecord() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/vector_db'
  });

  try {
    console.log('🔧 Fixing onboarding completion record...\n');

    const externalUserId = 'd2770389274aad9319e41dc713cb5c8206cc84f0cadf10e49c17dc329e66eec3';
    const now = new Date().toISOString();

    // Check the table structure first
    console.log('📋 Checking user_onboarding_completions table structure...');
    const tableInfoQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'user_onboarding_completions'
      ORDER BY ordinal_position;
    `;
    
    const tableInfo = await pool.query(tableInfoQuery);
    console.log('Table structure:');
    tableInfo.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // Check if there's already a completion record
    console.log('\n🔍 Checking existing completion records...');
    const existingQuery = `SELECT * FROM user_onboarding_completions WHERE user_id = $1`;
    const existingResult = await pool.query(existingQuery, [externalUserId]);
    
    if (existingResult.rows.length > 0) {
      console.log('Found existing completion record:', existingResult.rows[0]);
      
      // Update the existing record
      const updateQuery = `
        UPDATE user_onboarding_completions 
        SET 
          completed_at = $1,
          onboarding_data = $2,
          updated_at = $3
        WHERE user_id = $4
        RETURNING *;
      `;
      
      const completionData = {
        userId: externalUserId,
        completedSteps: ['welcome-introduction', 'core-identity-priorities', 'quick-connect-integrations', 'day-1-insight-preview', 'ai-goal-generation', 'action-plan-creation'],
        completedPhases: ['fast-wins-context', 'ai-powered-goals', 'launch-and-first-steps'],
        totalSteps: 6,
        totalPhases: 3,
        timestamp: now
      };
      
      const updateResult = await pool.query(updateQuery, [
        now,
        JSON.stringify(completionData),
        now,
        externalUserId
      ]);
      console.log('✅ Updated existing completion record:', updateResult.rows[0]);
    } else {
      console.log('No existing completion record found, creating new one...');
      
      // Create new completion record
      const insertQuery = `
        INSERT INTO user_onboarding_completions (user_id, completed_at, onboarding_data, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
      `;
      
      const completionData = {
        userId: externalUserId,
        completedSteps: ['welcome-introduction', 'core-identity-priorities', 'quick-connect-integrations', 'day-1-insight-preview', 'ai-goal-generation', 'action-plan-creation'],
        completedPhases: ['fast-wins-context', 'ai-powered-goals', 'launch-and-first-steps'],
        totalSteps: 6,
        totalPhases: 3,
        timestamp: now
      };
      
      const insertResult = await pool.query(insertQuery, [
        externalUserId,
        now,
        JSON.stringify(completionData),
        now,
        now
      ]);
      console.log('✅ Created new completion record:', insertResult.rows[0]);
    }

    console.log('\n🎉 Completion record fixed successfully!');

  } catch (error) {
    console.error('❌ Error fixing completion record:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await pool.end();
  }
}

fixCompletionRecord();
