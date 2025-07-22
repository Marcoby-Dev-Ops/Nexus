/**
 * HubSpot Data Fetcher
 * 
 * Implements HubSpot's recommended patterns for fetching CRM data
 * Based on: https://developers.hubspot.com/docs/guides/crm/public-apps/fetching-data
 */

import { SecureLogger } from '@/shared/lib/security/logger';
import { getHubspotConfig } from './config';

const logger = new SecureLogger('HubSpotDataFetcher');

export interface HubSpotDataFetcherOptions {
  accessToken: string;
  portalId?: string;
  batchSize?: number;
  includeAssociations?: boolean;
  properties?: string[];
}

export interface HubSpotContact {
  id: string;
  properties: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  archived: boolean;
}

export interface HubSpotCompany {
  id: string;
  properties: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  archived: boolean;
}

export interface HubSpotDeal {
  id: string;
  properties: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  archived: boolean;
}

export interface HubSpotList {
  id: string;
  name: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

export class HubSpotDataFetcher {
  private accessToken: string;
  private portalId?: string;
  private batchSize: number;
  private includeAssociations: boolean;
  private defaultProperties: string[];

  constructor(options: HubSpotDataFetcherOptions) {
    this.accessToken = options.accessToken;
    this.portalId = options.portalId;
    this.batchSize = options.batchSize || 100;
    this.includeAssociations = options.includeAssociations || false;
    this.defaultProperties = options.properties || [];
  }

  /**
   * Fetch contacts with pagination and filtering
   * Based on: https://developers.hubspot.com/docs/api/crm/contacts
   */
  async fetchContacts(options: {
    limit?: number;
    after?: string;
    properties?: string[];
    filter?: string;
  } = {}): Promise<{
    contacts: HubSpotContact[];
    paging?: {
      next?: {
        after: string;
      };
    };
  }> {
    try {
      const config = await getHubspotConfig();
      const properties = [...this.defaultProperties, ...(options.properties || [])];
      
      const params = new URLSearchParams({
        limit: (options.limit || this.batchSize).toString(),
        properties: properties.join(','),
        ...(options.after && { after: options.after }),
        ...(options.filter && { filter: options.filter }),
      });

      const response = await fetch(
        `${config.apiBaseUrl}/crm/v3/objects/contacts?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HubSpot API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      logger.info({
        contactCount: data.results?.length || 0,
        hasNextPage: !!data.paging?.next,
      }, 'Successfully fetched HubSpot contacts');

      return {
        contacts: data.results || [],
        paging: data.paging,
      };
    } catch (error) {
      logger.error({ error }, 'Failed to fetch HubSpot contacts');
      throw error;
    }
  }

  /**
   * Fetch companies with pagination and filtering
   * Based on: https://developers.hubspot.com/docs/api/crm/companies
   */
  async fetchCompanies(options: {
    limit?: number;
    after?: string;
    properties?: string[];
    filter?: string;
  } = {}): Promise<{
    companies: HubSpotCompany[];
    paging?: {
      next?: {
        after: string;
      };
    };
  }> {
    try {
      const config = await getHubspotConfig();
      const properties = [...this.defaultProperties, ...(options.properties || [])];
      
      const params = new URLSearchParams({
        limit: (options.limit || this.batchSize).toString(),
        properties: properties.join(','),
        ...(options.after && { after: options.after }),
        ...(options.filter && { filter: options.filter }),
      });

      const response = await fetch(
        `${config.apiBaseUrl}/crm/v3/objects/companies?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HubSpot API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      logger.info({
        companyCount: data.results?.length || 0,
        hasNextPage: !!data.paging?.next,
      }, 'Successfully fetched HubSpot companies');

      return {
        companies: data.results || [],
        paging: data.paging,
      };
    } catch (error) {
      logger.error({ error }, 'Failed to fetch HubSpot companies');
      throw error;
    }
  }

  /**
   * Fetch deals with pagination and filtering
   * Based on: https://developers.hubspot.com/docs/api/crm/deals
   */
  async fetchDeals(options: {
    limit?: number;
    after?: string;
    properties?: string[];
    filter?: string;
  } = {}): Promise<{
    deals: HubSpotDeal[];
    paging?: {
      next?: {
        after: string;
      };
    };
  }> {
    try {
      const config = await getHubspotConfig();
      const properties = [...this.defaultProperties, ...(options.properties || [])];
      
      const params = new URLSearchParams({
        limit: (options.limit || this.batchSize).toString(),
        properties: properties.join(','),
        ...(options.after && { after: options.after }),
        ...(options.filter && { filter: options.filter }),
      });

      const response = await fetch(
        `${config.apiBaseUrl}/crm/v3/objects/deals?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HubSpot API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      logger.info({
        dealCount: data.results?.length || 0,
        hasNextPage: !!data.paging?.next,
      }, 'Successfully fetched HubSpot deals');

      return {
        deals: data.results || [],
        paging: data.paging,
      };
    } catch (error) {
      logger.error({ error }, 'Failed to fetch HubSpot deals');
      throw error;
    }
  }

  /**
   * Fetch all contacts with automatic pagination
   */
  async fetchAllContacts(options: {
    properties?: string[];
    filter?: string;
    onProgress?: (count: number) => void;
  } = {}): Promise<HubSpotContact[]> {
    const allContacts: HubSpotContact[] = [];
    let after: string | undefined;
    let totalCount = 0;

    do {
      const result = await this.fetchContacts({
        limit: this.batchSize,
        after,
        properties: options.properties,
        filter: options.filter,
      });

      allContacts.push(...result.contacts);
      totalCount += result.contacts.length;
      
      after = result.paging?.next?.after;
      
      if (options.onProgress) {
        options.onProgress(totalCount);
      }

      logger.info({
        totalFetched: totalCount,
        hasNextPage: !!after,
      }, 'Progress fetching all contacts');

    } while (after);

    logger.info({ totalContacts: allContacts.length }, 'Completed fetching all contacts');
    return allContacts;
  }

  /**
   * Fetch all companies with automatic pagination
   */
  async fetchAllCompanies(options: {
    properties?: string[];
    filter?: string;
    onProgress?: (count: number) => void;
  } = {}): Promise<HubSpotCompany[]> {
    const allCompanies: HubSpotCompany[] = [];
    let after: string | undefined;
    let totalCount = 0;

    do {
      const result = await this.fetchCompanies({
        limit: this.batchSize,
        after,
        properties: options.properties,
        filter: options.filter,
      });

      allCompanies.push(...result.companies);
      totalCount += result.companies.length;
      
      after = result.paging?.next?.after;
      
      if (options.onProgress) {
        options.onProgress(totalCount);
      }

      logger.info({
        totalFetched: totalCount,
        hasNextPage: !!after,
      }, 'Progress fetching all companies');

    } while (after);

    logger.info({ totalCompanies: allCompanies.length }, 'Completed fetching all companies');
    return allCompanies;
  }

  /**
   * Fetch all deals with automatic pagination
   */
  async fetchAllDeals(options: {
    properties?: string[];
    filter?: string;
    onProgress?: (count: number) => void;
  } = {}): Promise<HubSpotDeal[]> {
    const allDeals: HubSpotDeal[] = [];
    let after: string | undefined;
    let totalCount = 0;

    do {
      const result = await this.fetchDeals({
        limit: this.batchSize,
        after,
        properties: options.properties,
        filter: options.filter,
      });

      allDeals.push(...result.deals);
      totalCount += result.deals.length;
      
      after = result.paging?.next?.after;
      
      if (options.onProgress) {
        options.onProgress(totalCount);
      }

      logger.info({
        totalFetched: totalCount,
        hasNextPage: !!after,
      }, 'Progress fetching all deals');

    } while (after);

    logger.info({ totalDeals: allDeals.length }, 'Completed fetching all deals');
    return allDeals;
  }

  /**
   * Get CRM analytics and metrics
   */
  async getCRMMetrics(): Promise<{
    totalContacts: number;
    totalCompanies: number;
    totalDeals: number;
    totalDealValue: number;
    averageDealSize: number;
    conversionRate: number;
  }> {
    try {
      const [contacts, companies, deals] = await Promise.all([
        this.fetchAllContacts({ properties: ['email', 'firstname', 'lastname'] }),
        this.fetchAllCompanies({ properties: ['name', 'domain', 'industry'] }),
        this.fetchAllDeals({ properties: ['dealname', 'amount', 'dealstage', 'closedate'] }),
      ]);

      const totalDealValue = deals.reduce((sum, deal) => {
        const amount = parseFloat(deal.properties.amount || '0');
        return sum + amount;
      }, 0);

      const closedWonDeals = deals.filter(deal => 
        deal.properties.dealstage === 'closedwon'
      ).length;

      const conversionRate = deals.length > 0 ? 
        (closedWonDeals / deals.length) * 100 : 0;

      const averageDealSize = deals.length > 0 ? 
        totalDealValue / deals.length : 0;

      return {
        totalContacts: contacts.length,
        totalCompanies: companies.length,
        totalDeals: deals.length,
        totalDealValue,
        averageDealSize,
        conversionRate,
      };
    } catch (error) {
      logger.error({ error }, 'Failed to get CRM metrics');
      throw error;
    }
  }
} 