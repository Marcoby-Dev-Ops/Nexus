/**
 * Consolidated AI Service
 * 
 * Merges functionality from multiple redundant AI services:
 * - AIService.ts (Core AI operations)
 * - AIInsightsService.ts (Business insights)
 * - AIFormAssistanceService.ts (Form assistance)
 * - advancedAIRecommendationEngine.ts (Recommendations)
 * - aiAgentWithTools.ts (Agent management)
 * - contextualDataCompletionService.ts (Data completion)
 * - crossDepartmentalContext.ts (Cross-departmental analysis)
 * - emailIntelligenceService.ts (Email analysis)
 * - FireCycleManagementService.ts (Fire cycle analysis)
 * - FireInitiativeService.ts (Initiative management)
 * - InsightFeedbackService.ts (Feedback processing)
 * - modelManager.ts (Model management)
 * - multiModalIntelligence.ts (Multi-modal processing)
 * - nexusUnifiedBrain.ts (Unified business intelligence)
 * - OnboardingInsightsService.ts (Onboarding analysis)
 * - ExpertKnowledgeService.ts (Expert knowledge)
 * - MentalModelsService.ts (Mental model analysis)
 * - NextBestActionService.ts (Action recommendations)
 * - PredictiveInsightsService.ts (Predictive analytics)
 * 
 * Provides unified AI capabilities with consistent patterns and reduced redundancy.
 */

import { z } from 'zod';
import { BaseService } from '../shared/BaseService';
import type { ServiceResponse } from '@/core/services/BaseService';
import { selectData, selectOne, insertOne, callRPC } from '@/lib/database';

// ============================================================================
// SCHEMAS
// ============================================================================

// Core AI Schemas
export const AIOperationSchema = z.object({
  id: z.string().optional(),
  user_id: z.string(),
  company_id: z.string().optional(),
  operation_type: z.enum(['chat', 'analysis', 'generation', 'training', 'prediction', 'insight', 'recommendation']),
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
  provider: z.string(),
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

// Agent Schemas
export const AgentSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['executive', 'analyst', 'assistant', 'specialist']),
  description: z.string(),
  capabilities: z.array(z.string()),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Insight and Recommendation Schemas
export const AIRecommendationSchema = z.object({
  id: z.string(),
  category: z.enum(['business', 'operational', 'strategic', 'tactical']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  title: z.string(),
  description: z.string(),
  impact: z.number(),
  confidence: z.number(),
  implementation: z.string(),
  expectedOutcome: z.string(),
  timeframe: z.string(),
  departments: z.array(z.string()),
  tags: z.array(z.string()),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const PredictiveInsightSchema = z.object({
  id: z.string(),
  type: z.enum(['revenue', 'efficiency', 'risk', 'opportunity', 'customer']),
  title: z.string(),
  description: z.string(),
  prediction: z.string(),
  confidence: z.number(),
  timeframe: z.string(),
  impact: z.object({
    value: z.string(),
    metric: z.string(),
    direction: z.enum(['positive', 'negative']),
  }),
  action: z.object({
    label: z.string(),
    description: z.string(),
    priority: z.enum(['immediate', 'high', 'medium', 'low']),
  }),
  data: z.object({
    historical: z.array(z.any()),
    current: z.any(),
    projected: z.any(),
  }),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

// Form Assistance Schemas
export const FormAssistanceSchema = z.object({
  id: z.string().optional(),
  user_id: z.string(),
  form_type: z.string(),
  form_data: z.record(z.any()),
  suggestions: z.array(z.string()),
  completion_percentage: z.number(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

// Feedback Schemas
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

// Type exports
export type AIOperation = z.infer<typeof AIOperationSchema>;
export type AIModel = z.infer<typeof AIModelSchema>;
export type AIConversation = z.infer<typeof AIConversationSchema>;
export type Agent = z.infer<typeof AgentSchema>;
export type AIRecommendation = z.infer<typeof AIRecommendationSchema>;
export type PredictiveInsight = z.infer<typeof PredictiveInsightSchema>;
export type FormAssistance = z.infer<typeof FormAssistanceSchema>;
export type UserFeedback = z.infer<typeof UserFeedbackSchema>;
export type ImprovementRecommendation = z.infer<typeof ImprovementRecommendationSchema>;

// ============================================================================
// CONSOLIDATED AI SERVICE
// ============================================================================

export class ConsolidatedAIService extends BaseService {
  protected config = {
    tableName: 'ai_operations',
    schema: AIOperationSchema,
    cacheTimeout: 300000, // 5 minutes
    retryAttempts: 3,
    retryDelay: 1000,
  };

  constructor() {
    super('ConsolidatedAIService');
  }

  // ========================================================================
  // CORE AI OPERATIONS
  // ========================================================================

  /**
   * Execute AI operation
   */
  async executeOperation(operation: Partial<AIOperation>): Promise<ServiceResponse<AIOperation>> {
    try {
      this.logMethodCall('executeOperation', { operationType: operation.operation_type });
      
      const validatedData = this.validateData(operation);
      if (!validatedData.isValid) {
        return this.createErrorResponse<AIOperation>(validatedData.error || 'Invalid operation data');
      }

      const result = await insertOne<AIOperation>('ai_operations', operation);
      if (!result.success || !result.data) {
        return this.createErrorResponse<AIOperation>(result.error || 'Failed to execute AI operation');
      }
      
      return this.createSuccessResponse(result.data);
    } catch (error) {
      return this.handleError(error, 'executeOperation');
    }
  }

  /**
   * Get AI operation by ID
   */
  async getOperation(id: string): Promise<ServiceResponse<AIOperation>> {
    try {
      this.logMethodCall('getOperation', { id });
      
      const result = await selectOne<AIOperation>('ai_operations', id);
      if (!result.success || !result.data) {
        return this.createErrorResponse<AIOperation>(result.error || 'Failed to fetch AI operation');
      }
      
      return this.createSuccessResponse(result.data);
    } catch (error) {
      return this.handleError(error, 'getOperation');
    }
  }

  /**
   * List AI operations with filters
   */
  async listOperations(filters?: Record<string, any>): Promise<ServiceResponse<AIOperation[]>> {
    try {
      this.logMethodCall('listOperations', { filters });
      
      const result = await selectData<AIOperation>('ai_operations', '*', filters || {});
      if (!result.success || !result.data) {
        return this.createErrorResponse<AIOperation[]>(result.error || 'Failed to fetch AI operations');
      }
      
      return this.createSuccessResponse(result.data);
    } catch (error) {
      return this.handleError(error, 'listOperations');
    }
  }

  // ========================================================================
  // MODEL MANAGEMENT
  // ========================================================================

  /**
   * Get available AI models
   */
  async getModels(): Promise<ServiceResponse<AIModel[]>> {
    try {
      this.logMethodCall('getModels');
      
      const result = await selectData<AIModel>('ai_models', '*', { status: 'active' });
      if (!result.success || !result.data) {
        return this.createErrorResponse<AIModel[]>(result.error || 'Failed to fetch AI models');
      }
      
      return this.createSuccessResponse(result.data);
    } catch (error) {
      return this.handleError(error, 'getModels');
    }
  }

  /**
   * Get model by ID
   */
  async getModel(id: string): Promise<ServiceResponse<AIModel>> {
    try {
      this.logMethodCall('getModel', { id });
      
      const result = await selectOne<AIModel>('ai_models', id);
      if (!result.success || !result.data) {
        return this.createErrorResponse<AIModel>(result.error || 'Failed to fetch AI model');
      }
      
      return this.createSuccessResponse(result.data);
    } catch (error) {
      return this.handleError(error, 'getModel');
    }
  }

  // ========================================================================
  // AGENT MANAGEMENT
  // ========================================================================

  /**
   * Get available agents
   */
  async getAgents(): Promise<ServiceResponse<Agent[]>> {
    try {
      this.logMethodCall('getAgents');
      
      const result = await selectData<Agent>('ai_agents', '*', { is_active: true });
      if (!result.success || !result.data) {
        return this.createErrorResponse<Agent[]>(result.error || 'Failed to fetch agents');
      }
      
      return this.createSuccessResponse(result.data);
    } catch (error) {
      return this.handleError(error, 'getAgents');
    }
  }

  /**
   * Get agent by ID
   */
  async getAgent(id: string): Promise<ServiceResponse<Agent>> {
    try {
      this.logMethodCall('getAgent', { id });
      
      const result = await selectOne<Agent>('ai_agents', id);
      if (!result.success || !result.data) {
        return this.createErrorResponse<Agent>(result.error || 'Failed to fetch agent');
      }
      
      return this.createSuccessResponse(result.data);
    } catch (error) {
      return this.handleError(error, 'getAgent');
    }
  }

  // ========================================================================
  // INSIGHTS AND RECOMMENDATIONS
  // ========================================================================

  /**
   * Generate AI recommendations
   */
  async generateRecommendations(context: Record<string, any>): Promise<ServiceResponse<AIRecommendation[]>> {
    try {
      this.logMethodCall('generateRecommendations', { contextKeys: Object.keys(context) });
      
      // Call AI gateway for recommendations
      const result = await callRPC<AIRecommendation[]>('generate_recommendations', {
        action: 'generate_recommendations',
        context
      });
      
      if (!result.success || !result.data) {
        return this.createErrorResponse<AIRecommendation[]>(result.error || 'Failed to generate recommendations');
      }
      
      return this.createSuccessResponse(result.data);
    } catch (error) {
      return this.handleError(error, 'generateRecommendations');
    }
  }

  /**
   * Generate predictive insights
   */
  async generatePredictiveInsights(data: Record<string, any>): Promise<ServiceResponse<PredictiveInsight[]>> {
    try {
      this.logMethodCall('generatePredictiveInsights', { dataKeys: Object.keys(data) });
      
      // Call AI gateway for predictive insights
      const result = await callRPC<PredictiveInsight[]>('generate_predictive_insights', {
        action: 'generate_predictive_insights',
        data
      });
      
      if (!result.success || !result.data) {
        return this.createErrorResponse<PredictiveInsight[]>(result.error || 'Failed to generate predictive insights');
      }
      
      return this.createSuccessResponse(result.data);
    } catch (error) {
      return this.handleError(error, 'generatePredictiveInsights');
    }
  }

  /**
   * Get next best actions
   */
  async getNextBestActions(userId: string, context?: Record<string, any>): Promise<ServiceResponse<AIRecommendation[]>> {
    try {
      this.logMethodCall('getNextBestActions', { userId, context });
      
      const result = await callRPC<AIRecommendation[]>('get_next_best_actions', {
        action: 'get_next_best_actions',
        userId,
        context
      });
      
      if (!result.success || !result.data) {
        return this.createErrorResponse<AIRecommendation[]>(result.error || 'Failed to get next best actions');
      }
      
      return this.createSuccessResponse(result.data);
    } catch (error) {
      return this.handleError(error, 'getNextBestActions');
    }
  }

  // ========================================================================
  // FORM ASSISTANCE
  // ========================================================================

  /**
   * Provide form assistance
   */
  async provideFormAssistance(formData: Partial<FormAssistance>): Promise<ServiceResponse<FormAssistance>> {
    try {
      this.logMethodCall('provideFormAssistance', { formType: formData.form_type });
      
      const validatedData = this.validateData(formData);
      if (!validatedData.isValid) {
        return this.createErrorResponse<FormAssistance>(validatedData.error || 'Invalid form data');
      }

      const result = await insertOne<FormAssistance>('form_assistance', formData);
      if (!result.success || !result.data) {
        return this.createErrorResponse<FormAssistance>(result.error || 'Failed to provide form assistance');
      }
      
      return this.createSuccessResponse(result.data);
    } catch (error) {
      return this.handleError(error, 'provideFormAssistance');
    }
  }

  /**
   * Complete form data contextually
   */
  async completeFormData(formType: string, partialData: Record<string, any>): Promise<ServiceResponse<Record<string, any>>> {
    try {
      this.logMethodCall('completeFormData', { formType });
      
      const result = await callRPC<Record<string, any>>('complete_form_data', {
        action: 'complete_form_data',
        formType,
        partialData
      });
      
      if (!result.success || !result.data) {
        return this.createErrorResponse<Record<string, any>>(result.error || 'Failed to complete form data');
      }
      
      return this.createSuccessResponse(result.data);
    } catch (error) {
      return this.handleError(error, 'Failed to complete form data');
    }
  }

  // ========================================================================
  // FEEDBACK AND IMPROVEMENT
  // ========================================================================

  /**
   * Submit user feedback
   */
  async submitFeedback(feedback: Partial<UserFeedback>): Promise<ServiceResponse<UserFeedback>> {
    try {
      this.logMethodCall('submitFeedback', { agentId: feedback.agentId });
      
      const validatedData = this.validateData(feedback);
      if (!validatedData.isValid) {
        return this.createErrorResponse<UserFeedback>(validatedData.error || 'Invalid feedback data');
      }

      const result = await insertOne<UserFeedback>('user_feedback', feedback);
      if (!result.success || !result.data) {
        return this.createErrorResponse<UserFeedback>(result.error || 'Failed to submit feedback');
      }
      
      return this.createSuccessResponse(result.data);
    } catch (error) {
      return this.handleError(error, 'Failed to submit feedback');
    }
  }

  /**
   * Get improvement recommendations
   */
  async getImprovementRecommendations(): Promise<ServiceResponse<ImprovementRecommendation[]>> {
    try {
      this.logMethodCall('getImprovementRecommendations');
      
      const result = await selectData<ImprovementRecommendation>('improvement_recommendations', '*', { status: 'pending' });
      if (!result.success || !result.data) {
        return this.createErrorResponse<ImprovementRecommendation[]>(result.error || 'Failed to fetch improvement recommendations');
      }
      
      return this.createSuccessResponse(result.data);
    } catch (error) {
      return this.handleError(error, 'Failed to get improvement recommendations');
    }
  }

  // ========================================================================
  // CROSS-DEPARTMENTAL ANALYSIS
  // ========================================================================

  /**
   * Analyze cross-departmental context
   */
  async analyzeCrossDepartmentalContext(departments: string[]): Promise<ServiceResponse<Record<string, any>>> {
    try {
      this.logMethodCall('analyzeCrossDepartmentalContext', { departments });
      
      const result = await callRPC<Record<string, any>>('analyze_cross_departmental_context', {
        action: 'analyze_cross_departmental_context',
        departments
      });
      
      if (!result.success || !result.data) {
        return this.createErrorResponse<Record<string, any>>(result.error || 'Failed to analyze cross-departmental context');
      }
      
      return this.createSuccessResponse(result.data);
    } catch (error) {
      return this.handleError(error, 'analyzeCrossDepartmentalContext');
    }
  }

  // ========================================================================
  // EMAIL INTELLIGENCE
  // ========================================================================

  /**
   * Analyze email content
   */
  async analyzeEmail(emailContent: string): Promise<ServiceResponse<Record<string, any>>> {
    try {
      this.logMethodCall('analyzeEmail', { contentLength: emailContent.length });
      
      const result = await callRPC<Record<string, any>>('analyze_email', {
        action: 'analyze_email',
        emailContent
      });
      
      if (!result.success || !result.data) {
        return this.createErrorResponse<Record<string, any>>(result.error || 'Failed to analyze email');
      }
      
      return this.createSuccessResponse(result.data);
    } catch (error) {
      return this.handleError(error, 'analyzeEmail');
    }
  }

  // ========================================================================
  // FIRE CYCLE MANAGEMENT
  // ========================================================================

  /**
   * Analyze fire cycle
   */
  async analyzeFireCycle(cycleData: Record<string, any>): Promise<ServiceResponse<Record<string, any>>> {
    try {
      this.logMethodCall('analyzeFireCycle', { cycleDataKeys: Object.keys(cycleData) });
      
      const result = await callRPC<Record<string, any>>('analyze_fire_cycle', {
        action: 'analyze_fire_cycle',
        cycleData
      });
      
      if (!result.success || !result.data) {
        return this.createErrorResponse<Record<string, any>>(result.error || 'Failed to analyze fire cycle');
      }
      
      return this.createSuccessResponse(result.data);
    } catch (error) {
      return this.handleError(error, 'analyzeFireCycle');
    }
  }

  /**
   * Manage fire initiatives
   */
  async manageFireInitiatives(initiativeData: Record<string, any>): Promise<ServiceResponse<Record<string, any>>> {
    try {
      this.logMethodCall('manageFireInitiatives', { initiativeDataKeys: Object.keys(initiativeData) });
      
      const result = await callRPC<Record<string, any>>('manage_fire_initiatives', {
        action: 'manage_fire_initiatives',
        initiativeData
      });
      
      if (!result.success || !result.data) {
        return this.createErrorResponse<Record<string, any>>(result.error || 'Failed to manage fire initiatives');
      }
      
      return this.createSuccessResponse(result.data);
    } catch (error) {
      return this.handleError(error, 'manageFireInitiatives');
    }
  }

  // ========================================================================
  // ONBOARDING INSIGHTS
  // ========================================================================

  /**
   * Generate onboarding insights
   */
  async generateOnboardingInsights(userId: string): Promise<ServiceResponse<Record<string, any>>> {
    try {
      this.logMethodCall('generateOnboardingInsights', { userId });
      
      const result = await callRPC<Record<string, any>>('generate_onboarding_insights', {
        action: 'generate_onboarding_insights',
        userId
      });
      
      if (!result.success || !result.data) {
        return this.createErrorResponse<Record<string, any>>(result.error || 'Failed to generate onboarding insights');
      }
      
      return this.createSuccessResponse(result.data);
    } catch (error) {
      return this.handleError(error, 'generateOnboardingInsights');
    }
  }

  // ========================================================================
  // EXPERT KNOWLEDGE
  // ========================================================================

  /**
   * Get expert knowledge
   */
  async getExpertKnowledge(domain: string, query: string): Promise<ServiceResponse<Record<string, any>>> {
    try {
      this.logMethodCall('getExpertKnowledge', { domain, query });
      
      const result = await callRPC<Record<string, any>>('get_expert_knowledge', {
        action: 'get_expert_knowledge',
        domain,
        query
      });
      
      if (!result.success || !result.data) {
        return this.createErrorResponse<Record<string, any>>(result.error || 'Failed to get expert knowledge');
      }
      
      return this.createSuccessResponse(result.data);
    } catch (error) {
      return this.handleError(error, 'getExpertKnowledge');
    }
  }

  // ========================================================================
  // MENTAL MODELS
  // ========================================================================

  /**
   * Apply mental models
   */
  async applyMentalModels(context: Record<string, any>): Promise<ServiceResponse<Record<string, any>>> {
    try {
      this.logMethodCall('applyMentalModels', { contextKeys: Object.keys(context) });
      
      const result = await callRPC<Record<string, any>>('apply_mental_models', {
        action: 'apply_mental_models',
        context
      });
      
      if (!result.success || !result.data) {
        return this.createErrorResponse<Record<string, any>>(result.error || 'Failed to apply mental models');
      }
      
      return this.createSuccessResponse(result.data);
    } catch (error) {
      return this.handleError(error, 'applyMentalModels');
    }
  }

  // ========================================================================
  // MULTI-MODAL INTELLIGENCE
  // ========================================================================

  /**
   * Process multi-modal content
   */
  async processMultiModalContent(content: Record<string, any>): Promise<ServiceResponse<Record<string, any>>> {
    try {
      this.logMethodCall('processMultiModalContent', { contentType: content.type });
      
      const result = await callRPC<Record<string, any>>('process_multi_modal_content', {
        action: 'process_multi_modal_content',
        content
      });
      
      if (!result.success || !result.data) {
        return this.createErrorResponse<Record<string, any>>(result.error || 'Failed to process multi-modal content');
      }
      
      return this.createSuccessResponse(result.data);
    } catch (error) {
      return this.handleError(error, 'processMultiModalContent');
    }
  }

  // ========================================================================
  // UNIFIED BUSINESS INTELLIGENCE
  // ========================================================================

  /**
   * Get unified business intelligence
   */
  async getUnifiedBusinessIntelligence(companyId: string): Promise<ServiceResponse<Record<string, any>>> {
    try {
      this.logMethodCall('getUnifiedBusinessIntelligence', { companyId });
      
      const result = await callRPC<Record<string, any>>('get_unified_business_intelligence', {
        action: 'get_unified_business_intelligence',
        companyId
      });
      
      if (!result.success || !result.data) {
        return this.createErrorResponse<Record<string, any>>(result.error || 'Failed to get unified business intelligence');
      }
      
      return this.createSuccessResponse(result.data);
    } catch (error) {
      return this.handleError(error, 'getUnifiedBusinessIntelligence');
    }
  }
}

// Export singleton instance
export const consolidatedAIService = new ConsolidatedAIService();
