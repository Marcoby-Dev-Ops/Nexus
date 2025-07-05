import { supabase } from '../core/supabase';
import { logger } from '../security/logger';

export interface DashboardMetrics {
  totalRevenue: {
    value: number;
    change: number;
    changeType: 'increase' | 'decrease';
  };
  subscriptions: {
    value: number;
    change: number;
    changeType: 'increase' | 'decrease';
  };
  sales: {
    value: number;
    change: number;
    changeType: 'increase' | 'decrease';
  };
  activeUsers: {
    value: number;
    change: number;
    changeType: 'increase' | 'decrease';
  };
}

export class DashboardMetricsService {
  /**
   * Calculate percentage change between current and previous period
   */
  private calculateChange(current: number, previous: number): { change: number; changeType: 'increase' | 'decrease' } {
    if (previous === 0) {
      return { change: current > 0 ? 100 : 0, changeType: 'increase' };
    }
    
    const change = ((current - previous) / previous) * 100;
    return {
      change: Math.abs(change),
      changeType: change >= 0 ? 'increase' : 'decrease'
    };
  }

  /**
   * Get total revenue metrics
   */
  private async getRevenueMetrics() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get current month revenue
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: currentRevenue, error: currentError } = await supabase
        .from('ai_revenue_metrics')
        .select('amount')
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth.toISOString());

      if (currentError) throw currentError;

      // Get previous month revenue
      const startOfPrevMonth = new Date();
      startOfPrevMonth.setMonth(startOfPrevMonth.getMonth() - 1);
      startOfPrevMonth.setDate(1);
      startOfPrevMonth.setHours(0, 0, 0, 0);

      const endOfPrevMonth = new Date(startOfMonth);
      endOfPrevMonth.setTime(endOfPrevMonth.getTime() - 1);

      const { data: prevRevenue, error: prevError } = await supabase
        .from('ai_revenue_metrics')
        .select('amount')
        .eq('user_id', user.id)
        .gte('created_at', startOfPrevMonth.toISOString())
        .lte('created_at', endOfPrevMonth.toISOString());

      if (prevError) throw prevError;

      const currentTotal = currentRevenue?.reduce((sum, r) => sum + Number(r.amount), 0) || 0;
      const prevTotal = prevRevenue?.reduce((sum, r) => sum + Number(r.amount), 0) || 0;

      return {
        value: currentTotal,
        ...this.calculateChange(currentTotal, prevTotal)
      };
    } catch (error) {
      logger.error({ err: error }, 'Failed to fetch revenue metrics');
      return { value: 0, change: 0, changeType: 'increase' as const };
    }
  }

  /**
   * Get subscription metrics
   */
  private async getSubscriptionMetrics() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get current active subscriptions
      const { data: currentSubs, error: currentError } = await supabase
        .from('ai_subscription_metrics')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (currentError) throw currentError;

      // Get subscriptions from last month for comparison
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      const { data: prevSubs, error: prevError } = await supabase
        .from('ai_subscription_metrics')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .lte('created_at', lastMonth.toISOString());

      if (prevError) throw prevError;

      const currentCount = currentSubs?.length || 0;
      const prevCount = prevSubs?.length || 0;

      return {
        value: currentCount,
        ...this.calculateChange(currentCount, prevCount)
      };
    } catch (error) {
      logger.error({ err: error }, 'Failed to fetch subscription metrics');
      return { value: 0, change: 0, changeType: 'increase' as const };
    }
  }

  /**
   * Get sales metrics
   */
  private async getSalesMetrics() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get current month sales
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: currentSales, error: currentError } = await supabase
        .from('ai_sales_metrics')
        .select('deal_value')
        .eq('user_id', user.id)
        .eq('status', 'closed-won')
        .gte('created_at', startOfMonth.toISOString());

      if (currentError) throw currentError;

      // Get previous month sales
      const startOfPrevMonth = new Date();
      startOfPrevMonth.setMonth(startOfPrevMonth.getMonth() - 1);
      startOfPrevMonth.setDate(1);
      startOfPrevMonth.setHours(0, 0, 0, 0);

      const endOfPrevMonth = new Date(startOfMonth);
      endOfPrevMonth.setTime(endOfPrevMonth.getTime() - 1);

      const { data: prevSales, error: prevError } = await supabase
        .from('ai_sales_metrics')
        .select('deal_value')
        .eq('user_id', user.id)
        .eq('status', 'closed-won')
        .gte('created_at', startOfPrevMonth.toISOString())
        .lte('created_at', endOfPrevMonth.toISOString());

      if (prevError) throw prevError;

      const currentTotal = currentSales?.reduce((sum, s) => sum + Number(s.deal_value), 0) || 0;
      const prevTotal = prevSales?.reduce((sum, s) => sum + Number(s.deal_value), 0) || 0;

      return {
        value: currentTotal,
        ...this.calculateChange(currentTotal, prevTotal)
      };
    } catch (error) {
      logger.error({ err: error }, 'Failed to fetch sales metrics');
      return { value: 0, change: 0, changeType: 'increase' as const };
    }
  }

  /**
   * Get active users metrics
   */
  private async getActiveUsersMetrics() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get unique active users in the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: currentUsers, error: currentError } = await supabase
        .from('ai_user_activity')
        .select('user_id')
        .eq('user_id', user.id)
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (currentError) throw currentError;

      // Get previous 30 days for comparison
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const { data: prevUsers, error: prevError } = await supabase
        .from('ai_user_activity')
        .select('user_id')
        .eq('user_id', user.id)
        .gte('created_at', sixtyDaysAgo.toISOString())
        .lt('created_at', thirtyDaysAgo.toISOString());

      if (prevError) throw prevError;

      // Count unique users
      const currentCount = new Set(currentUsers?.map(u => u.user_id)).size;
      const prevCount = new Set(prevUsers?.map(u => u.user_id)).size;

      return {
        value: currentCount,
        ...this.calculateChange(currentCount, prevCount)
      };
    } catch (error) {
      logger.error({ err: error }, 'Failed to fetch active users metrics');
      return { value: 0, change: 0, changeType: 'increase' as const };
    }
  }

  /**
   * Get all dashboard metrics
   */
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    try {
      const [revenue, subscriptions, sales, activeUsers] = await Promise.all([
        this.getRevenueMetrics(),
        this.getSubscriptionMetrics(),
        this.getSalesMetrics(),
        this.getActiveUsersMetrics()
      ]);

      return {
        totalRevenue: revenue,
        subscriptions,
        sales,
        activeUsers
      };
    } catch (error) {
      logger.error({ err: error }, 'Failed to fetch dashboard metrics');
      throw error;
    }
  }

  /**
   * Seed some sample data for demonstration (can be removed in production)
   */
  async seedSampleData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Insert sample revenue data
      const revenueData = [
        { user_id: user.id, amount: 15000, source: 'subscription', created_at: new Date().toISOString() },
        { user_id: user.id, amount: 8500, source: 'one-time', created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
        { user_id: user.id, amount: 12000, source: 'integration', created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() }
      ];

      // Insert sample subscription data
      const subscriptionData = [
        { user_id: user.id, plan_name: 'Pro', status: 'active', monthly_value: 99 },
        { user_id: user.id, plan_name: 'Enterprise', status: 'active', monthly_value: 299 }
      ];

      // Insert sample sales data
      const salesData = [
        { user_id: user.id, deal_value: 5000, status: 'closed-won', source: 'inbound' },
        { user_id: user.id, deal_value: 8500, status: 'closed-won', source: 'referral' }
      ];

      // Insert sample activity data
      const activityData = [
        { user_id: user.id, activity_type: 'login', metadata: {} },
        { user_id: user.id, activity_type: 'feature-use', metadata: { feature: 'dashboard' } }
      ];

      await Promise.all([
        supabase.from('ai_revenue_metrics').insert(revenueData),
        supabase.from('ai_subscription_metrics').insert(subscriptionData),
        supabase.from('ai_sales_metrics').insert(salesData),
        supabase.from('ai_user_activity').insert(activityData)
      ]);

      logger.info('Sample dashboard data seeded successfully');
    } catch (error) {
      logger.error({ err: error }, 'Failed to seed sample data');
    }
  }
}

export const dashboardMetricsService = new DashboardMetricsService(); 