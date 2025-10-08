import { z } from 'zod';
import { BaseService, type ServiceResponse } from '@/core/services/BaseService';

// ============================================================================
// SCHEMAS
// ============================================================================

export const AIProviderUsageSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid(),
  org_id: z.string().uuid().optional(),
  provider: z.enum(['openai', 'openrouter', 'local']),
  model: z.string(),
  task_type: z.enum(['chat', 'embed', 'completion', 'image']),
  prompt_tokens: z.number().int().min(0),
  completion_tokens: z.number().int().min(0),
  total_tokens: z.number().int().min(0),
  cost_cents: z.number().int().min(0),
  cost_usd: z.number().min(0),
  request_id: z.string().optional(),
  response_time_ms: z.number().min(0).optional(),
  success: z.boolean(),
  error_message: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  created_at: z.string().datetime().optional(),
});

export const AIProviderCreditsSchema = z.object({
  id: z.string().uuid().optional(),
  provider: z.enum(['openai', 'openrouter']),
  current_balance_usd: z.number().min(0),
  total_spent_usd: z.number().min(0),
  last_updated: z.string().datetime().optional(),
  api_key_status: z.enum(['active', 'expired', 'quota_exceeded']),
  quota_limit_usd: z.number().min(0).optional(),
  quota_reset_date: z.string().date().optional(),
  metadata: z.record(z.any()).optional(),
});

export const AIUsageAlertSchema = z.object({
  id: z.string().uuid().optional(),
  alert_type: z.enum(['low_balance', 'high_usage', 'quota_exceeded', 'error_rate']),
  provider: z.enum(['openai', 'openrouter']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  title: z.string(),
  message: z.string(),
  threshold_value: z.number().min(0).optional(),
  current_value: z.number().min(0).optional(),
  is_active: z.boolean(),
  acknowledged_by: z.string().uuid().optional(),
  acknowledged_at: z.string().datetime().optional(),
  created_at: z.string().datetime().optional(),
  resolved_at: z.string().datetime().optional(),
});

export const AIUsageBudgetSchema = z.object({
  id: z.string().uuid().optional(),
  org_id: z.string().uuid(),
  provider: z.enum(['openai', 'openrouter']),
  budget_type: z.enum(['daily', 'weekly', 'monthly']),
  budget_amount_usd: z.number().min(0),
  current_spend_usd: z.number().min(0),
  reset_date: z.string().date(),
  is_active: z.boolean(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export type AIProviderUsage = z.infer<typeof AIProviderUsageSchema>;
export type AIProviderCredits = z.infer<typeof AIProviderCreditsSchema>;
export type AIUsageAlert = z.infer<typeof AIUsageAlertSchema>;
export type AIUsageBudget = z.infer<typeof AIUsageBudgetSchema>;

// ============================================================================
// SERVICE CONFIGURATION
// ============================================================================

const SERVICE_CONFIG = {
  usageTable: 'ai_provider_usage',
  creditsTable: 'ai_provider_credits',
  alertsTable: 'ai_usage_alerts',
  budgetsTable: 'ai_usage_budgets',
  defaultOrderBy: 'created_at.desc',
  defaultLimit: 100,
} as const;

// ============================================================================
// AI USAGE MONITORING SERVICE
// ============================================================================

/**
 * Service for comprehensive AI usage monitoring
 * 
 * Provides tracking for OpenAI and OpenRouter API usage, costs, credits,
 * alerts, and budget management for admin monitoring.
 */
export class AIUsageMonitoringService extends BaseService {
  private readonly config = SERVICE_CONFIG;

  /**
   * Record AI provider usage
   */
  async recordUsage(data: Omit<AIProviderUsage, 'id' | 'created_at'>): Promise<ServiceResponse<AIProviderUsage>> {
    try {
      this.logger.info('Recording AI usage', { 
        provider: data.provider, 
        model: data.model, 
        task_type: data.task_type,
        cost_usd: data.cost_usd 
      });

      const { data: created, error } = await this.supabase
        .from(this.config.usageTable)
        .insert(data)
        .select()
        .single();

      if (error) {
        return this.handleError(error, 'Failed to record AI usage');
      }

      const validated = AIProviderUsageSchema.parse(created);
      
      // Update model performance tracking
      await this.updateModelPerformance(data);
      
      // Check for alerts
      await this.checkUsageAlerts(data);
      
      return this.createResponse(validated);
    } catch (error) {
      return this.handleError(error, 'Failed to record AI usage');
    }
  }

  /**
   * Get usage statistics for admin dashboard
   */
  async getUsageStats(filters?: {
    provider?: string;
    model?: string;
    task_type?: string;
    start_date?: string;
    end_date?: string;
    org_id?: string;
  }): Promise<ServiceResponse<{
    total_requests: number;
    total_cost_usd: number;
    total_tokens: number;
    success_rate: number;
    avg_response_time_ms: number;
    by_provider: Record<string, any>;
    by_model: Record<string, any>;
    daily_usage: Array<{ date: string; requests: number; cost_usd: number; tokens: number }>;
  }>> {
    try {
      this.logger.info('Getting AI usage stats', { filters });

      let query = this.supabase
        .from(this.config.usageTable)
        .select('*');

      // Apply filters
      if (filters?.provider) {
        query = query.eq('provider', filters.provider);
      }
      if (filters?.model) {
        query = query.eq('model', filters.model);
      }
      if (filters?.task_type) {
        query = query.eq('task_type', filters.task_type);
      }
      if (filters?.org_id) {
        query = query.eq('org_id', filters.org_id);
      }
      if (filters?.start_date) {
        query = query.gte('created_at', filters.start_date);
      }
      if (filters?.end_date) {
        query = query.lte('created_at', filters.end_date);
      }

      const { data, error } = await query;

      if (error) {
        return this.handleError(error, 'Failed to get usage stats');
      }

      if (!data || data.length === 0) {
        return this.createResponse({
          total_requests: 0,
          total_cost_usd: 0,
          total_tokens: 0,
          success_rate: 0,
          avg_response_time_ms: 0,
          by_provider: {},
          by_model: {},
          daily_usage: [],
        });
      }

      // Calculate statistics
      const totalRequests = data.length;
      const successfulRequests = data.filter(r => r.success).length;
      const totalCostUsd = data.reduce((sum, r) => sum + (r.cost_usd || 0), 0);
      const totalTokens = data.reduce((sum, r) => sum + (r.total_tokens || 0), 0);
      const totalResponseTime = data.reduce((sum, r) => sum + (r.response_time_ms || 0), 0);

      // Group by provider
      const byProvider: Record<string, any> = {};
      data.forEach(record => {
        if (!byProvider[record.provider]) {
          byProvider[record.provider] = {
            requests: 0,
            cost_usd: 0,
            tokens: 0,
            success_rate: 0,
          };
        }
        byProvider[record.provider].requests++;
        byProvider[record.provider].cost_usd += record.cost_usd || 0;
        byProvider[record.provider].tokens += record.total_tokens || 0;
      });

      // Calculate success rates
      Object.keys(byProvider).forEach(provider => {
        const providerData = data.filter(r => r.provider === provider);
        const successful = providerData.filter(r => r.success).length;
        byProvider[provider].success_rate = providerData.length > 0 ? (successful / providerData.length) * 100 : 0;
      });

      // Group by model
      const byModel: Record<string, any> = {};
      data.forEach(record => {
        if (!byModel[record.model]) {
          byModel[record.model] = {
            requests: 0,
            cost_usd: 0,
            tokens: 0,
          };
        }
        byModel[record.model].requests++;
        byModel[record.model].cost_usd += record.cost_usd || 0;
        byModel[record.model].tokens += record.total_tokens || 0;
      });

      // Daily usage
      const dailyUsage = this.calculateDailyUsage(data);

      return this.createResponse({
        total_requests: totalRequests,
        total_cost_usd: totalCostUsd,
        total_tokens: totalTokens,
        success_rate: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0,
        avg_response_time_ms: totalRequests > 0 ? totalResponseTime / totalRequests : 0,
        by_provider: byProvider,
        by_model: byModel,
        daily_usage: dailyUsage,
      });
    } catch (error) {
      return this.handleError(error, 'Failed to get usage stats');
    }
  }

  /**
   * Get provider credits and balances
   */
  async getProviderCredits(): Promise<ServiceResponse<AIProviderCredits[]>> {
    try {
      this.logger.info('Getting provider credits');

      const { data, error } = await this.supabase
        .from(this.config.creditsTable)
        .select('*')
        .order('provider');

      if (error) {
        return this.handleError(error, 'Failed to get provider credits');
      }

      const validated = data.map(record => AIProviderCreditsSchema.parse(record));
      return this.createResponse(validated);
    } catch (error) {
      return this.handleError(error, 'Failed to get provider credits');
    }
  }

  /**
   * Update provider credits
   */
  async updateProviderCredits(provider: string, updates: Partial<AIProviderCredits>): Promise<ServiceResponse<AIProviderCredits>> {
    try {
      this.logger.info('Updating provider credits', { provider, updates });

      const { data, error } = await this.supabase
        .from(this.config.creditsTable)
        .update({
          ...updates,
          last_updated: new Date().toISOString(),
        })
        .eq('provider', provider)
        .select()
        .single();

      if (error) {
        return this.handleError(error, 'Failed to update provider credits');
      }

      const validated = AIProviderCreditsSchema.parse(data);
      return this.createResponse(validated);
    } catch (error) {
      return this.handleError(error, 'Failed to update provider credits');
    }
  }

  /**
   * Get active alerts
   */
  async getActiveAlerts(): Promise<ServiceResponse<AIUsageAlert[]>> {
    try {
      this.logger.info('Getting active alerts');

      const { data, error } = await this.supabase
        .from(this.config.alertsTable)
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        return this.handleError(error, 'Failed to get active alerts');
      }

      const validated = data.map(record => AIUsageAlertSchema.parse(record));
      return this.createResponse(validated);
    } catch (error) {
      return this.handleError(error, 'Failed to get active alerts');
    }
  }

  /**
   * Create usage alert
   */
  async createAlert(data: Omit<AIUsageAlert, 'id' | 'created_at'>): Promise<ServiceResponse<AIUsageAlert>> {
    try {
      this.logger.info('Creating usage alert', { 
        alert_type: data.alert_type, 
        provider: data.provider, 
        severity: data.severity 
      });

      const { data: created, error } = await this.supabase
        .from(this.config.alertsTable)
        .insert(data)
        .select()
        .single();

      if (error) {
        return this.handleError(error, 'Failed to create alert');
      }

      const validated = AIUsageAlertSchema.parse(created);
      return this.createResponse(validated);
    } catch (error) {
      return this.handleError(error, 'Failed to create alert');
    }
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(alertId: string, userId: string): Promise<ServiceResponse<AIUsageAlert>> {
    try {
      this.logger.info('Acknowledging alert', { alertId, userId });

      const { data, error } = await this.supabase
        .from(this.config.alertsTable)
        .update({
          acknowledged_by: userId,
          acknowledged_at: new Date().toISOString(),
        })
        .eq('id', alertId)
        .select()
        .single();

      if (error) {
        return this.handleError(error, 'Failed to acknowledge alert');
      }

      const validated = AIUsageAlertSchema.parse(data);
      return this.createResponse(validated);
    } catch (error) {
      return this.handleError(error, 'Failed to acknowledge alert');
    }
  }

  /**
   * Get usage budgets
   */
  async getUsageBudgets(orgId?: string): Promise<ServiceResponse<AIUsageBudget[]>> {
    try {
      this.logger.info('Getting usage budgets', { orgId });

      let query = this.supabase
        .from(this.config.budgetsTable)
        .select('*')
        .eq('is_active', true);

      if (orgId) {
        query = query.eq('org_id', orgId);
      }

      const { data, error } = await query;

      if (error) {
        return this.handleError(error, 'Failed to get usage budgets');
      }

      const validated = data.map(record => AIUsageBudgetSchema.parse(record));
      return this.createResponse(validated);
    } catch (error) {
      return this.handleError(error, 'Failed to get usage budgets');
    }
  }

  /**
   * Create or update usage budget
   */
  async setUsageBudget(data: Omit<AIUsageBudget, 'id' | 'created_at' | 'updated_at'>): Promise<ServiceResponse<AIUsageBudget>> {
    try {
      this.logger.info('Setting usage budget', { 
        org_id: data.org_id, 
        provider: data.provider, 
        budget_type: data.budget_type,
        budget_amount_usd: data.budget_amount_usd 
      });

      // Check if budget already exists
      const { data: existing } = await this.supabase
        .from(this.config.budgetsTable)
        .select('id')
        .eq('org_id', data.org_id)
        .eq('provider', data.provider)
        .eq('budget_type', data.budget_type)
        .eq('reset_date', data.reset_date)
        .single();

      let result;
      if (existing) {
        // Update existing budget
        const { data: updated, error } = await this.supabase
          .from(this.config.budgetsTable)
          .update({
            budget_amount_usd: data.budget_amount_usd,
            current_spend_usd: data.current_spend_usd,
            is_active: data.is_active,
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) {
          return this.handleError(error, 'Failed to update usage budget');
        }
        result = updated;
      } else {
        // Create new budget
        const { data: created, error } = await this.supabase
          .from(this.config.budgetsTable)
          .insert(data)
          .select()
          .single();

        if (error) {
          return this.handleError(error, 'Failed to create usage budget');
        }
        result = created;
      }

      const validated = AIUsageBudgetSchema.parse(result);
      return this.createResponse(validated);
    } catch (error) {
      return this.handleError(error, 'Failed to set usage budget');
    }
  }

  /**
   * Get cost projections
   */
  async getCostProjections(days: number = 30): Promise<ServiceResponse<{
    projected_cost_usd: number;
    current_daily_average: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    by_provider: Record<string, { projected_cost: number; current_daily_avg: number }>;
  }>> {
    try {
      this.logger.info('Getting cost projections', { days });

      // Get recent usage data
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await this.supabase
        .from(this.config.usageTable)
        .select('provider, cost_usd, created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (error) {
        return this.handleError(error, 'Failed to get cost projections');
      }

      if (!data || data.length === 0) {
        return this.createResponse({
          projected_cost_usd: 0,
          current_daily_average: 0,
          trend: 'stable',
          by_provider: {},
        });
      }

      // Calculate daily averages by provider
      const byProvider: Record<string, { total_cost: number; days: number }> = {};
      data.forEach(record => {
        if (!byProvider[record.provider]) {
          byProvider[record.provider] = { total_cost: 0, days: 0 };
        }
        byProvider[record.provider].total_cost += record.cost_usd || 0;
        byProvider[record.provider].days = Math.max(byProvider[record.provider].days, 1);
      });

      // Calculate projections
      const totalCost = data.reduce((sum, r) => sum + (r.cost_usd || 0), 0);
      const currentDailyAverage = totalCost / days;
      const projectedCost = currentDailyAverage * 30; // 30-day projection

      // Determine trend (simplified - could be enhanced with more sophisticated analysis)
      const trend: 'increasing' | 'decreasing' | 'stable' = 'stable';

      const byProviderProjections: Record<string, { projected_cost: number; current_daily_avg: number }> = {};
      Object.keys(byProvider).forEach(provider => {
        const providerData = byProvider[provider];
        const dailyAvg = providerData.total_cost / providerData.days;
        byProviderProjections[provider] = {
          projected_cost: dailyAvg * 30,
          current_daily_avg: dailyAvg,
        };
      });

      return this.createResponse({
        projected_cost_usd: projectedCost,
        current_daily_average: currentDailyAverage,
        trend,
        by_provider: byProviderProjections,
      });
    } catch (error) {
      return this.handleError(error, 'Failed to get cost projections');
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private async updateModelPerformance(usageData: AIProviderUsage): Promise<void> {
    try {
      const { data: existing } = await this.supabase
        .from('ai_model_performance')
        .select('*')
        .eq('provider', usageData.provider)
        .eq('model', usageData.model)
        .eq('task_type', usageData.task_type)
        .single();

      const updates = {
        total_requests: (existing?.total_requests || 0) + 1,
        successful_requests: (existing?.successful_requests || 0) + (usageData.success ? 1 : 0),
        failed_requests: (existing?.failed_requests || 0) + (usageData.success ? 0 : 1),
        total_tokens: (existing?.total_tokens || 0) + usageData.total_tokens,
        total_cost_usd: (existing?.total_cost_usd || 0) + usageData.cost_usd,
        last_used: new Date().toISOString(),
      };

      if (existing?.avg_response_time_ms && usageData.response_time_ms) {
        const totalTime = (existing.avg_response_time_ms * existing.total_requests) + usageData.response_time_ms;
        updates.avg_response_time_ms = totalTime / (existing.total_requests + 1);
      } else if (usageData.response_time_ms) {
        updates.avg_response_time_ms = usageData.response_time_ms;
      }

      if (existing) {
        await this.supabase
          .from('ai_model_performance')
          .update(updates)
          .eq('id', existing.id);
      } else {
        await this.supabase
          .from('ai_model_performance')
          .insert({
            provider: usageData.provider,
            model: usageData.model,
            task_type: usageData.task_type,
            ...updates,
          });
      }
    } catch (error) {
      this.logger.error('Failed to update model performance', error);
    }
  }

  private async checkUsageAlerts(usageData: AIProviderUsage): Promise<void> {
    try {
      // Check for high usage alerts
      const today = new Date().toISOString().split('T')[0];
      const { data: todayUsage } = await this.supabase
        .from(this.config.usageTable)
        .select('cost_usd')
        .eq('provider', usageData.provider)
        .gte('created_at', today);

      if (todayUsage) {
        const todayCost = todayUsage.reduce((sum, r) => sum + (r.cost_usd || 0), 0);
        
        // Alert if daily cost exceeds $10
        if (todayCost > 10) {
          await this.createAlert({
            alert_type: 'high_usage',
            provider: usageData.provider as 'openai' | 'openrouter',
            severity: todayCost > 50 ? 'critical' : todayCost > 25 ? 'high' : 'medium',
            title: `High Daily Usage Alert - ${usageData.provider}`,
            message: `Daily usage for ${usageData.provider} has reached $${todayCost.toFixed(2)}`,
            threshold_value: 10,
            current_value: todayCost,
            is_active: true,
          });
        }
      }

      // Check for error rate alerts
      const recentRequests = await this.supabase
        .from(this.config.usageTable)
        .select('success')
        .eq('provider', usageData.provider)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .limit(100);

      if (recentRequests.data && recentRequests.data.length >= 10) {
        const failedRequests = recentRequests.data.filter(r => !r.success).length;
        const errorRate = (failedRequests / recentRequests.data.length) * 100;

        if (errorRate > 10) {
          await this.createAlert({
            alert_type: 'error_rate',
            provider: usageData.provider as 'openai' | 'openrouter',
            severity: errorRate > 25 ? 'critical' : 'high',
            title: `High Error Rate Alert - ${usageData.provider}`,
            message: `Error rate for ${usageData.provider} is ${errorRate.toFixed(1)}%`,
            threshold_value: 10,
            current_value: errorRate,
            is_active: true,
          });
        }
      }
    } catch (error) {
      this.logger.error('Failed to check usage alerts', error);
    }
  }

  private calculateDailyUsage(data: any[]): Array<{ date: string; requests: number; cost_usd: number; tokens: number }> {
    const dailyMap = new Map<string, { requests: number; cost_usd: number; tokens: number }>();

    data.forEach(record => {
      const date = record.created_at.split('T')[0];
      if (!dailyMap.has(date)) {
        dailyMap.set(date, { requests: 0, cost_usd: 0, tokens: 0 });
      }
      const daily = dailyMap.get(date)!;
      daily.requests++;
      daily.cost_usd += record.cost_usd || 0;
      daily.tokens += record.total_tokens || 0;
    });

    return Array.from(dailyMap.entries())
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }
}

// ============================================================================
// SERVICE INSTANCE
// ============================================================================

export const aiUsageMonitoringService = new AIUsageMonitoringService();
