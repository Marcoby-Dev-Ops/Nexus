
require('dotenv').config();
const { query } = require('./src/database/connection');
const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');

const API_URL = 'http://localhost:3001';
const TEST_USER_ID = 'test-memory-user-' + uuidv4();
// We'll simulate a user ID. In a real scenario, we'd need a valid JWT.
// However, since we are running this on the server, we can potentially bypass auth or generate a token.
// For this test, let's assume we can generate a temporary JWT or mock the user.
// actually, let's look at `server/src/routes/ai.js` middleware. It uses `authenticateToken`.
// We need a valid token. 
// Let's rely on a helper or just insert a user into the DB and generate a token if we had the secret.
// Since we have the `JWT_SECRET` in .env, we can generate a token!

const jwt = require('jsonwebtoken');

async function runTest() {
    console.log('🧪 Starting Memory Integration Test...');

    // 1. Setup: Generate Auth Token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        console.error('❌ Error: JWT_SECRET not found in .env');
        process.exit(1);
    }

    const token = jwt.sign(
        { userId: TEST_USER_ID, email: 'test@example.com', role: 'user' },
        jwtSecret,
        { expiresIn: '1h' }
    );

    // 2. Create Conversation
    console.log('🔹 Creating new conversation...');
    const createRes = await fetch(`${API_URL}/api/ai/chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            messages: [{ role: 'user', content: 'Start memory test' }]
        })
    });

    if (!createRes.ok) {
        console.error('❌ Failed to create conversation:', await createRes.text());
        process.exit(1);
    }

    // We need to fetch the conversation ID from the DB since the API might just stream text
    // We can infer it from the user ID since we just created it.
    await new Promise(r => setTimeout(r, 1000)); // Wait for async writes
    const convResult = await query(
        `SELECT id FROM ai_conversations WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [TEST_USER_ID]
    );

    if (convResult.rows.length === 0) {
        console.error('❌ Could not find created conversation in DB');
        process.exit(1);
    }

    const conversationId = convResult.rows[0].id;
    console.log(`✅ Organization established. Conversation ID: ${conversationId}`);

    // 3. Seed Long-Term Memory (The "Fact")
    const SECRET_FACT = `The secret code is OMEGA-${Math.floor(Math.random() * 1000)}`;
    console.log(`🔹 Seeding secret fact: "${SECRET_FACT}" into DB history (simulating past turn)...`);

    await query(
        `INSERT INTO ai_messages (conversation_id, role, content, created_at) VALUES ($1, $2, $3, NOW() - INTERVAL '1 hour')`,
        [conversationId, 'user', `Remember this secret code: ${SECRET_FACT}`]
    );
    await query(
        `INSERT INTO ai_messages (conversation_id, role, content, created_at) VALUES ($1, $2, $3, NOW() - INTERVAL '59 minutes')`,
        [conversationId, 'assistant', `Understood. I have stored the secret code: ${SECRET_FACT}.`]
    );

    // 4. Flood with Filler Messages (To push the fact out of "short term" / client context)
    console.log('🔹 Flooding history with 10 filler messages...');
    for (let i = 0; i < 10; i++) {
        await query(
            `INSERT INTO ai_messages (conversation_id, role, content, created_at) VALUES ($1, $2, $3, NOW() - INTERVAL '${50 - i} minutes')`,
            [conversationId, 'user', `Filler message ${i} - talking about random things.`]
        );
        await query(
            `INSERT INTO ai_messages (conversation_id, role, content, created_at) VALUES ($1, $2, $3, NOW() - INTERVAL '${50 - i} minutes')`,
            [conversationId, 'assistant', `Responding to filler ${i}.`]
        );
    }

    // 5. Ask for the Fact
    // We will send ONLY this question in the body, simulating a fresh client load that lost history.
    console.log('🔹 Asking agent for the secret code (Simulating client with truncated history)...');

    const askRes = await fetch(`${API_URL}/api/ai/chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            // Verification: We only send the NEWEST message. 
            // If the agent answers correctly, it MUST be reading from the DB.
            conversationId: conversationId,
            messages: [{ role: 'user', content: 'What is the secret code I told you earlier?' }]
        })
    });

    if (!askRes.ok) {
        console.error('❌ API Error:', await askRes.text());
        process.exit(1);
    }

    // Capture the stream output
    const text = await askRes.text(); // This will be the raw SSE stream
    console.log('🔹 Received response stream...');

    // Simple check: does the response contain the secret fact?
    if (text.includes(SECRET_FACT)) {
        console.log(`\n🎉 SUCCESS! The agent recalled: "${SECRET_FACT}"`);
        console.log('Context retrieval from DB is working correctly.');
    } else {
        console.error(`\n❌ FAILURE. The agent did not mention "${SECRET_FACT}".`);
        console.log('Raw Response Preview:', text.substring(0, 500));
        console.log('It likely relied only on the short-term context which missed the fact.');
    }

    // Cleanup
    await query(`DELETE FROM ai_messages WHERE conversation_id = $1`, [conversationId]);
    await query(`DELETE FROM ai_conversations WHERE id = $1`, [conversationId]);
    console.log('🧹 Test data cleaned up.');
    process.exit(0);
}

runTest().catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
});
