const { query } = require('../database/connection');
const { createError } = require('../middleware/errorHandler');

/**
 * Get Playbook Items Edge Function
 * Handles fetching playbook items/steps for a specific playbook template
 */
async function get_playbook_items(payload, user) {
  try {
    const { playbookId } = payload;

    if (!user) {
      throw createError('User not authenticated', 401);
    }

    if (!playbookId) {
      throw createError('Playbook ID is required', 400);
    }

    // Build the query to get playbook items
    const queryText = `
      SELECT 
        pi.id,
        pi.name,
        pi.description,
        pi.item_type,
        pi.order_index,
        pi.is_required,
        pi.estimated_duration_minutes,
        pi.component_name,
        pi.metadata,
        pi.validation_schema,
        pi.created_at as "createdAt",
        pi.updated_at as "updatedAt"
      FROM playbook_items pi 
      JOIN playbook_templates pt ON pi.playbook_id = pt.id 
      WHERE pt.id = $1 AND pt.is_active = true
      ORDER BY pi.order_index ASC
    `;
    
    const result = await query(queryText, [playbookId]);

    return {
      success: true,
      data: result.data || []
    };

  } catch (error) {
    console.error('Get playbook items error:', error);
    throw createError('Failed to fetch playbook items', 500);
  }
}

module.exports = get_playbook_items;
