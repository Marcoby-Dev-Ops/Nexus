import { BaseService } from '@/core/services/BaseService';
import type { ServiceResponse } from '@/core/services/BaseService';
import { selectData, selectOne, insertOne, updateOne } from '@/lib/database';

export interface HubSpotContact {
  id: string;
  properties: {
    firstname?: string;
    lastname?: string;
    email: string;
    phone?: string;
    company?: string;
    lifecycle_stage?: string;
    lead_status?: string;
    createdate?: string;
    lastmodifieddate?: string;
    hs_lead_score?: string;
    amount?: string;
    dealname?: string;
    dealstage?: string;
    closedate?: string;
  };
}

export interface HubSpotDeal {
  id: string;
  properties: {
    dealname: string;
    amount: string;
    dealstage: string;
    closedate?: string;
    createdate: string;
    hs_is_closed: string;
    hs_is_closed_won: string;
    hs_is_closed_lost: string;
    hs_deal_stage_probability: string;
    hs_forecast_amount: string;
  };
}

export interface HubSpotCompany {
  id: string;
  properties: {
    name: string;
    domain: string;
    industry: string;
    numberofemployees: string;
    annualrevenue: string;
    city: string;
    state: string;
    country: string;
    createdate: string;
    lastmodifieddate: string;
  };
}

export interface HubSpotMetrics {
  totalContacts: number;
  totalDeals: number;
  totalCompanies: number;
  totalRevenue: number;
  conversionRate: number;
  averageDealSize: number;
  pipelineValue: number;
  winRate: number;
}

/**
 * HubSpot Data Connector
 * Fetches real data from HubSpot API and maps it to our data point system
 */
export class HubSpotDataConnector extends BaseService {
  private apiKey: string | null = null;
  private baseUrl = 'https://api.hubapi.com';

  constructor() {
    super('HubSpotDataConnector');
  }

  /**
   * Initialize the connector with API credentials
   */
  async initialize(userId: string): Promise<ServiceResponse<boolean>> {
    try {
      // Get HubSpot credentials from user integrations
      const integrationResult = await selectOne('user_integrations', 'id', {
        user_id: userId,
        integration_slug: 'hubspot'
      });

      if (integrationResult.error || !integrationResult.data) {
        return { 
          data: false, 
          error: 'HubSpot integration not found. Please connect your HubSpot account first.',
          success: false 
        };
      }

      const integration = integrationResult.data;
      this.apiKey = integration.api_key || integration.access_token;

      if (!this.apiKey) {
        return { 
          data: false, 
          error: 'HubSpot API key not found. Please reconnect your HubSpot account.',
          success: false 
        };
      }

      return { data: true, error: null, success: true };
    } catch (error) {
      return { 
        data: false, 
        error: `Failed to initialize HubSpot connector: ${error}`,
        success: false 
      };
    }
  }

  /**
   * Fetch contacts from HubSpot
   */
  async fetchContacts(limit: number = 100): Promise<ServiceResponse<HubSpotContact[]>> {
    try {
      if (!this.apiKey) {
        return { data: null, error: 'HubSpot not initialized', success: false };
      }

      const response = await fetch(
        `${this.baseUrl}/crm/v3/objects/contacts?limit=${limit}&properties=firstname,lastname,email,phone,company,lifecycle_stage,lead_status,createdate,lastmodifieddate,hs_lead_score`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HubSpot API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return { data: data.results || [], error: null, success: true };
    } catch (error) {
      return { 
        data: null, 
        error: `Failed to fetch contacts: ${error}`,
        success: false 
      };
    }
  }

  /**
   * Fetch deals from HubSpot
   */
  async fetchDeals(limit: number = 100): Promise<ServiceResponse<HubSpotDeal[]>> {
    try {
      if (!this.apiKey) {
        return { data: null, error: 'HubSpot not initialized', success: false };
      }

      const response = await fetch(
        `${this.baseUrl}/crm/v3/objects/deals?limit=${limit}&properties=dealname,amount,dealstage,closedate,createdate,hs_is_closed,hs_is_closed_won,hs_is_closed_lost,hs_deal_stage_probability,hs_forecast_amount`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HubSpot API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return { data: data.results || [], error: null, success: true };
    } catch (error) {
      return { 
        data: null, 
        error: `Failed to fetch deals: ${error}`,
        success: false 
      };
    }
  }

  /**
   * Fetch companies from HubSpot
   */
  async fetchCompanies(limit: number = 100): Promise<ServiceResponse<HubSpotCompany[]>> {
    try {
      if (!this.apiKey) {
        return { data: null, error: 'HubSpot not initialized', success: false };
      }

      const response = await fetch(
        `${this.baseUrl}/crm/v3/objects/companies?limit=${limit}&properties=name,domain,industry,numberofemployees,annualrevenue,city,state,country,createdate,lastmodifieddate`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HubSpot API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return { data: data.results || [], error: null, success: true };
    } catch (error) {
      return { 
        data: null, 
        error: `Failed to fetch companies: ${error}`,
        success: false 
      };
    }
  }

  /**
   * Calculate business metrics from HubSpot data
   */
  async calculateMetrics(): Promise<ServiceResponse<HubSpotMetrics>> {
    try {
      const [contactsResult, dealsResult, companiesResult] = await Promise.all([
        this.fetchContacts(1000),
        this.fetchDeals(1000),
        this.fetchCompanies(1000)
      ]);

      if (contactsResult.error || dealsResult.error || companiesResult.error) {
        return { 
          data: null, 
          error: 'Failed to fetch data for metrics calculation',
          success: false 
        };
      }

      const contacts = contactsResult.data || [];
      const deals = dealsResult.data || [];
      const companies = companiesResult.data || [];

      // Calculate metrics
      const totalContacts = contacts.length;
      const totalDeals = deals.length;
      const totalCompanies = companies.length;

      // Calculate revenue from won deals
      const wonDeals = deals.filter(deal => 
        deal.properties.hs_is_closed_won === 'true'
      );
      const totalRevenue = wonDeals.reduce((sum, deal) => 
        sum + (parseFloat(deal.properties.amount) || 0), 0
      );

      // Calculate conversion rate (leads to customers)
      const leads = contacts.filter(contact => 
        contact.properties.lifecycle_stage === 'lead'
      );
      const customers = contacts.filter(contact => 
        contact.properties.lifecycle_stage === 'customer'
      );
      const conversionRate = leads.length > 0 ? (customers.length / leads.length) * 100 : 0;

      // Calculate average deal size
      const averageDealSize = deals.length > 0 
        ? deals.reduce((sum, deal) => sum + (parseFloat(deal.properties.amount) || 0), 0) / deals.length
        : 0;

      // Calculate pipeline value (open deals)
      const openDeals = deals.filter(deal => 
        deal.properties.hs_is_closed === 'false'
      );
      const pipelineValue = openDeals.reduce((sum, deal) => 
        sum + (parseFloat(deal.properties.amount) || 0), 0
      );

      // Calculate win rate
      const closedDeals = deals.filter(deal => 
        deal.properties.hs_is_closed === 'true'
      );
      const winRate = closedDeals.length > 0 
        ? (wonDeals.length / closedDeals.length) * 100
        : 0;

      const metrics: HubSpotMetrics = {
        totalContacts,
        totalDeals,
        totalCompanies,
        totalRevenue,
        conversionRate,
        averageDealSize,
        pipelineValue,
        winRate
      };

      return { data: metrics, error: null, success: true };
    } catch (error) {
      return { 
        data: null, 
        error: `Failed to calculate metrics: ${error}`,
        success: false 
      };
    }
  }

  /**
   * Sync data to our data point system
   */
  async syncDataPoints(userId: string): Promise<ServiceResponse<boolean>> {
    try {
      const metricsResult = await this.calculateMetrics();
      if (metricsResult.error || !metricsResult.data) {
        return { data: false, error: metricsResult.error, success: false };
      }

      const metrics = metricsResult.data;

      // Map HubSpot data to our data points
      const dataPoints = [
        {
          user_id: userId,
          datapoint_definition_id: 'revenue', // This should match our datapoint_definitions table
          value: metrics.totalRevenue.toString(),
          source: 'hubspot',
          timestamp: new Date().toISOString()
        },
        {
          user_id: userId,
          datapoint_definition_id: 'customers',
          value: metrics.totalContacts.toString(),
          source: 'hubspot',
          timestamp: new Date().toISOString()
        },
        {
          user_id: userId,
          datapoint_definition_id: 'conversion_rate',
          value: metrics.conversionRate.toString(),
          source: 'hubspot',
          timestamp: new Date().toISOString()
        },
        {
          user_id: userId,
          datapoint_definition_id: 'average_deal_size',
          value: metrics.averageDealSize.toString(),
          source: 'hubspot',
          timestamp: new Date().toISOString()
        },
        {
          user_id: userId,
          datapoint_definition_id: 'pipeline_value',
          value: metrics.pipelineValue.toString(),
          source: 'hubspot',
          timestamp: new Date().toISOString()
        },
        {
          user_id: userId,
          datapoint_definition_id: 'win_rate',
          value: metrics.winRate.toString(),
          source: 'hubspot',
          timestamp: new Date().toISOString()
        }
      ];

      // Insert or update data points
      for (const dataPoint of dataPoints) {
        await insertOne('integration_data', dataPoint);
      }

      return { data: true, error: null, success: true };
    } catch (error) {
      return { 
        data: false, 
        error: `Failed to sync data points: ${error}`,
        success: false 
      };
    }
  }
}
