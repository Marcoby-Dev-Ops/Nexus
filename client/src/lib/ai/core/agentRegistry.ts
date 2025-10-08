import { BaseService } from '@/core/services/BaseService';

// Stronger type definitions
export type AgentType = 'executive' | 'departmental' | 'specialist';
export type Department = 'sales' | 'marketing' | 'finance' | 'operations' | 'hr' | 'legal' | 'it' | string;
export type ExpertiseLevel = 'junior' | 'senior' | 'expert';

export interface AgentPersonality {
  communicationStyle: string;
  expertise_level: ExpertiseLevel;
  tone: string;
  background: string;
}

export interface BaseAgent {
  id: string;
  name: string;
  type: AgentType;
  systemPrompt: string;
  personality: AgentPersonality;
  tags?: string[];
  fetchContextData?: () => Promise<Record<string, any>>;
  metadata?: Record<string, any>;
}

export interface DepartmentalAgent extends BaseAgent {
  type: 'departmental';
  department: Department;
}

export interface ExecutiveAgent extends BaseAgent {
  type: 'executive';
}

export interface SpecialistAgent extends BaseAgent {
  type: 'specialist';
  specialization: string;
}

export type ChatAgent = ExecutiveAgent | DepartmentalAgent | SpecialistAgent;

// Prompt builder utility
export function buildPrompt(config: {
  persona: string;
  bio: string;
  role: string[];
  style: string;
  dataAccess?: string;
  expertise?: string[];
}): string {
  const { persona, bio, role, style, dataAccess, expertise } = config;
  
  let prompt = `You are ${persona} with ${bio}. `;
  
  if (expertise && expertise.length > 0) {
    prompt += `\n\nYour expertise includes:\n${expertise.map(exp => `- ${exp}`).join('\n')}`;
  }
  
  prompt += `\n\nYour role is to:\n${role.map(r => `- ${r}`).join('\n')}`;
  
  prompt += `\n\nCommunication Style: ${style}`;
  
  if (dataAccess) {
    prompt += `\n\nWhen discussing relevant matters, you have access to ${dataAccess} and can provide specific insights based on current data.`;
  }
  
  return prompt;
}

// Agent definitions with improved structure
export const executiveAgent: ExecutiveAgent = {
  id: 'executive-assistant',
  name: 'Executive Assistant',
  type: 'executive',
  systemPrompt: buildPrompt({
    persona: 'an experienced Executive Assistant',
    bio: '15+ years of experience supporting C-level executives and business leaders',
    role: [
      'Provide strategic insights and business intelligence',
      'Help with decision-making and prioritization',
      'Offer comprehensive business analysis',
      'Coordinate across departments and functions',
      'Maintain a high-level perspective on business operations'
    ],
    style: 'Professional, strategic, and comprehensive. You provide well-rounded insights that consider multiple perspectives and business implications.',
    dataAccess: 'real-time company data and can provide specific insights about the business\'s performance, health, and strategic position'
  }),
  personality: {
    communicationStyle: 'strategic',
    expertise_level: 'senior',
    tone: 'professional',
    background: '15+ years supporting C-level executives with deep business acumen'
  },
  tags: ['strategy', 'leadership', 'coordination', 'business-intelligence'],
  async fetchContextData() {
    // TODO: Implement real-time company data fetching
    return {
      companyMetrics: {},
      strategicInitiatives: [],
      crossDepartmentalProjects: []
    };
  }
};

export const salesAgent: DepartmentalAgent = {
  id: 'sales-director',
  name: 'Sales Director',
  type: 'departmental',
  department: 'sales',
  systemPrompt: buildPrompt({
    persona: 'VP of Sales',
    bio: '18+ years of experience in B2B sales and revenue growth',
    role: [
      'Analyze and optimize sales pipeline',
      'Provide revenue forecasting and planning',
      'Coach and improve sales team performance',
      'Manage customer relationships',
      'Analyze market and competitive positioning'
    ],
    style: 'Results-driven, data-focused, and action-oriented. You provide specific, actionable insights backed by sales metrics and performance data.',
    dataAccess: 'real-time sales data including pipeline metrics, conversion rates, and team performance indicators'
  }),
  personality: {
    communicationStyle: 'results-driven',
    expertise_level: 'expert',
    tone: 'motivational',
    background: '18+ years in B2B sales leadership with proven track record of revenue growth'
  },
  tags: ['sales', 'revenue', 'pipeline', 'coaching', 'forecasting'],
  async fetchContextData() {
    // TODO: Implement real-time sales data fetching
    return {
      pipelineMetrics: {},
      conversionRates: {},
      teamPerformance: {},
      revenueData: {}
    };
  }
};

export const marketingAgent: DepartmentalAgent = {
  id: 'marketing-cmo',
  name: 'Marketing CMO',
  type: 'departmental',
  department: 'marketing',
  systemPrompt: buildPrompt({
    persona: 'Chief Marketing Officer',
    bio: '12+ years of experience in digital marketing, brand strategy, and growth marketing',
    role: [
      'Analyze and optimize marketing campaign performance',
      'Develop customer acquisition and retention strategies',
      'Position brand and messaging effectively',
      'Analyze marketing ROI',
      'Optimize digital marketing channels and automation'
    ],
    style: 'Creative, analytical, and growth-focused. You combine creative thinking with data analysis to drive marketing effectiveness.',
    dataAccess: 'real-time marketing data including campaign metrics, conversion rates, and customer acquisition costs'
  }),
  personality: {
    communicationStyle: 'creative-analytical',
    expertise_level: 'expert',
    tone: 'innovative',
    background: '12+ years in digital marketing and growth strategy with focus on data-driven decisions'
  },
  tags: ['marketing', 'growth', 'branding', 'analytics', 'campaigns'],
  async fetchContextData() {
    // TODO: Implement real-time marketing data fetching
    return {
      campaignMetrics: {},
      conversionData: {},
      customerAcquisitionCosts: {},
      brandMetrics: {}
    };
  }
};

export const financeAgent: DepartmentalAgent = {
  id: 'finance-cfo',
  name: 'Finance CFO',
  type: 'departmental',
  department: 'finance',
  systemPrompt: buildPrompt({
    persona: 'Chief Financial Officer',
    bio: '20+ years of experience in financial management, strategic planning, and business finance',
    role: [
      'Analyze financial performance and provide reporting',
      'Manage cash flow and forecasting',
      'Plan budgets and optimize costs',
      'Assess and mitigate financial risks',
      'Analyze investments and allocate capital'
    ],
    style: 'Analytical, precise, and strategic. You provide clear financial insights with actionable recommendations for business improvement.',
    dataAccess: 'real-time financial data including revenue, expenses, cash flow, and key financial metrics'
  }),
  personality: {
    communicationStyle: 'analytical',
    expertise_level: 'senior',
    tone: 'authoritative',
    background: '20+ years in financial leadership with expertise in strategic financial management'
  },
  tags: ['finance', 'budgeting', 'forecasting', 'risk-management', 'investment'],
  async fetchContextData() {
    // TODO: Implement real-time financial data fetching
    return {
      revenue: {},
      expenses: {},
      cashFlow: {},
      financialMetrics: {}
    };
  }
};

export const operationsAgent: DepartmentalAgent = {
  id: 'operations-director',
  name: 'Operations Director',
  type: 'departmental',
  department: 'operations',
  systemPrompt: buildPrompt({
    persona: 'Director of Operations',
    bio: '14+ years of experience in operational excellence, process optimization, and team management',
    role: [
      'Optimize processes and improve efficiency',
      'Analyze team performance and productivity',
      'Track operational metrics and KPIs',
      'Plan resource allocation and capacity',
      'Manage quality and continuous improvement'
    ],
    style: 'Practical, systematic, and efficiency-focused. You provide actionable recommendations for operational improvements and performance optimization.',
    dataAccess: 'real-time operational data including productivity metrics, process efficiency, and team performance indicators'
  }),
  personality: {
    communicationStyle: 'systematic',
    expertise_level: 'expert',
    tone: 'practical',
    background: '14+ years in operations management with focus on efficiency and scalability'
  },
  tags: ['operations', 'efficiency', 'processes', 'productivity', 'optimization'],
  async fetchContextData() {
    // TODO: Implement real-time operations data fetching
    return {
      productivityMetrics: {},
      processEfficiency: {},
      teamPerformance: {},
      operationalKPIs: {}
    };
  }
};

/**
 * Agent Registry Service
 * 
 * Manages the registry of available chat agents and provides
 * methods to retrieve and filter agents by various criteria.
 * Supports async data fetching, tags-based routing, and tenant-specific overrides.
 */
export class AgentRegistryService extends BaseService {
  private static instance: AgentRegistryService;
  private agents: Record<string, ChatAgent>;
  private tenantOverrides: Record<string, Record<string, Partial<ChatAgent>>>;

  private constructor() {
    super();
    this.agents = {
      'executive-assistant': executiveAgent,
      'sales-director': salesAgent,
      'marketing-cmo': marketingAgent,
      'finance-cfo': financeAgent,
      'operations-director': operationsAgent
    };
    this.tenantOverrides = {};
  }

  public static getInstance(): AgentRegistryService {
    if (!AgentRegistryService.instance) {
      AgentRegistryService.instance = new AgentRegistryService();
    }
    return AgentRegistryService.instance;
  }

  /**
   * Get an agent by ID with optional tenant-specific overrides
   */
  public getAgent(agentId: string, tenantId?: string): ChatAgent | undefined {
    const baseAgent = this.agents[agentId];
    if (!baseAgent) return undefined;

    if (tenantId && this.tenantOverrides[tenantId]?.[agentId]) {
      return { ...baseAgent, ...this.tenantOverrides[tenantId][agentId] } as ChatAgent;
    }

    return baseAgent;
  }

  /**
   * Get all agents with optional tenant-specific overrides
   */
  public getAllAgents(tenantId?: string): ChatAgent[] {
    return Object.keys(this.agents).map(id => this.getAgent(id, tenantId)!);
  }

  /**
   * Get agents by type
   */
  public getAgentsByType(type: AgentType, tenantId?: string): ChatAgent[] {
    return this.getAllAgents(tenantId).filter(agent => agent.type === type);
  }

  /**
   * Get agents by department
   */
  public getAgentsByDepartment(department: Department, tenantId?: string): ChatAgent[] {
    return this.getAllAgents(tenantId).filter(agent => 
      agent.type === 'departmental' && agent.department === department
    );
  }

  /**
   * Get agents by tag
   */
  public getAgentsByTag(tag: string, tenantId?: string): ChatAgent[] {
    return this.getAllAgents(tenantId).filter(agent => 
      agent.tags?.includes(tag)
    );
  }

  /**
   * Get agents by multiple tags (AND logic)
   */
  public getAgentsByTags(tags: string[], tenantId?: string): ChatAgent[] {
    return this.getAllAgents(tenantId).filter(agent => 
      tags.every(tag => agent.tags?.includes(tag))
    );
  }

  /**
   * Get department agent by department name
   */
  public getDepartmentAgentByDepartment(department: Department, tenantId?: string): DepartmentalAgent | undefined {
    const agent = this.getAllAgents(tenantId).find(agent => 
      agent.type === 'departmental' && agent.department === department
    );
    return agent as DepartmentalAgent | undefined;
  }

  /**
   * Get department agent by agent ID
   */
  public getDepartmentAgent(agentId: string, tenantId?: string): DepartmentalAgent | undefined {
    const agent = this.getAgent(agentId, tenantId);
    return agent?.type === 'departmental' ? agent : undefined;
  }

  /**
   * Add a new agent to the registry
   */
  public addAgent(agent: ChatAgent): void {
    this.agents[agent.id] = agent;
  }

  /**
   * Remove an agent from the registry
   */
  public removeAgent(agentId: string): void {
    delete this.agents[agentId];
  }

  /**
   * Check if an agent exists
   */
  public hasAgent(agentId: string): boolean {
    return agentId in this.agents;
  }

  /**
   * Get agent count
   */
  public getAgentCount(): number {
    return Object.keys(this.agents).length;
  }

  /**
   * Add tenant-specific agent override
   */
  public addTenantOverride(tenantId: string, agentId: string, override: Partial<ChatAgent>): void {
    if (!this.tenantOverrides[tenantId]) {
      this.tenantOverrides[tenantId] = {};
    }
    this.tenantOverrides[tenantId][agentId] = override;
  }

  /**
   * Remove tenant-specific agent override
   */
  public removeTenantOverride(tenantId: string, agentId: string): void {
    if (this.tenantOverrides[tenantId]) {
      delete this.tenantOverrides[tenantId][agentId];
      if (Object.keys(this.tenantOverrides[tenantId]).length === 0) {
        delete this.tenantOverrides[tenantId];
      }
    }
  }

  /**
   * Get all available tags
   */
  public getAllTags(): string[] {
    const tags = new Set<string>();
    this.getAllAgents().forEach(agent => {
      agent.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }

  /**
   * Get agents with context data
   */
  public async getAgentWithContext(agentId: string, tenantId?: string): Promise<(ChatAgent & { contextData?: Record<string, any> }) | undefined> {
    const agent = this.getAgent(agentId, tenantId);
    if (!agent) return undefined;

    let contextData: Record<string, any> | undefined;
    if (agent.fetchContextData) {
      try {
        contextData = await agent.fetchContextData();
      } catch (error) {
        console.warn(`Failed to fetch context data for agent ${agentId}:`, error);
      }
    }

    return { ...agent, contextData };
  }

  /**
   * Find best agent for a given intent/task
   */
  public findAgentForIntent(intent: string, tenantId?: string): ChatAgent | undefined {
    const intentTags = intent.toLowerCase().split(/\s+/);
    
    // Try exact tag matches first
    const exactMatches = this.getAgentsByTags(intentTags, tenantId);
    if (exactMatches.length > 0) {
      return exactMatches[0];
    }

    // Try partial tag matches
    const partialMatches = this.getAllAgents(tenantId).filter(agent =>
      agent.tags?.some(tag => 
        intentTags.some(intentTag => tag.includes(intentTag) || intentTag.includes(tag))
      )
    );

    if (partialMatches.length > 0) {
      return partialMatches[0];
    }

    // Fallback to executive agent
    return this.getAgent('executive-assistant', tenantId);
  }
}

// Export singleton instance
export const agentRegistry = AgentRegistryService.getInstance();

// Legacy exports for backward compatibility
export function getAgent(agentId: string): ChatAgent {
  return agentRegistry.getAgent(agentId) || executiveAgent;
}

export function getAllAgents(): ChatAgent[] {
  return agentRegistry.getAllAgents();
}

export function getAgentsByType(type: AgentType): ChatAgent[] {
  return agentRegistry.getAgentsByType(type);
}

export function getAgentsByDepartment(department: Department): ChatAgent[] {
  return agentRegistry.getAgentsByDepartment(department);
}
