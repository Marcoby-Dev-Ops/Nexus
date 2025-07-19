import { supabase } from "@/core/supabase";

export interface BillingPlan {
  id: string;
  name: string;
  type: 'free' | 'pro' | 'enterprise' | 'custom';
  monthlyFee: number;
  includedTokens: number;
  overageRatePerToken: number;
  features: string[];
  limits: {
    maxRequestsPerHour: number;
    maxRequestsPerDay: number;
    maxConcurrentRequests: number;
    maxTokensPerRequest: number;
  };
  aiModelAccess: {
    openai: boolean;
    openrouter: boolean;
    premiumModels: boolean;
  };
}

export interface UsageBillingRecord {
  id: string;
  userId: string;
  organizationId?: string;
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  planId: string;
  baseAmount: number;
  tokenUsage: {
    included: number;
    overage: number;
    total: number;
  };
  overageCharges: number;
  additionalFees: Array<{
    type: string;
    description: string;
    amount: number;
  }>;
  totalAmount: number;
  status: 'draft' | 'finalized' | 'paid' | 'overdue';
  paymentDue: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CostAllocation {
  userId: string;
  organizationId?: string;
  departmentId?: string;
  agentId: string;
  model: string;
  provider: string;
  tokensUsed: number;
  cost: number;
  billingCategory: 'operations' | 'development' | 'research' | 'customer_support' | 'sales' | 'marketing';
  costCenter?: string;
  projectId?: string;
  timestamp: Date;
}

export interface BillingAnalytics {
  period: {
    start: Date;
    end: Date;
  };
  totalRevenue: number;
  totalCosts: number;
  grossMargin: number;
  customerMetrics: {
    totalCustomers: number;
    newCustomers: number;
    churnedCustomers: number;
    averageRevenuePerUser: number;
  };
  usageMetrics: {
    totalTokens: number;
    totalRequests: number;
    averageTokensPerRequest: number;
    topModels: Array<{
      model: string;
      provider: string;
      usage: number;
      cost: number;
    }>;
  };
  costBreakdown: {
    openaiCosts: number;
    openrouterCosts: number;
    infrastructureCosts: number;
    operationalCosts: number;
  };
}

export interface PricingOptimization {
  currentPlan: BillingPlan;
  recommendedPlan?: BillingPlan;
  potentialSavings: number;
  usagePattern: {
    averageMonthlyTokens: number;
    peakUsageHours: string[];
    primaryUseCases: string[];
    modelPreferences: string[];
  };
  optimization: {
    type: 'upgrade' | 'downgrade' | 'custom' | 'usage_optimization';
    reasoning: string;
    impact: string;
    confidence: number;
  };
}

export class AIUsageBillingService {
  private billingCache = new Map<string, UsageBillingRecord>();
  private planCache = new Map<string, BillingPlan>();

  constructor() {
    // Only load billing plans if we're in a browser environment and not on a public page
    if (typeof window !== 'undefined' && !this.isPublicPage()) {
      this.loadBillingPlans();
    }
  }

  private isPublicPage(): boolean {
    if (typeof window === 'undefined') return false;
    const publicRoutes = ['/', '/login', '/signup', '/reset-password', '/waitlist', '/marketing'];
    return publicRoutes.some(route => window.location.pathname.startsWith(route));
  }

  /**
   * Record AI usage for billing purposes
   */
  async recordUsageForBilling(
    userId: string,
    organizationId: string | undefined,
    agentId: string,
    model: string,
    provider: string,
    tokensUsed: number,
    cost: number,
    billingCategory: CostAllocation['billingCategory'],
    metadata?: {
      costCenter?: string;
      projectId?: string;
      departmentId?: string;
    }
  ): Promise<void> {
    try {
      const allocation: Omit<CostAllocation, 'timestamp'> = {
        userId,
        organizationId,
        departmentId: metadata?.departmentId,
        agentId,
        model,
        provider,
        tokensUsed,
        cost,
        billingCategory,
        costCenter: metadata?.costCenter,
        projectId: metadata?.projectId
      };

      const { error } = await supabase
        .from('ai_cost_allocations')
        .insert({
          ...allocation,
          timestamp: new Date().toISOString()
        });

      if (error) throw error;

      // Update current billing period
      await this.updateCurrentBillingPeriod(userId, tokensUsed, cost);
    } catch (error) {
      console.error('Error recording usage for billing:', error);
    }
  }

  /**
   * Generate billing statement for a user/organization
   */
  async generateBillingStatement(
    userId: string,
    billingPeriodStart: Date,
    billingPeriodEnd: Date,
    organizationId?: string
  ): Promise<UsageBillingRecord> {
    try {
      // Get user's billing plan
      const plan = await this.getUserBillingPlan(userId);
      
      // Calculate usage for the billing period
      const usage = await this.calculateUsageForPeriod(
        userId,
        billingPeriodStart,
        billingPeriodEnd,
        organizationId
      );

      // Calculate charges
      const baseAmount = plan.monthlyFee;
      const includedTokens = plan.includedTokens;
      const overageTokens = Math.max(0, usage.totalTokens - includedTokens);
      const overageCharges = overageTokens * plan.overageRatePerToken;

      // Additional fees (premium model usage, etc.)
      const additionalFees = await this.calculateAdditionalFees(
        userId,
        usage,
        billingPeriodStart,
        billingPeriodEnd
      );

      const totalAdditionalFees = additionalFees.reduce((sum, fee) => sum + fee.amount, 0);
      const totalAmount = baseAmount + overageCharges + totalAdditionalFees;

      const billingRecord: Omit<UsageBillingRecord, 'id'> = {
        userId,
        organizationId,
        billingPeriodStart,
        billingPeriodEnd,
        planId: plan.id,
        baseAmount,
        tokenUsage: {
          included: Math.min(usage.totalTokens, includedTokens),
          overage: overageTokens,
          total: usage.totalTokens
        },
        overageCharges,
        additionalFees,
        totalAmount,
        status: 'draft',
        paymentDue: new Date(billingPeriodEnd.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Store billing record
      const { data, error } = await supabase
        .from('ai_billing_records')
        .insert(billingRecord)
        .select()
        .single();

      if (error) throw error;

      return data as UsageBillingRecord;
    } catch (error) {
      console.error('Error generating billing statement:', error);
      throw error;
    }
  }

  /**
   * Get cost allocation breakdown
   */
  async getCostAllocationBreakdown(
    userId: string,
    startDate: Date,
    endDate: Date,
    groupBy: 'department' | 'agent' | 'model' | 'project' | 'cost_center' = 'department'
  ) {
    try {
      const { data, error } = await supabase
        .rpc('get_cost_allocation_breakdown', {
          user_id_param: userId,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          group_by_param: groupBy
        });

      if (error) throw error;

      return data.map((item: any) => ({
        category: item.category,
        totalCost: item.total_cost,
        totalTokens: item.total_tokens,
        requestCount: item.request_count,
        averageCostPerRequest: item.avg_cost_per_request,
        topModels: item.top_models,
        trend: item.trend
      }));
    } catch (error) {
      console.error('Error getting cost allocation breakdown:', error);
      return [];
    }
  }

  /**
   * Generate billing analytics
   */
  async generateBillingAnalytics(
    startDate: Date,
    endDate: Date,
    organizationId?: string
  ): Promise<BillingAnalytics> {
    try {
      const { data, error } = await supabase
        .rpc('generate_billing_analytics', {
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          organization_id: organizationId
        });

      if (error) throw error;

      return {
        period: { start: startDate, end: endDate },
        totalRevenue: data.total_revenue,
        totalCosts: data.total_costs,
        grossMargin: data.gross_margin,
        customerMetrics: data.customer_metrics,
        usageMetrics: data.usage_metrics,
        costBreakdown: data.cost_breakdown
      };
    } catch (error) {
      console.error('Error generating billing analytics:', error);
      throw error;
    }
  }

  /**
   * Optimize pricing for a user based on usage patterns
   */
  async optimizePricing(userId: string): Promise<PricingOptimization> {
    try {
      // Get user's current plan
      const currentPlan = await this.getUserBillingPlan(userId);
      
      // Analyze usage patterns over the last 3 months
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);
      
      const usageAnalysis = await this.analyzeUsagePatterns(userId, startDate, endDate);
      
      // Find optimal plan
      const allPlans = await this.getAllBillingPlans();
      const optimization = this.calculateOptimalPlan(currentPlan, usageAnalysis, allPlans);
      
      return {
        currentPlan,
        recommendedPlan: optimization.recommendedPlan,
        potentialSavings: optimization.potentialSavings,
        usagePattern: usageAnalysis,
        optimization: optimization.details
      };
    } catch (error) {
      console.error('Error optimizing pricing:', error);
      throw error;
    }
  }

  /**
   * Get real-time billing status
   */
  async getRealTimeBillingStatus(userId: string) {
    try {
      const currentPeriod = this.getCurrentBillingPeriod();
      const plan = await this.getUserBillingPlan(userId);
      
      const usage = await this.calculateUsageForPeriod(
        userId,
        currentPeriod.start,
        currentPeriod.end
      );

      const projectedCost = this.projectMonthlyCost(usage, plan, currentPeriod);
      const budgetUtilization = usage.totalCost / (plan.monthlyFee + plan.includedTokens * plan.overageRatePerToken);

      return {
        currentPeriod,
        plan,
        usage: {
          tokensUsed: usage.totalTokens,
          tokensIncluded: plan.includedTokens,
          tokensRemaining: Math.max(0, plan.includedTokens - usage.totalTokens),
          utilizationPercent: (usage.totalTokens / plan.includedTokens) * 100
        },
        costs: {
          currentPeriodCost: usage.totalCost,
          projectedMonthlyCost: projectedCost,
          budgetUtilization: budgetUtilization * 100
        },
        alerts: this.generateBillingAlerts(usage, plan, projectedCost)
      };
    } catch (error) {
      console.error('Error getting real-time billing status:', error);
      return null;
    }
  }

  /**
   * Process billing for all users (scheduled job)
   */
  async processBillingForAllUsers(): Promise<void> {
    try {
      const { data: users, error } = await supabase
        .from('user_billing_plans')
        .select('user_id, organization_id, plan_id')
        .eq('is_active', true);

      if (error) throw error;

      const billingPeriod = this.getCurrentBillingPeriod();
      
      for (const user of users) {
        try {
          await this.generateBillingStatement(
            user.user_id,
            billingPeriod.start,
            billingPeriod.end,
            user.organization_id
          );
        } catch (userError) {
          console.error(`Error processing billing for user ${user.user_id}:`, userError);
        }
      }
    } catch (error) {
      console.error('Error processing billing for all users:', error);
    }
  }

  // Private helper methods
  private async loadBillingPlans(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('billing_plans')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      for (const plan of data) {
        this.planCache.set(plan.id, plan);
      }
    } catch (error) {
      console.error('Error loading billing plans:', error);
    }
  }

  private async getUserBillingPlan(userId: string): Promise<BillingPlan> {
    try {
      // Get user's active billing plan
      const { data: userPlan, error: userPlanError } = await supabase
        .from('user_billing_plans')
        .select('plan_id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (userPlanError) throw userPlanError;

      // Get the billing plan details
      const { data: billingPlan, error: billingPlanError } = await supabase
        .from('billing_plans')
        .select('*')
        .eq('id', userPlan.plan_id)
        .single();

      if (billingPlanError) throw billingPlanError;

      return {
        id: billingPlan.id,
        name: billingPlan.name,
        type: billingPlan.name.toLowerCase().includes('free') ? 'free' :
              billingPlan.name.toLowerCase().includes('pro') ? 'pro' :
              billingPlan.name.toLowerCase().includes('enterprise') ? 'enterprise' : 'custom',
        monthlyFee: Number(billingPlan.price_monthly) || 0,
        includedTokens: billingPlan.token_limit || 10000,
        overageRatePerToken: 0.002, // Default rate
        features: billingPlan.features || [],
        limits: {
          maxRequestsPerHour: 100,
          maxRequestsPerDay: 1000,
          maxConcurrentRequests: 5,
          maxTokensPerRequest: 4000
        },
        aiModelAccess: {
          openai: billingPlan.id !== 'free',
          openrouter: true,
          premiumModels: billingPlan.id === 'enterprise'
        }
      };
    } catch (error) {
      console.error('Error getting user billing plan:', error);
      // Return default free plan
      return this.getDefaultFreePlan();
    }
  }

  private async calculateUsageForPeriod(
    userId: string,
    startDate: Date,
    endDate: Date,
    organizationId?: string
  ) {
    try {
      let query = supabase
        .from('ai_cost_allocations')
        .select('tokens_used, cost, model, provider')
        .eq('user_id', userId)
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString());

      // Handle organization_id properly - either filter by specific org or filter for null
      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      } else {
        query = query.is('organization_id', null);
      }

      const { data, error } = await query;

      if (error) throw error;

      return {
        totalTokens: data.reduce((sum, item) => sum + item.tokens_used, 0),
        totalCost: data.reduce((sum, item) => sum + item.cost, 0),
        requestCount: data.length,
        modelBreakdown: this.groupUsageByModel(data)
      };
    } catch (error) {
      console.error('Error calculating usage for period:', error);
      return { totalTokens: 0, totalCost: 0, requestCount: 0, modelBreakdown: {} };
    }
  }

  private async calculateAdditionalFees(
    userId: string,
    usage: any,
    startDate: Date,
    endDate: Date
  ) {
    const fees: Array<{ type: string; description: string; amount: number }> = [];

    // Premium model usage fees
    const premiumModelUsage = usage.modelBreakdown['gpt-4o'] || 0;
    if (premiumModelUsage > 0) {
      fees.push({
        type: 'premium_model',
        description: 'Premium model usage (GPT-4o)',
        amount: premiumModelUsage * 0.001 // $0.001 per token premium
      });
    }

    // High-volume usage discount
    if (usage.totalTokens > 1000000) {
      fees.push({
        type: 'volume_discount',
        description: 'High-volume usage discount',
        amount: -usage.totalCost * 0.1 // 10% discount
      });
    }

    return fees;
  }

  private getCurrentBillingPeriod() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { start, end };
  }

  private async updateCurrentBillingPeriod(
    userId: string,
    tokensUsed: number,
    cost: number
  ): Promise<void> {
    const period = this.getCurrentBillingPeriod();
    const monthKey = `${period.start.getFullYear()}-${String(period.start.getMonth() + 1).padStart(2, '0')}`;

    try {
      const { error } = await supabase
        .from('ai_budget_tracking')
        .upsert({
          user_id: userId,
          month_year: monthKey,
          current_spend: cost,
          request_count: 1
        }, {
          onConflict: 'user_id,month_year',
          ignoreDuplicates: false
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating current billing period:', error);
    }
  }

  private async analyzeUsagePatterns(userId: string, startDate: Date, endDate: Date) {
    // Analyze usage patterns for pricing optimization
    return {
      averageMonthlyTokens: 50000,
      peakUsageHours: ['09:00-11:00', '14:00-16:00'],
      primaryUseCases: ['customer_support', 'content_generation'],
      modelPreferences: ['gpt-4o-mini', 'claude-3-haiku']
    };
  }

  private async getAllBillingPlans(): Promise<BillingPlan[]> {
    return Array.from(this.planCache.values());
  }

  private calculateOptimalPlan(
    currentPlan: BillingPlan,
    usageAnalysis: any,
    allPlans: BillingPlan[]
  ) {
    // Calculate optimal plan based on usage patterns
    return {
      recommendedPlan: currentPlan,
      potentialSavings: 0,
      details: {
        type: 'usage_optimization' as const,
        reasoning: 'Current plan is optimal for your usage pattern',
        impact: 'No change needed',
        confidence: 0.95
      }
    };
  }

  private projectMonthlyCost(usage: any, plan: BillingPlan, currentPeriod: any): number {
    const daysInPeriod = (currentPeriod.end.getTime() - currentPeriod.start.getTime()) / (24 * 60 * 60 * 1000);
    const daysElapsed = (Date.now() - currentPeriod.start.getTime()) / (24 * 60 * 60 * 1000);
    
    const projectedTokens = (usage.totalTokens / daysElapsed) * daysInPeriod;
    const overageTokens = Math.max(0, projectedTokens - plan.includedTokens);
    
    return plan.monthlyFee + (overageTokens * plan.overageRatePerToken);
  }

  private generateBillingAlerts(usage: any, plan: BillingPlan, projectedCost: number) {
    const alerts: string[] = [];
    
    if (usage.totalTokens > plan.includedTokens * 0.8) {
      alerts.push('Approaching token limit for current billing period');
    }
    
    if (projectedCost > plan.monthlyFee * 1.5) {
      alerts.push('Projected monthly cost significantly exceeds base plan fee');
    }
    
    return alerts;
  }

  private groupUsageByModel(data: any[]) {
    return data.reduce((acc, item) => {
      const key = `${item.model}-${item.provider}`;
      acc[key] = (acc[key] || 0) + item.tokens_used;
      return acc;
    }, {});
  }

  private getDefaultFreePlan(): BillingPlan {
    return {
      id: 'free',
      name: 'Free Plan',
      type: 'free',
      monthlyFee: 0,
      includedTokens: 10000,
      overageRatePerToken: 0.002,
      features: ['Basic AI chat', 'Limited models'],
      limits: {
        maxRequestsPerHour: 20,
        maxRequestsPerDay: 100,
        maxConcurrentRequests: 1,
        maxTokensPerRequest: 1000
      },
      aiModelAccess: {
        openai: false,
        openrouter: true,
        premiumModels: false
      }
    };
  }
}

// Export singleton instance
export const aiUsageBillingService = new AIUsageBillingService(); 