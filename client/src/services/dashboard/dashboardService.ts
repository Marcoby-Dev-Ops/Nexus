/**
 * Dashboard Service
 * Provides centralized dashboard functionality and metrics
 */

import { BaseService, type ServiceResponse } from '@/core/services/BaseService';
import { selectData, selectOne, callRPC } from '@/lib/database';
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
  /**
   * Get enhanced dashboard data for the EnhancedDashboard component
   */
  async getEnhancedDashboardData(userId: string): Promise<ServiceResponse<{ metrics: DashboardMetrics; activities: DashboardActivity[] }>> {
    return this.executeDbOperation(async () => {
      // Get user integrations for data sources using API client
      const { data: integrations, error: integrationsError } = await selectData<any>('user_integrations', '*', { user_id: userId });

      if (integrationsError) {
        this.logger.warn('Failed to fetch user integrations for enhanced dashboard', { error: integrationsError, userId });
        // Continue with empty integrations rather than failing completely
      }

      // AI insights are currently disabled due to RLS policy issues
      // Using fallback data until the table permissions are resolved
      const aiInsights: any[] = [];

      // Calculate real metrics based on actual data
      const metrics: DashboardMetrics = {
        think: {
          ideasCaptured: 0, // Removed business_profiles dependency
          collaborationSessions: 0, // Removed business_profiles dependency
          innovationScore: 0, // Removed business_profiles dependency
          crossDeptConnections: 0 // Removed business_profiles dependency
        },
        see: {
          dataSourcesConnected: integrations?.length || 0,
          realTimeInsights: aiInsights?.length || 0,
          predictiveAccuracy: 0, // Removed business_profiles dependency
          alertsGenerated: 0 // Removed business_profiles dependency
        },
        act: {
          automationsRunning: 0, // Removed business_profiles dependency
          workflowsOptimized: 0, // Removed business_profiles dependency
          timeSaved: 0, // Removed business_profiles dependency
          processEfficiency: 0 // Removed business_profiles dependency
        }
      };

      // Generate real activities from integrations and AI insights
      const activities: DashboardActivity[] = [];
      
      // Add activities based on integrations
      if (integrations && integrations.length > 0) {
        integrations.slice(0, 3).forEach((integration, index) => {
          activities.push({
            id: `integration-${index}`,
            type: 'integration',
            message: `Connected to ${integration.provider_name || 'external service'}`,
            timestamp: integration.created_at || new Date().toISOString(),
            status: 'success',
            priority: 'medium'
          });
        });
      }

      return { data: { metrics, activities }, error: null };
    }, `get enhanced dashboard data for user ${userId}`);
  }

  /**
   * Get dashboard data with proper authentication
   */
  async getDashboardData(userId?: string): Promise<ServiceResponse<DashboardData>> {
    return this.executeDbOperation(async () => {
      if (!userId) {
        this.logger.warn('getDashboardData called without userId');
        return { data: null, error: 'User ID required' };
      }

      // Get user integrations for data sources using API client
      const { data: integrations, error: integrationsError } = await selectData<any>('user_integrations', '*', { user_id: userId });

      if (integrationsError) {
        this.logger.warn('Failed to fetch user integrations for dashboard', { error: integrationsError, userId });
        // Continue with empty integrations rather than failing completely
      }

      // Recent activity from AI insights is currently disabled due to RLS policy issues
      // Using fallback data until the table permissions are resolved
      const recentActivity: any[] = [];

      // Calculate real metrics
      const metrics: LegacyDashboardMetrics = {
        totalUsers: 1, // Single user dashboard
        activeUsers: 1,
        totalRevenue: 0, // Placeholder, no business_profiles data
        growthRate: 0 // Placeholder, no business_profiles data
      };

      // Convert recent activity to dashboard format
      const dashboardActivity = recentActivity?.map((activity, index) => ({
        id: activity.id || `activity-${index}`,
        type: 'ai_insight',
        message: activity.title || 'AI insight generated',
        timestamp: activity.created_at || new Date().toISOString()
      })) || [];

      // Generate alerts based on business profile status
      const alerts: any[] = [];
      if (false) { // No business_profiles data
        alerts.push({
          id: 'profile-incomplete',
          type: 'warning',
          message: 'Complete your business profile for better insights',
          timestamp: new Date().toISOString()
        });
      }

      if (false) { // No business_profiles data
        alerts.push({
          id: 'low-confidence',
          type: 'info',
          message: 'Consider providing more business information for better analysis',
          timestamp: new Date().toISOString()
        });
      }

      const dashboardData: DashboardData = {
        metrics,
        recentActivity: dashboardActivity,
        alerts
      };

      return { data: dashboardData, error: null };
    }, `get dashboard data for user ${userId}`);
  }

  /**
   * Get user-specific dashboard data
   */
  async getUserDashboard(userId: string): Promise<ServiceResponse<any>> {
    return this.executeDbOperation(async () => {
      // Validate userId parameter
      if (!userId || userId === 'undefined' || userId === 'null') {
        this.logger.warn('getUserDashboard called with invalid userId', { userId });
        return { data: null, error: 'Invalid user ID' };
      }

      // Get comprehensive user data using API client
      // First try to get the user profile directly
      let userProfile: any = null;
      let internalUserId = userId;
      
      try {
        const profileResult = await selectData('user_profiles', '*', { user_id: userId });
        
        if (profileResult.success && profileResult.data && profileResult.data.length > 0) {
          userProfile = profileResult.data[0];
          internalUserId = userProfile.user_id;
        } else {
          // If no profile found, try to create one using the RPC function
          const rpcResult = await callRPC('ensure_user_profile', { user_id: userId });
          
          if (rpcResult.success && rpcResult.data && rpcResult.data.length > 0) {
            userProfile = rpcResult.data[0];
            internalUserId = userProfile.user_id;
          } else {
            this.logger.error('Failed to get user profile for dashboard', { userId });
            return { data: null, error: 'Failed to get user profile' };
          }
        }
      } catch (error) {
        this.logger.error('Failed to get user profile for dashboard', { userId, error });
        return { data: null, error: 'Failed to get user profile' };
      }
      
      const [businessProfileResult, integrationsResult] = await Promise.all([
        selectOne<any>('business_profiles', internalUserId),
        selectData<any>('user_integrations', '*', { user_id: internalUserId })
      ]);

      return {
        data: {
          user: userProfile,
          business: businessProfileResult.data,
          integrations: integrationsResult.data || [],
          metrics: {
            profileCompletion: businessProfileResult.data?.assessment_completion_percentage || 0,
            activeIntegrations: integrationsResult.data?.length || 0,
            lastActivity: userProfile?.updated_at || new Date().toISOString()
          }
        },
        error: null
      };
    }, `get user dashboard for user ${userId}`);
  }

  /**
   * Get company dashboard data
   */
  async getCompanyDashboard(companyId: string): Promise<ServiceResponse<any>> {
    return this.executeDbOperation(async () => {
      // Get company data using API client
      const { data: companyData, error: companyError } = await selectOne<any>('companies', companyId);
      
      if (companyError) {
        this.logger.error('Failed to fetch company data for dashboard', { error: companyError, companyId });
        return { data: null, error: companyError };
      }

      // Get company users using API client
      const { data: companyUsers, error: usersError } = await selectData<any>('user_profiles', '*', { company_id: companyId });
      
      if (usersError) {
        this.logger.warn('Failed to fetch company users for dashboard', { error: usersError, companyId });
        // Continue with empty users rather than failing completely
      }

      return {
        data: {
          company: companyData,
          users: companyUsers || [],
          metrics: {
            totalUsers: companyUsers?.length || 0,
            activeUsers: companyUsers?.length || 0,
            lastActivity: companyData?.updated_at || new Date().toISOString()
          }
        },
        error: null
      };
    }, `get company dashboard for company ${companyId}`);
  }
}

// Export singleton instance
export const dashboardService = new DashboardService(); 
