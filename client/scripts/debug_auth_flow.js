const { Pool } = require('pg');

// Initialize PostgreSQL connection pool
const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5433/vector_db',
});

async function debugAuthFlow() {
  try {
    console.log('🔍 Testing authentication flow...\n');

    // 1. Test the ensure_user_profile function directly
    console.log('1. Testing ensure_user_profile function directly...');
    const testUserId = 'test-user-123';
    
    const result = await pool.query('SELECT * FROM ensure_user_profile($1)', [testUserId]);
    console.log('✅ Function result:', JSON.stringify(result.rows, null, 2));
    
    // 2. Check what's in the user_profiles table
    console.log('\n2. Checking user_profiles table...');
    const profiles = await pool.query('SELECT * FROM user_profiles WHERE user_id = $1', [testUserId]);
    console.log('✅ User profiles:', JSON.stringify(profiles.rows, null, 2));
    
    // 3. Test the RPC endpoint with a mock token
    console.log('\n3. Testing RPC endpoint...');
    
    // Create a mock JWT token for testing
    const mockPayload = {
      sub: testUserId,
      iss: 'https://identity.marcoby.com',
      aud: 'test-client-id',
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      iat: Math.floor(Date.now() / 1000)
    };
    
    const mockToken = Buffer.from(JSON.stringify(mockPayload)).toString('base64');
    const mockJWT = `header.${mockToken}.signature`;
    
    console.log('Mock JWT token created:', mockJWT.substring(0, 50) + '...');
    
    // Test the RPC call
    const response = await fetch('http://localhost:3001/api/rpc/ensure_user_profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mockJWT}`
      },
      body: JSON.stringify({ external_user_id: testUserId })
    });
    
    console.log('Response status:', response.status);
    const responseData = await response.json();
    console.log('Response data:', JSON.stringify(responseData, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

debugAuthFlow();
