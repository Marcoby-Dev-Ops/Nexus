const { query } = require('../database/connection');
const { createError } = require('../middleware/errorHandler');

/**
 * Journey Analytics Edge Function
 * Handles journey completion tracking and analytics generation
 */
async function journeyAnalyticsHandler(payload, user) {
  try {
    const { action, user_id, organization_id, journey_id, completion_data } = payload;

    if (!user) {
      throw createError('User not authenticated', 401);
    }

    switch (action) {
      case 'track_completion':
        return await trackJourneyCompletion(user_id, organization_id, journey_id, completion_data);
      
      case 'get_user_history':
        return await getUserJourneyHistory(user_id, organization_id);
      
      default:
        throw createError(`Unknown action: ${action}`, 400);
    }
  } catch (error) {
    console.error('Journey Analytics Error:', error);
    throw error;
  }
}

/**
 * Track journey completion for analytics
 */
async function trackJourneyCompletion(userId, organizationId, journeyId, completionData) {
  try {
    // Calculate completion duration
    const duration = completionData.duration || 0;
    
    // Store analytics data
    const result = await query(`
      INSERT INTO journey_analytics (
        user_id, organization_id, journey_id, completion_duration, 
        response_count, maturity_assessment, completed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *
    `, [
      userId, 
      organizationId, 
      journeyId, 
      duration,
      completionData.responses?.length || 0,
      completionData.maturityAssessment || null
    ]);

    if (result.error) {
      throw createError(`Database error: ${result.error}`, 500);
    }

    return result.data ? result.data[0] : null;
  } catch (error) {
    console.error('Error tracking journey completion:', error);
    throw error;
  }
}

/**
 * Get user's journey history for analytics
 */
async function getUserJourneyHistory(userId, organizationId) {
  try {
    // Get completed journeys
    const completedJourneysResult = await query(`
      SELECT * FROM user_journey_progress 
      WHERE user_id = $1 AND organization_id = $2 AND status = 'completed'
      ORDER BY completed_at DESC
    `, [userId, organizationId]);

    // Get journey responses
    const responsesResult = await query(`
      SELECT * FROM journey_responses 
      WHERE user_id = $1 AND organization_id = $2
      ORDER BY created_at DESC
    `, [userId, organizationId]);

    if (completedJourneysResult.error) {
      throw createError(`Database error: ${completedJourneysResult.error}`, 500);
    }

    if (responsesResult.error) {
      throw createError(`Database error: ${responsesResult.error}`, 500);
    }

    return {
      completedJourneys: completedJourneysResult.data || [],
      responses: responsesResult.data || []
    };
  } catch (error) {
    console.error('Error fetching journey history:', error);
    throw error;
  }
}

module.exports = journeyAnalyticsHandler;
