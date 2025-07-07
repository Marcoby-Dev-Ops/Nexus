import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  TrendingUp, 
  DollarSign, 
  Star, 
  Activity,
  Brain,
  Target,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ContinuousImprovementDashboard } from '@/components/ai/ContinuousImprovementDashboard';
import { ModelPerformanceMonitor } from '@/components/ai/ModelPerformanceMonitor';
import { aiUsageBillingService } from '@/lib/billing/aiUsageBillingService';
import { continuousImprovementService } from '@/lib/ai/continuousImprovementService';

export const AIPerformancePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('overview');
  const [billingStatus, setBillingStatus] = useState<any>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Set active tab based on URL
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/models')) setActiveTab('models');
    else if (path.includes('/billing')) setActiveTab('billing');
    else if (path.includes('/improvements')) setActiveTab('improvements');
    else setActiveTab('overview');
  }, [location.pathname]);

  useEffect(() => {
    if (user?.id) {
      loadDashboardData();
    }
  }, [user?.id]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [billing, improvement] = await Promise.all([
        aiUsageBillingService.getRealTimeBillingStatus(user?.id || ''),
        continuousImprovementService.getImprovementDashboard('week')
      ]);
      
      setBillingStatus(billing);
      setPerformanceMetrics(improvement);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const basePath = '/ai-performance';
    switch (value) {
      case 'models':
        navigate(`${basePath}/models`);
        break;
      case 'billing':
        navigate(`${basePath}/billing`);
        break;
      case 'improvements':
        navigate(`${basePath}/improvements`);
        break;
      default:
        navigate(basePath);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">AI Performance & Billing</h1>
          <p className="text-muted-foreground mt-2">
            Monitor your AI usage, track improvements, and optimize costs
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadDashboardData}>
            <Activity className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => navigate('/settings/ai-models')}>
            <Brain className="w-4 h-4 mr-2" />
            Model Settings
          </Button>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Health Score</p>
                <p className="text-2xl font-bold text-success">
                  {Math.round((performanceMetrics?.overallHealthScore || 0.85) * 100)}%
                </p>
                <p className="text-xs text-muted-foreground">+5% from last month</p>
              </div>
              <div className="bg-success/10 p-2 rounded-full">
                <CheckCircle className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Spend</p>
                <p className="text-2xl font-bold text-primary">
                  ${billingStatus?.costs?.currentPeriodCost?.toFixed(2) || '0.00'}
                </p>
                <p className="text-xs text-muted-foreground">
                  ${billingStatus?.costs?.projectedMonthlyCost?.toFixed(2) || '0.00'} projected
                </p>
              </div>
              <div className="bg-primary/10 p-2 rounded-full">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Rating</p>
                <p className="text-2xl font-bold text-warning">
                  {performanceMetrics?.userSatisfaction?.averageRating?.toFixed(1) || '4.2'}
                </p>
                <p className="text-xs text-muted-foreground">From 247 responses</p>
              </div>
              <div className="bg-warning/10 p-2 rounded-full">
                <Star className="w-6 h-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Token Usage</p>
                <p className="text-2xl font-bold text-secondary">
                  {billingStatus?.usage?.utilizationPercent?.toFixed(0) || '0'}%
                </p>
                <p className="text-xs text-muted-foreground">
                  {billingStatus?.usage?.tokensRemaining?.toLocaleString() || '0'} remaining
                </p>
              </div>
              <div className="bg-secondary/10 p-2 rounded-full">
                <BarChart3 className="w-6 h-6 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleTabChange('improvements')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-foreground">View Improvements</h3>
                <p className="text-sm text-muted-foreground">3 new recommendations available</p>
              </div>
              <div className="flex items-center">
                <Badge variant="secondary" className="mr-2">New</Badge>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleTabChange('billing')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-foreground">Billing Details</h3>
                <p className="text-sm text-muted-foreground">View usage and optimize costs</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleTabChange('models')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-foreground">Model Analytics</h3>
                <p className="text-sm text-muted-foreground">Performance by AI model</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="models">Model Analytics</TabsTrigger>
          <TabsTrigger value="billing">Usage & Billing</TabsTrigger>
          <TabsTrigger value="improvements">Improvements</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Performance Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Quality Score</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">85%</span>
                      <Badge variant="secondary" className="text-success">+12%</Badge>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Cost Efficiency</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">78%</span>
                      <Badge variant="secondary" className="text-primary">-8%</Badge>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">User Satisfaction</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">4.2/5</span>
                      <Badge variant="secondary" className="text-secondary">+5%</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Top Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-primary/5 rounded-lg">
                    <Sparkles className="w-4 h-4 text-primary mt-1" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900">
                        Switch to Claude-3-Haiku for simple queries
                      </p>
                      <p className="text-xs text-primary">
                        Potential savings: $45/month
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4 p-4 bg-success/5 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-success mt-1" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-900">
                        Enable response caching
                      </p>
                      <p className="text-xs text-success">
                        Reduce latency by 40%
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4 p-4 bg-orange-50 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-warning mt-1" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-orange-900">
                        Review high-cost queries
                      </p>
                      <p className="text-xs text-warning">
                        3 queries exceed budget threshold
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="models">
          <ModelPerformanceMonitor userId={user?.id || ''} />
        </TabsContent>

        <TabsContent value="billing">
          <ContinuousImprovementDashboard userId={user?.id || ''} timeframe="week" />
        </TabsContent>

        <TabsContent value="improvements">
          <ContinuousImprovementDashboard userId={user?.id || ''} timeframe="month" />
        </TabsContent>
      </Tabs>
    </div>
  );
}; 