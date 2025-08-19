// Using built-in fetch (Node.js 18+)

async function testAIInsights() {
  try {
    const testContext = {
      user: {
        firstName: 'Test',
        lastName: 'User',
        company: 'Test Company',
        industry: 'Technology',
        companySize: '1-10',
        keyPriorities: ['Growth']
      },
      selectedIntegrations: [],
      selectedTools: {}
    };

    console.log('Testing AI insights API...');
    console.log('Context:', JSON.stringify(testContext, null, 2));

    const response = await fetch('http://localhost:3001/api/edge/ai-insights-onboarding/public', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ context: testContext })
    });

    const result = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('✅ AI insights API is working!');
      console.log('Number of insights:', result.data?.length || 0);
    } else {
      console.log('❌ AI insights API failed:', result.error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAIInsights();
