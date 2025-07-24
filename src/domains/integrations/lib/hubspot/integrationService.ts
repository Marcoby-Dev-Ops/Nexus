/**
 * HubSpot Integration Service
 * 
 * Provides high-level business operations using HubSpot CRM data
 * Based on: https://developers.hubspot.com/docs/getting-started/what-to-build
 */

import { SecureLogger } from '@/shared/lib/security/logger';
import { HubSpotDataFetcher, type HubSpotContact, type HubSpotCompany, type HubSpotDeal } from './dataFetcher';
import { getHubspotConfig } from './config';

const logger = new SecureLogger('HubSpotIntegrationService');

export interface HubSpotIntegrationOptions {
  accessToken: string;
  portalId?: string;
  userId: string;
}

export interface HubSpotBusinessMetrics {
  salesPipeline: {
    totalDeals: number;
    totalValue: number;
    averageDealSize: number;
    conversionRate: number;
    dealsByStage: Record<string, number>;
  };
  customerInsights: {
    totalContacts: number;
    totalCompanies: number;
    newContactsThisMonth: number;
    topIndustries: Array<{ industry: string; count: number }>;
  };
  revenueAnalytics: {
    totalRevenue: number;
    monthlyRecurringRevenue: number;
    averageCustomerValue: number;
    topCustomers: Array<{ name: string; value: number }>;
  };
}

export interface HubSpotSyncResult {
  success: boolean;
  contactsSynced: number;
  companiesSynced: number;
  dealsSynced: number;
  errors: string[];
  duration: number;
}

export class HubSpotIntegrationService {
  private dataFetcher: HubSpotDataFetcher;
  private userId: string;
  private portalId?: string;

  constructor(options: HubSpotIntegrationOptions) {
    this.dataFetcher = new HubSpotDataFetcher({
      accessToken: options.accessToken,
      portalId: options.portalId,
      batchSize: 100,
      properties: [
        // Contact properties
        'email', 'firstname', 'lastname', 'phone', 'company', 'jobtitle',
        'lifecyclestage', 'leadstatus', 'createdate', 'lastmodifieddate',
        // Company properties
        'name', 'domain', 'industry', 'website', 'phone', 'address',
        'numberofemployees', 'annualrevenue', 'lifecyclestage',
        // Deal properties
        'dealname', 'amount', 'dealstage', 'closedate', 'pipeline',
        'hs_is_closed', 'hs_is_closed_won', 'hs_is_closed_lost'
      ]
    });
    this.userId = options.userId;
    this.portalId = options.portalId;
  }

  /**
   * Get comprehensive business metrics from HubSpot
   */
  async getBusinessMetrics(): Promise<HubSpotBusinessMetrics> {
    try {
      logger.info({ userId: this.userId }, 'Fetching HubSpot business metrics');

      const [contacts, companies, deals] = await Promise.all([
        this.dataFetcher.fetchAllContacts({
          properties: ['email', 'firstname', 'lastname', 'company', 'lifecyclestage', 'createdate']
        }),
        this.dataFetcher.fetchAllCompanies({
          properties: ['name', 'domain', 'industry', 'numberofemployees', 'annualrevenue']
        }),
        this.dataFetcher.fetchAllDeals({
          properties: ['dealname', 'amount', 'dealstage', 'closedate', 'pipeline', 'hs_is_closed_won']
        })
      ]);

      // Calculate sales pipeline metrics
      const totalDealValue = deals.reduce((sum, deal) => {
        return sum + parseFloat(deal.properties.amount || '0');
      }, 0);

      const closedWonDeals = deals.filter(deal => 
        deal.properties.hs_is_closed_won === 'true'
      );

      const dealsByStage = deals.reduce((acc, deal) => {
        const stage = deal.properties.dealstage || 'Unknown';
        acc[stage] = (acc[stage] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Calculate customer insights
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);

      const newContactsThisMonth = contacts.filter(contact => {
        const createdDate = new Date(contact.properties.createdate);
        return createdDate >= thisMonth;
      }).length;

      const industryCounts = companies.reduce((acc, company) => {
        const industry = company.properties.industry || 'Unknown';
        acc[industry] = (acc[industry] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topIndustries = Object.entries(industryCounts)
        .map(([industry, count]) => ({ industry, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Calculate revenue analytics
      const totalRevenue = closedWonDeals.reduce((sum, deal) => {
        return sum + parseFloat(deal.properties.amount || '0');
      }, 0);

      const averageCustomerValue = companies.length > 0 ? 
        totalRevenue / companies.length: 0;

      const topCustomers = companies
        .map(company => ({
          name: company.properties.name || 'Unknown',
          value: parseFloat(company.properties.annualrevenue || '0')
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

      const metrics: HubSpotBusinessMetrics = {
        salesPipeline: {
          totalDeals: deals.length,
          totalValue: totalDealValue,
          averageDealSize: deals.length > 0 ? totalDealValue / deals.length : 0,
          conversionRate: deals.length > 0 ? (closedWonDeals.length / deals.length) * 100: 0,
          dealsByStage
        },
        customerInsights: {
          totalContacts: contacts.length,
          totalCompanies: companies.length,
          newContactsThisMonth,
          topIndustries
        },
        revenueAnalytics: {
          totalRevenue,
          monthlyRecurringRevenue: totalRevenue / 12, // Simplified calculation
          averageCustomerValue,
          topCustomers
        }
      };

      logger.info({
        userId: this.userId,
        totalContacts: metrics.customerInsights.totalContacts,
        totalCompanies: metrics.customerInsights.totalCompanies,
        totalDeals: metrics.salesPipeline.totalDeals,
        totalRevenue: metrics.revenueAnalytics.totalRevenue
      }, 'Successfully calculated HubSpot business metrics');

      return metrics;
    } catch (error) {
      logger.error({ userId: this.userId, error }, 'Failed to get business metrics');
      throw error;
    }
  }

  /**
   * Sync HubSpot data to local database
   */
  async syncDataToDatabase(): Promise<HubSpotSyncResult> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      logger.info({ userId: this.userId }, 'Starting HubSpot data sync');

      // Fetch all data with progress tracking
      let contactsSynced = 0;
      let companiesSynced = 0;
      let dealsSynced = 0;

      const [contacts, companies, deals] = await Promise.all([
        this.dataFetcher.fetchAllContacts({
          onProgress: (count) => {
            contactsSynced = count;
            logger.info({ userId: this.userId, contactsSynced }, 'Progress: contacts synced');
          }
        }),
        this.dataFetcher.fetchAllCompanies({
          onProgress: (count) => {
            companiesSynced = count;
            logger.info({ userId: this.userId, companiesSynced }, 'Progress: companies synced');
          }
        }),
        this.dataFetcher.fetchAllDeals({
          onProgress: (count) => {
            dealsSynced = count;
            logger.info({ userId: this.userId, dealsSynced }, 'Progress: deals synced');
          }
        })
      ]);

      // Store in local database (implement based on your database schema)
      await this.storeContactsInDatabase(contacts);
      await this.storeCompaniesInDatabase(companies);
      await this.storeDealsInDatabase(deals);

      const duration = Date.now() - startTime;

      logger.info({
        userId: this.userId,
        contactsSynced: contacts.length,
        companiesSynced: companies.length,
        dealsSynced: deals.length,
        duration
      }, 'HubSpot data sync completed successfully');

      return {
        success: true,
        contactsSynced: contacts.length,
        companiesSynced: companies.length,
        dealsSynced: deals.length,
        errors,
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      errors.push(error instanceof Error ? error.message: String(error));

      logger.error({
        userId: this.userId,
        error,
        duration
      }, 'HubSpot data sync failed');

      return {
        success: false,
        contactsSynced: 0,
        companiesSynced: 0,
        dealsSynced: 0,
        errors,
        duration
      };
    }
  }

  /**
   * Get sales pipeline analysis
   */
  async getSalesPipelineAnalysis(): Promise<{
    pipeline: Array<{
      stage: string;
      dealCount: number;
      totalValue: number;
      averageValue: number;
    }>;
    conversionRates: Record<string, number>;
    topDeals: Array<{
      name: string;
      value: number;
      stage: string;
      closeDate: string;
    }>;
  }> {
    try {
      const deals = await this.dataFetcher.fetchAllDeals({
        properties: ['dealname', 'amount', 'dealstage', 'closedate', 'pipeline']
      });

      // Group deals by stage
      const pipelineByStage = deals.reduce((acc, deal) => {
        const stage = deal.properties.dealstage || 'Unknown';
        if (!acc[stage]) {
          acc[stage] = {
            stage,
            dealCount: 0,
            totalValue: 0,
            averageValue: 0
          };
        }
        
        const value = parseFloat(deal.properties.amount || '0');
        acc[stage].dealCount++;
        acc[stage].totalValue += value;
        acc[stage].averageValue = acc[stage].totalValue / acc[stage].dealCount;
        
        return acc;
      }, {} as Record<string, any>);

      const pipeline = Object.values(pipelineByStage);

      // Calculate conversion rates between stages
      const conversionRates: Record<string, number> = {};
      const stages = pipeline.map(p => p.stage);
      
      for (let i = 0; i < stages.length - 1; i++) {
        const currentStage = stages[i];
        const nextStage = stages[i + 1];
        const currentCount = pipelineByStage[currentStage]?.dealCount || 0;
        const nextCount = pipelineByStage[nextStage]?.dealCount || 0;
        
        if (currentCount > 0) {
          conversionRates[`${currentStage}_to_${nextStage}`] = (nextCount / currentCount) * 100;
        }
      }

      // Get top deals by value
      const topDeals = deals
        .map(deal => ({
          name: deal.properties.dealname || 'Unnamed Deal',
          value: parseFloat(deal.properties.amount || '0'),
          stage: deal.properties.dealstage || 'Unknown',
          closeDate: deal.properties.closedate || 'Unknown'
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

      return {
        pipeline,
        conversionRates,
        topDeals
      };
    } catch (error) {
      logger.error({ userId: this.userId, error }, 'Failed to get sales pipeline analysis');
      throw error;
    }
  }

  /**
   * Get customer insights and segmentation
   */
  async getCustomerInsights(): Promise<{
    segments: Array<{
      name: string;
      criteria: string;
      contactCount: number;
      averageValue: number;
    }>;
    topCustomers: Array<{
      name: string;
      email: string;
      company: string;
      totalValue: number;
      dealCount: number;
    }>;
    industryAnalysis: Array<{
      industry: string;
      companyCount: number;
      averageRevenue: number;
      totalRevenue: number;
    }>;
  }> {
    try {
      const [contacts, companies, deals] = await Promise.all([
        this.dataFetcher.fetchAllContacts({
          properties: ['email', 'firstname', 'lastname', 'company', 'lifecyclestage']
        }),
        this.dataFetcher.fetchAllCompanies({
          properties: ['name', 'industry', 'annualrevenue', 'numberofemployees']
        }),
        this.dataFetcher.fetchAllDeals({
          properties: ['dealname', 'amount', 'associatedcompanyid', 'dealstage']
        })
      ]);

      // Create customer segments
      const segments = [
        {
          name: 'High-Value Customers',
          criteria: 'Companies with revenue > $100k',
          contactCount: companies.filter(c => parseFloat(c.properties.annualrevenue || '0') > 100000).length,
          averageValue: 0 // Calculate based on deals
        },
        {
          name: 'Enterprise Customers',
          criteria: 'Companies with > 100 employees',
          contactCount: companies.filter(c => parseInt(c.properties.numberofemployees || '0') > 100).length,
          averageValue: 0
        },
        {
          name: 'New Leads',
          criteria: 'Contacts in lead stage',
          contactCount: contacts.filter(c => c.properties.lifecyclestage === 'lead').length,
          averageValue: 0
        }
      ];

      // Get top customers by deal value
      const customerDeals = deals.reduce((acc, deal) => {
        const companyId = deal.properties.associatedcompanyid;
        if (companyId) {
          if (!acc[companyId]) {
            acc[companyId] = { totalValue: 0, dealCount: 0 };
          }
          acc[companyId].totalValue += parseFloat(deal.properties.amount || '0');
          acc[companyId].dealCount++;
        }
        return acc;
      }, {} as Record<string, { totalValue: number; dealCount: number }>);

      const topCustomers = Object.entries(customerDeals)
        .map(([companyId, data]) => {
          const company = companies.find(c => c.id === companyId);
          const companyContacts = contacts.filter(c => c.properties.company === company?.properties.name);
          
          return {
            name: companyContacts[0]?.properties.firstname + ' ' + companyContacts[0]?.properties.lastname || 'Unknown',
            email: companyContacts[0]?.properties.email || 'Unknown',
            company: company?.properties.name || 'Unknown',
            totalValue: data.totalValue,
            dealCount: data.dealCount
          };
        })
        .sort((a, b) => b.totalValue - a.totalValue)
        .slice(0, 10);

      // Industry analysis
      const industryAnalysis = companies.reduce((acc, company) => {
        const industry = company.properties.industry || 'Unknown';
        const revenue = parseFloat(company.properties.annualrevenue || '0');
        
        if (!acc[industry]) {
          acc[industry] = {
            industry,
            companyCount: 0,
            averageRevenue: 0,
            totalRevenue: 0
          };
        }
        
        acc[industry].companyCount++;
        acc[industry].totalRevenue += revenue;
        acc[industry].averageRevenue = acc[industry].totalRevenue / acc[industry].companyCount;
        
        return acc;
      }, {} as Record<string, any>);

      return {
        segments,
        topCustomers,
        industryAnalysis: Object.values(industryAnalysis)
      };
    } catch (error) {
      logger.error({ userId: this.userId, error }, 'Failed to get customer insights');
      throw error;
    }
  }

  // Private methods for database operations
  private async storeContactsInDatabase(contacts: HubSpotContact[]): Promise<void> {
    // Implement based on your database schema
    logger.info({ userId: this.userId, contactCount: contacts.length }, 'Storing contacts in database');
  }

  private async storeCompaniesInDatabase(companies: HubSpotCompany[]): Promise<void> {
    // Implement based on your database schema
    logger.info({ userId: this.userId, companyCount: companies.length }, 'Storing companies in database');
  }

  private async storeDealsInDatabase(deals: HubSpotDeal[]): Promise<void> {
    // Implement based on your database schema
    logger.info({ userId: this.userId, dealCount: deals.length }, 'Storing deals in database');
  }
} 