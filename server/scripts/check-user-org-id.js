const { Pool } = require('pg');
const fs = require('fs');

// Load database configuration
const configPath = '../database.config.local.json';
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const pool = new Pool(config);

async function checkUserOrgId() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking user organization_id in database...');
    
    const userId = 'd2770389274aad9319e41dc713cb5c8206cc84f0cadf10e49c17dc329e66eec3';
    
    const result = await client.query(`
      SELECT 
        user_id,
        company_id,
        organization_id,
        first_name,
        last_name,
        email
      FROM user_profiles 
      WHERE user_id = $1
    `, [userId]);
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('📋 User Profile Data:');
      console.log('  user_id:', user.user_id);
      console.log('  company_id:', user.company_id);
      console.log('  organization_id:', user.organization_id);
      console.log('  first_name:', user.first_name);
      console.log('  last_name:', user.last_name);
      console.log('  email:', user.email);
      
      if (user.organization_id) {
        console.log('✅ organization_id is set:', user.organization_id);
      } else {
        console.log('❌ organization_id is NULL or undefined');
      }
    } else {
      console.log('❌ User not found in database');
    }
    
  } catch (error) {
    console.error('❌ Error checking user organization_id:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkUserOrgId();
