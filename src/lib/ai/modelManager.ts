import OpenAI from 'openai';
import { supabase } from '@/lib/core/supabase';

interface ModelConfig {
  model: string;
  provider: 'openai' | 'openrouter';
  maxTokens: number;
  temperature: number;
  costPer1KTokens: number;
  fallbackModels: string[];
  minConfidence: number;
  maxRetries: number;
  supportsTools?: boolean;
  supportsAssistants?: boolean;
  bestForTasks?: string[];
}

interface ModelPerformance {
  successRate: number;
  averageLatency: number;
  averageCost: number;
  lastUsed: Date;
  errorCount: number;
}

interface OpenRouter {
  apiKey: string;
}

interface ModelUsage {
  model: string;
  tokensUsed: number;
  cost: number;
  latency: number;
  success: boolean;
  timestamp: Date;
  taskType: string;
}

// Enhanced model configurations with OpenRouter options
const MODEL_CONFIGS: Record<string, ModelConfig> = {
  // Simple tasks - prioritize cost efficiency
  simple: {
    model: 'mistralai/mistral-7b-instruct:free',
    provider: 'openrouter',
    maxTokens: 500,
    temperature: 0.7,
    costPer1KTokens: 0.0000, // Free tier
    fallbackModels: [
      'gpt-3.5-turbo',
      'anthropic/claude-3-haiku',
      'google/gemma-2-9b-it:free'
    ],
    minConfidence: 0.6,
    maxRetries: 2,
    supportsTools: false,
    supportsAssistants: false,
    bestForTasks: ['simple_qa', 'basic_analysis', 'content_generation']
  },
  
  // Pattern recognition - balance cost and capability
  pattern: {
    model: 'anthropic/claude-3-haiku',
    provider: 'openrouter',
    maxTokens: 1000,
    temperature: 0.5,
    costPer1KTokens: 0.00025,
    fallbackModels: [
      'gpt-4o-mini',
      'google/gemini-pro',
      'mistralai/mistral-7b-instruct'
    ],
    minConfidence: 0.7,
    maxRetries: 2,
    supportsTools: true,
    supportsAssistants: false,
    bestForTasks: ['pattern_recognition', 'data_analysis', 'classification']
  },
  
  // Complex reasoning - prioritize capability
  complex: {
    model: 'gpt-4o',
    provider: 'openai',
    maxTokens: 2000,
    temperature: 0.3,
    costPer1KTokens: 0.0025,
    fallbackModels: [
      'anthropic/claude-3-sonnet',
      'gpt-4o-mini',
      'anthropic/claude-3-haiku'
    ],
    minConfidence: 0.8,
    maxRetries: 1,
    supportsTools: true,
    supportsAssistants: true,
    bestForTasks: ['complex_reasoning', 'code_generation', 'strategic_planning']
  },
  
  // Domain agents - specialized for assistant profiles
  domain_agent: {
    model: 'gpt-4o',
    provider: 'openai',
    maxTokens: 1500,
    temperature: 0.4,
    costPer1KTokens: 0.0025,
    fallbackModels: [
      'anthropic/claude-3-sonnet',
      'gpt-4o-mini'
    ],
    minConfidence: 0.8,
    maxRetries: 1,
    supportsTools: true,
    supportsAssistants: true,
    bestForTasks: ['domain_expertise', 'tool_usage', 'contextual_reasoning']
  },
  
  // Creative tasks - optimize for creativity
  creative: {
    model: 'anthropic/claude-3-sonnet',
    provider: 'openrouter',
    maxTokens: 1500,
    temperature: 0.8,
    costPer1KTokens: 0.003,
    fallbackModels: [
      'gpt-4o',
      'anthropic/claude-3-haiku',
      'mistralai/mistral-large'
    ],
    minConfidence: 0.7,
    maxRetries: 2,
    supportsTools: false,
    supportsAssistants: false,
    bestForTasks: ['creative_writing', 'brainstorming', 'content_creation']
  }
};

export class ModelManager {
  private openaiClient: OpenAI;
  private openrouterClient: OpenRouter;
  private performanceCache: Map<string, ModelPerformance>;
  private costTracker: Map<string, number>;
  private monthlyBudget: number;
  private currentMonth: string;

  constructor(
    openaiApiKey: string, 
    openrouterApiKey: string, 
    monthlyBudget: number = 100
  ) {
    this.openaiClient = new OpenAI({ apiKey: openaiApiKey });
    this.openrouterClient = { apiKey: openrouterApiKey };
    this.performanceCache = new Map();
    this.costTracker = new Map();
    this.monthlyBudget = monthlyBudget;
    this.currentMonth = new Date().toISOString().slice(0, 7);
    this.initializePerformanceTracking();
  }

  private async initializePerformanceTracking(): Promise<void> {
    // Initialize performance tracking from database
    try {
      const { data: metrics } = await supabase
        .from('ai_model_performance')
        .select('*')
        .gte('created_at', `${this.currentMonth}-01`);
      
      metrics?.forEach(metric => {
        this.performanceCache.set(metric.model, {
          successRate: metric.success_rate,
          averageLatency: metric.average_latency,
          averageCost: metric.average_cost,
          lastUsed: new Date(metric.last_used),
          errorCount: metric.error_count
        });
      });
    } catch (error) {
      console.warn('Failed to initialize performance tracking:', error);
    }
  }

  async selectModel(
    taskType: string, 
    complexity: number,
    requiresTools: boolean = false,
    requiresAssistants: boolean = false
  ): Promise<{ model: string; provider: 'openai' | 'openrouter' }> {
    const config = MODEL_CONFIGS[taskType];
    if (!config) {
      // Default to domain_agent for unknown task types
      return this.selectModel('domain_agent', complexity, requiresTools, requiresAssistants);
    }

    // Check budget constraints
    const currentCost = await this.getCurrentMonthCost();
    if (currentCost >= this.monthlyBudget) {
      return this.selectFallbackModel(taskType, complexity, requiresTools, requiresAssistants);
    }

    // Check capability requirements
    if (requiresTools && !config.supportsTools) {
      return this.selectModel('domain_agent', complexity, requiresTools, requiresAssistants);
    }
    
    if (requiresAssistants && !config.supportsAssistants) {
      return this.selectModel('domain_agent', complexity, requiresTools, requiresAssistants);
    }

    // Check performance metrics
    const performance = this.performanceCache.get(config.model);
    if (performance && (performance.successRate < 0.8 || performance.errorCount > 5)) {
      return this.selectFallbackModel(taskType, complexity, requiresTools, requiresAssistants);
    }

    return { model: config.model, provider: config.provider };
  }

  private async selectFallbackModel(
    taskType: string, 
    complexity: number,
    requiresTools: boolean = false,
    requiresAssistants: boolean = false
  ): Promise<{ model: string; provider: 'openai' | 'openrouter' }> {
    const config = MODEL_CONFIGS[taskType];
    const fallbacks = config.fallbackModels;

    for (const fallback of fallbacks) {
      // Determine provider based on model name
      const provider = this.getProviderForModel(fallback);
      
      // Check if fallback meets requirements
      const fallbackConfig = this.getConfigForModel(fallback);
      if (requiresTools && !fallbackConfig?.supportsTools) continue;
      if (requiresAssistants && !fallbackConfig?.supportsAssistants) continue;
      
      const performance = this.performanceCache.get(fallback);
      if (!performance || performance.successRate >= 0.8) {
        return { model: fallback, provider };
      }
    }

    // If all fallbacks fail, return the original model
    return { model: config.model, provider: config.provider };
  }

  private getProviderForModel(model: string): 'openai' | 'openrouter' {
    // OpenAI models
    if (model.startsWith('gpt-') || model.startsWith('o1-') || model.startsWith('o3-')) {
      return 'openai';
    }
    
    // Everything else goes through OpenRouter
    return 'openrouter';
  }

  private getConfigForModel(model: string): ModelConfig | undefined {
    return Object.values(MODEL_CONFIGS).find(config => 
      config.model === model || config.fallbackModels.includes(model)
    );
  }

  async createCompletion(
    messages: any[],
    options: {
      model?: string;
      provider?: 'openai' | 'openrouter';
      taskType?: string;
      requiresTools?: boolean;
      requiresAssistants?: boolean;
      temperature?: number;
      maxTokens?: number;
      tools?: any[];
    } = {}
  ): Promise<any> {
    const startTime = Date.now();
    
    try {
      // Select appropriate model if not specified
      let model = options.model;
      let provider = options.provider;
      
      if (!model || !provider) {
        const selected = await this.selectModel(
          options.taskType || 'complex',
          0.8,
          options.requiresTools,
          options.requiresAssistants
        );
        model = selected.model;
        provider = selected.provider;
      }

      const config = MODEL_CONFIGS[options.taskType || 'complex'];
      
      // Prepare request parameters
      const requestParams: any = {
        model,
        messages,
        temperature: options.temperature ?? config.temperature,
        max_tokens: options.maxTokens ?? config.maxTokens,
      };

      if (options.tools) {
        requestParams.tools = options.tools;
        requestParams.tool_choice = 'auto';
      }

      let response;
      
      if (provider === 'openai') {
        response = await this.openaiClient.chat.completions.create(requestParams);
      } else {
        // OpenRouter request
        response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.openrouterClient.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://nexus.marcoby.com',
            'X-Title': 'Nexus AI'
          },
          body: JSON.stringify(requestParams)
        });
        
        if (!response.ok) {
          throw new Error(`OpenRouter API error: ${response.status}`);
        }
        
        response = await response.json();
      }

      // Track performance
      const latency = Date.now() - startTime;
      await this.trackPerformance(model, true, latency, this.estimateCost(model, messages));

      return response;
    } catch (error) {
      const latency = Date.now() - startTime;
      await this.trackPerformance(options.model || 'unknown', false, latency, 0);
      throw error;
    }
  }

  private async trackPerformance(
    model: string, 
    success: boolean, 
    latency: number, 
    cost: number
  ): Promise<void> {
    const current = this.performanceCache.get(model) || {
      successRate: 1,
      averageLatency: 0,
      averageCost: 0,
      lastUsed: new Date(),
      errorCount: 0
    };

    // Update performance metrics
    const updated = {
      successRate: success ? 
        (current.successRate * 0.9 + 0.1) : 
        (current.successRate * 0.9),
      averageLatency: (current.averageLatency * 0.8 + latency * 0.2),
      averageCost: (current.averageCost * 0.8 + cost * 0.2),
      lastUsed: new Date(),
      errorCount: success ? 
        Math.max(0, current.errorCount - 1) : 
        current.errorCount + 1
    };

    this.performanceCache.set(model, updated);

    // Persist to database
    try {
      await supabase
        .from('ai_model_performance')
        .upsert({
          model,
          success_rate: updated.successRate,
          average_latency: updated.averageLatency,
          average_cost: updated.averageCost,
          last_used: updated.lastUsed.toISOString(),
          error_count: updated.errorCount,
          updated_at: new Date().toISOString()
        });
    } catch (error) {
      console.warn('Failed to persist performance metrics:', error);
    }
  }

  private estimateCost(model: string, messages: any[]): number {
    const config = Object.values(MODEL_CONFIGS).find(c => c.model === model);
    if (!config) return 0;

    const tokenCount = messages.reduce((total, msg) => 
      total + (msg.content?.length || 0) / 4, 0
    );
    
    return (tokenCount / 1000) * config.costPer1KTokens;
  }

  private async getCurrentMonthCost(): Promise<number> {
    const currentMonth = new Date().toISOString().slice(0, 7);
    if (this.currentMonth !== currentMonth) {
      this.currentMonth = currentMonth;
      this.costTracker.clear();
    }

    return Array.from(this.costTracker.values()).reduce((sum, cost) => sum + cost, 0);
  }

  // Get recommended models for specific agent types
  getRecommendedModelsForAgent(agentType: string): string[] {
    switch (agentType) {
      case 'executive':
        return ['gpt-4o', 'anthropic/claude-3-sonnet', 'gpt-4o-mini'];
      case 'sales':
        return ['gpt-4o', 'anthropic/claude-3-sonnet', 'mistralai/mistral-large'];
      case 'finance':
        return ['gpt-4o', 'anthropic/claude-3-sonnet', 'gpt-4o-mini'];
      case 'operations':
        return ['gpt-4o-mini', 'anthropic/claude-3-haiku', 'mistralai/mistral-7b-instruct'];
      case 'marketing':
        return ['anthropic/claude-3-sonnet', 'gpt-4o', 'mistralai/mistral-large'];
      default:
        return ['gpt-4o-mini', 'anthropic/claude-3-haiku'];
    }
  }

  async trackUsage(usage: ModelUsage): Promise<void> {
    // Update performance cache
    const currentPerformance = this.performanceCache.get(usage.model) || {
      successRate: 1,
      averageLatency: 0,
      averageCost: 0,
      lastUsed: new Date(),
      errorCount: 0
    };

    const newPerformance: ModelPerformance = {
      successRate: (currentPerformance.successRate + (usage.success ? 1 : 0)) / 2,
      averageLatency: (currentPerformance.averageLatency + usage.latency) / 2,
      averageCost: (currentPerformance.averageCost + usage.cost) / 2,
      lastUsed: new Date(),
      errorCount: currentPerformance.errorCount + (usage.success ? 0 : 1)
    };

    this.performanceCache.set(usage.model, newPerformance);

    // Update cost tracker
    const currentCost = this.costTracker.get(this.currentMonth) || 0;
    this.costTracker.set(this.currentMonth, currentCost + usage.cost);

    // Store in database via Supabase
    try {
      await supabase.from('ai_model_usage').insert({
        model_name: usage.model,
        tokens_used: usage.tokensUsed,
        cost: usage.cost,
        latency: usage.latency,
        success: usage.success,
        task_type: usage.taskType
      });
    } catch (error) {
      console.warn('Failed to store model usage:', error);
    }
  }

  async getModelPerformance(model: string): Promise<ModelPerformance | null> {
    return this.performanceCache.get(model) || null;
  }

  async getCostOptimizationSuggestions(): Promise<string[]> {
    const suggestions: string[] = [];
    const currentCost = await this.getCurrentMonthCost();
    const performanceData = Array.from(this.performanceCache.entries());

    // Check if we're approaching budget
    if (currentCost > this.monthlyBudget * 0.8) {
      suggestions.push('Approaching monthly budget limit. Consider using more cost-effective models for non-critical tasks.');
    }

    // Analyze model performance
    performanceData.forEach(([model, performance]) => {
      if (performance.successRate < 0.8) {
        suggestions.push(`Model ${model} has low success rate (${performance.successRate}). Consider using fallback models.`);
      }
      if (performance.errorCount > 5) {
        suggestions.push(`Model ${model} has high error count (${performance.errorCount}). Review error logs and consider alternatives.`);
      }
    });

    // Suggest cost optimizations
    const expensiveModels = performanceData
      .filter(([_, perf]) => perf.averageCost > 0.01)
      .map(([model]) => model);

    if (expensiveModels.length > 0) {
      suggestions.push(`Consider using cheaper alternatives for: ${expensiveModels.join(', ')}`);
    }

    return suggestions;
  }

  /**
   * Generate a report of model usage and performance
   */
  async generateReport(timeRange: 'day' | 'week' | 'month' = 'month'): Promise<{
    monthlyCost: number;
    modelPerformance: Record<string, {
      successRate: number;
      averageLatency: number;
      averageCost: number;
      errorCount: number;
    }>;
    suggestions: string[];
  }> {
    try {
      const monthlyCost = await this.getCurrentMonthCost();
      const modelPerformance: Record<string, {
        successRate: number;
        averageLatency: number;
        averageCost: number;
        errorCount: number;
      }> = {};

      // Build performance data from cache
      this.performanceCache.forEach((perf, model) => {
        modelPerformance[model] = {
          successRate: perf.successRate,
          averageLatency: perf.averageLatency,
          averageCost: perf.averageCost,
          errorCount: perf.errorCount
        };
      });

      const suggestions = await this.getCostOptimizationSuggestions();

      return {
        monthlyCost,
        modelPerformance,
        suggestions
      };
    } catch (error) {
      console.error('Error generating report:', error);
      throw new Error('Failed to generate model usage report');
    }
  }
}

// Export enhanced singleton instance
export const modelManager = new ModelManager(
  import.meta.env.VITE_OPENAI_API_KEY || '',
  import.meta.env.VITE_OPENROUTER_API_KEY || '',
  Number(import.meta.env.VITE_MONTHLY_AI_BUDGET) || 100
); 