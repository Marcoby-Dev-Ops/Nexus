
require('dotenv').config();
const { query } = require('./src/database/connection');

async function checkConversation() {
    const id = 'f972fe8a-c0d6-45c7-9690-3dc6e5d410f0';
    console.log(`Checking for conversation ID: ${id}`);

    try {
        const result = await query('SELECT * FROM ai_conversations WHERE id = $1', [id]);
        if (result.rows.length > 0) {
            console.log('✅ Found conversation:', result.rows[0]);
        } else {
            console.log('❌ Conversation NOT found in DB.');
        }
    } catch (err) {
        console.error('Error querying DB:', err);
    }
    process.exit(0);
}

checkConversation();
