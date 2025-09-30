/**
 * Test script for n8n conversation orchestrator integration
 */

const { N8nConversationOrchestrator } = require('./src/edge-functions/n8n-integration');

async function testN8nIntegration() {
  console.log('🧪 Testing n8n Conversation Orchestrator Integration...\n');

  const orchestrator = new N8nConversationOrchestrator({
    n8nUrl: process.env.N8N_URL || 'https://automate.marcoby.net',
    webhookPath: 'conversation-orchestrator',
    timeout: 10000,
    apiKey: process.env.N8N_API_KEY
  });

  // Test 1: Connection Test
  console.log('1️⃣ Testing connection to n8n...');
  const connectionTest = await orchestrator.testConnection();
  
  if (connectionTest.success) {
    console.log('✅ Connection successful!');
    console.log(`   Status: ${connectionTest.status}`);
    console.log(`   Response: ${JSON.stringify(connectionTest.data, null, 2)}`);
  } else {
    console.log('❌ Connection failed!');
    console.log(`   Error: ${connectionTest.error}`);
    console.log(`   Status: ${connectionTest.status}`);
    return;
  }

  // Test 2: Workflow Status
  console.log('\n2️⃣ Checking workflow status...');
  const statusTest = await orchestrator.getWorkflowStatus();
  
  if (statusTest.success && statusTest.workflow) {
    console.log('✅ Workflow found!');
    console.log(`   ID: ${statusTest.workflow.id}`);
    console.log(`   Name: ${statusTest.workflow.name}`);
    console.log(`   Active: ${statusTest.workflow.active}`);
    console.log(`   Updated: ${statusTest.workflow.updatedAt}`);
  } else {
    console.log('⚠️  Workflow not found or inactive');
    console.log(`   Error: ${statusTest.error || 'No workflow found'}`);
  }

  // Test 3: Full Conversation Test
  console.log('\n3️⃣ Testing full conversation flow...');
  const testUser = {
    id: 'test-user-123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    companyId: 'test-company-456'
  };

  const testMessage = "Hello! I need help with my business strategy.";
  const testHistory = [
    {
      role: 'user',
      content: 'Hi there',
      timestamp: new Date(Date.now() - 60000).toISOString()
    }
  ];

  const testContext = {
    conversationId: 'test-conversation-789',
    businessHealth: {
      finance: { score: 75 },
      operations: { score: 80 }
    },
    dashboard: {},
    nextBestActions: []
  };

  try {
    const response = await orchestrator.generateResponse(
      testMessage,
      testUser,
      testHistory,
      testContext
    );

    if (response.success) {
      console.log('✅ Conversation test successful!');
      console.log(`   Content: ${response.data.content}`);
      console.log(`   Intent: ${response.data.intent || 'N/A'}`);
      console.log(`   Purpose: ${response.data.conversationPurpose || 'N/A'}`);
      console.log(`   CKB Documents: ${response.data.ckbInsights?.documentsFound || 0}`);
    } else {
      console.log('❌ Conversation test failed!');
      console.log(`   Error: ${response.error}`);
      console.log(`   Fallback: ${response.fallback}`);
    }
  } catch (error) {
    console.log('❌ Conversation test error!');
    console.log(`   Error: ${error.message}`);
  }

  console.log('\n🎯 Integration test complete!');
}

// Run the test
if (require.main === module) {
  testN8nIntegration().catch(console.error);
}

module.exports = { testN8nIntegration };
