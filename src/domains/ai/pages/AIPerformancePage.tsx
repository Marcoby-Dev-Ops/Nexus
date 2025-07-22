import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { 
  TrendingUp, 
  Activity, 
  Clock, 
  Target, 
  BarChart3,
  PieChart,
  LineChart,
  Zap,
  CheckCircle,
  AlertCircle,
  XCircle,
  Users,
  MessageSquare,
  Download,
  RefreshCw
} from 'lucide-react';
import { ModelPerformanceMonitor } from '@/domains/ai/components/ModelPerformanceMonitor';

interface PerformanceMetrics {
  responseTime: {
    average: number;
    p95: number;
    p99: number;
    trend: 'improving' | 'stable' | 'declining';
  };
  accuracy: {
    overall: number;
    byModel: Record<string, number>;
    trend: 'improving' | 'stable' | 'declining';
  };
  usage: {
    totalRequests: number;
    requestsPerDay: number;
    peakConcurrent: number;
    growthRate: number;
  };
  satisfaction: {
    averageRating: number;
    totalRatings: number;
    positiveFeedback: number;
    negativeFeedback: number;
  };
  cost: {
    totalCost: number;
    costPerRequest: number;
    costSavings: number;
    efficiency: number;
  };
}

interface AgentPerformance {
  id: string;
  name: string;
  type: string;
  requests: number;
  avgResponseTime: number;
  accuracy: number;
  satisfaction: number;
  cost: number;
  status: 'active' | 'idle' | 'error';
}

export default function AIPerformancePage() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [agentPerformance, setAgentPerformance] = useState<AgentPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('week');

  useEffect(() => {
    loadPerformanceData();
  }, [timeRange]);

  const loadPerformanceData = async () => {
    setLoading(true);
    try {
      // Mock performance data
      const mockMetrics: PerformanceMetrics = {
        responseTime: {
          average: 2.3,
          p95: 4.1,
          p99: 6.8,
          trend: 'improving'
        },
        accuracy: {
          overall: 94.2,
          byModel: {
            'gpt-4': 96.1,
            'gpt-3.5-turbo': 92.8,
            'claude-3': 95.3,
            'custom-model': 89.7
          },
          trend: 'improving'
        },
        usage: {
          totalRequests: 15420,
          requestsPerDay: 1250,
          peakConcurrent: 45,
          growthRate: 12.5
        },
        satisfaction: {
          averageRating: 4.3,
          totalRatings: 892,
          positiveFeedback: 756,
          negativeFeedback: 136
        },
        cost: {
          totalCost: 2847.50,
          costPerRequest: 0.18,
          costSavings: 12500,
          efficiency: 78.5
        }
      };

      const mockAgentPerformance: AgentPerformance[] = [
        {
          id: 'executive-assistant',
          name: 'Executive Assistant',
          type: 'executive',
          requests: 3240,
          avgResponseTime: 1.8,
          accuracy: 96.2,
          satisfaction: 4.5,
          cost: 583.20,
          status: 'active'
        },
        {
          id: 'sales-advisor',
          name: 'Sales Advisor',
          type: 'departmental',
          requests: 2150,
          avgResponseTime: 2.1,
          accuracy: 93.8,
          satisfaction: 4.2,
          cost: 387.00,
          status: 'active'
        },
        {
          id: 'hr-specialist',
          name: 'HR Specialist',
          type: 'departmental',
          requests: 1890,
          avgResponseTime: 2.4,
          accuracy: 91.5,
          satisfaction: 4.1,
          cost: 340.20,
          status: 'active'
        },
        {
          id: 'finance-analyst',
          name: 'Finance Analyst',
          type: 'specialist',
          requests: 1560,
          avgResponseTime: 2.8,
          accuracy: 94.7,
          satisfaction: 4.3,
          cost: 280.80,
          status: 'active'
        },
        {
          id: 'marketing-strategist',
          name: 'Marketing Strategist',
          type: 'departmental',
          requests: 1420,
          avgResponseTime: 2.2,
          accuracy: 92.1,
          satisfaction: 4.0,
          cost: 255.60,
          status: 'idle'
        },
        {
          id: 'legal-advisor',
          name: 'Legal Advisor',
          type: 'specialist',
          requests: 890,
          avgResponseTime: 3.1,
          accuracy: 95.8,
          satisfaction: 4.4,
          cost: 160.20,
          status: 'active'
        }
      ];

      setMetrics(mockMetrics);
      setAgentPerformance(mockAgentPerformance);
    } catch (error) {
      console.error('Error loading performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'stable': return <Activity className="w-4 h-4 text-blue-600" />;
      case 'declining': return <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50';
      case 'idle': return 'text-yellow-600 bg-yellow-50';
      case 'error': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'idle': return <Clock className="w-4 h-4" />;
      case 'error': return <XCircle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center space-y-4">
          <AlertCircle className="w-16 h-16 mx-auto text-muted-foreground" />
          <h2 className="text-xl font-semibold">No Performance Data</h2>
          <p className="text-muted-foreground">Performance metrics are not available at this time.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-primary" />
            AI Performance
          </h1>
          <p className="text-muted-foreground mt-2">
            Monitor and analyze AI system performance, accuracy, and efficiency
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadPerformanceData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Time Range:</span>
        <div className="flex border rounded-md">
          {(['day', 'week', 'month'] as const).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTimeRange(range)}
              className="rounded-none first:rounded-l-md last:rounded-r-md"
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.responseTime.average}s</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {getTrendIcon(metrics.responseTime.trend)}
              {metrics.responseTime.trend === 'improving' ? 'Improving' : 
               metrics.responseTime.trend === 'stable' ? 'Stable' : 'Declining'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.accuracy.overall}%</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {getTrendIcon(metrics.accuracy.trend)}
              {metrics.accuracy.trend === 'improving' ? 'Improving' : 
               metrics.accuracy.trend === 'stable' ? 'Stable' : 'Declining'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.usage.totalRequests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{metrics.usage.growthRate}% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Satisfaction</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.satisfaction.averageRating}/5</div>
            <p className="text-xs text-muted-foreground">
              {metrics.satisfaction.totalRatings} ratings
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="agents">Agent Performance</TabsTrigger>
          <TabsTrigger value="models">Model Analytics</TabsTrigger>
          <TabsTrigger value="costs">Cost Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Response Time Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="w-5 h-5" />
                  Response Time Distribution
                </CardTitle>
                <CardDescription>
                  P95 and P99 response times for different AI operations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Average</span>
                    <span className="font-medium">{metrics.responseTime.average}s</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">95th Percentile</span>
                    <span className="font-medium">{metrics.responseTime.p95}s</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">99th Percentile</span>
                    <span className="font-medium">{metrics.responseTime.p99}s</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Model Accuracy */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Model Accuracy
                </CardTitle>
                <CardDescription>
                  Accuracy rates by AI model
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(metrics.accuracy.byModel).map(([model, accuracy]) => (
                    <div key={model} className="flex justify-between items-center">
                      <span className="text-sm capitalize">{model.replace('-', ' ')}</span>
                      <span className="font-medium">{accuracy}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Model Performance Monitor */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Real-time Performance Monitor
              </CardTitle>
              <CardDescription>
                Live monitoring of AI system performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ModelPerformanceMonitor />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Agent Performance</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {agentPerformance.map((agent) => (
                <Card key={agent.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{agent.name}</CardTitle>
                      <Badge className={getStatusColor(agent.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(agent.status)}
                          {agent.status}
                        </div>
                      </Badge>
                    </div>
                    <CardDescription>{agent.type} agent</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Requests</p>
                        <p className="text-lg font-semibold">{agent.requests.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Response Time</p>
                        <p className="text-lg font-semibold">{agent.avgResponseTime}s</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Accuracy</p>
                        <p className="text-lg font-semibold">{agent.accuracy}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Satisfaction</p>
                        <p className="text-lg font-semibold">{agent.satisfaction}/5</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-muted-foreground">Cost</p>
                      <p className="text-lg font-semibold">${agent.cost.toFixed(2)}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="models" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Model Analytics</h2>
            <Card>
              <CardHeader>
                <CardTitle>Model Performance Comparison</CardTitle>
                <CardDescription>
                  Detailed analysis of different AI models
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(metrics.accuracy.byModel).map(([model, accuracy]) => (
                    <div key={model} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium capitalize">{model.replace('-', ' ')}</h3>
                        <p className="text-sm text-muted-foreground">Accuracy: {accuracy}%</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Cost per request</p>
                        <p className="font-medium">$0.{(Math.random() * 0.5 + 0.1).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="costs" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Cost Analysis</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Cost Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Cost</span>
                      <span className="font-medium">${metrics.cost.totalCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cost per Request</span>
                      <span className="font-medium">${metrics.cost.costPerRequest.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cost Savings</span>
                      <span className="font-medium text-green-600">${metrics.cost.costSavings.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Efficiency</span>
                      <span className="font-medium">{metrics.cost.efficiency}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Cost Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Daily Average</span>
                      <span className="font-medium">${(metrics.cost.totalCost / 30).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Monthly Projection</span>
                      <span className="font-medium">${(metrics.cost.totalCost * 1.1).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ROI</span>
                      <span className="font-medium text-green-600">{(metrics.cost.costSavings / metrics.cost.totalCost * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 