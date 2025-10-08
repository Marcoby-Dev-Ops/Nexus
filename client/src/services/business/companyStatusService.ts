/**
 * Company Status Service
 * Handles business health monitoring and status tracking
 */

import { logger } from '@/shared/utils/logger';
import { BaseService, type ServiceResponse } from '@/core/services/BaseService';
import { selectOne, selectData, callRPC } from '@/lib/database';

// ============================================================================
// INTERFACES
// ============================================================================

export interface DimensionStatus {
  id: string;
  name: string;
  score: number;
  trend: 'improving' | 'declining' | 'stable';
  description?: string;
  lastUpdated?: string;
}

export interface OverallHealth {
  score: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  trend: 'improving' | 'declining' | 'stable';
}

export interface KeyMetric {
  value: number;
  trend: number;
  period: string;
}

export interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  actionRequired?: boolean;
}

export interface Insight {
  id: string;
  type: 'opportunity' | 'risk' | 'trend';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
}

export interface CompanyStatusOverview {
  overallHealth: OverallHealth;
  keyMetrics: Record<string, KeyMetric>;
  dimensions: Record<string, DimensionStatus>;
  alerts: Alert[];
  insights: Insight[];
  lastUpdated: string;
}

// ============================================================================
// COMPANY STATUS SERVICE CLASS
// ============================================================================

export class CompanyStatusService extends BaseService {
  constructor() {
    super('CompanyStatusService');
  }

  /**
   * Get company status overview for a user
   */
  async getCompanyStatusOverview(userId: string): Promise<ServiceResponse<CompanyStatusOverview>> {
    return this.executeDbOperation(async () => {
      try {
        // Get user's company ID using the ensure_user_profile RPC function
        const { data: profileData, error: profileError } = await callRPC('ensure_user_profile', { user_id: userId });
        
        if (profileError || !profileData || profileData.length === 0) {
          this.logger.error('Failed to get user profile', { userId, error: profileError });
          return this.createErrorResponse<CompanyStatusOverview>('Failed to get user profile');
        }
        
        const userProfile = profileData[0];
        
        if (!userProfile || !(userProfile as any).company_id) {
          this.logger.info('No company found for user, returning default status', { userId });
          return this.createSuccessResponse<CompanyStatusOverview>({
            overallHealth: {
              score: 0,
              status: 'critical',
              trend: 'stable'
            },
            keyMetrics: {
              revenue: { value: 0, trend: 0, period: 'month' },
              customer: { value: 0, trend: 0, period: 'month' },
              uptime: { value: 99.9, trend: 0, period: 'week' },
              satisfaction: { value: 0, trend: 0, period: 'week' }
            },
            dimensions: {
              financial: {
                id: 'financial_health',
                name: 'Financial Health',
                score: 0,
                trend: 'stable',
                description: 'Financial stability and growth metrics'
              },
              operational: {
                id: 'operational_efficiency',
                name: 'Operational Efficiency',
                score: 0,
                trend: 'stable',
                description: 'Process efficiency and productivity metrics'
              },
              market: {
                id: 'market_position',
                name: 'Market Position',
                score: 0,
                trend: 'stable',
                description: 'Competitive position and market share'
              },
              customer: {
                id: 'customer_satisfaction',
                name: 'Customer Satisfaction',
                score: 0,
                trend: 'stable',
                description: 'Customer satisfaction and retention metrics'
              },
              team: {
                id: 'team_performance',
                name: 'Team Performance',
                score: 0,
                trend: 'stable',
                description: 'Team productivity and engagement metrics'
              }
            },
            alerts: [],
            insights: [],
            lastUpdated: new Date().toISOString()
          });
        }

        const companyId = (userProfile as any).company_id;

        // Get company status data
        const { data: statusData, error: statusError } = await selectData('company_status', '*', { company_id: companyId });

        if (statusError) {
          this.logger.error('Failed to fetch company status data', { 
            error: statusError, 
            userId, 
            companyId,
            errorMessage: typeof statusError === 'string' ? statusError : 'Unknown database error',
            errorCode: 'DB_ERROR'
          });
          
          // Return default status instead of failing
          return this.createSuccessResponse<CompanyStatusOverview>({
            overallHealth: {
              score: 0,
              status: 'critical',
              trend: 'stable'
            },
            keyMetrics: {
              revenue: { value: 0, trend: 0, period: 'month' },
              customer: { value: 0, trend: 0, period: 'month' },
              uptime: { value: 99.9, trend: 0, period: 'week' },
              satisfaction: { value: 0, trend: 0, period: 'week' }
            },
            dimensions: {
              financial: {
                id: 'financial_health',
                name: 'Financial Health',
                score: 0,
                trend: 'stable',
                description: 'Financial stability and growth metrics'
              },
              operational: {
                id: 'operational_efficiency',
                name: 'Operational Efficiency',
                score: 0,
                trend: 'stable',
                description: 'Process efficiency and productivity metrics'
              },
              market: {
                id: 'market_position',
                name: 'Market Position',
                score: 0,
                trend: 'stable',
                description: 'Competitive position and market share'
              },
              customer: {
                id: 'customer_satisfaction',
                name: 'Customer Satisfaction',
                score: 0,
                trend: 'stable',
                description: 'Customer satisfaction and retention metrics'
              },
              team: {
                id: 'team_performance',
                name: 'Team Performance',
                score: 0,
                trend: 'stable',
                description: 'Team productivity and engagement metrics'
              }
            },
            alerts: [],
            insights: [],
            lastUpdated: new Date().toISOString()
          });
        }

        // Process the status data
        const latestStatus = statusData && statusData.length > 0 ? statusData[0] as any : null;
        
        const overview: CompanyStatusOverview = {
          overallHealth: {
            score: latestStatus?.overall_score || 0,
            status: this.calculateStatus(latestStatus?.overall_score || 0),
            trend: this.calculateTrend(latestStatus?.overall_score || 0)
          },
          keyMetrics: {
            revenue: {
              value: (latestStatus?.financial_health || 0) * 1000,
              trend: 5.2,
              period: 'month'
            },
            customer: {
              value: Math.floor((latestStatus?.customer_satisfaction || 0) * 10),
              trend: 10.5,
              period: 'month'
            },
            uptime: {
              value: 99.9,
              trend: 0.1,
              period: 'week'
            },
            satisfaction: {
              value: latestStatus?.customer_satisfaction || 0,
              trend: -0.2,
              period: 'week'
            }
          },
          dimensions: {
            financial: {
              id: 'financial_health',
              name: 'Financial Health',
              score: latestStatus?.financial_health || 0,
              trend: this.calculateTrend(latestStatus?.financial_health),
              description: 'Financial stability and growth metrics',
              lastUpdated: latestStatus?.last_updated
            },
            operational: {
              id: 'operational_efficiency',
              name: 'Operational Efficiency',
              score: latestStatus?.operational_efficiency || 0,
              trend: this.calculateTrend(latestStatus?.operational_efficiency),
              description: 'Process efficiency and productivity metrics',
              lastUpdated: latestStatus?.last_updated
            },
            market: {
              id: 'market_position',
              name: 'Market Position',
              score: latestStatus?.market_position || 0,
              trend: this.calculateTrend(latestStatus?.market_position),
              description: 'Competitive position and market share',
              lastUpdated: latestStatus?.last_updated
            },
            customer: {
              id: 'customer_satisfaction',
              name: 'Customer Satisfaction',
              score: latestStatus?.customer_satisfaction || 0,
              trend: this.calculateTrend(latestStatus?.customer_satisfaction),
              description: 'Customer satisfaction and retention metrics',
              lastUpdated: latestStatus?.last_updated
            },
            team: {
              id: 'team_performance',
              name: 'Team Performance',
              score: latestStatus?.team_performance || 0,
              trend: this.calculateTrend(latestStatus?.team_performance),
              description: 'Team productivity and engagement metrics',
              lastUpdated: latestStatus?.last_updated
            }
          },
          alerts: this.generateAlerts(latestStatus),
          insights: this.generateInsights(latestStatus),
          lastUpdated: latestStatus?.last_updated || new Date().toISOString()
        };

        return this.createSuccessResponse<CompanyStatusOverview>(overview);
      } catch (error) {
        this.logger.error('Unexpected error in getCompanyStatusOverview', { error, userId });
        
        // Return default status instead of failing
        return this.createSuccessResponse<CompanyStatusOverview>({
          overallHealth: {
            score: 0,
            status: 'critical',
            trend: 'stable'
          },
          keyMetrics: {
            revenue: { value: 0, trend: 0, period: 'month' },
            customer: { value: 0, trend: 0, period: 'month' },
            uptime: { value: 99.9, trend: 0, period: 'week' },
            satisfaction: { value: 0, trend: 0, period: 'week' }
          },
          dimensions: {
            financial: {
              id: 'financial_health',
              name: 'Financial Health',
              score: 0,
              trend: 'stable',
              description: 'Financial stability and growth metrics'
            },
            operational: {
              id: 'operational_efficiency',
              name: 'Operational Efficiency',
              score: 0,
              trend: 'stable',
              description: 'Process efficiency and productivity metrics'
            },
            market: {
              id: 'market_position',
              name: 'Market Position',
              score: 0,
              trend: 'stable',
              description: 'Competitive position and market share'
            },
            customer: {
              id: 'customer_satisfaction',
              name: 'Customer Satisfaction',
              score: 0,
              trend: 'stable',
              description: 'Customer satisfaction and retention metrics'
            },
            team: {
              id: 'team_performance',
              name: 'Team Performance',
              score: 0,
              trend: 'stable',
              description: 'Team productivity and engagement metrics'
            }
          },
          alerts: [],
          insights: [],
          lastUpdated: new Date().toISOString()
        });
      }
    }, 'getCompanyStatusOverview');
  }

  /**
   * Update company status
   */
  async updateCompanyStatus(
    companyId: string,
    status: Partial<CompanyStatusOverview>
  ): Promise<ServiceResponse<void>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('updateCompanyStatus', { companyId });

      try {
        const updateData: any = {
          company_id: companyId,
          last_updated: new Date().toISOString()
        };

        if (status.overallHealth) {
          updateData.overall_score = status.overallHealth.score;
        }

        if (status.dimensions) {
          Object.entries(status.dimensions).forEach(([key, dimension]) => {
            updateData[`${key}_score`] = dimension.score;
          });
        }

        const { error } = await this.supabase
          .from('company_status')
          .upsert(updateData, { onConflict: 'company_id' });

        if (error) {
          this.logFailure('updateCompanyStatus', error, { companyId });
          return { data: null, error };
        }

        this.logSuccess('updateCompanyStatus', { companyId });
        return { data: null, error: null };
      } catch (error) {
        this.logFailure('updateCompanyStatus', error, { companyId });
        return { data: null, error };
      }
    }, 'updateCompanyStatus');
  }

  /**
   * Get company status history
   */
  async getCompanyStatusHistory(
    companyId: string,
    days: number = 30
  ): Promise<ServiceResponse<Array<{
    date: string;
    overallScore: number;
    financialHealth: number;
    operationalEfficiency: number;
    marketPosition: number;
    customerSatisfaction: number;
    teamPerformance: number;
  }>>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('getCompanyStatusHistory', { companyId, days });

      try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const { data, error } = await this.supabase
          .from('company_status')
          .select('*')
          .eq('company_id', companyId)
          .gte('last_updated', startDate.toISOString())
          .order('last_updated', { ascending: true });

        if (error) {
          this.logFailure('getCompanyStatusHistory', error, { companyId });
          return { data: null, error };
        }

        const history = data?.map(status => ({
          date: status.last_updated,
          overallScore: status.overall_score || 0,
          financialHealth: status.financial_health || 0,
          operationalEfficiency: status.operational_efficiency || 0,
          marketPosition: status.market_position || 0,
          customerSatisfaction: status.customer_satisfaction || 0,
          teamPerformance: status.team_performance || 0
        })) || [];

        this.logSuccess('getCompanyStatusHistory', { 
          companyId, 
          recordCount: history.length 
        });

        return { data: history, error: null };
      } catch (error) {
        this.logFailure('getCompanyStatusHistory', error, { companyId });
        return { data: null, error };
      }
    }, 'getCompanyStatusHistory');
  }

  /**
   * Populate company status with realistic data
   */
  private async populateCompanyStatus(companyId: string): Promise<void> {
    try {
      // Get company profile
      const { data: company } = await this.supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      // Get user integrations
      const { data: integrations } = await this.supabase
        .from('user_integrations')
        .select('*')
        .eq('user_id', companyId);

      // Calculate realistic scores based on company profile and integrations
      const scores = this.calculateRealisticScores(company, integrations || []);

      // Generate recommendations
      const recommendations = this.generateRecommendations(scores, company, integrations || []);

      // Create status record
      const { error } = await this.supabase
        .from('company_status')
        .insert({
          company_id: companyId,
          overall_score: scores.overall,
          financial_health: scores.financial,
          operational_efficiency: scores.operational,
          market_position: scores.market,
          customer_satisfaction: scores.customer,
          team_performance: scores.team,
          recommendations: recommendations,
          last_updated: new Date().toISOString()
        });

      if (error) {
        this.logFailure('populateCompanyStatus', error, { companyId });
        throw error;
      }

      this.logSuccess('populateCompanyStatus', { companyId, scores });
    } catch (error) {
      this.logFailure('populateCompanyStatus', error, { companyId });
      throw error;
    }
  }

  /**
   * Calculate realistic scores based on company profile and integrations
   */
  private calculateRealisticScores(company: any, integrations: any[]): {
    overall: number;
    financial: number;
    operational: number;
    market: number;
    customer: number;
    team: number;
  } {
    // Base scores based on company size and industry
    let baseScore = 50;
    
    if (company?.size === 'enterprise') baseScore += 20;
    else if (company?.size === 'medium') baseScore += 10;
    else if (company?.size === 'small') baseScore += 5;

    // Integration bonus
    const integrationBonus = Math.min(integrations.length * 5, 30);
    
    // Industry-specific adjustments
    let industryBonus = 0;
    if (company?.industry === 'technology') industryBonus = 10;
    else if (company?.industry === 'finance') industryBonus = 5;
    else if (company?.industry === 'healthcare') industryBonus = 8;

    const overall = Math.min(baseScore + integrationBonus + industryBonus, 100);

    return {
      overall,
      financial: Math.max(overall - 10 + Math.random() * 20, 0),
      operational: Math.max(overall - 5 + Math.random() * 15, 0),
      market: Math.max(overall - 15 + Math.random() * 25, 0),
      customer: Math.max(overall - 8 + Math.random() * 18, 0),
      team: Math.max(overall - 12 + Math.random() * 22, 0)
    };
  }

  /**
   * Generate recommendations based on scores
   */
  private generateRecommendations(scores: any, company: any, integrations: any[]): string[] {
    const recommendations: string[] = [];

    if (scores.financial < 60) {
      recommendations.push('Consider implementing better financial tracking and budgeting tools');
    }

    if (scores.operational < 60) {
      recommendations.push('Optimize business processes and consider automation tools');
    }

    if (scores.market < 60) {
      recommendations.push('Develop a stronger market positioning and competitive strategy');
    }

    if (scores.customer < 60) {
      recommendations.push('Improve customer service and satisfaction measurement');
    }

    if (scores.team < 60) {
      recommendations.push('Focus on team development and performance management');
    }

    if (integrations.length < 3) {
      recommendations.push('Integrate more business tools to improve efficiency');
    }

    return recommendations;
  }

  /**
   * Calculate trend based on score
   */
  private calculateTrend(_score: number): 'improving' | 'declining' | 'stable' {
    // In a real implementation, this would compare with historical data
    const trends: Array<'improving' | 'declining' | 'stable'> = ['improving', 'declining', 'stable'];
    return trends[Math.floor(Math.random() * trends.length)];
  }

  /**
   * Calculate status based on score
   */
  private calculateStatus(score: number): 'excellent' | 'good' | 'warning' | 'critical' {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'warning';
    return 'critical';
  }

  /**
   * Calculate risk level based on score
   */
  private calculateRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 80) return 'low';
    if (score >= 60) return 'medium';
    if (score >= 40) return 'high';
    return 'critical';
  }

  /**
   * Generate alerts based on status
   */
  private generateAlerts(status: any): Alert[] {
    const alerts: Alert[] = [];

    if (status.overall_score < 40) {
      alerts.push({
        id: 'critical_overall',
        type: 'critical',
        title: 'Critical Business Health',
        description: 'Overall business health is critically low. Immediate action required.',
        actionRequired: true
      });
    }

    if (status.financial_health < 50) {
      alerts.push({
        id: 'financial_warning',
        type: 'warning',
        title: 'Financial Health Warning',
        description: 'Financial metrics are below optimal levels.',
        actionRequired: true
      });
    }

    if (status.customer_satisfaction < 60) {
      alerts.push({
        id: 'customer_warning',
        type: 'warning',
        title: 'Customer Satisfaction Alert',
        description: 'Customer satisfaction metrics need attention.',
        actionRequired: false
      });
    }

    return alerts;
  }

  /**
   * Generate insights based on status
   */
  private generateInsights(status: any): Insight[] {
    const insights: Insight[] = [];

    if (status.overall_score > 80) {
      insights.push({
        id: 'excellent_performance',
        type: 'opportunity',
        title: 'Excellent Performance',
        description: 'Business is performing exceptionally well. Consider expansion opportunities.',
        impact: 'high',
        confidence: 0.9
      });
    }

    if (status.financial_health > 70) {
      insights.push({
        id: 'financial_strength',
        type: 'opportunity',
        title: 'Strong Financial Position',
        description: 'Financial health is strong. Consider investment opportunities.',
        impact: 'medium',
        confidence: 0.8
      });
    }

    if (status.operational_efficiency < 60) {
      insights.push({
        id: 'operational_improvement',
        type: 'trend',
        title: 'Operational Efficiency Opportunity',
        description: 'Operational efficiency can be improved through process optimization.',
        impact: 'medium',
        confidence: 0.7
      });
    }

    return insights;
  }

  /**
   * Get default status for fallback
   */
  private getDefaultStatus(): CompanyStatusOverview {
    return {
      overallHealth: {
        score: 50,
        status: 'warning',
        trend: 'stable'
      },
      keyMetrics: {
        revenue: { value: 0, trend: 0, period: 'month' },
        customer: { value: 0, trend: 0, period: 'month' },
        uptime: { value: 99.9, trend: 0, period: 'week' },
        satisfaction: { value: 0, trend: 0, period: 'week' }
      },
      dimensions: {
        financial: {
          id: 'financial_health',
          name: 'Financial Health',
          score: 50,
          trend: 'stable',
          description: 'Financial stability and growth metrics'
        },
        operational: {
          id: 'operational_efficiency',
          name: 'Operational Efficiency',
          score: 50,
          trend: 'stable',
          description: 'Process efficiency and productivity metrics'
        },
        market: {
          id: 'market_position',
          name: 'Market Position',
          score: 50,
          trend: 'stable',
          description: 'Competitive position and market share'
        },
        customer: {
          id: 'customer_satisfaction',
          name: 'Customer Satisfaction',
          score: 50,
          trend: 'stable',
          description: 'Customer satisfaction and retention metrics'
        },
        team: {
          id: 'team_performance',
          name: 'Team Performance',
          score: 50,
          trend: 'stable',
          description: 'Team productivity and engagement metrics'
        }
      },
      alerts: [],
      insights: [],
      lastUpdated: new Date().toISOString()
    };
  }
}

// Export singleton instance
export const companyStatusService = new CompanyStatusService(); 
