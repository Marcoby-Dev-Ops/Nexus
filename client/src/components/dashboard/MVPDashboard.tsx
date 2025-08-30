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
  BrainCircuit,
  DollarSign,
  Globe,
  Shield,
  AlertCircle,
  Lightbulb,
  Target,
  Clock,
  Settings,
  ArrowRight,
  Play,
  CheckCircle,
  AlertTriangle,
  Star,
  Rocket,
  Briefcase,
  MessageSquare,
  FileText,
  PieChart,
  Calendar,
  Plus,
  BookOpen
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Progress } from '@/shared/components/ui/Progress';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { useAuth } from '@/hooks/index';
import { useHeaderContext } from '@/shared/hooks/useHeaderContext';
import { useUserProfile } from '@/shared/contexts/UserContext';
import { useSimpleDashboard } from '@/hooks/dashboard/useSimpleDashboard';
import { useNextBestActions } from '@/hooks/useNextBestActions';
import { useFinancialData } from '@/hooks/dashboard/useFinancialData';
import { useKPICalculation } from '@/hooks/dashboard/useKPICalculation';
import { useLiveBusinessHealth } from '@/hooks/dashboard/useLiveBusinessHealth';

// Import existing components
import { DigestibleMetricsDashboard } from '@/components/analytics';
import { ProgressiveIntelligence } from '@/lib/ai/components/ProgressiveIntelligence';
import { WowMomentOrchestrator } from '@/lib/ai/components/WowMomentOrchestrator';
import { UnifiedBusinessBrain } from '@/lib/ai/components/UnifiedBusinessBrain';
import { BusinessLearningInterface } from '@/lib/ai/components/BusinessLearningInterface';

/**
 * MVP Dashboard - "Tool as a Skill-Bridge" Philosophy
 * 
 * Core Principles:
 * 1. Clarity First - Every feature makes it obvious what to do next
 * 2. Delegation by Design - Easily hand off tasks to team members or AI agents
 * 3. Role-Centric Structure - See business through clear functional units
 * 4. Integrated Intelligence - All tools in one hub for context switching
 * 5. Tool as a Skill-Bridge - Execute vision immediately without mastering every domain
 */

interface NextBestAction {
  id: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'sales' | 'marketing' | 'ops' | 'finance';
  estimatedTime: string;
  impact: string;
  canDelegate: boolean;
  aiAssisted: boolean;
  action: () => void;
}

interface RoleCommandCenter {
  id: 'sales' | 'marketing' | 'ops' | 'finance';
  name: string;
  description: string;
  icon: React.ReactNode;
  status: 'active' | 'attention' | 'optimal';
  metrics: {
    primary: string;
    secondary: string;
    trend: 'up' | 'down' | 'stable';
  };
  quickActions: Array<{
    id: string;
    title: string;
    description: string;
    action: () => void;
  }>;
}

const MVPDashboard: React.FC = () => {
  const { user } = useAuth();
  const { setHeaderContent } = useHeaderContext();
  const { profile } = useUserProfile();
  const { data: dashboardData, loading, error, refresh } = useSimpleDashboard();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  // Real data hooks
  const { 
    financialData, 
    financialMetrics, 
    totalRevenue, 
    totalExpenses, 
    profitMargin, 
    cashFlow,
    hasFinancialData,
    loading: financialLoading 
  } = useFinancialData();
  
  const { kpis, loading: kpiLoading } = useKPICalculation();
  const { healthScore, loading: healthLoading } = useLiveBusinessHealth();

  // Set header content
  useEffect(() => {
    const displayName = profile?.display_name || profile?.first_name || 'Entrepreneur';
    setHeaderContent('Business Command Center', `Ready to execute, ${displayName}`);
    
    return () => setHeaderContent(null, null);
  }, [profile]);

  // Use real Next Best Actions hook
  const { actions: nextBestActions, loading: actionsLoading, executeAction, delegateAction } = useNextBestActions();

  // Generate real role command centers based on actual data
  const roleCommandCenters: RoleCommandCenter[] = [
    {
      id: 'sales',
      name: 'Sales Command Center',
      description: 'Revenue generation and pipeline management',
      icon: <TrendingUp className="w-6 h-6" />,
      status: hasFinancialData && totalRevenue > 0 ? 'active' : 'attention',
      metrics: {
        primary: hasFinancialData ? `$${(totalRevenue / 1000).toFixed(0)}K` : '$0',
        secondary: 'Monthly Revenue',
        trend: hasFinancialData && totalRevenue > 0 ? 'up' : 'stable'
      },
      quickActions: [
        {
          id: 'sales-1',
          title: 'Add New Lead',
          description: 'Quick lead entry',
          action: () => console.log('Add lead')
        },
        {
          id: 'sales-2',
          title: 'Pipeline Review',
          description: 'Deal analysis',
          action: () => console.log('Review pipeline')
        }
      ]
    },
    {
      id: 'marketing',
      name: 'Marketing Command Center',
      description: 'Lead generation and brand awareness',
      icon: <Globe className="w-6 h-6" />,
      status: dashboardData?.integrations?.some((i: any) => i.type === 'marketing') ? 'active' : 'attention',
      metrics: {
        primary: dashboardData?.integrations?.filter((i: any) => i.type === 'marketing').length?.toString() || '0',
        secondary: 'Active Marketing Tools',
        trend: dashboardData?.integrations?.some((i: any) => i.type === 'marketing') ? 'up' : 'stable'
      },
      quickActions: [
        {
          id: 'marketing-1',
          title: 'Create Campaign',
          description: 'Launch new campaign',
          action: () => console.log('Create campaign')
        },
        {
          id: 'marketing-2',
          title: 'Analytics Review',
          description: 'Performance insights',
          action: () => console.log('Review analytics')
        }
      ]
    },
    {
      id: 'ops',
      name: 'Operations Command Center',
      description: 'Process optimization and efficiency',
      icon: <Settings className="w-6 h-6" />,
      status: healthScore?.overall ? (healthScore.overall > 80 ? 'optimal' : healthScore.overall > 60 ? 'active' : 'attention') : 'attention',
      metrics: {
        primary: healthScore?.overall ? `${healthScore.overall}%` : 'N/A',
        secondary: 'Business Health Score',
        trend: healthScore?.overall ? (healthScore.overall > 80 ? 'up' : healthScore.overall > 60 ? 'stable' : 'down') : 'stable'
      },
      quickActions: [
        {
          id: 'ops-1',
          title: 'Process Review',
          description: 'Optimize workflows',
          action: () => console.log('Review processes')
        },
        {
          id: 'ops-2',
          title: 'Team Status',
          description: 'Resource allocation',
          action: () => console.log('Check team status')
        }
      ]
    },
    {
      id: 'finance',
      name: 'Finance Command Center',
      description: 'Financial health and cash flow',
      icon: <DollarSign className="w-6 h-6" />,
      status: hasFinancialData ? (profitMargin > 20 ? 'optimal' : profitMargin > 10 ? 'active' : 'attention') : 'attention',
      metrics: {
        primary: hasFinancialData ? `$${(totalRevenue / 1000).toFixed(0)}K` : '$0',
        secondary: 'Monthly Revenue',
        trend: hasFinancialData && totalRevenue > 0 ? 'up' : 'stable'
      },
      quickActions: [
        {
          id: 'finance-1',
          title: 'Cash Flow Review',
          description: 'Financial health check',
          action: () => console.log('Review cash flow')
        },
        {
          id: 'finance-2',
          title: 'Expense Analysis',
          description: 'Cost optimization',
          action: () => console.log('Analyze expenses')
        }
      ]
    }
  ];

  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50 dark:bg-red-950';
      case 'high': return 'text-orange-600 bg-orange-50 dark:bg-orange-950';
      case 'medium': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950';
      case 'low': return 'text-green-600 bg-green-50 dark:bg-green-950';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-950';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'optimal': return 'text-green-600 bg-green-50 dark:bg-green-950';
      case 'attention': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950';
      case 'active': return 'text-blue-600 bg-blue-50 dark:bg-blue-950';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-950';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down': return <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />;
      case 'stable': return <Activity className="w-4 h-4 text-blue-600" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  if (loading || financialLoading || kpiLoading || healthLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 mx-auto text-destructive" />
          <h2 className="text-xl font-semibold">Failed to load dashboard</h2>
          <p className="text-muted-foreground">{error}</p>
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
                Business Command Center
              </h1>
              <p className="text-muted-foreground">
                Execute your vision without mastering every skill
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
      <div className="container mx-auto px-6 py-6 space-y-6">
        
        {/* Real Business Metrics Summary */}
        {(hasFinancialData || healthScore?.overall) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Business Metrics Summary
              </CardTitle>
              <CardDescription>
                Your key business performance indicators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {hasFinancialData && (
                  <>
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                          <p className="text-2xl font-bold">${totalRevenue.toLocaleString()}</p>
                        </div>
                        <DollarSign className="w-8 h-8 text-green-600" />
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Profit Margin</p>
                          <p className="text-2xl font-bold">{profitMargin.toFixed(1)}%</p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-blue-600" />
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Cash Flow</p>
                          <p className="text-2xl font-bold">${cashFlow.toLocaleString()}</p>
                        </div>
                        <Activity className="w-8 h-8 text-purple-600" />
                      </div>
                    </div>
                  </>
                )}
                {healthScore?.overall && (
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Business Health</p>
                        <p className="text-2xl font-bold">{healthScore.overall}%</p>
                      </div>
                      <Shield className="w-8 h-8 text-orange-600" />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Next Best Actions - Clarity First */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Next Best Actions
                </CardTitle>
                <CardDescription>
                  AI-powered recommendations to move your business forward
                </CardDescription>
              </div>
              <Badge variant="outline" className="bg-primary/10 text-primary">
                {nextBestActions.length} Actions
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {nextBestActions.map((action) => (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{action.title}</h3>
                      <Badge className={getPriorityColor(action.priority)}>
                        {action.priority}
                      </Badge>
                      {action.aiAssisted && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                          <Brain className="w-3 h-3 mr-1" />
                          AI Assisted
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {action.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {action.estimatedTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        {action.impact}
                      </span>
                    </div>
                  </div>
                                     <div className="flex items-center gap-2">
                     {action.canDelegate && (
                       <Button 
                         variant="outline" 
                         size="sm"
                         onClick={() => delegateAction(action.id, 'ai-sales-expert')}
                       >
                         <Users className="w-3 h-3 mr-1" />
                         Delegate
                       </Button>
                     )}
                     <Button 
                       onClick={() => executeAction(action.id)} 
                       size="sm"
                       disabled={actionsLoading}
                     >
                       <Play className="w-3 h-3 mr-1" />
                       Execute
                     </Button>
                   </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Role Command Centers - Role-Centric Structure */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roleCommandCenters.map((role) => (
            <Card 
              key={role.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedRole === role.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedRole(selectedRole === role.id ? null : role.id)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      {role.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{role.name}</CardTitle>
                      <CardDescription>{role.description}</CardDescription>
                    </div>
                  </div>
                  <Badge className={getStatusColor(role.status)}>
                    {role.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Metrics */}
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-2xl font-bold">{role.metrics.primary}</p>
                      <p className="text-sm text-muted-foreground">{role.metrics.secondary}</p>
                    </div>
                    {getTrendIcon(role.metrics.trend)}
                  </div>

                  {/* Quick Actions */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Quick Actions</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {role.quickActions.map((quickAction) => (
                        <Button
                          key={quickAction.id}
                          variant="outline"
                          size="sm"
                          className="justify-start"
                          onClick={(e) => {
                            e.stopPropagation();
                            quickAction.action();
                          }}
                        >
                          <Plus className="w-3 h-3 mr-2" />
                          {quickAction.title}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Expand to full command center */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Navigate to full command center
                      console.log(`Navigate to ${role.id} command center`);
                    }}
                  >
                    <ArrowRight className="w-3 h-3 mr-1" />
                    Open Full Command Center
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

                 {/* Unified Business Brain - Central Intelligence System */}
         <Card>
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <Brain className="w-5 h-5" />
               Unified Business Brain
             </CardTitle>
             <CardDescription>
               Your 24/7 business intelligence system
             </CardDescription>
           </CardHeader>
           <CardContent>
             <UnifiedBusinessBrain compact={true} />
           </CardContent>
         </Card>

         {/* Business Health Overview */}
         <Card>
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <Activity className="w-5 h-5" />
               Business Health Overview
             </CardTitle>
             <CardDescription>
               Your business performance at a glance
             </CardDescription>
           </CardHeader>
           <CardContent>
             <DigestibleMetricsDashboard />
           </CardContent>
         </Card>

         {/* Wow Moments - Immediate Value Creation */}
         <Card>
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <Star className="w-5 h-5" />
               Wow Moments
             </CardTitle>
             <CardDescription>
               Real-time insights that create immediate value
             </CardDescription>
           </CardHeader>
           <CardContent>
             <WowMomentOrchestrator />
           </CardContent>
         </Card>

         {/* Progressive Intelligence - Integrated Intelligence */}
         <Card>
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <Brain className="w-5 h-5" />
               AI Business Intelligence
             </CardTitle>
             <CardDescription>
               Contextual insights and automation opportunities
             </CardDescription>
           </CardHeader>
           <CardContent>
             <ProgressiveIntelligence 
               pageId="mvp-dashboard"
               position="inline"
               maxInsights={3}
               maxActions={2}
               showAutomations={true}
               compact={true}
             />
           </CardContent>
         </Card>

         {/* Business Learning Interface - Teach Nexus */}
         <Card>
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <BookOpen className="w-5 h-5" />
               Business Learning Interface
             </CardTitle>
             <CardDescription>
               Teach Nexus about your business and manage thoughts & initiatives
             </CardDescription>
           </CardHeader>
           <CardContent>
             <BusinessLearningInterface />
           </CardContent>
         </Card>

        {/* Quick Access Tools - Integrated Intelligence */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Quick Access Tools
            </CardTitle>
            <CardDescription>
              All your business tools in one place
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button 
                variant="outline" 
                className="h-20 flex flex-col"
                onClick={() => window.location.href = '/chat'}
              >
                <MessageSquare className="w-5 h-5 mb-1" />
                <span className="text-xs">Chat</span>
                {dashboardData?.integrations?.some((i: any) => i.type === 'chat') && (
                  <Badge variant="outline" className="text-xs mt-1">Connected</Badge>
                )}
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col"
                onClick={() => window.location.href = '/documents'}
              >
                <FileText className="w-5 h-5 mb-1" />
                <span className="text-xs">Documents</span>
                {dashboardData?.integrations?.some((i: any) => i.type === 'document') && (
                  <Badge variant="outline" className="text-xs mt-1">Connected</Badge>
                )}
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col"
                onClick={() => window.location.href = '/analytics'}
              >
                <PieChart className="w-5 h-5 mb-1" />
                <span className="text-xs">Analytics</span>
                {dashboardData?.integrations?.some((i: any) => i.type === 'analytics') && (
                  <Badge variant="outline" className="text-xs mt-1">Connected</Badge>
                )}
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col"
                onClick={() => window.location.href = '/calendar'}
              >
                <Calendar className="w-5 h-5 mb-1" />
                <span className="text-xs">Calendar</span>
                {dashboardData?.integrations?.some((i: any) => i.type === 'calendar') && (
                  <Badge variant="outline" className="text-xs mt-1">Connected</Badge>
                )}
              </Button>
            </div>
            
            {/* Integration Status Summary */}
            {dashboardData?.integrations && dashboardData.integrations.length > 0 && (
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Active Integrations:</span>
                  <span className="font-medium">{dashboardData.metrics.activeIntegrations} / {dashboardData.metrics.totalIntegrations}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {dashboardData.integrations.slice(0, 5).map((integration: any, index: number) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {integration.name || integration.type}
                    </Badge>
                  ))}
                  {dashboardData.integrations.length > 5 && (
                    <Badge variant="outline" className="text-xs">
                      +{dashboardData.integrations.length - 5} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MVPDashboard;
