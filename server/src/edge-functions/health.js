const { query } = require('../database/connection');

/**
 * Health check edge function
 * @param {Object} payload - Function payload
 * @param {Object} user - Authenticated user object
 * @returns {Promise<Object>} Health status
 */
async function healthHandler(payload, user) {
  try {
    // Test database connection
    const { data: dbTest, error: dbError } = await query('SELECT 1 as test');
    
    if (dbError) {
      throw new Error(`Database connection failed: ${dbError}`);
    }

    // Get system status
    const status = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      user: user ? {
        id: user.id,
        authenticated: true
      } : {
        authenticated: false
      },
      environment: {
        node_version: process.version,
        platform: process.platform,
        memory_usage: process.memoryUsage()
      }
    };

    return status;
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
}

module.exports = healthHandler;
