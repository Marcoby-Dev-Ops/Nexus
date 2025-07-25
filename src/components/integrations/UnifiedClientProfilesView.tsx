import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card.tsx';
import { Badge } from '@/shared/components/ui/Badge.tsx';
import { Button } from '@/shared/components/ui/Button.tsx';
import { Input } from '@/shared/components/ui/Input.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs.tsx';
import { Progress } from '@/shared/components/ui/Progress.tsx';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert.tsx';
import { useAuth } from '@/hooks/index';
import { supabase } from '@/lib/supabase';
import { Users, Search, TrendingUp, AlertCircle, Mail, Phone, MapPin, Building, Calendar, DollarSign, Activity, Zap, Brain, Target, Star, RefreshCw, Download, Eye, MessageSquare, Lightbulb } from 'lucide-react';
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
  insights: any[];
  createdat: string;
  updatedat: string;
}

interface ClientInteraction {
  id: string;
  clientprofileid: string;
  interactiontype: 'email' | 'call' | 'meeting' | 'transaction' | 'support' | 'website_visit';
  channel: string;
  summary: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  value: number;
  metadata: any;
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

const UnifiedClientProfilesView: React.FC = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<UnifiedClientProfile[]>([]);
  const [interactions, setInteractions] = useState<ClientInteraction[]>([]);
  const [alerts, setAlerts] = useState<ClientIntelligenceAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<UnifiedClientProfile | null>(null);
  const [filterBy, setFilterBy] = useState<'all' | 'high_value' | 'recent' | 'at_risk'>('all');
  const [sortBy, setSortBy] = useState<'engagement' | 'value' | 'recent' | 'completeness'>('engagement');

  useEffect(() => {
    if (user?.id) {
      fetchClientProfiles();
      fetchInteractions();
      fetchAlerts();
    }
  }, [user?.id, filterBy, sortBy]);

  const fetchClientProfiles = async () => {
    try {
      setIsLoading(true);
      
      let query = supabase
        .from('ai_unified_client_profiles')
        .select('*')
        .eq('user_id', user!.id);

      // Apply filters
      if (filterBy === 'high_value') {
        query = query.gte('estimated_value', 10000);
      } else if (filterBy === 'recent') {
        query = query.gte('last_interaction', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
      } else if (filterBy === 'at_risk') {
        query = query.lt('engagement_score', 30);
      }

      // Apply sorting
      if (sortBy === 'engagement') {
        query = query.order('engagement_score', { ascending: false });
      } else if (sortBy === 'value') {
        query = query.order('estimated_value', { ascending: false });
      } else if (sortBy === 'recent') {
        query = query.order('last_interaction', { ascending: false });
      } else if (sortBy === 'completeness') {
        query = query.order('completeness_score', { ascending: false });
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error fetching client profiles: ', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInteractions = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_client_interactions')
        .select('*')
        .order('occurred_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setInteractions(data || []);
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error fetching interactions: ', error);
    }
  };

  const fetchAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_client_intelligence_alerts')
        .select('*')
        .eq('is_resolved', false)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error fetching alerts: ', error);
    }
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
    } catch (error) {
      // eslint-disable-next-line no-console
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
      case 'website_visit': return <Eye className="w-4 h-4" />;
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm: flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" />
            Unified Client Intelligence
          </h2>
          <p className="text-muted-foreground">
            AI-powered client profiles unified across all your integrations
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

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Clients</p>
                <p className="text-2xl font-bold">{profiles.length}</p>
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
                  ${profiles.reduce((sum, p) => sum + p.estimated_value, 0).toLocaleString()}
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
                <p className="text-2xl font-bold">
                  {Math.round(profiles.reduce((sum, p) => sum + p.engagement_score, 0) / profiles.length || 0)}%
                </p>
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
                <p className="text-2xl font-bold">{alerts.length}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
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
            onChange={(e) => setFilterBy(e.target.value as any)}
            className="px-4 py-2 border rounded-md bg-background"
          >
            <option value="all">All Clients</option>
            <option value="high_value">High Value ($10K+)</option>
            <option value="recent">Recent Activity</option>
            <option value="at_risk">At Risk</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 border rounded-md bg-background"
          >
            <option value="engagement">Sort by Engagement</option>
            <option value="value">Sort by Value</option>
            <option value="recent">Sort by Recent</option>
            <option value="completeness">Sort by Completeness</option>
          </select>
        </div>
      </div>

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              Active Intelligence Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alerts.slice(0, 5).map((alert) => (
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

      {/* Client Profiles */}
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

                    {/* Recent Interactions */}
                    {interactions.filter(i => i.client_profile_id === profile.id).length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Recent Activity: </p>
                        <div className="flex gap-2">
                          {interactions
                            .filter(i => i.client_profile_id === profile.id)
                            .slice(0, 3)
                            .map((interaction, index) => (
                              <div key={index} className="flex items-center gap-1 text-xs bg-muted/50 px-2 py-1 rounded">
                                {getInteractionIcon(interaction.interaction_type)}
                                <span>{interaction.interaction_type}</span>
                                <span className="text-muted-foreground">
                                  {new Date(interaction.occurred_at).toLocaleDateString()}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    onClick={() => setSelectedProfile(profile)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
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

      {filteredProfiles.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Client Profiles Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm 
                ? "No clients match your search criteria."
                : "Your client intelligence system is ready. Client profiles will appear here as data is collected from your integrations."
              }
            </p>
            {!searchTerm && (
              <Button onClick={fetchClientProfiles}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Check for New Data
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UnifiedClientProfilesView; 