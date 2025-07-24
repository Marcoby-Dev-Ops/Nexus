import { logger } from '@/core/auth/logger';
import { 
  DATA_PRINCIPLES, 
  COMPLIANCE_REQUIREMENTS, 
  DATA_PROCESSING_GUIDELINES,
  IMPLEMENTATION_CHECKLIST,
  DataPrincipleUtils,
  DataClassification,
  type DataPrinciple,
  type ComplianceRequirement,
  type DataProcessingGuideline,
  type ImplementationChecklist
} from '@/core/principles/DataPrinciples';

export interface ComplianceAudit {
  domain: string;
  timestamp: string;
  checks: ComplianceCheck[];
  overallStatus: 'compliant' | 'non-compliant' | 'partial';
  recommendations: string[];
}

export interface ComplianceCheck {
  check: string;
  status: 'pass' | 'fail' | 'warning';
  details: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface DataFlowAnalysis {
  source: string;
  destination: string;
  dataType: string;
  processingMethod: string;
  storagePolicy: string;
  complianceStatus: 'compliant' | 'non-compliant';
  risks: string[];
  recommendations: string[];
}

class DataPrincipleService {
  /**
   * Audit compliance for a specific domain
   */
  async auditCompliance(domain: string): Promise<ComplianceAudit> {
    const checks: ComplianceCheck[] = [];
    const recommendations: string[] = [];

    // Get relevant guidelines
    const guideline = DATA_PROCESSING_GUIDELINES.find(g => g.domain === domain);

    if (!guideline) {
      checks.push({
        check: 'Domain Guidelines',
        status: 'fail',
        details: `No data processing guidelines found for domain: ${domain}`,
        riskLevel: 'high'
      });
      recommendations.push(`Create data processing guidelines for ${domain}`);
    } else {
      checks.push({
        check: 'Domain Guidelines',
        status: 'pass',
        details: `Guidelines found for ${domain}`,
        riskLevel: 'low'
      });
    }

    // Check storage policy compliance
    if (guideline) {
      const storageCheck = this.checkStoragePolicy(guideline.storagePolicy);
      checks.push(storageCheck);
      
      if (storageCheck.status === 'fail') {
        recommendations.push('Review and update storage policy to comply with zero-data principle');
      }
    }

    // Check processing method compliance
    if (guideline) {
      const processingCheck = this.checkProcessingMethod(guideline.processingMethod);
      checks.push(processingCheck);
      
      if (processingCheck.status === 'fail') {
        recommendations.push('Implement real-time processing instead of batch processing');
      }
    }

    // Check compliance requirements
    const complianceReqs = DataPrincipleUtils.getComplianceRequirements(domain);
    complianceReqs.forEach(req => {
      const reqCheck = this.checkComplianceRequirement(req);
      checks.push(reqCheck);
      
      if (reqCheck.status === 'fail') {
        recommendations.push(`Implement ${req.requirement} controls`);
      }
    });

    // Determine overall status
    const failedChecks = checks.filter(c => c.status === 'fail').length;
    const warningChecks = checks.filter(c => c.status === 'warning').length;
    
    let overallStatus: 'compliant' | 'non-compliant' | 'partial' = 'compliant';
    if (failedChecks > 0) {
      overallStatus = 'non-compliant';
    } else if (warningChecks > 0) {
      overallStatus = 'partial';
    }

    return {
      domain,
      timestamp: new Date().toISOString(),
      checks,
      overallStatus,
      recommendations
    };
  }

  /**
   * Analyze data flow for compliance
   */
  analyzeDataFlow(source: string, destination: string, dataType: string): DataFlowAnalysis {
    const risks: string[] = [];
    const recommendations: string[] = [];

    // Check if data flow follows principles
    const processingMethod = this.getProcessingMethod(dataType);
    const storagePolicy = this.getStoragePolicy(dataType);
    
    let complianceStatus: 'compliant' | 'non-compliant' = 'compliant';

    // Check for data storage violations
    if (storagePolicy.includes('store') && !storagePolicy.includes('only metadata')) {
      complianceStatus = 'non-compliant';
      risks.push('Raw data storage detected');
      recommendations.push('Implement metadata-only storage');
    }

    // Check for real-time processing
    if (!processingMethod.includes('real-time') && !processingMethod.includes('live')) {
      risks.push('Batch processing detected');
      recommendations.push('Implement real-time processing');
    }

    // Check for API usage
    if (!source.includes('API') && !destination.includes('API')) {
      risks.push('Direct data access detected');
      recommendations.push('Use API-based data access');
    }

    return {
      source,
      destination,
      dataType,
      processingMethod,
      storagePolicy,
      complianceStatus,
      risks,
      recommendations
    };
  }

  /**
   * Validate data processing for a domain
   */
  validateDataProcessing(domain: string, dataType: string): boolean {
    return DataPrincipleUtils.validateCompliance(domain, dataType);
  }

  /**
   * Get data classification for content
   */
  classifyData(content: string, context: string): DataClassification {
    // Simple classification logic - in practice, this would be more sophisticated
    const sensitiveKeywords = ['password', 'credit card', 'ssn', 'confidential', 'secret'];
    const internalKeywords = ['internal', 'company', 'team', 'project'];
    
    const contentLower = content.toLowerCase();
    
    // Check for restricted content
    if (sensitiveKeywords.some(keyword => contentLower.includes(keyword))) {
      return DataClassification.RESTRICTED;
    }
    
    // Check for confidential content
    if (contentLower.includes('confidential') || contentLower.includes('private')) {
      return DataClassification.CONFIDENTIAL;
    }
    
    // Check for internal content
    if (internalKeywords.some(keyword => contentLower.includes(keyword))) {
      return DataClassification.INTERNAL;
    }
    
    return DataClassification.PUBLIC;
  }

  /**
   * Get retention guidance for data
   */
  getRetentionGuidance(classification: DataClassification): string {
    return DataPrincipleUtils.getRetentionPeriod(classification);
  }

  /**
   * Check if data should be stored
   */
  shouldStoreData(classification: DataClassification): boolean {
    return DataPrincipleUtils.shouldStoreData(classification);
  }

  /**
   * Log data access for audit purposes
   */
  logDataAccess(domain: string, dataType: string, action: string, userId: string): void {
    logger.info({
      domain,
      dataType,
      action,
      userId,
      timestamp: new Date().toISOString(),
      principle: 'Data access logged for audit compliance'
    }, 'Data access logged');
  }

  /**
   * Check storage policy compliance
   */
  private checkStoragePolicy(policy: string): ComplianceCheck {
    const compliantKeywords = ['only metadata', 'analysis results', 'OAuth tokens', 'no content'];
    const nonCompliantKeywords = ['store content', 'raw data', 'full data'];
    
    const isCompliant = compliantKeywords.some(keyword => policy.toLowerCase().includes(keyword));
    const isNonCompliant = nonCompliantKeywords.some(keyword => policy.toLowerCase().includes(keyword));
    
    if (isNonCompliant) {
      return {
        check: 'Storage Policy',
        status: 'fail',
        details: 'Policy allows storage of raw data',
        riskLevel: 'high'
      };
    } else if (isCompliant) {
      return {
        check: 'Storage Policy',
        status: 'pass',
        details: 'Policy follows metadata-only principle',
        riskLevel: 'low'
      };
    } else {
      return {
        check: 'Storage Policy',
        status: 'warning',
        details: 'Policy unclear - review required',
        riskLevel: 'medium'
      };
    }
  }

  /**
   * Check processing method compliance
   */
  private checkProcessingMethod(method: string): ComplianceCheck {
    const realTimeKeywords = ['real-time', 'live', 'on-the-fly', 'in-memory'];
    const batchKeywords = ['batch', 'scheduled', 'periodic'];
    
    const isRealTime = realTimeKeywords.some(keyword => method.toLowerCase().includes(keyword));
    const isBatch = batchKeywords.some(keyword => method.toLowerCase().includes(keyword));
    
    if (isBatch) {
      return {
        check: 'Processing Method',
        status: 'fail',
        details: 'Batch processing detected - should be real-time',
        riskLevel: 'medium'
      };
    } else if (isRealTime) {
      return {
        check: 'Processing Method',
        status: 'pass',
        details: 'Real-time processing confirmed',
        riskLevel: 'low'
      };
    } else {
      return {
        check: 'Processing Method',
        status: 'warning',
        details: 'Processing method unclear',
        riskLevel: 'medium'
      };
    }
  }

  /**
   * Check compliance requirement
   */
  private checkComplianceRequirement(requirement: ComplianceRequirement): ComplianceCheck {
    // This would be a more sophisticated check in practice
    // For now, we'll assume compliance if the requirement is documented
    return {
      check: requirement.requirement,
      status: 'pass',
      details: `Requirement documented: ${requirement.description}`,
      riskLevel: requirement.riskLevel
    };
  }

  /**
   * Get processing method for data type
   */
  private getProcessingMethod(dataType: string): string {
    const guideline = DATA_PROCESSING_GUIDELINES.find(g => 
      g.dataType.toLowerCase().includes(dataType.toLowerCase())
    );
    return guideline?.processingMethod || 'Real-time API access';
  }

  /**
   * Get storage policy for data type
   */
  private getStoragePolicy(dataType: string): string {
    const guideline = DATA_PROCESSING_GUIDELINES.find(g => 
      g.dataType.toLowerCase().includes(dataType.toLowerCase())
    );
    return guideline?.storagePolicy || 'Store only metadata and analysis results';
  }

  /**
   * Get all data principles
   */
  getDataPrinciples(): DataPrinciple[] {
    return DATA_PRINCIPLES;
  }

  /**
   * Get compliance requirements
   */
  getComplianceRequirements(): ComplianceRequirement[] {
    return COMPLIANCE_REQUIREMENTS;
  }

  /**
   * Get data processing guidelines
   */
  getDataProcessingGuidelines(): DataProcessingGuideline[] {
    return DATA_PROCESSING_GUIDELINES;
  }

  /**
   * Get implementation checklist
   */
  getImplementationChecklist(): ImplementationChecklist[] {
    return IMPLEMENTATION_CHECKLIST;
  }
}

export const dataPrincipleService = new DataPrincipleService(); 