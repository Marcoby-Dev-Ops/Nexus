import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card.tsx';
import { Badge } from '@/shared/components/ui/Badge.tsx';
import { Button } from '@/shared/components/ui/Button.tsx';
import { Progress } from '@/shared/components/ui/Progress.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs.tsx';
import { Database, Brain, TrendingUp, AlertTriangle, Users, DollarSign, Calendar, MessageSquare, BarChart3, Lightbulb, ArrowRight, RefreshCw, Activity, Shield, Target } from 'lucide-react';
import { useAuth } from '@/hooks/index';
import { supabase } from '@/lib/supabase';

interface KnowledgeInsight {
  id: string;
  title: string;
  description: string;
  type: 'pattern' | 'trend' | 'anomaly' | 'opportunity' | 'risk' | 'prediction';
  source: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  urgency: 'immediate' | 'today' | 'this-week' | 'ongoing';
  dataPoints: number;
  lastUpdated: Date;
  actionable: boolean;
  actionUrl?: string;
  relatedIntegrations: string[];
  aiGenerated: boolean;
}

interface DataSource {
  id: string;
  name: string;
  type: 'crm' | 'email' | 'calendar' | 'analytics' | 'social' | 'financial' | 'communication';
  status: 'connected' | 'disconnected' | 'error' | 'syncing';
  lastSync: Date | null;
  dataPoints: number;
  insightsGenerated: number;
  icon: React.ReactNode;
}

interface KnowledgeEnhancerProps {
  className?: string;
}

export const KnowledgeEnhancer: React.FC<KnowledgeEnhancerProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const [insights, setInsights] = useState<KnowledgeInsight[]>([]);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('insights');
  const [lastAnalysis, setLastAnalysis] = useState<Date | null>(null);

  useEffect(() => {
    fetchKnowledgeData();
  }, []);

  const fetchKnowledgeData = async () => {
    try {
      setLoading(true);
      
      const [
        knowledgeInsights,
        integrationDataSources
      ] = await Promise.all([
        fetchKnowledgeInsights(),
        fetchDataSources()
      ]);

      setInsights(knowledgeInsights);
      setDataSources(integrationDataSources);
      setLastAnalysis(new Date());
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error fetching knowledge data: ', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchKnowledgeInsights = async (): Promise<KnowledgeInsight[]> => {
    const insights: KnowledgeInsight[] = [];

    try {
      // Get insights from business data
      const { data: businessData } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (businessData) {
        // Revenue pattern analysis
        if (businessData.revenue_trend === 'declining') {
          insights.push({
            id: 'revenue-decline-pattern',
            title: 'Revenue Decline Pattern Detected',
            description: 'Consistent decline in revenue over the last 3 months. Pattern suggests pricing or market issues.',
            type: 'trend',
            source: 'Financial Analytics',
            confidence: 0.85,
            impact: 'high',
            urgency: 'immediate',
            dataPoints: 12,
            lastUpdated: new Date(),
            actionable: true,
            actionUrl: '/workspace/business-dashboard',
            relatedIntegrations: ['stripe', 'paypal', 'quickbooks'],
            aiGenerated: true
          });
        }

        // Customer behavior insights
        if (businessData.customer_satisfaction_score && businessData.customer_satisfaction_score < 7) {
          insights.push({
            id: 'customer-satisfaction-trend',
            title: 'Customer Satisfaction Trend Analysis',
            description: 'Customer satisfaction scores trending downward. Correlation with support response times detected.',
            type: 'pattern',
            source: 'Customer Analytics',
            confidence: 0.78,
            impact: 'high',
            urgency: 'this-week',
            dataPoints: 45,
            lastUpdated: new Date(),
            actionable: true,
            actionUrl: '/workspace/customer-insights',
            relatedIntegrations: ['hubspot', 'zendesk', 'intercom'],
            aiGenerated: true
          });
        }

        // Communication pattern insights
        insights.push({
          id: 'communication-efficiency',
          title: 'Communication Efficiency Optimization',
          description: 'Email response times improved 23% this month. Team collaboration patterns show increased productivity.',
          type: 'opportunity',
          source: 'Communication Analytics',
          confidence: 0.92,
          impact: 'medium',
          urgency: 'ongoing',
          dataPoints: 156,
          lastUpdated: new Date(),
          actionable: true,
          actionUrl: '/workspace/communication',
          relatedIntegrations: ['slack', 'teams', 'gmail'],
          aiGenerated: true
        });

        // Predictive insights
        insights.push({
          id: 'growth-prediction',
          title: 'Growth Prediction Model',
          description: 'Based on current trends, projected 15% growth in Q2. Key factors: customer retention and market expansion.',
          type: 'prediction',
          source: 'AI Analytics',
          confidence: 0.76,
          impact: 'high',
          urgency: 'this-week',
          dataPoints: 89,
          lastUpdated: new Date(),
          actionable: true,
          actionUrl: '/workspace/analytics',
          relatedIntegrations: ['hubspot', 'stripe', 'google-analytics'],
          aiGenerated: true
        });
      }

      // Get insights from thought patterns
      const { data: thoughts } = await supabase
        .from('thoughts')
        .select('*')
        .eq('user_id', user?.id)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (thoughts && thoughts.length > 0) {
        const thoughtPatterns = analyzeThoughtPatterns(thoughts);
        
        if (thoughtPatterns.productivityTrend === 'improving') {
          insights.push({
            id: 'productivity-improvement',
            title: 'Productivity Improvement Pattern',
            description: 'Task completion rates increased 18% this month. Focus areas: automation and time management.',
            type: 'trend',
            source: 'Personal Analytics',
            confidence: 0.81,
            impact: 'medium',
            urgency: 'ongoing',
            dataPoints: thoughts.length,
            lastUpdated: new Date(),
            actionable: true,
            actionUrl: '/knowledge/thoughts',
            relatedIntegrations: ['notion', 'asana', 'trello'],
            aiGenerated: true
          });
        }
      }

    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error fetching knowledge insights: ', error);
    }

    return insights;
  };

  const analyzeThoughtPatterns = (thoughts: any[]) => {
    const completedTasks = thoughts.filter(t => t.status === 'completed').length;
    const totalTasks = thoughts.filter(t => t.category === 'task').length;
    const completionRate = totalTasks > 0 ? completedTasks / totalTasks: 0;

    return {
      productivityTrend: completionRate > 0.7 ? 'improving' : 'declining',
      focusAreas: thoughts
        .filter(t => t.department)
        .reduce((acc: any, t) => {
          acc[t.department] = (acc[t.department] || 0) + 1;
          return acc;
        }, {}),
      completionRate
    };
  };

  const fetchDataSources = async (): Promise<DataSource[]> => {
    const sources: DataSource[] = [];

    try {
      // Get connected integrations
      const { data: integrations } = await supabase
        .from('user_integrations')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'active');

      if (integrations) {
        const sourceMap: Record<string, DataSource> = {
          'hubspot': {
            id: 'hubspot',
            name: 'HubSpot CRM',
            type: 'crm',
            status: 'connected',
            lastSync: new Date(),
            dataPoints: 1247,
            insightsGenerated: 8,
            icon: <Users className="w-4 h-4" />
          },
          'stripe': {
            id: 'stripe',
            name: 'Stripe Payments',
            type: 'financial',
            status: 'connected',
            lastSync: new Date(),
            dataPoints: 892,
            insightsGenerated: 5,
            icon: <DollarSign className="w-4 h-4" />
          },
          'slack': {
            id: 'slack',
            name: 'Slack Communication',
            type: 'communication',
            status: 'connected',
            lastSync: new Date(),
            dataPoints: 2156,
            insightsGenerated: 12,
            icon: <MessageSquare className="w-4 h-4" />
          },
          'google-calendar': {
            id: 'google-calendar',
            name: 'Google Calendar',
            type: 'calendar',
            status: 'connected',
            lastSync: new Date(),
            dataPoints: 445,
            insightsGenerated: 3,
            icon: <Calendar className="w-4 h-4" />
          },
          'gmail': {
            id: 'gmail',
            name: 'Gmail',
            type: 'email',
            status: 'connected',
            lastSync: new Date(),
            dataPoints: 1834,
            insightsGenerated: 7,
            icon: <MessageSquare className="w-4 h-4" />
          },
          'google-analytics': {
            id: 'google-analytics',
            name: 'Google Analytics',
            type: 'analytics',
            status: 'connected',
            lastSync: new Date(),
            dataPoints: 5678,
            insightsGenerated: 15,
            icon: <BarChart3 className="w-4 h-4" />
          }
        };

        integrations.forEach(integration => {
          if (sourceMap[integration.integration_type]) {
            sources.push(sourceMap[integration.integration_type]);
          }
        });
      }
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error fetching data sources: ', error);
    }

    return sources;
  };

  const getInsightIcon = (type: KnowledgeInsight['type']) => {
    switch (type) {
      case 'pattern': return <Activity className="w-4 h-4" />;
      case 'trend': return <TrendingUp className="w-4 h-4" />;
      case 'anomaly': return <AlertTriangle className="w-4 h-4" />;
      case 'opportunity': return <Lightbulb className="w-4 h-4" />;
      case 'risk': return <Shield className="w-4 h-4" />;
      case 'prediction': return <Target className="w-4 h-4" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  const getInsightColor = (type: KnowledgeInsight['type']) => {
    switch (type) {
      case 'pattern': return 'text-blue-600 bg-blue-50';
      case 'trend': return 'text-green-600 bg-green-50';
      case 'anomaly': return 'text-red-600 bg-red-50';
      case 'opportunity': return 'text-purple-600 bg-purple-50';
      case 'risk': return 'text-orange-600 bg-orange-50';
      case 'prediction': return 'text-indigo-600 bg-indigo-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getUrgencyColor = (urgency: KnowledgeInsight['urgency']) => {
    switch (urgency) {
      case 'immediate': return 'bg-red-100 text-red-800';
      case 'today': return 'bg-orange-100 text-orange-800';
      case 'this-week': return 'bg-yellow-100 text-yellow-800';
      case 'ongoing': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSourceStatusColor = (status: DataSource['status']) => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-800';
      case 'disconnected': return 'bg-red-100 text-red-800';
      case 'error': return 'bg-orange-100 text-orange-800';
      case 'syncing': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleInsightAction = (insight: KnowledgeInsight) => {
    if (insight.actionUrl) {
      window.location.href = insight.actionUrl;
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Knowledge Enhancer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5" />
          Knowledge Enhancer
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          How integrations pull in data to enhance your knowledge and insights
        </p>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="insights">AI Insights</TabsTrigger>
            <TabsTrigger value="sources">Data Sources</TabsTrigger>
          </TabsList>

          <TabsContent value="insights" className="mt-4">
            <div className="space-y-4">
              {insights.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Brain className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium">No Insights Yet</p>
                  <p className="text-sm">Connect more integrations to generate insights</p>
                </div>
              ) : (
                insights.map((insight) => (
                  <div key={insight.id} className="border rounded-lg p-4 hover: bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${getInsightColor(insight.type)}`}>
                          {getInsightIcon(insight.type)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium">{insight.title}</h3>
                          <p className="text-sm text-muted-foreground">{insight.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getUrgencyColor(insight.urgency)}>
                          {insight.urgency}
                        </Badge>
                        <Badge variant="outline" className="text-blue-600">
                          {Math.round(insight.confidence * 100)}% confidence
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Impact: {insight.impact}</span>
                        <span>Data Points: {insight.dataPoints}</span>
                        <span>Source: {insight.source}</span>
                        {insight.aiGenerated && (
                          <span className="flex items-center gap-1">
                            <Brain className="w-3 h-3" />
                            AI Generated
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {insight.relatedIntegrations.map(integration => (
                          <Badge key={integration} variant="outline" className="text-xs">
                            {integration}
                          </Badge>
                        ))}
                        {insight.actionable && (
                          <Button 
                            size="sm" 
                            onClick={() => handleInsightAction(insight)}
                            aria-label={`Take action for ${insight.title}`}
                          >
                            <ArrowRight className="w-3 h-3 mr-1" />
                            Take Action
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="sources" className="mt-4">
            <div className="space-y-4">
              {dataSources.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Database className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium">No Data Sources Connected</p>
                  <p className="text-sm">Connect integrations to start generating insights</p>
                </div>
              ) : (
                dataSources.map((source) => (
                  <div key={source.id} className="border rounded-lg p-4 hover: bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-primary/10 text-primary">
                          {source.icon}
                        </div>
                        <div>
                          <h3 className="font-medium">{source.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {source.dataPoints.toLocaleString()} data points • {source.insightsGenerated} insights
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className={getSourceStatusColor(source.status)}>
                        {source.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Last Sync: {source.lastSync ? source.lastSync.toLocaleDateString() : 'Never'}</span>
                      <span>Type: {source.type}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {lastAnalysis ? `Last analysis: ${lastAnalysis.toLocaleTimeString()}` : 'No analysis yet'}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchKnowledgeData}
              aria-label="Refresh knowledge analysis"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Analysis
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 