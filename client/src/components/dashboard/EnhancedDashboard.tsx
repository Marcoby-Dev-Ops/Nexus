import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Brain, 
  TrendingUp, 
  Zap, 
  Users, 
  Building2, 
  BarChart3,
  Activity,
  RefreshCw,
  Eye,
  BrainCircuit,
  DollarSign,
  Globe,
  Shield,
  AlertCircle,
  Lightbulb,
  Target,
  Clock,
  Settings
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Progress } from '@/shared/components/ui/Progress';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { useAuth } from '@/hooks/index';
import { useHeaderContext } from '@/shared/hooks/useHeaderContext';
import { useUserProfile } from '@/shared/contexts/UserContext';
import { CompanyStatusDashboard } from './CompanyStatusDashboard';
import LivingBusinessAssessment from './LivingBusinessAssessment';
import UnifiedCommunicationDashboard from './UnifiedCommunicationDashboard';
import { useSimpleDashboard } from '@/hooks/dashboard/useSimpleDashboard';

// Import consolidated analytics components
import { DigestibleMetricsDashboard, FireCycleDashboard } from '@/components/analytics';
import CrossPlatformInsightsEngine from '@/components/analytics/CrossPlatformInsightsEngine';
import { Switch } from '@/shared/components/ui/Switch';
import { Label } from '@/shared/components/ui/Label';

/**
 * Smart display name logic based on real-world best practices
 * Priority: display_name > first_name > email_username > fallback
 */
const getDisplayName = (profile: Record<string, unknown> | null, user: Record<string, unknown> | null): string => {
  // 1. Use display_name if available (user's preferred name)
  if (profile?.display_name) {
    return String(profile.display_name);
  }
  
  // 2. Use first_name if available
  if (profile?.first_name) {
    return String(profile.first_name);
  }
  
  // 3. Use email username as fallback
  if (user?.email) {
    const email = String(user.email);
    const username = email.split('@')[0];
    return username.charAt(0).toUpperCase() + username.slice(1).toLowerCase();
  }
  
  // 4. Final fallback
  return 'User';
};

interface WidgetConfig {
  key: 'see' | 'act' | 'think';
  label: string;
  visible: boolean;
}

const DashboardSuspenseFallback = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="h-24" />
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <Skeleton key={i} className="h-64" />
      ))}
    </div>
  </div>
);

const EnhancedDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setHeaderContent } = useHeaderContext();
  const { profile } = useUserProfile();
  const { data: dashboardData, loading, error, refresh } = useSimpleDashboard();
  const [refreshing, setRefreshing] = useState(false);
  const [widgetConfigs, setWidgetConfigs] = useState<WidgetConfig[]>([
    { key: 'see', label: 'See', visible: true },
    { key: 'act', label: 'Act', visible: true },
    { key: 'think', label: 'Think', visible: true }
  ]);

  // Set header content when component mounts
  useEffect(() => {
    const displayName = getCurrentDisplayName();
    setHeaderContent('Dashboard', `Welcome back, ${displayName}`);
    
    // Cleanup when component unmounts
    return () => {
      setHeaderContent(null, null);
    };
  }, [user, profile]);

  const getCurrentDisplayName = () => {
    return getDisplayName(profile, user);
  };

  const handleCompleteOnboarding = async () => {
    navigate('/admin/onboarding-checklist');
  };

  const handleWidgetToggle = (key: WidgetConfig['key']) => {
    setWidgetConfigs(prev => prev.map(widget => 
      widget.key === key ? { ...widget, visible: !widget.visible } : widget
    ));
  };

  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  };

  function getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'active':
      case 'success':
        return 'text-success';
      case 'warning':
      case 'pending':
        return 'text-warning';
      case 'error':
      case 'failed':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'sale':
        return <DollarSign className="w-4 h-4" />;
      case 'user':
        return <Users className="w-4 h-4" />;
      case 'system':
        return <Activity className="w-4 h-4" />;
      case 'ai_insight':
        return <Brain className="w-4 h-4" />;
      case 'insight':
        return <Lightbulb className="w-4 h-4" />;
      case 'recommendation':
        return <Target className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const isWidgetAllowed = (widget: WidgetConfig) => {
    return widget.visible;
  };

  const canPerformExecutiveActions = () => {
    // Simplified role check - can be enhanced later
    return true;
  };

  const allowedWidgetConfigs = widgetConfigs.filter(isWidgetAllowed);



  if (loading) {
    return <DashboardSuspenseFallback />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 mx-auto text-destructive" />
          <h2 className="text-xl font-semibold">Failed to load dashboard data</h2>
          <p className="text-muted-foreground">
            {error}
          </p>
          <Button onClick={() => refresh()} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Welcome back, {getCurrentDisplayName()}!
              </h1>
              <p className="text-muted-foreground">
                Here's what's happening with your business today.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleManualRefresh}
                disabled={refreshing}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-6">
        {/* Metrics Overview */}
        {dashboardData?.metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${dashboardData.metrics.totalRevenue?.toLocaleString() || '0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData.metrics.growthRate > 0 ? '+' : ''}{dashboardData.metrics.growthRate || 0}% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.metrics.activeUsers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData.metrics.totalUsers || 0} total users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Status</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">Operational</div>
                <p className="text-xs text-muted-foreground">
                  All systems running smoothly
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardData.recentActivity?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  New activities today
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recent Activity */}
        {dashboardData?.recentActivity && dashboardData.recentActivity.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.recentActivity.map((activity: any) => (
                  <div key={activity.id} className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {getTypeIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {activity.message}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <Badge variant="outline" className={getStatusColor(activity.status || 'default')}>
                        {activity.status || 'default'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Alerts */}
        {dashboardData?.alerts && dashboardData.alerts.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Alerts & Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.alerts.map((alert: any) => (
                  <div key={alert.id} className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <AlertCircle className={`w-5 h-5 ${getStatusColor(alert.type)}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {alert.message}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <Badge variant="outline" className={getStatusColor(alert.type)}>
                        {alert.type}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Widget Controls */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Dashboard Widgets</CardTitle>
            <CardDescription>
              Customize your dashboard view by toggling widgets on and off.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {widgetConfigs.map((widget) => (
                <div key={widget.key} className="flex items-center space-x-2">
                  <Switch
                    checked={widget.visible}
                    onCheckedChange={() => handleWidgetToggle(widget.key)}
                  />
                  <Label>{widget.label}</Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Executive Actions */}
        {canPerformExecutiveActions() && (
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Perform common executive tasks quickly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button onClick={() => handleCompleteOnboarding()} variant="outline" className="h-20">
                  <div className="text-center">
                    <Settings className="w-6 h-6 mx-auto mb-2" />
                    <span className="text-sm">Complete Onboarding</span>
                  </div>
                </Button>
                <Button onClick={() => navigate('/analytics/unified')} variant="outline" className="h-20">
                  <div className="text-center">
                    <BarChart3 className="w-6 h-6 mx-auto mb-2" />
                    <span className="text-sm">View Analytics</span>
                  </div>
                </Button>
                <Button onClick={() => navigate('/admin/team-settings')} variant="outline" className="h-20">
                  <div className="text-center">
                    <Users className="w-6 h-6 mx-auto mb-2" />
                    <span className="text-sm">Manage Team</span>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default EnhancedDashboard;
