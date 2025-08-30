import { EnhancedUserContext, DepartmentData } from '../../src/lib/ai/contextualRAG';

export interface CloudDocument {
  id: string;
  name: string;
  content: string;
  source: string;
  lastModified: string;
  webUrl: string;
  metadata: Record<string, any>;
}

// Mock user context for testing
export const mockUserContext: EnhancedUserContext = {
  profile: {
    id: 'test-user-id',
    email: 'test@company.com',
    name: 'Test User',
    role: 'VP of Sales',
    department: 'Sales',
    company_id: 'test-company-id',
    permissions: ['read', 'write'],
    preferences: { theme: 'dark' },
    experience_level: 'advanced',
    communication_style: 'detailed',
    primary_responsibilities: ['Sales Strategy', 'Team Management'],
    current_pain_points: ['Lead qualification', 'Pipeline management'],
    immediate_goals: 'Increase sales by 30% this quarter',
    success_metrics: ['Revenue Growth', 'Deal Velocity'],
    time_availability: 'high',
    collaboration_frequency: 'cross-functional'
  },
  activity: {
    recent_pages: ['dashboard', 'sales', 'reports'],
    frequent_actions: ['view_pipeline', 'update_deals', 'generate_reports'],
    last_active: new Date().toISOString(),
    session_duration: 3600,
    total_sessions: 150,
    most_used_features: ['Sales Pipeline', 'Deal Tracking'],
    skill_level: 'advanced'
  },
  business_context: {
    company_name: 'Test Corp',
    industry: 'Technology',
    company_size: 'Medium',
    business_model: 'B2B',
    revenue_stage: 'growth',
    growth_stage: 'growth',
    fiscal_year_end: '12-31',
    key_metrics: {
      employees: 100,
      annual_revenue: 10000000,
      growth_rate: 35,
      customer_count: 250
    },
    primary_departments: ['Sales', 'Marketing', 'Engineering'],
    key_tools: ['CRM', 'Marketing Automation', 'Analytics'],
    data_sources: ['Salesforce', 'HubSpot', 'Google Analytics'],
    automation_maturity: 'advanced',
    business_priorities: ['Revenue Growth', 'Market Expansion'],
    success_timeframe: '6 months'
  },
  success_criteria: {
    primary_success_metric: 'Revenue Growth',
    secondary_metrics: ['Deal Velocity', 'Customer Satisfaction'],
    time_savings_goal: '5 hours per week',
    roi_expectation: '300%',
    success_scenarios: ['Increased deal closure rate', 'Improved pipeline visibility']
  }
};

// Mock department data
export const mockDepartmentData: DepartmentData = {
  sales: {
    pipeline: [
      { id: '1', name: 'TechCorp Deal', value: 250000, stage: 'proposal', probability: 75 },
      { id: '2', name: 'Innovation Labs', value: 185000, stage: 'negotiation', probability: 60 }
    ],
    deals: [
      { id: '1', company: 'TechCorp', value: 250000, stage: 'proposal', rep: 'John Doe' },
      { id: '2', company: 'Innovation Labs', value: 185000, stage: 'negotiation', rep: 'Jane Smith' }
    ],
    performance: {
      quota: 2000000,
      achieved: 1740000,
      attainment: 87,
      deals_closed: 8,
      pipeline_value: 1850000
    }
  },
  marketing: {
    campaigns: [
      { id: '1', name: 'Q1 Product Launch', budget: 50000, spent: 35000, conversions: 150 },
      { id: '2', name: 'Lead Generation', budget: 30000, spent: 28000, conversions: 89 }
    ],
    leads: [
      { id: '1', company: 'Future Systems', source: 'website', score: 85, qualified: true },
      { id: '2', company: 'DataFlow Corp', source: 'social', score: 72, qualified: false }
    ],
    analytics: {
      website_visitors: 12500,
      conversion_rate: 3.2,
      cost_per_lead: 125,
      qualified_leads: 45
    }
  },
  finance: {
    revenue: {
      monthly: 425000,
      quarterly: 1275000,
      annual: 5100000,
      growth_rate: 12
    },
    expenses: {
      monthly: 380000,
      categories: { technology: 85000, marketing: 65000, operations: 230000 }
    },
    cash_flow: {
      balance: 850000,
      burn_rate: 45000,
      runway_months: 18
    }
  },
  operations: {
    projects: [
      { id: '1', name: 'System Migration', status: 'in_progress', health: 'green', progress: 75 },
      { id: '2', name: 'Process Automation', status: 'planning', health: 'yellow', progress: 25 }
    ],
    support: {
      tickets_open: 12,
      tickets_resolved: 156,
      avg_response_time: 2.5,
      satisfaction_score: 4.3
    },
    capacity: {
      team_utilization: 78,
      available_hours: 320,
      project_load: 'medium'
    }
  }
};

// Mock cloud documents
export const mockCloudDocuments: CloudDocument[] = [
  {
    id: 'doc-1',
    name: 'Sales Strategy 2024',
    content: 'Our sales strategy focuses on enterprise clients with emphasis on solution selling...',
    source: 'google-drive',
    lastModified: new Date().toISOString(),
    webUrl: 'https://drive.google.com/file/d/doc-1',
    metadata: { type: 'document', size: 1024 }
  },
  {
    id: 'doc-2',
    name: 'Marketing Campaign Results',
    content: 'Q1 marketing campaigns generated 250 qualified leads with 15% conversion rate...',
    source: 'onedrive',
    lastModified: new Date().toISOString(),
    webUrl: 'https://onedrive.com/file/doc-2',
    metadata: { type: 'spreadsheet', size: 2048 }
  }
];



// Mock database queries
export const mockDatabaseQueries = {
  getUserContext: jest.fn().mockResolvedValue(mockUserContext),
  getDepartmentData: jest.fn().mockResolvedValue(mockDepartmentData.sales),
  getCloudDocuments: jest.fn().mockResolvedValue(mockCloudDocuments),
  storeDocument: jest.fn().mockResolvedValue({ success: true }),
  updateUserActivity: jest.fn().mockResolvedValue({ success: true })
};

// Test query examples
export const testQueries = {
  executive: [
    'What should be our Q1 priorities?',
    'How is the company performing overall?',
    'What are the key business metrics I should focus on?'
  ],
  sales: [
    'Show me our sales performance',
    'What deals are closing this month?',
    'How is our pipeline looking?'
  ],
  marketing: [
    'How are our campaigns performing?',
    'What is our lead generation status?',
    'Show me website analytics'
  ],
  finance: [
    'What is our current financial position?',
    'How is our cash flow?',
    'What are our biggest expenses?'
  ],
  operations: [
    'What is the status of our projects?',
    'How is team capacity?',
    'Show me support ticket metrics'
  ]
};

// Helper functions for testing
export const createMockRAGSystem = () => {
  const mockRAG = {
    initialize: jest.fn().mockResolvedValue(undefined),
    getExecutiveContext: jest.fn().mockResolvedValue('Mock executive context'),
    getDepartmentContext: jest.fn().mockResolvedValue('Mock department context'),
    getRoutingIntelligence: jest.fn().mockResolvedValue({
      recommendedAgent: 'sales',
      confidence: 0.85,
      reasoning: 'Sales-related query detected'
    }),
    fetchUserContext: jest.fn().mockResolvedValue(mockUserContext),
    fetchDepartmentData: jest.fn().mockResolvedValue(mockDepartmentData.sales)
  };
  
  return mockRAG;
};

export const createMockCloudStorageRAG = () => {
  const mockCloudRAG = {
    syncDocuments: jest.fn().mockResolvedValue({
      success: true,
      processed: 2,
      errors: [],
      newDocuments: mockCloudDocuments
    }),
    searchDocuments: jest.fn().mockResolvedValue(mockCloudDocuments),
    getDocumentContext: jest.fn().mockResolvedValue('Mock document context')
  };
  
  return mockCloudRAG;
};

// Assertion helpers
export const expectValidRAGContext = (context: string) => {
  expect(context).toBeDefined();
  expect(context.length).toBeGreaterThan(0);
  expect(context).toContain('CONTEXT');
};

export const expectValidRoutingIntelligence = (routing: any) => {
  expect(routing).toBeDefined();
  expect(routing.recommendedAgent).toBeDefined();
  expect(routing.confidence).toBeGreaterThan(0);
  expect(routing.confidence).toBeLessThanOrEqual(1);
  expect(routing.reasoning).toBeDefined();
};

// Performance testing helpers
export const measureExecutionTime = async (fn: () => Promise<any>) => {
  const start = performance.now();
  await fn();
  const end = performance.now();
  return end - start;
};

export const expectPerformanceThreshold = (executionTime: number, threshold: number) => {
  expect(executionTime).toBeLessThan(threshold);
}; 