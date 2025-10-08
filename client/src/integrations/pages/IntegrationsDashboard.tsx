import React, { useState } from 'react';
import { useIntegrations } from '../hooks/useIntegrations';
import { useOAuthIntegrations } from '../hooks/useOAuthIntegrations';
import { IntegrationCard } from '../components/IntegrationCard';
import { OAuthIntegrationCard } from '../components/OAuthIntegrationCard';
import { OAuthConnectionModal } from '../components/OAuthConnectionModal';
import { IntegrationWizard } from '../components/IntegrationWizard';
import { Button } from '../../shared/components/ui/Button';
import { Input } from '../../shared/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../shared/components/ui/Select';
import { Badge } from '../../shared/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../shared/components/ui/Tabs';
import type { Integration, IntegrationFilter, CreateIntegrationRequest } from '../types/integration';
import type { OAuthProvider } from '../../core/types/integrations';
import { Plus, Search, Filter, Building2, Mail, RefreshCw } from 'lucide-react';

export const IntegrationsDashboard: React.FC = () => {
  const [filter, setFilter] = useState<IntegrationFilter>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showOAuthModal, setShowOAuthModal] = useState(false);
  
  // Mock user ID for now - in real app this would come from auth context
  const userId = 'test-user-123';
  
  const {
    integrations,
    loading,
    error,
    createIntegration,
    deleteIntegration,
    testIntegration,
    activateIntegration,
    deactivateIntegration,
  } = useIntegrations(filter);

  const {
    integrations: oauthIntegrations,
    loading: oauthLoading,
    error: oauthError,
    statusSummary: oauthStatusSummary,
    startOAuthFlow,
    disconnectIntegration,
    manualSync,
    testConnection,
    clearError: clearOAuthError
  } = useOAuthIntegrations({ userId });

  const filteredIntegrations = integrations.filter(integration =>
    integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    integration.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    integration.provider.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateIntegration = async (data: CreateIntegrationRequest) => {
    try {
      await createIntegration(data);
      setShowCreateModal(false);
    } catch (error) {
      // Error logging removed for production
    }
  };

  const handleDelete = async (integration: Integration) => {
    if (window.confirm(`Are you sure you want to delete "${integration.name}"?`)) {
      try {
        await deleteIntegration(integration.id);
      } catch (error) {
        // Error logging removed for production
      }
    }
  };

  const handleTest = async (integration: Integration) => {
    try {
      const result = await testIntegration(integration.id);
      alert(`Test result: ${result.success ? 'Success' : 'Failed'} - ${result.message}`);
    } catch (error) {
      // Error logging removed for production
    }
  };

  const handleToggleStatus = async (integration: Integration) => {
    try {
      if (integration.status === 'active') {
        await deactivateIntegration(integration.id);
      } else {
        await activateIntegration(integration.id);
      }
    } catch (error) {
      // Error logging removed for production
    }
  };

  // OAuth handlers
  const handleStartOAuth = async (provider: OAuthProvider) => {
    try {
      const redirectUri = `${window.location.origin}/integrations/oauth/callback`;
      await startOAuthFlow({ provider, userId, redirectUri });
    } catch (error) {
      console.error('Failed to start OAuth flow:', error);
    }
  };

  const handleOAuthDisconnect = async (integrationId: string) => {
    try {
      await disconnectIntegration(integrationId);
    } catch (error) {
      console.error('Failed to disconnect OAuth integration:', error);
    }
  };

  const handleOAuthManualSync = async (integrationId: string) => {
    try {
      const result = await manualSync({ integrationId, userId });
      if (result.success) {
        alert(`Sync completed successfully! Synced ${result.result.contacts?.count || 0} contacts, ${result.result.companies?.count || 0} companies, ${result.result.emails?.count || 0} emails.`);
      }
    } catch (error) {
      console.error('Failed to sync OAuth integration:', error);
    }
  };

  const handleOAuthTestConnection = async (integrationId: string) => {
    try {
      const integration = oauthIntegrations.find(i => i.id === integrationId);
      if (integration?.accessToken) {
        const result = await testConnection(integration.provider, integration.accessToken);
        alert(`Connection test: ${result.connected ? 'Success' : 'Failed'}`);
      }
    } catch (error) {
      console.error('Failed to test OAuth connection:', error);
    }
  };

  const getStatusCounts = () => {
    const counts = { active: 0, inactive: 0, error: 0, pending: 0 };
    integrations.forEach(integration => {
      counts[integration.status]++;
    });
    return counts;
  };

  const statusCounts = getStatusCounts();

  if (loading && oauthLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading integrations...</div>
        </div>
      </div>
    );
  }

  if (error || oauthError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error</h3>
          <p className="text-red-600">{error || oauthError}</p>
          {(error || oauthError) && (
            <Button onClick={() => { clearOAuthError(); }} variant="outline" className="mt-2">
              Clear Error
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
          <p className="text-gray-600">Manage your external service connections</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setShowOAuthModal(true)} variant="outline">
            <Building2 className="h-4 w-4 mr-2" />
            Connect OAuth
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Integration
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">{statusCounts.active}</div>
          <div className="text-sm text-green-700">Active</div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-600">{statusCounts.inactive}</div>
          <div className="text-sm text-gray-700">Inactive</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-red-600">{statusCounts.error}</div>
          <div className="text-sm text-red-700">Error</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-yellow-600">{statusCounts.pending}</div>
          <div className="text-sm text-yellow-700">Pending</div>
        </div>
      </div>

      {/* OAuth Status Overview */}
      {oauthIntegrations.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">OAuth Integrations</h3>
          <div className="grid grid-cols-5 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">{oauthStatusSummary.total}</div>
              <div className="text-sm text-blue-700">Total</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">{oauthStatusSummary.connected}</div>
              <div className="text-sm text-green-700">Connected</div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-600">{oauthStatusSummary.disconnected}</div>
              <div className="text-sm text-gray-700">Disconnected</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-600">{oauthStatusSummary.error}</div>
              <div className="text-sm text-red-700">Error</div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-600">{oauthStatusSummary.pending}</div>
              <div className="text-sm text-yellow-700">Pending</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search integrations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={filter.status || ''}
          onValueChange={(value) => setFilter(prev => ({ 
            ...prev, 
            status: (value as Integration['status']) || undefined 
          }))}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filter.type || ''}
          onValueChange={(value) => setFilter(prev => ({ 
            ...prev, 
            type: (value as Integration['type']) || undefined 
          }))}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Types</SelectItem>
            <SelectItem value="api">API</SelectItem>
            <SelectItem value="webhook">Webhook</SelectItem>
            <SelectItem value="oauth">OAuth</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Integrations Grid */}
      {filteredIntegrations.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">No integrations found</div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create your first integration
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIntegrations.map((integration) => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
              onConfigure={() => {/* TODO: Open configuration modal */}}
              onTest={() => handleTest(integration)}
              onDelete={() => handleDelete(integration)}
            />
          ))}
        </div>
      )}

      {/* OAuth Integrations */}
      {oauthIntegrations.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">OAuth Integrations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {oauthIntegrations.map((integration) => (
              <OAuthIntegrationCard
                key={integration.id}
                integration={integration}
                onDisconnect={handleOAuthDisconnect}
                onManualSync={handleOAuthManualSync}
                onTestConnection={handleOAuthTestConnection}
              />
            ))}
          </div>
        </div>
      )}

      {/* Integration Wizard Modal */}
      {showCreateModal && (
        <IntegrationWizard
          onComplete={handleCreateIntegration}
          onCancel={() => setShowCreateModal(false)}
        />
      )}

      {/* OAuth Connection Modal */}
      {showOAuthModal && (
        <OAuthConnectionModal
          isOpen={showOAuthModal}
          onClose={() => setShowOAuthModal(false)}
          onStartOAuth={handleStartOAuth}
          userId={userId}
        />
      )}
    </div>
  );
};
