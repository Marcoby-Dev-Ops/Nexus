import { supabase } from '@/lib/supabase';

export interface Microsoft365Config {
  clientId: string;
  clientSecret: string;
  tenantId?: string;
  scopes: string[];
}

export interface Microsoft365TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

export class Microsoft365Service {
  private config: Microsoft365Config;
  private baseUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0';

  constructor() {
    this.config = {
      clientId: import.meta.env.VITE_MICROSOFT_CLIENT_ID || '',
      clientSecret: import.meta.env.VITE_MICROSOFT_CLIENT_SECRET || '',
      tenantId: import.meta.env.VITE_MICROSOFT_TENANT_ID || 'common',
      scopes: [
        'openid',
        'profile',
        'email',
        'User.Read',
        'Mail.Read',
        'Mail.ReadWrite',
        'Mail.Send',
        'Calendars.Read',
        'Calendars.ReadWrite',
        'Files.Read.All',
        'Sites.Read.All',
        'offline_access'
      ]
    };
  }

  /**
   * Generate OAuth authorization URL
   */
  async generateAuthUrl(userId: string): Promise<string> {
    if (!this.config.clientId) {
      throw new Error('Microsoft 365 client ID not configured');
    }

    // Use pipe separator to avoid conflicts with UUID hyphens
    const state = `${userId}|${Date.now()}`;
    const redirectUri = `${window.location.origin}/integrations/microsoft365/callback`;

    const authUrl = new URL(`${this.baseUrl}/authorize`);
    authUrl.searchParams.set('client_id', this.config.clientId);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_mode', 'query');
    authUrl.searchParams.set('scope', this.config.scopes.join(' '));
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('prompt', 'consent');

    return authUrl.toString();
  }

  /**
   * Initiate OAuth flow by redirecting to Microsoft
   */
  async connect(userId: string): Promise<void> {
    try {
      const authUrl = await this.generateAuthUrl(userId);
      window.location.href = authUrl;
    } catch (error) {
      console.error('Failed to initiate Microsoft 365 OAuth:', error);
      throw error;
    }
  }

  /**
   * Check if Microsoft 365 integration is connected for a user
   */
  async isConnected(userId: string): Promise<boolean> {
    try {
      const { data: integration } = await supabase
        .from('integrations')
        .select('id')
        .eq('slug', 'microsoft-365')
        .single();

      if (!integration) return false;

      const { data: userIntegration } = await supabase
        .from('user_integrations')
        .select('status')
        .eq('user_id', userId)
        .eq('integration_id', integration.id)
        .eq('status', 'active')
        .single();

      return !!userIntegration;
    } catch (error) {
      console.error('Error checking Microsoft 365 connection:', error);
      return false;
    }
  }

  /**
   * Get stored Microsoft 365 integration data for a user
   */
  async getIntegration(userId: string) {
    try {
      const { data: integration } = await supabase
        .from('integrations')
        .select('id')
        .eq('slug', 'microsoft-365')
        .single();

      if (!integration) return null;

      const { data: userIntegration } = await supabase
        .from('user_integrations')
        .select('*')
        .eq('user_id', userId)
        .eq('integration_id', integration.id)
        .single();

      return userIntegration;
    } catch (error) {
      console.error('Error getting Microsoft 365 integration:', error);
      return null;
    }
  }

  /**
   * Disconnect Microsoft 365 integration
   */
  async disconnect(userId: string): Promise<void> {
    try {
      const { data: integration } = await supabase
        .from('integrations')
        .select('id')
        .eq('slug', 'microsoft-365')
        .single();

      if (!integration) return;

      await supabase
        .from('user_integrations')
        .update({ status: 'inactive', updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('integration_id', integration.id);
    } catch (error) {
      console.error('Error disconnecting Microsoft 365:', error);
      throw error;
    }
  }
}

export const microsoft365Service = new Microsoft365Service(); 