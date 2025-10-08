const { Pool } = require('pg');

async function checkAllOnboardingTables() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/vector_db'
  });

  try {
    console.log('🔍 Checking all onboarding tables for missing columns...\n');

    const tables = ['user_onboarding_steps', 'user_onboarding_phases', 'user_onboarding_completions'];
    
    for (const table of tables) {
      console.log(`📋 Checking ${table}:`);
      
      const structureQuery = `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position;
      `;

      const structureResult = await pool.query(structureQuery, [table]);
      
      structureResult.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
      });

      // Check for required columns
      const columns = structureResult.rows.map(row => row.column_name);
      const requiredColumns = ['created_at', 'updated_at'];
      
      console.log('\n  🔍 Missing columns:');
      const missingColumns = requiredColumns.filter(col => !columns.includes(col));
      
      if (missingColumns.length === 0) {
        console.log('    ✅ All required columns present');
      } else {
        missingColumns.forEach(col => {
          console.log(`    ❌ Missing: ${col}`);
        });
      }
      
      console.log('');
    }

    console.log('🎉 All onboarding tables checked!');

  } catch (error) {
    console.error('❌ Error checking tables:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await pool.end();
  }
}

checkAllOnboardingTables();
