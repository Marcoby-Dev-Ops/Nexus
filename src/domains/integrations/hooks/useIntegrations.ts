import { useState, useCallback } from 'react';
import { useAuth } from '@/domains/admin/user/hooks/AuthContext';
import { useToast } from '@/shared/components/ui/Toast';
import { supabase } from "@/core/supabase";

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

      const { data, error } = await supabase
        .from('user_integrations')
        .select(`*
          ,integrations:integrations!inner(id,name,slug,auth_type,category)`)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      setIntegrations(data ?? []);
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

      const { data: newIntegration, error: insertError } = await supabase
        .from('user_integrations')
        .insert({
          ...integration,
          user_id: user.id,
        })
        .select()
        .single();

      if (insertError) throw insertError;

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

      const { error: deleteError } = await supabase
        .from('user_integrations')
        .delete()
        .eq('id', integrationId);

      if (deleteError) throw deleteError;

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

      const { data: updatedIntegration, error: updateError } = await supabase
        .from('user_integrations')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', integrationId)
        .select()
        .single();

      if (updateError) throw updateError;

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