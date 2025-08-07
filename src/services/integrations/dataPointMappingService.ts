/**
 * Data Point Mapping Service
 * Ensures all data points in dictionaries have proper database landing spots
 * 
 * MIGRATED: Now extends BaseService for consistent error handling and logging
 */

import { BaseService } from '@/core/services/BaseService';
import type { ServiceResponse } from '@/core/services/BaseService';
import { supabase } from '@/lib/supabase';
import { SupabaseService } from '@/core/services/SupabaseService';
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
 * MIGRATED: Now extends BaseService for consistent error handling and logging
 * Ensures all data points in dictionaries have proper database landing spots
 */
export class DataPointMappingService extends BaseService {
  private supabaseService = SupabaseService.getInstance();

  /**
   * Generate a comprehensive mapping report for a user
   */
  async generateMappingReport(userId: string): Promise<ServiceResponse<MappingReport>> {
    return this.executeDbOperation(async () => {
      try {
        // Get all user integrations
        const { data: userIntegrations, error: integrationsError } = await this.supabaseService.select('user_integrations', '*', { user_id: userId });
        
        if (integrationsError) {
          this.logger.error('Failed to fetch user integrations:', integrationsError);
          return { data: null, error: 'Failed to fetch user integrations' };
        }

        if (!userIntegrations?.length) {
          const emptyReport: MappingReport = {
            totalDataPoints: 0,
            dataPointsWithData: 0,
            dataPointsWithoutData: 0,
            coveragePercentage: 0,
            highValueDataPoints: 0,
            mediumValueDataPoints: 0,
            lowValueDataPoints: 0,
            issues: ['No integrations found'],
            mappings: [],
          };
          return { data: MappingReportSchema.parse(emptyReport), error: null };
        }

        const mappings: DataPointMapping[] = [];
        const issues: string[] = [];
        let totalDataPoints = 0;
        let dataPointsWithData = 0;
        let highValueDataPoints = 0;
        let mediumValueDataPoints = 0;
        let lowValueDataPoints = 0;

        for (const integration of userIntegrations) {
          try {
            // Get data point definitions for this integration
            const { data: dataPoints, error: dataPointsError } = await this.supabaseService.select('data_point_definitions', '*', { user_integration_id: integration.id });

            if (dataPointsError) {
              this.logger.warn(`Failed to fetch data points for integration ${integration.id}:`, dataPointsError);
              issues.push(`Failed to fetch data points for integration: ${integration.integration_name}`);
              continue;
            }

            if (!dataPoints?.length) {
              issues.push(`No data points found for integration: ${integration.integration_name}`);
              continue;
            }

            for (const dataPoint of dataPoints) {
              totalDataPoints++;

              // Check if this data point has data
              const { data: dataRecords, error: dataRecordsError } = await this.supabaseService.select('integration_data', 'id, created_at', { 
                user_integration_id: integration.id, 
                datapoint_definition_id: dataPoint.id 
              });

              const hasData = Boolean(dataRecords && dataRecords.length > 0);
              const dataCount = dataRecords?.length || 0;
              const lastUpdate = dataRecords && dataRecords.length > 0 
                ? dataRecords[0].created_at : null;

              if (hasData) {
                dataPointsWithData++;
              } else {
                issues.push(`Data point "${dataPoint.data_point_name}" has no data records`);
              }

              // Count by business value
              const businessValue = dataPoint.business_value || 'low';
              if (businessValue === 'high') {
                highValueDataPoints++;
              } else if (businessValue === 'medium') {
                mediumValueDataPoints++;
              } else {
                lowValueDataPoints++;
              }

              const mapping: DataPointMapping = {
                dataPointId: dataPoint.id,
                dataPointName: dataPoint.data_point_name,
                category: dataPoint.category || 'other',
                businessValue: businessValue as 'high' | 'medium' | 'low',
                hasData,
                dataCount,
                lastUpdate,
                integrationName: integration.integration_name,
                integrationStatus: integration.status,
              };

              mappings.push(DataPointMappingSchema.parse(mapping));
            }
          } catch (error) {
            this.logger.warn(`Failed to process integration ${integration.id}:`, error);
            issues.push(`Failed to process integration: ${integration.integration_name}`);
          }
        }

        const coveragePercentage = totalDataPoints > 0 ? (dataPointsWithData / totalDataPoints) * 100 : 0;

        const report: MappingReport = {
          totalDataPoints,
          dataPointsWithData,
          dataPointsWithoutData: totalDataPoints - dataPointsWithData,
          coveragePercentage,
          highValueDataPoints,
          mediumValueDataPoints,
          lowValueDataPoints,
          issues,
          mappings,
        };

        return { data: MappingReportSchema.parse(report), error: null };
      } catch (error) {
        this.logger.error('Error generating mapping report:', error);
        return { data: null, error: 'Failed to generate mapping report' };
      }
    }, `generate mapping report for user ${userId}`);
  }

  /**
   * Ensure a data point has data by creating sample data if needed
   */
  async ensureDataPointHasData(
    userIntegrationId: string,
    dataPointDefinitionId: string,
    sampleData: any
  ): Promise<ServiceResponse<{ success: boolean; error?: string }>> {
    return this.executeDbOperation(async () => {
      try {
        // Check if data already exists
        const existingData = await select('integration_data', 'id', { 
          user_integration_id: userIntegrationId, 
          datapoint_definition_id: dataPointDefinitionId 
        });

        if (existingData && existingData.length > 0) {
          return { data: { success: true }, error: null };
        }

        // Insert sample data
        const { error: insertError } = await insertOne('integration_data', {
          user_integration_id: userIntegrationId,
          datapoint_definition_id: dataPointDefinitionId,
          data_value: sampleData,
          raw_data: sampleData,
          sync_status: 'synced',
          last_synced_at: new Date().toISOString(),
        });

        if (insertError) {
          this.logger.error('Failed to insert sample data:', insertError);
          return { data: { success: false, error: 'Failed to insert sample data' }, error: null };
        }

        this.logger.info(`Created sample data for data point ${dataPointDefinitionId}`);
        return { data: { success: true }, error: null };
      } catch (error) {
        this.logger.error('Error ensuring data point has data:', error);
        return { data: { success: false, error: 'Failed to ensure data point has data' }, error: null };
      }
    }, `ensure data point has data for integration ${userIntegrationId}, data point ${dataPointDefinitionId}`);
  }

  /**
   * Get unmapped data points for a user
   */
  async getUnmappedDataPoints(userId: string): Promise<ServiceResponse<UnmappedDataPoints>> {
    return this.executeDbOperation(async () => {
      try {
        // Get all user integrations
        const userIntegrations = await select('user_integrations', '*', { user_id: userId });

        if (!userIntegrations?.length) {
          return { 
            data: { unmappedDataPoints: [], totalUnmapped: 0 }, 
            error: null 
          };
        }

        const unmappedDataPoints: UnmappedDataPoints['unmappedDataPoints'] = [];
        let totalUnmapped = 0;

        for (const integration of userIntegrations) {
          try {
            // Get data point definitions for this integration
            const dataPoints = await select('data_point_definitions', '*', { user_integration_id: integration.id });

            if (!dataPoints?.length) {
              continue;
            }

            for (const dataPoint of dataPoints) {
              // Check if this data point has data
              const dataRecords = await select('integration_data', 'id', { 
                user_integration_id: integration.id, 
                datapoint_definition_id: dataPoint.id 
              });

              const hasData = Boolean(dataRecords && dataRecords.length > 0);

              if (!hasData) {
                totalUnmapped++;
                unmappedDataPoints.push({
                  dataPointId: dataPoint.id,
                  dataPointName: dataPoint.data_point_name,
                  integrationName: integration.integration_name,
                  category: dataPoint.category || 'other',
                  businessValue: dataPoint.business_value || 'low',
                });
              }
            }
          } catch (error) {
            this.logger.warn(`Failed to process integration ${integration.id}:`, error);
          }
        }

        const result: UnmappedDataPoints = {
          unmappedDataPoints,
          totalUnmapped,
        };

        return { data: UnmappedDataPointsSchema.parse(result), error: null };
      } catch (error) {
        this.logger.error('Error getting unmapped data points:', error);
        return { data: null, error: 'Failed to get unmapped data points' };
      }
    }, `get unmapped data points for user ${userId}`);
  }

  /**
   * Get mapping statistics for a user
   */
  async getMappingStatistics(userId: string): Promise<ServiceResponse<{
    totalDataPoints: number;
    mappedDataPoints: number;
    unmappedDataPoints: number;
    coveragePercentage: number;
    highValueCoverage: number;
    mediumValueCoverage: number;
    lowValueCoverage: number;
  }>> {
    return this.executeDbOperation(async () => {
      try {
        const reportResult = await this.generateMappingReport(userId);
        if (reportResult.error || !reportResult.data) {
          return { data: null, error: reportResult.error || 'Failed to generate mapping report' };
        }

        const report = reportResult.data;
        const totalDataPoints = report.totalDataPoints;
        const mappedDataPoints = report.dataPointsWithData;
        const unmappedDataPoints = report.dataPointsWithoutData;
        const coveragePercentage = report.coveragePercentage;

        // Calculate coverage by business value
        const highValueCoverage = report.highValueDataPoints > 0 
          ? (report.highValueDataPoints / totalDataPoints) * 100 
          : 0;
        const mediumValueCoverage = report.mediumValueDataPoints > 0 
          ? (report.mediumValueDataPoints / totalDataPoints) * 100 
          : 0;
        const lowValueCoverage = report.lowValueDataPoints > 0 
          ? (report.lowValueDataPoints / totalDataPoints) * 100 
          : 0;

        return {
          data: {
            totalDataPoints,
            mappedDataPoints,
            unmappedDataPoints,
            coveragePercentage,
            highValueCoverage,
            mediumValueCoverage,
            lowValueCoverage,
          },
          error: null,
        };
      } catch (error) {
        this.logger.error('Error getting mapping statistics:', error);
        return { data: null, error: 'Failed to get mapping statistics' };
      }
    }, `get mapping statistics for user ${userId}`);
  }

  /**
   * Validate data point mapping
   */
  async validateDataPointMapping(
    userIntegrationId: string,
    dataPointDefinitionId: string
  ): Promise<ServiceResponse<{
    isValid: boolean;
    hasData: boolean;
    dataCount: number;
    lastUpdate: string | null;
    issues: string[];
  }>> {
    return this.executeDbOperation(async () => {
      try {
        // Check if data point definition exists
        const dataPoint = await selectOne('data_point_definitions', '*', { id: dataPointDefinitionId });
        if (!dataPoint) {
          return { 
            data: { 
              isValid: false, 
              hasData: false, 
              dataCount: 0, 
              lastUpdate: null, 
              issues: ['Data point definition not found'] 
            }, 
            error: null 
          };
        }

        // Check if data exists
        const dataRecords = await select('integration_data', 'id, created_at', { 
          user_integration_id: userIntegrationId, 
          datapoint_definition_id: dataPointDefinitionId 
        });

        const hasData = Boolean(dataRecords && dataRecords.length > 0);
        const dataCount = dataRecords?.length || 0;
        const lastUpdate = dataRecords && dataRecords.length > 0 
          ? dataRecords[0].created_at : null;

        const issues: string[] = [];
        if (!hasData) {
          issues.push('No data records found for this data point');
        }

        if (dataPoint.is_required && !hasData) {
          issues.push('Required data point has no data');
        }

        const isValid = issues.length === 0;

        return {
          data: {
            isValid,
            hasData,
            dataCount,
            lastUpdate,
            issues,
          },
          error: null,
        };
      } catch (error) {
        this.logger.error('Error validating data point mapping:', error);
        return { data: null, error: 'Failed to validate data point mapping' };
      }
    }, `validate data point mapping for integration ${userIntegrationId}, data point ${dataPointDefinitionId}`);
  }
} 
