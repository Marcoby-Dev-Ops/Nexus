import { googleWorkspaceService } from '@/lib/services/googleWorkspaceService';
import { useState, useEffect } from 'react';

interface ProviderState {
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

interface UseIntegrationProvidersReturn {
  google: Omit<ProviderState, 'needsAttention'>;
  microsoft: Omit<ProviderState, 'connect' | 'disconnect' | 'needsAttention'> & {
      connect: () => Promise<void>;
      disconnect: () => Promise<void>;
      needsAttention: boolean;
  };
  isLoading: boolean;
}

export const useIntegrationProviders = (): UseIntegrationProvidersReturn => {
  // Google Workspace
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [isGoogleConnecting, setIsGoogleConnecting] = useState(true);
  const [googleError, setGoogleError] = useState<Error | null>(null);

  useEffect(() => {
    try {
      setIsGoogleConnected(googleWorkspaceService.isAuthenticated());
    } catch (e: any) {
      setGoogleError(e);
    } finally {
      setIsGoogleConnecting(false);
    }
  }, []);

  const connectGoogle = async () => {
    try {
        setIsGoogleConnecting(true);
        const authUrl = await googleWorkspaceService.initializeOAuth();
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
    console.log("Disconnecting from Google is not yet implemented.");
  };

  return {
    google: {
      isConnected: isGoogleConnected,
      isConnecting: isGoogleConnecting,
      error: googleError,
      connect: connectGoogle,
      disconnect: disconnectGoogle
    },
    microsoft: {
      isConnected: false,
      isConnecting: false,
      needsAttention: false,
      error: null,
      connect: () => Promise.resolve(),
      disconnect: () => Promise.resolve()
    },
    isLoading: isGoogleConnecting,
  };
}; 