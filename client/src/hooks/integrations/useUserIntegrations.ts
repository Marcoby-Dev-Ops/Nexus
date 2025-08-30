import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks';
import { useToast } from '@/shared/components/Toast';
import { consolidatedIntegrationService, type UserIntegration } from '@/services/integrations/consolidatedIntegrationService';

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

    // Note: consolidatedIntegrationService doesn't have subscribe method
    // We'll handle updates through refreshIntegrations

    // No unsubscribe needed since we removed the subscription
  }, [user?.id]);

  const refreshIntegrations = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);
      
      // Refresh user integrations
      
      const { data, error } = await consolidatedIntegrationService.getUserIntegrations(user.id);
      
      if (error) {
        console.error('❌ Failed to fetch user integrations: ', error);
        throw new Error(error || 'Failed to fetch user integrations');
      }

      // Successfully fetched user integrations
      setUserIntegrations(data || []);
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
