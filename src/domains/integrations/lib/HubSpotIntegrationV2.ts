import { BaseIntegration } from '@/domains/integrations/lib/baseIntegration';
import type { SyncResult } from '@/domains/integrations/lib/baseIntegration';
import { syncIntegration } from '@/domains/integrations/lib/syncService';
import { OAuthTokenService } from '@/domains/integrations/lib/oauthTokenService';
import { supabase } from '@/core/supabase';
import { logger } from '@/core/auth/logger';
import type { AuthType } from './authTypes';

interface HubSpotContact {
  id: string;
  properties: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

interface HubSpotCompany {
  id: string;
  properties: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

interface HubSpotDeal {
  id: string;
  properties: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  associations?: {
    contacts?: { results: Array<{ id: string }> };
    companies?: { results: Array<{ id: string }> };
  };
}

interface HubSpotTicket {
  id: string;
  properties: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

interface HubSpotEmail {
  id: string;
  properties: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export class HubSpotIntegrationV2 extends BaseIntegration {
  id = 'hubspot';
  name = 'HubSpot';
  dataFields = ['contacts', 'companies', 'deals', 'tickets', 'emails'];
  authType: AuthType = 'oauth';

  private async getAccessToken(userId: string): Promise<string> {
    const token = await OAuthTokenService.getTokens('hubspot');
    if (!token?.access_token) {
      throw new Error('No valid HubSpot access token found. Please reconnect your account.');
    }
    return token.access_token;
  }

  private async makeHubSpotRequest<T>(endpoint: string, accessToken: string, params?: Record<string, any>): Promise<T> {
    const baseUrl = 'https: //api.hubapi.com';
    const url = new URL(`${baseUrl}${endpoint}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value.toString());
      });
    }
    
    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error({ endpoint, status: response.status, error: errorText }, 'HubSpot API request failed');
      throw new Error(`HubSpot API error: ${response.status} ${errorText}`);
    }

    return await response.json();
  }

  async fetchProviderData({ userId, fullSync = false }: { userId: string; fullSync?: boolean }): Promise<Record<string, any[]>> {
    try {
      logger.info({ userId, fullSync }, 'Starting HubSpot data fetch');
      
      const accessToken = await this.getAccessToken(userId);
      
      // Fetch data in parallel for better performance
      const [
        contacts,
        companies,
        deals,
        tickets,
        emails
      ] = await Promise.all([
        this.fetchContacts(accessToken, fullSync),
        this.fetchCompanies(accessToken, fullSync),
        this.fetchDeals(accessToken, fullSync),
        this.fetchTickets(accessToken, fullSync),
        this.fetchEmails(accessToken, fullSync)
      ]);

      const result = {
        contacts,
        companies,
        deals,
        tickets,
        emails
      };

      logger.info({ 
        userId, 
        contactCount: contacts.length,
        companyCount: companies.length,
        dealCount: deals.length,
        ticketCount: tickets.length,
        emailCount: emails.length
      }, 'HubSpot data fetch completed');

      return result;
    } catch (error) {
      logger.error({ userId, error }, 'Failed to fetch HubSpot data');
      throw error;
    }
  }

  private async fetchContacts(accessToken: string, fullSync: boolean): Promise<HubSpotContact[]> {
    try {
      const params: Record<string, any> = {
        limit: fullSync ? 100 : 50,
        properties: 'firstname,lastname,email,phone,company,lifecyclestage,leadstatus,createdate,lastmodifieddate'
      };
      
      if (!fullSync) {
        // For incremental sync, get recent contacts
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        params.updatedAfter = oneWeekAgo.getTime().toString();
      }

      const response = await this.makeHubSpotRequest<{ results: HubSpotContact[] }>(
        '/crm/v3/objects/contacts',
        accessToken,
        params
      );

      return response.results || [];
    } catch (error) {
      logger.error({ error }, 'Failed to fetch HubSpot contacts');
      return [];
    }
  }

  private async fetchCompanies(accessToken: string, fullSync: boolean): Promise<HubSpotCompany[]> {
    try {
      const params: Record<string, any> = {
        limit: fullSync ? 100 : 50,
        properties: 'name,domain,industry,numberofemployees,annualrevenue,createdate,lastmodifieddate'
      };
      
      if (!fullSync) {
        // For incremental sync, get recent companies
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        params.updatedAfter = oneWeekAgo.getTime().toString();
      }

      const response = await this.makeHubSpotRequest<{ results: HubSpotCompany[] }>(
        '/crm/v3/objects/companies',
        accessToken,
        params
      );

      return response.results || [];
    } catch (error) {
      logger.error({ error }, 'Failed to fetch HubSpot companies');
      return [];
    }
  }

  private async fetchDeals(accessToken: string, fullSync: boolean): Promise<HubSpotDeal[]> {
    try {
      const params: Record<string, any> = {
        limit: fullSync ? 100 : 50,
        properties: 'dealname,amount,dealstage,closedate,createdate,lastmodifieddate'
      };
      
      if (!fullSync) {
        // For incremental sync, get recent deals
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        params.updatedAfter = oneWeekAgo.getTime().toString();
      }

      const response = await this.makeHubSpotRequest<{ results: HubSpotDeal[] }>(
        '/crm/v3/objects/deals',
        accessToken,
        params
      );

      return response.results || [];
    } catch (error) {
      logger.error({ error }, 'Failed to fetch HubSpot deals');
      return [];
    }
  }

  private async fetchTickets(accessToken: string, fullSync: boolean): Promise<HubSpotTicket[]> {
    try {
      const params: Record<string, any> = {
        limit: fullSync ? 100 : 50,
        properties: 'subject,content,hs_ticket_priority,hs_ticket_category,createdate,lastmodifieddate'
      };
      
      if (!fullSync) {
        // For incremental sync, get recent tickets
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        params.updatedAfter = oneWeekAgo.getTime().toString();
      }

      const response = await this.makeHubSpotRequest<{ results: HubSpotTicket[] }>(
        '/crm/v3/objects/tickets',
        accessToken,
        params
      );

      return response.results || [];
    } catch (error) {
      logger.error({ error }, 'Failed to fetch HubSpot tickets');
      return [];
    }
  }

  private async fetchEmails(accessToken: string, fullSync: boolean): Promise<HubSpotEmail[]> {
    try {
      const params: Record<string, any> = {
        limit: fullSync ? 100 : 50,
        properties: 'hs_email_subject,hs_email_text,hs_email_status,hs_email_sender,createdate,lastmodifieddate'
      };
      
      if (!fullSync) {
        // For incremental sync, get recent emails
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        params.updatedAfter = oneWeekAgo.getTime().toString();
      }

      const response = await this.makeHubSpotRequest<{ results: HubSpotEmail[] }>(
        '/crm/v3/objects/emails',
        accessToken,
        params
      );

      return response.results || [];
    } catch (error) {
      logger.error({ error }, 'Failed to fetch HubSpot emails');
      return [];
    }
  }

  async sync(options: { userId: string; fullSync?: boolean }): Promise<SyncResult> {
    try {
      logger.info({ userId: options.userId, fullSync: options.fullSync }, 'Starting HubSpot sync');
      
      const result = await syncIntegration({ integration: this, ...options });
      
      // Store sync metadata
      await this.updateSyncMetadata(options.userId, {
        lastSync: new Date().toISOString(),
        syncType: options.fullSync ? 'full' : 'incremental',
        dataPoints: Object.values(result).reduce((sum: number, items: any[]) => sum + (Array.isArray(items) ? items.length: 0), 0)
      });

      logger.info({ userId: options.userId, result }, 'HubSpot sync completed');
      return result;
    } catch (error) {
      logger.error({ userId: options.userId, error }, 'HubSpot sync failed');
      throw error;
    }
  }

  private async updateSyncMetadata(userId: string, metadata: any): Promise<void> {
    try {
      await supabase
        .from('user_integrations')
        .upsert({
          userid: userId,
          integrationid: this.id,
          integrationname: this.name,
          integrationtype: 'oauth',
          lastsync_at: metadata.lastSync,
          updatedat: new Date().toISOString()
        }, { onConflict: 'user_id,integration_id' });
    } catch (error) {
      logger.error({ userId, error }, 'Failed to update HubSpot sync metadata');
    }
  }

  async testConnection(userId: string): Promise<boolean> {
    try {
      const accessToken = await this.getAccessToken(userId);
      // Test with a simple API call to get account info
      const response = await this.makeHubSpotRequest<any>('/oauth/v1/access-tokens/' + accessToken, accessToken);
      return !!response.hub_id;
    } catch (error) {
      logger.error({ userId, error }, 'HubSpot connection test failed');
      return false;
    }
  }

  async getConnectionStatus(userId: string): Promise<{
    connected: boolean;
    lastSync?: string;
    dataPoints?: number;
    error?: string;
  }> {
    try {
      const connected = await this.testConnection(userId);
      
      if (!connected) {
        return { connected: false, error: 'Not connected to HubSpot' };
      }

      // Get sync metadata
      const { data: integration } = await supabase
        .from('user_integrations')
        .select('last_sync_at')
        .eq('user_id', userId)
        .eq('integration_id', this.id)
        .single();

      return {
        connected: true,
        lastSync: integration?.last_sync_at || undefined,
        dataPoints: 0 // Will be calculated from actual data
      };
    } catch (error) {
      logger.error({ userId, error }, 'Failed to get HubSpot connection status');
      return { connected: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Test the integration with a simple API call
   */
  async testIntegration(userId: string): Promise<{
    success: boolean;
    message: string;
    data?: any;
    error?: string;
  }> {
    try {
      logger.info({ userId }, 'Testing HubSpot integration');
      
      // Test connection
      const connected = await this.testConnection(userId);
      if (!connected) {
        return {
          success: false,
          message: 'Connection test failed',
          error: 'Unable to connect to HubSpot API'
        };
      }

      // Test a simple API call
      const accessToken = await this.getAccessToken(userId);
      if (!accessToken) {
        return {
          success: false,
          message: 'No valid access token',
          error: 'OAuth token not found or expired'
        };
      }

      // Test account info endpoint
      const accountInfo = await this.makeHubSpotRequest<any>('/oauth/v1/access-tokens/' + accessToken, accessToken);
      
      if (!accountInfo.hub_id) {
        return {
          success: false,
          message: 'Account info not accessible',
          error: 'Insufficient permissions or API error'
        };
      }
      
      return {
        success: true,
        message: 'HubSpot integration is working correctly',
        data: {
          account: {
            hubId: accountInfo.hub_id,
            hubDomain: accountInfo.hub_domain,
            userId: accountInfo.user_id,
            user: accountInfo.user,
            scopes: accountInfo.scopes || []
          },
          scopes: accountInfo.scopes || [],
          lastTested: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error({ userId, error }, 'HubSpot integration test failed');
      return {
        success: false,
        message: 'Integration test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
} 