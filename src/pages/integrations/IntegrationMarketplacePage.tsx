import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card.tsx';
import { Button } from '@/shared/components/ui/Button.tsx';
import { Badge } from '@/shared/components/ui/Badge.tsx';
import { Input } from '@/shared/components/ui/Input.tsx';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';
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
  Settings,
  Plug,
  Shield,
  Globe,
  DollarSign,
  TrendingUp,
  Database,
  Code,
  Eye,
  Cloud
} from 'lucide-react';
import { useAuth } from '@/hooks/index';
import { adapterRegistry, type AdapterMetadata } from '@/core/adapters/adapterRegistry';
import { universalIntegrationService } from '@/core/services/universalIntegrationService';
import { supabase } from '@/lib/supabase';

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
  isConnected?: boolean;
  connectionStatus?: 'connected' | 'disconnected' | 'error';
  adapterMetadata: AdapterMetadata;
}

const IntegrationMarketplacePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(false);
  const [connectedIntegrations, setConnectedIntegrations] = useState<string[]>([]);
  const [selectedIntegration, setSelectedIntegration] = useState<MarketplaceIntegration | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  
  // Early return if user is not authenticated (after all hooks)
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Please log in to access the integration marketplace.
            </p>
            <Button onClick={() => navigate('/login')}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading state while data is being fetched
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading marketplace...</p>
        </div>
      </div>
    );
  }

  // Categories for filtering
  const categories = [
    'All',
    'CRM',
    'Payments',
    'Marketing',
    'Accounting',
    'Communication',
    'Analytics',
    'Productivity'
  ];

  // Get available adapters and convert to marketplace format
  const getMarketplaceIntegrations = (): MarketplaceIntegration[] => {
    try {
      const adapters = adapterRegistry.getAvailableAdapters();
      
      return adapters.map(adapter => {
      // Create icon based on adapter name
      const getIcon = (adapterName: string) => {
        switch (adapterName.toLowerCase()) {
          case 'hubspot':
            return <Building2 className="h-8 w-8 text-orange-500" />;
          case 'paypal':
            return <DollarSign className="h-8 w-8 text-blue-500" />;
          case 'stripe':
            return <Zap className="h-8 w-8 text-purple-500" />;
          case 'salesforce':
            return <Cloud className="h-8 w-8 text-blue-600" />;
          case 'quickbooks':
            return <BarChart3 className="h-8 w-8 text-green-500" />;
          case 'mailchimp':
            return <Mail className="h-8 w-8 text-pink-500" />;
          case 'slack':
            return <MessageSquare className="h-8 w-8 text-purple-500" />;
          case 'asana':
            return <Grid3X3 className="h-8 w-8 text-red-500" />;
          case 'googleanalytics':
            return <TrendingUp className="h-8 w-8 text-blue-500" />;
          default:
            return <Plug className="h-8 w-8 text-gray-500" />;
        }
      };

      // Map adapter capabilities to features
      const getFeatures = (capabilities: string[]) => {
        const featureMap: Record<string, string> = {
          'crm': 'Customer Relationship Management',
          'payments': 'Payment Processing',
          'marketing': 'Marketing Automation',
          'sales': 'Sales Pipeline Management',
          'automation': 'Workflow Automation',
          'email': 'Email Marketing',
          'invoicing': 'Invoice Management',
          'subscriptions': 'Subscription Billing',
          'refunds': 'Refund Processing',
          'analytics': 'Business Analytics',
          'communication': 'Team Communication',
          'productivity': 'Project Management'
        };

        return capabilities.map(cap => featureMap[cap] || cap).filter(Boolean);
      };

      // Determine difficulty based on auth type and capabilities
      const getDifficulty = (authType: string, capabilities: string[]): 'Easy' | 'Medium' | 'Advanced' => {
        if (authType === 'api_key' && capabilities.length <= 2) return 'Easy';
        if (authType === 'oauth2' && capabilities.length <= 3) return 'Medium';
        return 'Advanced';
      };

      // Estimate setup time
      const getSetupTime = (difficulty: string): string => {
        switch (difficulty) {
          case 'Easy': return '2-3 minutes';
          case 'Medium': return '5-10 minutes';
          case 'Advanced': return '15-30 minutes';
          default: return '5-10 minutes';
        }
      };

      const difficulty = getDifficulty(adapter.authType, adapter.capabilities);
      const setupTime = getSetupTime(difficulty);

      return {
        id: adapter.name,
        name: adapter.displayName,
        provider: adapter.displayName,
        description: adapter.description,
        category: adapter.category.charAt(0).toUpperCase() + adapter.category.slice(1),
        icon: getIcon(adapter.name),
        difficulty,
        setupTime,
        features: getFeatures(adapter.capabilities),
        isPopular: adapter.status === 'active' && adapter.capabilities.length > 2,
        adapterMetadata: adapter
      };
    });
    } catch (error) {
      console.error('Error getting marketplace integrations:', error);
      return [];
    }
  };

  const marketplaceIntegrations = getMarketplaceIntegrations();

  // Fetch connected integrations
  const fetchConnectedIntegrations = async () => {
    if (!user?.id) {
      console.log('No user ID available, skipping integration fetch');
      setConnectedIntegrations([]);
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('user_integrations')
        .select('integration_name, status')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (error) {
        console.error('Error fetching connected integrations:', error);
        setConnectedIntegrations([]);
      } else {
        const connectedNames = (data || []).map(integration => 
          integration.integration_name.toLowerCase()
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
    try {
      const isConnected = connectedIntegrations.includes(integration.id.toLowerCase());
      
      return {
        ...integration,
        isConnected,
        connectionStatus: isConnected ? 'connected' : 'disconnected'
      };
    } catch (error) {
      console.error('Error processing integration:', integration.id, error);
      return {
        ...integration,
        isConnected: false,
        connectionStatus: 'disconnected'
      };
    }
  });

  // Filter integrations based on search and category
  const filteredIntegrations = marketplaceIntegrationsWithStatus.filter(integration => {
    try {
      const matchesSearch = integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           integration.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           integration.provider.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || integration.category === selectedCategory;
      return matchesSearch && matchesCategory;
    } catch (error) {
      console.error('Error filtering integration:', integration.id, error);
      return false;
    }
  });

  const handleIntegrationSelect = async (integration: MarketplaceIntegration) => {
    if (integration.isConnected) {
      // If already connected, navigate to settings or dashboard
      navigate('/integrations');
      return;
    }

    setSelectedIntegration(integration);
    
    // For now, show a connection dialog
    // In the future, this could open a setup wizard
    setShowSetup(true);
  };

  const handleConnectIntegration = async (integration: MarketplaceIntegration) => {
    if (!user?.id) {
      console.error('No user ID available for integration connection');
      return;
    }

    try {
      setLoading(true);
      
      // For demo purposes, use mock credentials
      const mockCredentials = getMockCredentials(integration.id);
      
      const success = await universalIntegrationService.connectVendor(
        integration.id,
        mockCredentials,
        user.id
      );

      if (success) {
        // Refresh connected integrations
        await fetchConnectedIntegrations();
        setShowSetup(false);
        setSelectedIntegration(null);
      }

    } catch (error) {
      console.error(`Failed to connect to ${integration.name}:`, error);
      // Show user-friendly error message
      alert(`Failed to connect to ${integration.name}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleSetupCancel = () => {
    setShowSetup(false);
    setSelectedIntegration(null);
  };

  const getConnectionBadge = (integration: MarketplaceIntegration) => {
    if (integration.isConnected) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1 bg-green-100 text-green-700 border-green-200">
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
      <Button 
        variant="default" 
        size="sm" 
        className="w-full"
        onClick={() => handleIntegrationSelect(integration)}
      >
        <Plug className="h-4 w-4 mr-2" />
        Connect
      </Button>
    );
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-700';
      case 'Medium': return 'bg-yellow-100 text-yellow-700';
      case 'Advanced': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Mock credentials for demo purposes
  const getMockCredentials = (adapterName: string) => {
    const mockCredentials: Record<string, any> = {
      'hubspot': {
        clientId: 'mock-client-id',
        clientSecret: 'mock-client-secret',
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token'
      },
      'paypal': {
        clientId: 'mock-client-id',
        clientSecret: 'mock-client-secret',
        environment: 'sandbox'
      },
      'stripe': {
        apiKey: 'mock-api-key',
        webhookSecret: 'mock-webhook-secret'
      }
    };

    return mockCredentials[adapterName] || { apiKey: 'mock-api-key' };
  };

  useEffect(() => {
    if (!user?.id) {
      console.log('No user ID, skipping integration fetch');
      return;
    }
    
    try {
      fetchConnectedIntegrations();
    } catch (error) {
      console.error('Error in useEffect for fetchConnectedIntegrations:', error);
      setConnectedIntegrations([]);
    }
  }, [user?.id]);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/integrations')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Integrations</span>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Integration Marketplace</h1>
                <p className="text-sm text-muted-foreground">
                  Connect your business tools with our universal adapter system
                </p>
              </div>
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex items-center space-x-2">
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
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search integrations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Integration Grid */}
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {filteredIntegrations.map((integration) => (
            <Card key={integration.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    {integration.icon}
                    <div>
                      <CardTitle className="text-lg">{integration.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{integration.provider}</p>
                    </div>
                  </div>
                  {getConnectionBadge(integration)}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{integration.description}</p>
                
                {/* Features */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Key Features:</h4>
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
                </div>

                {/* Integration Details */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center space-x-4">
                    <span className={`px-2 py-1 rounded-full ${getDifficultyColor(integration.difficulty)}`}>
                      {integration.difficulty}
                    </span>
                    <span>Setup: {integration.setupTime}</span>
                  </div>
                  {integration.isPopular && (
                    <div className="flex items-center space-x-1">
                      <Star className="h-3 w-3 text-yellow-500 fill-current" />
                      <span>Popular</span>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <div className="pt-2">
                  {getActionButton(integration)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredIntegrations.length === 0 && (
          <div className="text-center py-12">
            <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No integrations found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search terms or category filter.
            </p>
          </div>
        )}
      </div>

      {/* Setup Modal */}
      {showSetup && selectedIntegration && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              {selectedIntegration.icon}
              <div>
                <h3 className="text-lg font-semibold">Connect {selectedIntegration.name}</h3>
                <p className="text-sm text-muted-foreground">
                  Set up your {selectedIntegration.name} integration
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Integration Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Category:</span>
                    <span>{selectedIntegration.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Difficulty:</span>
                    <span>{selectedIntegration.difficulty}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Setup Time:</span>
                    <span>{selectedIntegration.setupTime}</span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={handleSetupCancel}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleConnectIntegration(selectedIntegration)}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? 'Connecting...' : 'Connect Now'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </ErrorBoundary>
  );
};

export default IntegrationMarketplacePage; 