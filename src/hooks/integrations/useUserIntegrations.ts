import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/shared/components/Toast';

interface UserIntegration {
  id: string;
  user_id: string;
  integration_id: string;
  integration_name: string;
  integration_type: string;
  status: 'active' | 'inactive' | 'error' | 'setup' | 'connected' | 'disconnected' | 'pending';
  config?: Record<string, any>;
  credentials?: Record<string, any>;
  settings?: Record<string, any>;
  last_sync_at?: string;
  error_message?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

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

  const refreshIntegrations = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔄 Starting user integrations refresh for user: ', user.id);
      
      const { data, error: fetchError } = await supabase
        .from('user_integrations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (fetchError) {
        console.error('❌ Failed to fetch user integrations: ', fetchError);
        throw fetchError;
      }

      console.log('✅ Successfully fetched user integrations: ', data?.length || 0);
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
  }, [user, showToast]);

  // Initial load
  useEffect(() => {
    if (user) {
      refreshIntegrations();
    }
  }, [user, refreshIntegrations]);

  return {
    userIntegrations,
    isLoading,
    error,
    refreshIntegrations,
  };
}; 