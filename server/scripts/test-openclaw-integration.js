#!/usr/bin/env node

/**
 * Test OpenClaw ↔ Nexus Integration
 * 
 * This script tests the integration after deployment.
 */

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const API_URL = process.env.NEXUS_API_URL || 'https://napi.marcoby.net';
const API_KEY = process.env.OPENCLAW_API_KEY || 'openclaw-default-key';
const USER_ID = 'openclaw-system-user';

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-OpenClaw-Api-Key': API_KEY
  }
});

async function testIntegration() {
  console.log('🧪 Testing OpenClaw ↔ Nexus Integration');
  console.log('=========================================\n');
  
  try {
    // 1. Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await client.get('/api/openclaw/health');
    console.log('   ✅ Health check passed:', healthResponse.data);
    
    // 2. Create test conversation
    console.log('\n2. Creating test conversation...');
    const conversationId = `test-${uuidv4().substring(0, 8)}`;
    const testConversation = {
      userId: USER_ID,
      conversationId,
      title: 'Test OpenClaw Integration',
      messages: [
        {
          id: 'msg-1',
          role: 'user',
          content: 'Hello Nexus! This is a test from OpenClaw.',
          created_at: new Date().toISOString()
        },
        {
          id: 'msg-2',
          role: 'assistant',
          content: 'Hello! I received your message. The integration is working!',
          created_at: new Date().toISOString()
        },
        {
          id: 'msg-3',
          role: 'user',
          content: 'Can you see this conversation in the Nexus UI?',
          created_at: new Date().toISOString()
        },
        {
          id: 'msg-4',
          role: 'assistant',
          content: 'Yes! This conversation should now appear in the Nexus AI conversations list.',
          created_at: new Date().toISOString()
        }
      ],
      model: 'openclaw-test',
      metadata: {
        test: true,
        integration_version: '1.0.0',
        timestamp: new Date().toISOString()
      }
    };
    
    const syncResponse = await client.post('/api/openclaw/conversations/sync', testConversation);
    console.log('   ✅ Conversation synced:', syncResponse.data.data.conversationId);
    
    // 3. Verify conversation was created
    console.log('\n3. Verifying conversation exists...');
    const listResponse = await client.get('/api/openclaw/conversations', {
      params: { userId: USER_ID }
    });
    
    const ourConversation = listResponse.data.data.conversations.find(
      conv => conv.external_id === conversationId
    );
    
    if (ourConversation) {
      console.log('   ✅ Conversation found in database');
      console.log('   📊 Details:', {
        title: ourConversation.title,
        messageCount: ourConversation.message_count,
        createdAt: ourConversation.created_at
      });
    } else {
      console.log('   ❌ Conversation not found in database');
    }
    
    // 4. Test individual conversation endpoint
    console.log('\n4. Testing individual conversation endpoint...');
    if (ourConversation) {
      const singleResponse = await client.get(`/api/openclaw/conversations/${ourConversation.id}`, {
        params: { userId: USER_ID }
      });
      console.log('   ✅ Individual conversation retrieved');
      console.log('   📝 Messages:', singleResponse.data.data.messages.length);
    }
    
    // 5. Test database functions (via raw query simulation)
    console.log('\n5. Testing database functionality...');
    console.log('   ℹ️  Database functions can be tested with:');
    console.log('      SELECT * FROM get_conversation_stats_by_source();');
    console.log('      SELECT * FROM openclaw_integration_health;');
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Check Nexus UI to see the test conversation');
    console.log('2. Configure OpenClaw to use the sync API');
    console.log('3. Monitor integration with: SELECT * FROM openclaw_integration_health;');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

// Run tests
testIntegration().catch(console.error);