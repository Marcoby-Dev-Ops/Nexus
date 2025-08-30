#!/usr/bin/env tsx

import { NexusAIGatewayService } from '../src/ai/services/NexusAIGatewayService';
import { logger } from '../src/shared/utils/logger';

async function testMetrics() {
  console.log('🧪 Testing AI Gateway Metrics...\n');

  const aiGateway = new NexusAIGatewayService({
    enableOpenAI: true,
    enableOpenRouter: true,
    enableLocal: true,
    maxRetries: 2,
    retryDelayMs: 500,
    enableUsageTracking: true,
    enableCircuitBreaker: true,
  });

  const tenantId = 'test-tenant-123';

  try {
    // Test 1: Health check
    console.log('1️⃣ Testing health endpoint...');
    const connections = await aiGateway.testConnections();
    console.log('✅ Health check passed:', connections);

    // Test 2: Make a simple chat request to generate metrics
    console.log('\n2️⃣ Making test chat request to generate metrics...');
    const chatResponse = await aiGateway.chat({
      messages: [
        { role: 'user', content: 'Hello, this is a test message for metrics.' }
      ],
      role: 'chat',
      sensitivity: 'internal',
      tenantId,
    });

    if (chatResponse.success) {
      console.log('✅ Chat request successful');
      console.log('   Response length:', chatResponse.data.output.length);
      console.log('   Tokens used:', chatResponse.data.tokens);
      console.log('   Cost (cents):', chatResponse.data.costCents);
      console.log('   Latency (ms):', chatResponse.data.latencyMs);
    } else {
      console.log('❌ Chat request failed:', chatResponse.error);
    }

    // Test 3: Make an embedding request
    console.log('\n3️⃣ Making test embedding request...');
    const embedResponse = await aiGateway.generateEmbeddings({
      text: 'Test embedding for metrics',
      tenantId,
    });

    if (embedResponse.success) {
      console.log('✅ Embedding request successful');
      console.log('   Vector length:', embedResponse.data.vector.length);
      console.log('   Cost (cents):', embedResponse.data.costCents);
    } else {
      console.log('❌ Embedding request failed:', embedResponse.error);
    }

    // Test 4: Get usage stats
    console.log('\n4️⃣ Getting usage statistics...');
    const usageStats = aiGateway.getUsageStats(tenantId);
    console.log('✅ Usage stats:', usageStats);

    // Test 5: Get available models
    console.log('\n5️⃣ Getting available models...');
    const models = aiGateway.getAvailableModels();
    console.log('✅ Available models:', Object.keys(models).length, 'roles');

    console.log('\n🎉 All tests completed!');
    console.log('\n📊 To view metrics, visit: http://localhost:3000/api/ai/metrics');
    console.log('📈 To view health, visit: http://localhost:3000/api/ai/health');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  testMetrics().catch(console.error);
}
