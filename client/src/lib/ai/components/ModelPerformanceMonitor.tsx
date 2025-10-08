import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Progress } from '@/shared/components/ui/Progress';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { TrendingUp, TrendingDown, DollarSign, Clock, CheckCircle, AlertTriangle, BarChart3, RefreshCw } from 'lucide-react';
import { AIService } from '@/services/ai';

// Define types locally since hybridModelService was removed
interface BudgetStatus {
  currentSpend: number;
  budgetLimit: number;
  utilizationPercent: number;
  isOverBudget: boolean;
  daysRemaining: number;
}

interface ModelPerformance {
  modelName: string;
  successRate: number;
  averageLatency: number;
  costPerRequest: number;
  totalRequests: number;
  trend: 'improving' | 'degrading' | 'stable';
}

interface CostOptimizationSuggestion {
  id: string;
  title: string;
  description: string;
  potentialSavings: number;
  priority: 'high' | 'medium' | 'low';
  implementationEffort: 'low' | 'medium' | 'high';
}

interface ModelPerformanceMonitorProps {
  className?: string;
}

export function ModelPerformanceMonitor({ className = '' }: ModelPerformanceMonitorProps) {
  const [budgetStatus, setBudgetStatus] = useState<BudgetStatus | null>(null);
  const [modelPerformance, setModelPerformance] = useState<ModelPerformance[]>([]);
  const [suggestions, setSuggestions] = useState<CostOptimizationSuggestion[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month'>('month');

  useEffect(() => {
    loadData();
    // Use longer intervals in development to reduce resource usage
    const refreshInterval = process.env.NODE_ENV === 'development' ? 120000 : 30000; // 2min dev, 30s prod
    const interval = setInterval(loadData, refreshInterval);
    return () => clearInterval(interval);
  }, [timeframe]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Mock data since the original service was removed
      // In a real implementation, these would be actual service calls
      const mockBudgetStatus: BudgetStatus = {
        currentSpend: 1250.50,
        budgetLimit: 2000.00,
        utilizationPercent: 0.625,
        isOverBudget: false,
        daysRemaining: 15
      };

      const mockModelPerformance: ModelPerformance[] = [
        {
          modelName: 'GPT-4',
          successRate: 0.98,
          averageLatency: 1200,
          costPerRequest: 0.03,
          totalRequests: 15000,
          trend: 'improving'
        },
        {
          modelName: 'Claude-3',
          successRate: 0.95,
          averageLatency: 800,
          costPerRequest: 0.02,
          totalRequests: 12000,
          trend: 'stable'
        }
      ];

      const mockSuggestions: CostOptimizationSuggestion[] = [
        {
          id: '1',
          title: 'Switch to GPT-3.5 for non-critical tasks',
          description: 'Use GPT-3.5 for routine operations to reduce costs by 60%',
          potentialSavings: 450.00,
          priority: 'high',
          implementationEffort: 'low'
        },
        {
          id: '2',
          title: 'Implement request caching',
          description: 'Cache similar requests to reduce API calls',
          potentialSavings: 200.00,
          priority: 'medium',
          implementationEffort: 'medium'
        }
      ];

      setBudgetStatus(mockBudgetStatus);
      setModelPerformance(mockModelPerformance);
      setSuggestions(mockSuggestions);
      setAnalytics({ timeframe, totalRequests: 27000, averageLatency: 1000 });
    } catch (error) {
      console.error('Error loading performance data: ', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
  const formatLatency = (ms: number) => `${ms.toFixed(0)}ms`;
  const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

  const getBudgetColor = (status: BudgetStatus) => {
    if (status.isOverBudget) return 'destructive';
    if (status.utilizationPercent > 0.8) return 'secondary';
    return 'default';
  };

  const getPerformanceColor = (successRate: number) => {
    if (successRate >= 0.95) return 'text-success';
    if (successRate >= 0.9) return 'text-warning';
    return 'text-destructive';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-success" />;
      case 'degrading':
        return <TrendingDown className="h-4 w-4 text-destructive" />;
      default: return <BarChart3 className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      default: return 'secondary';
    }
  };

  if (loading && !budgetStatus) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        <span>Loading performance data...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Budget Status */}
      {budgetStatus && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Budget Status</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {formatCurrency(budgetStatus.currentSpend)}
                </span>
                <Badge variant={getBudgetColor(budgetStatus)}>
                  {formatPercent(budgetStatus.utilizationPercent)} used
                </Badge>
              </div>
              <Progress 
                value={budgetStatus.utilizationPercent * 100} 
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Remaining: {formatCurrency(budgetStatus.budgetLimit - budgetStatus.currentSpend)}</span>
                <span>Total: {formatCurrency(budgetStatus.budgetLimit)}</span>
              </div>
              {budgetStatus.isOverBudget && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Current spend: {formatCurrency(budgetStatus.currentSpend)}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Overview */}
      <Tabs value={timeframe} onValueChange={(value) => setTimeframe(value as any)}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="day">24 Hours</TabsTrigger>
            <TabsTrigger value="week">7 Days</TabsTrigger>
            <TabsTrigger value="month">30 Days</TabsTrigger>
          </TabsList>
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <TabsContent value={timeframe} className="space-y-4">
          {analytics && (
            <div className="grid gap-4 md: grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalRequests}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(analytics.totalCost)}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatLatency(analytics.averageLatency)}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatPercent(analytics.successRate)}</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Model Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle>Model Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {modelPerformance.map((model) => (
                  <div key={model.modelName} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div>
                        <div className="font-medium">{model.modelName}</div>
                        <div className="text-sm text-muted-foreground">
                          {model.totalRequests} requests
                        </div>
                      </div>
                      {getTrendIcon(model.trend)}
                    </div>
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="text-center">
                        <div className={`font-medium ${getPerformanceColor(model.successRate)}`}>
                          {formatPercent(model.successRate)}
                        </div>
                        <div className="text-muted-foreground">Success</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{formatLatency(model.averageLatency)}</div>
                        <div className="text-muted-foreground">Latency</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{formatCurrency(model.costPerRequest)}</div>
                        <div className="text-muted-foreground">Cost/Req</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Cost Optimization Suggestions */}
          {suggestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Cost Optimization Suggestions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {suggestions.map((suggestion, index) => (
                    <Alert key={index}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium">{suggestion.title}</span>
                              <Badge variant={getPriorityColor(suggestion.priority)}>
                                {suggestion.priority}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {suggestion.description}
                            </p>
                          </div>
                          {suggestion.potentialSavings > 0 && (
                            <div className="text-right">
                              <div className="text-sm font-medium text-success">
                                Save {formatCurrency(suggestion.potentialSavings)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {suggestion.implementationEffort} effort
                              </div>
                            </div>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ModelPerformanceMonitor; 
