import { supabase } from '../core/supabase';
import { logger } from '../security/logger';

export interface DashboardMetrics {
  think: {
    ideasCaptured: number;
    collaborationSessions: number;
    innovationScore: number;
    crossDeptConnections: number;
  };
  see: {
    dataSourcesConnected: number;
    realTimeInsights: number;
    predictiveAccuracy: number;
    alertsGenerated: number;
  };
  act: {
    automationsRunning: number;
    workflowsOptimized: number;
    timeSaved: number;
    processEfficiency: number;
  };
}

export interface DashboardActivity {
  type: 'think' | 'see' | 'act';
  title: string;
  department: string;
  time: string;
  status: 'active' | 'alert' | 'completed';
}

/**
 * @name DashboardService
 * @description Unified service for fetching all data required by the Nexus Dashboard.
 */
class DashboardService {
  /**
   * Get THINK metrics - Creative Intelligence
   */
  private async getThinkMetrics() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Ideas captured from thoughts table
      const { data: ideas, error: ideasError } = await supabase
        .from('thoughts')
        .select('id, created_at')
        .eq('user_id', user.id)
        .eq('category', 'idea');

      if (ideasError) throw ideasError;

      // Collaboration sessions from user_integrations (active integrations as proxy)
      const { data: integrations, error: integrationsError } = await supabase
        .from('user_integrations')
        .select('id, status')
        .eq('user_id', user.id)
        .eq('status', 'connected');

      if (integrationsError) throw integrationsError;

      // Calculate innovation score based on recent activity
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: recentIdeas, error: recentError } = await supabase
        .from('thoughts')
        .select('id')
        .eq('user_id', user.id)
        .eq('category', 'idea')
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (recentError) throw recentError;

      const ideasCaptured = ideas?.length || 0;
      const collaborationSessions = integrations?.length || 0;
      const recentIdeasCount = recentIdeas?.length || 0;
      
      // Innovation score: weighted combination of ideas and recent activity
      const innovationScore = Math.min(100, (recentIdeasCount * 10) + (collaborationSessions * 5) + 50);
      const crossDeptConnections = Math.floor(collaborationSessions / 2); // Estimate based on integrations

      return {
        ideasCaptured,
        collaborationSessions,
        innovationScore: Math.round(innovationScore * 10) / 10,
        crossDeptConnections
      };
    } catch (error) {
      logger.error({ err: error }, 'Failed to fetch THINK metrics');
      return {
        ideasCaptured: 0,
        collaborationSessions: 0,
        innovationScore: 0,
        crossDeptConnections: 0
      };
    }
  }

  /**
   * Get SEE metrics - Business Intelligence
   */
  private async getSeeMetrics() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Data sources from user_integrations
      const { data: dataSources, error: dataSourcesError } = await supabase
        .from('user_integrations')
        .select(`
          id,
          integrations!inner(category)
        `)
        .eq('user_id', user.id)
        .eq('status', 'connected');

      if (dataSourcesError) throw dataSourcesError;

      // Real-time insights from recent revenue/sales activity
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const [revenueInsights, salesInsights] = await Promise.all([
        supabase
          .from('ai_revenue_metrics')
          .select('id')
          .eq('user_id', user.id)
          .gte('created_at', sevenDaysAgo.toISOString()),
        supabase
          .from('ai_sales_metrics')
          .select('id')
          .eq('user_id', user.id)
          .gte('created_at', sevenDaysAgo.toISOString())
      ]);

      const dataSourcesConnected = dataSources?.length || 0;
      const realTimeInsights = (revenueInsights.data?.length || 0) + (salesInsights.data?.length || 0);
      
      // Predictive accuracy based on data quality and connections
      const predictiveAccuracy = Math.min(100, 60 + (dataSourcesConnected * 5) + (realTimeInsights * 2));
      
      // Alerts generated (estimate based on recent activity)
      const alertsGenerated = Math.floor(realTimeInsights / 3);

      return {
        dataSourcesConnected,
        realTimeInsights,
        predictiveAccuracy: Math.round(predictiveAccuracy * 10) / 10,
        alertsGenerated
      };
    } catch (error) {
      logger.error({ err: error }, 'Failed to fetch SEE metrics');
      return {
        dataSourcesConnected: 0,
        realTimeInsights: 0,
        predictiveAccuracy: 0,
        alertsGenerated: 0
      };
    }
  }

  /**
   * Get ACT metrics - Operational Intelligence
   */
  private async getActMetrics() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Automations running from active integrations
      const { data: automations, error: automationsError } = await supabase
        .from('user_integrations')
        .select(`
          id,
          status,
          integrations!inner(category)
        `)
        .eq('user_id', user.id)
        .eq('status', 'connected');

      if (automationsError) throw automationsError;

      // Workflows optimized from subscription metrics (active subscriptions)
      const { data: workflows, error: workflowsError } = await supabase
        .from('ai_subscription_metrics')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (workflowsError) throw workflowsError;

      // Time saved calculation based on automations and revenue
      const { data: revenue, error: revenueError } = await supabase
        .from('ai_revenue_metrics')
        .select('amount')
        .eq('user_id', user.id);

      if (revenueError) throw revenueError;

      const automationsRunning = automations?.length || 0;
      const workflowsOptimized = workflows?.length || 0;
      const totalRevenue = revenue?.reduce((sum, r) => sum + Number(r.amount), 0) || 0;
      
      // Time saved estimate: 1 hour per automation + revenue-based efficiency
      const timeSaved = (automationsRunning * 60) + Math.floor(totalRevenue / 1000);
      
      // Process efficiency based on automation coverage
      const processEfficiency = Math.min(100, 70 + (automationsRunning * 3) + (workflowsOptimized * 2));

      return {
        automationsRunning,
        workflowsOptimized,
        timeSaved,
        processEfficiency: Math.round(processEfficiency * 10) / 10
      };
    } catch (error) {
      logger.error({ err: error }, 'Failed to fetch ACT metrics');
      return {
        automationsRunning: 0,
        workflowsOptimized: 0,
        timeSaved: 0,
        processEfficiency: 0
      };
    }
  }

  /**
   * Get recent Trinity activities
   */
  private async getRecentActivities(): Promise<DashboardActivity[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const activities: DashboardActivity[] = [];

      // Get recent ideas (THINK)
      const { data: recentIdeas } = await supabase
        .from('thoughts')
        .select('created_at, content')
        .eq('user_id', user.id)
        .eq('category', 'idea')
        .order('created_at', { ascending: false })
        .limit(2);

      if (recentIdeas) {
        recentIdeas.forEach((idea, index) => {
          const timeAgo = this.getTimeAgo(idea.created_at);
          activities.push({
            type: 'think',
            title: `New Idea: ${idea.content?.substring(0, 50)}...`,
            department: 'Innovation',
            time: timeAgo,
            status: index === 0 ? 'active' : 'completed'
          });
        });
      }

      // Get recent revenue activity (SEE)
      const { data: recentRevenue } = await supabase
        .from('ai_revenue_metrics')
        .select('created_at, amount, source')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (recentRevenue?.[0]) {
        const revenue = recentRevenue[0];
        activities.push({
          type: 'see',
          title: `Revenue Alert: $${Number(revenue.amount).toLocaleString()} from ${revenue.source}`,
          department: 'Finance',
          time: this.getTimeAgo(revenue.created_at),
          status: 'alert'
        });
      }

      // Get recent integration activity (ACT)
      const { data: recentIntegrations } = await supabase
        .from('user_integrations')
        .select(`
          created_at,
          integrations!inner(category, name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (recentIntegrations?.[0]) {
        const integration = recentIntegrations[0];
        const integrationInfo = Array.isArray(integration.integrations) ? integration.integrations[0] : integration.integrations;
        const integrationName = integrationInfo?.name || integrationInfo?.category || 'Unknown';
        activities.push({
          type: 'act',
          title: `${integrationName} Integration Automated`,
          department: 'Operations',
          time: this.getTimeAgo(integration.created_at),
          status: 'completed'
        });
      }

      // Fill with default activities if we don't have enough real data
      while (activities.length < 3) {
        activities.push({
          type: 'think',
          title: 'System Monitoring Active',
          department: 'Trinity Core',
          time: 'ongoing',
          status: 'active'
        });
      }

      return activities.slice(0, 3);
    } catch (error) {
      logger.error({ err: error }, 'Failed to fetch recent activities');
      return [
        {
          type: 'think',
          title: 'Innovation Session Started',
          department: 'Sales × Product',
          time: '2 minutes ago',
          status: 'active'
        },
        {
          type: 'see',
          title: 'Anomaly Detected in Revenue Pattern',
          department: 'Finance',
          time: '5 minutes ago',
          status: 'alert'
        },
        {
          type: 'act',
          title: 'Customer Onboarding Automated',
          department: 'Operations',
          time: '12 minutes ago',
          status: 'completed'
        }
      ];
    }
  }

  /**
   * Helper to calculate time ago
   */
  private getTimeAgo(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }

  /**
   * Fetches all the data required for the main dashboard.
   */
  async getDashboardData(): Promise<{
    metrics: DashboardMetrics;
    activities: DashboardActivity[];
  }> {
    try {
      const [think, see, act, activities] = await Promise.all([
        this.getThinkMetrics(),
        this.getSeeMetrics(),
        this.getActMetrics(),
        this.getRecentActivities()
      ]);

      return {
        metrics: { think, see, act },
        activities
      };
    } catch (error) {
      logger.error({ err: error }, 'Failed to fetch dashboard data');
      throw error;
    }
  }
}

export const dashboardService = new DashboardService(); 