const { query } = require('../database/connection');

/**
 * Get users edge function
 * @param {Object} payload - Function payload
 * @param {Object} user - Authenticated user object
 * @returns {Promise<Object>} Users data
 */
async function getUsersHandler(payload, user) {
  try {
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get users with optional filtering
    let sql = 'SELECT id, email, created_at, updated_at FROM users';
    const queryParams = [];
    const whereConditions = [];

    // Apply filters if provided
    if (payload && payload.filters) {
      if (payload.filters.email) {
        whereConditions.push('email ILIKE $1');
        queryParams.push(`%${payload.filters.email}%`);
      }
      
      if (payload.filters.created_after) {
        whereConditions.push('created_at >= $' + (queryParams.length + 1));
        queryParams.push(payload.filters.created_after);
      }
    }

    if (whereConditions.length > 0) {
      sql += ' WHERE ' + whereConditions.join(' AND ');
    }

    // Add ordering
    sql += ' ORDER BY created_at DESC';

    // Add limit if provided
    if (payload && payload.limit) {
      sql += ' LIMIT $' + (queryParams.length + 1);
      queryParams.push(payload.limit);
    }

    const { data: users, error } = await query(sql, queryParams);

    if (error) {
      throw new Error(`Database error: ${error}`);
    }

    return {
      users,
      count: users.length,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Get users failed:', error);
    throw error;
  }
}

module.exports = getUsersHandler;
