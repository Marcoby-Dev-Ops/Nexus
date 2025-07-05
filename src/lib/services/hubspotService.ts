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
  private async apiRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
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
        return this.apiRequest(endpoint, options);
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
      // Get contacts data
      const contactsData = await this.apiRequest('/crm/v3/objects/contacts?limit=100&properties=email,firstname,lastname,lifecyclestage,createdate');
      
      // Get deals data
      const dealsData = await this.apiRequest('/crm/v3/objects/deals?limit=100&properties=dealname,amount,dealstage,closedate,createdate');
      
      // Get companies data
      const companiesData = await this.apiRequest('/crm/v3/objects/companies?limit=100&properties=name,domain,createdate');

      // Process contacts metrics
      const contacts = contactsData.results || [];
      const currentMonth = new Date();
      currentMonth.setDate(1);
      
      const newContactsThisMonth = contacts.filter((contact: any) => 
        new Date(contact.properties.createdate) >= currentMonth
      ).length;

      const qualifiedLeads = contacts.filter((contact: any) => 
        ['lead', 'marketingqualifiedlead', 'salesqualifiedlead'].includes(contact.properties.lifecyclestage)
      ).length;

      const customers = contacts.filter((contact: any) => 
        contact.properties.lifecyclestage === 'customer'
      ).length;

      // Process deals metrics
      const deals = dealsData.results || [];
      const openDeals = deals.filter((deal: any) => 
        !['closedwon', 'closedlost'].includes(deal.properties.dealstage)
      );
      
      const closedWonDeals = deals.filter((deal: any) => 
        deal.properties.dealstage === 'closedwon'
      );

      const closedLostDeals = deals.filter((deal: any) => 
        deal.properties.dealstage === 'closedlost'
      );

      const totalDealValue = closedWonDeals.reduce((sum: number, deal: any) => 
        sum + (parseFloat(deal.properties.amount) || 0), 0
      );

      const averageDealSize = closedWonDeals.length > 0 ? totalDealValue / closedWonDeals.length : 0;

      // Process companies metrics
      const companies = companiesData.results || [];
      const newCompaniesThisMonth = companies.filter((company: any) => 
        new Date(company.properties.createdate) >= currentMonth
      ).length;

      // Calculate conversion rate
      const conversionRate = contacts.length > 0 ? (customers / contacts.length) * 100 : 0;

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
          openDeals: openDeals.length,
          closedWon: closedWonDeals.length,
          closedLost: closedLostDeals.length,
          totalValue: Math.round(totalDealValue),
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
          revenue: totalDealValue,
          monthlyRecurringRevenue: totalDealValue * 0.1, // Mock calculation
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
    const data = await this.apiRequest(`/crm/v3/objects/contacts?limit=${limit}&properties=email,firstname,lastname,company,phone,lifecyclestage,createdate,lastmodifieddate,hubspot_owner_id`);
    return data.results || [];
  }

  /**
   * Get deals
   */
  async getDeals(limit = 100): Promise<HubSpotDeal[]> {
    const data = await this.apiRequest(`/crm/v3/objects/deals?limit=${limit}&properties=dealname,amount,dealstage,closedate,pipeline,createdate,hubspot_owner_id`);
    return data.results || [];
  }

  /**
   * Create a contact
   */
  async createContact(properties: Record<string, string>): Promise<HubSpotContact> {
    const data = await this.apiRequest('/crm/v3/objects/contacts', {
      method: 'POST',
      body: JSON.stringify({ properties })
    });
    return data;
  }

  /**
   * Create a deal
   */
  async createDeal(properties: Record<string, string>): Promise<HubSpotDeal> {
    const response = await this.apiRequest('/crm/v3/objects/deals', {
      method: 'POST',
      body: JSON.stringify({ properties })
    });
    
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
      const contactProperties = {
        email: waitlistData.email,
        firstname: waitlistData.firstName,
        company: waitlistData.company || '',
        lifecyclestage: 'lead',
        lead_status: 'waitlist',
        waitlist_tier: waitlistData.tier || 'early-bird',
        referral_code: waitlistData.referralCode || '',
        source: 'Nexus Waitlist'
      };

      const contact = await this.createContact(contactProperties);
      
      return {
        success: true,
        contactId: contact.id
      };
    } catch (error) {
      logger.error({ error }, 'Failed to sync waitlist signup to HubSpot');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export singleton instance
export const hubspotService = new HubSpotService(); 