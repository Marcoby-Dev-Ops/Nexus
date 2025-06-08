/**
 * n8nService.ts
 * Service for interacting with n8n workflows and automations
 * Handles chat triggers, workflow execution, and department-specific assistants
 */
import axios from 'axios';
import { userN8nConfigService } from './userN8nConfig';
import type { UserN8nConfig } from './userN8nConfig';

export interface N8nChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
  userId?: string;
}

export interface N8nWorkflowTrigger {
  workflowId: string;
  data: Record<string, any>;
  department?: Department;
  userId?: string;
}

export interface N8nResponse {
  success: boolean;
  data?: any;
  error?: string;
  executionId?: string;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'success' | 'error' | 'waiting' | 'running';
  data?: any;
  startedAt: string;
  finishedAt?: string;
}

export type Department = 'sales' | 'finance' | 'operations' | 'marketing' | 'general';

// Your existing n8n workflows mapping
const WORKFLOW_WEBHOOKS = {
  // Existing workflows from your n8n instance
  beyondItBlogging: '719eaaee-c476-43cd-95c2-c169c0c68c6b',
  nexusBuilder: '53c96d78-ed61-4f86-a343-4836c0c656ff',
  
  // Department-specific webhooks (to be created)
  sales: {
    assistant: '', // To be configured
    hubspot: '', // Connect to your HubSpot workflow when created
    pipeline: ''
  },
  finance: {
    assistant: '',
    invoicing: '',
    reporting: ''
  },
  operations: {
    assistant: '',
    automation: '',
    monitoring: ''
  },
  marketing: {
    assistant: '',
    campaigns: '',
    content: '719eaaee-c476-43cd-95c2-c169c0c68c6b' // Using Beyond IT Blogging
  },
  general: {
    assistant: '', // General purpose assistant
    workflow: ''
  }
} as const;

/**
 * Main n8n service class for workflow interactions
 * Now uses user-specific n8n configurations instead of environment variables
 */
export class N8nService {
  private userConfigCache: Map<string, { baseUrl: string; apiKey: string }> = new Map();

  constructor() {
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
        console.warn('No active n8n configuration found for user');
        return null;
      }

      return {
        baseUrl: userConfig.baseUrl,
        apiKey: userConfig.apiKey
      };
    } catch (error) {
      console.error('Failed to get user n8n configuration:', error);
      return null;
    }
  }

  /**
   * Trigger a workflow via webhook
   */
  async triggerWorkflow(webhookId: string, data: Record<string, any>): Promise<N8nResponse> {
    try {
      const config = await this.getUserConfig();
      if (!config) {
        return {
          success: false,
          error: 'No n8n configuration found. Please connect your n8n instance first.'
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
        success: true,
        data: response.data,
        executionId: response.headers['x-n8n-execution-id']
      };
    } catch (error: any) {
      console.error('n8n workflow trigger failed:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Workflow trigger failed'
      };
    }
  }

  /**
   * Chat with department-specific AI assistant
   */
  async chatWithAssistant(
    department: Department,
    message: string,
    context?: Record<string, any>
  ): Promise<N8nResponse> {
    const webhookId = this.getDepartmentWebhook(department, 'assistant');
    
    if (!webhookId) {
      return {
        success: false,
        error: `No assistant configured for ${department} department`
      };
    }

    const chatData = {
      chatInput: message,
      department,
      context: context || {},
      userId: context?.userId || 'anonymous',
      timestamp: new Date().toISOString()
    };

    return this.triggerWorkflow(webhookId, chatData);
  }

  /**
   * Generate workflows using Nexus Builder
   */
  async generateWorkflow(requirements: string, department?: Department): Promise<N8nResponse> {
    const nexusBuilderWebhook = WORKFLOW_WEBHOOKS.nexusBuilder;
    
    return this.triggerWorkflow(nexusBuilderWebhook, {
      chatInput: `Create a workflow for: ${requirements}`,
      department: department || 'general',
      requirements,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Content creation using Beyond IT Blogging workflow
   */
  async createContent(
    contentType: 'blog' | 'social' | 'email',
    prompt: string,
    options?: Record<string, any>
  ): Promise<N8nResponse> {
    const blogWebhook = WORKFLOW_WEBHOOKS.beyondItBlogging;
    
    return this.triggerWorkflow(blogWebhook, {
      chatInput: `Create ${contentType}: ${prompt}`,
      contentType,
      options: options || {},
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Sales department specific actions
   */
  async salesAction(action: 'pipeline' | 'lead' | 'forecast', data: Record<string, any>): Promise<N8nResponse> {
    const webhookId = this.getDepartmentWebhook('sales', action);
    
    if (!webhookId) {
      // Fallback to general sales assistant
      return this.chatWithAssistant('sales', `Please help with ${action}: ${JSON.stringify(data)}`, data);
    }

    return this.triggerWorkflow(webhookId, { action, ...data });
  }

  /**
   * Finance department specific actions
   */
  async financeAction(action: 'invoice' | 'report' | 'payment', data: Record<string, any>): Promise<N8nResponse> {
    const webhookId = this.getDepartmentWebhook('finance', action);
    
    if (!webhookId) {
      return this.chatWithAssistant('finance', `Please help with ${action}: ${JSON.stringify(data)}`, data);
    }

    return this.triggerWorkflow(webhookId, { action, ...data });
  }

  /**
   * Operations department specific actions
   */
  async operationsAction(action: 'automate' | 'monitor' | 'deploy', data: Record<string, any>): Promise<N8nResponse> {
    const webhookId = this.getDepartmentWebhook('operations', action);
    
    if (!webhookId) {
      return this.chatWithAssistant('operations', `Please help with ${action}: ${JSON.stringify(data)}`, data);
    }

    return this.triggerWorkflow(webhookId, { action, ...data });
  }

  /**
   * Pulse Marketplace integration
   */
  async installPulseApp(appId: string, config: Record<string, any>): Promise<N8nResponse> {
    // This could trigger the Nexus Builder to create a custom workflow for the app
    return this.generateWorkflow(
      `Install and configure Pulse app: ${appId} with configuration: ${JSON.stringify(config)}`,
      'operations'
    );
  }

  /**
   * Get workflow execution status (requires API key)
   */
  async getExecutionStatus(executionId: string): Promise<WorkflowExecution | null> {
    try {
      const config = await this.getUserConfig();
      if (!config) {
        console.warn('No n8n configuration found for execution status check');
        return null;
      }

      const response = await axios.get(
        `${config.baseUrl}/api/v1/executions/${executionId}`,
        {
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data as WorkflowExecution;
    } catch (error) {
      console.error('Failed to fetch execution status:', error);
      return null;
    }
  }

  /**
   * Helper method to get department webhook
   */
  private getDepartmentWebhook(department: Department, action: string): string {
    const departmentConfig = WORKFLOW_WEBHOOKS[department];
    
    if (typeof departmentConfig === 'object') {
      return (departmentConfig as any)[action] || '';
    }
    
    return '';
  }

  /**
   * Configure new webhook for department
   */
  async configureDepartmentWebhook(
    department: Department,
    action: string,
    webhookId: string
  ): Promise<void> {
    // This would typically update your configuration
    // For now, we'll just log it - in production, you might store this in your database
    console.log(`Configured ${department}.${action} webhook: ${webhookId}`);
    
    // You could store this in localStorage, Supabase, or your backend
    const configKey = `n8n_webhook_${department}_${action}`;
    try {
      localStorage.setItem(configKey, JSON.stringify(webhookId));
    } catch (error) {
      console.warn(`Failed to save webhook config for ${configKey}:`, error);
    }
  }

  /**
   * Health check for n8n connection
   */
  async healthCheck(): Promise<boolean> {
    try {
      const config = await this.getUserConfig();
      if (!config) {
        return false;
      }

      // Try to ping the n8n instance
      const response = await axios.get(`${config.baseUrl}/healthz`, {
        timeout: 5000
      });
      return response.status === 200;
    } catch (error) {
      console.error('n8n health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const n8nService = new N8nService();

// Export convenience methods
export async function chatWithDepartment(
  department: Department,
  message: string,
  context?: Record<string, any>
): Promise<N8nResponse> {
  return n8nService.chatWithAssistant(department, message, context);
}

export async function generateWorkflow(requirements: string, department?: Department): Promise<N8nResponse> {
  return n8nService.generateWorkflow(requirements, department);
}

export async function createContent(
  contentType: 'blog' | 'social' | 'email',
  prompt: string,
  options?: Record<string, any>
): Promise<N8nResponse> {
  return n8nService.createContent(contentType, prompt, options);
} 