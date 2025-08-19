/**
 * Simplified dashboard hook
 * Replaces complex dashboard logic with simple, reliable data fetching
 * Integrates with demo data for demo users
 */

import { useState, useEffect } from 'react';
import { useCurrentUserId } from '@/hooks/useCurrentUserId';
import { selectData } from '@/lib/api-client';
import { logger } from '@/shared/utils/logger';
import { demoDataService } from '@/services/demo/DemoDataService';

interface DashboardData {
  integrations: any[];
  recentActivity: any[];
  metrics: {
    totalIntegrations: number;
    activeIntegrations: number;
    lastActivity: string;
  };
}

export function useSimpleDashboard() {
  const { userId, hasValidUserId, isLoading: userIdLoading, error: userIdError } = useCurrentUserId();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      if (!hasValidUserId) {
        setData(null);
        setLoading(false);
        setError(userIdError || 'No valid user ID available');
        return;
      }

      if (!userId) {
        setError('No valid user ID available');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Check if this is a demo user
        const isDemoUser = demoDataService.isDemoUser(userId);

        if (isDemoUser) {
          // Use demo data for demo users
          const demoIntegrations = demoDataService.getIntegrationData(userId);
          const demoActivities = demoDataService.getActivityData(userId);

          const dashboardData: DashboardData = {
            integrations: demoIntegrations.map(integration => ({
              id: integration.id,
              name: integration.name,
              type: integration.type,
              status: integration.status,
              last_sync: integration.lastSync,
              data_points: integration.dataPoints,
              category: integration.category,
              user_id: userId,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })),
            recentActivity: demoActivities.map(activity => ({
              id: activity.id,
              type: activity.type,
              title: activity.title,
              description: activity.description,
              timestamp: activity.timestamp,
              priority: activity.priority,
              status: activity.status,
              user_id: userId
            })),
            metrics: {
              totalIntegrations: demoIntegrations.length,
              activeIntegrations: demoIntegrations.filter(i => i.status === 'active').length,
              lastActivity: new Date().toISOString(),
            }
          };

          setData(dashboardData);
        } else {
          // Use real data for regular users
          const integrations = await selectData('user_integrations', '*', { user_id: userId });

          const dashboardData: DashboardData = {
            integrations: integrations.data || [],
            recentActivity: [], // Simplified for now
            metrics: {
              totalIntegrations: integrations.data?.length || 0,
              activeIntegrations: integrations.data?.filter((i: any) => i.status === 'active').length || 0,
              lastActivity: new Date().toISOString(),
            }
          };

          setData(dashboardData);
        }
      } catch (err) {
        setError('Failed to load dashboard data');
        logger.error('Dashboard load failed', { error: err, userId });
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [userId, hasValidUserId, userIdError]);

  const refresh = async () => {
    if (hasValidUserId && userId) {
      setLoading(true);
      setError(null);
      try {
        const integrations = await selectData('user_integrations', '*', { user_id: userId });
        
        const dashboardData: DashboardData = {
          integrations: integrations.data || [],
          recentActivity: [],
          metrics: {
            totalIntegrations: integrations.data?.length || 0,
            activeIntegrations: integrations.data?.filter((i: any) => i.status === 'active').length || 0,
            lastActivity: new Date().toISOString(),
          }
        };

        setData(dashboardData);
      } catch (err) {
        setError('Failed to refresh dashboard data');
        logger.error('Dashboard refresh failed', { error: err, userId });
      } finally {
        setLoading(false);
      }
    }
  };

  return { 
    data, 
    loading: loading || userIdLoading, 
    error: error || userIdError,
    refresh 
  };
}
