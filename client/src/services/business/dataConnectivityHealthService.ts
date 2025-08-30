/**
 * Data Connectivity Health Service
 * Provides business health data based on connected and verified data sources
 */

import { BaseService, type ServiceResponse } from '@/core/services/BaseService';
import { selectData, selectOne } from '@/lib/api-client';
export interface ConnectedSource {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'inactive' | 'error';
  lastSync: string;
  dataQuality: number;
  verificationStatus: 'verified' | 'pending' | 'failed';
}

export interface UnconnectedSource {
  id: string;
  name: string;
  type: string;
  status: 'available' | 'unavailable';
  estimatedImpact: number;
}

export interface ConnectivityHealthData {
  overallScore: number;
  dataQualityScore: number;
  completionPercentage: number;
  connectedSources: ConnectedSource[];
  unconnectedSources: UnconnectedSource[];
  lastUpdated: string;
  recommendations: string[];
}

export class DataConnectivityHealthService extends BaseService {
  private static instance: DataConnectivityHealthService;

  private constructor() {
    super();
  }

  static getInstance(): DataConnectivityHealthService {
    if (!DataConnectivityHealthService.instance) {
      DataConnectivityHealthService.instance = new DataConnectivityHealthService();
    }
    return DataConnectivityHealthService.instance;
  }

  /**
   * Get connectivity status for a user based on their actual integrations
   */
  async getConnectivityStatus(userId: string): Promise<ServiceResponse<ConnectivityHealthData>> {
    this.logMethodCall('getConnectivityStatus', { userId });

    return this.executeDbOperation(async () => {
      // Validate user ID
      const validationError = this.validateIdParam(userId, 'userId');
      if (validationError) {
        return { data: null, error: validationError };
      }

      // Get user's connected integrations via API - using correct column names
      const { data: userIntegrations, error: userIntegrationsError } = await selectData('user_integrations', 
        'id, integration_slug, status, last_sync_at, settings, integration_id',
        { user_id: userId }
      );

      if (userIntegrationsError) {
        this.logError('getConnectivityStatus', { userId, error: userIntegrationsError });
        return { data: null, error: userIntegrationsError };
      }

      // Get all available integrations for comparison via API - using correct column names
      const { data: availableIntegrations, error: availableIntegrationsError } = await selectData('integrations',
        'id, name, type, description, slug',
        { is_active: true }
      );

      if (availableIntegrationsError) {
        this.logError('getConnectivityStatus', { userId, error: availableIntegrationsError });
        return { data: null, error: availableIntegrationsError };
      }

             // Process connected sources
       const connectedSources: ConnectedSource[] = (userIntegrations || [])
         .filter(integration => integration.status === 'active')
         .map(integration => ({
           id: integration.id,
           name: integration.integration_slug,
           type: 'unknown', // We'll get this from the integrations table
           status: this.mapIntegrationStatus(integration.status),
           lastSync: integration.last_sync_at || new Date().toISOString(),
           dataQuality: this.calculateDataQuality(integration),
           verificationStatus: this.determineVerificationStatus(integration)
         }));

             // Process unconnected sources (available but not connected)
       const connectedIntegrationIds = new Set(
         (userIntegrations || [])
           .filter(integration => integration.status === 'active')
           .map(integration => integration.integration_id)
       );

       const unconnectedSources: UnconnectedSource[] = (availableIntegrations || [])
         .filter(integration => !connectedIntegrationIds.has(integration.id))
         .map(integration => ({
           id: integration.id,
           name: integration.name,
           type: integration.type,
           status: 'available' as const,
           estimatedImpact: this.calculateEstimatedImpact(integration.type)
         }));

      // Calculate scores
      const overallScore = this.calculateOverallScore(connectedSources, unconnectedSources);
      const dataQualityScore = this.calculateDataQualityScore(connectedSources);
      const completionPercentage = this.calculateCompletionPercentage(connectedSources, unconnectedSources);

      // Generate recommendations
      const recommendations = this.generateRecommendations(connectedSources, unconnectedSources);

      const result: ConnectivityHealthData = {
        overallScore,
        dataQualityScore,
        completionPercentage,
        connectedSources,
        unconnectedSources,
        lastUpdated: new Date().toISOString(),
        recommendations
      };

      this.logSuccess('getConnectivityStatus', {
        userId,
        connectedCount: connectedSources.length,
        unconnectedCount: unconnectedSources.length,
        overallScore,
        dataQualityScore,
        completionPercentage
      });

      return { data: result, error: null };
    }, 'get connectivity status');
  }

  /**
   * Get real-time connectivity status with live data
   */
  async getRealTimeConnectivityStatus(userId: string): Promise<ServiceResponse<ConnectivityHealthData>> {
    this.logMethodCall('getRealTimeConnectivityStatus', { userId });

    return this.executeDbOperation(async () => {
      // Get the latest connectivity status
      const result = await this.getConnectivityStatus(userId);
      if (!result.success || !result.data) {
        return { data: null, error: result.error };
      }

             // Check for any recent sync failures or errors via API
       // Note: No error_message column exists, so we'll skip this check for now
       const recentErrors: any[] = [];

      if (!errorsError && recentErrors && recentErrors.length > 0) {
        // Update data quality score based on recent errors
        result.data.dataQualityScore = Math.max(0, result.data.dataQualityScore - (recentErrors.length * 5));
        result.data.overallScore = Math.max(0, result.data.overallScore - (recentErrors.length * 2));
      }

      return { data: result.data, error: null };
    }, 'get real-time connectivity status');
  }

     /**
    * Map integration status to our internal status format
    */
   private mapIntegrationStatus(status: string | null): 'active' | 'inactive' | 'error' {
     switch (status) {
       case 'active':
         return 'active';
       case 'inactive':
         return 'inactive';
       case 'error':
       case 'pending':
         return 'error';
       default:
         return 'inactive';
     }
   }

     /**
    * Calculate data quality score for an integration
    */
   private calculateDataQuality(integration: any): number {
     let quality = 80; // Base quality score

     // Reduce quality if no recent sync
     if (integration.last_sync_at) {
       const lastSync = new Date(integration.last_sync_at);
       const daysSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60 * 24);
       
       if (daysSinceSync > 7) {
         quality -= 15;
       } else if (daysSinceSync > 3) {
         quality -= 10;
       } else if (daysSinceSync > 1) {
         quality -= 5;
       }
     } else {
       quality -= 30; // No sync data available
     }

     // Boost quality for certain integration types (if we can determine type)
     if (integration.type === 'crm' || integration.type === 'finance') {
       quality += 5;
     }

     return Math.max(0, Math.min(100, quality));
   }

     /**
    * Determine verification status based on integration data
    */
   private determineVerificationStatus(integration: any): 'verified' | 'pending' | 'failed' {
     if (integration.status === 'active' && integration.last_sync_at) {
       return 'verified';
     }
     
     return 'pending';
   }

  /**
   * Calculate estimated business impact for unconnected integrations
   */
  private calculateEstimatedImpact(category: string): number {
    const impactMap: Record<string, number> = {
      'crm': 30,
      'finance': 25,
      'analytics': 20,
      'productivity': 15,
      'communication': 10,
      'storage': 8,
      'development': 12,
      'support': 8,
      'marketing': 18
    };

    return impactMap[category] || 10;
  }

  /**
   * Calculate overall connectivity score
   */
  private calculateOverallScore(connectedSources: ConnectedSource[], unconnectedSources: UnconnectedSource[]): number {
    if (connectedSources.length === 0 && unconnectedSources.length === 0) {
      return 0;
    }

    const totalSources = connectedSources.length + unconnectedSources.length;
    const baseScore = (connectedSources.length / totalSources) * 100;
    
    // Boost score based on data quality of connected sources
    const qualityBonus = connectedSources.length > 0 
      ? connectedSources.reduce((sum, source) => sum + source.dataQuality, 0) / connectedSources.length * 0.3
      : 0;

    return Math.min(100, Math.round(baseScore + qualityBonus));
  }

  /**
   * Calculate data quality score
   */
  private calculateDataQualityScore(connectedSources: ConnectedSource[]): number {
    if (connectedSources.length === 0) {
      return 0;
    }

    return Math.round(
      connectedSources.reduce((sum, source) => sum + source.dataQuality, 0) / connectedSources.length
    );
  }

  /**
   * Calculate completion percentage
   */
  private calculateCompletionPercentage(connectedSources: ConnectedSource[], unconnectedSources: UnconnectedSource[]): number {
    const totalSources = connectedSources.length + unconnectedSources.length;
    if (totalSources === 0) {
      return 0;
    }

    return Math.round((connectedSources.length / totalSources) * 100);
  }

  /**
   * Generate personalized recommendations
   */
  private generateRecommendations(connectedSources: ConnectedSource[], unconnectedSources: UnconnectedSource[]): string[] {
    const recommendations: string[] = [];

    // Check for high-impact unconnected sources
    const highImpactSources = unconnectedSources
      .filter(source => source.estimatedImpact >= 20)
      .sort((a, b) => b.estimatedImpact - a.estimatedImpact);

    if (highImpactSources.length > 0) {
      recommendations.push(`Connect ${highImpactSources[0].name} to improve ${highImpactSources[0].type} insights`);
    }

    // Check for data quality issues
    const lowQualitySources = connectedSources.filter(source => source.dataQuality < 70);
    if (lowQualitySources.length > 0) {
      recommendations.push(`Review ${lowQualitySources[0].name} configuration to improve data quality`);
    }

    // Check for missing critical integrations
    const hasCRM = connectedSources.some(source => source.type === 'crm');
    const hasFinance = connectedSources.some(source => source.type === 'finance');
    const hasAnalytics = connectedSources.some(source => source.type === 'analytics');

    if (!hasCRM) {
      recommendations.push('Connect a CRM system to track customer relationships');
    }
    if (!hasFinance) {
      recommendations.push('Connect financial tools to monitor business performance');
    }
    if (!hasAnalytics) {
      recommendations.push('Add analytics integration for data-driven insights');
    }

    // Limit to top 3 recommendations
    return recommendations.slice(0, 3);
  }
}

// Export singleton instance
export const dataConnectivityHealthService = DataConnectivityHealthService.getInstance(); 
