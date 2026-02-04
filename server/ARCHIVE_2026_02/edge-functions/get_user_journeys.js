const { query } = require('../database/connection');
const { createError } = require('../middleware/errorHandler');

/**
 * Get User Journeys Edge Function
 * Handles fetching user's journey instances
 */
async function get_user_journeys(payload, user) {
  try {
    const { userId, status, organizationId } = payload;

    if (!user) {
      throw createError('User not authenticated', 401);
    }

    // Use the authenticated user's ID if not provided
    const targetUserId = userId || user.id;
    const targetOrgId = organizationId || user.organization_id;

    // Build the query
    let queryText = `
      SELECT 
        id,
        playbook_id as "typeId",
        user_id as "userId",
        $2 as "organizationId",
        'Journey' as "name",
        'User journey' as "description",
        status,
        progress_percentage as "progress",
        started_at as "startDate",
        NULL as "targetEndDate",
        completed_at as "actualEndDate",
        '[]'::jsonb as "goals",
        '[]'::jsonb as "customMilestones",
        '[]'::jsonb as "completedMilestones",
        '[]'::jsonb as "conversation",
        metadata,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM user_journeys 
      WHERE user_id = $1
    `;
    
    const queryParams = [targetUserId];
    let paramIndex = 2;

    // Add status filter if provided
    if (status) {
      queryText += ` AND status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }

    queryText += ` ORDER BY created_at DESC`;

    const result = await query(queryText, queryParams);

    return {
      success: true,
      data: result.rows || []
    };

  } catch (error) {
    console.error('Get user journeys error:', error);
    throw createError('Failed to fetch user journeys', 500);
  }
}

module.exports = get_user_journeys;
