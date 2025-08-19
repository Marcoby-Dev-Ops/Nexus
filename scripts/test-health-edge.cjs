const { executeLocalEdgeFunction } = require('../server/src/edge-functions');

async function testHealthEdgeFunction() {
  console.log('🏥 Testing AI Insights Health Edge Function...\n');

  const testUser = {
    id: 'test-user-123',
    email: 'test@example.com'
  };

  try {
    console.log('🔍 Calling Health Check Edge Function...');
    const result = await executeLocalEdgeFunction('ai-insights-health', {}, testUser);

    console.log('✅ Success! Health check result:');
    console.log(`Status: ${result.data.status}`);
    console.log(`Message: ${result.data.message}`);
    console.log(`Test Result: ${result.data.testResult}`);
    console.log(`Timestamp: ${result.data.timestamp}`);

  } catch (error) {
    console.error('💥 Health check failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testHealthEdgeFunction().then(() => {
  console.log('\n🏁 Health check test completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Health check test failed:', error);
  process.exit(1);
});
