import { supabase } from '@/core/supabase';
import { DatabaseQueryWrapper } from '@/core/database/queryWrapper';
import { logger } from '@/shared/utils/logger';

export interface EABusinessObservation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  impact: string;
  recommendations: string[];
  created_at: string;
  user_id: string;
  company_id: string;
}

export interface BusinessMetrics {
  revenue: number;
  growth_rate: number;
  customer_count: number;
  employee_count: number;
  churn_rate: number;
  customer_satisfaction: number;
}

export interface TrendAnalysis {
  metric: string;
  current_value: number;
  previous_value: number;
  change_percentage: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  significance: 'high' | 'medium' | 'low';
}

export interface BusinessAlert {
  id: string;
  type: 'anomaly' | 'threshold' | 'trend' | 'opportunity';
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  actionable: boolean;
  created_at: string;
}

export class BusinessObservationService {
  private queryWrapper = new DatabaseQueryWrapper();

  /**
   * Generate business observations based on current data
   */
  async generateBusinessObservations(userId: string, companyId: string): Promise<EABusinessObservation[]> {
    try {
      logger.info('Generating business observations for user:', userId);

      // Fetch business metrics with proper authentication
      const metrics = await this.getBusinessMetrics(companyId);
      const trends = await this.analyzeTrends(companyId);

      const observations: EABusinessObservation[] = [];

      // Analyze revenue trends
      if (trends.revenue) {
        if (trends.revenue.trend === 'decreasing' && trends.revenue.significance === 'high') {
          observations.push({
            id: `obs_${Date.now()}_1`,
            title: 'Revenue Decline Detected',
            description: `Revenue has decreased by ${Math.abs(trends.revenue.change_percentage)}% compared to previous period. This requires immediate attention.`,
            priority: 'high',
            category: 'financial',
            impact: 'High impact on business sustainability',
            recommendations: [
              'Review sales pipeline and conversion rates',
              'Analyze customer churn patterns',
              'Evaluate pricing strategy effectiveness'
            ],
            created_at: new Date().toISOString(),
            user_id: userId,
            company_id: companyId
          });
        }
      }

      // Analyze customer satisfaction
      if (metrics.customer_satisfaction < 7.0) {
        observations.push({
          id: `obs_${Date.now()}_2`,
          title: 'Customer Satisfaction Below Target',
          description: `Customer satisfaction score is ${metrics.customer_satisfaction}/10, below the target of 8.0.`,
          priority: 'medium',
          category: 'customer',
          impact: 'Medium impact on customer retention',
          recommendations: [
            'Review customer feedback and complaints',
            'Analyze support ticket patterns',
            'Evaluate product/service quality'
          ],
          created_at: new Date().toISOString(),
          user_id: userId,
          company_id: companyId
        });
      }

      // Analyze growth opportunities
      if (trends.customer_count && trends.customer_count.trend === 'increasing') {
        observations.push({
          id: `obs_${Date.now()}_3`,
          title: 'Strong Customer Growth',
          description: `Customer base is growing by ${trends.customer_count.change_percentage}%. This presents scaling opportunities.`,
          priority: 'low',
          category: 'growth',
          impact: 'Positive impact on business expansion',
          recommendations: [
            'Scale customer support operations',
            'Optimize onboarding processes',
            'Consider product expansion opportunities'
          ],
          created_at: new Date().toISOString(),
          user_id: userId,
          company_id: companyId
        });
      }

      // Store observations with proper authentication
      await this.storeObservations(observations);

      logger.info(`Generated ${observations.length} business observations`);
      return observations;
    } catch (error) {
      logger.error('Error generating business observations:', error);
      return [];
    }
  }

  /**
   * Get business metrics with proper authentication
   */
  private async getBusinessMetrics(companyId: string): Promise<BusinessMetrics> {
    try {
      const { data, error } = await this.queryWrapper.companyQuery(
        async () => supabase
          .rpc('get_business_metrics', { company_id: companyId }),
        companyId,
        'get-business-metrics'
      );

      if (error) {
        logger.error('Error fetching business metrics:', error);
        return this.getDefaultMetrics();
      }

      return data || this.getDefaultMetrics();
    } catch (error) {
      logger.error('Error in getBusinessMetrics:', error);
      return this.getDefaultMetrics();
    }
  }

  /**
   * Analyze business trends with proper authentication
   */
  private async analyzeTrends(companyId: string): Promise<Record<string, TrendAnalysis>> {
    try {
      const { data, error } = await this.queryWrapper.companyQuery(
        async () => supabase
          .rpc('analyze_business_trends', { company_id: companyId }),
        companyId,
        'analyze-business-trends'
      );

      if (error) {
        logger.error('Error analyzing business trends:', error);
        return {};
      }

      return data || {};
    } catch (error) {
      logger.error('Error in analyzeTrends:', error);
      return {};
    }
  }

  /**
   * Get business alerts with proper authentication
   */
  private async getBusinessAlerts(companyId: string): Promise<BusinessAlert[]> {
    try {
      const { data, error } = await this.queryWrapper.companyQuery(
        async () => supabase
          .from('business_alerts')
          .select('*')
          .eq('company_id', companyId)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(10),
        companyId,
        'get-business-alerts'
      );

      if (error) {
        logger.error('Error fetching business alerts:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('Error in getBusinessAlerts:', error);
      return [];
    }
  }

  /**
   * Store business observations with proper authentication
   */
  private async storeObservations(observations: EABusinessObservation[]): Promise<void> {
    try {
      for (const observation of observations) {
        const { error } = await this.queryWrapper.companyQuery(
          async () => supabase
            .from('business_observations')
            .insert(observation),
          observation.company_id,
          'store-business-observation'
        );

        if (error) {
          logger.error('Error storing business observation:', error);
        }
      }
    } catch (error) {
      logger.error('Error in storeObservations:', error);
    }
  }

  /**
   * Get recent business observations with proper authentication
   */
  async getRecentObservations(userId: string, companyId: string, limit = 10): Promise<EABusinessObservation[]> {
    try {
      const { data, error } = await this.queryWrapper.companyQuery(
        async () => supabase
          .from('business_observations')
          .select('*')
          .eq('company_id', companyId)
          .order('created_at', { ascending: false })
          .limit(limit),
        companyId,
        'get-recent-observations'
      );

      if (error) {
        logger.error('Error fetching recent observations:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('Error in getRecentObservations:', error);
      return [];
    }
  }

  /**
   * Create business alert with proper authentication
   */
  async createBusinessAlert(alert: Omit<BusinessAlert, 'id' | 'created_at'>): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.queryWrapper.companyQuery(
        async () => supabase
          .from('business_alerts')
          .insert({
            ...alert,
            created_at: new Date().toISOString()
          }),
        alert.company_id,
        'create-business-alert'
      );

      if (error) {
        throw new Error(error.message || 'Failed to create business alert');
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create business alert';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Update business observation with proper authentication
   */
  async updateObservation(observationId: string, updates: Partial<EABusinessObservation>): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.queryWrapper.companyQuery(
        async () => supabase
          .from('business_observations')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('id', observationId),
        updates.company_id || '',
        'update-observation'
      );

      if (error) {
        throw new Error(error.message || 'Failed to update observation');
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update observation';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get default metrics when data is unavailable
   */
  private getDefaultMetrics(): BusinessMetrics {
    return {
      revenue: 0,
      growth_rate: 0,
      customer_count: 0,
      employee_count: 0,
      churn_rate: 0,
      customer_satisfaction: 7.0
    };
  }
}

// Export singleton instance
export const businessObservationService = new BusinessObservationService(); 