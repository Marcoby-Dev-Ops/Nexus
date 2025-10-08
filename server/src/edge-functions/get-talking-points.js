const { query } = require('../database/connection');

/**
 * Get talking points edge function
 * @param {Object} payload - Function payload
 * @param {Object} user - Authenticated user object
 * @returns {Promise<Object>} Talking points data
 */
async function getTalkingPointsHandler(payload, user) {
  try {
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { company_id } = user;
    const { context, limit = 5 } = payload;
    
    // Get talking points based on context
    const result = await query(`
      SELECT id, title, content, category, priority, created_at
      FROM talking_points 
      WHERE company_id = $1 
      AND ($2::text IS NULL OR content ILIKE $3)
      ORDER BY priority DESC, created_at DESC 
      LIMIT $4
    `, [company_id, context, context ? `%${context}%` : null, limit]);

    if (result.error) {
      throw new Error(result.error);
    }

    return {
      success: true,
      data: result.data || [],
      count: result.data?.length || 0
    };
  } catch (error) {
    console.error('Get talking points failed:', error);
    throw error;
  }
}

module.exports = getTalkingPointsHandler;
