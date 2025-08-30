const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testOnboardingPlaybookAssignment() {
  const client = await pool.connect();
  
  try {
    console.log('🧪 Testing onboarding playbook assignment...');
    
    // Test user ID (vonj@marcoby.com)
    const testUserId = 'd2770389274aad9319e41dc713cb5c8206cc84f0cadf10e49c17dc329e66eec3';
    
    // Get the onboarding journey playbook ID
    const playbookResult = await client.query(`
      SELECT id, name, description 
      FROM playbook_templates 
      WHERE name = 'Nexus Business Onboarding Journey'
    `);
    
    if (playbookResult.rows.length === 0) {
      throw new Error('Onboarding journey playbook not found');
    }
    
    const playbook = playbookResult.rows[0];
    console.log(`📋 Found playbook: ${playbook.name} (ID: ${playbook.id})`);
    
    // Check if user already has this playbook assigned
    const existingProgressResult = await client.query(`
      SELECT id, status, progress_percentage, started_at, completed_at
      FROM user_playbook_progress 
      WHERE user_id = $1 AND playbook_id = $2
    `, [testUserId, playbook.id]);
    
    if (existingProgressResult.rows.length > 0) {
      console.log('✅ User already has onboarding playbook assigned:');
      console.log(`   Status: ${existingProgressResult.rows[0].status}`);
      console.log(`   Progress: ${existingProgressResult.rows[0].progress_percentage}%`);
      console.log(`   Started: ${existingProgressResult.rows[0].started_at}`);
      console.log(`   Completed: ${existingProgressResult.rows[0].completed_at || 'Not completed'}`);
    } else {
      console.log('🔄 User does not have onboarding playbook assigned, creating...');
      
              // Get user's organization ID
        const userProfileResult = await client.query(`
          SELECT organization_id FROM user_profiles WHERE user_id = $1
        `, [testUserId]);
        
        if (userProfileResult.rows.length === 0) {
          throw new Error('User profile not found');
        }
        
        const organizationId = userProfileResult.rows[0].organization_id;
        
        // Create new playbook progress
        const insertResult = await client.query(`
          INSERT INTO user_playbook_progress (
            user_id, 
            organization_id, 
            playbook_id, 
            status, 
            progress_percentage, 
            started_at, 
            created_at, 
            updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING id, status, progress_percentage
        `, [
          testUserId,
          organizationId,
          playbook.id,
          'not_started',
          0,
          new Date().toISOString(),
          new Date().toISOString(),
          new Date().toISOString()
        ]);
      
      console.log('✅ Onboarding playbook assigned successfully:');
      console.log(`   Progress ID: ${insertResult.rows[0].id}`);
      console.log(`   Status: ${insertResult.rows[0].status}`);
      console.log(`   Progress: ${insertResult.rows[0].progress_percentage}%`);
    }
    
    // Get total playbook items
    const itemsResult = await client.query(`
      SELECT COUNT(*) as total_items, 
             COUNT(CASE WHEN is_required = true THEN 1 END) as required_items
      FROM playbook_items 
      WHERE playbook_id = $1
    `, [playbook.id]);
    
    console.log(`\n📊 Playbook Statistics:`);
    console.log(`   Total Items: ${itemsResult.rows[0].total_items}`);
    console.log(`   Required Items: ${itemsResult.rows[0].required_items}`);
    
    // List playbook items
    const itemsListResult = await client.query(`
      SELECT name, description, item_type, order_index, is_required
      FROM playbook_items 
      WHERE playbook_id = $1
      ORDER BY order_index
    `, [playbook.id]);
    
    console.log(`\n📝 Playbook Items:`);
    itemsListResult.rows.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.name} (${item.item_type}) ${item.is_required ? '[Required]' : '[Optional]'}`);
    });
    
    console.log('\n🎉 Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run test
testOnboardingPlaybookAssignment()
  .then(() => {
    console.log('✅ Test script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test script failed:', error);
    process.exit(1);
  });
