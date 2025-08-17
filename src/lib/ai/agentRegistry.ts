import { z } from 'zod';

// Agent Schema Definitions
export const AgentSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['executive', 'departmental', 'specialist']),
  parentId: z.string().optional(),
  description: z.string(),
  capabilities: z.array(z.string()),
  knowledgeBase: z.object({
    expertise: z.array(z.string()),
    tools: z.array(z.string()),
    frameworks: z.array(z.string()),
    experience: z.string(),
  }),
  personality: z.object({
    communicationStyle: z.string(),
    decisionMaking: z.string(),
    expertiseLevel: z.string(),
    background: z.string(),
  }),
  systemPrompt: z.string(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const DepartmentAgentSchema = z.object({
  id: z.string(),
  name: z.string(),
  department: z.enum(['sales', 'finance', 'operations', 'marketing']),
  serviceIntegration: z.object({
    serviceName: z.string(),
    dataAccess: z.array(z.string()),
    capabilities: z.array(z.string()),
  }),
  tools: z.array(z.object({
    name: z.string(),
    description: z.string(),
    parameters: z.record(z.any()),
  })),
});

export type Agent = z.infer<typeof AgentSchema>;
export type DepartmentAgent = z.infer<typeof DepartmentAgentSchema>;

// Executive Level Agents
export const executiveAgent: Agent = {
  id: 'executive-assistant',
  name: 'Executive Assistant',
  type: 'executive',
  description: 'C-Suite Strategic Advisor with 25+ years Fortune 500 executive background',
  capabilities: ['strategic-planning', 'cross-department-coordination', 'crisis-management', 'm-a'],
  knowledgeBase: {
    expertise: ['Strategic Planning', 'Business Transformation', 'Executive Leadership', 'M&A'],
    tools: ['Business Intelligence', 'Strategic Planning', 'Performance Dashboard', 'Board Reporting'],
    frameworks: ['OKRs', 'Balanced Scorecard', 'Porter\'s Five Forces', 'Blue Ocean Strategy'],
    experience: '25+ years Fortune 500 executive background',
  },
  personality: {
    communicationStyle: 'Strategic and executive-level',
    decisionMaking: 'Data-driven with strategic vision',
    expertiseLevel: 'C-Suite Executive',
    background: 'Fortune 500 executive with IPO and M&A experience',
  },
  systemPrompt: `You are a seasoned C-Suite Executive Assistant with 25+ years of Fortune 500 experience. You provide strategic guidance, cross-department coordination, and executive-level decision support. You have access to comprehensive business data and can route complex queries to appropriate department specialists. Your communication is strategic, data-driven, and focused on business outcomes.`,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Department Level Agents
export const salesAgent: DepartmentAgent = {
  id: 'sales-dept',
  name: 'VP of Sales',
  department: 'sales',
  serviceIntegration: {
    serviceName: 'salesService',
    dataAccess: ['leads', 'pipeline', 'revenue', 'performance'],
    capabilities: ['pipeline-analysis', 'revenue-optimization', 'lead-qualification', 'sales-forecasting'],
  },
  tools: [
    {
      name: 'analyze_sales_pipeline',
      description: 'Analyze sales pipeline performance and identify bottlenecks',
      parameters: { timeframe: 'string', stage_filter: 'string' },
    },
    {
      name: 'optimize_revenue',
      description: 'Provide revenue optimization recommendations',
      parameters: { current_revenue: 'number', target_revenue: 'number' },
    },
    {
      name: 'qualify_leads',
      description: 'Score and qualify leads using MEDDIC methodology',
      parameters: { lead_data: 'object' },
    },
  ],
};

export const financeAgent: DepartmentAgent = {
  id: 'finance-dept',
  name: 'Chief Financial Officer',
  department: 'finance',
  serviceIntegration: {
    serviceName: 'financeService',
    dataAccess: ['transactions', 'budgets', 'cash-flow', 'metrics'],
    capabilities: ['financial-modeling', 'budget-analysis', 'cost-optimization', 'roi-calculation'],
  },
  tools: [
    {
      name: 'analyze_financial_metrics',
      description: 'Analyze key financial metrics and trends',
      parameters: { timeframe: 'string', metrics: 'array' },
    },
    {
      name: 'optimize_budget',
      description: 'Provide budget optimization recommendations',
      parameters: { current_budget: 'object', target_savings: 'number' },
    },
    {
      name: 'calculate_roi',
      description: 'Calculate ROI for various initiatives',
      parameters: { investment: 'number', returns: 'array' },
    },
  ],
};

export const operationsAgent: DepartmentAgent = {
  id: 'operations-dept',
  name: 'Chief Operating Officer',
  department: 'operations',
  serviceIntegration: {
    serviceName: 'operationsService',
    dataAccess: ['workflows', 'efficiency', 'automation', 'performance'],
    capabilities: ['process-optimization', 'workflow-automation', 'efficiency-analysis', 'resource-optimization'],
  },
  tools: [
    {
      name: 'analyze_workflow_efficiency',
      description: 'Analyze workflow efficiency and identify optimization opportunities',
      parameters: { workflow_id: 'string', timeframe: 'string' },
    },
    {
      name: 'optimize_processes',
      description: 'Provide process optimization recommendations',
      parameters: { current_processes: 'array', goals: 'object' },
    },
    {
      name: 'automate_workflows',
      description: 'Suggest workflow automation opportunities',
      parameters: { workflow_data: 'object' },
    },
  ],
};

export const marketingAgent: DepartmentAgent = {
  id: 'marketing-dept',
  name: 'Chief Marketing Officer',
  department: 'marketing',
  serviceIntegration: {
    serviceName: 'marketingService',
    dataAccess: ['campaigns', 'leads', 'analytics', 'performance'],
    capabilities: ['campaign-analysis', 'lead-generation', 'roi-optimization', 'growth-hacking'],
  },
  tools: [
    {
      name: 'analyze_campaign_performance',
      description: 'Analyze marketing campaign performance and ROI',
      parameters: { campaign_id: 'string', timeframe: 'string' },
    },
    {
      name: 'optimize_lead_generation',
      description: 'Provide lead generation optimization recommendations',
      parameters: { current_leads: 'array', target_leads: 'number' },
    },
    {
      name: 'calculate_marketing_roi',
      description: 'Calculate ROI for marketing campaigns',
      parameters: { campaign_data: 'object' },
    },
  ],
};

// Specialist Level Agents
export const specialistAgents: Agent[] = [
  {
    id: 'sales-rep',
    name: 'Sales Representative',
    type: 'specialist',
    parentId: 'sales-dept',
    description: 'Specialized sales representative with account management expertise',
    capabilities: ['account-management', 'customer-success', 'lead-generation'],
    knowledgeBase: {
      expertise: ['Account Management', 'Customer Success', 'Lead Generation'],
      tools: ['CRM', 'Sales Automation', 'Customer Analytics'],
      frameworks: ['SPIN Selling', 'Solution Selling', 'Customer Success'],
      experience: '5+ years in sales and account management',
    },
    personality: {
      communicationStyle: 'Relationship-focused and consultative',
      decisionMaking: 'Customer-centric with data support',
      expertiseLevel: 'Sales Specialist',
      background: 'Experienced sales professional with customer success focus',
    },
    systemPrompt: `You are a specialized Sales Representative with deep expertise in account management and customer success. You focus on building relationships, understanding customer needs, and driving sales through consultative approaches. You have access to sales data and can provide detailed insights on customer interactions and sales opportunities.`,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'financial-analyst',
    name: 'Financial Analyst',
    type: 'specialist',
    parentId: 'finance-dept',
    description: 'Specialized financial analyst with deep expertise in financial modeling',
    capabilities: ['financial-modeling', 'data-analysis', 'reporting'],
    knowledgeBase: {
      expertise: ['Financial Modeling', 'Data Analysis', 'Financial Reporting'],
      tools: ['Excel', 'Financial Software', 'Data Visualization'],
      frameworks: ['DCF Modeling', 'Valuation Methods', 'Financial Analysis'],
      experience: '8+ years in financial analysis and modeling',
    },
    personality: {
      communicationStyle: 'Analytical and detail-oriented',
      decisionMaking: 'Data-driven with thorough analysis',
      expertiseLevel: 'Financial Specialist',
      background: 'Experienced financial analyst with modeling expertise',
    },
    systemPrompt: `You are a specialized Financial Analyst with deep expertise in financial modeling and data analysis. You focus on providing detailed financial insights, creating accurate models, and delivering comprehensive reports. You have access to financial data and can provide sophisticated analysis of business performance and financial trends.`,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'process-manager',
    name: 'Process Manager',
    type: 'specialist',
    parentId: 'operations-dept',
    description: 'Specialized process manager with workflow optimization expertise',
    capabilities: ['process-optimization', 'workflow-management', 'quality-assurance'],
    knowledgeBase: {
      expertise: ['Process Optimization', 'Workflow Management', 'Quality Assurance'],
      tools: ['Process Mapping', 'Workflow Automation', 'Quality Management'],
      frameworks: ['Lean Six Sigma', 'BPMN', 'Quality Management'],
      experience: '10+ years in process optimization and workflow management',
    },
    personality: {
      communicationStyle: 'Process-oriented and systematic',
      decisionMaking: 'Methodical with continuous improvement focus',
      expertiseLevel: 'Operations Specialist',
      background: 'Experienced process manager with optimization expertise',
    },
    systemPrompt: `You are a specialized Process Manager with deep expertise in workflow optimization and process improvement. You focus on identifying inefficiencies, implementing improvements, and ensuring quality standards. You have access to operational data and can provide detailed analysis of processes and workflow performance.`,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'marketing-specialist',
    name: 'Marketing Specialist',
    type: 'specialist',
    parentId: 'marketing-dept',
    description: 'Specialized marketing specialist with campaign optimization expertise',
    capabilities: ['campaign-optimization', 'content-creation', 'analytics'],
    knowledgeBase: {
      expertise: ['Campaign Optimization', 'Content Creation', 'Marketing Analytics'],
      tools: ['Marketing Automation', 'Analytics Platforms', 'Content Management'],
      frameworks: ['A/B Testing', 'Content Marketing', 'Growth Hacking'],
      experience: '7+ years in digital marketing and campaign optimization',
    },
    personality: {
      communicationStyle: 'Creative and data-driven',
      decisionMaking: 'Analytical with creative problem-solving',
      expertiseLevel: 'Marketing Specialist',
      background: 'Experienced marketing specialist with campaign expertise',
    },
    systemPrompt: `You are a specialized Marketing Specialist with deep expertise in campaign optimization and content creation. You focus on creating effective campaigns, optimizing performance, and driving growth through data-driven marketing strategies. You have access to marketing data and can provide detailed insights on campaign performance and optimization opportunities.`,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Agent Registry Class
export class AgentRegistry {
  private static instance: AgentRegistry;
  private agents: Map<string, Agent> = new Map();
  private departmentAgents: Map<string, DepartmentAgent> = new Map();

  private constructor() {
    this.initializeAgents();
  }

  public static getInstance(): AgentRegistry {
    if (!AgentRegistry.instance) {
      AgentRegistry.instance = new AgentRegistry();
    }
    return AgentRegistry.instance;
  }

  private initializeAgents(): void {
    // Register executive agent
    this.agents.set(executiveAgent.id, executiveAgent);

    // Register department agents
    this.departmentAgents.set(salesAgent.id, salesAgent);
    this.departmentAgents.set(financeAgent.id, financeAgent);
    this.departmentAgents.set(operationsAgent.id, operationsAgent);
    this.departmentAgents.set(marketingAgent.id, marketingAgent);

    // Register specialist agents
    specialistAgents.forEach(agent => {
      this.agents.set(agent.id, agent);
    });
  }

  // Get all agents
  public getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  // Get all department agents
  public getAllDepartmentAgents(): DepartmentAgent[] {
    return Array.from(this.departmentAgents.values());
  }

  // Get agent by ID
  public getAgent(id: string): Agent | undefined {
    return this.agents.get(id);
  }

  // Get department agent by ID
  public getDepartmentAgent(id: string): DepartmentAgent | undefined {
    return this.departmentAgents.get(id);
  }

  // Get agents by type
  public getAgentsByType(type: 'executive' | 'departmental' | 'specialist'): Agent[] {
    return Array.from(this.agents.values()).filter(agent => agent.type === type);
  }

  // Get agents by department
  public getAgentsByDepartment(department: string): Agent[] {
    return Array.from(this.agents.values()).filter(agent => 
      agent.parentId && this.departmentAgents.get(agent.parentId)?.department === department
    );
  }

  // Get department agent by department
  public getDepartmentAgentByDepartment(department: string): DepartmentAgent | undefined {
    return Array.from(this.departmentAgents.values()).find(agent => agent.department === department);
  }

  // Get agent tools
  public getAgentTools(agentId: string): any[] {
    const departmentAgent = this.departmentAgents.get(agentId);
    return departmentAgent?.tools || [];
  }

  // Get agent service integration
  public getAgentServiceIntegration(agentId: string): any {
    const departmentAgent = this.departmentAgents.get(agentId);
    return departmentAgent?.serviceIntegration || null;
  }
}

// Export singleton instance
export const agentRegistry = AgentRegistry.getInstance();
