import { prisma } from '@/lib/prisma';
import type { ModelUsage, ModelPerformance } from '@prisma/client';

export class ModelService {
  /**
   * Track model usage and update performance metrics
   */
  async trackModelUsage(usage: Omit<ModelUsage, 'id' | 'created_at'>): Promise<ModelUsage> {
    try {
      // Create usage record
      const modelUsage = await prisma.modelUsage.create({
        data: usage
      });

      // Update performance metrics
      await this.updateModelPerformance(usage.model_name, usage);

      return modelUsage;
    } catch (error) {
      console.error('Error tracking model usage:', error);
      throw new Error('Failed to track model usage');
    }
  }

  /**
   * Update model performance metrics
   */
  private async updateModelPerformance(
    model: string,
    usage: Omit<ModelUsage, 'id' | 'created_at'>
  ): Promise<void> {
    const month = new Date().toISOString().slice(0, 7); // YYYY-MM

    try {
      // Get current performance data
      const currentPerformance = await prisma.modelPerformance.findUnique({
        where: {
          model_month: {
            model,
            month
          }
        }
      });

      // Calculate new metrics
      const newPerformance: Partial<ModelPerformance> = {
        model,
        month,
        successRate: currentPerformance
          ? (currentPerformance.successRate + (usage.success ? 1 : 0)) / 2
          : usage.success ? 1 : 0,
        averageLatency: currentPerformance
          ? (currentPerformance.averageLatency + usage.latency) / 2
          : usage.latency,
        averageCost: currentPerformance
          ? (currentPerformance.averageCost + usage.cost) / 2
          : usage.cost,
        lastUsed: new Date(),
        errorCount: currentPerformance
          ? currentPerformance.errorCount + (usage.success ? 0 : 1)
          : usage.success ? 0 : 1
      };

      // Update or create performance record
      await prisma.modelPerformance.upsert({
        where: {
          model_month: {
            model,
            month
          }
        },
        update: newPerformance,
        create: newPerformance as ModelPerformance
      });
    } catch (error) {
      console.error('Error updating model performance:', error);
      throw new Error('Failed to update model performance');
    }
  }

  /**
   * Get model performance data for a specific time range
   */
  async getModelPerformance(
    timeRange: 'day' | 'week' | 'month' = 'month'
  ): Promise<ModelPerformance[]> {
    try {
      const date = new Date();
      let startDate: Date;

      switch (timeRange) {
        case 'day':
          startDate = new Date(date.setDate(date.getDate() - 1));
          break;
        case 'week':
          startDate = new Date(date.setDate(date.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(date.setMonth(date.getMonth() - 1));
          break;
      }

      return await prisma.modelPerformance.findMany({
        where: {
          lastUsed: {
            gte: startDate
          }
        },
        orderBy: {
          lastUsed: 'desc'
        }
      });
    } catch (error) {
      console.error('Error fetching model performance:', error);
      throw new Error('Failed to fetch model performance');
    }
  }

  /**
   * Get model usage statistics
   */
  async getModelUsageStats(
    timeRange: 'day' | 'week' | 'month' = 'month'
  ): Promise<{
    totalCost: number;
    totalTokens: number;
    successRate: number;
    averageLatency: number;
  }> {
    try {
      const date = new Date();
      let startDate: Date;

      switch (timeRange) {
        case 'day':
          startDate = new Date(date.setDate(date.getDate() - 1));
          break;
        case 'week':
          startDate = new Date(date.setDate(date.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(date.setMonth(date.getMonth() - 1));
          break;
      }

      const usage = await prisma.modelUsage.findMany({
        where: {
          created_at: {
            gte: startDate
          }
        }
      });

      const totalCost = usage.reduce((sum, u) => sum + u.cost, 0);
      const totalTokens = usage.reduce((sum, u) => sum + u.tokens_used, 0);
      const successCount = usage.filter(u => u.success).length;
      const successRate = usage.length > 0 ? successCount / usage.length : 0;
      const averageLatency = usage.reduce((sum, u) => sum + u.latency, 0) / usage.length;

      return {
        totalCost,
        totalTokens,
        successRate,
        averageLatency
      };
    } catch (error) {
      console.error('Error fetching model usage stats:', error);
      throw new Error('Failed to fetch model usage statistics');
    }
  }

  /**
   * Get cost optimization suggestions
   */
  async getCostOptimizationSuggestions(): Promise<string[]> {
    try {
      const suggestions: string[] = [];
      const performance = await this.getModelPerformance('month');
      const stats = await this.getModelUsageStats('month');

      // Check budget usage
      if (stats.totalCost > 80) { // Assuming $100 monthly budget
        suggestions.push('Approaching monthly budget limit. Consider using more cost-effective models for non-critical tasks.');
      }

      // Analyze model performance
      performance.forEach(perf => {
        if (perf.successRate < 0.8) {
          suggestions.push(`Model ${perf.model} has low success rate (${(perf.successRate * 100).toFixed(1)}%). Consider using fallback models.`);
        }
        if (perf.errorCount > 5) {
          suggestions.push(`Model ${perf.model} has high error count (${perf.errorCount}). Review error logs and consider alternatives.`);
        }
        if (perf.averageCost > 0.01) {
          suggestions.push(`Model ${perf.model} is expensive ($${perf.averageCost.toFixed(4)} per request). Consider using cheaper alternatives for non-critical tasks.`);
        }
      });

      return suggestions;
    } catch (error) {
      console.error('Error generating cost optimization suggestions:', error);
      throw new Error('Failed to generate cost optimization suggestions');
    }
  }

  /**
   * Get model usage history for a specific model
   */
  async getModelUsageHistory(
    model: string,
    timeRange: 'day' | 'week' | 'month' = 'month'
  ): Promise<ModelUsage[]> {
    try {
      const date = new Date();
      let startDate: Date;

      switch (timeRange) {
        case 'day':
          startDate = new Date(date.setDate(date.getDate() - 1));
          break;
        case 'week':
          startDate = new Date(date.setDate(date.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(date.setMonth(date.getMonth() - 1));
          break;
      }

      return await prisma.modelUsage.findMany({
        where: {
          model_name: model,
          created_at: {
            gte: startDate
          }
        },
        orderBy: {
          created_at: 'desc'
        }
      });
    } catch (error) {
      console.error('Error fetching model usage history:', error);
      throw new Error('Failed to fetch model usage history');
    }
  }
}

// Export a singleton instance
export const modelService = new ModelService(); 