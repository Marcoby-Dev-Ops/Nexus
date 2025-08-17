import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks';
import { useToast } from '@/shared/ui/components/Toast';
import { integrationService, type Integration, type UserIntegration } from '@/services/integrations/IntegrationService';

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

  // Subscribe to integration service updates
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = integrationService.subscribe((data, loading) => {
      if (data) {
        // Transform UserIntegration to Integration format
        const transformedIntegrations: Integration[] = data.map(item => ({
          id: item.id,
          type: item.integration_type,
          credentials: item.credentials || {},
          settings: item.settings || {},
          userId: item.user_id,
          createdAt: new Date(item.created_at),
          updatedAt: new Date(item.updated_at),
        }));
        setIntegrations(transformedIntegrations);
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
      
      console.log('🔄 Starting integration refresh for user: ', user.id);
      
      const result = await integrationService.getUserIntegrations(user.id);
      
      if (!result.success) {
        console.error('❌ Failed to fetch integrations: ', result.error);
        throw new Error(result.error || 'Failed to fetch integrations');
      }

      console.log('✅ Successfully fetched integrations: ', result.data?.length || 0);
      
      // Transform UserIntegration to Integration format
      const transformedIntegrations: Integration[] = (result.data || []).map(item => ({
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

      const result = await integrationService.addIntegration(user.id, {
        user_id: user.id,
        integration_id: integration.type, // Use type as integration_id for now
        integration_slug: integration.type,
        integration_type: integration.type,
        status: 'active',
        credentials: integration.credentials,
        settings: integration.settings,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to add integration');
      }

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

      const result = await integrationService.removeIntegration(integrationId);

      if (!result.success) {
        throw new Error(result.error || 'Failed to remove integration');
      }

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

      const result = await integrationService.updateIntegration(integrationId, {
        integration_type: updates.type,
        credentials: updates.credentials,
        settings: updates.settings,
        updated_at: new Date().toISOString(),
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to update integration');
      }

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