/**
 * Data Point Dictionary Service
 * Provides comprehensive cataloging of data points from integration API endpoints
 * Now integrated with API discovery tools and data storage/analysis
 */

import { databaseService } from './DatabaseService';
import { APIDocAnalyzer } from '@/domains/integrations/lib/apiDocAnalyzer';
import { logger } from '@/shared/utils/logger';

// Core data point types
export interface DataPointDefinition {
  id: string;
  userIntegrationId: string;
  endpointPath: string;
  endpointMethod: string;
  dataPointName: string;
  dataPointType: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array';
  description: string;
  category: DataPointCategory;
  businessValue: 'high' | 'medium' | 'low';
  refreshFrequency: 'real-time' | 'hourly' | 'daily' | 'weekly' | 'monthly';
  isRequired: boolean;
  sampleValue: any;
  validationRules?: string[];
  createdAt: string;
  updatedAt: string;
}

export type DataPointCategory = 
  | 'customer' | 'financial' | 'operational' | 'marketing' | 'sales'
  | 'support' | 'analytics' | 'communication' | 'document' | 'task'
  | 'project' | 'inventory' | 'hr' | 'legal' | 'other';

export interface DataPointUsage {
  id: string;
  dataPointDefinitionId: string;
  userId: string;
  lastAccessedAt: string;
  accessCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DataPointDiscoveryLog {
  id: string;
  userIntegrationId: string;
  discoveryMethod: 'api_scan' | 'manual_entry' | 'ai_discovery' | 'user_import';
  endpointsScanned: number;
  dataPointsFound: number;
  newDataPoints: number;
  discoveryStatus: 'running' | 'completed' | 'failed' | 'partial';
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
}

export interface DataPointSummary {
  totalDataPoints: number;
  categories: Record<DataPointCategory, number>;
  businessValueBreakdown: Record<'high' | 'medium' | 'low', number>;
  mostUsedDataPoints: DataPointDefinition[];
  recentlyDiscovered: DataPointDefinition[];
}

// New interfaces for data storage and analysis
export interface IntegrationDataRecord {
  id: string;
  userIntegrationId: string;
  dataPointDefinitionId: string;
  externalId?: string;
  dataValue: any;
  rawData?: any;
  metadata?: any;
  syncStatus: 'synced' | 'pending' | 'error' | 'outdated';
  lastSyncedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface DataAnalysisResult {
  id: string;
  userIntegrationId: string;
  analysisType: 'trend' | 'anomaly' | 'correlation' | 'prediction' | 'insight';
  dataPointDefinitionId?: string;
  analysisData: any;
  confidenceScore?: number;
  insights?: string[];
  recommendations?: string[];
  createdAt: string;
}

export interface DataEnhancementRule {
  id: string;
  userIntegrationId: string;
  ruleName: string;
  ruleType: 'transformation' | 'enrichment' | 'validation' | 'aggregation';
  ruleDefinition: any;
  isActive: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export interface APIDiscoveryCache {
  id: string;
  userIntegrationId: string;
  endpointPath: string;
  endpointMethod: string;
  responseSchema?: any;
  sampleData?: any;
  lastDiscoveredAt: string;
  discoveryStatus: 'discovered' | 'analyzed' | 'mapped' | 'error';
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

class DataPointDictionaryService {
  private apiDocAnalyzer = new APIDocAnalyzer();

  /**
   * Discover data points from an integration's API endpoints using API discovery tools
   */
  async discoverDataPoints(userIntegrationId: string): Promise<DataPointDiscoveryLog> {
    // Ensure session is valid before making the request
    const { sessionUtils } = await import('@/core/supabase');
    const hasValidSession = await sessionUtils.ensureSession();
    
    if (!hasValidSession) {
      throw new Error('No valid session available. Please log in again.');
    }

    const { data: userIntegration } = await databaseService.select(
      'user_integrations',
      '*',
      { id: userIntegrationId },
      { retries: 2 }
    );

    if (!userIntegration) {
      throw new Error('User integration not found');
    }

    // Create discovery log entry
    const discoveryLog: Omit<DataPointDiscoveryLog, 'id' | 'createdAt'> = {
      userIntegrationId,
      discoveryMethod: 'api_scan',
      endpointsScanned: 0,
      dataPointsFound: 0,
      newDataPoints: 0,
      discoveryStatus: 'running'
    };

    const { data: logEntry } = await databaseService.insert(
      'data_point_discovery_log',
      discoveryLog,
      { retries: 2 }
    );

    try {
      // Check if we have cached API discovery data
      const cachedEndpoints = await this.getCachedAPIDiscovery(userIntegrationId);
      
      if (cachedEndpoints.length > 0) {
        // Use cached discovery data
        return await this.processCachedDiscovery(cachedEndpoints, userIntegrationId, logEntry);
      } else {
        // Perform fresh API discovery
        return await this.performFreshAPIDiscovery(userIntegration, logEntry);
      }

    } catch (error) {
      // Update discovery log with error
      await databaseService.update(
        'data_point_discovery_log',
        {
          discoveryStatus: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date().toISOString()
        },
        { id: logEntry.id },
        { retries: 2 }
      );

      throw error;
    }
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
  ): Promise<IntegrationDataRecord> {
    // Ensure session is valid before making the request
    const { sessionUtils } = await import('@/core/supabase');
    const hasValidSession = await sessionUtils.ensureSession();
    
    if (!hasValidSession) {
      throw new Error('No valid session available. Please log in again.');
    }

    const { data: record, error } = await databaseService.insert(
      'integration_data_records',
      {
        userintegration_id: userIntegrationId,
        datapoint_definition_id: dataPointDefinitionId,
        externalid: externalId,
        datavalue: data,
        rawdata: data,
        metadata,
        syncstatus: 'synced'
      },
      { retries: 2 }
    );

    if (error) throw error;
    return this.mapIntegrationDataRecordFromDB(record);
  }

  /**
   * Get integration data for analysis
   */
  async getIntegrationData(
    userIntegrationId: string,
    dataPointDefinitionId?: string,
    limit: number = 100
  ): Promise<IntegrationDataRecord[]> {
    // Ensure session is valid before making the request
    const { sessionUtils } = await import('@/core/supabase');
    const hasValidSession = await sessionUtils.ensureSession();
    
    if (!hasValidSession) {
      throw new Error('No valid session available. Please log in again.');
    }

    const { data, error } = await databaseService.select(
      'integration_data_records',
      '*',
      { 
        userintegration_id: userIntegrationId,
        ...(dataPointDefinitionId && { datapoint_definition_id: dataPointDefinitionId })
      },
      { orderBy: 'created_at', ascending: false, limit }
    );
    if (error) throw error;
    
    return (data || []).map(record => this.mapIntegrationDataRecordFromDB(record));
  }

  /**
   * Analyze integration data for insights
   */
  async analyzeIntegrationData(
    userIntegrationId: string,
    dataPointDefinitionId?: string
  ): Promise<DataAnalysisResult[]> {
    const data = await this.getIntegrationData(userIntegrationId, dataPointDefinitionId);
    
    if (data.length === 0) {
      return [];
    }

    const analysisResults: DataAnalysisResult[] = [];

    // Perform trend analysis
    const trendAnalysis = await this.performTrendAnalysis(data);
    if (trendAnalysis) {
      analysisResults.push(trendAnalysis);
    }

    // Perform anomaly detection
    const anomalyAnalysis = await this.performAnomalyDetection(data);
    if (anomalyAnalysis) {
      analysisResults.push(anomalyAnalysis);
    }

    // Perform correlation analysis
    const correlationAnalysis = await this.performCorrelationAnalysis(data);
    if (correlationAnalysis) {
      analysisResults.push(correlationAnalysis);
    }

    // Store analysis results
    for (const result of analysisResults) {
      await this.storeAnalysisResult(result);
    }

    return analysisResults;
  }

  /**
   * Create data enhancement rule
   */
  async createEnhancementRule(rule: Omit<DataEnhancementRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<DataEnhancementRule> {
    // Ensure session is valid before making the request
    const { sessionUtils } = await import('@/core/supabase');
    const hasValidSession = await sessionUtils.ensureSession();
    
    if (!hasValidSession) {
      throw new Error('No valid session available. Please log in again.');
    }

    const { data, error } = await databaseService.insert(
      'data_enhancement_rules',
      {
        userintegration_id: rule.userIntegrationId,
        rulename: rule.ruleName,
        ruletype: rule.ruleType,
        ruledefinition: rule.ruleDefinition,
        isactive: rule.isActive,
        priority: rule.priority
      },
      { retries: 2 }
    );

    if (error) throw error;
    return this.mapEnhancementRuleFromDB(data);
  }

  /**
   * Apply enhancement rules to data
   */
  async applyEnhancementRules(
    userIntegrationId: string,
    data: IntegrationDataRecord[]
  ): Promise<IntegrationDataRecord[]> {
    // Ensure session is valid before making the request
    const { sessionUtils } = await import('@/core/supabase');
    const hasValidSession = await sessionUtils.ensureSession();
    
    if (!hasValidSession) {
      throw new Error('No valid session available. Please log in again.');
    }

    const { data: rules } = await databaseService.select(
      'data_enhancement_rules',
      '*',
      { userintegration_id: userIntegrationId, isactive: true },
      { orderBy: 'priority', ascending: false }
    );

    if (!rules?.length) return data;

    return data.map(record => {
      let enhancedRecord = { ...record };
      
      for (const rule of rules) {
        enhancedRecord = this.applyEnhancementRule(enhancedRecord, rule);
      }
      
      return enhancedRecord;
    });
  }

  /**
   * Get all data points for a user integration
   */
  async getDataPoints(userIntegrationId: string): Promise<DataPointDefinition[]> {
    const { data, error } = await databaseService.select(
      'data_point_definitions',
      '*',
      { userintegration_id: userIntegrationId },
      { retries: 2 }
    );

    if (error) throw error;
    return (data || []).map(record => this.mapFromDatabase(record));
  }

  /**
   * Get data point by name for a specific integration
   */
  async getDataPointByName(dataPointName: string, userIntegrationId: string): Promise<DataPointDefinition | null> {
    // Ensure session is valid before making the request
    const { sessionUtils } = await import('@/core/supabase');
    const hasValidSession = await sessionUtils.ensureSession();
    
    if (!hasValidSession) {
      throw new Error('No valid session available. Please log in again.');
    }

    const { data, error } = await databaseService.select(
      'data_point_definitions',
      '*',
      { datapoint_name: dataPointName, userintegration_id: userIntegrationId },
      { retries: 2 }
    );

    if (error && error.code !== 'PGRST116') throw error;
    return data ? this.mapFromDatabase(data) : null;
  }

  /**
   * Create a new data point definition
   */
  async createDataPoint(dataPoint: Omit<DataPointDefinition, 'id' | 'createdAt' | 'updatedAt'>): Promise<DataPointDefinition> {
    // Ensure session is valid before making the request
    const { sessionUtils } = await import('@/core/supabase');
    const hasValidSession = await sessionUtils.ensureSession();
    
    if (!hasValidSession) {
      throw new Error('No valid session available. Please log in again.');
    }

    const { data, error } = await databaseService.insert(
      'data_point_definitions',
      {
        id: `${dataPoint.userIntegrationId}_${dataPoint.dataPointName}`,
        userintegration_id: dataPoint.userIntegrationId,
        endpointpath: dataPoint.endpointPath,
        endpointmethod: dataPoint.endpointMethod,
        datapoint_name: dataPoint.dataPointName,
        datapoint_type: dataPoint.dataPointType,
        description: dataPoint.description,
        category: dataPoint.category,
        businessvalue: dataPoint.businessValue,
        refreshfrequency: dataPoint.refreshFrequency,
        isrequired: dataPoint.isRequired,
        samplevalue: dataPoint.sampleValue,
        validationrules: dataPoint.validationRules
      },
      { retries: 2 }
    );

    if (error) throw error;
    return this.mapFromDatabase(data);
  }

  /**
   * Get data point summary for a user
   */
  async getDataPointSummary(userId: string): Promise<DataPointSummary> {
    // Ensure session is valid before making the request
    const { sessionUtils } = await import('@/core/supabase');
    const hasValidSession = await sessionUtils.ensureSession();
    
    if (!hasValidSession) {
      throw new Error('No valid session available. Please log in again.');
    }

    // Get all user integrations
    const { data: userIntegrations } = await databaseService.select(
      'user_integrations',
      'id',
      { userid: userId },
      { retries: 2 }
    );

    if (!userIntegrations?.length) {
      return {
        totalDataPoints: 0,
        categories: {} as Record<DataPointCategory, number>,
        businessValueBreakdown: { high: 0, medium: 0, low: 0 },
        mostUsedDataPoints: [],
        recentlyDiscovered: []
      };
    }

    const integrationIds = userIntegrations.map(ui => ui.id);

    // Get all data points for user's integrations
    const { data: dataPoints } = await databaseService.select(
      'data_point_definitions',
      '*',
      { userintegration_id: { in: integrationIds } },
      { retries: 2 }
    );

    if (!dataPoints?.length) {
      return {
        totalDataPoints: 0,
        categories: {} as Record<DataPointCategory, number>,
        businessValueBreakdown: { high: 0, medium: 0, low: 0 },
        mostUsedDataPoints: [],
        recentlyDiscovered: []
      };
    }

    // Calculate summary
    const categories: Record<DataPointCategory, number> = {} as Record<DataPointCategory, number>;
    const businessValueBreakdown = { high: 0, medium: 0, low: 0 };

    dataPoints.forEach(dp => {
      const category = dp.category as DataPointCategory;
      const businessValue = dp.business_value as 'high' | 'medium' | 'low';
      
      categories[category] = (categories[category] || 0) + 1;
      businessValueBreakdown[businessValue]++;
    });

    // Get most used data points (by access count)
    const { data: usageData } = await databaseService.select(
      'data_point_usage',
      'data_point_definition_id, access_count',
      { userid: userId },
      { orderBy: 'access_count', ascending: false, limit: 10 }
    );

    const mostUsedDataPoints = usageData?.map(usage => 
      dataPoints.find(dp => dp.id === usage.data_point_definition_id)
    ).filter(Boolean).map(dp => this.mapFromDatabase(dp)) || [];

    // Get recently discovered data points
    const recentlyDiscovered = dataPoints
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
      .map(dp => this.mapFromDatabase(dp));

    return {
      totalDataPoints: dataPoints.length,
      categories,
      businessValueBreakdown,
      mostUsedDataPoints,
      recentlyDiscovered
    };
  }

  /**
   * Track data point usage
   */
  async trackUsage(dataPointDefinitionId: string, userId: string): Promise<void> {
    // Ensure session is valid before making the request
    const { sessionUtils } = await import('@/core/supabase');
    const hasValidSession = await sessionUtils.ensureSession();
    
    if (!hasValidSession) {
      throw new Error('No valid session available. Please log in again.');
    }

    // Check if usage record exists
    const { data: existing } = await databaseService.select(
      'data_point_usage',
      '*',
      { datapoint_definition_id: dataPointDefinitionId, userid: userId },
      { retries: 2 }
    );

    if (existing && existing.length > 0) {
      // Update existing record
      await databaseService.update(
        'data_point_usage',
        {
          accesscount: existing[0].access_count + 1,
          lastaccessed_at: new Date().toISOString()
        },
        { id: existing[0].id },
        { retries: 2 }
      );
    } else {
      // Create new record
      await databaseService.insert(
        'data_point_usage',
        {
          datapoint_definition_id: dataPointDefinitionId,
          userid: userId,
          accesscount: 1
        },
        { retries: 2 }
      );
    }
  }

  /**
   * Ensure all data points have proper database landing spots
   * This method validates that every data point definition has a corresponding
   * storage location in the integration_data table
   */
  async ensureDataPointLandingSpots(userIntegrationId: string): Promise<{
    totalDataPoints: number;
    mappedDataPoints: number;
    unmappedDataPoints: number;
    issues: string[];
  }> {
    try {
      // Get all data point definitions for this integration
      const dataPoints = await this.getDataPoints(userIntegrationId);
      
      if (!dataPoints.length) {
        return {
          totalDataPoints: 0,
          mappedDataPoints: 0,
          unmappedDataPoints: 0,
          issues: ['No data points found for this integration']
        };
      }

      const issues: string[] = [];
      let mappedCount = 0;
      let unmappedCount = 0;

      for (const dataPoint of dataPoints) {
        try {
          // Check if this data point has any data records
          const { data: existingData } = await databaseService.select(
            'integration_data',
            'id',
            { 
              userintegration_id: userIntegrationId,
              datapoint_definition_id: dataPoint.id 
            },
            { limit: 1 }
          );

          if (existingData && existingData.length > 0) {
            mappedCount++;
          } else {
            unmappedCount++;
            issues.push(`Data point "${dataPoint.dataPointName}" has no data records`);
          }
        } catch (error) {
          unmappedCount++;
          issues.push(`Error checking data point "${dataPoint.dataPointName}": ${error}`);
        }
      }

      return {
        totalDataPoints: dataPoints.length,
        mappedDataPoints: mappedCount,
        unmappedDataPoints: unmappedCount,
        issues
      };
    } catch (error) {
      logger.error('Error ensuring data point landing spots', { error, userIntegrationId });
      throw error;
    }
  }

  /**
   * Create a comprehensive data point mapping report
   */
  async generateDataPointMappingReport(userId: string): Promise<{
    integrations: Array<{
      id: string;
      name: string;
      status: string;
      dataPoints: Array<{
        id: string;
        name: string;
        category: string;
        businessValue: string;
        hasData: boolean;
        dataCount: number;
        lastUpdate: string | null;
      }>;
      summary: {
        totalDataPoints: number;
        dataPointsWithData: number;
        dataPointsWithoutData: number;
        highValueDataPoints: number;
        mediumValueDataPoints: number;
        lowValueDataPoints: number;
      };
    }>;
    overallSummary: {
      totalIntegrations: number;
      totalDataPoints: number;
      totalDataRecords: number;
      dataCoveragePercentage: number;
    };
  }> {
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
          integrations: [],
          overallSummary: {
            totalIntegrations: 0,
            totalDataPoints: 0,
            totalDataRecords: 0,
            dataCoveragePercentage: 0
          }
        };
      }

      const integrations = [];
      let totalDataPoints = 0;
      let totalDataRecords = 0;

      for (const integration of userIntegrations) {
        // Get data points for this integration
        const dataPoints = await this.getDataPoints(integration.id);
        
        const dataPointDetails = await Promise.all(
          dataPoints.map(async (dataPoint) => {
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

            totalDataRecords += dataCount;

            return {
              id: dataPoint.id,
              name: dataPoint.dataPointName,
              category: dataPoint.category as string,
              businessValue: dataPoint.businessValue as string,
              hasData,
              dataCount,
              lastUpdate
            };
          })
        );

        // Calculate summary for this integration
        const dataPointsWithData = dataPointDetails.filter(dp => dp.hasData).length;
        const highValueDataPoints = dataPointDetails.filter(dp => dp.businessValue === 'high').length;
        const mediumValueDataPoints = dataPointDetails.filter(dp => dp.businessValue === 'medium').length;
        const lowValueDataPoints = dataPointDetails.filter(dp => dp.businessValue === 'low').length;

        integrations.push({
          id: integration.id,
          name: integration.integration_name || 'Unknown Integration',
          status: integration.status || 'unknown',
          dataPoints: dataPointDetails,
          summary: {
            totalDataPoints: dataPoints.length,
            dataPointsWithData,
            dataPointsWithoutData: dataPoints.length - dataPointsWithData,
            highValueDataPoints,
            mediumValueDataPoints,
            lowValueDataPoints
          }
        });

        totalDataPoints += dataPoints.length;
      }

      const dataCoveragePercentage = totalDataPoints > 0 
        ? (totalDataRecords / totalDataPoints) * 100: 0;

      return {
        integrations,
        overallSummary: {
          totalIntegrations: integrations.length,
          totalDataPoints,
          totalDataRecords,
          dataCoveragePercentage: Math.round(dataCoveragePercentage * 100) / 100
        }
      };
    } catch (error) {
      logger.error('Error generating data point mapping report', { error, userId });
      throw error;
    }
  }

  /**
   * Store data for a specific data point with proper mapping
   */
  async storeDataPointData(
    userIntegrationId: string,
    dataPointDefinitionId: string,
    data: any,
    externalId?: string,
    _metadata?: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // First, get the data point definition to ensure it exists
      const dataPoint = await this.getDataPointByName(dataPointDefinitionId, userIntegrationId);
      
      if (!dataPoint) {
        throw new Error(`Data point definition not found: ${dataPointDefinitionId}`);
      }

      // Store the data with proper mapping
      const { error } = await databaseService.insert(
        'integration_data',
        {
          userintegration_id: userIntegrationId,
          datatype: dataPoint.dataPointName,
          externalid: externalId,
          rawdata: data,
          processeddata: data,
          datapoint_definition_id: dataPoint.id,
          datacategory: dataPoint.category,
          businessvalue: dataPoint.businessValue,
          refreshfrequency: dataPoint.refreshFrequency,
          isrequired: dataPoint.isRequired,
          validationrules: dataPoint.validationRules,
          samplevalue: dataPoint.sampleValue
        },
        { retries: 2 }
      );

      if (error) throw error;

      return { success: true };
    } catch (error) {
      logger.error('Error storing data point data', { 
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

  // Private helper methods

  /**
   * Get cached API discovery data
   */
  private async getCachedAPIDiscovery(userIntegrationId: string): Promise<APIDiscoveryCache[]> {
    // Ensure session is valid before making the request
    const { sessionUtils } = await import('@/core/supabase');
    const hasValidSession = await sessionUtils.ensureSession();
    
    if (!hasValidSession) {
      throw new Error('No valid session available. Please log in again.');
    }

    const { data, error } = await databaseService.select(
      'api_discovery_cache',
      '*',
      { userintegration_id: userIntegrationId, discoverystatus: 'analyzed' },
      { retries: 2 }
    );

    if (error) throw error;
    return (data || []).map(this.mapAPIDiscoveryCacheFromDB);
  }

  /**
   * Process cached discovery data
   */
  private async processCachedDiscovery(
    cachedEndpoints: APIDiscoveryCache[],
    userIntegrationId: string,
    logEntry: any
  ): Promise<DataPointDiscoveryLog> {
    let totalDataPoints = 0;
    let newDataPoints = 0;

    for (const endpoint of cachedEndpoints) {
      const dataPoints = await this.extractDataPointsFromSchema(
        endpoint.responseSchema,
        endpoint.endpointPath,
        endpoint.endpointMethod
      );

      for (const dataPoint of dataPoints) {
        totalDataPoints++;
        
        // Check if data point already exists
        const existing = await this.getDataPointByName(dataPoint.dataPointName, userIntegrationId);
        if (!existing) {
          await this.createDataPoint({
            ...dataPoint,
            userIntegrationId
          });
          newDataPoints++;
        }
      }
    }

    // Update discovery log
    await databaseService.update(
      'data_point_discovery_log',
      {
        endpointsScanned: cachedEndpoints.length,
        dataPointsFound: totalDataPoints,
        newDataPoints,
        discoveryStatus: 'completed',
        completedAt: new Date().toISOString()
      },
      { id: logEntry.id },
      { retries: 2 }
    );

    return {
      ...logEntry,
      endpointsScanned: cachedEndpoints.length,
      dataPointsFound: totalDataPoints,
      newDataPoints,
      discoveryStatus: 'completed' as const,
      completedAt: new Date().toISOString()
    };
  }

  /**
   * Perform fresh API discovery
   */
  private async performFreshAPIDiscovery(
    userIntegration: any,
    logEntry: any
  ): Promise<DataPointDiscoveryLog> {
    // Get integration-specific endpoints based on integration type
    const endpoints = await this.getIntegrationEndpoints(userIntegration.integration_type);
    
    let totalEndpoints = 0;
    let totalDataPoints = 0;
    let newDataPoints = 0;

    for (const endpoint of endpoints) {
      totalEndpoints++;
      
      try {
        // Simulate API call to discover data points
        const dataPoints = await this.analyzeEndpointForDataPoints(endpoint, userIntegration);
        
        // Cache the discovery result
        await this.cacheAPIDiscovery(userIntegration.id, endpoint, dataPoints);
        
        for (const dataPoint of dataPoints) {
          totalDataPoints++;
          
          // Check if data point already exists
          const existing = await this.getDataPointByName(dataPoint.dataPointName, userIntegration.id);
          if (!existing) {
            await this.createDataPoint({
              ...dataPoint,
              userIntegrationId: userIntegration.id
            });
            newDataPoints++;
          }
        }
      } catch (error) {
        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error(`Error analyzing endpoint ${endpoint.path}:`, error);
      }
    }

    // Update discovery log
    await databaseService.update(
      'data_point_discovery_log',
      {
        endpointsScanned: totalEndpoints,
        dataPointsFound: totalDataPoints,
        newDataPoints,
        discoveryStatus: 'completed',
        completedAt: new Date().toISOString()
      },
      { id: logEntry.id },
      { retries: 2 }
    );

    return {
      ...logEntry,
      endpointsScanned: totalEndpoints,
      dataPointsFound: totalDataPoints,
      newDataPoints,
      discoveryStatus: 'completed' as const,
      completedAt: new Date().toISOString()
    };
  }

  /**
   * Cache API discovery results
   */
  private async cacheAPIDiscovery(
    userIntegrationId: string,
    endpoint: { path: string; method: string },
    dataPoints: any[]
  ): Promise<void> {
    // Ensure session is valid before making the request
    const { sessionUtils } = await import('@/core/supabase');
    const hasValidSession = await sessionUtils.ensureSession();
    
    if (!hasValidSession) {
      throw new Error('No valid session available. Please log in again.');
    }

    await databaseService.upsert(
      'api_discovery_cache',
      {
        userintegration_id: userIntegrationId,
        endpointpath: endpoint.path,
        endpointmethod: endpoint.method,
        responseschema: { dataPoints },
        discoverystatus: 'analyzed',
        lastdiscovered_at: new Date().toISOString()
      },
      {
        onConflict: ['user_integration_id', 'endpoint_path', 'endpoint_method']
      },
      { retries: 2 }
    );
  }

  /**
   * Extract data points from API schema
   */
  private async extractDataPointsFromSchema(
    schema: any,
    path: string,
    method: string
  ): Promise<Omit<DataPointDefinition, 'id' | 'userIntegrationId' | 'createdAt' | 'updatedAt'>[]> {
    const dataPoints: Omit<DataPointDefinition, 'id' | 'userIntegrationId' | 'createdAt' | 'updatedAt'>[] = [];
    
    if (!schema || !schema.dataPoints) return dataPoints;

    for (const dataPoint of schema.dataPoints) {
      dataPoints.push({
        endpointPath: path,
        endpointMethod: method,
        dataPointName: dataPoint.name,
        dataPointType: dataPoint.type,
        description: dataPoint.description,
        category: this.categorizeDataPoint(dataPoint.name, path),
        businessValue: this.assessBusinessValue(path, dataPoint.name),
        refreshFrequency: this.assessRefreshFrequency(path, method),
        isRequired: dataPoint.required || false,
        sampleValue: dataPoint.sampleValue
      });
    }

    return dataPoints;
  }

  /**
   * Perform trend analysis on data
   */
  private async performTrendAnalysis(data: IntegrationDataRecord[]): Promise<DataAnalysisResult | null> {
    if (data.length < 3) return null;

    // Simple trend analysis - in practice, you'd use more sophisticated algorithms
    const values = data.map(record => {
      const value = record.dataValue;
      return typeof value === 'number' ? value: null;
    }).filter(v => v !== null);

    if (values.length < 3) return null;

    const trend = this.calculateTrend(values);
    
    return {
      id: '',
      userIntegrationId: data[0].userIntegrationId,
      analysisType: 'trend',
      dataPointDefinitionId: data[0].dataPointDefinitionId,
      analysisData: { trend, values },
      confidenceScore: 0.8,
      insights: [`Data shows a ${trend > 0 ? 'positive' : 'negative'} trend`],
      recommendations: ['Monitor this trend for business impact'],
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Perform anomaly detection
   */
  private async performAnomalyDetection(data: IntegrationDataRecord[]): Promise<DataAnalysisResult | null> {
    if (data.length < 5) return null;

    const values = data.map(record => {
      const value = record.dataValue;
      return typeof value === 'number' ? value: null;
    }).filter(v => v !== null);

    if (values.length < 5) return null;

    const anomalies = this.detectAnomalies(values);
    
    if (anomalies.length === 0) return null;

    return {
      id: '',
      userIntegrationId: data[0].userIntegrationId,
      analysisType: 'anomaly',
      dataPointDefinitionId: data[0].dataPointDefinitionId,
      analysisData: { anomalies, values },
      confidenceScore: 0.7,
      insights: [`Found ${anomalies.length} anomalies in the data`],
      recommendations: ['Investigate these anomalies for potential issues'],
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Perform correlation analysis
   */
  private async performCorrelationAnalysis(_data: IntegrationDataRecord[]): Promise<DataAnalysisResult | null> {
    // This would require multiple data points to correlate
    // For now, return null as this is a placeholder
    return null;
  }

  /**
   * Store analysis result
   */
  private async storeAnalysisResult(result: Omit<DataAnalysisResult, 'id'>): Promise<void> {
    // Ensure session is valid before making the request
    const { sessionUtils } = await import('@/core/supabase');
    const hasValidSession = await sessionUtils.ensureSession();
    
    if (!hasValidSession) {
      throw new Error('No valid session available. Please log in again.');
    }

    await databaseService.insert(
      'data_analysis_results',
      {
        userintegration_id: result.userIntegrationId,
        analysistype: result.analysisType,
        datapoint_definition_id: result.dataPointDefinitionId,
        analysisdata: result.analysisData,
        confidencescore: result.confidenceScore,
        insights: result.insights,
        recommendations: result.recommendations
      },
      { retries: 2 }
    );
  }

  /**
   * Apply enhancement rule to data record
   */
  private applyEnhancementRule(
    record: IntegrationDataRecord,
    rule: any
  ): IntegrationDataRecord {
    // This is a simplified implementation
    // In practice, you'd have more sophisticated rule processing
    return record;
  }

  /**
   * Calculate trend from values
   */
  private calculateTrend(values: number[]): number {
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, index) => sum + (index * val), 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
  }

  /**
   * Detect anomalies using simple statistical methods
   */
  private detectAnomalies(values: number[]): number[] {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    const threshold = 2; // 2 standard deviations
    return values.filter(val => Math.abs(val - mean) > threshold * stdDev);
  }

  /**
   * Categorize data point based on name and path
   */
  private categorizeDataPoint(name: string, path: string): DataPointCategory {
    const nameLower = name.toLowerCase();
    const pathLower = path.toLowerCase();
    
    if (nameLower.includes('email') || nameLower.includes('contact') || pathLower.includes('contact')) {
      return 'customer';
    }
    if (nameLower.includes('amount') || nameLower.includes('revenue') || nameLower.includes('deal')) {
      return 'financial';
    }
    if (nameLower.includes('status') || nameLower.includes('performance')) {
      return 'operational';
    }
    if (nameLower.includes('campaign') || nameLower.includes('marketing')) {
      return 'marketing';
    }
    if (nameLower.includes('lead') || nameLower.includes('opportunity')) {
      return 'sales';
    }
    
    return 'other';
  }

  /**
   * Get integration-specific API endpoints
   */
  private async getIntegrationEndpoints(integrationType: string): Promise<Array<{ path: string; method: string }>> {
    // This would be populated with actual API endpoint mappings
    const endpointMappings: Record<string, Array<{ path: string; method: string }>> = {
      'hubspot': [
        { path: '/crm/v3/objects/contacts', method: 'GET' },
        { path: '/crm/v3/objects/companies', method: 'GET' },
        { path: '/crm/v3/objects/deals', method: 'GET' },
        { path: '/crm/v3/objects/tickets', method: 'GET' },
        { path: '/analytics/v3/analytics/contacts', method: 'GET' }
      ],
      'salesforce': [
        { path: '/services/data/v58.0/sobjects/Contact', method: 'GET' },
        { path: '/services/data/v58.0/sobjects/Account', method: 'GET' },
        { path: '/services/data/v58.0/sobjects/Opportunity', method: 'GET' },
        { path: '/services/data/v58.0/sobjects/Lead', method: 'GET' }
      ],
      'zapier': [
        { path: '/v1/triggers', method: 'GET' },
        { path: '/v1/actions', method: 'GET' },
        { path: '/v1/zaps', method: 'GET' }
      ]
    };

    return endpointMappings[integrationType] || [];
  }

  /**
   * Analyze an endpoint to discover data points
   */
  private async analyzeEndpointForDataPoints(
    endpoint: { path: string; method: string }, 
    userIntegration: any
  ): Promise<Omit<DataPointDefinition, 'id' | 'userIntegrationId' | 'createdAt' | 'updatedAt'>[]> {
    const dataPoints: Omit<DataPointDefinition, 'id' | 'userIntegrationId' | 'createdAt' | 'updatedAt'>[] = [];

    // This is a simplified analysis - in practice, you'd make actual API calls
    // and analyze the response structure to identify data points
    
    if (endpoint.path.includes('/contacts')) {
      dataPoints.push({
        endpointPath: endpoint.path,
        endpointMethod: endpoint.method,
        dataPointName: 'contact_email',
        dataPointType: 'string',
        description: 'Contact email address',
        category: 'customer',
        businessValue: 'high',
        refreshFrequency: 'daily',
        isRequired: true,
        sampleValue: 'john@example.com'
      });

      dataPoints.push({
        endpointPath: endpoint.path,
        endpointMethod: endpoint.method,
        dataPointName: 'contact_name',
        dataPointType: 'string',
        description: 'Contact full name',
        category: 'customer',
        businessValue: 'high',
        refreshFrequency: 'daily',
        isRequired: true,
        sampleValue: 'John Doe'
      });
    }

    if (endpoint.path.includes('/companies')) {
      dataPoints.push({
        endpointPath: endpoint.path,
        endpointMethod: endpoint.method,
        dataPointName: 'company_name',
        dataPointType: 'string',
        description: 'Company name',
        category: 'customer',
        businessValue: 'high',
        refreshFrequency: 'daily',
        isRequired: true,
        sampleValue: 'Acme Corp'
      });
    }

    if (endpoint.path.includes('/deals') || endpoint.path.includes('/opportunities')) {
      dataPoints.push({
        endpointPath: endpoint.path,
        endpointMethod: endpoint.method,
        dataPointName: 'deal_amount',
        dataPointType: 'number',
        description: 'Deal/opportunity amount',
        category: 'financial',
        businessValue: 'high',
        refreshFrequency: 'real-time',
        isRequired: true,
        sampleValue: 50000
      });
    }

    return dataPoints;
  }

  /**
   * Map database record to TypeScript interface
   */
  private mapFromDatabase(dbRecord: any): DataPointDefinition {
    return {
      id: dbRecord.id,
      userIntegrationId: dbRecord.user_integration_id,
      endpointPath: dbRecord.endpoint_path,
      endpointMethod: dbRecord.endpoint_method,
      dataPointName: dbRecord.data_point_name,
      dataPointType: dbRecord.data_point_type,
      description: dbRecord.description,
      category: dbRecord.category,
      businessValue: dbRecord.business_value,
      refreshFrequency: dbRecord.refresh_frequency,
      isRequired: dbRecord.is_required,
      sampleValue: dbRecord.sample_value,
      validationRules: dbRecord.validation_rules,
      createdAt: dbRecord.created_at,
      updatedAt: dbRecord.updated_at
    };
  }

  /**
   * Map integration data record from database
   */
  private mapIntegrationDataRecordFromDB(dbRecord: any): IntegrationDataRecord {
    return {
      id: dbRecord.id,
      userIntegrationId: dbRecord.user_integration_id,
      dataPointDefinitionId: dbRecord.data_point_definition_id,
      externalId: dbRecord.external_id,
      dataValue: dbRecord.data_value,
      rawData: dbRecord.raw_data,
      metadata: dbRecord.metadata,
      syncStatus: dbRecord.sync_status,
      lastSyncedAt: dbRecord.last_synced_at,
      createdAt: dbRecord.created_at,
      updatedAt: dbRecord.updated_at
    };
  }

  /**
   * Map enhancement rule from database
   */
  private mapEnhancementRuleFromDB(dbRecord: any): DataEnhancementRule {
    return {
      id: dbRecord.id,
      userIntegrationId: dbRecord.user_integration_id,
      ruleName: dbRecord.rule_name,
      ruleType: dbRecord.rule_type,
      ruleDefinition: dbRecord.rule_definition,
      isActive: dbRecord.is_active,
      priority: dbRecord.priority,
      createdAt: dbRecord.created_at,
      updatedAt: dbRecord.updated_at
    };
  }

  /**
   * Map API discovery cache from database
   */
  private mapAPIDiscoveryCacheFromDB(dbRecord: any): APIDiscoveryCache {
    return {
      id: dbRecord.id,
      userIntegrationId: dbRecord.user_integration_id,
      endpointPath: dbRecord.endpoint_path,
      endpointMethod: dbRecord.endpoint_method,
      responseSchema: dbRecord.response_schema,
      sampleData: dbRecord.sample_data,
      lastDiscoveredAt: dbRecord.last_discovered_at,
      discoveryStatus: dbRecord.discovery_status,
      errorMessage: dbRecord.error_message,
      createdAt: dbRecord.created_at,
      updatedAt: dbRecord.updated_at
    };
  }

  /**
   * Assess business value based on endpoint and data point
   */
  private assessBusinessValue(path: string, dataPointName: string): DataPointDefinition['businessValue'] {
    const nameLower = dataPointName.toLowerCase();
    
    // High value indicators
    if (nameLower.includes('email') || nameLower.includes('amount') || nameLower.includes('revenue')) {
      return 'high';
    }
    
    // Medium value indicators
    if (nameLower.includes('name') || nameLower.includes('status') || nameLower.includes('date')) {
      return 'medium';
    }
    
    return 'low';
  }

  /**
   * Assess refresh frequency based on endpoint
   */
  private assessRefreshFrequency(path: string, method: string): DataPointDefinition['refreshFrequency'] {
    const pathLower = path.toLowerCase();
    
    if (pathLower.includes('realtime') || pathLower.includes('live')) return 'real-time';
    if (pathLower.includes('hourly') || pathLower.includes('minute')) return 'hourly';
    if (pathLower.includes('daily') || pathLower.includes('day')) return 'daily';
    if (pathLower.includes('weekly') || pathLower.includes('week')) return 'weekly';
    if (pathLower.includes('monthly') || pathLower.includes('month')) return 'monthly';
    
    return 'daily'; // Default
  }
}

export const dataPointDictionaryService = new DataPointDictionaryService(); 