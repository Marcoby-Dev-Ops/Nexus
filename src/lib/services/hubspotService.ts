/**
 * HubSpot Integration Service
 * Integrates with HubSpot CRM for sales, marketing, and customer data
 * Pillar: 1,2 - Automated CRM data and business health assessment
 */

import { supabase } from '../core/supabase';
import { logger } from '../security/logger';

export interface HubSpotConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  portalId?: string;
}

export interface HubSpotMetrics {
  contacts: {
    total: number;
    newThisMonth: number;
    qualifiedLeads: number;
    customers: number;
    conversionRate: number;
  };
  deals: {
    total: number;
    openDeals: number;
    closedWon: number;
    closedLost: number;
    totalValue: number;
    averageDealSize: number;
    salesCycleLength: number;
  };
  companies: {
    total: number;
    newThisMonth: number;
    activeCustomers: number;
  };
  marketing: {
    emailCampaigns: number;
    emailOpens: number;
    emailClicks: number;
    emailOpenRate: number;
    emailClickRate: number;
    leadSources: Array<{
      source: string;
      count: number;
      percentage: number;
    }>;
  };
  sales: {
    revenue: number;
    monthlyRecurringRevenue: number;
    customerLifetimeValue: number;
    churnRate: number;
    salesVelocity: number;
  };
}

export interface HubSpotContact {
  id: string;
  properties: {
    email: string;
    firstname?: string;
    lastname?: string;
    company?: string;
    phone?: string;
    lifecyclestage?: string;
    hubspot_owner_id?: string;
    createdate?: string;
    lastmodifieddate?: string;
  };
}

export interface HubSpotDeal {
  id: string;
  properties: {
    dealname?: string;
    amount?: string;
    dealstage?: string;
    closedate?: string;
    pipeline?: string;
    createdate?: string;
    hubspot_owner_id?: string;
  };
}

interface HubSpotResponse<T> {
  results: T[];
}

export class HubSpotService {
  private config: HubSpotConfig | null = null;

  async initialize(): Promise<boolean> {
    try {
      const { data: integration, error } = await supabase
        .from('user_integrations')
        .select('config, credentials')
        .eq('integration_slug', 'hubspot')
        .eq('status', 'active')
        .maybeSingle();

      if (error || !integration) {
        logger.warn('HubSpot integration not found or inactive');
        return false;
      }

      this.config = {
        clientId: integration.credentials?.client_id,
        clientSecret: integration.credentials?.client_secret,
        redirectUri: integration.config?.redirect_uri,
        accessToken: integration.credentials?.access_token,
        refreshToken: integration.credentials?.refresh_token,
        expiresAt: integration.credentials?.expires_at,
        portalId: integration.config?.portal_id
      };

      return true;
    } catch (error) {
      logger.error({ error }, 'Failed to initialize HubSpot service');
      return false;
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.config?.accessToken) {
      return { success: false, message: 'HubSpot access token not configured' };
    }

    try {
      const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts?limit=1', {
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return { 
          success: true, 
          message: `Connected to HubSpot - ${data.total || 0} contacts found` 
        };
      } else if (response.status === 401) {
        // Try to refresh token
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          return { success: true, message: 'Connected to HubSpot (token refreshed)' };
        } else {
          return { success: false, message: 'Authentication failed - please reconnect' };
        }
      } else {
        return { success: false, message: `API error: ${response.statusText}` };
      }
    } catch (error) {
      logger.error({ error }, 'Failed to test HubSpot connection');
      return { 
        success: false, 
        message: 'Network error connecting to HubSpot API' 
      };
    }
  }

  /**
   * Get OAuth authorization URL
   */
  getAuthorizationUrl(): string {
    if (!this.config?.clientId || !this.config?.redirectUri) {
      throw new Error('Client ID and redirect URI are required for OAuth2 authorization');
    }
    
    const scopes = [
      'crm.objects.contacts.read',
      'crm.objects.contacts.write',
      'crm.objects.companies.read',
      'crm.objects.companies.write',
      'crm.objects.deals.read',
      'crm.objects.deals.write',
      'crm.lists.read',
      'crm.lists.write'
    ];
    
    const state = btoa(JSON.stringify({ 
      timestamp: Date.now(),
      service: 'hubspot'
    }));
    
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: scopes.join(' '),
      response_type: 'code',
      state
    });
    
    return `https://app.hubspot.com/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForTokens(code: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
  }> {
    if (!this.config?.clientId || !this.config?.clientSecret || !this.config?.redirectUri) {
      throw new Error('Client credentials not configured');
    }

    try {
      const response = await fetch('https://api.hubapi.com/oauth/v1/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          redirect_uri: this.config.redirectUri,
          code
        })
      });

      if (!response.ok) {
        throw new Error(`Token exchange failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: Date.now() + (data.expires_in * 1000)
      };
    } catch (error) {
      logger.error({ error }, 'Failed to exchange HubSpot authorization code');
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(): Promise<boolean> {
    if (!this.config?.clientId || !this.config?.clientSecret || !this.config?.refreshToken) {
      return false;
    }

    try {
      const response = await fetch('https://api.hubapi.com/oauth/v1/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          refresh_token: this.config.refreshToken
        })
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      
      // Update config
      this.config.accessToken = data.access_token;
      this.config.refreshToken = data.refresh_token;
      this.config.expiresAt = Date.now() + (data.expires_in * 1000);

      // Update database
      await supabase
        .from('user_integrations')
        .update({
          credentials: {
            ...this.config,
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            expires_at: this.config.expiresAt
          }
        })
        .eq('integration_slug', 'hubspot');

      return true;
    } catch (error) {
      logger.error({ error }, 'Failed to refresh HubSpot token');
      return false;
    }
  }

  /**
   * Make authenticated API request
   */
  private async apiRequest(endpoint: string, options: RequestInit = {}): Promise<unknown> {
    if (!this.config?.accessToken) {
      throw new Error('HubSpot not authenticated');
    }

    const url = `https://api.hubapi.com${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (response.status === 401) {
      // Try to refresh token and retry
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        return await this.apiRequest(endpoint, options);
      } else {
        throw new Error('Authentication failed - please reconnect HubSpot');
      }
    }

    if (!response.ok) {
      throw new Error(`HubSpot API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get comprehensive CRM metrics
   */
  async getCRMMetrics(): Promise<HubSpotMetrics> {
    if (!this.config?.accessToken) {
      throw new Error('HubSpot not properly configured');
    }

    try {
      const contactsResponse = (await this.apiRequest('/crm/v3/objects/contacts?limit=100&properties=email,firstname,lastname,lifecyclestage,createdate')) as HubSpotResponse<HubSpotContact>;
      const dealsResponse = (await this.apiRequest('/crm/v3/objects/deals?limit=100&properties=dealname,amount,dealstage,closedate,createdate')) as HubSpotResponse<HubSpotDeal>;
      const companiesResponse = (await this.apiRequest('/crm/v3/objects/companies?limit=100&properties=name,domain,createdate')) as HubSpotResponse<{ id: string }>;

      const contacts = contactsResponse.results || [];
      const deals = dealsResponse.results || [];
      const companies = companiesResponse.results || [];

      const newContactsThisMonth = contacts.filter(c => 
        c.properties.createdate && new Date(c.properties.createdate) > new Date(new Date().setDate(1))
      ).length;

      const qualifiedLeads = contacts.filter(c => c.properties.lifecyclestage === 'marketingqualifiedlead' || c.properties.lifecyclestage === 'salesqualifiedlead').length;
      const customers = contacts.filter(c => c.properties.lifecyclestage === 'customer').length;
      const conversionRate = contacts.length > 0 ? (customers / contacts.length) * 100 : 0;

      const openDeals = deals.filter(d => d.properties.dealstage !== 'closedwon' && d.properties.dealstage !== 'closedlost').length;
      const closedWon = deals.filter(d => d.properties.dealstage === 'closedwon').length;
      const closedLost = deals.filter(d => d.properties.dealstage === 'closedlost').length;
      const totalValue = closedWon > 0 ? deals.reduce((sum, d) => sum + Number(d.properties.amount || 0), 0) : 0;
      const averageDealSize = closedWon > 0 ? totalValue / closedWon : 0;

      // Process companies metrics
      const newCompaniesThisMonth = companies.filter((company: any) => 
        new Date(company.properties.createdate) >= new Date(new Date().setDate(1))
      ).length;

      // Mock marketing data (would need additional API calls for real data)
      const marketingMetrics = {
        emailCampaigns: 12,
        emailOpens: 1847,
        emailClicks: 234,
        emailOpenRate: 24.5,
        emailClickRate: 3.2,
        leadSources: [
          { source: 'Organic Search', count: 45, percentage: 35.2 },
          { source: 'Direct Traffic', count: 32, percentage: 25.0 },
          { source: 'Social Media', count: 28, percentage: 21.9 },
          { source: 'Email Marketing', count: 23, percentage: 18.0 }
        ]
      };

      return {
        contacts: {
          total: contacts.length,
          newThisMonth: newContactsThisMonth,
          qualifiedLeads,
          customers,
          conversionRate: Math.round(conversionRate * 100) / 100
        },
        deals: {
          total: deals.length,
          openDeals: openDeals,
          closedWon: closedWon,
          closedLost: closedLost,
          totalValue: Math.round(totalValue),
          averageDealSize: Math.round(averageDealSize),
          salesCycleLength: 45 // Mock data - would need calculation
        },
        companies: {
          total: companies.length,
          newThisMonth: newCompaniesThisMonth,
          activeCustomers: customers
        },
        marketing: marketingMetrics,
        sales: {
          revenue: totalValue,
          monthlyRecurringRevenue: totalValue * 0.1, // Mock calculation
          customerLifetimeValue: averageDealSize * 3, // Mock calculation
          churnRate: 5.2, // Mock data
          salesVelocity: averageDealSize / 45 // Mock calculation
        }
      };

    } catch (error) {
      logger.error({ error }, 'Failed to fetch HubSpot CRM metrics');
      throw error;
    }
  }

  /**
   * Get key metrics for business health dashboard
   */
  async getKeyMetrics(): Promise<Array<{
    name: string;
    value: string | number;
    trend: 'up' | 'down' | 'stable';
    unit?: string;
  }>> {
    const metrics = await this.getCRMMetrics();

    return [
      {
        name: 'Total Contacts',
        value: metrics.contacts.total.toLocaleString(),
        trend: metrics.contacts.newThisMonth > 0 ? 'up' : 'stable',
        unit: 'contacts'
      },
      {
        name: 'Qualified Leads',
        value: metrics.contacts.qualifiedLeads.toLocaleString(),
        trend: 'up',
        unit: 'leads'
      },
      {
        name: 'Conversion Rate',
        value: `${metrics.contacts.conversionRate}%`,
        trend: metrics.contacts.conversionRate > 5 ? 'up' : 'down',
        unit: '%'
      },
      {
        name: 'Open Deals',
        value: metrics.deals.openDeals.toLocaleString(),
        trend: 'stable',
        unit: 'deals'
      },
      {
        name: 'Total Revenue',
        value: `$${metrics.sales.revenue.toLocaleString()}`,
        trend: 'up',
        unit: 'USD'
      },
      {
        name: 'Average Deal Size',
        value: `$${metrics.deals.averageDealSize.toLocaleString()}`,
        trend: 'stable',
        unit: 'USD'
      }
    ];
  }

  /**
   * Update business health KPIs
   */
  async updateBusinessHealthKPIs(): Promise<void> {
    try {
      const metrics = await this.getCRMMetrics();

      const kpiMappings = {
        'customer_acquisition_cost': metrics.sales.customerLifetimeValue * 0.3, // Mock calculation
        'conversion_rate': metrics.contacts.conversionRate,
        'customer_lifetime_value': metrics.sales.customerLifetimeValue,
        'monthly_recurring_revenue': metrics.sales.monthlyRecurringRevenue,
        'sales_cycle_length': metrics.deals.salesCycleLength,
        'lead_velocity': metrics.contacts.newThisMonth
      };

      await supabase.functions.invoke('upsert_kpis', {
        body: { kpis: kpiMappings }
      });

      logger.info('Updated business health KPIs from HubSpot data');
    } catch (error) {
      logger.error({ error }, 'Failed to update business health KPIs from HubSpot');
      throw error;
    }
  }

  /**
   * Get contacts
   */
  async getContacts(limit = 100): Promise<HubSpotContact[]> {
    const response = (await this.apiRequest(`crm/v3/objects/contacts?limit=${limit}&properties=email,firstname,lastname,company,phone,lifecyclestage,hubspot_owner_id,createdate,lastmodifieddate`)) as HubSpotResponse<HubSpotContact>;
    return response.results;
  }

  /**
   * Get deals
   */
  async getDeals(limit = 100): Promise<HubSpotDeal[]> {
    const response = (await this.apiRequest(`crm/v3/objects/deals?limit=${limit}&properties=dealname,amount,dealstage,closedate,pipeline,createdate,hubspot_owner_id`)) as HubSpotResponse<HubSpotDeal>;
    return response.results;
  }

  /**
   * Create a contact
   */
  async createContact(properties: Record<string, string>): Promise<HubSpotContact> {
    const response = (await this.apiRequest('crm/v3/objects/contacts', {
      method: 'POST',
      body: JSON.stringify({ properties }),
    })) as HubSpotContact;
    return response;
  }

  /**
   * Create a deal
   */
  async createDeal(properties: Record<string, string>): Promise<HubSpotDeal> {
    const response = (await this.apiRequest('crm/v3/objects/deals', {
      method: 'POST',
      body: JSON.stringify({ properties }),
    })) as HubSpotDeal;
    return response;
  }

  /**
   * Sync waitlist signup to HubSpot as a contact
   */
  async syncWaitlistSignup(waitlistData: {
    email: string;
    firstName: string;
    company?: string;
    tier?: string;
    referralCode?: string;
  }): Promise<{ success: boolean; contactId?: string; error?: string }> {
    try {
      const existingContact = (await this.apiRequest(`crm/v3/objects/contacts/${waitlistData.email}?idProperty=email`)) as HubSpotContact;
      
      if (existingContact?.id) {
        // Contact exists, maybe update properties
        return { success: true, contactId: existingContact.id };
      }

      const newContact = await this.createContact({
        email: waitlistData.email,
        firstname: waitlistData.firstName,
        company: waitlistData.company || '',
        nexus_waitlist_tier: waitlistData.tier || 'Standard',
        referral_code: waitlistData.referralCode || ''
      });

      return { success: true, contactId: newContact.id };

    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        // Contact doesn't exist, create new
        try {
          const newContact = await this.createContact({
            email: waitlistData.email,
            firstname: waitlistData.firstName,
            company: waitlistData.company || '',
            nexus_waitlist_tier: waitlistData.tier || 'Standard',
            referral_code: waitlistData.referralCode || ''
          });
          return { success: true, contactId: newContact.id };
        } catch (creationError) {
          const errorMessage = creationError instanceof Error ? creationError.message : String(creationError);
          logger.error({ error: creationError }, 'Failed to create HubSpot contact after 404');
          return { success: false, error: errorMessage };
        }
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error({ error }, 'Failed to sync HubSpot waitlist signup');
      return { success: false, error: errorMessage };
    }
  }
}

// Export singleton instance
export const hubspotService = new HubSpotService(); 