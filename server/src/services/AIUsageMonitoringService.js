const { logger } = require('../utils/logger');
const { query } = require('../database/connection');

/**
 * Server-side AI Usage Monitoring Service
 * Tracks AI API usage, costs, and provides monitoring capabilities
 */
class AIUsageMonitoringService {
  constructor() {
    this.config = {
      usageTable: 'ai_provider_usage',
      creditsTable: 'ai_provider_credits',
      alertsTable: 'ai_usage_alerts',
      budgetsTable: 'ai_usage_budgets',
      defaultOrderBy: 'created_at DESC',
      defaultLimit: 100,
    };
  }

  /**
   * Record AI usage in the database
   */
  async recordUsage(usageData) {
    try {
      const {
        user_id,
        org_id,
        provider,
        model,
        task_type,
        prompt_tokens = 0,
        completion_tokens = 0,
        total_tokens = 0,
        cost_cents = 0,
        cost_usd = 0,
        request_id,
        response_time_ms,
        success = true,
        error_message,
        metadata = {}
      } = usageData;

      const sql = `
        INSERT INTO ${this.config.usageTable} (
          user_id, org_id, provider, model, task_type,
          prompt_tokens, completion_tokens, total_tokens,
          cost_cents, cost_usd, request_id, response_time_ms,
          success, error_message, metadata, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW()
        ) RETURNING id
      `;

      const params = [
        user_id,
        org_id,
        provider,
        model,
        task_type,
        prompt_tokens,
        completion_tokens,
        total_tokens,
        cost_cents,
        cost_usd,
        request_id,
        response_time_ms,
        success,
        error_message,
        JSON.stringify(metadata)
      ];

      const result = await query(sql, params);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      logger.info('AI usage recorded', {
        provider,
        model,
        task_type,
        cost_usd,
        tokens: total_tokens,
        success
      });

      return {
        success: true,
        id: result.data?.[0]?.id
      };
    } catch (error) {
      logger.error('Failed to record AI usage', {
        error: error.message,
        usageData
      });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get usage statistics for a user or organization
   */
  async getUsageStats(filters = {}) {
    try {
      const { user_id, org_id, provider, start_date, end_date, limit = this.config.defaultLimit } = filters;
      
      let whereClause = 'WHERE 1=1';
      const params = [];
      let paramIndex = 1;

      if (user_id) {
        whereClause += ` AND user_id = $${paramIndex++}`;
        params.push(user_id);
      }

      if (org_id) {
        whereClause += ` AND org_id = $${paramIndex++}`;
        params.push(org_id);
      }

      if (provider) {
        whereClause += ` AND provider = $${paramIndex++}`;
        params.push(provider);
      }

      if (start_date) {
        whereClause += ` AND created_at >= $${paramIndex++}`;
        params.push(start_date);
      }

      if (end_date) {
        whereClause += ` AND created_at <= $${paramIndex++}`;
        params.push(end_date);
      }

      const sql = `
        SELECT 
          provider,
          model,
          task_type,
          COUNT(*) as request_count,
          SUM(total_tokens) as total_tokens,
          SUM(cost_usd) as total_cost_usd,
          AVG(response_time_ms) as avg_response_time_ms,
          SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful_requests,
          SUM(CASE WHEN NOT success THEN 1 ELSE 0 END) as failed_requests
        FROM ${this.config.usageTable}
        ${whereClause}
        GROUP BY provider, model, task_type
        ORDER BY total_cost_usd DESC
        LIMIT $${paramIndex}
      `;

      params.push(limit);
      const result = await query(sql, params);

      if (result.error) {
        throw new Error(result.error);
      }

      return {
        success: true,
        data: result.data
      };
    } catch (error) {
      logger.error('Failed to get usage stats', {
        error: error.message,
        filters
      });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get recent usage for monitoring
   */
  async getRecentUsage(limit = 50) {
    try {
      const sql = `
        SELECT 
          id, user_id, org_id, provider, model, task_type,
          total_tokens, cost_usd, success, error_message,
          created_at
        FROM ${this.config.usageTable}
        ORDER BY created_at DESC
        LIMIT $1
      `;

      const result = await query(sql, [limit]);

      if (result.error) {
        throw new Error(result.error);
      }

      return {
        success: true,
        data: result.data
      };
    } catch (error) {
      logger.error('Failed to get recent usage', {
        error: error.message
      });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update provider credits
   */
  async updateProviderCredits(creditsData) {
    try {
      const {
        provider,
        current_balance_usd,
        total_spent_usd,
        api_key_status = 'active',
        quota_limit_usd,
        quota_reset_date,
        metadata = {}
      } = creditsData;

      const sql = `
        INSERT INTO ${this.config.creditsTable} (
          provider, current_balance_usd, total_spent_usd,
          api_key_status, quota_limit_usd, quota_reset_date,
          metadata, last_updated
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, NOW()
        )
        ON CONFLICT (provider) DO UPDATE SET
          current_balance_usd = EXCLUDED.current_balance_usd,
          total_spent_usd = EXCLUDED.total_spent_usd,
          api_key_status = EXCLUDED.api_key_status,
          quota_limit_usd = EXCLUDED.quota_limit_usd,
          quota_reset_date = EXCLUDED.quota_reset_date,
          metadata = EXCLUDED.metadata,
          last_updated = NOW()
        RETURNING id
      `;

      const params = [
        provider,
        current_balance_usd,
        total_spent_usd,
        api_key_status,
        quota_limit_usd,
        quota_reset_date,
        JSON.stringify(metadata)
      ];

      const result = await query(sql, params);

      if (result.error) {
        throw new Error(result.error);
      }

      logger.info('Provider credits updated', {
        provider,
        current_balance_usd,
        total_spent_usd,
        api_key_status
      });

      return {
        success: true,
        id: result.data?.[0]?.id
      };
    } catch (error) {
      logger.error('Failed to update provider credits', {
        error: error.message,
        creditsData
      });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create usage alert
   */
  async createAlert(alertData) {
    try {
      const {
        alert_type,
        provider,
        severity,
        title,
        message,
        threshold_value,
        current_value,
        is_active = true,
        acknowledged_by
      } = alertData;

      const sql = `
        INSERT INTO ${this.config.alertsTable} (
          alert_type, provider, severity, title, message,
          threshold_value, current_value, is_active,
          acknowledged_by, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()
        ) RETURNING id
      `;

      const params = [
        alert_type,
        provider,
        severity,
        title,
        message,
        threshold_value,
        current_value,
        is_active,
        acknowledged_by
      ];

      const result = await query(sql, params);

      if (result.error) {
        throw new Error(result.error);
      }

      logger.info('Usage alert created', {
        alert_type,
        provider,
        severity,
        title
      });

      return {
        success: true,
        id: result.data?.[0]?.id
      };
    } catch (error) {
      logger.error('Failed to create usage alert', {
        error: error.message,
        alertData
      });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get active alerts
   */
  async getActiveAlerts(provider = null) {
    try {
      let sql = `
        SELECT 
          id, alert_type, provider, severity, title, message,
          threshold_value, current_value, is_active,
          acknowledged_by, acknowledged_at, created_at
        FROM ${this.config.alertsTable}
        WHERE is_active = true
      `;

      const params = [];

      if (provider) {
        sql += ` AND provider = $1`;
        params.push(provider);
      }

      sql += ` ORDER BY created_at DESC`;

      const result = await query(sql, params);

      if (result.error) {
        throw new Error(result.error);
      }

      return {
        success: true,
        data: result.data
      };
    } catch (error) {
      logger.error('Failed to get active alerts', {
        error: error.message
      });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(alertId, acknowledgedBy) {
    try {
      const sql = `
        UPDATE ${this.config.alertsTable}
        SET 
          acknowledged_by = $1,
          acknowledged_at = NOW()
        WHERE id = $2
        RETURNING id
      `;

      const result = await query(sql, [acknowledgedBy, alertId]);

      if (result.error) {
        throw new Error(result.error);
      }

      if (result.data.length === 0) {
        return {
          success: false,
          error: 'Alert not found'
        };
      }

      logger.info('Alert acknowledged', {
        alertId,
        acknowledgedBy
      });

      return {
        success: true,
        id: result.data[0].id
      };
    } catch (error) {
      logger.error('Failed to acknowledge alert', {
        error: error.message,
        alertId,
        acknowledgedBy
      });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get usage budget for organization
   */
  async getUsageBudget(orgId, provider = null) {
    try {
      let sql = `
        SELECT 
          id, org_id, provider, budget_type, budget_amount_usd,
          current_spend_usd, reset_date, is_active,
          created_at, updated_at
        FROM ${this.config.budgetsTable}
        WHERE org_id = $1 AND is_active = true
      `;

      const params = [orgId];

      if (provider) {
        sql += ` AND provider = $2`;
        params.push(provider);
      }

      sql += ` ORDER BY created_at DESC`;

      const result = await query(sql, params);

      if (result.error) {
        throw new Error(result.error);
      }

      return {
        success: true,
        data: result.data
      };
    } catch (error) {
      logger.error('Failed to get usage budget', {
        error: error.message,
        orgId,
        provider
      });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update usage budget
   */
  async updateUsageBudget(budgetData) {
    try {
      const {
        org_id,
        provider,
        budget_type,
        budget_amount_usd,
        current_spend_usd,
        reset_date,
        is_active = true
      } = budgetData;

      const sql = `
        INSERT INTO ${this.config.budgetsTable} (
          org_id, provider, budget_type, budget_amount_usd,
          current_spend_usd, reset_date, is_active,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, NOW(), NOW()
        )
        ON CONFLICT (org_id, provider, budget_type) DO UPDATE SET
          budget_amount_usd = EXCLUDED.budget_amount_usd,
          current_spend_usd = EXCLUDED.current_spend_usd,
          reset_date = EXCLUDED.reset_date,
          is_active = EXCLUDED.is_active,
          updated_at = NOW()
        RETURNING id
      `;

      const params = [
        org_id,
        provider,
        budget_type,
        budget_amount_usd,
        current_spend_usd,
        reset_date,
        is_active
      ];

      const result = await query(sql, params);

      if (result.error) {
        throw new Error(result.error);
      }

      logger.info('Usage budget updated', {
        org_id,
        provider,
        budget_type,
        budget_amount_usd,
        current_spend_usd
      });

      return {
        success: true,
        id: result.data?.[0]?.id
      };
    } catch (error) {
      logger.error('Failed to update usage budget', {
        error: error.message,
        budgetData
      });
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export singleton instance
const aiUsageMonitoringService = new AIUsageMonitoringService();
module.exports = { aiUsageMonitoringService };
