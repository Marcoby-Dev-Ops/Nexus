import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Input } from '@/shared/components/ui/Input';
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
  Cloud,
  ShoppingBag,
  Video
} from 'lucide-react';
import { useAuth } from '@/hooks/index';
import { adapterRegistry, type AdapterMetadata } from '@/core/adapters/adapterRegistry';
import { IntegrationService } from '@/core/integrations';
import { consolidatedIntegrationService } from '@/services/integrations/consolidatedIntegrationService';
import { selectData as select, selectOne, insertOne, updateOne, callEdgeFunction } from '@/lib/api-client';
import { database } from '@/lib/database';
import { logger } from '@/shared/utils/logger';
import { HUBSPOT_REQUIRED_SCOPES } from '@/services/integrations/hubspot/constants';
import { authentikAuthService } from '@/core/auth/authentikAuthServiceInstance';
import { resolveCanonicalUserId } from '@/core/auth/userIdentity';

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

const INTEGRATION_ALIASES: Record<string, string[]> = {
  microsoft: ['microsoft', 'microsoft365'],
  microsoft365: ['microsoft365', 'microsoft'],
  google: ['google', 'google_workspace', 'google-workspace'],
  google_workspace: ['google_workspace', 'google-workspace', 'google'],
  'google-workspace': ['google-workspace', 'google_workspace', 'google'],
};

function getIntegrationAliasSet(value: string): Set<string> {
  const normalized = value.toLowerCase().replace(/\s+/g, '_');
  const aliases = INTEGRATION_ALIASES[normalized] || [normalized];
  return new Set(aliases);
}

const IntegrationMarketplacePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Initialize services
  // Using consolidated integration service

  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(false);
  const [connectedIntegrations, setConnectedIntegrations] = useState<string[]>([]);
  const [selectedIntegration, setSelectedIntegration] = useState<MarketplaceIntegration | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [authInProgress, setAuthInProgress] = useState(false);

  // Categories for filtering
  const categories = [
    'All',
    'CRM',
    'Payments',
    'Marketing',
    'Accounting',
    'Communication',
    'Analytics',
    'Productivity',
    'Storage'
  ];

  // Get available adapters and convert to marketplace format
  const getMarketplaceIntegrations = (): MarketplaceIntegration[] => {
    try {
      const integrations: MarketplaceIntegration[] = [];
      const seenIds = new Set<string>(); // Track seen integration IDs to prevent duplicates

      // Get integrations from old adapter registry
      const adapters = adapterRegistry.getAll();

      // Get integrations from new connector registry
      const integrationService = IntegrationService.getInstance();
      const connectors = integrationService.getAvailableConnectors();

      // Helper function to create icon based on integration name
      const getIcon = (integrationName: string) => {
        switch (integrationName.toLowerCase()) {
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
          case 'google_analytics':
            return <BarChart3 className="h-8 w-8 text-blue-600" />;
          case 'googleanalytics':
            return <TrendingUp className="h-8 w-8 text-blue-500" />;
          case 'microsoft365':
            return <Building2 className="h-8 w-8 text-blue-600" />;
          case 'notion':
            return <Database className="h-8 w-8 text-black" />;
          case 'github':
            return <Code className="h-8 w-8 text-gray-800" />;
          case 'shopify':
            return <ShoppingBag className="h-8 w-8 text-green-600" />;
          case 'zoom':
            return <Video className="h-8 w-8 text-blue-500" />;
          default:
            return <Plug className="h-8 w-8 text-gray-500" />;
        }
      };

      // Helper function to map capabilities to features
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
          'productivity': 'Project Management',
          'ecommerce': 'E-commerce Platform',
          'video': 'Video Conferencing',
          'development': 'Development Tools',
          'knowledge': 'Knowledge Management',
          'finance': 'Financial Management'
        };

        return capabilities.map(cap => featureMap[cap] || cap).filter(Boolean);
      };

      // Helper function to determine difficulty
      const getDifficulty = (authType: string, capabilities: string[], integrationName: string): 'Easy' | 'Medium' | 'Advanced' => {
        // Specific difficulty overrides for known integrations
        const difficultyOverrides: Record<string, 'Easy' | 'Medium' | 'Advanced'> = {
          'hubspot': 'Easy',
          'google_workspace': 'Easy',
          'microsoft365': 'Easy',
          'google_analytics': 'Easy',
          'slack': 'Easy',
          'notion': 'Easy',
          'zoom': 'Easy',
          'paypal': 'Medium',
          'stripe': 'Medium',
          'quickbooks': 'Medium',
          'github': 'Medium',
          'shopify': 'Medium',
          'salesforce': 'Advanced',
          'mailchimp': 'Easy'
        };

        if (difficultyOverrides[integrationName.toLowerCase()]) {
          return difficultyOverrides[integrationName.toLowerCase()];
        }

        // Default logic based on auth type and capabilities
        if (authType === 'api_key' && capabilities.length <= 2) return 'Easy';
        if (authType === 'oauth' && capabilities.length <= 3) return 'Medium';
        return 'Advanced';
      };

      // Helper function to estimate setup time
      const getSetupTime = (difficulty: string, integrationName: string): string => {
        // Specific setup time overrides for known integrations
        const setupTimeOverrides: Record<string, string> = {
          'hubspot': '5 minutes',
          'google_workspace': '3 minutes',
          'microsoft365': '5 minutes',
          'google_analytics': '5 minutes',
          'slack': '3 minutes',
          'notion': '3 minutes',
          'zoom': '3 minutes',
          'github': '5 minutes',
          'shopify': '8 minutes',
          'paypal': '8 minutes',
          'stripe': '10 minutes',
          'quickbooks': '10 minutes',
          'salesforce': '15 minutes',
          'mailchimp': '5 minutes'
        };

        if (setupTimeOverrides[integrationName.toLowerCase()]) {
          return setupTimeOverrides[integrationName.toLowerCase()];
        }

        // Default logic based on difficulty
        switch (difficulty) {
          case 'Easy': return '3-5 minutes';
          case 'Medium': return '5-10 minutes';
          case 'Advanced': return '10-15 minutes';
          default: return '5-10 minutes';
        }
      };

      // Helper function to add integration with deduplication
      const addIntegration = (integration: MarketplaceIntegration) => {
        const normalizedId = integration.id.toLowerCase();
        if (!seenIds.has(normalizedId)) {
          seenIds.add(normalizedId);
          integrations.push(integration);
        } else {
          logger.debug(`Skipping duplicate integration: ${integration.id}`);
        }
      };

      // Process old adapters
      adapters.forEach(adapter => {
        const difficulty = getDifficulty(adapter.metadata.authType, adapter.metadata.capabilities, adapter.metadata.name);
        const setupTime = getSetupTime(difficulty, adapter.metadata.name);

        addIntegration({
          id: adapter.id,
          name: adapter.metadata.displayName,
          provider: adapter.metadata.displayName,
          description: adapter.metadata.description,
          category: adapter.metadata.category.charAt(0).toUpperCase() + adapter.metadata.category.slice(1),
          icon: getIcon(adapter.metadata.name),
          difficulty,
          setupTime,
          features: getFeatures(adapter.metadata.capabilities),
          isPopular: adapter.metadata.isPopular && adapter.metadata.capabilities.length > 2,
          adapterMetadata: adapter.metadata
        });
      });

      // Process new connectors
      connectors.forEach(connector => {
        const difficulty = getDifficulty(connector.authType, connector.features, connector.id);
        const setupTime = getSetupTime(difficulty, connector.id);

        addIntegration({
          id: connector.id,
          name: connector.name,
          provider: connector.name,
          description: connector.description,
          category: connector.category || 'Productivity',
          icon: getIcon(connector.id),
          difficulty,
          setupTime,
          features: getFeatures(connector.features),
          isPopular: connector.isPopular || false,
          adapterMetadata: {
            name: connector.id,
            displayName: connector.name,
            description: connector.description,
            icon: connector.icon,
            authType: connector.authType as any,
            scopes: connector.scopes,
            capabilities: connector.features,
            setupTime: setupTime,
            isPopular: connector.isPopular,
            category: connector.category || 'Productivity'
          }
        });
      });

      return integrations;
    } catch (error) {
      logger.error('Error getting marketplace integrations:', error);
      return [];
    }
  };

  const marketplaceIntegrations = getMarketplaceIntegrations();



  // Fetch connected integrations
  const fetchConnectedIntegrations = useCallback(async () => {
    if (!user?.id) {
      setConnectedIntegrations([]);
      return;
    }

    try {
      setLoading(true);
      const sessionResult = await authentikAuthService.getSession();
      const canonicalUserId = resolveCanonicalUserId(user.id, sessionResult.data);
      if (!canonicalUserId) {
        setConnectedIntegrations([]);
        return;
      }

      const { data, error } = await select(
        'user_integrations',
        'integration_name, status',
        { user_id: canonicalUserId, status: 'active' }
      );

      if (error) {
        logger.error('Error fetching connected integrations:', error);
        setConnectedIntegrations([]);
      } else {
        const connectedNames = (data || []).map(integration =>
          integration.integration_name.toLowerCase()
        );
        setConnectedIntegrations(connectedNames);
      }
    } catch (error) {
      logger.error('Error fetching connected integrations:', error);
      setConnectedIntegrations([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Update marketplace integrations with connection status
  const marketplaceIntegrationsWithStatus: MarketplaceIntegration[] = marketplaceIntegrations.map(integration => {
    try {
      const candidateKeys = new Set<string>();
      for (const alias of getIntegrationAliasSet(integration.name)) candidateKeys.add(alias);
      for (const alias of getIntegrationAliasSet(integration.provider)) candidateKeys.add(alias);
      for (const alias of getIntegrationAliasSet(integration.id)) candidateKeys.add(alias);

      const isConnected = connectedIntegrations.some((slug) => {
        const normalizedSlug = slug.toLowerCase().replace(/\s+/g, '_');
        if (candidateKeys.has(normalizedSlug)) return true;
        const slugAliases = getIntegrationAliasSet(normalizedSlug);
        for (const alias of slugAliases) {
          if (candidateKeys.has(alias)) return true;
        }
        return false;
      });

      return {
        ...integration,
        isConnected,
        connectionStatus: isConnected ? 'connected' : 'disconnected'
      };
    } catch (error) {
      logger.error('Error processing integration', { integrationId: integration.id, error });
      return {
        ...integration,
        isConnected: false,
        connectionStatus: 'disconnected'
      };
    }
  });

  // Filter integrations based on search and category
  const filteredIntegrations = marketplaceIntegrationsWithStatus.filter(integration => {
    const matchesSearch = integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      integration.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      integration.provider.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || integration.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleIntegrationSelect = async (integration: MarketplaceIntegration) => {
    if (integration.isConnected) {
      // If already connected, show disconnect confirmation
      const confirmed = window.confirm(`Are you sure you want to disconnect ${integration.name}? This will remove all associated data and you'll need to reconnect if you want to use it again.`);
      if (confirmed) {
        await handleDisconnectIntegration(integration);
      }
      return;
    }

    // Start provider OAuth for known adapters, else fallback to modal
    const state = { returnTo: window.location.href, provider: integration.id, ts: Date.now() };

    if (integration.id === 'microsoft365') {
      if (authInProgress) return;
      try {
        setAuthInProgress(true);
        if (!user?.id) {
          throw new Error('User session missing. Please sign in again.');
        }

        const sessionResult = await authentikAuthService.getSession();
        const session = sessionResult.data;
        const canonicalUserId = resolveCanonicalUserId(user.id, session);
        const accessToken = session?.session?.accessToken || session?.accessToken;
        if (!canonicalUserId) {
          throw new Error('Unable to resolve authenticated user identity.');
        }

        // Route Microsoft connect through the backend OAuth start endpoint.
        // Backend handles state + PKCE and (for Marcoby) can broker through identity.marcoby.com.
        const redirectUri = `${window.location.origin}/integrations/oauth/callback`;
        const startUrl = `/api/oauth/microsoft/start?userId=${encodeURIComponent(canonicalUserId)}&redirectUri=${encodeURIComponent(redirectUri)}`;
        const startResponse = await fetch(startUrl, {
          credentials: 'include',
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined
        });
        if (!startResponse.ok) {
          const details = await startResponse.text();
          throw new Error(`Failed to start Microsoft OAuth (${startResponse.status}): ${details}`);
        }

        const startData = await startResponse.json();
        if (!startData?.authUrl || !startData?.state) {
          throw new Error('Microsoft OAuth start response is missing authUrl/state');
        }

        // Generic OAuth callback page expects these keys.
        sessionStorage.setItem('oauth_state', startData.state);
        sessionStorage.setItem('oauth_provider', 'microsoft');
        sessionStorage.setItem('oauth_user_id', canonicalUserId);
        sessionStorage.setItem('oauth_return_to', '/integrations');

        window.location.href = startData.authUrl;
      } catch (error) {
        logger.error('Microsoft auth redirect failed', {
          error: error instanceof Error ? error.message : error,
          errorStack: error instanceof Error ? error.stack : undefined,
          errorType: typeof error,
          userId: user?.id
        });
        setAuthInProgress(false);
      }
      return;
    }

    if (integration.id === 'google_workspace') {
      if (authInProgress) return;
      setAuthInProgress(true);
      // Get Google OAuth configuration from server-side API
      const configResponse = await fetch('/api/oauth/config/google');
      if (!configResponse.ok) {
        throw new Error('Failed to get Google configuration from server.');
      }

      const config = await configResponse.json();
      const { clientId, redirectUri } = config;
      const oauth = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      oauth.search = new URLSearchParams({
        client_id: clientId,
        response_type: 'code',
        redirect_uri: redirectUri,
        scope: 'https://www.googleapis.com/auth/gmail.readonly',
        access_type: 'offline',
        include_granted_scopes: 'true',
        prompt: 'consent',
        state: btoa(JSON.stringify(state)),
      }).toString();
      window.location.href = oauth.toString();
      return;
    }

    if (integration.id === 'hubspot') {
      if (authInProgress) return;
      setAuthInProgress(true);

      try {
        // Get current session
        const sessionResult = await authentikAuthService.getSession();
        const session = sessionResult.data;

        if (!session) {
          throw new Error('No valid session found. Please log in again.');
        }

        // Get HubSpot OAuth configuration from server-side API
        const configResponse = await fetch('/api/oauth/config/hubspot');
        if (!configResponse.ok) {
          throw new Error('Failed to get HubSpot configuration from server.');
        }

        const config = await configResponse.json();
        const { clientId, redirectUri } = config;

        if (!clientId) {
          throw new Error('HubSpot credentials not configured.');
        }

        // Create state parameter with user ID and timestamp for security
        const hubspotState = btoa(JSON.stringify({
          timestamp: Date.now(),
          service: 'hubspot',
          userId: session.user.id,
          returnTo: window.location.href
        }));

        // Create HubSpot OAuth URL
        const authUrl = new URL('https://app.hubspot.com/oauth/authorize');
        authUrl.search = new URLSearchParams({
          client_id: clientId,
          redirect_uri: redirectUri,
          scope: HUBSPOT_REQUIRED_SCOPES.join(' '),
          state: hubspotState
        }).toString();

        logger.info('Initiating HubSpot OAuth flow', {
          clientId: clientId ? '***' : 'missing',
          redirectUri,
          hasState: !!hubspotState
        });

        // Redirect to HubSpot OAuth
        window.location.href = authUrl.toString();

      } catch (error) {
        logger.error('HubSpot OAuth initiation failed', { error });
        setAuthInProgress(false);
        alert(`Failed to initiate HubSpot connection: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      return;
    }

    if (integration.id === 'google_analytics') {
      if (authInProgress) return;
      setAuthInProgress(true);

      try {
        // Get current session
        const sessionResult = await authentikAuthService.getSession();
        const session = sessionResult.data;

        if (!session) {
          throw new Error('No valid session found. Please log in again.');
        }

        // Use the Google client ID from environment
        // Get Google Analytics OAuth configuration from server-side API
        const configResponse = await fetch('/api/oauth/config/google-analytics');
        if (!configResponse.ok) {
          throw new Error('Failed to get Google Analytics configuration from server.');
        }

        const config = await configResponse.json();
        const { clientId } = config;

        if (!clientId) {
          throw new Error('Google client ID not configured.');
        }

        // Configure OAuth settings - redirect to frontend callback page
        const redirectUri = `${window.location.origin}/integrations/google-analytics/callback`;

        // Create state parameter with user ID and timestamp for security
        const googleState = btoa(JSON.stringify({
          timestamp: Date.now(),
          service: 'google_analytics',
          userId: session.user.id
        }));

        // Create Google Analytics OAuth URL
        const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
        authUrl.search = new URLSearchParams({
          client_id: clientId,
          redirect_uri: redirectUri,
          response_type: 'code',
          scope: 'https://www.googleapis.com/auth/analytics.readonly',
          access_type: 'offline',
          prompt: 'consent',
          state: googleState
        }).toString();

        logger.info('Initiating Google Analytics OAuth flow', {
          clientId: clientId ? '***' : 'missing',
          redirectUri,
          hasState: !!googleState
        });

        // Redirect to Google Analytics OAuth
        window.location.href = authUrl.toString();

      } catch (error) {
        logger.error('Google Analytics OAuth initiation failed', { error });
        setAuthInProgress(false);
        alert(`Failed to initiate Google Analytics connection: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      return;
    }

    setSelectedIntegration(integration);
    setShowSetup(true);
  };

  const handleConnectIntegration = async (integration: MarketplaceIntegration) => {
    if (!user?.id) {
      logger.error('No user ID available for integration connection');
      return;
    }

    try {
      setLoading(true);

      // For demo purposes, use mock credentials
      const mockCredentials = getMockCredentials(integration.id);

      const { data: result, error } = await consolidatedIntegrationService.connectVendor(
        integration.id,
        mockCredentials,
        user.id
      );

      if (error) {
        throw new Error(error);
      }

      const success = result?.success || false;

      if (success) {
        // Refresh connected integrations
        await fetchConnectedIntegrations();
        setShowSetup(false);
        setSelectedIntegration(null);
      }

    } catch (error) {
      logger.error(`Failed to connect to ${integration.name}:`, error);
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

  const handleDisconnectIntegration = async (integration: MarketplaceIntegration) => {
    if (!user?.id) {
      logger.error('No user ID available for integration disconnection');
      return;
    }

    try {
      setLoading(true);

      // Resolve the canonical user ID (same as connect/fetch flows)
      const sessionResult = await authentikAuthService.getSession();
      const session = sessionResult.data;
      const canonicalUserId = resolveCanonicalUserId(user.id, session);
      if (!canonicalUserId) {
        throw new Error('Unable to resolve authenticated user identity.');
      }
      const accessToken = session?.session?.accessToken || session?.accessToken;

      logger.info(`Attempting to disconnect ${integration.name} (ID: ${integration.id})`);

      // Find the user_integrations record so we have its DB id for the server endpoint
      const { data: allUserIntegrations } = await select('user_integrations', '*', {
        user_id: canonicalUserId
      });

      let userIntegration = (allUserIntegrations || []).find(record => {
        const recordName = (record.integration_name || '').toLowerCase().replace(/\s+/g, '_');
        const recordSlug = (record.integration_slug || '').toLowerCase().replace(/\s+/g, '_');
        const targetAliases = getIntegrationAliasSet(integration.id);
        return targetAliases.has(recordName) || targetAliases.has(recordSlug);
      });

      if (!userIntegration) {
        // Fallback: exact match on integration_name
        const { data: fallbackRecords } = await select('user_integrations', '*', {
          user_id: canonicalUserId,
          integration_name: integration.id
        });

        if (!fallbackRecords || fallbackRecords.length === 0) {
          throw new Error(`Integration ${integration.name} not found for user.`);
        }
        userIntegration = fallbackRecords[0];
      }

      // Use the server disconnect endpoint which cleans up both
      // user_integrations and oauth_tokens, and records an audit event.
      const integrationId = userIntegration.id;
      const response = await fetch(`/api/oauth/disconnect/${integrationId}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({
          userId: canonicalUserId,
          confirm: 'DISCONNECT'
        })
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || body.details || `Server returned ${response.status}`);
      }

      // Refresh connected integrations
      await fetchConnectedIntegrations();

      logger.info(`Successfully disconnected ${integration.name}`);
      alert(`Successfully disconnected ${integration.name}`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to disconnect ${integration.name}:`, { error: errorMessage, integrationId: integration.id });
      alert(`Failed to disconnect ${integration.name}: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
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
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => handleIntegrationSelect(integration)}
        >
          <Settings className="h-4 w-4 mr-2" />
          Disconnect
        </Button>
      );
    }
    return (
      <Button
        variant="default"
        size="sm"
        className="w-full"
        disabled={authInProgress}
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
    const query = searchParams.get('q');
    const category = searchParams.get('category');

    if (query && query.trim().length > 0) {
      setSearchTerm(query.trim());
    }

    if (category && categories.includes(category)) {
      setSelectedCategory(category);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    fetchConnectedIntegrations();
  }, [user?.id, fetchConnectedIntegrations]);

  useEffect(() => {
    const onIntegrationsUpdated = () => {
      fetchConnectedIntegrations();
    };
    window.addEventListener('nexus:integrations-updated', onIntegrationsUpdated);
    return () => window.removeEventListener('nexus:integrations-updated', onIntegrationsUpdated);
  }, [fetchConnectedIntegrations]);

  // Early return if user is not authenticated
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
                    disabled={loading || authInProgress}
                    className="flex-1"
                  >
                    {loading ? 'Connecting...' : 'Connect'}
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
