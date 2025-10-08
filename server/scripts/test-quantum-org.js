const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5433,
  user: 'postgres',
  password: 'postgres',
  database: 'vector_db'
});

async function testQuantumOrg() {
  const client = await pool.connect();
  
  try {
    console.log('🧪 Testing quantum profile system with organization_id...');
    
    // Get the user's profile data
    const userProfile = await client.query(`
      SELECT user_id, organization_id, company_id, onboarding_completed
      FROM user_profiles 
      WHERE user_id = 'your-user-id-here' 
      LIMIT 1;
    `);
    
    if (userProfile.rows.length === 0) {
      console.log('⚠️ No user profile found, checking for any user...');
      const anyUser = await client.query(`
        SELECT user_id, organization_id, company_id, onboarding_completed
        FROM user_profiles 
        LIMIT 1;
      `);
      
      if (anyUser.rows.length > 0) {
        console.log('📋 Found user profile:', anyUser.rows[0]);
        
        const userId = anyUser.rows[0].user_id;
        const orgId = anyUser.rows[0].organization_id;
        
        console.log(`🔍 Testing with user ${userId} and organization ${orgId}`);
        
        // Check if quantum profile exists for this organization
        const quantumProfile = await client.query(`
          SELECT id, organization_id, health_score, maturity_level
          FROM quantum_business_profiles 
          WHERE organization_id = $1;
        `, [orgId]);
        
        if (quantumProfile.rows.length > 0) {
          console.log('✅ Found quantum profile:', quantumProfile.rows[0]);
        } else {
          console.log('ℹ️ No quantum profile found for this organization');
          
          // Create a test quantum profile
          console.log('🆕 Creating test quantum profile...');
          const testProfile = {
            id: '550e8400-e29b-41d4-a716-446655440001', // Use a proper UUID
            organizationId: orgId,
            blocks: [
              {
                blockId: 'identity',
                strength: 75,
                health: 80,
                properties: {},
                healthIndicators: {},
                aiCapabilities: [],
                marketplaceIntegrations: []
              }
            ],
            relationships: [],
            healthScore: 77,
            maturityLevel: 'growing',
            lastUpdated: new Date().toISOString()
          };
          
          await client.query(`
            INSERT INTO quantum_business_profiles (
              id, organization_id, profile_data, health_score, maturity_level, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7);
          `, [
            testProfile.id,
            orgId,
            JSON.stringify(testProfile),
            testProfile.healthScore,
            testProfile.maturityLevel,
            new Date(),
            new Date()
          ]);
          
          console.log('✅ Test quantum profile created successfully');
        }
        
      } else {
        console.log('❌ No user profiles found in database');
      }
    } else {
      console.log('📋 User profile:', userProfile.rows[0]);
    }
    
    // Show all quantum profiles
    console.log('📊 All quantum profiles:');
    const allProfiles = await client.query(`
      SELECT id, organization_id, health_score, maturity_level, created_at
      FROM quantum_business_profiles 
      ORDER BY created_at DESC;
    `);
    
    allProfiles.rows.forEach((profile, index) => {
      console.log(`  ${index + 1}. ID: ${profile.id}`);
      console.log(`     Organization: ${profile.organization_id}`);
      console.log(`     Health Score: ${profile.health_score}`);
      console.log(`     Maturity: ${profile.maturity_level}`);
      console.log(`     Created: ${profile.created_at}`);
      console.log('');
    });
    
    console.log('✅ Quantum profile system test completed!');
    
  } catch (error) {
    console.error('❌ Error during test:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

testQuantumOrg().catch(console.error);
