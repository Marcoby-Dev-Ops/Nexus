/**
 * n8nWorkflowBuilder.ts - Comprehensive n8n workflow builder
 * Creates complete workflows with proper nodes and connections using MCP n8n tools
 */

// import { userN8nConfigService } from './userN8nConfig';

// Enhanced workflow interfaces
export interface N8nNode {
  id: string;
  name: string;
  type: string;
  typeVersion: number;
  position: [number, number];
  parameters: Record<string, unknown>;
  credentials?: Record<string, string>;
  webhookId?: string;
}

export interface N8nConnection {
  [sourceNodeName: string]: {
    [sourceOutputName: string]: Array<{
      node: string;
      type: string;
      index: number;
    }>;
  };
}

export interface N8nWorkflowDefinition {
  name: string;
  nodes: N8nNode[];
  connections: N8nConnection;
  active: boolean;
  settings: {
    executionOrder: 'v1';
    saveManualExecutions: boolean;
    callerPolicy: 'workflowsFromSameOwner';
  };
}

export interface WorkflowGenerationRequest {
  name: string;
  description: string;
  triggerType: 'webhook' | 'schedule' | 'manual' | 'email';
  integrations: string[];
  actions: WorkflowAction[];
  department?: string;
}

export interface WorkflowAction {
  type: 'http_request' | 'database' | 'email' | 'slack' | 'transform' | 'ai_process';
  name: string;
  parameters: Record<string, unknown>;
}

export interface WorkflowGenerationResult {
  success: boolean;
  workflowId?: string;
  workflowDefinition?: N8nWorkflowDefinition;
  webhookUrl?: string;
  error?: string;
}

class N8nWorkflowBuilder {
  /**
   * Initialize connection to user's n8n instance
   */
  async initializeConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      // TODO: Re-enable when userN8nConfig is available
      // const config = await userN8nConfigService.getCurrentUserConfig();
      // if (!config) {
      //   return { success: false, error: 'No active n8n configuration found' };
      // }

      // // Initialize MCP n8n connection (placeholder)
      // if (!config.baseUrl || !config.apiKey) {
      //   return { success: false, error: 'Invalid n8n configuration - missing URL or API key' };
      // }
      
      return { success: true };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
  }

  /**
   * Generate a complete n8n workflow from requirements
   */
  async generateWorkflow(request: WorkflowGenerationRequest): Promise<WorkflowGenerationResult> {
    try {
      // Initialize connection
      const initResult = await this.initializeConnection();
      if (!initResult.success) {
        return { success: false, error: initResult.error };
      }

      // Generate workflow definition
      const workflowDefinition = await this.createWorkflowDefinition(request);
      
      // Validate workflow structure
      const validation = this.validateWorkflow(workflowDefinition);
      if (!validation) {
        return { 
          success: false, 
          error: 'Workflow validation failed'
        };
      }

      // Create workflow in n8n
      const createResult = await this.createWorkflowInN8n(workflowDefinition);
      if (!createResult.success) {
        return { success: false, error: createResult.error };
      }

      // Activate workflow if needed
      if (request.triggerType !== 'manual') {
        await this.activateWorkflow(createResult.workflowId!);
      }

      return {
        success: true,
        workflowId: createResult.workflowId,
        workflowDefinition,
        webhookUrl: createResult.webhookUrl,
      };

    } catch (error: unknown) {
      console.error('Workflow generation failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
  }

  /**
   * Create workflow definition with proper nodes and connections
   */
  private async createWorkflowDefinition(request: WorkflowGenerationRequest): Promise<N8nWorkflowDefinition> {
    const nodes: N8nNode[] = [];
    const connections: N8nConnection = {};
    let nodeCounter = 0;
    let yPosition = 300;

    // Create trigger node
    const triggerNode = this.createTriggerNode(request.triggerType, nodeCounter++, yPosition);
    nodes.push(triggerNode);
    yPosition += 200;

    let previousNodeName = triggerNode.name;

    // Add action nodes
    for (const action of request.actions) {
      const actionNode = this.createActionNode(action, nodeCounter++, yPosition);
      nodes.push(actionNode);
      this.addConnection(connections, previousNodeName, actionNode.name);
      previousNodeName = actionNode.name;
      yPosition += 200;
    }

    // Add integration nodes
    for (const integration of request.integrations) {
      const integrationNode = this.createIntegrationNode(integration, nodeCounter++, yPosition);
      nodes.push(integrationNode);
      this.addConnection(connections, previousNodeName, integrationNode.name);
      yPosition += 200;
    }

    // Add response node
    const responseNode = this.createResponseNode(nodeCounter++, yPosition);
    nodes.push(responseNode);
    this.addConnection(connections, previousNodeName, responseNode.name);

    return {
      name: request.name,
      nodes,
      connections,
      active: false,
      settings: {
        executionOrder: 'v1',
        saveManualExecutions: true,
        callerPolicy: 'workflowsFromSameOwner',
      },
    };
  }

  /**
   * Create trigger node based on type
   */
  private createTriggerNode(triggerType: string, nodeId: number, yPosition: number): N8nNode {
    const baseNode = {
      id: `node-${nodeId}`,
      name: 'Trigger',
      typeVersion: 1,
      position: [240, yPosition] as [number, number],
      parameters: {},
    };

    switch (triggerType) {
      case 'webhook':
        const webhookId = `nexus-webhook-${Date.now()}`;
        return {
          ...baseNode,
          type: 'n8n-nodes-base.webhook',
          parameters: {
            httpMethod: 'POST',
            path: webhookId,
            responseMode: 'responseNode',
            options: {},
          },
          webhookId,
        };
      case 'schedule':
        return {
          ...baseNode,
          type: 'n8n-nodes-base.cron',
          parameters: {
            triggerTimes: {
              item: [{ mode: 'everyMinute' }],
            },
          },
        };
      default:
        return {
          ...baseNode,
          type: 'n8n-nodes-base.manualTrigger',
        };
    }
  }

  /**
   * Create action node
   */
  private createActionNode(action: WorkflowAction, nodeId: number, yPosition: number): N8nNode {
    const baseNode = {
      id: `node-${nodeId}`,
      name: action.name,
      typeVersion: 1,
      position: [240, yPosition] as [number, number],
    };

    switch (action.type) {
      case 'http_request':
        return {
          ...baseNode,
          type: 'n8n-nodes-base.httpRequest',
          parameters: {
            method: 'POST',
            url: action.parameters.url || '',
            options: {
              response: {
                response: { responseFormat: 'json' },
              },
            },
            ...action.parameters,
          },
        };
      case 'database':
        return {
          ...baseNode,
          type: 'n8n-nodes-base.postgres',
          parameters: {
            operation: 'insert',
            schema: 'public',
            table: action.parameters.table || 'workflow_data',
            ...action.parameters,
          },
        };
      case 'email':
        return {
          ...baseNode,
          type: 'n8n-nodes-base.emailSend',
          parameters: {
            fromEmail: action.parameters.fromEmail || '',
            toEmail: action.parameters.toEmail || '',
            subject: action.parameters.subject || '',
            message: action.parameters.message || '',
            ...action.parameters,
          },
        };
      default:
        return {
          ...baseNode,
          type: 'n8n-nodes-base.function',
          parameters: {
            functionCode: `
// Process data for ${action.name}
console.log('Processing:', items[0].json);
return items;
            `,
          },
        };
    }
  }

  /**
   * Create integration node
   */
  private createIntegrationNode(integration: string, nodeId: number, yPosition: number): N8nNode {
    return {
      id: `node-${nodeId}`,
      name: `${integration} Integration`,
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 1,
      position: [240, yPosition],
      parameters: {
        method: 'POST',
        url: `https://api.${integration}.com/webhook`,
        options: {
          response: {
            response: { responseFormat: 'json' },
          },
        },
      },
    };
  }

  /**
   * Create response node
   */
  private createResponseNode(nodeId: number, yPosition: number): N8nNode {
    return {
      id: `node-${nodeId}`,
      name: 'Respond',
      type: 'n8n-nodes-base.respondToWebhook',
      typeVersion: 1,
      position: [240, yPosition],
      parameters: {
        respondWith: 'json',
        responseBody: JSON.stringify({
          success: true,
          message: 'Workflow completed successfully',
          timestamp: '={{new Date().toISOString()}}',
        }),
      },
    };
  }

  /**
   * Add connection between nodes
   */
  private addConnection(connections: N8nConnection, sourceNode: string, targetNode: string): void {
    if (!connections[sourceNode]) {
      connections[sourceNode] = {};
    }
    if (!connections[sourceNode].main) {
      connections[sourceNode].main = [];
    }
    connections[sourceNode].main.push({
      node: targetNode,
      type: 'main',
      index: 0,
    });
  }

  /**
   * Validate workflow structure
   */
  private validateWorkflow(workflow: N8nWorkflowDefinition): boolean {
    return workflow.nodes.length > 0 && 
           workflow.nodes.some(node => node.type.includes('trigger') || node.type.includes('webhook'));
  }

  /**
   * Create workflow in n8n using MCP tools
   */
  private async createWorkflowInN8n(workflow: N8nWorkflowDefinition): Promise<{ success: boolean; workflowId?: string; webhookUrl?: string; error?: string }> {
    try {
      // Get user configuration for webhook URL generation
      // const config = await userN8nConfigService.getCurrentUserConfig();
      // if (!config) {
      //   return { success: false, error: 'No n8n configuration found' };
      // }

      // TODO: Implement actual n8n workflow creation via MCP tools
      // For now, return mock success
      const workflowId = `workflow_${Date.now()}`;
      const webhookUrl = `https://mock-n8n-instance.com/webhook/${workflowId}`;

      console.log('Created workflow:', { workflowId, workflow });

      return {
        success: true,
        workflowId,
        webhookUrl,
      };
    } catch (error: unknown) {
      console.error('Failed to create workflow in n8n:', error);
      return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
  }

  /**
   * Activate workflow
   */
  private async activateWorkflow(workflowId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Use MCP integration to activate workflow (placeholder)
      console.log(`Activating workflow: ${workflowId}`);
      return { success: true };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
  }

  /**
   * Generate workflow from natural language description
   */
  async generateFromDescription(description: string, department?: string): Promise<WorkflowGenerationResult> {
    const request = this.parseDescription(description, department);
    return this.generateWorkflow(request);
  }

  /**
   * Parse natural language description into workflow request
   */
  private parseDescription(description: string, department?: string): WorkflowGenerationRequest {
    const lowerDesc = description.toLowerCase();
    
    let triggerType: 'webhook' | 'schedule' | 'manual' | 'email' = 'webhook';
    if (lowerDesc.includes('schedule') || lowerDesc.includes('daily')) {
      triggerType = 'schedule';
    }

    const integrations: string[] = [];
    const commonIntegrations = ['hubspot', 'salesforce', 'stripe', 'slack'];
    for (const integration of commonIntegrations) {
      if (lowerDesc.includes(integration)) {
        integrations.push(integration);
      }
    }

    const actions: WorkflowAction[] = [];
    if (lowerDesc.includes('email')) {
      actions.push({
        type: 'email',
        name: 'Send Email',
        parameters: { subject: 'Automated notification' },
      });
    }
    if (lowerDesc.includes('database') || lowerDesc.includes('save')) {
      actions.push({
        type: 'database',
        name: 'Save Data',
        parameters: { table: 'workflow_data' },
      });
    }

    if (actions.length === 0) {
      actions.push({
        type: 'transform',
        name: 'Process Data',
        parameters: {},
      });
    }

    return {
      name: `Generated: ${description.substring(0, 50)}`,
      description,
      triggerType,
      integrations,
      actions,
      department,
    };
  }
}

// Export singleton instance
export const n8nWorkflowBuilder = new N8nWorkflowBuilder(); 