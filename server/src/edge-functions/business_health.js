const { query } = require('../database/connection');

/**
 * Business Health edge function
 * @param {Object} payload - Function payload with action and optional data
 * @param {Object} user - Authenticated user object
 * @returns {Promise<Object>} Business health data or status
 */
async function businessHealthHandler(payload, user) {
  try {
    if (!user?.id) {
      throw new Error('User authentication required');
    }

    const { action } = payload;

    switch (action) {
      case 'read':
        return await readBusinessHealth(user.id);
      
      case 'refresh':
        return await refreshBusinessHealth(user.id);
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('Business health handler failed:', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred'
    };
  }
}

/**
 * Read the latest business health data for a user
 */
async function readBusinessHealth(userId) {
  try {
    const { data, error } = await query(
      `SELECT * FROM business_health_snapshots 
       WHERE user_id = $1 
       ORDER BY last_calculated DESC 
       LIMIT 1`,
      [userId]
    );

    if (error) {
      throw new Error(`Database error: ${error}`);
    }

    const healthData = data && data.length > 0 ? data[0] : null;

    // If no data exists, return default structure
    if (!healthData) {
      return {
        success: true,
        data: {
          user_id: userId,
          org_id: null,
          overall_score: 0,
          data_quality_score: 0,
          connected_sources: 0,
          verified_sources: 0,
          completion_percentage: 0,
          category_scores: {},
          data_sources: [],
          last_calculated: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      };
    }

    return {
      success: true,
      data: healthData
    };
  } catch (error) {
    console.error('Error reading business health:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Refresh/calculate business health data for a user
 */
async function refreshBusinessHealth(userId) {
  try {
    // Get real data from the database
    const { data: userIntegrations, error: integrationsError } = await query(
      `SELECT integration_slug, status, last_sync_at, config 
       FROM user_integrations 
       WHERE user_id = $1 AND status = 'active'`,
      [userId]
    );

    const { data: userProfile, error: profileError } = await query(
      `SELECT company_name, industry, company_size, business_type 
       FROM user_profiles 
       WHERE user_id = $1`,
      [userId]
    );

    const { data: onboardingData, error: onboardingError } = await query(
      `SELECT completed_phases, current_phase, total_steps, completed_steps 
       FROM onboarding_progress 
       WHERE user_id = $1`,
      [userId]
    );

    // Calculate real metrics
    const connectedSources = userIntegrations?.length || 0;
    const verifiedSources = userIntegrations?.filter(integration => 
      integration.last_sync_at && 
      new Date(integration.last_sync_at) > new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
    ).length || 0;

    // Calculate completion percentage based on onboarding
    const completionPercentage = onboardingData?.length > 0 
      ? Math.round((onboardingData[0].completed_steps / onboardingData[0].total_steps) * 100)
      : 0;

    // Calculate data quality score based on integration health
    const dataQualityScore = connectedSources > 0 
      ? Math.round((verifiedSources / connectedSources) * 100)
      : 0;

    // Calculate category scores based on integration types
    const categoryScores = {
      sales: 0,
      marketing: 0,
      operations: 0,
      finance: 0
    };

    if (userIntegrations) {
      userIntegrations.forEach(integration => {
        const slug = integration.integration_slug.toLowerCase();
        if (slug.includes('hubspot') || slug.includes('salesforce') || slug.includes('pipedrive')) {
          categoryScores.sales += 25;
        }
        if (slug.includes('google') || slug.includes('facebook') || slug.includes('linkedin')) {
          categoryScores.marketing += 25;
        }
        if (slug.includes('asana') || slug.includes('trello') || slug.includes('jira')) {
          categoryScores.operations += 25;
        }
        if (slug.includes('stripe') || slug.includes('quickbooks') || slug.includes('xero')) {
          categoryScores.finance += 25;
        }
      });

      // Cap scores at 100
      Object.keys(categoryScores).forEach(key => {
        categoryScores[key] = Math.min(categoryScores[key], 100);
      });
    }

    // Calculate overall score based on multiple factors
    const overallScore = Math.round(
      (dataQualityScore * 0.3) + 
      (completionPercentage * 0.3) + 
      (connectedSources * 5) + 
      (Object.values(categoryScores).reduce((a, b) => a + b, 0) / 4 * 0.4)
    );

    // Ensure score is between 0 and 100
    const finalOverallScore = Math.max(0, Math.min(100, overallScore));

    const healthData = {
      user_id: userId,
      org_id: null,
      overall_score: overallScore,
      data_quality_score: dataQualityScore,
      connected_sources: connectedSources,
      verified_sources: verifiedSources,
      completion_percentage: completionPercentage,
      category_scores: categoryScores,
      data_sources: ['analytics', 'integrations'],
      last_calculated: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Upsert the health data
    const { error } = await query(
      `INSERT INTO business_health_snapshots (
        user_id, org_id, overall_score, data_quality_score, connected_sources, 
        verified_sources, completion_percentage, category_scores, data_sources,
        last_calculated, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (user_id) DO UPDATE SET
        org_id = EXCLUDED.org_id,
        overall_score = EXCLUDED.overall_score,
        data_quality_score = EXCLUDED.data_quality_score,
        connected_sources = EXCLUDED.connected_sources,
        verified_sources = EXCLUDED.verified_sources,
        completion_percentage = EXCLUDED.completion_percentage,
        category_scores = EXCLUDED.category_scores,
        data_sources = EXCLUDED.data_sources,
        last_calculated = EXCLUDED.last_calculated,
        updated_at = EXCLUDED.updated_at`,
      [
        healthData.user_id,
        healthData.org_id,
        healthData.overall_score,
        healthData.data_quality_score,
        healthData.connected_sources,
        healthData.verified_sources,
        healthData.completion_percentage,
        JSON.stringify(healthData.category_scores),
        healthData.data_sources,
        healthData.last_calculated,
        healthData.created_at,
        healthData.updated_at
      ]
    );

    if (error) {
      throw new Error(`Database error: ${error}`);
    }

    return {
      success: true,
      data: healthData
    };
  } catch (error) {
    console.error('Error refreshing business health:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = businessHealthHandler;
