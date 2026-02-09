import React, { useState } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert';
import {
  BarChart3,
  Brain,
  Target,
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  Lightbulb,
  CheckCircle2,
  ArrowRight,
  Download,
  RefreshCw,
  HelpCircle,
  Globe,
  Zap,
  Megaphone,
  LifeBuoy,
  Gauge,
  Settings,
  AlertCircle,
  GraduationCap
} from 'lucide-react';
import UnifiedAnalyticsDashboard from '@/components/analytics/UnifiedAnalyticsDashboard';
import CrossPlatformInsightsEngine from '@/components/analytics/CrossPlatformInsightsEngine';
import DigestibleMetricsDashboard from '@/components/analytics/DigestibleMetricsDashboard';
import AnalyticsOnboardingDashboard from '@/components/analytics/AnalyticsOnboardingDashboard';
// import { useData } from '@/shared/contexts/DataContext';

/**
 * @name UnifiedAnalyticsPage
 * @description Comprehensive cross-platform analytics page that presents business data in a digestible, actionable format
 * @returns {JSX.Element} The rendered UnifiedAnalyticsPage component.
 * Pillar: 2 - Business Workflow Intelligence
 */

interface AnalyticsOverview {
  totalDataSources: number;
  activeIntegrations: number;
  crossPlatformInsights: number;
  actionableRecommendations: number;
  dataFreshness: 'real-time' | 'recent' | 'stale';
  overallHealthScore: number;
}

const UnifiedAnalyticsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();

  // Extract department from URL path or search params
  const getDepartmentFromPath = () => {
    const path = location.pathname;
    if (path.includes('/marketing/analytics')) return 'marketing';
    if (path.includes('/support/analytics')) return 'support';
    if (path.includes('/maturity/analytics')) return 'maturity';
    if (path.includes('/operations/analytics')) return 'operations';
    return searchParams.get('department') || 'all';
  };

  const department = getDepartmentFromPath();
  const [selectedView, setSelectedView] = useState<'overview' | 'digestible' | 'technical' | 'insights'>('digestible');
  // Mock data since DataContext is not available
  const businessData = {};
  const systemStatus = { status: 'healthy' };
  const loading = false;
  const refreshAll = () => { };
  const businessHealth = { score: 92, trend: 'up', summary: 'Operations are running smoothly' };
  const aiInsights: any[] = [];
  const integrationStatus: any[] = [];
  const refresh = () => refreshAll();

  // ... (rest of component)

  <CardContent className="flex-1 flex flex-col justify-between">
    <div className="mb-4">
      <div className="text-4xl font-bold flex items-center gap-2">
        {loading ? '...' : businessHealth.score}
        <span className={`text-base font-medium ${businessHealth.trend === 'up' ? 'text-success' : businessHealth.trend === 'down' ? 'text-destructive' : 'text-muted-foreground'}`}>({businessHealth.trend})</span>
      </div>
      <div className="text-sm text-muted-foreground mt-2">
        {businessHealth.summary}
      </div>
    </div>
    <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
      <RefreshCw className="w-4 h-4 mr-2" /> Refresh
    </Button>
  </CardContent>
  const analyticsOverview: AnalyticsOverview = {
    totalDataSources: 8,
    activeIntegrations: 7,
    crossPlatformInsights: 12,
    actionableRecommendations: 6,
    dataFreshness: 'real-time',
    overallHealthScore: 87
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getHealthScoreBg = (score: number) => {
    if (score >= 80) return 'bg-success/10';
    if (score >= 60) return 'bg-warning/10';
    return 'bg-destructive/10';
  };

  const getFreshnessColor = (freshness: string) => {
    switch (freshness) {
      case 'real-time': return 'text-success border-success bg-success/10';
      case 'recent': return 'text-warning border-warning bg-warning/10';
      case 'stale': return 'text-destructive border-destructive bg-destructive/10';
      default: return 'text-muted-foreground border-muted bg-muted/10';
    }
  };

  // Department-specific configurations
  const departmentConfigs = {
    marketing: {
      icon: Megaphone,
      title: 'Marketing Analytics',
      description: 'Insights into campaign performance, reach and conversions',
      color: 'text-pink-500',
      quickActions: [
        { label: 'View Campaigns', href: '/marketing/campaigns' },
        { label: 'Campaign Performance', href: '/marketing/performance' },
        { label: 'Ask AI for Marketing Insight', href: '/ai-hub' }
      ]
    },
    support: {
      icon: LifeBuoy,
      title: 'Support Analytics',
      description: 'Monitor resolution time, CSAT, and ticket trends',
      color: 'text-primary',
      quickActions: [
        { label: 'View Tickets', href: '/support/tickets' },
        { label: 'Resolution Metrics', href: '/support/metrics' },
        { label: 'Ask AI for Support Insight', href: '/ai-hub' }
      ]
    },
    maturity: {
      icon: Gauge,
      title: 'Maturity Analytics',
      description: 'Assess process standardisation, documentation and organisational strength',
      color: 'text-secondary',
      quickActions: [
        { label: 'View Processes', href: '/maturity/processes' },
        { label: 'Maturity Assessment', href: '/maturity/assessment' },
        { label: 'Ask AI for Maturity Insight', href: '/ai-hub' }
      ]
    },
    operations: {
      icon: Settings,
      title: 'Operations Analytics',
      description: 'Track performance, usage, and growth metrics',
      color: 'text-success',
      quickActions: [
        { label: 'View Operations', href: '/operations' },
        { label: 'Performance Metrics', href: '/operations/metrics' },
        { label: 'Ask AI for Operations Insight', href: '/ai-hub' }
      ]
    },
    all: {
      icon: BarChart3,
      title: 'Business Analytics',
      description: 'Cross-platform insights from all your connected business tools',
      color: 'text-primary',
      quickActions: [
        { label: 'View All Departments', href: '/departments' },
        { label: 'Executive Dashboard', href: '/dashboard' },
        { label: 'Ask AI for Business Insight', href: '/ai-hub' }
      ]
    }
  };

  const currentConfig = departmentConfigs[department as keyof typeof departmentConfigs] || departmentConfigs.all;
  const IconComponent = currentConfig.icon;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <IconComponent className={`w-8 h-8 ${currentConfig.color}`} />
            {currentConfig.title}
          </h1>
          <p className="text-muted-foreground">
            {currentConfig.description}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm">
            <HelpCircle className="w-4 h-4 mr-2" />
            Analytics Guide
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh All
          </Button>
        </div>
      </div>

      {/* Analytics Health Status */}
      <Alert className={`border-l-4 ${getFreshnessColor(analyticsOverview.dataFreshness)}`}>
        <Activity className="w-4 h-4" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <span>
                <strong>{analyticsOverview.activeIntegrations}/{analyticsOverview.totalDataSources}</strong> data sources active
              </span>
              <span>
                <strong>{analyticsOverview.crossPlatformInsights}</strong> cross-platform insights generated
              </span>
              <span>
                <strong>{analyticsOverview.actionableRecommendations}</strong> actionable recommendations
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className={getFreshnessColor(analyticsOverview.dataFreshness)}>
                {analyticsOverview.dataFreshness} data
              </Badge>
              <div className={`px-4 py-1 rounded-lg ${getHealthScoreBg(analyticsOverview.overallHealthScore)}`}>
                <span className={`font-bold ${getHealthScoreColor(analyticsOverview.overallHealthScore)}`}>
                  {analyticsOverview.overallHealthScore}% health
                </span>
              </div>
            </div>
          </div>
        </AlertDescription>
      </Alert>

      {/* Department-Specific System Cards */}
      {department !== 'all' && (
        <div className="grid gap-6 md: grid-cols-2 xl:grid-cols-4 mb-8">
          {/* System Health Card */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                System Health
              </CardTitle>
              <CardDescription>Business health score and trend</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <div className="mb-4">
                <div className="text-4xl font-bold flex items-center gap-2">
                  {loading ? '...' : businessHealth.score}
                  <span className={`text-base font-medium ${businessHealth.trend === 'up' ? 'text-success' : businessHealth.trend === 'down' ? 'text-destructive' : 'text-muted-foreground'}`}>({businessHealth.trend})</span>
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  {businessHealth.summary}
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
                <RefreshCw className="w-4 h-4 mr-2" /> Refresh
              </Button>
            </CardContent>
          </Card>

          {/* AI Opportunities Card */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-warning" />
                AI Opportunities
              </CardTitle>
              <CardDescription>AI-generated insights and recommendations</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <div className="space-y-2 mb-4">
                {loading ? (
                  <div className="text-muted-foreground">Loading...</div>
                ) : aiInsights.length === 0 ? (
                  <div className="text-muted-foreground">No insights available</div>
                ) : (
                  aiInsights.slice(0, 3).map((insight) => (
                    <div key={insight.id} className={`p-2 rounded border-l-4 shadow-sm ${insight.impact === 'high' ? 'border-destructive bg-destructive/20' :
                      insight.impact === 'medium' ? 'border-warning bg-warning/20' :
                        'border-muted bg-muted/30'
                      }`}>
                      <div className="font-semibold flex items-center gap-2">
                        {insight.type === 'opportunity' && <Zap className="w-4 h-4 text-success" />}
                        {insight.type === 'alert' && <AlertCircle className="w-4 h-4 text-destructive" />}
                        {insight.type === 'trend' && <TrendingUp className="w-4 h-4 text-primary" />}
                        {insight.type === 'optimization' && <Lightbulb className="w-4 h-4 text-warning" />}
                        {insight.title}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 opacity-95">{insight.description}</div>
                    </div>
                  ))
                )}
              </div>
              <Button variant="outline" size="sm" onClick={() => window.location.href = '/ai-hub'}>
                <Brain className="w-4 h-4 mr-2" /> Explore AI Hub
              </Button>
            </CardContent>
          </Card>

          {/* Integrations Status Card */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-primary" />
                Integrations
              </CardTitle>
              <CardDescription>Status of connected services</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <div className="space-y-2 mb-4">
                {loading ? (
                  <div className="text-muted-foreground">Loading...</div>
                ) : integrationStatus.length === 0 ? (
                  <div className="text-muted-foreground">No integrations connected</div>
                ) : (
                  integrationStatus.slice(0, 3).map((integration) => (
                    <div key={integration.id} className="flex items-center gap-2 p-2 rounded border border-border">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      <span className="font-medium">{integration.name}</span>
                      <span className="text-xs ml-auto px-2 py-0.5 rounded bg-success/10 text-success border-success/20">
                        {integration.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
              <Button variant="outline" size="sm" onClick={() => window.location.href = '/integrations'}>
                <RefreshCw className="w-4 h-4 mr-2" /> Manage Integrations
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-success" />
                Quick Actions
              </CardTitle>
              <CardDescription>Jump to key workflows</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <div className="space-y-2 mb-4">
                {currentConfig.quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    onClick={() => window.location.href = action.href}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Key Benefits Banner */}
      <div className="grid grid-cols-1 md: grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <Brain className="w-8 h-8 text-primary" />
              <div>
                <h3 className="font-semibold">AI-Powered Insights</h3>
                <p className="text-sm text-muted-foreground">Automatic correlation discovery</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-success bg-success/5">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <Target className="w-8 h-8 text-success" />
              <div>
                <h3 className="font-semibold">Actionable Intelligence</h3>
                <p className="text-sm text-muted-foreground">Clear next steps provided</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-warning bg-warning/5">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <Globe className="w-8 h-8 text-warning" />
              <div>
                <h3 className="font-semibold">Cross-Platform View</h3>
                <p className="text-sm text-muted-foreground">All data sources unified</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-secondary bg-secondary/5">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <Zap className="w-8 h-8 text-secondary" />
              <div>
                <h3 className="font-semibold">Real-Time Updates</h3>
                <p className="text-sm text-muted-foreground">Live business intelligence</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Choose Your Analytics View</CardTitle>
          <CardDescription>
            Select the format that best fits your needs - from executive summaries to detailed technical analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              variant={selectedView === 'digestible' ? 'default' : 'outline'}
              onClick={() => setSelectedView('digestible')}
              className="h-auto p-4 flex flex-col items-start space-y-2"
            >
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span className="font-semibold">Business Dashboard</span>
              </div>
              <p className="text-xs text-left opacity-75">
                Plain English metrics with clear context and next steps
              </p>
            </Button>

            <Button
              variant={selectedView === 'insights' ? 'default' : 'outline'}
              onClick={() => setSelectedView('insights')}
              className="h-auto p-4 flex flex-col items-start space-y-2"
            >
              <div className="flex items-center space-x-2">
                <Brain className="w-5 h-5" />
                <span className="font-semibold">AI Insights</span>
              </div>
              <p className="text-xs text-left opacity-75">
                Cross-platform correlations and predictive analytics
              </p>
            </Button>

            <Button
              variant={selectedView === 'technical' ? 'default' : 'outline'}
              onClick={() => setSelectedView('technical')}
              className="h-auto p-4 flex flex-col items-start space-y-2"
            >
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5" />
                <span className="font-semibold">Technical View</span>
              </div>
              <p className="text-xs text-left opacity-75">
                Detailed metrics with confidence intervals and sources
              </p>
            </Button>

            <Button
              variant={selectedView === 'overview' ? 'default' : 'outline'}
              onClick={() => setSelectedView('overview')}
              className="h-auto p-4 flex flex-col items-start space-y-2"
            >
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5" />
                <span className="font-semibold">Executive Summary</span>
              </div>
              <p className="text-xs text-left opacity-75">
                High-level overview with key business health indicators
              </p>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Content Based on Selected View */}
      <div className="space-y-6">
        {selectedView === 'digestible' && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Business Dashboard</h2>
              <Badge variant="outline">Recommended for most users</Badge>
            </div>
            <DigestibleMetricsDashboard />
          </div>
        )}

        {selectedView === 'insights' && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Brain className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">AI-Powered Cross-Platform Insights</h2>
              <Badge variant="outline">Advanced analytics</Badge>
            </div>
            <CrossPlatformInsightsEngine />
          </div>
        )}

        {selectedView === 'technical' && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Technical Analytics Dashboard</h2>
              <Badge variant="outline">For data analysts</Badge>
            </div>
            <UnifiedAnalyticsDashboard />
          </div>
        )}

        {selectedView === 'overview' && (
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Executive Summary</h2>
              <Badge variant="outline">High-level overview</Badge>
            </div>

            {/* Executive Summary Cards */}
            <div className="grid grid-cols-1 md: grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <DollarSign className="w-5 h-5 mr-2 text-success" />
                    Revenue Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-3xl font-bold text-success">$127.4K</div>
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-success" />
                      <span className="text-sm text-success font-medium">+23.5% vs last month</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Strong revenue growth driven by increased website traffic and customer acquisition.
                    </p>
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      <span className="text-sm">On track to hit $150K target</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="w-5 h-5 mr-2 text-primary" />
                    Customer Growth
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-3xl font-bold text-primary">89</div>
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-success" />
                      <span className="text-sm text-success font-medium">+12.3% new customers</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Steady customer acquisition with improving satisfaction scores.
                    </p>
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      <span className="text-sm">8.7/10 satisfaction score</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-warning" />
                    Operational Health
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-3xl font-bold text-success">99.8%</div>
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-success" />
                      <span className="text-sm text-success font-medium">System uptime</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Excellent operational performance with improved team response times.
                    </p>
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      <span className="text-sm">2.3h avg response time</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Key Insights Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lightbulb className="w-5 h-5 mr-2" />
                  Top Business Insights This Month
                </CardTitle>
                <CardDescription>
                  Key findings from cross-platform data analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border-l-4 border-l-success bg-success/20 rounded-lg shadow-sm">
                    <h4 className="font-semibold text-success mb-2">Revenue-Traffic Correlation Strong</h4>
                    <p className="text-sm text-muted-foreground mb-2 opacity-95">
                      Every 1000 additional website visitors correlates with $2,340 in additional revenue (89% correlation).
                    </p>
                    <Button variant="outline" size="sm">
                      Scale Marketing <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>

                  <div className="p-4 border-l-4 border-l-warning bg-warning/20 rounded-lg shadow-sm">
                    <h4 className="font-semibold text-warning mb-2">Infrastructure Scaling Needed</h4>
                    <p className="text-sm text-muted-foreground mb-2 opacity-95">
                      Current growth rate will exceed infrastructure capacity in ~45 days without scaling.
                    </p>
                    <Button variant="outline" size="sm">
                      Plan Scaling <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>

                  <div className="p-4 border-l-4 border-l-primary bg-primary/5 rounded-lg">
                    <h4 className="font-semibold text-primary mb-2">Automation Opportunity</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      40% of team time spent on automatable tasks. Potential savings: $8,000/month.
                    </p>
                    <Button variant="outline" size="sm">
                      Implement Automation <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Recommended Next Steps</CardTitle>
                <CardDescription>
                  Priority actions based on your current business data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md: grid-cols-2 gap-4">
                  <Button variant="outline" className="h-auto p-4 justify-start">
                    <div className="text-left">
                      <div className="font-semibold">Scale Successful Marketing Channels</div>
                      <div className="text-sm text-muted-foreground">High impact, medium effort • 2-4 weeks</div>
                    </div>
                  </Button>

                  <Button variant="outline" className="h-auto p-4 justify-start">
                    <div className="text-left">
                      <div className="font-semibold">Implement Process Automation</div>
                      <div className="text-sm text-muted-foreground">High impact, low effort • 2-4 weeks</div>
                    </div>
                  </Button>

                  <Button variant="outline" className="h-auto p-4 justify-start">
                    <div className="text-left">
                      <div className="font-semibold">Plan Infrastructure Scaling</div>
                      <div className="text-sm text-muted-foreground">High impact, high effort • 6-8 weeks</div>
                    </div>
                  </Button>

                  <Button variant="outline" className="h-auto p-4 justify-start">
                    <div className="text-left">
                      <div className="font-semibold">Optimize Customer Onboarding</div>
                      <div className="text-sm text-muted-foreground">Medium impact, low effort • 1-2 weeks</div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Help Section */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center">
            <HelpCircle className="w-5 h-5 mr-2" />
            How to Use Your Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md: grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">📊 Business Dashboard</h4>
              <p className="text-muted-foreground">
                Start here for easy-to-understand metrics with clear context about what they mean for your business.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">🧠 AI Insights</h4>
              <p className="text-muted-foreground">
                Discover hidden patterns and correlations between your different data sources with actionable recommendations.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">📈 Technical View</h4>
              <p className="text-muted-foreground">
                Deep dive into detailed metrics with confidence intervals, data sources, and statistical analysis.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Learning Center */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            Analytics Learning Center
          </CardTitle>
          <CardDescription>
            Master your analytics capabilities with interactive tutorials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AnalyticsOnboardingDashboard
            showProgress={true}
            onModuleStart={(moduleId) => {
              // eslint-disable-next-line no-console
              console.log('Started analytics module:', moduleId);
            }}
            onModuleComplete={(moduleId) => {
              // eslint-disable-next-line no-console
              console.log('Completed analytics module:', moduleId);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default UnifiedAnalyticsPage; 
