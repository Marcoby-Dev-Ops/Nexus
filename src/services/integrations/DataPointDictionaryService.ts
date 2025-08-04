/**
 * Data Point Dictionary Service
 * 
 * MIGRATED: Now extends BaseService for consistent error handling and logging
 * Provides data point discovery, management, and analytics
 */

import { BaseService } from '@/core/services/BaseService';
import type { ServiceResponse } from '@/core/services/BaseService';
import { supabase } from '@/lib/supabase';
import { sessionUtils } from '@/lib/supabase';
import { z } from 'zod';

// Data Point Definition Schema
export const DataPointDefinitionSchema = z.object({
  id: z.string(),
  userIntegrationId: z.string(),
  endpointPath: z.string(),
  endpointMethod: z.string(),
  dataPointName: z.string(),
  dataPointType: z.enum(['string', 'number', 'boolean', 'date', 'object', 'array']),
  description: z.string(),
  category: z.enum([
    'customer', 'financial', 'operational', 'marketing', 'sales',
    'support', 'analytics', 'communication', 'document', 'task',
    'project', 'inventory', 'hr', 'legal', 'other'
  ]),
  businessValue: z.enum(['high', 'medium', 'low']),
  refreshFrequency: z.enum(['real-time', 'hourly', 'daily', 'weekly', 'monthly']),
  isRequired: z.boolean(),
  sampleValue: z.any(),
  validationRules: z.array(z.string()).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type DataPointDefinition = z.infer<typeof DataPointDefinitionSchema>;

// Data Point Usage Schema
export const DataPointUsageSchema = z.object({
  id: z.string(),
  dataPointDefinitionId: z.string(),
  userId: z.string(),
  lastAccessedAt: z.string(),
  accessCount: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type DataPointUsage = z.infer<typeof DataPointUsageSchema>;

// Data Point Discovery Log Schema
export const DataPointDiscoveryLogSchema = z.object({
  id: z.string(),
  userIntegrationId: z.string(),
  discoveryMethod: z.enum(['api_scan', 'manual_entry', 'ai_discovery', 'user_import']),
  endpointsScanned: z.number(),
  dataPointsFound: z.number(),
  newDataPoints: z.number(),
  discoveryStatus: z.enum(['running', 'completed', 'failed', 'partial']),
  errorMessage: z.string().optional(),
  createdAt: z.string(),
  completedAt: z.string().optional(),
});

export type DataPointDiscoveryLog = z.infer<typeof DataPointDiscoveryLogSchema>;

// Data Point Summary Schema
export const DataPointSummarySchema = z.object({
  totalDataPoints: z.number(),
  categories: z.record(z.string(), z.number()),
  businessValueBreakdown: z.record(z.string(), z.number()),
  mostUsedDataPoints: z.array(DataPointDefinitionSchema),
  recentlyDiscovered: z.array(DataPointDefinitionSchema),
});

export type DataPointSummary = z.infer<typeof DataPointSummarySchema>;

// Integration Data Record Schema
export const IntegrationDataRecordSchema = z.object({
  id: z.string(),
  userIntegrationId: z.string(),
  dataPointDefinitionId: z.string(),
  externalId: z.string().optional(),
  dataValue: z.any(),
  rawData: z.any().optional(),
  metadata: z.any().optional(),
  syncStatus: z.enum(['synced', 'pending', 'error', 'outdated']),
  lastSyncedAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type IntegrationDataRecord = z.infer<typeof IntegrationDataRecordSchema>;

/**
 * Data Point Dictionary Service
 * 
 * MIGRATED: Now extends BaseService for consistent error handling and logging
 * Provides data point discovery, management, and analytics
 */
export class DataPointDictionaryService extends BaseService {
  /**
   * Discover data points from an integration's API endpoints
   */
  async discoverDataPoints(userIntegrationId: string): Promise<ServiceResponse<DataPointDiscoveryLog>> {
    return this.executeDbOperation(async () => {
      try {
        // Ensure session is valid
        const hasValidSession = await sessionUtils.ensureSession();
        if (!hasValidSession) {
          return { data: null, error: 'No valid session available. Please log in again.' };
        }

        // Get user integration details
        const { data: userIntegration, error } = await this.supabase
          .from('user_integrations')
          .select('*')
          .eq('id', userIntegrationId)
          .single();

        if (error || !userIntegration) {
          return { data: null, error: 'User integration not found' };
        }

        // Create discovery log entry
        const discoveryLog: Omit<DataPointDiscoveryLog, 'id' | 'createdAt'> = {
          userIntegrationId,
          discoveryMethod: 'api_scan',
          endpointsScanned: 0,
          dataPointsFound: 0,
          newDataPoints: 0,
          discoveryStatus: 'running',
        };

        const { data: logEntry, error: logError } = await this.supabase
          .from('data_point_discovery_log')
          .insert(discoveryLog)
          .select()
          .single();

        if (logError) {
          this.logger.error('Failed to create discovery log:', logError);
          return { data: null, error: 'Failed to create discovery log' };
        }

        try {
          // Perform API discovery
          const discoveryResult = await this.performAPIDiscovery(userIntegration, logEntry);
          return { data: DataPointDiscoveryLogSchema.parse(discoveryResult), error: null };
        } catch (error) {
          // Update discovery log with error
          await this.supabase
            .from('data_point_discovery_log')
            .update({
              discoveryStatus: 'failed',
              errorMessage: error instanceof Error ? error.message : 'Unknown error',
              completedAt: new Date().toISOString(),
            })
            .eq('id', logEntry.id);

          throw error;
        }
      } catch (error) {
        this.logger.error('Error discovering data points:', error);
        return { data: null, error: 'Failed to discover data points' };
      }
    }, `discover data points for integration ${userIntegrationId}`);
  }

  /**
   * Store integration data for a specific data point
   */
  async storeIntegrationData(
    userIntegrationId: string,
    dataPointDefinitionId: string,
    data: any,
    externalId?: string,
    metadata?: any
  ): Promise<ServiceResponse<IntegrationDataRecord>> {
    return this.executeDbOperation(async () => {
      try {
        // Ensure session is valid
        const hasValidSession = await sessionUtils.ensureSession();
        if (!hasValidSession) {
          return { data: null, error: 'No valid session available. Please log in again.' };
        }

        const { data: record, error } = await this.supabase
          .from('integration_data_records')
          .insert({
            userintegration_id: userIntegrationId,
            datapoint_definition_id: dataPointDefinitionId,
            externalid: externalId,
            datavalue: data,
            rawdata: data,
            metadata: metadata || {},
            sync_status: 'synced',
            last_synced_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) {
          this.logger.error('Failed to store integration data:', error);
          return { data: null, error: 'Failed to store integration data' };
        }

        return { data: IntegrationDataRecordSchema.parse(record), error: null };
      } catch (error) {
        this.logger.error('Error storing integration data:', error);
        return { data: null, error: 'Failed to store integration data' };
      }
    }, `store integration data for data point ${dataPointDefinitionId}`);
  }

  /**
   * Get data points for a user integration
   */
  async getDataPoints(userIntegrationId: string): Promise<ServiceResponse<DataPointDefinition[]>> {
    return this.executeDbOperation(async () => {
      try {
        const { data: dataPoints, error } = await this.supabase
          .from('data_point_definitions')
          .select('*')
          .eq('user_integration_id', userIntegrationId)
          .order('created_at', { ascending: false });

        if (error) {
          this.logger.error('Failed to get data points:', error);
          return { data: null, error: 'Failed to get data points' };
        }

        const validatedDataPoints = dataPoints?.map(dp => DataPointDefinitionSchema.parse(dp)) || [];
        return { data: validatedDataPoints, error: null };
      } catch (error) {
        this.logger.error('Error getting data points:', error);
        return { data: null, error: 'Failed to get data points' };
      }
    }, `get data points for integration ${userIntegrationId}`);
  }

  /**
   * Get data point by name
   */
  async getDataPointByName(
    dataPointName: string, 
    userIntegrationId: string
  ): Promise<ServiceResponse<DataPointDefinition | null>> {
    return this.executeDbOperation(async () => {
      try {
        const { data: dataPoint, error } = await this.supabase
          .from('data_point_definitions')
          .select('*')
          .eq('user_integration_id', userIntegrationId)
          .eq('data_point_name', dataPointName)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            return { data: null, error: null }; // No data point found
          }
          this.logger.error('Failed to get data point by name:', error);
          return { data: null, error: 'Failed to get data point' };
        }

        return { data: DataPointDefinitionSchema.parse(dataPoint), error: null };
      } catch (error) {
        this.logger.error('Error getting data point by name:', error);
        return { data: null, error: 'Failed to get data point' };
      }
    }, `get data point by name ${dataPointName} for integration ${userIntegrationId}`);
  }

  /**
   * Create a new data point definition
   */
  async createDataPoint(
    dataPoint: Omit<DataPointDefinition, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ServiceResponse<DataPointDefinition>> {
    return this.executeDbOperation(async () => {
      try {
        const { data: result, error } = await this.supabase
          .from('data_point_definitions')
          .insert({
            ...dataPoint,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) {
          this.logger.error('Failed to create data point:', error);
          return { data: null, error: 'Failed to create data point' };
        }

        return { data: DataPointDefinitionSchema.parse(result), error: null };
      } catch (error) {
        this.logger.error('Error creating data point:', error);
        return { data: null, error: 'Failed to create data point' };
      }
    }, `create data point ${dataPoint.dataPointName}`);
  }

  /**
   * Get data point summary for a user
   */
  async getDataPointSummary(userId: string): Promise<ServiceResponse<DataPointSummary>> {
    return this.executeDbOperation(async () => {
      try {
        // Get user integrations
        const { data: userIntegrations, error: integrationsError } = await this.supabase
          .from('user_integrations')
          .select('id')
          .eq('userid', userId);

        if (integrationsError) {
          this.logger.error('Failed to get user integrations:', integrationsError);
          return { data: null, error: 'Failed to get user integrations' };
        }

        if (!userIntegrations?.length) {
          return { data: this.getEmptyDataPointSummary(), error: null };
        }

        // Get all data points for user's integrations
        const integrationIds = userIntegrations.map(ui => ui.id);
        const { data: dataPoints, error: dataPointsError } = await this.supabase
          .from('data_point_definitions')
          .select('*')
          .in('user_integration_id', integrationIds);

        if (dataPointsError) {
          this.logger.error('Failed to get data points:', dataPointsError);
          return { data: null, error: 'Failed to get data points' };
        }

        const validatedDataPoints = dataPoints?.map(dp => DataPointDefinitionSchema.parse(dp)) || [];
        const summary = this.calculateDataPointSummary(validatedDataPoints);

        return { data: DataPointSummarySchema.parse(summary), error: null };
      } catch (error) {
        this.logger.error('Error getting data point summary:', error);
        return { data: null, error: 'Failed to get data point summary' };
      }
    }, `get data point summary for user ${userId}`);
  }

  /**
   * Track data point usage
   */
  async trackUsage(dataPointDefinitionId: string, userId: string): Promise<ServiceResponse<void>> {
    return this.executeDbOperation(async () => {
      try {
        // Check if usage record exists
        const { data: existingUsage, error: checkError } = await this.supabase
          .from('data_point_usage')
          .select('*')
          .eq('data_point_definition_id', dataPointDefinitionId)
          .eq('user_id', userId)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          this.logger.error('Failed to check existing usage:', checkError);
          return { data: null, error: 'Failed to track usage' };
        }

        if (existingUsage) {
          // Update existing usage record
          const { error: updateError } = await this.supabase
            .from('data_point_usage')
            .update({
              access_count: existingUsage.access_count + 1,
              last_accessed_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingUsage.id);

          if (updateError) {
            this.logger.error('Failed to update usage:', updateError);
            return { data: null, error: 'Failed to track usage' };
          }
        } else {
          // Create new usage record
          const { error: insertError } = await this.supabase
            .from('data_point_usage')
            .insert({
              data_point_definition_id: dataPointDefinitionId,
              user_id: userId,
              access_count: 1,
              last_accessed_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

          if (insertError) {
            this.logger.error('Failed to create usage record:', insertError);
            return { data: null, error: 'Failed to track usage' };
          }
        }

        return { data: undefined, error: null };
      } catch (error) {
        this.logger.error('Error tracking usage:', error);
        return { data: null, error: 'Failed to track usage' };
      }
    }, `track usage for data point ${dataPointDefinitionId}`);
  }

  /**
   * Perform API discovery for data points
   */
  private async performAPIDiscovery(
    userIntegration: any, 
    logEntry: any
  ): Promise<DataPointDiscoveryLog> {
    try {
      // Get integration endpoints based on integration type
      const endpoints = await this.getIntegrationEndpoints(userIntegration.integration_type);
      let endpointsScanned = 0;
      let dataPointsFound = 0;
      let newDataPoints = 0;

      for (const endpoint of endpoints) {
        try {
          const dataPoints = await this.analyzeEndpointForDataPoints(endpoint, userIntegration);
          
          if (dataPoints.length > 0) {
            // Store discovered data points
            for (const dataPoint of dataPoints) {
              const { error: insertError } = await this.supabase
                .from('data_point_definitions')
                .insert({
                  ...dataPoint,
                  user_integration_id: userIntegration.id,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                });

              if (!insertError) {
                newDataPoints++;
              }
            }
            
            dataPointsFound += dataPoints.length;
          }
          
          endpointsScanned++;
        } catch (error) {
          this.logger.warn(`Failed to analyze endpoint ${endpoint.path}:`, error);
        }
      }

      // Update discovery log
      const { data: updatedLog, error: updateError } = await this.supabase
        .from('data_point_discovery_log')
        .update({
          endpoints_scanned: endpointsScanned,
          data_points_found: dataPointsFound,
          new_data_points: newDataPoints,
          discovery_status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', logEntry.id)
        .select()
        .single();

      if (updateError) {
        this.logger.error('Failed to update discovery log:', updateError);
        throw new Error('Failed to update discovery log');
      }

      return DataPointDiscoveryLogSchema.parse(updatedLog);
    } catch (error) {
      this.logger.error('Error performing API discovery:', error);
      throw error;
    }
  }

  /**
   * Get integration endpoints based on integration type
   */
  private async getIntegrationEndpoints(integrationType: string): Promise<Array<{ path: string; method: string }>> {
    // This would typically come from integration-specific configuration
    const endpointMap: Record<string, Array<{ path: string; method: string }>> = {
      'hubspot': [
        { path: '/crm/v3/objects/contacts', method: 'GET' },
        { path: '/crm/v3/objects/companies', method: 'GET' },
        { path: '/crm/v3/objects/deals', method: 'GET' },
      ],
      'paypal': [
        { path: '/v1/reporting/transactions', method: 'GET' },
        { path: '/v1/payments', method: 'GET' },
      ],
      'salesforce': [
        { path: '/services/data/v52.0/sobjects/Contact', method: 'GET' },
        { path: '/services/data/v52.0/sobjects/Account', method: 'GET' },
        { path: '/services/data/v52.0/sobjects/Opportunity', method: 'GET' },
      ],
    };

    return endpointMap[integrationType] || [];
  }

  /**
   * Analyze endpoint for data points
   */
  private async analyzeEndpointForDataPoints(
    endpoint: { path: string; method: string }, 
    userIntegration: any
  ): Promise<Omit<DataPointDefinition, 'id' | 'userIntegrationId' | 'createdAt' | 'updatedAt'>[]> {
    // This is a simplified analysis - in a real implementation, you'd analyze the actual API response
    const dataPoints: Omit<DataPointDefinition, 'id' | 'userIntegrationId' | 'createdAt' | 'updatedAt'>[] = [];

    // Extract data point name from endpoint path
    const pathParts = endpoint.path.split('/');
    const entityName = pathParts[pathParts.length - 1] || 'unknown';

    // Create a basic data point for this endpoint
    const dataPoint: Omit<DataPointDefinition, 'id' | 'userIntegrationId' | 'createdAt' | 'updatedAt'> = {
      endpointPath: endpoint.path,
      endpointMethod: endpoint.method,
      dataPointName: `${entityName}_data`,
      dataPointType: 'object',
      description: `Data from ${entityName} endpoint`,
      category: this.categorizeDataPoint(entityName, endpoint.path),
      businessValue: this.assessBusinessValue(endpoint.path, `${entityName}_data`),
      refreshFrequency: this.assessRefreshFrequency(endpoint.path, endpoint.method),
      isRequired: false,
      sampleValue: {},
    };

    dataPoints.push(dataPoint);

    return dataPoints;
  }

  /**
   * Categorize data point based on name and path
   */
  private categorizeDataPoint(name: string, path: string): DataPointDefinition['category'] {
    const lowerName = name.toLowerCase();
    const lowerPath = path.toLowerCase();

    if (lowerName.includes('contact') || lowerName.includes('customer') || lowerPath.includes('contact')) {
      return 'customer';
    }
    if (lowerName.includes('deal') || lowerName.includes('opportunity') || lowerPath.includes('deal')) {
      return 'sales';
    }
    if (lowerName.includes('company') || lowerName.includes('account') || lowerPath.includes('company')) {
      return 'customer';
    }
    if (lowerName.includes('transaction') || lowerName.includes('payment') || lowerPath.includes('payment')) {
      return 'financial';
    }
    if (lowerName.includes('analytics') || lowerName.includes('report') || lowerPath.includes('analytics')) {
      return 'analytics';
    }

    return 'other';
  }

  /**
   * Assess business value of data point
   */
  private assessBusinessValue(path: string, dataPointName: string): DataPointDefinition['businessValue'] {
    const lowerPath = path.toLowerCase();
    const lowerName = dataPointName.toLowerCase();

    // High value data points
    if (lowerPath.includes('transaction') || lowerPath.includes('payment') || lowerName.includes('revenue')) {
      return 'high';
    }
    if (lowerPath.includes('contact') || lowerPath.includes('customer') || lowerName.includes('customer')) {
      return 'high';
    }
    if (lowerPath.includes('deal') || lowerPath.includes('opportunity') || lowerName.includes('sales')) {
      return 'high';
    }

    // Medium value data points
    if (lowerPath.includes('company') || lowerPath.includes('account')) {
      return 'medium';
    }
    if (lowerPath.includes('analytics') || lowerPath.includes('report')) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Assess refresh frequency based on endpoint
   */
  private assessRefreshFrequency(path: string, method: string): DataPointDefinition['refreshFrequency'] {
    const lowerPath = path.toLowerCase();

    if (lowerPath.includes('transaction') || lowerPath.includes('payment')) {
      return 'real-time';
    }
    if (lowerPath.includes('analytics') || lowerPath.includes('report')) {
      return 'daily';
    }
    if (lowerPath.includes('contact') || lowerPath.includes('customer')) {
      return 'hourly';
    }

    return 'daily';
  }

  /**
   * Calculate data point summary
   */
  private calculateDataPointSummary(dataPoints: DataPointDefinition[]): DataPointSummary {
    const categories: Record<string, number> = {};
    const businessValueBreakdown: Record<string, number> = {};

    dataPoints.forEach(dp => {
      categories[dp.category] = (categories[dp.category] || 0) + 1;
      businessValueBreakdown[dp.businessValue] = (businessValueBreakdown[dp.businessValue] || 0) + 1;
    });

    // Get most used data points (sorted by business value)
    const mostUsedDataPoints = dataPoints
      .sort((a, b) => {
        const aValue = a.businessValue === 'high' ? 3 : a.businessValue === 'medium' ? 2 : 1;
        const bValue = b.businessValue === 'high' ? 3 : b.businessValue === 'medium' ? 2 : 1;
        return bValue - aValue;
      })
      .slice(0, 10);

    // Get recently discovered data points
    const recentlyDiscovered = dataPoints
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    return {
      totalDataPoints: dataPoints.length,
      categories,
      businessValueBreakdown,
      mostUsedDataPoints,
      recentlyDiscovered,
    };
  }

  /**
   * Get empty data point summary
   */
  private getEmptyDataPointSummary(): DataPointSummary {
    return {
      totalDataPoints: 0,
      categories: {},
      businessValueBreakdown: {},
      mostUsedDataPoints: [],
      recentlyDiscovered: [],
    };
  }
} 