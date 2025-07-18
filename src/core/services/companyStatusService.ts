/**
 * Company Status Service
 * Provides company health and status monitoring
 */

import { supabase } from "../supabase";
import { logger } from '@/core/auth/logger';

export interface DimensionStatus {
  id: string;
  name: string;
  score: number;
  trend: 'improving' | 'declining' | 'stable';
  description?: string;
  lastUpdated?: string;
}

export interface CompanyStatusOverview {
  overallScore: number;
  dimensions: DimensionStatus[];
  lastUpdated: string;
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

class CompanyStatusService {
  /**
   * Get company status overview
   */
  async getCompanyStatusOverview(companyId?: string): Promise<CompanyStatusOverview> {
    try {
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
        logger.warn({ companyId }, 'No company status data found');
        return this.getDefaultStatus();
      }

      const status = data[0];
      
      return {
        overallScore: status.overall_score || 0,
        dimensions: [
          {
            id: 'financial_health',
            name: 'Financial Health',
            score: status.financial_health || 0,
            trend: this.calculateTrend(status.financial_health),
            description: 'Financial stability and growth metrics',
            lastUpdated: status.last_updated
          },
          {
            id: 'operational_efficiency',
            name: 'Operational Efficiency',
            score: status.operational_efficiency || 0,
            trend: this.calculateTrend(status.operational_efficiency),
            description: 'Process efficiency and productivity metrics',
            lastUpdated: status.last_updated
          },
          {
            id: 'market_position',
            name: 'Market Position',
            score: status.market_position || 0,
            trend: this.calculateTrend(status.market_position),
            description: 'Competitive position and market share',
            lastUpdated: status.last_updated
          },
          {
            id: 'customer_satisfaction',
            name: 'Customer Satisfaction',
            score: status.customer_satisfaction || 0,
            trend: this.calculateTrend(status.customer_satisfaction),
            description: 'Customer satisfaction and retention metrics',
            lastUpdated: status.last_updated
          },
          {
            id: 'employee_engagement',
            name: 'Employee Engagement',
            score: status.employee_engagement || 0,
            trend: this.calculateTrend(status.employee_engagement),
            description: 'Employee satisfaction and retention',
            lastUpdated: status.last_updated
          }
        ],
        lastUpdated: status.last_updated,
        recommendations: status.recommendations || [],
        riskLevel: this.calculateRiskLevel(status.overall_score || 0)
      };
    } catch (error) {
      logger.error({ companyId, error }, 'Failed to get company status overview');
      return this.getDefaultStatus();
    }
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
        company_id: companyId,
        overall_score: status.overallScore,
        financial_health: status.dimensions?.find(d => d.id === 'financial_health')?.score,
        operational_efficiency: status.dimensions?.find(d => d.id === 'operational_efficiency')?.score,
        market_position: status.dimensions?.find(d => d.id === 'market_position')?.score,
        customer_satisfaction: status.dimensions?.find(d => d.id === 'customer_satisfaction')?.score,
        employee_engagement: status.dimensions?.find(d => d.id === 'employee_engagement')?.score,
        recommendations: status.recommendations,
        risk_assessment: { risk_level: status.riskLevel },
        last_updated: new Date().toISOString()
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
  private calculateTrend(score: number): 'improving' | 'declining' | 'stable' {
    if (score >= 80) return 'improving';
    if (score >= 60) return 'stable';
    return 'declining';
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
      overallScore: 0,
      dimensions: [
        {
          id: 'financial_health',
          name: 'Financial Health',
          score: 0,
          trend: 'stable',
          description: 'Financial stability and growth metrics'
        },
        {
          id: 'operational_efficiency',
          name: 'Operational Efficiency',
          score: 0,
          trend: 'stable',
          description: 'Process efficiency and productivity metrics'
        },
        {
          id: 'market_position',
          name: 'Market Position',
          score: 0,
          trend: 'stable',
          description: 'Competitive position and market share'
        },
        {
          id: 'customer_satisfaction',
          name: 'Customer Satisfaction',
          score: 0,
          trend: 'stable',
          description: 'Customer satisfaction and retention metrics'
        },
        {
          id: 'employee_engagement',
          name: 'Employee Engagement',
          score: 0,
          trend: 'stable',
          description: 'Employee satisfaction and retention'
        }
      ],
      lastUpdated: new Date().toISOString(),
      recommendations: ['Complete company profile to get accurate status assessment'],
      riskLevel: 'critical'
    };
  }
}

export const companyStatusService = new CompanyStatusService(); 