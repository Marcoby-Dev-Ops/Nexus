import OpenAI from 'openai';
import { prisma } from '@/lib/core/prisma';
import { modelService } from '@/lib/services/modelService';
import { supabase } from '@/lib/core/supabase';

interface ModelConfig {
  model: string;
  maxTokens: number;
  temperature: number;
  costPer1KTokens: number;
  fallbackModels: string[];
  minConfidence: number;
  maxRetries: number;
}

interface ModelPerformance {
  successRate: number;
  averageLatency: number;
  averageCost: number;
  lastUsed: Date;
  errorCount: number;
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

// Model configurations with cost and performance parameters
const MODEL_CONFIGS: Record<string, ModelConfig> = {
  // Free/cheaper models for simple tasks
  simple: {
    model: 'mistralai/mistral-7b-instruct',
    maxTokens: 500,
    temperature: 0.7,
    costPer1KTokens: 0.0001, // $0.0001 per 1K tokens
    fallbackModels: [
      'huggingface/mistral-7b',
      'meta-llama/llama-2-7b-chat',
      'google/gemma-7b-it'
    ],
    minConfidence: 0.6,
    maxRetries: 2
  },
  // Mid-tier models for pattern recognition
  pattern: {
    model: 'anthropic/claude-2',
    maxTokens: 1000,
    temperature: 0.5,
    costPer1KTokens: 0.001, // $0.001 per 1K tokens
    fallbackModels: [
      'anthropic/claude-instant',
      'google/gemma-7b-it',
      'mistralai/mistral-7b-instruct'
    ],
    minConfidence: 0.7,
    maxRetries: 2
  },
  // Premium models for complex decision making
  complex: {
    model: 'openai/gpt-4',
    maxTokens: 2000,
    temperature: 0.3,
    costPer1KTokens: 0.03, // $0.03 per 1K tokens
    fallbackModels: [
      'anthropic/claude-2',
      'google/gemini-pro',
      'anthropic/claude-instant'
    ],
    minConfidence: 0.8,
    maxRetries: 1
  }
};

export class ModelManager {
  private openRouter: OpenRouter;
  private performanceCache: Map<string, ModelPerformance>;
  private costTracker: Map<string, number>;
  private monthlyBudget: number;
  private currentMonth: string;

  constructor(apiKey: string, monthlyBudget: number = 100) {
    this.openRouter = new OpenRouter({ apiKey });
    this.performanceCache = new Map();
    this.costTracker = new Map();
    this.monthlyBudget = monthlyBudget;
    this.currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    this.initializePerformanceTracking();
  }

  private async initializePerformanceTracking() {
    // Load historical performance data from database
    const performanceData = await prisma.modelPerformance.findMany({
      where: {
        month: this.currentMonth
      }
    });

    performanceData.forEach(data => {
      this.performanceCache.set(data.model, {
        successRate: data.successRate,
        averageLatency: data.averageLatency,
        averageCost: data.averageCost,
        lastUsed: data.lastUsed,
        errorCount: data.errorCount
      });
    });
  }

  async selectModel(taskType: string, complexity: number): Promise<string> {
    const config = MODEL_CONFIGS[taskType];
    if (!config) throw new Error(`Unknown task type: ${taskType}`);

    // Check if we're within budget
    const currentCost = await this.getCurrentMonthCost();
    if (currentCost >= this.monthlyBudget) {
      return this.selectFallbackModel(taskType, complexity);
    }

    // Get performance metrics
    const performance = this.performanceCache.get(config.model) || {
      successRate: 1,
      averageLatency: 0,
      averageCost: 0,
      lastUsed: new Date(),
      errorCount: 0
    };

    // If performance is poor, try fallback models
    if (performance.successRate < 0.8 || performance.errorCount > 5) {
      return this.selectFallbackModel(taskType, complexity);
    }

    return config.model;
  }

  private async selectFallbackModel(taskType: string, complexity: number): Promise<string> {
    const config = MODEL_CONFIGS[taskType];
    const fallbacks = config.fallbackModels;

    for (const fallback of fallbacks) {
      const performance = this.performanceCache.get(fallback);
      if (!performance || performance.successRate >= 0.8) {
        return fallback;
      }
    }

    // If all fallbacks are poor, return the original model
    return config.model;
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

    // Store in database
    await prisma.modelUsage.create({
      data: {
        model: usage.model,
        tokensUsed: usage.tokensUsed,
        cost: usage.cost,
        latency: usage.latency,
        success: usage.success,
        timestamp: usage.timestamp,
        taskType: usage.taskType
      }
    });

    await prisma.modelPerformance.upsert({
      where: {
        model_month: {
          model: usage.model,
          month: this.currentMonth
        }
      },
      update: newPerformance,
      create: {
        model: usage.model,
        month: this.currentMonth,
        ...newPerformance
      }
    });
  }

  async getCurrentMonthCost(): Promise<number> {
    return this.costTracker.get(this.currentMonth) || 0;
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
   * Track model usage and update performance metrics
   */
  private async trackModelUsage(
    model: string,
    tokensUsed: number,
    cost: number,
    latency: number,
    success: boolean
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await modelService.trackModelUsage({
        model,
        tokensUsed,
        cost,
        latency,
        success,
        userId: user?.id ?? 'system'
      });
    } catch (error) {
      console.error('Error tracking model usage:', error);
    }
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
      const stats = await modelService.getModelUsageStats(timeRange);
      const performance = await modelService.getModelPerformance(timeRange);
      const suggestions = await modelService.getCostOptimizationSuggestions();

      const modelPerformance = performance.reduce((acc, perf) => {
        acc[perf.model] = {
          successRate: perf.successRate,
          averageLatency: perf.averageLatency,
          averageCost: perf.averageCost,
          errorCount: perf.errorCount
        };
        return acc;
      }, {} as Record<string, {
        successRate: number;
        averageLatency: number;
        averageCost: number;
        errorCount: number;
      }>);

      return {
        monthlyCost: stats.totalCost,
        modelPerformance,
        suggestions
      };
    } catch (error) {
      console.error('Error generating report:', error);
      throw new Error('Failed to generate model usage report');
    }
  }
}

// Export a singleton instance
export const modelManager = new ModelManager(
  process.env.OPENROUTER_API_KEY || '',
  Number(process.env.MONTHLY_AI_BUDGET) || 100
); 