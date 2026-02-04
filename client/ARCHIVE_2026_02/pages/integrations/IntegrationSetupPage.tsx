import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { Input } from '@/shared/components/ui/Input';
import { Label } from '@/shared/components/ui/Label';
import { Switch } from '@/shared/components/ui/Switch';
import { 
  Settings, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Plus,
  ExternalLink,
  Key,
  Database,
  Mail,
  Calendar,
  MessageSquare,
  FileText,
  Users,
  Building2
} from 'lucide-react';
import { useAuth } from '@/hooks/index';

interface Integration {
  id: string;
  name: string;
  description: string;
  category: 'communication' | 'productivity' | 'crm' | 'finance' | 'marketing' | 'development';
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  icon: string;
  apiKey?: string;
  baseUrl?: string;
  lastSync?: string;
  syncStatus: 'success' | 'error' | 'pending';
  features: string[];
  setupRequired: boolean;
}

const IntegrationSetupPage: React.FC = () => {
  const { user } = useAuth();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [showSetupModal, setShowSetupModal] = useState(false);

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API calls
      const mockIntegrations: Integration[] = [
        {
          id: '1',
          name: 'Microsoft 365',
          description: 'Connect to Outlook, Teams, and Office applications',
          category: 'productivity',
          status: 'connected',
          icon: 'microsoft',
          lastSync: '2024-01-16T10:30:00Z',
          syncStatus: 'success',
          features: ['Email Sync', 'Calendar Integration', 'File Sharing'],
          setupRequired: false
        },
        {
          id: '2',
          name: 'Slack',
          description: 'Team communication and collaboration platform',
          category: 'communication',
          status: 'disconnected',
          icon: 'slack',
          features: ['Message Sync', 'Channel Integration', 'Bot Integration'],
          setupRequired: true
        },
        {
          id: '3',
          name: 'Salesforce',
          description: 'Customer relationship management platform',
          category: 'crm',
          status: 'error',
          icon: 'salesforce',
          lastSync: '2024-01-15T14:20:00Z',
          syncStatus: 'error',
          features: ['Contact Sync', 'Lead Management', 'Opportunity Tracking'],
          setupRequired: false
        },
        {
          id: '4',
          name: 'QuickBooks',
          description: 'Financial management and accounting software',
          category: 'finance',
          status: 'pending',
          icon: 'quickbooks',
          features: ['Invoice Sync', 'Expense Tracking', 'Financial Reports'],
          setupRequired: true
        },
        {
          id: '5',
          name: 'HubSpot',
          description: 'Marketing, sales, and service platform',
          category: 'marketing',
          status: 'disconnected',
          icon: 'hubspot',
          features: ['Lead Management', 'Email Marketing', 'Analytics'],
          setupRequired: true
        },
        {
          id: '6',
          name: 'GitHub',
          description: 'Code repository and version control platform',
          category: 'development',
          status: 'disconnected',
          icon: 'github',
          features: ['Repository Sync', 'Issue Tracking', 'Code Review'],
          setupRequired: true
        }
      ];

      setIntegrations(mockIntegrations);
    } catch (error) {
      console.error('Error loading integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (integration: Integration) => {
    setSelectedIntegration(integration);
    setShowSetupModal(true);
  };

  const handleDisconnect = async (integrationId: string) => {
    try {
      // TODO: Implement actual disconnect logic
      setIntegrations(prev => prev.map(integration => 
        integration.id === integrationId 
          ? { ...integration, status: 'disconnected' as const }
          : integration
      ));
    } catch (error) {
      console.error('Error disconnecting integration:', error);
    }
  };

  const handleSync = async (integrationId: string) => {
    try {
      // TODO: Implement actual sync logic
      setIntegrations(prev => prev.map(integration => 
        integration.id === integrationId 
          ? { 
              ...integration, 
              syncStatus: 'pending' as const,
              lastSync: new Date().toISOString()
            }
          : integration
      ));
      
      // Simulate sync completion
      setTimeout(() => {
        setIntegrations(prev => prev.map(integration => 
          integration.id === integrationId 
            ? { 
                ...integration, 
                syncStatus: 'success' as const,
                lastSync: new Date().toISOString()
              }
            : integration
        ));
      }, 2000);
    } catch (error) {
      console.error('Error syncing integration:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-800';
      case 'disconnected': return 'bg-gray-100 text-gray-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSyncStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'communication': return <MessageSquare className="h-5 w-5" />;
      case 'productivity': return <Settings className="h-5 w-5" />;
      case 'crm': return <Users className="h-5 w-5" />;
      case 'finance': return <Database className="h-5 w-5" />;
      case 'marketing': return <Building2 className="h-5 w-5" />;
      case 'development': return <FileText className="h-5 w-5" />;
      default: return <Settings className="h-5 w-5" />;
    }
  };

  const categories = [
    { id: 'all', name: 'All Integrations', icon: <Settings className="h-4 w-4" /> },
    { id: 'communication', name: 'Communication', icon: <MessageSquare className="h-4 w-4" /> },
    { id: 'productivity', name: 'Productivity', icon: <Settings className="h-4 w-4" /> },
    { id: 'crm', name: 'CRM', icon: <Users className="h-4 w-4" /> },
    { id: 'finance', name: 'Finance', icon: <Database className="h-4 w-4" /> },
    { id: 'marketing', name: 'Marketing', icon: <Building2 className="h-4 w-4" /> },
    { id: 'development', name: 'Development', icon: <FileText className="h-4 w-4" /> }
  ];

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
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
          <h1 className="text-3xl font-bold text-gray-900">Integration Setup</h1>
          <p className="text-gray-600 mt-2">Connect and configure your business applications</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Integration
        </Button>
      </div>

      {/* Integration Categories */}
      <div className="mb-8">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            {categories.map((category) => (
              <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-2">
                {category.icon}
                <span className="hidden md:inline">{category.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          
          {categories.map((category) => (
            <TabsContent key={category.id} value={category.id}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {integrations
                  .filter(integration => category.id === 'all' || integration.category === category.id)
                  .map((integration) => (
                    <Card key={integration.id} className="relative">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getCategoryIcon(integration.category)}
                            <div>
                              <CardTitle className="text-lg">{integration.name}</CardTitle>
                              <CardDescription>{integration.description}</CardDescription>
                            </div>
                          </div>
                          <Badge className={getStatusColor(integration.status)}>
                            {integration.status.charAt(0).toUpperCase() + integration.status.slice(1)}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium text-sm text-gray-700 mb-2">Features</h4>
                            <div className="flex flex-wrap gap-1">
                              {integration.features.map((feature, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {feature}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {integration.lastSync && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-500">Last Sync:</span>
                              <div className="flex items-center gap-2">
                                {getSyncStatusIcon(integration.syncStatus)}
                                <span>{new Date(integration.lastSync).toLocaleDateString()}</span>
                              </div>
                            </div>
                          )}

                          <div className="flex gap-2">
                            {integration.status === 'connected' ? (
                              <>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleSync(integration.id)}
                                  className="flex-1"
                                >
                                  Sync Now
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleDisconnect(integration.id)}
                                  className="flex-1"
                                >
                                  Disconnect
                                </Button>
                              </>
                            ) : (
                              <Button 
                                onClick={() => handleConnect(integration)}
                                className="flex-1"
                                disabled={integration.status === 'pending'}
                              >
                                {integration.status === 'pending' ? 'Connecting...' : 'Connect'}
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Setup Modal */}
      {showSetupModal && selectedIntegration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Setup {selectedIntegration.name}</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowSetupModal(false)}
              >
                ×
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="apiKey">API Key</Label>
                <Input 
                  id="apiKey" 
                  type="password" 
                  placeholder="Enter your API key"
                  className="mt-1"
                />
              </div>
              
              {selectedIntegration.baseUrl && (
                <div>
                  <Label htmlFor="baseUrl">Base URL</Label>
                  <Input 
                    id="baseUrl" 
                    placeholder="Enter base URL"
                    className="mt-1"
                  />
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <Switch id="autoSync" />
                <Label htmlFor="autoSync">Enable auto-sync</Label>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowSetupModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button className="flex-1">
                  Connect
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntegrationSetupPage; 
