#!/usr/bin/env node
// Quick test of OpenClaw connection from Nexus
const { NexusAIGatewayService } = require('./server/services/NexusAIGatewayService.js');

async function testOpenClaw() {
  console.log('Testing OpenClaw connection...');
  
  // Create the service with OpenClaw enabled
  const service = new NexusAIGatewayService({
    enableOpenAI: false,
    enableOpenRouter: false,
    enableLocal: false,
    enableOpenClaw: true
  });
  
  // Test connections
  const connections = await service.testConnections();
  console.log('Connection results:', JSON.stringify(connections, null, 2));
  
  if (connections.openclaw?.status === 'available') {
    console.log('✅ OpenClaw is available! Testing chat...');
    
    const chatRequest = {
      messages: [{ role: 'user', content: 'Hello, can you hear me?' }],
      role: 'chat',
      sensitivity: 'internal',
      tenantId: 'test-tenant',
      userId: 'test-user'
    };
    
    const response = await service.chat(chatRequest);
    console.log('Chat response:', JSON.stringify(response, null, 2));
  } else {
    console.log('❌ OpenClaw not available. Check OPENCLAW_API_URL and OPENCLAW_API_KEY env vars.');
    console.log('Current env:', {
      OPENCLAW_API_URL: process.env.OPENCLAW_API_URL,
      OPENCLAW_API_KEY: process.env.OPENCLAW_API_KEY ? '***set***' : 'NOT SET'
    });
  }
}

testOpenClaw().catch(console.error);