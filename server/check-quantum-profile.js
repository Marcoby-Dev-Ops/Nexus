const { Pool } = require('pg');

async function checkQuantumProfile() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/vector_db'
  });

  try {
    const companyId = '3d22e5d2-ae7d-4a02-b01f-4b40c55154a6';
    
    console.log('🔍 Checking quantum business profiles...\n');
    
    // Check if quantum_business_profiles table exists
    console.log('📋 Checking if quantum_business_profiles table exists...');
    const tableCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'quantum_business_profiles'
    `);
    
    if (tableCheck.rows.length === 0) {
      console.log('❌ quantum_business_profiles table does not exist');
      return;
    }
    
    console.log('✅ quantum_business_profiles table exists');
    
    // Check for quantum profile for this company
    console.log('\n🔍 Looking for quantum profile for company:', companyId);
    const profileResult = await pool.query(`
      SELECT * FROM quantum_business_profiles 
      WHERE company_id = $1
    `, [companyId]);
    
    if (profileResult.rows.length === 0) {
      console.log('❌ No quantum profile found for this company');
      console.log('This explains why the UI shows "Not Set Up" - no quantum profile exists yet');
    } else {
      const profile = profileResult.rows[0];
      console.log('✅ Found quantum profile:');
      console.log('  - Company ID:', profile.company_id);
      console.log('  - Health Score:', profile.health_score);
      console.log('  - Maturity Level:', profile.maturity_level);
      console.log('  - Created:', profile.created_at);
      console.log('  - Updated:', profile.updated_at);
      
      // Check if there are any blocks with strength > 0
      if (profile.blocks && Array.isArray(profile.blocks)) {
        console.log('\n📊 Block strengths:');
        profile.blocks.forEach(block => {
          console.log(`  - ${block.blockId}: strength=${block.strength}, health=${block.health}`);
        });
        
        const hasConfiguredBlocks = profile.blocks.some(block => block.strength > 0);
        console.log(`\n${hasConfiguredBlocks ? '✅' : '❌'} Has configured blocks (strength > 0): ${hasConfiguredBlocks}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking quantum profile:', error.message);
  } finally {
    await pool.end();
  }
}

checkQuantumProfile();
