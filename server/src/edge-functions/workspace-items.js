const { query } = require('../database/connection');

/**
 * Workspace items edge function
 * @param {Object} payload - Function payload
 * @param {Object} user - Authenticated user object
 * @returns {Promise<Object>} Workspace items data
 */
async function workspaceItemsHandler(payload, user) {
  try {
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { company_id } = user;
    
    // Get workspace items for the user's company
    const result = await query(`
      SELECT id, title, content, type, status, created_at, updated_at
      FROM workspace_items 
      WHERE company_id = $1 
      ORDER BY updated_at DESC 
      LIMIT 50
    `, [company_id]);

    if (result.error) {
      throw new Error(result.error);
    }

    return {
      success: true,
      data: result.data || [],
      count: result.data?.length || 0
    };
  } catch (error) {
    console.error('Workspace items failed:', error);
    throw error;
  }
}

module.exports = workspaceItemsHandler;
