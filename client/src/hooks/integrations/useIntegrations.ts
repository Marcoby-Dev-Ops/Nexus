import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks';
import { useToast } from '@/shared/ui/components/Toast';
import { consolidatedIntegrationService, type Integration, type UserIntegration } from '@/services/integrations/consolidatedIntegrationService';

interface UseIntegrationsReturn {
  integrations: Integration[];
  isLoading: boolean;
  error: Error | null;
  addIntegration: (integration: Omit<Integration, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  removeIntegration: (integrationId: string) => Promise<void>;
  updateIntegration: (integrationId: string, updates: Partial<Integration>) => Promise<void>;
  refreshIntegrations: () => Promise<void>;
}

export const useIntegrations = (): UseIntegrationsReturn => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { user, integrations: authIntegrations } = useAuth();
  const { showToast } = useToast();

  // Use integrations from auth store instead of making separate calls
  useEffect(() => {
    if (authIntegrations) {
      setIntegrations(authIntegrations);
      setIsLoading(false);
    }
  }, [authIntegrations]);

  // Note: consolidatedIntegrationService doesn't have subscribe method
  // We'll handle updates through refreshIntegrations

  const refreshIntegrations = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);
      
      // Refresh integrations
      
      const { data, error } = await consolidatedIntegrationService.getUserIntegrations(user.id);
      
      if (error) {
        console.error('❌ Failed to fetch integrations: ', error);
        throw new Error(error || 'Failed to fetch integrations');
      }

      // Successfully fetched integrations
      
      // Transform UserIntegration to Integration format
      const transformedIntegrations: Integration[] = (data || []).map(item => ({
        id: item.id,
        type: item.integration_type,
        credentials: item.credentials || {},
        settings: item.settings || {},
        userId: item.user_id,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
      }));
      
      setIntegrations(transformedIntegrations);
    } catch (err) {
      console.error('❌ Error refreshing integrations: ', err);
      setError(err instanceof Error ? err : new Error('An error occurred'));
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const addIntegration = useCallback(async (integration: Omit<Integration, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      // Note: consolidatedIntegrationService doesn't have addIntegration method
      // This would need to be implemented or use a different approach
      throw new Error('addIntegration not implemented in consolidated service');

      showToast({
        title: 'Success',
        description: 'Integration added successfully',
        type: 'success'
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred'));
      showToast({
        title: 'Error',
        description: 'Failed to add integration',
        type: 'error'
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, showToast]);

  const removeIntegration = useCallback(async (integrationId: string) => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      // Note: consolidatedIntegrationService doesn't have removeIntegration method
      // This would need to be implemented or use a different approach
      throw new Error('removeIntegration not implemented in consolidated service');

      showToast({
        title: 'Success',
        description: 'Integration removed successfully',
        type: 'success'
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred'));
      showToast({
        title: 'Error',
        description: 'Failed to remove integration',
        type: 'error'
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, showToast]);

  const updateIntegration = useCallback(async (integrationId: string, updates: Partial<Integration>) => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      // Note: consolidatedIntegrationService doesn't have updateIntegration method
      // This would need to be implemented or use a different approach
      throw new Error('updateIntegration not implemented in consolidated service');

      showToast({
        title: 'Success',
        description: 'Integration updated successfully',
        type: 'success'
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred'));
      showToast({
        title: 'Error',
        description: 'Failed to update integration',
        type: 'error'
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, showToast]);

  return {
    integrations,
    isLoading,
    error,
    addIntegration,
    removeIntegration,
    updateIntegration,
    refreshIntegrations,
  };
}; 
