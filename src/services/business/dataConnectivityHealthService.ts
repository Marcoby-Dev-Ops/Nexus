/**
 * Data Connectivity Health Service
 * Provides business health data based on connected and verified data sources
 */

import { BaseService, type ServiceResponse } from '@/core/services/BaseService';
import { selectData as select, selectOne, insertOne, updateOne, deleteOne, callEdgeFunction } from '@/lib/api-client';
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

      // Get user's connected integrations
      const { data: userIntegrations, error: userIntegrationsError } = await this.supabase
        .from('user_integrations')
        .select(`
          id,
          integration_name,
          status,
          last_sync_at,
          error_message,
          config,
          integration_id,
          integrations (
            name,
            category,
            description
          )
        `)
        .eq('user_id', userId);

      if (userIntegrationsError) {
        return { data: null, error: userIntegrationsError };
      }

      // Get all available integrations for comparison
      const { data: availableIntegrations, error: availableIntegrationsError } = await this.supabase
        .from('integrations')
        .select('id, name, category, description, is_active')
        .eq('is_active', true);

      if (availableIntegrationsError) {
        return { data: null, error: availableIntegrationsError };
      }

      // Process connected sources
      const connectedSources: ConnectedSource[] = (userIntegrations || [])
        .filter(integration => integration.status === 'connected')
        .map(integration => ({
          id: integration.id,
          name: integration.integration_name,
          type: integration.integrations?.category || 'unknown',
          status: this.mapIntegrationStatus(integration.status),
          lastSync: integration.last_sync_at || new Date().toISOString(),
          dataQuality: this.calculateDataQuality(integration),
          verificationStatus: this.determineVerificationStatus(integration)
        }));

      // Process unconnected sources (available but not connected)
      const connectedIntegrationIds = new Set(
        (userIntegrations || [])
          .filter(integration => integration.status === 'connected')
          .map(integration => integration.integration_id)
      );

      const unconnectedSources: UnconnectedSource[] = (availableIntegrations || [])
        .filter(integration => !connectedIntegrationIds.has(integration.id))
        .map(integration => ({
          id: integration.id,
          name: integration.name,
          type: integration.category,
          status: 'available' as const,
          estimatedImpact: this.calculateEstimatedImpact(integration.category)
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

      // Check for any recent sync failures or errors
      const { data: recentErrors, error: errorsError } = await this.supabase
        .from('user_integrations')
        .select('integration_name, error_message, updated_at')
        .eq('user_id', userId)
        .not('error_message', 'is', null)
        .gte('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24 hours

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
      case 'connected':
        return 'active';
      case 'disconnected':
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

    // Reduce quality if there are errors
    if (integration.error_message) {
      quality -= 20;
    }

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

    // Boost quality for certain integration types
    if (integration.integrations?.category === 'crm' || integration.integrations?.category === 'finance') {
      quality += 5;
    }

    return Math.max(0, Math.min(100, quality));
  }

  /**
   * Determine verification status based on integration data
   */
  private determineVerificationStatus(integration: any): 'verified' | 'pending' | 'failed' {
    if (integration.error_message) {
      return 'failed';
    }
    
    if (integration.status === 'connected' && integration.last_sync_at) {
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
