import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Brain, Eye, Zap, TrendingUp, AlertCircle, Users, Target, Activity, BarChart3, Database, Settings, Eye as EyeIcon, RefreshCw, Building2, DollarSign, Globe, Shield, Calendar, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card.tsx';
import { Badge } from '@/shared/components/ui/Badge.tsx';
import { Button } from '@/shared/components/ui/Button.tsx';
import { dashboardService, type DashboardMetrics, type DashboardActivity } from '@/services/dashboard/dashboardService';
import { motion, AnimatePresence } from 'framer-motion';
import ErrorBoundary from '@/shared/ui/components/ErrorBoundary';
import { useAuth } from '@/hooks/index';
import { DashboardOnboarding } from '@/components/dashboard/DashboardOnboarding';
import { analyticsService } from '@/services/analytics/index.ts';
import { BusinessInsightsPanel } from '@/components/dashboard/BusinessInsightsPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs.tsx';
import { Switch } from '@/shared/components/ui/Switch';
import { Label } from '@/shared/components/ui/Label';
import { AIPerformanceWidget } from '@/components/dashboard/AIPerformanceWidget';
import { PersonalTrinityWidget } from '@/components/dashboard/PersonalTrinityWidget';
import { OrganizationalTrinityWidget } from '@/components/dashboard/OrganizationalTrinityWidget';

/**
 * @name EnhancedDashboard
 * @description Clean, organized executive dashboard with clear information hierarchy
 * @returns {JSX.Element} The rendered enhanced dashboard component.
 */

interface WidgetConfig {
  key: 'see' | 'act' | 'think';
  label: string;
  visible: boolean;
}

const DEFAULTWIDGETS: WidgetConfig[] = [
  { key: 'see', label: 'Intelligence', visible: true },
  { key: 'act', label: 'Execution', visible: true },
  { key: 'think', label: 'Innovation', visible: true },
];

// Lazy load heavy widgets
const OrganizationalHealthScore = lazy(() => import('./OrganizationalHealthScore'));
const CrossDepartmentMatrix = lazy(() => import('./CrossDepartmentMatrix'));
const TrinityInsightsEngine = lazy(() => import('./TrinityInsightsEngine'));
const SecurityDashboard = lazy(() => import('@/components/dashboard/SecurityDashboard').then(module => ({ default: module.SecurityDashboard })));
const VARLeadDashboard = lazy(() => import('@/components/dashboard/VARLeadDashboard').then(module => ({ default: module.VARLeadDashboard })));
const ModelManagementDashboard = lazy(() => import('@/components/dashboard/ModelManagementDashboard').then(module => ({ default: module.ModelManagementDashboard })));
const CentralizedAppsHub = lazy(() => import('@/components/dashboard/CentralizedAppsHub').then(module => ({ default: module.CentralizedAppsHub })));

const DashboardSuspenseFallback = () => (
  <div className="flex items-center justify-center h-96">
    <div className="flex items-center space-x-2 text-muted-foreground">
      <RefreshCw className="w-6 h-6 animate-spin" />
      <span>Loading Dashboard...</span>
    </div>
  </div>
);

const EnhancedDashboard: React.FC = () => {
  const { user } = useAuth();
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics>({
    think: {
      ideasCaptured: 0,
      collaborationSessions: 0,
      innovationScore: 0,
      crossDeptConnections: 0
    },
    see: {
      dataSourcesConnected: 0,
      realTimeInsights: 0,
      predictiveAccuracy: 0,
      alertsGenerated: 0
    },
    act: {
      automationsRunning: 0,
      workflowsOptimized: 0,
      timeSaved: 0,
      processEfficiency: 0
    }
  });
  const [recentActivities, setRecentActivities] = useState<DashboardActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Auto-refresh interval (5 minutes)
  const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000;

  const trinityData = [
    { name: 'Innovation', value: dashboardMetrics.think.ideasCaptured },
    { name: 'Intelligence', value: dashboardMetrics.see.realTimeInsights },
    { name: 'Execution', value: dashboardMetrics.act.automationsRunning }
  ];

  // Widget configuration with visibility controls
  const [widgetConfigs, setWidgetConfigs] = useState<WidgetConfig[]>(DEFAULTWIDGETS);
  const allowedWidgetConfigs = widgetConfigs.filter(widget => widget.visible);

  const handleCompleteOnboarding = async () => {
    setShowOnboarding(false);
    await fetchDashboardData();
  };

  const handleWidgetToggle = (key: WidgetConfig['key']) => {
    setWidgetConfigs(prev => 
      prev.map(widget => 
        widget.key === key ? { ...widget, visible: !widget.visible } : widget
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

      const { data, error } = await dashboardService.getEnhancedDashboardData();
      
      if (error) {
        throw error;
      }

      if (data) {
        setDashboardMetrics(data.metrics);
        setRecentActivities(data.activities);
      }

      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err instanceof Error ? err : new Error('Failed to load dashboard data'));
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
      case 'completed':
        return 'bg-success text-success-foreground';
      case 'in_progress':
        return 'bg-primary text-primary-foreground';
      case 'pending':
        return 'bg-warning text-warning-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'think':
        return <Brain className="w-4 h-4 text-primary" />;
      case 'see':
        return <Eye className="w-4 h-4 text-secondary" />;
      case 'act':
        return <Zap className="w-4 h-4 text-primary" />;
      default:
        return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const isWidgetAllowed = (key: WidgetConfig['key']) => {
    // Add role-based permissions here
    return true;
  };

  const canPerformExecutiveActions = () => {
    // Add role-based permissions here
    return true;
  };

  useEffect(() => {
    fetchDashboardData();

    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, AUTO_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  if (showOnboarding) {
    return (
      <div className="p-6">
        <DashboardOnboarding 
          onComplete={handleCompleteOnboarding}
          userName={user?.name || 'New User'}
        />
      </div>
    );
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
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Clean Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back, {user?.profile?.first_name || user?.name?.split(' ')[0] || 'User'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {refreshing && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Updating...</span>
              </div>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleManualRefresh}
              disabled={refreshing}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Key Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Revenue</p>
                  <p className="text-2xl font-bold">$2.4M</p>
                  <p className="text-xs text-success">+15% YoY</p>
                </div>
                <DollarSign className="w-8 h-8 text-success" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Users</p>
                  <p className="text-2xl font-bold">1,247</p>
                  <p className="text-xs text-primary">+8% MTD</p>
                </div>
                <Users className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Markets</p>
                  <p className="text-2xl font-bold">23</p>
                  <p className="text-xs text-secondary">Global Reach</p>
                </div>
                <Globe className="w-8 h-8 text-secondary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Uptime</p>
                  <p className="text-2xl font-bold">99.9%</p>
                  <p className="text-xs text-warning">System Health</p>
                </div>
                <Shield className="w-8 h-8 text-warning" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Core Widgets */}
          <div className="lg:col-span-2 space-y-6">
            {/* Trinity Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {allowedWidgetConfigs.map(widget => (
                <Card key={widget.key} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      {widget.key === 'think' ? <Brain className="w-5 h-5 text-primary" /> : 
                       widget.key === 'see' ? <Eye className="w-5 h-5 text-secondary" /> : 
                       <Zap className="w-5 h-5 text-primary" />}
                      <CardTitle className="text-sm">{widget.label}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <p className="text-2xl font-bold">
                        {widget.key === 'think' ? dashboardMetrics.think.ideasCaptured :
                         widget.key === 'see' ? dashboardMetrics.see.realTimeInsights :
                         dashboardMetrics.act.automationsRunning}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {widget.key === 'think' ? 'Ideas Captured' :
                         widget.key === 'see' ? 'Real-time Insights' :
                         'Automations Running'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Business Insights */}
            <BusinessInsightsPanel />

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivities.slice(0, 5).map((activity, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      {getTypeIcon(activity.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">{activity.department}</p>
                      </div>
                      <Badge variant="outline" className={getStatusColor(activity.status)}>
                        {activity.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Controls & Status */}
          <div className="space-y-6">
            {/* AI Performance */}
            <AIPerformanceWidget />

            {/* Quick Actions */}
            {canPerformExecutiveActions() && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Generate Report
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Users className="w-4 h-4 mr-2" />
                    Team Analysis
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    View Forecast
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">System Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Data Sources</span>
                  <Badge variant="outline" className="bg-success/10 text-success">
                    {dashboardMetrics.see.dataSourcesConnected} Connected
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Automations</span>
                  <Badge variant="outline" className="bg-primary/10 text-primary">
                    {dashboardMetrics.act.automationsRunning} Running
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Last Updated</span>
                  <span className="text-xs text-muted-foreground">
                    {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Never'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Widget Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Dashboard Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {widgetConfigs.map(widget => (
                    <div key={widget.key} className="flex items-center justify-between">
                      <Label htmlFor={`toggle-${widget.key}`} className="text-sm">
                        {widget.label}
                      </Label>
                      <Switch
                        id={`toggle-${widget.key}`}
                        checked={widget.visible}
                        onCheckedChange={() => handleWidgetToggle(widget.key)}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Advanced Features Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="apps">Apps</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PersonalTrinityWidget />
              <OrganizationalTrinityWidget />
            </div>
          </TabsContent>
          
          <TabsContent value="security">
            <Suspense fallback={<DashboardSuspenseFallback />}>
              <SecurityDashboard />
            </Suspense>
          </TabsContent>
          
          <TabsContent value="analytics">
            <Suspense fallback={<DashboardSuspenseFallback />}>
              <ModelManagementDashboard />
            </Suspense>
          </TabsContent>
          
          <TabsContent value="apps">
            <Suspense fallback={<DashboardSuspenseFallback />}>
              <CentralizedAppsHub />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EnhancedDashboard;