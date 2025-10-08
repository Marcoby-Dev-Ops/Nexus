import { analyticsService } from '@/services/analytics';
import { serviceRegistry } from '@/core/services/ServiceRegistry';
import type { OAuthTokenService } from '@/core/auth/OAuthTokenService';
import { useState, useEffect } from 'react';

interface ProviderState {
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

interface UseIntegrationProvidersReturn {
  google: ProviderState;
  microsoft: ProviderState;
}

export const useIntegrationProviders = (): UseIntegrationProvidersReturn => {
  // Google Workspace
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [isGoogleConnecting, setIsGoogleConnecting] = useState(true);
  const [googleError, setGoogleError] = useState<Error | null>(null);

  // Microsoft 365
  const [isMicrosoftConnected, setIsMicrosoftConnected] = useState(false);
  const [isMicrosoftConnecting, setIsMicrosoftConnecting] = useState(true);
  const [microsoftError, setMicrosoftError] = useState<Error | null>(null);

  useEffect(() => {
    try {
      // Check if Google Workspace is connected via analytics service
      // For now, we'll assume not connected since the new service doesn't have isAuthenticated
      setIsGoogleConnected(false);
    } catch (e: any) {
      setGoogleError(e);
    } finally {
      setIsGoogleConnecting(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setIsMicrosoftConnecting(true);
        // Use the service registry to get the OAuth token service
        const oauthTokenService = serviceRegistry.getService<OAuthTokenService>('oauth-token');
        const validationResult = await oauthTokenService.validateToken('microsoft');
        const connected = validationResult.success && validationResult.data?.isValid === true;
        setIsMicrosoftConnected(connected);
      } catch (e: any) {
        setMicrosoftError(e);
      } finally {
        setIsMicrosoftConnecting(false);
      }
    })();
  }, []);

  const connectGoogle = async () => {
    try {
        setIsGoogleConnecting(true);
        const { authUrl } = await analyticsService.connectGoogleWorkspace('user-id');
        window.location.href = authUrl;
    } catch (e: any) {
        setGoogleError(e);
    } finally {
        setIsGoogleConnecting(false);
    }
  };

  const disconnectGoogle = async () => {
    // Note: googleWorkspaceService does not have a disconnect method yet.
    // This would need to be implemented to revoke token and clear localStorage.
     
     
     
    // Disconnecting from Google is not yet implemented
  };

  const connectMicrosoft = async () => {
    try {
      setIsMicrosoftConnecting(true);
      // Redirect to Microsoft OAuth
      window.location.href = '/integrations/microsoft365';
    } catch (e: any) {
      setMicrosoftError(e);
    } finally {
      setIsMicrosoftConnecting(false);
    }
  };

  const disconnectMicrosoft = async () => {
    try {
      setIsMicrosoftConnecting(true);
      // Use the service registry to get the OAuth token service
      const oauthTokenService = serviceRegistry.getService<OAuthTokenService>('oauth-token');
      await oauthTokenService.revokeToken('microsoft');
      setIsMicrosoftConnected(false);
    } catch (e: any) {
      setMicrosoftError(e);
    } finally {
      setIsMicrosoftConnecting(false);
    }
  };

  return {
    google: {
      isConnected: isGoogleConnected,
      isConnecting: isGoogleConnecting,
      error: googleError,
      connect: connectGoogle,
      disconnect: disconnectGoogle,
    },
    microsoft: {
      isConnected: isMicrosoftConnected,
      isConnecting: isMicrosoftConnecting,
      error: microsoftError,
      connect: connectMicrosoft,
      disconnect: disconnectMicrosoft,
    },
  };
}; 
