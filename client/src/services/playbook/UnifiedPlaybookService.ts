/**
 * Playbook Service
 * 
 * Manages step-by-step business plans (templates):
 * - Playbook templates (blueprints for business tasks)
 * - Playbook items (individual steps in plans)
 * - User playbook progress (tracking playbook execution)
 * 
 * Focus: Creating and managing detailed step-by-step plans that users should carry out
 */

import { z } from 'zod';
import { BaseService } from '../shared/BaseService';
import type { ServiceResponse } from '@/core/services/BaseService';
import { logger } from '@/shared/utils/logger';
import { 
  selectData, 
  selectOne, 
  insertOne, 
  updateOne, 
  upsertOne, 
  deleteOne 
} from '@/lib/api-client';

// ============================================================================
// UNIFIED SCHEMAS
// ============================================================================

// Playbook Template Schema
export const PlaybookTemplateSchema = z.object({
  id: z.string(),
  title: z.string(), // Main title of the playbook
  name: z.string(), // Keep for backward compatibility
  description: z.string(),
  purpose: z.string(), // Clear purpose/objective of the playbook
  category: z.enum(['onboarding', 'business', 'operational', 'strategic', 'tactical']),
  version: z.string(),
  estimatedDuration: z.number(), // minutes
  complexity: z.enum(['beginner', 'intermediate', 'advanced']),
  isActive: z.boolean(),
  requirements: z.array(z.string()).optional(), // Prerequisites and requirements
  assignedCompany: z.string().optional(), // Company ID this playbook is assigned to
  assignedUser: z.string().optional(), // User ID this playbook is assigned to
  steps: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    stepType: z.enum(['step', 'task', 'milestone', 'checklist']),
    isRequired: z.boolean(),
    order: z.number(),
    estimatedDuration: z.number(),
    validationSchema: z.record(z.any()).optional(),
    metadata: z.record(z.any()).optional()
  })),
  prerequisites: z.array(z.string()).optional(), // Keep for backward compatibility
  successMetrics: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

// User Playbook Progress Schema (Execution Tracking)
export const UserPlaybookProgressSchema = z.object({
  id: z.string(),
  userId: z.string(),
  organizationId: z.string(),
  playbookId: z.string(),
  status: z.enum(['not_started', 'in_progress', 'completed', 'paused']),
  currentItemId: z.string().optional(),
  progressPercentage: z.number(),
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

// User Playbook Response Schema
export const UserPlaybookResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  organizationId: z.string(),
  playbookId: z.string(),
  itemId: z.string(),
  responseData: z.record(z.any()),
  completedAt: z.string(),
  createdAt: z.string()
});

export type PlaybookTemplate = z.infer<typeof PlaybookTemplateSchema>;
export type UserPlaybookProgress = z.infer<typeof UserPlaybookProgressSchema>;
export type UserPlaybookResponse = z.infer<typeof UserPlaybookResponseSchema>;

// ============================================================================
// ONBOARDING TEMPLATE (Now loaded from database)
// ============================================================================

// ============================================================================
// PLAYBOOK SERVICE
// ============================================================================

export class PlaybookService extends BaseService {
  private static instance: PlaybookService;

  constructor() {
    super('PlaybookService');
  }

  public static getInstance(): PlaybookService {
    if (!PlaybookService.instance) {
      PlaybookService.instance = new PlaybookService();
    }
    return PlaybookService.instance;
  }

  // ============================================================================
  // PLAYBOOK TEMPLATE OPERATIONS
  // ============================================================================

  /**
   * Get all available playbook templates
   */
  async getPlaybookTemplates(): Promise<ServiceResponse<PlaybookTemplate[]>> {
    try {
      // Query database for playbook templates
      const { data: templates, error } = await selectData<PlaybookTemplate>(
        'playbook_templates',
        undefined, // columns - undefined means all columns
        { is_active: true } // filters
      );

      if (error) {
        logger.error('Failed to get playbook templates:', error);
        return this.createErrorResponse('Failed to get playbook templates');
      }

      // Debug logging to understand the response structure
      logger.info('Playbook templates response:', { 
        templatesType: typeof templates, 
        isArray: Array.isArray(templates), 
        templatesValue: templates 
      });

      // Handle different response structures
      let templatesArray: any[] = [];
      if (templates) {
        if (Array.isArray(templates)) {
          templatesArray = templates;
        } else if (typeof templates === 'object' && 'data' in templates && Array.isArray(templates.data)) {
          templatesArray = templates.data;
        } else if (typeof templates === 'object' && 'success' in templates && templates.success && 'data' in templates && Array.isArray(templates.data)) {
          templatesArray = templates.data;
        } else {
          logger.warn('Unexpected templates response structure:', templates);
        }
      }

      // Transform database results to match our schema
      const transformedTemplates = await Promise.all(
        templatesArray.map(async (template) => {
          const items = await this.getPlaybookItems(template.id);
          return this.transformTemplateFromDB(template, items.data || []);
        })
      );

      return this.createSuccessResponse(transformedTemplates);
    } catch (error) {
      return this.handleError(error, 'get playbook templates');
    }
  }

  /**
   * Create a new playbook template
   */
  async createPlaybookTemplate(
    templateData: Omit<PlaybookTemplate, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ServiceResponse<PlaybookTemplate>> {
    try {
      // Insert playbook template
      const templateRecord = {
        title: templateData.title,
        name: templateData.name,
        description: templateData.description,
        purpose: templateData.purpose,
        category: templateData.category,
        version: templateData.version,
        estimated_duration_hours: Math.ceil(templateData.estimatedDuration / 60),
        complexity: templateData.complexity,
        requirements: templateData.requirements || [],
        assigned_company: templateData.assignedCompany,
        assigned_user: templateData.assignedUser,
        prerequisites: templateData.prerequisites || [],
        success_metrics: templateData.successMetrics || [],
        tags: templateData.tags || [],
        is_active: templateData.isActive
      };

      const { data: savedTemplate, error: templateError } = await insertOne(
        'playbook_templates',
        templateRecord
      );

      if (templateError) {
        logger.error('Failed to create playbook template:', templateError);
        return this.createErrorResponse('Failed to create playbook template');
      }

      // Insert playbook items
      for (const step of templateData.steps) {
        const itemRecord = {
          playbook_id: savedTemplate.id,
          name: step.title,
          description: step.description,
          item_type: step.stepType,
          order_index: step.order,
          is_required: step.isRequired,
          estimated_duration_minutes: step.estimatedDuration,
          validation_schema: step.validationSchema || {},
          component_name: step.metadata?.component || null,
          metadata: step.metadata || {}
        };

        const { error: itemError } = await insertOne(
          'playbook_items',
          itemRecord
        );

        if (itemError) {
          logger.error('Failed to create playbook item:', itemError);
          return this.createErrorResponse('Failed to create playbook item');
        }
      }

      // Return the created template
      const createdTemplate = await this.getPlaybookTemplate(savedTemplate.id);
      return createdTemplate;
    } catch (error) {
      return this.handleError(error, `create playbook template ${templateData.name}`);
    }
  }

  /**
   * Get a specific playbook template by ID
   */
  async getPlaybookTemplate(templateId: string): Promise<ServiceResponse<PlaybookTemplate | null>> {
    try {
      // Query database for template
      const { data: template, error } = await selectOne(
        'playbook_templates',
        { id: templateId }
      );

      if (error || !template) {
        return this.createSuccessResponse(null);
      }

      const itemsResponse = await this.getPlaybookItems(templateId);
      const transformedTemplate = this.transformTemplateFromDB(template, itemsResponse.data || []);

      return this.createSuccessResponse(transformedTemplate);
    } catch (error) {
      return this.handleError(error, `get playbook template ${templateId}`);
    }
  }

  /**
   * Get playbook items for a template
   */
  private async getPlaybookItems(templateId: string): Promise<ServiceResponse<any[]>> {
    try {
      const { data: items, error } = await selectData({
        table: 'playbook_items',
        filters: { playbook_id: templateId },
        orderBy: [{ column: 'order_index', ascending: true }]
      });

      if (error) {
        logger.error('Failed to get playbook items:', error);
        return this.createErrorResponse('Failed to get playbook items');
      }

      // Debug logging to understand the response structure
      logger.info('Playbook items response:', { 
        itemsType: typeof items, 
        isArray: Array.isArray(items), 
        itemsValue: items 
      });

      // Handle different response structures
      let itemsArray: any[] = [];
      if (items) {
        if (Array.isArray(items)) {
          itemsArray = items;
        } else if (typeof items === 'object' && 'data' in items && Array.isArray(items.data)) {
          itemsArray = items.data;
        } else if (typeof items === 'object' && 'success' in items && items.success && 'data' in items && Array.isArray(items.data)) {
          itemsArray = items.data;
        } else {
          logger.warn('Unexpected items response structure:', items);
        }
      }

      return this.createSuccessResponse(itemsArray);
    } catch (error) {
      return this.handleError(error, `get playbook items for template ${templateId}`);
    }
  }

  /**
   * Transform database record to PlaybookTemplate schema
   */
  private transformTemplateFromDB(dbTemplate: any, dbItems: any[]): PlaybookTemplate {
    // Ensure dbItems is always an array
    const itemsArray = Array.isArray(dbItems) ? dbItems : [];
    
    return {
      id: dbTemplate.id,
      title: dbTemplate.title || dbTemplate.name, // Use title if available, fallback to name
      name: dbTemplate.name,
      description: dbTemplate.description,
      purpose: dbTemplate.purpose || dbTemplate.description, // Use purpose if available, fallback to description
      category: dbTemplate.category,
      version: dbTemplate.version,
      estimatedDuration: (dbTemplate.estimated_duration_hours || 0) * 60,
      complexity: dbTemplate.complexity || 'beginner',
      isActive: dbTemplate.is_active,
      requirements: dbTemplate.requirements || dbTemplate.prerequisites || [],
      assignedCompany: dbTemplate.assigned_company,
      assignedUser: dbTemplate.assigned_user,
      steps: itemsArray.map(item => ({
        id: item.id,
        title: item.name,
        description: item.description,
        stepType: item.item_type,
        isRequired: item.is_required,
        order: item.order_index,
        estimatedDuration: item.estimated_duration_minutes || 5,
        validationSchema: item.validation_schema,
        metadata: {
          ...item.metadata,
          component: item.component_name
        }
      })),
      prerequisites: dbTemplate.prerequisites || [], // Keep for backward compatibility
      successMetrics: dbTemplate.success_metrics || [],
      tags: dbTemplate.tags || [],
      createdAt: dbTemplate.created_at,
      updatedAt: dbTemplate.updated_at
    };
  }


  // ============================================================================
  // USER PLAYBOOK PROGRESS OPERATIONS
  // ============================================================================

  /**
   * Start a new playbook for a user
   */
  async startPlaybook(
    userId: string, 
    organizationId: string,
    playbookId: string, 
    metadata?: Record<string, any>
  ): Promise<ServiceResponse<UserPlaybookProgress>> {
    try {
      // Get playbook template
      const templateResponse = await this.getPlaybookTemplate(playbookId);
      if (!templateResponse.success || !templateResponse.data) {
        return this.createErrorResponse(`Playbook template ${playbookId} not found`);
      }

      // Check if user already has an active playbook for this template
      const existingProgress = await this.getUserPlaybookProgress(userId, organizationId, playbookId);
      if (existingProgress.success && existingProgress.data) {
        return this.createSuccessResponse(existingProgress.data);
      }

      // Create new playbook progress
      const progress: UserPlaybookProgress = {
        id: `${userId}-${organizationId}-${playbookId}-${Date.now()}`,
        userId,
        organizationId,
        playbookId,
        status: 'not_started',
        progressPercentage: 0,
        metadata: metadata || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Save to database
      const { data: savedProgress, error } = await insertOne<UserPlaybookProgress>(
        'user_playbook_progress',
        progress
      );

      if (error) {
        logger.error('Failed to save playbook progress:', error);
        return this.createErrorResponse('Failed to start playbook');
      }

      logger.info('Playbook started successfully', { userId, organizationId, playbookId, progressId: savedProgress.id });
      return this.createSuccessResponse(savedProgress);
    } catch (error) {
      return this.handleError(error, `start playbook for user ${userId}`);
    }
  }

  /**
   * Get user's playbook progress for a specific playbook
   */
  async getUserPlaybookProgress(userId: string, organizationId: string, playbookId: string): Promise<ServiceResponse<UserPlaybookProgress | null>> {
    try {
      const { data: progress, error } = await selectOne<UserPlaybookProgress>(
        'user_playbook_progress',
        { userId, organizationId, playbookId }
      );

      if (error) {
        logger.error('Failed to get user playbook progress:', error);
        return this.createErrorResponse('Failed to get user playbook progress');
      }

      return this.createSuccessResponse(progress);
    } catch (error) {
      return this.handleError(error, `get user playbook progress for user ${userId}`);
    }
  }

  /**
   * Get all user's playbook progress
   */
  async getUserPlaybookProgresses(userId: string, organizationId: string): Promise<ServiceResponse<UserPlaybookProgress[]>> {
    try {
      const { data: progresses, error } = await selectData<UserPlaybookProgress>(
        'user_playbook_progress',
        undefined, // columns - undefined means all columns
        { userId, organizationId } // filters
      );

      if (error) {
        logger.error('Failed to get user playbook progresses:', error);
        return this.createErrorResponse('Failed to get user playbook progresses');
      }

      return this.createSuccessResponse(progresses || []);
    } catch (error) {
      return this.handleError(error, `get user playbook progresses for user ${userId}`);
    }
  }

  /**
   * Update playbook progress
   */
  async updatePlaybookProgress(
    progressId: string, 
    updates: Partial<UserPlaybookProgress>
  ): Promise<ServiceResponse<UserPlaybookProgress>> {
    try {
      const { data: updatedProgress, error } = await updateOne<UserPlaybookProgress>(
        'user_playbook_progress',
        progressId,
        {
          ...updates,
          updatedAt: new Date().toISOString()
        }
      );

      if (error) {
        logger.error('Failed to update playbook progress:', error);
        return this.createErrorResponse('Failed to update playbook progress');
      }

      return this.createSuccessResponse(updatedProgress);
    } catch (error) {
      return this.handleError(error, `update playbook progress for progress ${progressId}`);
    }
  }

  /**
   * Verify if a playbook step is automatically completed based on database data
   */
  async verifyStepCompletion(
    userId: string,
    organizationId: string,
    stepId: string,
    stepType: string,
    stepMetadata: any
  ): Promise<boolean> {
    try {
      // Define verification rules for different step types
      const verificationRules: Record<string, (userId: string, organizationId: string, metadata: any) => Promise<boolean>> = {
        'identity_setup': this.verifyIdentitySetup,
        'business_profile': this.verifyBusinessProfile,
        'revenue_setup': this.verifyRevenueSetup,
        'cash_flow_setup': this.verifyCashFlowSetup,
        'delivery_systems': this.verifyDeliverySystems,
        'team_setup': this.verifyTeamSetup,
        'knowledge_management': this.verifyKnowledgeManagement,
        'business_systems': this.verifyBusinessSystems,
        'form': this.verifyFormCompletion,
        'integration': this.verifyIntegration,
        'data_entry': this.verifyDataEntry
      };

      const verifyFunction = verificationRules[stepType];
      if (!verifyFunction) {
        logger.warn(`No verification rule found for step type: ${stepType}`);
        return false;
      }

      return await verifyFunction(userId, organizationId, stepMetadata);
    } catch (error) {
      logger.error('Error verifying step completion:', error);
      return false;
    }
  }

  /**
   * Verify identity setup completion
   */
  private async verifyIdentitySetup(userId: string, organizationId: string, metadata: any): Promise<boolean> {
    try {
      // Check if business identity data exists
      const { data: identityData } = await selectOne('business_identity', { 
        user_id: userId, 
        organization_id: organizationId 
      });
      
      if (!identityData) return false;

      // Check required fields
      const requiredFields = ['company_name', 'mission', 'vision', 'industry'];
      return requiredFields.every(field => identityData[field] && identityData[field].trim() !== '');
    } catch (error) {
      logger.error('Error verifying identity setup:', error);
      return false;
    }
  }

  /**
   * Verify business profile completion
   */
  private async verifyBusinessProfile(userId: string, organizationId: string, metadata: any): Promise<boolean> {
    try {
      // Check if quantum business profile exists and has data
      const { data: profile } = await selectOne('quantum_business_profiles', { 
        organization_id: organizationId 
      });
      
      if (!profile) return false;

      // Check if at least 3 quantum blocks have data
      const blocksWithData = profile.blocks?.filter((block: any) => block.strength > 0) || [];
      return blocksWithData.length >= 3;
    } catch (error) {
      logger.error('Error verifying business profile:', error);
      return false;
    }
  }

  /**
   * Verify revenue setup completion
   */
  private async verifyRevenueSetup(userId: string, organizationId: string, metadata: any): Promise<boolean> {
    try {
      // Check if revenue data exists
      const { data: revenueData } = await selectOne('revenue_data', { 
        organization_id: organizationId 
      });
      
      if (!revenueData) return false;

      // Check if revenue streams are defined
      return revenueData.revenue_streams && revenueData.revenue_streams.length > 0;
    } catch (error) {
      logger.error('Error verifying revenue setup:', error);
      return false;
    }
  }

  /**
   * Verify cash flow setup completion
   */
  private async verifyCashFlowSetup(userId: string, organizationId: string, metadata: any): Promise<boolean> {
    try {
      // Check if financial data exists
      const { data: financialData } = await selectOne('financial_data', { 
        organization_id: organizationId 
      });
      
      if (!financialData) return false;

      // Check if cash flow data is available
      return financialData.cash_flow_data && financialData.cash_flow_data.length > 0;
    } catch (error) {
      logger.error('Error verifying cash flow setup:', error);
      return false;
    }
  }

  /**
   * Verify delivery systems completion
   */
  private async verifyDeliverySystems(userId: string, organizationId: string, metadata: any): Promise<boolean> {
    try {
      // Check if delivery processes are defined
      const { data: deliveryData } = await selectOne('delivery_systems', { 
        organization_id: organizationId 
      });
      
      if (!deliveryData) return false;

      // Check if delivery processes exist
      return deliveryData.processes && deliveryData.processes.length > 0;
    } catch (error) {
      logger.error('Error verifying delivery systems:', error);
      return false;
    }
  }

  /**
   * Verify team setup completion
   */
  private async verifyTeamSetup(userId: string, organizationId: string, metadata: any): Promise<boolean> {
    try {
      // Check if team data exists
      const { data: teamData } = await selectOne('team_data', { 
        organization_id: organizationId 
      });
      
      if (!teamData) return false;

      // Check if team members are defined
      return teamData.team_members && teamData.team_members.length > 0;
    } catch (error) {
      logger.error('Error verifying team setup:', error);
      return false;
    }
  }

  /**
   * Verify knowledge management completion
   */
  private async verifyKnowledgeManagement(userId: string, organizationId: string, metadata: any): Promise<boolean> {
    try {
      // Check if knowledge base exists
      const { data: knowledgeData } = await selectOne('knowledge_base', { 
        organization_id: organizationId 
      });
      
      if (!knowledgeData) return false;

      // Check if knowledge items exist
      return knowledgeData.items && knowledgeData.items.length > 0;
    } catch (error) {
      logger.error('Error verifying knowledge management:', error);
      return false;
    }
  }

  /**
   * Verify business systems completion
   */
  private async verifyBusinessSystems(userId: string, organizationId: string, metadata: any): Promise<boolean> {
    try {
      // Check if business systems are configured
      const { data: systemsData } = await selectOne('business_systems', { 
        organization_id: organizationId 
      });
      
      if (!systemsData) return false;

      // Check if systems are configured
      return systemsData.configured_systems && systemsData.configured_systems.length > 0;
    } catch (error) {
      logger.error('Error verifying business systems:', error);
      return false;
    }
  }

  /**
   * Verify form completion
   */
  private async verifyFormCompletion(userId: string, organizationId: string, metadata: any): Promise<boolean> {
    try {
      // Check if form data exists for this step
      const { data: formData } = await selectOne('form_responses', { 
        user_id: userId,
        step_id: metadata.stepId 
      });
      
      return !!formData;
    } catch (error) {
      logger.error('Error verifying form completion:', error);
      return false;
    }
  }

  /**
   * Verify integration completion
   */
  private async verifyIntegration(userId: string, organizationId: string, metadata: any): Promise<boolean> {
    try {
      // Check if integration is active
      const { data: integrationData } = await selectOne('integrations', { 
        organization_id: organizationId,
        integration_type: metadata.integrationType,
        status: 'active'
      });
      
      return !!integrationData;
    } catch (error) {
      logger.error('Error verifying integration:', error);
      return false;
    }
  }

  /**
   * Verify data entry completion
   */
  private async verifyDataEntry(userId: string, organizationId: string, metadata: any): Promise<boolean> {
    try {
      // Check if required data exists
      const { data: dataEntry } = await selectOne(metadata.tableName, { 
        organization_id: organizationId 
      });
      
      if (!dataEntry) return false;

      // Check if required fields are populated
      const requiredFields = metadata.requiredFields || [];
      return requiredFields.every(field => dataEntry[field] && dataEntry[field].trim() !== '');
    } catch (error) {
      logger.error('Error verifying data entry:', error);
      return false;
    }
  }

  /**
   * Automatically check and update step completion status
   */
  async checkAndUpdateStepCompletion(
    userId: string,
    organizationId: string,
    playbookId: string
  ): Promise<ServiceResponse<UserPlaybookProgress>> {
    try {
      // Get playbook template
      const templateResponse = await this.getPlaybookTemplate(playbookId);
      if (!templateResponse.success || !templateResponse.data) {
        return this.createErrorResponse('Playbook template not found');
      }

      const template = templateResponse.data;
      
      // Get user's progress
      const progressResponse = await this.getUserPlaybookProgress(userId, organizationId, playbookId);
      if (!progressResponse.success || !progressResponse.data) {
        return this.createErrorResponse('Playbook progress not found');
      }

      const progress = progressResponse.data;
      let hasUpdates = false;
      const updatedStepResponses = { ...progress.stepResponses };

      // Check each step for automatic completion
      for (const step of template.steps) {
        const stepId = step.id;
        const currentStatus = progress.stepResponses[stepId]?.status;
        
        // Skip if already completed
        if (currentStatus === 'completed') continue;

        // Check if step can be automatically verified
        const isCompleted = await this.verifyStepCompletion(
          userId,
          organizationId,
          stepId,
          step.metadata?.stepType || 'form',
          step.metadata || {}
        );

        if (isCompleted) {
          // Automatically mark step as completed
          updatedStepResponses[stepId] = {
            ...progress.stepResponses[stepId],
            status: 'completed',
            completedAt: new Date().toISOString(),
            autoCompleted: true // Flag to indicate automatic completion
          };
          hasUpdates = true;
          logger.info(`Step ${stepId} automatically completed for user ${userId}`);
        }
      }

      // Update progress if there were changes
      if (hasUpdates) {
        const completedSteps = Object.values(updatedStepResponses).filter(
          (step: any) => step.status === 'completed'
        ).length;
        
        const newProgressPercentage = Math.round((completedSteps / template.steps.length) * 100);
        const newStatus = newProgressPercentage === 100 ? 'completed' : 'in_progress';

        const updatedProgress: UserPlaybookProgress = {
          ...progress,
          stepResponses: updatedStepResponses,
          progressPercentage: newProgressPercentage,
          status: newStatus,
          completedAt: newStatus === 'completed' ? new Date().toISOString() : progress.completedAt,
          updatedAt: new Date().toISOString()
        };

        // Save updated progress
        const { error: updateError } = await updateOne(
          'user_playbook_progress',
          { id: progress.id },
          updatedProgress
        );

        if (updateError) {
          logger.error('Failed to update playbook progress:', updateError);
          return this.createErrorResponse('Failed to update playbook progress');
        }

        return this.createSuccessResponse(updatedProgress);
      }

      return this.createSuccessResponse(progress);
    } catch (error) {
      return this.handleError(error, `check and update step completion for user ${userId}`);
    }
  }

  /**
   * Complete a playbook item
   */
  async completePlaybookItem(
    progressId: string,
    itemId: string,
    responseData: Record<string, any>
  ): Promise<ServiceResponse<UserPlaybookProgress>> {
    try {
      // Get current progress
      const { data: progress, error: progressError } = await selectOne<UserPlaybookProgress>(
        'user_playbook_progress',
        { id: progressId }
      );

      if (progressError || !progress) {
        return this.createErrorResponse('Playbook progress not found');
      }

      // Save playbook response
      const playbookResponse: UserPlaybookResponse = {
        id: `${progressId}-${itemId}-${Date.now()}`,
        userId: progress.userId,
        organizationId: progress.organizationId,
        playbookId: progress.playbookId,
        itemId,
        responseData,
        completedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      const { error: responseError } = await insertOne<UserPlaybookResponse>(
        'user_playbook_responses',
        playbookResponse
      );

      if (responseError) {
        logger.error('Failed to save playbook response:', responseError);
        return this.createErrorResponse('Failed to save playbook response');
      }

      // After saving response, check if any steps can be automatically completed
      const autoCheckResult = await this.checkAndUpdateStepCompletion(
        progress.userId,
        progress.organizationId,
        progress.playbookId
      );

      if (autoCheckResult.success && autoCheckResult.data) {
        return this.createSuccessResponse(autoCheckResult.data);
      }

      // Update progress manually if auto-check didn't update anything
      const newProgressPercentage = Math.min(100, progress.progressPercentage + 10); // Simple increment
      const status = newProgressPercentage >= 100 ? 'completed' : 'in_progress';

      return this.updatePlaybookProgress(progressId, {
        progressPercentage: newProgressPercentage,
        status,
        completedAt: status === 'completed' ? new Date().toISOString() : undefined
      });
    } catch (error) {
      return this.handleError(error, `complete playbook item for progress ${progressId}`);
    }
  }

  // ============================================================================
  // ONBOARDING SPECIALIZED OPERATIONS
  // ============================================================================

  /**
   * Start onboarding for a user
   */
  async startOnboarding(userId: string, organizationId: string): Promise<ServiceResponse<UserPlaybookProgress>> {
    // Find the onboarding playbook template
    const templatesResponse = await this.getPlaybookTemplates();
    if (!templatesResponse.success || !templatesResponse.data) {
      return this.createErrorResponse('No playbook templates found');
    }

    const onboardingTemplate = templatesResponse.data.find(t => t.category === 'onboarding');
    if (!onboardingTemplate) {
      return this.createErrorResponse('Onboarding playbook template not found');
    }

    return this.startPlaybook(userId, organizationId, onboardingTemplate.id, {
      type: 'onboarding',
      startedAt: new Date().toISOString()
    });
  }

  /**
   * Get user's onboarding status
   */
  async getOnboardingStatus(userId: string, organizationId: string): Promise<ServiceResponse<{
    isCompleted: boolean;
    progressPercentage: number;
    totalSteps: number;
    progress?: UserPlaybookProgress;
  }>> {
    try {
      // Find the onboarding playbook template
      const templatesResponse = await this.getPlaybookTemplates();
      if (!templatesResponse.success || !templatesResponse.data) {
        return this.createErrorResponse('No playbook templates found');
      }

      const onboardingTemplate = templatesResponse.data.find(t => t.category === 'onboarding');
      if (!onboardingTemplate) {
        return this.createErrorResponse('Onboarding playbook template not found');
      }

      const progressResponse = await this.getUserPlaybookProgress(userId, organizationId, onboardingTemplate.id);
      
      if (!progressResponse.success || !progressResponse.data) {
        return this.createSuccessResponse({
          isCompleted: false,
          progressPercentage: 0,
          totalSteps: onboardingTemplate.steps.length
        });
      }

      const progress = progressResponse.data;
      return this.createSuccessResponse({
        isCompleted: progress.status === 'completed',
        progressPercentage: progress.progressPercentage,
        totalSteps: onboardingTemplate.steps.length,
        progress
      });
    } catch (error) {
      return this.handleError(error, `get onboarding status for user ${userId}`);
    }
  }

  /**
   * Complete onboarding step
   */
  async completeOnboardingStep(
    userId: string,
    organizationId: string,
    itemId: string,
    data: Record<string, any>
  ): Promise<ServiceResponse<UserPlaybookProgress>> {
    try {
      // Find the onboarding playbook template
      const templatesResponse = await this.getPlaybookTemplates();
      if (!templatesResponse.success || !templatesResponse.data) {
        return this.createErrorResponse('No playbook templates found');
      }

      const onboardingTemplate = templatesResponse.data.find(t => t.category === 'onboarding');
      if (!onboardingTemplate) {
        return this.createErrorResponse('Onboarding playbook template not found');
      }

      // Get user's onboarding progress
      const progressResponse = await this.getUserPlaybookProgress(userId, organizationId, onboardingTemplate.id);
      if (!progressResponse.success || !progressResponse.data) {
        return this.createErrorResponse('Onboarding progress not found');
      }

      const progress = progressResponse.data;

      // Complete the item
      const result = await this.completePlaybookItem(progress.id, itemId, data);
      
      // If onboarding is completed, trigger additional actions
      if (result.success && result.data?.status === 'completed') {
        await this.handleOnboardingCompletion(userId, result.data);
      }

      return result;
    } catch (error) {
      return this.handleError(error, `complete onboarding step for user ${userId}`);
    }
  }

  /**
   * Get step completion status for a playbook
   */
  async getStepCompletionStatus(
    userId: string,
    organizationId: string,
    playbookId: string
  ): Promise<ServiceResponse<{
    steps: Array<{
      id: string;
      title: string;
      description: string;
      status: 'pending' | 'in_progress' | 'completed';
      autoCompleted: boolean;
      completedAt?: string;
      verificationCriteria: string[];
    }>;
    overallProgress: number;
    completedSteps: number;
    totalSteps: number;
  }>> {
    try {
      // Get playbook template
      const templateResponse = await this.getPlaybookTemplate(playbookId);
      if (!templateResponse.success || !templateResponse.data) {
        return this.createErrorResponse('Playbook template not found');
      }

      const template = templateResponse.data;
      
      // Get user's progress
      const progressResponse = await this.getUserPlaybookProgress(userId, organizationId, playbookId);
      if (!progressResponse.success || !progressResponse.data) {
        return this.createErrorResponse('Playbook progress not found');
      }

      const progress = progressResponse.data;
      
      // Check each step for completion status
      const steps = await Promise.all(
        template.steps.map(async (step) => {
          const stepId = step.id;
          const currentStatus = progress.stepResponses[stepId]?.status;
          
          // If already completed, return that status
          if (currentStatus === 'completed') {
            return {
              id: stepId,
              title: step.title,
              description: step.description,
              status: 'completed' as const,
              autoCompleted: progress.stepResponses[stepId]?.autoCompleted || false,
              completedAt: progress.stepResponses[stepId]?.completedAt,
              verificationCriteria: this.getVerificationCriteria(step.metadata?.stepType || 'form')
            };
          }

          // Check if step can be automatically completed
          const isCompleted = await this.verifyStepCompletion(
            userId,
            organizationId,
            stepId,
            step.metadata?.stepType || 'form',
            step.metadata || {}
          );

          return {
            id: stepId,
            title: step.title,
            description: step.description,
            status: isCompleted ? 'completed' as const : 'pending' as const,
            autoCompleted: isCompleted,
            completedAt: isCompleted ? new Date().toISOString() : undefined,
            verificationCriteria: this.getVerificationCriteria(step.metadata?.stepType || 'form')
          };
        })
      );

      const completedSteps = steps.filter(step => step.status === 'completed').length;
      const totalSteps = steps.length;
      const overallProgress = Math.round((completedSteps / totalSteps) * 100);

      return this.createSuccessResponse({
        steps,
        overallProgress,
        completedSteps,
        totalSteps
      });
    } catch (error) {
      return this.handleError(error, `get step completion status for user ${userId}`);
    }
  }

  /**
   * Get verification criteria for a step type
   */
  private getVerificationCriteria(stepType: string): string[] {
    const criteria: Record<string, string[]> = {
      'identity_setup': [
        'Company name is defined',
        'Mission statement is provided',
        'Vision statement is provided',
        'Industry is specified'
      ],
      'business_profile': [
        'At least 3 quantum blocks have data',
        'Business profile is configured',
        'Health scores are calculated'
      ],
      'revenue_setup': [
        'Revenue streams are defined',
        'Revenue model is specified',
        'Pricing strategy is set'
      ],
      'cash_flow_setup': [
        'Cash flow data is available',
        'Financial metrics are tracked',
        'Budget is defined'
      ],
      'delivery_systems': [
        'Delivery processes are defined',
        'Quality standards are set',
        'Customer satisfaction metrics exist'
      ],
      'team_setup': [
        'Team members are defined',
        'Roles and responsibilities are clear',
        'Team structure is documented'
      ],
      'knowledge_management': [
        'Knowledge base has content',
        'Documentation is organized',
        'Learning resources are available'
      ],
      'business_systems': [
        'Business systems are configured',
        'Automation is set up',
        'Processes are documented'
      ],
      'form': [
        'Form data is submitted',
        'Required fields are completed',
        'Validation passes'
      ],
      'integration': [
        'Integration is active',
        'Data is syncing',
        'Connection is stable'
      ],
      'data_entry': [
        'Required data is entered',
        'Data quality is validated',
        'Records are complete'
      ]
    };

    return criteria[stepType] || ['Data exists in database'];
  }

  /**
   * Handle onboarding completion
   */
  private async handleOnboardingCompletion(userId: string, progress: UserPlaybookProgress): Promise<void> {
    try {
      // Update user profile with onboarding data
      // TODO: Update user profile, create company, etc.
      logger.info('Onboarding completed', { userId, progressId: progress.id });
    } catch (error) {
      logger.error('Failed to handle onboarding completion:', error);
    }
  }

  // ============================================================================
  // UTILITY OPERATIONS
  // ============================================================================

  /**
   * Get playbook analytics
   */
  async getPlaybookAnalytics(userId: string, organizationId: string): Promise<ServiceResponse<{
    totalPlaybooks: number;
    completedPlaybooks: number;
    activePlaybooks: number;
    averageProgress: number;
  }>> {
    try {
      const progressesResponse = await this.getUserPlaybookProgresses(userId, organizationId);
      if (!progressesResponse.success || !progressesResponse.data) {
        return this.createErrorResponse('Failed to get user playbook progresses');
      }

      const progresses = progressesResponse.data;
      const completed = progresses.filter(p => p.status === 'completed');
      const active = progresses.filter(p => p.status === 'in_progress');
      const averageProgress = progresses.length > 0 
        ? progresses.reduce((sum, p) => sum + p.progressPercentage, 0) / progresses.length 
        : 0;

      return this.createSuccessResponse({
        totalPlaybooks: progresses.length,
        completedPlaybooks: completed.length,
        activePlaybooks: active.length,
        averageProgress
      });
    } catch (error) {
      return this.handleError(error, `get playbook analytics for user ${userId}`);
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const playbookService = PlaybookService.getInstance();

// Legacy exports for backward compatibility
export const unifiedPlaybookService = playbookService;
