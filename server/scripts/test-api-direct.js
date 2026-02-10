const jwt = require('jsonwebtoken');
const { query, closePool } = require('../src/database/connection');
require('../loadEnv');

async function testApiDirect() {
    console.log('🔍 Starting Direct API Test...');

    // 1. Get a user
    const userRes = await query('SELECT user_id as id, email FROM user_profiles LIMIT 1');
    if (userRes.error || !userRes.data || userRes.data.length === 0) {
        console.error('❌ No users found.');
        process.exit(1);
    }
    const user = userRes.data[0];
    console.log(`✅ Test user: ${user.email} (${user.id})`);

    // 2. Generate Token
    const secret = process.env.JWT_SECRET;
    const token = jwt.sign({ sub: user.id, email: user.email, role: 'user' }, secret, { expiresIn: '1h' });

    // 3. Test /api/ai/conversations
    const port = process.env.API_PORT || 3001;
    const url = `http://localhost:${port}/api/ai/conversations`;
    console.log(`📡 Fetching: ${url}`);

    try {
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log(`📊 Status: ${response.status} ${response.statusText}`);
        const data = await response.json();
        console.log('📦 Response:', JSON.stringify(data, null, 2));

        if (response.ok && data.success) {
            console.log('✅ API call successful!');
        } else {
            console.error('❌ API call failed.');
        }
    } catch (error) {
        console.error('❌ Error during fetch:', error.message);
    } finally {
        await closePool();
    }
}

testApiDirect();
