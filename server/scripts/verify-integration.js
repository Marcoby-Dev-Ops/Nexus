// Native fetch is available in Node 18+
const jwt = require('jsonwebtoken');
const { query, closePool } = require('../src/database/connection');
require('../loadEnv');

async function verifyIntegration() {
    console.log('🔍 Starting Nexus-OpenClaw Integration Verification...\n');

    // 1. Database Connection & User Setup
    console.log('1️⃣  Verifying Database Connection & User...');

    // Find a valid user to test with
    // Schema note: 'users' table doesn't exist, using 'user_profiles'
    const userRes = await query('SELECT user_id as id, email, role FROM user_profiles LIMIT 1');

    if (userRes.error) {
        // Fallback: try without role if it doesn't exist (it might be in another table or JWT claim)
        const userResFallback = await query('SELECT user_id as id, email FROM user_profiles LIMIT 1');
        if (userResFallback.error) {
            console.error('❌ Database error:', userRes.error);
            process.exit(1);
        }
        userRes.data = userResFallback.data.map(u => ({ ...u, role: 'user' })); // Default role
    }

    if (!userRes.data || userRes.data.length === 0) {
        console.error('❌ No users found in database. Please seed the database first.');
        process.exit(1);
    }

    const user = userRes.data[0];
    // Ensure role exists for JWT
    user.role = user.role || 'user';
    console.log(`✅ Found test user: ${user.email} (${user.id})`);

    // 2. Generate Auth Token
    console.log('\n2️⃣  Generating Auth Token...');
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        console.error('❌ JWT_SECRET not found in environment.');
        process.exit(1);
    }

    // Mock an Authentik-style payload which the middleware expects
    // The middleware looks for req.user = decoded;
    // And routes look for req.user.id
    // But importantly, if it validates against a specific structure like 'sub'
    const token = jwt.sign(
        {
            sub: user.id, // Authentik uses 'sub' as the ID
            email: user.email,
            role: user.role,
            // Add other claims to mimic real token if necessary
            // But 'sub' is usually mapped to 'id' in many grasp implementations
            // Let's check middleware.js to be 100% sure
            id: user.id // Just in case it uses .id directly
        },
        secret,
        { expiresIn: '1h' }
    );
    console.log('✅ Generated JWT for test user.');

    // 3. Test Chat API
    console.log('\n3️⃣  Testing POST /api/ai/chat (Proxy to OpenClaw)...');
    const port = process.env.PORT || 3001;
    const apiUrl = `http://localhost:${port}/api/ai/chat`;

    const payload = {
        messages: [
            { role: 'user', content: 'Integration test: verification ping.' }
        ],
        stream: false, // Use non-streaming for easier verification
        conversationId: null // Let it create a new one
    };

    console.log(`   Target: ${apiUrl}`);
    console.log(`   Payload:`, JSON.stringify(payload));

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const text = await response.text();
            console.error(`❌ API Request Failed: ${response.status} ${response.statusText}`);
            console.error(`   Response: ${text}`);
            process.exit(1);
        }

        const data = await response.json();
        console.log('✅ API Request Successful');
        console.log('   Response Data:', JSON.stringify(data, null, 2));

        // Validation Checks
        if (!data.success) throw new Error('Response success flag is false');
        if (!data.content) throw new Error('Response missing content');
        if (!data.metadata?.modelWay) throw new Error('Response missing Model-Way metadata');

        console.log('✅ Response Structure Validated');

        // 4. Verify Database Persistence
        console.log('\n4️⃣  Verifying Audit Log in Database...');

        const conversationId = data.metadata.modelWay.conversationId;
        if (!conversationId) throw new Error('No conversationId returned');

        console.log(`   Checking Conversation ID: ${conversationId}`);

        // Check Conversation
        const convCheck = await query('SELECT * FROM ai_conversations WHERE id = $1', [conversationId]);
        if (convCheck.data.length === 0) throw new Error('Conversation not found in DB');

        // Check Messages
        const msgCheck = await query(
            'SELECT role, content FROM ai_messages WHERE conversation_id = $1 ORDER BY created_at ASC',
            [conversationId]
        );

        console.log(`   Found ${msgCheck.data.length} messages in DB.`);

        if (msgCheck.data.length < 2) throw new Error('Expected at least 2 messages (user + assistant) in DB');

        const userMsg = msgCheck.data.find(m => m.role === 'user');
        const assistantMsg = msgCheck.data.find(m => m.role === 'assistant');

        if (!userMsg) throw new Error('User message not audited');
        if (!assistantMsg) throw new Error('Assistant message not audited');

        console.log('✅ Database Audit Verified.');
        console.log('   - Conversation created');
        console.log('   - User message recorded');
        console.log('   - Assistant message recorded');

        console.log('\n🎉 ALL INTEGRATION CHECKS PASSED!');

    } catch (error) {
        console.error('❌ Verification Failed:', error.message);
        process.exit(1);
    } finally {
        await closePool();
    }
}

verifyIntegration().catch(err => {
    console.error('Fatal Error:', err);
    process.exit(1);
});
