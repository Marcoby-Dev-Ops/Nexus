import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Progress } from '@/shared/components/ui/Progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { useAuth } from '@/hooks/index';
import { selectData as select, selectOne, insertOne, updateOne, deleteOne, callEdgeFunction } from '@/lib/api-client';
import { authentikAuthService } from '@/core/auth/authentikAuthServiceInstance';
import { consolidatedIntegrationService, type IntegrationDataSummary } from '@/services/integrations/consolidatedIntegrationService';

import { toast } from 'sonner';
import Microsoft365Setup from '@/components/integrations/Microsoft365Setup';
import { GoogleWorkspaceSetup } from '@/components/integrations/GoogleWorkspaceSetup';
import SlackSetup from '@/components/integrations/SlackSetup';
import PayPalSetup from '@/components/integrations/PayPalSetup';
import QuickBooksSetup from '@/components/integrations/QuickBooksSetup';
import StripeFinancialSetup from '@/components/integrations/StripeFinancialSetup';
import GoogleAnalyticsSetup from '@/components/integrations/GoogleAnalyticsSetup';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  Globe,
  Users,
  Mail,
  Calendar,
  FileText,
  BarChart3,
  Plus,
  Search,
  RefreshCw,
  TrendingUp,
  Database,
  Activity,
  Zap,
  Shield,
  Star,
  ArrowRight,
  Settings,
  XCircle,
  DollarSign,
  Calculator,
  CreditCard
} from 'lucide-react';

// Import setup components
// Inline setup components removed from this page – users will use the marketplace



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
        setupComponent?: React.ComponentType<Record<string, unknown>>;
  authType: 'oauth' | 'api_key';
  setupTime: string;
  isPopular?: boolean;
  dataFields: string[];
}

const IntegrationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'inactive' | 'error'>('all');
  const [integrationStatus, setIntegrationStatus] = useState<IntegrationStatus[]>([]);
  const [systemLoading, setSystemLoading] = useState(true);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<AvailableIntegration | null>(null);
  
  // Enhanced data analytics state
  const [dataSummaries, setDataSummaries] = useState<IntegrationDataSummary[]>([]);
  const [totalDataPoints, setTotalDataPoints] = useState(0);
  const [dataGrowthRate, setDataGrowthRate] = useState(0);
  const [activeDataStreams, setActiveDataStreams] = useState(0);

  // Available integrations that can be connected
  const availableIntegrations: AvailableIntegration[] = [
    {
      id: 'microsoft-365',
      name: 'Microsoft 365',
      provider: 'Microsoft',
              description: 'Connect your Microsoft 365 account for Email, Calendar, Teams, OneDrive, SharePoint, and comprehensive productivity insights.',
      category: 'Productivity',
      icon: <Globe className="h-6 w-6 text-primary" />,
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
      icon: <Mail className="h-6 w-6 text-destructive" />,
      setupComponent: GoogleWorkspaceSetup,
      authType: 'oauth',
      setupTime: '5 minutes',
      isPopular: true,
      dataFields: ['emails', 'calendarEvents', 'files', 'contacts', 'analytics', 'docs', 'tasks']
    },
    {
      id: 'google-analytics',
      name: 'Google Analytics',
      provider: 'Google',
      description: 'Connect Google Analytics for website traffic, marketing performance, and user behavior insights.',
      category: 'Analytics',
      icon: <BarChart3 className="h-6 w-6 text-blue-600" />,
      setupComponent: GoogleAnalyticsSetup,
      authType: 'oauth',
      setupTime: '5 minutes',
      isPopular: true,
      dataFields: ['pageViews', 'sessions', 'users', 'trafficSources', 'conversions', 'goals', 'events']
    },
    {
      id: 'dropbox',
      name: 'Dropbox',
      provider: 'Dropbox',
      description: 'Access and analyze your Dropbox files and folders for better file management.',
      category: 'Storage',
      icon: <Database className="h-6 w-6 text-primary" />,
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
      icon: <Activity className="h-6 w-6 text-secondary" />,
      setupComponent: SlackSetup,
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
      icon: <Zap className="h-6 w-6 text-blue-400" />,
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
      isPopular: true,
      dataFields: ['contacts', 'companies', 'deals', 'tickets', 'emails', 'calls']
    },
    {
      id: 'notion',
      name: 'Notion',
      provider: 'Notion',
      description: 'Integrate Notion for docs, wikis, and project management.',
      category: 'Productivity',
      icon: <FileText className="h-6 w-6 text-foreground" />,
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
      icon: <Globe className="h-6 w-6 text-pink-500" />,
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
      icon: <Globe className="h-6 w-6 text-primary" />,
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
      icon: <Users className="h-6 w-6 text-foreground" />,
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
      icon: <Mail className="h-6 w-6 text-success" />,
      authType: 'oauth',
      setupTime: '6 minutes',
      dataFields: ['tickets', 'users', 'conversations', 'organizations']
    },
    {
      id: 'paypal',
      name: 'PayPal',
      provider: 'PayPal',
      description: 'Connect your PayPal account to manage transactions and track payment history.',
      category: 'Finance',
      icon: <Zap className="h-6 w-6 text-success" />,
      setupComponent: PayPalSetup,
      authType: 'oauth',
      setupTime: '5 minutes',
      isPopular: true,
      dataFields: ['transactions', 'invoices', 'refunds', 'payouts']
    },
    {
      id: 'quickbooks',
      name: 'QuickBooks',
      provider: 'Intuit',
      description: 'Connect QuickBooks for comprehensive accounting, invoicing, and financial reporting.',
      category: 'Finance',
      icon: <Calculator className="h-6 w-6 text-blue-600" />,
      setupComponent: QuickBooksSetup,
      authType: 'oauth',
      setupTime: '5 minutes',
      isPopular: true,
      dataFields: ['revenue', 'expenses', 'invoices', 'accounts', 'reports']
    },
    {
      id: 'stripe-financial',
      name: 'Stripe Financial Data',
      provider: 'Stripe',
      description: 'Connect Stripe for transaction data, revenue analytics, and payment insights.',
      category: 'Finance',
      icon: <CreditCard className="h-6 w-6 text-purple-600" />,
      setupComponent: StripeFinancialSetup,
      authType: 'oauth',
      setupTime: '5 minutes',
      isPopular: true,
      dataFields: ['transactions', 'revenue', 'customers', 'payments', 'analytics']
    },
    {
      id: 'google-analytics',
      name: 'Google Analytics',
      provider: 'Google',
      description: 'Connect your Google Analytics account to track website traffic and user behavior.',
      category: 'Analytics',
      icon: <BarChart3 className="h-6 w-6 text-destructive" />,
      setupComponent: GoogleAnalyticsSetup,
      authType: 'oauth',
      setupTime: '5 minutes',
      isPopular: true,
      dataFields: ['websiteTraffic', 'userBehavior', 'conversionRate', 'bounceRate']
    }
  ];



  useEffect(() => {
    if (user?.id) {
      fetchIntegrationStatus();
    } else {
      // If no user, set loading to false and empty status
      setSystemLoading(false);
      setIntegrationStatus([]);
    }
  }, [user?.id]);

  const fetchIntegrationStatus = async () => {
    try {
      setSystemLoading(true);
      
       
     
    // eslint-disable-next-line no-console
    console.log('🔄 Fetching integration status for user: ', user!.id);
      
      // Get basic integration status
      const { data: userIntegrations, error } = await consolidatedIntegrationService.getUserIntegrations(user!.id);

      if (error) {
         
     
    // eslint-disable-next-line no-console
    console.error('❌ Failed to fetch integration status: ', error);
        setIntegrationStatus([]);
        return;
      }

      // Get enhanced data analytics - use available method
      const { data: userIntegrationsData, error: dataError } = await consolidatedIntegrationService.getUserIntegrationDataSummaries(user!.id);
      if (dataError) {
        throw new Error(dataError);
      }
      const dataSummaries = userIntegrationsData || [];
      setDataSummaries(dataSummaries);

      // Calculate total data points and growth
      const totalPoints = dataSummaries.reduce((sum, summary) => sum + (summary.data?.totalDataPoints || 0), 0);
      setTotalDataPoints(totalPoints);

      // Calculate growth rate (simplified - average of all integrations)
      const avgGrowth = dataSummaries.length > 0 
        ? dataSummaries.reduce((sum, summary) => sum + (summary.data?.dataPointTrends?.length > 0 ? 1 : 0), 0) / dataSummaries.length: 0;
      setDataGrowthRate(avgGrowth);

      // Count active data streams
      const activeStreams = dataSummaries.filter(summary => summary.status === 'active').length;
      setActiveDataStreams(activeStreams);

      // Get real data point counts for each integration
      const statusDataPromises = (userIntegrations || []).map(async (__integration: Record<string, unknown>) => {
        try {
          // Find corresponding data summary
          const dataSummary = dataSummaries.find(summary => summary.integrationId === __integration.id);
          
          // Get integration details from the integrations table
          let integrationName = 'Unknown Integration';
          let integrationCategory = 'general';
          
                     if (__integration.integration_slug) {
             const { data: integrationDetails } = await select(
               'integrations',
               'name',
               { slug: __integration.integration_slug }
             );
            
                         if (integrationDetails && integrationDetails.length > 0) {
               integrationName = integrationDetails[0].name || 'Unknown Integration';
               // Use a default category since the column doesn't exist
               integrationCategory = 'general';
             }
          }
          
          return {
            id: __integration.id,
            name: integrationName,
            status: __integration.status,
            lastSync: __integration.updated_at,
            category: integrationCategory,
            description: `Integration: ${integrationName}`,
            dataPoints: dataSummary?.data?.totalDataPoints || 0 // Use real count from data service
          };
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Error processing integration: ', __integration.id, error);
          return {
            id: __integration.id,
            name: 'Unknown Integration',
            status: __integration.status,
            lastSync: __integration.updated_at,
            category: 'general',
            description: 'Integration: Unknown',
            dataPoints: 0 // Fallback to 0 if error
          };
        }
      });

      const statusData = await Promise.all(statusDataPromises);
      setIntegrationStatus(statusData);
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' && error.message.includes('Session expired')) {
        toast.error('Your session has expired. Please log in again.');
        // Optionally, redirect to login page:
        // window.location.href = '/login';
      } else {
         
     
    // eslint-disable-next-line no-console
    console.error('Error fetching integration status: ', error);
      setIntegrationStatus([]);
      }
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
      default: return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
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
      default: return 'bg-muted text-muted-foreground border-muted';
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

  const handleSetupComplete = async (__integrationData: Record<string, unknown>) => {
    try {
      // The setup component should handle saving to the database
      // Here we just refresh the status and close the modal
      await fetchIntegrationStatus();
      setShowSetupModal(false);
      setSelectedIntegration(null);
      
      // Show success message
       
     
    // eslint-disable-next-line no-console
    console.log('Integration setup completed: ', __integrationData);
    } catch (error) {
       
     
    // eslint-disable-next-line no-console
    console.error('Error handling setup completion: ', error);
    }
  };

  const handleSetupCancel = () => {
    setShowSetupModal(false);
    setSelectedIntegration(null);
  };

  const handleDisconnectIntegration = async (integrationId: string, integrationName: string) => {
    if (!user?.id) return;
    
    if (!confirm(`Are you sure you want to disconnect ${integrationName}? This will remove all associated data and tokens.`)) {
      return;
    }

    try {
      setSystemLoading(true);
      
      // Find the integration to get the platform slug
      const integration = integrationStatus.find(i => i.id === integrationId);
      if (!integration) {
        toast.error('Integration not found');
        return;
      }

      // Get the integration slug from the user integration data
      const { data: userIntegrations } = await consolidatedIntegrationService.getUserIntegrations(user.id);
      const userIntegration = userIntegrations?.find(ui => ui.id === integrationId);
      
      if (!userIntegration?.integration_slug) {
        toast.error('Integration platform not found');
        return;
      }

      // Disconnect the integration using the service
      const { error } = await consolidatedIntegrationService.disconnectIntegration(user.id, userIntegration.integration_slug);

      if (error) {
        // eslint-disable-next-line no-console
        console.error('Error disconnecting integration: ', error);
        toast.error('Failed to disconnect integration');
        return;
      }

      // Refresh the integration status
      await fetchIntegrationStatus();
      
      toast.success(`${integrationName} disconnected successfully`);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error disconnecting integration: ', error);
      toast.error('Failed to disconnect integration');
    } finally {
      setSystemLoading(false);
    }
  };

  const activeIntegrations = integrationStatus.filter(i => i.status === 'active').length;
  const totalIntegrations = integrationStatus.length;
  const healthScore = totalIntegrations > 0 ? Math.round((activeIntegrations / totalIntegrations) * 100) : 0;




  // Data analysis functions


  // Debug authentication
  const handleTestAuth = async () => {
    try {
      const result = await testAuthenticationFlow();
       
     
    // eslint-disable-next-line no-console
    console.log('🔍 Authentication test result: ', result);
      
      if (result.error) {
        toast.error(`Authentication failed: ${result.error}`);
      } else {
        toast.success('Authentication test completed - check console for details');
      }
    } catch (error) {
       
     
    // eslint-disable-next-line no-console
    console.error('Error testing authentication: ', error);
      toast.error('Failed to test authentication');
    }
  };

  if (systemLoading) {
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm: flex-row sm:items-center sm:justify-between gap-4">
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
          <Button variant="outline" onClick={handleTestAuth}>
            <Database className="w-4 h-4 mr-2" />
            Test Auth
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
              <Globe className="h-8 w-8 text-primary" />
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

      {/* Enhanced Data Analytics */}
      {totalDataPoints > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Data Points</p>
                  <p className="text-2xl font-bold">{totalDataPoints.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">
                    {dataGrowthRate > 0 ? '+' : ''}{dataGrowthRate.toFixed(1)}% this month
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
                  <p className="text-sm text-muted-foreground">Active Data Streams</p>
                  <p className="text-2xl font-bold">{activeDataStreams}</p>
                  <p className="text-xs text-muted-foreground">
                    {integrationStatus.filter(i => i.status === 'active').length} integrations
                  </p>
                </div>
                <Activity className="w-8 h-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Data Growth</p>
                  <p className="text-2xl font-bold">
                    {dataGrowthRate > 0 ? '+' : ''}{dataGrowthRate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">Monthly average</p>
                </div>
                <TrendingUp className="w-8 h-8 text-warning" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Data Types</p>
                  <p className="text-2xl font-bold">
                    {dataSummaries.reduce((sum, summary) => 
                      sum + Object.keys(summary.dataPoints.dataPointsByType).length, 0
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">Different data types</p>
                </div>
                <Zap className="w-8 h-8 text-secondary" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Data Analytics Details */}
      {dataSummaries.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Data Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dataSummaries.map((summary) => (
                <div key={summary.integrationId} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium">{summary.integrationName}</h4>
                      <p className="text-sm text-muted-foreground">
                        {summary.dataPoints.totalDataPoints.toLocaleString()} data points
                      </p>
                    </div>
                    <Badge variant={summary.status === 'active' ? 'default' : 'secondary'}>
                      {summary.status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Today</p>
                      <p className="font-medium">{summary.dataPoints.dataPointsByTimePeriod.today}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">This Week</p>
                      <p className="font-medium">{summary.dataPoints.dataPointsByTimePeriod.thisWeek}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">This Month</p>
                      <p className="font-medium">{summary.dataPoints.dataPointsByTimePeriod.thisMonth}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Growth</p>
                      <p className={`font-medium ${
                        summary.dataPoints.dataPointTrends.length > 0 ? 'text-success' : 'text-destructive'
                      }`}>
                        {summary.dataPoints.dataPointTrends.length > 0 ? '+' : ''}
                        {summary.dataPoints.dataPointTrends.length > 0 ? '1.0' : '0.0'}%
                      </p>
                    </div>
                  </div>

                  {/* Top Data Points */}
                  {summary.dataPoints.topDataPoints.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm text-muted-foreground mb-2">Top Data Points: </p>
                      <div className="flex flex-wrap gap-2">
                        {summary.dataPoints.topDataPoints.slice(0, 3).map((dataPoint: any) => (
                          <Badge key={dataPoint.id} variant="outline" className="text-xs">
                            {dataPoint.name} ({dataPoint.count})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filter */}
      <div className="flex flex-col sm: flex-row gap-4">
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
              <CardContent className="space-y-4">
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
              <CardContent className="space-y-4">
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

          {/* Marketplace CTA replacing local available integrations list */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="h-5 w-5 mr-2" />
                Explore Integrations
              </CardTitle>
              <CardDescription>
                Browse the marketplace to connect integrations and unlock more automation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <Button variant="outline" onClick={() => navigate('/integrations/marketplace')}>
                  Browse Marketplace
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="connected" className="space-y-6">
          {integrationStatus.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Globe className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
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
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDisconnectIntegration(integration.id, integration.name)}
                          disabled={systemLoading}
                        >
                          <XCircle className="w-4 h-4" />
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
