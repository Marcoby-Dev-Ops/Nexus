import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { Progress } from '@/shared/components/ui/Progress';
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Clock,
  Database,
  BarChart3,
  Settings,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '@/hooks/index';

interface IntegrationStatus {
  id: string;
  name: string;
  category: string;
  status: 'connected' | 'disconnected' | 'error' | 'syncing';
  lastSync: string;
  syncStatus: 'success' | 'error' | 'pending';
  dataPoints: number;
  syncFrequency: string;
  uptime: number;
  performance: number;
}

interface SyncHistory {
  id: string;
  integrationId: string;
  integrationName: string;
  timestamp: string;
  status: 'success' | 'error' | 'partial';
  recordsProcessed: number;
  recordsFailed: number;
  duration: number;
  errorMessage?: string;
}

interface DashboardMetrics {
  totalIntegrations: number;
  connectedIntegrations: number;
  errorIntegrations: number;
  totalDataPoints: number;
  averageUptime: number;
  averagePerformance: number;
  syncsToday: number;
  failedSyncsToday: number;
}

const IntegrationsDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);
  const [syncHistory, setSyncHistory] = useState<SyncHistory[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalIntegrations: 0,
    connectedIntegrations: 0,
    errorIntegrations: 0,
    totalDataPoints: 0,
    averageUptime: 0,
    averagePerformance: 0,
    syncsToday: 0,
    failedSyncsToday: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API calls
      const mockIntegrations: IntegrationStatus[] = [
        {
          id: '1',
          name: 'Microsoft 365',
          category: 'Productivity',
          status: 'connected',
          lastSync: '2024-01-16T10:30:00Z',
          syncStatus: 'success',
          dataPoints: 15420,
          syncFrequency: 'Every 15 minutes',
          uptime: 99.8,
          performance: 95.2
        },
        {
          id: '2',
          name: 'Salesforce',
          category: 'CRM',
          status: 'error',
          lastSync: '2024-01-15T14:20:00Z',
          syncStatus: 'error',
          dataPoints: 8920,
          syncFrequency: 'Every hour',
          uptime: 87.5,
          performance: 62.1
        },
        {
          id: '3',
          name: 'QuickBooks',
          category: 'Finance',
          status: 'syncing',
          lastSync: '2024-01-16T11:45:00Z',
          syncStatus: 'pending',
          dataPoints: 5670,
          syncFrequency: 'Every 30 minutes',
          uptime: 98.9,
          performance: 88.7
        },
        {
          id: '4',
          name: 'HubSpot',
          category: 'Marketing',
          status: 'connected',
          lastSync: '2024-01-16T11:30:00Z',
          syncStatus: 'success',
          dataPoints: 12340,
          syncFrequency: 'Every hour',
          uptime: 99.2,
          performance: 91.5
        }
      ];

      const mockSyncHistory: SyncHistory[] = [
        {
          id: '1',
          integrationId: '1',
          integrationName: 'Microsoft 365',
          timestamp: '2024-01-16T10:30:00Z',
          status: 'success',
          recordsProcessed: 1250,
          recordsFailed: 0,
          duration: 45
        },
        {
          id: '2',
          integrationId: '2',
          integrationName: 'Salesforce',
          timestamp: '2024-01-16T10:00:00Z',
          status: 'error',
          recordsProcessed: 0,
          recordsFailed: 150,
          duration: 120,
          errorMessage: 'Authentication failed'
        },
        {
          id: '3',
          integrationId: '4',
          integrationName: 'HubSpot',
          timestamp: '2024-01-16T11:30:00Z',
          status: 'success',
          recordsProcessed: 890,
          recordsFailed: 0,
          duration: 32
        },
        {
          id: '4',
          integrationId: '3',
          integrationName: 'QuickBooks',
          timestamp: '2024-01-16T11:45:00Z',
          status: 'partial',
          recordsProcessed: 450,
          recordsFailed: 12,
          duration: 78
        }
      ];

      const mockMetrics: DashboardMetrics = {
        totalIntegrations: 4,
        connectedIntegrations: 2,
        errorIntegrations: 1,
        totalDataPoints: 42350,
        averageUptime: 96.4,
        averagePerformance: 84.4,
        syncsToday: 24,
        failedSyncsToday: 3
      };

      setIntegrations(mockIntegrations);
      setSyncHistory(mockSyncHistory);
      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncNow = async (integrationId: string) => {
    try {
      // TODO: Implement actual sync logic
      setIntegrations(prev => prev.map(integration => 
        integration.id === integrationId 
          ? { ...integration, status: 'syncing' as const, syncStatus: 'pending' as const }
          : integration
      ));
      
      // Simulate sync completion
      setTimeout(() => {
        setIntegrations(prev => prev.map(integration => 
          integration.id === integrationId 
            ? { 
                ...integration, 
                status: 'connected' as const, 
                syncStatus: 'success' as const,
                lastSync: new Date().toISOString()
              }
            : integration
        ));
      }, 3000);
    } catch (error) {
      console.error('Error syncing integration:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-800';
      case 'disconnected': return 'bg-gray-100 text-gray-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'syncing': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSyncStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending': return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Integrations Dashboard</h1>
          <p className="text-gray-600 mt-2">Monitor your connected applications and data sync status</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/integrations/data-point-mapping'}
            className="flex items-center gap-2"
          >
            <Database className="h-4 w-4" />
            Data Point Mapping
          </Button>
          <Button onClick={loadDashboardData} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected Integrations</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.connectedIntegrations}/{metrics.totalIntegrations}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.errorIntegrations} with errors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Data Points</CardTitle>
            <Database className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.totalDataPoints)}</div>
            <p className="text-xs text-muted-foreground">
              Across all integrations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Uptime</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.averageUptime}%</div>
            <p className="text-xs text-muted-foreground">
              {metrics.averagePerformance}% performance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Syncs Today</CardTitle>
            <Activity className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.syncsToday}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.failedSyncsToday} failed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Integration Status and Sync History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Integration Status */}
        <Card>
          <CardHeader>
            <CardTitle>Integration Status</CardTitle>
            <CardDescription>Current status of all connected integrations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {integrations.map((integration) => (
                <div key={integration.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{integration.name}</h3>
                      <Badge className={getStatusColor(integration.status)}>
                        {integration.status.charAt(0).toUpperCase() + integration.status.slice(1)}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                      <div>
                        <span>Data Points: {formatNumber(integration.dataPoints)}</span>
                      </div>
                      <div>
                        <span>Uptime: {integration.uptime}%</span>
                      </div>
                      <div>
                        <span>Performance: {integration.performance}%</span>
                      </div>
                      <div>
                        <span>Sync: {integration.syncFrequency}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>Last sync: {new Date(integration.lastSync).toLocaleString()}</span>
                      {getSyncStatusIcon(integration.syncStatus)}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleSyncNow(integration.id)}
                      disabled={integration.status === 'syncing'}
                    >
                      {integration.status === 'syncing' ? 'Syncing...' : 'Sync Now'}
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sync History */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Sync History</CardTitle>
            <CardDescription>Latest synchronization activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {syncHistory.map((sync) => (
                <div key={sync.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{sync.integrationName}</h4>
                      <Badge 
                        variant={sync.status === 'success' ? 'default' : sync.status === 'error' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {sync.status.charAt(0).toUpperCase() + sync.status.slice(1)}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(sync.timestamp).toLocaleString()} • {formatDuration(sync.duration)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatNumber(sync.recordsProcessed)} processed
                      {sync.recordsFailed > 0 && (
                        <span className="text-red-600 ml-2">{formatNumber(sync.recordsFailed)} failed</span>
                      )}
                    </div>
                    {sync.errorMessage && (
                      <div className="text-xs text-red-600 mt-1">
                        Error: {sync.errorMessage}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Overview */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Performance Overview</CardTitle>
          <CardDescription>Integration performance metrics and trends</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {integrations.map((integration) => (
              <div key={integration.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{integration.name}</h4>
                  <span className="text-sm text-gray-500">{integration.performance}%</span>
                </div>
                <Progress value={integration.performance} className="h-2" />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Uptime: {integration.uptime}%</span>
                  <span>{formatNumber(integration.dataPoints)} data points</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IntegrationsDashboardPage; 
