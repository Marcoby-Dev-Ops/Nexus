import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Progress } from '@/shared/components/ui/Progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { useAuthContext } from '@/domains/admin/user/hooks/AuthContext';
import { supabase } from '@/core/supabase';
import {
  Database,
  RefreshCw,
  TrendingUp,
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  BarChart3,
  Users,
  DollarSign,
  Mail,
  Settings,
  ExternalLink
} from 'lucide-react';
import { triggerManualSync } from '@/domains/integrations/lib/syncService';
import type { BaseIntegration } from '@/domains/integrations/lib/baseIntegration';
import { GoogleWorkspaceIntegration } from '@/domains/integrations/lib/GoogleWorkspaceIntegration';
import { Microsoft365Integration } from '@/domains/integrations/lib/Microsoft365Integration';
import { DropboxIntegration } from '@/domains/integrations/lib/DropboxIntegration';
import { SlackIntegration } from '@/domains/integrations/lib/SlackIntegration';
import { HubSpotIntegration } from '@/domains/integrations/lib/hubspotIntegration';
import { NotionIntegration } from '@/domains/integrations/lib/NotionIntegration';
import { AsanaIntegration } from '@/domains/integrations/lib/AsanaIntegration';
import { TrelloIntegration } from '@/domains/integrations/lib/TrelloIntegration';
import { GitHubIntegration } from '@/domains/integrations/lib/GitHubIntegration';
import { ZendeskIntegration } from '@/domains/integrations/lib/ZendeskIntegration';

interface IntegrationData {
  id: string;
  name: string;
  slug: string;
  status: 'active' | 'syncing' | 'error' | 'paused';
  lastSync: string;
  dataPoints: {
    total: number;
    thisWeek: number;
    thisMonth: number;
  };
  syncProgress: number;
  metrics: {
    label: string;
    value: string | number;
    change?: string;
    trend?: 'up' | 'down' | 'stable';
  }[];
  nextSync: string;
  errors?: string[];
}

interface IntegrationInsight {
  id: string;
  integrationId: string;
  title: string;
  description: string;
  type: 'optimization' | 'alert' | 'trend' | 'opportunity';
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  createdAt: string;
}

const integrationClassRegistry: Record<string, typeof BaseIntegration> = {
  'google-workspace': GoogleWorkspaceIntegration,
  'microsoft-365': Microsoft365Integration,
  'dropbox': DropboxIntegration,
  'slack': SlackIntegration,
  'hubspot': HubSpotIntegration,
  'notion': NotionIntegration,
  'asana': AsanaIntegration,
  'trello': TrelloIntegration,
  'github': GitHubIntegration,
  'zendesk': ZendeskIntegration,
};

const IntegrationDataDashboard: React.FC = () => {
  const { user } = useAuthContext();
  const [integrationData, setIntegrationData] = useState<IntegrationData[]>([]);
  const [insights, setInsights] = useState<IntegrationInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'quarter'>('month');
  const [refreshing, setRefreshing] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncStatuses, setSyncStatuses] = useState<Record<string, any>>({});
  const [statusLoading, setStatusLoading] = useState<Record<string, boolean>>({});
  const [statusError, setStatusError] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user?.id) {
      fetchIntegrationData();
      fetchInsights();
    }
  }, [user?.id, selectedTimeframe]);

  const fetchIntegrationData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch user's connected integrations
      const { data: userIntegrations, error } = await supabase
        .from('user_integrations')
        .select(`
          id,
          status,
          updated_at,
          config,
          integration_id
        `)
        .eq('user_id', user!.id)
        .eq('status', 'active');

      if (error) throw error;

      // Fetch integration details separately to avoid join issues
      const integrationsWithDetails = await Promise.all(
        (userIntegrations || []).map(async (userIntegration) => {
          try {
            const { data: integrationDetails } = await supabase
              .from('integrations')
              .select('id, name, slug')
              .eq('id', userIntegration.integration_id)
              .single();
            
            return {
              ...userIntegration,
              integrations: integrationDetails || { name: 'Unknown', slug: 'unknown' }
            };
          } catch (error) {
            console.error('Error fetching integration details:', error);
            return {
              ...userIntegration,
              integrations: { name: 'Unknown', slug: 'unknown' }
            };
          }
        })
      );

      // Mock data enhancement - in real implementation, this would come from actual data collection
      const enhancedData: IntegrationData[] = integrationsWithDetails.map((integration: any) => {
        const mockMetrics = generateMockMetrics(integration.integrations.slug);
        
        return {
          id: integration.id,
          name: integration.integrations.name,
          slug: integration.integrations.slug,
          status: getIntegrationStatus(integration),
          lastSync: integration.updated_at,
          dataPoints: {
            total: mockMetrics.totalRecords,
            thisWeek: mockMetrics.weeklyRecords,
            thisMonth: mockMetrics.monthlyRecords
          },
          syncProgress: mockMetrics.syncProgress,
          metrics: mockMetrics.metrics,
          nextSync: mockMetrics.nextSync,
          errors: mockMetrics.errors
        };
      });

      setIntegrationData(enhancedData);
    } catch (error) {
      console.error('Error fetching integration data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInsights = async () => {
    // Mock insights - in real implementation, these would be AI-generated
    const mockInsights: IntegrationInsight[] = [
      {
        id: '1',
        integrationId: 'paypal',
        title: 'Revenue Growth Opportunity',
        description: 'PayPal data shows 23% increase in transaction volume this month. Consider increasing inventory for top-selling products.',
        type: 'opportunity',
        impact: 'high',
        actionable: true,
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        integrationId: 'office-365',
        title: 'Email Response Time Optimization',
        description: 'Microsoft 365 data indicates average email response time has increased by 40%. Consider setting up auto-responders.',
        type: 'optimization',
        impact: 'medium',
        actionable: true,
        createdAt: new Date().toISOString()
      },
      {
        id: '3',
        integrationId: 'ninjarmm',
        title: 'System Health Alert',
        description: 'NinjaRMM reports 3 devices with critical updates pending. Immediate action recommended.',
        type: 'alert',
        impact: 'high',
        actionable: true,
        createdAt: new Date().toISOString()
      }
    ];

    setInsights(mockInsights);
  };

  const getIntegrationStatus = (integration: any): 'active' | 'syncing' | 'error' | 'paused' => {
    // Logic to determine status based on integration config and last sync
    const lastSync = new Date(integration.updated_at);
    const now = new Date();
    const hoursSinceSync = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceSync > 24) return 'error';
    if (hoursSinceSync > 1) return 'paused';
    return 'active';
  };

  const generateMockMetrics = (slug: string) => {
    const baseMetrics = {
      paypal: {
        totalRecords: 1247,
        weeklyRecords: 89,
        monthlyRecords: 356,
        syncProgress: 100,
        nextSync: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        metrics: [
          { label: 'Transactions', value: 356, change: '+12%', trend: 'up' as const },
          { label: 'Revenue', value: '$45,892', change: '+23%', trend: 'up' as const },
          { label: 'Avg Transaction', value: '$128.90', change: '+8%', trend: 'up' as const }
        ],
        errors: []
      },
      'office-365': {
        totalRecords: 2891,
        weeklyRecords: 234,
        monthlyRecords: 892,
        syncProgress: 85,
        nextSync: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        metrics: [
          { label: 'Emails', value: 892, change: '+5%', trend: 'up' as const },
          { label: 'Meetings', value: 67, change: '+15%', trend: 'up' as const },
          { label: 'Response Time', value: '2.3h', change: '+40%', trend: 'down' as const }
        ],
        errors: []
      },
      ninjarmm: {
        totalRecords: 156,
        weeklyRecords: 45,
        monthlyRecords: 156,
        syncProgress: 100,
        nextSync: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        metrics: [
          { label: 'Devices', value: 23, change: '+2', trend: 'up' as const },
          { label: 'Alerts', value: 3, change: 'Critical', trend: 'down' as const },
          { label: 'Uptime', value: '99.2%', change: '+0.3%', trend: 'up' as const }
        ],
        errors: ['3 devices need critical updates']
      }
    };

    return baseMetrics[slug as keyof typeof baseMetrics] || {
      totalRecords: Math.floor(Math.random() * 1000),
      weeklyRecords: Math.floor(Math.random() * 100),
      monthlyRecords: Math.floor(Math.random() * 400),
      syncProgress: Math.floor(Math.random() * 100),
      nextSync: new Date(Date.now() + Math.random() * 2 * 60 * 60 * 1000).toISOString(),
      metrics: [
        { label: 'Data Points', value: Math.floor(Math.random() * 1000), change: `+${Math.floor(Math.random() * 20)}%`, trend: 'up' as const }
      ],
      errors: []
    };
  };

  const handleRefreshIntegration = async (integrationId: string) => {
    setRefreshing(integrationId);
    // Simulate refresh
    setTimeout(() => {
      setRefreshing(null);
      fetchIntegrationData();
    }, 2000);
  };

  const handleManualSync = async (integration: IntegrationData) => {
    setSyncing(integration.slug);
    setSyncError(null);
    try {
      const result = await triggerManualSync({
        integrationId: integration.slug,
        userId: user!.id,
        fullSync: true
      });
      if (!result.success) {
        setSyncError(result.error || 'Sync failed');
      } else {
        // Optionally, refresh data
        fetchIntegrationData();
      }
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setSyncing(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'syncing':
        return <RefreshCw className="w-4 h-4 text-primary animate-spin" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      case 'paused':
        return <Clock className="w-4 h-4 text-warning" />;
      default:
        return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success/10 text-success border-success/20';
      case 'syncing': return 'bg-primary/10 text-primary border-primary/20';
      case 'error': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'paused': return 'bg-warning/10 text-warning border-warning/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getIntegrationIcon = (slug: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'paypal': <DollarSign className="w-5 h-5" />,
      'office-365': <Mail className="w-5 h-5" />,
      'ninjarmm': <Settings className="w-5 h-5" />,
      'hubspot': <Users className="w-5 h-5" />,
      'quickbooks': <BarChart3 className="w-5 h-5" />,
      'google-calendar': <Mail className="w-5 h-5" />
    };
    return iconMap[slug] || <Database className="w-5 h-5" />;
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'optimization': return <TrendingUp className="w-4 h-4 text-primary" />;
      case 'alert': return <AlertCircle className="w-4 h-4 text-destructive" />;
      case 'trend': return <BarChart3 className="w-4 h-4 text-secondary" />;
      case 'opportunity': return <Activity className="w-4 h-4 text-success" />;
      default: return <Database className="w-4 h-4" />;
    }
  };

  const getInsightColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'border-l-destructive bg-destructive/5';
      case 'medium': return 'border-l-warning bg-warning/5';
      case 'low': return 'border-l-muted bg-muted/5';
      default: return 'border-l-muted';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const formatNextSync = (timestamp: string) => {
    const diff = new Date(timestamp).getTime() - Date.now();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `in ${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `in ${hours}h`;
  };

  const fetchSyncStatus = async (integration: IntegrationData) => {
    const IntegrationClass = integrationClassRegistry[integration.slug];
    if (!IntegrationClass) return;
    setStatusLoading(prev => ({ ...prev, [integration.slug]: true }));
    setStatusError(prev => ({ ...prev, [integration.slug]: '' }));
    try {
      const instance = new IntegrationClass();
      const status = await instance.getSyncStatus(user!.id);
      setSyncStatuses(prev => ({ ...prev, [integration.slug]: status }));
    } catch (err) {
      setStatusError(prev => ({ ...prev, [integration.slug]: err instanceof Error ? err.message : 'Failed to fetch status' }));
    } finally {
      setStatusLoading(prev => ({ ...prev, [integration.slug]: false }));
    }
  };

  useEffect(() => {
    if (user?.id && integrationData.length > 0) {
      integrationData.forEach(integration => {
        fetchSyncStatus(integration);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, integrationData.length]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Loading integration data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Integration Data Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor data collection and insights from your connected services
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchIntegrationData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh All
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Integrations</p>
                    <p className="text-2xl font-bold">
                      {integrationData.filter(i => i.status === 'active').length}
                    </p>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-success" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Data Points</p>
                    <p className="text-2xl font-bold">
                      {integrationData.reduce((sum, i) => sum + i.dataPoints.total, 0).toLocaleString()}
                    </p>
                  </div>
                  <Database className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">This Month</p>
                    <p className="text-2xl font-bold">
                      {integrationData.reduce((sum, i) => sum + i.dataPoints.thisMonth, 0).toLocaleString()}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-success" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">AI Insights</p>
                    <p className="text-2xl font-bold">{insights.length}</p>
                  </div>
                  <Activity className="w-8 h-8 text-secondary" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Recent AI Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {insights.slice(0, 3).map((insight) => (
                  <div
                    key={insight.id}
                    className={`p-4 border-l-4 rounded-r-lg ${getInsightColor(insight.impact)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        {getInsightIcon(insight.type)}
                        <div className="flex-1">
                          <h4 className="font-medium">{insight.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {insight.type}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {insight.impact} impact
                            </Badge>
                          </div>
                        </div>
                      </div>
                      {insight.actionable && (
                        <Button size="sm" variant="outline">
                          Take Action
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <div className="grid gap-6">
            {integrationData.map((integration) => (
              <Card key={integration.id} className="overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 rounded-lg bg-muted">
                        {getIntegrationIcon(integration.slug)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{integration.name}</CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          {getStatusIcon(integration.status)}
                          <Badge variant="outline" className={getStatusColor(integration.status)}>
                            {integration.status}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            Last sync: {formatTimeAgo(integration.lastSync)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRefreshIntegration(integration.id)}
                        disabled={refreshing === integration.id}
                      >
                        {refreshing === integration.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleManualSync(integration)}
                        disabled={syncing === integration.slug}
                      >
                        {syncing === integration.slug ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                        <span className="ml-2">Manual Sync</span>
                      </Button>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Sync Progress */}
                  {integration.status === 'syncing' && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Sync Progress</span>
                        <span>{integration.syncProgress}%</span>
                      </div>
                      <Progress value={integration.syncProgress} />
                    </div>
                  )}

                  {/* Error Messages */}
                  {integration.errors && integration.errors.length > 0 && (
                    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4 text-destructive" />
                        <span className="text-sm font-medium text-destructive">Issues Detected</span>
                      </div>
                      <ul className="text-sm text-destructive mt-1 ml-6">
                        {integration.errors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Data Points */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <div className="text-lg font-bold">{integration.dataPoints.total.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Total Records</div>
                    </div>
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <div className="text-lg font-bold">{integration.dataPoints.thisWeek.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">This Week</div>
                    </div>
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <div className="text-lg font-bold">{integration.dataPoints.thisMonth.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">This Month</div>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {integration.metrics.map((metric, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="text-sm text-muted-foreground">{metric.label}</div>
                            <div className="text-lg font-semibold">{metric.value}</div>
                          </div>
                          {metric.change && (
                            <div className={`text-sm flex items-center ${
                              metric.trend === 'up' ? 'text-success' : 
                              metric.trend === 'down' ? 'text-destructive' : 'text-muted-foreground'
                            }`}>
                              {metric.trend === 'up' && <TrendingUp className="w-3 h-3 mr-1" />}
                              {metric.change}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Next Sync */}
                  <div className="text-sm text-muted-foreground">
                    Next sync: {formatNextSync(integration.nextSync)}
                  </div>

                  {syncError && syncing === integration.slug && (
                    <div className="text-red-500 text-xs mt-1">{syncError}</div>
                  )}

                  <div className="flex flex-col space-y-1">
                    <div className="flex space-x-2">
                      {/* ... existing buttons ... */}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {statusLoading[integration.slug] ? (
                        <span>Loading sync status...</span>
                      ) : statusError[integration.slug] ? (
                        <span className="text-red-500">{statusError[integration.slug]}</span>
                      ) : syncStatuses[integration.slug] ? (
                        <>
                          <span>Status: <b>{syncStatuses[integration.slug].status}</b></span>{' | '}
                          <span>Last: {syncStatuses[integration.slug].lastSyncedAt ? new Date(syncStatuses[integration.slug].lastSyncedAt).toLocaleString() : 'Never'}</span>{' | '}
                          <span>Next: {syncStatuses[integration.slug].nextSyncAt ? new Date(syncStatuses[integration.slug].nextSyncAt).toLocaleString() : 'N/A'}</span>{' | '}
                          <span>Data Points: {syncStatuses[integration.slug].dataPointsSynced}</span>
                          {syncStatuses[integration.slug].error && (
                            <span className="text-red-500 ml-2">Error: {syncStatuses[integration.slug].error}</span>
                          )}
                        </>
                      ) : (
                        <span>No sync status available</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {/* Client Intelligence Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Client Intelligence
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                AI-powered client insights from unified integration data
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-primary/5 rounded-lg">
                  <div className="text-2xl font-bold text-primary">247</div>
                  <div className="text-sm text-muted-foreground">Unified Profiles</div>
                </div>
                <div className="text-center p-4 bg-success/5 rounded-lg">
                  <div className="text-2xl font-bold text-success">$1.2M</div>
                  <div className="text-sm text-muted-foreground">Total Client Value</div>
                </div>
                <div className="text-center p-4 bg-warning/5 rounded-lg">
                  <div className="text-2xl font-bold text-warning">12</div>
                  <div className="text-sm text-muted-foreground">Active Opportunities</div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => window.location.href = '/integrations/client-intelligence'}
                  className="flex-1"
                >
                  <Users className="w-4 h-4 mr-2" />
                  View Client Intelligence Dashboard
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    // Trigger client intelligence refresh
                    fetch('https://automate.marcoby.net/webhook/client-intelligence-monitor', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        user_id: user?.id,
                        company_id: user?.company_id,
                        trigger_type: 'manual'
                      })
                    });
                  }}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Intelligence
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Existing Insights */}
          <div className="space-y-4">
            {insights.map((insight) => (
              <Card key={insight.id}>
                <CardContent className="p-6">
                  <div className={`border-l-4 pl-4 ${getInsightColor(insight.impact)}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        {getInsightIcon(insight.type)}
                        <div className="flex-1">
                          <h3 className="font-semibold">{insight.title}</h3>
                          <p className="text-muted-foreground mt-1">{insight.description}</p>
                          <div className="flex items-center space-x-2 mt-3">
                            <Badge variant="outline">{insight.type}</Badge>
                            <Badge variant="outline">{insight.impact} impact</Badge>
                            <span className="text-sm text-muted-foreground">
                              {formatTimeAgo(insight.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      {insight.actionable && (
                        <Button>Take Action</Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Integration Performance Analytics</CardTitle>
              <div className="flex space-x-2">
                {(['week', 'month', 'quarter'] as const).map((timeframe) => (
                  <Button
                    key={timeframe}
                    variant={selectedTimeframe === timeframe ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTimeframe(timeframe)}
                  >
                    {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                  <p>Integration analytics charts would be rendered here</p>
                  <p className="text-sm">Showing data for: {selectedTimeframe}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IntegrationDataDashboard;