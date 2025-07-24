/**
 * Integration Data Aggregator
 * Pillar: 1,2,3 - Unified business intelligence across all integrations
 * Aggregates data from all connected services for comprehensive insights
 */

import { supabase } from '@/core/supabase';
import { logger } from './security/logger';
import { produce } from 'immer';

// Core data types for aggregation
export interface AggregatedDataPoint {
  id: string;
  source: string;
  category: DataCategory;
  type: string;
  value: any;
  normalizedValue: number; // 0-100 scale for comparison
  timestamp: string;
  metadata: Record<string, any>;
  tags: string[];
  businessImpact: BusinessImpact;
}

export interface BusinessImpact {
  revenue?: number;
  efficiency?: number;
  satisfaction?: number;
  growth?: number;
  risk?: number;
}

export type DataCategory = 
  | 'sales' 
  | 'marketing' 
  | 'finance' 
  | 'operations' 
  | 'support' 
  | 'hr' 
  | 'analytics' 
  | 'security';

export interface CrossPlatformInsight {
  id: string;
  title: string;
  description: string;
  type: 'trend' | 'correlation' | 'anomaly' | 'opportunity' | 'alert';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-1
  sources: string[];
  dataPoints: string[];
  recommendations: string[];
  estimatedImpact: BusinessImpact;
  createdAt: string;
  expiresAt?: string;
}

export interface UnifiedMetrics {
  revenue: {
    total: number;
    growth: number;
    sources: Record<string, number>;
    trend: 'up' | 'down' | 'stable';
  };
  efficiency: {
    score: number;
    bottlenecks: string[];
    automationOpportunities: string[];
  };
  customerSatisfaction: {
    score: number;
    sources: Record<string, number>;
    issues: string[];
  };
  operationalHealth: {
    score: number;
    alerts: number;
    uptime: number;
  };
}

export interface AggregationConfig {
  sources: string[];
  refreshInterval: number; // minutes
  retentionDays: number;
  enableRealtime: boolean;
  alertThresholds: Record<string, number>;
  businessRules: BusinessRule[];
}

export interface BusinessRule {
  id: string;
  name: string;
  condition: string; // SQL-like condition
  action: 'alert' | 'automate' | 'recommend';
  parameters: Record<string, any>;
  isActive: boolean;
}

class IntegrationDataAggregator {
  private config: AggregationConfig;
  private cache: Map<string, any> = new Map();
  private realTimeSubscriptions: Map<string, any> = new Map();

  constructor() {
    this.config = {
      sources: [],
      refreshInterval: 15, // 15 minutes
      retentionDays: 90,
      enableRealtime: true,
      alertThresholds: {
        revenueDropThreshold: 0.1, // 10% drop
        efficiencyDropThreshold: 0.15, // 15% drop
        errorRateThreshold: 0.05, // 5% error rate
      },
      businessRules: []
    };
  }

  /**
   * Initialize aggregation for a user
   */
  async initializeAggregation(userId: string, _companyId?: string): Promise<void> {
    try {
      // Get user's active integrations
      const { data: userIntegrations } = await supabase
        .from('user_integrations')
        .select(`
          id,
          integration_id,
          config
        `)
        .eq('user_id', userId)
        .eq('status', 'active');

      if (!userIntegrations) return;

      // Fetch integration details separately to avoid join issues
      const integrations = await Promise.all(
        userIntegrations.map(async (userIntegration) => {
          try {
            const { data: integrationDetails } = await supabase
              .from('integrations')
              .select('id, name, slug, category')
              .eq('id', userIntegration.integration_id)
              .single();
            
            return {
              ...userIntegration,
              integrations: integrationDetails || { name: 'Unknown', slug: 'unknown', category: 'general' }
            };
          } catch (error) {
            // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error fetching integration details: ', error);
            return {
              ...userIntegration,
              integrations: { name: 'Unknown', slug: 'unknown', category: 'general' }
            };
          }
        })
      );

      if (!integrations) return;

      // Update configuration based on available integrations
      this.config = produce(this.config, draft => {
        draft.sources = integrations.map(i => i.integrations.slug);
      });

      // Start real-time subscriptions if enabled
      if (this.config.enableRealtime) {
        await this.setupRealTimeSubscriptions(userId);
      }

      logger.info({ userId, sources: this.config.sources }, 'Initialized data aggregation');
    } catch (error) {
      logger.error({ error, userId }, 'Failed to initialize aggregation');
      throw error;
    }
  }

  /**
   * Aggregate data from all sources
   */
  async aggregateAllData(userId: string, timeframe: 'hour' | 'day' | 'week' | 'month' = 'day'): Promise<AggregatedDataPoint[]> {
    try {
      const aggregatedData: AggregatedDataPoint[] = [];
      
      // Get data from each integration source
      for (const source of this.config.sources) {
        const sourceData = await this.aggregateSourceData(userId, source, timeframe);
        aggregatedData.push(...sourceData);
      }

      // Apply business rules and enrichment
      const enrichedData = await this.enrichAggregatedData(aggregatedData);
      
      // Cache results
      const cacheKey = `aggregated_${userId}_${timeframe}`;
      this.cache.set(cacheKey, enrichedData);

      return enrichedData;
    } catch (error) {
      logger.error({ error, userId }, 'Failed to aggregate data');
      throw error;
    }
  }

  /**
   * Aggregate data from a specific source
   */
  private async aggregateSourceData(userId: string, source: string, timeframe: string): Promise<AggregatedDataPoint[]> {
    const timeframeDays = { hour: 0.04, day: 1, week: 7, month: 30 }[timeframe] || 1;
    const startDate = new Date(Date.now() - timeframeDays * 24 * 60 * 60 * 1000);

    const { data: rawData } = await supabase
      .from('integration_data')
      .select(`
        *,
        user_integrations!inner(
          integration_id
        )
      `)
      .eq('user_integrations.user_id', userId)
      .gte('data_timestamp', startDate.toISOString());

    if (!rawData) return [];

    // Fetch integration details separately
    const dataWithIntegrationDetails = await Promise.all(
      rawData.map(async (item) => {
        try {
          const { data: integrationDetails } = await supabase
            .from('integrations')
            .select('id, name, slug, category')
            .eq('id', item.user_integrations.integration_id)
            .single();
          
          return {
            ...item,
            userintegrations: {
              ...item.user_integrations,
              integrations: integrationDetails || { name: 'Unknown', slug: 'unknown', category: 'general' }
            }
          };
        } catch (error) {
          // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error fetching integration details: ', error);
          return {
            ...item,
            userintegrations: {
              ...item.user_integrations,
              integrations: { name: 'Unknown', slug: 'unknown', category: 'general' }
            }
          };
        }
      })
    );

    // Filter by source slug
    const filteredData = dataWithIntegrationDetails.filter(item => 
      item.user_integrations.integrations.slug === source
    );

    return filteredData.map(item => this.transformToAggregatedDataPoint(item));
  }

  /**
   * Transform raw integration data to aggregated data point
   */
  private transformToAggregatedDataPoint(rawItem: any): AggregatedDataPoint {
    const integration = rawItem.user_integrations.integrations;
    const businessImpact = this.calculateBusinessImpact(rawItem, integration.category);

    return {
      id: rawItem.id,
      source: integration.slug,
      category: this.mapToDataCategory(integration.category),
      type: rawItem.data_type,
      value: rawItem.processed_data || rawItem.raw_data,
      normalizedValue: this.normalizeValue(rawItem, integration.category),
      timestamp: rawItem.data_timestamp,
      metadata: {
        integrationName: integration.name,
        syncBatchId: rawItem.sync_batch_id,
        ...rawItem.raw_data.metadata || {}
      },
      tags: this.generateTags(rawItem, integration),
      businessImpact
    };
  }

  /**
   * Calculate business impact of data point
   */
  private calculateBusinessImpact(rawItem: any, category: string): BusinessImpact {
    const impact: BusinessImpact = {};

    switch (category) {
      case 'crm-sales':
        if (rawItem.data_type === 'deals') {
          impact.revenue = rawItem.processed_data?.amount || 0;
          impact.growth = rawItem.processed_data?.probability || 0;
        }
        break;
      case 'finance-accounting':
        if (rawItem.data_type === 'transactions') {
          impact.revenue = rawItem.processed_data?.amount || 0;
        }
        break;
      case 'marketing-advertising':
        if (rawItem.data_type === 'campaigns') {
          impact.efficiency = rawItem.processed_data?.conversionRate || 0;
          impact.growth = rawItem.processed_data?.reach || 0;
        }
        break;
      case 'operations-productivity':
        impact.efficiency = rawItem.processed_data?.productivityScore || 0;
        break;
      case 'analytics-bi':
        impact.satisfaction = rawItem.processed_data?.userSatisfaction || 0;
        break;
    }

    return impact;
  }

  /**
   * Generate cross-platform insights
   */
  async generateCrossPlatformInsights(userId: string): Promise<CrossPlatformInsight[]> {
    try {
      const aggregatedData = await this.aggregateAllData(userId, 'week');
      const insights: CrossPlatformInsight[] = [];

      // Revenue correlation analysis
      const revenueInsight = this.analyzeRevenueCorrelations(aggregatedData);
      if (revenueInsight) insights.push(revenueInsight);

      // Efficiency bottleneck detection
      const efficiencyInsight = this.detectEfficiencyBottlenecks(aggregatedData);
      if (efficiencyInsight) insights.push(efficiencyInsight);

      // Customer journey analysis
      const customerInsight = this.analyzeCustomerJourney(aggregatedData);
      if (customerInsight) insights.push(customerInsight);

      // Anomaly detection
      const anomalies = this.detectAnomalies(aggregatedData);
      insights.push(...anomalies);

      // Automation opportunities
      const automationInsights = this.identifyAutomationOpportunities(aggregatedData);
      insights.push(...automationInsights);

      return insights;
    } catch (error) {
      logger.error({ error, userId }, 'Failed to generate cross-platform insights');
      return [];
    }
  }

  /**
   * Analyze revenue correlations across platforms
   */
  private analyzeRevenueCorrelations(data: AggregatedDataPoint[]): CrossPlatformInsight | null {
    const revenueData = data.filter(d => d.businessImpact.revenue && d.businessImpact.revenue > 0);
    
    if (revenueData.length < 2) return null;

    const salesData = revenueData.filter(d => d.category === 'sales');
    const marketingData = revenueData.filter(d => d.category === 'marketing');
    
    if (salesData.length > 0 && marketingData.length > 0) {
      const correlation = this.calculateCorrelation(salesData, marketingData);
      
      if (correlation > 0.7) {
        return {
          id: `revenue-correlation-${Date.now()}`,
          title: 'Strong Marketing-Sales Revenue Correlation',
          description: `Marketing activities show strong correlation (${(correlation * 100).toFixed(1)}%) with sales revenue. Increasing marketing spend could drive significant revenue growth.`,
          type: 'correlation',
          severity: 'medium',
          confidence: correlation,
          sources: [...new Set([...salesData.map(d => d.source), ...marketingData.map(d => d.source)])],
          dataPoints: [...salesData.map(d => d.id), ...marketingData.map(d => d.id)],
          recommendations: [
            'Increase marketing budget for high-performing campaigns',
            'Align marketing and sales team goals',
            'Implement attribution tracking for better insights'
          ],
          estimatedImpact: {
            revenue: this.estimateRevenueImpact(revenueData),
            growth: 15
          },
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        };
      }
    }

    return null;
  }

  /**
   * Detect efficiency bottlenecks
   */
  private detectEfficiencyBottlenecks(data: AggregatedDataPoint[]): CrossPlatformInsight | null {
    const efficiencyData = data.filter(d => d.businessImpact.efficiency !== undefined);
    
    if (efficiencyData.length === 0) return null;

    const avgEfficiency = efficiencyData.reduce((sum, d) => sum + (d.businessImpact.efficiency || 0), 0) / efficiencyData.length;
    const lowEfficiencyPoints = efficiencyData.filter(d => (d.businessImpact.efficiency || 0) < avgEfficiency * 0.7);

    if (lowEfficiencyPoints.length > 0) {
      const bottleneckSources = [...new Set(lowEfficiencyPoints.map(d => d.source))];
      
      return {
        id: `efficiency-bottleneck-${Date.now()}`,
        title: 'Efficiency Bottlenecks Detected',
        description: `${bottleneckSources.length} integration${bottleneckSources.length > 1 ? 's' : ''} showing below-average efficiency. Focus on optimizing these areas for maximum impact.`,
        type: 'opportunity',
        severity: 'medium',
        confidence: 0.8,
        sources: bottleneckSources,
        dataPoints: lowEfficiencyPoints.map(d => d.id),
        recommendations: [
          'Review processes in low-efficiency areas',
          'Implement automation where possible',
          'Provide additional training for affected teams',
          'Consider workflow optimization tools'
        ],
        estimatedImpact: {
          efficiency: 25,
          revenue: this.estimateEfficiencyImpact(lowEfficiencyPoints)
        },
        createdAt: new Date().toISOString()
      };
    }

    return null;
  }

  /**
   * Generate unified metrics across all integrations
   */
  async generateUnifiedMetrics(userId: string): Promise<UnifiedMetrics> {
    try {
      const aggregatedData = await this.aggregateAllData(userId, 'month');
      
      return {
        revenue: this.calculateUnifiedRevenue(aggregatedData),
        efficiency: this.calculateUnifiedEfficiency(aggregatedData),
        customerSatisfaction: this.calculateUnifiedSatisfaction(aggregatedData),
        operationalHealth: this.calculateOperationalHealth(aggregatedData)
      };
    } catch (error) {
      logger.error({ error, userId }, 'Failed to generate unified metrics');
      throw error;
    }
  }

  /**
   * Set up real-time data subscriptions
   */
  private async setupRealTimeSubscriptions(userId: string): Promise<void> {
    // Subscribe to integration data changes
    const subscription = supabase
      .channel(`integration_data_${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'integration_data',
        filter: `user_integrations.user_id=eq.${userId}`
      }, (payload) => {
        this.handleRealTimeDataUpdate(payload);
      })
      .subscribe();

    this.realTimeSubscriptions.set(userId, subscription);
  }

  /**
   * Handle real-time data updates
   */
  private handleRealTimeDataUpdate(payload: any): void {
    // Invalidate relevant caches
    this.cache.clear();
    
    // Process new data point
    const newDataPoint = this.transformToAggregatedDataPoint(payload.new);
    
    // Check for immediate alerts
    this.checkAlertConditions([newDataPoint]);
  }

  /**
   * Check alert conditions
   */
  private async checkAlertConditions(dataPoints: AggregatedDataPoint[]): Promise<void> {
    for (const point of dataPoints) {
      // Revenue drop alert
      if (point.businessImpact.revenue && point.businessImpact.revenue < 0) {
        const dropPercentage = Math.abs(point.businessImpact.revenue) / 100;
        if (dropPercentage > this.config.alertThresholds.revenueDropThreshold) {
          await this.triggerAlert('revenue_drop', point);
        }
      }

      // Efficiency drop alert
      if (point.businessImpact.efficiency && point.businessImpact.efficiency < 50) {
        await this.triggerAlert('efficiency_drop', point);
      }
    }
  }

  /**
   * Trigger alert
   */
  private async triggerAlert(alertType: string, dataPoint: AggregatedDataPoint): Promise<void> {
    logger.warn({ alertType, dataPoint }, 'Integration alert triggered');
    
    // Store alert in database
    await supabase.from('ai_integration_alerts').insert({
      alerttype: alertType,
      source: dataPoint.source,
      datapoint_id: dataPoint.id,
      severity: this.getAlertSeverity(alertType),
      message: this.getAlertMessage(alertType, dataPoint),
      metadata: dataPoint.metadata
    });
  }

  // Helper methods for calculations and transformations
  private mapToDataCategory(integrationCategory: string): DataCategory {
    const mapping: Record<string, DataCategory> = {
      'crm-sales': 'sales',
      'marketing-advertising': 'marketing',
      'finance-accounting': 'finance',
      'operations-productivity': 'operations',
      'communication': 'operations',
      'analytics-bi': 'analytics',
      'security': 'security',
      'hr-people': 'hr'
    };
    return mapping[integrationCategory] || 'operations';
  }

  private normalizeValue(rawItem: any, category: string): number {
    // Normalize different types of values to 0-100 scale
    // This is a simplified implementation - would be more sophisticated in production
    if (rawItem.processed_data?.normalizedScore) {
      return rawItem.processed_data.normalizedScore;
    }
    
    // Default normalization based on category
    switch (category) {
      case 'crm-sales':
        return Math.min(100, (rawItem.processed_data?.amount || 0) / 1000);
      case 'analytics-bi':
        return rawItem.processed_data?.score || 50;
      default: return 50;
    }
  }

  private generateTags(rawItem: any, integration: any): string[] {
    const tags = [integration.category, rawItem.data_type];
    
    if (rawItem.processed_data?.priority) {
      tags.push(`priority: ${rawItem.processed_data.priority}`);
    }
    
    if (rawItem.processed_data?.status) {
      tags.push(`status: ${rawItem.processed_data.status}`);
    }
    
    return tags;
  }

  private calculateCorrelation(data1: AggregatedDataPoint[], data2: AggregatedDataPoint[]): number {
    // Simplified correlation calculation
    // In production, this would use proper statistical methods
    const values1 = data1.map(d => d.normalizedValue);
    const values2 = data2.map(d => d.normalizedValue);
    
    if (values1.length !== values2.length) return 0;
    
    const mean1 = values1.reduce((a, b) => a + b, 0) / values1.length;
    const mean2 = values2.reduce((a, b) => a + b, 0) / values2.length;
    
    let numerator = 0;
    let denominator1 = 0;
    let denominator2 = 0;
    
    for (let i = 0; i < values1.length; i++) {
      const diff1 = values1[i] - mean1;
      const diff2 = values2[i] - mean2;
      numerator += diff1 * diff2;
      denominator1 += diff1 * diff1;
      denominator2 += diff2 * diff2;
    }
    
    const denominator = Math.sqrt(denominator1 * denominator2);
    return denominator === 0 ? 0: numerator / denominator;
  }

  private estimateRevenueImpact(data: AggregatedDataPoint[]): number {
    return data.reduce((sum, d) => sum + (d.businessImpact.revenue || 0), 0);
  }

  private estimateEfficiencyImpact(data: AggregatedDataPoint[]): number {
    // Estimate revenue impact of efficiency improvements
    const avgRevenue = data.reduce((sum, d) => sum + (d.businessImpact.revenue || 0), 0) / data.length;
    return avgRevenue * 0.15; // 15% improvement estimate
  }

  private calculateUnifiedRevenue(data: AggregatedDataPoint[]) {
    const revenueData = data.filter(d => d.businessImpact.revenue);
    const total = revenueData.reduce((sum, d) => sum + (d.businessImpact.revenue || 0), 0);
    
    // Calculate growth (simplified)
    const recentData = revenueData.filter(d => 
      new Date(d.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    const recentTotal = recentData.reduce((sum, d) => sum + (d.businessImpact.revenue || 0), 0);
    const growth = recentData.length > 0 ? (recentTotal / total) * 100 - 100: 0;
    
    // Group by source
    const sources: Record<string, number> = {};
    revenueData.forEach(d => {
      sources[d.source] = (sources[d.source] || 0) + (d.businessImpact.revenue || 0);
    });
    
    return {
      total,
      growth,
      sources,
      trend: growth > 5 ? 'up' as const : growth < -5 ? 'down' as const : 'stable' as const
    };
  }

  private calculateUnifiedEfficiency(data: AggregatedDataPoint[]) {
    const efficiencyData = data.filter(d => d.businessImpact.efficiency !== undefined);
    const score = efficiencyData.length > 0 
      ? efficiencyData.reduce((sum, d) => sum + (d.businessImpact.efficiency || 0), 0) / efficiencyData.length: 0;
    
    const lowEfficiencyPoints = efficiencyData.filter(d => (d.businessImpact.efficiency || 0) < score * 0.8);
    const bottlenecks = [...new Set(lowEfficiencyPoints.map(d => d.source))];
    
    return {
      score,
      bottlenecks,
      automationOpportunities: this.identifyAutomationOpportunities(data).map(i => i.title)
    };
  }

  private calculateUnifiedSatisfaction(data: AggregatedDataPoint[]) {
    const satisfactionData = data.filter(d => d.businessImpact.satisfaction !== undefined);
    const score = satisfactionData.length > 0
      ? satisfactionData.reduce((sum, d) => sum + (d.businessImpact.satisfaction || 0), 0) / satisfactionData.length: 0;
    
    const sources: Record<string, number> = {};
    satisfactionData.forEach(d => {
      sources[d.source] = (sources[d.source] || 0) + (d.businessImpact.satisfaction || 0);
    });
    
    const issues = data
      .filter(d => d.tags.includes('issue') || d.tags.includes('complaint'))
      .map(d => d.source);
    
    return { score, sources, issues: [...new Set(issues)] };
  }

  private calculateOperationalHealth(data: AggregatedDataPoint[]) {
    const healthData = data.filter(d => d.category === 'operations');
    const score = healthData.length > 0 ? 85: 0; // Simplified calculation
    
    const alertData = data.filter(d => d.tags.includes('alert') || d.tags.includes('error'));
    const alerts = alertData.length;
    
    const uptimeData = data.filter(d => d.type === 'uptime');
    const uptime = uptimeData.length > 0 
      ? uptimeData.reduce((sum, d) => sum + (d.normalizedValue || 0), 0) / uptimeData.length: 99;
    
    return { score, alerts, uptime };
  }

  private analyzeCustomerJourney(data: AggregatedDataPoint[]): CrossPlatformInsight | null {
    // Simplified customer journey analysis
    const customerData = data.filter(d => 
      d.category === 'sales' || d.category === 'marketing' || d.category === 'support'
    );
    
    if (customerData.length < 5) return null;
    
    return {
      id: `customer-journey-${Date.now()}`,
      title: 'Customer Journey Optimization Opportunity',
      description: 'Analysis of customer touchpoints reveals opportunities to improve conversion rates and satisfaction.',
      type: 'opportunity',
      severity: 'medium',
      confidence: 0.75,
      sources: [...new Set(customerData.map(d => d.source))],
      dataPoints: customerData.map(d => d.id),
      recommendations: [
        'Streamline handoffs between marketing and sales',
        'Implement customer success automation',
        'Create unified customer view across platforms'
      ],
      estimatedImpact: {
        satisfaction: 20,
        revenue: 10000
      },
      createdAt: new Date().toISOString()
    };
  }

  private detectAnomalies(data: AggregatedDataPoint[]): CrossPlatformInsight[] {
    // Simplified anomaly detection
    const insights: CrossPlatformInsight[] = [];
    
    // Check for sudden spikes or drops
    const recentData = data.filter(d => 
      new Date(d.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    );
    
    const historicalData = data.filter(d => 
      new Date(d.timestamp) <= new Date(Date.now() - 24 * 60 * 60 * 1000)
    );
    
    if (recentData.length > 0 && historicalData.length > 0) {
      const recentAvg = recentData.reduce((sum, d) => sum + d.normalizedValue, 0) / recentData.length;
      const historicalAvg = historicalData.reduce((sum, d) => sum + d.normalizedValue, 0) / historicalData.length;
      
      const change = (recentAvg - historicalAvg) / historicalAvg;
      
      if (Math.abs(change) > 0.3) { // 30% change
        insights.push({
          id: `anomaly-${Date.now()}`,
          title: `Significant ${change > 0 ? 'Increase' : 'Decrease'} Detected`,
          description: `Data shows a ${Math.abs(change * 100).toFixed(1)}% ${change > 0 ? 'increase' : 'decrease'} in the last 24 hours compared to historical average.`,
          type: 'anomaly',
          severity: Math.abs(change) > 0.5 ? 'high' : 'medium',
          confidence: 0.8,
          sources: [...new Set(recentData.map(d => d.source))],
          dataPoints: recentData.map(d => d.id),
          recommendations: [
            'Investigate root cause of change',
            'Monitor trend closely',
            'Adjust forecasts if trend continues'
          ],
          estimatedImpact: {
            risk: Math.abs(change) * 100
          },
          createdAt: new Date().toISOString()
        });
      }
    }
    
    return insights;
  }

  private identifyAutomationOpportunities(data: AggregatedDataPoint[]): CrossPlatformInsight[] {
    // Simplified automation opportunity detection
    const manualProcesses = data.filter(d => 
      d.tags.includes('manual') || d.tags.includes('repetitive')
    );
    
    if (manualProcesses.length === 0) return [];
    
    const sources = [...new Set(manualProcesses.map(d => d.source))];
    
    return [{
      id: `automation-opportunity-${Date.now()}`,
      title: 'Automation Opportunities Identified',
      description: `${manualProcesses.length} manual processes detected across ${sources.length} integration${sources.length > 1 ? 's' : ''}. These could be automated for significant efficiency gains.`,
      type: 'opportunity',
      severity: 'medium',
      confidence: 0.85,
      sources,
      dataPoints: manualProcesses.map(d => d.id),
      recommendations: [
        'Implement workflow automation for repetitive tasks',
        'Use n8n workflows to connect systems',
        'Train team on automation tools',
        'Start with highest-impact, lowest-complexity processes'
      ],
      estimatedImpact: {
        efficiency: 40,
        revenue: manualProcesses.length * 500 // $500 per automated process
      },
      createdAt: new Date().toISOString()
    }];
  }

  private async enrichAggregatedData(data: AggregatedDataPoint[]): Promise<AggregatedDataPoint[]> {
    // Apply business rules and enrichment
    return data.map(point => {
      // Add additional tags based on business rules
      if (point.businessImpact.revenue && point.businessImpact.revenue > 1000) {
        point.tags.push('high-value');
      }
      
      if (point.businessImpact.efficiency && point.businessImpact.efficiency < 30) {
        point.tags.push('low-efficiency');
      }
      
      return point;
    });
  }

  private getAlertSeverity(alertType: string): string {
    const severityMap: Record<string, string> = {
      'revenue_drop': 'high',
      'efficiency_drop': 'medium',
      'error_spike': 'high',
      'anomaly': 'medium'
    };
    return severityMap[alertType] || 'low';
  }

  private getAlertMessage(alertType: string, dataPoint: AggregatedDataPoint): string {
    const messages: Record<string, string> = {
      'revenue_drop': `Revenue drop detected in ${dataPoint.source}`,
      'efficiency_drop': `Efficiency drop detected in ${dataPoint.source}`,
      'error_spike': `Error spike detected in ${dataPoint.source}`,
      'anomaly': `Anomaly detected in ${dataPoint.source}`
    };
    return messages[alertType] || `Alert in ${dataPoint.source}`;
  }

  /**
   * Get cached aggregated data
   */
  getCachedData(cacheKey: string): any {
    return this.cache.get(cacheKey);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<AggregationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): AggregationConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const integrationDataAggregator = new IntegrationDataAggregator();

// Export utility functions
export async function aggregateUserData(userId: string, timeframe?: 'hour' | 'day' | 'week' | 'month') {
  return integrationDataAggregator.aggregateAllData(userId, timeframe);
}

export async function generateUserInsights(userId: string) {
  return integrationDataAggregator.generateCrossPlatformInsights(userId);
}

export async function getUserMetrics(userId: string) {
  return integrationDataAggregator.generateUnifiedMetrics(userId);
} 