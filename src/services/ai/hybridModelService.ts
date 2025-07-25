import { logger } from '@/shared/utils/logger.ts';

export interface ModelPerformance {
  modelId: string;
  accuracy: number;
  responseTime: number;
  costPerRequest: number;
  usageCount: number;
  errorRate: number;
  lastUpdated: string;
}

export interface CostOptimizationSuggestion {
  id: string;
  type: 'model-switch' | 'parameter-tuning' | 'caching' | 'batch-processing';
  title: string;
  description: string;
  potentialSavings: number;
  implementationEffort: 'low' | 'medium' | 'high';
  riskLevel: 'low' | 'medium' | 'high';
  status: 'pending' | 'approved' | 'implemented' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface BudgetStatus {
  currentSpend: number;
  budgetLimit: number;
  remainingBudget: number;
  spendRate: number;
  projectedOverspend: boolean;
  alerts: string[];
}

export interface HybridModelConfig {
  id: string;
  name: string;
  primaryModel: string;
  fallbackModel: string;
  routingStrategy: 'performance' | 'cost' | 'accuracy' | 'hybrid';
  thresholds: {
    maxResponseTime: number;
    maxCost: number;
    minAccuracy: number;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

class HybridModelService {
  private hybridConfigs: Map<string, HybridModelConfig> = new Map();
  private performance: Map<string, ModelPerformance> = new Map();
  private suggestions: CostOptimizationSuggestion[] = [];
  private budgetStatus: BudgetStatus = {
    currentSpend: 0,
    budgetLimit: 1000,
    remainingBudget: 1000,
    spendRate: 0,
    projectedOverspend: false,
    alerts: [],
  };

  async getModelPerformance(modelId: string): Promise<ModelPerformance | null> {
    try {
      return this.performance.get(modelId) || null;
    } catch (error) {
      logger.error(`Error getting model performance for ${modelId}:`, error);
      return null;
    }
  }

  async getAllModelPerformance(): Promise<ModelPerformance[]> {
    try {
      return Array.from(this.performance.values());
    } catch (error) {
      logger.error('Error getting all model performance:', error);
      return [];
    }
  }

  async updateModelPerformance(performance: ModelPerformance): Promise<void> {
    try {
      this.performance.set(performance.modelId, performance);
      logger.info(`Updated performance for model: ${performance.modelId}`);
    } catch (error) {
      logger.error(`Error updating model performance for ${performance.modelId}:`, error);
      throw error;
    }
  }

  async getCostOptimizationSuggestions(): Promise<CostOptimizationSuggestion[]> {
    try {
      // Analyze performance and generate suggestions
      const performance = await this.getAllModelPerformance();
      
      const suggestions: CostOptimizationSuggestion[] = [];
      
      // Analyze high-cost models
      const highCostModels = performance.filter(p => p.costPerRequest > 0.01);
      if (highCostModels.length > 0) {
        suggestions.push({
          id: `suggestion-${Date.now()}-1`,
          type: 'model-switch',
          title: 'Switch to Lower-Cost Models',
          description: `Consider switching from high-cost models to more cost-effective alternatives`,
          potentialSavings: highCostModels.reduce((sum, p) => sum + p.costPerRequest * p.usageCount * 0.3, 0),
          implementationEffort: 'medium',
          riskLevel: 'low',
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      // Analyze slow response times
      const slowModels = performance.filter(p => p.responseTime > 2000);
      if (slowModels.length > 0) {
        suggestions.push({
          id: `suggestion-${Date.now()}-2`,
          type: 'caching',
          title: 'Implement Response Caching',
          description: 'Cache frequent responses to improve response times',
          potentialSavings: slowModels.reduce((sum, p) => sum + p.costPerRequest * p.usageCount * 0.2, 0),
          implementationEffort: 'high',
          riskLevel: 'medium',
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      // Analyze high error rates
      const errorProneModels = performance.filter(p => p.errorRate > 0.05);
      if (errorProneModels.length > 0) {
        suggestions.push({
          id: `suggestion-${Date.now()}-3`,
          type: 'parameter-tuning',
          title: 'Optimize Model Parameters',
          description: 'Tune model parameters to reduce error rates',
          potentialSavings: errorProneModels.reduce((sum, p) => sum + p.costPerRequest * p.usageCount * 0.1, 0),
          implementationEffort: 'low',
          riskLevel: 'low',
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      this.suggestions = suggestions;
      logger.info(`Generated ${suggestions.length} cost optimization suggestions`);
      return suggestions;
    } catch (error) {
      logger.error('Error generating cost optimization suggestions:', error);
      return [];
    }
  }

  async updateSuggestionStatus(suggestionId: string, status: CostOptimizationSuggestion['status']): Promise<boolean> {
    try {
      const suggestion = this.suggestions.find(s => s.id === suggestionId);
      if (!suggestion) {
        return false;
      }

      suggestion.status = status;
      suggestion.updatedAt = new Date().toISOString();
      
      logger.info(`Updated suggestion status: ${suggestionId} -> ${status}`);
      return true;
    } catch (error) {
      logger.error(`Error updating suggestion status ${suggestionId}:`, error);
      return false;
    }
  }

  async getBudgetStatus(): Promise<BudgetStatus> {
    try {
      // Calculate current spend from performance data
      const performance = await this.getAllModelPerformance();
      const currentSpend = performance.reduce((sum, p) => sum + p.costPerRequest * p.usageCount, 0);
      
      const remainingBudget = this.budgetStatus.budgetLimit - currentSpend;
      const spendRate = currentSpend / 30; // Assuming monthly budget
      const projectedOverspend = spendRate * 30 > this.budgetStatus.budgetLimit;
      
      const alerts: string[] = [];
      if (remainingBudget < this.budgetStatus.budgetLimit * 0.1) {
        alerts.push('Budget nearly exhausted');
      }
      if (projectedOverspend) {
        alerts.push('Projected budget overspend');
      }
      if (spendRate > this.budgetStatus.budgetLimit / 30 * 1.5) {
        alerts.push('High spend rate detected');
      }

      this.budgetStatus = {
        currentSpend,
        budgetLimit: this.budgetStatus.budgetLimit,
        remainingBudget,
        spendRate,
        projectedOverspend,
        alerts,
      };

      logger.info('Updated budget status');
      return this.budgetStatus;
    } catch (error) {
      logger.error('Error getting budget status:', error);
      return this.budgetStatus;
    }
  }

  async setBudgetLimit(limit: number): Promise<void> {
    try {
      this.budgetStatus.budgetLimit = limit;
      this.budgetStatus.remainingBudget = limit - this.budgetStatus.currentSpend;
      logger.info(`Set budget limit to ${limit}`);
    } catch (error) {
      logger.error('Error setting budget limit:', error);
      throw error;
    }
  }

  async getHybridConfigs(): Promise<HybridModelConfig[]> {
    try {
      return Array.from(this.hybridConfigs.values());
    } catch (error) {
      logger.error('Error getting hybrid configs:', error);
      return [];
    }
  }

  async createHybridConfig(config: Omit<HybridModelConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<HybridModelConfig> {
    try {
      const newConfig: HybridModelConfig = {
        ...config,
        id: `hybrid-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      this.hybridConfigs.set(newConfig.id, newConfig);
      logger.info(`Created hybrid config: ${newConfig.name}`);
      return newConfig;
    } catch (error) {
      logger.error('Error creating hybrid config:', error);
      throw error;
    }
  }

  async updateHybridConfig(id: string, updates: Partial<HybridModelConfig>): Promise<HybridModelConfig | null> {
    try {
      const config = this.hybridConfigs.get(id);
      if (!config) {
        return null;
      }

      const updatedConfig: HybridModelConfig = {
        ...config,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      this.hybridConfigs.set(id, updatedConfig);
      logger.info(`Updated hybrid config: ${updatedConfig.name}`);
      return updatedConfig;
    } catch (error) {
      logger.error(`Error updating hybrid config ${id}:`, error);
      return null;
    }
  }

  async deleteHybridConfig(id: string): Promise<boolean> {
    try {
      const deleted = this.hybridConfigs.delete(id);
      if (deleted) {
        logger.info(`Deleted hybrid config: ${id}`);
      }
      return deleted;
    } catch (error) {
      logger.error(`Error deleting hybrid config ${id}:`, error);
      return false;
    }
  }

  async getPerformanceAnalytics(timeframe: 'day' | 'week' | 'month' = 'week'): Promise<{
    totalRequests: number;
    averageResponseTime: number;
    averageAccuracy: number;
    totalCost: number;
    costTrend: number[];
    performanceTrend: number[];
  }> {
    try {
      const performance = await this.getAllModelPerformance();
      
      const totalRequests = performance.reduce((sum, p) => sum + p.usageCount, 0);
      const averageResponseTime = performance.length > 0 
        ? performance.reduce((sum, p) => sum + p.responseTime, 0) / performance.length 
        : 0;
      const averageAccuracy = performance.length > 0 
        ? performance.reduce((sum, p) => sum + p.accuracy, 0) / performance.length 
        : 0;
      const totalCost = performance.reduce((sum, p) => sum + p.costPerRequest * p.usageCount, 0);

      // Generate mock trend data
      const days = timeframe === 'day' ? 24 : timeframe === 'week' ? 7 : 30;
      const costTrend = Array.from({ length: days }, () => Math.random() * 100);
      const performanceTrend = Array.from({ length: days }, () => 0.8 + Math.random() * 0.2);

      return {
        totalRequests,
        averageResponseTime,
        averageAccuracy,
        totalCost,
        costTrend,
        performanceTrend,
      };
    } catch (error) {
      logger.error('Error getting performance analytics:', error);
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        averageAccuracy: 0,
        totalCost: 0,
        costTrend: [],
        performanceTrend: [],
      };
    }
  }
}

// Export singleton instance
export const hybridModelService = new HybridModelService(); 