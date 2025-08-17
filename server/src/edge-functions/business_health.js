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
    // Calculate basic health metrics
    const overallScore = Math.floor(Math.random() * 100) + 1; // Placeholder calculation
    const dataQualityScore = Math.floor(Math.random() * 100) + 1;
    const connectedSources = Math.floor(Math.random() * 10) + 1;
    const verifiedSources = Math.floor(Math.random() * connectedSources) + 1;
    const completionPercentage = Math.floor(Math.random() * 100) + 1;

    const categoryScores = {
      sales: Math.floor(Math.random() * 100) + 1,
      marketing: Math.floor(Math.random() * 100) + 1,
      operations: Math.floor(Math.random() * 100) + 1,
      finance: Math.floor(Math.random() * 100) + 1
    };

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
