import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/index';
import { authService } from '@/core/auth/AuthService';
import { logger } from '@/shared/utils/logger';

interface BusinessQuadrant {
  id: string;
  title: string;
  metric: string;
  trend: string;
  trendDirection: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  action: string;
  actionLink: string;
  color: string;
}

interface AIInsight {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  action: string;
  actionLink: string;
  icon: React.ReactNode;
}

interface Alert {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  icon: React.ReactNode;
  action?: string;
  actionLink?: string;
}

interface DashboardData {
  businessQuadrants: BusinessQuadrant[];
  aiInsights: AIInsight[];
  alerts: Alert[];
  kpis: {
    revenue: string;
    activeUsers: string;
    markets: string;
    uptime: string;
  };
  recentActivity: Array<{
    id: number;
    type: string;
    message: string;
    time: string;
    icon: React.ReactNode;
  }>;
}

interface UseNarrativeDashboardReturn {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  profileCompletionPercentage: number;
  isProfileComplete: boolean;
  refresh: () => Promise<void>;
}

export const useNarrativeDashboard = (): UseNarrativeDashboardReturn => {
  const { user, profile } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Calculate profile completion percentage
  const profileCompletionPercentage = profile?.profile_completion_percentage || 0;
  const isProfileComplete = profileCompletionPercentage >= 100;

  // Mock data - in real implementation, this would come from your data services
  const mockData: DashboardData = {
    businessQuadrants: [
      {
        id: 'financial',
        title: 'Financial',
        metric: '$2.4M',
        trend: '+15% YoY',
        trendDirection: 'up',
        icon: '💵', // In real implementation, this would be a React component
        action: 'View Report',
        actionLink: '/analytics/financial',
        color: 'text-green-600'
      },
      {
        id: 'operational',
        title: 'Operational',
        metric: '89%',
        trend: '+5% MTD',
        trendDirection: 'up',
        icon: '⚡', // In real implementation, this would be a React component
        action: 'Improve Score',
        actionLink: '/operations',
        color: 'text-blue-600'
      },
      {
        id: 'market',
        title: 'Market',
        metric: '23',
        trend: 'Global Reach',
        trendDirection: 'neutral',
        icon: '🌍', // In real implementation, this would be a React component
        action: 'Expand Markets',
        actionLink: '/market-expansion',
        color: 'text-purple-600'
      },
      {
        id: 'customer',
        title: 'Customer',
        metric: '1,247',
        trend: '+8% MTD',
        trendDirection: 'up',
        icon: '👥', // In real implementation, this would be a React component
        action: 'View Insights',
        actionLink: '/customers',
        color: 'text-orange-600'
      },
      {
        id: 'team',
        title: 'Team',
        metric: '156',
        trend: 'Active Projects',
        trendDirection: 'neutral',
        icon: '🏢', // In real implementation, this would be a React component
        action: 'Manage Team',
        actionLink: '/team',
        color: 'text-indigo-600'
      }
    ],
    aiInsights: [
      {
        id: 'profile-completion',
        title: 'Complete Your Profile',
        description: 'Unlock tailored strategies for growth, automation, and profitability by completing your company profile.',
        priority: 'high',
        action: 'Complete Profile',
        actionLink: '/settings/profile',
        icon: '🎯' // In real implementation, this would be a React component
      },
      {
        id: 'revenue-optimization',
        title: 'Revenue Optimization Opportunity',
        description: 'Your customer acquisition cost is 23% below industry average. Consider scaling your marketing efforts.',
        priority: 'medium',
        action: 'View Strategy',
        actionLink: '/analytics/revenue',
        icon: '📈' // In real implementation, this would be a React component
      },
      {
        id: 'team-productivity',
        title: 'Team Productivity Boost',
        description: 'Implementing the suggested automation workflows could save your team 12 hours per week.',
        priority: 'medium',
        action: 'Review Workflows',
        actionLink: '/automation',
        icon: '⚡' // In real implementation, this would be a React component
      }
    ],
    alerts: [
      {
        id: 'system-health',
        title: 'System Health',
        message: 'All systems operational with 99.9% uptime',
        type: 'success',
        icon: '🛡️' // In real implementation, this would be a React component
      },
      {
        id: 'data-sync',
        title: 'Data Sync',
        message: 'Last sync completed 2 minutes ago',
        type: 'info',
        icon: '🔄' // In real implementation, this would be a React component
      }
    ],
    kpis: {
      revenue: '$2.4M',
      activeUsers: '1,247',
      markets: '23',
      uptime: '99.9%'
    },
    recentActivity: [
      {
        id: 1,
        type: 'sale',
        message: 'New deal closed: $45K contract',
        time: '2 minutes ago',
        icon: '💵' // In real implementation, this would be a React component
      },
      {
        id: 2,
        type: 'user',
        message: 'Team member Sarah joined project Alpha',
        time: '15 minutes ago',
        icon: '👥' // In real implementation, this would be a React component
      },
      {
        id: 3,
        type: 'system',
        message: 'Automation workflow completed successfully',
        time: '1 hour ago',
        icon: '⚡' // In real implementation, this would be a React component
      },
      {
        id: 4,
        type: 'system',
        message: 'Data sync completed',
        time: '2 hours ago',
        icon: '🔄' // In real implementation, this would be a React component
      }
    ]
  };

  const fetchDashboardData = useCallback(async () => {
    if (!user?.id) {
      logger.warn('No user ID available for dashboard data fetch, attempting session refresh');
      try {
        // Attempt to refresh session
        const { data: sessionData } = await authService.refreshSession();
        if (sessionData?.user?.id) {
          logger.info('Session refreshed successfully, retrying dashboard data fetch');
          // Retry with the refreshed session
          setTimeout(() => fetchDashboardData(), 100);
          return;
        }
      } catch (error) {
        logger.warn('Session refresh failed, using mock data');
      }
      // Set mock data instead of returning early to prevent UI issues
      setData(mockData);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In real implementation, you would fetch data from your services here
      // const result = await dashboardService.getNarrativeData(user.id);
      
      setData(mockData);
      logger.info('Dashboard data loaded successfully');
    } catch (err) {
      const errorMessage = 'Failed to load dashboard data';
      logger.error({ err }, errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchDashboardData();
    } finally {
      setRefreshing(false);
    }
  }, [fetchDashboardData]);

  // Load data on mount
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    data,
    loading,
    error,
    refreshing,
    profileCompletionPercentage,
    isProfileComplete,
    refresh
  };
};
