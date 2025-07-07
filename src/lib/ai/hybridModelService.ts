import { supabase } from '@/lib/core/supabase';

export interface ModelConfig {
  model: string;
  provider: 'openai' | 'openrouter';
  maxTokens: number;
  temperature: number;
  costPer1KTokens: number;
  fallbackModels: string[];
  supportsTools: boolean;
  supportsAssistants: boolean;
  bestForTasks: string[];
  securityLevel: 'low' | 'medium' | 'high';
  reliability: number; // 0-1 score
  latency: number; // average ms
}

export interface ModelUsage {
  model: string;
  provider: string;
  tokensUsed: number;
  cost: number;
  latency: number;
  success: boolean;
  timestamp: Date;
  userId: string;
  agentId?: string;
  queryType?: string;
}

export interface BudgetStatus {
  used: number;
  total: number;
  remaining: number;
  utilizationPercent: number;
  projectedMonthlySpend: number;
  isOverBudget: boolean;
}

export interface ModelPerformance {
  model: string;
  provider: string;
  successRate: number;
  averageLatency: number;
  averageCost: number;
  totalUsage: number;
  lastUsed: Date;
  errorCount: number;
  trend: 'improving' | 'stable' | 'degrading';
}

export interface CostOptimizationSuggestion {
  type: 'model_switch' | 'usage_reduction' | 'budget_increase' | 'tier_optimization';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  potentialSavings: number;
  implementationEffort: 'low' | 'medium' | 'high';
  recommendation: string;
}

// Enhanced model configurations matching edge function
export const MODEL_CONFIGS: Record<string, ModelConfig> = {
  mission_critical: {
    model: 'gpt-4o',
    provider: 'openai',
    maxTokens: 2000,
    temperature: 0.3,
    costPer1KTokens: 0.0025,
    fallbackModels: ['gpt-4o-mini', 'gpt-3.5-turbo'],
    supportsTools: true,
    supportsAssistants: true,
    bestForTasks: ['financial_analysis', 'strategic_planning', 'complex_reasoning', 'tool_usage'],
    securityLevel: 'high',
    reliability: 0.99,
    latency: 2500
  },
  
  balanced: {
    model: 'anthropic/claude-3-sonnet',
    provider: 'openrouter',
    maxTokens: 1500,
    temperature: 0.5,
    costPer1KTokens: 0.0015,
    fallbackModels: ['gpt-4o-mini', 'anthropic/claude-3-haiku'],
    supportsTools: true,
    supportsAssistants: false,
    bestForTasks: ['content_generation', 'analysis', 'reasoning'],
    securityLevel: 'medium',
    reliability: 0.95,
    latency: 1800
  },
  
  cost_efficient: {
    model: 'mistralai/mistral-7b-instruct:free',
    provider: 'openrouter',
    maxTokens: 1000,
    temperature: 0.7,
    costPer1KTokens: 0.0000,
    fallbackModels: ['gpt-3.5-turbo', 'anthropic/claude-3-haiku'],
    supportsTools: false,
    supportsAssistants: false,
    bestForTasks: ['simple_qa', 'basic_analysis', 'content_generation'],
    securityLevel: 'low',
    reliability: 0.90,
    latency: 1200
  },

  // Additional OpenRouter models for cost optimization
  creative: {
    model: 'anthropic/claude-3-haiku',
    provider: 'openrouter',
    maxTokens: 1200,
    temperature: 0.8,
    costPer1KTokens: 0.00025,
    fallbackModels: ['gpt-3.5-turbo', 'mistralai/mistral-7b-instruct'],
    supportsTools: false,
    supportsAssistants: false,
    bestForTasks: ['creative_writing', 'brainstorming', 'content_ideation'],
    securityLevel: 'low',
    reliability: 0.93,
    latency: 1500
  },

  analysis: {
    model: 'google/gemini-pro',
    provider: 'openrouter',
    maxTokens: 1800,
    temperature: 0.4,
    costPer1KTokens: 0.0005,
    fallbackModels: ['gpt-4o-mini', 'anthropic/claude-3-haiku'],
    supportsTools: true,
    supportsAssistants: false,
    bestForTasks: ['data_analysis', 'pattern_recognition', 'research'],
    securityLevel: 'medium',
    reliability: 0.92,
    latency: 2000
  }
};

export class HybridModelService {
  private monthlyBudget: number;
  private performanceCache = new Map<string, ModelPerformance>();
  private costTracker = new Map<string, number>(); // month -> cost
  private usageHistory: ModelUsage[] = [];

  constructor(monthlyBudget: number = 100) {
    this.monthlyBudget = monthlyBudget;
    this.loadPerformanceData();
  }

  /**
   * Select the optimal model for a given agent and query
   */
  async selectOptimalModel(
    agentId: string,
    query: string,
    hasTools: boolean = false,
    prioritizeCost: boolean = false
  ): Promise<ModelConfig> {
    // Get agent requirements
    const agentRequirements = this.getAgentRequirements(agentId);
    
    // Analyze query complexity
    const queryComplexity = this.analyzeQueryComplexity(query);
    
    // Check budget status
    const budgetStatus = await this.getBudgetStatus();
    
    // Security requirements
    const securityLevel = this.determineSecurityLevel(query, agentId);
    
    // Get available models sorted by suitability
    const suitableModels = this.rankModelsBySuitability(
      agentRequirements,
      queryComplexity,
      hasTools,
      securityLevel,
      prioritizeCost || budgetStatus.utilizationPercent > 0.8
    );
    
    // Select best available model
    for (const modelKey of suitableModels) {
      const model = MODEL_CONFIGS[modelKey];
      const performance = this.performanceCache.get(model.model);
      
      // Check if model is reliable enough
      if (performance && performance.successRate < 0.85) {
        continue; // Skip unreliable models
      }
      
      // Check budget constraints
      const estimatedCost = this.estimateCost(model, query.length);
      if (budgetStatus.remaining < estimatedCost && model.costPer1KTokens > 0) {
        continue; // Skip expensive models if budget is tight
      }
      
      console.log(`Selected model: ${model.model} (${model.provider}) for agent: ${agentId}`);
      return model;
    }
    
    // Fallback to cost-efficient model
    return MODEL_CONFIGS.cost_efficient;
  }

  /**
   * Track model usage for analytics and optimization
   */
  async trackUsage(usage: ModelUsage): Promise<void> {
    try {
      // Store in local cache
      this.usageHistory.push(usage);
      
      // Update performance metrics
      this.updatePerformanceMetrics(usage);
      
      // Update cost tracking
      const month = new Date().toISOString().slice(0, 7);
      const currentCost = this.costTracker.get(month) || 0;
      this.costTracker.set(month, currentCost + usage.cost);
      
      // Store in database
      const { error } = await supabase
        .from('ai_model_usage')
        .insert({
          model: usage.model,
          provider: usage.provider,
          tokens_used: usage.tokensUsed,
          cost: usage.cost,
          latency: usage.latency,
          success: usage.success,
          user_id: usage.userId,
          agent_id: usage.agentId,
          query_type: usage.queryType,
          timestamp: usage.timestamp.toISOString()
        });
      
      if (error) {
        console.error('Error tracking model usage:', error);
      }
    } catch (error) {
      console.error('Error in trackUsage:', error);
    }
  }

  /**
   * Get current budget status
   */
  async getBudgetStatus(): Promise<BudgetStatus> {
    const month = new Date().toISOString().slice(0, 7);
    const used = this.costTracker.get(month) || 0;
    const remaining = Math.max(0, this.monthlyBudget - used);
    const utilizationPercent = used / this.monthlyBudget;
    
    // Calculate projected monthly spend
    const dayOfMonth = new Date().getDate();
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const projectedMonthlySpend = (used / dayOfMonth) * daysInMonth;
    
    return {
      used,
      total: this.monthlyBudget,
      remaining,
      utilizationPercent,
      projectedMonthlySpend,
      isOverBudget: used > this.monthlyBudget
    };
  }

  /**
   * Get performance metrics for all models
   */
  getModelPerformance(): ModelPerformance[] {
    return Array.from(this.performanceCache.values());
  }

  /**
   * Generate cost optimization suggestions
   */
  async getCostOptimizationSuggestions(): Promise<CostOptimizationSuggestion[]> {
    const suggestions: CostOptimizationSuggestion[] = [];
    const budgetStatus = await this.getBudgetStatus();
    
    // Budget-based suggestions
    if (budgetStatus.isOverBudget) {
      suggestions.push({
        type: 'usage_reduction',
        priority: 'high',
        title: 'Budget Exceeded',
        description: `You've exceeded your monthly budget by $${(budgetStatus.used - budgetStatus.total).toFixed(2)}`,
        potentialSavings: budgetStatus.used - budgetStatus.total,
        implementationEffort: 'low',
        recommendation: 'Consider switching to more cost-efficient models or reducing AI usage'
      });
    }
    
    if (budgetStatus.projectedMonthlySpend > budgetStatus.total * 1.2) {
      suggestions.push({
        type: 'tier_optimization',
        priority: 'medium',
        title: 'Projected Overspend',
        description: `Your current usage pattern projects $${budgetStatus.projectedMonthlySpend.toFixed(2)} monthly spend`,
        potentialSavings: budgetStatus.projectedMonthlySpend - budgetStatus.total,
        implementationEffort: 'medium',
        recommendation: 'Optimize model selection to use more cost-efficient options for simple queries'
      });
    }
    
    // Model performance-based suggestions
    const performances = this.getModelPerformance();
    const underperformingModels = performances.filter(p => p.successRate < 0.9);
    
    if (underperformingModels.length > 0) {
      suggestions.push({
        type: 'model_switch',
        priority: 'medium',
        title: 'Underperforming Models',
        description: `${underperformingModels.length} models have success rates below 90%`,
        potentialSavings: 0,
        implementationEffort: 'low',
        recommendation: 'Switch to more reliable models or update fallback strategies'
      });
    }
    
    // Usage pattern analysis
    const recentUsage = this.usageHistory.slice(-100);
    const expensiveUsage = recentUsage.filter(u => u.cost > 0.01);
    
    if (expensiveUsage.length > recentUsage.length * 0.5) {
      const potentialSavings = expensiveUsage.reduce((sum, u) => sum + u.cost * 0.6, 0);
      suggestions.push({
        type: 'tier_optimization',
        priority: 'medium',
        title: 'High-Cost Model Overuse',
        description: `${Math.round(expensiveUsage.length / recentUsage.length * 100)}% of queries use expensive models`,
        potentialSavings,
        implementationEffort: 'medium',
        recommendation: 'Implement smarter model selection to use cheaper models for simple queries'
      });
    }
    
    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Get usage analytics for dashboard
   */
  async getUsageAnalytics(timeframe: 'day' | 'week' | 'month' = 'month') {
    const now = new Date();
    const startDate = new Date();
    
    switch (timeframe) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
    }
    
    const { data: usage, error } = await supabase
      .from('ai_model_usage')
      .select('*')
      .gte('timestamp', startDate.toISOString())
      .order('timestamp', { ascending: false });
    
    if (error) {
      console.error('Error fetching usage analytics:', error);
      return null;
    }
    
    return {
      totalRequests: usage.length,
      totalCost: usage.reduce((sum, u) => sum + u.cost, 0),
      averageLatency: usage.reduce((sum, u) => sum + u.latency, 0) / usage.length,
      successRate: usage.filter(u => u.success).length / usage.length,
      providerBreakdown: this.groupBy(usage, 'provider'),
      modelBreakdown: this.groupBy(usage, 'model'),
      agentBreakdown: this.groupBy(usage, 'agent_id')
    };
  }

  // Private helper methods
  private getAgentRequirements(agentId: string) {
    const requirements = {
      executive: { securityLevel: 'high', complexity: 'high', tools: true },
      finance: { securityLevel: 'high', complexity: 'high', tools: true },
      sales: { securityLevel: 'medium', complexity: 'medium', tools: true },
      marketing: { securityLevel: 'medium', complexity: 'medium', tools: true },
      operations: { securityLevel: 'medium', complexity: 'medium', tools: true },
      support: { securityLevel: 'low', complexity: 'low', tools: false }
    };
    
    return requirements[agentId] || requirements.support;
  }

  private analyzeQueryComplexity(query: string): 'low' | 'medium' | 'high' {
    const complexityIndicators = {
      high: ['analyze', 'strategy', 'complex', 'financial', 'budget', 'forecast', 'plan', 'optimize', 'calculate'],
      medium: ['explain', 'compare', 'evaluate', 'assess', 'review', 'summarize'],
      low: ['what', 'how', 'when', 'where', 'who', 'simple', 'basic']
    };
    
    const queryLower = query.toLowerCase();
    
    if (query.length > 500 || complexityIndicators.high.some(word => queryLower.includes(word))) {
      return 'high';
    }
    
    if (query.length > 200 || complexityIndicators.medium.some(word => queryLower.includes(word))) {
      return 'medium';
    }
    
    return 'low';
  }

  private determineSecurityLevel(query: string, agentId: string): 'low' | 'medium' | 'high' {
    const sensitiveKeywords = ['financial', 'budget', 'revenue', 'cost', 'profit', 'salary', 'confidential', 'private'];
    const queryLower = query.toLowerCase();
    
    if (agentId === 'finance' || agentId === 'executive') {
      return 'high';
    }
    
    if (sensitiveKeywords.some(word => queryLower.includes(word))) {
      return 'high';
    }
    
    if (agentId === 'sales' || agentId === 'marketing' || agentId === 'operations') {
      return 'medium';
    }
    
    return 'low';
  }

  private rankModelsBySuitability(
    agentRequirements: any,
    queryComplexity: string,
    hasTools: boolean,
    securityLevel: string,
    prioritizeCost: boolean
  ): string[] {
    const models = Object.entries(MODEL_CONFIGS);
    
    const scored = models.map(([key, config]) => {
      let score = 0;
      
      // Security requirements
      const securityScore = { low: 1, medium: 2, high: 3 };
      if (securityScore[config.securityLevel] >= securityScore[securityLevel]) {
        score += 10;
      }
      
      // Tool support
      if (hasTools && config.supportsTools) {
        score += 8;
      }
      
      // Complexity matching
      const complexityScore = { low: 1, medium: 2, high: 3 };
      const modelComplexity = config.securityLevel === 'high' ? 'high' : 
                             config.securityLevel === 'medium' ? 'medium' : 'low';
      if (complexityScore[modelComplexity] >= complexityScore[queryComplexity]) {
        score += 6;
      }
      
      // Cost considerations
      if (prioritizeCost) {
        score += (1 - config.costPer1KTokens / 0.003) * 5; // Normalize cost impact
      }
      
      // Reliability
      score += config.reliability * 4;
      
      // Latency (lower is better)
      score += (3000 - config.latency) / 1000;
      
      return { key, score };
    });
    
    return scored
      .sort((a, b) => b.score - a.score)
      .map(item => item.key);
  }

  private estimateCost(model: ModelConfig, queryLength: number): number {
    const estimatedTokens = Math.ceil(queryLength / 4) * 1.5; // Rough estimate including response
    return (estimatedTokens / 1000) * model.costPer1KTokens;
  }

  private updatePerformanceMetrics(usage: ModelUsage): void {
    const key = usage.model;
    const existing = this.performanceCache.get(key);
    
    if (existing) {
      const totalRequests = existing.totalUsage + 1;
      const newSuccessRate = (existing.successRate * existing.totalUsage + (usage.success ? 1 : 0)) / totalRequests;
      const newAverageLatency = (existing.averageLatency * existing.totalUsage + usage.latency) / totalRequests;
      const newAverageCost = (existing.averageCost * existing.totalUsage + usage.cost) / totalRequests;
      
      this.performanceCache.set(key, {
        ...existing,
        successRate: newSuccessRate,
        averageLatency: newAverageLatency,
        averageCost: newAverageCost,
        totalUsage: totalRequests,
        lastUsed: usage.timestamp,
        errorCount: existing.errorCount + (usage.success ? 0 : 1)
      });
    } else {
      this.performanceCache.set(key, {
        model: usage.model,
        provider: usage.provider,
        successRate: usage.success ? 1 : 0,
        averageLatency: usage.latency,
        averageCost: usage.cost,
        totalUsage: 1,
        lastUsed: usage.timestamp,
        errorCount: usage.success ? 0 : 1,
        trend: 'stable'
      });
    }
  }

  private async loadPerformanceData(): Promise<void> {
    try {
      const { data: usage, error } = await supabase
        .from('ai_model_usage')
        .select('*')
        .gte('timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('timestamp', { ascending: false });
      
      if (error) {
        console.error('Error loading performance data:', error);
        return;
      }
      
      // Process usage data to build performance metrics
      const modelStats = new Map<string, any>();
      
      usage.forEach(u => {
        const key = u.model;
        if (!modelStats.has(key)) {
          modelStats.set(key, {
            model: u.model,
            provider: u.provider,
            requests: [],
            totalCost: 0,
            totalLatency: 0,
            successCount: 0,
            errorCount: 0
          });
        }
        
        const stats = modelStats.get(key);
        stats.requests.push(u);
        stats.totalCost += u.cost;
        stats.totalLatency += u.latency;
        if (u.success) stats.successCount++;
        else stats.errorCount++;
      });
      
      // Convert to performance metrics
      modelStats.forEach((stats, key) => {
        const totalRequests = stats.requests.length;
        this.performanceCache.set(key, {
          model: stats.model,
          provider: stats.provider,
          successRate: stats.successCount / totalRequests,
          averageLatency: stats.totalLatency / totalRequests,
          averageCost: stats.totalCost / totalRequests,
          totalUsage: totalRequests,
          lastUsed: new Date(stats.requests[0].timestamp),
          errorCount: stats.errorCount,
          trend: 'stable' // TODO: Calculate trend
        });
      });
      
    } catch (error) {
      console.error('Error loading performance data:', error);
    }
  }

  private groupBy(array: any[], key: string) {
    return array.reduce((groups, item) => {
      const group = item[key] || 'unknown';
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {});
  }
}

// Export singleton instance
export const hybridModelService = new HybridModelService(
  Number(import.meta.env.VITE_MONTHLY_AI_BUDGET) || 100
); 