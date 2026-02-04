const { query } = require('../database/connection');
const { createError } = require('../middleware/errorHandler');

/**
 * Journey Edge Function
 * Handles CRUD operations for journey tickets
 */
async function journeyHandler(payload, user) {
  try {
    const { action, data, filters, ticket_id, updates } = payload;

    if (!user) {
      throw createError('User not authenticated', 401);
    }

    switch (action) {
      case 'create':
        return await createJourneyTicket(data, user);
      
      case 'get':
        return await getJourneyTickets(filters, user);
      
      case 'get_by_id':
        return await getJourneyTicketById(ticket_id, user);
      
      case 'update':
        return await updateJourneyTicket(ticket_id, updates, user);
      
      case 'delete':
        return await deleteJourneyTicket(ticket_id, user);
      
      case 'get_stats':
        return await getJourneyTicketStats(data?.organization_id, user);
      
      default:
        throw createError(`Unknown action: ${action}`, 400);
    }
  } catch (error) {
    console.error('Brain tickets handler error:', error);
    throw error;
  }
}

/**
 * Create a new journey ticket
 */
async function createJourneyTicket(data, user) {
  const { organization_id, type, title, description, priority, status, data: ticketData } = data;

  if (!organization_id || !type || !title) {
    throw createError('Missing required fields: organization_id, type, title', 400);
  }

  const result = await query(`
    INSERT INTO brain_tickets (
      organization_id, user_id, ticket_type, status, priority, title, description, data, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
    RETURNING *
  `, [organization_id, user.id, type, status || 'open', priority || 'medium', title, description, ticketData || {}]);

  if (result.error) {
    throw createError(`Database error: ${result.error}`, 500);
  }

  return result.data ? result.data[0] : null;
}

/**
 * Get journey tickets with optional filters
 */
async function getJourneyTickets(filters = {}, user) {
  let whereClause = 'WHERE 1=1';
  const params = [];
  let paramIndex = 1;

  // Add user filter (default to current user if not specified)
  if (filters.user_id) {
    whereClause += ` AND user_id = $${paramIndex}`;
    params.push(filters.user_id);
    paramIndex++;
  } else {
    whereClause += ` AND user_id = $${paramIndex}`;
    params.push(user.id);
    paramIndex++;
  }

  // Add status filter
  if (filters.status) {
    whereClause += ` AND status = $${paramIndex}`;
    params.push(filters.status);
    paramIndex++;
  }

  // Add type filter
  if (filters.type) {
    whereClause += ` AND ticket_type = $${paramIndex}`;
    params.push(filters.type);
    paramIndex++;
  }

  // Add priority filter
  if (filters.priority) {
    whereClause += ` AND priority = $${paramIndex}`;
    params.push(filters.priority);
    paramIndex++;
  }

  // Add search filter
  if (filters.search) {
    whereClause += ` AND (title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
    params.push(`%${filters.search}%`);
    paramIndex++;
  }

  const result = await query(`
    SELECT * FROM brain_tickets 
    ${whereClause}
    ORDER BY created_at DESC
    ${filters.limit ? `LIMIT ${filters.limit}` : ''}
  `, params);

  if (result.error) {
    throw createError(`Database error: ${result.error}`, 500);
  }

  return result.data || [];
}

/**
 * Get a specific journey ticket by ID
 */
async function getJourneyTicketById(ticketId, user) {
  if (!ticketId) {
    throw createError('Ticket ID is required', 400);
  }

  const result = await query(`
    SELECT * FROM brain_tickets 
    WHERE id = $1
  `, [ticketId]);

  if (result.error) {
    throw createError(`Database error: ${result.error}`, 500);
  }

  if (!result.data || result.data.length === 0) {
    throw createError('Journey ticket not found', 404);
  }

  return result.data[0];
}

/**
 * Update a journey ticket
 */
async function updateJourneyTicket(ticketId, updates, user) {
  if (!ticketId) {
    throw createError('Ticket ID is required', 400);
  }

  if (!updates || Object.keys(updates).length === 0) {
    throw createError('No updates provided', 400);
  }

  const allowedFields = ['title', 'description', 'priority', 'status', 'ai_insights', 'business_impact'];
  const updateFields = [];
  const params = [ticketId];
  let paramIndex = 2;

  for (const [field, value] of Object.entries(updates)) {
    if (allowedFields.includes(field)) {
      updateFields.push(`${field} = $${paramIndex}`);
      params.push(value);
      paramIndex++;
    }
  }

  if (updateFields.length === 0) {
    throw createError('No valid fields to update', 400);
  }

  updateFields.push('updated_at = NOW()');

  const result = await query(`
    UPDATE brain_tickets 
    SET ${updateFields.join(', ')}
    WHERE id = $1
    RETURNING *
  `, params);

  if (result.error) {
    throw createError(`Database error: ${result.error}`, 500);
  }

  if (!result.data || result.data.length === 0) {
    throw createError('Journey ticket not found', 404);
  }

  return result.data[0];
}

/**
 * Delete a journey ticket
 */
async function deleteJourneyTicket(ticketId, user) {
  if (!ticketId) {
    throw createError('Ticket ID is required', 400);
  }

  const result = await query(`
    DELETE FROM brain_tickets 
    WHERE id = $1
    RETURNING id
  `, [ticketId]);

  if (result.error) {
    throw createError(`Database error: ${result.error}`, 500);
  }

  if (!result.data || result.data.length === 0) {
    throw createError('Journey ticket not found', 404);
  }

  return { success: true };
}

/**
 * Get journey ticket statistics
 */
async function getJourneyTicketStats(organizationId, user) {
  if (!organizationId) {
    throw createError('Organization ID is required', 400);
  }

  const result = await query(`
    SELECT 
      COUNT(*) as total_tickets,
      COUNT(CASE WHEN status = 'open' THEN 1 END) as active_tickets,
      COUNT(CASE WHEN status = 'paused' THEN 1 END) as paused_tickets,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tickets,
      COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority_tickets,
      COUNT(CASE WHEN priority = 'medium' THEN 1 END) as medium_priority_tickets,
      COUNT(CASE WHEN priority = 'low' THEN 1 END) as low_priority_tickets
    FROM brain_tickets 
    WHERE user_id = $1
  `, [user.id]);

  if (result.error) {
    throw createError(`Database error: ${result.error}`, 500);
  }

  return result.data ? result.data[0] : null;
}

module.exports = journeyHandler;
