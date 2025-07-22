/**
 * Core Data Principles for Nexus
 * 
 * PRINCIPLE: Enrich and analyze but don't store client data
 * 
 * This applies to ALL domains and features across the application.
 */

export interface DataPrinciple {
  principle: string;
  description: string;
  implementation: string;
  examples: string[];
}

export interface ComplianceRequirement {
  requirement: string;
  description: string;
  implementation: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export const DATA_PRINCIPLES: DataPrinciple[] = [
  {
    principle: "Zero Client Data Storage",
    description: "Never store sensitive client data locally. Only store metadata, analysis results, and configuration.",
    implementation: "Use real-time APIs, process data in-memory, store only OAuth tokens and analysis results.",
    examples: [
      "Email content stays on Microsoft/Gmail servers",
      "CRM data remains in HubSpot/Salesforce",
      "Financial data stays in accounting systems",
      "Documents remain in cloud storage"
    ]
  },
  {
    principle: "Real-Time Enrichment",
    description: "Analyze and enrich data in real-time without storing the original content.",
    implementation: "Process data as it's accessed, compute insights on-the-fly, cache only analysis results.",
    examples: [
      "Email risk scoring computed during fetch",
      "CRM deal analysis performed in real-time",
      "Financial metrics calculated from live data",
      "Document compliance checked during access"
    ]
  },
  {
    principle: "Metadata-Only Storage",
    description: "Store only metadata, configuration, and analysis results, never raw client data.",
    implementation: "Store IDs, timestamps, analysis scores, and configuration, not actual content.",
    examples: [
      "Email IDs and risk scores, not email content",
      "Deal IDs and analysis results, not deal details",
      "Document metadata and compliance flags, not documents",
      "Integration status and tokens, not data"
    ]
  },
  {
    principle: "Compliance-First Design",
    description: "Design all features with compliance and privacy as primary considerations.",
    implementation: "Implement data classification, retention policies, and audit trails for all data.",
    examples: [
      "Automatic data classification for all content",
      "Retention guidance for all stored metadata",
      "Audit logs for all data access",
      "Privacy controls for all features"
    ]
  },
  {
    principle: "Provider-Agnostic Architecture",
    description: "Work with any data source without storing its content locally.",
    implementation: "Use standardized interfaces, OAuth for authentication, and real-time APIs.",
    examples: [
      "Microsoft 365, Gmail, Yahoo Mail support",
      "HubSpot, Salesforce, Pipedrive CRM support",
      "QuickBooks, Xero, FreshBooks accounting support",
      "Dropbox, Google Drive, OneDrive document support"
    ]
  }
];

export const COMPLIANCE_REQUIREMENTS: ComplianceRequirement[] = [
  {
    requirement: "GDPR Compliance",
    description: "No personal data storage, right to be forgotten, data portability",
    implementation: "Store only metadata, provide data export, implement deletion workflows",
    riskLevel: "high"
  },
  {
    requirement: "SOC 2 Type II",
    description: "Security, availability, processing integrity, confidentiality, privacy",
    implementation: "Encrypt all stored data, implement access controls, audit all operations",
    riskLevel: "high"
  },
  {
    requirement: "HIPAA Compliance",
    description: "Protected health information handling",
    implementation: "No PHI storage, secure transmission, access logging",
    riskLevel: "high"
  },
  {
    requirement: "SOX Compliance",
    description: "Financial reporting and controls",
    implementation: "Audit trails, data integrity, retention policies",
    riskLevel: "medium"
  },
  {
    requirement: "Industry Standards",
    description: "ISO 27001, PCI DSS, FedRAMP",
    implementation: "Security controls, encryption, access management",
    riskLevel: "medium"
  }
];

/**
 * Data Classification System
 */
export enum DataClassification {
  PUBLIC = 'public',
  INTERNAL = 'internal',
  CONFIDENTIAL = 'confidential',
  RESTRICTED = 'restricted'
}

export interface DataClassificationPolicy {
  classification: DataClassification;
  description: string;
  retentionPeriod: string;
  accessControls: string[];
  encryptionRequired: boolean;
}

export const DATA_CLASSIFICATION_POLICIES: Record<DataClassification, DataClassificationPolicy> = {
  [DataClassification.PUBLIC]: {
    classification: DataClassification.PUBLIC,
    description: "Public business information",
    retentionPeriod: "1 year",
    accessControls: ["Basic authentication"],
    encryptionRequired: false
  },
  [DataClassification.INTERNAL]: {
    classification: DataClassification.INTERNAL,
    description: "Internal business communications",
    retentionPeriod: "2 years",
    accessControls: ["Role-based access"],
    encryptionRequired: true
  },
  [DataClassification.CONFIDENTIAL]: {
    classification: DataClassification.CONFIDENTIAL,
    description: "Sensitive business information",
    retentionPeriod: "5 years",
    accessControls: ["Multi-factor authentication", "Audit logging"],
    encryptionRequired: true
  },
  [DataClassification.RESTRICTED]: {
    classification: DataClassification.RESTRICTED,
    description: "Highly sensitive information",
    retentionPeriod: "7 years",
    accessControls: ["Multi-factor authentication", "Audit logging", "Justification required"],
    encryptionRequired: true
  }
};

/**
 * Data Processing Guidelines
 */
export interface DataProcessingGuideline {
  domain: string;
  dataType: string;
  processingMethod: string;
  storagePolicy: string;
  complianceNotes: string[];
}

export const DATA_PROCESSING_GUIDELINES: DataProcessingGuideline[] = [
  {
    domain: "Email & Communication",
    dataType: "Email content, attachments, metadata",
    processingMethod: "Real-time API access, in-memory analysis",
    storagePolicy: "Store only email IDs, analysis results, and OAuth tokens",
    complianceNotes: [
      "No email content stored locally",
      "Risk analysis performed in real-time",
      "Compliance flags stored as metadata",
      "Retention policies applied to metadata only"
    ]
  },
  {
    domain: "CRM & Sales",
    dataType: "Deals, contacts, companies, activities",
    processingMethod: "Real-time API integration, live analysis",
    storagePolicy: "Store only deal IDs, analysis scores, and integration status",
    complianceNotes: [
      "No CRM data stored locally",
      "Deal analysis performed on-demand",
      "Pipeline metrics computed in real-time",
      "Integration tokens stored securely"
    ]
  },
  {
    domain: "Financial & Accounting",
    dataType: "Transactions, invoices, financial reports",
    processingMethod: "Real-time API access, live calculations",
    storagePolicy: "Store only transaction IDs, calculated metrics, and connection status",
    complianceNotes: [
      "No financial data stored locally",
      "Calculations performed in real-time",
      "Compliance checks done on-the-fly",
      "Audit trails for all access"
    ]
  },
  {
    domain: "Documents & Files",
    dataType: "Documents, spreadsheets, presentations",
    processingMethod: "Cloud storage integration, metadata analysis",
    storagePolicy: "Store only file metadata, analysis results, and access logs",
    complianceNotes: [
      "No documents stored locally",
      "Content analysis performed in cloud",
      "Compliance scanning done remotely",
      "Access controlled by cloud provider"
    ]
  },
  {
    domain: "Analytics & Reporting",
    dataType: "Metrics, dashboards, reports",
    processingMethod: "Real-time aggregation, live computation",
    storagePolicy: "Store only calculated metrics, not raw data",
    complianceNotes: [
      "No raw data stored locally",
      "Metrics computed in real-time",
      "Reports generated on-demand",
      "Caching of computed results only"
    ]
  }
];

/**
 * Implementation Checklist
 */
export interface ImplementationChecklist {
  component: string;
  requirements: string[];
  complianceChecks: string[];
  testingCriteria: string[];
}

export const IMPLEMENTATION_CHECKLIST: ImplementationChecklist[] = [
  {
    component: "Email Integration",
    requirements: [
      "Use OAuth for authentication",
      "Access emails via API only",
      "Perform analysis in real-time",
      "Store only metadata and analysis results"
    ],
    complianceChecks: [
      "No email content in database",
      "OAuth tokens encrypted",
      "Analysis results classified",
      "Audit trail implemented"
    ],
    testingCriteria: [
      "Verify no email content stored",
      "Test real-time analysis",
      "Validate compliance flags",
      "Check audit logging"
    ]
  },
  {
    component: "CRM Integration",
    requirements: [
      "Connect via API only",
      "Process data in real-time",
      "Store only analysis results",
      "Maintain integration status"
    ],
    complianceChecks: [
      "No CRM data in database",
      "API credentials secure",
      "Analysis results classified",
      "Access controls implemented"
    ],
    testingCriteria: [
      "Verify no CRM data stored",
      "Test real-time processing",
      "Validate analysis accuracy",
      "Check security controls"
    ]
  },
  {
    component: "Financial Integration",
    requirements: [
      "Connect to accounting systems",
      "Calculate metrics in real-time",
      "Store only computed results",
      "Maintain audit trail"
    ],
    complianceChecks: [
      "No financial data in database",
      "Calculations accurate",
      "Audit trail complete",
      "Access controls strict"
    ],
    testingCriteria: [
      "Verify no financial data stored",
      "Test calculation accuracy",
      "Validate audit trail",
      "Check compliance controls"
    ]
  },
  {
    component: "Document Management",
    requirements: [
      "Integrate with cloud storage",
      "Analyze metadata only",
      "Store only analysis results",
      "Maintain access logs"
    ],
    complianceChecks: [
      "No documents in database",
      "Metadata analysis accurate",
      "Access logs complete",
      "Security controls active"
    ],
    testingCriteria: [
      "Verify no documents stored",
      "Test metadata analysis",
      "Validate access logging",
      "Check security measures"
    ]
  }
];

/**
 * Utility Functions
 */
export class DataPrincipleUtils {
  /**
   * Check if data should be stored based on classification
   */
  static shouldStoreData(classification: DataClassification): boolean {
    return classification === DataClassification.PUBLIC || classification === DataClassification.INTERNAL;
  }

  /**
   * Get retention period for data classification
   */
  static getRetentionPeriod(classification: DataClassification): string {
    return DATA_CLASSIFICATION_POLICIES[classification].retentionPeriod;
  }

  /**
   * Validate compliance for data processing
   */
  static validateCompliance(domain: string, dataType: string): boolean {
    const guideline = DATA_PROCESSING_GUIDELINES.find(g => g.domain === domain);
    return guideline !== undefined;
  }

  /**
   * Get compliance requirements for a domain
   */
  static getComplianceRequirements(domain: string): ComplianceRequirement[] {
    // Return relevant compliance requirements based on domain
    return COMPLIANCE_REQUIREMENTS.filter(req => 
      req.requirement.includes('GDPR') || req.requirement.includes('SOC')
    );
  }
} 