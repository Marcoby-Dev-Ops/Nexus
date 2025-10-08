import { insertOne, updateOne, selectOne, upsertOne, selectData as select } from '@/lib/api-client';
import { BaseService } from '@/core/services/BaseService';
import type { ServiceResponse } from '@/core/services/BaseService';
import { logger } from '@/shared/utils/logger';
import { z } from 'zod';

// Validation schemas
const BusinessProcessSchema = z.object({
  companyId: z.string().uuid(),
  processName: z.string().min(1),
  processCategory: z.enum(['sales', 'marketing', 'operations', 'finance', 'hr', 'customer_support', 'product_development', 'compliance']),
  processSlug: z.string().min(1),
  processDescription: z.string().optional(),
  processPriority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  processConfig: z.record(z.unknown()).optional(),
  automationRules: z.array(z.record(z.unknown())).optional(),
  integrationTriggers: z.array(z.record(z.unknown())).optional(),
  workflowSteps: z.array(z.record(z.unknown())).optional(),
});

const ProcessContributorSchema = z.object({
  businessProcessId: z.string().uuid(),
  userId: z.string().uuid(),
  contributionRole: z.enum(['owner', 'executor', 'reviewer', 'approver', 'stakeholder', 'automation_engineer', 'data_analyst']),
  contributionType: z.enum(['process_design', 'execution', 'review', 'approval', 'automation', 'data_analysis', 'optimization']),
  contributionFrequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'as_needed']).optional(),
  relatedIntegrations: z.array(z.string()).optional(),
});

const AutomationRuleSchema = z.object({
  businessProcessId: z.string().uuid(),
  ruleName: z.string().min(1),
  ruleType: z.enum(['trigger', 'condition', 'action', 'notification', 'escalation']),
  rulePriority: z.number().min(1).max(10).optional(),
  triggerConditions: z.record(z.unknown()).optional(),
  executionConditions: z.record(z.unknown()).optional(),
  actionConfiguration: z.record(z.unknown()).optional(),
  intelligenceThreshold: z.number().min(0).max(100).optional(),
  dataQualityRequirement: z.number().min(0).max(100).optional(),
  collaborationRequirement: z.number().min(1).optional(),
});

type BusinessProcessData = z.infer<typeof BusinessProcessSchema>;
type ProcessContributorData = z.infer<typeof ProcessContributorSchema>;
type AutomationRuleData = z.infer<typeof AutomationRuleSchema>;

interface BusinessProcessResult {
  processId: string;
  processName: string;
  intelligenceScore: number;
  collaborationScore: number;
  automationPotential: number;
  dataEnrichmentLevel: number;
}

interface ProcessAutomationResult {
  ruleId: string;
  ruleName: string;
  automationConfidence: number;
  intelligenceThreshold: number;
  executionCount: number;
  successRate: number;
}

export class BusinessProcessAutomationService extends BaseService {
  constructor() {
    super('BusinessProcessAutomationService');
  }

  /**
   * Create a new business process with collaborative intelligence
   */
  async createBusinessProcess(
    processData: BusinessProcessData
  ): Promise<ServiceResponse<BusinessProcessResult>> {
    return this.executeDbOperation(async () => {
      const validatedData = BusinessProcessSchema.parse(processData);
      
      logger.info('Creating business process', { 
        processName: validatedData.processName,
        processCategory: validatedData.processCategory,
        companyId: validatedData.companyId
      });

      // Create the business process
      const { data: process, error } = await insertOne('business_processes', {
        company_id: validatedData.companyId,
        process_name: validatedData.processName,
        process_category: validatedData.processCategory,
        process_slug: validatedData.processSlug,
        process_description: validatedData.processDescription,
        process_priority: validatedData.processPriority || 'medium',
        process_config: validatedData.processConfig || {},
        automation_rules: validatedData.automationRules || [],
        integration_triggers: validatedData.integrationTriggers || [],
        workflow_steps: validatedData.workflowSteps || [],
        process_created_by: validatedData.companyId, // Will be updated with actual user ID
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      if (error) {
        logger.error('Failed to create business process', { error });
        return { data: null, error: `Failed to create business process: ${error.message}` };
      }

      logger.info('Business process created successfully', { processId: process?.id });
      return this.createResponse({
        processId: process?.id || '',
        processName: validatedData.processName,
        intelligenceScore: 0, // Will be calculated by triggers
        collaborationScore: 0,
        automationPotential: 0,
        dataEnrichmentLevel: 0
      });
    });
  }

  /**
   * Add a contributor to a business process
   */
  async addProcessContributor(
    contributorData: ProcessContributorData
  ): Promise<ServiceResponse<void>> {
    return this.executeDbOperation(async () => {
      const validatedData = ProcessContributorSchema.parse(contributorData);
      
      logger.info('Adding process contributor', { 
        businessProcessId: validatedData.businessProcessId,
        userId: validatedData.userId,
        contributionRole: validatedData.contributionRole
      });

      const { error } = await upsertOne('process_contributors', {
        business_process_id: validatedData.businessProcessId,
        user_id: validatedData.userId,
        contribution_role: validatedData.contributionRole,
        contribution_type: validatedData.contributionType,
        contribution_frequency: validatedData.contributionFrequency || 'as_needed',
        related_integrations: validatedData.relatedIntegrations || [],
        contribution_impact_score: this.calculateContributionImpact(validatedData),
        contribution_quality_score: this.calculateContributionQuality(validatedData),
        contribution_consistency_score: this.calculateContributionConsistency(validatedData),
        assigned_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      if (error) {
        logger.error('Failed to add process contributor', { error });
        return { data: null, error: `Failed to add process contributor: ${error.message}` };
      }

      logger.info('Process contributor added successfully');
      return this.createResponse(undefined);
    });
  }

  /**
   * Create an automation rule for a business process
   */
  async createAutomationRule(
    ruleData: AutomationRuleData
  ): Promise<ServiceResponse<ProcessAutomationResult>> {
    return this.executeDbOperation(async () => {
      const validatedData = AutomationRuleSchema.parse(ruleData);
      
      logger.info('Creating automation rule', { 
        businessProcessId: validatedData.businessProcessId,
        ruleName: validatedData.ruleName,
        ruleType: validatedData.ruleType
      });

      // Calculate automation confidence based on intelligence requirements
      const automationConfidence = this.calculateAutomationConfidence(validatedData);

      const { data: rule, error } = await insertOne('process_automation_rules', {
        business_process_id: validatedData.businessProcessId,
        rule_name: validatedData.ruleName,
        rule_type: validatedData.ruleType,
        rule_priority: validatedData.rulePriority || 5,
        rule_enabled: true,
        trigger_conditions: validatedData.triggerConditions || {},
        execution_conditions: validatedData.executionConditions || {},
        action_configuration: validatedData.actionConfiguration || {},
        intelligence_threshold: validatedData.intelligenceThreshold || 50,
        data_quality_requirement: validatedData.dataQualityRequirement || 70,
        collaboration_requirement: validatedData.collaborationRequirement || 3,
        automation_confidence: automationConfidence,
        created_by: validatedData.businessProcessId, // Will be updated with actual user ID
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      if (error) {
        logger.error('Failed to create automation rule', { error });
        return { data: null, error: `Failed to create automation rule: ${error.message}` };
      }

      logger.info('Automation rule created successfully', { ruleId: rule?.id });
      return this.createResponse({
        ruleId: rule?.id || '',
        ruleName: validatedData.ruleName,
        automationConfidence,
        intelligenceThreshold: validatedData.intelligenceThreshold || 50,
        executionCount: 0,
        successRate: 0
      });
    });
  }

  /**
   * Get business process intelligence and automation potential
   */
  async getProcessIntelligence(
    processId: string
  ): Promise<ServiceResponse<any>> {
    return this.executeDbOperation(async () => {
      const { data: process, error } = await selectOne('business_processes', processId);

      if (error) {
        return { data: null, error: `Failed to get process intelligence: ${error.message}` };
      }

      // Get process contributors
      const { data: contributors, error: contributorsError } = await select(
        'process_contributors',
        { business_process_id: processId }
      );

      if (contributorsError) {
        return { data: null, error: `Failed to get process contributors: ${contributorsError.message}` };
      }

      // Get automation rules
      const { data: automationRules, error: rulesError } = await select(
        'process_automation_rules',
        { business_process_id: processId }
      );

      if (rulesError) {
        return { data: null, error: `Failed to get automation rules: ${rulesError.message}` };
      }

      // Get execution logs
      const { data: executionLogs, error: logsError } = await select(
        'process_execution_logs',
        { business_process_id: processId },
        {
          orderBy: { column: 'started_at', direction: 'desc' },
          limit: 10
        }
      );

      return this.createResponse({
        process,
        contributors: contributors || [],
        automationRules: automationRules || [],
        executionLogs: executionLogs || [],
        intelligence: {
          intelligenceScore: process?.intelligence_score || 0,
          collaborationScore: process?.collaboration_score || 0,
          automationPotential: process?.automation_potential || 0,
          dataEnrichmentLevel: process?.data_enrichment_level || 0
        }
      });
    });
  }

  /**
   * Get all business processes for a company with intelligence scores
   */
  async getCompanyProcesses(
    companyId: string
  ): Promise<ServiceResponse<any[]>> {
    return this.executeDbOperation(async () => {
      const { data: processes, error } = await select(
        'business_processes',
        { company_id: companyId },
        {
          orderBy: { column: 'intelligence_score', direction: 'desc' }
        }
      );

      if (error) {
        return { data: null, error: `Failed to get company processes: ${error.message}` };
      }

      return this.createResponse(processes || []);
    });
  }

  /**
   * Get cross-functional workflows that span multiple departments
   */
  async getCrossFunctionalWorkflows(
    companyId: string
  ): Promise<ServiceResponse<any[]>> {
    return this.executeDbOperation(async () => {
      const { data: workflows, error } = await select(
        'cross_functional_workflows',
        { company_id: companyId }
      );

      if (error) {
        return { data: null, error: `Failed to get cross-functional workflows: ${error.message}` };
      }

      return this.createResponse(workflows || []);
    });
  }

  /**
   * Create a cross-functional workflow
   */
  async createCrossFunctionalWorkflow(
    workflowData: {
      companyId: string;
      workflowName: string;
      workflowCategory: 'lead_to_cash' | 'order_to_fulfillment' | 'hire_to_retire' | 'quote_to_cash' | 'support_to_resolution';
      workflowDescription?: string;
      workflowSteps: any[];
      requiredIntegrations: string[];
      intelligenceRequirements: any;
      collaborationRequirements: any;
    }
  ): Promise<ServiceResponse<any>> {
    return this.executeDbOperation(async () => {
      logger.info('Creating cross-functional workflow', { 
        workflowName: workflowData.workflowName,
        workflowCategory: workflowData.workflowCategory,
        companyId: workflowData.companyId
      });

      const { data: workflow, error } = await insertOne('cross_functional_workflows', {
        company_id: workflowData.companyId,
        workflow_name: workflowData.workflowName,
        workflow_category: workflowData.workflowCategory,
        workflow_description: workflowData.workflowDescription,
        workflow_steps: workflowData.workflowSteps,
        required_integrations: workflowData.requiredIntegrations,
        intelligence_requirements: workflowData.intelligenceRequirements,
        collaboration_requirements: workflowData.collaborationRequirements,
        workflow_owner_id: workflowData.companyId, // Will be updated with actual user ID
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      if (error) {
        logger.error('Failed to create cross-functional workflow', { error });
        return { data: null, error: `Failed to create cross-functional workflow: ${error.message}` };
      }

      logger.info('Cross-functional workflow created successfully', { workflowId: workflow?.id });
      return this.createResponse(workflow);
    });
  }

  /**
   * Trigger intelligence-driven automation for a process
   */
  async triggerProcessAutomation(
    processId: string
  ): Promise<ServiceResponse<any>> {
    return this.executeDbOperation(async () => {
      try {
        // Call the database function to trigger automation
        const { error } = await this.executeSql(
          `SELECT trigger_intelligence_driven_automation($1)`,
          [processId]
        );

        if (error) {
          logger.error('Failed to trigger process automation', { processId, error });
          return { data: null, error: `Failed to trigger process automation: ${error.message}` };
        }

        // Get the updated process intelligence
        const intelligenceResult = await this.getProcessIntelligence(processId);
        if (!intelligenceResult.success) {
          return { data: null, error: intelligenceResult.error };
        }

        logger.info('Process automation triggered successfully', { processId });
        return this.createResponse(intelligenceResult.data);
      } catch (error) {
        return this.handleError(error);
      }
    });
  }

  /**
   * Enrich process data with integration intelligence
   */
  async enrichProcessWithIntelligence(
    processId: string
  ): Promise<ServiceResponse<void>> {
    return this.executeDbOperation(async () => {
      try {
        // Call the database function to enrich process data
        const { error } = await this.executeSql(
          `SELECT enrich_process_with_integration_intelligence($1)`,
          [processId]
        );

        if (error) {
          logger.error('Failed to enrich process with intelligence', { processId, error });
          return { data: null, error: `Failed to enrich process with intelligence: ${error.message}` };
        }

        logger.info('Process enriched with intelligence successfully', { processId });
        return this.createResponse(undefined);
      } catch (error) {
        return this.handleError(error);
      }
    });
  }

  /**
   * Get process execution analytics
   */
  async getProcessAnalytics(
    processId: string
  ): Promise<ServiceResponse<any>> {
    return this.executeDbOperation(async () => {
      // Get execution logs for analytics
      const { data: executionLogs, error } = await select(
        'process_execution_logs',
        { business_process_id: processId },
        {
          orderBy: { column: 'started_at', direction: 'desc' }
        }
      );

      if (error) {
        return { data: null, error: `Failed to get process analytics: ${error.message}` };
      }

      // Calculate analytics
      const analytics = this.calculateProcessAnalytics(executionLogs || []);

      return this.createResponse({
        executionLogs: executionLogs || [],
        analytics
      });
    });
  }

  /**
   * Calculate contribution impact score
   */
  private calculateContributionImpact(data: ProcessContributorData): number {
    let score = 50; // Base score

    // Adjust based on contribution role
    switch (data.contributionRole) {
      case 'owner':
        score += 30;
        break;
      case 'automation_engineer':
        score += 25;
        break;
      case 'data_analyst':
        score += 20;
        break;
      case 'executor':
        score += 15;
        break;
      case 'reviewer':
        score += 10;
        break;
      default:
        score += 5;
    }

    // Adjust based on contribution type
    switch (data.contributionType) {
      case 'automation':
        score += 20;
        break;
      case 'data_analysis':
        score += 15;
        break;
      case 'optimization':
        score += 15;
        break;
      case 'process_design':
        score += 10;
        break;
      default:
        score += 5;
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Calculate contribution quality score
   */
  private calculateContributionQuality(data: ProcessContributorData): number {
    let score = 70; // Base quality

    // Adjust based on contribution role
    switch (data.contributionRole) {
      case 'owner':
        score += 20;
        break;
      case 'automation_engineer':
        score += 15;
        break;
      case 'data_analyst':
        score += 15;
        break;
      case 'reviewer':
        score += 10;
        break;
      default:
        score += 5;
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Calculate contribution consistency score
   */
  private calculateContributionConsistency(data: ProcessContributorData): number {
    let score = 75; // Base consistency

    // Adjust based on contribution frequency
    switch (data.contributionFrequency) {
      case 'daily':
        score += 15;
        break;
      case 'weekly':
        score += 10;
        break;
      case 'monthly':
        score += 5;
        break;
      default:
        score += 0;
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Calculate automation confidence based on requirements
   */
  private calculateAutomationConfidence(data: AutomationRuleData): number {
    let confidence = 0.5; // Base confidence

    // Adjust based on intelligence threshold
    if (data.intelligenceThreshold) {
      confidence += (data.intelligenceThreshold / 100) * 0.3;
    }

    // Adjust based on data quality requirement
    if (data.dataQualityRequirement) {
      confidence += (data.dataQualityRequirement / 100) * 0.2;
    }

    // Adjust based on collaboration requirement
    if (data.collaborationRequirement) {
      confidence += Math.min(data.collaborationRequirement / 10, 0.1);
    }

    return Math.min(1.0, Math.max(0.0, confidence));
  }

  /**
   * Calculate process analytics from execution logs
   */
  private calculateProcessAnalytics(executionLogs: any[]): any {
    if (executionLogs.length === 0) {
      return {
        totalExecutions: 0,
        successRate: 0,
        averageExecutionTime: 0,
        automationRate: 0,
        intelligenceTrend: []
      };
    }

    const totalExecutions = executionLogs.length;
    const successfulExecutions = executionLogs.filter(log => log.execution_status === 'completed').length;
    const automatedExecutions = executionLogs.filter(log => log.execution_type === 'automated').length;
    
    const successRate = (successfulExecutions / totalExecutions) * 100;
    const automationRate = (automatedExecutions / totalExecutions) * 100;
    
    const averageExecutionTime = executionLogs.reduce((sum, log) => {
      return sum + (log.execution_duration_ms || 0);
    }, 0) / totalExecutions;

    // Calculate intelligence trend (last 10 executions)
    const intelligenceTrend = executionLogs
      .slice(0, 10)
      .map(log => ({
        timestamp: log.started_at,
        intelligenceScore: log.intelligence_score_at_execution || 0,
        automationConfidence: log.automation_confidence_at_execution || 0
      }));

    return {
      totalExecutions,
      successRate,
      averageExecutionTime,
      automationRate,
      intelligenceTrend
    };
  }
} 
