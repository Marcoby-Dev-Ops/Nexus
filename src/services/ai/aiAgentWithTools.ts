import { logger } from '@/shared/utils/logger.ts';

export interface Tool {
  id: string;
  name: string;
  description: string;
  category: 'data' | 'communication' | 'automation' | 'analysis' | 'integration';
  isEnabled: boolean;
  parameters: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  tools: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ToolExecution {
  id: string;
  toolId: string;
  agentId: string;
  parameters: Record<string, any>;
  result: any;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
  executionTime: number;
  createdAt: string;
}

class AIAgentWithTools {
  private agents: Map<string, Agent> = new Map();
  private tools: Map<string, Tool> = new Map();
  private executions: ToolExecution[] = [];

  constructor() {
    this.initializeDefaultTools();
    this.initializeDefaultAgents();
  }

  private initializeDefaultTools(): void {
    const defaultTools: Tool[] = [
      {
        id: 'data-analyzer',
        name: 'Data Analyzer',
        description: 'Analyzes data and provides insights',
        category: 'data',
        isEnabled: true,
        parameters: { analysisType: 'comprehensive' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'email-composer',
        name: 'Email Composer',
        description: 'Composes professional emails',
        category: 'communication',
        isEnabled: true,
        parameters: { tone: 'professional' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'task-automator',
        name: 'Task Automator',
        description: 'Automates repetitive tasks',
        category: 'automation',
        isEnabled: true,
        parameters: { automationLevel: 'full' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'report-generator',
        name: 'Report Generator',
        description: 'Generates comprehensive reports',
        category: 'analysis',
        isEnabled: true,
        parameters: { reportType: 'executive' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'integration-connector',
        name: 'Integration Connector',
        description: 'Connects to external services',
        category: 'integration',
        isEnabled: true,
        parameters: { connectionType: 'api' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    defaultTools.forEach(tool => {
      this.tools.set(tool.id, tool);
    });
  }

  private initializeDefaultAgents(): void {
    const defaultAgents: Agent[] = [
      {
        id: 'executive-agent',
        name: 'Executive Assistant',
        description: 'High-level strategic assistant with access to all tools',
        tools: ['data-analyzer', 'report-generator', 'email-composer'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'analyst-agent',
        name: 'Data Analyst',
        description: 'Specialized in data analysis and insights',
        tools: ['data-analyzer', 'report-generator'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'automation-agent',
        name: 'Automation Specialist',
        description: 'Focused on task automation and workflow optimization',
        tools: ['task-automator', 'integration-connector'],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    defaultAgents.forEach(agent => {
      this.agents.set(agent.id, agent);
    });
  }

  async getAllAgents(): Promise<Agent[]> {
    try {
      return Array.from(this.agents.values());
    } catch (error) {
      logger.error('Error getting all agents:', error);
      return [];
    }
  }

  async getAgentById(id: string): Promise<Agent | null> {
    try {
      return this.agents.get(id) || null;
    } catch (error) {
      logger.error(`Error getting agent by id ${id}:`, error);
      return null;
    }
  }

  async getAllTools(): Promise<Tool[]> {
    try {
      return Array.from(this.tools.values());
    } catch (error) {
      logger.error('Error getting all tools:', error);
      return [];
    }
  }

  async getToolById(id: string): Promise<Tool | null> {
    try {
      return this.tools.get(id) || null;
    } catch (error) {
      logger.error(`Error getting tool by id ${id}:`, error);
      return null;
    }
  }

  async getToolsByCategory(category: Tool['category']): Promise<Tool[]> {
    try {
      return Array.from(this.tools.values()).filter(tool => tool.category === category);
    } catch (error) {
      logger.error(`Error getting tools by category ${category}:`, error);
      return [];
    }
  }

  async executeTool(toolId: string, agentId: string, parameters: Record<string, any>): Promise<ToolExecution> {
    try {
      const tool = this.tools.get(toolId);
      const agent = this.agents.get(agentId);

      if (!tool) {
        throw new Error(`Tool ${toolId} not found`);
      }

      if (!agent) {
        throw new Error(`Agent ${agentId} not found`);
      }

      if (!agent.tools.includes(toolId)) {
        throw new Error(`Agent ${agentId} does not have access to tool ${toolId}`);
      }

      const execution: ToolExecution = {
        id: `execution-${Date.now()}`,
        toolId,
        agentId,
        parameters,
        result: null,
        status: 'pending',
        executionTime: 0,
        createdAt: new Date().toISOString(),
      };

      this.executions.push(execution);

      // Simulate tool execution
      await this.simulateToolExecution(execution, tool, parameters);

      logger.info(`Executed tool ${toolId} with agent ${agentId}`);
      return execution;
    } catch (error) {
      logger.error(`Error executing tool ${toolId}:`, error);
      throw error;
    }
  }

  private async simulateToolExecution(execution: ToolExecution, tool: Tool, parameters: Record<string, any>): Promise<void> {
    execution.status = 'running';
    const startTime = Date.now();

    try {
      // Simulate different tool behaviors based on category
      switch (tool.category) {
        case 'data':
          execution.result = {
            insights: ['Data pattern detected', 'Trend analysis complete'],
            metrics: { accuracy: 0.95, confidence: 0.87 },
            recommendations: ['Consider expanding data sources', 'Implement real-time monitoring'],
          };
          break;
        case 'communication':
          execution.result = {
            message: 'Professional email composed successfully',
            subject: 'Business Update',
            content: 'Thank you for your inquiry. I have prepared a comprehensive response...',
            tone: parameters.tone || 'professional',
          };
          break;
        case 'automation':
          execution.result = {
            tasksAutomated: 5,
            timeSaved: '2 hours',
            workflowOptimized: true,
            nextSteps: ['Schedule follow-up', 'Update documentation'],
          };
          break;
        case 'analysis':
          execution.result = {
            reportGenerated: true,
            keyFindings: ['Revenue increased 15%', 'Customer satisfaction improved'],
            charts: ['trend-chart', 'comparison-chart'],
            executiveSummary: 'Overall business performance is positive with room for improvement in efficiency.',
          };
          break;
        case 'integration':
          execution.result = {
            connectionEstablished: true,
            dataSynced: true,
            apiCalls: 12,
            status: 'Connected and operational',
          };
          break;
        default:
          execution.result = { message: 'Tool executed successfully' };
      }

      execution.status = 'completed';
      execution.executionTime = Date.now() - startTime;
    } catch (error) {
      execution.status = 'failed';
      execution.error = error instanceof Error ? error.message : 'Unknown error';
      execution.executionTime = Date.now() - startTime;
    }
  }

  async getExecutionHistory(agentId?: string, toolId?: string): Promise<ToolExecution[]> {
    try {
      let filtered = this.executions;

      if (agentId) {
        filtered = filtered.filter(exec => exec.agentId === agentId);
      }

      if (toolId) {
        filtered = filtered.filter(exec => exec.toolId === toolId);
      }

      return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      logger.error('Error getting execution history:', error);
      return [];
    }
  }

  async createAgent(agent: Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>): Promise<Agent> {
    try {
      const newAgent: Agent = {
        ...agent,
        id: `agent-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      this.agents.set(newAgent.id, newAgent);
      logger.info(`Created new agent: ${newAgent.name}`);
      return newAgent;
    } catch (error) {
      logger.error('Error creating agent:', error);
      throw error;
    }
  }

  async createTool(tool: Omit<Tool, 'id' | 'createdAt' | 'updatedAt'>): Promise<Tool> {
    try {
      const newTool: Tool = {
        ...tool,
        id: `tool-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      this.tools.set(newTool.id, newTool);
      logger.info(`Created new tool: ${newTool.name}`);
      return newTool;
    } catch (error) {
      logger.error('Error creating tool:', error);
      throw error;
    }
  }

  async updateAgent(id: string, updates: Partial<Agent>): Promise<Agent | null> {
    try {
      const agent = this.agents.get(id);
      if (!agent) {
        return null;
      }

      const updatedAgent: Agent = {
        ...agent,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      this.agents.set(id, updatedAgent);
      logger.info(`Updated agent: ${updatedAgent.name}`);
      return updatedAgent;
    } catch (error) {
      logger.error(`Error updating agent ${id}:`, error);
      return null;
    }
  }

  async updateTool(id: string, updates: Partial<Tool>): Promise<Tool | null> {
    try {
      const tool = this.tools.get(id);
      if (!tool) {
        return null;
      }

      const updatedTool: Tool = {
        ...tool,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      this.tools.set(id, updatedTool);
      logger.info(`Updated tool: ${updatedTool.name}`);
      return updatedTool;
    } catch (error) {
      logger.error(`Error updating tool ${id}:`, error);
      return null;
    }
  }

  async getAgentTools(agentId: string): Promise<Tool[]> {
    try {
      const agent = this.agents.get(agentId);
      if (!agent) {
        return [];
      }

      return agent.tools.map(toolId => this.tools.get(toolId)).filter(Boolean) as Tool[];
    } catch (error) {
      logger.error(`Error getting tools for agent ${agentId}:`, error);
      return [];
    }
  }

  async addToolToAgent(agentId: string, toolId: string): Promise<boolean> {
    try {
      const agent = this.agents.get(agentId);
      const tool = this.tools.get(toolId);

      if (!agent || !tool) {
        return false;
      }

      if (!agent.tools.includes(toolId)) {
        agent.tools.push(toolId);
        agent.updatedAt = new Date().toISOString();
        this.agents.set(agentId, agent);
        logger.info(`Added tool ${toolId} to agent ${agentId}`);
      }

      return true;
    } catch (error) {
      logger.error(`Error adding tool ${toolId} to agent ${agentId}:`, error);
      return false;
    }
  }

  async removeToolFromAgent(agentId: string, toolId: string): Promise<boolean> {
    try {
      const agent = this.agents.get(agentId);
      if (!agent) {
        return false;
      }

      const toolIndex = agent.tools.indexOf(toolId);
      if (toolIndex > -1) {
        agent.tools.splice(toolIndex, 1);
        agent.updatedAt = new Date().toISOString();
        this.agents.set(agentId, agent);
        logger.info(`Removed tool ${toolId} from agent ${agentId}`);
      }

      return true;
    } catch (error) {
      logger.error(`Error removing tool ${toolId} from agent ${agentId}:`, error);
      return false;
    }
  }
}

// Export singleton instance
export const toolEnabledAgent = new AIAgentWithTools(); 