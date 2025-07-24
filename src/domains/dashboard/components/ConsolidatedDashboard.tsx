/**
 * ConsolidatedDashboard.tsx
 * Unified Dashboard Component - Consolidates Analytics & Dashboard Domains
 * Implements Marcoby Nexus vision with FIRE CYCLE and See/Think/Act framework
 */

import React, { useState, useEffect } from 'react';
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
  BrainCircuit
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Progress } from '@/shared/components/ui/Progress';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { useAuth } from '@/core/auth/AuthProvider';
import { CompanyStatusDashboard } from './CompanyStatusDashboard';
import LivingBusinessAssessment from './LivingBusinessAssessment';
import UnifiedCommunicationDashboard from './UnifiedCommunicationDashboard';
import { realDataService } from '@/domains/services/realDataService';

// Import consolidated analytics components
import { CrossPlatformInsightsEngine, DigestibleMetricsDashboard, FireCycleDashboard } from '@/domains/analytics';

/**
 * Smart display name logic based on real-world best practices
 * Priority: display_name > first_name > email_username > fallback
 */
const getDisplayName = (profile: any, user: any): string => {
  // 1. Use display_name if available (user's preferred name)
  if (profile?.display_name) {
    return profile.display_name;
  }
  
  // 2. Use first_name if available
  if (profile?.first_name) {
    return profile.first_name;
  }
  
  // 3. Use email username as fallback
  if (user?.email) {
    const username = user.email.split('@')[0];
    return username.charAt(0).toUpperCase() + username.slice(1).toLowerCase();
  }
  
  // 4. Final fallback
  return 'User';
};

interface DashboardWidget {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  component: React.ComponentType<any>;
  category: 'fire-cycle' | 'see-think-act' | 'business-intelligence' | 'communication';
  priority: 'high' | 'medium' | 'low';
  enabled: boolean;
}

interface FireCycleState {
  phase: 'focus' | 'insight' | 'roadmap' | 'execute';
  progress: number;
  insights: string[];
  actions: string[];
  lastUpdated: string;
}

interface BusinessHealth {
  overall: number;
  revenue: number;
  operations: number;
  team: number;
  customer: number;
  trend: 'up' | 'down' | 'stable';
}

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  category: 'automation' | 'analysis' | 'communication' | 'planning';
  priority: 'urgent' | 'high' | 'medium' | 'low';
}

export const ConsolidatedDashboard: React.FC = () => {
  const { user, session, profile, initialized } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'fire-cycle' | 'analytics' | 'communication'>('overview');
  const [fireCycleState, setFireCycleState] = useState<FireCycleState>({
    phase: 'focus',
    progress: 65,
    insights: ['Revenue growth detected', 'Customer satisfaction improving'],
    actions: ['Review Q4 strategy', 'Update team goals'],
    lastUpdated: new Date().toISOString()
  });
  const [businessHealth, setBusinessHealth] = useState<BusinessHealth>({
    overall: 78,
    revenue: 85,
    operations: 72,
    team: 81,
    customer: 76,
    trend: 'up'
  });
  const [quickActions] = useState<QuickAction[]>([
    {
      id: 'analyze-revenue',
      label: 'Analyze Revenue',
      description: 'Deep dive into revenue trends',
      icon: <TrendingUp className="w-4 h-4" />,
      action: () => handleQuickAction('analyze-revenue'),
      category: 'analysis',
      priority: 'high'
    },
    {
      id: 'team-performance',
      label: 'Team Performance',
      description: 'Review team metrics and goals',
      icon: <Users className="w-4 h-4" />,
      action: () => handleQuickAction('team-performance'),
      category: 'analysis',
      priority: 'medium'
    },
    {
      id: 'automate-processes',
      label: 'Automate Processes',
      description: 'Set up workflow automation',
      icon: <Zap className="w-4 h-4" />,
      action: () => handleQuickAction('automate-processes'),
      category: 'automation',
      priority: 'high'
    },
    {
      id: 'customer-insights',
      label: 'Customer Insights',
      description: 'Analyze customer behavior',
      icon: <Brain className="w-4 h-4" />,
      action: () => handleQuickAction('customer-insights'),
      category: 'analysis',
      priority: 'medium'
    }
  ]);
  
  // Debug: Log user object to see what's available
  useEffect(() => {
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('ConsolidatedDashboard - User state: ', {
      user: user,
      session: session,
      profile: profile,
      loading: loading,
      initialized: initialized,
      userExists: !!user,
      sessionExists: !!session,
      profileExists: !!profile,
      userId: user?.id,
      userEmail: user?.email,
      userName: user?.email?.split('@')[0] || 'User',
      profileDisplayName: profile?.display_name,
      profileFirstName: profile?.first_name,
      profileLastName: profile?.last_name,
      profileEmail: profile?.email,
      profileRole: profile?.role,
      // Welcome message calculation
      welcomeName: getDisplayName(profile, user),
      profileCompletion: profile?.profile_completion_percentage
    });
  }, [user, session, profile, loading, initialized]);

  // Load dashboard data when component mounts
  useEffect(() => {
    if (user && session) {
      loadDashboardData();
    }
  }, [user, session]);

  // Show loading skeleton if auth is not ready
  if (loading || !initialized || !user || !session) {
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('ConsolidatedDashboard - Showing loading skeleton: ', {
      loading,
      initialized,
      hasUser: !!user,
      hasSession: !!session
    });
    return (
      <div className="space-y-6 p-6">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark: from-blue-950/20 dark:to-purple-950/20 rounded-lg p-6">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('ConsolidatedDashboard - Rendering main dashboard');

  const dashboardWidgets: DashboardWidget[] = [
    {
      id: 'company-status',
      title: 'Company Status',
      description: 'Real-time business health overview',
      icon: <Building2 className="w-5 h-5" />,
      component: CompanyStatusDashboard,
      category: 'business-intelligence',
      priority: 'high',
      enabled: true
    },
    {
      id: 'living-assessment',
      title: 'Living Business Assessment',
      description: 'Dynamic business health monitoring',
      icon: <Activity className="w-5 h-5" />,
      component: LivingBusinessAssessment,
      category: 'business-intelligence',
      priority: 'high',
      enabled: true
    },
    {
      id: 'fire-cycle',
      title: 'FIRE Cycle',
      description: 'Focus, Insight, Roadmap, Execute framework',
      icon: <Brain className="w-5 h-5" />,
      component: FireCycleDashboard,
      category: 'fire-cycle',
      priority: 'high',
      enabled: true
    },
    {
      id: 'cross-platform-insights',
      title: 'Cross-Platform Intelligence',
      description: 'AI-powered insights from connected data',
      icon: <BrainCircuit className="w-5 h-5" />,
      component: CrossPlatformInsightsEngine,
      category: 'see-think-act',
      priority: 'high',
      enabled: true
    },
    {
      id: 'digestible-metrics',
      title: 'Digestible Metrics',
      description: 'Business metrics made actionable',
      icon: <BarChart3 className="w-5 h-5" />,
      component: DigestibleMetricsDashboard,
      category: 'see-think-act',
      priority: 'medium',
      enabled: true
    },
    {
      id: 'unified-communication',
      title: 'Unified Communication',
      description: 'Cross-platform communication insights',
      icon: <Users className="w-5 h-5" />,
      component: UnifiedCommunicationDashboard,
      category: 'communication',
      priority: 'medium',
      enabled: true
    }
  ];

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get real business metrics from connected integrations
      const realMetrics = await realDataService.getBusinessMetrics();
      
      // Calculate health scores
      const calculateRevenueHealth = (salesMetrics: any): number => {
        const pipelineValue = salesMetrics?.pipeline_value || 0;
        const conversionRate = salesMetrics?.conversion_rate || 0;
        const averageDealSize = salesMetrics?.average_deal_size || 0;
        
        // Simple scoring algorithm
        let score = 50; // Base score
        
        if (pipelineValue > 1000000) score += 20;
        if (conversionRate > 20) score += 15;
        if (averageDealSize > 50000) score += 15;
        
        return Math.min(100, score);
      };

      const calculateOverallHealth = (metrics: any): number => {
        const salesHealth = calculateRevenueHealth(metrics?.sales);
        const marketingHealth = 75; // Would calculate from marketing metrics
        const financeHealth = 80; // Would calculate from finance metrics
        
        return Math.round((salesHealth + marketingHealth + financeHealth) / 3);
      };
      
      // Update business health based on real data
      const newBusinessHealth: BusinessHealth = {
        overall: calculateOverallHealth(realMetrics),
        revenue: calculateRevenueHealth(realMetrics?.sales),
        operations: 72, // Would come from operations data
        team: 81, // Would come from HR data
        customer: 76, // Would come from customer data
        trend: 'up'
      };
      
      setBusinessHealth(newBusinessHealth);
      
      // Update FIRE cycle state
      setFireCycleState(prev => ({
        ...prev,
        progress: Math.min(100, prev.progress + 10),
        lastUpdated: new Date().toISOString()
      }));

    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error loading dashboard data: ', error);
      // Fallback to mock data
      setBusinessHealth(prev => ({
        ...prev,
        overall: Math.min(100, prev.overall + 2),
        trend: 'up'
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (action: string) => {
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('Quick action triggered: ', action);
    // Implement quick action logic
  };

  const getFireCycleColor = (phase: string) => {
    switch (phase) {
      case 'focus': return 'text-blue-500';
      case 'insight': return 'text-purple-500';
      case 'roadmap': return 'text-orange-500';
      case 'execute': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 md: grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-2/3" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header with FIRE Cycle Progress */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark: from-blue-950/20 dark:to-purple-950/20 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Welcome back, {getDisplayName(profile, user)}!
            </h1>
            <p className="text-muted-foreground mt-1">
              Your business command center is ready
            </p>
            {profile && profile.profile_completion_percentage && profile.profile_completion_percentage < 100 && (
              <div className="mt-2 flex items-center space-x-2">
                <div className="text-xs text-muted-foreground">
                  Profile {profile.profile_completion_percentage}% complete
                </div>
                <Button variant="link" size="sm" className="text-xs p-0 h-auto">
                  Complete Profile
                </Button>
              </div>
            )}
          </div>
          <Button onClick={loadDashboardData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* FIRE Cycle Status */}
        <div className="grid grid-cols-1 md: grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">FIRE Cycle Progress</h3>
              <Badge variant="outline" className={getFireCycleColor(fireCycleState.phase)}>
                {fireCycleState.phase.toUpperCase()}
              </Badge>
            </div>
            <Progress value={fireCycleState.progress} className="h-2" />
            <div className="text-sm text-muted-foreground">
              Last updated: {new Date(fireCycleState.lastUpdated).toLocaleTimeString()}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Business Health</h3>
              <Badge variant="outline" className={getHealthColor(businessHealth.overall)}>
                {businessHealth.overall}%
              </Badge>
            </div>
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div className="text-center">
                <div className="font-semibold">Revenue</div>
                <div className={getHealthColor(businessHealth.revenue)}>{businessHealth.revenue}%</div>
              </div>
              <div className="text-center">
                <div className="font-semibold">Operations</div>
                <div className={getHealthColor(businessHealth.operations)}>{businessHealth.operations}%</div>
              </div>
              <div className="text-center">
                <div className="font-semibold">Team</div>
                <div className={getHealthColor(businessHealth.team)}>{businessHealth.team}%</div>
              </div>
              <div className="text-center">
                <div className="font-semibold">Customer</div>
                <div className={getHealthColor(businessHealth.customer)}>{businessHealth.customer}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="w-5 h-5 mr-2" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md: grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Button
                key={action.id}
                variant="outline"
                className="h-auto p-4 flex flex-col items-start space-y-2"
                onClick={action.action}
              >
                <div className="flex items-center space-x-2 w-full">
                  {action.icon}
                  <Badge variant="outline" className={getPriorityColor(action.priority)}>
                    {action.priority}
                  </Badge>
                </div>
                <div className="text-left">
                  <div className="font-semibold text-sm">{action.label}</div>
                  <div className="text-xs text-muted-foreground">{action.description}</div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg">
        {[
          { id: 'overview', label: 'Overview', icon: <Eye className="w-4 h-4" /> },
          { id: 'fire-cycle', label: 'FIRE Cycle', icon: <Brain className="w-4 h-4" /> },
          { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
          { id: 'communication', label: 'Communication', icon: <Users className="w-4 h-4" /> }
        ].map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab(tab.id as any)}
            className="flex items-center space-x-2"
          >
            {tab.icon}
            <span>{tab.label}</span>
          </Button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {dashboardWidgets
                .filter(widget => widget.enabled && widget.priority === 'high')
                .map((widget) => (
                  <Card key={widget.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        {widget.icon}
                        <span className="ml-2">{widget.title}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <widget.component />
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}

          {activeTab === 'fire-cycle' && (
            <div className="space-y-6">
              {dashboardWidgets
                .filter(widget => widget.category === 'fire-cycle')
                .map((widget) => (
                  <Card key={widget.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        {widget.icon}
                        <span className="ml-2">{widget.title}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <widget.component />
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {dashboardWidgets
                .filter(widget => widget.category === 'see-think-act')
                .map((widget) => (
                  <Card key={widget.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        {widget.icon}
                        <span className="ml-2">{widget.title}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <widget.component />
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}

          {activeTab === 'communication' && (
            <div className="space-y-6">
              {dashboardWidgets
                .filter(widget => widget.category === 'communication')
                .map((widget) => (
                  <Card key={widget.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        {widget.icon}
                        <span className="ml-2">{widget.title}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <widget.component />
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}; 