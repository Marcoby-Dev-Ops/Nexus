const { query } = require('../database/connection');
const { createError } = require('../middleware/errorHandler');

/**
 * Journeys Edge Function
 * Handles journey template and user journey operations
 */
async function journeysHandler(payload, user) {
  try {
    const { action, data, template_id, journey_id, item_id, response_data } = payload;

    if (!user) {
      throw createError('User not authenticated', 401);
    }

    switch (action) {
      case 'get_journey_templates':
        return await getJourneyTemplates();
      
      case 'get_journey_template':
        return await getJourneyTemplate(template_id);
      
      case 'get_journey_items':
        return await getJourneyItems(template_id);
      
      case 'start_journey':
        return await startJourney(data, user);
      
      case 'get_journey_progress':
        return await getJourneyProgress(data, user);
      
      case 'get_journey_responses':
        return await getJourneyResponses(data, user);
      
      case 'save_journey_step_response':
        return await saveJourneyStepResponse(data, user);
      
      case 'update_journey_progress':
        return await updateJourneyProgress(data, user);
      
      case 'complete_journey':
        return await completeJourney(data, user);
      
      case 'suggest_next_journey':
        return await suggestNextJourney(data, user);
      
      case 'get_active_journeys':
        return await getActiveJourneys(data, user);
      
      default:
        throw createError(`Unknown action: ${action}`, 400);
    }
  } catch (error) {
    console.error('Journeys handler error:', error);
    throw error;
  }
}

/**
 * Get all active journey templates
 */
async function getJourneyTemplates() {
  const result = await query(`
    SELECT * FROM journey_templates 
    WHERE is_active = true 
    ORDER BY created_at DESC
  `);

  if (result.error) {
    throw createError(`Database error: ${result.error}`, 500);
  }

  return result.data || [];
}

/**
 * Get a specific journey template by ID
 */
async function getJourneyTemplate(templateId) {
  if (!templateId) {
    throw createError('Template ID is required', 400);
  }

  const result = await query(`
    SELECT * FROM journey_templates 
    WHERE id = $1 AND is_active = true
  `, [templateId]);

  if (result.error) {
    throw createError(`Database error: ${result.error}`, 500);
  }

  if (!result.data || result.data.length === 0) {
    throw createError('Journey template not found', 404);
  }

  return result.data[0];
}

/**
 * Get journey items for a specific template
 */
async function getJourneyItems(templateId) {
  if (!templateId) {
    throw createError('Template ID is required', 400);
  }

  const result = await query(`
    SELECT * FROM journey_items 
    WHERE journey_template_id = $1 
    ORDER BY order_index ASC
  `, [templateId]);

  if (result.error) {
    throw createError(`Database error: ${result.error}`, 500);
  }

  return result.data || [];
}

/**
 * Start a journey for a user
 */
async function startJourney(data, user) {
  const { user_id, organization_id, template_id, journey_id, current_step, total_steps, progress_percentage, status, started_at, metadata } = data;

  if (!user_id || !organization_id || !template_id) {
    throw createError('Missing required fields: user_id, organization_id, template_id', 400);
  }

  // Check if user already has an active journey for this playbook
  const existingResult = await query(`
    SELECT * FROM user_journeys 
    WHERE user_id = $1 AND playbook_id = $2 AND status != 'completed'
  `, [user_id, template_id]);

  if (existingResult.error) {
    throw createError(`Database error: ${existingResult.error}`, 500);
  }

  if (existingResult.data && existingResult.data.length > 0) {
    throw createError('User already has an active journey for this playbook', 400);
  }

  // Create new journey
  const result = await query(`
    INSERT INTO user_journeys (
      id, user_id, playbook_id, status, 
      current_step, total_steps, progress_percentage, 
      started_at, metadata, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
    RETURNING *
  `, [journey_id, user_id, template_id, status || 'in_progress', current_step || 1, total_steps || 0, progress_percentage || 0, started_at || new Date().toISOString(), metadata ? JSON.stringify(metadata) : '{}']);

  if (result.error) {
    throw createError(`Database error: ${result.error}`, 500);
  }

  return result.data ? result.data[0] : null;
}

/**
 * Get journey progress
 */
async function getJourneyProgress(data, user) {
  const { user_id, organization_id, journey_id } = data;

  if (!user_id || !organization_id || !journey_id) {
    throw createError('Missing required fields: user_id, organization_id, journey_id', 400);
  }

  const result = await query(`
    SELECT * FROM user_journey_progress 
    WHERE user_id = $1 AND organization_id = $2 AND journey_id = $3
  `, [user_id, organization_id, journey_id]);

  if (result.error) {
    throw createError(`Database error: ${result.error}`, 500);
  }

  if (!result.data || result.data.length === 0) {
    throw createError('Journey progress not found', 404);
  }

  return result.data[0];
}

/**
 * Get journey responses
 */
async function getJourneyResponses(data, user) {
  const { user_id, organization_id, journey_id } = data;

  if (!user_id || !organization_id || !journey_id) {
    throw createError('Missing required fields: user_id, organization_id, journey_id', 400);
  }

  const result = await query(`
    SELECT * FROM user_journey_responses 
    WHERE user_id = $1 AND organization_id = $2 AND journey_id = $3
    ORDER BY created_at ASC
  `, [user_id, organization_id, journey_id]);

  if (result.error) {
    throw createError(`Database error: ${result.error}`, 500);
  }

  return result.data || [];
}

/**
 * Save journey step response
 */
async function saveJourneyStepResponse(data, user) {
  const { user_id, organization_id, journey_id, step_id, response_data } = data;

  if (!user_id || !organization_id || !journey_id || !step_id) {
    throw createError('Missing required fields: user_id, organization_id, journey_id, step_id', 400);
  }

  // Check if response already exists
  const existingResult = await query(`
    SELECT * FROM user_journey_responses 
    WHERE user_id = $1 AND organization_id = $2 AND journey_id = $3 AND step_id = $4
  `, [user_id, organization_id, journey_id, step_id]);

  if (existingResult.error) {
    throw createError(`Database error: ${existingResult.error}`, 500);
  }

  if (existingResult.data && existingResult.data.length > 0) {
    // Update existing response
    const result = await query(`
      UPDATE user_journey_responses 
      SET response_data = $5, updated_at = NOW()
      WHERE user_id = $1 AND organization_id = $2 AND journey_id = $3 AND step_id = $4
      RETURNING *
    `, [user_id, organization_id, journey_id, step_id, response_data]);

    if (result.error) {
      throw createError(`Database error: ${result.error}`, 500);
    }

    return result.data ? result.data[0] : null;
  } else {
    // Create new response
    const result = await query(`
      INSERT INTO user_journey_responses (
        user_id, organization_id, journey_id, step_id, response_data, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING *
    `, [user_id, organization_id, journey_id, step_id, response_data]);

    if (result.error) {
      throw createError(`Database error: ${result.error}`, 500);
    }

    return result.data ? result.data[0] : null;
  }
}

/**
 * Update journey progress
 */
async function updateJourneyProgress(data, user) {
  const { journey_id, updates } = data;

  if (!journey_id) {
    throw createError('Journey ID is required', 400);
  }

  if (!updates || Object.keys(updates).length === 0) {
    throw createError('No updates provided', 400);
  }

  const allowedFields = ['current_step', 'progress_percentage', 'status', 'completed_at', 'maturity_assessment'];
  const updateFields = [];
  const params = [journey_id];
  let paramIndex = 2;

  for (const [field, value] of Object.entries(updates)) {
    if (allowedFields.includes(field)) {
      if (field === 'maturity_assessment') {
        updateFields.push(`${field} = $${paramIndex}`);
        params.push(JSON.stringify(value));
      } else {
        updateFields.push(`${field} = $${paramIndex}`);
        params.push(value);
      }
      paramIndex++;
    }
  }

  if (updateFields.length === 0) {
    throw createError('No valid fields to update', 400);
  }

  updateFields.push('updated_at = NOW()');

  const result = await query(`
    UPDATE user_journey_progress 
    SET ${updateFields.join(', ')}
    WHERE journey_id = $1
    RETURNING *
  `, params);

  if (result.error) {
    throw createError(`Database error: ${result.error}`, 500);
  }

  if (!result.data || result.data.length === 0) {
    throw createError('Journey progress not found', 404);
  }

  return result.data[0];
}

/**
 * Complete a journey
 */
async function completeJourney(data, user) {
  const { user_id, organization_id, journey_id } = data;

  if (!user_id || !organization_id || !journey_id) {
    throw createError('Missing required fields: user_id, organization_id, journey_id', 400);
  }

  // Update journey progress to completed
  const result = await query(`
    UPDATE user_journey_progress 
    SET status = 'completed', completed_at = NOW(), updated_at = NOW()
    WHERE user_id = $1 AND organization_id = $2 AND journey_id = $3
    RETURNING *
  `, [user_id, organization_id, journey_id]);

  if (result.error) {
    throw createError(`Database error: ${result.error}`, 500);
  }

  if (!result.data || result.data.length === 0) {
    throw createError('Journey progress not found', 404);
  }

  return result.data[0];
}

/**
 * Suggest next journey for user
 */
async function suggestNextJourney(data, user) {
  const { user_id, organization_id } = data;

  if (!user_id || !organization_id) {
    throw createError('Missing required fields: user_id, organization_id', 400);
  }

  // Get user's completed journeys
  const completedResult = await query(`
    SELECT journey_template_id FROM user_journey_progress 
    WHERE user_id = $1 AND status = 'completed'
  `, [user_id]);

  if (completedResult.error) {
    throw createError(`Database error: ${completedResult.error}`, 500);
  }

  const completedTemplateIds = (completedResult.data || []).map(row => row.journey_template_id);

  // Get available templates that user hasn't completed
  let whereClause = 'WHERE is_active = true';
  const params = [];
  let paramIndex = 1;

  if (completedTemplateIds.length > 0) {
    whereClause += ` AND id NOT IN (${completedTemplateIds.map(() => `$${paramIndex++}`).join(',')})`;
    params.push(...completedTemplateIds);
  }

  const result = await query(`
    SELECT * FROM journey_templates 
    ${whereClause}
    ORDER BY priority DESC, created_at DESC
    LIMIT 5
  `, params);

  if (result.error) {
    throw createError(`Database error: ${result.error}`, 500);
  }

  return result.data || [];
}

/**
 * Get active journeys for a user
 */
async function getActiveJourneys(data, user) {
  const { user_id } = data;

  if (!user_id) {
    throw createError('Missing required field: user_id', 400);
  }

  const result = await query(`
    SELECT * FROM user_journey_progress 
    WHERE user_id = $1 AND status = 'in_progress'
    ORDER BY started_at DESC
  `, [user_id]);

  if (result.error) {
    throw createError(`Database error: ${result.error}`, 500);
  }

  return result.data || [];
}

module.exports = journeysHandler;
