import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';

interface Integration {
  id: string;
  type: string;
  credentials: Record<string, any>;
  settings: Record<string, any>;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

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
  const { user } = useAuth();
  const { showToast } = useToast();

  const refreshIntegrations = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/integrations?userId=${user.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch integrations');
      }

      const data = await response.json();
      setIntegrations(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred'));
      showToast({
        title: 'Error',
        description: 'Failed to load integrations',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, showToast]);

  const addIntegration = useCallback(async (integration: Omit<Integration, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/integrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(integration)
      });

      if (!response.ok) {
        throw new Error('Failed to add integration');
      }

      const newIntegration = await response.json();
      setIntegrations(prev => [...prev, newIntegration]);

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
  }, [user, showToast]);

  const removeIntegration = useCallback(async (integrationId: string) => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/integrations/${integrationId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to remove integration');
      }

      setIntegrations(prev => prev.filter(integration => integration.id !== integrationId));

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
  }, [user, showToast]);

  const updateIntegration = useCallback(async (integrationId: string, updates: Partial<Integration>) => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/integrations/${integrationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error('Failed to update integration');
      }

      const updatedIntegration = await response.json();
      setIntegrations(prev => prev.map(integration => 
        integration.id === integrationId ? updatedIntegration : integration
      ));

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
  }, [user, showToast]);

  return {
    integrations,
    isLoading,
    error,
    addIntegration,
    removeIntegration,
    updateIntegration,
    refreshIntegrations
  };
}; 