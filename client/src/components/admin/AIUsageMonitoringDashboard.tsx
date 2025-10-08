import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Separator } from '@/shared/components/ui/Separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { 
  Activity, 
  AlertTriangle, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Database,
  BarChart3,
  Settings,
  RefreshCw
} from 'lucide-react';
import { aiUsageMonitoringService } from '@/services/admin/AIUsageMonitoringService';
import { useAuth } from '@/hooks/index';
import { LoadingSkeleton } from '@/shared/components/patterns/LoadingStates';
import { SimpleBarChart } from '@/components/dashboard/SimpleBarChart';
import { SimpleLineChart } from '@/components/dashboard/SimpleLineChart';

interface AIUsageStats {
  total_requests: number;
  total_cost_usd: number;
  total_tokens: number;
  success_rate: number;
  avg_response_time_ms: number;
  by_provider: Record<string, any>;
  by_model: Record<string, any>;
  daily_usage: Array<{ date: string; requests: number; cost_usd: number; tokens: number }>;
}

interface AIProviderCredits {
  provider: string;
  current_balance_usd: number;
  total_spent_usd: number;
  api_key_status: string;
  last_updated: string;
}

interface AIUsageAlert {
  id: string;
  alert_type: string;
  provider: string;
  severity: string;
  title: string;
  message: string;
  current_value?: number;
  created_at: string;
  is_active: boolean;
}

interface CostProjections {
  projected_cost_usd: number;
  current_daily_average: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  by_provider: Record<string, { projected_cost: number; current_daily_avg: number }>;
}

export const AIUsageMonitoringDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for monitoring data
  const [usageStats, setUsageStats] = useState<AIUsageStats | null>(null);
  const [providerCredits, setProviderCredits] = useState<AIProviderCredits[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<AIUsageAlert[]>([]);
  const [costProjections, setCostProjections] = useState<CostProjections | null>(null);

  // Filters
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');

  const loadMonitoringData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setError(null);
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      switch (timeRange) {
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
      }

      // Load all monitoring data
      const [statsResult, creditsResult, alertsResult, projectionsResult] = await Promise.all([
        aiUsageMonitoringService.getUsageStats({
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          provider: selectedProvider !== 'all' ? selectedProvider : undefined,
        }),
        aiUsageMonitoringService.getProviderCredits(),
        aiUsageMonitoringService.getActiveAlerts(),
        aiUsageMonitoringService.getCostProjections(30),
      ]);

      if (statsResult.success && statsResult.data) {
        setUsageStats(statsResult.data);
      }

      if (creditsResult.success && creditsResult.data) {
        setProviderCredits(creditsResult.data);
      }

      if (alertsResult.success && alertsResult.data) {
        setActiveAlerts(alertsResult.data);
      }

      if (projectionsResult.success && projectionsResult.data) {
        setCostProjections(projectionsResult.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load monitoring data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, timeRange, selectedProvider]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadMonitoringData();
  }, [loadMonitoringData]);

  const handleAcknowledgeAlert = async (alertId: string) => {
    if (!user?.id) return;

    try {
      await aiUsageMonitoringService.acknowledgeAlert(alertId, user.id);
      // Refresh alerts
      const alertsResult = await aiUsageMonitoringService.getActiveAlerts();
      if (alertsResult.success && alertsResult.data) {
        setActiveAlerts(alertsResult.data);
      }
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    }
  };

  useEffect(() => {
    loadMonitoringData();
  }, [loadMonitoringData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500 text-white';
      case 'expired': return 'bg-red-500 text-white';
      case 'quota_exceeded': return 'bg-orange-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">AI Usage Monitoring</h1>
            <p className="text-muted-foreground">Monitor OpenAI and OpenRouter API usage and costs</p>
          </div>
        </div>
        <LoadingSkeleton className="h-96" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">AI Usage Monitoring</h1>
            <p className="text-muted-foreground">Monitor OpenAI and OpenRouter API usage and costs</p>
          </div>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error Loading Data</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={handleRefresh} disabled={refreshing}>
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI Usage Monitoring</h1>
          <p className="text-muted-foreground">Monitor OpenAI and OpenRouter API usage and costs</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d')}
            className="px-3 py-2 border rounded-md"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="all">All Providers</option>
            <option value="openai">OpenAI</option>
            <option value="openrouter">OpenRouter</option>
            <option value="local">Local</option>
          </select>
          <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(usageStats?.total_requests || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {usageStats?.success_rate ? `${usageStats.success_rate.toFixed(1)}% success rate` : 'No data'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(usageStats?.total_cost_usd || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {costProjections ? `~${formatCurrency(costProjections.projected_cost_usd)} projected monthly` : 'No projection data'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(usageStats?.total_tokens || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {usageStats?.avg_response_time_ms ? `${usageStats.avg_response_time_ms.toFixed(0)}ms avg response` : 'No response time data'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAlerts.length}</div>
            <p className="text-xs text-muted-foreground">
              {activeAlerts.filter(a => a.severity === 'critical').length} critical
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="projections">Projections</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Usage Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Daily Usage</CardTitle>
                <CardDescription>Requests and costs over time</CardDescription>
              </CardHeader>
              <CardContent>
                {usageStats?.daily_usage && usageStats.daily_usage.length > 0 ? (
                  <SimpleLineChart
                    data={usageStats.daily_usage.map(d => ({
                      name: d.date,
                      requests: d.requests,
                      cost: d.cost_usd,
                    }))}
                    keys={['requests', 'cost']}
                    colors={['#3b82f6', '#10b981']}
                  />
                ) : (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    No usage data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Provider Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Provider Distribution</CardTitle>
                <CardDescription>Usage breakdown by provider</CardDescription>
              </CardHeader>
              <CardContent>
                {usageStats?.by_provider && Object.keys(usageStats.by_provider).length > 0 ? (
                  <SimpleBarChart
                    data={Object.entries(usageStats.by_provider).map(([provider, data]) => ({
                      name: provider,
                      requests: data.requests,
                      cost: data.cost_usd,
                    }))}
                  />
                ) : (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    No provider data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="providers" className="space-y-6">
          {/* Provider Credits */}
          <Card>
            <CardHeader>
              <CardTitle>Provider Credits & Status</CardTitle>
              <CardDescription>Current balances and API key status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {providerCredits.map((credit) => (
                  <div key={credit.provider} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold capitalize">{credit.provider}</h3>
                      <Badge className={getStatusColor(credit.api_key_status)}>
                        {credit.api_key_status}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Current Balance:</span>
                        <span className="font-medium">{formatCurrency(credit.current_balance_usd)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Spent:</span>
                        <span className="font-medium">{formatCurrency(credit.total_spent_usd)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Last Updated:</span>
                        <span className="text-sm">
                          {new Date(credit.last_updated).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Model Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Model Performance</CardTitle>
              <CardDescription>Usage and performance by model</CardDescription>
            </CardHeader>
            <CardContent>
              {usageStats?.by_model && Object.keys(usageStats.by_model).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(usageStats.by_model).map(([model, data]) => (
                    <div key={model} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{model}</h4>
                        <p className="text-sm text-muted-foreground">
                          {formatNumber(data.requests)} requests • {formatNumber(data.tokens)} tokens
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(data.cost_usd)}</div>
                        <div className="text-sm text-muted-foreground">
                          ${(data.cost_usd / data.requests * 1000).toFixed(2)}/1K requests
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  No model performance data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Alerts</CardTitle>
              <CardDescription>System alerts and notifications</CardDescription>
            </CardHeader>
            <CardContent>
              {activeAlerts.length > 0 ? (
                <div className="space-y-4">
                  {activeAlerts.map((alert) => (
                    <div key={alert.id} className="flex items-start justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge className={getSeverityColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                          <Badge variant="outline" className="capitalize">
                            {alert.provider}
                          </Badge>
                        </div>
                        <h4 className="font-medium mb-1">{alert.title}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>
                        {alert.current_value !== undefined && (
                          <p className="text-xs text-muted-foreground">
                            Current: {alert.current_value.toFixed(2)}
                            {alert.threshold_value && ` • Threshold: ${alert.threshold_value.toFixed(2)}`}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(alert.created_at).toLocaleString()}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAcknowledgeAlert(alert.id)}
                        disabled={!alert.is_active}
                      >
                        {alert.is_active ? 'Acknowledge' : 'Acknowledged'}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  <div className="text-center">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                    <p>No active alerts</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projections" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cost Projections */}
            <Card>
              <CardHeader>
                <CardTitle>Cost Projections</CardTitle>
                <CardDescription>30-day cost projections based on current usage</CardDescription>
              </CardHeader>
              <CardContent>
                {costProjections ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Projected Monthly Cost:</span>
                      <span className="text-lg font-semibold">
                        {formatCurrency(costProjections.projected_cost_usd)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Daily Average:</span>
                      <span className="font-medium">
                        {formatCurrency(costProjections.current_daily_average)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Trend:</span>
                      <div className="flex items-center space-x-1">
                        {costProjections.trend === 'increasing' ? (
                          <TrendingUp className="w-4 h-4 text-red-500" />
                        ) : costProjections.trend === 'decreasing' ? (
                          <TrendingDown className="w-4 h-4 text-green-500" />
                        ) : (
                          <BarChart3 className="w-4 h-4 text-gray-500" />
                        )}
                        <span className="capitalize">{costProjections.trend}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32 text-muted-foreground">
                    No projection data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Provider Projections */}
            <Card>
              <CardHeader>
                <CardTitle>Provider Projections</CardTitle>
                <CardDescription>Cost projections by provider</CardDescription>
              </CardHeader>
              <CardContent>
                {costProjections?.by_provider && Object.keys(costProjections.by_provider).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(costProjections.by_provider).map(([provider, data]) => (
                      <div key={provider} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-medium capitalize">{provider}</h4>
                          <p className="text-sm text-muted-foreground">
                            Daily: {formatCurrency(data.current_daily_avg)}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {formatCurrency(data.projected_cost)}
                          </div>
                          <div className="text-sm text-muted-foreground">30-day projection</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32 text-muted-foreground">
                    No provider projection data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
