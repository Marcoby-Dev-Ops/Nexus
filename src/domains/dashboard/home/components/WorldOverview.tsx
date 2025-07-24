import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { 
  Globe, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Users, 
  DollarSign,
  Activity,
  Target,
  Lightbulb,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/core/auth/AuthProvider';
import { supabase } from '@/core/supabase';

interface WorldInsight {
  id: string;
  type: 'business' | 'personal' | 'priority' | 'opportunity' | 'alert';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  urgency: 'immediate' | 'today' | 'this-week' | 'ongoing';
  source: string;
  data?: Record<string, unknown>;
  actionUrl?: string;
}

interface WorldOverviewProps {
  className?: string;
}

export const WorldOverview: React.FC<WorldOverviewProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const [insights, setInsights] = useState<WorldInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchWorldInsights = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch insights from multiple sources
      const [
        businessInsights,
        personalInsights, 
        priorityInsights,
        integrationInsights
      ] = await Promise.all([
        fetchBusinessInsights(),
        fetchPersonalInsights(),
        fetchPriorityInsights(),
        fetchIntegrationInsights()
      ]);

      const allInsights = [
        ...businessInsights,
        ...personalInsights,
        ...priorityInsights,
        ...integrationInsights
      ].sort((a, b) => {
        // Sort by urgency and impact
        const urgencyOrder = { immediate: 0, today: 1, 'this-week': 2, ongoing: 3 };
        const impactOrder = { high: 0, medium: 1, low: 2 };
        
        if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
          return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
        }
        return impactOrder[a.impact] - impactOrder[b.impact];
      });

      setInsights(allInsights);
      setLastUpdated(new Date());
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error fetching world insights: ', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchWorldInsights();
    const interval = setInterval(fetchWorldInsights, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, [fetchWorldInsights]);

  const fetchBusinessInsights = async (): Promise<WorldInsight[]> => {
    const insights: WorldInsight[] = [];

    try {
      // Get business health metrics
      const { data: businessData } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('org_id', user?.profile?.company_id || user?.id || '')
        .single();

      if (businessData) {
        // Business model insights
        if (businessData.business_model && businessData.business_model.includes('subscription')) {
          insights.push({
            id: 'subscription-model',
            type: 'opportunity',
            title: 'Subscription Model Active',
            description: 'Your business uses a subscription model. Monitor recurring revenue metrics.',
            impact: 'medium',
            urgency: 'ongoing',
            source: 'Business Analytics',
            actionUrl: '/workspace/business-dashboard'
          });
        }

        // Company size insights
        if (businessData.company_size && businessData.company_size === 'startup') {
          insights.push({
            id: 'startup-focus',
            type: 'priority',
            title: 'Startup Growth Focus',
            description: 'As a startup, focus on rapid iteration and customer acquisition.',
            impact: 'high',
            urgency: 'ongoing',
            source: 'Business Analytics',
            actionUrl: '/workspace/business-dashboard'
          });
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error fetching business insights: ', error);
    }

    return insights;
  };

  const fetchPersonalInsights = async (): Promise<WorldInsight[]> => {
    const insights: WorldInsight[] = [];

    try {
      // Get personal thoughts and tasks
      const { data: thoughts } = await supabase
        .from('thoughts')
        .select('*')
        .eq('user_id', user?.id || '')
        .order('created_at', { ascending: false })
        .limit(5);

      if (thoughts && thoughts.length > 0) {
        insights.push({
          id: 'recent-thoughts',
          type: 'priority',
          title: `${thoughts.length} Recent Thoughts`,
          description: `You have ${thoughts.length} recent thoughts captured. Review and organize them.`,
          impact: 'medium',
          urgency: 'ongoing',
          source: 'Personal Tasks',
          actionUrl: '/knowledge/thoughts'
        });
      }
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error fetching personal insights: ', error);
    }

    return insights;
  };

  const fetchPriorityInsights = async (): Promise<WorldInsight[]> => {
    const insights: WorldInsight[] = [];

    try {
      // Get FIRE cycle insights - simplified for now
      insights.push({
        id: 'fire-cycle-status',
        type: 'priority',
        title: 'FIRE Cycle Active',
        description: 'Your FIRE cycle is ready to help you focus, gain insights, roadmap, and execute.',
        impact: 'medium',
        urgency: 'ongoing',
        source: 'FIRE Cycle',
        actionUrl: '/fire-cycle'
      });
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error fetching priority insights: ', error);
    }

    return insights;
  };

  const fetchIntegrationInsights = async (): Promise<WorldInsight[]> => {
    const insights: WorldInsight[] = [];

    try {
      // Get integration status
      const { data: integrations } = await supabase
        .from('user_integrations')
        .select('*')
        .eq('user_id', user?.id || '')
        .eq('status', 'active');

      if (integrations) {
        const disconnectedIntegrations = integrations.filter(i => 
          !i.last_sync_at || new Date(i.last_sync_at) < new Date(Date.now() - 24 * 60 * 60 * 1000)
        );

        if (disconnectedIntegrations.length > 0) {
          insights.push({
            id: 'disconnected-integrations',
            type: 'alert',
            title: `${disconnectedIntegrations.length} Integrations Need Attention`,
            description: 'Some of your integrations haven\'t synced recently. Check connection status.',
            impact: 'medium',
            urgency: 'today',
            source: 'Integrations',
            actionUrl: '/integrations'
          });
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error fetching integration insights: ', error);
    }

    return insights;
  };

  const getInsightIcon = (type: WorldInsight['type']) => {
    switch (type) {
      case 'business': return <DollarSign className="w-4 h-4" />;
      case 'personal': return <Users className="w-4 h-4" />;
      case 'priority': return <Target className="w-4 h-4" />;
      case 'opportunity': return <Lightbulb className="w-4 h-4" />;
      case 'alert': return <AlertTriangle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getInsightColor = (type: WorldInsight['type']) => {
    switch (type) {
      case 'business': return 'text-blue-600 bg-blue-50';
      case 'personal': return 'text-green-600 bg-green-50';
      case 'priority': return 'text-orange-600 bg-orange-50';
      case 'opportunity': return 'text-purple-600 bg-purple-50';
      case 'alert': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getUrgencyColor = (urgency: WorldInsight['urgency']) => {
    switch (urgency) {
      case 'immediate': return 'bg-red-100 text-red-800';
      case 'today': return 'bg-orange-100 text-orange-800';
      case 'this-week': return 'bg-yellow-100 text-yellow-800';
      case 'ongoing': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            What's Going On in My World
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
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            What's Going On in My World
          </CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Loading...'}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
              <p className="text-lg font-medium">Everything Looks Good!</p>
              <p className="text-sm">No urgent insights to report right now.</p>
            </div>
          ) : (
            insights.map((insight) => (
              <div key={insight.id} className="border rounded-lg p-4 hover: bg-muted/50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-full ${getInsightColor(insight.type)}`}>
                      {getInsightIcon(insight.type)}
                    </div>
                    <div>
                      <h3 className="font-medium">{insight.title}</h3>
                      <p className="text-sm text-muted-foreground">{insight.description}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={getUrgencyColor(insight.urgency)}>
                    {insight.urgency}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Impact: {insight.impact}</span>
                    <span>Source: {insight.source}</span>
                  </div>
                  {insight.actionUrl && (
                    <Button variant="outline" size="sm" aria-label={`Take action for ${insight.title}`}>
                      <a href={insight.actionUrl}>Take Action</a>
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="mt-6 pt-4 border-t">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchWorldInsights}
            className="w-full"
            aria-label="Refresh world insights"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Insights
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}; 