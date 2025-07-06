import { supabase } from '../core/supabase';
import { logger } from '../security/logger';
import { DashboardMetricsService, type DashboardMetrics as RevenueMetrics } from './dashboardMetrics';
import { dashboardService, type DashboardMetrics, type DashboardActivity } from './dashboardService';

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
  data: Record<string, unknown>;
}

const dashboardMetricsService = new DashboardMetricsService();

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
  private async calculateFinancialDimension(dashboardData: RevenueMetrics): Promise<DimensionStatus> {
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
  private async calculateOperationalDimension(trinityMetrics: DashboardMetrics, integrationData: { connected: number }): Promise<DimensionStatus> {
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
  private async calculateInnovationDimension(trinityMetrics: DashboardMetrics): Promise<DimensionStatus> {
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
  private async calculateTeamDimension(activityData: DashboardActivity[]): Promise<DimensionStatus> {
    const recentActivities = activityData.length;
    const activeProjects = activityData.filter(a => a.status === 'active').length;
    
    let score = 60; // Base score
    score += Math.min(40, activeProjects * 0.4);

    return {
      score,
      status: this.getHealthStatus(score),
      trend: recentActivities > 20 ? 'improving' : recentActivities > 10 ? 'stable' : 'declining',
      keyIndicators: [
        `${recentActivities} recent activities`,
        `${Math.round(activeProjects * 100 / recentActivities)}% active projects`,
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
    // This is a mock. In a real scenario, you'd query your integration service.
    return { connected: 5, pending: 2 };
  }

  /**
   * Get recent activity summary
   */
  private async getRecentActivity(): Promise<DashboardActivity[]> {
    // This is a mock. You'd query a log or event stream.
    return [
      { type: 'think', title: 'Q3 Strategy Brainstorm', department: 'Leadership', time: '2 hours ago', status: 'active' },
      { type: 'act', title: 'Onboarding Workflow Automation', department: 'HR', time: '8 hours ago', status: 'completed' },
      { type: 'see', title: 'User Churn Risk Analysis', department: 'Analytics', time: '1 day ago', status: 'completed' }
    ];
  }

  /**
   * Generate alerts based on dimensional health
   */
  private async generateAlerts(dimensions: Record<string, DimensionStatus>): Promise<CompanyAlert[]> {
    const alerts: CompanyAlert[] = [];

    for (const [name, dimension] of Object.entries(dimensions)) {
      if (dimension.score < 60) {
        alerts.push({
          id: `${name}-low-score`,
          type: dimension.score < 40 ? 'critical' : 'warning',
          dimension: name,
          title: `${name.charAt(0).toUpperCase() + name.slice(1)} Performance Alert`,
          description: `Your ${name} score of ${dimension.score}% needs attention. ${dimension.actionItems[0] || 'Review and optimize this area.'}`,
          actionRequired: dimension.score < 40,
          createdAt: new Date().toISOString()
        });
      }
    }

    return alerts;
  }

  /**
   * Generate insights based on data patterns
   */
  private async generateInsights(dashboardData: RevenueMetrics, trinityMetrics: DashboardMetrics): Promise<CompanyInsight[]> {
    const insights: CompanyInsight[] = [];

    // Opportunity insight
    if (dashboardData.totalRevenue.change > 15) {
      insights.push({
        id: 'insight-revenue-opportunity',
        type: 'opportunity',
        title: 'High Revenue Growth Detected',
        description: `Revenue has grown by ${dashboardData.totalRevenue.change.toFixed(1)}% this period. There may be an opportunity to double down on successful strategies.`,
        impact: 'high',
        confidence: 0.9,
        data: {
          growth: dashboardData.totalRevenue.change,
          currentStrategies: ['New marketing campaign', 'Sales team expansion']
        }
      });
    }

    // Risk insight
    if (trinityMetrics.act.processEfficiency < 75) {
      insights.push({
        id: 'insight-efficiency-risk',
        type: 'risk',
        title: 'Low Operational Efficiency',
        description: `Process efficiency is at ${trinityMetrics.act.processEfficiency}%. This could indicate bottlenecks or a need for more automation.`,
        impact: 'medium',
        confidence: 0.85,
        data: {
          efficiency: trinityMetrics.act.processEfficiency,
          possibleCauses: ['Manual data entry', 'Lack of system integration']
        }
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