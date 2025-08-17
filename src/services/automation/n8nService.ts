/**
 * N8N Service
 * Main service for workflow interactions and automation
 */

import type { AxiosError } from 'axios';
import axios from 'axios';
import { BaseService, type ServiceResponse } from '@/core/services/BaseService';
import { userN8nConfigService } from './userN8nConfig';

export interface N8nChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
  userId?: string;
}

export interface N8nWorkflowTrigger {
  workflowId: string;
  data: Record<string, unknown>;
  department?: Department;
  userId?: string;
}

export interface N8nResponse {
  success: boolean;
  data?: unknown;
  error?: string;
  executionId?: string;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'success' | 'error' | 'waiting' | 'running';
  data?: unknown;
  startedAt: string;
  finishedAt?: string;
}

export type Department = 'sales' | 'finance' | 'operations' | 'marketing' | 'general';

/**
 * Main n8n service class for workflow interactions
 * Now uses user-specific n8n configurations instead of environment variables
 */
export class N8nService extends BaseService {
  private userConfigCache: Map<string, { baseUrl: string; apiKey: string }> = new Map();

  constructor() {
    super();
    // No longer using hardcoded configuration
    // Each user configures their own n8n instance
  }

  /**
   * Get user-specific n8n configuration
   */
  private async getUserConfig(): Promise<{ baseUrl: string; apiKey: string } | null> {
    try {
      const userConfig = await userN8nConfigService.getCurrentUserConfig();
      if (!userConfig || !userConfig.isActive) {
        this.logger.warn('No active n8n configuration found for user');
        return null;
      }

      return {
        baseUrl: userConfig.baseUrl,
        apiKey: userConfig.apiKey
      };
    } catch (error) {
      this.logger.error('Failed to get user n8n configuration: ', error);
      return null;
    }
  }

  /**
   * Trigger a workflow via webhook
   */
  async triggerWorkflow(webhookId: string, data: Record<string, unknown>): Promise<ServiceResponse<N8nResponse>> {
    const webhookIdValidation = this.validateIdParam(webhookId, 'webhookId');
    if (webhookIdValidation) {
      return this.createErrorResponse(webhookIdValidation);
    }

    return this.executeDbOperation(
      async () => {
        try {
          const config = await this.getUserConfig();
          if (!config) {
            return {
              data: {
                success: false,
                error: 'No n8n configuration found. Please connect your n8n instance first.'
              },
              error: null
            };
          }

          const response = await axios.post(
            `${config.baseUrl}/webhook/${webhookId}`,
            data,
            {
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );

          return {
            data: {
              success: true,
              data: response.data,
              executionId: response.headers['x-n8n-execution-id']
            },
            error: null
          };
        } catch (error: unknown) {
          this.logger.error('n8n workflow trigger failed: ', error);
          if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError;
            return {
              data: {
                success: false,
                error: (axiosError.response?.data as { message: string })?.message || axiosError.message || 'Workflow trigger failed'
              },
              error: null
            };
          }
          return {
            data: {
              success: false,
              error: error instanceof Error ? error.message : 'An unknown error occurred'
            },
            error: null
          };
        }
      },
      'triggerWorkflow'
    );
  }

  /**
   * Chat with department-specific AI assistant
   */
  async chatWithAssistant(
    department: Department,
    message: string,
    context?: Record<string, unknown>
  ): Promise<ServiceResponse<N8nResponse>> {
    const departmentValidation = this.validateRequiredParam(department, 'department');
    if (departmentValidation) {
      return this.createErrorResponse(departmentValidation);
    }

    const messageValidation = this.validateRequiredParam(message, 'message');
    if (messageValidation) {
      return this.createErrorResponse(messageValidation);
    }

    return this.executeDbOperation(
      async () => {
        try {
          const webhookId = this.getDepartmentWebhook(department, 'assistant');
          
          if (!webhookId) {
            return {
              data: {
                success: false,
                error: `No assistant webhook configured for ${department} department`
              },
              error: null
            };
          }

          const response = await this.triggerWorkflow(webhookId, {
            message,
            context,
            department,
            timestamp: new Date().toISOString()
          });

          return response;
        } catch (error) {
          return {
            data: {
              success: false,
              error: error instanceof Error ? error.message : 'Assistant chat failed'
            },
            error: null
          };
        }
      },
      'chatWithAssistant'
    );
  }

  /**
   * Generate workflow based on requirements
   */
  async generateWorkflow(requirements: string, department?: Department): Promise<ServiceResponse<N8nResponse>> {
    const requirementsValidation = this.validateRequiredParam(requirements, 'requirements');
    if (requirementsValidation) {
      return this.createErrorResponse(requirementsValidation);
    }

    return this.executeDbOperation(
      async () => {
        try {
          const webhookId = this.getDepartmentWebhook(department || 'general', 'workflow-generator');
          
          if (!webhookId) {
            return {
              data: {
                success: false,
                error: 'No workflow generator webhook configured'
              },
              error: null
            };
          }

          const response = await this.triggerWorkflow(webhookId, {
            requirements,
            department: department || 'general',
            timestamp: new Date().toISOString()
          });

          return response;
        } catch (error) {
          return {
            data: {
              success: false,
              error: error instanceof Error ? error.message : 'Workflow generation failed'
            },
            error: null
          };
        }
      },
      'generateWorkflow'
    );
  }

  /**
   * Create content using AI
   */
  async createContent(
    contentType: 'blog' | 'social' | 'email',
    prompt: string,
    options?: Record<string, unknown>
  ): Promise<ServiceResponse<N8nResponse>> {
    const contentTypeValidation = this.validateRequiredParam(contentType, 'contentType');
    if (contentTypeValidation) {
      return this.createErrorResponse(contentTypeValidation);
    }

    const promptValidation = this.validateRequiredParam(prompt, 'prompt');
    if (promptValidation) {
      return this.createErrorResponse(promptValidation);
    }

    return this.executeDbOperation(
      async () => {
        try {
          const webhookId = this.getDepartmentWebhook('marketing', 'content-creator');
          
          if (!webhookId) {
            return {
              data: {
                success: false,
                error: 'No content creator webhook configured'
              },
              error: null
            };
          }

          const response = await this.triggerWorkflow(webhookId, {
            contentType,
            prompt,
            options,
            timestamp: new Date().toISOString()
          });

          return response;
        } catch (error) {
          return {
            data: {
              success: false,
              error: error instanceof Error ? error.message : 'Content creation failed'
            },
            error: null
          };
        }
      },
      'createContent'
    );
  }

  /**
   * Execute sales-related actions
   */
  async salesAction(action: 'pipeline' | 'lead' | 'forecast', data: Record<string, unknown>): Promise<ServiceResponse<N8nResponse>> {
    const actionValidation = this.validateRequiredParam(action, 'action');
    if (actionValidation) {
      return this.createErrorResponse(actionValidation);
    }

    return this.executeDbOperation(
      async () => {
        try {
          const webhookId = this.getDepartmentWebhook('sales', action);
          
          if (!webhookId) {
            return {
              data: {
                success: false,
                error: `No ${action} webhook configured for sales department`
              },
              error: null
            };
          }

          const response = await this.triggerWorkflow(webhookId, {
            action,
            data,
            timestamp: new Date().toISOString()
          });

          return response;
        } catch (error) {
          return {
            data: {
              success: false,
              error: error instanceof Error ? error.message : 'Sales action failed'
            },
            error: null
          };
        }
      },
      'salesAction'
    );
  }

  /**
   * Execute finance-related actions
   */
  async financeAction(action: 'invoice' | 'report' | 'payment', data: Record<string, unknown>): Promise<ServiceResponse<N8nResponse>> {
    const actionValidation = this.validateRequiredParam(action, 'action');
    if (actionValidation) {
      return this.createErrorResponse(actionValidation);
    }

    return this.executeDbOperation(
      async () => {
        try {
          const webhookId = this.getDepartmentWebhook('finance', action);
          
          if (!webhookId) {
            return {
              data: {
                success: false,
                error: `No ${action} webhook configured for finance department`
              },
              error: null
            };
          }

          const response = await this.triggerWorkflow(webhookId, {
            action,
            data,
            timestamp: new Date().toISOString()
          });

          return response;
        } catch (error) {
          return {
            data: {
              success: false,
              error: error instanceof Error ? error.message : 'Finance action failed'
            },
            error: null
          };
        }
      },
      'financeAction'
    );
  }

  /**
   * Execute operations-related actions
   */
  async operationsAction(action: 'automate' | 'monitor' | 'deploy', data: Record<string, unknown>): Promise<ServiceResponse<N8nResponse>> {
    const actionValidation = this.validateRequiredParam(action, 'action');
    if (actionValidation) {
      return this.createErrorResponse(actionValidation);
    }

    return this.executeDbOperation(
      async () => {
        try {
          const webhookId = this.getDepartmentWebhook('operations', action);
          
          if (!webhookId) {
            return {
              data: {
                success: false,
                error: `No ${action} webhook configured for operations department`
              },
              error: null
            };
          }

          const response = await this.triggerWorkflow(webhookId, {
            action,
            data,
            timestamp: new Date().toISOString()
          });

          return response;
        } catch (error) {
          return {
            data: {
              success: false,
              error: error instanceof Error ? error.message : 'Operations action failed'
            },
            error: null
          };
        }
      },
      'operationsAction'
    );
  }

  /**
   * Install Pulse app
   */
  async installPulseApp(appId: string, config: Record<string, unknown>): Promise<ServiceResponse<N8nResponse>> {
    const appIdValidation = this.validateIdParam(appId, 'appId');
    if (appIdValidation) {
      return this.createErrorResponse(appIdValidation);
    }

    return this.executeDbOperation(
      async () => {
        try {
          const webhookId = this.getDepartmentWebhook('general', 'pulse-installer');
          
          if (!webhookId) {
            return {
              data: {
                success: false,
                error: 'No Pulse installer webhook configured'
              },
              error: null
            };
          }

          const response = await this.triggerWorkflow(webhookId, {
            appId,
            config,
            timestamp: new Date().toISOString()
          });

          return response;
        } catch (error) {
          return {
            data: {
              success: false,
              error: error instanceof Error ? error.message : 'Pulse app installation failed'
            },
            error: null
          };
        }
      },
      'installPulseApp'
    );
  }

  /**
   * Get execution status
   */
  async getExecutionStatus(executionId: string): Promise<ServiceResponse<WorkflowExecution | null>> {
    const validation = this.validateIdParam(executionId, 'executionId');
    if (validation) {
      return this.createErrorResponse(validation);
    }

    return this.executeDbOperation(
      async () => {
        try {
          const config = await this.getUserConfig();
          if (!config) {
            return {
              data: null,
              error: 'No n8n configuration found'
            };
          }

          const response = await axios.get(
            `${config.baseUrl}/api/v1/executions/${executionId}`,
            {
              headers: {
                'X-N8N-API-KEY': config.apiKey,
              },
            }
          );

          return {
            data: response.data as WorkflowExecution,
            error: null
          };
        } catch (error) {
          if (axios.isAxiosError(error) && error.response?.status === 404) {
            return {
              data: null,
              error: null
            };
          }
          return {
            data: null,
            error: error instanceof Error ? error.message : 'Failed to get execution status'
          };
        }
      },
      'getExecutionStatus'
    );
  }

  /**
   * Configure department webhook
   */
  async configureDepartmentWebhook(
    department: Department,
    action: string,
    webhookId: string
  ): Promise<ServiceResponse<void>> {
    const departmentValidation = this.validateRequiredParam(department, 'department');
    if (departmentValidation) {
      return this.createErrorResponse(departmentValidation);
    }

    const actionValidation = this.validateRequiredParam(action, 'action');
    if (actionValidation) {
      return this.createErrorResponse(actionValidation);
    }

    const webhookIdValidation = this.validateIdParam(webhookId, 'webhookId');
    if (webhookIdValidation) {
      return this.createErrorResponse(webhookIdValidation);
    }

    return this.executeDbOperation(
      async () => {
        try {
          // Store webhook configuration (implement based on your storage mechanism)
          const key = `${department}_${action}`;
          // This would typically be stored in a database or configuration service
          
          return { data: undefined, error: null };
        } catch (error) {
          return { data: null, error: error instanceof Error ? error.message : 'Failed to configure webhook' };
        }
      },
      'configureDepartmentWebhook'
    );
  }

  /**
   * Health check for n8n instance
   */
  async healthCheck(): Promise<ServiceResponse<boolean>> {
    return this.executeDbOperation(
      async () => {
        try {
          const config = await this.getUserConfig();
          if (!config) {
            return { data: false, error: null };
          }

          const response = await axios.get(`${config.baseUrl}/healthz`, {
            timeout: 5000
          });

          return { data: response.status === 200, error: null };
        } catch (error) {
          return { data: false, error: null };
        }
      },
      'healthCheck'
    );
  }

  /**
   * Get department webhook ID
   */
  private getDepartmentWebhook(department: Department, action: string): string {
    // This would typically retrieve from a configuration service or database
    const webhookMap: Record<string, string> = {
      'sales_assistant': 'sales-assistant-webhook',
      'finance_assistant': 'finance-assistant-webhook',
      'operations_assistant': 'operations-assistant-webhook',
      'marketing_assistant': 'marketing-assistant-webhook',
      'general_assistant': 'general-assistant-webhook',
      'sales_pipeline': 'sales-pipeline-webhook',
      'sales_lead': 'sales-lead-webhook',
      'sales_forecast': 'sales-forecast-webhook',
      'finance_invoice': 'finance-invoice-webhook',
      'finance_report': 'finance-report-webhook',
      'finance_payment': 'finance-payment-webhook',
      'operations_automate': 'operations-automate-webhook',
      'operations_monitor': 'operations-monitor-webhook',
      'operations_deploy': 'operations-deploy-webhook',
      'marketing_content-creator': 'marketing-content-webhook',
      'general_workflow-generator': 'workflow-generator-webhook',
      'general_pulse-installer': 'pulse-installer-webhook'
    };

    return webhookMap[`${department}_${action}`] || '';
  }
}

// Export singleton instance
export const n8nService = new N8nService();

// Legacy function exports for backward compatibility
export async function chatWithDepartment(
  department: Department,
  message: string,
  context?: Record<string, unknown>
): Promise<N8nResponse> {
  const result = await n8nService.chatWithAssistant(department, message, context);
  return result.success ? result.data! : { success: false, error: result.error || 'Chat failed' };
}

export async function generateWorkflow(requirements: string, department?: Department): Promise<N8nResponse> {
  const result = await n8nService.generateWorkflow(requirements, department);
  return result.success ? result.data! : { success: false, error: result.error || 'Workflow generation failed' };
}

export async function createContent(
  contentType: 'blog' | 'social' | 'email',
  prompt: string,
  options?: Record<string, unknown>
): Promise<N8nResponse> {
  const result = await n8nService.createContent(contentType, prompt, options);
  return result.success ? result.data! : { success: false, error: result.error || 'Content creation failed' };
} 
