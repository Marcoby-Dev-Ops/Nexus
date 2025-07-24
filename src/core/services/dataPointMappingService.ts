/**
 * Data Point Mapping Service
 * Ensures all data points in dictionaries have proper database landing spots
 */

import { databaseService } from './DatabaseService';
import { logger } from '@/shared/utils/logger';

export interface DataPointMapping {
  dataPointId: string;
  dataPointName: string;
  category: string;
  businessValue: 'high' | 'medium' | 'low';
  hasData: boolean;
  dataCount: number;
  lastUpdate: string | null;
  integrationName: string;
  integrationStatus: string;
}

export interface MappingReport {
  totalDataPoints: number;
  dataPointsWithData: number;
  dataPointsWithoutData: number;
  coveragePercentage: number;
  highValueDataPoints: number;
  mediumValueDataPoints: number;
  lowValueDataPoints: number;
  issues: string[];
  mappings: DataPointMapping[];
}

export class DataPointMappingService {
  private static instance: DataPointMappingService;

  private constructor() {}

  static getInstance(): DataPointMappingService {
    if (!DataPointMappingService.instance) {
      DataPointMappingService.instance = new DataPointMappingService();
    }
    return DataPointMappingService.instance;
  }

  /**
   * Generate a comprehensive mapping report for a user
   */
  async generateMappingReport(userId: string): Promise<MappingReport> {
    try {
      // Get all user integrations
      const { data: userIntegrations } = await databaseService.select(
        'user_integrations',
        '*',
        { userid: userId },
        { retries: 2 }
      );

      if (!userIntegrations?.length) {
        return {
          totalDataPoints: 0,
          dataPointsWithData: 0,
          dataPointsWithoutData: 0,
          coveragePercentage: 0,
          highValueDataPoints: 0,
          mediumValueDataPoints: 0,
          lowValueDataPoints: 0,
          issues: ['No integrations found'],
          mappings: []
        };
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
          const { data: dataPoints } = await databaseService.select(
            'data_point_definitions',
            '*',
            { userintegration_id: integration.id },
            { retries: 2 }
          );

          if (!dataPoints?.length) {
            issues.push(`No data points found for integration: ${integration.integration_name}`);
            continue;
          }

          for (const dataPoint of dataPoints) {
            totalDataPoints++;

            // Check if this data point has data
            const { data: dataRecords } = await databaseService.select(
              'integration_data',
              'id, created_at',
              { 
                userintegration_id: integration.id,
                datapoint_definition_id: dataPoint.id 
              },
              { retries: 2 }
            );

            const hasData = Boolean(dataRecords && dataRecords.length > 0);
            const dataCount = dataRecords?.length || 0;
            const lastUpdate = dataRecords && dataRecords.length > 0 
              ? dataRecords[0].created_at: null;

            if (hasData) {
              dataPointsWithData++;
            } else {
              issues.push(`Data point "${dataPoint.data_point_name}" has no data records`);
            }

            // Count by business value
            switch (dataPoint.business_value) {
              case 'high':
                highValueDataPoints++;
                break;
              case 'medium':
                mediumValueDataPoints++;
                break;
              case 'low':
                lowValueDataPoints++;
                break;
            }

            mappings.push({
              dataPointId: dataPoint.id,
              dataPointName: dataPoint.data_point_name,
              category: dataPoint.category,
              businessValue: dataPoint.business_value,
              hasData,
              dataCount,
              lastUpdate,
              integrationName: integration.integration_name || 'Unknown',
              integrationStatus: integration.status || 'unknown'
            });
          }
        } catch (error) {
          issues.push(`Error processing integration ${integration.integration_name}: ${error}`);
        }
      }

      const coveragePercentage = totalDataPoints > 0 
        ? (dataPointsWithData / totalDataPoints) * 100: 0;

      return {
        totalDataPoints,
        dataPointsWithData,
        dataPointsWithoutData: totalDataPoints - dataPointsWithData,
        coveragePercentage: Math.round(coveragePercentage * 100) / 100,
        highValueDataPoints,
        mediumValueDataPoints,
        lowValueDataPoints,
        issues,
        mappings
      };
    } catch (error) {
      logger.error('Error generating mapping report', { error, userId });
      throw error;
    }
  }

  /**
   * Ensure a specific data point has data
   */
  async ensureDataPointHasData(
    userIntegrationId: string,
    dataPointDefinitionId: string,
    sampleData: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if data already exists
      const { data: existingData } = await databaseService.select(
        'integration_data',
        'id',
        { 
          userintegration_id: userIntegrationId,
          datapoint_definition_id: dataPointDefinitionId 
        },
        { limit: 1 }
      );

      if (existingData && existingData.length > 0) {
        return { success: true };
      }

      // Get the data point definition
      const { data: dataPoints } = await databaseService.select(
        'data_point_definitions',
        '*',
        { id: dataPointDefinitionId },
        { retries: 2 }
      );

      if (!dataPoints || dataPoints.length === 0) {
        return { 
          success: false, 
          error: `Data point definition not found: ${dataPointDefinitionId}` 
        };
      }

      const dataPoint = dataPoints[0];

      // Insert sample data
      const { error } = await databaseService.insert(
        'integration_data',
        {
          userintegration_id: userIntegrationId,
          datatype: dataPoint.data_point_name,
          rawdata: sampleData,
          processeddata: sampleData,
          datapoint_definition_id: dataPoint.id,
          datacategory: dataPoint.category,
          businessvalue: dataPoint.business_value,
          refreshfrequency: dataPoint.refresh_frequency,
          isrequired: dataPoint.is_required,
          validationrules: dataPoint.validation_rules,
          samplevalue: dataPoint.sample_value
        },
        { retries: 2 }
      );

      if (error) throw error;

      return { success: true };
    } catch (error) {
      logger.error('Error ensuring data point has data', { 
        error, 
        userIntegrationId, 
        dataPointDefinitionId 
      });
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get unmapped data points for a user
   */
  async getUnmappedDataPoints(userId: string): Promise<{
    unmappedDataPoints: Array<{
      dataPointId: string;
      dataPointName: string;
      integrationName: string;
      category: string;
      businessValue: string;
    }>;
    totalUnmapped: number;
  }> {
    try {
      const report = await this.generateMappingReport(userId);
      
      const unmappedDataPoints = report.mappings
        .filter(mapping => !mapping.hasData)
        .map(mapping => ({
          dataPointId: mapping.dataPointId,
          dataPointName: mapping.dataPointName,
          integrationName: mapping.integrationName,
          category: mapping.category,
          businessValue: mapping.businessValue
        }));

      return {
        unmappedDataPoints,
        totalUnmapped: unmappedDataPoints.length
      };
    } catch (error) {
      logger.error('Error getting unmapped data points', { error, userId });
      throw error;
    }
  }
}

export const dataPointMappingService = DataPointMappingService.getInstance(); 