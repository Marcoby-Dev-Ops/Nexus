/**
 * Dashboard Service
 * Provides centralized dashboard functionality and metrics
 */

import { supabase } from '@/core/supabase';
import { analyticsService } from '@/domains/analytics';
import { logger } from '@/core/auth/logger';

export interface DashboardConfig {
  layout: 'grid' | 'list' | 'compact';
  widgets: string[];
  refreshInterval: number;
  theme: 'light' | 'dark' | 'auto';
}

export interface DashboardMetrics {
  totalUsers: number;
  activeUsers: number;
  totalRevenue: number;
  conversionRate: number;
  averageSessionDuration: number;
  topPages: Array<{ page: string; views: number }>;
  recentActivity: Array<{ type: string; description: string; timestamp: Date }>;
}

export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'list';
  title: string;
  data: any;
  position: { x: number; y: number; width: number; height: number };
  config?: Record<string, any>;
}

class DashboardService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startHealthMonitoring();
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.checkSystemHealth();
      } catch (error) {
        logger.error({ error }, 'Dashboard health check failed');
      }
    }, 300000); // Every 5 minutes
  }

  /**
   * Stop health monitoring
   */
  private stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Get dashboard metrics with caching
   */
  async getDashboardMetrics(userId?: string): Promise<DashboardMetrics> {
    const cacheKey = `dashboard_metrics_${userId || 'global'}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const metrics = await this.fetchDashboardMetrics(userId);
      this.cache.set(cacheKey, { data: metrics, timestamp: Date.now() });
      return metrics;
    } catch (error) {
      logger.error({ userId, error }, 'Failed to fetch dashboard metrics');
      throw error;
    }
  }

  /**
   * Fetch dashboard metrics from various sources
   */
  private async fetchDashboardMetrics(userId?: string): Promise<DashboardMetrics> {
    try {
      // Get analytics metrics
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30); // Last 30 days
      
      const analyticsMetrics = await analyticsService.getMetrics(startDate, endDate, userId);
      
      // Get user data
      const { data: users, error: usersError } = await supabase
        .from('user_profiles')
        .select('id, created_at, last_sign_in_at')
        .order('created_at', { ascending: false });

      if (usersError) {
        logger.error({ error: usersError }, 'Failed to fetch users for dashboard');
        throw usersError;
      }

      // Get revenue data (mock for now)
      const totalRevenue = await this.getRevenueData();
      
      // Calculate metrics
      const totalUsers = users?.length || 0;
      const activeUsers = users?.filter(user => {
        const lastSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at) : null;
        return lastSignIn && (Date.now() - lastSignIn.getTime()) < 7 * 24 * 60 * 60 * 1000; // Last 7 days
      }).length || 0;

      const conversionRate = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;
      const averageSessionDuration = 180; // Mock data in seconds

      // Get top pages from analytics
      const topPages = analyticsMetrics.topEvents
        .filter(event => event.event_type === 'page_view')
        .slice(0, 5)
        .map(event => ({ page: event.event_type, views: event.count }));

      // Get recent activity
      const recentActivity = await this.getRecentActivity(userId);

      return {
        totalUsers,
        activeUsers,
        totalRevenue,
        conversionRate,
        averageSessionDuration,
        topPages,
        recentActivity
      };
    } catch (error) {
      logger.error({ userId, error }, 'Error fetching dashboard metrics');
      throw error;
    }
  }

  /**
   * Get revenue data (mock implementation)
   */
  private async getRevenueData(): Promise<number> {
    try {
      // In a real implementation, this would query billing/subscription data
      const { data: subscriptions, error } = await supabase
        .from('user_licenses')
        .select('tier, created_at')
        .neq('tier', 'free');

      if (error) {
        logger.warn({ error }, 'Failed to fetch revenue data, using mock');
        return 12500; // Mock revenue
      }

      // Calculate revenue based on subscriptions
      const tierPricing = { pro: 29, enterprise: 99 };
      const revenue = subscriptions?.reduce((total, sub) => {
        const price = tierPricing[sub.tier as keyof typeof tierPricing] || 0;
        return total + price;
      }, 0) || 0;

      return revenue;
    } catch (error) {
      logger.warn({ error }, 'Error calculating revenue, using fallback');
      return 12500; // Fallback revenue
    }
  }

  /**
   * Get recent activity
   */
  private async getRecentActivity(userId?: string): Promise<Array<{ type: string; description: string; timestamp: Date }>> {
    try {
      let query = supabase
        .from('activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data: activities, error } = await query;

      if (error) {
        logger.error({ error }, 'Failed to fetch recent activity');
        return [];
      }

      return activities?.map(activity => ({
        type: activity.type || 'unknown',
        description: activity.description || 'No description',
        timestamp: new Date(activity.created_at)
      })) || [];
    } catch (error) {
      logger.error({ error }, 'Error fetching recent activity');
      return [];
    }
  }

  /**
   * Get user's dashboard configuration
   */
  async getDashboardConfig(userId: string): Promise<DashboardConfig> {
    try {
      const { data: config, error } = await supabase
        .from('user_preferences')
        .select('dashboard_config')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        logger.error({ userId, error }, 'Failed to fetch dashboard config');
        throw error;
      }

      // Return default config if none exists
      return config?.dashboard_config || {
        layout: 'grid',
        widgets: ['metrics', 'recent_activity', 'top_pages'],
        refreshInterval: 300000, // 5 minutes
        theme: 'auto'
      };
    } catch (error) {
      logger.error({ userId, error }, 'Error fetching dashboard config');
      return {
        layout: 'grid',
        widgets: ['metrics', 'recent_activity', 'top_pages'],
        refreshInterval: 300000,
        theme: 'auto'
      };
    }
  }

  /**
   * Update user's dashboard configuration
   */
  async updateDashboardConfig(userId: string, config: Partial<DashboardConfig>): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          dashboard_config: config,
          updated_at: new Date().toISOString()
        });

      if (error) {
        logger.error({ userId, error }, 'Failed to update dashboard config');
        throw new Error(`Failed to update dashboard config: ${error.message}`);
      }

      logger.info({ userId }, 'Successfully updated dashboard config');
    } catch (error) {
      logger.error({ userId, error }, 'Error updating dashboard config');
      throw error;
    }
  }

  /**
   * Get dashboard widgets
   */
  async getDashboardWidgets(userId: string): Promise<DashboardWidget[]> {
    try {
      const metrics = await this.getDashboardMetrics(userId);

      const widgets: DashboardWidget[] = [
        {
          id: 'metrics_overview',
          type: 'metric',
          title: 'Key Metrics',
          data: {
            totalUsers: metrics.totalUsers,
            activeUsers: metrics.activeUsers,
            totalRevenue: metrics.totalRevenue,
            conversionRate: metrics.conversionRate
          },
          position: { x: 0, y: 0, width: 6, height: 2 }
        },
        {
          id: 'recent_activity',
          type: 'list',
          title: 'Recent Activity',
          data: metrics.recentActivity,
          position: { x: 6, y: 0, width: 6, height: 4 }
        },
        {
          id: 'top_pages',
          type: 'chart',
          title: 'Top Pages',
          data: metrics.topPages,
          position: { x: 0, y: 2, width: 6, height: 2 },
          config: { chartType: 'bar' }
        }
      ];

      return widgets;
    } catch (error) {
      logger.error({ userId, error }, 'Error fetching dashboard widgets');
      return [];
    }
  }

  /**
   * Check system health
   */
  private async checkSystemHealth(): Promise<{ status: 'healthy' | 'warning' | 'critical'; issues: string[] }> {
    const issues: string[] = [];

    try {
      // Check database connectivity
      const { error: dbError } = await supabase.from('user_profiles').select('id').limit(1);
      if (dbError) {
        issues.push('Database connectivity issues');
      }

      // Check analytics service
      try {
        await analyticsService.getMetrics(new Date(), new Date());
      } catch {
        issues.push('Analytics service unavailable');
      }

      // Check cache performance
      const cacheStats = this.getCacheStats();
      if (cacheStats.expiredEntries > cacheStats.totalEntries * 0.8) {
        issues.push('Cache performance degradation');
      }

      if (issues.length === 0) {
        return { status: 'healthy', issues: [] };
      } else if (issues.length <= 2) {
        return { status: 'warning', issues };
      } else {
        return { status: 'critical', issues };
      }
          } catch {
        logger.error('System health check failed');
        return { status: 'critical', issues: ['System health check failed'] };
      }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const entries = Array.from(this.cache.entries());
    const now = Date.now();
    
    const validEntries = entries.filter(([_, value]) => 
      now - value.timestamp < this.cacheTimeout
    );
    
    const expiredEntries = entries.filter(([_, value]) => 
      now - value.timestamp >= this.cacheTimeout
    );

    return {
      totalEntries: entries.length,
      validEntries: validEntries.length,
      expiredEntries: expiredEntries.length,
      cacheTimeout: this.cacheTimeout
    };
  }

  /**
   * Clear dashboard cache
   */
  clearCache(pattern?: string): void {
    if (pattern) {
      const keysToDelete = Array.from(this.cache.keys()).filter(key => 
        key.includes(pattern)
      );
      keysToDelete.forEach(key => this.cache.delete(key));
      logger.debug({ pattern, deletedCount: keysToDelete.length }, 'Cleared dashboard cache pattern');
    } else {
      this.cache.clear();
      logger.debug('Cleared all dashboard cache');
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopHealthMonitoring();
    this.cache.clear();
    logger.info('Dashboard service destroyed');
  }
}

export const dashboardService = new DashboardService(); 