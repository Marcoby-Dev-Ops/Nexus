import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { useAuth } from '@/contexts/AuthContext';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Target,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Lightbulb,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  Globe,
  Mail,
  Settings,
  RefreshCw,
  HelpCircle,
  ExternalLink,
  Play
} from 'lucide-react';

interface DigestibleMetric {
  id: string;
  title: string;
  subtitle: string;
  value: string | number;
  unit?: string;
  trend: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
    period: string;
    isGood: boolean;
  };
  context: {
    whatItMeans: string;
    whyItMatters: string;
    whatToDoNext: string[];
  };
  healthStatus: 'excellent' | 'good' | 'warning' | 'critical';
  category: 'revenue' | 'customers' | 'operations' | 'marketing' | 'team';
  sources: string[];
  lastUpdated: string;
  benchmark?: {
    industry: number;
    yourTarget: number;
    status: 'above' | 'at' | 'below';
  };
}

interface BusinessStory {
  id: string;
  title: string;
  narrative: string;
  keyMetrics: string[];
  insights: string[];
  recommendations: {
    action: string;
    effort: 'low' | 'medium' | 'high';
    impact: 'low' | 'medium' | 'high';
    timeframe: string;
  }[];
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

const DigestibleMetricsDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'revenue' | 'customers' | 'operations' | 'marketing' | 'team'>('all');
  const [selectedView, setSelectedView] = useState<'metrics' | 'stories' | 'actions'>('metrics');
  
  const [metrics, setMetrics] = useState<DigestibleMetric[]>([]);
  const [businessStories, setBusinessStories] = useState<BusinessStory[]>([]);

  useEffect(() => {
    if (user?.id) {
      loadDigestibleData();
    }
  }, [user?.id]);

  const loadDigestibleData = async () => {
    try {
      setLoading(true);
      
      // Generate digestible metrics with business context
      const digestibleMetrics: DigestibleMetric[] = [
        {
          id: 'monthly-revenue',
          title: 'Monthly Revenue',
          subtitle: 'Total income from all sources',
          value: 127450,
          unit: '$',
          trend: {
            direction: 'up',
            percentage: 23.5,
            period: 'vs last month',
            isGood: true
          },
          context: {
            whatItMeans: 'Your business generated $127,450 in revenue this month, which is $24,300 more than last month.',
            whyItMatters: 'Revenue growth indicates business health and validates your market strategy. This 23.5% increase suggests strong demand.',
            whatToDoNext: [
              'Analyze which products/services drove the increase',
              'Invest more in successful revenue channels',
              'Plan for scaling operations to support growth'
            ]
          },
          healthStatus: 'excellent',
          category: 'revenue',
          sources: ['PayPal', 'Stripe', 'QuickBooks'],
          lastUpdated: new Date().toISOString(),
          benchmark: {
            industry: 95000,
            yourTarget: 150000,
            status: 'above'
          }
        },
        {
          id: 'customer-acquisition',
          title: 'New Customers',
          subtitle: 'People who became customers this month',
          value: 89,
          trend: {
            direction: 'up',
            percentage: 12.3,
            period: 'vs last month',
            isGood: true
          },
          context: {
            whatItMeans: 'You gained 89 new customers this month, which is 10 more than last month.',
            whyItMatters: 'Steady customer acquisition means your marketing and sales efforts are working. This growth rate supports sustainable business expansion.',
            whatToDoNext: [
              'Identify your most effective customer acquisition channels',
              'Optimize onboarding process for new customers',
              'Set up referral programs to accelerate growth'
            ]
          },
          healthStatus: 'good',
          category: 'customers',
          sources: ['HubSpot', 'PayPal', 'Google Analytics'],
          lastUpdated: new Date().toISOString(),
          benchmark: {
            industry: 65,
            yourTarget: 100,
            status: 'above'
          }
        },
        {
          id: 'system-reliability',
          title: 'System Uptime',
          subtitle: 'How often your systems are working',
          value: 99.8,
          unit: '%',
          trend: {
            direction: 'up',
            percentage: 0.2,
            period: 'vs last month',
            isGood: true
          },
          context: {
            whatItMeans: 'Your systems were operational 99.8% of the time this month, meaning only 1.4 hours of downtime.',
            whyItMatters: 'High uptime ensures customers can always access your services, protecting revenue and maintaining trust.',
            whatToDoNext: [
              'Identify what caused the remaining 0.2% downtime',
              'Implement redundancy for critical systems',
              'Set up proactive monitoring alerts'
            ]
          },
          healthStatus: 'excellent',
          category: 'operations',
          sources: ['NinjaRMM', 'Cloudflare', 'Marcoby Cloud'],
          lastUpdated: new Date().toISOString(),
          benchmark: {
            industry: 99.5,
            yourTarget: 99.9,
            status: 'above'
          }
        },
        {
          id: 'website-performance',
          title: 'Website Visitors',
          subtitle: 'People visiting your website',
          value: '45.2K',
          trend: {
            direction: 'up',
            percentage: 18.7,
            period: 'vs last month',
            isGood: true
          },
          context: {
            whatItMeans: 'Your website attracted 45,200 visitors this month, an increase of 7,100 from last month.',
            whyItMatters: 'More website traffic typically leads to more customers and revenue. This growth suggests effective marketing.',
            whatToDoNext: [
              'Analyze which marketing channels drove the traffic increase',
              'Optimize high-traffic pages for better conversion',
              'Create more content similar to what\'s working'
            ]
          },
          healthStatus: 'excellent',
          category: 'marketing',
          sources: ['Google Analytics', 'Cloudflare'],
          lastUpdated: new Date().toISOString(),
          benchmark: {
            industry: 32000,
            yourTarget: 50000,
            status: 'above'
          }
        },
        {
          id: 'team-productivity',
          title: 'Team Response Time',
          subtitle: 'How quickly your team responds to customers',
          value: '2.3',
          unit: 'hours',
          trend: {
            direction: 'down',
            percentage: 15.2,
            period: 'vs last month',
            isGood: true
          },
          context: {
            whatItMeans: 'Your team now responds to customer inquiries in an average of 2.3 hours, down from 2.7 hours last month.',
            whyItMatters: 'Faster response times improve customer satisfaction and can lead to higher retention and referrals.',
            whatToDoNext: [
              'Recognize team members for improved response times',
              'Document what processes led to the improvement',
              'Set goal to reach under 2 hours average response time'
            ]
          },
          healthStatus: 'good',
          category: 'team',
          sources: ['Microsoft 365', 'HubSpot'],
          lastUpdated: new Date().toISOString(),
          benchmark: {
            industry: 4.2,
            yourTarget: 2.0,
            status: 'above'
          }
        },
        {
          id: 'customer-satisfaction',
          title: 'Customer Happiness',
          subtitle: 'How satisfied your customers are',
          value: 8.7,
          unit: '/10',
          trend: {
            direction: 'up',
            percentage: 5.4,
            period: 'vs last month',
            isGood: true
          },
          context: {
            whatItMeans: 'Customers rate their satisfaction with your service as 8.7 out of 10, up from 8.2 last month.',
            whyItMatters: 'High customer satisfaction leads to repeat business, referrals, and positive reviews that drive growth.',
            whatToDoNext: [
              'Ask top customers what they love most about your service',
              'Address feedback from customers who rated below 7',
              'Create case studies from your happiest customers'
            ]
          },
          healthStatus: 'excellent',
          category: 'customers',
          sources: ['HubSpot', 'Survey Data'],
          lastUpdated: new Date().toISOString(),
          benchmark: {
            industry: 7.8,
            yourTarget: 9.0,
            status: 'above'
          }
        }
      ];

      // Generate business stories that connect the dots
      const stories: BusinessStory[] = [
        {
          id: 'growth-momentum',
          title: 'Strong Growth Momentum Across All Areas',
          narrative: 'Your business is experiencing exceptional growth this month. Revenue is up 23.5%, new customers increased by 12.3%, and website traffic grew by 18.7%. This suggests your marketing efforts are effectively attracting the right customers who are willing to pay for your services.',
          keyMetrics: ['monthly-revenue', 'customer-acquisition', 'website-performance'],
          insights: [
            'Revenue growth is outpacing customer growth, indicating higher customer value',
            'Website traffic increase correlates strongly with customer acquisition',
            'System reliability remains high despite increased demand'
          ],
          recommendations: [
            {
              action: 'Scale successful marketing channels',
              effort: 'medium',
              impact: 'high',
              timeframe: '2-4 weeks'
            },
            {
              action: 'Prepare infrastructure for continued growth',
              effort: 'high',
              impact: 'high',
              timeframe: '4-6 weeks'
            },
            {
              action: 'Document successful processes',
              effort: 'low',
              impact: 'medium',
              timeframe: '1 week'
            }
          ],
          urgency: 'medium'
        },
        {
          id: 'operational-excellence',
          title: 'Operational Excellence Supporting Growth',
          narrative: 'While your business grows rapidly, your operational metrics remain strong. System uptime is at 99.8%, team response times have improved by 15.2%, and customer satisfaction increased to 8.7/10. This operational foundation is enabling sustainable growth.',
          keyMetrics: ['system-reliability', 'team-productivity', 'customer-satisfaction'],
          insights: [
            'Improved team efficiency is driving better customer experiences',
            'High system reliability is protecting revenue during growth phase',
            'Customer satisfaction improvements suggest operational changes are working'
          ],
          recommendations: [
            {
              action: 'Implement team recognition program',
              effort: 'low',
              impact: 'medium',
              timeframe: '1 week'
            },
            {
              action: 'Add redundancy to critical systems',
              effort: 'high',
              impact: 'high',
              timeframe: '6-8 weeks'
            },
            {
              action: 'Create customer feedback loop',
              effort: 'medium',
              impact: 'medium',
              timeframe: '2-3 weeks'
            }
          ],
          urgency: 'low'
        },
        {
          id: 'scaling-readiness',
          title: 'Preparing for Next Growth Phase',
          narrative: 'Your current growth trajectory suggests you\'ll reach your revenue target of $150K within 2-3 months. However, this will require scaling your operations, team, and infrastructure to maintain quality while growing.',
          keyMetrics: ['monthly-revenue', 'system-reliability', 'team-productivity'],
          insights: [
            'Current growth rate will require operational scaling soon',
            'Team efficiency improvements buy time for hiring decisions',
            'Infrastructure is performing well but may need expansion'
          ],
          recommendations: [
            {
              action: 'Plan hiring for key roles',
              effort: 'high',
              impact: 'high',
              timeframe: '4-8 weeks'
            },
            {
              action: 'Automate routine processes',
              effort: 'medium',
              impact: 'high',
              timeframe: '3-5 weeks'
            },
            {
              action: 'Upgrade infrastructure capacity',
              effort: 'high',
              impact: 'high',
              timeframe: '6-10 weeks'
            }
          ],
          urgency: 'high'
        }
      ];

      setMetrics(digestibleMetrics);
      setBusinessStories(stories);
      
    } catch (error) {
      console.error('Error loading digestible data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-success border-success bg-success/10';
      case 'good': return 'text-primary border-primary bg-primary/10';
      case 'warning': return 'text-warning border-warning bg-warning/10';
      case 'critical': return 'text-destructive border-destructive bg-destructive/10';
      default: return 'text-muted-foreground border-muted bg-muted/10';
    }
  };

  const getTrendColor = (trend: any) => {
    if (trend.isGood) {
      return trend.direction === 'up' ? 'text-success' : 'text-success';
    } else {
      return trend.direction === 'up' ? 'text-destructive' : 'text-destructive';
    }
  };

  const getTrendIcon = (trend: any) => {
    const color = getTrendColor(trend);
    if (trend.direction === 'up') {
      return <TrendingUp className={`w-4 h-4 ${color}`} />;
    } else if (trend.direction === 'down') {
      return <TrendingDown className={`w-4 h-4 ${color}`} />;
    } else {
      return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'revenue': return <DollarSign className="w-5 h-5 text-success" />;
      case 'customers': return <Users className="w-5 h-5 text-primary" />;
      case 'operations': return <Settings className="w-5 h-5 text-muted-foreground" />;
      case 'marketing': return <Globe className="w-5 h-5 text-warning" />;
      case 'team': return <Mail className="w-5 h-5 text-secondary" />;
      default: return <Activity className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'border-l-destructive bg-destructive/5';
      case 'high': return 'border-l-warning bg-warning/5';
      case 'medium': return 'border-l-primary bg-primary/5';
      case 'low': return 'border-l-success bg-success/5';
      default: return 'border-l-muted bg-muted/5';
    }
  };

  const getEffortImpactBadge = (effort: string, impact: string) => {
    const effortColors = {
      low: 'bg-success/10 text-success',
      medium: 'bg-warning/10 text-warning',
      high: 'bg-destructive/10 text-destructive'
    };
    
    const impactColors = {
      low: 'bg-muted/10 text-muted-foreground',
      medium: 'bg-primary/10 text-primary',
      high: 'bg-success/10 text-success'
    };

    return { effort: effortColors[effort as keyof typeof effortColors], impact: impactColors[impact as keyof typeof impactColors] };
  };

  const filteredMetrics = selectedCategory === 'all' 
    ? metrics 
    : metrics.filter(metric => metric.category === selectedCategory);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading your business insights...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Business Dashboard</h2>
          <p className="text-muted-foreground">Your business metrics in plain English</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <HelpCircle className="w-4 h-4 mr-2" />
            How to Read This
          </Button>
          <Button variant="outline" size="sm" onClick={loadDigestibleData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex items-center space-x-2">
        {(['all', 'revenue', 'customers', 'operations', 'marketing', 'team'] as const).map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category)}
            className="flex items-center space-x-1"
          >
            {category !== 'all' && getCategoryIcon(category)}
            <span>{category === 'all' ? 'All Metrics' : category.charAt(0).toUpperCase() + category.slice(1)}</span>
          </Button>
        ))}
      </div>

      {/* Main Content */}
      <Tabs value={selectedView} onValueChange={(value: any) => setSelectedView(value)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="metrics">Key Metrics</TabsTrigger>
          <TabsTrigger value="stories">Business Stories</TabsTrigger>
          <TabsTrigger value="actions">Action Items</TabsTrigger>
        </TabsList>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredMetrics.map((metric) => (
              <Card key={metric.id} className={`border-l-4 ${getHealthStatusColor(metric.healthStatus).split(' ')[1]} ${getHealthStatusColor(metric.healthStatus).split(' ')[2]}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getCategoryIcon(metric.category)}
                      <div>
                        <CardTitle className="text-lg">{metric.title}</CardTitle>
                        <CardDescription>{metric.subtitle}</CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className={getHealthStatusColor(metric.healthStatus)}>
                      {metric.healthStatus}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Main Value */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-3xl font-bold">
                        {metric.unit === '$' && '$'}{metric.value}{metric.unit && metric.unit !== '$' && metric.unit}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {getTrendIcon(metric.trend)}
                      <span className={`font-medium ${getTrendColor(metric.trend)}`}>
                        {metric.trend.percentage}% {metric.trend.period}
                      </span>
                    </div>
                  </div>

                  {/* Benchmark Progress */}
                  {metric.benchmark && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progress to your target</span>
                        <span className="font-medium">
                          {metric.benchmark.yourTarget}{metric.unit}
                        </span>
                      </div>
                      <Progress 
                        value={Math.min(100, (typeof metric.value === 'number' ? metric.value : parseFloat(metric.value.toString().replace(/[^0-9.]/g, ''))) / metric.benchmark.yourTarget * 100)} 
                        className="h-2"
                      />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Industry avg: {metric.benchmark.industry}{metric.unit}</span>
                        <Badge variant="outline" className={metric.benchmark.status === 'above' ? 'text-success border-success' : 'text-warning border-warning'}>
                          {metric.benchmark.status} average
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* Context */}
                  <div className="space-y-4 pt-3 border-t">
                    <div>
                      <h5 className="font-medium text-sm mb-1">What this means</h5>
                      <p className="text-sm text-muted-foreground">{metric.context.whatItMeans}</p>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-sm mb-1">Why it matters</h5>
                      <p className="text-sm text-muted-foreground">{metric.context.whyItMatters}</p>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-sm mb-1">What to do next</h5>
                      <ul className="space-y-1">
                        {metric.context.whatToDoNext.slice(0, 2).map((action, index) => (
                          <li key={index} className="flex items-start space-x-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="w-3 h-3 mt-0.5 text-primary" />
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                    <span>Sources: {metric.sources.join(', ')}</span>
                    <span>Updated {new Date(metric.lastUpdated).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Stories Tab */}
        <TabsContent value="stories" className="space-y-6">
          <div className="space-y-6">
            {businessStories.map((story) => (
              <Card key={story.id} className={`border-l-4 ${getUrgencyColor(story.urgency)}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">{story.title}</CardTitle>
                    <Badge variant={story.urgency === 'critical' ? 'destructive' : story.urgency === 'high' ? 'destructive' : 'default'}>
                      {story.urgency === 'critical' && <AlertTriangle className="h-4 w-4 mr-2" />}
                      {story.urgency === 'high' && <AlertTriangle className="h-4 w-4 mr-2" />}
                      {story.urgency}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground leading-relaxed">{story.narrative}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium text-sm mb-2">Key Insights</h5>
                      <ul className="space-y-1">
                        {story.insights.map((insight, index) => (
                          <li key={index} className="flex items-start space-x-2 text-sm text-muted-foreground">
                            <Lightbulb className="w-3 h-3 mt-0.5 text-warning" />
                            <span>{insight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-sm mb-2">Related Metrics</h5>
                      <div className="flex flex-wrap gap-1">
                        {story.keyMetrics.map((metricId) => {
                          const metric = metrics.find(m => m.id === metricId);
                          return metric ? (
                            <Badge key={metricId} variant="secondary" className="text-xs">
                              {metric.title}
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-sm mb-2">Recommended Actions</h5>
                    <div className="space-y-2">
                      {story.recommendations.map((rec, index) => {
                        const badges = getEffortImpactBadge(rec.effort, rec.impact);
                        return (
                          <div key={index} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                            <div>
                              <span className="font-medium text-sm">{rec.action}</span>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge variant="outline" className={badges.effort}>
                                  {rec.effort} effort
                                </Badge>
                                <Badge variant="outline" className={badges.impact}>
                                  {rec.impact} impact
                                </Badge>
                                <span className="text-xs text-muted-foreground">{rec.timeframe}</span>
                              </div>
                            </div>
                            <Button variant="outline" size="sm">
                              <Play className="w-3 h-3 mr-1" />
                              Start
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Actions Tab */}
        <TabsContent value="actions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Prioritized Action Items</CardTitle>
              <CardDescription>Based on your current metrics and business stories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {businessStories
                  .flatMap(story => story.recommendations.map(rec => ({ ...rec, storyTitle: story.title, urgency: story.urgency })))
                  .sort((a, b) => {
                    const urgencyOrder = { critical: 4, high: 3, medium: 2, low: 1 };
                    const impactOrder = { high: 3, medium: 2, low: 1 };
                    return (urgencyOrder[b.urgency as keyof typeof urgencyOrder] * impactOrder[b.impact as keyof typeof impactOrder]) - 
                           (urgencyOrder[a.urgency as keyof typeof urgencyOrder] * impactOrder[a.impact as keyof typeof impactOrder]);
                  })
                  .slice(0, 8)
                  .map((action, index) => {
                    const badges = getEffortImpactBadge(action.effort, action.impact);
                    return (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{action.action}</span>
                            <Badge variant="outline" className="text-xs">
                              #{index + 1}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className={badges.effort}>
                              {action.effort} effort
                            </Badge>
                            <Badge variant="outline" className={badges.impact}>
                              {action.impact} impact
                            </Badge>
                            <span className="text-xs text-muted-foreground">{action.timeframe}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">From: {action.storyTitle}</p>
                        </div>
                        <Button variant="outline" size="sm">
                          Take Action
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DigestibleMetricsDashboard; 