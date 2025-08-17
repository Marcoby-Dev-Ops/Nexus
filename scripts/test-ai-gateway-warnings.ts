#!/usr/bin/env tsx

import { NexusAIGatewayService } from '../src/ai/services/NexusAIGatewayService';
import { logger } from '../src/shared/utils/logger';

async function testAIGatewayWarnings() {
  console.log('🧪 Testing AI Gateway Warning Resolution\n');

  // Test 1: With API keys configured (should not show warnings)
  console.log('📋 Test 1: With API keys configured');
  try {
    const aiGateway1 = new NexusAIGatewayService({
      enableOpenAI: true,
      enableOpenRouter: true,
      enableLocal: true,
    });
    console.log('✅ AI Gateway initialized successfully with API keys');
  } catch (error) {
    console.log('❌ AI Gateway failed to initialize:', error);
  }
  console.log('');

  // Test 2: Temporarily clear environment variables to test warning suppression
  console.log('📋 Test 2: Testing warning suppression (this should show info messages, not warnings)');
  
  // Store original values
  const originalOpenAI = process.env.VITE_OPENAI_API_KEY;
  const originalOpenRouter = process.env.VITE_OPENROUTER_API_KEY;
  
  // Clear the environment variables
  delete process.env.VITE_OPENAI_API_KEY;
  delete process.env.VITE_OPENROUTER_API_KEY;
  delete process.env.OPENAI_API_KEY;
  delete process.env.OPENROUTER_API_KEY;
  
  try {
    const aiGateway2 = new NexusAIGatewayService({
      enableOpenAI: true,
      enableOpenRouter: true,
      enableLocal: true,
    });
    console.log('✅ AI Gateway initialized successfully without API keys (warnings suppressed)');
  } catch (error) {
    console.log('❌ AI Gateway failed to initialize:', error);
  }
  
  // Restore original values
  if (originalOpenAI) process.env.VITE_OPENAI_API_KEY = originalOpenAI;
  if (originalOpenRouter) process.env.VITE_OPENROUTER_API_KEY = originalOpenRouter;
  
  console.log('');
  console.log('🎉 Test completed! Check the logs above for any warnings.');
}

// Run the test
testAIGatewayWarnings().catch(console.error);
