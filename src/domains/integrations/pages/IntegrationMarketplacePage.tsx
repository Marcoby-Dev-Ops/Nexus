import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Input } from '@/shared/components/ui/Input';
import { 
  ArrowLeft,
  Search, 
  Building2, 
  Mail, 
  Calendar,
  HardDrive,
  MessageSquare,
  Star,
  Zap,
  Users,
  BarChart3,
  Grid3X3,
  List,
  ChevronRight,
  CheckCircle2,
  Settings
} from 'lucide-react';
import GoogleWorkspaceSetup from '@/domains/integrations/components/GoogleWorkspaceSetup';
import MicrosoftTeamsSetup from '@/domains/integrations/components/MicrosoftTeamsSetup';
import { HubSpotSetup } from '@/domains/integrations/components/HubSpotSetup';
import { useAuthContext } from '@/domains/admin/user/hooks/AuthContext';
import { supabase } from '@/core/supabase';

interface MarketplaceIntegration {
  id: string;
  name: string;
  provider: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  difficulty: 'Easy' | 'Medium' | 'Advanced';
  setupTime: string;
  features: string[];
  isPopular?: boolean;
  setupComponent?: React.ComponentType<any>;
  isConnected?: boolean;
  connectionStatus?: 'connected' | 'disconnected' | 'error';
}

const marketplaceIntegrations: MarketplaceIntegration[] = [
  {
    id: 'microsoft-365',
    name: 'Microsoft 365',
    provider: 'Microsoft',
    description: 'Connect your Microsoft 365 account to access Outlook, Teams, OneDrive, SharePoint, and comprehensive productivity insights.',
    category: 'Productivity',
    icon: <Building2 className="h-8 w-8 text-blue-600" />,
    difficulty: 'Easy',
    setupTime: '5 minutes',
    features: ['Email Intelligence', 'Calendar Integration', 'Teams Collaboration', 'OneDrive & SharePoint', 'Document Analysis', 'RAG Support', 'Unified Analytics'],
    isPopular: true,
    setupComponent: MicrosoftTeamsSetup
  },

  {
    id: 'google-workspace',
    name: 'Google Workspace',
    provider: 'Google',
    description: 'Integrate with Gmail, Google Calendar, Drive, and other Google Workspace tools.',
    category: 'Productivity',
    icon: <Mail className="h-8 w-8 text-red-500" />,
    difficulty: 'Easy',
    setupTime: '5 minutes',
    features: ['Gmail Integration', 'Calendar Sync', 'Drive Access', 'Meet Integration'],
    isPopular: true,
    setupComponent: GoogleWorkspaceSetup
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    provider: 'Dropbox',
    description: 'Access and analyze your Dropbox files and folders for better file management.',
    category: 'Storage',
    icon: <HardDrive className="h-8 w-8 text-blue-500" />,
    difficulty: 'Easy',
    setupTime: '3 minutes',
    features: ['File Access', 'Storage Analytics', 'Team Collaboration', 'Version History']
  },
  {
    id: 'slack',
    name: 'Slack',
    provider: 'Slack',
    description: 'Integrate with your Slack workspace for communication insights and automation.',
    category: 'Communication',
    icon: <MessageSquare className="h-8 w-8 text-purple-600" />,
    difficulty: 'Medium',
    setupTime: '10 minutes',
    features: ['Message Analytics', 'Channel Insights', 'Bot Integration', 'Workflow Automation']
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    provider: 'Salesforce',
    description: 'Connect your Salesforce CRM for comprehensive sales and customer insights.',
    category: 'CRM',
    icon: <Users className="h-8 w-8 text-blue-700" />,
    difficulty: 'Advanced',
    setupTime: '15 minutes',
    features: ['Lead Management', 'Sales Analytics', 'Customer Insights', 'Pipeline Tracking']
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    provider: 'HubSpot',
    description: 'Integrate with HubSpot for marketing automation and customer relationship management.',
    category: 'CRM',
    icon: <BarChart3 className="h-8 w-8 text-orange-600" />,
    difficulty: 'Medium',
    setupTime: '8 minutes',
    features: ['Marketing Analytics', 'Lead Tracking', 'Email Campaigns', 'Customer Journey'],
    isPopular: true,
    setupComponent: HubSpotSetup
  }
];

const categories = ['All', 'Productivity', 'Storage', 'Communication', 'CRM', 'Analytics', 'Finance'];

const IntegrationMarketplacePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedIntegration, setSelectedIntegration] = useState<MarketplaceIntegration | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [connectedIntegrations, setConnectedIntegrations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch user's connected integrations
  useEffect(() => {
    if (user?.id) {
      fetchConnectedIntegrations();
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  const fetchConnectedIntegrations = async () => {
    try {
      setLoading(true);
      
      const { data: userIntegrations, error } = await supabase
        .from('user_integrations')
        .select('integration_name, status')
        .eq('user_id', user?.id || '')
        .eq('status', 'active');

      if (error) {
        console.error('Error fetching connected integrations:', error);
        setConnectedIntegrations([]);
      } else {
        const connectedNames = (userIntegrations || []).map(integration => 
          (integration.integration_name || '').toLowerCase().replace(/\s+/g, '-')
        );
        setConnectedIntegrations(connectedNames);
      }
    } catch (error) {
      console.error('Error fetching connected integrations:', error);
      setConnectedIntegrations([]);
    } finally {
      setLoading(false);
    }
  };

  // Update marketplace integrations with connection status
  const marketplaceIntegrationsWithStatus: MarketplaceIntegration[] = marketplaceIntegrations.map(integration => {
    // Check if this integration is connected by matching names
    const isConnected = connectedIntegrations.some(connectedName => {
      // Handle different naming conventions
      const marketplaceName = (integration.name || '').toLowerCase().replace(/\s+/g, '-');
      const marketplaceId = integration.id;
      
      return connectedName === marketplaceName || 
             connectedName === marketplaceId ||
             connectedName === (integration.name || '').toLowerCase() ||
             connectedName === (integration.name || '').toLowerCase().replace(/\s+/g, '');
    });
    
    return {
      ...integration,
      isConnected,
      connectionStatus: isConnected ? 'connected' : 'disconnected'
    };
  });

  // Filter integrations based on search and category
  const filteredIntegrations = marketplaceIntegrationsWithStatus.filter(integration => {
    const matchesSearch = integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         integration.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         integration.provider.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || integration.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleIntegrationSelect = (integration: MarketplaceIntegration) => {
    if (integration.isConnected) {
      // If already connected, navigate to settings or dashboard
      navigate('/integrations');
      return;
    }

    setSelectedIntegration(integration);
    if (integration.setupComponent) {
      setShowSetup(true);
    } else {
      // For integrations without setup components, navigate to API learning
      navigate('/integrations/api-learning');
    }
  };

  const handleSetupComplete = (_integrationData: any) => {
    setShowSetup(false);
    setSelectedIntegration(null);
    // Refresh connected integrations
    fetchConnectedIntegrations();
    // Navigate back to main integrations page
    navigate('/integrations');
  };

  const handleSetupCancel = () => {
    setShowSetup(false);
    setSelectedIntegration(null);
  };

  const getConnectionBadge = (integration: MarketplaceIntegration) => {
    if (integration.isConnected) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1 bg-green-100 text-green-800 border-green-200">
          <CheckCircle2 className="h-3 w-3" />
          Connected
        </Badge>
      );
    }
    return null;
  };

  const getActionButton = (integration: MarketplaceIntegration) => {
    if (integration.isConnected) {
      return (
        <Button variant="outline" size="sm" className="w-full">
          <Settings className="h-4 w-4 mr-2" />
          Manage
        </Button>
      );
    }
    return (
      <Button className="w-full" size="sm">
        <Zap className="h-4 w-4 mr-2" />
        Connect
      </Button>
    );
  };

  if (showSetup && selectedIntegration?.setupComponent) {
    const SetupComponent = selectedIntegration.setupComponent;
    return (
      <div className="space-y-6">
        {/* Header with back button */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleSetupCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Marketplace
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Setup {selectedIntegration.name}</h1>
            <p className="text-muted-foreground">Configure your {selectedIntegration.name} integration</p>
          </div>
        </div>

        {/* Setup Component */}
        <SetupComponent 
          onComplete={handleSetupComplete}
          onCancel={handleSetupCancel}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/integrations')}
              className="h-auto p-1 hover:bg-transparent"
            >
              Integrations
            </Button>
            <ChevronRight className="h-4 w-4" />
            <span>Marketplace</span>
          </div>
          <h1 className="text-3xl font-bold">Integration Marketplace</h1>
          <p className="text-muted-foreground">
            Connect your business tools and unlock powerful automation capabilities
          </p>
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search integrations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Category Filters */}
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="text-sm font-medium"
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Popular Integrations */}
      {!loading && selectedCategory === 'All' && searchTerm === '' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            <h2 className="text-xl font-semibold">Popular Integrations</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredIntegrations
              .filter(integration => integration.isPopular)
              .map((integration) => (
                <Card 
                  key={integration.id} 
                  className={`hover:shadow-md transition-shadow cursor-pointer ${
                    integration.isConnected ? 'border-green-200 bg-green-50/50' : ''
                  }`}
                  onClick={() => handleIntegrationSelect(integration)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      {integration.icon}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{integration.name}</CardTitle>
                          {getConnectionBadge(integration)}
                        </div>
                        <p className="text-sm text-muted-foreground">{integration.provider}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary">{integration.category}</Badge>
                          <Badge variant="outline">{integration.difficulty}</Badge>
                          <span className="text-xs text-muted-foreground">{integration.setupTime}</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground mb-3">{integration.description}</p>
                    {getActionButton(integration)}
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* All Integrations */}
      {!loading && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {searchTerm ? `Search Results (${filteredIntegrations.length})` : 'All Integrations'}
            </h2>
            <span className="text-sm text-muted-foreground">
              {connectedIntegrations.length} connected
            </span>
          </div>
          
          {filteredIntegrations.length === 0 ? (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No integrations found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search terms or category filter
              </p>
            </div>
          ) : (
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              : "space-y-4"
            }>
              {filteredIntegrations.map((integration) => {
                const cardClassName = `hover:shadow-md transition-shadow cursor-pointer ${
                  viewMode === 'list' ? 'flex flex-row' : ''
                } ${
                  integration.isConnected ? 'border-green-200 bg-green-50/50' : ''
                }`;
                
                return (
                  <Card 
                    key={integration.id} 
                    className={cardClassName}
                    onClick={() => handleIntegrationSelect(integration)}
                  >
                  <CardHeader className={viewMode === 'list' ? 'flex-shrink-0 w-48' : 'pb-3'}>
                    <div className="flex items-start gap-3">
                      {integration.icon}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{integration.name}</CardTitle>
                          {getConnectionBadge(integration)}
                        </div>
                        <p className="text-sm text-muted-foreground">{integration.provider}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Badge variant="secondary">{integration.category}</Badge>
                          <Badge 
                            variant={integration.difficulty === 'Easy' ? 'default' : 
                                    integration.difficulty === 'Medium' ? 'secondary' : 'secondary'}
                            className={integration.difficulty === 'Advanced' ? 'bg-orange-100 text-orange-800 border-orange-200' : ''}
                          >
                            {integration.difficulty}
                          </Badge>
                          {integration.isPopular && (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                              <Star className="h-3 w-3 mr-1" />
                              Popular
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className={`${viewMode === 'list' ? 'flex-1 pt-6' : 'pt-0'}`}>
                    <p className="text-sm text-muted-foreground mb-3">{integration.description}</p>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        Setup time: {integration.setupTime}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {integration.features.slice(0, 3).map((feature, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                        {integration.features.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{integration.features.length - 3} more
                          </Badge>
                        )}
                      </div>
                      {getActionButton(integration)}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default IntegrationMarketplacePage; 