import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Progress } from '@/shared/components/ui/Progress';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Users, 
  DollarSign, 
  Activity,
  RefreshCw,
  Eye,
  Target,
  Shield,
  Heart,
  Zap
} from 'lucide-react';
import { useAuth } from '@/hooks/index';
import { selectData as select, selectOne, insertOne, updateOne, deleteOne, callEdgeFunction } from '@/lib/api-client';
import { toast } from 'sonner';
import { authentikAuthService } from '@/core/auth/authentikAuthServiceInstance';

interface CrossPlatformInsight {
  id: string;
  insight_type: 'client_health' | 'revenue_optimization' | 'churn_risk' | 'upsell_opportunity';
  insight_data: Record<string, any>;
  confidence_score: number;
  platforms: string[];
  business_impact: 'low' | 'medium' | 'high' | 'critical';
  actionable_recommendations: string[];
  created_at: string;
}

interface ClientHealthScore {
  id: string;
  client_id: string;
  overall_health_score: number;
  crm_health_score: number;
  payment_health_score: number;
  usage_health_score: number;
  support_health_score: number;
  churn_risk_percentage: number;
  insights: string[];
  last_updated: string;
}

export function HubSpotInsights() {
  const { user } = useAuth();
  const [insights, setInsights] = useState<CrossPlatformInsight[]>([]);
  const [healthScores, setHealthScores] = useState<ClientHealthScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (user) {
      loadInsights();
    }
  }, [user]);

  const loadInsights = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Load insights
      const { data: insightsData, error: insightsError } = await supabase
        .from('ai_insights')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (insightsError) throw insightsError;

      // Load health scores
      const { data: healthData, error: healthError } = await supabase
        .from('client_health_scores')
        .select('*')
        .eq('user_id', user.id)
        .order('last_updated', { ascending: false });

      if (healthError) throw healthError;

      setInsights(insightsData || []);
      setHealthScores(healthData || []);
    } catch (error) {
      console.error('Failed to load insights:', error);
      toast.error('Failed to load insights');
    } finally {
      setLoading(false);
    }
  };

  const syncHubSpotData = async () => {
    if (!user) return;

    try {
      setSyncing(true);
      
      const response = await fetch('/api/supabase/functions/hubspot-enhanced-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authentikAuthService.getSession().data?.access_token}`,
        },
        body: JSON.stringify({ userId: user.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to sync HubSpot data');
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success(`Synced ${result.contactsSynced} contacts, ${result.companiesSynced} companies, ${result.dealsSynced} deals`);
        toast.success(`Generated ${result.insights?.length || 0} insights and ${result.clientHealthScores?.length || 0} health scores`);
        
        // Reload insights
        await loadInsights();
      } else {
        throw new Error(result.error || 'Sync failed');
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Failed to sync HubSpot data');
    } finally {
      setSyncing(false);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'client_health':
        return <Heart className="h-4 w-4" />;
      case 'revenue_optimization':
        return <DollarSign className="h-4 w-4" />;
      case 'churn_risk':
        return <AlertTriangle className="h-4 w-4" />;
      case 'upsell_opportunity':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <Eye className="h-4 w-4" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getChurnRiskColor = (risk: number) => {
    if (risk <= 20) return 'text-green-600';
    if (risk <= 40) return 'text-yellow-600';
    if (risk <= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading insights...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">HubSpot Intelligence</h2>
          <p className="text-muted-foreground">
            Cross-platform insights and client health analysis
          </p>
        </div>
        <Button onClick={syncHubSpotData} disabled={syncing}>
          {syncing ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Sync Data
            </>
          )}
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Insights</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.length}</div>
            <p className="text-xs text-muted-foreground">
              Cross-platform intelligence
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Client Health Scores</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthScores.length}</div>
            <p className="text-xs text-muted-foreground">
              Monitored clients
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Impact Insights</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {insights.filter(i => i.business_impact === 'high' || i.business_impact === 'critical').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Critical & high priority
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At Risk Clients</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {healthScores.filter(h => h.churn_risk_percentage > 60).length}
            </div>
            <p className="text-xs text-muted-foreground">
              High churn risk
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="insights" className="space-y-4">
        <TabsList>
          <TabsTrigger value="insights">Cross-Platform Insights</TabsTrigger>
          <TabsTrigger value="health">Client Health Scores</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-4">
          {insights.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No insights available. Sync your HubSpot data to generate cross-platform intelligence.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-4">
              {insights.map((insight) => (
                <Card key={insight.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getInsightIcon(insight.insight_type)}
                        <CardTitle className="text-lg capitalize">
                          {insight.insight_type.replace('_', ' ')}
                        </CardTitle>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getImpactColor(insight.business_impact)}>
                          {insight.business_impact}
                        </Badge>
                        <Badge variant="outline">
                          {insight.confidence_score}% confidence
                        </Badge>
                      </div>
                    </div>
                    <CardDescription>
                      Generated from {insight.platforms.join(', ')} data
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Insight Data */}
                    <div className="grid gap-4 md:grid-cols-2">
                      {Object.entries(insight.insight_data).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="font-medium capitalize">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                          </span>
                          <span className="text-muted-foreground">
                            {typeof value === 'number' ? value.toLocaleString() : value}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Recommendations */}
                    <div>
                      <h4 className="font-medium mb-2">Actionable Recommendations</h4>
                      <ul className="space-y-1">
                        {insight.actionable_recommendations.map((recommendation, index) => (
                          <li key={index} className="flex items-start space-x-2 text-sm">
                            <span className="text-blue-500 mt-1">•</span>
                            <span>{recommendation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Generated on {new Date(insight.created_at).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          {healthScores.length === 0 ? (
            <Alert>
              <Heart className="h-4 w-4" />
              <AlertDescription>
                No client health scores available. Sync your HubSpot data to calculate health scores.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-4">
              {healthScores.map((health) => (
                <Card key={health.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Client {health.client_id}</CardTitle>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">
                          {health.overall_health_score}/100
                        </Badge>
                        <Badge 
                          variant={health.churn_risk_percentage > 60 ? 'destructive' : 'secondary'}
                        >
                          {health.churn_risk_percentage}% churn risk
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Health Score Breakdown */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">CRM Health</span>
                          <span className={`text-sm font-medium ${getHealthScoreColor(health.crm_health_score)}`}>
                            {health.crm_health_score}/100
                          </span>
                        </div>
                        <Progress value={health.crm_health_score} className="h-2" />
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Payment Health</span>
                          <span className={`text-sm font-medium ${getHealthScoreColor(health.payment_health_score)}`}>
                            {health.payment_health_score}/100
                          </span>
                        </div>
                        <Progress value={health.payment_health_score} className="h-2" />
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Usage Health</span>
                          <span className={`text-sm font-medium ${getHealthScoreColor(health.usage_health_score)}`}>
                            {health.usage_health_score}/100
                          </span>
                        </div>
                        <Progress value={health.usage_health_score} className="h-2" />
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">Support Health</span>
                          <span className={`text-sm font-medium ${getHealthScoreColor(health.support_health_score)}`}>
                            {health.support_health_score}/100
                          </span>
                        </div>
                        <Progress value={health.support_health_score} className="h-2" />
                      </div>
                    </div>

                    {/* Client Insights */}
                    {health.insights.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Client Insights</h4>
                        <ul className="space-y-1">
                          {health.insights.map((insight, index) => (
                            <li key={index} className="flex items-start space-x-2 text-sm">
                              <span className="text-blue-500 mt-1">•</span>
                              <span>{insight}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground">
                      Last updated {new Date(health.last_updated).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
