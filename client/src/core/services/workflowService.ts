/**
 * Workflow Service
 * Handles business logic workflows and ensures proper data flow
 */

import { databaseService } from './DatabaseService';
import { BaseService, type ServiceResponse } from './BaseService';

// ============================================================================
// INTERFACES
// ============================================================================

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'data_fetch' | 'data_transform' | 'data_store' | 'notification' | 'integration';
  status: 'pending' | 'running' | 'completed' | 'failed';
  data?: any;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  userId: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowExecutionResult {
  success: boolean;
  workflowId: string;
  stepsCompleted: number;
  totalSteps: number;
  errors: string[];
  data?: any;
  executionTime: number;
}

// ============================================================================
// WORKFLOW SERVICE CLASS
// ============================================================================

export class WorkflowService extends BaseService {
  private static instance: WorkflowService;
  private activeWorkflows: Map<string, Workflow> = new Map();

  private constructor() {
    super('WorkflowService');
  }

  static getInstance(): WorkflowService {
    if (!WorkflowService.instance) {
      WorkflowService.instance = new WorkflowService();
    }
    return WorkflowService.instance;
  }

  /**
   * Execute a workflow by name
   */
  async executeWorkflow(
    workflowName: string,
    userId: string,
    initialData?: any,
    metadata?: Record<string, any>
  ): Promise<ServiceResponse<WorkflowExecutionResult>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('executeWorkflow', { workflowName, userId });

      const workflow: Workflow = {
        id: `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: workflowName,
        description: `Workflow execution for ${workflowName}`,
        steps: [],
        status: 'pending',
        userId,
        metadata,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.activeWorkflows.set(workflow.id, workflow);

      const startTime = Date.now();
      const result = await this.executeWorkflowByName(workflowName, workflow, initialData);
      const executionTime = Date.now() - startTime;

      return {
        data: {
          ...result,
          workflowId: workflow.id,
          executionTime,
        },
        error: null,
      };
    }, 'executeWorkflow');
  }

  /**
   * Execute workflow by name with specific implementation
   */
  private async executeWorkflowByName(
    workflowName: string,
    workflow: Workflow,
    initialData?: any
  ): Promise<Omit<WorkflowExecutionResult, 'workflowId' | 'executionTime'>> {
    switch (workflowName) {
      case 'user_onboarding':
        return this.executeUserOnboardingWorkflow(workflow, initialData);
      case 'data_sync':
        return this.executeDataSyncWorkflow(workflow, initialData);
      case 'business_health_check':
        return this.executeBusinessHealthCheckWorkflow(workflow, initialData);
      case 'analytics_processing':
        return this.executeAnalyticsProcessingWorkflow(workflow, initialData);
      case 'integration_setup':
        return this.executeIntegrationSetupWorkflow(workflow, initialData);
      default:
        return {
          success: false,
          stepsCompleted: 0,
          totalSteps: 0,
          errors: [`Unknown workflow: ${workflowName}`],
        };
    }
  }

  /**
   * User onboarding workflow
   */
  private async executeUserOnboardingWorkflow(
    workflow: Workflow,
    initialData?: any
  ): Promise<Omit<WorkflowExecutionResult, 'workflowId' | 'executionTime'>> {
    const steps: WorkflowStep[] = [
      {
        id: 'validate_user_data',
        name: 'Validate User Data',
        type: 'data_transform',
        status: 'pending',
      },
      {
        id: 'create_user_profile',
        name: 'Create User Profile',
        type: 'data_store',
        status: 'pending',
      },
      {
        id: 'setup_default_company',
        name: 'Setup Default Company',
        type: 'data_store',
        status: 'pending',
      },
      {
        id: 'initialize_user_preferences',
        name: 'Initialize User Preferences',
        type: 'data_store',
        status: 'pending',
      },
      {
        id: 'send_welcome_notification',
        name: 'Send Welcome Notification',
        type: 'notification',
        status: 'pending',
      },
    ];

    workflow.steps = steps;
    workflow.status = 'running';

    let completedSteps = 0;
    const errors: string[] = [];

    try {
      // Step 1: Validate user data
      const userData = await this.executeStep(steps[0], async () => {
        if (!workflow.userId) {
          throw new Error('User ID is required');
        }
        return { userId: workflow.userId, ...initialData };
      });
      completedSteps++;

      // Step 2: Create user profile
      await this.executeStep(steps[1], async () => {
        if (!databaseService) {
          throw new Error('Database service not available');
        }

        const { error } = await databaseService.query(
          `INSERT INTO user_profiles (id, created_at, updated_at) 
           VALUES ($1, $2, $3) 
           ON CONFLICT (id) DO UPDATE SET updated_at = $3`,
          [workflow.userId, new Date().toISOString(), new Date().toISOString()]
        );

        if (error) throw new Error(error);
        return { profileCreated: true };
      });
      completedSteps++;

      // Step 3: Setup default company
      await this.executeStep(steps[2], async () => {
        if (!databaseService) {
          throw new Error('Database service not available');
        }

        const { error } = await databaseService.query(
          `INSERT INTO companies (name, owner_id, created_at, updated_at) 
           VALUES ($1, $2, $3, $4)`,
          ['My Company', workflow.userId, new Date().toISOString(), new Date().toISOString()]
        );

        if (error) throw new Error(error);
        return { companyCreated: true };
      });
      completedSteps++;

      // Step 4: Initialize user preferences
      await this.executeStep(steps[3], async () => {
        if (!databaseService) {
          throw new Error('Database service not available');
        }

        const { error } = await databaseService.query(
          `INSERT INTO user_preferences (user_id, theme, notifications_enabled, created_at, updated_at) 
           VALUES ($1, $2, $3, $4, $5)`,
          [workflow.userId, 'light', true, new Date().toISOString(), new Date().toISOString()]
        );

        if (error) throw new Error(error);
        return { preferencesInitialized: true };
      });
      completedSteps++;

      // Step 5: Send welcome notification
      await this.executeStep(steps[4], async () => {
        // Simulate notification sending
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { notificationSent: true };
      });
      completedSteps++;

      workflow.status = 'completed';
      return {
        success: true,
        stepsCompleted: completedSteps,
        totalSteps: steps.length,
        errors: [],
        data: { onboardingCompleted: true },
      };

    } catch (error) {
      workflow.status = 'failed';
      errors.push(error instanceof Error ? error.message : String(error));
      
      return {
        success: false,
        stepsCompleted: completedSteps,
        totalSteps: steps.length,
        errors,
      };
    }
  }

  /**
   * Data sync workflow
   */
  private async executeDataSyncWorkflow(
    workflow: Workflow,
    initialData?: any
  ): Promise<Omit<WorkflowExecutionResult, 'workflowId' | 'executionTime'>> {
    const steps: WorkflowStep[] = [
      {
        id: 'validate_integrations',
        name: 'Validate Integrations',
        type: 'data_fetch',
        status: 'pending',
      },
      {
        id: 'sync_user_data',
        name: 'Sync User Data',
        type: 'data_transform',
        status: 'pending',
      },
      {
        id: 'update_analytics',
        name: 'Update Analytics',
        type: 'data_store',
        status: 'pending',
      },
    ];

    workflow.steps = steps;
    workflow.status = 'running';

    let completedSteps = 0;
    const errors: string[] = [];

    try {
      // Step 1: Validate integrations
      const integrations = await this.executeStep(steps[0], async () => {
        if (!databaseService) {
          throw new Error('Database service not available');
        }

        const { data, error } = await databaseService.query(
          'SELECT * FROM user_integrations WHERE user_id = $1',
          [workflow.userId]
        );

        if (error) throw new Error(error);
        return data || [];
      });
      completedSteps++;

      // Step 2: Sync user data
      const syncedData = await this.executeStep(steps[1], async () => {
        // Simulate data sync
        await new Promise(resolve => setTimeout(resolve, 2000));
        return { syncedRecords: integrations.length * 10 };
      });
      completedSteps++;

      // Step 3: Update analytics
      await this.executeStep(steps[2], async () => {
        if (!databaseService) {
          throw new Error('Database service not available');
        }

        const { error } = await databaseService.query(
          `INSERT INTO analytics_sync_logs (user_id, sync_timestamp, records_synced, status) 
           VALUES ($1, $2, $3, $4)`,
          [workflow.userId, new Date().toISOString(), syncedData.syncedRecords, 'completed']
        );

        if (error) throw new Error(error);
        return { analyticsUpdated: true };
      });
      completedSteps++;

      workflow.status = 'completed';
      return {
        success: true,
        stepsCompleted: completedSteps,
        totalSteps: steps.length,
        errors: [],
        data: { syncCompleted: true, recordsSynced: syncedData.syncedRecords },
      };

    } catch (error) {
      workflow.status = 'failed';
      errors.push(error instanceof Error ? error.message : String(error));
      
      return {
        success: false,
        stepsCompleted: completedSteps,
        totalSteps: steps.length,
        errors,
      };
    }
  }

  /**
   * Business health check workflow
   */
  private async executeBusinessHealthCheckWorkflow(
    workflow: Workflow,
    initialData?: any
  ): Promise<Omit<WorkflowExecutionResult, 'workflowId' | 'executionTime'>> {
    const steps: WorkflowStep[] = [
      {
        id: 'fetch_business_data',
        name: 'Fetch Business Data',
        type: 'data_fetch',
        status: 'pending',
      },
      {
        id: 'calculate_health_metrics',
        name: 'Calculate Health Metrics',
        type: 'data_transform',
        status: 'pending',
      },
      {
        id: 'store_health_results',
        name: 'Store Health Results',
        type: 'data_store',
        status: 'pending',
      },
    ];

    workflow.steps = steps;
    workflow.status = 'running';

    let completedSteps = 0;
    const errors: string[] = [];

    try {
      // Step 1: Fetch business data
      const businessData = await this.executeStep(steps[0], async () => {
        if (!databaseService) {
          throw new Error('Database service not available');
        }

        const { data, error } = await databaseService.query(
          `SELECT * FROM business_health 
           WHERE userid = $1 
           ORDER BY createdat DESC 
           LIMIT 1`,
          [workflow.userId]
        );

        if (error) throw new Error(error);
        return data?.[0] || { userid: workflow.userId, healthscore: 0 };
      });
      completedSteps++;

      // Step 2: Calculate health metrics
      const healthMetrics = await this.executeStep(steps[1], async () => {
        // Simulate health calculation
        const score = Math.floor(Math.random() * 100) + 1;
        return {
          overallscore: score,
          financialhealth: Math.floor(Math.random() * 100) + 1,
          operationalefficiency: Math.floor(Math.random() * 100) + 1,
          marketposition: Math.floor(Math.random() * 100) + 1,
        };
      });
      completedSteps++;

      // Step 3: Store health results
      await this.executeStep(steps[2], async () => {
        if (!databaseService) {
          throw new Error('Database service not available');
        }

        const { error } = await databaseService.query(
          `INSERT INTO business_health (userid, overallscore, financialhealth, operationalefficiency, marketposition, createdat) 
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            workflow.userId,
            healthMetrics.overallscore,
            healthMetrics.financialhealth,
            healthMetrics.operationalefficiency,
            healthMetrics.marketposition,
            new Date().toISOString()
          ]
        );

        if (error) throw new Error(error);
        return healthMetrics;
      });
      completedSteps++;

      workflow.status = 'completed';
      return {
        success: true,
        stepsCompleted: completedSteps,
        totalSteps: steps.length,
        errors: [],
        data: healthMetrics,
      };

    } catch (error) {
      workflow.status = 'failed';
      errors.push(error instanceof Error ? error.message : String(error));
      
      return {
        success: false,
        stepsCompleted: completedSteps,
        totalSteps: steps.length,
        errors,
      };
    }
  }

  /**
   * Integration setup workflow
   */
  private async executeIntegrationSetupWorkflow(
    workflow: Workflow,
    initialData?: any
  ): Promise<Omit<WorkflowExecutionResult, 'workflowId' | 'executionTime'>> {
    const steps: WorkflowStep[] = [
      {
        id: 'validate_integration_config',
        name: 'Validate Integration Config',
        type: 'data_transform',
        status: 'pending',
      },
      {
        id: 'create_integration_record',
        name: 'Create Integration Record',
        type: 'data_store',
        status: 'pending',
      },
      {
        id: 'test_connection',
        name: 'Test Connection',
        type: 'integration',
        status: 'pending',
      },
    ];

    workflow.steps = steps;
    workflow.status = 'running';

    let completedSteps = 0;
    const errors: string[] = [];

    try {
      // Step 1: Validate integration config
      const config = await this.executeStep(steps[0], async () => {
        if (!initialData?.integrationType) {
          throw new Error('Integration type is required');
        }
        return initialData;
      });
      completedSteps++;

      // Step 2: Create integration record
      await this.executeStep(steps[1], async () => {
        if (!databaseService) {
          throw new Error('Database service not available');
        }

        const { error } = await databaseService.query(
          `INSERT INTO user_integrations (user_id, integration_type, status, created_at, updated_at) 
           VALUES ($1, $2, $3, $4, $5)`,
          [workflow.userId, config.integrationType, 'pending', new Date().toISOString(), new Date().toISOString()]
        );

        if (error) throw new Error(error);
        return { integrationCreated: true };
      });
      completedSteps++;

      // Step 3: Test connection
      await this.executeStep(steps[2], async () => {
        // Simulate connection test
        await new Promise(resolve => setTimeout(resolve, 1500));
        return { connectionTested: true };
      });
      completedSteps++;

      workflow.status = 'completed';
      return {
        success: true,
        stepsCompleted: completedSteps,
        totalSteps: steps.length,
        errors: [],
        data: { integrationSetup: true },
      };

    } catch (error) {
      workflow.status = 'failed';
      errors.push(error instanceof Error ? error.message : String(error));
      
      return {
        success: false,
        stepsCompleted: completedSteps,
        totalSteps: steps.length,
        errors,
      };
    }
  }

  /**
   * Analytics processing workflow
   */
  private async executeAnalyticsProcessingWorkflow(
    workflow: Workflow,
    initialData?: any
  ): Promise<Omit<WorkflowExecutionResult, 'workflowId' | 'executionTime'>> {
    const steps: WorkflowStep[] = [
      {
        id: 'collect_analytics_data',
        name: 'Collect Analytics Data',
        type: 'data_fetch',
        status: 'pending',
      },
      {
        id: 'process_analytics',
        name: 'Process Analytics',
        type: 'data_transform',
        status: 'pending',
      },
      {
        id: 'store_processed_data',
        name: 'Store Processed Data',
        type: 'data_store',
        status: 'pending',
      },
    ];

    workflow.steps = steps;
    workflow.status = 'running';

    let completedSteps = 0;
    const errors: string[] = [];

    try {
      // Step 1: Collect analytics data
      const analyticsData = await this.executeStep(steps[0], async () => {
        if (!databaseService) {
          throw new Error('Database service not available');
        }

        const { data, error } = await databaseService.query(
          `SELECT * FROM analytics_events 
           WHERE user_id = $1 
           AND created_at >= $2`,
          [workflow.userId, new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()]
        );

        if (error) throw new Error(error);
        return data || [];
      });
      completedSteps++;

      // Step 2: Process analytics
      const processedData = await this.executeStep(steps[1], async () => {
        // Simulate analytics processing
        await new Promise(resolve => setTimeout(resolve, 2000));
        return {
          totalEvents: analyticsData.length,
          processedEvents: analyticsData.length,
          insights: Math.floor(analyticsData.length / 10),
        };
      });
      completedSteps++;

      // Step 3: Store processed data
      await this.executeStep(steps[2], async () => {
        if (!databaseService) {
          throw new Error('Database service not available');
        }

        const { error } = await databaseService.query(
          `INSERT INTO analytics_processed_data (user_id, processing_date, total_events, processed_events, insights_generated) 
           VALUES ($1, $2, $3, $4, $5)`,
          [
            workflow.userId,
            new Date().toISOString(),
            processedData.totalEvents,
            processedData.processedEvents,
            processedData.insights
          ]
        );

        if (error) throw new Error(error);
        return { dataStored: true };
      });
      completedSteps++;

      workflow.status = 'completed';
      return {
        success: true,
        stepsCompleted: completedSteps,
        totalSteps: steps.length,
        errors: [],
        data: processedData,
      };

    } catch (error) {
      workflow.status = 'failed';
      errors.push(error instanceof Error ? error.message : String(error));
      
      return {
        success: false,
        stepsCompleted: completedSteps,
        totalSteps: steps.length,
        errors,
      };
    }
  }

  /**
   * Execute a single workflow step
   */
  private async executeStep(step: WorkflowStep, executor: () => Promise<any>): Promise<any> {
    step.status = 'running';
    step.startedAt = new Date();

    try {
      const result = await executor();
      step.status = 'completed';
      step.completedAt = new Date();
      step.data = result;
      return result;
    } catch (error) {
      step.status = 'failed';
      step.completedAt = new Date();
      step.error = error instanceof Error ? error.message : String(error);
      throw error;
    }
  }

  /**
   * Get active workflows
   */
  getActiveWorkflows(): Workflow[] {
    return Array.from(this.activeWorkflows.values());
  }

  /**
   * Get specific workflow
   */
  getWorkflow(workflowId: string): Workflow | undefined {
    return this.activeWorkflows.get(workflowId);
  }

  /**
   * Cancel a workflow
   */
  cancelWorkflow(workflowId: string): boolean {
    const workflow = this.activeWorkflows.get(workflowId);
    if (workflow && workflow.status === 'running') {
      workflow.status = 'failed';
      workflow.updatedAt = new Date();
      return true;
    }
    return false;
  }
} 
