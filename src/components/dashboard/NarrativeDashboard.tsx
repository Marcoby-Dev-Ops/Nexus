import React, { useEffect, useState } from 'react';
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
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Target,
  Lightbulb,
  Clock,
  Star,
  ArrowUpRight,
  ChevronRight,
  Search,
  Command,
  Settings,
  HelpCircle,
  MessageSquare,
  Bell,
  Maximize2,
  Minimize2,
  Grid3X3,
  Calendar,
  TrendingDown,
  Plus,
  X,
  Check,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Progress } from '@/shared/components/ui/Progress';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { Input } from '@/shared/components/ui/Input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/Tooltip';
import { useAuth } from '@/hooks/index';
import { useHeaderContext } from '@/shared/hooks/useHeaderContext';
import { useNarrativeDashboard } from '@/hooks/dashboard/useNarrativeDashboard';
import { CompanyStatusDashboard } from './CompanyStatusDashboard';
import LivingBusinessAssessment from './LivingBusinessAssessment';
import UnifiedCommunicationDashboard from './UnifiedCommunicationDashboard';

// Import consolidated analytics components
import { DigestibleMetricsDashboard, FireCycleDashboard } from '@/components/analytics';
import CrossPlatformInsightsEngine from '@/components/analytics/CrossPlatformInsightsEngine';

/**
 * Smart display name logic based on real-world best practices
 * Priority: display_name > first_name > email_username > fallback
 */
const getDisplayName = (profile: Record<string, unknown> | null, user: any): string => {
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

/**
 * Convert string icon to React component
 */
const getIconComponent = (iconString: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    '💵': <DollarSign className="w-4 h-4" />,
    '⚡': <Activity className="w-4 h-4" />,
    '🌍': <Globe className="w-4 h-4" />,
    '👥': <Users className="w-4 h-4" />,
    '🏢': <Building2 className="w-4 h-4" />,
    '🎯': <Target className="w-4 h-4" />,
    '📈': <TrendingUp className="w-4 h-4" />,
    '🛡️': <Shield className="w-4 h-4" />,
    '🔄': <RefreshCw className="w-4 h-4" />
  };
  
  return iconMap[iconString] || <Activity className="w-4 h-4" />;
};

// Workspace modes for different user contexts
type WorkspaceMode = 'focus' | 'analytics' | 'automation' | 'overview';

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

const NarrativeDashboard: React.FC = () => {
  const { user } = useAuth();
  const { setHeaderContent } = useHeaderContext();
  const { 
    data, 
    loading, 
    error, 
    refreshing, 
    profileCompletionPercentage, 
    isProfileComplete, 
    refresh 
  } = useNarrativeDashboard();

  // Advanced UI state
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>('overview');
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [liveDataEnabled, setLiveDataEnabled] = useState(true);
  const [showAssistant, setShowAssistant] = useState(true);

  // Set header content when component mounts
  useEffect(() => {
    setHeaderContent('Dashboard', null);
    
    // Cleanup when component unmounts
    return () => {
      setHeaderContent(null, null);
    };
  }, [setHeaderContent]);

  // Auto-refresh for live data effect
  useEffect(() => {
    if (!liveDataEnabled) return;
    
    const interval = setInterval(() => {
      // Simulate live data updates
      refresh();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [liveDataEnabled, refresh]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
      if (e.key === 'Escape') {
        setShowCommandPalette(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleRefresh = async () => {
    await refresh();
  };

  const toggleSection = (sectionId: string) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getCompanyMilestone = () => {
    // Mock company milestone - in real implementation, this would come from company data
    const milestones = [
      "Happy 1-Year Anniversary! 🎉",
      "You've grown 150% this quarter! 📈",
      "Welcome to your 50th customer! 🎯",
      "Your team has doubled in size! 👥"
    ];
    return milestones[Math.floor(Math.random() * milestones.length)];
  };

  if (loading) {
    return <DashboardSuspenseFallback />;
  }

  if (error) {
    return (
      <div className="w-full p-6">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 mx-auto text-destructive" />
          <h2 className="text-xl font-semibold">Failed to load dashboard data</h2>
          <p className="text-muted-foreground">
            We couldn't load your dashboard data. Please try refreshing the page.
          </p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="w-full space-y-6 p-6">
        {/* 1. Enhanced Welcome & Progress Banner (Hero Section) */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-50 via-purple-50 to-indigo-50 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-indigo-950/20 rounded-xl p-6 border border-border/50 relative overflow-hidden"
        >
          {/* Live data indicator */}
          {liveDataEnabled && (
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-muted-foreground">Live</span>
            </div>
          )}

          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div>
                                   <h1 className="text-2xl font-bold text-foreground">
                   {getGreeting()}, {getDisplayName(null, user)}!
                 </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    {getCompanyMilestone()}
                  </p>
                </div>
                <Badge variant="outline" className="bg-gradient-to-r from-blue-100 to-purple-100 text-primary border-border">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Nexus
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm max-w-2xl">
                Your operating system for business growth, insight, and automation.
              </p>
              
              {/* Enhanced Journey Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Journey to Operational Excellence</span>
                  <span className="font-medium">{Math.round(profileCompletionPercentage / 16.67)}/6 steps complete</span>
                </div>
                <Progress value={profileCompletionPercentage} className="h-2" />
                {!isProfileComplete && (
                  <p className="text-xs text-primary">
                    Complete your profile for tailored insights and automation recommendations
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                onClick={() => setShowCommandPalette(true)}
                variant="outline" 
                size="sm"
                className="gap-2"
              >
                <Command className="w-4 h-4" />
                <span className="hidden sm:inline">Quick Actions</span>
                <kbd className="hidden lg:inline text-xs bg-muted px-1 rounded">⌘K</kbd>
              </Button>
              <Button 
                onClick={handleRefresh} 
                variant="outline" 
                size="sm"
                disabled={refreshing}
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* 2. Enhanced Live Business Pulse (Top KPIs) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-2"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">
                Your business at a glance—revenue, reach, engagement, and uptime.
              </span>
            </div>
            <div className="flex items-center gap-2">
                             <Tooltip content={liveDataEnabled ? 'Disable live updates' : 'Enable live updates'}>
                 <Button
                   variant="ghost"
                   size="sm"
                   onClick={() => setLiveDataEnabled(!liveDataEnabled)}
                   className="h-8 w-8 p-0"
                 >
                   {liveDataEnabled ? (
                     <Play className="w-4 h-4" />
                   ) : (
                     <Pause className="w-4 h-4" />
                   )}
                 </Button>
               </Tooltip>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="h-20 hover:shadow-md transition-shadow group">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Revenue</p>
                    <p className="text-lg font-bold group-hover:scale-105 transition-transform">
                      {data?.kpis.revenue || '$2.4M'}
                    </p>
                    <p className="text-xs text-success flex items-center gap-1">
                      <ArrowUpRight className="w-3 h-3" />
                      +15% YoY
                    </p>
                  </div>
                  <DollarSign className="w-6 h-6 text-success" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="h-20 hover:shadow-md transition-shadow group">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Active Users</p>
                    <p className="text-lg font-bold group-hover:scale-105 transition-transform">
                      {data?.kpis.activeUsers || '1,247'}
                    </p>
                    <p className="text-xs text-primary flex items-center gap-1">
                      <ArrowUpRight className="w-3 h-3" />
                      +8% MTD
                    </p>
                  </div>
                  <Users className="w-6 h-6 text-primary" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="h-20 hover:shadow-md transition-shadow group">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Markets</p>
                    <p className="text-lg font-bold group-hover:scale-105 transition-transform">
                      {data?.kpis.markets || '23'}
                    </p>
                    <p className="text-xs text-secondary">Global Reach</p>
                  </div>
                  <Globe className="w-6 h-6 text-secondary" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="h-20 hover:shadow-md transition-shadow group">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Uptime</p>
                    <p className="text-lg font-bold group-hover:scale-105 transition-transform">
                      {data?.kpis.uptime || '99.9%'}
                    </p>
                    <p className="text-xs text-warning">System Health</p>
                  </div>
                  <Shield className="w-6 h-6 text-warning" />
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* 3. Enhanced Company Status Overview (Center/Prominent) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-2"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">
                {isProfileComplete 
                  ? "Your business command center is ready" 
                  : "Unlock real-time insights by completing your company profile."
                }
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleSection('company-status')}
              className="h-8 w-8 p-0"
            >
              {collapsedSections.has('company-status') ? (
                <Maximize2 className="w-4 h-4" />
              ) : (
                <Minimize2 className="w-4 h-4" />
              )}
            </Button>
          </div>
          
          {!collapsedSections.has('company-status') && (
            <>
              {!isProfileComplete && (
                <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <h3 className="font-semibold text-foreground">Complete Your Profile</h3>
                        <p className="text-sm text-muted-foreground">
                          Just {100 - profileCompletionPercentage}% left to unlock full business intelligence
                        </p>
                        <div className="flex items-center gap-2">
                          <Progress value={profileCompletionPercentage} className="w-32 h-2" />
                          <span className="text-xs text-muted-foreground">{profileCompletionPercentage}% complete</span>
                        </div>
                      </div>
                      <Button className="bg-primary hover:bg-primary/90">
                        <Target className="w-4 h-4 mr-2" />
                        Complete Profile
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <CompanyStatusDashboard />
            </>
          )}
        </motion.div>

        {/* 4. Enhanced Actionable Quadrants (Business Health Grid) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-2"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">
                Monitor your core business drivers at a glance.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleSection('quadrants')}
                className="h-8 w-8 p-0"
              >
                {collapsedSections.has('quadrants') ? (
                  <Maximize2 className="w-4 h-4" />
                ) : (
                  <Minimize2 className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
          
          {!collapsedSections.has('quadrants') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
              {data?.businessQuadrants.map((quadrant) => (
                <Card key={quadrant.id} className="hover:shadow-md transition-shadow cursor-pointer group">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className={`p-2 rounded-lg bg-muted/50 ${quadrant.color}`}>
                          {getIconComponent(quadrant.icon as string)}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {quadrant.trendDirection === 'up' ? '↗' : quadrant.trendDirection === 'down' ? '↘' : '→'}
                        </Badge>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-sm">{quadrant.title}</h3>
                        <p className="text-lg font-bold group-hover:scale-105 transition-transform">{quadrant.metric}</p>
                        <p className="text-xs text-muted-foreground">{quadrant.trend}</p>
                      </div>
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full text-xs group-hover:bg-primary/10"
                      >
                        {quadrant.action}
                        <ChevronRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </motion.div>

        {/* 5. Enhanced Alerts & Insights (Action Center) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-4"
        >
          {/* Active Alerts */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Active Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data?.alerts.map((alert) => (
                <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <div className={`p-1 rounded ${alert.type === 'success' ? 'text-green-600' : alert.type === 'warning' ? 'text-yellow-600' : alert.type === 'error' ? 'text-red-600' : 'text-blue-600'}`}>
                    {getIconComponent(alert.icon as string)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{alert.title}</p>
                    <p className="text-xs text-muted-foreground">{alert.message}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* AI Insights */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Brain className="w-4 h-4" />
                AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data?.aiInsights.map((insight) => (
                <div key={insight.id} className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
                  <div className="p-1 rounded bg-primary/20 text-primary">
                    {getIconComponent(insight.icon as string)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium">{insight.title}</h4>
                      <Badge 
                        variant={insight.priority === 'high' ? 'destructive' : insight.priority === 'medium' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {insight.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{insight.description}</p>
                    <Button variant="outline" size="sm" className="text-xs">
                      {insight.action}
                      <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* 6. Enhanced Quick Actions & Recent Activity (Sidebar) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-4 gap-4"
        >
          {/* Quick Actions */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
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
              <Button variant="outline" size="sm" className="w-full justify-start h-8 text-xs">
                <Zap className="w-3 h-3 mr-2" />
                View Automations
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data?.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="mt-1 p-1 rounded bg-muted/50">
                      {getIconComponent(activity.icon as string)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
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
                <div className="flex items-center justify-between">
                  <span className="text-xs">Integrations</span>
                  <Badge variant="default" className="text-xs">Synced</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 7. Enhanced Footer with Status & Help */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="border-t pt-4"
        >
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>Last updated: {new Date().toLocaleTimeString()}</span>
              <span>•</span>
                             <span>User: {getDisplayName(null, user)}</span>
              <span>•</span>
              <span>Mode: {workspaceMode}</span>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                <HelpCircle className="w-3 h-3 mr-1" />
                Help
              </Button>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                <MessageSquare className="w-3 h-3 mr-1" />
                Feedback
              </Button>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                <Settings className="w-3 h-3 mr-1" />
                Settings
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Additional Dashboard Components */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="space-y-4"
        >
          <LivingBusinessAssessment />
          <UnifiedCommunicationDashboard />
          <DigestibleMetricsDashboard />
          <FireCycleDashboard />
          <CrossPlatformInsightsEngine />
        </motion.div>

        {/* Command Palette */}
        <AnimatePresence>
          {showCommandPalette && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20"
              onClick={() => setShowCommandPalette(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-background border rounded-lg shadow-lg w-full max-w-md mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4 border-b">
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search actions, data, or help..."
                      className="border-0 focus-visible:ring-0"
                      autoFocus
                    />
                  </div>
                </div>
                <div className="p-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-sm">View Analytics</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">Manage Team</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer">
                      <Settings className="w-4 h-4" />
                      <span className="text-sm">Settings</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer">
                      <HelpCircle className="w-4 h-4" />
                      <span className="text-sm">Help & Support</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Assistant */}
        {showAssistant && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed bottom-6 right-6 z-40"
          >
            <Card className="w-80 shadow-lg border-primary/20">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    AI Assistant
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAssistant(false)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  💡 Tip: Your revenue is trending up! Consider scaling your marketing efforts to capitalize on this momentum.
                </p>
                <div className="flex gap-2">
                  <Button size="sm" className="text-xs">
                    View Strategy
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs">
                    Dismiss
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </TooltipProvider>
  );
};

const DashboardSuspenseFallback = () => (
  <div className="space-y-6 p-6">
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

export default NarrativeDashboard;
