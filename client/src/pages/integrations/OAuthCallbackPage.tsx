import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import { useAuth } from '@/hooks/index';
import { authentikAuthService } from '@/core/auth/authentikAuthServiceInstance';
import { resolveCanonicalUserId } from '@/core/auth/userIdentity';

type OAuthHandoffPayload = {
  type: 'nexus:oauth:completed';
  provider?: string;
  status: 'connected' | 'failed';
  integrationId?: string | null;
  connectedAt?: string | null;
  errorCode?: string;
  error?: string;
  correlationId?: string;
  conversationId?: string | null;
};

export const OAuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const returnTo = sessionStorage.getItem('oauth_return_to') || '/integrations';
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Get OAuth state from session storage
  const [oauthState, setOauthState] = useState({
    state: '',
    provider: '' as OAuthProvider,
    userId: ''
  });

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const postToOpener = (payload: OAuthHandoffPayload) => {
        const flow = sessionStorage.getItem('oauth_flow');
        if (flow !== 'chat-inline') return;
        if (!window.opener) return;
        window.opener.postMessage(payload, window.location.origin);
      };

      // Get OAuth parameters from URL
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const oauthError = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      // Get stored OAuth state
      const storedState = sessionStorage.getItem('oauth_state');
      const storedProvider = sessionStorage.getItem('oauth_provider') as OAuthProvider;
      const storedUserId = sessionStorage.getItem('oauth_user_id');
      const storedConversationId = sessionStorage.getItem('oauth_flow_conversation_id');
      const sessionResult = await authentikAuthService.getSession();
      const session = sessionResult.data;
      const callbackUserId = resolveCanonicalUserId(storedUserId || user?.id, session);
      const accessToken = session?.session?.accessToken || session?.accessToken;

      if (cancelled) return;

      setOauthState({
        state: storedState || '',
        provider: storedProvider || 'hubspot',
        userId: callbackUserId || ''
      });

      // Handle OAuth error from provider redirect
      if (oauthError) {
        const payload: OAuthHandoffPayload = {
          type: 'nexus:oauth:completed',
          provider: storedProvider,
          status: 'failed',
          errorCode: oauthError,
          error: errorDescription || 'OAuth authorization failed',
          conversationId: storedConversationId
        };
        setStatus('error');
        setError(payload.error);
        postToOpener(payload);
        return;
      }

      // Complete OAuth flow
      if (!(code && state && storedState && storedProvider && callbackUserId)) {
        const payload: OAuthHandoffPayload = {
          type: 'nexus:oauth:completed',
          provider: storedProvider,
          status: 'failed',
          errorCode: 'INVALID_CALLBACK',
          error: 'Invalid OAuth callback parameters',
          conversationId: storedConversationId
        };
        setStatus('error');
        setError(payload.error);
        postToOpener(payload);
        return;
      }

      const response = await fetch(`/api/oauth/${storedProvider}/callback`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({
          code,
          state,
          userId: callbackUserId,
          redirectUri: `${window.location.origin}/integrations/oauth/callback`
        })
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok || result?.success === false) {
        const payload: OAuthHandoffPayload = {
          type: 'nexus:oauth:completed',
          provider: result?.provider || storedProvider,
          status: 'failed',
          errorCode: result?.errorCode || 'CALLBACK_FAILED',
          error: result?.details || result?.error || 'Failed to complete OAuth flow',
          correlationId: result?.correlationId,
          conversationId: storedConversationId
        };
        setStatus('error');
        setError(payload.error || 'Failed to complete OAuth flow');
        postToOpener(payload);
        return;
      }

      setStatus('success');
      setMessage(result.message || 'Integration connected successfully!');

      const payload: OAuthHandoffPayload = {
        type: 'nexus:oauth:completed',
        provider: result.provider || storedProvider,
        status: 'connected',
        integrationId: result.integrationId || null,
        connectedAt: result.connectedAt || null,
        correlationId: result.correlationId,
        conversationId: storedConversationId
      };
      postToOpener(payload);

      const target = sessionStorage.getItem('oauth_return_to') || '/integrations';
      setTimeout(() => {
        if (window.opener && sessionStorage.getItem('oauth_flow') === 'chat-inline') {
          window.close();
          return;
        }
        navigate(target);
      }, 700);

      // Clean up session storage
      sessionStorage.removeItem('oauth_state');
      sessionStorage.removeItem('oauth_provider');
      sessionStorage.removeItem('oauth_user_id');
      sessionStorage.removeItem('oauth_return_to');
      sessionStorage.removeItem('oauth_flow');
      sessionStorage.removeItem('oauth_flow_conversation_id');
      sessionStorage.removeItem('oauth_correlation_id');
    };

    run().catch((err) => {
      if (cancelled) return;
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to complete OAuth flow');
    });

    return () => {
      cancelled = true;
    };
  }, [searchParams, user?.id, navigate]);

  const handleGoToIntegrations = () => {
    navigate(returnTo);
  };

  const handleRetry = () => {
    // Clear session storage and redirect back to integrations
    sessionStorage.removeItem('oauth_state');
    sessionStorage.removeItem('oauth_provider');
    sessionStorage.removeItem('oauth_user_id');
    sessionStorage.removeItem('oauth_return_to');
    sessionStorage.removeItem('oauth_flow');
    sessionStorage.removeItem('oauth_flow_conversation_id');
    sessionStorage.removeItem('oauth_correlation_id');
    navigate(returnTo);
  };

  const getProviderName = (provider: OAuthProvider) => {
    switch (provider) {
      case 'hubspot':
        return 'HubSpot CRM';
      case 'microsoft':
        return 'Microsoft 365';
      case 'google_workspace':
      case 'google-workspace':
      case 'google':
        return 'Google Workspace';
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
// Moved to ARCHIVE_2026_02/integrations/OAuthCallbackPage.tsx
