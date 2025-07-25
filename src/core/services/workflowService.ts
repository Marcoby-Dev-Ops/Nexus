/**
 * Workflow Service
 * Handles business logic workflows and ensures proper data flow
 */

import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/core/types/supabase';
import { logger } from '@/shared/utils/logger.ts';
import { environment } from '@/core/environment';

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

export class WorkflowService {
  private static instance: WorkflowService;
  private activeWorkflows: Map<string, Workflow> = new Map();

  private constructor() {}

  static getInstance(): WorkflowService {
    if (!WorkflowService.instance) {
      WorkflowService.instance = new WorkflowService();
    }
    return WorkflowService.instance;
  }

  /**
   * Execute a workflow with proper error handling and logging
   */
  async executeWorkflow(
    workflowName: string,
    userId: string,
    initialData?: any,
    metadata?: Record<string, any>
  ): Promise<WorkflowExecutionResult> {
    const startTime = Date.now();
    const workflowId = `${workflowName}_${Date.now()}`;
    
    try {
      logger.info({ workflowName, userId, workflowId }, 'Starting workflow execution');

      // Create workflow instance
      const workflow: Workflow = {
        id: workflowId,
        name: workflowName,
        description: `Execution of ${workflowName}`,
        steps: [],
        status: 'pending',
        userId,
        metadata,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.activeWorkflows.set(workflowId, workflow);

      // Execute workflow based on name
      const result = await this.executeWorkflowByName(workflowName, workflow, initialData);
      
      const executionTime = Date.now() - startTime;
      
      logger.info({ 
        workflowId, 
        executionTime, 
        stepsCompleted: result.stepsCompleted,
        success: result.success 
      }, 'Workflow execution completed');

      return {
        ...result,
        workflowId,
        executionTime,
      };

    } catch (error) {
      logger.error({ workflowName, userId, error }, 'Workflow execution failed');
      
      return {
        success: false,
        workflowId,
        stepsCompleted: 0,
        totalSteps: 0,
        errors: [error instanceof Error ? error.message : String(error)],
        executionTime: Date.now() - startTime,
      };
    } finally {
      // Clean up active workflow
      this.activeWorkflows.delete(workflowId);
    }
  }

  /**
   * Execute specific workflow by name
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
      
      case 'integration_setup':
        return this.executeIntegrationSetupWorkflow(workflow, initialData);
      
      case 'analytics_processing':
        return this.executeAnalyticsProcessingWorkflow(workflow, initialData);
      
      default: throw new Error(`Unknown workflow: ${workflowName}`);
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
        id: 'fetch_user_profile',
        name: 'Fetch User Profile',
        type: 'data_fetch',
        status: 'pending',
      },
      {
        id: 'create_company_profile',
        name: 'Create Company Profile',
        type: 'data_store',
        status: 'pending',
      },
      {
        id: 'setup_default_integrations',
        name: 'Setup Default Integrations',
        type: 'integration',
        status: 'pending',
      },
      {
        id: 'initialize_analytics',
        name: 'Initialize Analytics',
        type: 'data_store',
        status: 'pending',
      },
    ];

    workflow.steps = steps;
    workflow.status = 'running';

    let completedSteps = 0;
    const errors: string[] = [];

    try {
      // Step 1: Fetch user profile
      await this.executeStep(steps[0], async () => {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', workflow.userId)
          .single();

        if (error) throw error;
        return data;
      });
      completedSteps++;

      // Step 2: Create company profile
      await this.executeStep(steps[1], async () => {
        const { data, error } = await supabase
          .from('business_profiles')
          .insert({
            org_id: workflow.userId,
            company_name: 'My Company',
            industry: 'Technology',
            company_size: '1-10',
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      });
      completedSteps++;

      // Step 3: Setup default integrations
      await this.executeStep(steps[2], async () => {
        // Create default integration status
        const { error } = await supabase
          .from('integration_status')
          .insert({
            userid: workflow.userId,
            integrationtype: 'manual',
            status: 'pending',
            createdat: new Date().toISOString(),
          });

        if (error) throw error;
        return { status: 'pending' };
      });
      completedSteps++;

      // Step 4: Initialize analytics
      await this.executeStep(steps[3], async () => {
        const { error } = await supabase
          .from('analytics_events')
          .insert({
            user_id: workflow.userId,
            eventtype: 'onboarding_completed',
            properties: { workflow: 'user_onboarding' },
            timestamp: new Date().toISOString(),
            source: 'workflow',
            version: '1.0.0'
          });

        if (error) throw error;
        return { event: 'onboarding_completed' };
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
      errors.push(error instanceof Error ? error.message: String(error));
      
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
        id: 'fetch_integrations',
        name: 'Fetch User Integrations',
        type: 'data_fetch',
        status: 'pending',
      },
      {
        id: 'sync_integration_data',
        name: 'Sync Integration Data',
        type: 'integration',
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
      // Step 1: Fetch integrations
      const integrations = await this.executeStep(steps[0], async () => {
        const { data, error } = await supabase
          .from('user_integrations')
          .select('*')
          .eq('user_id', workflow.userId);

        if (error) throw error;
        return data || [];
      });
      completedSteps++;

      // Step 2: Sync integration data
      await this.executeStep(steps[1], async () => {
        if (!integrations || integrations.length === 0) {
          return { synced: 0 };
        }

        // Simulate data sync
        const syncResults = await Promise.all(
          integrations.map(async (integration) => {
            const { error } = await supabase
              .from('integration_sync_logs')
              .insert({
                userintegration_id: integration.id,
                synctype: 'manual',
                status: 'completed',
                createdat: new Date().toISOString(),
              });

            if (error) throw error;
            return { integrationId: integration.id, status: 'synced' };
          })
        );

        return { synced: syncResults.length };
      });
      completedSteps++;

      // Step 3: Update analytics
      await this.executeStep(steps[2], async () => {
        const { error } = await supabase
          .from('analytics_events')
          .insert({
            user_id: workflow.userId,
            eventtype: 'data_sync_completed',
            properties: { integrationsCount: integrations?.length || 0 },
            timestamp: new Date().toISOString(),
            source: 'workflow',
            version: '1.0.0'
          });

        if (error) throw error;
        return { event: 'data_sync_completed' };
      });
      completedSteps++;

      workflow.status = 'completed';
      return {
        success: true,
        stepsCompleted: completedSteps,
        totalSteps: steps.length,
        errors: [],
        data: { syncCompleted: true },
      };

    } catch (error) {
      workflow.status = 'failed';
      errors.push(error instanceof Error ? error.message: String(error));
      
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
        const { data, error } = await supabase
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
        const { error } = await supabase
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
      errors.push(error instanceof Error ? error.message: String(error));
      
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
        if (!initialData?.integrationType || !initialData?.config) {
          throw new Error('Invalid integration configuration');
        }
        return initialData;
      });
      completedSteps++;

      // Step 2: Create integration record
      const integration = await this.executeStep(steps[1], async () => {
        const { data, error } = await supabase
          .from('user_integrations')
          .insert({
            userid: workflow.userId,
            integrationtype: config.integrationType,
            config: config.config,
            status: 'pending',
            createdat: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      });
      completedSteps++;

      // Step 3: Test connection
      await this.executeStep(steps[2], async () => {
        // Simulate connection test
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const { error } = await supabase
          .from('user_integrations')
          .update({
            status: 'active',
            updatedat: new Date().toISOString(),
          })
          .eq('id', integration.id);

        if (error) throw error;
        return { status: 'active' };
      });
      completedSteps++;

      workflow.status = 'completed';
      return {
        success: true,
        stepsCompleted: completedSteps,
        totalSteps: steps.length,
        errors: [],
        data: { integrationId: integration.id, status: 'active' },
      };

    } catch (error) {
      workflow.status = 'failed';
      errors.push(error instanceof Error ? error.message: String(error));
      
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
    const steps = workflow.steps;
    let completedSteps = 0;
    const errors: string[] = [];

    try {
      // Step 1: Fetch analytics data
      const analyticsData = await this.executeStep(steps[0], async () => {
        const { data, error } = await supabase
          .from('analytics_events')
          .select('*')
          .eq('user_id', workflow.userId)
          .order('timestamp', { ascending: false })
          .limit(100);

        if (error) throw error;
        return data || [];
      });
      completedSteps++;

      // Step 2: Process analytics
      const processedData = await this.executeStep(steps[1], async () => {
        // Simulate analytics processing
        const eventTypes = analyticsData.map(event => event.eventtype);
        const uniqueEvents = [...new Set(eventTypes)];
        
        return {
          totalEvents: analyticsData.length,
          uniqueEventTypes: uniqueEvents.length,
          eventTypes: uniqueEvents,
          lastEvent: analyticsData[0]?.timestamp,
        };
      });
      completedSteps++;

      // Step 3: Store processed data
      await this.executeStep(steps[2], async () => {
        const { error } = await supabase
          .from('analytics_events')
          .insert({
            user_id: workflow.userId,
            eventtype: 'analytics_processed',
            properties: processedData,
            timestamp: new Date().toISOString(),
            source: 'workflow',
            version: '1.0.0'
          });

        if (error) throw error;
        return processedData;
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
      errors.push(error instanceof Error ? error.message: String(error));
      
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
      step.error = error instanceof Error ? error.message: String(error);
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
   * Get workflow by ID
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

// Export singleton instance
export const workflowService = WorkflowService.getInstance(); 