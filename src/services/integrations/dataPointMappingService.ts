/**
 * Data Point Mapping Service
 * Ensures all data points in dictionaries have proper database landing spots
 * 
 * MIGRATED: Now extends BaseService for consistent error handling and logging
 */

import { BaseService } from '@/core/services/BaseService';
import type { ServiceResponse } from '@/core/services/BaseService';
import { selectData, selectOne, insertOne } from '@/lib/api-client';
import { z } from 'zod';

// Data Point Mapping Schema
export const DataPointMappingSchema = z.object({
  dataPointId: z.string(),
  dataPointName: z.string(),
  category: z.string(),
  businessValue: z.enum(['high', 'medium', 'low']),
  hasData: z.boolean(),
  dataCount: z.number(),
  lastUpdate: z.string().nullable(),
  integrationName: z.string(),
  integrationStatus: z.string(),
});

export type DataPointMapping = z.infer<typeof DataPointMappingSchema>;

// Mapping Report Schema
export const MappingReportSchema = z.object({
  totalDataPoints: z.number(),
  dataPointsWithData: z.number(),
  dataPointsWithoutData: z.number(),
  coveragePercentage: z.number(),
  highValueDataPoints: z.number(),
  mediumValueDataPoints: z.number(),
  lowValueDataPoints: z.number(),
  issues: z.array(z.string()),
  mappings: z.array(DataPointMappingSchema),
});

export type MappingReport = z.infer<typeof MappingReportSchema>;

// Unmapped Data Points Schema
export const UnmappedDataPointsSchema = z.object({
  unmappedDataPoints: z.array(z.object({
    dataPointId: z.string(),
    dataPointName: z.string(),
    integrationName: z.string(),
    category: z.string(),
    businessValue: z.string(),
  })),
  totalUnmapped: z.number(),
});

export type UnmappedDataPoints = z.infer<typeof UnmappedDataPointsSchema>;

/**
 * Data Point Mapping Service
 * 
 * Browser-safe version that uses API endpoints instead of direct database access
 */
export class DataPointMappingService extends BaseService {

  /**
   * Generate a comprehensive mapping report for a user
   */
  async generateMappingReport(userId: string): Promise<ServiceResponse<MappingReport>> {
    try {
      // Get all user integrations
      const integrationsResult = await selectData('user_integrations', 'id', { user_id: userId });
      if (integrationsResult.error) {
        return { data: null, error: 'Failed to fetch user integrations', success: false };
      }

      const userIntegrations = integrationsResult.data || [];
      
      // Get all data point definitions
      const definitionsResult = await selectData('datapoint_definitions', 'id', {});
      if (definitionsResult.error) {
        return { data: null, error: 'Failed to fetch data point definitions', success: false };
      }

      const allDefinitions = definitionsResult.data || [];
      
      // Get integration data to check which data points have actual data
      const dataResult = await selectData('integration_data', 'id', { user_id: userId });
      if (dataResult.error) {
        return { data: null, error: 'Failed to fetch integration data', success: false };
      }

      const integrationData = dataResult.data || [];

      // Calculate metrics
      const totalDataPoints = allDefinitions.length;
      const dataPointsWithData = integrationData.length;
      const dataPointsWithoutData = totalDataPoints - dataPointsWithData;
      const coveragePercentage = totalDataPoints > 0 ? (dataPointsWithData / totalDataPoints) * 100 : 0;

      // Categorize by value (simplified logic)
      const highValueDataPoints = allDefinitions.filter((def: any) => 
        ['revenue', 'customers', 'conversion_rate', 'mrr'].includes(def.name?.toLowerCase() || '')
      ).length;
      
      const mediumValueDataPoints = allDefinitions.filter((def: any) => 
        ['leads', 'opportunities', 'response_time', 'satisfaction'].includes(def.name?.toLowerCase() || '')
      ).length;
      
      const lowValueDataPoints = totalDataPoints - highValueDataPoints - mediumValueDataPoints;

      // Identify issues
      const issues: string[] = [];
      if (coveragePercentage < 50) {
        issues.push('Low data coverage - less than 50% of data points have data');
      }
      if (userIntegrations.length === 0) {
        issues.push('No integrations configured');
      }

      // Create mappings array based on existing data
      const mappings: DataPointMapping[] = integrationData.map((data: any) => {
        const definition = allDefinitions.find((def: any) => def.id === data.datapoint_definition_id) as any;
        const integration = userIntegrations.find((int: any) => int.id === data.user_integration_id) as any;
        
        return {
          dataPointId: data.datapoint_definition_id,
          dataPointName: definition?.name || 'Unknown',
          category: definition?.category || 'general',
          businessValue: this.getBusinessValue(definition?.name || ''),
          hasData: true,
          dataCount: 1,
          lastUpdate: data.updated_at || null,
          integrationName: integration?.name || 'Unknown',
          integrationStatus: integration?.status || 'unknown',
        };
      });

      const report: MappingReport = {
        totalDataPoints,
        dataPointsWithData,
        dataPointsWithoutData,
        coveragePercentage: Math.round(coveragePercentage * 100) / 100,
        highValueDataPoints,
        mediumValueDataPoints,
        lowValueDataPoints,
        issues,
        mappings,
      };
      
      return { data: report, error: null, success: true };
    } catch (error) {
      this.logger.error('Error generating mapping report:', error);
      return { data: null, error: 'Failed to generate mapping report', success: false };
    }
  }

  /**
   * Helper method to determine business value of a data point
   */
  private getBusinessValue(dataPointName: string): 'high' | 'medium' | 'low' {
    const name = dataPointName.toLowerCase();
    if (['revenue', 'customers', 'conversion_rate', 'mrr'].includes(name)) {
      return 'high';
    }
    if (['leads', 'opportunities', 'response_time', 'satisfaction'].includes(name)) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Get unmapped data points for a user
   */
  async getUnmappedDataPoints(userId: string): Promise<ServiceResponse<UnmappedDataPoints>> {
    try {
      // Get all data point definitions
      const definitionsResult = await selectData('datapoint_definitions', 'id', {});
      if (definitionsResult.error) {
        return { data: null, error: 'Failed to fetch data point definitions', success: false };
      }

      const allDefinitions = definitionsResult.data || [];
      
      // Get existing mappings for this user
      const mappingsResult = await selectData('datapoint_mappings', 'id', { user_id: userId });
      if (mappingsResult.error) {
        return { data: null, error: 'Failed to fetch data point mappings', success: false };
      }

      const existingMappings = mappingsResult.data || [];
      
      // Find unmapped data points
      const mappedDefinitionIds = new Set(existingMappings.map((mapping: any) => mapping.datapoint_definition_id));
      const unmappedDataPoints = allDefinitions.filter((definition: any) => !mappedDefinitionIds.has(definition.id));

      const result: UnmappedDataPoints = {
        unmappedDataPoints: unmappedDataPoints.map((definition: any) => ({
          dataPointId: definition.id,
          dataPointName: definition.name,
          integrationName: 'Unknown', // No direct integration mapping for unmapped points
          category: definition.category,
          businessValue: 'low', // Default for unmapped
        })),
        totalUnmapped: unmappedDataPoints.length,
      };
      
      return { data: result, error: null, success: true };
    } catch (error) {
      this.logger.error('Error getting unmapped data points:', error);
      return { data: null, error: 'Failed to get unmapped data points', success: false };
    }
  }

  /**
   * Create a new data point mapping
   */
  async createDataPointMapping(mapping: {
    userId: string;
    dataPointDefinitionId: string;
    integrationId: string;
    mappingType?: string;
    mappingConfig?: any;
    isActive?: boolean;
  }): Promise<ServiceResponse<DataPointMapping>> {
    try {
      // Validate that the user integration exists
      const integrationResult = await selectOne('user_integrations', 'id', mapping.integrationId);
      if (integrationResult.error || !integrationResult.data) {
        return { data: null, error: 'Invalid user integration', success: false };
      }

      // Validate that the data point definition exists
      const definitionResult = await selectOne('datapoint_definitions', 'id', mapping.dataPointDefinitionId);
      if (definitionResult.error || !definitionResult.data) {
        return { data: null, error: 'Invalid data point definition', success: false };
      }

      // Check if mapping already exists
      const existingResult = await selectData('datapoint_mappings', 'id', {
        user_id: mapping.userId,
        datapoint_definition_id: mapping.dataPointDefinitionId,
        user_integration_id: mapping.integrationId,
      });

      if (existingResult.error) {
        return { data: null, error: 'Failed to check existing mapping', success: false };
      }

      if (existingResult.data && existingResult.data.length > 0) {
        return { data: null, error: 'Mapping already exists', success: false };
      }

      // Create the mapping
      const insertResult = await insertOne('datapoint_mappings', {
        user_id: mapping.userId,
        datapoint_definition_id: mapping.dataPointDefinitionId,
        user_integration_id: mapping.integrationId,
        mapping_type: mapping.mappingType || 'direct',
        mapping_config: mapping.mappingConfig || {},
        is_active: mapping.isActive !== false, // Default to true
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (insertResult.error) {
        this.logger.error('Failed to create data point mapping:', insertResult.error);
        return { data: null, error: 'Failed to create data point mapping', success: false };
      }

      const createdMapping: DataPointMapping = {
        dataPointId: (insertResult.data as any).id,
        dataPointName: (definitionResult.data as any).name || 'Unknown',
        category: (definitionResult.data as any).category || 'general',
        businessValue: this.getBusinessValue((definitionResult.data as any).name || ''),
        hasData: false, // Will be updated when data is added
        dataCount: 0,
        lastUpdate: (insertResult.data as any).created_at,
        integrationName: (integrationResult.data as any).integration_name || 'Unknown',
        integrationStatus: (integrationResult.data as any).status || 'unknown',
      };

      this.logger.info('Created data point mapping', { 
        userId: mapping.userId, 
        dataPointDefinitionId: mapping.dataPointDefinitionId,
        integrationId: mapping.integrationId 
      });

      return { data: createdMapping, error: null, success: true };
    } catch (error) {
      this.logger.error('Error creating data point mapping:', error);
      return { data: null, error: 'Failed to create data point mapping', success: false };
    }
  }
} 
