import { z } from 'zod';
import { BaseService } from '@/core/services/BaseService';
import type { ServiceResponse } from '@/core/services/BaseService';
import type { CrudServiceInterface, ServiceConfig } from '@/core/services/interfaces';
import { selectData as select, selectOne, insertOne, updateOne, deleteOne, callEdgeFunction } from '@/lib/api-client';
import { logger } from '@/shared/utils/logger';
import { userLicensesService } from '@/core/services/UserLicensesService';
import { chatUsageTrackingService } from '@/core/services/ChatUsageTrackingService';

// ====================================================================
// BILLING SCHEMAS
// ====================================================================

// Billing Plan Schema
export const BillingPlanSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  price: z.number().positive(),
  currency: z.string().length(3).default('USD'),
  interval: z.enum(['monthly', 'yearly', 'one-time']),
  features: z.array(z.string()).optional(),
  is_active: z.boolean().default(true),
  max_users: z.number().positive().optional(),
  max_storage_gb: z.number().positive().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type BillingPlan = z.infer<typeof BillingPlanSchema>;

// Subscription Schema
export const SubscriptionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  company_id: z.string().uuid(),
  plan_id: z.string().uuid(),
  status: z.enum(['active', 'canceled', 'past_due', 'unpaid', 'trialing']),
  current_period_start: z.string(),
  current_period_end: z.string(),
  cancel_at_period_end: z.boolean().default(false),
  canceled_at: z.string().optional(),
  trial_start: z.string().optional(),
  trial_end: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Subscription = z.infer<typeof SubscriptionSchema>;

// Invoice Schema
export const InvoiceSchema = z.object({
  id: z.string().uuid(),
  subscription_id: z.string().uuid(),
  user_id: z.string().uuid(),
  company_id: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().length(3).default('USD'),
  status: z.enum(['draft', 'open', 'paid', 'uncollectible', 'void']),
  billing_reason: z.enum(['subscription_cycle', 'subscription_update', 'manual', 'upcoming']),
  hosted_invoice_url: z.string().url().optional(),
  invoice_pdf: z.string().url().optional(),
  due_date: z.string().optional(),
  paid_at: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Invoice = z.infer<typeof InvoiceSchema>;

// Payment Method Schema
export const PaymentMethodSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  company_id: z.string().uuid(),
  type: z.enum(['card', 'bank_account', 'paypal']),
  brand: z.string().optional(),
  last4: z.string().length(4).optional(),
  exp_month: z.number().min(1).max(12).optional(),
  exp_year: z.number().min(2020).optional(),
  is_default: z.boolean().default(false),
  is_active: z.boolean().default(true),
  created_at: z.string(),
  updated_at: z.string(),
});

export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;

// Billing Usage Schema
export const BillingUsageSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  company_id: z.string().uuid(),
  subscription_id: z.string().uuid(),
  metric: z.string(),
  quantity: z.number().nonnegative(),
  period_start: z.string(),
  period_end: z.string(),
  created_at: z.string(),
});

export type BillingUsage = z.infer<typeof BillingUsageSchema>;

// Billing Status Schema
export const BillingStatusSchema = z.object({
  currentPlan: z.enum(['free', 'pro', 'enterprise']),
  status: z.enum(['active', 'canceled', 'past_due', 'unpaid', 'trialing']),
  currentPeriodStart: z.string(),
  currentPeriodEnd: z.string(),
  cancelAtPeriodEnd: z.boolean(),
  trialEnd: z.string().optional(),
  nextBillingDate: z.string().optional(),
  amount: z.number(),
  currency: z.string(),
  paymentMethod: PaymentMethodSchema.optional(),
  invoices: z.array(InvoiceSchema),
  usage: BillingUsageSchema.optional(),
});

export type BillingStatus = z.infer<typeof BillingStatusSchema>;

// Chat Quotas Schema
export const ChatQuotasSchema = z.object({
  currentQuotas: z.object({
    daily: z.number(),
    monthly: z.number(),
    total: z.number(),
  }),
  todayUsage: z.object({
    messages_sent: z.number(),
    messages_received: z.number(),
    total_messages: z.number(),
  }),
  monthlyUsage: z.object({
    messages_sent: z.number(),
    messages_received: z.number(),
    total_messages: z.number(),
  }),
});

export type ChatQuotas = z.infer<typeof ChatQuotasSchema>;

// Usage Tracking Schema
export const UsageTrackingSchema = z.object({
  messages_sent: z.number(),
  messages_received: z.number(),
  total_messages: z.number(),
  date: z.string(),
});

export type UsageTracking = z.infer<typeof UsageTrackingSchema>;

// Usage Billing Schema
export const UsageBillingSchema = z.object({
  totalMessages: z.number(),
  tier: z.string(),
  monthlyLimit: z.number(),
  overageMessages: z.number(),
  overageCost: z.number(),
  period: z.string(),
});

export type UsageBilling = z.infer<typeof UsageBillingSchema>;

// ====================================================================
// FINANCIAL DATA SCHEMAS
// ====================================================================

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

// ====================================================================
// SERVICE CONFIGURATION
// ====================================================================

const financialServiceConfig: ServiceConfig = {
  tableName: 'financial_data', // Default table, will be overridden per operation
  schema: FinancialDataSchema,
  cacheEnabled: true,
  cacheTTL: 300, // 5 minutes
  enableLogging: true,
};

/**
 * Consolidated FinancialService - Handles billing, financial data, and financial analytics
 *
 * Features:
 * - Billing plan management (CRUD operations)
 * - Subscription management
 * - Invoice handling
 * - Payment method management
 * - Usage tracking and billing
 * - Financial data integration and analysis
 * - Real-time financial metrics calculation
 * - Financial health scoring and insights
 * - Integration status monitoring
 * - Automated data synchronization
 * - Financial reporting and analytics
 * - Stripe integration
 * - Customer portal
 */
export class FinancialService extends BaseService implements CrudServiceInterface<FinancialData> {
  protected config = financialServiceConfig;

  private stripeConfig = {
    stripePublishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
    webhookSecret: import.meta.env.VITE_STRIPE_WEBHOOK_SECRET || '',
    products: {
      free: 'prod_SSpWGQ9Asuv8JL',
      pro: 'prod_SSpWPE3A7NWmd9',
      enterprise: 'prod_SSpW2AOu6axxoY'
    },
    prices: {
      free: 'price_1RY7qtRsVFqVQ7BisNs7B2vJ',
      pro: 'price_1RcuKcRsVFqVQ7Bi562UMbw6',
      enterprise: 'price_1RY7qFRsVFqVQ7Bicy9ySWyJ'
    },
    paymentLinks: {
      pro: 'https://buy.stripe.com/7sY7sNeAy0XrbIFd9e9R605',
      enterprise: 'https://buy.stripe.com/14A3cxbomcG93c94CI9R606'
    }
  };

  constructor() {
    super();
  }

  // ====================================================================
  // CRUD OPERATIONS (Financial Data)
  // ====================================================================

  async get(id: string): Promise<ServiceResponse<FinancialData>> {
    this.logMethodCall('get', { id });
    return this.executeDbOperation(async () => {
      const { data, error } = await selectOne('financial_data', id);
      if (error) throw error;
      const validatedData = this.config.schema.parse(data);
      return { data: validatedData, error: null };
    }, `get ${this.config.tableName} ${id}`);
  }

  async create(data: Partial<FinancialData>): Promise<ServiceResponse<FinancialData>> {
    this.logMethodCall('create', { data });
    return this.executeDbOperation(async () => {
      const { data: result, error } = await insertOne('financial_data', {
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      if (error) throw error;
      const validatedData = this.config.schema.parse(result);
      return { data: validatedData, error: null };
    }, `create ${this.config.tableName}`);
  }

  async update(id: string, data: Partial<FinancialData>): Promise<ServiceResponse<FinancialData>> {
    this.logMethodCall('update', { id, data });
    return this.executeDbOperation(async () => {
      const { data: result, error } = await updateOne('financial_data', id, {
        ...data,
        updated_at: new Date().toISOString()
      });
      if (error) throw error;
      const validatedData = this.config.schema.parse(result);
      return { data: validatedData, error: null };
    }, `update ${this.config.tableName} ${id}`);
  }

  async delete(id: string): Promise<ServiceResponse<boolean>> {
    this.logMethodCall('delete', { id });
    return this.executeDbOperation(async () => {
      const { error } = await deleteOne('financial_data', id);
      if (error) throw error;
      return { data: true, error: null };
    }, `delete ${this.config.tableName} ${id}`);
  }

  async list(filters?: Record<string, any>): Promise<ServiceResponse<FinancialData[]>> {
    this.logMethodCall('list', { filters });
    return this.executeDbOperation(async () => {
      const { data, error } = await selectData('financial_data', {
        filters: filters || undefined
      });
      if (error) throw error;
      const validatedData = data.map((item: any) => this.config.schema.parse(item));
      return { data: validatedData, error: null };
    }, `list ${this.config.tableName}`);
  }

  // ====================================================================
  // FINANCIAL DATA OPERATIONS
  // ====================================================================

  /**
   * Store financial data from integrations
   */
  async storeFinancialData(data: Omit<FinancialData, 'id' | 'created_at' | 'updated_at'>): Promise<ServiceResponse<FinancialData>> {
    this.logMethodCall('storeFinancialData', { data });
    
    try {
      const result = await this.create(data);
      
      if (result.error) {
        logger.error({ error: result.error, data }, 'Failed to store financial data');
        return this.handleError(result.error);
      }

      // Trigger metrics calculation
      await this.calculateFinancialMetrics(data.user_id, data.date);
      
      return result;
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
      const columns = ['*'];
      const result = await select('financial_data', columns, {
        user_id: userId,
        ...(filters?.integration_type && { integration_type: filters.integration_type }),
        ...(filters?.data_type && { data_type: filters.data_type }),
        ...(filters?.start_date && { date_gte: filters.start_date }),
        ...(filters?.end_date && { date_lte: filters.end_date }),
        ...(filters?.limit && { limit: filters.limit }),
        order_by: 'date.desc'
      });

      if (!result.success) {
        logger.error({ error: result.error, userId, filters }, 'Failed to get financial data');
        return this.handleError(result.error);
      }

      return this.createResponse(result.data || []);
    } catch (error) {
      logger.error({ error, userId, filters }, 'Error getting financial data');
      return this.handleError(error);
    }
  }

  /**
   * Calculate and store financial metrics for a period
   */
  async calculateFinancialMetrics(userId: string, date: string): Promise<ServiceResponse<FinancialMetrics>> {
    this.logMethodCall('calculateFinancialMetrics', { userId, date });
    
    try {
      // Get financial data for the month
      const month = date.substring(0, 7); // YYYY-MM
      const year = date.substring(0, 4);
      
      const { data: financialData, error: dataError } = await this.getFinancialData(userId, {
        start_date: `${month}-01`,
        end_date: `${month}-31`
      });

      if (dataError) {
        logger.error({ error: dataError, userId, date }, 'Failed to get financial data for metrics calculation');
        return this.handleError(dataError);
      }

      // Calculate metrics
      const metrics = this.calculateMetricsFromData(financialData || [], month, year);
      
      // Store metrics
      const { data: result, error: storeError } = await insertOne('financial_metrics', {
        user_id: userId,
        date,
        month,
        year,
        ...metrics,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      if (storeError) {
        logger.error({ error: storeError, userId, date }, 'Failed to store financial metrics');
        return this.handleError(storeError);
      }

      return this.createResponse(FinancialMetricsSchema.parse(result));
    } catch (error) {
      logger.error({ error, userId, date }, 'Error calculating financial metrics');
      return this.handleError(error);
    }
  }

  /**
   * Get financial health score
   */
  async getFinancialHealthScore(userId: string): Promise<ServiceResponse<FinancialHealthScore>> {
    this.logMethodCall('getFinancialHealthScore', { userId });
    
    try {
      // Get latest metrics
      const { data: metrics, error: metricsError } = await selectData('financial_metrics', {
        filters: { user_id: userId },
        order_by: 'date.desc',
        limit: 1
      });

      if (metricsError) {
        logger.error({ error: metricsError, userId }, 'Failed to get financial metrics for health score');
        return this.handleError(metricsError);
      }

      const latestMetrics = metrics?.[0];
      if (!latestMetrics) {
        return this.createResponse(null);
      }

      // Calculate health score
      const healthScore = this.calculateHealthScore(latestMetrics);
      
      // Store health score
      const { data: result, error: storeError } = await insertOne('financial_health_scores', {
        user_id: userId,
        ...healthScore,
        calculated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      if (storeError) {
        logger.error({ error: storeError, userId }, 'Failed to store financial health score');
        return this.handleError(storeError);
      }

      return this.createResponse(FinancialHealthScoreSchema.parse(result));
    } catch (error) {
      logger.error({ error, userId }, 'Error getting financial health score');
      return this.handleError(error);
    }
  }

  // ====================================================================
  // BILLING OPERATIONS
  // ====================================================================

  /**
   * Get billing status for a user
   */
  async getBillingStatus(userId: string): Promise<BillingStatus> {
    this.logMethodCall('getBillingStatus', { userId });
    
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      // Get user's current plan from licenses service
      const { data: licenses, error: licensesError } = await userLicensesService.getUserLicenses(userId);
      
      if (licensesError) {
        logger.error({ userId, error: licensesError }, 'Failed to get user licenses');
        throw new Error(licensesError);
      }

      const currentPlan = licenses?.current_plan || 'free';
      
      // Mock billing status for now
      const billingStatus: BillingStatus = {
        currentPlan,
        status: 'active',
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancelAtPeriodEnd: false,
        amount: currentPlan === 'free' ? 0 : currentPlan === 'pro' ? 29 : 99,
        currency: 'USD',
        invoices: [],
        usage: undefined
      };

      return billingStatus;
    } catch (error) {
      logger.error({ error, userId }, 'Error getting billing status');
      throw error;
    }
  }

  /**
   * Get payment links for upgrades
   */
  getPaymentLinks() {
    return {
      pro: this.stripeConfig.paymentLinks.pro,
      enterprise: this.stripeConfig.paymentLinks.enterprise
    };
  }

  /**
   * Get usage billing for a user
   */
  async getUsageBilling(userId: string, period?: string): Promise<UsageBilling> {
    this.logMethodCall('getUsageBilling', { userId, period });
    
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      // Ensure period is in YYYY-MM format
      let startDate: string;
      if (period) {
        if (period === 'current') {
          startDate = new Date().toISOString().slice(0, 7);
        } else if (!/^\d{4}-\d{2}$/.test(period)) {
          throw new Error('Period must be in YYYY-MM format');
        } else {
          startDate = period;
        }
      } else {
        startDate = new Date().toISOString().slice(0, 7);
      }
      
      // Query usage data using service layer
      const usageResult = await chatUsageTrackingService.getUsageForPeriod(
        userId,
        `${startDate}-01`,
        this.getNextMonth(startDate)
      );

      if (!usageResult.success) {
        logger.error({ userId, period, error: usageResult.error }, 'Failed to fetch usage data');
        throw new Error(usageResult.error || 'Failed to fetch usage data');
      }

      const usage = usageResult.data || [];

      const totalMessages = usage?.reduce((sum, day) => sum + (day.messages_sent || 0), 0) || 0;
      
      // Get user's current plan to calculate overage
      const billingStatus = await this.getBillingStatus(userId);
      const tier = billingStatus.currentPlan;
      
      const limits = {
        free: 20,
        pro: 500,
        enterprise: 2000
      };

      const dailyLimit = limits[tier];
      const monthlyLimit = dailyLimit * 30;
      
      const overageMessages = Math.max(0, totalMessages - monthlyLimit);
      const overageCost = overageMessages * 0.01; // $0.01 per overage message

      logger.debug({ 
        userId, 
        period, 
        totalMessages, 
        tier, 
        monthlyLimit, 
        overageMessages, 
        overageCost 
      }, 'Calculated usage billing');

      return {
        totalMessages,
        tier,
        monthlyLimit,
        overageMessages,
        overageCost,
        period: startDate
      };
    } catch (error) {
      logger.error({ error, userId, period }, 'Error getting usage billing');
      throw error;
    }
  }

  /**
   * Create customer portal session
   */
  async createCustomerPortalSession(userId: string): Promise<{ portalUrl: string }> {
    this.logMethodCall('createCustomerPortalSession', { userId });
    
    try {
      // Mock implementation - in real app, this would call Stripe API
      const portalUrl = 'https://billing.stripe.com/session/test';
      
      return { portalUrl };
    } catch (error) {
      logger.error({ error, userId }, 'Error creating customer portal session');
      throw error;
    }
  }

  // ====================================================================
  // PRIVATE HELPER METHODS
  // ====================================================================

  /**
   * Calculate metrics from financial data
   */
  private calculateMetricsFromData(data: FinancialData[], month: string, year: string): Partial<FinancialMetrics> {
    const revenue = data
      .filter(item => item.data_type === 'revenue')
      .reduce((sum, item) => sum + item.amount, 0);
    
    const expenses = data
      .filter(item => item.data_type === 'expense')
      .reduce((sum, item) => sum + item.amount, 0);
    
    const profit = revenue - expenses;
    const profit_margin = revenue > 0 ? (profit / revenue) * 100 : 0;
    
    return {
      revenue,
      expenses,
      profit,
      profit_margin,
      cash_flow: profit, // Simplified for now
      accounts_receivable: 0,
      accounts_payable: 0,
      total_assets: 0,
      total_liabilities: 0,
      net_worth: 0,
      burn_rate: expenses / 30, // Daily burn rate
      runway_months: 0,
      customer_acquisition_cost: 0,
      lifetime_value: 0,
      churn_rate: 0
    };
  }

  /**
   * Calculate health score from metrics
   */
  private calculateHealthScore(metrics: any): Partial<FinancialHealthScore> {
    const revenue_score = Math.min(100, Math.max(0, (metrics.revenue / 10000) * 100));
    const profitability_score = Math.min(100, Math.max(0, metrics.profit_margin));
    const cash_flow_score = Math.min(100, Math.max(0, (metrics.cash_flow / 5000) * 100));
    const efficiency_score = 50; // Placeholder
    const growth_score = 50; // Placeholder
    const risk_score = Math.max(0, 100 - (metrics.burn_rate * 100));
    
    const overall_score = Math.round(
      (revenue_score + profitability_score + cash_flow_score + efficiency_score + growth_score + risk_score) / 6
    );

    const recommendations = this.generateRecommendations(metrics);
    const insights = this.generateInsights(metrics);

    return {
      overall_score,
      revenue_score,
      profitability_score,
      cash_flow_score,
      efficiency_score,
      growth_score,
      risk_score,
      recommendations,
      insights
    };
  }

  /**
   * Generate recommendations based on metrics
   */
  private generateRecommendations(metrics: any): string[] {
    const recommendations: string[] = [];
    
    if (metrics.profit_margin < 20) {
      recommendations.push('Focus on improving profit margins through cost optimization');
    }
    
    if (metrics.cash_flow < 0) {
      recommendations.push('Implement better cash flow management strategies');
    }
    
    if (metrics.burn_rate > 0.1) {
      recommendations.push('Reduce burn rate to extend runway');
    }
    
    return recommendations;
  }

  /**
   * Generate insights based on metrics
   */
  private generateInsights(metrics: any): string[] {
    const insights: string[] = [];
    
    if (metrics.revenue > 0) {
      insights.push(`Monthly revenue: $${metrics.revenue.toLocaleString()}`);
    }
    
    if (metrics.profit > 0) {
      insights.push(`Monthly profit: $${metrics.profit.toLocaleString()}`);
    }
    
    if (metrics.profit_margin > 0) {
      insights.push(`Profit margin: ${metrics.profit_margin.toFixed(1)}%`);
    }
    
    return insights;
  }

  /**
   * Get next month date
   */
  private getNextMonth(yearMonth: string): string {
    const [year, month] = yearMonth.split('-').map(Number);
    const nextMonth = new Date(year, month, 1);
    return nextMonth.toISOString().slice(0, 10);
  }
}

// Create and export service instance
export const financialService = new FinancialService();
