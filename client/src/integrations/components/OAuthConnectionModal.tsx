import React, { useState } from 'react';
import { Button } from '../../shared/components/ui/Button';
import Modal from '../../shared/components/ui/Modal';
import { Badge } from '../../shared/components/ui/Badge';
import { 
  Building2, 
  Mail, 
  ExternalLink, 
  CheckCircle, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import type { OAuthProvider } from '../../core/types/integrations';

interface OAuthConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartOAuth: (provider: OAuthProvider) => Promise<{ authUrl: string; state: string }>;
  userId: string;
}

const OAUTH_PROVIDERS = [
  {
    id: 'hubspot' as OAuthProvider,
    name: 'HubSpot CRM',
    description: 'Connect your HubSpot CRM to sync contacts, companies, and deals',
    icon: Building2,
    features: ['Contact Management', 'Company Data', 'Deal Tracking', 'Automation'],
    category: 'CRM',
    color: 'bg-orange-500'
  },
  {
    id: 'microsoft' as OAuthProvider,
    name: 'Microsoft 365',
    description: 'Connect your Microsoft 365 account to sync emails and calendar data',
    icon: Mail,
    features: ['Email Sync', 'Calendar Integration', 'OneDrive Files', 'Teams Chat'],
    category: 'Productivity',
    color: 'bg-blue-500'
  }
];

export const OAuthConnectionModal: React.FC<OAuthConnectionModalProps> = ({
  isOpen,
  onClose,
  onStartOAuth,
  userId
}) => {
  const [selectedProvider, setSelectedProvider] = useState<OAuthProvider | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async (provider: OAuthProvider) => {
    setIsConnecting(true);
    setError(null);
    
    try {
      const redirectUri = `${window.location.origin}/integrations/oauth/callback`;
      const result = await onStartOAuth(provider);
      
      // Store state for callback verification
      sessionStorage.setItem('oauth_state', result.state);
      sessionStorage.setItem('oauth_provider', provider);
      sessionStorage.setItem('oauth_user_id', userId);
      
      // Redirect to OAuth provider
      window.location.href = result.authUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start OAuth flow');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleClose = () => {
    setSelectedProvider(null);
    setError(null);
    onClose();
  };

  return (
    <Modal open={isOpen} onClose={handleClose} title="Connect OAuth Integration">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span className="text-red-800 font-medium">Connection Error</span>
          </div>
          <p className="text-red-700 mt-1">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <p className="text-gray-600">
          Choose an OAuth integration to connect. You'll be redirected to the provider's authorization page.
        </p>

        <div className="grid gap-4">
          {OAUTH_PROVIDERS.map((provider) => {
            const IconComponent = provider.icon;
            
            return (
              <div
                key={provider.id}
                className={`border rounded-lg p-4 cursor-pointer transition-all hover:border-blue-300 hover:shadow-md ${
                  selectedProvider === provider.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => setSelectedProvider(provider.id)}
              >
                <div className="flex items-start space-x-4">
                  <div className={`p-2 rounded-lg ${provider.color} text-white`}>
                    <IconComponent className="h-6 w-6" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{provider.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        {provider.category}
                      </Badge>
                    </div>
                    
                    <p className="text-gray-600 mb-3">{provider.description}</p>
                    
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700">Features:</h4>
                      <div className="flex flex-wrap gap-2">
                        {provider.features.map((feature, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {selectedProvider === provider.id && (
                      <CheckCircle className="h-5 w-5 text-blue-500" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {selectedProvider && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="h-5 w-5 text-blue-500" />
              <span className="text-blue-800 font-medium">Ready to Connect</span>
            </div>
            <p className="text-blue-700 text-sm">
              You've selected <strong>{OAUTH_PROVIDERS.find(p => p.id === selectedProvider)?.name}</strong>. 
              Click "Connect" to start the OAuth flow.
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-between w-full mt-6">
        <Button variant="outline" onClick={handleClose}>
          Cancel
        </Button>
        <Button 
          onClick={() => selectedProvider && handleConnect(selectedProvider)}
          disabled={!selectedProvider || isConnecting}
          className="flex items-center space-x-2"
        >
          {isConnecting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Connecting...</span>
            </>
          ) : (
            <>
              <ExternalLink className="h-4 w-4" />
              <span>Connect</span>
            </>
          )}
        </Button>
      </div>
    </Modal>
  );
};
