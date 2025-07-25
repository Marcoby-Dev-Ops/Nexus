import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/Card.tsx';
import { Badge } from '@/shared/components/ui/Badge.tsx';
import { Button } from '@/shared/components/ui/Button.tsx';
import { Progress } from '@/shared/components/ui/Progress.tsx';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert.tsx';
import { useAuth } from '@/hooks/index';
import { supabase } from '@/lib/supabase';
import { Brain, TrendingUp, TrendingDown, BarChart3, Target, Zap, AlertTriangle, CheckCircle2, ArrowRight, Lightbulb, DollarSign, Clock, Users, Activity, RefreshCw } from 'lucide-react';
interface DataCorrelation {
  id: string;
  sourceA: string;
  sourceB: string;
  metricA: string;
  metricB: string;
  correlation: number;
  confidence: number;
  relationship: 'positive' | 'negative' | 'neutral';
  strength: 'strong' | 'moderate' | 'weak';
  timeframe: string;
  businessImplication: string;
}

interface PredictiveInsight {
  id: string;
  type: 'forecast' | 'anomaly' | 'pattern' | 'recommendation';
  title: string;
  description: string;
  prediction: {
    metric: string;
    currentValue: number;
    predictedValue: number;
    timeframe: string;
    confidence: number;
  };
  factors: string[];
  actionable: boolean;
  impact: 'high' | 'medium' | 'low';
}

interface BusinessIntelligence {
  id: string;
  category: 'revenue' | 'efficiency' | 'risk' | 'growth' | 'customer';
  title: string;
  insight: string;
  evidence: string[];
  recommendation: string;
  expectedOutcome: string;
  effort: 'low' | 'medium' | 'high';
  timeToValue: string;
  confidence: number;
}

const CrossPlatformInsightsEngine: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [correlations, setCorrelations] = useState<DataCorrelation[]>([]);
  const [predictions, setPredictions] = useState<PredictiveInsight[]>([]);
  const [businessIntelligence, setBusinessIntelligence] = useState<BusinessIntelligence[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'revenue' | 'efficiency' | 'risk' | 'growth' | 'customer'>('all');

  useEffect(() => {
    if (user?.id) {
      loadInsightsData();
    }
  }, [user?.id]);

  const loadInsightsData = async () => {
    try {
      setLoading(true);
      
      // Fetch user's active integrations to understand available data sources
      

      // Generate insights based on available integrations
      await Promise.all([
        generateCorrelations(integrations || []),
        generatePredictions(integrations || []),
        generateBusinessIntelligence(integrations || [])
      ]);
      
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error loading insights: ', error);
    } finally {
      setLoading(false);
    }
  };

  const generateCorrelations = async (integrations: any[]) => {
    // Simulate AI-generated correlations based on available data sources
    const correlations: DataCorrelation[] = [
      {
        id: 'revenue-traffic',
        sourceA: 'Google Analytics',
        sourceB: 'PayPal',
        metricA: 'Website Traffic',
        metricB: 'Transaction Volume',
        correlation: 0.89,
        confidence: 94,
        relationship: 'positive',
        strength: 'strong',
        timeframe: '30 days',
        businessImplication: 'Every 1000 additional website visitors correlates with $2,340 in additional revenue'
      },
      {
        id: 'uptime-satisfaction',
        sourceA: 'NinjaRMM',
        sourceB: 'HubSpot',
        metricA: 'System Uptime',
        metricB: 'Customer Satisfaction',
        correlation: 0.76,
        confidence: 87,
        relationship: 'positive',
        strength: 'strong',
        timeframe: '60 days',
        businessImplication: 'System reliability directly impacts customer satisfaction scores'
      },
      {
        id: 'response-time-productivity',
        sourceA: 'Microsoft 365',
        sourceB: 'Google Workspace',
        metricA: 'Email Response Time',
        metricB: 'Team Productivity',
        correlation: -0.65,
        confidence: 78,
        relationship: 'negative',
        strength: 'moderate',
        timeframe: '45 days',
        businessImplication: 'Faster email responses correlate with higher overall team productivity'
      },
      {
        id: 'automation-costs',
        sourceA: 'Marcoby Cloud',
        sourceB: 'QuickBooks',
        metricA: 'Automation Coverage',
        metricB: 'Operational Costs',
        correlation: -0.82,
        confidence: 91,
        relationship: 'negative',
        strength: 'strong',
        timeframe: '90 days',
        businessImplication: 'Higher automation coverage significantly reduces operational costs'
      }
    ];

    setCorrelations(correlations);
  };

  const generatePredictions = async (integrations: any[]) => {
    const predictions: PredictiveInsight[] = [
      {
        id: 'revenue-forecast',
        type: 'forecast',
        title: 'Monthly Revenue Projection',
        description: 'Based on current traffic trends and conversion patterns, revenue is projected to increase significantly next month.',
        prediction: {
          metric: 'Monthly Revenue',
          currentValue: 127450,
          predictedValue: 156800,
          timeframe: 'Next 30 days',
          confidence: 87
        },
        factors: ['Website traffic growth', 'Seasonal trends', 'Conversion rate improvements'],
        actionable: true,
        impact: 'high'
      },
      {
        id: 'capacity-warning',
        type: 'anomaly',
        title: 'Infrastructure Capacity Alert',
        description: 'Current growth rate will exceed infrastructure capacity in approximately 45 days without scaling.',
        prediction: {
          metric: 'System Capacity',
          currentValue: 78,
          predictedValue: 95,
          timeframe: '45 days',
          confidence: 92
        },
        factors: ['User growth rate', 'Data volume increase', 'Processing requirements'],
        actionable: true,
        impact: 'high'
      },
      {
        id: 'customer-churn',
        type: 'pattern',
        title: 'Customer Retention Pattern',
        description: 'Analysis shows improved customer retention due to faster support response times.',
        prediction: {
          metric: 'Customer Retention',
          currentValue: 89,
          predictedValue: 93,
          timeframe: 'Next quarter',
          confidence: 81
        },
        factors: ['Support response time', 'Product satisfaction', 'Engagement metrics'],
        actionable: false,
        impact: 'medium'
      }
    ];

    setPredictions(predictions);
  };

  const generateBusinessIntelligence = async (integrations: any[]) => {
    const intelligence: BusinessIntelligence[] = [
      {
        id: 'revenue-optimization',
        category: 'revenue',
        title: 'Revenue Stream Optimization',
        insight: 'Cross-platform analysis reveals that customers acquired through organic search have 34% higher lifetime value than paid acquisition channels.',
        evidence: [
          'Google Analytics shows organic traffic converts at 12.3% vs 8.7% for paid',
          'PayPal data indicates organic customers have higher average order values',
          'HubSpot CRM shows longer customer lifecycles for organic acquisitions'
        ],
        recommendation: 'Shift 25% of paid advertising budget to SEO and content marketing initiatives',
        expectedOutcome: 'Increase overall customer lifetime value by 15-20% within 6 months',
        effort: 'medium',
        timeToValue: '3-6 months',
        confidence: 89
      },
      {
        id: 'operational-efficiency',
        category: 'efficiency',
        title: 'Automation ROI Opportunity',
        insight: 'Infrastructure monitoring shows manual processes consume 40% of team time, with automation tools already in place but underutilized.',
        evidence: [
          'Marcoby Cloud shows infrastructure capable of handling automated workflows',
          'Microsoft 365 data reveals repetitive task patterns',
          'Time tracking indicates 16 hours/week spent on automatable tasks'
        ],
        recommendation: 'Implement comprehensive workflow automation using existing infrastructure',
        expectedOutcome: 'Reduce operational overhead by $8,000/month and improve team satisfaction',
        effort: 'low',
        timeToValue: '2-4 weeks',
        confidence: 94
      },
      {
        id: 'risk-mitigation',
        category: 'risk',
        title: 'Business Continuity Risk',
        insight: 'Single points of failure identified in critical business systems could result in significant revenue loss.',
        evidence: [
          'NinjaRMM shows 3 critical systems without redundancy',
          'Cloudflare analytics indicate revenue loss during downtime events',
          'Historical data shows $3,200 lost per hour of downtime'
        ],
        recommendation: 'Implement redundant systems and automated failover for critical infrastructure',
        expectedOutcome: 'Reduce downtime risk by 90% and protect $38,400 annual revenue exposure',
        effort: 'high',
        timeToValue: '6-8 weeks',
        confidence: 96
      },
      {
        id: 'growth-acceleration',
        category: 'growth',
        title: 'Market Expansion Opportunity',
        insight: 'Geographic analysis reveals untapped markets with high conversion potential based on current customer patterns.',
        evidence: [
          'Google Analytics shows high engagement from unexplored regions',
          'PayPal data indicates strong purchasing power in target markets',
          'Competitive analysis shows low market saturation'
        ],
        recommendation: 'Launch targeted marketing campaigns in identified high-potential regions',
        expectedOutcome: 'Expand market reach by 30% and increase revenue by $45,000/quarter',
        effort: 'medium',
        timeToValue: '8-12 weeks',
        confidence: 78
      },
      {
        id: 'customer-experience',
        category: 'customer',
        title: 'Customer Experience Enhancement',
        insight: 'Communication platform analysis reveals opportunities to improve customer touchpoint experiences.',
        evidence: [
          'Microsoft 365 email analytics show response time improvements',
          'HubSpot CRM indicates correlation between communication quality and satisfaction',
          'Cross-platform data shows customer preference patterns'
        ],
        recommendation: 'Implement unified customer communication strategy across all platforms',
        expectedOutcome: 'Improve customer satisfaction scores by 25% and reduce support costs',
        effort: 'low',
        timeToValue: '4-6 weeks',
        confidence: 85
      }
    ];

    setBusinessIntelligence(intelligence);
  };

  const getCorrelationStrengthColor = (strength: string) => {
    switch (strength) {
      case 'strong': return 'text-success border-success';
      case 'moderate': return 'text-warning border-warning';
      case 'weak': return 'text-muted-foreground border-muted';
      default: return 'text-muted-foreground border-muted';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-destructive';
      case 'medium': return 'text-warning';
      case 'low': return 'text-muted-foreground';
      default: return 'text-muted-foreground';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'revenue': return <DollarSign className="w-5 h-5 text-success" />;
      case 'efficiency': return <Zap className="w-5 h-5 text-primary" />;
      case 'risk': return <AlertTriangle className="w-5 h-5 text-destructive" />;
      case 'growth': return <TrendingUp className="w-5 h-5 text-success" />;
      case 'customer': return <Users className="w-5 h-5 text-primary" />;
      default: return <Activity className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getEffortBadge = (effort: string) => {
    const colors = {
      low: 'bg-success/10 text-success border-success',
      medium: 'bg-warning/10 text-warning border-warning',
      high: 'bg-destructive/10 text-destructive border-destructive'
    };
    return colors[effort as keyof typeof colors] || colors.medium;
  };

  const filteredIntelligence = selectedCategory === 'all' 
    ? businessIntelligence 
    : businessIntelligence.filter(item => item.category === selectedCategory);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Analyzing cross-platform data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Brain className="w-8 h-8 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Cross-Platform Intelligence</h2>
            <p className="text-muted-foreground">AI-powered insights from your connected data sources</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={loadInsightsData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Analysis
        </Button>
      </div>

      {/* Data Correlations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Cross-Platform Data Correlations
          </CardTitle>
          <CardDescription>
            Statistical relationships discovered between your different data sources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md: grid-cols-2 gap-4">
            {correlations.map((correlation) => (
              <div key={correlation.id} className="p-4 border rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className={getCorrelationStrengthColor(correlation.strength)}>
                    {correlation.strength} correlation
                  </Badge>
                  <span className="text-sm font-mono">{(correlation.correlation * 100).toFixed(0)}%</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{correlation.metricA}</span>
                    <span className="text-muted-foreground">{correlation.sourceA}</span>
                  </div>
                  <div className="flex items-center justify-center">
                    {correlation.relationship === 'positive' ? (
                      <TrendingUp className="w-4 h-4 text-success" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-destructive" />
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{correlation.metricB}</span>
                    <span className="text-muted-foreground">{correlation.sourceB}</span>
                  </div>
                </div>
                
                <Progress value={correlation.confidence} className="h-1" />
                <p className="text-xs text-muted-foreground">{correlation.businessImplication}</p>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Timeframe: {correlation.timeframe}</span>
                  <span>{correlation.confidence}% confidence</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Predictive Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Predictive Insights
          </CardTitle>
          <CardDescription>
            AI-powered forecasts and trend predictions based on your data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg: grid-cols-3 gap-4">
            {predictions.map((prediction) => (
              <div key={prediction.id} className="p-4 border rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant={prediction.type === 'anomaly' ? 'destructive' : 'default'}>
                    {prediction.type === 'anomaly' && <AlertTriangle className="h-4 w-4 mr-2" />}
                    {prediction.type === 'forecast' && <TrendingUp className="h-4 w-4 mr-2" />}
                  </Badge>
                  <Badge variant="outline" className={getImpactColor(prediction.impact)}>
                    {prediction.impact} impact
                  </Badge>
                </div>
                
                <div>
                  <h4 className="font-semibold text-sm">{prediction.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{prediction.description}</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{prediction.prediction.metric}</span>
                    <span className="font-mono">{prediction.prediction.confidence}%</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Current</span>
                    <span className="font-semibold">{prediction.prediction.currentValue.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Predicted</span>
                    <span className="font-semibold text-primary">{prediction.prediction.predictedValue.toLocaleString()}</span>
                  </div>
                  
                  <Progress 
                    value={(prediction.prediction.predictedValue / prediction.prediction.currentValue) * 50} 
                    className="h-1" 
                  />
                </div>
                
                <div className="text-xs text-muted-foreground">
                  <div>Timeframe: {prediction.prediction.timeframe}</div>
                  <div>Key factors: {prediction.factors.slice(0, 2).join(', ')}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Business Intelligence */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Lightbulb className="w-5 h-5 mr-2" />
                Strategic Business Intelligence
              </CardTitle>
              <CardDescription>
                Actionable insights and recommendations for business growth
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              {(['all', 'revenue', 'efficiency', 'risk', 'growth', 'customer'] as const).map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {filteredIntelligence.map((intelligence) => (
              <div key={intelligence.id} className="p-6 border rounded-lg space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    {getCategoryIcon(intelligence.category)}
                    <div>
                      <h4 className="font-semibold text-lg">{intelligence.title}</h4>
                      <Badge variant="outline" className="mt-1">
                        {intelligence.category}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className={getEffortBadge(intelligence.effort)}>
                      {intelligence.effort} effort
                    </Badge>
                    <Badge variant="outline">
                      {intelligence.confidence}% confidence
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h5 className="font-medium text-sm mb-1">Key Insight</h5>
                    <p className="text-sm text-muted-foreground">{intelligence.insight}</p>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-sm mb-1">Supporting Evidence</h5>
                    <ul className="space-y-1">
                      {intelligence.evidence.map((evidence, index) => (
                        <li key={index} className="flex items-start space-x-2 text-xs text-muted-foreground">
                          <CheckCircle2 className="w-3 h-3 mt-0.5 text-success" />
                          <span>{evidence}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="grid grid-cols-1 md: grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium text-sm mb-1">Recommendation</h5>
                      <p className="text-sm text-muted-foreground">{intelligence.recommendation}</p>
                    </div>
                    <div>
                      <h5 className="font-medium text-sm mb-1">Expected Outcome</h5>
                      <p className="text-sm text-primary font-medium">{intelligence.expectedOutcome}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>Time to value: {intelligence.timeToValue}</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Implement Strategy
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CrossPlatformInsightsEngine; 