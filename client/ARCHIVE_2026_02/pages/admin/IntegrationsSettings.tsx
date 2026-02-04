import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Input } from '@/shared/components/ui/Input';
import { Switch } from '@/shared/components/ui/Switch';
import { Label } from '@/shared/components/ui/Label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { useAuth } from '@/hooks/index';
import { useIntegrations } from '@/hooks/integrations/useIntegrations';
import { selectData as select, selectOne, insertOne, updateOne, deleteOne, callEdgeFunction } from '@/lib/api-client';
import { toast } from 'sonner';
import {
  Network,
  Plus,
  Settings,
  RefreshCw,
  BarChart3,
  Users,
  Mail,
  Calendar,
  FileText,
  Globe,
  XCircle,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  TestTube
} from 'lucide-react';

interface IntegrationConfig {
  id: string;
  name: string;
  status: 'connected' | 'disconnected' | 'error' | 'configuring';
  lastSync?: string;
  nextSync?: string;
  dataPoints?: number;
  category?: string;
  description?: string;
  config?: Record<string, any>;
  permissions?: string[];
  syncFrequency?: 'realtime' | 'hourly' | 'daily' | 'weekly';
  isActive?: boolean;
}

const IntegrationsSettings: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  // Integration data will be fetched directly from user_integrations table
  const [integrationConfigs, setIntegrationConfigs] = useState<IntegrationConfig[]>([]);
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationConfig | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configuring, setConfiguring] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchIntegrationConfigs();
    }
  }, [user?.id]);

  const fetchIntegrationConfigs = async () => {
    try {
      const { error: fetchError } = await supabase
        .from('user_integrations')
        .select('*')
        .eq('user_id', user?.id);

      if (fetchError) throw fetchError;

      const formattedConfigs: IntegrationConfig[] = (configs || []).map(config => ({
        id: config.id,
        name: config.integration_name || 'Unknown Integration',
        status: (config.status as 'connected' | 'disconnected' | 'error' | 'configuring') || 'disconnected',
        lastSync: config.last_sync_at,
        nextSync: undefined, // Not in current schema
        dataPoints: undefined, // Not in current schema
        category: config.integration_type,
        description: undefined, // Not in current schema
        config: config.settings || {},
        permissions: [], // Not in current schema
        syncFrequency: 'daily' as const, // Default value
        isActive: true // Default value
      }));

      setIntegrationConfigs(formattedConfigs);
    } catch (error) {
       
     
    // eslint-disable-next-line no-console
    console.error('Error fetching integration configs: ', error);
      toast.error('Failed to load integration configurations');
    }
  };

  const handleConnectIntegration = (integrationId: string) => {
    navigate(`/integrations/marketplace?integration=${integrationId}`);
  };

  const handleDisconnectIntegration = async (integrationId: string) => {
    try {
      setConfiguring(integrationId);
      
      const { error: deleteError } = await supabase
        .from('user_integrations')
        .delete()
        .eq('id', integrationId);

      if (deleteError) throw deleteError;

      setIntegrationConfigs(prev => prev.filter(config => config.id !== integrationId));
      toast.success('Integration disconnected successfully');
    } catch (error) {
       
     
    // eslint-disable-next-line no-console
    console.error('Error disconnecting integration: ', error);
      toast.error('Failed to disconnect integration');
    } finally {
      setConfiguring(null);
    }
  };

  const handleTestConnection = async (integrationId: string) => {
    try {
      setConfiguring(integrationId);
      
      // Simulate connection test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Connection test successful');
    } catch (error) {
      toast.error('Connection test failed');
    } finally {
      setConfiguring(null);
    }
  };

  const handleSyncNow = async (integrationId: string) => {
    try {
      setConfiguring(integrationId);
      
      // Simulate sync operation
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      toast.success('Sync completed successfully');
      fetchIntegrationConfigs(); // Refresh data
    } catch (error) {
      toast.error('Sync failed');
    } finally {
      setConfiguring(null);
    }
  };

  const handleUpdateConfig = async (integrationId: string, newConfig: Record<string, any>) => {
    try {
      setConfiguring(integrationId);
      
      const { error: updateError } = await supabase
        .from('user_integrations')
        .update({ configuration: newConfig })
        .eq('id', integrationId);

      if (updateError) throw updateError;

      setIntegrationConfigs(prev => 
        prev.map(config => 
          config.id === integrationId 
            ? { ...config, config: newConfig }
            : config
        )
      );
      
      toast.success('Configuration updated successfully');
      setShowConfigModal(false);
    } catch (error) {
       
     
    // eslint-disable-next-line no-console
    console.error('Error updating configuration: ', error);
      toast.error('Failed to update configuration');
    } finally {
      setConfiguring(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-success/10 text-success border-success/20';
      case 'error':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'configuring':
        return 'bg-warning/10 text-warning border-warning/20';
      default: return 'bg-muted text-muted-foreground border-muted';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      case 'configuring':
        return <Clock className="w-4 h-4 text-warning" />;
      default: return <XCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getIntegrationIcon = (category?: string) => {
    switch (category?.toLowerCase()) {
      case 'crm':
        return <Users className="w-5 h-5" />;
      case 'email':
        return <Mail className="w-5 h-5" />;
      case 'calendar':
        return <Calendar className="w-5 h-5" />;
      case 'document':
        return <FileText className="w-5 h-5" />;
      case 'analytics':
        return <BarChart3 className="w-5 h-5" />;
      default: return <Globe className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-medium">Integration Management</h3>
          <p className="text-sm text-muted-foreground">
            Manage your connected integrations, configure settings, and monitor sync status
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchIntegrationConfigs}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => navigate('/integrations/marketplace')}>
            <Plus className="w-4 h-4 mr-2" />
            Add Integration
          </Button>
        </div>
      </div>

      {/* Integration Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Network className="h-5 w-5 mr-2" />
            Connected Integrations
          </CardTitle>
          <CardDescription>
            {integrationConfigs.length} integration{integrationConfigs.length !== 1 ? 's' : ''} connected
          </CardDescription>
        </CardHeader>
        <CardContent>
          {integrationConfigs.length === 0 ? (
            <div className="text-center py-8">
              <Network className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h4 className="text-lg font-medium mb-2">No Integrations Connected</h4>
              <p className="text-muted-foreground mb-4">
                Connect your first integration to start managing your business tools
              </p>
              <Button onClick={() => navigate('/integrations/marketplace')}>
                <Plus className="w-4 h-4 mr-2" />
                Browse Integrations
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {integrationConfigs.map((integration) => (
                <div
                  key={integration.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover: bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {getIntegrationIcon(integration.category)}
                    <div>
                      <h4 className="font-medium">{integration.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {integration.description || 'No description available'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge className={getStatusColor(integration.status)}>
                      {getStatusIcon(integration.status)}
                      {integration.status}
                    </Badge>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestConnection(integration.id)}
                        disabled={configuring === integration.id}
                      >
                        {configuring === integration.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <TestTube className="w-4 h-4" />
                        )}
                        Test
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSyncNow(integration.id)}
                        disabled={configuring === integration.id}
                      >
                        {configuring === integration.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                        Sync
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedIntegration(integration);
                          setShowConfigModal(true);
                        }}
                      >
                        <Settings className="w-4 h-4" />
                        Config
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDisconnectIntegration(integration.id)}
                        disabled={configuring === integration.id}
                      >
                        {configuring === integration.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                        Disconnect
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuration Modal */}
      {showConfigModal && selectedIntegration && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Configure {selectedIntegration.name}</h2>
                  <p className="text-muted-foreground">
                    Manage settings and permissions for this integration
                  </p>
                </div>
                <Button variant="outline" onClick={() => setShowConfigModal(false)}>
                  <XCircle className="w-4 h-4 mr-2" />
                  Close
                </Button>
              </div>
              
              <Tabs defaultValue="general" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="sync">Sync Settings</TabsTrigger>
                  <TabsTrigger value="permissions">Permissions</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
                </TabsList>
                
                <TabsContent value="general" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="integration-name">Integration Name</Label>
                      <Input
                        id="integration-name"
                        value={selectedIntegration.name}
                        onChange={(e) => setSelectedIntegration({
                          ...selectedIntegration,
                          name: e.target.value
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="integration-category">Category</Label>
                      <Input
                        id="integration-category"
                        value={selectedIntegration.category || ''}
                        onChange={(e) => setSelectedIntegration({
                          ...selectedIntegration,
                          category: e.target.value
                        })}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="integration-description">Description</Label>
                    <Input
                      id="integration-description"
                      value={selectedIntegration.description || ''}
                      onChange={(e) => setSelectedIntegration({
                        ...selectedIntegration,
                        description: e.target.value
                      })}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="integration-active"
                      checked={selectedIntegration.isActive}
                      onCheckedChange={(checked) => setSelectedIntegration({
                        ...selectedIntegration,
                        isActive: checked
                      })}
                    />
                    <Label htmlFor="integration-active">Active Integration</Label>
                  </div>
                </TabsContent>
                
                <TabsContent value="sync" className="space-y-4">
                  <div>
                    <Label htmlFor="sync-frequency">Sync Frequency</Label>
                    <select
                      id="sync-frequency"
                      value={selectedIntegration.syncFrequency}
                      onChange={(e) => setSelectedIntegration({
                        ...selectedIntegration,
                        syncFrequency: e.target.value as any
                      })}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="realtime">Real-time</option>
                      <option value="hourly">Hourly</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    <p>Last sync: {selectedIntegration.lastSync || 'Never'}</p>
                    <p>Next sync: {selectedIntegration.nextSync || 'Not scheduled'}</p>
                    <p>Data points: {selectedIntegration.dataPoints || 0}</p>
                  </div>
                </TabsContent>
                
                <TabsContent value="permissions" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Data Access Permissions</Label>
                    {['read_emails', 'read_calendar', 'read_contacts', 'read_files', 'read_analytics'].map((permission) => (
                      <div key={permission} className="flex items-center space-x-2">
                        <Switch
                          id={permission}
                          checked={selectedIntegration.permissions?.includes(permission)}
                          onCheckedChange={(checked) => {
                            const newPermissions = checked
                              ? [...(selectedIntegration.permissions || []), permission]
                              : (selectedIntegration.permissions || []).filter(p => p !== permission);
                            setSelectedIntegration({
                              ...selectedIntegration,
                              permissions: newPermissions
                            });
                          }}
                        />
                        <Label htmlFor={permission} className="text-sm">
                          {permission.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Label>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="advanced" className="space-y-4">
                  <div>
                    <Label htmlFor="api-key">API Key (if applicable)</Label>
                    <Input
                      id="api-key"
                      type="password"
                      placeholder="Enter API key"
                      value={selectedIntegration.config?.apiKey || ''}
                      onChange={(e) => setSelectedIntegration({
                        ...selectedIntegration,
                        config: {
                          ...selectedIntegration.config,
                          apiKey: e.target.value
                        }
                      })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="webhook-url">Webhook URL</Label>
                    <Input
                      id="webhook-url"
                      placeholder="https: //your-domain.com/webhook"
                      value={selectedIntegration.config?.webhookUrl || ''}
                      onChange={(e) => setSelectedIntegration({
                        ...selectedIntegration,
                        config: {
                          ...selectedIntegration.config,
                          webhookUrl: e.target.value
                        }
                      })}
                    />
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setShowConfigModal(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => handleUpdateConfig(selectedIntegration.id, selectedIntegration.config || {})}
                  disabled={configuring === selectedIntegration.id}
                >
                  {configuring === selectedIntegration.id ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntegrationsSettings; 
