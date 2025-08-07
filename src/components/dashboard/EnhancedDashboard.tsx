import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  AlertCircle
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Progress } from '@/shared/components/ui/Progress';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { useAuth } from '@/hooks/index';
import { useHeaderContext } from '@/shared/hooks/useHeaderContext';
import { CompanyStatusDashboard } from './CompanyStatusDashboard';
import LivingBusinessAssessment from './LivingBusinessAssessment';
import UnifiedCommunicationDashboard from './UnifiedCommunicationDashboard';
// import { realDataService } from '@/services/realDataService';

// Import consolidated analytics components
import { DigestibleMetricsDashboard, FireCycleDashboard } from '@/components/analytics';
import CrossPlatformInsightsEngine from '@/components/analytics/CrossPlatformInsightsEngine';

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
  const { user } = useAuth();
  const { setHeaderContent } = useHeaderContext();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [widgetConfigs, setWidgetConfigs] = useState<WidgetConfig[]>([
    { key: 'see', label: 'See', visible: true },
    { key: 'act', label: 'Act', visible: true },
    { key: 'think', label: 'Think', visible: true }
  ]);

  // Set header content when component mounts
  useEffect(() => {
    const displayName = getDisplayName();
    setHeaderContent('Dashboard', `Welcome back, ${displayName}`);
    
    // Cleanup when component unmounts
    return () => {
      setHeaderContent(null, null);
    };
  }, [setHeaderContent, user]);

  const getDisplayName = () => {
    if (user?.firstName) {
      return user.firstName;
    }
    
    if (user?.email) {
      const username = user.email.split('@')[0];
      return username.charAt(0).toUpperCase() + username.slice(1).toLowerCase();
    }
    
    return 'User';
  };

  const handleCompleteOnboarding = async () => {
    // Handle onboarding completion
  };

  const handleWidgetToggle = (key: WidgetConfig['key']) => {
    setWidgetConfigs(prev => 
      prev.map(widget => 
        widget.key === key 
          ? { ...widget, visible: !widget.visible }
          : widget
      )
    );
  };

  const fetchDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data for demonstration
      const mockData = {
        metrics: {
          revenue: '$2.4M',
          users: '1,247',
          markets: '23',
          uptime: '99.9%'
        },
        recentActivity: [
          { id: 1, type: 'sale', message: 'New deal closed', time: '2 hours ago' },
          { id: 2, type: 'user', message: 'New user registered', time: '4 hours ago' },
          { id: 3, type: 'system', message: 'System update completed', time: '6 hours ago' }
        ]
      };

      setDashboardData(mockData);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard data fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleManualRefresh = async () => {
    await fetchDashboardData(true);
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

  useEffect(() => {
    fetchDashboardData();
  }, []);

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
            We couldn't load your dashboard data. Please try refreshing the page.
          </p>
          <Button onClick={handleManualRefresh} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Key Metrics Row - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="h-20">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Revenue</p>
                <p className="text-lg font-bold">$2.4M</p>
                <p className="text-xs text-success">+15% YoY</p>
              </div>
              <DollarSign className="w-6 h-6 text-success" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="h-20">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Active Users</p>
                <p className="text-lg font-bold">1,247</p>
                <p className="text-xs text-primary">+8% MTD</p>
              </div>
              <Users className="w-6 h-6 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="h-20">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Markets</p>
                <p className="text-lg font-bold">23</p>
                <p className="text-xs text-secondary">Global Reach</p>
              </div>
              <Globe className="w-6 h-6 text-secondary" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="h-20">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Uptime</p>
                <p className="text-lg font-bold">99.9%</p>
                <p className="text-xs text-warning">System Health</p>
              </div>
              <Shield className="w-6 h-6 text-warning" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area - Responsive Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        {/* Left Column - Core Widgets */}
        <div className="xl:col-span-3 space-y-4">
          {/* Trinity Widgets - Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {allowedWidgetConfigs.map(widget => (
              <Card key={widget.key} className="relative h-24">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium flex items-center gap-2">
                    {widget.key === 'see' && <Eye className="w-3 h-3" />}
                    {widget.key === 'act' && <Zap className="w-3 h-3" />}
                    {widget.key === 'think' && <Brain className="w-3 h-3" />}
                    {widget.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-1">
                    <div className="text-lg font-bold">
                      {widget.key === 'see' && '1,247'}
                      {widget.key === 'act' && '89'}
                      {widget.key === 'think' && '156'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {widget.key === 'see' && 'Active insights'}
                      {widget.key === 'act' && 'Pending actions'}
                      {widget.key === 'think' && 'AI suggestions'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Company Status Dashboard */}
          <CompanyStatusDashboard />

          {/* Living Business Assessment */}
          <LivingBusinessAssessment />

          {/* Unified Communication Dashboard */}
          <UnifiedCommunicationDashboard />

          {/* Analytics Components */}
          <DigestibleMetricsDashboard />
          <FireCycleDashboard />
          <CrossPlatformInsightsEngine />
        </div>

        {/* Right Column - Sidebar Widgets */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start h-8 text-xs">
                <TrendingUp className="w-3 h-3 mr-2" />
                View Analytics
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start h-8 text-xs">
                <Users className="w-3 h-3 mr-2" />
                Manage Team
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start h-8 text-xs">
                <Building2 className="w-3 h-3 mr-2" />
                Company Settings
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {dashboardData?.recentActivity?.map((activity: any) => (
                  <div key={activity.id} className="flex items-start gap-2">
                    <div className="mt-1">
                      {getTypeIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium">System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs">API Health</span>
                  <Badge variant="default" className="text-xs">Healthy</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs">Database</span>
                  <Badge variant="default" className="text-xs">Online</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs">AI Services</span>
                  <Badge variant="default" className="text-xs">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EnhancedDashboard;