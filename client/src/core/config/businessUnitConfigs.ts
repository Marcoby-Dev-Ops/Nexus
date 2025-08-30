/**
 * Business Unit Configurations
 * Defines standard business units, KPIs, processes, and roles across different business models
 * 
 * Pillar: 1 (Efficient Automation) - Standardized business unit management
 */

import { 
  Users, DollarSign, TrendingUp, Settings, Shield, 
  ShoppingCart, Truck, Heart, GraduationCap, Home,
  Building2, Factory, Megaphone, Utensils, BookOpen
} from 'lucide-react';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface BusinessUnitConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'core' | 'support' | 'specialized';
  priority: 'critical' | 'high' | 'medium' | 'low';
  kpis: BusinessUnitKPI[];
  processes: BusinessUnitProcess[];
  roles: BusinessUnitRole[];
  tools: BusinessUnitTool[];
  automations: BusinessUnitAutomation[];
  applicableBusinessModels: string[];
  applicableIndustries: string[];
}

export interface BusinessUnitKPI {
  id: string;
  name: string;
  description: string;
  category: 'financial' | 'operational' | 'customer' | 'growth' | 'compliance';
  unit: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';
  target: number;
  warning: number;
  critical: number;
  industryBenchmark?: number;
  calculation: string;
  dataSource: string[];
}

export interface BusinessUnitProcess {
  id: string;
  name: string;
  description: string;
  category: 'core' | 'support' | 'compliance' | 'growth';
  frequency: 'continuous' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';
  steps: BusinessUnitProcessStep[];
  automationPotential: 'low' | 'medium' | 'high';
  estimatedTime: string;
  requiredRoles: string[];
  tools: string[];
  risks: string[];
  mitigations: string[];
}

export interface BusinessUnitProcessStep {
  id: string;
  name: string;
  description: string;
  role: string;
  estimatedTime: string;
  automationLevel: 'manual' | 'semi-automated' | 'fully-automated';
  tools: string[];
  dependencies: string[];
  outputs: string[];
}

export interface BusinessUnitRole {
  id: string;
  title: string;
  description: string;
  level: 'entry' | 'mid' | 'senior' | 'executive';
  responsibilities: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  careerPath: string[];
  salaryRange: {
    entry: number;
    mid: number;
    senior: number;
    executive: number;
  };
  certifications: string[];
  tools: string[];
}

export interface BusinessUnitTool {
  id: string;
  name: string;
  category: 'essential' | 'recommended' | 'optional';
  description: string;
  useCase: string;
  estimatedCost: string;
  estimatedROI: string;
  alternatives: string[];
  integrationComplexity: 'low' | 'medium' | 'high';
}

export interface BusinessUnitAutomation {
  id: string;
  name: string;
  description: string;
  type: 'workflow' | 'reporting' | 'monitoring' | 'communication';
  tools: string[];
  estimatedSavings: string;
  implementationTime: string;
  complexity: 'low' | 'medium' | 'high';
  prerequisites: string[];
}

// ============================================================================
// BUSINESS UNIT CONFIGURATIONS
// ============================================================================

export const businessUnitConfigs: BusinessUnitConfig[] = [
  {
    id: 'sales',
    name: 'Sales',
    description: 'Revenue generation, customer acquisition, and relationship management',
    icon: TrendingUp,
    category: 'core',
    priority: 'critical',
    kpis: [
      {
        id: 'revenue',
        name: 'Total Revenue',
        description: 'Total sales revenue generated',
        category: 'financial',
        unit: 'USD',
        frequency: 'monthly',
        target: 100000,
        warning: 80000,
        critical: 60000,
        calculation: 'SUM(all_sales)',
        dataSource: ['CRM', 'Accounting System']
      },
      {
        id: 'conversion_rate',
        name: 'Lead Conversion Rate',
        description: 'Percentage of leads converted to customers',
        category: 'customer',
        unit: '%',
        frequency: 'monthly',
        target: 25,
        warning: 20,
        critical: 15,
        calculation: '(converted_leads / total_leads) * 100',
        dataSource: ['CRM', 'Marketing Platform']
      },
      {
        id: 'average_deal_size',
        name: 'Average Deal Size',
        description: 'Average value of closed deals',
        category: 'financial',
        unit: 'USD',
        frequency: 'monthly',
        target: 5000,
        warning: 4000,
        critical: 3000,
        calculation: 'AVG(deal_values)',
        dataSource: ['CRM']
      },
      {
        id: 'sales_cycle_length',
        name: 'Sales Cycle Length',
        description: 'Average time from lead to close',
        category: 'operational',
        unit: 'days',
        frequency: 'monthly',
        target: 30,
        warning: 45,
        critical: 60,
        calculation: 'AVG(close_date - lead_date)',
        dataSource: ['CRM']
      }
    ],
    processes: [
      {
        id: 'lead_qualification',
        name: 'Lead Qualification Process',
        description: 'Systematic evaluation of lead quality and fit',
        category: 'core',
        frequency: 'continuous',
        steps: [
          {
            id: 'initial_contact',
            name: 'Initial Contact',
            description: 'First contact with prospect',
            role: 'Sales Representative',
            estimatedTime: '15 minutes',
            automationLevel: 'semi-automated',
            tools: ['CRM', 'Email', 'Phone'],
            dependencies: [],
            outputs: ['Contact Record', 'Initial Notes']
          },
          {
            id: 'needs_assessment',
            name: 'Needs Assessment',
            description: 'Understand prospect requirements and pain points',
            role: 'Sales Representative',
            estimatedTime: '30 minutes',
            automationLevel: 'manual',
            tools: ['CRM', 'Discovery Questions', 'Meeting Platform'],
            dependencies: ['initial_contact'],
            outputs: ['Needs Document', 'Qualification Score']
          }
        ],
        automationPotential: 'medium',
        estimatedTime: '1-2 hours',
        requiredRoles: ['Sales Representative', 'Sales Manager'],
        tools: ['CRM', 'Email Automation', 'Meeting Scheduler'],
        risks: ['Poor qualification', 'Wasted time', 'Low conversion'],
        mitigations: ['Standardized criteria', 'Training', 'Regular review']
      }
    ],
    roles: [
      {
        id: 'sales_representative',
        title: 'Sales Representative',
        description: 'Front-line sales professional responsible for customer acquisition',
        level: 'mid',
        responsibilities: [
          'Prospect qualification',
          'Product demonstrations',
          'Proposal development',
          'Negotiation and closing',
          'Account management'
        ],
        requiredSkills: [
          'Sales techniques',
          'Product knowledge',
          'Communication',
          'CRM proficiency',
          'Negotiation'
        ],
        preferredSkills: [
          'Industry knowledge',
          'Technical aptitude',
          'Relationship building',
          'Problem solving'
        ],
        careerPath: [
          'Sales Development Representative',
          'Sales Representative',
          'Senior Sales Representative',
          'Sales Manager'
        ],
        salaryRange: {
          entry: 40000,
          mid: 60000,
          senior: 80000,
          executive: 120000
        },
        certifications: [
          'Sales Training Certification',
          'Product Certifications',
          'Industry Certifications'
        ],
        tools: ['CRM', 'Email', 'Phone', 'Meeting Platforms', 'Proposal Tools']
      }
    ],
    tools: [
      {
        id: 'crm',
        name: 'Customer Relationship Management (CRM)',
        category: 'essential',
        description: 'Centralized customer data and sales pipeline management',
        useCase: 'Lead tracking, opportunity management, customer data',
        estimatedCost: '$50-200/user/month',
        estimatedROI: 'High - Essential for sales operations',
        alternatives: ['HubSpot', 'Salesforce', 'Pipedrive', 'Zoho CRM'],
        integrationComplexity: 'medium'
      },
      {
        id: 'sales_automation',
        name: 'Sales Automation Platform',
        category: 'recommended',
        description: 'Automate repetitive sales tasks and follow-ups',
        useCase: 'Email sequences, follow-up scheduling, lead scoring',
        estimatedCost: '$20-100/user/month',
        estimatedROI: 'Medium - Improves efficiency',
        alternatives: ['Outreach', 'SalesLoft', 'HubSpot Sales Hub'],
        integrationComplexity: 'low'
      }
    ],
    automations: [
      {
        id: 'lead_scoring',
        name: 'Automated Lead Scoring',
        description: 'Automatically score leads based on behavior and criteria',
        type: 'workflow',
        tools: ['CRM', 'Marketing Automation', 'Analytics'],
        estimatedSavings: '10-20 hours/week',
        implementationTime: '2-4 weeks',
        complexity: 'medium',
        prerequisites: ['CRM setup', 'Lead tracking', 'Scoring criteria']
      }
    ],
    applicableBusinessModels: ['B2B', 'B2C', 'SaaS', 'Consulting', 'Agency'],
    applicableIndustries: ['technology', 'healthcare', 'financial-services', 'professional-services']
  },
  {
    id: 'marketing',
    name: 'Marketing',
    description: 'Brand awareness, lead generation, and customer engagement',
    icon: Megaphone,
    category: 'core',
    priority: 'high',
    kpis: [
      {
        id: 'lead_generation',
        name: 'Lead Generation',
        description: 'Number of qualified leads generated',
        category: 'growth',
        unit: 'leads',
        frequency: 'monthly',
        target: 100,
        warning: 80,
        critical: 60,
        calculation: 'COUNT(qualified_leads)',
        dataSource: ['Marketing Platform', 'CRM']
      },
      {
        id: 'cost_per_lead',
        name: 'Cost per Lead',
        description: 'Average cost to acquire a qualified lead',
        category: 'financial',
        unit: 'USD',
        frequency: 'monthly',
        target: 50,
        warning: 75,
        critical: 100,
        calculation: 'marketing_spend / qualified_leads',
        dataSource: ['Marketing Platform', 'Accounting']
      },
      {
        id: 'website_traffic',
        name: 'Website Traffic',
        description: 'Number of unique visitors to website',
        category: 'growth',
        unit: 'visitors',
        frequency: 'monthly',
        target: 10000,
        warning: 8000,
        critical: 6000,
        calculation: 'COUNT(unique_visitors)',
        dataSource: ['Google Analytics', 'Website Analytics']
      },
      {
        id: 'email_open_rate',
        name: 'Email Open Rate',
        description: 'Percentage of emails opened by recipients',
        category: 'customer',
        unit: '%',
        frequency: 'monthly',
        target: 25,
        warning: 20,
        critical: 15,
        calculation: '(opened_emails / sent_emails) * 100',
        dataSource: ['Email Marketing Platform']
      }
    ],
    processes: [
      {
        id: 'content_creation',
        name: 'Content Creation Process',
        description: 'Systematic approach to creating marketing content',
        category: 'core',
        frequency: 'weekly',
        steps: [
          {
            id: 'content_planning',
            name: 'Content Planning',
            description: 'Plan content topics and calendar',
            role: 'Marketing Manager',
            estimatedTime: '2 hours',
            automationLevel: 'semi-automated',
            tools: ['Content Calendar', 'SEO Tools', 'Analytics'],
            dependencies: [],
            outputs: ['Content Calendar', 'Topic List']
          },
          {
            id: 'content_creation',
            name: 'Content Creation',
            description: 'Create the actual content',
            role: 'Content Creator',
            estimatedTime: '4-8 hours',
            automationLevel: 'manual',
            tools: ['Word Processor', 'Design Tools', 'Research Tools'],
            dependencies: ['content_planning'],
            outputs: ['Draft Content', 'Assets']
          }
        ],
        automationPotential: 'medium',
        estimatedTime: '1-2 weeks',
        requiredRoles: ['Marketing Manager', 'Content Creator', 'Designer'],
        tools: ['Content Management System', 'Design Tools', 'Analytics'],
        risks: ['Poor quality', 'Missed deadlines', 'Low engagement'],
        mitigations: ['Quality standards', 'Project management', 'Performance tracking']
      }
    ],
    roles: [
      {
        id: 'marketing_manager',
        title: 'Marketing Manager',
        description: 'Oversees marketing strategy and execution',
        level: 'senior',
        responsibilities: [
          'Marketing strategy development',
          'Campaign management',
          'Budget allocation',
          'Team leadership',
          'Performance analysis'
        ],
        requiredSkills: [
          'Marketing strategy',
          'Digital marketing',
          'Analytics',
          'Leadership',
          'Project management'
        ],
        preferredSkills: [
          'Content marketing',
          'SEO/SEM',
          'Social media',
          'Marketing automation'
        ],
        careerPath: [
          'Marketing Coordinator',
          'Marketing Manager',
          'Senior Marketing Manager',
          'Marketing Director'
        ],
        salaryRange: {
          entry: 50000,
          mid: 70000,
          senior: 90000,
          executive: 130000
        },
        certifications: [
          'Google Ads Certification',
          'HubSpot Certification',
          'Digital Marketing Certification'
        ],
        tools: ['Marketing Automation', 'Analytics', 'Social Media', 'Email Marketing']
      }
    ],
    tools: [
      {
        id: 'marketing_automation',
        name: 'Marketing Automation Platform',
        category: 'essential',
        description: 'Automate marketing campaigns and lead nurturing',
        useCase: 'Email marketing, lead nurturing, campaign management',
        estimatedCost: '$200-1000/month',
        estimatedROI: 'High - Essential for modern marketing',
        alternatives: ['HubSpot', 'Marketo', 'Pardot', 'Mailchimp'],
        integrationComplexity: 'medium'
      },
      {
        id: 'analytics',
        name: 'Marketing Analytics',
        category: 'essential',
        description: 'Track and analyze marketing performance',
        useCase: 'Campaign tracking, ROI measurement, performance optimization',
        estimatedCost: '$50-500/month',
        estimatedROI: 'High - Data-driven decisions',
        alternatives: ['Google Analytics', 'Adobe Analytics', 'Mixpanel'],
        integrationComplexity: 'low'
      }
    ],
    automations: [
      {
        id: 'lead_nurturing',
        name: 'Automated Lead Nurturing',
        description: 'Automatically nurture leads through email sequences',
        type: 'workflow',
        tools: ['Marketing Automation', 'CRM', 'Email Platform'],
        estimatedSavings: '15-25 hours/week',
        implementationTime: '3-6 weeks',
        complexity: 'medium',
        prerequisites: ['Lead scoring', 'Email templates', 'Segmentation']
      }
    ],
    applicableBusinessModels: ['B2B', 'B2C', 'SaaS', 'E-commerce', 'Agency'],
    applicableIndustries: ['technology', 'healthcare', 'financial-services', 'retail-ecommerce']
  },
  {
    id: 'finance',
    name: 'Finance',
    description: 'Financial management, accounting, and strategic planning',
    icon: DollarSign,
    category: 'core',
    priority: 'critical',
    kpis: [
      {
        id: 'cash_flow',
        name: 'Cash Flow',
        description: 'Net cash flow from operations',
        category: 'financial',
        unit: 'USD',
        frequency: 'monthly',
        target: 50000,
        warning: 25000,
        critical: 0,
        calculation: 'operating_cash_in - operating_cash_out',
        dataSource: ['Accounting System', 'Bank Statements']
      },
      {
        id: 'profit_margin',
        name: 'Profit Margin',
        description: 'Net profit as percentage of revenue',
        category: 'financial',
        unit: '%',
        frequency: 'monthly',
        target: 20,
        warning: 15,
        critical: 10,
        calculation: '(net_profit / revenue) * 100',
        dataSource: ['Accounting System']
      },
      {
        id: 'accounts_receivable',
        name: 'Days Sales Outstanding',
        description: 'Average days to collect payment',
        category: 'financial',
        unit: 'days',
        frequency: 'monthly',
        target: 30,
        warning: 45,
        critical: 60,
        calculation: '(accounts_receivable / revenue) * 365',
        dataSource: ['Accounting System']
      },
      {
        id: 'burn_rate',
        name: 'Burn Rate',
        description: 'Monthly cash consumption rate',
        category: 'financial',
        unit: 'USD/month',
        frequency: 'monthly',
        target: 50000,
        warning: 75000,
        critical: 100000,
        calculation: 'monthly_expenses - monthly_revenue',
        dataSource: ['Accounting System']
      }
    ],
    processes: [
      {
        id: 'monthly_close',
        name: 'Monthly Close Process',
        description: 'Systematic monthly financial closing and reporting',
        category: 'core',
        frequency: 'monthly',
        steps: [
          {
            id: 'revenue_recognition',
            name: 'Revenue Recognition',
            description: 'Recognize revenue according to accounting standards',
            role: 'Accountant',
            estimatedTime: '4 hours',
            automationLevel: 'semi-automated',
            tools: ['Accounting System', 'Revenue Recognition Software'],
            dependencies: [],
            outputs: ['Revenue Journal Entries']
          },
          {
            id: 'expense_reconciliation',
            name: 'Expense Reconciliation',
            description: 'Reconcile all expenses and accruals',
            role: 'Accountant',
            estimatedTime: '6 hours',
            automationLevel: 'semi-automated',
            tools: ['Accounting System', 'Bank Reconciliation'],
            dependencies: ['revenue_recognition'],
            outputs: ['Expense Journal Entries', 'Reconciliation Reports']
          }
        ],
        automationPotential: 'high',
        estimatedTime: '3-5 days',
        requiredRoles: ['Accountant', 'Financial Controller', 'CFO'],
        tools: ['Accounting System', 'Bank Reconciliation', 'Reporting Tools'],
        risks: ['Inaccurate reporting', 'Missed deadlines', 'Compliance issues'],
        mitigations: ['Checklists', 'Automation', 'Review process']
      }
    ],
    roles: [
      {
        id: 'financial_controller',
        title: 'Financial Controller',
        description: 'Oversees accounting operations and financial reporting',
        level: 'senior',
        responsibilities: [
          'Financial reporting',
          'Accounting operations',
          'Internal controls',
          'Compliance',
          'Team management'
        ],
        requiredSkills: [
          'Accounting principles',
          'Financial reporting',
          'Internal controls',
          'Leadership',
          'Analytical skills'
        ],
        preferredSkills: [
          'ERP systems',
          'Audit experience',
          'Tax knowledge',
          'Process improvement'
        ],
        careerPath: [
          'Senior Accountant',
          'Financial Controller',
          'Finance Director',
          'CFO'
        ],
        salaryRange: {
          entry: 60000,
          mid: 80000,
          senior: 100000,
          executive: 150000
        },
        certifications: [
          'CPA',
          'CMA',
          'Chartered Accountant'
        ],
        tools: ['ERP System', 'Accounting Software', 'Excel', 'Reporting Tools']
      }
    ],
    tools: [
      {
        id: 'accounting_software',
        name: 'Accounting Software',
        category: 'essential',
        description: 'Core financial management and accounting system',
        useCase: 'Bookkeeping, financial reporting, compliance',
        estimatedCost: '$50-500/month',
        estimatedROI: 'High - Essential for financial management',
        alternatives: ['QuickBooks', 'Xero', 'Sage', 'NetSuite'],
        integrationComplexity: 'medium'
      },
      {
        id: 'expense_management',
        name: 'Expense Management',
        category: 'recommended',
        description: 'Automate expense tracking and approval',
        useCase: 'Expense tracking, approval workflows, reimbursement',
        estimatedCost: '$10-50/user/month',
        estimatedROI: 'Medium - Improves efficiency',
        alternatives: ['Expensify', 'Concur', 'Receipt Bank'],
        integrationComplexity: 'low'
      }
    ],
    automations: [
      {
        id: 'expense_processing',
        name: 'Automated Expense Processing',
        description: 'Automatically process and categorize expenses',
        type: 'workflow',
        tools: ['Expense Management', 'Accounting System', 'OCR'],
        estimatedSavings: '8-12 hours/week',
        implementationTime: '2-4 weeks',
        complexity: 'medium',
        prerequisites: ['Expense policy', 'Approval workflows', 'Integration setup']
      }
    ],
    applicableBusinessModels: ['B2B', 'B2C', 'SaaS', 'Consulting', 'Manufacturing'],
    applicableIndustries: ['technology', 'healthcare', 'financial-services', 'manufacturing']
  },
  {
    id: 'operations',
    name: 'Operations',
    description: 'Process optimization, efficiency, and day-to-day business operations',
    icon: Settings,
    category: 'core',
    priority: 'high',
    kpis: [
      {
        id: 'operational_efficiency',
        name: 'Operational Efficiency',
        description: 'Output per unit of input',
        category: 'operational',
        unit: 'ratio',
        frequency: 'monthly',
        target: 1.2,
        warning: 1.0,
        critical: 0.8,
        calculation: 'output / input',
        dataSource: ['Operations System', 'Time Tracking']
      },
      {
        id: 'process_completion_time',
        name: 'Process Completion Time',
        description: 'Average time to complete key processes',
        category: 'operational',
        unit: 'hours',
        frequency: 'weekly',
        target: 24,
        warning: 48,
        critical: 72,
        calculation: 'AVG(process_completion_times)',
        dataSource: ['Project Management', 'Time Tracking']
      },
      {
        id: 'error_rate',
        name: 'Error Rate',
        description: 'Percentage of errors in processes',
        category: 'operational',
        unit: '%',
        frequency: 'monthly',
        target: 1,
        warning: 3,
        critical: 5,
        calculation: '(errors / total_operations) * 100',
        dataSource: ['Quality System', 'Customer Feedback']
      },
      {
        id: 'resource_utilization',
        name: 'Resource Utilization',
        description: 'Percentage of available resources being used',
        category: 'operational',
        unit: '%',
        frequency: 'monthly',
        target: 85,
        warning: 95,
        critical: 100,
        calculation: '(used_resources / available_resources) * 100',
        dataSource: ['Resource Management', 'Time Tracking']
      }
    ],
    processes: [
      {
        id: 'process_optimization',
        name: 'Process Optimization',
        description: 'Continuous improvement of business processes',
        category: 'core',
        frequency: 'quarterly',
        steps: [
          {
            id: 'process_mapping',
            name: 'Process Mapping',
            description: 'Document current process flows',
            role: 'Operations Manager',
            estimatedTime: '8 hours',
            automationLevel: 'manual',
            tools: ['Process Mapping Software', 'Documentation Tools'],
            dependencies: [],
            outputs: ['Process Maps', 'Documentation']
          },
          {
            id: 'bottleneck_analysis',
            name: 'Bottleneck Analysis',
            description: 'Identify process bottlenecks and inefficiencies',
            role: 'Operations Analyst',
            estimatedTime: '4 hours',
            automationLevel: 'semi-automated',
            tools: ['Analytics Tools', 'Process Mining'],
            dependencies: ['process_mapping'],
            outputs: ['Bottleneck Report', 'Improvement Opportunities']
          }
        ],
        automationPotential: 'medium',
        estimatedTime: '2-4 weeks',
        requiredRoles: ['Operations Manager', 'Operations Analyst', 'Process Owner'],
        tools: ['Process Mapping', 'Analytics', 'Project Management'],
        risks: ['Resistance to change', 'Incomplete analysis', 'Poor implementation'],
        mitigations: ['Change management', 'Thorough analysis', 'Pilot testing']
      }
    ],
    roles: [
      {
        id: 'operations_manager',
        title: 'Operations Manager',
        description: 'Oversees day-to-day operations and process optimization',
        level: 'senior',
        responsibilities: [
          'Process optimization',
          'Resource management',
          'Quality control',
          'Team leadership',
          'Performance monitoring'
        ],
        requiredSkills: [
          'Process management',
          'Leadership',
          'Analytical skills',
          'Project management',
          'Problem solving'
        ],
        preferredSkills: [
          'Lean/Six Sigma',
          'Automation',
          'Data analysis',
          'Change management'
        ],
        careerPath: [
          'Operations Coordinator',
          'Operations Manager',
          'Senior Operations Manager',
          'Director of Operations'
        ],
        salaryRange: {
          entry: 55000,
          mid: 75000,
          senior: 95000,
          executive: 140000
        },
        certifications: [
          'Lean Six Sigma',
          'PMP',
          'Operations Management'
        ],
        tools: ['Project Management', 'Analytics', 'Process Mapping', 'Communication Tools']
      }
    ],
    tools: [
      {
        id: 'project_management',
        name: 'Project Management Platform',
        category: 'essential',
        description: 'Manage projects, tasks, and team collaboration',
        useCase: 'Project planning, task management, team coordination',
        estimatedCost: '$10-50/user/month',
        estimatedROI: 'High - Essential for operations',
        alternatives: ['Asana', 'Monday.com', 'Trello', 'Jira'],
        integrationComplexity: 'low'
      },
      {
        id: 'process_automation',
        name: 'Process Automation Platform',
        category: 'recommended',
        description: 'Automate repetitive business processes',
        useCase: 'Workflow automation, data processing, task automation',
        estimatedCost: '$50-500/month',
        estimatedROI: 'Medium - Improves efficiency',
        alternatives: ['Zapier', 'n8n', 'Microsoft Power Automate'],
        integrationComplexity: 'medium'
      }
    ],
    automations: [
      {
        id: 'workflow_automation',
        name: 'Workflow Automation',
        description: 'Automate repetitive workflows and approvals',
        type: 'workflow',
        tools: ['Process Automation', 'Project Management', 'Communication'],
        estimatedSavings: '10-20 hours/week',
        implementationTime: '4-8 weeks',
        complexity: 'medium',
        prerequisites: ['Process documentation', 'Approval workflows', 'Integration setup']
      }
    ],
    applicableBusinessModels: ['B2B', 'B2C', 'SaaS', 'Consulting', 'Manufacturing'],
    applicableIndustries: ['technology', 'healthcare', 'manufacturing', 'professional-services']
  }
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get business unit configuration by ID
 */
export function getBusinessUnitConfig(unitId: string): BusinessUnitConfig | undefined {
  return businessUnitConfigs.find(config => config.id === unitId);
}

/**
 * Get all business units for a business model
 */
export function getBusinessUnitsForModel(businessModel: string): BusinessUnitConfig[] {
  return businessUnitConfigs.filter(config => 
    config.applicableBusinessModels.includes(businessModel)
  );
}

/**
 * Get all business units for an industry
 */
export function getBusinessUnitsForIndustry(industry: string): BusinessUnitConfig[] {
  return businessUnitConfigs.filter(config => 
    config.applicableIndustries.includes(industry)
  );
}

/**
 * Get core business units (critical and high priority)
 */
export function getCoreBusinessUnits(): BusinessUnitConfig[] {
  return businessUnitConfigs.filter(config => 
    config.priority === 'critical' || config.priority === 'high'
  );
}

/**
 * Get KPIs for a business unit
 */
export function getBusinessUnitKPIs(unitId: string): BusinessUnitKPI[] {
  const config = getBusinessUnitConfig(unitId);
  return config?.kpis || [];
}

/**
 * Get processes for a business unit
 */
export function getBusinessUnitProcesses(unitId: string): BusinessUnitProcess[] {
  const config = getBusinessUnitConfig(unitId);
  return config?.processes || [];
}

/**
 * Get roles for a business unit
 */
export function getBusinessUnitRoles(unitId: string): BusinessUnitRole[] {
  const config = getBusinessUnitConfig(unitId);
  return config?.roles || [];
}

/**
 * Get tools for a business unit
 */
export function getBusinessUnitTools(unitId: string): BusinessUnitTool[] {
  const config = getBusinessUnitConfig(unitId);
  return config?.tools || [];
}

/**
 * Get automations for a business unit
 */
export function getBusinessUnitAutomations(unitId: string): BusinessUnitAutomation[] {
  const config = getBusinessUnitConfig(unitId);
  return config?.automations || [];
}

/**
 * Get recommended tools for a business unit
 */
export function getRecommendedTools(unitId: string): BusinessUnitTool[] {
  const tools = getBusinessUnitTools(unitId);
  return tools.filter(tool => 
    tool.category === 'essential' || tool.category === 'recommended'
  );
}

/**
 * Get KPIs by category for a business unit
 */
export function getBusinessUnitKPIsByCategory(unitId: string, category: string): BusinessUnitKPI[] {
  const kpis = getBusinessUnitKPIs(unitId);
  return kpis.filter(kpi => kpi.category === category);
}

/**
 * Get processes by automation potential for a business unit
 */
export function getBusinessUnitProcessesByAutomationPotential(unitId: string, potential: string): BusinessUnitProcess[] {
  const processes = getBusinessUnitProcesses(unitId);
  return processes.filter(process => process.automationPotential === potential);
}

/**
 * Get all available business units
 */
export function getAllBusinessUnits(): Array<{ id: string; name: string; description: string; category: string }> {
  return businessUnitConfigs.map(config => ({
    id: config.id,
    name: config.name,
    description: config.description,
    category: config.category
  }));
}

export default businessUnitConfigs;
