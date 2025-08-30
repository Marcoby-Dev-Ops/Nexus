/**
 * KPI Calculation Service
 * Provides comprehensive business health scoring based on real KPI data
 * Implements the get_business_health_score() function with live data processing
 */

import { BaseService, type ServiceResponse } from '@/core/services/BaseService';
import { selectData as select, selectOne, insertOne, updateOne, deleteOne, callEdgeFunction } from '@/lib/api-client';
import { logger } from '@/shared/utils/logger';

export interface KPIDefinition {
  key: string;
  name: string;
  description: string;
  category: 'sales' | 'finance' | 'support' | 'marketing' | 'operations' | 'maturity';
  weight: number;
  excellentThreshold: number | string;
  goodThreshold: number | string;
  fairThreshold: number | string;
  unit?: string;
  inverse?: boolean; // For metrics where lower is better
}

export interface KPIScore {
  key: string;
  name: string;
  value: number | string | boolean;
  score: number;
  weight: number;
  category: string;
  status: 'excellent' | 'good' | 'fair' | 'poor';
  trend?: 'up' | 'down' | 'stable';
  lastUpdated: string;
}

export interface CategoryScore {
  category: string;
  score: number;
  weight: number;
  kpis: KPIScore[];
  status: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface BusinessHealthScore {
  overallScore: number;
  categoryScores: CategoryScore[];
  kpiScores: KPIScore[];
  lastCalculated: string;
  dataQuality: number;
  recommendations: string[];
  trends: {
    overall: 'up' | 'down' | 'stable';
    monthlyChange: number;
    weeklyChange: number;
  };
}

export class KPICalculationService extends BaseService {
  private static instance: KPICalculationService;

  // KPI Definitions based on business health system documentation
  private readonly kpiDefinitions: KPIDefinition[] = [
    // Sales Health (Weight: 1.0)
    {
      key: 'mrr_arr',
      name: 'Monthly Recurring Revenue',
      description: 'Monthly recurring revenue or annual recurring revenue',
      category: 'sales',
      weight: 10,
      excellentThreshold: 50000,
      goodThreshold: 25000,
      fairThreshold: 10000,
      unit: 'USD'
    },
    {
      key: 'new_leads',
      name: 'New Leads',
      description: 'Monthly lead generation count',
      category: 'sales',
      weight: 8,
      excellentThreshold: 100,
      goodThreshold: 50,
      fairThreshold: 25,
      unit: 'leads'
    },
    {
      key: 'conversion_rate',
      name: 'Conversion Rate',
      description: 'Lead-to-customer conversion percentage',
      category: 'sales',
      weight: 9,
      excellentThreshold: 30,
      goodThreshold: 20,
      fairThreshold: 10,
      unit: '%'
    },
    {
      key: 'pipeline_value',
      name: 'Pipeline Value',
      description: 'Total sales pipeline worth',
      category: 'sales',
      weight: 7,
      excellentThreshold: 250000,
      goodThreshold: 100000,
      fairThreshold: 50000,
      unit: 'USD'
    },
    {
      key: 'customer_acquisition_cost',
      name: 'Customer Acquisition Cost',
      description: 'Cost to acquire a new customer',
      category: 'sales',
      weight: 8,
      excellentThreshold: 100,
      goodThreshold: 200,
      fairThreshold: 500,
      unit: 'USD',
      inverse: true
    },

    // Finance Health (Weight: 1.0)
    {
      key: 'working_capital',
      name: 'Working Capital',
      description: 'Short-term financial health',
      category: 'finance',
      weight: 9,
      excellentThreshold: 250000,
      goodThreshold: 100000,
      fairThreshold: 50000,
      unit: 'USD'
    },
    {
      key: 'monthly_expenses',
      name: 'Monthly Expenses',
      description: 'Operating cost efficiency',
      category: 'finance',
      weight: 8,
      excellentThreshold: 10000,
      goodThreshold: 25000,
      fairThreshold: 50000,
      unit: 'USD',
      inverse: true
    },
    {
      key: 'profit_margin',
      name: 'Profit Margin',
      description: 'Net profitability percentage',
      category: 'finance',
      weight: 10,
      excellentThreshold: 30,
      goodThreshold: 20,
      fairThreshold: 10,
      unit: '%'
    },
    {
      key: 'cash_runway',
      name: 'Cash Runway',
      description: 'Months of operation without revenue',
      category: 'finance',
      weight: 9,
      excellentThreshold: 18,
      goodThreshold: 12,
      fairThreshold: 6,
      unit: 'months'
    },
    {
      key: 'ar_aging',
      name: 'AR Aging',
      description: 'Overdue invoice percentage',
      category: 'finance',
      weight: 7,
      excellentThreshold: 5,
      goodThreshold: 10,
      fairThreshold: 20,
      unit: '%',
      inverse: true
    },

    // Support Health (Weight: 0.8)
    {
      key: 'first_contact_resolution',
      name: 'First Contact Resolution',
      description: 'Issues resolved immediately',
      category: 'support',
      weight: 9,
      excellentThreshold: 90,
      goodThreshold: 80,
      fairThreshold: 70,
      unit: '%'
    },
    {
      key: 'time_to_resolution',
      name: 'Time to Resolution',
      description: 'Average resolution time in hours',
      category: 'support',
      weight: 8,
      excellentThreshold: 4,
      goodThreshold: 8,
      fairThreshold: 24,
      unit: 'hours',
      inverse: true
    },
    {
      key: 'customer_satisfaction',
      name: 'Customer Satisfaction',
      description: 'CSAT score out of 10',
      category: 'support',
      weight: 10,
      excellentThreshold: 9,
      goodThreshold: 8,
      fairThreshold: 7,
      unit: '/10'
    },
    {
      key: 'ticket_volume',
      name: 'Ticket Volume',
      description: 'Support request volume per month',
      category: 'support',
      weight: 7,
      excellentThreshold: 100,
      goodThreshold: 250,
      fairThreshold: 500,
      unit: 'tickets',
      inverse: true
    },
    {
      key: 'net_promoter_score',
      name: 'Net Promoter Score',
      description: 'Customer loyalty score',
      category: 'support',
      weight: 9,
      excellentThreshold: 80,
      goodThreshold: 60,
      fairThreshold: 40,
      unit: 'score'
    },

    // Marketing Health (Weight: 0.9)
    {
      key: 'website_visitors',
      name: 'Website Visitors',
      description: 'Monthly unique visitors',
      category: 'marketing',
      weight: 8,
      excellentThreshold: 50000,
      goodThreshold: 25000,
      fairThreshold: 10000,
      unit: 'visitors'
    },
    {
      key: 'marketing_qualified_leads',
      name: 'Marketing Qualified Leads',
      description: 'Quality lead generation',
      category: 'marketing',
      weight: 9,
      excellentThreshold: 100,
      goodThreshold: 50,
      fairThreshold: 25,
      unit: 'MQLs'
    },
    {
      key: 'email_open_rate',
      name: 'Email Open Rate',
      description: 'Email campaign effectiveness',
      category: 'marketing',
      weight: 7,
      excellentThreshold: 35,
      goodThreshold: 25,
      fairThreshold: 15,
      unit: '%'
    },
    {
      key: 'social_engagement',
      name: 'Social Engagement',
      description: 'Social media engagement rate',
      category: 'marketing',
      weight: 6,
      excellentThreshold: 5,
      goodThreshold: 3,
      fairThreshold: 1,
      unit: '%'
    },
    {
      key: 'campaign_roi',
      name: 'Campaign ROI',
      description: 'Marketing return on investment',
      category: 'marketing',
      weight: 8,
      excellentThreshold: 500,
      goodThreshold: 300,
      fairThreshold: 150,
      unit: '%'
    },

    // Operations Health (Weight: 0.8)
    {
      key: 'asset_utilization',
      name: 'Asset Utilization',
      description: 'Business asset efficiency',
      category: 'operations',
      weight: 7,
      excellentThreshold: 90,
      goodThreshold: 75,
      fairThreshold: 60,
      unit: '%'
    },
    {
      key: 'service_uptime',
      name: 'Service Uptime',
      description: 'System availability',
      category: 'operations',
      weight: 9,
      excellentThreshold: 99.9,
      goodThreshold: 99.5,
      fairThreshold: 99.0,
      unit: '%'
    },
    {
      key: 'automation_coverage',
      name: 'Automation Coverage',
      description: 'Process automation level',
      category: 'operations',
      weight: 8,
      excellentThreshold: 80,
      goodThreshold: 60,
      fairThreshold: 40,
      unit: '%'
    },
    {
      key: 'on_time_completion',
      name: 'On-Time Completion',
      description: 'Project delivery performance',
      category: 'operations',
      weight: 8,
      excellentThreshold: 95,
      goodThreshold: 85,
      fairThreshold: 75,
      unit: '%'
    },
    {
      key: 'vendor_performance',
      name: 'Vendor Performance',
      description: 'Supplier relationship quality',
      category: 'operations',
      weight: 6,
      excellentThreshold: 90,
      goodThreshold: 75,
      fairThreshold: 60,
      unit: 'score'
    },

    // Maturity Health (Weight: 0.7)
    {
      key: 'employee_headcount',
      name: 'Employee Headcount',
      description: 'Team size and growth',
      category: 'maturity',
      weight: 7,
      excellentThreshold: 50,
      goodThreshold: 25,
      fairThreshold: 10,
      unit: 'employees'
    },
    {
      key: 'sop_coverage',
      name: 'SOP Coverage',
      description: 'Process documentation coverage',
      category: 'maturity',
      weight: 8,
      excellentThreshold: 100,
      goodThreshold: 75,
      fairThreshold: 50,
      unit: '%'
    },
    {
      key: 'key_employee_tenure',
      name: 'Key Employee Tenure',
      description: 'Management team stability in years',
      category: 'maturity',
      weight: 6,
      excellentThreshold: 5,
      goodThreshold: 3,
      fairThreshold: 1,
      unit: 'years'
    },
    {
      key: 'strategic_planning',
      name: 'Strategic Planning',
      description: 'Strategy review frequency in days',
      category: 'maturity',
      weight: 8,
      excellentThreshold: 30,
      goodThreshold: 90,
      fairThreshold: 180,
      unit: 'days',
      inverse: true
    },
    {
      key: 'compliance_status',
      name: 'Compliance Status',
      description: 'Regulatory compliance percentage',
      category: 'maturity',
      weight: 9,
      excellentThreshold: 100,
      goodThreshold: 95,
      fairThreshold: 85,
      unit: '%'
    }
  ];

  // Category weights
  private readonly categoryWeights: Record<string, number> = {
    sales: 1.0,
    finance: 1.0,
    support: 0.8,
    marketing: 0.9,
    operations: 0.8,
    maturity: 0.7
  };

  static getInstance(): KPICalculationService {
    if (!KPICalculationService.instance) {
      KPICalculationService.instance = new KPICalculationService();
    }
    return KPICalculationService.instance;
  }

  /**
   * Main function to get business health score
   * Implements the get_business_health_score() function
   */
  async getBusinessHealthScore(userId: string): Promise<ServiceResponse<BusinessHealthScore>> {
    try {
      this.logger.info('Calculating business health score for user', { userId });

      // Fetch KPI data from database
      const kpiData = await this.fetchKPIData(userId);
      if (!kpiData.success) {
        return this.handleError('Failed to fetch KPI data', kpiData.error);
      }

      // Calculate individual KPI scores
      const kpiScores = this.calculateKPIScores(kpiData.data);

      // Calculate category scores
      const categoryScores = this.calculateCategoryScores(kpiScores);

      // Calculate overall score
      const overallScore = this.calculateOverallScore(categoryScores);

      // Calculate trends
      const trends = await this.calculateTrends(userId);

      // Generate recommendations
      const recommendations = this.generateRecommendations(kpiScores, categoryScores);

      // Calculate data quality
      const dataQuality = this.calculateDataQuality(kpiScores);

      const result: BusinessHealthScore = {
        overallScore,
        categoryScores,
        kpiScores,
        lastCalculated: new Date().toISOString(),
        dataQuality,
        recommendations,
        trends
      };

      // Store the calculated score in database
      await this.storeBusinessHealthScore(userId, result);

      return this.createResponse(result);

    } catch (error) {
      return this.handleError('Error calculating business health score', error);
    }
  }

  /**
   * Fetch KPI data from database
   */
  private async fetchKPIData(userId: string): Promise<ServiceResponse<Record<string, any>>> {
    try {
      const kpiData: Record<string, any> = {};

      // Fetch KPI snapshots
      const kpiSnapshotsResult = await select('ai_kpi_snapshots', ['kpi_key', 'value', 'captured_at'], {
        user_id: userId,
        captured_at_gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      });

      if (!kpiSnapshotsResult.success) {
        this.logger.error('Error fetching KPI snapshots', { error: kpiSnapshotsResult.error });
        return this.handleError('Failed to fetch KPI snapshots', kpiSnapshotsResult.error);
      }

      const kpiSnapshots = kpiSnapshotsResult.data || [];

      // Process KPI snapshots - get latest value for each KPI
      const latestKPIs = new Map<string, any>();
      kpiSnapshots?.forEach(snapshot => {
        const existing = latestKPIs.get(snapshot.kpi_key);
        if (!existing || new Date(snapshot.captured_at) > new Date(existing.captured_at)) {
          latestKPIs.set(snapshot.kpi_key, snapshot);
        }
      });

      // Convert to record
      latestKPIs.forEach((snapshot, key) => {
        kpiData[key] = {
          value: snapshot.value,
          lastUpdated: snapshot.captured_at
        };
      });

      // Fetch business profile data for additional context
      // Removed business_profiles dependency - using alternative data sources
      const businessContext = {
        industry: 'Technology', // Default value
        company_size: '1-10', // Default value
        business_stage: 'startup' // Default value
      };

      // Add business context data
      kpiData.business_context = businessContext;

      return this.createResponse(kpiData);

    } catch (error) {
      return this.handleError('Error fetching KPI data', error);
    }
  }

  /**
   * Calculate individual KPI scores
   */
  private calculateKPIScores(kpiData: Record<string, any>): KPIScore[] {
    const scores: KPIScore[] = [];

    this.kpiDefinitions.forEach(kpiDef => {
      const kpiValue = kpiData[kpiDef.key];
      let value: number | string | boolean = 0;
      let lastUpdated = new Date().toISOString();

      if (kpiValue) {
        value = kpiValue.value;
        lastUpdated = kpiValue.lastUpdated;
      }

      const score = this.calculateKPIScore(kpiDef, value);
      const status = this.getScoreStatus(score);

      scores.push({
        key: kpiDef.key,
        name: kpiDef.name,
        value,
        score,
        weight: kpiDef.weight,
        category: kpiDef.category,
        status,
        lastUpdated
      });
    });

    return scores;
  }

  /**
   * Calculate score for a single KPI
   */
  private calculateKPIScore(kpi: KPIDefinition, value: number | string | boolean): number {
    if (typeof value === 'boolean') {
      return value ? 100 : 0;
    }

    if (typeof value === 'string') {
      // Handle string-based KPIs (like compliance status)
      if (kpi.key === 'compliance_status') {
        const numValue = parseFloat(value);
        return this.calculateNumericScore(numValue, kpi.excellentThreshold as number, kpi.goodThreshold as number, kpi.fairThreshold as number, kpi.inverse);
      }
      return 0; // Default for unknown string values
    }

    if (typeof value === 'number') {
      return this.calculateNumericScore(value, kpi.excellentThreshold as number, kpi.goodThreshold as number, kpi.fairThreshold as number, kpi.inverse);
    }

    return 0; // Default for missing or invalid values
  }

  /**
   * Calculate numeric score based on thresholds
   */
  private calculateNumericScore(value: number, excellent: number, good: number, fair: number, inverse = false): number {
    if (inverse) {
      // For metrics where lower is better
      if (value <= excellent) return 100;
      if (value <= good) return 80;
      if (value <= fair) return 60;
      return Math.max(0, 40 - ((value - fair) / fair) * 20);
    } else {
      // For metrics where higher is better
      if (value >= excellent) return 100;
      if (value >= good) return 80;
      if (value >= fair) return 60;
      return Math.max(0, 40 - ((fair - value) / fair) * 20);
    }
  }

  /**
   * Get status based on score
   */
  private getScoreStatus(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'fair';
    return 'poor';
  }

  /**
   * Calculate category scores
   */
  private calculateCategoryScores(kpiScores: KPIScore[]): CategoryScore[] {
    const categoryGroups = new Map<string, KPIScore[]>();

    // Group KPIs by category
    kpiScores.forEach(kpi => {
      if (!categoryGroups.has(kpi.category)) {
        categoryGroups.set(kpi.category, []);
      }
      categoryGroups.get(kpi.category)!.push(kpi);
    });

    const categoryScores: CategoryScore[] = [];

    categoryGroups.forEach((kpis, category) => {
      const totalWeight = kpis.reduce((sum, kpi) => sum + kpi.weight, 0);
      const weightedScore = kpis.reduce((sum, kpi) => sum + (kpi.score * kpi.weight), 0);
      const score = totalWeight > 0 ? weightedScore / totalWeight : 0;
      const status = this.getScoreStatus(score);

      categoryScores.push({
        category,
        score: Math.round(score),
        weight: this.categoryWeights[category] || 1.0,
        kpis,
        status
      });
    });

    return categoryScores;
  }

  /**
   * Calculate overall score
   */
  private calculateOverallScore(categoryScores: CategoryScore[]): number {
    const totalWeight = categoryScores.reduce((sum, category) => sum + category.weight, 0);
    const weightedScore = categoryScores.reduce((sum, category) => sum + (category.score * category.weight), 0);
    
    return totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 0;
  }

  /**
   * Calculate trends
   */
  private async calculateTrends(userId: string): Promise<BusinessHealthScore['trends']> {
    try {
      // Fetch historical business health data
      const historyResult = await select('business_health', ['overall_score', 'created_at'], {
        user_id: userId,
        order_by: 'created_at.desc',
        limit: 10
      });

      if (!historyResult.success || !historyResult.data || historyResult.data.length < 2) {
        return {
          overall: 'stable',
          monthlyChange: 0,
          weeklyChange: 0
        };
      }

      const history = historyResult.data;
      const currentScore = history[0].overall_score;
      const previousScore = history[1].overall_score;
      const monthlyChange = currentScore - previousScore;
      const weeklyChange = monthlyChange / 4; // Rough approximation

      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (monthlyChange > 5) trend = 'up';
      else if (monthlyChange < -5) trend = 'down';

      return {
        overall: trend,
        monthlyChange,
        weeklyChange
      };

    } catch (error) {
      this.logger.error('Error calculating trends', { error });
      return {
        overall: 'stable',
        monthlyChange: 0,
        weeklyChange: 0
      };
    }
  }

  /**
   * Generate recommendations based on scores
   */
  private generateRecommendations(kpiScores: KPIScore[], categoryScores: CategoryScore[]): string[] {
    const recommendations: string[] = [];

    // Find lowest scoring categories
    const sortedCategories = [...categoryScores].sort((a, b) => a.score - b.score);
    const lowestCategory = sortedCategories[0];

    if (lowestCategory && lowestCategory.score < 60) {
      recommendations.push(`Focus on improving ${lowestCategory.category} performance - current score: ${lowestCategory.score}%`);
    }

    // Find specific KPIs that need attention
    const poorKPIs = kpiScores.filter(kpi => kpi.status === 'poor');
    if (poorKPIs.length > 0) {
      const topPriority = poorKPIs[0];
      recommendations.push(`Prioritize ${topPriority.name} improvement - current score: ${topPriority.score}%`);
    }

    // Add general recommendations
    if (recommendations.length === 0) {
      recommendations.push('Maintain current performance levels across all departments');
      recommendations.push('Consider implementing additional data integrations for better insights');
    }

    return recommendations.slice(0, 5); // Limit to 5 recommendations
  }

  /**
   * Calculate data quality score
   */
  private calculateDataQuality(kpiScores: KPIScore[]): number {
    const totalKPIs = kpiScores.length;
    const kpisWithData = kpiScores.filter(kpi => 
      kpi.value !== 0 && kpi.value !== null && kpi.value !== undefined
    ).length;

    return Math.round((kpisWithData / totalKPIs) * 100);
  }

  /**
   * Store business health score in database
   */
  private async storeBusinessHealthScore(userId: string, score: BusinessHealthScore): Promise<void> {
    try {
      const result = await insertOne('business_health', {
        user_id: userId,
        overall_score: score.overallScore,
        category_scores: score.categoryScores,
        data_quality_score: score.dataQuality,
        last_calculated: score.lastCalculated,
        updated_at: new Date().toISOString()
      });

      if (!result.success) {
        this.logger.error('Error storing business health score', { error: result.error });
      }
    } catch (error) {
      this.logger.error('Error storing business health score', { error });
    }
  }

  /**
   * Get KPI definitions for external use
   */
  getKPIDefinitions(): KPIDefinition[] {
    return [...this.kpiDefinitions];
  }

  /**
   * Get category weights for external use
   */
  getCategoryWeights(): Record<string, number> {
    return { ...this.categoryWeights };
  }

  /**
   * Get KPI history for a company
   */
  async getKPIHistory(companyId: string, period: string): Promise<ServiceResponse<{
    history: Array<{
      date: string;
      overallScore: number;
      categoryScores: CategoryScore[];
      dataQuality: number;
    }>;
    trends: {
      overall: 'up' | 'down' | 'stable';
      monthlyChange: number;
      weeklyChange: number;
    };
  }>> {
    return this.executeDbOperation(async () => {
      try {
        // Get historical business health data
        const { data: historyData, error: historyError } = await selectData<any>('business_health', '*', { 
          company_id: companyId 
        });

        if (historyError || !historyData) {
          this.logger.error('Failed to fetch KPI history', { error: historyError, companyId });
          return { 
            data: null, 
            error: 'Failed to fetch KPI history',
            success: false 
          };
        }

        // Filter by period if specified
        let filteredData = historyData;
        if (period === 'month') {
          const oneMonthAgo = new Date();
          oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
          filteredData = historyData.filter((entry: any) => 
            new Date(entry.created_at || entry.updated_at) >= oneMonthAgo
          );
        } else if (period === 'week') {
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          filteredData = historyData.filter((entry: any) => 
            new Date(entry.created_at || entry.updated_at) >= oneWeekAgo
          );
        }

        // Sort by date (newest first)
        filteredData.sort((a: any, b: any) => 
          new Date(b.created_at || b.updated_at).getTime() - new Date(a.created_at || a.updated_at).getTime()
        );

        // Transform data to match expected format
        const history = filteredData.map((entry: any) => ({
          date: entry.created_at || entry.updated_at,
          overallScore: entry.overall_score || 0,
          categoryScores: entry.category_scores || [],
          dataQuality: entry.data_quality_score || 0
        }));

        // Calculate trends
        const trends = this.calculateTrendsFromHistory(history);

        this.logger.info('KPI history retrieved successfully', { 
          companyId, 
          period, 
          recordCount: history.length 
        });

        return { 
          data: { history, trends }, 
          error: null,
          success: true 
        };
      } catch (error) {
        this.logger.error('Error getting KPI history', { error, companyId });
        return { 
          data: null, 
          error: 'Failed to get KPI history',
          success: false 
        };
      }
    }, 'getKPIHistory');
  }

  /**
   * Calculate trends from historical data
   */
  private calculateTrendsFromHistory(history: Array<{ overallScore: number; date: string }>): {
    overall: 'up' | 'down' | 'stable';
    monthlyChange: number;
    weeklyChange: number;
  } {
    if (history.length < 2) {
      return {
        overall: 'stable',
        monthlyChange: 0,
        weeklyChange: 0
      };
    }

    const current = history[0].overallScore;
    const previous = history[1].overallScore;
    const monthlyChange = current - previous;
    const weeklyChange = Math.round(monthlyChange / 4); // Rough weekly estimate

    let overall: 'up' | 'down' | 'stable' = 'stable';
    if (monthlyChange > 5) overall = 'up';
    else if (monthlyChange < -5) overall = 'down';

    return {
      overall,
      monthlyChange,
      weeklyChange
    };
  }
}

// Export singleton instance
export const kpiCalculationService = KPICalculationService.getInstance();
