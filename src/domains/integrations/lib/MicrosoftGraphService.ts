import { supabase } from '@/core/supabase';
import { logger } from '@/core/auth/logger';
import { OAuthTokenService } from '@/domains/integrations/lib/oauthTokenService';

interface GraphAPIResponse<T> {
  value: T[];
  '@odata.nextLink'?: string;
}



export class MicrosoftGraphService {
  private static instance: MicrosoftGraphService;
  private requestQueue: Array<() => Promise<any>> = [];
  private processing = false;
  private lastRequestTime = 0;
  private readonly minRequestInterval = 100; // 100ms between requests

  static getInstance(): MicrosoftGraphService {
    if (!MicrosoftGraphService.instance) {
      MicrosoftGraphService.instance = new MicrosoftGraphService();
    }
    return MicrosoftGraphService.instance;
  }

  /**
   * Get valid access token with automatic refresh
   */
  private async getValidToken(): Promise<string> {
    try {
      // Get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('User not authenticated');
      }

      // Use service client with user validation
      const { data: tokens, error: tokenError } = await supabase
        .from('oauth_tokens')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('integration_slug', 'microsoft')
        .single();

      if (tokenError || !tokens) {
        throw new Error('No Microsoft tokens found. Please reconnect your account.');
      }

      // Check if token is expired (with 5 minute buffer)
      const expiresAt = tokens.expires_at ? new Date(tokens.expires_at).getTime() : 0;
      const now = Date.now();
      const buffer = 5 * 60 * 1000; // 5 minutes

      if (expiresAt > now + buffer) {
        return tokens.access_token || '';
      }

      // Token is expired, refresh it
      logger.info('Microsoft token expired, refreshing...');
      return await this.refreshToken(tokens.refresh_token || '', session.user.id);
    } catch (error) {
      logger.error({ error }, 'Error getting valid Microsoft token');
      throw error;
    }
  }

  /**
   * Refresh Microsoft OAuth token
   */
  private async refreshToken(refreshToken: string, _userId: string): Promise<string> {
    const clientId = import.meta.env.VITE_MICROSOFT_CLIENT_ID;
    const clientSecret = import.meta.env.VITE_MICROSOFT_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('Microsoft OAuth credentials not configured');
    }

    const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Token refresh failed: ${errorData.error_description || 'Unknown error'}`);
    }

    const tokenData = await response.json();
    
    // Store the refreshed tokens using OAuthTokenService
    const updatedToken = await OAuthTokenService.updateTokens('microsoft', {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
      scope: tokenData.scope,
      token_type: tokenData.token_type,
    });

    if (!updatedToken) {
      throw new Error('Failed to store refreshed tokens');
    }

    logger.info('Microsoft token refreshed successfully');
    return tokenData.access_token;
  }

  /**
   * Make rate-limited Graph API request
   */
  private async makeGraphRequest<T>(endpoint: string, accessToken: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          // Rate limiting
          const now = Date.now();
          const timeSinceLastRequest = now - this.lastRequestTime;
          if (timeSinceLastRequest < this.minRequestInterval) {
            await new Promise(resolve => setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest));
          }

          const response = await fetch(`https://graph.microsoft.com/v1.0${endpoint}`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          });

          this.lastRequestTime = Date.now();

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Graph API error: ${errorData.error?.message || response.statusText}`);
          }

          const data: GraphAPIResponse<T> = await response.json();
          return data.value || [];
        } catch (error) {
          reject(error);
        }
      });

      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  /**
   * Process request queue with rate limiting
   */
  private async processQueue() {
    this.processing = true;
    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      if (request) {
        try {
          await request();
        } catch (error) {
          logger.error('Graph API request failed:', error);
        }
      }
    }
    this.processing = false;
  }

  /**
   * Get user's emails
   */
  async getEmails(limit: number = 50, filter?: string): Promise<any[]> {
    const accessToken = await this.getValidToken();
    let endpoint = `/me/messages?$top=${limit}&$select=id,subject,from,toRecipients,body,bodyPreview,sentDateTime,hasAttachments`;
    
    if (filter) {
      endpoint += `&$filter=${encodeURIComponent(filter)}`;
    }

    return this.makeGraphRequest(endpoint, accessToken);
  }

  /**
   * Get user's calendar events
   */
  async getCalendarEvents(limit: number = 50, filter?: string): Promise<any[]> {
    const accessToken = await this.getValidToken();
    let endpoint = `/me/events?$top=${limit}&$select=id,subject,start,end,location,body,attendees`;
    
    if (filter) {
      endpoint += `&$filter=${encodeURIComponent(filter)}`;
    }

    return this.makeGraphRequest(endpoint, accessToken);
  }

  /**
   * Get user's contacts
   */
  async getContacts(limit: number = 50): Promise<any[]> {
    const accessToken = await this.getValidToken();
    const endpoint = `/me/contacts?$top=${limit}&$select=id,displayName,emailAddresses,businessPhones,mobilePhone`;

    return this.makeGraphRequest(endpoint, accessToken);
  }

  /**
   * Get user's files from OneDrive
   */
  async getFiles(limit: number = 50, folder?: string): Promise<any[]> {
    const accessToken = await this.getValidToken();
    let endpoint = `/me/drive/root/children?$top=${limit}&$select=id,name,size,lastModifiedDateTime,webUrl`;
    
    if (folder) {
      endpoint = `/me/drive/root:/${encodeURIComponent(folder)}:/children?$top=${limit}&$select=id,name,size,lastModifiedDateTime,webUrl`;
    }

    return this.makeGraphRequest(endpoint, accessToken);
  }

  /**
   * Get user's profile information
   */
  async getUserProfile(): Promise<any> {
    const accessToken = await this.getValidToken();
    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Graph API error: ${errorData.error?.message || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get organization information
   */
  async getOrganizationInfo(): Promise<any> {
    const accessToken = await this.getValidToken();
    const response = await fetch('https://graph.microsoft.com/v1.0/organization', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Graph API error: ${errorData.error?.message || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Test connection by making a simple API call
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getUserProfile();
      return true;
    } catch (error) {
      logger.error('Microsoft Graph connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const microsoftGraphService = MicrosoftGraphService.getInstance(); 