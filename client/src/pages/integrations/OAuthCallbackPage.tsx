import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useOAuthIntegrations } from '../../integrations/hooks/useOAuthIntegrations';
import { Button } from '../../shared/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/components/ui/Card';
import { 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  ExternalLink,
  ArrowLeft
} from 'lucide-react';
import type { OAuthProvider } from '../../core/types/integrations';

export const OAuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Get OAuth state from session storage
  const [oauthState, setOauthState] = useState({
    state: '',
    provider: '' as OAuthProvider,
    userId: ''
  });

  // Mock user ID for now - in real app this would come from auth context
  const userId = 'test-user-123';
  const { completeOAuthFlow } = useOAuthIntegrations({ userId });

  useEffect(() => {
    // Get OAuth parameters from URL
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Get stored OAuth state
    const storedState = sessionStorage.getItem('oauth_state');
    const storedProvider = sessionStorage.getItem('oauth_provider') as OAuthProvider;
    const storedUserId = sessionStorage.getItem('oauth_user_id');

    setOauthState({
      state: storedState || '',
      provider: storedProvider || 'hubspot',
      userId: storedUserId || userId
    });

    // Handle OAuth error
    if (error) {
      setStatus('error');
      setError(errorDescription || 'OAuth authorization failed');
      return;
    }

    // Complete OAuth flow
    if (code && state && storedState && storedProvider) {
      completeOAuthFlow({
        code,
        state,
        userId: storedUserId || userId,
        redirectUri: `${window.location.origin}/integrations/oauth/callback`
      })
        .then((result) => {
          if (result.success) {
            setStatus('success');
            setMessage(result.message || 'Integration connected successfully!');
            
            // Clean up session storage
            sessionStorage.removeItem('oauth_state');
            sessionStorage.removeItem('oauth_provider');
            sessionStorage.removeItem('oauth_user_id');
          } else {
            setStatus('error');
            setError(result.message || 'Failed to complete OAuth flow');
          }
        })
        .catch((err) => {
          setStatus('error');
          setError(err.message || 'Failed to complete OAuth flow');
        });
    } else {
      setStatus('error');
      setError('Invalid OAuth callback parameters');
    }
  }, [searchParams, completeOAuthFlow, userId]);

  const handleGoToIntegrations = () => {
    navigate('/integrations');
  };

  const handleRetry = () => {
    // Clear session storage and redirect back to integrations
    sessionStorage.removeItem('oauth_state');
    sessionStorage.removeItem('oauth_provider');
    sessionStorage.removeItem('oauth_user_id');
    navigate('/integrations');
  };

  const getProviderName = (provider: OAuthProvider) => {
    switch (provider) {
      case 'hubspot':
        return 'HubSpot CRM';
      case 'microsoft':
        return 'Microsoft 365';
      default:
        return provider.charAt(0).toUpperCase() + provider.slice(1);
    }
  };

  if (status === 'processing') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
            </div>
            <CardTitle>Completing OAuth Setup</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              Please wait while we complete your {getProviderName(oauthState.provider)} integration...
            </p>
            <div className="text-sm text-gray-500">
              This may take a few moments
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {status === 'success' ? (
              <CheckCircle className="h-12 w-12 text-green-500" />
            ) : (
              <AlertCircle className="h-12 w-12 text-red-500" />
            )}
          </div>
          <CardTitle>
            {status === 'success' ? 'Integration Connected!' : 'Setup Failed'}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          {status === 'success' ? (
            <>
              <p className="text-gray-600">
                Your {getProviderName(oauthState.provider)} integration has been successfully connected!
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800">
                  You can now sync data and manage your integration from the Integrations Dashboard.
                </p>
              </div>
            </>
          ) : (
            <>
              <p className="text-gray-600">
                We encountered an issue while setting up your {getProviderName(oauthState.provider)} integration.
              </p>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">
                    <strong>Error:</strong> {error}
                  </p>
                </div>
              )}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  Don't worry! You can try again or contact support if the issue persists.
                </p>
              </div>
            </>
          )}

          <div className="flex flex-col space-y-2 pt-4">
            {status === 'success' ? (
              <Button onClick={handleGoToIntegrations} className="w-full">
                <ExternalLink className="h-4 w-4 mr-2" />
                Go to Integrations Dashboard
              </Button>
            ) : (
              <>
                <Button onClick={handleRetry} variant="outline" className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button onClick={handleGoToIntegrations} variant="outline" className="w-full">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Back to Integrations
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
