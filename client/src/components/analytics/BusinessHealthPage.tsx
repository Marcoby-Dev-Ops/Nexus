import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Progress } from '@/shared/components/ui/Progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert';
import { useAuth } from '@/hooks/index';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  DollarSign, 
  Users, 
  Target,
  RefreshCw,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react';
import { BusinessHealthService } from '@/core/services/BusinessHealthService';

interface BusinessHealthMetric {
  id: string;
  name: string;
  value: number;
  target: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  status: 'excellent' | 'good' | 'warning' | 'critical';
  description: string;
  category: 'revenue' | 'efficiency' | 'growth' | 'risk';
}

interface HealthInsight {
  id: string;
  title: string;
  description: string;
  type: 'positive' | 'warning' | 'critical';
  impact: 'high' | 'medium' | 'low';
  recommendation: string;
  actionItems: string[];
}

const BusinessHealthPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<BusinessHealthMetric[]>([]);
  const [insights, setInsights] = useState<HealthInsight[]>([]);
  const [overallScore, setOverallScore] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'revenue' | 'efficiency' | 'growth' | 'risk'>('all');

  useEffect(() => {
    if (user?.id) {
      loadBusinessHealthData();
    }
  }, [user?.id]);

  const loadBusinessHealthData = async () => {
    try {
      setLoading(true);
      
      // Mock business health data - in real implementation, use BusinessHealthService
      const mockMetrics: BusinessHealthMetric[] = [
        {
          id: 'revenue-growth',
          name: 'Revenue Growth',
          value: 23.5,
          target: 20,
          unit: '%',
          trend: 'up',
          status: 'excellent',
          description: 'Monthly revenue growth rate',
          category: 'revenue'
        },
        {
          id: 'profit-margin',
          name: 'Profit Margin',
          value: 18.2,
          target: 25,
          unit: '%',
          trend: 'up',
          status: 'good',
          description: 'Net profit margin',
          category: 'revenue'
        },
        {
          id: 'customer-retention',
          name: 'Customer Retention',
          value: 87.5,
          target: 90,
          unit: '%',
          trend: 'stable',
          status: 'good',
          description: 'Customer retention rate',
          category: 'growth'
        },
        {
          id: 'operational-efficiency',
          name: 'Operational Efficiency',
          value: 72.8,
          target: 80,
          unit: '%',
          trend: 'up',
          status: 'warning',
          description: 'Overall operational efficiency score',
          category: 'efficiency'
        },
        {
          id: 'cash-flow',
          name: 'Cash Flow',
          value: 45.2,
          target: 50,
          unit: 'days',
          trend: 'down',
          status: 'warning',
          description: 'Days of cash runway',
          category: 'risk'
        }
      ];

      const mockInsights: HealthInsight[] = [
        {
          id: 'revenue-opportunity',
          title: 'Revenue Growth Opportunity',
          description: 'Your revenue is growing above target. Consider investing in scaling operations.',
          type: 'positive',
          impact: 'high',
          recommendation: 'Increase marketing spend and hire additional staff',
          actionItems: [
            'Increase marketing budget by 20%',
            'Hire 2 additional sales representatives',
            'Expand to new markets'
          ]
        },
        {
          id: 'profit-margin-warning',
          title: 'Profit Margin Below Target',
          description: 'Profit margin is below the 25% target. Review cost structure.',
          type: 'warning',
          impact: 'medium',
          recommendation: 'Analyze and optimize operational costs',
          actionItems: [
            'Review vendor contracts and negotiate better rates',
            'Optimize operational processes',
            'Consider price increases for premium services'
          ]
        },
        {
          id: 'cash-flow-risk',
          title: 'Cash Flow Risk',
          description: 'Cash runway is decreasing. Monitor closely and consider funding options.',
          type: 'critical',
          impact: 'high',
          recommendation: 'Implement cash flow management strategies',
          actionItems: [
            'Accelerate invoice collection',
            'Negotiate extended payment terms with suppliers',
            'Consider short-term financing options'
          ]
        }
      ];

      setMetrics(mockMetrics);
      setInsights(mockInsights);
      
      // Calculate overall health score
      const avgScore = mockMetrics.reduce((sum, metric) => {
        const score = (metric.value / metric.target) * 100;
        return sum + Math.min(score, 100);
      }, 0) / mockMetrics.length;
      
      setOverallScore(Math.round(avgScore));
      
    } catch (error) {
      console.error('Error loading business health data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-50 border-green-200';
      case 'good': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'stable': return <Activity className="w-4 h-4 text-blue-600" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'positive': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'critical': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default: return <Activity className="w-5 h-5 text-gray-600" />;
    }
  };

  const filteredMetrics = metrics.filter(metric => 
    selectedCategory === 'all' || metric.category === selectedCategory
  );

  const filteredInsights = insights.filter(insight => 
    selectedCategory === 'all' || 
    (selectedCategory === 'revenue' && insight.title.toLowerCase().includes('revenue')) ||
    (selectedCategory === 'efficiency' && insight.title.toLowerCase().includes('efficiency')) ||
    (selectedCategory === 'growth' && insight.title.toLowerCase().includes('growth')) ||
    (selectedCategory === 'risk' && insight.title.toLowerCase().includes('risk'))
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Business Health</h1>
            <p className="text-muted-foreground">Monitor your business performance and health metrics</p>
          </div>
        </div>
        <div className="grid gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Business Health</h1>
          <p className="text-muted-foreground">Monitor your business performance and health metrics</p>
        </div>
        <Button onClick={loadBusinessHealthData} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Overall Health Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Overall Health Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold">{overallScore}%</div>
            <div className="flex-1">
              <Progress value={overallScore} className="h-3" />
              <p className="text-sm text-muted-foreground mt-2">
                {overallScore >= 80 ? 'Excellent' : overallScore >= 60 ? 'Good' : overallScore >= 40 ? 'Fair' : 'Needs Attention'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="metrics" className="space-y-6">
        <TabsList>
          <TabsTrigger value="metrics">Health Metrics</TabsTrigger>
          <TabsTrigger value="insights">Insights & Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-6">
          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Filter by Category:</span>
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="text-sm border rounded px-2 py-1"
            >
              <option value="all">All Categories</option>
              <option value="revenue">Revenue</option>
              <option value="efficiency">Efficiency</option>
              <option value="growth">Growth</option>
              <option value="risk">Risk</option>
            </select>
          </div>

          {/* Metrics Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredMetrics.map((metric) => (
              <Card key={metric.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{metric.name}</CardTitle>
                    {getTrendIcon(metric.trend)}
                  </div>
                  <Badge variant="outline" className={getStatusColor(metric.status)}>
                    {metric.status}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{metric.value}</span>
                      <span className="text-muted-foreground">{metric.unit}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Target: {metric.target}{metric.unit}</span>
                      <span className={`font-medium ${
                        metric.value >= metric.target ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {Math.round((metric.value / metric.target) * 100)}%
                      </span>
                    </div>
                    <Progress 
                      value={Math.min((metric.value / metric.target) * 100, 100)} 
                      className="h-2" 
                    />
                    <p className="text-sm text-muted-foreground">{metric.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {/* Insights */}
          <div className="space-y-4">
            {filteredInsights.map((insight) => (
              <Alert key={insight.id}>
                <div className="flex items-start gap-3">
                  {getInsightIcon(insight.type)}
                  <div className="flex-1">
                    <AlertDescription>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{insight.title}</h4>
                          <Badge variant="outline" className={
                            insight.impact === 'high' ? 'text-red-600' :
                            insight.impact === 'medium' ? 'text-yellow-600' : 'text-blue-600'
                          }>
                            {insight.impact} impact
                          </Badge>
                        </div>
                        <p className="text-sm">{insight.description}</p>
                        <div className="mt-3">
                          <p className="text-sm font-medium mb-2">Recommendation:</p>
                          <p className="text-sm text-muted-foreground">{insight.recommendation}</p>
                        </div>
                        <div className="mt-3">
                          <p className="text-sm font-medium mb-2">Action Items:</p>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {insight.actionItems.map((item, index) => (
                              <li key={index} className="flex items-center gap-2">
                                <div className="w-1 h-1 bg-current rounded-full"></div>
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BusinessHealthPage;
