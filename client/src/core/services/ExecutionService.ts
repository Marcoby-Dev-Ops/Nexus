/**
 * Execution Service - Hybrid Execution Layer
 * Combines Nexus business logic with n8n orchestration
 */

import { BaseService, type ServiceResponse } from './BaseService';
import { logger } from '@/shared/utils/logger';
import { z } from 'zod';

// ============================================================================
// INTERFACES & TYPES
// ============================================================================

export interface ExecutionRequest {
  processId: string;
  processType: 'nexus' | 'n8n' | 'hybrid';
  data: Record<string, any>;
  userId: string;
  companyId: string;
  metadata?: Record<string, any>;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  timeout?: number;
}

export interface ExecutionStep {
  id: string;
  name: string;
  type: 'nexus_service' | 'n8n_workflow' | 'data_transform' | 'integration' | 'notification';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  serviceName?: string;
  n8nWorkflowId?: string;
  input?: any;
  output?: any;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  executionTime?: number;
}

export interface ExecutionResult {
  executionId: string;
  processId: string;
  status: 'completed' | 'failed' | 'partial' | 'cancelled';
  stepsCompleted: number;
  totalSteps: number;
  errors: string[];
  warnings: string[];
  data?: any;
  totalExecutionTime: number;
  startedAt: Date;
  completedAt: Date;
  metadata?: Record<string, any>;
}

export interface ProcessDefinition {
  id: string;
  name: string;
  description: string;
  type: 'nexus' | 'n8n' | 'hybrid';
  steps: ProcessStep[];
  triggers: ProcessTrigger[];
  timeout: number;
  retryConfig?: RetryConfig;
  metadata?: Record<string, any>;
}

export interface ProcessStep {
  id: string;
  name: string;
  type: 'nexus_service' | 'n8n_workflow' | 'data_transform' | 'integration' | 'notification';
  serviceName?: string;
  n8nWorkflowId?: string;
  inputMapping?: Record<string, string>;
  outputMapping?: Record<string, string>;
  conditions?: ProcessCondition[];
  retryOnFailure?: boolean;
  timeout?: number;
  order: number;
}

export interface ProcessTrigger {
  type: 'webhook' | 'schedule' | 'event' | 'manual';
  config: Record<string, any>;
}

export interface ProcessCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: any;
}

export interface RetryConfig {
  maxAttempts: number;
  backoffDelay: number;
  maxDelay: number;
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const ExecutionRequestSchema = z.object({
  processId: z.string().min(1),
  processType: z.enum(['nexus', 'n8n', 'hybrid']),
  data: z.record(z.any()),
  userId: z.string().uuid(),
  companyId: z.string().uuid(),
  metadata: z.record(z.any()).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  timeout: z.number().positive().optional(),
});

const ProcessDefinitionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  type: z.enum(['nexus', 'n8n', 'hybrid']),
  steps: z.array(z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    type: z.enum(['nexus_service', 'n8n_workflow', 'data_transform', 'integration', 'notification']),
    serviceName: z.string().optional(),
    n8nWorkflowId: z.string().optional(),
    inputMapping: z.record(z.string()).optional(),
    outputMapping: z.record(z.string()).optional(),
    conditions: z.array(z.object({
      field: z.string(),
      operator: z.enum(['equals', 'not_equals', 'contains', 'greater_than', 'less_than']),
      value: z.any(),
    })).optional(),
    retryOnFailure: z.boolean().optional(),
    timeout: z.number().positive().optional(),
    order: z.number().int().min(0),
  })),
  triggers: z.array(z.object({
    type: z.enum(['webhook', 'schedule', 'event', 'manual']),
    config: z.record(z.any()),
  })),
  timeout: z.number().positive(),
  retryConfig: z.object({
    maxAttempts: z.number().int().positive(),
    backoffDelay: z.number().positive(),
    maxDelay: z.number().positive(),
  }).optional(),
  metadata: z.record(z.any()).optional(),
});

// ============================================================================
// EXECUTION SERVICE CLASS
// ============================================================================

export class ExecutionService extends BaseService {
  private static instance: ExecutionService;
  private activeExecutions: Map<string, ExecutionResult> = new Map();
  private processDefinitions: Map<string, ProcessDefinition> = new Map();
  private n8nBaseUrl: string;

  private constructor() {
    super('ExecutionService');
    this.n8nBaseUrl = process.env.N8N_BASE_URL || 'https://automate.marcoby.net';
    this.initializeDefaultProcesses();
  }

  static getInstance(): ExecutionService {
    if (!ExecutionService.instance) {
      ExecutionService.instance = new ExecutionService();
    }
    return ExecutionService.instance;
  }

  /**
   * Execute a business process
   */
  async executeProcess(request: ExecutionRequest): Promise<ServiceResponse<ExecutionResult>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('executeProcess', { processId: request.processId, type: request.processType });

      const validatedRequest = ExecutionRequestSchema.parse(request);
      const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const execution: ExecutionResult = {
        executionId,
        processId: validatedRequest.processId,
        status: 'completed',
        stepsCompleted: 0,
        totalSteps: 0,
        errors: [],
        warnings: [],
        data: {},
        totalExecutionTime: 0,
        startedAt: new Date(),
        completedAt: new Date(),
        metadata: validatedRequest.metadata,
      };

      this.activeExecutions.set(executionId, execution);

      try {
        const startTime = Date.now();
        
        switch (validatedRequest.processType) {
          case 'nexus':
            await this.executeNexusProcess(execution, validatedRequest);
            break;
          case 'n8n':
            await this.executeN8nProcess(execution, validatedRequest);
            break;
          case 'hybrid':
            await this.executeHybridProcess(execution, validatedRequest);
            break;
          default:
            throw new Error(`Unsupported process type: ${validatedRequest.processType}`);
        }

        execution.totalExecutionTime = Date.now() - startTime;
        execution.completedAt = new Date();

        logger.info('Process execution completed', {
          executionId,
          processId: validatedRequest.processId,
          status: execution.status,
          stepsCompleted: execution.stepsCompleted,
          totalSteps: execution.totalSteps,
          executionTime: execution.totalExecutionTime,
        });

        return { data: execution };
      } catch (error) {
        execution.status = 'failed';
        execution.errors.push(error instanceof Error ? error.message : 'Unknown error');
        execution.completedAt = new Date();
        
        logger.error('Process execution failed', {
          executionId,
          processId: validatedRequest.processId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        return { data: execution, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    });
  }

  /**
   * Execute a Nexus-only process using internal services
   */
  private async executeNexusProcess(execution: ExecutionResult, request: ExecutionRequest): Promise<void> {
    const processDef = this.processDefinitions.get(request.processId);
    if (!processDef) {
      throw new Error(`Process definition not found: ${request.processId}`);
    }

    execution.totalSteps = processDef.steps.length;
    let currentData = request.data;

    for (const stepDef of processDef.steps.sort((a, b) => a.order - b.order)) {
      const step: ExecutionStep = {
        id: stepDef.id,
        name: stepDef.name,
        type: stepDef.type,
        status: 'pending',
        input: currentData,
        startedAt: new Date(),
      };

      try {
        // Check conditions
        if (stepDef.conditions && !this.evaluateConditions(currentData, stepDef.conditions)) {
          step.status = 'skipped';
          step.completedAt = new Date();
          continue;
        }

        step.status = 'running';
        
        // Execute step based on type
        switch (stepDef.type) {
          case 'nexus_service':
            step.output = await this.executeNexusService(stepDef.serviceName!, currentData);
            break;
          case 'data_transform':
            step.output = await this.executeDataTransform(stepDef, currentData);
            break;
          case 'notification':
            step.output = await this.executeNotification(stepDef, currentData);
            break;
          default:
            throw new Error(`Unsupported step type: ${stepDef.type}`);
        }

        step.status = 'completed';
        step.completedAt = new Date();
        step.executionTime = step.completedAt.getTime() - step.startedAt.getTime();
        execution.stepsCompleted++;

        // Update current data with step output
        if (stepDef.outputMapping) {
          currentData = this.mapOutputData(step.output, stepDef.outputMapping, currentData);
        } else {
          currentData = step.output;
        }

      } catch (error) {
        step.status = 'failed';
        step.error = error instanceof Error ? error.message : 'Unknown error';
        step.completedAt = new Date();
        execution.errors.push(`Step ${stepDef.name} failed: ${step.error}`);
        
        if (stepDef.retryOnFailure) {
          // Implement retry logic here
          logger.warn('Step failed, retry logic not implemented yet', { stepId: stepDef.id });
        }
      }
    }

    execution.data = currentData;
    execution.status = execution.errors.length > 0 ? 'partial' : 'completed';
  }

  /**
   * Execute an n8n workflow
   */
  private async executeN8nProcess(execution: ExecutionResult, request: ExecutionRequest): Promise<void> {
    const processDef = this.processDefinitions.get(request.processId);
    if (!processDef) {
      throw new Error(`Process definition not found: ${request.processId}`);
    }

    execution.totalSteps = processDef.steps.length;
    let currentData = request.data;

    for (const stepDef of processDef.steps.sort((a, b) => a.order - b.order)) {
      if (stepDef.type !== 'n8n_workflow') {
        throw new Error(`n8n process can only contain n8n_workflow steps`);
      }

      const step: ExecutionStep = {
        id: stepDef.id,
        name: stepDef.name,
        type: stepDef.type,
        n8nWorkflowId: stepDef.n8nWorkflowId,
        status: 'pending',
        input: currentData,
        startedAt: new Date(),
      };

      try {
        step.status = 'running';
        step.output = await this.executeN8nWorkflow(stepDef.n8nWorkflowId!, currentData);
        step.status = 'completed';
        step.completedAt = new Date();
        step.executionTime = step.completedAt.getTime() - step.startedAt.getTime();
        execution.stepsCompleted++;

        // Update current data with step output
        if (stepDef.outputMapping) {
          currentData = this.mapOutputData(step.output, stepDef.outputMapping, currentData);
        } else {
          currentData = step.output;
        }

      } catch (error) {
        step.status = 'failed';
        step.error = error instanceof Error ? error.message : 'Unknown error';
        step.completedAt = new Date();
        execution.errors.push(`Step ${stepDef.name} failed: ${step.error}`);
      }
    }

    execution.data = currentData;
    execution.status = execution.errors.length > 0 ? 'partial' : 'completed';
  }

  /**
   * Execute a hybrid process combining Nexus services and n8n workflows
   */
  private async executeHybridProcess(execution: ExecutionResult, request: ExecutionRequest): Promise<void> {
    const processDef = this.processDefinitions.get(request.processId);
    if (!processDef) {
      throw new Error(`Process definition not found: ${request.processId}`);
    }

    execution.totalSteps = processDef.steps.length;
    let currentData = request.data;

    for (const stepDef of processDef.steps.sort((a, b) => a.order - b.order)) {
      const step: ExecutionStep = {
        id: stepDef.id,
        name: stepDef.name,
        type: stepDef.type,
        serviceName: stepDef.serviceName,
        n8nWorkflowId: stepDef.n8nWorkflowId,
        status: 'pending',
        input: currentData,
        startedAt: new Date(),
      };

      try {
        // Check conditions
        if (stepDef.conditions && !this.evaluateConditions(currentData, stepDef.conditions)) {
          step.status = 'skipped';
          step.completedAt = new Date();
          continue;
        }

        step.status = 'running';
        
        // Execute step based on type
        switch (stepDef.type) {
          case 'nexus_service':
            step.output = await this.executeNexusService(stepDef.serviceName!, currentData);
            break;
          case 'n8n_workflow':
            step.output = await this.executeN8nWorkflow(stepDef.n8nWorkflowId!, currentData);
            break;
          case 'data_transform':
            step.output = await this.executeDataTransform(stepDef, currentData);
            break;
          case 'integration':
            step.output = await this.executeIntegration(stepDef, currentData);
            break;
          case 'notification':
            step.output = await this.executeNotification(stepDef, currentData);
            break;
          default:
            throw new Error(`Unsupported step type: ${stepDef.type}`);
        }

        step.status = 'completed';
        step.completedAt = new Date();
        step.executionTime = step.completedAt.getTime() - step.startedAt.getTime();
        execution.stepsCompleted++;

        // Update current data with step output
        if (stepDef.outputMapping) {
          currentData = this.mapOutputData(step.output, stepDef.outputMapping, currentData);
        } else {
          currentData = step.output;
        }

      } catch (error) {
        step.status = 'failed';
        step.error = error instanceof Error ? error.message : 'Unknown error';
        step.completedAt = new Date();
        execution.errors.push(`Step ${stepDef.name} failed: ${step.error}`);
        
        if (stepDef.retryOnFailure) {
          // Implement retry logic here
          logger.warn('Step failed, retry logic not implemented yet', { stepId: stepDef.id });
        }
      }
    }

    execution.data = currentData;
    execution.status = execution.errors.length > 0 ? 'partial' : 'completed';
  }

  /**
   * Execute a Nexus service
   */
  private async executeNexusService(serviceName: string, data: any): Promise<any> {
    // Dynamic service execution - this would need to be implemented based on your service registry
    logger.info('Executing Nexus service', { serviceName, dataKeys: Object.keys(data) });
    
    // Placeholder implementation - replace with actual service execution
    switch (serviceName) {
      case 'UserService':
        // return await UserService.getInstance().someMethod(data);
        return { service: serviceName, result: 'success', data };
      case 'CompanyService':
        // return await CompanyService.getInstance().someMethod(data);
        return { service: serviceName, result: 'success', data };
      default:
        throw new Error(`Service not implemented: ${serviceName}`);
    }
  }

  /**
   * Execute an n8n workflow
   */
  private async executeN8nWorkflow(workflowId: string, data: any): Promise<any> {
    const webhookUrl = `${this.n8nBaseUrl}/webhook/${workflowId}`;
    
    logger.info('Executing n8n workflow', { workflowId, webhookUrl, dataKeys: Object.keys(data) });

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`n8n workflow failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      logger.error('n8n workflow execution failed', { workflowId, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Execute data transformation
   */
  private async executeDataTransform(stepDef: ProcessStep, data: any): Promise<any> {
    logger.info('Executing data transform', { stepId: stepDef.id, dataKeys: Object.keys(data) });
    
    // Placeholder implementation - replace with actual data transformation logic
    return {
      transformed: true,
      originalData: data,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Execute integration step
   */
  private async executeIntegration(stepDef: ProcessStep, data: any): Promise<any> {
    logger.info('Executing integration', { stepId: stepDef.id, dataKeys: Object.keys(data) });
    
    // Placeholder implementation - replace with actual integration logic
    return {
      integrated: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Execute notification step
   */
  private async executeNotification(stepDef: ProcessStep, data: any): Promise<any> {
    logger.info('Executing notification', { stepId: stepDef.id, dataKeys: Object.keys(data) });
    
    // Placeholder implementation - replace with actual notification logic
    return {
      notified: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Evaluate step conditions
   */
  private evaluateConditions(data: any, conditions: ProcessCondition[]): boolean {
    return conditions.every(condition => {
      const fieldValue = this.getNestedValue(data, condition.field);
      
      switch (condition.operator) {
        case 'equals':
          return fieldValue === condition.value;
        case 'not_equals':
          return fieldValue !== condition.value;
        case 'contains':
          return String(fieldValue).includes(String(condition.value));
        case 'greater_than':
          return Number(fieldValue) > Number(condition.value);
        case 'less_than':
          return Number(fieldValue) < Number(condition.value);
        default:
          return false;
      }
    });
  }

  /**
   * Get nested object value by path
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Map output data based on mapping configuration
   */
  private mapOutputData(output: any, outputMapping: Record<string, string>, currentData: any): any {
    const mappedData = { ...currentData };
    
    for (const [outputKey, targetPath] of Object.entries(outputMapping)) {
      const value = this.getNestedValue(output, outputKey);
      this.setNestedValue(mappedData, targetPath, value);
    }
    
    return mappedData;
  }

  /**
   * Set nested object value by path
   */
  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!(key in current)) {
        current[key] = {};
      }
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  /**
   * Register a process definition
   */
  async registerProcess(definition: ProcessDefinition): Promise<ServiceResponse<boolean>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('registerProcess', { processId: definition.id, name: definition.name });

      const validatedDefinition = ProcessDefinitionSchema.parse(definition);
      this.processDefinitions.set(validatedDefinition.id, validatedDefinition);

      logger.info('Process definition registered', {
        processId: validatedDefinition.id,
        name: validatedDefinition.name,
        type: validatedDefinition.type,
        stepsCount: validatedDefinition.steps.length,
      });

      return { data: true };
    });
  }

  /**
   * Get execution status
   */
  async getExecutionStatus(executionId: string): Promise<ServiceResponse<ExecutionResult | null>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('getExecutionStatus', { executionId });

      const execution = this.activeExecutions.get(executionId);
      return { data: execution || null };
    });
  }

  /**
   * Cancel an execution
   */
  async cancelExecution(executionId: string): Promise<ServiceResponse<boolean>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('cancelExecution', { executionId });

      const execution = this.activeExecutions.get(executionId);
      if (!execution) {
        return { data: false, error: 'Execution not found' };
      }

      if (execution.status === 'completed' || execution.status === 'failed') {
        return { data: false, error: 'Execution already completed' };
      }

      execution.status = 'cancelled';
      execution.completedAt = new Date();

      logger.info('Execution cancelled', { executionId });

      return { data: true };
    });
  }

  /**
   * Initialize default process definitions
   */
  private initializeDefaultProcesses(): void {
    // Lead to Cash Process
    const leadToCashProcess: ProcessDefinition = {
      id: 'lead-to-cash',
      name: 'Lead to Cash Process',
      description: 'Complete lead processing from capture to revenue',
      type: 'hybrid',
      steps: [
        {
          id: 'lead-capture',
          name: 'Lead Capture',
          type: 'nexus_service',
          serviceName: 'ContactService',
          order: 1,
        },
        {
          id: 'lead-qualification',
          name: 'Lead Qualification',
          type: 'n8n_workflow',
          n8nWorkflowId: 'lead-qualification-workflow',
          order: 2,
        },
        {
          id: 'opportunity-creation',
          name: 'Opportunity Creation',
          type: 'nexus_service',
          serviceName: 'DealService',
          order: 3,
        },
        {
          id: 'sales-process',
          name: 'Sales Process',
          type: 'n8n_workflow',
          n8nWorkflowId: 'sales-process-workflow',
          order: 4,
        },
        {
          id: 'revenue-recognition',
          name: 'Revenue Recognition',
          type: 'nexus_service',
          serviceName: 'FinancialService',
          order: 5,
        },
      ],
      triggers: [
        {
          type: 'webhook',
          config: { endpoint: '/api/execution/lead-to-cash' },
        },
      ],
      timeout: 300000, // 5 minutes
    };

    // Customer Onboarding Process
    const customerOnboardingProcess: ProcessDefinition = {
      id: 'customer-onboarding',
      name: 'Customer Onboarding Process',
      description: 'Automated customer onboarding workflow',
      type: 'hybrid',
      steps: [
        {
          id: 'account-setup',
          name: 'Account Setup',
          type: 'nexus_service',
          serviceName: 'UserService',
          order: 1,
        },
        {
          id: 'integration-setup',
          name: 'Integration Setup',
          type: 'n8n_workflow',
          n8nWorkflowId: 'integration-setup-workflow',
          order: 2,
        },
        {
          id: 'welcome-communication',
          name: 'Welcome Communication',
          type: 'notification',
          order: 3,
        },
      ],
      triggers: [
        {
          type: 'webhook',
          config: { endpoint: '/api/execution/customer-onboarding' },
        },
      ],
      timeout: 600000, // 10 minutes
    };

    this.processDefinitions.set(leadToCashProcess.id, leadToCashProcess);
    this.processDefinitions.set(customerOnboardingProcess.id, customerOnboardingProcess);

    logger.info('Default process definitions initialized', {
      processes: Array.from(this.processDefinitions.keys()),
    });
  }
}

// Export singleton instance
export const executionService = ExecutionService.getInstance();
