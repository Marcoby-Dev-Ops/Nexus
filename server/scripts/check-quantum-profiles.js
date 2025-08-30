const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5433,
  user: 'postgres',
  password: 'postgres',
  database: 'vector_db'
});

async function checkQuantumProfiles() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking quantum profiles...');
    
    // Check all quantum profiles
    const profiles = await client.query(`
      SELECT id, organization_id, health_score, maturity_level, created_at
      FROM quantum_business_profiles 
      ORDER BY created_at DESC;
    `);
    
    console.log(`📊 Found ${profiles.rows.length} quantum profiles:`);
    
    profiles.rows.forEach((profile, index) => {
      console.log(`  ${index + 1}. ID: ${profile.id}`);
      console.log(`     Organization: ${profile.organization_id}`);
      console.log(`     Health Score: ${profile.health_score}`);
      console.log(`     Maturity: ${profile.maturity_level}`);
      console.log(`     Created: ${profile.created_at}`);
      console.log('');
    });
    
    // Check user profiles
    console.log('👥 User profiles:');
    const users = await client.query(`
      SELECT user_id, organization_id, company_id, onboarding_completed
      FROM user_profiles 
      LIMIT 5;
    `);
    
    users.rows.forEach((user, index) => {
      console.log(`  ${index + 1}. User: ${user.user_id}`);
      console.log(`     Organization: ${user.organization_id}`);
      console.log(`     Company: ${user.company_id}`);
      console.log(`     Onboarding: ${user.onboarding_completed}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkQuantumProfiles();
