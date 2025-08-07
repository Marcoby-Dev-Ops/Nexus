/**
 * Workflow Service
 * Handles business logic workflows and ensures proper data flow
 */

import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/core/types/supabase';
import { logger } from '@/shared/utils/logger';
import { environment } from '@/core/environment';
import { BaseService, type ServiceResponse } from './BaseService';

// Service role client for server-side operations (created lazily)
let supabaseServiceRole: any = null;

const getServiceRoleClient = () => {
  if (!supabaseServiceRole && typeof window === 'undefined') {
    // Only create service role client on server-side
    supabaseServiceRole = createClient<Database>(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
  }
  return supabaseServiceRole;
};

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
        const { error } = await this.supabase
          .from('user_profiles')
          .upsert({
            id: workflow.userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (error) throw error;
        return { profileCreated: true };
      });
      completedSteps++;

      // Step 3: Setup default company
      await this.executeStep(steps[2], async () => {
        const { error } = await this.supabase
          .from('companies')
          .insert({
            name: 'My Company',
            owner_id: workflow.userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (error) throw error;
        return { companyCreated: true };
      });
      completedSteps++;

      // Step 4: Initialize user preferences
      await this.executeStep(steps[3], async () => {
        const { error } = await this.supabase
          .from('user_preferences')
          .insert({
            user_id: workflow.userId,
            theme: 'light',
            notifications_enabled: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (error) throw error;
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
        const { data, error } = await this.supabase
          .from('user_integrations')
          .select('*')
          .eq('user_id', workflow.userId);

        if (error) throw error;
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
        const { error } = await this.supabase
          .from('analytics_sync_logs')
          .insert({
            user_id: workflow.userId,
            sync_timestamp: new Date().toISOString(),
            records_synced: syncedData.syncedRecords,
            status: 'completed',
          });

        if (error) throw error;
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
        const { data, error } = await this.supabase
          .from('business_health')
          .select('*')
          .eq('user_id', workflow.userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data || { userid: workflow.userId, healthscore: 0 };
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
        const { error } = await this.supabase
          .from('business_health')
          .insert({
            userid: workflow.userId,
            ...healthMetrics,
            createdat: new Date().toISOString(),
          });

        if (error) throw error;
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
        const { error } = await this.supabase
          .from('user_integrations')
          .insert({
            user_id: workflow.userId,
            integration_type: config.integrationType,
            status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (error) throw error;
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
        const { data, error } = await this.supabase
          .from('analytics_events')
          .select('*')
          .eq('user_id', workflow.userId)
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

        if (error) throw error;
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
        const { error } = await this.supabase
          .from('analytics_processed_data')
          .insert({
            user_id: workflow.userId,
            processing_date: new Date().toISOString(),
            total_events: processedData.totalEvents,
            processed_events: processedData.processedEvents,
            insights_generated: processedData.insights,
          });

        if (error) throw error;
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