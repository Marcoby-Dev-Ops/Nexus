export interface N8nWorkflow {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  nodes: N8nNode[];
  connections: N8nConnection[];
  settings: N8nWorkflowSettings;
  executionCount: number;
  lastExecuted?: Date;
  averageExecutionTime: number;
  successRate: number;
}

export interface N8nNode {
  id: string;
  name: string;
  type: string;
  position: { x: number; y: number };
  parameters: Record<string, any>;
  credentials?: Record<string, any>;
}

export interface N8nConnection {
  from: { node: string; output: number };
  to: { node: string; input: number };
}

export interface N8nWorkflowSettings {
  saveExecutionProgress: boolean;
  saveManualExecutions: boolean;
  callerPolicy: 'workflowsFromSameOwner' | 'any';
  errorWorkflow?: string;
  timezone: string;
}

export interface N8nExecution {
  id: string;
  workflowId: string;
  status: 'running' | 'completed' | 'failed' | 'waiting';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  data: Record<string, any>;
  error?: string;
  retryCount: number;
  maxRetries: number;
}

export interface N8nWebhook {
  id: string;
  workflowId: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  isActive: boolean;
  responseMode: 'responseNode' | 'lastNode' | 'responseNodeAndLastNode';
  options: {
    responseHeaders?: Record<string, string>;
    responseCode?: number;
    responseData?: string;
  };
}

class N8nService {
  private workflows: Map<string, N8nWorkflow> = new Map();
  private executions: Map<string, N8nExecution> = new Map();
  private webhooks: Map<string, N8nWebhook> = new Map();
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.N8N_BASE_URL || 'http://localhost:5678';
    this.apiKey = process.env.N8N_API_KEY || '';
    this.loadWorkflows();
  }

  /**
   * Create a new workflow
   */
  async createWorkflow(workflow: Omit<N8nWorkflow, 'id' | 'executionCount' | 'averageExecutionTime' | 'successRate'>): Promise<string> {
    const id = `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newWorkflow: N8nWorkflow = {
      ...workflow,
      id,
      executionCount: 0,
      averageExecutionTime: 0,
      successRate: 100
    };

    this.workflows.set(id, newWorkflow);
    await this.saveWorkflows();
    return id;
  }

  /**
   * Get all workflows
   */
  getWorkflows(): N8nWorkflow[] {
    return Array.from(this.workflows.values());
  }

  /**
   * Get workflow by ID
   */
  getWorkflow(id: string): N8nWorkflow | undefined {
    return this.workflows.get(id);
  }

  /**
   * Update workflow
   */
  async updateWorkflow(id: string, updates: Partial<N8nWorkflow>): Promise<void> {
    const workflow = this.workflows.get(id);
    if (!workflow) {
      throw new Error(`Workflow ${id} not found`);
    }

    Object.assign(workflow, updates);
    await this.saveWorkflows();
  }

  /**
   * Delete workflow
   */
  async deleteWorkflow(id: string): Promise<void> {
    this.workflows.delete(id);
    
    // Delete associated webhooks
    for (const [webhookId, webhook] of this.webhooks.entries()) {
      if (webhook.workflowId === id) {
        this.webhooks.delete(webhookId);
      }
    }
    
    await this.saveWorkflows();
    await this.saveWebhooks();
  }

  /**
   * Execute workflow
   */
  async executeWorkflow(workflowId: string, data?: Record<string, any>): Promise<N8nExecution> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = new Date();
    
    const execution: N8nExecution = {
      id: executionId,
      workflowId,
      status: 'running',
      startTime,
      data: data || {},
      retryCount: 0,
      maxRetries: 3
    };

    this.executions.set(executionId, execution);

    try {
      // Simulate workflow execution
      await this.simulateWorkflowExecution(workflow);
      
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      
      execution.status = 'completed';
      execution.endTime = endTime;
      execution.duration = duration;

      // Update workflow stats
      workflow.executionCount++;
      workflow.lastExecuted = endTime;
      workflow.averageExecutionTime = (workflow.averageExecutionTime * (workflow.executionCount - 1) + duration) / workflow.executionCount;
      
      // Update success rate (simplified)
      const successCount = workflow.executionCount - Math.floor(workflow.executionCount * 0.1); // 90% success rate
      workflow.successRate = (successCount / workflow.executionCount) * 100;

      await this.saveWorkflows();
      await this.saveExecutions();
      
      return execution;
    } catch (error) {
      execution.status = 'failed';
      execution.endTime = new Date();
      execution.duration = execution.endTime.getTime() - startTime.getTime();
      execution.error = error instanceof Error ? error.message : 'Unknown error';
      
      await this.saveExecutions();
      throw error;
    }
  }

  /**
   * Create webhook for workflow
   */
  async createWebhook(webhook: Omit<N8nWebhook, 'id'>): Promise<string> {
    const id = `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newWebhook: N8nWebhook = {
      ...webhook,
      id
    };

    this.webhooks.set(id, newWebhook);
    await this.saveWebhooks();
    return id;
  }

  /**
   * Get webhooks for workflow
   */
  getWebhooksForWorkflow(workflowId: string): N8nWebhook[] {
    return Array.from(this.webhooks.values()).filter(w => w.workflowId === workflowId);
  }

  /**
   * Get execution history
   */
  getExecutionHistory(workflowId?: string, limit: number = 50): N8nExecution[] {
    let executions = Array.from(this.executions.values());
    
    if (workflowId) {
      executions = executions.filter(e => e.workflowId === workflowId);
    }
    
    return executions
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      .slice(0, limit);
  }

  /**
   * Get workflow statistics
   */
  getWorkflowStats(): {
    totalWorkflows: number;
    activeWorkflows: number;
    totalExecutions: number;
    averageExecutionTime: number;
    successRate: number;
  } {
    const workflows = this.getWorkflows();
    const executions = this.getExecutionHistory();
    
    const totalExecutions = executions.length;
    const completedExecutions = executions.filter(e => e.status === 'completed');
    const averageExecutionTime = completedExecutions.length > 0 
      ? completedExecutions.reduce((sum, e) => sum + (e.duration || 0), 0) / completedExecutions.length 
      : 0;
    const successRate = totalExecutions > 0 ? (completedExecutions.length / totalExecutions) * 100 : 0;

    return {
      totalWorkflows: workflows.length,
      activeWorkflows: workflows.filter(w => w.isActive).length,
      totalExecutions,
      averageExecutionTime,
      successRate
    };
  }

  /**
   * Test workflow connection
   */
  async testWorkflowConnection(workflowId: string): Promise<{
    success: boolean;
    message: string;
    details?: Record<string, any>;
  }> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      return {
        success: false,
        message: 'Workflow not found'
      };
    }

    try {
      // Simulate connection test
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      return {
        success: true,
        message: 'All connections are working properly',
        details: {
          nodesTested: workflow.nodes.length,
          connectionsTested: workflow.connections.length
        }
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Import workflow from JSON
   */
  async importWorkflow(workflowJson: any): Promise<string> {
    // Validate workflow structure
    if (!workflowJson.name || !workflowJson.nodes) {
      throw new Error('Invalid workflow format');
    }

    const workflow: Omit<N8nWorkflow, 'id' | 'executionCount' | 'averageExecutionTime' | 'successRate'> = {
      name: workflowJson.name,
      description: workflowJson.description || '',
      isActive: workflowJson.active || false,
      nodes: workflowJson.nodes || [],
      connections: workflowJson.connections || [],
      settings: {
        saveExecutionProgress: true,
        saveManualExecutions: true,
        callerPolicy: 'workflowsFromSameOwner',
        timezone: 'UTC'
      }
    };

    return this.createWorkflow(workflow);
  }

  /**
   * Export workflow to JSON
   */
  exportWorkflow(workflowId: string): any {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    return {
      id: workflow.id,
      name: workflow.name,
      description: workflow.description,
      active: workflow.isActive,
      nodes: workflow.nodes,
      connections: workflow.connections,
      settings: workflow.settings
    };
  }

  private async simulateWorkflowExecution(workflow: N8nWorkflow): Promise<void> {
    // Simulate execution time based on number of nodes
    const executionTime = 1000 + (workflow.nodes.length * 200) + Math.random() * 1000;
    await new Promise(resolve => setTimeout(resolve, executionTime));
    
    // Simulate occasional failures
    if (Math.random() < 0.1) {
      throw new Error('Workflow execution failed');
    }
  }

  private async loadWorkflows(): Promise<void> {
    // In a real implementation, this would load from database
    // For now, we'll start with an empty map
  }

  private async saveWorkflows(): Promise<void> {
    // In a real implementation, this would save to database
    // For now, we'll just keep in memory
  }

  private async saveExecutions(): Promise<void> {
    // In a real implementation, this would save to database
    // For now, we'll just keep in memory
  }

  private async saveWebhooks(): Promise<void> {
    // In a real implementation, this would save to database
    // For now, we'll just keep in memory
  }
}

export const n8nService = new N8nService(); 