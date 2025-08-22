const { executeLocalEdgeFunction } = require('../server/src/edge-functions');

async function testEdgeFunction() {
  console.log('🧪 Testing AI Insights Edge Function...\n');

  const testPayload = {
    context: {
      user: {
        firstName: 'John',
        lastName: 'Doe',
        company: 'TechCorp',
        industry: 'Technology',
        companySize: '10-50',
        keyPriorities: ['Revenue Growth', 'Operational Efficiency']
      },
      selectedIntegrations: ['hubspot', 'quickbooks'],
      selectedTools: {
        revenue: ['salesforce'],
        cash: ['quickbooks'],
        delivery: ['asana']
      },
      maturityScore: 45
    }
  };

  const testUser = {
    id: 'test-user-123',
    email: 'test@example.com'
  };

  try {
    console.log('📊 Test Context:');
    console.log(`Company: ${testPayload.context.user.company}`);
    console.log(`Industry: ${testPayload.context.user.industry}`);
    console.log(`Integrations: ${testPayload.context.selectedIntegrations.join(', ')}\n`);

    console.log('🤖 Calling Edge Function...');
    const result = await executeLocalEdgeFunction('ai-insights-onboarding', testPayload, testUser);

    console.log('✅ Success! Edge function result:');
    console.log(`📈 Maturity Score: ${result.data.maturityScore}`);
    console.log(`💡 Insight Count: ${result.data.data.length}\n`);

    result.data.data.forEach((insight, index) => {
      console.log(`${index + 1}. ${insight.title}`);
      console.log(`   Type: ${insight.type}`);
      console.log(`   Impact: ${insight.impact}`);
      console.log(`   Confidence: ${insight.confidence}%`);
      console.log(`   Action: ${insight.action}`);
      console.log(`   Value: ${insight.estimatedValue}`);
      console.log(`   Timeframe: ${insight.timeframe}\n`);
    });

  } catch (error) {
    console.error('💥 Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testEdgeFunction().then(() => {
  console.log('🏁 Edge function test completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Edge function test failed:', error);
  process.exit(1);
});
