import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/core/supabase';
import { microsoftGraphService } from '@/lib/services/microsoftGraphService';
import { ProviderState } from '@microsoft/mgt-element';
import { useOrganizationStore } from '@/lib/stores/organizationStore';

export interface M365IntegrationState {
  isConnected: boolean;
  isConnecting: boolean;
  needsAttention: boolean;
  error: Error | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

export const useM365Integration = (): M365IntegrationState => {
  const { user } = useAuth();
  const activeOrgId = useOrganizationStore((state) => state.activeOrgId);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [needsAttention, setNeedsAttention] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const checkDbConnection = useCallback(async () => {
    if (!user || !activeOrgId) {
      setIsConnecting(false);
      return;
    }

    try {
      // First, get the integration ID for Office 365
      const { data: integration, error: integrationError } = await supabase
        .from('integrations')
        .select('id')
        .eq('slug', 'office-365')
        .single();

      if (integrationError || !integration) {
        setIsConnected(false);
        if (integrationError && integrationError.code !== 'PGRST116') {
          throw integrationError;
        }
        // If the integration doesn't exist in the master list, we can't be connected.
        setIsConnecting(false);
        return;
      }

      const { data, error: dbError } = await supabase
        .from('user_integrations')
        .select('id, status, credentials, updated_at')
        .eq('user_id', user.id)
        .eq('company_id', activeOrgId)
        .eq('integration_id', integration.id)
        .single();

      if (dbError || !data) {
        setIsConnected(false);
        if (dbError && dbError.code !== 'PGRST116') { // Ignore 'no rows' error
          throw dbError;
        }
        return;
      }

      if (data.status === 'active' && data.credentials) {
        setIsConnected(true);
      } else {
        setIsConnected(false);
        if (data.status !== 'active') {
            setNeedsAttention(true);
        }
      }
    } catch (e: any) {
      setError(e);
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  }, [user, activeOrgId]);


  useEffect(() => {
    setIsConnecting(true);
    checkDbConnection();
    
    const handleStateChange = () => {
      const providerState = microsoftGraphService.getProviderState();
      if (providerState === ProviderState.SignedOut) {
        setIsConnected(false);
      }
    };
    
    microsoftGraphService.onStateChange(handleStateChange);

    return () => {
      microsoftGraphService.removeStateChange(handleStateChange);
    };

  }, [checkDbConnection]);

  const connect = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      await microsoftGraphService.signIn();
      const providerState = microsoftGraphService.getProviderState();
      
      if (providerState === ProviderState.SignedIn && activeOrgId) {
        await microsoftGraphService.saveIntegrationToken(activeOrgId);
        setIsConnected(true);
      } else if (providerState !== ProviderState.SignedIn) {
        throw new Error('M365 sign-in was not completed.');
      }

    } catch (e: any) {
      setError(e);
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      await microsoftGraphService.signOut();
      if (user && activeOrgId) {
        const { data: integration } = await supabase
          .from('integrations')
          .select('id')
          .eq('slug', 'office-365')
          .single();

        if (integration) {
          await supabase
            .from('user_integrations')
            .delete()
            .eq('user_id', user.id)
            .eq('company_id', activeOrgId)
            .eq('integration_id', integration.id);
        }
      }
      setIsConnected(false);
    } catch (e: any) {
      setError(e);
    } finally {
      setIsConnecting(false);
    }
  };

  return { isConnected, isConnecting, needsAttention, error, connect, disconnect };
}; 