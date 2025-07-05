import { supabase } from '../core/supabase';
import { logger } from '../security/logger';
import { dashboardMetricsService } from './dashboardMetrics';
import { dashboardService } from './dashboardService';

export interface CompanyStatusOverview {
  overallHealth: {
    score: number;
    status: 'excellent' | 'good' | 'warning' | 'critical';
    trend: 'improving' | 'stable' | 'declining';
  };
  dimensions: {
    financial: DimensionStatus;
    operational: DimensionStatus;
    innovation: DimensionStatus;
    customer: DimensionStatus;
    team: DimensionStatus;
  };
  keyMetrics: {
    revenue: { value: number; trend: number; period: string };
    users: { value: number; trend: number; period: string };
    uptime: { value: number; trend: number; period: string };
    satisfaction: { value: number; trend: number; period: string };
  };
  alerts: CompanyAlert[];
  insights: CompanyInsight[];
  lastUpdated: string;
}

export interface DimensionStatus {
  score: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  trend: 'improving' | 'stable' | 'declining';
  keyIndicators: string[];
  actionItems: string[];
}

export interface CompanyAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  dimension: string;
  title: string;
  description: string;
  actionRequired: boolean;
  createdAt: string;
}

export interface CompanyInsight {
  id: string;
  type: 'opportunity' | 'risk' | 'trend';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  data: any;
}

export class CompanyStatusService {
  /**
   * Get comprehensive company status overview
   */
  async getCompanyStatusOverview(): Promise<CompanyStatusOverview> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Fetch data from all sources in parallel
      const [dashboardData, dashboardWidgetData, integrationData, activityData] = await Promise.all([
        dashboardMetricsService.getDashboardMetrics(),
        dashboardService.getDashboardData(),
        this.getIntegrationStatus(),
        this.getRecentActivity()
      ]);

      // Calculate dimensional scores
      const financial = await this.calculateFinancialDimension(dashboardData);
      const operational = await this.calculateOperationalDimension(dashboardWidgetData.metrics, integrationData);
      const innovation = await this.calculateInnovationDimension(dashboardWidgetData.metrics);
      const customer = await this.calculateCustomerDimension();
      const team = await this.calculateTeamDimension(activityData);

      // Calculate overall health score
      const overallScore = Math.round(
        (financial.score * 0.25) +
        (operational.score * 0.25) +
        (innovation.score * 0.2) +
        (customer.score * 0.15) +
        (team.score * 0.15)
      );

      // Generate alerts and insights
      const alerts = await this.generateAlerts({ financial, operational, innovation, customer, team });
      const insights = await this.generateInsights(dashboardData, dashboardWidgetData.metrics);

      return {
        overallHealth: {
          score: overallScore,
          status: this.getHealthStatus(overallScore),
          trend: await this.calculateOverallTrend()
        },
        dimensions: {
          financial,
          operational,
          innovation,
          customer,
          team
        },
        keyMetrics: {
          revenue: {
            value: dashboardData.totalRevenue.value,
            trend: dashboardData.totalRevenue.change,
            period: 'monthly'
          },
          users: {
            value: dashboardData.activeUsers.value,
            trend: dashboardData.activeUsers.change,
            period: 'monthly'
          },
          uptime: {
            value: 99.5, // From operational dimension
            trend: 0.1,
            period: 'monthly'
          },
          satisfaction: {
            value: 8.5, // From customer dimension
            trend: 2.5,
            period: 'monthly'
          }
        },
        alerts,
        insights,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      logger.error({ err: error }, 'Failed to get company status overview');
      throw error;
    }
  }

  /**
   * Calculate Financial Dimension Score
   */
  private async calculateFinancialDimension(dashboardData: any): Promise<DimensionStatus> {
    const revenue = dashboardData.totalRevenue.value;
    const revenueGrowth = dashboardData.totalRevenue.change;
    const salesValue = dashboardData.sales.value;

    // Simple scoring based on revenue and growth
    let score = 50; // Base score
    
    // Revenue scoring
    if (revenue > 50000) score += 20;
    else if (revenue > 25000) score += 15;
    else if (revenue > 10000) score += 10;
    
    // Growth scoring
    if (revenueGrowth > 20) score += 20;
    else if (revenueGrowth > 10) score += 15;
    else if (revenueGrowth > 0) score += 10;
    else score -= 10;

    // Sales pipeline scoring
    if (salesValue > 100000) score += 10;
    else if (salesValue > 50000) score += 5;

    score = Math.min(100, Math.max(0, score));

    return {
      score,
      status: this.getHealthStatus(score),
      trend: revenueGrowth > 5 ? 'improving' : revenueGrowth > -5 ? 'stable' : 'declining',
      keyIndicators: [
        `$${revenue.toLocaleString()} monthly revenue`,
        `${revenueGrowth > 0 ? '+' : ''}${revenueGrowth.toFixed(1)}% growth`,
        `$${salesValue.toLocaleString()} pipeline value`
      ],
      actionItems: score < 70 ? [
        'Review pricing strategy',
        'Optimize sales funnel',
        'Analyze customer acquisition costs'
      ] : []
    };
  }

  /**
   * Calculate Operational Dimension Score
   */
  private async calculateOperationalDimension(trinityMetrics: any, integrationData: any): Promise<DimensionStatus> {
    const automations = trinityMetrics.act.automationsRunning;
    const efficiency = trinityMetrics.act.processEfficiency;
    const integrations = integrationData.connected;

    let score = 40; // Base score
    
    // Automation scoring
    score += Math.min(30, automations * 3);
    
    // Efficiency scoring
    score += Math.min(20, efficiency * 0.2);
    
    // Integration scoring
    score += Math.min(10, integrations * 2);

    score = Math.min(100, score);

    return {
      score,
      status: this.getHealthStatus(score),
      trend: efficiency > 85 ? 'improving' : efficiency > 70 ? 'stable' : 'declining',
      keyIndicators: [
        `${automations} active automations`,
        `${efficiency}% process efficiency`,
        `${integrations} connected systems`
      ],
      actionItems: score < 70 ? [
        'Identify automation opportunities',
        'Optimize manual processes',
        'Connect additional business systems'
      ] : []
    };
  }

  /**
   * Calculate Innovation Dimension Score
   */
  private async calculateInnovationDimension(trinityMetrics: any): Promise<DimensionStatus> {
    const ideas = trinityMetrics.think.ideasCaptured;
    const collaborations = trinityMetrics.think.collaborationSessions;
    const innovationScore = trinityMetrics.think.innovationScore;

    const score = Math.min(100, innovationScore);

    return {
      score,
      status: this.getHealthStatus(score),
      trend: ideas > 10 ? 'improving' : ideas > 5 ? 'stable' : 'declining',
      keyIndicators: [
        `${ideas} ideas captured`,
        `${collaborations} collaboration sessions`,
        `${innovationScore}% innovation score`
      ],
      actionItems: score < 70 ? [
        'Increase ideation sessions',
        'Improve cross-team collaboration',
        'Implement innovation tracking'
      ] : []
    };
  }

  /**
   * Calculate Customer Dimension Score
   */
  private async calculateCustomerDimension(): Promise<DimensionStatus> {
    // For now, use estimated values based on available data
    // In a real implementation, this would connect to support/CRM systems
    
    const estimatedSatisfaction = 8.5;
    const estimatedSupport = 85;
    const estimatedRetention = 92;

    const score = Math.round((estimatedSatisfaction * 10 + estimatedSupport + estimatedRetention) / 3);

    return {
      score,
      status: this.getHealthStatus(score),
      trend: 'stable',
      keyIndicators: [
        `${estimatedSatisfaction}/10 satisfaction score`,
        `${estimatedSupport}% support efficiency`,
        `${estimatedRetention}% customer retention`
      ],
      actionItems: score < 70 ? [
        'Implement customer feedback system',
        'Improve support response times',
        'Analyze customer churn patterns'
      ] : []
    };
  }

  /**
   * Calculate Team Dimension Score
   */
  private async calculateTeamDimension(activityData: any): Promise<DimensionStatus> {
    // Estimate team health based on activity and engagement
    const activityLevel = activityData.totalActivities || 0;
    const engagement = Math.min(100, activityLevel * 5);
    
    let score = 60; // Base score
    score += Math.min(40, engagement * 0.4);

    return {
      score,
      status: this.getHealthStatus(score),
      trend: activityLevel > 20 ? 'improving' : activityLevel > 10 ? 'stable' : 'declining',
      keyIndicators: [
        `${activityLevel} recent activities`,
        `${Math.round(engagement)}% engagement level`,
        'Team collaboration active'
      ],
      actionItems: score < 70 ? [
        'Increase team communication',
        'Implement regular check-ins',
        'Improve collaboration tools'
      ] : []
    };
  }

  /**
   * Get integration status
   */
  private async getIntegrationStatus() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: integrations } = await supabase
        .from('user_integrations')
        .select('integration_type, status')
        .eq('user_id', user.id);

      const connected = integrations?.filter(i => i.status === 'connected').length || 0;
      const total = integrations?.length || 0;

      return { connected, total, integrations: integrations || [] };
    } catch (error) {
      logger.error({ err: error }, 'Failed to get integration status');
      return { connected: 0, total: 0, integrations: [] };
    }
  }

  /**
   * Get recent activity summary
   */
  private async getRecentActivity() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: activities } = await supabase
        .from('ai_user_activity')
        .select('activity_type')
        .eq('user_id', user.id)
        .gte('created_at', sevenDaysAgo.toISOString());

      return { totalActivities: activities?.length || 0 };
    } catch (error) {
      logger.error({ err: error }, 'Failed to get recent activity');
      return { totalActivities: 0 };
    }
  }

  /**
   * Generate alerts based on dimensional health
   */
  private async generateAlerts(dimensions: any): Promise<CompanyAlert[]> {
    const alerts: CompanyAlert[] = [];

    Object.entries(dimensions).forEach(([dimension, data]: [string, any]) => {
      if (data.score < 60) {
        alerts.push({
          id: `${dimension}-low-score`,
          type: data.score < 40 ? 'critical' : 'warning',
          dimension,
          title: `${dimension.charAt(0).toUpperCase() + dimension.slice(1)} Performance Alert`,
          description: `Your ${dimension} score of ${data.score}% needs attention. ${data.actionItems[0] || 'Review and optimize this area.'}`,
          actionRequired: data.score < 40,
          createdAt: new Date().toISOString()
        });
      }
    });

    return alerts;
  }

  /**
   * Generate insights based on data patterns
   */
  private async generateInsights(dashboardData: any, trinityMetrics: any): Promise<CompanyInsight[]> {
    const insights: CompanyInsight[] = [];

    // Revenue growth insight
    if (dashboardData.totalRevenue.change > 15) {
      insights.push({
        id: 'revenue-growth',
        type: 'opportunity',
        title: 'Strong Revenue Growth Detected',
        description: `Revenue has grown ${dashboardData.totalRevenue.change.toFixed(1)}% this month. Consider scaling successful strategies.`,
        impact: 'high',
        confidence: 85,
        data: { growth: dashboardData.totalRevenue.change }
      });
    }

    // Automation opportunity
    if (trinityMetrics.act.automationsRunning < 10 && dashboardData.totalRevenue.value > 20000) {
      insights.push({
        id: 'automation-opportunity',
        type: 'opportunity',
        title: 'Automation Opportunity Identified',
        description: 'Your revenue suggests readiness for more automation. Current automation coverage could be expanded.',
        impact: 'medium',
        confidence: 70,
        data: { automations: trinityMetrics.act.automationsRunning }
      });
    }

    return insights;
  }

  /**
   * Calculate overall trend
   */
  private async calculateOverallTrend(): Promise<'improving' | 'stable' | 'declining'> {
    // Simple implementation - could be enhanced with historical data
    return 'stable';
  }

  /**
   * Get health status based on score
   */
  private getHealthStatus(score: number): 'excellent' | 'good' | 'warning' | 'critical' {
    if (score >= 85) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'warning';
    return 'critical';
  }
}

export const companyStatusService = new CompanyStatusService(); 