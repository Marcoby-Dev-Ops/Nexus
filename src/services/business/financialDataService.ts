import { z } from 'zod';
import { BaseService } from '@/core/services/BaseService';
import type { ServiceResponse } from '@/core/services/BaseService';
import { selectData as select, selectOne, insertOne, updateOne, deleteOne, callEdgeFunction } from '@/lib/api-client';
import { logger } from '@/shared/utils/logger';

// Financial Data Schema
export const FinancialDataSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  company_id: z.string().uuid().optional(),
  integration_type: z.enum(['quickbooks', 'paypal', 'stripe']),
  data_type: z.enum(['revenue', 'expense', 'transaction', 'invoice', 'payment']),
  amount: z.number(),
  currency: z.string().length(3).default('USD'),
  category: z.string().optional(),
  description: z.string().optional(),
  date: z.string(),
  external_id: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type FinancialData = z.infer<typeof FinancialDataSchema>;

// Financial Metrics Schema
export const FinancialMetricsSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  company_id: z.string().uuid().optional(),
  date: z.string(),
  month: z.string(),
  year: z.string(),
  revenue: z.number().default(0),
  expenses: z.number().default(0),
  profit: z.number().default(0),
  profit_margin: z.number().default(0),
  cash_flow: z.number().default(0),
  accounts_receivable: z.number().default(0),
  accounts_payable: z.number().default(0),
  total_assets: z.number().default(0),
  total_liabilities: z.number().default(0),
  net_worth: z.number().default(0),
  burn_rate: z.number().default(0),
  runway_months: z.number().default(0),
  customer_acquisition_cost: z.number().default(0),
  lifetime_value: z.number().default(0),
  churn_rate: z.number().default(0),
  created_at: z.string(),
  updated_at: z.string(),
});

export type FinancialMetrics = z.infer<typeof FinancialMetricsSchema>;

// Integration Status Schema
export const FinancialIntegrationStatusSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  integration_type: z.enum(['quickbooks', 'paypal', 'stripe']),
  status: z.enum(['connected', 'disconnected', 'error', 'syncing']),
  last_sync_at: z.string().optional(),
  sync_frequency: z.string().default('daily'),
  data_freshness_hours: z.number().default(24),
  error_message: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type FinancialIntegrationStatus = z.infer<typeof FinancialIntegrationStatusSchema>;

// Financial Health Score Schema
export const FinancialHealthScoreSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  company_id: z.string().uuid().optional(),
  overall_score: z.number().min(0).max(100),
  revenue_score: z.number().min(0).max(100),
  profitability_score: z.number().min(0).max(100),
  cash_flow_score: z.number().min(0).max(100),
  efficiency_score: z.number().min(0).max(100),
  growth_score: z.number().min(0).max(100),
  risk_score: z.number().min(0).max(100),
  recommendations: z.array(z.string()).default([]),
  insights: z.array(z.string()).default([]),
  calculated_at: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type FinancialHealthScore = z.infer<typeof FinancialHealthScoreSchema>;

// Service Configuration
const financialDataServiceConfig = {
  tableName: 'financial_data',
  schema: FinancialDataSchema,
  cacheEnabled: true,
  cacheTTL: 300, // 5 minutes
  enableLogging: true,
};

/**
 * FinancialDataService - Handles all financial data integration and analysis
 *
 * Features:
 * - Unified financial data from QuickBooks, PayPal, and Stripe
 * - Real-time financial metrics calculation
 * - Financial health scoring and insights
 * - Integration status monitoring
 * - Automated data synchronization
 * - Financial reporting and analytics
 */
export class FinancialDataService extends BaseService {
  protected config = financialDataServiceConfig;

  constructor() {
    super();
  }

  // ====================================================================
  // FINANCIAL DATA MANAGEMENT
  // ====================================================================

  /**
   * Store financial data from integrations
   */
  async storeFinancialData(data: Omit<FinancialData, 'id' | 'created_at' | 'updated_at'>): Promise<ServiceResponse<FinancialData>> {
    this.logMethodCall('storeFinancialData', { integration_type: data.integration_type, data_type: data.data_type });
    
    try {
      const { data: result, error } = await supabase
        .from('financial_data')
        .insert({
          ...data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        logger.error({ error, data }, 'Failed to store financial data');
        return this.handleError(error);
      }

      return this.createResponse(result);
    } catch (error) {
      logger.error({ error, data }, 'Error storing financial data');
      return this.handleError(error);
    }
  }

  /**
   * Get financial data for a user
   */
  async getFinancialData(userId: string, filters?: {
    integration_type?: 'quickbooks' | 'paypal' | 'stripe';
    data_type?: 'revenue' | 'expense' | 'transaction' | 'invoice' | 'payment';
    start_date?: string;
    end_date?: string;
    limit?: number;
  }): Promise<ServiceResponse<FinancialData[]>> {
    this.logMethodCall('getFinancialData', { userId, filters });
    
    try {
      let query = supabase
        .from('financial_data')
        .select('*')
        .eq('user_id', userId);

      if (filters?.integration_type) {
        query = query.eq('integration_type', filters.integration_type);
      }

      if (filters?.data_type) {
        query = query.eq('data_type', filters.data_type);
      }

      if (filters?.start_date) {
        query = query.gte('date', filters.start_date);
      }

      if (filters?.end_date) {
        query = query.lte('date', filters.end_date);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      query = query.order('date', { ascending: false });

      const { data, error } = await query;

      if (error) {
        logger.error({ error, userId, filters }, 'Failed to get financial data');
        return this.handleError(error);
      }

      return this.createResponse(data || []);
    } catch (error) {
      logger.error({ error, userId, filters }, 'Error getting financial data');
      return this.handleError(error);
    }
  }

  // ====================================================================
  // FINANCIAL METRICS CALCULATION
  // ====================================================================

  /**
   * Calculate and store financial metrics for a period
   */
  async calculateFinancialMetrics(userId: string, date: string): Promise<ServiceResponse<FinancialMetrics>> {
    this.logMethodCall('calculateFinancialMetrics', { userId, date });
    
    try {
      const month = date.substring(0, 7); // YYYY-MM
      const year = date.substring(0, 4); // YYYY

      // Get financial data for the month
      const startDate = `${month}-01`;
      const endDate = `${month}-31`;

      const { data: financialData, error: dataError } = await supabase
        .from('financial_data')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate);

      if (dataError) {
        logger.error({ error: dataError, userId, date }, 'Failed to get financial data for metrics');
        return this.handleError(dataError);
      }

      // Calculate metrics
      const metrics = this.calculateMetricsFromData(financialData || [], month, year);

      // Store or update metrics
      const { data: result, error: upsertError } = await supabase
        .from('financial_metrics')
        .upsert({
          user_id: userId,
          date,
          month,
          year,
          ...metrics,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,date'
        })
        .select()
        .single();

      if (upsertError) {
        logger.error({ error: upsertError, userId, date }, 'Failed to store financial metrics');
        return this.handleError(upsertError);
      }

      return this.createResponse(result);
    } catch (error) {
      logger.error({ error, userId, date }, 'Error calculating financial metrics');
      return this.handleError(error);
    }
  }

  /**
   * Get financial metrics for a user
   */
  async getFinancialMetrics(userId: string, period: 'month' | 'quarter' | 'year' = 'month'): Promise<ServiceResponse<FinancialMetrics[]>> {
    this.logMethodCall('getFinancialMetrics', { userId, period });
    
    try {
      let query = supabase
        .from('financial_metrics')
        .select('*')
        .eq('user_id', userId);

      // Filter by period
      const now = new Date();
      let startDate: string;

      switch (period) {
        case 'month':
          startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
          break;
        case 'quarter':
          const quarter = Math.floor(now.getMonth() / 3);
          const quarterStartMonth = quarter * 3 + 1;
          startDate = `${now.getFullYear()}-${String(quarterStartMonth).padStart(2, '0')}-01`;
          break;
        case 'year':
          startDate = `${now.getFullYear()}-01-01`;
          break;
      }

      query = query.gte('date', startDate).order('date', { ascending: false });

      const { data, error } = await query;

      if (error) {
        logger.error({ error, userId, period }, 'Failed to get financial metrics');
        return this.handleError(error);
      }

      return this.createResponse(data || []);
    } catch (error) {
      logger.error({ error, userId, period }, 'Error getting financial metrics');
      return this.handleError(error);
    }
  }

  // ====================================================================
  // FINANCIAL HEALTH SCORING
  // ====================================================================

  /**
   * Calculate financial health score
   */
  async calculateFinancialHealthScore(userId: string): Promise<ServiceResponse<FinancialHealthScore>> {
    this.logMethodCall('calculateFinancialHealthScore', { userId });
    
    try {
      // Get recent financial metrics
      const { data: metrics, error: metricsError } = await this.getFinancialMetrics(userId, 'month');
      
      if (metricsError || !metrics.success || !metrics.data?.length) {
        logger.warn({ userId }, 'No financial metrics found for health score calculation');
        return this.createResponse({
          id: '',
          user_id: userId,
          overall_score: 0,
          revenue_score: 0,
          profitability_score: 0,
          cash_flow_score: 0,
          efficiency_score: 0,
          growth_score: 0,
          risk_score: 0,
          recommendations: ['Connect financial integrations to get accurate health scores'],
          insights: ['No financial data available'],
          calculated_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      const latestMetrics = metrics.data[0];
      const scores = this.calculateHealthScores(latestMetrics);
      const recommendations = this.generateRecommendations(latestMetrics);
      const insights = this.generateInsights(latestMetrics);

      const healthScore: Omit<FinancialHealthScore, 'id' | 'created_at' | 'updated_at'> = {
        user_id: userId,
        calculated_at: new Date().toISOString(),
        ...scores,
        recommendations,
        insights,
      };

      // Store health score
      const { data: result, error: upsertError } = await supabase
        .from('financial_health_scores')
        .upsert({
          ...healthScore,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (upsertError) {
        logger.error({ error: upsertError, userId }, 'Failed to store financial health score');
        return this.handleError(upsertError);
      }

      return this.createResponse(result);
    } catch (error) {
      logger.error({ error, userId }, 'Error calculating financial health score');
      return this.handleError(error);
    }
  }

  /**
   * Get financial health score
   */
  async getFinancialHealthScore(userId: string): Promise<ServiceResponse<FinancialHealthScore | null>> {
    this.logMethodCall('getFinancialHealthScore', { userId });
    
    try {
      const { data, error } = await supabase
        .from('financial_health_scores')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        logger.error({ error, userId }, 'Failed to get financial health score');
        return this.handleError(error);
      }

      return this.createResponse(data);
    } catch (error) {
      logger.error({ error, userId }, 'Error getting financial health score');
      return this.handleError(error);
    }
  }

  // ====================================================================
  // INTEGRATION STATUS MANAGEMENT
  // ====================================================================

  /**
   * Update integration status
   */
  async updateIntegrationStatus(userId: string, integrationType: 'quickbooks' | 'paypal' | 'stripe', status: {
    status: 'connected' | 'disconnected' | 'error' | 'syncing';
    last_sync_at?: string;
    error_message?: string;
    metadata?: Record<string, any>;
  }): Promise<ServiceResponse<FinancialIntegrationStatus>> {
    this.logMethodCall('updateIntegrationStatus', { userId, integrationType, status });
    
    try {
      const { data, error } = await supabase
        .from('financial_integration_status')
        .upsert({
          user_id: userId,
          integration_type: integrationType,
          ...status,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,integration_type'
        })
        .select()
        .single();

      if (error) {
        logger.error({ error, userId, integrationType, status }, 'Failed to update integration status');
        return this.handleError(error);
      }

      return this.createResponse(data);
    } catch (error) {
      logger.error({ error, userId, integrationType, status }, 'Error updating integration status');
      return this.handleError(error);
    }
  }

  /**
   * Get integration status for all financial integrations
   */
  async getIntegrationStatus(userId: string): Promise<ServiceResponse<FinancialIntegrationStatus[]>> {
    this.logMethodCall('getIntegrationStatus', { userId });
    
    try {
      const { data, error } = await supabase
        .from('financial_integration_status')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        logger.error({ error, userId }, 'Failed to get integration status');
        return this.handleError(error);
      }

      return this.createResponse(data || []);
    } catch (error) {
      logger.error({ error, userId }, 'Error getting integration status');
      return this.handleError(error);
    }
  }

  // ====================================================================
  // PRIVATE HELPER METHODS
  // ====================================================================

  private calculateMetricsFromData(financialData: FinancialData[], month: string, year: string): Partial<FinancialMetrics> {
    const revenue = financialData
      .filter(d => d.data_type === 'revenue')
      .reduce((sum, d) => sum + d.amount, 0);

    const expenses = financialData
      .filter(d => d.data_type === 'expense')
      .reduce((sum, d) => sum + d.amount, 0);

    const profit = revenue - expenses;
    const profit_margin = revenue > 0 ? (profit / revenue) * 100 : 0;

    // Calculate cash flow (simplified)
    const cash_flow = revenue - expenses;

    // Calculate other metrics (simplified for now)
    const accounts_receivable = financialData
      .filter(d => d.data_type === 'invoice' && d.amount > 0)
      .reduce((sum, d) => sum + d.amount, 0);

    const accounts_payable = financialData
      .filter(d => d.data_type === 'expense' && d.amount > 0)
      .reduce((sum, d) => sum + d.amount, 0);

    return {
      revenue,
      expenses,
      profit,
      profit_margin,
      cash_flow,
      accounts_receivable,
      accounts_payable,
      total_assets: revenue * 2, // Simplified
      total_liabilities: expenses * 0.5, // Simplified
      net_worth: revenue * 2 - expenses * 0.5,
      burn_rate: expenses / 30, // Daily burn rate
      runway_months: revenue > expenses ? 12 : 0, // Simplified
      customer_acquisition_cost: expenses * 0.1, // Simplified
      lifetime_value: revenue * 0.3, // Simplified
      churn_rate: 0, // Would need customer data
    };
  }

  private calculateHealthScores(metrics: FinancialMetrics): {
    overall_score: number;
    revenue_score: number;
    profitability_score: number;
    cash_flow_score: number;
    efficiency_score: number;
    growth_score: number;
    risk_score: number;
  } {
    // Revenue Score (0-100)
    const revenue_score = Math.min(100, Math.max(0, (metrics.revenue / 10000) * 100));

    // Profitability Score (0-100)
    const profitability_score = Math.min(100, Math.max(0, metrics.profit_margin));

    // Cash Flow Score (0-100)
    const cash_flow_score = metrics.cash_flow > 0 ? 100 : Math.max(0, 100 + (metrics.cash_flow / 1000) * 100);

    // Efficiency Score (0-100) - based on profit margin and asset utilization
    const efficiency_score = Math.min(100, (profitability_score + (metrics.revenue / metrics.total_assets) * 100) / 2);

    // Growth Score (0-100) - simplified
    const growth_score = metrics.revenue > 0 ? 75 : 25;

    // Risk Score (0-100) - lower is better
    const risk_score = Math.max(0, 100 - (metrics.profit_margin + (metrics.cash_flow > 0 ? 50 : 0)));

    // Overall Score (weighted average)
    const overall_score = Math.round(
      (revenue_score * 0.2 +
       profitability_score * 0.25 +
       cash_flow_score * 0.25 +
       efficiency_score * 0.15 +
       growth_score * 0.1 +
       (100 - risk_score) * 0.05)
    );

    return {
      overall_score,
      revenue_score,
      profitability_score,
      cash_flow_score,
      efficiency_score,
      growth_score,
      risk_score,
    };
  }

  private generateRecommendations(metrics: FinancialMetrics): string[] {
    const recommendations: string[] = [];

    if (metrics.profit_margin < 20) {
      recommendations.push('Focus on improving profit margins through cost optimization');
    }

    if (metrics.cash_flow < 0) {
      recommendations.push('Implement cash flow management strategies');
    }

    if (metrics.revenue < 5000) {
      recommendations.push('Develop revenue growth strategies');
    }

    if (metrics.burn_rate > metrics.revenue / 30) {
      recommendations.push('Reduce operational costs to extend runway');
    }

    if (recommendations.length === 0) {
      recommendations.push('Maintain current financial performance');
    }

    return recommendations;
  }

  private generateInsights(metrics: FinancialMetrics): string[] {
    const insights: string[] = [];

    if (metrics.profit_margin > 30) {
      insights.push('Strong profitability indicates healthy business model');
    }

    if (metrics.cash_flow > 0) {
      insights.push('Positive cash flow shows sustainable operations');
    }

    if (metrics.revenue > 10000) {
      insights.push('Revenue above $10K indicates established market presence');
    }

    return insights;
  }
}

// Export singleton instance
export const financialDataService = new FinancialDataService();
