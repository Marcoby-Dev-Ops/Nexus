import { logger } from '@/shared/utils/logger';
import { DataAccessLayer } from './DataAccessLayer';

export class BusinessLogicLayer {
  private dataAccess = new DataAccessLayer();

  async getUserProfile(userId: string): Promise<{
    data: any;
    error: string | null;
    warnings: string[];
  }> {
    try {
      logger.debug('BusinessLogicLayer.getUserProfile called for user:', userId);
      const result = await this.dataAccess.getUserProfile(userId);
      
      if (result.error) {
        logger.error('DataAccess returned error for user:', userId, result.error);
        return { data: null, error: result.error, warnings: [] };
      }
      
      if (!result.data) {
        logger.warn('DataAccess returned no data for user:', userId);
        return {
          data: null,
          error: 'Profile not found',
          warnings: []
        };
      }
      
      const transformedData = this.transformProfileData(result.data);
      const warnings = this.validateProfileData(transformedData);
      logger.debug('BusinessLogicLayer.getUserProfile completed successfully for user:', userId);
      return { data: transformedData, error: null, warnings };
    } catch (error) {
      logger.error('Error in getUserProfile business logic for user:', userId, error);
      return {
        data: null,
        error: 'Failed to process profile data',
        warnings: []
      };
    }
  }

  async getUserBusinessData(userId: string): Promise<{
    data: any;
    error: string | null;
    warnings: string[];
  }> {
    try {
      logger.debug('BusinessLogicLayer.getUserBusinessData called for user:', userId);
      const result = await this.dataAccess.getUserBusinessData(userId);
      
      if (result.error) {
        logger.error('DataAccess returned error for user:', userId, result.error);
        return { data: null, error: result.error, warnings: [] };
      }
      
      if (!result.data) {
        logger.warn('DataAccess returned no data for user:', userId);
        return {
          data: null,
          error: 'Business data not found',
          warnings: []
        };
      }
      
      const transformedData = this.transformBusinessData(result.data);
      const warnings = this.validateBusinessData(transformedData);
      logger.debug('BusinessLogicLayer.getUserBusinessData completed successfully for user:', userId);
      return { data: transformedData, error: null, warnings };
    } catch (error) {
      logger.error('Error in getUserBusinessData business logic for user:', userId, error);
      return {
        data: null,
        error: 'Failed to process business data',
        warnings: []
      };
    }
  }

  private transformProfileData(data: any): any {
    // Transform profile data as needed
    return {
      ...data,
      displayName: data.name || data.email?.split('@')[0] || 'User',
      isComplete: !!(data.name && data.email),
      lastUpdated: data.updated_at || data.created_at
    };
  }

  private transformBusinessData(data: any): any {
    // Transform business data as needed
    return {
      ...data,
      isActive: true,
      lastUpdated: data.updated_at || data.created_at
    };
  }

  private validateProfileData(data: any): string[] {
    const warnings: string[] = [];
    
    if (!data.name) {
      warnings.push('Profile name is missing');
    }
    
    if (!data.email) {
      warnings.push('Profile email is missing');
    }
    
    return warnings;
  }

  private validateBusinessData(data: any): string[] {
    const warnings: string[] = [];
    
    if (!data.company_name) {
      warnings.push('Company name is missing');
    }
    
    return warnings;
  }
} 