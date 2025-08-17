import { logger } from '@/shared/utils/logger';

export interface ModelConfig {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'google' | 'azure' | 'custom';
  model: string;
  version: string;
  capabilities: string[];
  costPerToken: number;
  maxTokens: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ModelPerformance {
  modelId: string;
  accuracy: number;
  responseTime: number;
  costPerRequest: number;
  usageCount: number;
  errorRate: number;
  lastUpdated: string;
}

export interface ModelUsage {
  modelId: string;
  tokensUsed: number;
  requestsCount: number;
  totalCost: number;
  date: string;
}

export class ModelManager {
  private models: Map<string, ModelConfig> = new Map();
  private performance: Map<string, ModelPerformance> = new Map();
  private usage: ModelUsage[] = [];

  constructor() {
    this.initializeDefaultModels();
  }

  private initializeDefaultModels(): void {
    const defaultModels: ModelConfig[] = [
      {
        id: 'gpt-4',
        name: 'GPT-4',
        provider: 'openai',
        model: 'gpt-4',
        version: 'latest',
        capabilities: ['text-generation', 'code-generation', 'analysis'],
        costPerToken: 0.00003,
        maxTokens: 8192,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        version: 'latest',
        capabilities: ['text-generation', 'code-generation'],
        costPerToken: 0.000002,
        maxTokens: 4096,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'claude-3-opus',
        name: 'Claude 3 Opus',
        provider: 'anthropic',
        model: 'claude-3-opus-20240229',
        version: 'latest',
        capabilities: ['text-generation', 'analysis', 'reasoning'],
        costPerToken: 0.000015,
        maxTokens: 200000,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'claude-3-sonnet',
        name: 'Claude 3 Sonnet',
        provider: 'anthropic',
        model: 'claude-3-sonnet-20240229',
        version: 'latest',
        capabilities: ['text-generation', 'analysis'],
        costPerToken: 0.000003,
        maxTokens: 200000,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    defaultModels.forEach(model => {
      this.models.set(model.id, model);
    });
  }

  async getAllModels(): Promise<ModelConfig[]> {
    try {
      return Array.from(this.models.values());
    } catch (error) {
      logger.error('Error getting all models:', error);
      return [];
    }
  }

  async getActiveModels(): Promise<ModelConfig[]> {
    try {
      return Array.from(this.models.values()).filter(model => model.isActive);
    } catch (error) {
      logger.error('Error getting active models:', error);
      return [];
    }
  }

  async getModelById(id: string): Promise<ModelConfig | null> {
    try {
      return this.models.get(id) || null;
    } catch (error) {
      logger.error(`Error getting model by id ${id}:`, error);
      return null;
    }
  }

  async createModel(model: Omit<ModelConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<ModelConfig> {
    try {
      const newModel: ModelConfig = {
        ...model,
        id: `model-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      this.models.set(newModel.id, newModel);
      logger.info(`Created new model: ${newModel.name}`);
      return newModel;
    } catch (error) {
      logger.error('Error creating model:', error);
      throw error;
    }
  }

  async updateModel(id: string, updates: Partial<ModelConfig>): Promise<ModelConfig | null> {
    try {
      const model = this.models.get(id);
      if (!model) {
        return null;
      }

      const updatedModel: ModelConfig = {
        ...model,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      this.models.set(id, updatedModel);
      logger.info(`Updated model: ${updatedModel.name}`);
      return updatedModel;
    } catch (error) {
      logger.error(`Error updating model ${id}:`, error);
      return null;
    }
  }

  async deleteModel(id: string): Promise<boolean> {
    try {
      const deleted = this.models.delete(id);
      if (deleted) {
        logger.info(`Deleted model: ${id}`);
      }
      return deleted;
    } catch (error) {
      logger.error(`Error deleting model ${id}:`, error);
      return false;
    }
  }

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

  async getModelUsage(modelId: string, timeframe: 'day' | 'week' | 'month' = 'week'): Promise<ModelUsage[]> {
    try {
      const startDate = this.getStartDate(timeframe);
      return this.usage.filter(usage => 
        usage.modelId === modelId && new Date(usage.date) >= startDate
      );
    } catch (error) {
      logger.error(`Error getting model usage for ${modelId}:`, error);
      return [];
    }
  }

  async getAllModelUsage(timeframe: 'day' | 'week' | 'month' = 'week'): Promise<ModelUsage[]> {
    try {
      const startDate = this.getStartDate(timeframe);
      return this.usage.filter(usage => new Date(usage.date) >= startDate);
    } catch (error) {
      logger.error('Error getting all model usage:', error);
      return [];
    }
  }

  async recordModelUsage(usage: Omit<ModelUsage, 'date'>): Promise<void> {
    try {
      const newUsage: ModelUsage = {
        ...usage,
        date: new Date().toISOString(),
      };
      
      this.usage.push(newUsage);
      logger.info(`Recorded usage for model: ${usage.modelId}`);
    } catch (error) {
      logger.error(`Error recording model usage for ${usage.modelId}:`, error);
      throw error;
    }
  }

  async getCostAnalysis(_timeframe: 'day' | 'week' | 'month' = 'week'): Promise<{
    totalCost: number;
    costByModel: Record<string, number>;
    costByProvider: Record<string, number>;
    averageCostPerRequest: number;
  }> {
    try {
      const usage = await this.getAllModelUsage(timeframe);
      
      const totalCost = usage.reduce((sum, u) => sum + u.totalCost, 0);
      const totalRequests = usage.reduce((sum, u) => sum + u.requestsCount, 0);
      
      const costByModel: Record<string, number> = {};
      const costByProvider: Record<string, number> = {};
      
      usage.forEach(u => {
        costByModel[u.modelId] = (costByModel[u.modelId] || 0) + u.totalCost;
        
        const model = this.models.get(u.modelId);
        if (model) {
          costByProvider[model.provider] = (costByProvider[model.provider] || 0) + u.totalCost;
        }
      });

      return {
        totalCost,
        costByModel,
        costByProvider,
        averageCostPerRequest: totalRequests > 0 ? totalCost / totalRequests : 0,
      };
    } catch (error) {
      logger.error('Error getting cost analysis:', error);
      return {
        totalCost: 0,
        costByModel: {},
        costByProvider: {},
        averageCostPerRequest: 0,
      };
    }
  }

  async getPerformanceMetrics(timeframe: 'day' | 'week' | 'month' = 'week'): Promise<{
    averageAccuracy: number;
    averageResponseTime: number;
    averageErrorRate: number;
    totalRequests: number;
  }> {
    try {
      const performance = await this.getAllModelPerformance();
      
      if (performance.length === 0) {
        return {
          averageAccuracy: 0,
          averageResponseTime: 0,
          averageErrorRate: 0,
          totalRequests: 0,
        };
      }

      const totalRequests = performance.reduce((sum, p) => sum + p.usageCount, 0);
      const averageAccuracy = performance.reduce((sum, p) => sum + p.accuracy, 0) / performance.length;
      const averageResponseTime = performance.reduce((sum, p) => sum + p.responseTime, 0) / performance.length;
      const averageErrorRate = performance.reduce((sum, p) => sum + p.errorRate, 0) / performance.length;

      return {
        averageAccuracy,
        averageResponseTime,
        averageErrorRate,
        totalRequests,
      };
    } catch (error) {
      logger.error('Error getting performance metrics:', error);
      return {
        averageAccuracy: 0,
        averageResponseTime: 0,
        averageErrorRate: 0,
        totalRequests: 0,
      };
    }
  }

  private getStartDate(timeframe: 'day' | 'week' | 'month'): Date {
    const now = new Date();
    switch (timeframe) {
      case 'day':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
  }
}

// Export singleton instance
export const modelManager = new ModelManager(); 
