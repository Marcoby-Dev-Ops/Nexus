const { query } = require('../database/connection');

/**
 * Get finance performance edge function
 * @param {Object} payload - Function payload
 * @param {Object} user - Authenticated user object
 * @returns {Promise<Object>} Finance performance data
 */
async function getFinancePerformanceHandler(payload, user) {
  try {
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { company_id } = user;
    const { period = '30d' } = payload;
    
    // Get finance performance metrics
    const result = await query(`
      SELECT 
        DATE_TRUNC('day', created_at) as date,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expenses,
        SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as net_income
      FROM financial_transactions 
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
    console.error('Get finance performance failed:', error);
    throw error;
  }
}

module.exports = getFinancePerformanceHandler;
