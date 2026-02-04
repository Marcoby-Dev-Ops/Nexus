import React, { useState, useEffect } from 'react';
import { useOAuthIntegrations } from '../../integrations/hooks/useOAuthIntegrations';
import { OAuthConnectionModal } from '../../integrations/components/OAuthConnectionModal';
import { OAuthIntegrationCard } from '../../integrations/components/OAuthIntegrationCard';
import { Button } from '../../shared/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/components/ui/Card';
import { Badge } from '../../shared/components/ui/Badge';
import { 
  Building2, 
  Mail, 
  Plus,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import type { OAuthProvider } from '../../core/types/integrations';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '../../shared/components/ui/use-toast';

const TestOAuthPage: React.FC = () => {
  const [showOAuthModal, setShowOAuthModal] = useState(false);
  const [provider, setProvider] = useState<OAuthProvider>('hubspot');
  const [userId, setUserId] = useState<string>('d1b2c3a4-1234-5678-90ab-cdef12345678'); // Default test UUID
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const {
    integrations: oauthIntegrations,
    loading,
    error,
    statusSummary,
    startOAuthFlow,
    disconnectIntegration,
    manualSync,
    testConnection,
    clearError
  } = useOAuthIntegrations({ userId });

  useEffect(() => {
    // Generate a new UUID for each session for better testing isolation
    setUserId(uuidv4());
  }, []);

  const handleStartOAuth = async (provider: OAuthProvider) => {
    setIsLoading(true);
    try {
      const redirectUri = `${window.location.origin}/integrations/oauth/callback`;
      const result = await startOAuthFlow({ provider, userId, redirectUri });
      console.log('OAuth started:', result);
      
      // Store state for callback verification
      sessionStorage.setItem('oauth_state', result.state);
      sessionStorage.setItem('oauth_provider', provider);
      sessionStorage.setItem('oauth_user_id', userId);
      
      // Redirect to OAuth provider
      window.location.href = result.authUrl;
    } catch (error) {
      console.error('Failed to start OAuth flow:', error);
    } finally {
      setIsLoading(false);
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

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading OAuth integrations...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">OAuth Integration Test</h1>
          <p className="text-gray-600">Test OAuth integrations for HubSpot and Microsoft 365</p>
        </div>
        <Button onClick={() => setShowOAuthModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Connect OAuth
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span className="text-red-800 font-medium">Error</span>
          </div>
          <p className="text-red-700 mt-1">{error}</p>
          <Button onClick={clearError} variant="outline" className="mt-2">
            Clear Error
          </Button>
        </div>
      )}

      {/* OAuth Status Overview */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">OAuth Integration Status</h3>
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{statusSummary.total}</div>
            <div className="text-sm text-blue-700">Total</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">{statusSummary.connected}</div>
            <div className="text-sm text-green-700">Connected</div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-600">{statusSummary.disconnected}</div>
            <div className="text-sm text-gray-700">Disconnected</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-600">{statusSummary.error}</div>
            <div className="text-sm text-red-700">Error</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-600">{statusSummary.pending}</div>
            <div className="text-sm text-yellow-700">Pending</div>
          </div>
        </div>
      </div>

      {/* OAuth Integrations */}
      {oauthIntegrations.length > 0 ? (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Connected OAuth Integrations</h3>
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
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">No OAuth integrations connected yet</div>
          <Button onClick={() => setShowOAuthModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Connect your first OAuth integration
          </Button>
        </div>
      )}

      {/* Test Information */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Testing Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">How to Test:</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
              <li>Click "Connect OAuth" to start an OAuth flow</li>
              <li>Choose either HubSpot CRM or Microsoft 365</li>
              <li>You'll be redirected to the provider's authorization page</li>
              <li>After authorization, you'll be redirected back to the callback page</li>
              <li>The integration will appear in your dashboard</li>
            </ol>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Available Actions:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              <li><strong>Manual Sync:</strong> Trigger data synchronization</li>
              <li><strong>Test Connection:</strong> Verify the integration is working</li>
              <li><strong>Disconnect:</strong> Remove the OAuth integration</li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> This is a test environment. Make sure your backend OAuth services are running 
              and properly configured with the required environment variables.
            </p>
          </div>
        </CardContent>
      </Card>

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

export default TestOAuthPage;
