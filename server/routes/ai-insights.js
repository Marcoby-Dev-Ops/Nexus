const express = require('express');
const router = express.Router();
const { OnboardingInsightsService } = require('../services/OnboardingInsightsService');

// Initialize the service
const insightsService = new OnboardingInsightsService();

/**
 * Generate AI-powered onboarding insights
 * POST /api/ai-insights/onboarding
 */
router.post('/onboarding', async (req, res) => {
  try {
    const { context } = req.body;
    
    if (!context) {
      return res.status(400).json({
        success: false,
        error: 'Context is required'
      });
    }

    // Validate context structure
    if (!context.user || !context.user.company) {
      return res.status(400).json({
        success: false,
        error: 'Invalid context structure'
      });
    }

    // Generate insights using server-side service
    const result = await insightsService.generateOnboardingInsights(context);

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        message: 'Insights generated successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to generate insights'
      });
    }

  } catch (error) {
    console.error('Error generating AI insights:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Health check for AI insights service
 * GET /api/ai-insights/health
 */
router.get('/health', async (req, res) => {
  try {
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
    
    res.json({
      success: true,
      status: 'healthy',
      message: 'AI insights service is operational',
      testResult: result.success ? 'passed' : 'failed'
    });

  } catch (error) {
    console.error('AI insights health check failed:', error);
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: 'AI insights service is not operational'
    });
  }
});

module.exports = router;
