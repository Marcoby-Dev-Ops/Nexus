const express = require('express');
const { InsightsAnalyticsService } = require('../../services/InsightsAnalyticsService');
const { logger } = require('../utils/logger');

const router = express.Router();
const analyticsService = new InsightsAnalyticsService();

/**
 * Get similar organizations based on user context
 */
router.post('/similar-organizations', async (req, res) => {
  try {
    const { userContext, limit = 5 } = req.body;
    
    if (!userContext) {
      return res.status(400).json({
        success: false,
        error: 'User context is required'
      });
    }

    const similarOrgs = await analyticsService.getSimilarOrganizations(userContext, limit);
    const summary = analyticsService.generateSimilarOrganizationsSummary(similarOrgs);

    logger.info('Retrieved similar organizations', {
      count: similarOrgs.length,
      userIndustry: userContext.industry,
      userCompanySize: userContext.companySize
    });

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    logger.error('Error getting similar organizations', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get similar organizations'
    });
  }
});

/**
 * Get industry trends and insights
 */
router.post('/industry-trends', async (req, res) => {
  try {
    const { industry, timeRange = '90 days' } = req.body;
    
    if (!industry) {
      return res.status(400).json({
        success: false,
        error: 'Industry is required'
      });
    }

    const trends = await analyticsService.getIndustryTrends(industry, timeRange);

    logger.info('Retrieved industry trends', {
      industry,
      timeRange,
      trendCount: trends.length
    });

    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    logger.error('Error getting industry trends', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get industry trends'
    });
  }
});

/**
 * Get maturity level insights and recommendations
 */
router.post('/maturity-insights', async (req, res) => {
  try {
    const { maturityLevel, industry } = req.body;
    
    if (!maturityLevel) {
      return res.status(400).json({
        success: false,
        error: 'Maturity level is required'
      });
    }

    const insights = await analyticsService.getMaturityLevelInsights(maturityLevel, industry);

    logger.info('Retrieved maturity level insights', {
      maturityLevel,
      industry,
      insightCount: insights.length
    });

    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    logger.error('Error getting maturity level insights', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get maturity level insights'
    });
  }
});

/**
 * Get comprehensive analytics dashboard data
 */
router.post('/dashboard', async (req, res) => {
  try {
    const { userContext } = req.body;
    
    if (!userContext) {
      return res.status(400).json({
        success: false,
        error: 'User context is required'
      });
    }

    const [similarOrgs, industryTrends, maturityInsights] = await Promise.all([
      analyticsService.getSimilarOrganizations(userContext),
      userContext.industry ? analyticsService.getIndustryTrends(userContext.industry) : Promise.resolve([]),
      userContext.maturityLevel ? analyticsService.getMaturityLevelInsights(userContext.maturityLevel, userContext.industry) : Promise.resolve([])
    ]);

    const summary = analyticsService.generateSimilarOrganizationsSummary(similarOrgs);

    const dashboardData = {
      similarOrganizations: summary,
      industryTrends,
      maturityInsights,
      summary: {
        hasSimilarOrgs: summary.organizations.length > 0,
        hasIndustryTrends: industryTrends.length > 0,
        hasMaturityInsights: maturityInsights.length > 0,
        totalDataPoints: summary.summary.totalOrganizations + industryTrends.length + maturityInsights.length
      }
    };

    logger.info('Retrieved analytics dashboard data', {
      hasSimilarOrgs: dashboardData.summary.hasSimilarOrgs,
      hasIndustryTrends: dashboardData.summary.hasIndustryTrends,
      hasMaturityInsights: dashboardData.summary.hasMaturityInsights,
      totalDataPoints: dashboardData.summary.totalDataPoints
    });

    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    logger.error('Error getting analytics dashboard', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get analytics dashboard'
    });
  }
});

module.exports = router;
