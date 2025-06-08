/**
 * agentRegistry.ts
 *
 * Central registry for all available chat agents in Nexus.
 * Organized in a hierarchical structure: Executive → Departmental → Sub-Assistants
 */

export interface Agent {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  webhookUrl: string;
  type: 'executive' | 'departmental' | 'specialist';
  department?: string;
  parentId?: string; // For hierarchical structure
  specialties?: string[]; // Areas of expertise
}

// Executive Level
export const executiveAgent: Agent = {
  id: 'executive',
  name: 'Executive Assistant',
  description: 'Your central AI concierge orchestrating all departments and workflows',
  avatar: '👔',
  webhookUrl: 'https://automate.marcoby.net/webhook/113b0614-3175-44d6-a142-88a11fc49f42',
  type: 'executive',
  specialties: ['strategic planning', 'cross-department coordination', 'executive reporting']
};

// Departmental Assistants
export const departmentalAgents: Agent[] = [
  {
    id: 'sales-dept',
    name: 'Sales Department Head',
    description: 'Oversees all sales operations, pipeline management, and revenue optimization',
    avatar: '💼',
    webhookUrl: 'https://your-sales-dept-webhook-url',
    type: 'departmental',
    department: 'sales',
    parentId: 'executive',
    specialties: ['sales strategy', 'team management', 'revenue forecasting']
  },
  {
    id: 'marketing-dept',
    name: 'Marketing Department Head',
    description: 'Manages marketing campaigns, brand strategy, and customer acquisition',
    avatar: '🎯',
    webhookUrl: 'https://your-marketing-dept-webhook-url',
    type: 'departmental',
    department: 'marketing',
    parentId: 'executive',
    specialties: ['campaign management', 'brand strategy', 'lead generation']
  },
  {
    id: 'finance-dept',
    name: 'Finance Department Head',
    description: 'Handles financial planning, budgeting, and financial reporting',
    avatar: '💰',
    webhookUrl: 'https://your-finance-dept-webhook-url',
    type: 'departmental',
    department: 'finance',
    parentId: 'executive',
    specialties: ['financial planning', 'budgeting', 'compliance']
  },
  {
    id: 'operations-dept',
    name: 'Operations Department Head',
    description: 'Manages operational efficiency, process optimization, and resource allocation',
    avatar: '⚙️',
    webhookUrl: 'https://your-operations-dept-webhook-url',
    type: 'departmental',
    department: 'operations',
    parentId: 'executive',
    specialties: ['process optimization', 'resource management', 'quality assurance']
  }
];

// Specialist Sub-Assistants
export const specialistAgents: Agent[] = [
  // Sales Specialists
  {
    id: 'sales-rep',
    name: 'Sales Representative',
    description: 'Direct customer interaction, lead qualification, and deal closing',
    avatar: '🤝',
    webhookUrl: 'https://your-sales-rep-webhook-url',
    type: 'specialist',
    department: 'sales',
    parentId: 'sales-dept',
    specialties: ['lead qualification', 'deal closing', 'customer relationship']
  },
  {
    id: 'sales-manager',
    name: 'Sales Manager',
    description: 'Territory management, team performance, and sales coaching',
    avatar: '📊',
    webhookUrl: 'https://your-sales-manager-webhook-url',
    type: 'specialist',
    department: 'sales',
    parentId: 'sales-dept',
    specialties: ['territory management', 'team coaching', 'performance tracking']
  },
  {
    id: 'customer-success',
    name: 'Customer Success Manager',
    description: 'Customer retention, upselling, and satisfaction management',
    avatar: '🌟',
    webhookUrl: 'https://your-customer-success-webhook-url',
    type: 'specialist',
    department: 'sales',
    parentId: 'sales-dept',
    specialties: ['customer retention', 'upselling', 'satisfaction tracking']
  },

  // Marketing Specialists
  {
    id: 'digital-marketing',
    name: 'Digital Marketing Specialist',
    description: 'SEO, SEM, social media, and digital campaign management',
    avatar: '📱',
    webhookUrl: 'https://your-digital-marketing-webhook-url',
    type: 'specialist',
    department: 'marketing',
    parentId: 'marketing-dept',
    specialties: ['SEO', 'SEM', 'social media', 'digital campaigns']
  },
  {
    id: 'content-marketing',
    name: 'Content Marketing Specialist',
    description: 'Content creation, copywriting, and content strategy',
    avatar: '✍️',
    webhookUrl: 'https://your-content-marketing-webhook-url',
    type: 'specialist',
    department: 'marketing',
    parentId: 'marketing-dept',
    specialties: ['content creation', 'copywriting', 'content strategy']
  },
  {
    id: 'marketing-analytics',
    name: 'Marketing Analytics Specialist',
    description: 'Campaign performance, ROI analysis, and marketing metrics',
    avatar: '📈',
    webhookUrl: 'https://your-marketing-analytics-webhook-url',
    type: 'specialist',
    department: 'marketing',
    parentId: 'marketing-dept',
    specialties: ['analytics', 'ROI analysis', 'performance tracking']
  },

  // Finance Specialists
  {
    id: 'accounting',
    name: 'Accounting Specialist',
    description: 'Bookkeeping, accounts payable/receivable, and financial recording',
    avatar: '📚',
    webhookUrl: 'https://your-accounting-webhook-url',
    type: 'specialist',
    department: 'finance',
    parentId: 'finance-dept',
    specialties: ['bookkeeping', 'accounts payable', 'accounts receivable']
  },
  {
    id: 'financial-analyst',
    name: 'Financial Analyst',
    description: 'Financial modeling, forecasting, and investment analysis',
    avatar: '📊',
    webhookUrl: 'https://your-financial-analyst-webhook-url',
    type: 'specialist',
    department: 'finance',
    parentId: 'finance-dept',
    specialties: ['financial modeling', 'forecasting', 'investment analysis']
  },
  {
    id: 'tax-specialist',
    name: 'Tax Specialist',
    description: 'Tax compliance, planning, and regulatory requirements',
    avatar: '🧾',
    webhookUrl: 'https://your-tax-specialist-webhook-url',
    type: 'specialist',
    department: 'finance',
    parentId: 'finance-dept',
    specialties: ['tax compliance', 'tax planning', 'regulatory requirements']
  },

  // Operations Specialists
  {
    id: 'project-manager',
    name: 'Project Manager',
    description: 'Project planning, execution, and delivery management',
    avatar: '📋',
    webhookUrl: 'https://your-project-manager-webhook-url',
    type: 'specialist',
    department: 'operations',
    parentId: 'operations-dept',
    specialties: ['project planning', 'execution', 'delivery management']
  },
  {
    id: 'quality-assurance',
    name: 'Quality Assurance Specialist',
    description: 'Quality control, testing, and process improvement',
    avatar: '🔍',
    webhookUrl: 'https://your-qa-webhook-url',
    type: 'specialist',
    department: 'operations',
    parentId: 'operations-dept',
    specialties: ['quality control', 'testing', 'process improvement']
  },
  {
    id: 'itsm',
    name: 'IT Service Manager',
    description: 'IT support, system management, and technical operations',
    avatar: '💻',
    webhookUrl: 'https://your-itsm-webhook-url',
    type: 'specialist',
    department: 'operations',
    parentId: 'operations-dept',
    specialties: ['IT support', 'system management', 'technical operations']
  },
  {
    id: 'customer-support',
    name: 'Customer Support Specialist',
    description: 'Customer service, issue resolution, and support ticket management',
    avatar: '🎧',
    webhookUrl: 'https://your-customer-support-webhook-url',
    type: 'specialist',
    department: 'operations',
    parentId: 'operations-dept',
    specialties: ['customer service', 'issue resolution', 'support tickets']
  }
];

// Combined registry
export const agentRegistry: Agent[] = [
  executiveAgent,
  ...departmentalAgents,
  ...specialistAgents
];

// Helper functions for organizational structure
export const getAgentsByType = (type: Agent['type']): Agent[] => {
  return agentRegistry.filter(agent => agent.type === type);
};

export const getAgentsByDepartment = (department: string): Agent[] => {
  return agentRegistry.filter(agent => agent.department === department);
};

export const getChildAgents = (parentId: string): Agent[] => {
  return agentRegistry.filter(agent => agent.parentId === parentId);
};

export const getAgentHierarchy = () => {
  const executive = executiveAgent;
  const departments = departmentalAgents.map(dept => ({
    ...dept,
    children: getChildAgents(dept.id)
  }));
  
  return {
    executive,
    departments
  };
}; 