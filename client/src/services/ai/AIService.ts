import { z } from 'zod';
import { BaseService } from '@/core/services/BaseService';
import type { ServiceResponse } from '@/core/services/BaseService';
import type { CrudServiceInterface, ServiceConfig } from '@/core/services/interfaces';
import { selectData as select, selectOne, insertOne, updateOne, deleteOne, callEdgeFunction } from '@/lib/api-client';
import { logger } from '@/shared/utils/logger';
// import { NexusAIGatewayService } from '@/ai/services/NexusAIGatewayService'; // Removed - server-side service

// AI Schemas
export const AIOperationSchema = z.object({
  id: z.string().optional(),
  user_id: z.string(),
  company_id: z.string().optional(),
  operation_type: z.enum(['chat', 'analysis', 'generation', 'training', 'prediction']),
  model: z.string().optional(),
  prompt: z.string().optional(),
  input_data: z.record(z.any()).optional(),
  output_data: z.record(z.any()).optional(),
  status: z.enum(['pending', 'processing', 'completed', 'failed']),
  tokens_used: z.number().optional(),
  cost: z.number().optional(),
  processing_time: z.number().optional(),
  error_message: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const AIModelSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  version: z.string(),
  provider: z.string(), // openai, anthropic, local, etc.
  capabilities: z.array(z.string()),
  cost_per_token: z.number(),
  max_tokens: z.number(),
  status: z.enum(['active', 'inactive', 'deprecated']),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const AIConversationSchema = z.object({
  id: z.string().optional(),
  user_id: z.string(),
  company_id: z.string().optional(),
  title: z.string(),
  model: z.string(),
  messages: z.array(z.record(z.any())),
  total_tokens: z.number().optional(),
  total_cost: z.number().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type AIOperation = z.infer<typeof AIOperationSchema>;
export type AIModel = z.infer<typeof AIModelSchema>;
export type AIConversation = z.infer<typeof AIConversationSchema>;

// Agent Registry Schemas
export const AgentSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['executive', 'analyst', 'assistant', 'specialist']),
  description: z.string(),
  capabilities: z.array(z.string()),
  tools: z.array(z.string()).default([]),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const ImprovementMetricsSchema = z.object({
  accuracy: z.number(),
  responseTime: z.number(),
  userSatisfaction: z.number(),
  taskCompletionRate: z.number(),
  errorRate: z.number(),
});

export const UserFeedbackSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  agentId: z.string(),
  rating: z.number().min(1).max(5),
  feedback: z.string(),
  category: z.string(),
  createdAt: z.string().optional(),
});

export const ImprovementRecommendationSchema = z.object({
  id: z.string().optional(),
  category: z.enum(['accuracy', 'speed', 'user_experience', 'functionality']),
  title: z.string(),
  description: z.string(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  impact: z.number().min(0).max(100),
  effort: z.number().min(0).max(100),
  status: z.enum(['pending', 'in_progress', 'completed', 'rejected']),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

// Tool Management Schemas
export const ToolSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.enum(['data', 'communication', 'automation', 'analysis', 'integration']),
  isEnabled: z.boolean(),
  parameters: z.record(z.any()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const ToolExecutionSchema = z.object({
  id: z.string(),
  toolId: z.string(),
  agentId: z.string(),
  parameters: z.record(z.any()),
  result: z.any().optional(),
  status: z.enum(['pending', 'running', 'completed', 'failed']),
  error: z.string().optional(),
  executionTime: z.number(),
  createdAt: z.string(),
});

export type Tool = z.infer<typeof ToolSchema>;
export type ToolExecution = z.infer<typeof ToolExecutionSchema>;

export const SlashCommandSchema = z.object({
  slug: z.string(),
  title: z.string(),
  description: z.string().optional(),
  category: z.string().optional(),
  templateData: z.record(z.any()).optional(),
  isActive: z.boolean().default(true),
  usageCount: z.number().default(0),
  lastUsed: z.string().optional(),
});

export type Agent = z.infer<typeof AgentSchema>;
export type ImprovementMetrics = z.infer<typeof ImprovementMetricsSchema>;
export type UserFeedback = z.infer<typeof UserFeedbackSchema>;
export type ImprovementRecommendation = z.infer<typeof ImprovementRecommendationSchema>;
export type SlashCommand = z.infer<typeof SlashCommandSchema>;

// Service Configuration
const aiServiceConfig: ServiceConfig = {
  tableName: 'ai_operations',
  schema: AIOperationSchema,
  cacheEnabled: true,
  cacheTTL: 300, // 5 minutes
  enableLogging: true,
};

/**
 * AIService - Handles all AI operations and model management
 *
 * Features:
 * - Chat completions
 * - Data analysis
 * - Content generation
 * - Model training
 * - Predictions
 * - Cost tracking
 * - Performance monitoring
 * - Conversation management
 * - Agent registry management
 * - Continuous improvement tracking
 * - Slash command handling
 */
export class AIService extends BaseService implements CrudServiceInterface<AIOperation> {
  protected config = aiServiceConfig;

  private agents: Map<string, Agent> = new Map();
  private feedback: UserFeedback[] = [];
  private recommendations: ImprovementRecommendation[] = [];
  private commandCache: Map<string, SlashCommand> = new Map();
  private cacheTimeout = 10 * 60 * 1000; // 10 minutes
  private lastCacheUpdate = 0;
  // private gateway: NexusAIGatewayService = new NexusAIGatewayService(); // Removed - server-side service
  private defaultTenantId = 'default-tenant';

  private metrics: ImprovementMetrics = {
    accuracy: 0.85,
    responseTime: 1200,
    userSatisfaction: 4.2,
    taskCompletionRate: 0.92,
    errorRate: 0.08
  };

  constructor() {
    super();
    this.initializeDefaultAgents();
  }

  // CRUD Methods required by CrudServiceInterface
  async get(id: string): Promise<ServiceResponse<AIOperation>> {
    this.logMethodCall('get', { id });
    return this.executeDbOperation(async () => {
      const result = await selectOne(this.config.tableName, id);
      if (!result.success) throw new Error(result.error);
      const validatedData = this.config.schema.parse(result.data);
      return { data: validatedData, error: null };
    }, `get ${this.config.tableName} ${id}`);
  }

  async create(data: Partial<AIOperation>): Promise<ServiceResponse<AIOperation>> {
    this.logMethodCall('create', { data });
    return this.executeDbOperation(async () => {
      const result = await insertOne(this.config.tableName, {
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      if (!result.success) throw new Error(result.error);
      const validatedData = this.config.schema.parse(result.data);
      return { data: validatedData, error: null };
    }, `create ${this.config.tableName}`);
  }

  async update(id: string, data: Partial<AIOperation>): Promise<ServiceResponse<AIOperation>> {
    this.logMethodCall('update', { id, data });
    return this.executeDbOperation(async () => {
      const result = await updateOne(this.config.tableName, id, {
        ...data,
        updated_at: new Date().toISOString()
      });
      if (!result.success) throw new Error(result.error);
      const validatedData = this.config.schema.parse(result.data);
      return { data: validatedData, error: null };
    }, `update ${this.config.tableName} ${id}`);
  }

  async delete(id: string): Promise<ServiceResponse<boolean>> {
    this.logMethodCall('delete', { id });
    return this.executeDbOperation(async () => {
      const result = await deleteOne(this.config.tableName, id);
      if (!result.success) throw new Error(result.error);
      return { data: true, error: null };
    }, `delete ${this.config.tableName} ${id}`);
  }

  async list(filters?: Record<string, any>): Promise<ServiceResponse<AIOperation[]>> {
    this.logMethodCall('list', { filters });
    return this.executeDbOperation(async () => {
      const result = await select(this.config.tableName, '*', filters);
      if (!result.success) throw new Error(result.error);
      const validatedData = result.data.map(item => this.config.schema.parse(item));
      return { data: validatedData, error: null };
    }, `list ${this.config.tableName}`);
  }

  // Generate AI response (delegates to NexusAIGatewayService)
  async generateResponse(prompt: string, context: any = {}) {
    this.logMethodCall('generateResponse', { prompt, context });
    try {
      const tenantId: string = context.tenantId || context.companyId || this.defaultTenantId;

      const chat = await this.gateway.chat({
        messages: [
          context.system ? { role: 'system', content: String(context.system) } : undefined,
          { role: 'user', content: prompt },
        ].filter(Boolean) as Array<{ role: 'system' | 'user'; content: string }>,
        system: context.system,
        role: context.role || 'chat',
        sensitivity: context.sensitivity || 'internal',
        budgetCents: context.budgetCents,
        latencyTargetMs: context.latencyTargetMs,
        json: context.json,
        tools: context.tools,
        tenantId,
        userId: context.userId,
      });

      if (!chat.success || !chat.data) {
        return { success: false, error: chat.error || 'AI chat failed' };
      }

      return {
        success: true,
        data: {
          response: chat.data.message,
          model: chat.data.model,
          tokens_used: (chat.data.tokens?.prompt || 0) + (chat.data.tokens?.completion || 0),
          cost: (chat.data.costCents || 0) / 100,
          processing_time: chat.data.latencyMs,
        },
        error: null,
      };
    } catch (error) {
      return this.handleError('generateResponse', error);
    }
  }

  // Analyze data with AI (delegates to NexusAIGatewayService)
  async analyzeData(data: any, analysisType: string) {
    this.logMethodCall('analyzeData', { analysisType });
    try {
      const tenantId: string = data?.tenantId || data?.companyId || this.defaultTenantId;
      const res = await this.gateway.analyzeBusinessData(
        data,
        (analysisType as 'financial' | 'operational' | 'strategic') || 'strategic',
        tenantId,
        data?.userId
      );
      if (!res.success) return { success: false, error: res.error || 'Analysis failed' };
      return { success: true, data: res.data, error: null };
    } catch (error) {
      return this.handleError('analyzeData', error);
    }
  }

  // Generate insights (delegates to NexusAIGatewayService)
  async generateInsights(userId: string, data: any) {
    this.logMethodCall('generateInsights', { userId });
    try {
      const tenantId: string = data?.tenantId || this.defaultTenantId;
      const res = await this.gateway.generateRecommendations(
        JSON.stringify(data),
        'growth',
        tenantId,
        userId
      );
      if (!res.success) return { success: false, error: res.error || 'Insight generation failed' };
      return { success: true, data: res.data, error: null };
    } catch (error) {
      return this.handleError('generateInsights', error);
    }
  }

  // Train AI model
  async trainModel(modelId: string, trainingData: any) {
    this.logMethodCall('trainModel', { modelId });
    
    try {
      const operation = {
        user_id: trainingData.userId || 'system',
        company_id: trainingData.companyId,
        operation_type: 'training' as const,
        model: modelId,
        input_data: trainingData,
        status: 'pending' as const,
        created_at: new Date().toISOString(),
      };

      const result = await this.create(operation);
      
      if (result.success && result.data) {
        const training = await this.processTraining(result.data);
        
        await this.update(result.data.id!, {
          ...training,
          status: 'completed' as const,
          updated_at: new Date().toISOString(),
        });

        return {
          data: training.output_data,
          error: null,
          success: true,
        };
      }

      return result;
    } catch (error) {
      return this.handleError('trainModel', error);
    }
  }

  // Get model performance
  async getModelPerformance(modelId: string) {
    this.logMethodCall('getModelPerformance', { modelId });
    
    try {
      const operations = await this.list({ model: modelId });
      
      if (!operations.success || !operations.data) {
        return {
          data: { performance: {} },
          error: null,
          success: true,
        };
      }

      const performance = this.calculateModelPerformance(operations.data);

      return {
        data: performance,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError('getModelPerformance', error);
    }
  }

  // Create AI conversation
  async createConversation(userId: string, title: string, model: string = 'gpt-4') {
    this.logMethodCall('createConversation', { userId, title, model });
    
    try {
      // This would typically interact with a conversations table
      const conversation = {
        user_id: userId,
        title,
        model,
        messages: [],
        total_tokens: 0,
        total_cost: 0,
        created_at: new Date().toISOString(),
      };

      // Save conversation to database
      const result = await insertOne('ai_conversations', conversation);

      if (!result.success) {
        this.logger.error('Failed to create conversation', { error: result.error });
        return this.handleError('createConversation', result.error);
      }

      return {
        data: result.data,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError('createConversation', error);
    }
  }

  // Add message to conversation
  async addMessageToConversation(conversationId: string, message: any) {
    this.logMethodCall('addMessageToConversation', { conversationId, message });
    
    try {
      // Update conversation with new message
      const result = await updateOne('ai_conversations', conversationId, {
        messages: JSON.stringify([message]), // Simplified for now
        updated_at: new Date().toISOString()
      });

      if (!result.success) {
        this.logger.error('Failed to add message to conversation', { error: result.error });
        return this.handleError('addMessageToConversation', result.error);
      }

      return {
        data: result.data,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError('addMessageToConversation', error);
    }
  }

  // Get conversation history
  async getConversationHistory(userId: string) {
    this.logMethodCall('getConversationHistory', { userId });
    
    try {
      // Get conversations from database
      const result = await select('ai_conversations', '*', {
        user_id: userId
      });

      if (!result.success) {
        this.logger.error('Failed to get conversation history', { error: result.error });
        return this.handleError('getConversationHistory', result.error);
      }

      return {
        data: result.data || [],
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError('getConversationHistory', error);
    }
  }

  // Get AI usage statistics
  async getAIUsageStats(userId: string) {
    this.logMethodCall('getAIUsageStats', { userId });
    
    try {
      const operations = await this.list({ user_id: userId });
      
      if (!operations.success || !operations.data) {
        return {
          data: { totalOperations: 0, totalCost: 0, totalTokens: 0 },
          error: null,
          success: true,
        };
      }

      const stats = this.calculateUsageStats(operations.data);

      return {
        data: stats,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError('getAIUsageStats', error);
    }
  }

  // Get available AI models
  async getAvailableModels() {
    this.logMethodCall('getAvailableModels');
    
    try {
      // Get models from database
      const result = await select('ai_models', '*', {
        status: 'active'
      });

      if (!result.success) {
        this.logger.error('Failed to get available models', { error: result.error });
        return this.handleError('getAvailableModels', result.error);
      }

      // If no models in database, return default models
      if (!result.data || result.data.length === 0) {
        const defaultModels = [
          {
            id: 'gpt-4',
            name: 'GPT-4',
            version: '4.0',
            provider: 'openai',
            capabilities: ['chat', 'analysis', 'generation'],
            cost_per_token: 0.00003,
            max_tokens: 8192,
            status: 'active' as const,
          },
          {
            id: 'gpt-3.5-turbo',
            name: 'GPT-3.5 Turbo',
            version: '3.5',
            provider: 'openai',
            capabilities: ['chat', 'analysis'],
            cost_per_token: 0.000002,
            max_tokens: 4096,
            status: 'active' as const,
          },
          {
            id: 'claude-3',
            name: 'Claude 3',
            version: '3.0',
            provider: 'anthropic',
            capabilities: ['chat', 'analysis', 'generation'],
            cost_per_token: 0.000015,
            max_tokens: 100000,
            status: 'active' as const,
          },
        ];

        return {
          data: defaultModels,
          error: null,
          success: true,
        };
      }

      return {
        data: result.data,
        error: null,
        success: true,
      };
    } catch (error) {
      return this.handleError('getAvailableModels', error);
    }
  }

  // Agent Registry Methods
  async getAllAgents(): Promise<Agent[]> {
    this.logMethodCall('getAllAgents');
    
    try {
      const result = await select('ai_agents', '*', {
        is_active: true
      });

      if (!result.success) {
        logger.error('Error fetching agents:', result.error);
        return Array.from(this.agents.values());
      }

      return result.data || [];
    } catch (error) {
      logger.error('Error getting all agents:', error);
      return Array.from(this.agents.values());
    }
  }

  async getAgent(agentId: string): Promise<ServiceResponse<Agent | null>> {
    this.logMethodCall('getAgent', { agentId });
    
    try {
      const result = await selectOne('ai_agents', agentId);

      if (!result.success) {
        logger.error('Error fetching agent:', result.error);
        return { data: this.agents.get(agentId) || null, error: null };
      }

      return { data: result.data, error: null };
    } catch (error) {
      logger.error('Error getting agent:', error);
      return { data: this.agents.get(agentId) || null, error: null };
    }
  }

  async getAgentByType(type: Agent['type']): Promise<Agent | null> {
    this.logMethodCall('getAgentByType', { type });
    
    try {
      const result = await selectOne('ai_agents', type, 'type');

      if (!result.success) {
        logger.error('Error fetching agent by type:', result.error);
        return null;
      }

      return result.data;
    } catch (error) {
      logger.error('Error getting agent by type:', error);
      return null;
    }
  }

  async createAgent(agent: Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>): Promise<ServiceResponse<Agent>> {
    this.logMethodCall('createAgent', { agent });
    
    try {
      const newAgent: Agent = {
        ...agent,
        id: `agent_${Date.now()}_${Math.random()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = await insertOne('ai_agents', newAgent);

      if (!result.success) {
        logger.error('Error creating agent:', result.error);
        return { data: null, error: result.error };
      }

      this.agents.set(result.data.id, result.data);
      return { data: result.data, error: null };
    } catch (error) {
      logger.error('Error creating agent:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async updateAgent(agentId: string, updates: Partial<Agent>): Promise<ServiceResponse<Agent>> {
    this.logMethodCall('updateAgent', { agentId, updates });
    
    try {
      const result = await updateOne('ai_agents', agentId, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });

      if (!result.success) {
        logger.error('Error updating agent:', result.error);
        return { data: null, error: result.error };
      }

      this.agents.set(result.data.id, result.data);
      return { data: result.data, error: null };
    } catch (error) {
      logger.error('Error updating agent:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async deactivateAgent(agentId: string): Promise<boolean> {
    this.logMethodCall('deactivateAgent', { agentId });
    
    try {
      const result = await updateOne('ai_agents', agentId, {
        isActive: false,
        updatedAt: new Date().toISOString(),
      });

      if (!result.success) {
        logger.error('Error deactivating agent:', result.error);
        return false;
      }

      this.agents.delete(agentId);
      return true;
    } catch (error) {
      logger.error('Error deactivating agent:', error);
      return false;
    }
  }

  // Continuous Improvement Methods
  async getImprovementDashboard(timeframe: string = 'week'): Promise<{
    timeframe: string;
    metrics: ImprovementMetrics;
    feedback: UserFeedback[];
    recommendations: ImprovementRecommendation[];
    trends: {
      accuracy: number[];
      responseTime: number[];
      satisfaction: number[];
    };
  }> {
    this.logMethodCall('getImprovementDashboard', { timeframe });
    
    try {
      const startDate = this.getStartDate(timeframe);
      const filteredFeedback = this.feedback.filter(f => f.createdAt >= startDate);
      
      return {
        timeframe,
        metrics: this.metrics,
        feedback: filteredFeedback,
        recommendations: this.recommendations.filter(r => r.status !== 'completed'),
        trends: this.generateTrends(timeframe)
      };
    } catch (error) {
      logger.error('Error getting improvement dashboard:', error);
      return {
        timeframe,
        metrics: this.metrics,
        feedback: [],
        recommendations: [],
        trends: {
          accuracy: [],
          responseTime: [],
          satisfaction: []
        }
      };
    }
  }

  async trackUserFeedback(feedback: Omit<UserFeedback, 'id' | 'createdAt'>): Promise<UserFeedback> {
    this.logMethodCall('trackUserFeedback', { feedback });
    
    try {
      const newFeedback: UserFeedback = {
        ...feedback,
        id: `feedback_${Date.now()}_${Math.random()}`,
        createdAt: new Date().toISOString(),
      };

      this.feedback.push(newFeedback);

      // Store in database
      const result = await insertOne('ai_user_feedback', newFeedback);

      if (!result.success) {
        logger.error('Error storing user feedback:', result.error);
      }

      return newFeedback;
    } catch (error) {
      logger.error('Error tracking user feedback:', error);
      throw error;
    }
  }

  async generateImprovementRecommendations(): Promise<ImprovementRecommendation[]> {
    this.logMethodCall('generateImprovementRecommendations');
    
    try {
      const recommendations: ImprovementRecommendation[] = [];
      
      // Analyze feedback patterns
      const avgRating = this.feedback.length > 0 
        ? this.feedback.reduce((sum, f) => sum + f.rating, 0) / this.feedback.length 
        : 0;
      
      const avgResponseTime = this.metrics.responseTime;
      const errorRate = this.metrics.errorRate;
      
      // Generate recommendations based on metrics
      if (avgRating < 4.0) {
        recommendations.push({
          id: `rec-${Date.now()}-1`,
          category: 'user_experience',
          title: 'Improve User Satisfaction',
          description: 'User feedback indicates room for improvement in user experience',
          priority: 'high',
          impact: 80,
          effort: 60,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      
      if (avgResponseTime > 2000) {
        recommendations.push({
          id: `rec-${Date.now()}-2`,
          category: 'speed',
          title: 'Optimize Response Time',
          description: 'Response times are above acceptable thresholds',
          priority: 'medium',
          impact: 70,
          effort: 50,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      
      if (errorRate > 0.1) {
        recommendations.push({
          id: `rec-${Date.now()}-3`,
          category: 'accuracy',
          title: 'Reduce Error Rate',
          description: 'Error rate is above acceptable thresholds',
          priority: 'critical',
          impact: 90,
          effort: 80,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      
      this.recommendations.push(...recommendations);
      logger.info(`Generated ${recommendations.length} improvement recommendations`);
      
      return recommendations;
    } catch (error) {
      logger.error('Error generating improvement recommendations:', error);
      return [];
    }
  }

  // Slash Command Methods
  async getSlashCommands(filter?: {
    category?: string;
    isActive?: boolean;
  }): Promise<SlashCommand[]> {
    this.logMethodCall('getSlashCommands', { filter });
    
    try {
      // Refresh cache if it's stale
      if (Date.now() - this.lastCacheUpdate > this.cacheTimeout) {
        await this.refreshCommandCache();
      }

      let commands = Array.from(this.commandCache.values());

      // Apply filters
      if (filter) {
        commands = this.filterCommands(commands, filter);
      }

      return commands;
    } catch (error) {
      logger.error('Error getting slash commands:', error);
      return this.getStaticCommands();
    }
  }

  async trackCommandUsage(usage: {
    commandSlug: string;
    userId: string;
    timestamp: Date;
    context?: Record<string, any>;
  }): Promise<void> {
    this.logMethodCall('trackCommandUsage', { usage });
    
    try {
      // Update usage count in database
      const result = await updateOne('ai_action_card_templates', usage.commandSlug, {
        usage_count: 1, // Simplified for now - would need to get current count and increment
        last_used: usage.timestamp.toISOString(),
      });

      if (!result.success) {
        logger.error('Error tracking command usage:', result.error);
      }
    } catch (error) {
      logger.error('Error tracking command usage:', error);
    }
  }

  async searchCommands(query: string, limit: number = 10): Promise<SlashCommand[]> {
    this.logMethodCall('searchCommands', { query, limit });
    
    try {
      const commands = await this.getSlashCommands();
      
      if (!query.trim()) {
        return commands.slice(0, limit);
      }

      const queryLower = query.toLowerCase();
      const scoredCommands = commands.map(command => {
        let score = 0;
        
        // Exact matches get highest score
        if (command.slug === queryLower) score += 100;
        if (command.title.toLowerCase() === queryLower) score += 90;
        
        // Partial matches
        if (command.slug.includes(queryLower)) score += 50;
        if (command.title.toLowerCase().includes(queryLower)) score += 40;
        if (command.description?.toLowerCase().includes(queryLower)) score += 30;
        
        // Category matches
        if (command.category?.toLowerCase().includes(queryLower)) score += 20;
        
        return { command, score };
      });

      return scoredCommands
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(item => item.command);
    } catch (error) {
      logger.error('Error searching commands:', error);
      return [];
    }
  }

  // Private helper methods
  private initializeDefaultAgents(): void {
    const defaultAgents: Agent[] = [
      {
        id: 'executive-agent',
        name: 'Executive Agent',
        type: 'executive',
        description: 'High-level strategic decision making and business oversight',
        capabilities: ['strategy', 'planning', 'leadership', 'decision-making'],
        tools: [],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'analyst-agent',
        name: 'Analyst Agent',
        type: 'analyst',
        description: 'Data analysis and insights generation',
        capabilities: ['data-analysis', 'reporting', 'insights', 'metrics'],
        tools: [],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'assistant-agent',
        name: 'Assistant Agent',
        type: 'assistant',
        description: 'General task assistance and productivity support',
        capabilities: ['task-management', 'productivity', 'communication', 'organization'],
        tools: [],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'specialist-agent',
        name: 'Specialist Agent',
        type: 'specialist',
        description: 'Domain-specific expertise and specialized tasks',
        capabilities: ['specialized-tasks', 'domain-expertise', 'technical-support'],
        tools: [],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    defaultAgents.forEach(agent => {
      this.agents.set(agent.id, agent);
    });
  }

  private async processAIRequest(operation: AIOperation) {
    // Mock AI processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const response = `AI response to: ${operation.prompt}`;
    const tokensUsed = Math.floor(Math.random() * 100) + 50;
    const cost = tokensUsed * 0.00003;
    
    return {
      output_data: {
        response,
        model: operation.model,
        tokens_used: tokensUsed,
        cost,
        processing_time: 1000,
      },
      tokens_used: tokensUsed,
      cost,
      processing_time: 1000,
    };
  }

  private async processAnalysis(operation: AIOperation) {
    // Mock analysis processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const analysis = {
      insights: ['Key insight 1', 'Key insight 2', 'Key insight 3'],
      recommendations: ['Recommendation 1', 'Recommendation 2'],
      trends: ['Trend 1', 'Trend 2'],
    };
    
    const tokensUsed = Math.floor(Math.random() * 200) + 100;
    const cost = tokensUsed * 0.00003;
    
    return {
      output_data: analysis,
      tokens_used: tokensUsed,
      cost,
      processing_time: 2000,
    };
  }

  private async processInsights(operation: AIOperation) {
    // Mock insights processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const insights = {
      business_insights: ['Insight 1', 'Insight 2'],
      opportunities: ['Opportunity 1', 'Opportunity 2'],
      risks: ['Risk 1', 'Risk 2'],
      next_steps: ['Step 1', 'Step 2'],
    };
    
    const tokensUsed = Math.floor(Math.random() * 150) + 75;
    const cost = tokensUsed * 0.00003;
    
    return {
      output_data: insights,
      tokens_used: tokensUsed,
      cost,
      processing_time: 1500,
    };
  }

  private async processTraining(operation: AIOperation) {
    // Mock training processing
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const training = {
      model_performance: { accuracy: 0.95, precision: 0.92, recall: 0.89 },
      training_metrics: { epochs: 100, loss: 0.05, validation_accuracy: 0.93 },
      model_artifacts: ['model.pkl', 'config.json', 'vocabulary.txt'],
    };
    
    const tokensUsed = Math.floor(Math.random() * 500) + 250;
    const cost = tokensUsed * 0.00003;
    
    return {
      output_data: training,
      tokens_used: tokensUsed,
      cost,
      processing_time: 5000,
    };
  }

  private calculateModelPerformance(operations: AIOperation[]) {
    const completed = operations.filter(op => op.status === 'completed');
    const failed = operations.filter(op => op.status === 'failed');
    
    return {
      total_operations: operations.length,
      success_rate: completed.length / operations.length,
      average_tokens: completed.reduce((sum, op) => sum + (op.tokens_used || 0), 0) / completed.length,
      average_cost: completed.reduce((sum, op) => sum + (op.cost || 0), 0) / completed.length,
      average_processing_time: completed.reduce((sum, op) => sum + (op.processing_time || 0), 0) / completed.length,
      error_count: failed.length,
    };
  }

  private calculateUsageStats(operations: AIOperation[]) {
    const completed = operations.filter(op => op.status === 'completed');
    
    return {
      totalOperations: operations.length,
      totalCost: completed.reduce((sum, op) => sum + (op.cost || 0), 0),
      totalTokens: completed.reduce((sum, op) => sum + (op.tokens_used || 0), 0),
      averageTokensPerOperation: completed.length > 0 ? completed.reduce((sum, op) => sum + (op.tokens_used || 0), 0) / completed.length : 0,
      averageCostPerOperation: completed.length > 0 ? completed.reduce((sum, op) => sum + (op.cost || 0), 0) / completed.length : 0,
    };
  }

  // Embedding functionality (delegates to NexusAIGatewayService)
  async generateEmbedding(text: string, model: string = 'text-embedding-3-small') {
    this.logMethodCall('generateEmbedding', { text: text.substring(0, 100), model });
    try {
      const res = await this.gateway.generateEmbeddings({ text, model, tenantId: this.defaultTenantId });
      if (!res.success || !res.data) return { success: false, error: res.error || 'Embedding failed' };
      return { success: true, data: res.data.embedding };
    } catch (error) {
      this.logError('generateEmbedding', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async embedCompanyProfile(companyId: string, profileData: {
    tagline?: string;
    motto?: string;
    mission_statement?: string;
    vision_statement?: string;
    about_md?: string;
  }) {
    this.logMethodCall('embedCompanyProfile', { companyId });
    
    try {
      // Combine profile text
      const combinedText = [
        profileData.tagline,
        profileData.motto,
        profileData.mission_statement,
        profileData.vision_statement,
        profileData.about_md,
      ]
        .filter(Boolean)
        .join('\n\n');

      if (!combinedText.trim()) {
        return { success: false, error: 'No content to embed' };
      }

      // Generate embedding
      const embeddingResult = await this.generateEmbedding(combinedText);
      
      if (embeddingResult.success && embeddingResult.data) {
        // Store embedding in company profiles table
        const result = await updateOne('ai_company_profiles', companyId, { 
          content_embedding: embeddingResult.data 
        });

        if (!result.success) {
          this.logError('embedCompanyProfile', result.error);
          return { success: false, error: result.error };
        }

        return { success: true, data: { profile_id: companyId } };
      }
      
      return embeddingResult;
    } catch (error) {
      this.logError('embedCompanyProfile', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async processEmbeddingRequest(operation: AIOperation) {
    // Deprecated: embeddings now delegated to NexusAIGatewayService
    const res = await this.gateway.generateEmbeddings({ text: operation.prompt || '', tenantId: this.defaultTenantId });
    if (!res.success || !res.data) return new Array(1536).fill(0);
    await this.update(operation.id!, {
      ...operation,
      output_data: { embedding: res.data.embedding },
      status: 'completed' as const,
      tokens_used: (res.data.tokens?.prompt || 0) + (res.data.tokens?.completion || 0),
      cost: 0,
      processing_time: res.data.latencyMs || 0,
      updated_at: new Date().toISOString(),
    });
    return res.data.embedding;
  }

  private async refreshCommandCache(): Promise<void> {
    try {
      // First try to get all commands without filter to see if table exists
      const result = await select('ai_action_card_templates', 
        'slug, title, description, category, template_data, is_active, usage_count, last_used',
        {}
      );

      // Check if we have data, even if success is false
      if (result.data && result.data.length > 0) {
        // We have data, proceed with processing
        logger.info(`Found ${result.data.length} slash commands in database`);
      } else if (!result.success) {
        logger.error('Failed to fetch slash commands from database:', { error: result.error, details: result });
        this.loadStaticCommands();
        return;
      } else {
        // No data and no error, table might be empty
        logger.warn('No slash commands found in database');
        this.loadStaticCommands();
        return;
      }

      // Filter active commands in memory
      const activeCommands = result.data.filter(cmd => cmd.is_active !== false);

      if (activeCommands.length === 0) {
        logger.warn('No active slash commands found in database, initializing default commands');
        await this.initializeDefaultCommands();
        this.loadStaticCommands();
        return;
      }

      this.commandCache.clear();
      activeCommands.forEach(template => {
        this.commandCache.set(template.slug, {
          slug: template.slug,
          title: template.title,
          description: template.description || undefined,
          category: template.category || undefined,
          templateData: template.template_data || undefined,
          isActive: template.is_active ?? true,
          usageCount: template.usage_count || 0,
          lastUsed: template.last_used ? new Date(template.last_used).toISOString() : undefined,
        });
      });

      this.lastCacheUpdate = Date.now();
      logger.info(`Loaded ${this.commandCache.size} slash commands into cache`);
    } catch (error) {
      logger.error('Error refreshing command cache:', error);
      this.loadStaticCommands();
    }
  }

  private loadStaticCommands(): void {
    const staticCommands = this.getStaticCommands();
    staticCommands.forEach(command => {
      this.commandCache.set(command.slug, command);
    });
    logger.info('Loaded static slash commands');
  }

  private async initializeDefaultCommands(): Promise<void> {
    try {
      const defaultCommands = [
        {
          slug: 'analyze',
          title: 'Analyze Data',
          description: 'Analyze data and generate insights',
          category: 'analysis',
          template_data: { type: 'analysis', prompt: 'Analyze the following data and provide insights:' },
          is_active: true,
          usage_count: 0,
        },
        {
          slug: 'generate',
          title: 'Generate Content',
          description: 'Generate content based on prompts',
          category: 'generation',
          template_data: { type: 'generation', prompt: 'Generate content for:' },
          is_active: true,
          usage_count: 0,
        },
        {
          slug: 'summarize',
          title: 'Summarize',
          description: 'Summarize text or data',
          category: 'analysis',
          template_data: { type: 'summary', prompt: 'Summarize the following:' },
          is_active: true,
          usage_count: 0,
        },
        {
          slug: 'plan',
          title: 'Create Plan',
          description: 'Create a structured plan',
          category: 'planning',
          template_data: { type: 'planning', prompt: 'Create a plan for:' },
          is_active: true,
          usage_count: 0,
        },
        {
          slug: 'research',
          title: 'Research',
          description: 'Research a topic or question',
          category: 'research',
          template_data: { type: 'research', prompt: 'Research the following topic:' },
          is_active: true,
          usage_count: 0,
        },
      ];

      for (const command of defaultCommands) {
        await insertOne('ai_action_card_templates', command);
      }

      logger.info(`Initialized ${defaultCommands.length} default slash commands`);
    } catch (error) {
      logger.error('Error initializing default commands:', error);
    }
  }

  private getStaticCommands(): SlashCommand[] {
    return [
      {
        slug: 'analyze',
        title: 'Analyze Data',
        description: 'Analyze data and generate insights',
        category: 'analysis',
        isActive: true,
        usageCount: 0,
      },
      {
        slug: 'generate',
        title: 'Generate Content',
        description: 'Generate content based on prompts',
        category: 'generation',
        isActive: true,
        usageCount: 0,
      },
      {
        slug: 'summarize',
        title: 'Summarize',
        description: 'Summarize text or data',
        category: 'analysis',
        isActive: true,
        usageCount: 0,
      },
      {
        slug: 'plan',
        title: 'Create Plan',
        description: 'Create a structured plan',
        category: 'planning',
        isActive: true,
        usageCount: 0,
      },
      {
        slug: 'research',
        title: 'Research',
        description: 'Research a topic or question',
        category: 'research',
        isActive: true,
        usageCount: 0,
      },
    ];
  }

  private filterCommands(commands: SlashCommand[], filter: {
    category?: string;
    isActive?: boolean;
  }): SlashCommand[] {
    return commands.filter(command => {
      if (filter.category && command.category !== filter.category) {
        return false;
      }
      if (filter.isActive !== undefined && command.isActive !== filter.isActive) {
        return false;
      }
      return true;
    });
  }

  private getStartDate(timeframe: string): string {
    const now = new Date();
    switch (timeframe) {
      case 'day':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    }
  }

  // ============================================================================
  // TOOL MANAGEMENT (Merged from aiAgentWithTools)
  // ============================================================================

  /**
   * Get all available tools
   */
  async getAllTools(): Promise<ServiceResponse<Tool[]>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('getAllTools');

      // Get tools from database
      const result = await select('ai_tools', '*', {});

      if (!result.success) {
        // Fallback to mock tools if database fails
        const mockTools = this.getDefaultTools();
        return { data: mockTools, error: null };
      }

      const validatedData = result.data.map(item => ToolSchema.parse(item));
      return { data: validatedData, error: null };
    }, `get all tools`);
  }

  /**
   * Get tool by ID
   */
  async getToolById(id: string): Promise<ServiceResponse<Tool | null>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('getToolById', { id });

      const result = await selectOne('ai_tools', id);
      
      if (!result.success || !result.data) {
        return { data: null, error: null };
      }

      const validatedData = ToolSchema.parse(result.data);
      return { data: validatedData, error: null };
    }, `get tool by id`);
  }

  /**
   * Get tools by category
   */
  async getToolsByCategory(category: Tool['category']): Promise<ServiceResponse<Tool[]>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('getToolsByCategory', { category });

      const result = await select('ai_tools', '*', {
        category
      });

      if (!result.success) {
        // Fallback to mock tools if database fails
        const mockTools = this.getDefaultTools().filter(tool => tool.category === category);
        return { data: mockTools, error: null };
      }

      const validatedData = result.data.map(item => ToolSchema.parse(item));
      return { data: validatedData, error: null };
    }, `get tools by category`);
  }

  /**
   * Execute a tool
   */
  async executeTool(toolId: string, agentId: string, parameters: Record<string, any>): Promise<ServiceResponse<ToolExecution>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('executeTool', { toolId, agentId, parameters });

      const execution: ToolExecution = {
        id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        toolId,
        agentId,
        parameters,
        result: null,
        status: 'pending',
        executionTime: 0,
        createdAt: new Date().toISOString(),
      };

      // Get tool details
      const toolResult = await this.getToolById(toolId);
      if (!toolResult.success || !toolResult.data) {
        execution.status = 'failed';
        execution.error = 'Tool not found';
        return { data: execution, error: null };
      }

      const tool = toolResult.data;
      execution.status = 'running';

      try {
        // Simulate tool execution
        const result = await this.simulateToolExecution(execution, tool, parameters);
        execution.result = result;
        execution.status = 'completed';
        execution.executionTime = Date.now() - new Date(execution.createdAt).getTime();
      } catch (error) {
        execution.status = 'failed';
        execution.error = error instanceof Error ? error.message : 'Unknown error';
      }

      // Save execution record
      await insertOne('ai_tool_executions', execution);

      return { data: execution, error: null };
    }, `execute tool`);
  }

  /**
   * Get execution history
   */
  async getExecutionHistory(agentId?: string, toolId?: string): Promise<ServiceResponse<ToolExecution[]>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('getExecutionHistory', { agentId, toolId });

      const filters: Record<string, any> = {};
      if (agentId) filters.agentId = agentId;
      if (toolId) filters.toolId = toolId;

      const result = await select('ai_tool_executions', '*', {
        ...filters
      });

      if (!result.success) {
        return { data: [], error: null };
      }

      const validatedData = result.data.map(item => ToolExecutionSchema.parse(item));
      return { data: validatedData, error: null };
    }, `get execution history`);
  }

  /**
   * Create a new tool
   */
  async createTool(tool: Omit<Tool, 'id' | 'createdAt' | 'updatedAt'>): Promise<ServiceResponse<Tool>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('createTool', { tool });

      const newTool: Tool = {
        ...tool,
        id: `tool_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const validatedData = ToolSchema.parse(newTool);
      const result = await insertOne('ai_tools', validatedData);

      if (!result.success) {
        return { data: null, error: 'Failed to create tool' };
      }

      return { data: validatedData, error: null };
    }, `create tool`);
  }

  /**
   * Update a tool
   */
  async updateTool(id: string, updates: Partial<Tool>): Promise<ServiceResponse<Tool | null>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('updateTool', { id, updates });

      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      const result = await updateOne('ai_tools', id, updateData);

      if (!result.success || !result.data) {
        return { data: null, error: 'Failed to update tool' };
      }

      const validatedData = ToolSchema.parse(result.data);
      return { data: validatedData, error: null };
    }, `update tool`);
  }

  /**
   * Get tools for a specific agent
   */
  async getAgentTools(agentId: string): Promise<ServiceResponse<Tool[]>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('getAgentTools', { agentId });

      // Get agent's tool IDs
      const agentResult = await this.getAgent(agentId);
      if (!agentResult.data) {
        return { data: [], error: null };
      }

      const agent = agentResult.data;
      const tools: Tool[] = [];

      // Get each tool
      for (const toolId of agent.tools) {
        const toolResult = await this.getToolById(toolId);
        if (toolResult.success && toolResult.data) {
          tools.push(toolResult.data);
        }
      }

      return { data: tools, error: null };
    }, `get agent tools`);
  }

  /**
   * Add tool to agent
   */
  async addToolToAgent(agentId: string, toolId: string): Promise<ServiceResponse<boolean>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('addToolToAgent', { agentId, toolId });

      // Get current agent
      const agentResult = await this.getAgent(agentId);
      if (!agentResult.data) {
        return { data: false, error: 'Agent not found' };
      }

      const agent = agentResult.data;
      if (agent.tools.includes(toolId)) {
        return { data: true, error: null }; // Tool already assigned
      }

      // Add tool to agent
      const updatedTools = [...agent.tools, toolId];
      const updateResult = await this.updateAgent(agentId, { tools: updatedTools });

      return { data: updateResult.success, error: updateResult.error };
    }, `add tool to agent`);
  }

  /**
   * Remove tool from agent
   */
  async removeToolFromAgent(agentId: string, toolId: string): Promise<ServiceResponse<boolean>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('removeToolFromAgent', { agentId, toolId });

      // Get current agent
      const agentResult = await this.getAgent(agentId);
      if (!agentResult.data) {
        return { data: false, error: 'Agent not found' };
      }

      const agent = agentResult.data;
      if (!agent.tools.includes(toolId)) {
        return { data: true, error: null }; // Tool not assigned
      }

      // Remove tool from agent
      const updatedTools = agent.tools.filter(id => id !== toolId);
      const updateResult = await this.updateAgent(agentId, { tools: updatedTools });

      return { data: updateResult.success, error: updateResult.error };
    }, `remove tool from agent`);
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Get default tools
   */
  private getDefaultTools(): Tool[] {
    return [
      {
        id: 'data-analyzer',
        name: 'Data Analyzer',
        description: 'Analyzes data and provides insights',
        category: 'data',
        isEnabled: true,
        parameters: { analysisType: 'comprehensive' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'email-composer',
        name: 'Email Composer',
        description: 'Composes professional emails',
        category: 'communication',
        isEnabled: true,
        parameters: { tone: 'professional' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'task-automator',
        name: 'Task Automator',
        description: 'Automates repetitive tasks',
        category: 'automation',
        isEnabled: true,
        parameters: { automationLevel: 'full' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'report-generator',
        name: 'Report Generator',
        description: 'Generates comprehensive reports',
        category: 'analysis',
        isEnabled: true,
        parameters: { reportType: 'executive' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'integration-connector',
        name: 'Integration Connector',
        description: 'Connects to external services',
        category: 'integration',
        isEnabled: true,
        parameters: { connectionType: 'api' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }

  /**
   * Simulate tool execution
   */
  private async simulateToolExecution(execution: ToolExecution, tool: Tool, parameters: Record<string, any>): Promise<any> {
    // Simulate different tool behaviors based on category
    switch (tool.category) {
      case 'data':
        return {
          analysis: 'Comprehensive data analysis completed',
          insights: ['Pattern detected', 'Trend identified', 'Anomaly found'],
          recommendations: ['Optimize process A', 'Focus on metric B'],
          confidence: 0.85
        };
      
      case 'communication':
        return {
          message: 'Professional email composed successfully',
          subject: 'Business Communication',
          body: 'This is a professionally composed email based on the provided context.',
          tone: parameters.tone || 'professional',
          wordCount: 150
        };
      
      case 'automation':
        return {
          tasksAutomated: 5,
          timeSaved: '2 hours',
          efficiency: 0.75,
          status: 'completed',
          details: 'Automated repetitive tasks successfully'
        };
      
      case 'analysis':
        return {
          report: 'Comprehensive analysis report generated',
          sections: ['Executive Summary', 'Key Findings', 'Recommendations'],
          charts: 3,
          insights: 8,
          confidence: 0.92
        };
      
      case 'integration':
        return {
          connection: 'External service connected successfully',
          dataSynced: true,
          recordsProcessed: 150,
          status: 'active',
          lastSync: new Date().toISOString()
        };
      
      default:
        return {
          result: 'Tool execution completed',
          status: 'success',
          timestamp: new Date().toISOString()
        };
    }
  }

  private generateTrends(timeframe: string): {
    accuracy: number[];
    responseTime: number[];
    satisfaction: number[];
  } {
    // Mock trend data - in real implementation, this would be calculated from historical data
    const days = timeframe === 'day' ? 24 : timeframe === 'week' ? 7 : 30;
    
    return {
      accuracy: Array.from({ length: days }, () => 0.8 + Math.random() * 0.2),
      responseTime: Array.from({ length: days }, () => 800 + Math.random() * 800),
      satisfaction: Array.from({ length: days }, () => 3.5 + Math.random() * 1.5),
    };
  }
}

// Export singleton instance
export const aiService = new AIService(); 
