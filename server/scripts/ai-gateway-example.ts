#!/usr/bin/env tsx

import { NexusAIGatewayService } from '../src/ai/services/NexusAIGatewayService';
import { logger } from '../src/shared/utils/logger';

async function main() {
  console.log('🚀 Nexus AI Gateway Example\n');

  // Initialize the AI Gateway
  const aiGateway = new NexusAIGatewayService({
    enableOpenAI: true,
    enableOpenRouter: true,
    enableLocal: true,
  });

  const tenantId = 'example-tenant-123';

  try {
    // Test connections
    console.log('📡 Testing provider connections...');
    const connections = await aiGateway.testConnections();
    console.log('Connection status:', connections);
    console.log('');

    // Example 1: Chat with AI
    console.log('💬 Example 1: Chat with AI');
    const chatResponse = await aiGateway.chat({
      messages: [
        { role: 'user', content: 'What are the key principles of business growth?' }
      ],
      tenantId,
      role: 'chat',
      sensitivity: 'internal',
    });

    if (chatResponse.success) {
      console.log('✅ Chat response:', {
        message: chatResponse.data.message.substring(0, 200) + '...',
        model: chatResponse.data.model,
        provider: chatResponse.data.provider,
        cost: chatResponse.data.costCents + ' cents',
        latency: chatResponse.data.latencyMs + 'ms',
      });
    } else {
      console.log('❌ Chat failed:', chatResponse.error);
    }
    console.log('');

    // Example 2: Generate embeddings
    console.log('🔍 Example 2: Generate embeddings');
    const embeddingResponse = await aiGateway.generateEmbeddings({
      text: 'Nexus is a comprehensive business management platform for entrepreneurs.',
      tenantId,
    });

    if (embeddingResponse.success) {
      console.log('✅ Embedding generated:', {
        vectorLength: embeddingResponse.data.embedding.length,
        model: embeddingResponse.data.model,
        provider: embeddingResponse.data.provider,
        latency: embeddingResponse.data.latencyMs + 'ms',
      });
    } else {
      console.log('❌ Embedding failed:', embeddingResponse.error);
    }
    console.log('');

    // Example 3: Business analysis
    console.log('📊 Example 3: Business analysis');
    const businessData = {
      revenue: 500000,
      expenses: 350000,
      customers: 1200,
      growthRate: 0.15,
      marketSize: 10000000,
    };

    const analysisResponse = await aiGateway.analyzeBusinessData(
      businessData,
      'financial',
      tenantId
    );

    if (analysisResponse.success) {
      console.log('✅ Business analysis completed:', {
        insights: analysisResponse.data.insights?.length || 0,
        recommendations: analysisResponse.data.recommendations?.length || 0,
      });
    } else {
      console.log('❌ Analysis failed:', analysisResponse.error);
    }
    console.log('');

    // Example 4: Generate recommendations
    console.log('💡 Example 4: Generate growth recommendations');
    const context = `
      Our SaaS business has been growing steadily with 15% month-over-month growth.
      We have 1,200 paying customers and $500K annual recurring revenue.
      Our main challenge is scaling customer support while maintaining quality.
    `;

    const recommendationsResponse = await aiGateway.generateRecommendations(
      context,
      'growth',
      tenantId
    );

    if (recommendationsResponse.success) {
      console.log('✅ Recommendations generated:', {
        opportunities: recommendationsResponse.data.opportunities?.length || 0,
        strategies: recommendationsResponse.data.strategies?.length || 0,
      });
    } else {
      console.log('❌ Recommendations failed:', recommendationsResponse.error);
    }
    console.log('');

    // Example 5: Document drafting
    console.log('📝 Example 5: Draft a business proposal');
    const proposalContent = `
      We need a proposal for expanding our product line to include AI-powered analytics.
      Target market: Mid-size businesses
      Budget: $200K
      Timeline: 6 months
    `;

    const draftResponse = await aiGateway.draftDocument(
      proposalContent,
      'proposal',
      'professional',
      tenantId
    );

    if (draftResponse.success) {
      console.log('✅ Document drafted:', {
        contentLength: draftResponse.data.length,
        preview: draftResponse.data.substring(0, 200) + '...',
      });
    } else {
      console.log('❌ Document drafting failed:', draftResponse.error);
    }
    console.log('');

    // Example 6: Get usage statistics
    console.log('📈 Example 6: Usage statistics');
    const usageStats = aiGateway.getUsageStats(tenantId);
    console.log('✅ Usage statistics:', {
      totalRequests: usageStats.totalRequests,
      totalCost: usageStats.totalCost + ' cents',
      successRate: (usageStats.successRate * 100).toFixed(1) + '%',
      averageLatency: usageStats.averageLatency.toFixed(0) + 'ms',
    });
    console.log('');

    // Example 7: Get available models
    console.log('🤖 Example 7: Available models');
    const models = aiGateway.getAvailableModels('chat');
    console.log('✅ Available chat models:', models.map(m => ({
      name: m.name,
      provider: m.provider,
      cost: m.costPerToken + ' per token',
    })));
    console.log('');

    console.log('🎉 All examples completed successfully!');

  } catch (error) {
    console.error('❌ Example failed:', error);
    logger.error('AI Gateway example failed:', error);
  }
}

// Run the example
if (require.main === module) {
  main().catch(console.error);
}
