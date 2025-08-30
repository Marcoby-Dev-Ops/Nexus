/**
 * Domain Analysis Service
 * Analyzes email domains for professional status and business health KPI updates
 * Pillar: 1,2 - Automated business health assessment
 */

import { selectData as select, selectOne, insertOne, updateOne, deleteOne } from '@/lib/api-client';
import { BaseService, type ServiceResponse } from '@/core/services/BaseService';

interface DomainAnalysis {
  id: string;
  user_id: string;
  domain: string;
  analysis_result: any;
  created_at: string;
  updated_at: string;
}

export class DomainAnalysisService extends BaseService {
  /**
   * Get domain analysis for a specific user and domain
   */
  async getDomainAnalysis(userId: string, domain: string): Promise<ServiceResponse<DomainAnalysis>> {
    const userIdValidation = this.validateIdParam(userId, 'userId');
    if (userIdValidation) {
      return this.createErrorResponse(userIdValidation);
    }

    const domainValidation = this.validateRequiredParam(domain, 'domain');
    if (domainValidation) {
      return this.createErrorResponse(domainValidation);
    }

    return this.executeDbOperation(
      async () => {
        const { data, error } = await select('domain_analyses', '*', { 
          user_id: userId, 
          domain 
        });
        return { data: data as DomainAnalysis, error };
      },
      'getDomainAnalysis'
    );
  }

  /**
   * Create a new domain analysis
   */
  async createDomainAnalysis(analysisData: Omit<DomainAnalysis, 'id' | 'created_at' | 'updated_at'>): Promise<ServiceResponse<DomainAnalysis>> {
    const userIdValidation = this.validateIdParam(analysisData.user_id, 'user_id');
    if (userIdValidation) {
      return this.createErrorResponse(userIdValidation);
    }

    const domainValidation = this.validateRequiredParam(analysisData.domain, 'domain');
    if (domainValidation) {
      return this.createErrorResponse(domainValidation);
    }

    return this.executeDbOperation(
      async () => {
        const { data, error } = await insertOne('domain_analyses', analysisData);
        return { data: data as DomainAnalysis, error };
      },
      'createDomainAnalysis'
    );
  }

  /**
   * Update an existing domain analysis
   */
  async updateDomainAnalysis(analysisId: string, updates: Partial<DomainAnalysis>): Promise<ServiceResponse<DomainAnalysis>> {
    const validation = this.validateIdParam(analysisId, 'analysisId');
    if (validation) {
      return this.createErrorResponse(validation);
    }

    return this.executeDbOperation(
      async () => {
        const { data, error } = await updateOne('domain_analyses', analysisId, updates);
        return { data: data as DomainAnalysis, error };
      },
      'updateDomainAnalysis'
    );
  }

  /**
   * Get all domain analyses for a user
   */
  async getAllDomainAnalyses(userId: string): Promise<ServiceResponse<DomainAnalysis[]>> {
    const validation = this.validateIdParam(userId, 'userId');
    if (validation) {
      return this.createErrorResponse(validation);
    }

    return this.executeDbOperation(
      async () => {
        const { data, error } = await select('domain_analyses', '*', { user_id: userId });
        return { data: data as DomainAnalysis[], error };
      },
      'getAllDomainAnalyses'
    );
  }

  /**
   * Delete a domain analysis
   */
  async deleteDomainAnalysis(analysisId: string): Promise<ServiceResponse<boolean>> {
    const validation = this.validateIdParam(analysisId, 'analysisId');
    if (validation) {
      return this.createErrorResponse(validation);
    }

    return this.executeDbOperation(
      async () => {
        const { error } = await deleteOne('domain_analyses', analysisId);
        return { data: !error, error };
      },
      'deleteDomainAnalysis'
    );
  }
}

// Export singleton instance
export const domainAnalysisService = new DomainAnalysisService(); 
