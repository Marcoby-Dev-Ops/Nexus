const { OnboardingInsightsService } = require('../server/services/OnboardingInsightsService');

async function testAIInsights() {
  console.log('🧪 Testing AI Insights Service...\n');

  const service = new OnboardingInsightsService();

  const testContext = {
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
  };

  try {
    console.log('📊 Test Context:');
    console.log(`Company: ${testContext.user.company}`);
    console.log(`Industry: ${testContext.user.industry}`);
    console.log(`Integrations: ${testContext.selectedIntegrations.join(', ')}`);
    console.log(`Tools: ${Object.entries(testContext.selectedTools).map(([k,v]) => `${k}: ${v.join(', ')}`).join('; ')}\n`);

    console.log('🤖 Generating AI Insights...');
    const result = await service.generateOnboardingInsights(testContext);

    if (result.success) {
      console.log('✅ Success! Generated insights:');
      console.log(`📈 Maturity Score: ${result.maturityScore}`);
      console.log(`💡 Insight Count: ${result.data.length}\n`);

      result.data.forEach((insight, index) => {
        console.log(`${index + 1}. ${insight.title}`);
        console.log(`   Type: ${insight.type}`);
        console.log(`   Impact: ${insight.impact}`);
        console.log(`   Confidence: ${insight.confidence}%`);
        console.log(`   Action: ${insight.action}`);
        console.log(`   Value: ${insight.estimatedValue}`);
        console.log(`   Timeframe: ${insight.timeframe}\n`);
      });
    } else {
      console.log('❌ Failed to generate insights:', result.error);
    }

  } catch (error) {
    console.error('💥 Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testAIInsights().then(() => {
  console.log('🏁 Test completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});
