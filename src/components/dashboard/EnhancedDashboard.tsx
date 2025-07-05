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
  PlusCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ContentCard } from '@/components/patterns/ContentCard';
import { SimpleBarChart } from './SimpleBarChart';
import { dashboardService, type DashboardMetrics, type DashboardActivity } from '../../lib/services/dashboardService';
import { motion, AnimatePresence } from 'framer-motion';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardOnboarding } from './DashboardOnboarding';
import { analyticsService } from '@/lib/services/analyticsService';
import { ErrorBoundary as CommonErrorBoundary } from "@/components/common/ErrorBoundary";
import { Recents } from "./Recents";
import { Pins } from "./Pins";
import { QuickActionsPanel } from "./QuickActionsPanel";

/**
 * @name EnhancedDashboard
 * @description Modern Trinity-powered dashboard with contemporary design principles
 * @returns {JSX.Element} The rendered enhanced dashboard component.
 */

// All color classes use design tokens per design system

interface WidgetConfig {
  key: 'think' | 'see' | 'act';
  label: string;
  visible: boolean;
}

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { key: 'think', label: 'THINK', visible: true },
  { key: 'see', label: 'SEE', visible: true },
  { key: 'act', label: 'ACT', visible: true },
];

// Lazy load heavy widgets
const OrganizationalHealthScore = lazy(() => import('./OrganizationalHealthScore'));
const CrossDepartmentMatrix = lazy(() => import('./CrossDepartmentMatrix'));
const TrinityInsightsEngine = lazy(() => import('./TrinityInsightsEngine'));

const EnhancedDashboard: React.FC = () => {
  const { user, completeOnboarding } = useAuth();
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
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showBriefing, setShowBriefing] = useState(() => {
    const today = new Date().toISOString().slice(0, 10);
    return localStorage.getItem('aiBriefingDismissed') !== today;
  });

  const trinityData = [
    { name: 'Ideas', value: dashboardMetrics.think.ideasCaptured },
    { name: 'Insights', value: dashboardMetrics.see.realTimeInsights },
    { name: 'Actions', value: dashboardMetrics.act.automationsRunning }
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
      analyticsService.init(user.id, {
        email: user.email,
        role: user.role,
        department: user.department,
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
    const fetchDashboardData = async () => {
      try {
        const { metrics, activities } = await dashboardService.getDashboardData();
        setDashboardMetrics(metrics);
        setRecentActivities(activities);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  function getStatusColor(status: string): string {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-700";
      case "warning":
        return "bg-yellow-100 text-yellow-700";
      case "error":
        return "bg-red-100 text-red-700";
      default:
        return "";
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

  const handleDismissBriefing = () => {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem('aiBriefingDismissed', today);
    setShowBriefing(false);
  };

  // Widget access control by role/department
  const isWidgetAllowed = (key: WidgetConfig['key']) => {
    if (!user) return false;
    const role = user.role || user.profile?.role || '';
    const department = user.department || user.profile?.department || '';
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

  // Filter widgetConfigs by access control before rendering/toggling
  const allowedWidgetConfigs = widgetConfigs.filter(w => isWidgetAllowed(w.key));

  if (showOnboarding) {
    return (
      <div className="p-6">
        <DashboardOnboarding 
          onComplete={handleCompleteOnboarding}
          userName={user?.name}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Modern Header with Trinity Navigation */}
      <div className="relative overflow-hidden border-b border-border/50">
        <div className="relative px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-900 dark:from-white dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent">
                Nexus Organizational Command Center
              </h1>
              <p className="text-muted-foreground dark:text-muted-foreground mt-1">
                Single source of truth for organizational intelligence • Powered by Trinity
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="px-4 py-2 bg-success/5 text-success border-success/20">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                All Systems Active
              </Badge>
              <Button 
                variant="outline" 
                size="sm"
                onClick={async () => {
                  try {
                    const { metrics, activities } = await dashboardService.getDashboardData();
                    setDashboardMetrics(metrics);
                    setRecentActivities(activities);
                  } catch (error) {
                    console.error('Failed to refresh dashboard data:', error);
                  }
                }}
              >
                Refresh Data
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* AI Daily Briefing Widget */}
        <AnimatePresence>
          {showBriefing && !showOnboarding && (
            <motion.div
              initial={{ opacity: 0, y: -24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.4 }}
            >
              <ContentCard
                title="AI Daily Briefing"
                variant="elevated"
                className="mb-6 relative"
                aria-live="polite"
                aria-label="AI Daily Briefing"
              >
                <button
                  onClick={() => { handleDismissBriefing(); analyticsService.track('dashboard_briefing_dismissed'); }}
                  aria-label="Dismiss daily briefing"
                  className="absolute top-4 right-4 text-muted-foreground hover:text-destructive focus:outline-none"
                  tabIndex={0}
                >
                  <span aria-hidden="true">&times;</span>
                </button>
                <div className="flex items-center gap-3 mb-2">
                  <Sparkles className="w-5 h-5 text-warning" />
                  <span className="font-semibold text-lg">Your AI-powered summary for {new Date().toLocaleDateString()}</span>
                </div>
                <div className="text-base text-muted-foreground">
                  Welcome back! Here's your daily snapshot:
                  <ul className="list-disc ml-6 mt-2">
                    <li>Revenue is up 4.2% week-over-week.</li>
                    <li>3 new cross-department projects started.</li>
                    <li>AI detected a workflow bottleneck in onboarding—review suggested optimizations.</li>
                  </ul>
                  <span className="block mt-2 text-xs text-muted-foreground">(This briefing updates daily. Dismiss to hide until tomorrow.)</span>
                </div>
              </ContentCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Trinity Performance Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {allowedWidgetConfigs.filter(w => w.visible).map((w, i) => (
              <motion.div
                key={w.key}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 24 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                onViewportEnter={() => analyticsService.track('dashboard_widget_view', { widget: w.key })}
              >
                <ErrorBoundary>
                  {w.key === 'think' && (
                    <Card className="group hover:shadow-xl transition-all duration-300">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="p-4 rounded-xl bg-primary/10 text-primary">
                              <Brain className="w-6 h-6" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">THINK Engine</CardTitle>
                              <CardDescription>Creative Intelligence</CardDescription>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-4 rounded-lg bg-card/60 dark:bg-background/40">
                            <div className="text-2xl font-bold text-primary">
                              {loading ? '...' : dashboardMetrics.think.ideasCaptured}
                            </div>
                            <div className="text-sm text-muted-foreground dark:text-muted-foreground">Ideas Captured</div>
                          </div>
                          <div className="text-center p-4 rounded-lg bg-card/60 dark:bg-background/40">
                            <div className="text-2xl font-bold text-primary">
                              {loading ? '...' : dashboardMetrics.think.collaborationSessions}
                            </div>
                            <div className="text-sm text-muted-foreground dark:text-muted-foreground">Active Sessions</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  {w.key === 'see' && (
                    <Card className="group hover:shadow-xl transition-all duration-300">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="p-4 rounded-xl bg-secondary/10 text-secondary">
                              <Eye className="w-6 h-6" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">SEE Analytics</CardTitle>
                              <CardDescription>Business Intelligence</CardDescription>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-4 rounded-lg bg-card/60 dark:bg-background/40">
                            <div className="text-2xl font-bold text-secondary">
                              {loading ? '...' : dashboardMetrics.see.dataSourcesConnected}
                            </div>
                            <div className="text-sm text-muted-foreground dark:text-muted-foreground">Data Sources</div>
                          </div>
                          <div className="text-center p-4 rounded-lg bg-card/60 dark:bg-background/40">
                            <div className="text-2xl font-bold text-secondary">
                              {loading ? '...' : dashboardMetrics.see.realTimeInsights}
                            </div>
                            <div className="text-sm text-muted-foreground dark:text-muted-foreground">Live Insights</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  {w.key === 'act' && (
                    <Card className="group hover:shadow-xl transition-all duration-300">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="p-4 rounded-xl bg-primary/10 text-primary">
                              <Zap className="w-6 h-6" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">ACT Automation</CardTitle>
                              <CardDescription>Operational Intelligence</CardDescription>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-4 rounded-lg bg-card/60 dark:bg-background/40">
                            <div className="text-2xl font-bold text-primary">
                              {loading ? '...' : dashboardMetrics.act.automationsRunning}
                            </div>
                            <div className="text-sm text-muted-foreground dark:text-muted-foreground">Active Automations</div>
                          </div>
                          <div className="text-center p-4 rounded-lg bg-card/60 dark:bg-background/40">
                            <div className="text-2xl font-bold text-primary">
                              {loading ? '...' : `${Math.floor(dashboardMetrics.act.timeSaved / 60)}h`}
                            </div>
                            <div className="text-sm text-muted-foreground dark:text-muted-foreground">Time Saved</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </ErrorBoundary>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Organizational Health Score - New Command Center View */}
        <Suspense fallback={<div className="mb-8"><div className="animate-pulse h-24 bg-muted rounded-lg" /></div>}>
          <ErrorBoundary>
            <OrganizationalHealthScore className="mb-8" />
          </ErrorBoundary>
        </Suspense>

        {/* Cross-Department Intelligence Grid */}
        <Suspense fallback={<div className="mb-8"><div className="animate-pulse h-24 bg-muted rounded-lg" /></div>}>
          <ErrorBoundary>
            <CrossDepartmentMatrix className="mb-8" />
          </ErrorBoundary>
        </Suspense>

        {/* Trinity Insights Engine */}
        <Suspense fallback={<div className="mb-8"><div className="animate-pulse h-24 bg-muted rounded-lg" /></div>}>
          <ErrorBoundary>
            <TrinityInsightsEngine className="mb-8" />
          </ErrorBoundary>
        </Suspense>

        {/* Trinity Flow Visualization and Activity Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Trinity Flow Chart */}
          <Card className="border-0">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-primary" />
                    Trinity Performance Flow
                  </CardTitle>
                  <CardDescription>Real-time intelligence cycle metrics</CardDescription>
                </div>
                <Button variant="outline" size="sm" className="text-xs">
                  View Details <ArrowUpRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <SimpleBarChart data={trinityData} />
            </CardContent>
          </Card>

          {/* Enhanced Activity Feed */}
          <Card className="border-0">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-success" />
                    Trinity Activity Stream
                  </CardTitle>
                  <CardDescription>Live organizational intelligence flow</CardDescription>
                </div>
                <Badge variant="outline" className="animate-pulse">
                  <div className="w-2 h-2 bg-success rounded-full mr-2" />
                  Live
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <AnimatePresence>
                {!loading && recentActivities.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Zap className="mx-auto h-12 w-12 mb-4" />
                    <h3 className="text-lg font-semibold">No Activity Yet</h3>
                    <p className="text-sm">
                      Connect a data source or start a new workflow to see your activity stream here.
                    </p>
                    <Button variant="outline" size="sm" className="mt-4">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Connect Source
                    </Button>
                  </div>
                ) : (
                  recentActivities.map((activity, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 32 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 32 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="flex items-start space-x-4 p-4 rounded-xl bg-slate-50/60 dark:bg-background/40 hover:bg-muted/60 dark:hover:bg-slate-700/40 transition-colors"
                    >
                      <div className={`p-2 rounded-lg ${getStatusColor(activity.status) || ""}`}>{getTypeIcon(activity.type)}</div>
                      <div className="flex-1">
                        <div className="font-medium text-slate-900 dark:text-slate-100">{activity.title}</div>
                        <div className="text-sm text-muted-foreground dark:text-muted-foreground">{activity.department}</div>
                      </div>
                      <div className="text-xs text-muted-foreground dark:text-muted-foreground">{activity.time}</div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>

        {/* Smart Insights Panel */}
        <Card className="border-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center text-xl">
                  <Sparkles className="w-6 h-6 mr-3 text-warning" />
                  AI-Powered Trinity Insights
                </CardTitle>
                <CardDescription>Intelligent recommendations from your organizational data</CardDescription>
              </div>
              <Button variant="default" className="bg-primary text-white shadow focus:ring-2 focus:ring-primary/50">
                <Lightbulb className="w-4 h-4 mr-2" />
                Generate New Insights
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-xl bg-card/60 dark:bg-background/40 space-y-4">
                <div className="flex items-center text-primary">
                  <Brain className="w-5 h-5 mr-2" />
                  <span className="font-medium">Think Insight</span>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  Cross-department collaboration has increased 34% this week. Consider expanding innovation sessions.
                </p>
              </div>
              <div className="p-6 rounded-xl bg-card/60 dark:bg-background/40 space-y-4">
                <div className="flex items-center text-secondary">
                  <Eye className="w-5 h-5 mr-2" />
                  <span className="font-medium">See Insight</span>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  Revenue pattern shows 15% uptick correlation with new automation deployment.
                </p>
              </div>
              <div className="p-6 rounded-xl bg-card/60 dark:bg-background/40 space-y-4">
                <div className="flex items-center text-primary">
                  <Zap className="w-5 h-5 mr-2" />
                  <span className="font-medium">Act Insight</span>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  Workflow optimization opportunity detected in customer onboarding process.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Widget Visibility Controls */}
        <div className="flex gap-2 mb-4" role="group" aria-label="Widget visibility controls">
          {allowedWidgetConfigs.map(w => (
            <Button
              key={w.key}
              variant={w.visible ? 'default' : 'outline'}
              size="sm"
              aria-pressed={w.visible}
              aria-label={`Toggle ${w.label} widget`}
              onClick={() => handleWidgetToggle(w.key)}
              tabIndex={0}
            >
              {w.visible ? <EyeIcon className="w-4 h-4 mr-1" /> : <EyeOff className="w-4 h-4 mr-1" />}
              {w.label}
            </Button>
          ))}
        </div>

        {/* Recents */}
        <ErrorBoundary>
          <Recents />
        </ErrorBoundary>

        {/* Pins */}
        <ErrorBoundary>
          <Pins />
        </ErrorBoundary>

        {/* Quick Actions Panel */}
        <ErrorBoundary>
          <QuickActionsPanel />
        </ErrorBoundary>
      </div>
    </div>
  );
};

export default EnhancedDashboard;