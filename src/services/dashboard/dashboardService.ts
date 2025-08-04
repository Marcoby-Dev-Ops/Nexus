/**
 * Dashboard Service
 * Provides centralized dashboard functionality and metrics
 */

import { select, selectOne, selectWithOptions } from '@/lib/supabase';
import { DatabaseQueryWrapper } from '@/core/database/queryWrapper';
import { BaseService } from '@/core/services/BaseService';
import type { ServiceResponse } from '@/core/services/BaseService';
import { logger } from '@/shared/utils/logger';

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

/**
 * Dashboard Service
 * Provides centralized dashboard functionality and metrics
 * 
 * Extends BaseService for consistent error handling and logging
 */
export class DashboardService extends BaseService {
  private queryWrapper = new DatabaseQueryWrapper();

  /**
   * Get enhanced dashboard data for the EnhancedDashboard component
   */
  async getEnhancedDashboardData(): Promise<ServiceResponse<{ metrics: DashboardMetrics; activities: DashboardActivity[] }>> {
    return this.executeDbOperation(async () => {
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

      return { data: { metrics, activities }, error: null };
    }, 'get enhanced dashboard data');
  }

  /**
   * Get dashboard data with proper authentication
   */
  async getDashboardData(userId?: string): Promise<ServiceResponse<DashboardData>> {
    return this.executeDbOperation(async () => {
      if (!userId) {
        return { data: null, error: 'User ID required' };
      }

      // Test database connection with proper authentication
      try {
        await select('user_profiles', 'id');
      } catch (dbError) {
        logger.error('Database connection test failed:', dbError);
        return { data: null, error: dbError };
      }

      // Mock dashboard data for now
      const mockData: DashboardData = {
        metrics: {
          totalUsers: 1250,
          activeUsers: 890,
          totalRevenue: 125000,
          growthRate: 15.5
        },
        recentActivity: [
          {
            id: '1',
            type: 'user_registration',
            message: 'New user registered',
            timestamp: new Date().toISOString()
          },
          {
            id: '2',
            type: 'revenue_milestone',
            message: 'Revenue milestone reached',
            timestamp: new Date(Date.now() - 3600000).toISOString()
          }
        ],
        alerts: [
          {
            id: '1',
            type: 'warning',
            message: 'System performance alert',
            timestamp: new Date().toISOString()
          }
        ]
      };

      return { data: mockData, error: null };
    }, `get dashboard data for user ${userId}`);
  }

  /**
   * Get user-specific dashboard data
   */
  async getUserDashboard(userId: string): Promise<ServiceResponse<any>> {
    return this.executeDbOperation(async () => {
      if (!userId) {
        return { data: null, error: 'User ID required' };
      }

      // Get user profile
      const { data: userProfile, error: profileError } = await selectOne('user_profiles', 'id', userId);
      
      if (profileError) {
        return { data: null, error: profileError };
      }

      // Get user-specific metrics
      const userMetrics = {
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        recentActivity: []
      };

      return { data: { userProfile, metrics: userMetrics }, error: null };
    }, `get user dashboard for user ${userId}`);
  }

  /**
   * Get company-specific dashboard data
   */
  async getCompanyDashboard(companyId: string): Promise<ServiceResponse<any>> {
    return this.executeDbOperation(async () => {
      if (!companyId) {
        return { data: null, error: 'Company ID required' };
      }

      // Get company profile
      const { data: companyProfile, error: profileError } = await selectOne('companies', 'id', companyId);
      
      if (profileError) {
        return { data: null, error: profileError };
      }

      // Get company-specific metrics
      const companyMetrics = {
        totalUsers: 0,
        totalRevenue: 0,
        activeProjects: 0,
        recentActivity: []
      };

      return { data: { companyProfile, metrics: companyMetrics }, error: null };
    }, `get company dashboard for company ${companyId}`);
  }
}

// Export singleton instance
export const dashboardService = new DashboardService(); 
