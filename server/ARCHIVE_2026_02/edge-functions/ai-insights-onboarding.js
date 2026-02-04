const { OnboardingInsightsService } = require('../../services/OnboardingInsightsService');

/**
 * Edge function for AI insights onboarding
 * Calls the server-side OnboardingInsightsService
 * @param {Object} payload - Function payload containing context
 * @param {Object} user - Authenticated user object
 * @returns {Promise<Object>} AI insights result
 */
async function aiInsightsOnboardingHandler(payload, user) {
  try {
    const { context } = payload;
    
    if (!context) {
      return {
        success: false,
        error: 'Context is required',
        data: null
      };
    }

    // Validate context structure
    if (!context.user || !context.user.company) {
      return {
        success: false,
        error: 'Invalid context structure - user and company are required',
        data: null
      };
    }

    // Add user and org IDs to context for proper scoping
    const scopedContext = {
      ...context,
      user: {
        ...context.user,
        id: user?.id || 'onboarding',
        org_id: user?.org_id || null
      }
    };

    // Initialize the service
    const insightsService = new OnboardingInsightsService();

    // Generate insights using server-side service with proper scoping
    const result = await insightsService.generateOnboardingInsights(scopedContext);

    if (result.success) {
      return {
        success: true,
        data: result.data,
        maturityScore: result.maturityScore,
        message: 'Insights generated successfully'
      };
    } else {
      return {
        success: false,
        error: result.error || 'Failed to generate insights',
        data: null
      };
    }

  } catch (error) {
    console.error('Error in AI insights edge function:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate insights',
      data: null
    };
  }
}

module.exports = aiInsightsOnboardingHandler;
