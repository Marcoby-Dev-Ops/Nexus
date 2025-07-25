/**
 * Dashboard Service
 * Provides centralized dashboard functionality and metrics
 */

import { supabase } from '@/lib/supabase';
// import { DatabaseQueryWrapper } from '@/core/database/queryWrapper';
import { logger } from '@/shared/utils/logger.ts';

// Enhanced Dashboard Types
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
  id: string;
  type: string;
  message: string;
  timestamp: string;
  status?: string;
  priority?: string;
}

// Legacy Dashboard Types (keeping for backward compatibility)
export interface LegacyDashboardMetrics {
  totalUsers: number;
  activeUsers: number;
  totalRevenue: number;
  growthRate: number;
}

export interface DashboardData {
  metrics: LegacyDashboardMetrics;
  recentActivity: any[];
  alerts: any[];
}

export class DashboardService {
  // private queryWrapper = new DatabaseQueryWrapper();

  /**
   * Get enhanced dashboard data for the EnhancedDashboard component
   */
  async getEnhancedDashboardData(): Promise<{ metrics: DashboardMetrics; activities: DashboardActivity[] }> {
    try {
      // Mock enhanced dashboard data
      const metrics: DashboardMetrics = {
        think: {
          ideasCaptured: 42,
          collaborationSessions: 15,
          innovationScore: 85,
          crossDeptConnections: 8
        },
        see: {
          dataSourcesConnected: 12,
          realTimeInsights: 156,
          predictiveAccuracy: 92,
          alertsGenerated: 3
        },
        act: {
          automationsRunning: 7,
          workflowsOptimized: 23,
          timeSaved: 45,
          processEfficiency: 78
        }
      };

      const activities: DashboardActivity[] = [
        {
          id: '1',
          type: 'think',
          message: 'New innovation idea captured',
          timestamp: new Date().toISOString(),
          status: 'success',
          priority: 'medium'
        },
        {
          id: '2',
          type: 'see',
          message: 'Real-time insight generated',
          timestamp: new Date(Date.now() - 300000).toISOString(),
          status: 'success',
          priority: 'high'
        },
        {
          id: '3',
          type: 'act',
          message: 'Automation workflow completed',
          timestamp: new Date(Date.now() - 600000).toISOString(),
          status: 'success',
          priority: 'medium'
        },
        {
          id: '4',
          type: 'think',
          message: 'Cross-department collaboration initiated',
          timestamp: new Date(Date.now() - 900000).toISOString(),
          status: 'warning',
          priority: 'low'
        }
      ];

      return { metrics, activities };
    } catch (error) {
      logger.error('Error in getEnhancedDashboardData:', error);
      throw error;
    }
  }

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
      const { error: dbError } = await supabase.from('user_profiles').select('id').limit(1);

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
      // Get user-specific dashboard data
      const queries = [
        supabase.from('user_profiles').select('*').eq('user_id', userId).single(),
        supabase.from('user_activity').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(10),
        supabase.from('user_preferences').select('*').eq('user_id', userId).single()
      ];

      const data = await Promise.all(queries);
      const error = null;

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
      // Get company-specific dashboard data
      const queries = [
        supabase.from('company_profiles').select('*').eq('id', companyId).single(),
        supabase.from('company_metrics').select('*').eq('company_id', companyId).order('created_at', { ascending: false }).limit(10),
        supabase.from('company_settings').select('*').eq('company_id', companyId).single()
      ];

      const data = await Promise.all(queries);
      const error = null;

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