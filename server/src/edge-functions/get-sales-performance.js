const { query } = require('../database/connection');

/**
 * Get sales performance edge function
 * @param {Object} payload - Function payload
 * @param {Object} user - Authenticated user object
 * @returns {Promise<Object>} Sales performance data
 */
async function getSalesPerformanceHandler(payload, user) {
  try {
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { company_id } = user;
    const { period = '30d' } = payload;
    
    // Get sales performance metrics
    const result = await query(`
      SELECT 
        DATE_TRUNC('day', created_at) as date,
        COUNT(*) as deals,
        SUM(value) as revenue,
        AVG(value) as avg_deal_size
      FROM sales_deals 
      WHERE company_id = $1 
      AND created_at >= NOW() - INTERVAL $2
      GROUP BY DATE_TRUNC('day', created_at)
      ORDER BY date DESC
    `, [company_id, period]);

    if (result.error) {
      throw new Error(result.error);
    }

    return {
      success: true,
      data: result.data || [],
      period: period
    };
  } catch (error) {
    console.error('Get sales performance failed:', error);
    throw error;
  }
}

module.exports = getSalesPerformanceHandler;
