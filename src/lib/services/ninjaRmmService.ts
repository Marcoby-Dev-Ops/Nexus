import { supabase } from '@/lib/core/supabase';
import { env } from '@/lib/core/environment';

export interface NinjaRmmConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  region?: string;
}

export interface NinjaRmmTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

// NinjaRMM region-specific base URLs
const REGION_URLS = {
  'us': 'https://app.ninjarmm.com',
  'eu': 'https://eu.ninjarmm.com',
  'oc': 'https://oc.ninjarmm.com',
  'ca': 'https://ca.ninjarmm.com'
};

export class NinjaRmmService {
  private config: NinjaRmmConfig;
  private baseUrl: string;

  constructor(region: string = 'us') {
    this.baseUrl = REGION_URLS[region as keyof typeof REGION_URLS] || REGION_URLS.us;
    
    this.config = {
      clientId: import.meta.env.VITE_NINJARMM_CLIENT_ID || '',
      clientSecret: '', // Not needed on frontend
      redirectUri: `${window.location.origin}/integrations/ninjarmm/callback`,
      scopes: ['monitoring', 'management'],
      region
    };
  }

  getRedirectUri(): string {
    return this.config.redirectUri;
  }

  /**
   * Initiate OAuth flow - redirects user to NinjaRMM OAuth page
   */
  async initiateAuth(userId: string): Promise<string> {
    if (!this.config.clientId) {
      throw new Error('NinjaRMM Client ID not configured');
    }

    // Include region in state parameter for consistency with callback parsing
    // Use pipe separator to avoid conflicts with UUID hyphens
    const region = this.config.region || 'us';
    const state = `${userId}|${Date.now()}|${region}`;
    
    const authUrl = new URL(`${this.baseUrl}/oauth/authorize`);
    authUrl.searchParams.set('client_id', this.config.clientId);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('redirect_uri', this.config.redirectUri);
    authUrl.searchParams.set('scope', this.config.scopes.join(' '));
    authUrl.searchParams.set('state', state);

    return authUrl.toString();
  }

  /**
   * Get user's NinjaRMM integration status
   */
  async getIntegrationStatus(userId: string): Promise<{
    isConnected: boolean;
    config?: any;
    lastSync?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('user_integrations')
        .select(`
          status,
          config,
          updated_at,
          integrations!inner(slug)
        `)
        .eq('user_id', userId)
        .eq('integrations.slug', 'ninjarmm')
        .eq('status', 'active')
        .maybeSingle(); // Use maybeSingle to avoid error when no record exists

      if (error) {
        console.error('Error checking integration status:', error);
        return { isConnected: false };
      }

      return {
        isConnected: !!data,
        config: data?.config,
        lastSync: data?.updated_at
      };
    } catch (error) {
      console.error('Error in getIntegrationStatus:', error);
      return { isConnected: false };
    }
  }

  /**
   * Test connection using stored tokens
   */
  async testConnection(userId: string): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      const status = await this.getIntegrationStatus(userId);
      
      if (!status.isConnected || !status.config?.access_token) {
        return {
          success: false,
          error: 'No active NinjaRMM connection found'
        };
      }

      // Test connection via Edge Function to avoid CORS
      const response = await fetch(`${env.supabase.url}/functions/v1/ninjarmm-test-connection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          userId,
          accessToken: status.config.access_token
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.error || 'Connection test failed'
        };
      }

      const result = await response.json();
      return {
        success: true,
        data: result.data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get devices from NinjaRMM
   */
  async getDevices(userId: string): Promise<{
    success: boolean;
    devices?: any[];
    error?: string;
  }> {
    try {
      const status = await this.getIntegrationStatus(userId);
      
      if (!status.isConnected || !status.config?.access_token) {
        return {
          success: false,
          error: 'No active NinjaRMM connection found'
        };
      }

      // Get devices via Edge Function to avoid CORS
      const response = await fetch(`${env.supabase.url}/functions/v1/ninjarmm-get-devices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          userId,
          accessToken: status.config.access_token
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.error || 'Failed to fetch devices'
        };
      }

      const result = await response.json();
      return {
        success: true,
        devices: result.devices
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Disconnect NinjaRMM integration
   */
  async disconnect(userId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Get integration record
      const { data: integrationData, error: fetchError } = await supabase
        .from('user_integrations')
        .select(`
          id,
          integrations!inner(slug)
        `)
        .eq('user_id', userId)
        .eq('integrations.slug', 'ninjarmm')
        .single();

      if (fetchError || !integrationData) {
        return {
          success: false,
          error: 'Integration not found'
        };
      }

      // Delete the user integration
      const { error: deleteError } = await supabase
        .from('user_integrations')
        .delete()
        .eq('id', integrationData.id);

      if (deleteError) {
        return {
          success: false,
          error: 'Failed to disconnect integration'
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const ninjaRmmService = new NinjaRmmService(); 