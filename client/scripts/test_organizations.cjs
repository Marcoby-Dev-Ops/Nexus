const { query } = require('./server/src/database/connection');

async function testOrganizationsQuery() {
  try {
    // Test with a valid user ID (this should be an Authentik user ID)
    const testUserId = 'd2770389274aad9319e41dc713cb5c8206cc84f0cadf10e49c17dc329e66eec3';
    
    console.log('Testing with user ID:', testUserId);
    console.log('User ID type:', typeof testUserId);
    console.log('User ID length:', testUserId.length);
    
    // First, check table structure
    const tableCheckQuery = `
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'user_organizations' 
      ORDER BY ordinal_position
    `;
    
    console.log('\nChecking table structure...');
    const { data: tableInfo, error: tableError } = await query(tableCheckQuery, []);
    
    if (tableError) {
      console.error('Table structure check failed:', tableError);
      return;
    }
    
    console.log('Table structure:', tableInfo);
    
    // Test the actual query
    const membershipsQuery = `
      SELECT 
        uo.org_id,
        uo.role,
        uo.permissions,
        uo.is_primary,
        uo.created_at as joined_at
      FROM user_organizations uo
      WHERE uo.user_id = $1
    `;
    
    console.log('\nTesting memberships query...');
    console.log('Query:', membershipsQuery);
    console.log('Parameters:', [testUserId]);
    
    const { data: memberships, error: membershipsError } = await query(membershipsQuery, [testUserId]);
    
    if (membershipsError) {
      console.error('Memberships query failed:', membershipsError);
      return;
    }
    
    console.log('Memberships result:', memberships);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testOrganizationsQuery();
