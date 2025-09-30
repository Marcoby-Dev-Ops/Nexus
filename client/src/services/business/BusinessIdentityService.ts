/**
 * Business Identity Service
 * Handles business identity data management and vector database integration
 */

import { BaseService } from '@/core/services/BaseService';
import { logger } from '@/shared/utils/logger';
import { callEdgeFunction } from '@/lib/api-client';

export interface CompanyFoundationData {
  name: string;
  legalName?: string;
  legalStructure: 'LLC' | 'Corporation' | 'Partnership' | 'Sole Proprietorship' | 'Other';
  foundedDate: string;
  headquarters: {
    address: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  website: string;
  email: string;
  phone: string;
}

export interface IndustryBusinessModelData {
  industry: string;
  sector: string;
  businessModel: string;
  companyStage: string;
  companySize: string;
  revenueRange: string;
}

export interface MissionVisionData {
  missionStatement: string;
  visionStatement: string;
}

export interface CoreValuesData {
  values: string[];
  culturePrinciples: string[];
}

export interface StrategicContextData {
  businessGoals: string[];
  challenges: string[];
  successMetrics: string[];
  strategicPriorities: string[];
}

export interface IdentityStatus {
  profile: any;
  company: any;
  completionPercentage: number;
  isComplete: boolean;
}

export class BusinessIdentityService extends BaseService {
  constructor() {
    super('BusinessIdentityService');
  }

  /**
   * Update company foundation data
   */
  async updateCompanyFoundation(data: CompanyFoundationData): Promise<ServiceResponse<any>> {
    try {
      const response = await callEdgeFunction('business_identity', {
        action: 'update_company_foundation',
        data
      });
      
      if (!response.success) {
        return this.handleError('Failed to update company foundation', response.error);
      }

      logger.info('Company foundation updated successfully', { companyName: data.name });
      return this.createResponse(response.data);
    } catch (error) {
      return this.handleError('Error updating company foundation', error);
    }
  }

  /**
   * Update industry and business model data
   */
  async updateIndustryBusinessModel(data: IndustryBusinessModelData): Promise<ServiceResponse<any>> {
    try {
      const response = await callEdgeFunction('business_identity', {
        action: 'update_industry_business_model',
        data
      });
      
      if (!response.success) {
        return this.handleError('Failed to update industry and business model', response.error);
      }

      logger.info('Industry and business model updated successfully', { industry: data.industry });
      return this.createResponse(response.data);
    } catch (error) {
      return this.handleError('Error updating industry and business model', error);
    }
  }

  /**
   * Update mission and vision data
   */
  async updateMissionVision(data: MissionVisionData): Promise<ServiceResponse<any>> {
    try {
      const response = await callEdgeFunction('business_identity', {
        action: 'update_mission_vision',
        data
      });
      
      if (!response.success) {
        return this.handleError('Failed to update mission and vision', response.error);
      }

      logger.info('Mission and vision updated successfully');
      return this.createResponse(response.data);
    } catch (error) {
      return this.handleError('Error updating mission and vision', error);
    }
  }

  /**
   * Update core values data
   */
  async updateCoreValues(data: CoreValuesData): Promise<ServiceResponse<any>> {
    try {
      const response = await callEdgeFunction('business_identity', {
        action: 'update_core_values',
        data
      });
      
      if (!response.success) {
        return this.handleError('Failed to update core values', response.error);
      }

      logger.info('Core values updated successfully');
      return this.createResponse(response.data);
    } catch (error) {
      return this.handleError('Error updating core values', error);
    }
  }

  /**
   * Update strategic context data
   */
  async updateStrategicContext(data: StrategicContextData): Promise<ServiceResponse<any>> {
    try {
      const response = await callEdgeFunction('business_identity', {
        action: 'update_strategic_context',
        data
      });
      
      if (!response.success) {
        return this.handleError('Failed to update strategic context', response.error);
      }

      logger.info('Strategic context updated successfully');
      return this.createResponse(response.data);
    } catch (error) {
      return this.handleError('Error updating strategic context', error);
    }
  }

  /**
   * Get current identity status
   */
  async getIdentityStatus(): Promise<ServiceResponse<IdentityStatus>> {
    try {
      const response = await callEdgeFunction('business_identity', {
        action: 'get_identity_status'
      });
      
      if (!response.success) {
        return this.handleError('Failed to get identity status', response.error);
      }

      return this.createResponse(response.data);
    } catch (error) {
      return this.handleError('Error getting identity status', error);
    }
  }

  /**
   * Validate identity completion
   */
  async validateIdentityCompletion(): Promise<ServiceResponse<any>> {
    try {
      const response = await callEdgeFunction('business_identity', {
        action: 'validate_identity_completion'
      });
      
      if (!response.success) {
        return this.handleError('Failed to validate identity completion', response.error);
      }

      logger.info('Identity completion validated', { 
        isComplete: response.data.isComplete,
        completionPercentage: response.data.completionPercentage 
      });
      return this.createResponse(response.data);
    } catch (error) {
      return this.handleError('Error validating identity completion', error);
    }
  }
}

// Export singleton instance
export const businessIdentityService = new BusinessIdentityService();
