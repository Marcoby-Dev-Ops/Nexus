const { Pool } = require('pg');

async function verifyForeignKeys() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/vector_db'
  });

  try {
    console.log('🔍 Verifying foreign key constraints...\n');

    // Check foreign key constraints
    const fkQuery = `
      SELECT 
        tc.table_name,
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.table_name IN ('user_onboarding_steps', 'user_onboarding_completions')
        AND tc.constraint_type = 'FOREIGN KEY'
      ORDER BY tc.table_name, kcu.column_name;
    `;

    const fkResult = await pool.query(fkQuery);
    
    console.log('📋 Foreign Key Constraints:');
    if (fkResult.rows.length === 0) {
      console.log('❌ No foreign key constraints found!');
    } else {
      fkResult.rows.forEach(row => {
        console.log(`✅ ${row.table_name}.${row.column_name} → ${row.foreign_table_name}.${row.foreign_column_name}`);
      });
    }

    // Check RLS policies
    const policyQuery = `
      SELECT 
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual
      FROM pg_policies 
      WHERE tablename IN ('user_onboarding_steps', 'user_onboarding_completions')
      ORDER BY tablename, policyname;
    `;

    const policyResult = await pool.query(policyQuery);
    
    console.log('\n🔒 RLS Policies:');
    if (policyResult.rows.length === 0) {
      console.log('❌ No RLS policies found!');
    } else {
      policyResult.rows.forEach(row => {
        console.log(`✅ ${row.tablename}: ${row.policyname} (${row.cmd})`);
      });
    }

    // Test if the user exists in user_profiles
    const testUserId = 'ddcc866f-33f8-4eee-91e9-b36a45fa4a8b';
    const userQuery = `
      SELECT id, user_id, created_at 
      FROM user_profiles 
      WHERE id = $1 OR user_id = $1
      LIMIT 1;
    `;

    const userResult = await pool.query(userQuery, [testUserId]);
    
    console.log('\n👤 User Profile Check:');
    if (userResult.rows.length === 0) {
      console.log(`❌ User ${testUserId} not found in user_profiles`);
    } else {
      console.log(`✅ User found: ${JSON.stringify(userResult.rows[0], null, 2)}`);
    }

    console.log('\n🎉 Verification complete!');

  } catch (error) {
    console.error('❌ Error during verification:', error.message);
  } finally {
    await pool.end();
  }
}

verifyForeignKeys();
