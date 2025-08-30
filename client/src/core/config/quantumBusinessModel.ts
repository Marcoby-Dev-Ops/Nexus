/**
 * Quantum Business Model Configuration
 * 
 * Defines the 7 irreducible building blocks ("atoms") that compose any business,
 * regardless of industry or size. This provides a universal schema for Nexus.
 * 
 * Based on the Quantum framing: What are the irreducible parts of any business?
 * The "atoms" that make the company tick, no matter what industry you're in.
 */

import { 
  Building2, DollarSign, Users, BookOpen, Settings, 
  TrendingUp, Package, Brain, Database, Zap,
  Target, Shield, Globe, Clock, BarChart3
} from 'lucide-react';

// ============================================================================
// QUANTUM BUILDING BLOCKS - THE 7 ATOMS OF BUSINESS
// ============================================================================

export interface QuantumBlock {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'nucleus' | 'energy' | 'carriers' | 'memory' | 'connections';
  priority: 'critical' | 'high' | 'medium' | 'low';
  
  // Core properties
  properties: QuantumProperty[];
  
  // Relationships with other blocks
  relationships: QuantumRelationship[];
  
  // Measurement and health indicators
  healthIndicators: HealthIndicator[];
  
  // AI agent capabilities
  aiCapabilities: AICapability[];
  
  // Marketplace integrations
  marketplaceIntegrations: MarketplaceIntegration[];
  
  // Applicable to all business types
  universal: boolean;
}

export interface QuantumProperty {
  id: string;
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  defaultValue?: any;
  validation?: string;
  examples: string[];
}

export interface QuantumRelationship {
  targetBlock: string;
  relationshipType: 'depends_on' | 'feeds_into' | 'enables' | 'constrains' | 'measures';
  strength: 'weak' | 'medium' | 'strong';
  description: string;
}

export interface HealthIndicator {
  id: string;
  name: string;
  description: string;
  metric: string;
  unit: string;
  target: number;
  warning: number;
  critical: number;
  frequency: 'real-time' | 'daily' | 'weekly' | 'monthly';
}

export interface AICapability {
  id: string;
  name: string;
  description: string;
  agentType: 'analyzer' | 'optimizer' | 'predictor' | 'executor';
  tools: string[];
  insights: string[];
  actions: string[];
}

export interface MarketplaceIntegration {
  id: string;
  name: string;
  category: 'tool' | 'service' | 'template' | 'workflow';
  description: string;
  integrationType: 'api' | 'webhook' | 'oauth' | 'manual';
  complexity: 'simple' | 'medium' | 'complex';
}

// ============================================================================
// THE 7 QUANTUM BUILDING BLOCKS
// ============================================================================

export const QUANTUM_BLOCKS: QuantumBlock[] = [
  {
    id: 'identity',
    name: 'Identity',
    description: 'The nucleus of your business - who you are, your mission, vision, values, and the people who make it happen',
    icon: Building2,
    category: 'nucleus',
    priority: 'critical',
    universal: true,
    
    properties: [
      {
        id: 'company_name',
        name: 'Company Name',
        description: 'The official name of your business',
        type: 'string',
        required: true,
        examples: ['Acme Corp', 'TechStart LLC', 'Global Solutions Inc']
      },
      {
        id: 'mission',
        name: 'Mission Statement',
        description: 'Your company\'s purpose and reason for existing',
        type: 'string',
        required: true,
        examples: ['To empower businesses through innovative technology solutions']
      },
      {
        id: 'vision',
        name: 'Vision Statement',
        description: 'Your aspirational future state',
        type: 'string',
        required: false,
        examples: ['To be the leading provider of AI-powered business tools by 2030']
      },
      {
        id: 'values',
        name: 'Core Values',
        description: 'The principles that guide your decisions and actions',
        type: 'array',
        required: false,
        examples: ['Innovation', 'Integrity', 'Customer Focus', 'Excellence']
      },
      {
        id: 'industry',
        name: 'Industry',
        description: 'The primary industry your business operates in',
        type: 'string',
        required: true,
        examples: ['Technology', 'Healthcare', 'Manufacturing', 'Retail']
      },
      {
        id: 'size',
        name: 'Company Size',
        description: 'Number of employees or business scale',
        type: 'string',
        required: true,
        examples: ['Solo', 'Small (2-10)', 'Medium (11-50)', 'Large (51-200)', 'Enterprise (200+)']
      }
    ],
    
    relationships: [
      {
        targetBlock: 'people',
        relationshipType: 'enables',
        strength: 'strong',
        description: 'Identity defines the culture and attracts the right people'
      },
      {
        targetBlock: 'revenue',
        relationshipType: 'feeds_into',
        strength: 'medium',
        description: 'Clear identity helps attract the right customers'
      }
    ],
    
    healthIndicators: [
      {
        id: 'brand_awareness',
        name: 'Brand Awareness',
        description: 'How well your target market recognizes your brand',
        metric: 'percentage',
        unit: '%',
        target: 80,
        warning: 60,
        critical: 40,
        frequency: 'monthly'
      },
      {
        id: 'employee_satisfaction',
        name: 'Employee Satisfaction',
        description: 'How well your team aligns with company values',
        metric: 'score',
        unit: '/10',
        target: 8.5,
        warning: 7.0,
        critical: 6.0,
        frequency: 'quarterly'
      }
    ],
    
    aiCapabilities: [
      {
        id: 'brand_analyzer',
        name: 'Brand Analyzer',
        description: 'Analyzes brand positioning and market perception',
        agentType: 'analyzer',
        tools: ['market_research', 'sentiment_analysis', 'competitor_analysis'],
        insights: ['Brand perception gaps', 'Market positioning opportunities', 'Competitive advantages'],
        actions: ['Brand messaging recommendations', 'Market positioning strategies', 'Reputation management']
      }
    ],
    
    marketplaceIntegrations: [
      {
        id: 'brand_management_tools',
        name: 'Brand Management Tools',
        category: 'tool',
        description: 'Tools for managing brand assets and guidelines',
        integrationType: 'api',
        complexity: 'medium'
      }
    ]
  },
  
  {
    id: 'revenue',
    name: 'Revenue',
    description: 'Energy in - customers, deals, contracts, subscriptions, and your sales pipeline',
    icon: DollarSign,
    category: 'energy',
    priority: 'critical',
    universal: true,
    
    properties: [
      {
        id: 'revenue_model',
        name: 'Revenue Model',
        description: 'How your business generates income',
        type: 'string',
        required: true,
        examples: ['Subscription', 'One-time sales', 'Marketplace fees', 'Consulting', 'Licensing']
      },
      {
        id: 'target_customers',
        name: 'Target Customers',
        description: 'Your ideal customer segments',
        type: 'array',
        required: true,
        examples: ['Small businesses', 'Enterprise clients', 'Individual consumers']
      },
      {
        id: 'pricing_strategy',
        name: 'Pricing Strategy',
        description: 'How you price your products or services',
        type: 'string',
        required: true,
        examples: ['Value-based', 'Cost-plus', 'Competitive', 'Freemium']
      },
      {
        id: 'sales_channels',
        name: 'Sales Channels',
        description: 'How you reach and sell to customers',
        type: 'array',
        required: true,
        examples: ['Direct sales', 'Online', 'Partners', 'Marketplaces']
      }
    ],
    
    relationships: [
      {
        targetBlock: 'cash',
        relationshipType: 'feeds_into',
        strength: 'strong',
        description: 'Revenue generates cash flow'
      },
      {
        targetBlock: 'delivery',
        relationshipType: 'enables',
        strength: 'medium',
        description: 'Revenue funds delivery capabilities'
      },
      {
        targetBlock: 'people',
        relationshipType: 'enables',
        strength: 'medium',
        description: 'Revenue enables hiring and team growth'
      }
    ],
    
    healthIndicators: [
      {
        id: 'monthly_recurring_revenue',
        name: 'Monthly Recurring Revenue (MRR)',
        description: 'Predictable monthly revenue from subscriptions',
        metric: 'currency',
        unit: '$',
        target: 100000,
        warning: 50000,
        critical: 25000,
        frequency: 'monthly'
      },
      {
        id: 'customer_acquisition_cost',
        name: 'Customer Acquisition Cost (CAC)',
        description: 'Cost to acquire a new customer',
        metric: 'currency',
        unit: '$',
        target: 100,
        warning: 200,
        critical: 500,
        frequency: 'monthly'
      },
      {
        id: 'customer_lifetime_value',
        name: 'Customer Lifetime Value (CLV)',
        description: 'Total value a customer brings over their lifetime',
        metric: 'currency',
        unit: '$',
        target: 1000,
        warning: 500,
        critical: 200,
        frequency: 'quarterly'
      }
    ],
    
    aiCapabilities: [
      {
        id: 'revenue_optimizer',
        name: 'Revenue Optimizer',
        description: 'Optimizes pricing, sales processes, and revenue streams',
        agentType: 'optimizer',
        tools: ['pricing_analysis', 'sales_forecasting', 'customer_segmentation'],
        insights: ['Pricing optimization opportunities', 'Sales process bottlenecks', 'Customer churn risks'],
        actions: ['Dynamic pricing recommendations', 'Sales process improvements', 'Customer retention strategies']
      }
    ],
    
    marketplaceIntegrations: [
      {
        id: 'crm_systems',
        name: 'CRM Systems',
        category: 'tool',
        description: 'Customer relationship management platforms',
        integrationType: 'api',
        complexity: 'medium'
      },
      {
        id: 'payment_processors',
        name: 'Payment Processors',
        category: 'service',
        description: 'Payment processing and billing systems',
        integrationType: 'api',
        complexity: 'simple'
      }
    ]
  },
  
  {
    id: 'cash',
    name: 'Cash',
    description: 'Energy stored & spent - invoices, expenses, payroll, taxes, treasury & financial controls',
    icon: TrendingUp,
    category: 'energy',
    priority: 'critical',
    universal: true,
    
    properties: [
      {
        id: 'cash_flow_structure',
        name: 'Cash Flow Structure',
        description: 'How money flows through your business',
        type: 'string',
        required: true,
        examples: ['Positive cash flow', 'Seasonal variations', 'Growth investment phase']
      },
      {
        id: 'expense_categories',
        name: 'Expense Categories',
        description: 'Main categories of business expenses',
        type: 'array',
        required: true,
        examples: ['Personnel', 'Technology', 'Marketing', 'Operations', 'Legal']
      },
      {
        id: 'payment_terms',
        name: 'Payment Terms',
        description: 'Standard payment terms for customers and vendors',
        type: 'string',
        required: true,
        examples: ['Net 30', 'Net 15', 'Due on receipt', '50% upfront']
      }
    ],
    
    relationships: [
      {
        targetBlock: 'revenue',
        relationshipType: 'depends_on',
        strength: 'strong',
        description: 'Cash flow depends on revenue generation'
      },
      {
        targetBlock: 'delivery',
        relationshipType: 'enables',
        strength: 'strong',
        description: 'Cash enables delivery operations'
      },
      {
        targetBlock: 'people',
        relationshipType: 'enables',
        strength: 'strong',
        description: 'Cash enables payroll and team growth'
      }
    ],
    
    healthIndicators: [
      {
        id: 'cash_runway',
        name: 'Cash Runway',
        description: 'How long you can operate with current cash',
        metric: 'time',
        unit: 'months',
        target: 18,
        warning: 12,
        critical: 6,
        frequency: 'monthly'
      },
      {
        id: 'burn_rate',
        name: 'Burn Rate',
        description: 'Monthly cash consumption rate',
        metric: 'currency',
        unit: '$/month',
        target: 50000,
        warning: 100000,
        critical: 200000,
        frequency: 'monthly'
      },
      {
        id: 'accounts_receivable_days',
        name: 'Accounts Receivable Days',
        description: 'Average time to collect payments',
        metric: 'time',
        unit: 'days',
        target: 30,
        warning: 45,
        critical: 60,
        frequency: 'monthly'
      }
    ],
    
    aiCapabilities: [
      {
        id: 'cash_flow_predictor',
        name: 'Cash Flow Predictor',
        description: 'Predicts cash flow and identifies potential shortfalls',
        agentType: 'predictor',
        tools: ['financial_modeling', 'trend_analysis', 'scenario_planning'],
        insights: ['Cash flow projections', 'Funding needs', 'Expense optimization opportunities'],
        actions: ['Cash flow forecasts', 'Funding recommendations', 'Expense reduction strategies']
      }
    ],
    
    marketplaceIntegrations: [
      {
        id: 'accounting_software',
        name: 'Accounting Software',
        category: 'tool',
        description: 'Financial management and accounting systems',
        integrationType: 'api',
        complexity: 'medium'
      },
      {
        id: 'banking_apis',
        name: 'Banking APIs',
        category: 'service',
        description: 'Direct bank account integration',
        integrationType: 'api',
        complexity: 'complex'
      }
    ]
  },
  
  {
    id: 'delivery',
    name: 'Delivery',
    description: 'Value out - products or services, operations, logistics, fulfillment',
    icon: Package,
    category: 'energy',
    priority: 'critical',
    universal: true,
    
    properties: [
      {
        id: 'delivery_model',
        name: 'Delivery Model',
        description: 'How you deliver value to customers',
        type: 'string',
        required: true,
        examples: ['Digital products', 'Physical products', 'Services', 'Hybrid']
      },
      {
        id: 'delivery_channels',
        name: 'Delivery Channels',
        description: 'How customers receive your products/services',
        type: 'array',
        required: true,
        examples: ['Online platform', 'Mobile app', 'In-person', 'Shipping', 'Download']
      },
      {
        id: 'quality_standards',
        name: 'Quality Standards',
        description: 'Standards for product/service quality',
        type: 'string',
        required: true,
        examples: ['ISO 9001', 'Industry standards', 'Internal benchmarks']
      }
    ],
    
    relationships: [
      {
        targetBlock: 'revenue',
        relationshipType: 'enables',
        strength: 'strong',
        description: 'Delivery enables revenue generation'
      },
      {
        targetBlock: 'people',
        relationshipType: 'depends_on',
        strength: 'strong',
        description: 'Delivery depends on people and skills'
      },
      {
        targetBlock: 'systems',
        relationshipType: 'depends_on',
        strength: 'medium',
        description: 'Delivery depends on operational systems'
      }
    ],
    
    healthIndicators: [
      {
        id: 'delivery_time',
        name: 'Delivery Time',
        description: 'Average time from order to delivery',
        metric: 'time',
        unit: 'hours',
        target: 24,
        warning: 48,
        critical: 72,
        frequency: 'daily'
      },
      {
        id: 'quality_score',
        name: 'Quality Score',
        description: 'Customer satisfaction with delivery quality',
        metric: 'score',
        unit: '/10',
        target: 9.0,
        warning: 8.0,
        critical: 7.0,
        frequency: 'weekly'
      },
      {
        id: 'delivery_cost',
        name: 'Delivery Cost',
        description: 'Cost per delivery unit',
        metric: 'currency',
        unit: '$',
        target: 10,
        warning: 20,
        critical: 30,
        frequency: 'monthly'
      }
    ],
    
    aiCapabilities: [
      {
        id: 'delivery_optimizer',
        name: 'Delivery Optimizer',
        description: 'Optimizes delivery processes and logistics',
        agentType: 'optimizer',
        tools: ['route_optimization', 'inventory_management', 'quality_control'],
        insights: ['Delivery efficiency opportunities', 'Quality improvement areas', 'Cost optimization'],
        actions: ['Route optimization', 'Quality control automation', 'Cost reduction strategies']
      }
    ],
    
    marketplaceIntegrations: [
      {
        id: 'logistics_platforms',
        name: 'Logistics Platforms',
        category: 'service',
        description: 'Shipping and logistics management',
        integrationType: 'api',
        complexity: 'medium'
      },
      {
        id: 'inventory_systems',
        name: 'Inventory Systems',
        category: 'tool',
        description: 'Inventory and warehouse management',
        integrationType: 'api',
        complexity: 'medium'
      }
    ]
  },
  
  {
    id: 'people',
    name: 'People',
    description: 'The carriers - employees, contractors, teams, skills, performance, culture',
    icon: Users,
    category: 'carriers',
    priority: 'critical',
    universal: true,
    
    properties: [
      {
        id: 'team_structure',
        name: 'Team Structure',
        description: 'How your team is organized',
        type: 'string',
        required: true,
        examples: ['Flat', 'Hierarchical', 'Matrix', 'Agile teams']
      },
      {
        id: 'roles',
        name: 'Key Roles',
        description: 'Essential roles in your organization',
        type: 'array',
        required: true,
        examples: ['CEO', 'CTO', 'Sales Manager', 'Developer', 'Customer Success']
      },
      {
        id: 'hiring_needs',
        name: 'Hiring Needs',
        description: 'Current and future hiring requirements',
        type: 'array',
        required: false,
        examples: ['Senior Developer', 'Sales Representative', 'Marketing Manager']
      }
    ],
    
    relationships: [
      {
        targetBlock: 'identity',
        relationshipType: 'enables',
        strength: 'strong',
        description: 'People bring identity to life'
      },
      {
        targetBlock: 'delivery',
        relationshipType: 'enables',
        strength: 'strong',
        description: 'People enable delivery of value'
      },
      {
        targetBlock: 'knowledge',
        relationshipType: 'feeds_into',
        strength: 'medium',
        description: 'People create and share knowledge'
      }
    ],
    
    healthIndicators: [
      {
        id: 'employee_satisfaction',
        name: 'Employee Satisfaction',
        description: 'Overall employee satisfaction score',
        metric: 'score',
        unit: '/10',
        target: 8.5,
        warning: 7.5,
        critical: 6.5,
        frequency: 'quarterly'
      },
      {
        id: 'employee_retention',
        name: 'Employee Retention',
        description: 'Percentage of employees retained annually',
        metric: 'percentage',
        unit: '%',
        target: 90,
        warning: 80,
        critical: 70,
        frequency: 'annual'
      },
      {
        id: 'productivity_per_employee',
        name: 'Productivity per Employee',
        description: 'Revenue or output per employee',
        metric: 'currency',
        unit: '$/employee',
        target: 200000,
        warning: 150000,
        critical: 100000,
        frequency: 'quarterly'
      }
    ],
    
    aiCapabilities: [
      {
        id: 'people_analyzer',
        name: 'People Analyzer',
        description: 'Analyzes team performance and culture',
        agentType: 'analyzer',
        tools: ['performance_analytics', 'culture_assessment', 'skill_gap_analysis'],
        insights: ['Performance trends', 'Culture health', 'Skill development needs'],
        actions: ['Performance improvement plans', 'Culture initiatives', 'Training recommendations']
      }
    ],
    
    marketplaceIntegrations: [
      {
        id: 'hr_platforms',
        name: 'HR Platforms',
        category: 'tool',
        description: 'Human resources and people management',
        integrationType: 'api',
        complexity: 'medium'
      },
      {
        id: 'learning_platforms',
        name: 'Learning Platforms',
        category: 'service',
        description: 'Employee training and development',
        integrationType: 'api',
        complexity: 'simple'
      }
    ]
  },
  
  {
    id: 'knowledge',
    name: 'Knowledge',
    description: 'The memory - documents, data, decisions, lessons learned, playbooks',
    icon: BookOpen,
    category: 'memory',
    priority: 'high',
    universal: true,
    
    properties: [
      {
        id: 'knowledge_types',
        name: 'Knowledge Types',
        description: 'Types of knowledge your business manages',
        type: 'array',
        required: true,
        examples: ['Process documentation', 'Customer data', 'Technical knowledge', 'Market research']
      },
      {
        id: 'knowledge_storage',
        name: 'Knowledge Storage',
        description: 'Where knowledge is stored and managed',
        type: 'array',
        required: true,
        examples: ['Document management system', 'CRM', 'Knowledge base', 'Shared drives']
      },
      {
        id: 'knowledge_sharing',
        name: 'Knowledge Sharing',
        description: 'How knowledge is shared across the organization',
        type: 'string',
        required: true,
        examples: ['Regular meetings', 'Documentation', 'Training sessions', 'Digital platforms']
      }
    ],
    
    relationships: [
      {
        targetBlock: 'people',
        relationshipType: 'enables',
        strength: 'strong',
        description: 'Knowledge enables people to perform effectively'
      },
      {
        targetBlock: 'delivery',
        relationshipType: 'enables',
        strength: 'medium',
        description: 'Knowledge enables consistent delivery quality'
      },
      {
        targetBlock: 'systems',
        relationshipType: 'feeds_into',
        strength: 'medium',
        description: 'Knowledge informs system design and optimization'
      }
    ],
    
    healthIndicators: [
      {
        id: 'knowledge_accessibility',
        name: 'Knowledge Accessibility',
        description: 'How easily team members can find needed information',
        metric: 'score',
        unit: '/10',
        target: 9.0,
        warning: 7.5,
        critical: 6.0,
        frequency: 'monthly'
      },
      {
        id: 'knowledge_utilization',
        name: 'Knowledge Utilization',
        description: 'Percentage of documented knowledge being used',
        metric: 'percentage',
        unit: '%',
        target: 80,
        warning: 60,
        critical: 40,
        frequency: 'quarterly'
      },
      {
        id: 'knowledge_freshness',
        name: 'Knowledge Freshness',
        description: 'How up-to-date your knowledge base is',
        metric: 'score',
        unit: '/10',
        target: 9.0,
        warning: 7.5,
        critical: 6.0,
        frequency: 'monthly'
      }
    ],
    
    aiCapabilities: [
      {
        id: 'knowledge_curator',
        name: 'Knowledge Curator',
        description: 'Organizes and optimizes knowledge management',
        agentType: 'optimizer',
        tools: ['content_analysis', 'search_optimization', 'knowledge_graph'],
        insights: ['Knowledge gaps', 'Content optimization opportunities', 'Search effectiveness'],
        actions: ['Content recommendations', 'Knowledge structure improvements', 'Search optimization']
      }
    ],
    
    marketplaceIntegrations: [
      {
        id: 'document_management',
        name: 'Document Management',
        category: 'tool',
        description: 'Document storage and management systems',
        integrationType: 'api',
        complexity: 'medium'
      },
      {
        id: 'knowledge_bases',
        name: 'Knowledge Bases',
        category: 'tool',
        description: 'Knowledge management and sharing platforms',
        integrationType: 'api',
        complexity: 'simple'
      }
    ]
  },
  
  {
    id: 'systems',
    name: 'Systems',
    description: 'The connections - tools, workflows, compliance, automations & integrations',
    icon: Settings,
    category: 'connections',
    priority: 'high',
    universal: true,
    
    properties: [
      {
        id: 'core_systems',
        name: 'Core Systems',
        description: 'Essential systems your business relies on',
        type: 'array',
        required: true,
        examples: ['CRM', 'Accounting', 'Project Management', 'Communication']
      },
      {
        id: 'automation_level',
        name: 'Automation Level',
        description: 'How automated your business processes are',
        type: 'string',
        required: true,
        examples: ['Manual', 'Semi-automated', 'Highly automated', 'AI-driven']
      },
      {
        id: 'integration_needs',
        name: 'Integration Needs',
        description: 'Systems that need to work together',
        type: 'array',
        required: false,
        examples: ['CRM ↔ Accounting', 'Sales ↔ Marketing', 'HR ↔ Payroll']
      }
    ],
    
    relationships: [
      {
        targetBlock: 'delivery',
        relationshipType: 'enables',
        strength: 'strong',
        description: 'Systems enable efficient delivery'
      },
      {
        targetBlock: 'people',
        relationshipType: 'enables',
        strength: 'medium',
        description: 'Systems enable people to work effectively'
      },
      {
        targetBlock: 'knowledge',
        relationshipType: 'enables',
        strength: 'medium',
        description: 'Systems enable knowledge capture and sharing'
      }
    ],
    
    healthIndicators: [
      {
        id: 'system_uptime',
        name: 'System Uptime',
        description: 'Percentage of time systems are operational',
        metric: 'percentage',
        unit: '%',
        target: 99.9,
        warning: 99.0,
        critical: 95.0,
        frequency: 'daily'
      },
      {
        id: 'automation_efficiency',
        name: 'Automation Efficiency',
        description: 'Percentage of processes that are automated',
        metric: 'percentage',
        unit: '%',
        target: 80,
        warning: 60,
        critical: 40,
        frequency: 'quarterly'
      },
      {
        id: 'integration_health',
        name: 'Integration Health',
        description: 'How well systems work together',
        metric: 'score',
        unit: '/10',
        target: 9.0,
        warning: 7.5,
        critical: 6.0,
        frequency: 'monthly'
      }
    ],
    
    aiCapabilities: [
      {
        id: 'system_optimizer',
        name: 'System Optimizer',
        description: 'Optimizes system performance and integrations',
        agentType: 'optimizer',
        tools: ['performance_monitoring', 'integration_analysis', 'automation_audit'],
        insights: ['System bottlenecks', 'Integration opportunities', 'Automation potential'],
        actions: ['Performance improvements', 'Integration recommendations', 'Automation strategies']
      }
    ],
    
    marketplaceIntegrations: [
      {
        id: 'business_apps',
        name: 'Business Applications',
        category: 'tool',
        description: 'Core business software and tools',
        integrationType: 'api',
        complexity: 'medium'
      },
      {
        id: 'automation_platforms',
        name: 'Automation Platforms',
        category: 'service',
        description: 'Workflow and process automation',
        integrationType: 'api',
        complexity: 'complex'
      }
    ]
  }
];

// ============================================================================
// QUANTUM BUSINESS MODEL UTILITIES
// ============================================================================

export interface QuantumBusinessProfile {
  id: string;
  organizationId: string; // Changed from companyId
  blocks: QuantumBlockProfile[];
  relationships: QuantumRelationship[];
  healthScore: number;
  maturityLevel: 'startup' | 'growing' | 'scaling' | 'mature';
  lastUpdated: string;
}

export interface QuantumBlockProfile {
  blockId: string;
  strength: number; // 0-100
  health: number; // 0-100
  properties: Record<string, any>;
  healthIndicators: Record<string, number>;
  aiCapabilities: string[];
  marketplaceIntegrations: string[];
}

export interface QuantumInsight {
  id: string;
  type: 'opportunity' | 'risk' | 'optimization' | 'gap';
  blockId: string;
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  priority: number;
  actions: string[];
  estimatedValue?: number;
}

export interface QuantumRecommendation {
  id: string;
  type: 'ai_agent' | 'marketplace_integration' | 'process_improvement' | 'capability_building';
  title: string;
  description: string;
  targetBlocks: string[];
  impact: 'low' | 'medium' | 'high' | 'critical';
  effort: 'low' | 'medium' | 'high';
  estimatedValue: number;
  implementationSteps: string[];
}

// ============================================================================
// QUANTUM MODEL FUNCTIONS
// ============================================================================

export function getQuantumBlock(id: string): QuantumBlock | undefined {
  return QUANTUM_BLOCKS.find(block => block.id === id);
}

export function getAllQuantumBlocks(): QuantumBlock[] {
  return QUANTUM_BLOCKS;
}

export function getBlockRelationships(blockId: string): QuantumRelationship[] {
  const block = getQuantumBlock(blockId);
  return block?.relationships || [];
}

export function calculateBusinessHealth(profile: QuantumBusinessProfile): number {
  const totalHealth = profile.blocks.reduce((sum, block) => sum + block.health, 0);
  return Math.round(totalHealth / profile.blocks.length);
}

export function generateQuantumInsights(profile: QuantumBusinessProfile): QuantumInsight[] {
  const insights: QuantumInsight[] = [];
  
  // Analyze each block for opportunities and risks
  profile.blocks.forEach(block => {
    if (block.health < 70) {
      insights.push({
        id: `risk-${block.blockId}`,
        type: 'risk',
        blockId: block.blockId,
        title: `${getQuantumBlock(block.blockId)?.name} Health Risk`,
        description: `The ${getQuantumBlock(block.blockId)?.name} block is showing signs of weakness (${block.health}% health)`,
        impact: block.health < 50 ? 'critical' : 'high',
        priority: 100 - block.health,
        actions: ['Assess current state', 'Identify root causes', 'Implement improvement plan']
      });
    }
    
    if (block.strength < 60) {
      insights.push({
        id: `opportunity-${block.blockId}`,
        type: 'opportunity',
        blockId: block.blockId,
        title: `${getQuantumBlock(block.blockId)?.name} Strengthening Opportunity`,
        description: `There's significant opportunity to strengthen the ${getQuantumBlock(block.blockId)?.name} block`,
        impact: 'medium',
        priority: 60 - block.strength,
        actions: ['Define strengthening strategy', 'Allocate resources', 'Track progress']
      });
    }
  });
  
  return insights.sort((a, b) => b.priority - a.priority);
}

export function generateQuantumRecommendations(profile: QuantumBusinessProfile): QuantumRecommendation[] {
  const recommendations: QuantumRecommendation[] = [];
  
  // Generate AI agent recommendations
  profile.blocks.forEach(block => {
    const quantumBlock = getQuantumBlock(block.blockId);
    if (quantumBlock && block.health < 80) {
      quantumBlock.aiCapabilities.forEach(capability => {
        recommendations.push({
          id: `ai-${block.blockId}-${capability.id}`,
          type: 'ai_agent',
          title: `Deploy ${capability.name} for ${quantumBlock.name}`,
          description: capability.description,
          targetBlocks: [block.blockId],
          impact: 'high',
          effort: 'medium',
          estimatedValue: 5000,
          implementationSteps: [
            'Configure AI agent capabilities',
            'Connect to relevant data sources',
            'Train on business context',
            'Deploy and monitor performance'
          ]
        });
      });
    }
  });
  
  return recommendations.sort((a, b) => {
    const impactScore = { low: 1, medium: 2, high: 3, critical: 4 };
    return impactScore[b.impact] - impactScore[a.impact];
  });
}
