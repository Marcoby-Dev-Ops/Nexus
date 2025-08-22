/**
 * Industry Configurations
 * Defines business units, KPIs, processes, and standards for different industry verticals
 * 
 * Pillar: 1 (Efficient Automation) - Industry-specific business intelligence
 */

import { 
  Building2, Users, ShoppingCart, Factory, Heart, GraduationCap, 
  Home, Truck, Megaphone, Utensils, BookOpen, HandHeart, 
  Shield, Leaf, Wheat, Settings 
} from 'lucide-react';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface IndustryConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  businessUnits: BusinessUnit[];
  kpis: IndustryKPI[];
  processes: IndustryProcess[];
  standards: IndustryStandard[];
  integrations: IndustryIntegration[];
  businessModels: BusinessModel[];
}

export interface BusinessUnit {
  id: string;
  name: string;
  description: string;
  priority: 'core' | 'support' | 'specialized';
  kpis: string[];
  processes: string[];
  roles: BusinessRole[];
}

export interface BusinessRole {
  id: string;
  title: string;
  responsibilities: string[];
  requiredSkills: string[];
  careerPath: string[];
}

export interface IndustryKPI {
  id: string;
  name: string;
  description: string;
  category: 'financial' | 'operational' | 'customer' | 'growth' | 'compliance';
  unit: string;
  excellent: number;
  good: number;
  fair: number;
  poor: number;
  industryBenchmark?: number;
}

export interface IndustryProcess {
  id: string;
  name: string;
  description: string;
  category: 'core' | 'support' | 'compliance' | 'growth';
  steps: ProcessStep[];
  automationPotential: 'low' | 'medium' | 'high';
  estimatedTime: string;
  requiredRoles: string[];
}

export interface ProcessStep {
  id: string;
  name: string;
  description: string;
  role: string;
  estimatedTime: string;
  automationLevel: 'manual' | 'semi-automated' | 'fully-automated';
  tools: string[];
}

export interface IndustryStandard {
  id: string;
  name: string;
  description: string;
  category: 'compliance' | 'quality' | 'security' | 'best-practice';
  requirements: string[];
  documentation: string[];
  auditFrequency: string;
}

export interface IndustryIntegration {
  id: string;
  name: string;
  category: 'essential' | 'recommended' | 'optional';
  description: string;
  useCase: string;
  estimatedROI: string;
}

export interface BusinessModel {
  id: string;
  name: string;
  description: string;
  revenueStreams: string[];
  keyMetrics: string[];
  challenges: string[];
  opportunities: string[];
}

// ============================================================================
// INDUSTRY CONFIGURATIONS
// ============================================================================

export const industryConfigs: IndustryConfig[] = [
  {
    id: 'technology',
    name: 'Technology & Telecommunications',
    description: 'Software, hardware, and digital services companies',
    icon: Settings,
    businessUnits: [
      {
        id: 'product-development',
        name: 'Product Development',
        description: 'Software development, product management, and engineering',
        priority: 'core',
        kpis: ['development_velocity', 'bug_rate', 'feature_adoption', 'code_quality'],
        processes: ['agile_development', 'code_review', 'testing', 'deployment'],
        roles: [
          {
            id: 'product-manager',
            title: 'Product Manager',
            responsibilities: ['Product strategy', 'Feature prioritization', 'User research'],
            requiredSkills: ['Product management', 'Data analysis', 'User experience'],
            careerPath: ['Associate PM', 'Product Manager', 'Senior PM', 'Director of Product']
          },
          {
            id: 'software-engineer',
            title: 'Software Engineer',
            responsibilities: ['Code development', 'Technical architecture', 'Code review'],
            requiredSkills: ['Programming', 'System design', 'Problem solving'],
            careerPath: ['Junior Developer', 'Software Engineer', 'Senior Engineer', 'Tech Lead']
          }
        ]
      },
      {
        id: 'sales-engineering',
        name: 'Sales Engineering',
        description: 'Technical sales, solution architecture, and customer success',
        priority: 'core',
        kpis: ['technical_win_rate', 'poc_success_rate', 'customer_satisfaction', 'renewal_rate'],
        processes: ['technical_discovery', 'proof_of_concept', 'solution_design', 'implementation'],
        roles: [
          {
            id: 'sales-engineer',
            title: 'Sales Engineer',
            responsibilities: ['Technical presentations', 'Solution design', 'Customer demos'],
            requiredSkills: ['Technical expertise', 'Sales acumen', 'Presentation skills'],
            careerPath: ['Sales Engineer', 'Senior SE', 'Solutions Architect', 'Technical Director']
          }
        ]
      }
    ],
    kpis: [
      {
        id: 'development_velocity',
        name: 'Development Velocity',
        description: 'Story points completed per sprint',
        category: 'operational',
        unit: 'story points/sprint',
        excellent: 40,
        good: 30,
        fair: 20,
        poor: 10
      },
      {
        id: 'bug_rate',
        name: 'Bug Rate',
        description: 'Number of bugs per 1000 lines of code',
        category: 'operational',
        unit: 'bugs/1000 LOC',
        excellent: 1,
        good: 3,
        fair: 5,
        poor: 10
      },
      {
        id: 'feature_adoption',
        name: 'Feature Adoption Rate',
        description: 'Percentage of users adopting new features',
        category: 'customer',
        unit: '%',
        excellent: 80,
        good: 60,
        fair: 40,
        poor: 20
      }
    ],
    processes: [
      {
        id: 'agile_development',
        name: 'Agile Development Process',
        description: 'Iterative software development methodology',
        category: 'core',
        steps: [
          {
            id: 'sprint_planning',
            name: 'Sprint Planning',
            description: 'Plan work for the upcoming sprint',
            role: 'Product Manager',
            estimatedTime: '4 hours',
            automationLevel: 'semi-automated',
            tools: ['Jira', 'Confluence', 'Planning Poker']
          },
          {
            id: 'daily_standup',
            name: 'Daily Standup',
            description: 'Daily team synchronization meeting',
            role: 'Scrum Master',
            estimatedTime: '15 minutes',
            automationLevel: 'manual',
            tools: ['Slack', 'Zoom', 'Teams']
          }
        ],
        automationPotential: 'medium',
        estimatedTime: '2 weeks',
        requiredRoles: ['Product Manager', 'Scrum Master', 'Development Team']
      }
    ],
    standards: [
      {
        id: 'iso_27001',
        name: 'ISO 27001 Information Security',
        description: 'Information security management system standard',
        category: 'compliance',
        requirements: ['Security policies', 'Risk assessment', 'Incident management'],
        documentation: ['Security manual', 'Risk register', 'Incident procedures'],
        auditFrequency: 'Annual'
      }
    ],
    integrations: [
      {
        id: 'github',
        name: 'GitHub',
        category: 'essential',
        description: 'Code repository and version control',
        useCase: 'Source code management, CI/CD pipelines',
        estimatedROI: 'High - Essential for development'
      },
      {
        id: 'jira',
        name: 'Jira',
        category: 'essential',
        description: 'Project and issue tracking',
        useCase: 'Agile development, bug tracking, project management',
        estimatedROI: 'High - Core development tool'
      }
    ],
    businessModels: [
      {
        id: 'saas',
        name: 'Software as a Service (SaaS)',
        description: 'Subscription-based software delivery model',
        revenueStreams: ['Monthly subscriptions', 'Annual contracts', 'Enterprise licensing'],
        keyMetrics: ['MRR', 'Churn rate', 'LTV', 'CAC'],
        challenges: ['Customer acquisition', 'Churn management', 'Scaling infrastructure'],
        opportunities: ['Recurring revenue', 'Scalable growth', 'Data insights']
      }
    ]
  },
  {
    id: 'healthcare',
    name: 'Healthcare & Life Sciences',
    description: 'Medical, pharmaceutical, and wellness companies',
    icon: Heart,
    businessUnits: [
      {
        id: 'clinical-operations',
        name: 'Clinical Operations',
        description: 'Patient care, clinical trials, and medical procedures',
        priority: 'core',
        kpis: ['patient_satisfaction', 'clinical_outcomes', 'wait_times', 'safety_incidents'],
        processes: ['patient_intake', 'treatment_planning', 'care_coordination', 'follow_up'],
        roles: [
          {
            id: 'clinical-manager',
            title: 'Clinical Manager',
            responsibilities: ['Clinical oversight', 'Quality assurance', 'Staff management'],
            requiredSkills: ['Clinical expertise', 'Management', 'Regulatory knowledge'],
            careerPath: ['Clinical Coordinator', 'Clinical Manager', 'Director of Clinical Operations']
          }
        ]
      },
      {
        id: 'compliance',
        name: 'Compliance & Regulatory',
        description: 'Regulatory compliance, quality assurance, and risk management',
        priority: 'core',
        kpis: ['compliance_score', 'audit_results', 'incident_rate', 'training_completion'],
        processes: ['regulatory_reporting', 'quality_audits', 'incident_management', 'training'],
        roles: [
          {
            id: 'compliance-officer',
            title: 'Compliance Officer',
            responsibilities: ['Regulatory compliance', 'Policy development', 'Audit coordination'],
            requiredSkills: ['Regulatory knowledge', 'Risk management', 'Policy development'],
            careerPath: ['Compliance Specialist', 'Compliance Officer', 'Chief Compliance Officer']
          }
        ]
      }
    ],
    kpis: [
      {
        id: 'patient_satisfaction',
        name: 'Patient Satisfaction Score',
        description: 'Patient satisfaction with care and services',
        category: 'customer',
        unit: 'score (1-10)',
        excellent: 9.0,
        good: 8.0,
        fair: 7.0,
        poor: 6.0
      },
      {
        id: 'clinical_outcomes',
        name: 'Clinical Outcomes',
        description: 'Success rate of treatments and procedures',
        category: 'operational',
        unit: '%',
        excellent: 95,
        good: 90,
        fair: 85,
        poor: 80
      }
    ],
    processes: [
      {
        id: 'patient_intake',
        name: 'Patient Intake Process',
        description: 'Standardized patient registration and assessment',
        category: 'core',
        steps: [
          {
            id: 'registration',
            name: 'Patient Registration',
            description: 'Collect patient information and insurance details',
            role: 'Patient Coordinator',
            estimatedTime: '30 minutes',
            automationLevel: 'semi-automated',
            tools: ['EMR System', 'Insurance Verification', 'Patient Portal']
          }
        ],
        automationPotential: 'high',
        estimatedTime: '1 hour',
        requiredRoles: ['Patient Coordinator', 'Nurse', 'Physician']
      }
    ],
    standards: [
      {
        id: 'hipaa',
        name: 'HIPAA Compliance',
        description: 'Health Insurance Portability and Accountability Act',
        category: 'compliance',
        requirements: ['Privacy protection', 'Security safeguards', 'Breach notification'],
        documentation: ['Privacy policies', 'Security procedures', 'Incident response plan'],
        auditFrequency: 'Annual'
      }
    ],
    integrations: [
      {
        id: 'emr',
        name: 'Electronic Medical Records (EMR)',
        category: 'essential',
        description: 'Digital patient records and clinical documentation',
        useCase: 'Patient care, clinical documentation, billing',
        estimatedROI: 'High - Required for operations'
      }
    ],
    businessModels: [
      {
        id: 'fee-for-service',
        name: 'Fee-for-Service',
        description: 'Payment for individual medical services',
        revenueStreams: ['Patient payments', 'Insurance reimbursements', 'Government payments'],
        keyMetrics: ['Revenue per patient', 'Collection rate', 'Days in AR'],
        challenges: ['Insurance complexity', 'Regulatory compliance', 'Cost management'],
        opportunities: ['Service expansion', 'Efficiency improvements', 'Quality outcomes']
      }
    ]
  },
  {
    id: 'retail-ecommerce',
    name: 'Retail & eCommerce',
    description: 'Online and brick-and-mortar retail businesses',
    icon: ShoppingCart,
    businessUnits: [
      {
        id: 'merchandising',
        name: 'Merchandising',
        description: 'Product selection, pricing, and inventory management',
        priority: 'core',
        kpis: ['inventory_turnover', 'gross_margin', 'sell_through_rate', 'markdown_percentage'],
        processes: ['product_selection', 'pricing_strategy', 'inventory_planning', 'markdown_management'],
        roles: [
          {
            id: 'merchandise-manager',
            title: 'Merchandise Manager',
            responsibilities: ['Product selection', 'Pricing strategy', 'Inventory planning'],
            requiredSkills: ['Merchandising', 'Analytics', 'Trend analysis'],
            careerPath: ['Merchandise Assistant', 'Merchandise Manager', 'Senior Merchandise Manager']
          }
        ]
      },
      {
        id: 'ecommerce',
        name: 'E-commerce Operations',
        description: 'Online sales, digital marketing, and customer experience',
        priority: 'core',
        kpis: ['conversion_rate', 'average_order_value', 'cart_abandonment', 'customer_lifetime_value'],
        processes: ['website_optimization', 'digital_marketing', 'order_fulfillment', 'customer_service'],
        roles: [
          {
            id: 'ecommerce-manager',
            title: 'E-commerce Manager',
            responsibilities: ['Website management', 'Digital marketing', 'Online sales'],
            requiredSkills: ['Digital marketing', 'E-commerce platforms', 'Analytics'],
            careerPath: ['E-commerce Specialist', 'E-commerce Manager', 'Digital Commerce Director']
          }
        ]
      }
    ],
    kpis: [
      {
        id: 'conversion_rate',
        name: 'Website Conversion Rate',
        description: 'Percentage of visitors who make a purchase',
        category: 'customer',
        unit: '%',
        excellent: 5.0,
        good: 3.0,
        fair: 2.0,
        poor: 1.0
      },
      {
        id: 'average_order_value',
        name: 'Average Order Value',
        description: 'Average amount spent per order',
        category: 'financial',
        unit: 'USD',
        excellent: 150,
        good: 100,
        fair: 75,
        poor: 50
      }
    ],
    processes: [
      {
        id: 'order_fulfillment',
        name: 'Order Fulfillment Process',
        description: 'End-to-end order processing and delivery',
        category: 'core',
        steps: [
          {
            id: 'order_processing',
            name: 'Order Processing',
            description: 'Review and validate incoming orders',
            role: 'Order Processor',
            estimatedTime: '15 minutes',
            automationLevel: 'high',
            tools: ['Order Management System', 'Payment Gateway', 'Inventory System']
          }
        ],
        automationPotential: 'high',
        estimatedTime: '2-5 days',
        requiredRoles: ['Order Processor', 'Warehouse Staff', 'Shipping Coordinator']
      }
    ],
    standards: [
      {
        id: 'pci_dss',
        name: 'PCI DSS Compliance',
        description: 'Payment Card Industry Data Security Standard',
        category: 'compliance',
        requirements: ['Secure payment processing', 'Data encryption', 'Access controls'],
        documentation: ['Security policies', 'Incident response plan', 'Audit reports'],
        auditFrequency: 'Annual'
      }
    ],
    integrations: [
      {
        id: 'shopify',
        name: 'Shopify',
        category: 'essential',
        description: 'E-commerce platform for online stores',
        useCase: 'Online store management, payment processing, inventory',
        estimatedROI: 'High - Core e-commerce platform'
      },
      {
        id: 'stripe',
        name: 'Stripe',
        category: 'essential',
        description: 'Payment processing and financial services',
        useCase: 'Payment processing, subscription billing, fraud prevention',
        estimatedROI: 'High - Essential for payments'
      }
    ],
    businessModels: [
      {
        id: 'b2c-ecommerce',
        name: 'B2C E-commerce',
        description: 'Direct-to-consumer online retail',
        revenueStreams: ['Online sales', 'Subscription services', 'Marketplace fees'],
        keyMetrics: ['Conversion rate', 'AOV', 'Customer acquisition cost', 'LTV'],
        challenges: ['Customer acquisition', 'Competition', 'Logistics'],
        opportunities: ['Global reach', 'Data insights', 'Personalization']
      }
    ]
  },
  {
    id: 'manufacturing',
    name: 'Manufacturing',
    description: 'Production, logistics, and supply chain companies',
    icon: Factory,
    businessUnits: [
      {
        id: 'production',
        name: 'Production Operations',
        description: 'Manufacturing processes, quality control, and efficiency',
        priority: 'core',
        kpis: ['production_efficiency', 'quality_rate', 'downtime_percentage', 'cycle_time'],
        processes: ['production_planning', 'quality_control', 'maintenance', 'continuous_improvement'],
        roles: [
          {
            id: 'production-manager',
            title: 'Production Manager',
            responsibilities: ['Production planning', 'Quality control', 'Team management'],
            requiredSkills: ['Manufacturing processes', 'Quality management', 'Leadership'],
            careerPath: ['Production Supervisor', 'Production Manager', 'Operations Director']
          }
        ]
      },
      {
        id: 'supply-chain',
        name: 'Supply Chain Management',
        description: 'Procurement, logistics, and inventory management',
        priority: 'core',
        kpis: ['inventory_turnover', 'supplier_performance', 'logistics_cost', 'on_time_delivery'],
        processes: ['procurement', 'inventory_management', 'logistics', 'supplier_management'],
        roles: [
          {
            id: 'supply-chain-manager',
            title: 'Supply Chain Manager',
            responsibilities: ['Supplier management', 'Inventory optimization', 'Logistics coordination'],
            requiredSkills: ['Supply chain management', 'Negotiation', 'Analytics'],
            careerPath: ['Supply Chain Analyst', 'Supply Chain Manager', 'Supply Chain Director']
          }
        ]
      }
    ],
    kpis: [
      {
        id: 'production_efficiency',
        name: 'Production Efficiency',
        description: 'Actual output vs. planned output',
        category: 'operational',
        unit: '%',
        excellent: 95,
        good: 90,
        fair: 85,
        poor: 80
      },
      {
        id: 'quality_rate',
        name: 'First Pass Yield',
        description: 'Percentage of products passing quality inspection on first attempt',
        category: 'operational',
        unit: '%',
        excellent: 99,
        good: 97,
        fair: 95,
        poor: 90
      }
    ],
    processes: [
      {
        id: 'quality_control',
        name: 'Quality Control Process',
        description: 'Product quality inspection and testing',
        category: 'core',
        steps: [
          {
            id: 'inspection',
            name: 'Quality Inspection',
            description: 'Inspect products against quality standards',
            role: 'Quality Inspector',
            estimatedTime: '5 minutes per unit',
            automationLevel: 'semi-automated',
            tools: ['Quality Management System', 'Testing Equipment', 'Documentation']
          }
        ],
        automationPotential: 'high',
        estimatedTime: 'Varies by product',
        requiredRoles: ['Quality Inspector', 'Quality Engineer', 'Production Manager']
      }
    ],
    standards: [
      {
        id: 'iso_9001',
        name: 'ISO 9001 Quality Management',
        description: 'Quality management system standard',
        category: 'quality',
        requirements: ['Quality policy', 'Process documentation', 'Continuous improvement'],
        documentation: ['Quality manual', 'Procedures', 'Records'],
        auditFrequency: 'Annual'
      }
    ],
    integrations: [
      {
        id: 'erp',
        name: 'Enterprise Resource Planning (ERP)',
        category: 'essential',
        description: 'Integrated business management software',
        useCase: 'Production planning, inventory management, financials',
        estimatedROI: 'High - Core business system'
      },
      {
        id: 'mes',
        name: 'Manufacturing Execution System (MES)',
        category: 'recommended',
        description: 'Production tracking and control system',
        useCase: 'Real-time production monitoring, quality control',
        estimatedROI: 'Medium - Improves efficiency'
      }
    ],
    businessModels: [
      {
        id: 'b2b-manufacturing',
        name: 'B2B Manufacturing',
        description: 'Business-to-business manufacturing and supply',
        revenueStreams: ['Product sales', 'Contract manufacturing', 'Service contracts'],
        keyMetrics: ['Production efficiency', 'Quality rate', 'On-time delivery', 'Customer satisfaction'],
        challenges: ['Supply chain disruptions', 'Quality control', 'Cost management'],
        opportunities: ['Automation', 'Global expansion', 'Custom solutions']
      }
    ]
  }
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get industry configuration by ID
 */
export function getIndustryConfig(industryId: string): IndustryConfig | undefined {
  return industryConfigs.find(config => config.id === industryId);
}

/**
 * Get all business units for an industry
 */
export function getIndustryBusinessUnits(industryId: string): BusinessUnit[] {
  const config = getIndustryConfig(industryId);
  return config?.businessUnits || [];
}

/**
 * Get all KPIs for an industry
 */
export function getIndustryKPIs(industryId: string): IndustryKPI[] {
  const config = getIndustryConfig(industryId);
  return config?.kpis || [];
}

/**
 * Get all processes for an industry
 */
export function getIndustryProcesses(industryId: string): IndustryProcess[] {
  const config = getIndustryConfig(industryId);
  return config?.processes || [];
}

/**
 * Get all standards for an industry
 */
export function getIndustryStandards(industryId: string): IndustryStandard[] {
  const config = getIndustryConfig(industryId);
  return config?.standards || [];
}

/**
 * Get all integrations for an industry
 */
export function getIndustryIntegrations(industryId: string): IndustryIntegration[] {
  const config = getIndustryConfig(industryId);
  return config?.integrations || [];
}

/**
 * Get all business models for an industry
 */
export function getIndustryBusinessModels(industryId: string): BusinessModel[] {
  const config = getIndustryConfig(industryId);
  return config?.businessModels || [];
}

/**
 * Get recommended integrations for an industry
 */
export function getRecommendedIntegrations(industryId: string): IndustryIntegration[] {
  const integrations = getIndustryIntegrations(industryId);
  return integrations.filter(integration => 
    integration.category === 'essential' || integration.category === 'recommended'
  );
}

/**
 * Get industry-specific KPIs by category
 */
export function getIndustryKPIsByCategory(industryId: string, category: string): IndustryKPI[] {
  const kpis = getIndustryKPIs(industryId);
  return kpis.filter(kpi => kpi.category === category);
}

/**
 * Get processes by automation potential
 */
export function getProcessesByAutomationPotential(industryId: string, potential: string): IndustryProcess[] {
  const processes = getIndustryProcesses(industryId);
  return processes.filter(process => process.automationPotential === potential);
}

/**
 * Get all available industries
 */
export function getAllIndustries(): Array<{ id: string; name: string; description: string }> {
  return industryConfigs.map(config => ({
    id: config.id,
    name: config.name,
    description: config.description
  }));
}

export default industryConfigs;
