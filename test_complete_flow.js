async function testCompleteFlow() {
  try {
    console.log('🧪 Testing Complete Embedding and RAG System Flow...\n');
    
    // Test 1: Embedding Generation
    console.log('1️⃣ Testing embedding generation...');
    const embeddingResponse = await fetch('http://localhost:3001/api/ai/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'test embedding for RAG system',
        model: 'text-embedding-3-small',
        tenantId: 'test-tenant'
      })
    });

    const embeddingResult = await embeddingResponse.json();
    
    if (embeddingResult.success) {
      console.log('✅ Embedding generation PASSED');
      console.log(`   - Model: ${embeddingResult.data.model}`);
      console.log(`   - Provider: ${embeddingResult.data.provider}`);
      console.log(`   - Embedding length: ${embeddingResult.data.embedding.length}`);
    } else {
      console.log('❌ Embedding generation FAILED');
      console.log(`   - Error: ${embeddingResult.error}`);
      return;
    }

    // Test 2: AI Insights Health
    console.log('\n2️⃣ Testing AI insights service...');
    const insightsHealthResponse = await fetch('http://localhost:3001/api/ai-insights/health');
    const insightsHealthResult = await insightsHealthResponse.json();
    
    if (insightsHealthResult.success) {
      console.log('✅ AI insights service PASSED');
      console.log(`   - Status: ${insightsHealthResult.status}`);
      console.log(`   - Test result: ${insightsHealthResult.testResult}`);
    } else {
      console.log('❌ AI insights service FAILED');
      console.log(`   - Error: ${insightsHealthResult.error}`);
    }

    // Test 3: Onboarding Insights Generation
    console.log('\n3️⃣ Testing onboarding insights generation...');
    const onboardingResponse = await fetch('http://localhost:3001/api/ai-insights/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context: {
          user: {
            firstName: 'Test',
            lastName: 'User',
            company: 'Test Company',
            industry: 'Technology',
            companySize: '1-10',
            keyPriorities: ['Growth']
          },
          selectedIntegrations: [],
          selectedTools: {},
          maturityScore: 45
        }
      })
    });

    const onboardingResult = await onboardingResponse.json();
    
    if (onboardingResult.success) {
      console.log('✅ Onboarding insights generation PASSED');
      console.log(`   - Insights count: ${onboardingResult.data?.insights?.length || 0}`);
      console.log(`   - Maturity score: ${onboardingResult.data?.maturityScore || 'N/A'}`);
    } else {
      console.log('❌ Onboarding insights generation FAILED');
      console.log(`   - Error: ${onboardingResult.error}`);
    }

    console.log('\n🎉 Complete flow test finished!');
    
  } catch (error) {
    console.log('❌ Test failed with exception');
    console.log(`   - Error: ${error.message}`);
  }
}

testCompleteFlow();
