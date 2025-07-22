import React, { useState, useEffect, Suspense, lazy } from 'react';
import { 
  Brain, 
  Eye, 
  Zap, 
  TrendingUp, 
  AlertCircle, 
  Users, 
  Target,
  Activity,
  BarChart3,
  ArrowUpRight,
  Sparkles,
  Clock,
  CheckCircle2,
  Lightbulb,
  Database,
  Settings,
  GripVertical,
  Eye as EyeIcon,
  EyeOff,
  PlusCircle,
  RefreshCw,
  Building2,
  DollarSign,
  Globe,
  Shield
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { ContentCard } from '@/shared/components/patterns/ContentCard';
import { SimpleBarChart } from './SimpleBarChart';
import { dashboardService, type DashboardMetrics, type DashboardActivity } from '../../lib/services/dashboardService';
import { motion, AnimatePresence } from 'framer-motion';
import ErrorBoundary from '@/shared/components/ui/ErrorBoundary';
import { useAuthContext } from '@/domains/admin/user/hooks/AuthContext';
import { DashboardOnboarding } from '@/domains/dashboard/features/components/DashboardOnboarding';
import { analyticsService } from '@/domains/analytics';
import { ErrorBoundary as CommonErrorBoundary } from '@/shared/components/common/ErrorBoundary';
import { BusinessInsightsPanel } from '@/domains/dashboard/features/components/BusinessInsightsPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { Switch } from '@/shared/components/ui/Switch';
import { Label } from '@/shared/components/ui/Label';
import { ProfileCompletionBanner } from '@/domains/admin/user/components/ProfileCompletionBanner';
import { AIPerformanceWidget } from '@/domains/dashboard/features/components/AIPerformanceWidget';
import { PersonalTrinityWidget } from '@/domains/dashboard/features/components/PersonalTrinityWidget';
import { OrganizationalTrinityWidget } from '@/domains/dashboard/features/components/OrganizationalTrinityWidget';

/**
 * @name EnhancedDashboard
 * @description Strategic Business Intelligence Dashboard - Executive overview of company performance
 * @returns {JSX.Element} The rendered enhanced dashboard component.
 */

// All color classes use design tokens per design system

interface WidgetConfig {
  key: 'think' | 'see' | 'act';
  label: string;
  visible: boolean;
}

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { key: 'think', label: 'INNOVATION', visible: true },
  { key: 'see', label: 'INTELLIGENCE', visible: true },
  { key: 'act', label: 'EXECUTION', visible: true },
];

// Lazy load heavy widgets
const OrganizationalHealthScore = lazy(() => import('./OrganizationalHealthScore'));
const CrossDepartmentMatrix = lazy(() => import('./CrossDepartmentMatrix'));
const TrinityInsightsEngine = lazy(() => import('./TrinityInsightsEngine'));
const SecurityDashboard = lazy(() => import('@/shared/components/dashboard/SecurityDashboard').then(module => ({ default: module.SecurityDashboard })));
const VARLeadDashboard = lazy(() => import('@/shared/components/dashboard/VARLeadDashboard').then(module => ({ default: module.VARLeadDashboard })));
const ModelManagementDashboard = lazy(() => import('@/shared/components/dashboard/ModelManagementDashboard').then(module => ({ default: module.ModelManagementDashboard })));
const CentralizedAppsHub = lazy(() => import('@/shared/components/dashboard/CentralizedAppsHub').then(module => ({ default: module.CentralizedAppsHub })));

const DashboardSuspenseFallback = () => (
  <div className="flex items-center justify-center h-96">
    <div className="flex items-center space-x-2 text-muted-foreground">
      <RefreshCw className="w-6 h-6 animate-spin" />
      <span>Loading Dashboard...</span>
    </div>
  </div>
);

const EnhancedDashboard: React.FC = () => {
  const { user, completeOnboarding } = useAuthContext();
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

  // Auto-refresh interval (5 minutes)
  // This interval ensures the dashboard data is refreshed every 5 minutes for real-time executive insights.
  const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000;

  const trinityData = [
    { name: 'Innovation', value: dashboardMetrics.think.ideasCaptured },
    { name: 'Intelligence', value: dashboardMetrics.see.realTimeInsights },
    { name: 'Execution', value: dashboardMetrics.act.automationsRunning }
  ];

  const [widgetConfigs, setWidgetConfigs] = useState<WidgetConfig[]>(() => {
    const saved = localStorage.getItem('nexus_dashboard_widgets');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback to default
      }
    }
    return DEFAULT_WIDGETS;
  });

  // Initialize analytics
  useEffect(() => {
    if (user) {
      const userRole = user.role || '';
      const userDepartment = user.department || '';
      analyticsService.init(user.id, {
        email: user.email,
        role: userRole,
        department: userDepartment,
      });
    }
    // Cleanup on unmount or user change
    return () => {
      analyticsService.reset();
    };
  }, [user]);

  // Check for onboarding status
  useEffect(() => {
    if (user && !user.onboardingCompleted) {
      setShowOnboarding(true);
    }
  }, [user]);

  const handleCompleteOnboarding = async () => {
    await completeOnboarding();
    setShowOnboarding(false);
  };

  const handleWidgetToggle = (key: WidgetConfig['key']) => {
    setWidgetConfigs(prev => {
      const updated = prev.map(w => w.key === key ? { ...w, visible: !w.visible } : w);
      localStorage.setItem('nexus_dashboard_widgets', JSON.stringify(updated));
      analyticsService.track('dashboard_widget_toggle', { widget: key, visible: !prev.find(w => w.key === key)?.visible });
      return updated;
    });
  };

  // Fetch real Dashboard data
  useEffect(() => {
    const fetchDashboardData = async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        
        const { metrics, activities } = await dashboardService.getDashboardData();
        setDashboardMetrics(metrics);
        setRecentActivities(activities);
        setLastUpdated(new Date());
        setError(null);
        
        if (isRefresh) {
          analyticsService.track('dashboard_auto_refresh');
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError(error as Error);
        setDashboardMetrics({
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
        setRecentActivities([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

    fetchDashboardData();

    // Set up auto-refresh
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, AUTO_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [AUTO_REFRESH_INTERVAL]);

  const handleManualRefresh = async () => {
    try {
      setRefreshing(true);
      const { metrics, activities } = await dashboardService.getDashboardData();
      setDashboardMetrics(metrics);
      setRecentActivities(activities);
      setLastUpdated(new Date());
      analyticsService.track('dashboard_refresh_manual');
    } catch (error) {
      console.error("Failed to refresh dashboard data", error);
    } finally {
      setRefreshing(false);
    }
  };

  function getStatusColor(status: string): string {
    switch (status) {
      case "success":
        return "bg-success-subtle text-success";
      case "warning":
        return "bg-warning-subtle text-warning";
      case "error":
        return "bg-destructive-subtle text-destructive";
      default:
        return "bg-muted text-muted-foreground";
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'think': return <Brain className="w-4 h-4" />;
      case 'see': return <Eye className="w-4 h-4" />;
      case 'act': return <Zap className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  // Widget access control by role/department
  // Only allow widgets based on user role/department (RBAC)
  const isWidgetAllowed = (key: WidgetConfig['key']) => {
    if (!user) return false;
    const role = user.role || '';
    const department = user.department || '';
    // Demo config: adjust as needed
    switch (key) {
      case 'think':
        return true; // All users
      case 'see':
        return ['admin', 'owner'].includes(role) || department.toLowerCase() === 'finance';
      case 'act':
        return ['admin', 'manager'].includes(role) || department.toLowerCase() === 'operations';
      default:
        return true;
    }
  };

  // Executive action RBAC: Only allow actions for admin/owner/manager or relevant department
  const canPerformExecutiveActions = () => {
    if (!user) return false;
    const role = user.role || '';
    const department = user.department || '';
    return ['admin', 'owner', 'manager'].includes(role) || ['finance', 'operations'].includes(department.toLowerCase());
  };

  // Filter widgetConfigs by access control before rendering/toggling
  const allowedWidgetConfigs = widgetConfigs.filter(w => isWidgetAllowed(w.key));

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
    <div className="min-h-screen">
      <div className="p-8 space-y-8">
        {/* Personal Trinity Widget - Personal Productivity Section */}
        <PersonalTrinityWidget />
        {/* Organizational Trinity Widget - Company Intelligence Section */}
        <OrganizationalTrinityWidget />

        {/* Enhanced Executive Header */}
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center gap-4">
            {/* Use bg-card for icon background to ensure theme consistency and contrast */}
            <div className="p-4 bg-card rounded-full border border-border">
              <Building2 className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Executive Dashboard
              </h1>
              <p className="text-lg text-muted-foreground mt-2">
                Strategic Business Intelligence & Company Performance Overview
              </p>
            </div>
          </div>
          
          {/* Executive KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <Card>
              <CardContent className="p-6 text-center">
                <DollarSign className="w-8 h-8 mx-auto mb-3 text-success" />
                <div className="text-3xl font-bold text-foreground">$2.4M</div>
                <div className="text-sm text-muted-foreground">Annual Revenue</div>
                <div className="text-xs text-success mt-1">+15% YoY</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <Users className="w-8 h-8 mx-auto mb-3 text-primary" />
                <div className="text-3xl font-bold text-foreground">1,247</div>
                <div className="text-sm text-muted-foreground">Active Users</div>
                <div className="text-xs text-primary mt-1">+8% MTD</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <Globe className="w-8 h-8 mx-auto mb-3 text-secondary" />
                <div className="text-3xl font-bold text-foreground">23</div>
                <div className="text-sm text-muted-foreground">Markets</div>
                <div className="text-xs text-secondary mt-1">Global Reach</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <Shield className="w-8 h-8 mx-auto mb-3 text-warning" />
                <div className="text-3xl font-bold text-foreground">99.9%</div>
                <div className="text-sm text-muted-foreground">Uptime</div>
                <div className="text-xs text-warning mt-1">System Health</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Profile Completion Banner */}
        <ProfileCompletionBanner showDetailed={false} />

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="overview">Business Overview</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="var_leads">VAR Leads</TabsTrigger>
            <TabsTrigger value="model_management">Model Management</TabsTrigger>
            <TabsTrigger value="centralized_apps">Centralized Apps</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            {/* Refresh Indicator */}
            {/* Use bg-card and border for refresh indicator for better contrast */}
            {refreshing && (
              <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-card text-primary px-4 py-2 rounded-lg border border-border shadow">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="text-sm">Updating data...</span>
              </div>
            )}

            <div className="grid grid-cols-12 gap-8">
              {/* Primary Content - Strategic Metrics */}
              <div className="col-span-12 lg:col-span-8 space-y-8">
                {/* Trinity Business Intelligence Widgets */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {allowedWidgetConfigs.map(widget => (
                    <motion.div
                      key={widget.key}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className={widget.visible ? "block" : "hidden"}
                    >
                      <Card className="hover:shadow-lg transition-shadow duration-200 border-2">
                        <CardHeader className="pb-3">
                          <div className="flex items-center gap-4">
                            {widget.key === 'think' ? <Brain className="w-6 h-6 text-primary" /> : widget.key === 'see' ? <Eye className="w-6 h-6 text-secondary" /> : <Zap className="w-6 h-6 text-primary" />}
                            <CardTitle className="text-lg">{widget.label}</CardTitle>
                          </div>
                          <CardDescription>Company-wide metrics</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-4">
                            {Object.entries(dashboardMetrics[widget.key]).slice(0, 2).map(([key, value]) => (
                              <div key={key} className="text-center">
                                <p className="text-3xl font-bold text-foreground">{value}</p>
                                <p className="text-xs text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                {/* Strategic Business Insights */}
                <BusinessInsightsPanel />

                {/* Company-wide Activity Stream */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      Strategic Activities
                    </CardTitle>
                    <CardDescription>Cross-departmental initiatives and key business events</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivities.map((activity, index) => (
                        <div key={index} className="flex items-center gap-4 p-4 rounded-lg bg-muted">
                          <div className="flex-shrink-0">
                            {getTypeIcon(activity.type)}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{activity.title}</p>
                            <p className="text-sm text-muted-foreground">{activity.department}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={getStatusColor(activity.status)}>
                              {activity.status}
                            </Badge>
                            <span className="text-sm text-muted-foreground">{activity.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Executive Controls Sidebar */}
              <div className="col-span-12 lg:col-span-4 space-y-6">
                {/* AI Performance Widget */}
                <AIPerformanceWidget />
                
                {/* Executive Actions */}
                {canPerformExecutiveActions() && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5" />
                        Executive Actions
                      </CardTitle>
                      <CardDescription>Strategic decision-making tools</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button variant="outline" className="w-full justify-start" onClick={() => analyticsService.track('executive_action_board_report', { userId: user?.id })}>
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Generate Board Report
                      </Button>
                      <Button variant="outline" className="w-full justify-start" onClick={() => analyticsService.track('executive_action_department_analysis', { userId: user?.id })}>
                        <Users className="w-4 h-4 mr-2" />
                        Department Analysis
                      </Button>
                      <Button variant="outline" className="w-full justify-start" onClick={() => analyticsService.track('executive_action_forecast_review', { userId: user?.id })}>
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Forecast Review
                      </Button>
                      <Button variant="outline" className="w-full justify-start" onClick={() => analyticsService.track('executive_action_risk_assessment', { userId: user?.id })}>
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Risk Assessment
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Dashboard Customization */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Dashboard Settings
                    </CardTitle>
                    <CardDescription>Customize your executive view</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {allowedWidgetConfigs.map(widget => (
                        <div key={widget.key} className="flex items-center justify-between">
                          <Label htmlFor={`toggle-${widget.key}`} className="flex items-center gap-2">
                            {widget.key === 'think' ? <Brain className="w-4 h-4" /> : widget.key === 'see' ? <EyeIcon className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                            <span className="text-sm">{widget.label}</span>
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

                {/* System Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="w-5 h-5" />
                      System Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Data Sources</span>
                        <Badge variant="outline" className="bg-success-subtle text-success">
                          {dashboardMetrics.see.dataSourcesConnected} Connected
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Automations</span>
                        <Badge variant="outline" className="bg-primary-subtle text-primary">
                          {dashboardMetrics.act.automationsRunning} Running
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Last Updated</span>
                        <span className="text-sm text-muted-foreground">
                          {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Never'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="security">
            <Suspense fallback={<DashboardSuspenseFallback />}>
              <SecurityDashboard />
            </Suspense>
          </TabsContent>
          <TabsContent value="var_leads">
            <Suspense fallback={<DashboardSuspenseFallback />}>
              <VARLeadDashboard />
            </Suspense>
          </TabsContent>
          <TabsContent value="model_management">
            <Suspense fallback={<DashboardSuspenseFallback />}>
              <ModelManagementDashboard />
            </Suspense>
          </TabsContent>
          <TabsContent value="centralized_apps">
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