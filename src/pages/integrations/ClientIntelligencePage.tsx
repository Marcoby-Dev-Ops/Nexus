import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card.tsx';
import { Badge } from '@/shared/components/ui/Badge.tsx';
import { Button } from '@/shared/components/ui/Button.tsx';
import { Input } from '@/shared/components/ui/Input.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs.tsx';
import { Progress } from '@/shared/components/ui/Progress.tsx';
import { Alert } from '@/shared/components/ui/Alert.tsx';
import { useAuth } from '@/hooks/index';
import { Users, Search, TrendingUp, AlertCircle, Mail, Phone, MapPin, Building, Calendar, DollarSign, Activity, Zap, Brain, Target, Star, RefreshCw, Download, BarChart3, MessageSquare, Lightbulb, ArrowLeft } from 'lucide-react';
/**
 * @name ClientIntelligencePage
 * @description Dedicated page for unified client intelligence dashboard
 * @returns {JSX.Element} The rendered ClientIntelligencePage component.
 * Pillar: 1,2 - Customer Success Automation + Business Workflow Intelligence
 */

interface UnifiedClientProfile {
  id: string;
  clientid: string;
  profiledata: {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    location?: string;
    industry?: string;
    website?: string;
    social_profiles?: {
      linkedin?: string;
      twitter?: string;
    };
    demographics?: {
      company_size?: string;
      revenue_range?: string;
      role?: string;
    };
  };
  sourceintegrations: string[];
  primarysource: string;
  completenessscore: number;
  engagementscore: number;
  estimatedvalue: number;
  lastinteraction: string;
  lastenrichmentat: string;
  insights: ClientInsight[];
  createdat: string;
  updatedat: string;
}

interface ClientInsight {
  type: string;
  value: string;
  confidence: number;
}

interface ClientInteraction {
  id: string;
  clientprofileid: string;
  interactiontype: 'email' | 'call' | 'meeting' | 'transaction' | 'support' | 'website_visit';
  channel: string;
  summary: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  value: number;
  metadata: Record<string, unknown>;
  occurredat: string;
}

interface ClientIntelligenceAlert {
  id: string;
  clientprofileid: string;
  alerttype: 'opportunity' | 'risk' | 'milestone' | 'anomaly';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  isresolved: boolean;
  createdat: string;
}

interface AnalyticsData {
  totalClients: number;
  totalValue: number;
  averageEngagement: number;
  activeAlerts: number;
  topSources: Array<{
    source: string;
    count: number;
  }>;
}



const ClientIntelligencePage: React.FC = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<UnifiedClientProfile[]>([]);
  const [interactions, setInteractions] = useState<ClientInteraction[]>([]);
  const [alerts, setAlerts] = useState<ClientIntelligenceAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  // const [selectedProfile, setSelectedProfile] = useState<UnifiedClientProfile | null>(null);
  const [filterBy, setFilterBy] = useState<'all' | 'high_value' | 'recent' | 'at_risk'>('all');
  const [sortBy, setSortBy] = useState<'engagement' | 'value' | 'recent' | 'completeness'>('engagement');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  const fetchAnalytics = useCallback(async () => {
    // Mock analytics data
    setAnalytics({
      totalClients: profiles.length,
      totalValue: profiles.reduce((sum, p) => sum + p.estimated_value, 0),
      averageEngagement: Math.round(profiles.reduce((sum, p) => sum + p.engagement_score, 0) / profiles.length || 0),
      activeAlerts: alerts.length,
      topSources: [
        { source: 'office-365', count: 2 },
        { source: 'paypal', count: 1 },
        { source: 'stripe', count: 1 },
        { source: 'hubspot', count: 1 }
      ]
    });
  }, [profiles, alerts.length]);

  useEffect(() => {
    if (user?.id) {
      fetchClientProfiles();
      fetchInteractions();
      fetchAlerts();
      fetchAnalytics();
    }
  }, [user?.id, filterBy, sortBy, fetchAnalytics]);

  const fetchClientProfiles = async () => {
    try {
      setIsLoading(true);
      
      // For now, we'll create mock data since the tables are new
      // In production, this would fetch from ai_unified_client_profiles
      const mockProfiles: UnifiedClientProfile[] = [
        {
          id: '1',
          clientid: 'client_001',
          profiledata: {
            name: 'John Smith',
            email: 'john@techcorp.com',
            phone: '+1-555-0123',
            company: 'TechCorp Solutions',
            location: 'San Francisco, CA',
            industry: 'Technology',
            website: 'https://techcorp.com',
            demographics: {
              companysize: '50-200',
              revenuerange: '$10M-$50M',
              role: 'CTO'
            }
          },
          sourceintegrations: ['office-365', 'paypal', 'hubspot'],
          primarysource: 'hubspot',
          completenessscore: 85,
          engagementscore: 78,
          estimatedvalue: 45000,
          lastinteraction: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          lastenrichment_at: new Date().toISOString(),
          insights: [],
          createdat: new Date().toISOString(),
          updatedat: new Date().toISOString()
        },
        {
          id: '2',
          clientid: 'client_002',
          profiledata: {
            name: 'Sarah Johnson',
            email: 'sarah@innovatetech.com',
            company: 'InnovateTech Inc',
            location: 'Austin, TX',
            industry: 'SaaS',
            demographics: {
              companysize: '10-50',
              revenuerange: '$1M-$10M',
              role: 'CEO'
            }
          },
          sourceintegrations: ['office-365', 'stripe'],
          primarysource: 'stripe',
          completenessscore: 72,
          engagementscore: 92,
          estimatedvalue: 78000,
          lastinteraction: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          lastenrichment_at: new Date().toISOString(),
          insights: [],
          createdat: new Date().toISOString(),
          updatedat: new Date().toISOString()
        }
      ];

      setProfiles(mockProfiles);
    } catch {
      // // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error fetching client profiles: ', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInteractions = async () => {
    // Mock interactions data
    const mockInteractions: ClientInteraction[] = [
      {
        id: '1',
        clientprofile_id: '1',
        interactiontype: 'email',
        channel: 'Microsoft 365',
        summary: 'Discussed project requirements and timeline',
        sentiment: 'positive',
        value: 5000,
        metadata: {},
        occurredat: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        clientprofile_id: '2',
        interactiontype: 'transaction',
        channel: 'Stripe',
        summary: 'Monthly subscription payment processed',
        sentiment: 'positive',
        value: 2500,
        metadata: {},
        occurredat: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    setInteractions(mockInteractions);
  };

  const fetchAlerts = async () => {
    // Mock alerts data
    const mockAlerts: ClientIntelligenceAlert[] = [
      {
        id: '1',
        clientprofile_id: '1',
        alerttype: 'opportunity',
        title: 'Upsell Opportunity Detected',
        description: 'Client has been actively using advanced features. Consider proposing enterprise plan.',
        priority: 'high',
        isresolved: false,
        createdat: new Date().toISOString()
      },
      {
        id: '2',
        clientprofile_id: '2',
        alerttype: 'risk',
        title: 'Engagement Drop',
        description: 'Client engagement has decreased by 30% over the last week.',
        priority: 'medium',
        isresolved: false,
        createdat: new Date().toISOString()
      }
    ];

    setAlerts(mockAlerts);
  };

  const triggerClientUnification = async (clientId: string) => {
    try {
      const response = await fetch('https: //automate.marcoby.net/webhook/client-data-unification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientid: clientId,
          userid: user?.id,
          companyid: user?.company_id,
          type: 'profile_refresh'
        })
      });

      if (response.ok) {
        await fetchClientProfiles();
      }
    } catch {
      // // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error triggering client unification: ', error);
    }
  };

  const getEngagementColor = (score: number) => {
    if (score >= 70) return 'text-success';
    if (score >= 40) return 'text-warning';
    return 'text-destructive';
  };

  const getValueColor = (value: number) => {
    if (value >= 50000) return 'text-success';
    if (value >= 10000) return 'text-warning';
    return 'text-muted-foreground';
  };

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="w-4 h-4" />;
      case 'call': return <Phone className="w-4 h-4" />;
      case 'meeting': return <Calendar className="w-4 h-4" />;
      case 'transaction': return <DollarSign className="w-4 h-4" />;
      case 'support': return <MessageSquare className="w-4 h-4" />;
      case 'website_visit': return <Activity className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <Target className="w-4 h-4 text-success" />;
      case 'risk': return <AlertCircle className="w-4 h-4 text-destructive" />;
      case 'milestone': return <Star className="w-4 h-4 text-warning" />;
      case 'anomaly': return <TrendingUp className="w-4 h-4 text-primary" />;
      default: return <Lightbulb className="w-4 h-4" />;
    }
  };

  const filteredProfiles = profiles.filter(profile =>
    searchTerm === '' ||
    profile.profile_data.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.profile_data.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.profile_data.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin mr-3" />
        <span>Loading client intelligence...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          onClick={() => window.history.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold flex items-center gap-4">
            <Brain className="w-8 h-8 text-primary" />
            Client Intelligence Dashboard
          </h1>
          <p className="text-muted-foreground">
            AI-powered unified client profiles from all your integrations
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchClientProfiles}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="clients">Client Profiles</TabsTrigger>
          <TabsTrigger value="interactions">Interactions</TabsTrigger>
          <TabsTrigger value="alerts">Intelligence Alerts</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md: grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Clients</p>
                    <p className="text-2xl font-bold">{analytics?.totalClients || 0}</p>
                  </div>
                  <Users className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Value</p>
                    <p className="text-2xl font-bold">
                      ${(analytics?.totalValue || 0).toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-success" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Engagement</p>
                    <p className="text-2xl font-bold">{analytics?.averageEngagement || 0}%</p>
                  </div>
                  <Activity className="w-8 h-8 text-warning" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Alerts</p>
                    <p className="text-2xl font-bold">{analytics?.activeAlerts || 0}</p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-destructive" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Active Alerts Preview */}
          {alerts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-destructive" />
                  Recent Intelligence Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {alerts.slice(0, 3).map((alert) => (
                    <Alert key={alert.id} className={`border-l-4 ${
                      alert.priority === 'critical' ? 'border-l-destructive' :
                      alert.priority === 'high' ? 'border-l-warning' :
                      'border-l-primary'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          {getAlertIcon(alert.alert_type)}
                          <div>
                            <h4 className="font-medium">{alert.title}</h4>
                            <p className="text-sm text-muted-foreground">{alert.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {alert.alert_type}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {alert.priority} priority
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          View Client
                        </Button>
                      </div>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top Data Sources */}
          <Card>
            <CardHeader>
              <CardTitle>Top Data Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics?.topSources?.map((source: AnalyticsData['topSources'][0], index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                        <Activity className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-medium capitalize">{source.source.replace('-', ' ')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{source.count} clients</span>
                      <Progress value={(source.count / profiles.length) * 100} className="w-20 h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients" className="space-y-6">
          {/* Search and Filters */}
          <div className="flex flex-col sm: flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search clients by name, email, or company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value as 'all' | 'high_value' | 'recent' | 'at_risk')}
                className="px-4 py-2 border rounded-md bg-background"
              >
                <option value="all">All Clients</option>
                <option value="high_value">High Value ($10K+)</option>
                <option value="recent">Recent Activity</option>
                <option value="at_risk">At Risk</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'engagement' | 'value' | 'recent' | 'completeness')}
                className="px-4 py-2 border rounded-md bg-background"
              >
                <option value="engagement">Sort by Engagement</option>
                <option value="value">Sort by Value</option>
                <option value="recent">Sort by Recent</option>
                <option value="completeness">Sort by Completeness</option>
              </select>
            </div>
          </div>

          {/* Client Profiles Grid */}
          <div className="grid gap-6">
            {filteredProfiles.map((profile) => (
              <Card key={profile.id} className="overflow-hidden hover: shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      {/* Client Avatar/Initial */}
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-lg font-semibold text-primary">
                          {profile.profile_data.name?.charAt(0) || profile.profile_data.email?.charAt(0) || '?'}
                        </span>
                      </div>

                      {/* Client Info */}
                      <div className="flex-1 space-y-4">
                        <div>
                          <h3 className="text-lg font-semibold">
                            {profile.profile_data.name || 'Unknown Client'}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {profile.profile_data.email && (
                              <div className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {profile.profile_data.email}
                              </div>
                            )}
                            {profile.profile_data.company && (
                              <div className="flex items-center gap-1">
                                <Building className="w-3 h-3" />
                                {profile.profile_data.company}
                              </div>
                            )}
                            {profile.profile_data.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {profile.profile_data.location}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Metrics */}
                        <div className="grid grid-cols-2 md: grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Engagement Score</p>
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-semibold ${getEngagementColor(profile.engagement_score)}`}>
                                {profile.engagement_score}%
                              </span>
                              <Progress value={profile.engagement_score} className="w-16 h-1" />
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Estimated Value</p>
                            <p className={`text-sm font-semibold ${getValueColor(profile.estimated_value)}`}>
                              ${profile.estimated_value.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Profile Complete</p>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold">{profile.completeness_score}%</span>
                              <Progress value={profile.completeness_score} className="w-16 h-1" />
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Data Sources</p>
                            <p className="text-sm font-semibold">{profile.source_integrations.length}</p>
                          </div>
                        </div>

                        {/* Data Sources */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Sources: </span>
                          <div className="flex gap-1">
                            {profile.source_integrations.map((source, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {source}
                              </Badge>
                            ))}
                          </div>
                          {profile.primary_source && (
                            <Badge variant="outline" className="text-xs">
                              Primary: {profile.primary_source}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                                                  onClick={() => {/* setSelectedProfile(profile) */}}
                      >
                        <Activity className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => triggerClientUnification(profile.client_id)}
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        Refresh
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="interactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Client Interactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {interactions.map((interaction) => (
                  <div key={interaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      {getInteractionIcon(interaction.interaction_type)}
                      <div>
                        <h4 className="font-medium">{interaction.summary}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{interaction.channel}</span>
                          <span>•</span>
                          <span>{new Date(interaction.occurred_at).toLocaleDateString()}</span>
                          <span>•</span>
                          <Badge variant="outline" className="text-xs">
                            {interaction.sentiment}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${interaction.value.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{interaction.interaction_type}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <div className="space-y-4">
            {alerts.map((alert) => (
              <Card key={alert.id}>
                <CardContent className="p-6">
                  <div className={`border-l-4 pl-4 ${
                    alert.priority === 'critical' ? 'border-l-destructive' :
                    alert.priority === 'high' ? 'border-l-warning' :
                    'border-l-primary'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        {getAlertIcon(alert.alert_type)}
                        <div>
                          <h3 className="font-semibold">{alert.title}</h3>
                          <p className="text-muted-foreground mt-1">{alert.description}</p>
                          <div className="flex items-center gap-2 mt-3">
                            <Badge variant="outline">{alert.alert_type}</Badge>
                            <Badge variant="outline">{alert.priority} priority</Badge>
                            <span className="text-sm text-muted-foreground">
                              {new Date(alert.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          View Client
                        </Button>
                        <Button size="sm">
                          Resolve
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg: grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Engagement Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                    <p>Engagement analytics chart</p>
                    <p className="text-sm">Coming soon with more data</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Value Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <DollarSign className="w-12 h-12 mx-auto mb-2" />
                    <p>Value distribution chart</p>
                    <p className="text-sm">Coming soon with more data</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClientIntelligencePage; 