import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import SlackSetup from '@/components/integrations/SlackSetup';
import MicrosoftTeamsSetup from '@/components/integrations/MicrosoftTeamsSetup';
import { 
  Search, 
  Filter, 
  Plus, 
  Check, 
  Settings, 
  AlertCircle, 
  Zap,
  Database,
  BarChart3,
  MessageSquare,
  ShoppingCart,
  Users,
  DollarSign,
  Mail,
  Calendar,
  FileText,
  Cloud,
  Smartphone,
  Globe,
  Building2,
  TrendingUp,
  Plug,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  icon: React.ReactNode;
  isConnected: boolean;
  isPopular: boolean;
  difficulty: 'easy' | 'medium' | 'advanced';
  estimatedSetupTime: string;
  features: string[];
  status?: 'healthy' | 'warning' | 'error';
  lastSync?: string;
  dataFields?: number;
}

interface IntegrationsProps {
  className?: string;
}

const ICONS: { [key: string]: React.ReactNode } = {
  salesforce: <Cloud className="w-6 h-6 text-primary" />,
  hubspot: <Building2 className="w-6 h-6 text-warning" />,
  pipedrive: <TrendingUp className="w-6 h-6 text-success" />,
  'zoho-crm': <BarChart3 className="w-6 h-6 text-destructive" />,
  'dynamics-365': <Building2 className="w-6 h-6 text-primary" />,
  quickbooks: <DollarSign className="w-6 h-6 text-success" />,
  xero: <BarChart3 className="w-6 h-6 text-primary" />,
  freshbooks: <FileText className="w-6 h-6 text-success" />,
  stripe: <DollarSign className="w-6 h-6 text-secondary" />,
  paypal: <DollarSign className="w-6 h-6 text-primary" />,
  'google-analytics': <TrendingUp className="w-6 h-6 text-destructive" />,
  'google-ads': <Smartphone className="w-6 h-6 text-primary" />,
  'facebook-ads': <Globe className="w-6 h-6 text-primary" />,
  mailchimp: <Mail className="w-6 h-6 text-warning" />,
  sendgrid: <Mail className="w-6 h-6 text-blue-400" />,
  slack: <MessageSquare className="w-6 h-6 text-purple-700" />,
  'microsoft-teams': <Users className="w-6 h-6 text-secondary" />,
  zapier: <Zap className="w-6 h-6 text-orange-500" />,
  n8n: <Zap className="w-6 h-6 text-secondary" />,
  'google-workspace': <Users className="w-6 h-6 text-warning" />,
  'office-365': <Users className="w-6 h-6 text-primary" />,
  default: <Plug className="w-6 h-6 text-muted-foreground" />,
};

const getIcon = (slug: string) => ICONS[slug] || ICONS.default;

/**
 * Integrations page for connecting business tools and services
 */
const Integrations: React.FC<IntegrationsProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [setupModal, setSetupModal] = useState<{ isOpen: boolean; integration: Integration | null }>({
    isOpen: false,
    integration: null
  });

  const fetchIntegrations = async () => {
    if (!user) {
      // still loading user or user not logged in
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Fetch all available integrations from the master list
      const { data: allIntegrations, error: integrationsError } = await supabase
        .from('integrations')
        .select('*');

      if (integrationsError) throw integrationsError;

      // 2. Fetch the integrations the current user has connected
      const { data: userIntegrations, error: userIntegrationsError } = await supabase
        .from('user_integrations')
        .select('integration_id, status, updated_at')
        .eq('user_id', user.id);

      if (userIntegrationsError) throw userIntegrationsError;
      
      // 3. Create a map of connected integrations for easy lookup
      const connectedMap = new Map(
        userIntegrations.map(ui => [ui.integration_id, { status: ui.status, lastSync: ui.updated_at }])
      );

      // 4. Merge the two lists
      const mergedIntegrations = allIntegrations.map((integration: any) => {
        const connectedInfo = connectedMap.get(integration.id);
        const lastSync = connectedInfo?.lastSync ? new Date(connectedInfo.lastSync).toLocaleString() : undefined;

        return {
          ...integration,
          id: integration.id,
          name: integration.name,
          slug: integration.slug,
          category: integration.category,
          description: integration.description,
          icon: getIcon(integration.slug),
          isConnected: !!connectedInfo,
          status: connectedInfo ? (connectedInfo.status === 'active' ? 'healthy' : connectedInfo.status) : undefined,
          lastSync: lastSync,
          isPopular: ['salesforce', 'hubspot', 'quickbooks', 'stripe', 'slack', 'google-analytics'].includes(integration.slug),
          difficulty: integration.difficulty || 'medium',
          estimatedSetupTime: integration.estimated_setup_time || '10 min',
          features: integration.features || [],
        };
      });

      setIntegrations(mergedIntegrations);
    } catch (err: any) {
      console.error("Error fetching integrations:", err);
      setError("Failed to load integrations. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, [user]);
  
  const filteredIntegrations = useMemo(() => {
    return integrations
      .filter(integration =>
        selectedCategory === 'all' || integration.category === selectedCategory
      )
      .filter(integration =>
        integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        integration.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [integrations, selectedCategory, searchTerm]);

  const categories = useMemo(() => {
    const cats = new Set(integrations.map(i => i.category));
    return ['all', ...Array.from(cats).sort()];
  }, [integrations]);
  
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-success/10 text-success';
      case 'medium': return 'bg-warning/10 text-yellow-800';
      case 'advanced': return 'bg-destructive/10 text-destructive';
      default: return 'bg-muted text-foreground';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'healthy':
        return <Check className="w-4 h-4 text-success" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-warning" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      default:
        return null;
    }
  };

  const handleConnectClick = (integration: Integration) => {
    setSetupModal({ isOpen: true, integration });
  };

  const handleCloseModal = () => {
    setSetupModal({ isOpen: false, integration: null });
  };
  
  const handleIntegrationComplete = () => {
    fetchIntegrations();
    handleCloseModal();
  };

  const renderIntegrationCard = (integration: Integration) => (
    <Card key={integration.id} className="w-full transform hover:-translate-y-1 transition-transform duration-300 ease-in-out shadow-lg hover:shadow-xl border border-border/50 dark:border-border/50">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-4">
          {integration.icon}
          <CardTitle className="text-lg font-semibold">{integration.name}</CardTitle>
        </div>
        <div className="flex items-center space-x-2">
          {integration.isPopular && <Badge variant="secondary">Popular</Badge>}
          {integration.isConnected && <Badge variant="default" className="bg-green-600 hover:bg-green-700">Connected</Badge>}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground dark:text-muted-foreground mb-4 h-10">{integration.description}</p>
        
        <div className="flex justify-between items-center text-xs text-muted-foreground dark:text-muted-foreground mb-4">
          <Badge variant="outline" className={getDifficultyColor(integration.difficulty)}>
            {integration.difficulty.charAt(0).toUpperCase() + integration.difficulty.slice(1)}
          </Badge>
          <span>Setup: ~{integration.estimatedSetupTime}</span>
        </div>

        {integration.isConnected && (
          <div className="flex justify-between items-center text-xs text-muted-foreground dark:text-muted-foreground border-t pt-4 mt-4">
            <div className="flex items-center space-x-1">
              {getStatusIcon(integration.status)}
              <span>Status: {integration.status}</span>
            </div>
            <div className="flex items-center space-x-1">
              <RefreshCw className="w-3 h-3" />
              <span>Last Sync: {integration.lastSync}</span>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-2 mt-4">
          <Button variant="outline" size="sm">
            <ExternalLink className="w-4 h-4 mr-2" />
            Docs
          </Button>
          {integration.isConnected ? (
            <Button variant="secondary" size="sm" onClick={() => handleConnectClick(integration)}>
              <Settings className="w-4 h-4 mr-2" />
              Manage
            </Button>
          ) : (
            <Button size="sm" onClick={() => handleConnectClick(integration)}>
              <Zap className="w-4 h-4 mr-2" />
              Connect
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <RefreshCw className="mx-auto h-12 w-12 animate-spin text-primary" />
          <h2 className="mt-4 text-xl font-semibold">Loading Integrations...</h2>
          <p className="mt-2 text-muted-foreground">Connecting to our ecosystem.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center p-8 bg-destructive/5 dark:bg-destructive/20 rounded-lg">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
          <h2 className="mt-4 text-xl font-semibold text-destructive dark:text-red-300">An Error Occurred</h2>
          <p className="mt-2 text-destructive dark:text-destructive">{error}</p>
          <Button onClick={fetchIntegrations} className="mt-6">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 md:p-10 space-y-8 ${className}`}>
      <header>
        <h1 className="text-4xl font-bold tracking-tight">App Marketplace</h1>
        <p className="mt-2 text-lg text-muted-foreground dark:text-muted-foreground">
          Connect your tools to automate workflows and unify your data across the enterprise.
        </p>
      </header>
      
      {/* Search and Filter Controls */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-grow w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name or description..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-focus"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-muted-foreground" />
            <select
              className="border rounded-lg px-4 py-2 bg-background"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Request Integration
          </Button>
        </CardContent>
      </Card>
      
      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredIntegrations.map(renderIntegrationCard)}
      </div>

      {filteredIntegrations.length === 0 && !loading && (
        <div className="text-center py-16">
          <Database className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No integrations found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Your search for "{searchTerm}" in {selectedCategory} did not match any integrations.
          </p>
          <Button variant="link" onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }}>
            Clear search
          </Button>
        </div>
      )}

      {/* Setup Modal */}
      {setupModal.isOpen && setupModal.integration && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>Connect to {setupModal.integration.name}</CardTitle>
              <CardDescription>
                Follow the steps to authorize Nexus to access your {setupModal.integration.name} data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {setupModal.integration.slug === 'slack' && 
                <SlackSetup onComplete={handleIntegrationComplete} onCancel={handleCloseModal} />
              }
              {setupModal.integration.slug === 'microsoft-teams' && 
                <MicrosoftTeamsSetup onComplete={handleIntegrationComplete} onCancel={handleCloseModal} />
              }
              {/* Add other integration setup components here */}
              {![ 'slack', 'microsoft-teams' ].includes(setupModal.integration.slug) && (
                 <div className="text-center p-8">
                   <p className="mb-4">
                     Setup for <strong>{setupModal.integration.name}</strong> is not yet implemented in this demo.
                   </p>
                   <Button onClick={handleCloseModal}>Close</Button>
                 </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Integrations; 