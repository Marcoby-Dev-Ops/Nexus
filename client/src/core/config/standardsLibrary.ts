/**
 * Standards and Processes Library
 * Defines industry best practices, compliance frameworks, and standardized workflows
 * 
 * Pillar: 1 (Efficient Automation) - Standardized business practices
 */

import { 
  Shield, CheckCircle, AlertTriangle, FileText, 
  Users, Settings, TrendingUp, DollarSign 
} from 'lucide-react';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface Standard {
  id: string;
  name: string;
  description: string;
  category: 'compliance' | 'quality' | 'security' | 'best-practice' | 'industry';
  type: 'framework' | 'regulation' | 'guideline' | 'certification';
  version: string;
  lastUpdated: string;
  authority: string;
  scope: string[];
  requirements: StandardRequirement[];
  documentation: StandardDocumentation[];
  auditFrequency: string;
  applicableIndustries: string[];
  applicableBusinessModels: string[];
  implementationGuide: ImplementationGuide;
  complianceLevel: 'mandatory' | 'recommended' | 'optional';
  estimatedCost: string;
  estimatedTime: string;
}

export interface StandardRequirement {
  id: string;
  name: string;
  description: string;
  category: 'technical' | 'process' | 'documentation' | 'training';
  priority: 'critical' | 'high' | 'medium' | 'low';
  complexity: 'low' | 'medium' | 'high';
  estimatedEffort: string;
  dependencies: string[];
  tools: string[];
  risks: string[];
  mitigations: string[];
}

export interface StandardDocumentation {
  id: string;
  name: string;
  type: 'policy' | 'procedure' | 'template' | 'checklist' | 'form';
  description: string;
  required: boolean;
  template: string;
  reviewFrequency: string;
  owner: string;
}

export interface ImplementationGuide {
  phases: ImplementationPhase[];
  prerequisites: string[];
  estimatedTimeline: string;
  resources: string[];
  milestones: ImplementationMilestone[];
  successCriteria: string[];
}

export interface ImplementationPhase {
  id: string;
  name: string;
  description: string;
  duration: string;
  activities: ImplementationActivity[];
  deliverables: string[];
  dependencies: string[];
}

export interface ImplementationActivity {
  id: string;
  name: string;
  description: string;
  role: string;
  estimatedTime: string;
  tools: string[];
  outputs: string[];
}

export interface ImplementationMilestone {
  id: string;
  name: string;
  description: string;
  targetDate: string;
  criteria: string[];
  status: 'pending' | 'in-progress' | 'completed' | 'delayed';
}

export interface Process {
  id: string;
  name: string;
  description: string;
  category: 'core' | 'support' | 'compliance' | 'growth';
  industry: string[];
  businessModel: string[];
  version: string;
  lastUpdated: string;
  owner: string;
  steps: ProcessStep[];
  inputs: string[];
  outputs: string[];
  tools: string[];
  roles: string[];
  risks: string[];
  mitigations: string[];
  automationPotential: 'low' | 'medium' | 'high';
  estimatedTime: string;
  frequency: 'continuous' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';
  compliance: string[];
  quality: QualityMetrics;
}

export interface ProcessStep {
  id: string;
  name: string;
  description: string;
  role: string;
  estimatedTime: string;
  automationLevel: 'manual' | 'semi-automated' | 'fully-automated';
  tools: string[];
  inputs: string[];
  outputs: string[];
  dependencies: string[];
  qualityChecks: string[];
  documentation: string[];
}

export interface QualityMetrics {
  accuracy: number;
  efficiency: number;
  consistency: number;
  timeliness: number;
  customerSatisfaction: number;
}

// ============================================================================
// STANDARDS LIBRARY
// ============================================================================

export const standardsLibrary: Standard[] = [
  {
    id: 'iso_27001',
    name: 'ISO 27001 Information Security Management',
    description: 'International standard for information security management systems',
    category: 'security',
    type: 'framework',
    version: '2013',
    lastUpdated: '2023-01-01',
    authority: 'International Organization for Standardization',
    scope: ['Information Security', 'Data Protection', 'Risk Management'],
    requirements: [
      {
        id: 'security_policy',
        name: 'Information Security Policy',
        description: 'Establish and maintain information security policy',
        category: 'documentation',
        priority: 'critical',
        complexity: 'medium',
        estimatedEffort: '2-4 weeks',
        dependencies: [],
        tools: ['Document Management System', 'Policy Template'],
        risks: ['Incomplete policy', 'Non-compliance', 'Security gaps'],
        mitigations: ['Expert review', 'Stakeholder input', 'Regular updates']
      },
      {
        id: 'risk_assessment',
        name: 'Risk Assessment Process',
        description: 'Systematic identification and assessment of security risks',
        category: 'process',
        priority: 'critical',
        complexity: 'high',
        estimatedEffort: '4-8 weeks',
        dependencies: ['security_policy'],
        tools: ['Risk Assessment Tool', 'Asset Inventory', 'Threat Database'],
        risks: ['Incomplete assessment', 'Missing risks', 'Inadequate controls'],
        mitigations: ['Expert consultation', 'Comprehensive review', 'Regular updates']
      }
    ],
    documentation: [
      {
        id: 'security_policy_doc',
        name: 'Information Security Policy',
        type: 'policy',
        description: 'Comprehensive information security policy document',
        required: true,
        template: 'ISO_27001_Security_Policy_Template.md',
        reviewFrequency: 'Annual',
        owner: 'CISO'
      },
      {
        id: 'risk_assessment_procedure',
        name: 'Risk Assessment Procedure',
        type: 'procedure',
        description: 'Step-by-step risk assessment process',
        required: true,
        template: 'ISO_27001_Risk_Assessment_Procedure.md',
        reviewFrequency: 'Annual',
        owner: 'Risk Manager'
      }
    ],
    implementationGuide: {
      phases: [
        {
          id: 'phase_1',
          name: 'Gap Analysis and Planning',
          description: 'Assess current state and plan implementation',
          duration: '4-6 weeks',
          activities: [
            {
              id: 'gap_analysis',
              name: 'Conduct Gap Analysis',
              description: 'Compare current practices against ISO 27001 requirements',
              role: 'Security Consultant',
              estimatedTime: '2 weeks',
              tools: ['Assessment Tool', 'Documentation Review'],
              outputs: ['Gap Analysis Report', 'Implementation Plan']
            }
          ],
          deliverables: ['Gap Analysis Report', 'Implementation Plan', 'Resource Allocation'],
          dependencies: []
        },
        {
          id: 'phase_2',
          name: 'Documentation Development',
          description: 'Create required policies, procedures, and documentation',
          duration: '8-12 weeks',
          activities: [
            {
              id: 'policy_development',
              name: 'Develop Security Policies',
              description: 'Create comprehensive security policies and procedures',
              role: 'Security Manager',
              estimatedTime: '4 weeks',
              tools: ['Policy Templates', 'Document Management'],
              outputs: ['Security Policies', 'Procedures', 'Guidelines']
            }
          ],
          deliverables: ['Security Policies', 'Procedures', 'Guidelines', 'Forms'],
          dependencies: ['phase_1']
        }
      ],
      prerequisites: ['Management commitment', 'Resource allocation', 'Expert consultation'],
      estimatedTimeline: '6-12 months',
      resources: ['Security consultant', 'Documentation specialist', 'Training materials'],
      milestones: [
        {
          id: 'milestone_1',
          name: 'Gap Analysis Complete',
          description: 'Current state assessment completed',
          targetDate: '2024-03-01',
          criteria: ['Gap analysis report approved', 'Implementation plan finalized'],
          status: 'pending'
        }
      ],
      successCriteria: ['All requirements implemented', 'Documentation complete', 'Staff trained', 'Audit passed']
    },
    complianceLevel: 'recommended',
    estimatedCost: '$50,000-200,000',
    estimatedTime: '6-12 months',
    applicableIndustries: ['technology', 'healthcare', 'financial-services'],
    applicableBusinessModels: ['B2B', 'SaaS', 'Consulting']
  },
  {
    id: 'gdpr',
    name: 'General Data Protection Regulation (GDPR)',
    description: 'EU regulation for data protection and privacy',
    category: 'compliance',
    type: 'regulation',
    version: '2018',
    lastUpdated: '2018-05-25',
    authority: 'European Union',
    scope: ['Data Protection', 'Privacy', 'Consumer Rights'],
    requirements: [
      {
        id: 'data_mapping',
        name: 'Data Mapping and Inventory',
        description: 'Document all personal data processing activities',
        category: 'process',
        priority: 'critical',
        complexity: 'high',
        estimatedEffort: '4-8 weeks',
        dependencies: [],
        tools: ['Data Mapping Tool', 'Inventory System'],
        risks: ['Incomplete mapping', 'Missing data flows', 'Non-compliance'],
        mitigations: ['Comprehensive review', 'Expert consultation', 'Regular updates']
      },
      {
        id: 'consent_management',
        name: 'Consent Management',
        description: 'Implement proper consent collection and management',
        category: 'technical',
        priority: 'critical',
        complexity: 'medium',
        estimatedEffort: '2-4 weeks',
        dependencies: ['data_mapping'],
        tools: ['Consent Management Platform', 'Website Analytics'],
        risks: ['Invalid consent', 'Poor user experience', 'Legal issues'],
        mitigations: ['Legal review', 'User testing', 'Regular audits']
      }
    ],
    documentation: [
      {
        id: 'privacy_policy',
        name: 'Privacy Policy',
        type: 'policy',
        description: 'Comprehensive privacy policy compliant with GDPR',
        required: true,
        template: 'GDPR_Privacy_Policy_Template.md',
        reviewFrequency: 'Annual',
        owner: 'Legal Counsel'
      },
      {
        id: 'data_processing_register',
        name: 'Data Processing Register',
        type: 'template',
        description: 'Register of data processing activities',
        required: true,
        template: 'GDPR_Data_Processing_Register.xlsx',
        reviewFrequency: 'Quarterly',
        owner: 'Data Protection Officer'
      }
    ],
    implementationGuide: {
      phases: [
        {
          id: 'phase_1',
          name: 'Data Audit and Mapping',
          description: 'Identify and map all personal data processing',
          duration: '4-6 weeks',
          activities: [
            {
              id: 'data_audit',
              name: 'Conduct Data Audit',
              description: 'Identify all personal data processing activities',
              role: 'Data Protection Officer',
              estimatedTime: '3 weeks',
              tools: ['Audit Checklist', 'Data Mapping Tool'],
              outputs: ['Data Audit Report', 'Processing Register']
            }
          ],
          deliverables: ['Data Audit Report', 'Processing Register', 'Gap Analysis'],
          dependencies: []
        }
      ],
      prerequisites: ['Legal expertise', 'Data expertise', 'Management commitment'],
      estimatedTimeline: '3-6 months',
      resources: ['Legal counsel', 'Data protection officer', 'IT team'],
      milestones: [
        {
          id: 'milestone_1',
          name: 'Data Audit Complete',
          description: 'All personal data processing identified and documented',
          targetDate: '2024-02-15',
          criteria: ['Data audit report approved', 'Processing register complete'],
          status: 'pending'
        }
      ],
      successCriteria: ['Compliant privacy policy', 'Consent mechanisms implemented', 'Data subject rights enabled', 'Breach notification procedures in place']
    },
    complianceLevel: 'mandatory',
    estimatedCost: '$25,000-100,000',
    estimatedTime: '3-6 months',
    applicableIndustries: ['technology', 'healthcare', 'financial-services', 'retail-ecommerce'],
    applicableBusinessModels: ['B2B', 'B2C', 'SaaS', 'E-commerce']
  },
  {
    id: 'pci_dss',
    name: 'Payment Card Industry Data Security Standard (PCI DSS)',
    description: 'Security standard for organizations handling payment card data',
    category: 'security',
    type: 'framework',
    version: '4.0',
    lastUpdated: '2022-03-31',
    authority: 'Payment Card Industry Security Standards Council',
    scope: ['Payment Security', 'Cardholder Data Protection', 'Network Security'],
    requirements: [
      {
        id: 'network_security',
        name: 'Network Security Controls',
        description: 'Implement network security controls and monitoring',
        category: 'technical',
        priority: 'critical',
        complexity: 'high',
        estimatedEffort: '6-12 weeks',
        dependencies: [],
        tools: ['Firewall', 'IDS/IPS', 'Network Monitoring'],
        risks: ['Security breaches', 'Data compromise', 'Compliance failure'],
        mitigations: ['Expert implementation', 'Regular testing', 'Continuous monitoring']
      },
      {
        id: 'data_encryption',
        name: 'Data Encryption',
        description: 'Encrypt cardholder data in transit and at rest',
        category: 'technical',
        priority: 'critical',
        complexity: 'medium',
        estimatedEffort: '2-4 weeks',
        dependencies: ['network_security'],
        tools: ['Encryption Software', 'SSL/TLS', 'Key Management'],
        risks: ['Data exposure', 'Key compromise', 'Performance impact'],
        mitigations: ['Strong encryption', 'Key rotation', 'Performance testing']
      }
    ],
    documentation: [
      {
        id: 'security_policy',
        name: 'Payment Security Policy',
        type: 'policy',
        description: 'Comprehensive payment security policy',
        required: true,
        template: 'PCI_DSS_Security_Policy_Template.md',
        reviewFrequency: 'Annual',
        owner: 'Security Manager'
      },
      {
        id: 'incident_response_plan',
        name: 'Incident Response Plan',
        type: 'procedure',
        description: 'Plan for responding to security incidents',
        required: true,
        template: 'PCI_DSS_Incident_Response_Plan.md',
        reviewFrequency: 'Annual',
        owner: 'Security Manager'
      }
    ],
    implementationGuide: {
      phases: [
        {
          id: 'phase_1',
          name: 'Scope Definition and Assessment',
          description: 'Define PCI scope and assess current state',
          duration: '2-4 weeks',
          activities: [
            {
              id: 'scope_definition',
              name: 'Define PCI Scope',
              description: 'Identify all systems and processes handling card data',
              role: 'Security Manager',
              estimatedTime: '1 week',
              tools: ['Network Diagrams', 'Data Flow Analysis'],
              outputs: ['PCI Scope Document', 'Gap Analysis']
            }
          ],
          deliverables: ['PCI Scope Document', 'Gap Analysis', 'Implementation Plan'],
          dependencies: []
        }
      ],
      prerequisites: ['Network expertise', 'Security expertise', 'Payment processing knowledge'],
      estimatedTimeline: '6-12 months',
      resources: ['Security consultant', 'Network engineer', 'Compliance specialist'],
      milestones: [
        {
          id: 'milestone_1',
          name: 'Scope Defined',
          description: 'PCI scope clearly defined and documented',
          targetDate: '2024-02-01',
          criteria: ['Scope document approved', 'Gap analysis complete'],
          status: 'pending'
        }
      ],
      successCriteria: ['All requirements implemented', 'Security controls in place', 'Monitoring active', 'Compliance validated']
    },
    complianceLevel: 'mandatory',
    estimatedCost: '$100,000-500,000',
    estimatedTime: '6-12 months',
    applicableIndustries: ['retail-ecommerce', 'financial-services'],
    applicableBusinessModels: ['B2C', 'E-commerce', 'Marketplace']
  }
];

// ============================================================================
// PROCESSES LIBRARY
// ============================================================================

export const processesLibrary: Process[] = [
  {
    id: 'customer_onboarding',
    name: 'Customer Onboarding Process',
    description: 'Standardized process for onboarding new customers',
    category: 'core',
    industry: ['technology', 'financial-services', 'professional-services'],
    businessModel: ['B2B', 'SaaS', 'Consulting'],
    version: '1.0',
    lastUpdated: '2024-01-15',
    owner: 'Customer Success Manager',
    steps: [
      {
        id: 'welcome_communication',
        name: 'Welcome Communication',
        description: 'Send welcome email and initial communication',
        role: 'Customer Success Manager',
        estimatedTime: '30 minutes',
        automationLevel: 'fully-automated',
        tools: ['Email Marketing Platform', 'CRM'],
        inputs: ['Customer contact information', 'Product details'],
        outputs: ['Welcome email sent', 'Customer record created'],
        dependencies: [],
        qualityChecks: ['Email delivered', 'Customer record complete'],
        documentation: ['Welcome email template', 'Customer record template']
      },
      {
        id: 'account_setup',
        name: 'Account Setup',
        description: 'Set up customer account and initial configuration',
        role: 'Technical Support',
        estimatedTime: '2 hours',
        automationLevel: 'semi-automated',
        tools: ['Account Management System', 'Configuration Tools'],
        inputs: ['Customer requirements', 'Account details'],
        outputs: ['Account configured', 'Access credentials'],
        dependencies: ['welcome_communication'],
        qualityChecks: ['Account functional', 'Access working', 'Configuration correct'],
        documentation: ['Account setup checklist', 'Configuration guide']
      }
    ],
    inputs: ['Customer information', 'Product requirements', 'Contract details'],
    outputs: ['Onboarded customer', 'Account access', 'Training completed'],
    tools: ['CRM', 'Email Platform', 'Account Management', 'Training Platform'],
    roles: ['Customer Success Manager', 'Technical Support', 'Sales Representative'],
    risks: ['Poor customer experience', 'Delayed onboarding', 'Incomplete setup'],
    mitigations: ['Clear communication', 'Automated processes', 'Quality checks'],
    automationPotential: 'high',
    estimatedTime: '1-2 weeks',
    frequency: 'continuous',
    compliance: ['Data protection', 'Service level agreements'],
    quality: {
      accuracy: 95,
      efficiency: 90,
      consistency: 95,
      timeliness: 85,
      customerSatisfaction: 90
    }
  },
  {
    id: 'monthly_financial_close',
    name: 'Monthly Financial Close Process',
    description: 'Systematic monthly financial closing and reporting',
    category: 'core',
    industry: ['technology', 'healthcare', 'financial-services', 'manufacturing'],
    businessModel: ['B2B', 'B2C', 'SaaS', 'Consulting'],
    version: '1.0',
    lastUpdated: '2024-01-10',
    owner: 'Financial Controller',
    steps: [
      {
        id: 'revenue_recognition',
        name: 'Revenue Recognition',
        description: 'Recognize revenue according to accounting standards',
        role: 'Accountant',
        estimatedTime: '4 hours',
        automationLevel: 'semi-automated',
        tools: ['Accounting System', 'Revenue Recognition Software'],
        inputs: ['Sales data', 'Contract terms', 'Delivery confirmations'],
        outputs: ['Revenue journal entries', 'Revenue report'],
        dependencies: [],
        qualityChecks: ['Revenue accuracy', 'Compliance with standards', 'Documentation complete'],
        documentation: ['Revenue recognition policy', 'Journal entry templates']
      },
      {
        id: 'expense_reconciliation',
        name: 'Expense Reconciliation',
        description: 'Reconcile all expenses and accruals',
        role: 'Accountant',
        estimatedTime: '6 hours',
        automationLevel: 'semi-automated',
        tools: ['Accounting System', 'Bank Reconciliation', 'Expense Management'],
        inputs: ['Bank statements', 'Expense reports', 'Vendor invoices'],
        outputs: ['Reconciled accounts', 'Accrual entries', 'Reconciliation reports'],
        dependencies: ['revenue_recognition'],
        qualityChecks: ['Accounts reconciled', 'Accruals accurate', 'Variances explained'],
        documentation: ['Reconciliation procedures', 'Accrual calculation templates']
      }
    ],
    inputs: ['Financial transactions', 'Bank statements', 'Supporting documentation'],
    outputs: ['Financial statements', 'Management reports', 'Compliance documentation'],
    tools: ['Accounting System', 'Bank Reconciliation', 'Reporting Tools', 'Document Management'],
    roles: ['Accountant', 'Financial Controller', 'CFO'],
    risks: ['Inaccurate reporting', 'Missed deadlines', 'Compliance issues'],
    mitigations: ['Checklists', 'Automation', 'Review process', 'Quality controls'],
    automationPotential: 'high',
    estimatedTime: '3-5 days',
    frequency: 'monthly',
    compliance: ['GAAP', 'Tax regulations', 'Audit requirements'],
    quality: {
      accuracy: 99,
      efficiency: 85,
      consistency: 95,
      timeliness: 90,
      customerSatisfaction: 85
    }
  },
  {
    id: 'quality_assurance',
    name: 'Quality Assurance Process',
    description: 'Systematic quality control and assurance procedures',
    category: 'core',
    industry: ['manufacturing', 'healthcare', 'technology'],
    businessModel: ['B2B', 'Manufacturing', 'SaaS'],
    version: '1.0',
    lastUpdated: '2024-01-20',
    owner: 'Quality Manager',
    steps: [
      {
        id: 'quality_inspection',
        name: 'Quality Inspection',
        description: 'Inspect products/services against quality standards',
        role: 'Quality Inspector',
        estimatedTime: '1 hour per batch',
        automationLevel: 'semi-automated',
        tools: ['Quality Management System', 'Testing Equipment', 'Documentation'],
        inputs: ['Products/services', 'Quality standards', 'Inspection criteria'],
        outputs: ['Inspection results', 'Quality reports', 'Non-conformance reports'],
        dependencies: [],
        qualityChecks: ['Inspection accuracy', 'Standards compliance', 'Documentation complete'],
        documentation: ['Inspection procedures', 'Quality standards', 'Report templates']
      },
      {
        id: 'corrective_action',
        name: 'Corrective Action',
        description: 'Address quality issues and implement corrective actions',
        role: 'Quality Manager',
        estimatedTime: '4-8 hours',
        automationLevel: 'manual',
        tools: ['Quality Management System', 'Root Cause Analysis Tools'],
        inputs: ['Non-conformance reports', 'Quality data', 'Process information'],
        outputs: ['Corrective action plan', 'Implementation results', 'Prevention measures'],
        dependencies: ['quality_inspection'],
        qualityChecks: ['Root cause identified', 'Actions effective', 'Prevention implemented'],
        documentation: ['Corrective action procedures', 'Root cause analysis templates']
      }
    ],
    inputs: ['Products/services', 'Quality standards', 'Customer requirements'],
    outputs: ['Quality reports', 'Corrective actions', 'Process improvements'],
    tools: ['Quality Management System', 'Testing Equipment', 'Documentation', 'Analytics'],
    roles: ['Quality Inspector', 'Quality Manager', 'Process Owner'],
    risks: ['Quality failures', 'Customer complaints', 'Compliance issues'],
    mitigations: ['Regular inspections', 'Training', 'Process improvement', 'Customer feedback'],
    automationPotential: 'medium',
    estimatedTime: '1-2 days',
    frequency: 'continuous',
    compliance: ['ISO 9001', 'Industry standards', 'Customer requirements'],
    quality: {
      accuracy: 98,
      efficiency: 80,
      consistency: 95,
      timeliness: 85,
      customerSatisfaction: 95
    }
  }
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get standard by ID
 */
export function getStandard(standardId: string): Standard | undefined {
  return standardsLibrary.find(standard => standard.id === standardId);
}

/**
 * Get process by ID
 */
export function getProcess(processId: string): Process | undefined {
  return processesLibrary.find(process => process.id === processId);
}

/**
 * Get standards by category
 */
export function getStandardsByCategory(category: string): Standard[] {
  return standardsLibrary.filter(standard => standard.category === category);
}

/**
 * Get standards by industry
 */
export function getStandardsByIndustry(industry: string): Standard[] {
  return standardsLibrary.filter(standard => 
    standard.applicableIndustries.includes(industry)
  );
}

/**
 * Get standards by business model
 */
export function getStandardsByBusinessModel(businessModel: string): Standard[] {
  return standardsLibrary.filter(standard => 
    standard.applicableBusinessModels.includes(businessModel)
  );
}

/**
 * Get processes by industry
 */
export function getProcessesByIndustry(industry: string): Process[] {
  return processesLibrary.filter(process => 
    process.industry.includes(industry)
  );
}

/**
 * Get processes by business model
 */
export function getProcessesByBusinessModel(businessModel: string): Process[] {
  return processesLibrary.filter(process => 
    process.businessModel.includes(businessModel)
  );
}

/**
 * Get processes by category
 */
export function getProcessesByCategory(category: string): Process[] {
  return processesLibrary.filter(process => process.category === category);
}

/**
 * Get processes by automation potential
 */
export function getProcessesByAutomationPotential(potential: string): Process[] {
  return processesLibrary.filter(process => process.automationPotential === potential);
}

/**
 * Get mandatory standards
 */
export function getMandatoryStandards(): Standard[] {
  return standardsLibrary.filter(standard => standard.complianceLevel === 'mandatory');
}

/**
 * Get recommended standards
 */
export function getRecommendedStandards(): Standard[] {
  return standardsLibrary.filter(standard => standard.complianceLevel === 'recommended');
}

/**
 * Get all available standards
 */
export function getAllStandards(): Array<{ id: string; name: string; category: string; complianceLevel: string }> {
  return standardsLibrary.map(standard => ({
    id: standard.id,
    name: standard.name,
    category: standard.category,
    complianceLevel: standard.complianceLevel
  }));
}

/**
 * Get all available processes
 */
export function getAllProcesses(): Array<{ id: string; name: string; category: string; automationPotential: string }> {
  return processesLibrary.map(process => ({
    id: process.id,
    name: process.name,
    category: process.category,
    automationPotential: process.automationPotential
  }));
}

export default {
  standards: standardsLibrary,
  processes: processesLibrary
};
