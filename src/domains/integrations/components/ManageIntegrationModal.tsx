import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Input } from '@/shared/components/ui/Input';
import { Label } from '@/shared/components/ui/Label';
import { Textarea } from '@/shared/components/ui/Textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert';
import { Switch } from '@/shared/components/ui/Switch';
import { Separator } from '@/shared/components/ui/Separator';
import { ApiIntegrationService } from '@/domains/services/apiIntegrationService';
import {
  Settings,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Copy,
  Eye,
  EyeOff,
  Trash2,
  Save,
  Code,
  Database,
  Globe,
  Key,
  Clock,
  Activity,
  X
} from 'lucide-react';

interface ApiIntegration {
  id: string;
  name: string;
  description?: string;
  api_url: string;
  config?: {
    auth_methods?: string[];
    rate_limits?: any;
    endpoints?: any[];
  };
  metadata?: {
    endpoint_count?: number;
    auth_type?: string;
    rate_limit?: string;
    last_tested?: string;
  };
  generated_code?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ManageIntegrationModalProps {
  integration: ApiIntegration;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedIntegration: ApiIntegration) => void;
  onDelete: (integrationId: string) => void;
}

export const ManageIntegrationModal: React.FC<ManageIntegrationModalProps> = ({
  integration,
  isOpen,
  onClose,
  onUpdate,
  onDelete
}) => {
  const [activeTab, setActiveTab] = useState('settings');
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showCode, setShowCode] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: integration.name,
    description: integration.description || '',
    api_url: integration.api_url,
    is_active: integration.is_active,
    auth_config: {
      api_key: '',
      auth_header: 'Authorization',
      auth_prefix: 'Bearer '
    },
    sync_frequency: '5', // minutes
    enable_webhooks: false,
    webhook_url: '',
    rate_limit_requests: 100,
    rate_limit_window: 60 // seconds
  });

  useEffect(() => {
    if (integration) {
      setFormData({
        name: integration.name,
        description: integration.description || '',
        api_url: integration.api_url,
        is_active: integration.is_active,
        auth_config: {
          api_key: '',
          auth_header: 'Authorization',
          auth_prefix: 'Bearer '
        },
        sync_frequency: '5',
        enable_webhooks: false,
        webhook_url: '',
        rate_limit_requests: 100,
        rate_limit_window: 60
      });
    }
  }, [integration]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const updatedIntegration = await ApiIntegrationService.updateApiIntegration(integration.id, {
        name: formData.name,
        description: formData.description,
        api_url: formData.api_url,
        is_active: formData.is_active,
        config: {
          ...integration.config,
          auth_config: formData.auth_config,
          sync_frequency: formData.sync_frequency,
          enable_webhooks: formData.enable_webhooks,
          webhook_url: formData.webhook_url,
          rate_limits: {
            requests: formData.rate_limit_requests,
            window: formData.rate_limit_window
          }
        }
      });

      onUpdate(updatedIntegration);
      setActiveTab('settings');
    } catch (error) {
      console.error('Failed to update integration:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResults(null);

    try {
      const result = await ApiIntegrationService.testApiIntegration(integration.id);
      setTestResults(result);
      setActiveTab('testing');
    } catch (error) {
      setTestResults({
        success: false,
        error: 'Failed to run test',
        details: error
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete the integration "${integration.name}"? This action cannot be undone.`)) {
      setIsLoading(true);
      try {
        await ApiIntegrationService.deleteApiIntegration(integration.id);
        onDelete(integration.id);
        onClose();
      } catch (error) {
        console.error('Failed to delete integration:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Manage {integration.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Configure settings, test connectivity, and manage your API integration
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="px-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="settings">Settings</TabsTrigger>
                <TabsTrigger value="authentication">Authentication</TabsTrigger>
                <TabsTrigger value="testing">Testing</TabsTrigger>
                <TabsTrigger value="code">Generated Code</TabsTrigger>
              </TabsList>
            </div>

            <div className="px-6 pb-6 max-h-[60vh] overflow-y-auto">
              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Integration Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="My API Integration"
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe what this integration does..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="api_url">API Base URL</Label>
                      <Input
                        id="api_url"
                        value={formData.api_url}
                        onChange={(e) => setFormData(prev => ({ ...prev, api_url: e.target.value }))}
                        placeholder="https://api.example.com/v1"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="is_active">Active Integration</Label>
                      <Switch
                        id="is_active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="sync_frequency">Sync Frequency (minutes)</Label>
                      <Input
                        id="sync_frequency"
                        type="number"
                        value={formData.sync_frequency}
                        onChange={(e) => setFormData(prev => ({ ...prev, sync_frequency: e.target.value }))}
                        min="1"
                        max="1440"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Rate Limiting</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="rate_requests" className="text-xs">Requests</Label>
                          <Input
                            id="rate_requests"
                            type="number"
                            value={formData.rate_limit_requests}
                            onChange={(e) => setFormData(prev => ({ ...prev, rate_limit_requests: parseInt(e.target.value) }))}
                            min="1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="rate_window" className="text-xs">Window (sec)</Label>
                          <Input
                            id="rate_window"
                            type="number"
                            value={formData.rate_limit_window}
                            onChange={(e) => setFormData(prev => ({ ...prev, rate_limit_window: parseInt(e.target.value) }))}
                            min="1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enable_webhooks">Enable Webhooks</Label>
                    <Switch
                      id="enable_webhooks"
                      checked={formData.enable_webhooks}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enable_webhooks: checked }))}
                    />
                  </div>

                  {formData.enable_webhooks && (
                    <div>
                      <Label htmlFor="webhook_url">Webhook URL</Label>
                      <Input
                        id="webhook_url"
                        value={formData.webhook_url}
                        onChange={(e) => setFormData(prev => ({ ...prev, webhook_url: e.target.value }))}
                        placeholder="https://your-app.com/webhooks/api-integration"
                      />
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Authentication Tab */}
              <TabsContent value="authentication" className="space-y-6 mt-6">
                <Alert>
                  <Key className="h-4 w-4" />
                  <AlertDescription>
                    Configure authentication settings for your API integration. These credentials are securely encrypted.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="auth_header">Authorization Header</Label>
                    <Input
                      id="auth_header"
                      value={formData.auth_config.auth_header}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        auth_config: { ...prev.auth_config, auth_header: e.target.value }
                      }))}
                      placeholder="Authorization"
                    />
                  </div>

                  <div>
                    <Label htmlFor="auth_prefix">Authorization Prefix</Label>
                    <Input
                      id="auth_prefix"
                      value={formData.auth_config.auth_prefix}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        auth_config: { ...prev.auth_config, auth_prefix: e.target.value }
                      }))}
                      placeholder="Bearer "
                    />
                  </div>

                  <div>
                    <Label htmlFor="api_key">API Key</Label>
                    <div className="flex gap-2">
                      <Input
                        id="api_key"
                        type={showApiKey ? 'text' : 'password'}
                        value={formData.auth_config.api_key}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          auth_config: { ...prev.auth_config, api_key: e.target.value }
                        }))}
                        placeholder="Enter your API key"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Integration Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Auth Type:</span>
                      <span className="ml-2">{integration.metadata?.auth_type || 'API Key'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Endpoints:</span>
                      <span className="ml-2">{integration.metadata?.endpoint_count || 0}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Rate Limit:</span>
                      <span className="ml-2">{integration.metadata?.rate_limit || 'Not specified'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Last Tested:</span>
                      <span className="ml-2">{integration.metadata?.last_tested ? new Date(integration.metadata.last_tested).toLocaleDateString() : 'Never'}</span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Testing Tab */}
              <TabsContent value="testing" className="space-y-6 mt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">Connection Testing</h3>
                    <p className="text-sm text-muted-foreground">
                      Test your API integration to ensure it's working correctly
                    </p>
                  </div>
                  <Button onClick={handleTest} disabled={isTesting}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${isTesting ? 'animate-spin' : ''}`} />
                    {isTesting ? 'Testing...' : 'Run Test'}
                  </Button>
                </div>

                {testResults && (
                  <Alert className={testResults.success ? 'border-success' : 'border-destructive'}>
                    {testResults.success ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    )}
                    <AlertDescription>
                      <div className="space-y-2">
                        <div className="font-medium">
                          {testResults.success ? 'Test Successful!' : 'Test Failed'}
                        </div>
                        {testResults.message && (
                          <div className="text-sm">{testResults.message}</div>
                        )}
                        {testResults.error && (
                          <div className="text-sm text-destructive">{testResults.error}</div>
                        )}
                        {testResults.response_time && (
                          <div className="text-sm">
                            Response time: {testResults.response_time}ms
                          </div>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Globe className="h-4 w-4 text-primary" />
                        <span className="font-medium">Connectivity</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Test basic API connectivity</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Key className="h-4 w-4 text-warning" />
                        <span className="font-medium">Authentication</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Verify API key validity</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="h-4 w-4 text-success" />
                        <span className="font-medium">Performance</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Check response times</p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Generated Code Tab */}
              <TabsContent value="code" className="space-y-6 mt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">Generated Integration Code</h3>
                    <p className="text-sm text-muted-foreground">
                      TypeScript service code generated for this integration
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCode(!showCode)}
                    >
                      {showCode ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                      {showCode ? 'Hide' : 'Show'} Code
                    </Button>
                    {integration.generated_code && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(integration.generated_code!)}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Code
                      </Button>
                    )}
                  </div>
                </div>

                {showCode && integration.generated_code && (
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <pre className="text-sm overflow-x-auto">
                      <code>{integration.generated_code}</code>
                    </pre>
                  </div>
                )}

                {!integration.generated_code && (
                  <Alert>
                    <Code className="h-4 w-4" />
                    <AlertDescription>
                      No generated code available for this integration. Code generation may have failed during creation.
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>

        <div className="flex items-center justify-between p-6 border-t">
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Integration
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}; 