import { logger } from '@/shared/utils/logger.ts';

export interface Agent {
  id: string;
  name: string;
  type: 'executive' | 'analyst' | 'assistant' | 'specialist';
  description: string;
  capabilities: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Default agents
const defaultAgents: Agent[] = [
  {
    id: 'executive-agent',
    name: 'Executive Agent',
    type: 'executive',
    description: 'High-level strategic decision making and business oversight',
    capabilities: ['strategy', 'planning', 'leadership', 'decision-making'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'analyst-agent',
    name: 'Analyst Agent',
    type: 'analyst',
    description: 'Data analysis and insights generation',
    capabilities: ['data-analysis', 'reporting', 'insights', 'metrics'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'assistant-agent',
    name: 'Assistant Agent',
    type: 'assistant',
    description: 'General task assistance and productivity support',
    capabilities: ['task-management', 'productivity', 'communication', 'organization'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'specialist-agent',
    name: 'Specialist Agent',
    type: 'specialist',
    description: 'Domain-specific expertise and specialized tasks',
    capabilities: ['specialized-tasks', 'domain-expertise', 'technical-support'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

class AgentRegistry {
  private agents: Map<string, Agent> = new Map();

  constructor() {
    this.initializeDefaultAgents();
  }

  private initializeDefaultAgents(): void {
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

  async getAgentsByType(type: Agent['type']): Promise<Agent[]> {
    try {
      return Array.from(this.agents.values()).filter(agent => agent.type === type);
    } catch (error) {
      logger.error(`Error getting agents by type ${type}:`, error);
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

  async createAgent(agent: Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>): Promise<Agent> {
    try {
      const newAgent: Agent = {
        ...agent,
        id: `agent-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.agents.set(newAgent.id, newAgent);
      logger.info(`Created new agent: ${newAgent.name}`);
      return newAgent;
    } catch (error) {
      logger.error('Error creating agent:', error);
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
        updatedAt: new Date()
      };
      this.agents.set(id, updatedAgent);
      logger.info(`Updated agent: ${updatedAgent.name}`);
      return updatedAgent;
    } catch (error) {
      logger.error(`Error updating agent ${id}:`, error);
      return null;
    }
  }

  async deleteAgent(id: string): Promise<boolean> {
    try {
      const deleted = this.agents.delete(id);
      if (deleted) {
        logger.info(`Deleted agent: ${id}`);
      }
      return deleted;
    } catch (error) {
      logger.error(`Error deleting agent ${id}:`, error);
      return false;
    }
  }

  async activateAgent(id: string): Promise<boolean> {
    try {
      const agent = this.agents.get(id);
      if (!agent) {
        return false;
      }
      agent.isActive = true;
      agent.updatedAt = new Date();
      this.agents.set(id, agent);
      logger.info(`Activated agent: ${agent.name}`);
      return true;
    } catch (error) {
      logger.error(`Error activating agent ${id}:`, error);
      return false;
    }
  }

  async deactivateAgent(id: string): Promise<boolean> {
    try {
      const agent = this.agents.get(id);
      if (!agent) {
        return false;
      }
      agent.isActive = false;
      agent.updatedAt = new Date();
      this.agents.set(id, agent);
      logger.info(`Deactivated agent: ${agent.name}`);
      return true;
    } catch (error) {
      logger.error(`Error deactivating agent ${id}:`, error);
      return false;
    }
  }
}

// Export singleton instance
export const agentRegistry = new AgentRegistry();

// Export executive agent for backward compatibility
export const executiveAgent = defaultAgents[0];

// Export functions for backward compatibility
export const getAllAgents = () => agentRegistry.getAllAgents();
export const getAgentsByType = (type: Agent['type']) => agentRegistry.getAgentsByType(type); 