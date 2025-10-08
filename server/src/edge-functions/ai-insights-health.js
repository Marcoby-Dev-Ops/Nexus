const { OnboardingInsightsService } = require('../../services/OnboardingInsightsService');

/**
 * Health check edge function for AI insights service
 * @param {Object} payload - Function payload
 * @param {Object} user - Authenticated user object
 * @returns {Promise<Object>} Health status
 */
async function aiInsightsHealthHandler(payload, user) {
  try {
    // Initialize the service
    const insightsService = new OnboardingInsightsService();

    // Test with minimal context
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
      selectedTools: {},
      maturityScore: 45
    };

    const result = await insightsService.generateOnboardingInsights(testContext);
    
    return {
      success: true,
      status: 'healthy',
      message: 'AI insights service is operational',
      testResult: result.success ? 'passed' : 'failed',
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('AI insights health check failed:', error);
    return {
      success: false,
      status: 'unhealthy',
      message: 'AI insights service is not operational',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = aiInsightsHealthHandler;
