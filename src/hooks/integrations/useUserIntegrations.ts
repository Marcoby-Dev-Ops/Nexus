import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks';
import { useToast } from '@/shared/components/Toast';
import { integrationService, type UserIntegration } from '@/services/integrations/IntegrationService';

interface UseUserIntegrationsReturn {
  userIntegrations: UserIntegration[];
  isLoading: boolean;
  error: Error | null;
  refreshIntegrations: () => Promise<void>;
}

export const useUserIntegrations = (): UseUserIntegrationsReturn => {
  const [userIntegrations, setUserIntegrations] = useState<UserIntegration[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();
  const { showToast } = useToast();

  // Subscribe to integration service updates
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = integrationService.subscribe((data, loading) => {
      if (data) {
        setUserIntegrations(data);
      }
      setIsLoading(loading);
    });

    return unsubscribe;
  }, [user?.id]);

  const refreshIntegrations = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔄 Starting user integrations refresh for user: ', user.id);
      
      const result = await integrationService.getUserIntegrations(user.id);
      
      if (!result.success) {
        console.error('❌ Failed to fetch user integrations: ', result.error);
        throw new Error(result.error || 'Failed to fetch user integrations');
      }

      console.log('✅ Successfully fetched user integrations: ', result.data?.length || 0);
      setUserIntegrations(result.data || []);
    } catch (err) {
      console.error('❌ Error refreshing user integrations: ', err);
      setError(err instanceof Error ? err : new Error('An error occurred'));
      showToast({
        title: 'Error',
        description: 'Failed to refresh integrations',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, showToast]);

  // Initial load - only if no cached data exists
  useEffect(() => {
    if (user?.id) {
      refreshIntegrations();
    }
  }, [user?.id]); // Removed refreshIntegrations from dependencies to prevent infinite loops

  return {
    userIntegrations,
    isLoading,
    error,
    refreshIntegrations,
  };
}; 