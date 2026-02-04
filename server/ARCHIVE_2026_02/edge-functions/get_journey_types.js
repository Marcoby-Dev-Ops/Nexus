const { query } = require('../database/connection');
const { createError } = require('../middleware/errorHandler');

/**
 * Get Journey Types Edge Function
 * Handles fetching available journey types/templates
 */
async function get_journey_types(payload, user) {
  try {
    const { category, complexity, organizationId } = payload;

    if (!user) {
      throw createError('User not authenticated', 401);
    }

    // Build the query
    let queryText = `
      SELECT 
        id,
        name,
        description,
        category,
        complexity,
        estimated_duration_hours as "estimatedDuration",
        prerequisites,
        success_metrics as "successMetrics",
        '[]'::jsonb as "outcomes",
        '[]'::jsonb as "milestones",
        is_active as "isActive",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM playbook_templates 
      WHERE is_active = true
    `;
    
    const queryParams = [];
    let paramIndex = 1;

    // Add category filter if provided
    if (category) {
      queryText += ` AND category = $${paramIndex}`;
      queryParams.push(category);
      paramIndex++;
    }

    // Add complexity filter if provided
    if (complexity) {
      queryText += ` AND complexity = $${paramIndex}`;
      queryParams.push(complexity);
      paramIndex++;
    }

    queryText += ` ORDER BY name ASC`;

    const result = await query(queryText, queryParams);

    return {
      success: true,
      data: result.data || []
    };

  } catch (error) {
    console.error('Get journey types error:', error);
    throw createError('Failed to fetch journey types', 500);
  }
}

module.exports = get_journey_types;
