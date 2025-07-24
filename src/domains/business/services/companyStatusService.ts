/**
 * Company Status Service
 * Provides company health and status monitoring
 */

import { supabase } from '@/core/supabase';
import { logger } from '@/core/auth/logger';

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

class CompanyStatusService {
  /**
   * Get company status overview
   */
  async getCompanyStatusOverview(companyId?: string): Promise<CompanyStatusOverview> {
    try {
      // Wait for authentication to be ready with retry
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        logger.warn('No authenticated user for company status overview', { sessionError });
        return this.getDefaultStatus();
      }

      // If no companyId provided, use the user's company_id
      if (!companyId) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('company_id')
          .eq('id', session.user.id)
          .single();
        
        companyId = profile?.company_id || session.user.id;
      }

      let query = supabase
        .from('company_status')
        .select('*')
        .order('last_updated', { ascending: false })
        .limit(1);

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query;

      if (error) {
        logger.error({ companyId, error }, 'Failed to fetch company status overview');
        return this.getDefaultStatus();
      }

      if (!data || data.length === 0) {
        logger.warn({ companyId }, 'No company status data found, populating with realistic data');
        // Populate with realistic data based on company profile and integrations
        await this.populateCompanyStatus(companyId);
        return this.getCompanyStatusOverview(companyId); // Recursive call to get the populated data
      }

      const status = data[0];
      const overallScore = status.overall_score || 0;
      

      
      return {
        overallHealth: {
          score: overallScore,
          status: this.calculateStatus(overallScore),
          trend: this.calculateTrend(overallScore)
        },
        keyMetrics: {
          revenue: {
            value: (status.financial_health || 0) * 1000,
            trend: 5.2,
            period: 'month'
          },
          customer: {
            value: Math.floor((status.customer_satisfaction || 0) * 10),
            trend: 10.5,
            period: 'month'
          },
          uptime: {
            value: 99.9,
            trend: 0.1,
            period: 'week'
          },
          satisfaction: {
            value: status.customer_satisfaction || 0,
            trend: -0.2,
            period: 'week'
          }
        },
        dimensions: {
          financial: {
            id: 'financial_health',
            name: 'Financial Health',
            score: status.financial_health || 0,
            trend: this.calculateTrend(status.financial_health),
            description: 'Financial stability and growth metrics',
            lastUpdated: status.last_updated
          },
          operational: {
            id: 'operational_efficiency',
            name: 'Operational Efficiency',
            score: status.operational_efficiency || 0,
            trend: this.calculateTrend(status.operational_efficiency),
            description: 'Process efficiency and productivity metrics',
            lastUpdated: status.last_updated
          },
          market: {
            id: 'market_position',
            name: 'Market Position',
            score: status.market_position || 0,
            trend: this.calculateTrend(status.market_position),
            description: 'Competitive position and market share',
            lastUpdated: status.last_updated
          },
          customer: {
            id: 'customer_satisfaction',
            name: 'Customer Satisfaction',
            score: status.customer_satisfaction || 0,
            trend: this.calculateTrend(status.customer_satisfaction),
            description: 'Customer satisfaction and retention metrics',
            lastUpdated: status.last_updated
          },
          team: {
            id: 'employee_engagement',
            name: 'Employee Engagement',
            score: status.employee_engagement || 0,
            trend: this.calculateTrend(status.employee_engagement),
            description: 'Employee satisfaction and retention',
            lastUpdated: status.last_updated
          }
        },
        alerts: [
          {
            id: '1',
            type: 'info',
            title: 'Company status updated',
            description: 'Your company health metrics have been calculated based on available data',
            actionRequired: false
          }
        ],
        insights: [
          {
            id: '1',
            type: 'opportunity',
            title: 'Integration opportunities',
            description: 'Connect more business systems to get comprehensive insights',
            impact: 'medium',
            confidence: 85
          }
        ],
        lastUpdated: status.last_updated || new Date().toISOString()
      };
    } catch (error) {
      logger.error({ error }, 'Error in getCompanyStatusOverview');
      return this.getDefaultStatus();
    }
  }

  /**
   * Populate company status with realistic data based on company profile and integrations
   */
  private async populateCompanyStatus(companyId: string): Promise<void> {
    try {
      // Get company profile
      const { data: company } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      // Get user integrations for this company
      const { data: integrations } = await supabase
        .from('user_integrations')
        .select(`
          *,
          integrations (
            name,
            category,
            description
          )
        `)
        .eq('status', 'active');

      // Calculate realistic scores based on company profile and integrations
      const scores = this.calculateRealisticScores(company, integrations || []);

      // Insert the calculated status
      const { error } = await supabase
        .from('company_status')
        .upsert({
          companyid: companyId,
          overallscore: scores.overall,
          financialhealth: scores.financial,
          operationalefficiency: scores.operational,
          marketposition: scores.market,
          customersatisfaction: scores.customer,
          employeeengagement: scores.team,
          riskassessment: { risklevel: this.calculateRiskLevel(scores.overall) },
          recommendations: this.generateRecommendations(scores, company, integrations || []),
          lastupdated: new Date().toISOString()
        }, { onConflict: 'company_id' });

      if (error) {
        logger.error({ companyId, error }, 'Failed to populate company status');
        throw error;
      }

      logger.info({ companyId, scores }, 'Successfully populated company status with realistic data');
    } catch (error) {
      logger.error({ companyId, error }, 'Error populating company status');
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
    let baseScore = 50; // Base score for any company

    // Boost based on company profile completeness
    if (company?.name) baseScore += 5;
    if (company?.industry) baseScore += 5;
    if (company?.size) baseScore += 5;
    if (company?.website) baseScore += 3;
    if (company?.description) baseScore += 3;
    if (company?.founded) baseScore += 2;

    // Boost based on integrations
    const activeIntegrations = integrations.length;
    const integrationBoost = Math.min(activeIntegrations * 8, 40); // Max 40 points from integrations
    baseScore += integrationBoost;

    // Calculate dimension-specific scores
    const financial = Math.min(baseScore + (company?.mrr ? 15: 0) + (company?.gross_margin ? 10: 0), 95);
    const operational = Math.min(baseScore + (activeIntegrations > 2 ? 15: 0) + (company?.employee_count ? 10: 0), 95);
    const market = Math.min(baseScore + (company?.industry ? 10: 0) + (company?.size ? 5: 0), 95);
    const customer = Math.min(baseScore + (company?.csat ? 15: 0) + (activeIntegrations > 1 ? 10: 0), 95);
    const team = Math.min(baseScore + (company?.employee_count ? 10: 0) + (activeIntegrations > 0 ? 5: 0), 95);

    // Calculate overall score as average of dimensions
    const overall = Math.round((financial + operational + market + customer + team) / 5);

    return {
      overall,
      financial,
      operational,
      market,
      customer,
      team
    };
  }

  /**
   * Generate recommendations based on scores and company data
   */
  private generateRecommendations(scores: any, company: any, integrations: any[]): string[] {
    const recommendations: string[] = [];

    if (scores.overall < 60) {
      recommendations.push('Complete your company profile to improve health assessment accuracy');
    }

    if (integrations.length < 2) {
      recommendations.push('Connect more business systems to get comprehensive insights');
    }

    if (scores.financial < 70) {
      recommendations.push('Consider connecting financial systems for better financial health tracking');
    }

    if (scores.customer < 70) {
      recommendations.push('Connect customer support systems to track satisfaction metrics');
    }

    if (!company?.industry) {
      recommendations.push('Add your industry information for better market positioning insights');
    }

    return recommendations;
  }

  /**
   * Update company status
   */
  async updateCompanyStatus(
    companyId: string,
    status: Partial<CompanyStatusOverview>
  ): Promise<void> {
    try {
      const updateData = {
        companyid: companyId,
        overallscore: Math.round(status.overallHealth?.score || 0),
        financialhealth: Math.round(status.dimensions?.financial?.score || 0),
        operationalefficiency: Math.round(status.dimensions?.operational?.score || 0),
        marketposition: Math.round(status.dimensions?.market?.score || 0),
        customersatisfaction: Math.round(status.dimensions?.customer?.score || 0),
        employeeengagement: Math.round(status.dimensions?.team?.score || 0),
        recommendations: status.insights?.map(i => i.description) || [],
        riskassessment: { risklevel: this.calculateRiskLevel(status.overallHealth?.score || 0) },
        lastupdated: new Date().toISOString()
      };

      const { error } = await supabase
        .from('company_status')
        .upsert(updateData, { onConflict: 'company_id' });

      if (error) {
        logger.error({ companyId, error }, 'Failed to update company status');
        throw error;
      }

      logger.info({ companyId }, 'Successfully updated company status');
    } catch (error) {
      logger.error({ companyId, error }, 'Failed to update company status');
      throw error;
    }
  }

  /**
   * Calculate trend based on score
   */
  private calculateTrend(_score: number): 'improving' | 'declining' | 'stable' {
    // For now, return stable. In a real implementation, this would compare historical data
    return 'stable';
  }

  /**
   * Calculate status based on score
   */
  private calculateStatus(score: number): 'excellent' | 'good' | 'warning' | 'critical' {
    if (score >= 85) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'warning';
    return 'critical';
  }

  /**
   * Calculate risk level based on overall score
   */
  private calculateRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 80) return 'low';
    if (score >= 60) return 'medium';
    if (score >= 40) return 'high';
    return 'critical';
  }

  /**
   * Get default status when no data is available
   */
  private getDefaultStatus(): CompanyStatusOverview {
    return {
      overallHealth: {
        score: 0,
        status: 'critical',
        trend: 'stable'
      },
      keyMetrics: {
        revenue: { value: 0, trend: 0, period: 'month' },
        customer: { value: 0, trend: 0, period: 'month' },
        uptime: { value: 0, trend: 0, period: 'week' },
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
          id: 'employee_engagement',
          name: 'Employee Engagement',
          score: 0,
          trend: 'stable',
          description: 'Employee satisfaction and retention'
        }
      },
      alerts: [
        {
          id: '1',
          type: 'warning',
          title: 'Complete company profile',
          description: 'Please complete your company profile to get accurate status assessment',
          actionRequired: true
        }
      ],
      insights: [
        {
          id: '1',
          type: 'opportunity',
          title: 'Profile completion needed',
          description: 'Complete your company profile to unlock personalized insights and recommendations',
          impact: 'medium',
          confidence: 90
        }
      ],
      lastUpdated: new Date().toISOString()
    };
  }
}

export const companyStatusService = new CompanyStatusService(); 