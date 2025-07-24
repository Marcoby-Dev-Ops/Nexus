/**
 * Dashboard Service
 * Provides centralized dashboard functionality and metrics
 */

import { supabase } from '@/core/supabase';
import { DatabaseQueryWrapper } from '@/core/database/queryWrapper';
import { logger } from '@/shared/utils/logger';

export interface DashboardMetrics {
  totalUsers: number;
  activeUsers: number;
  totalRevenue: number;
  growthRate: number;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  recentActivity: any[];
  alerts: any[];
}

export class DashboardService {
  private queryWrapper = new DatabaseQueryWrapper();

  /**
   * Get dashboard data with proper authentication
   */
  async getDashboardData(userId?: string): Promise<{ data: DashboardData | null; error: any }> {
    try {
      if (!userId) {
        logger.warn('Cannot get dashboard data: No user ID provided');
        return { data: null, error: 'User ID required' };
      }

      // Test database connection with proper authentication
      const { error: dbError } = await this.queryWrapper.userQuery(
        async () => supabase.from('user_profiles').select('id').limit(1),
        userId,
        'test-dashboard-connection'
      );

      if (dbError) {
        logger.error('Database connection test failed:', dbError);
        return { data: null, error: dbError };
      }

      // Mock dashboard data for now
      const mockData: DashboardData = {
        metrics: {
          totalUsers: 1250,
          activeUsers: 890,
          totalRevenue: 125000,
          growthRate: 12.5
        },
        recentActivity: [
          {
            id: '1',
            type: 'user_signup',
            message: 'New user registered',
            timestamp: new Date().toISOString()
          },
          {
            id: '2',
            type: 'revenue_update',
            message: 'Monthly revenue updated',
            timestamp: new Date().toISOString()
          }
        ],
        alerts: [
          {
            id: '1',
            type: 'warning',
            message: 'System maintenance scheduled',
            timestamp: new Date().toISOString()
          }
        ]
      };

      return { data: mockData, error: null };
    } catch (error) {
      logger.error('Error in getDashboardData:', error);
      return { data: null, error };
    }
  }

  /**
   * Get user-specific dashboard data with proper authentication
   */
  async getUserDashboard(userId: string): Promise<{ data: any | null; error: any }> {
    try {
      const { data, error } = await this.queryWrapper.userQuery(
        async () => {
          // Get user-specific dashboard data
          const queries = [
            supabase.from('user_profiles').select('*').eq('user_id', userId).single(),
            supabase.from('user_activity').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(10),
            supabase.from('user_preferences').select('*').eq('user_id', userId).single()
          ];

          return Promise.all(queries);
        },
        userId,
        'get-user-dashboard'
      );

      if (error) {
        logger.error('Error getting user dashboard:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      logger.error('Error in getUserDashboard:', error);
      return { data: null, error };
    }
  }

  /**
   * Get company dashboard data with proper authentication
   */
  async getCompanyDashboard(companyId: string): Promise<{ data: any | null; error: any }> {
    try {
      const { data, error } = await this.queryWrapper.companyQuery(
        async () => {
          // Get company-specific dashboard data
          const queries = [
            supabase.from('company_profiles').select('*').eq('id', companyId).single(),
            supabase.from('company_metrics').select('*').eq('company_id', companyId).order('created_at', { ascending: false }).limit(10),
            supabase.from('company_settings').select('*').eq('company_id', companyId).single()
          ];

          return Promise.all(queries);
        },
        companyId,
        'get-company-dashboard'
      );

      if (error) {
        logger.error('Error getting company dashboard:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      logger.error('Error in getCompanyDashboard:', error);
      return { data: null, error };
    }
  }
}

// Export singleton instance
export const dashboardService = new DashboardService(); 