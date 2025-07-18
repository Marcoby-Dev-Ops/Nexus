import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from '@/shared/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Input } from '@/shared/components/ui/Input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { Progress } from '@/shared/components/ui/Progress';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert';
import { useAuth } from '@/domains/admin/user/hooks/AuthContext';
import { useIntegrations } from '@/domains/integrations/features/hooks/useIntegrations';
import { supabase } from "@/core/supabase";
import {
  Network,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Settings,
  RefreshCw,
  ExternalLink,
  Zap,
  Shield,
  Database,
  BarChart3,
  Users,
  Mail,
  Calendar,
  FileText,
  Globe,
  Key,
  Brain,
  ArrowRight,
  Star,
  TrendingUp,
  Activity,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  MessageSquare,
  Building2,
  HardDrive,
  XCircle
} from 'lucide-react';

// Import setup components
import GoogleWorkspaceSetup from '@/domains/integrations/features/components/GoogleWorkspaceSetup';
import Microsoft365Setup from '@/domains/integrations/features/components/Microsoft365Setup';

interface IntegrationStatus {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'error' | 'setup';
  lastSync?: string;
  nextSync?: string;
  dataPoints?: number;
  category?: string;
  description?: string;
}

interface AvailableIntegration {
  id: string;
  name: string;
  provider: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  setupComponent?: React.ComponentType<any>;
  authType: 'oauth' | 'api_key';
  setupTime: string;
  isPopular?: boolean;
  dataFields: string[];
}

const IntegrationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { integrations, isLoading, error, refreshIntegrations } = useIntegrations();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'inactive' | 'error'>('all');
  const [integrationStatus, setIntegrationStatus] = useState<IntegrationStatus[]>([]);
  const [systemLoading, setSystemLoading] = useState(true);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<AvailableIntegration | null>(null);

  // Available integrations that can be connected
  const availableIntegrations: AvailableIntegration[] = [
    {
      id: 'microsoft-365',
      name: 'Microsoft 365',
      provider: 'Microsoft',
      description: 'Connect your Microsoft 365 account for Email, Calendar, Teams, OneDrive, SharePoint, and more.',
      category: 'Productivity',
      icon: <Building2 className="h-6 w-6 text-blue-600" />,
      setupComponent: Microsoft365Setup,
      authType: 'oauth',
      setupTime: '5 minutes',
      isPopular: true,
      dataFields: ['emails', 'calendarEvents', 'files', 'contacts', 'teamsMessages', 'tasks', 'notes', 'analytics']
    },
    {
      id: 'google-workspace',
      name: 'Google Workspace',
      provider: 'Google',
      description: 'Integrate with Gmail, Google Calendar, Drive, and other Google Workspace tools.',
      category: 'Productivity',
      icon: <Mail className="h-6 w-6 text-red-500" />,
      setupComponent: GoogleWorkspaceSetup,
      authType: 'oauth',
      setupTime: '5 minutes',
      isPopular: true,
      dataFields: ['emails', 'calendarEvents', 'files', 'contacts', 'analytics', 'docs', 'tasks']
    },
    {
      id: 'dropbox',
      name: 'Dropbox',
      provider: 'Dropbox',
      description: 'Access and analyze your Dropbox files and folders for better file management.',
      category: 'Storage',
      icon: <HardDrive className="h-6 w-6 text-blue-500" />,
      authType: 'oauth',
      setupTime: '3 minutes',
      dataFields: ['files', 'folders', 'sharedLinks']
    },
    {
      id: 'slack',
      name: 'Slack',
      provider: 'Slack',
      description: 'Integrate with your Slack workspace for communication insights and automation.',
      category: 'Communication',
      icon: <MessageSquare className="h-6 w-6 text-purple-600" />,
      authType: 'oauth',
      setupTime: '10 minutes',
      dataFields: ['messages', 'channels', 'users', 'files']
    },
    // --- Placeholders for future integrations ---
    {
      id: 'salesforce',
      name: 'Salesforce',
      provider: 'Salesforce',
      description: 'Sync CRM data, contacts, leads, and opportunities from Salesforce.',
      category: 'CRM',
      icon: <Database className="h-6 w-6 text-blue-400" />,
      authType: 'oauth',
      setupTime: '8 minutes',
      dataFields: ['contacts', 'leads', 'accounts', 'opportunities', 'tasks', 'notes']
    },
    {
      id: 'hubspot',
      name: 'HubSpot',
      provider: 'HubSpot',
      description: 'Connect HubSpot for marketing, sales, and CRM automation.',
      category: 'CRM',
      icon: <Zap className="h-6 w-6 text-orange-500" />,
      authType: 'oauth',
      setupTime: '7 minutes',
      dataFields: ['contacts', 'companies', 'deals', 'tickets', 'emails', 'calls']
    },
    {
      id: 'notion',
      name: 'Notion',
      provider: 'Notion',
      description: 'Integrate Notion for docs, wikis, and project management.',
      category: 'Productivity',
      icon: <FileText className="h-6 w-6 text-black" />,
      authType: 'oauth',
      setupTime: '4 minutes',
      dataFields: ['pages', 'databases', 'tasks', 'notes']
    },
    {
      id: 'asana',
      name: 'Asana',
      provider: 'Asana',
      description: 'Sync tasks, projects, and teams from Asana.',
      category: 'Productivity',
      icon: <Star className="h-6 w-6 text-pink-500" />,
      authType: 'oauth',
      setupTime: '4 minutes',
      dataFields: ['tasks', 'projects', 'teams', 'comments']
    },
    {
      id: 'trello',
      name: 'Trello',
      provider: 'Trello',
      description: 'Integrate Trello boards, cards, and lists for project management.',
      category: 'Productivity',
      icon: <Globe className="h-6 w-6 text-blue-700" />,
      authType: 'oauth',
      setupTime: '3 minutes',
      dataFields: ['boards', 'cards', 'lists', 'comments']
    },
    {
      id: 'github',
      name: 'GitHub',
      provider: 'GitHub',
      description: 'Connect GitHub for code, issues, and pull request analytics.',
      category: 'Development',
      icon: <Brain className="h-6 w-6 text-gray-800" />,
      authType: 'oauth',
      setupTime: '3 minutes',
      dataFields: ['repositories', 'commits', 'pullRequests', 'issues', 'comments']
    },
    {
      id: 'zendesk',
      name: 'Zendesk',
      provider: 'Zendesk',
      description: 'Integrate Zendesk for support tickets, users, and conversations.',
      category: 'Support',
      icon: <Key className="h-6 w-6 text-green-600" />,
      authType: 'oauth',
      setupTime: '6 minutes',
      dataFields: ['tickets', 'users', 'conversations', 'organizations']
    }
  ];

  useEffect(() => {
    if (user?.id) {
      fetchIntegrationStatus();
    }
  }, [user?.id]);

  const fetchIntegrationStatus = async () => {
    try {
      setSystemLoading(true);
      
      // Fetch user's connected integrations
      const { data: userIntegrations, error } = await supabase
        .from('user_integrations')
        .select(`
          id,
          status,
          updated_at,
          config,
          integrations!inner(
            id,
            name,
            slug,
            category,
            description
          )
        `)
        .eq('user_id', user!.id);

      if (error) throw error;

      const statusData: IntegrationStatus[] = userIntegrations.map((integration: any) => ({
        id: integration.id,
        name: integration.integrations.name,
        status: integration.status,
        lastSync: integration.updated_at,
        category: integration.integrations.category,
        description: integration.integrations.description,
        dataPoints: Math.floor(Math.random() * 1000) + 100 // Mock data
      }));

      setIntegrationStatus(statusData);
    } catch (error) {
      console.error('Error fetching integration status:', error);
    } finally {
      setSystemLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      case 'setup':
        return <Clock className="w-4 h-4 text-warning" />;
      default:
        return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success/10 text-success border-success/20';
      case 'error':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'setup':
        return 'bg-warning/10 text-warning border-warning/20';
      default:
        return 'bg-muted text-muted-foreground border-muted';
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
      default:
        return <Globe className="w-5 h-5" />;
    }
  };

  // Filter available integrations to exclude already connected ones
  const getUnconnectedIntegrations = () => {
    const connectedIds = integrationStatus.map(integration => integration.name.toLowerCase().replace(/\s+/g, '-'));
    return availableIntegrations.filter(integration => 
      !connectedIds.includes(integration.id) && 
      !connectedIds.includes(integration.name.toLowerCase().replace(/\s+/g, '-'))
    );
  };

  const handleConnectIntegration = (integration: AvailableIntegration) => {
    setSelectedIntegration(integration);
    if (integration.setupComponent) {
      setShowSetupModal(true);
    } else {
      // For integrations without setup components, navigate to API learning or marketplace
      navigate('/integrations/marketplace');
    }
  };

  const handleSetupComplete = async (integrationData: any) => {
    try {
      // The setup component should handle saving to the database
      // Here we just refresh the status and close the modal
      await fetchIntegrationStatus();
      setShowSetupModal(false);
      setSelectedIntegration(null);
      
      // Show success message
      console.log('Integration setup completed:', integrationData);
    } catch (error) {
      console.error('Error handling setup completion:', error);
    }
  };

  const handleSetupCancel = () => {
    setShowSetupModal(false);
    setSelectedIntegration(null);
  };

  const activeIntegrations = integrationStatus.filter(i => i.status === 'active').length;
  const totalIntegrations = integrationStatus.length;
  const healthScore = totalIntegrations > 0 ? Math.round((activeIntegrations / totalIntegrations) * 100) : 0;

  if (isLoading || systemLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Loading integrations...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Integrations</h1>
          <p className="text-muted-foreground">
            Connect your business tools and automate your workflow
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchIntegrationStatus}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => navigate('/integrations/marketplace')}>
            <Plus className="w-4 h-4 mr-2" />
            Browse Marketplace
          </Button>
          <Button onClick={() => navigate('/integrations/api-learning')}>
            <Plus className="w-4 h-4 mr-2" />
            Add Integration
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Connected</p>
                <p className="text-2xl font-bold">{activeIntegrations}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{totalIntegrations}</p>
              </div>
              <Network className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Health Score</p>
                <p className="text-2xl font-bold">{healthScore}%</p>
              </div>
              <Activity className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Data Points</p>
                <p className="text-2xl font-bold">
                  {integrationStatus.reduce((sum, i) => sum + (i.dataPoints || 0), 0).toLocaleString()}
                </p>
              </div>
              <Database className="h-8 w-8 text-info" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search integrations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'inactive', 'error'] as const).map((filter) => (
            <Button
              key={filter}
              variant={selectedFilter === filter ? 'default' : 'outline'}
              onClick={() => setSelectedFilter(filter)}
              className="capitalize"
            >
              {filter === 'all' ? 'All' : filter}
            </Button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="connected">Connected</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Health Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Integration Health
              </CardTitle>
              <CardDescription>
                Overall status and performance of your connected integrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Overall Health</span>
                  <Badge className={getStatusColor(healthScore >= 80 ? 'active' : healthScore >= 60 ? 'setup' : 'error')}>
                    {healthScore >= 80 ? 'Excellent' : healthScore >= 60 ? 'Good' : 'Needs Attention'}
                  </Badge>
                </div>
                <Progress value={healthScore} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {activeIntegrations} of {totalIntegrations} integrations are active and healthy
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="h-5 w-5 mr-2" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/integrations/marketplace')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Browse Marketplace
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/integrations/api-learning')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Custom Integration
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/integration-tracking')}>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Analytics
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={fetchIntegrationStatus}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Sync All Integrations
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Security & Permissions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">OAuth Tokens</span>
                  <Badge variant="outline" className="text-success">Secure</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">API Keys</span>
                  <Badge variant="outline" className="text-success">Encrypted</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Data Access</span>
                  <Badge variant="outline" className="text-success">Minimal</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Available Integrations */}
          {getUnconnectedIntegrations().length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Plus className="h-5 w-5 mr-2" />
                  Available Integrations
                </CardTitle>
                <CardDescription>
                  Connect these integrations to unlock more insights and automation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {getUnconnectedIntegrations().slice(0, 4).map((integration) => (
                    <div
                      key={integration.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {integration.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm">{integration.name}</h4>
                            {integration.isPopular && (
                              <Badge variant="secondary" className="text-xs">
                                <Star className="w-3 h-3 mr-1" />
                                Popular
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {integration.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {integration.authType === 'oauth' ? 'OAuth' : 'API Key'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {integration.setupTime}
                            </span>
                          </div>
                          {/* Data fields row */}
                          <div className="flex flex-wrap gap-1 mt-2 items-center">
                            <span className="text-xs text-muted-foreground mr-1">Data Mapped:</span>
                            {integration.dataFields.map((field) => (
                              <Badge key={field} variant="outline" className="text-2xs">
                                {field}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => handleConnectIntegration(integration)}
                        className="ml-4 flex-shrink-0"
                      >
                        Connect
                      </Button>
                    </div>
                  ))}
                </div>
                {getUnconnectedIntegrations().length > 4 && (
                  <div className="mt-4 text-center">
                    <Button variant="outline" onClick={() => navigate('/integrations/marketplace')}>
                      View All Available Integrations
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="connected" className="space-y-6">
          {integrationStatus.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Network className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Integrations Connected</h3>
                <p className="text-muted-foreground mb-4">
                  Connect your first integration to start automating your workflow
                </p>
                <Button onClick={() => navigate('/integrations/api-learning')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Integration
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {integrationStatus.map((integration) => (
                <Card key={integration.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 rounded-lg bg-muted">
                          {getIntegrationIcon(integration.category || "")}
                        </div>
                        <div>
                          <h3 className="font-medium">{integration.name}</h3>
                          <div className="flex items-center space-x-2 mt-1">
                            {getStatusIcon(integration.status)}
                            <Badge variant="outline" className={getStatusColor(integration.status)}>
                              {integration.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Settings className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Integration Analytics
              </CardTitle>
              <CardDescription>
                Performance and usage analytics for your integrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">Analytics Coming Soon</p>
                <p className="text-muted-foreground mb-4">
                  Detailed analytics and insights for your integrations will be available soon.
                </p>
                <Button variant="outline" onClick={() => navigate('/integration-tracking')}>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  View Basic Analytics
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Setup Modal */}
      {showSetupModal && selectedIntegration?.setupComponent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Setup {selectedIntegration.name}</h2>
                  <p className="text-muted-foreground">
                    Connect your {selectedIntegration.name} account to start getting insights
                  </p>
                </div>
                <Button variant="outline" onClick={handleSetupCancel}>
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
              
              <selectedIntegration.setupComponent
                onComplete={handleSetupComplete}
                onCancel={handleSetupCancel}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntegrationsPage; 