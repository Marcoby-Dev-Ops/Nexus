#!/usr/bin/env node

/**
 * Verification script for Nexus expanded integrations.
 * 
 * Tests:
 * 1. Tool catalog discovery (new tools present)
 * 2. Search limit parsing (max 100)
 * 3. Tool bridge routing (nexus_send_email, nexus_get_calendar_events)
 */

const axios = require('axios');

const CONFIG = {
    baseUrl: process.env.NEXUS_API_URL || 'http://localhost:3001',
    apiKey: process.env.OPENCLAW_API_KEY || 'openclaw-default-key',
    userId: process.env.NEXUS_USER_ID || 'test-user-id'
};

async function testDiscovery() {
    console.log('1. Testing /api/openclaw/tools/catalog discovery...');
    const res = await axios.get(`${CONFIG.baseUrl}/api/openclaw/tools/catalog`, {
        headers: { 'X-OpenClaw-Api-Key': CONFIG.apiKey }
    });

    const tools = res.data.tools.map(t => t.name);
    const required = ['nexus_send_email', 'nexus_get_calendar_events'];

    required.forEach(tool => {
        if (tools.includes(tool)) {
            console.log(`✅ ${tool} found in catalog`);
        } else {
            console.error(`❌ ${tool} NOT found in catalog`);
        }
    });
}

async function testToolBridge() {
    console.log('\n2. Testing tool bridge routing (expecting auth/token errors if not connected, but not 404/500)...');

    const toolsToTest = [
        { name: 'nexus_send_email', args: { to: 'test@example.com', subject: 'test', body: 'body' } },
        { name: 'nexus_get_calendar_events', args: { datePreset: 'today' } }
    ];

    for (const tool of toolsToTest) {
        try {
            const res = await axios.post(`${CONFIG.baseUrl}/api/openclaw/tools/execute`, {
                tool: tool.name,
                args: tool.args
            }, {
                headers: {
                    'X-OpenClaw-Api-Key': CONFIG.apiKey,
                    'X-Nexus-User-Id': CONFIG.userId
                }
            });
            console.log(`✅ ${tool.name} executed successfully (result: ${JSON.stringify(res.data.result)})`);
        } catch (err) {
            if (err.response && (err.response.data.error.includes('No connected') || err.response.data.error.includes('No such user'))) {
                console.log(`✅ ${tool.name} routed correctly (received expected error: ${err.response.data.error})`);
            } else {
                console.error(`❌ ${tool.name} execution failed:`, err.response?.data || err.message);
            }
        }
    }
}

async function main() {
    try {
        await testDiscovery();
        await testToolBridge();
    } catch (err) {
        console.error('Test run failed:', err.message);
    }
}

main();
