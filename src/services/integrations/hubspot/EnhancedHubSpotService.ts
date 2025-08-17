import { BaseService } from '@/core/services/BaseService';
import type { ServiceResponse } from '@/core/services/BaseService';
import { selectData as select, selectOne, insertOne, updateOne, deleteOne, callEdgeFunction } from '@/lib/api-client';
import { logger } from '@/shared/utils/logger';
import { retryFetch } from '@/shared/utils/retry';

// Enhanced HubSpot data types with intelligence
export interface HubSpotContact {
  id: string;
  properties: {
    email?: string;
    firstname?: string;
    lastname?: string;
    company?: string;
    phone?: string;
    lifecyclestage?: string;
    createdate?: string;
    associatedcompanyid?: string;
    jobtitle?: string;
    department?: string;
    lead_status?: string;
    last_activity_date?: string;
    total_revenue?: string;
    num_contacted_notes?: string;
    num_notes?: string;
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
}

export interface HubSpotCompany {
  id: string;
  properties: {
    name?: string;
    domain?: string;
    industry?: string;
    numberofemployees?: string;
    annualrevenue?: string;
    website?: string;
    description?: string;
    lifecyclestage?: string;
    createdate?: string;
    total_revenue?: string;
    num_contacts?: string;
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
}

export interface HubSpotDeal {
  id: string;
  properties: {
    dealname?: string;
    amount?: string;
    dealstage?: string;
    closedate?: string;
    pipeline?: string;
    hs_is_closed_won?: string;
    associatedcompanyid?: string;
    probability?: string;
    hs_deal_stage_probability?: string;
    hs_is_closed?: string;
    hs_is_closed_lost?: string;
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
}

// Cross-platform intelligence types
export interface CrossPlatformInsight {
  id: string;
  type: 'client_health' | 'revenue_optimization' | 'churn_risk' | 'upsell_opportunity';
  confidence: number;
  platforms: string[];
  data: Record<string, any>;
  businessImpact: 'low' | 'medium' | 'high' | 'critical';
  actionableRecommendations: string[];
  createdAt: string;
}

export interface ClientHealthScore {
  clientId: string;
  overallScore: number;
  crmHealthScore: number;
  paymentHealthScore: number;
  usageHealthScore: number;
  supportHealthScore: number;
  churnRiskPercentage: number;
  lastUpdated: string;
  insights: string[];
}

export class EnhancedHubSpotService extends BaseService {
  private readonly apiBaseUrl = 'https://api.hubapi.com/crm/v3';
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000;

  constructor() {
    super('enhanced-hubspot');
  }

  /**
   * Get HubSpot access token for user
   */
  private async getAccessToken(userId: string): Promise<string> {
    const { data: tokenData, error } = await supabase
      .from('oauth_tokens')
      .select('access_token, refresh_token, expires_at')
      .eq('user_id', userId)
      .eq('provider', 'hubspot')
      .single();

    if (error || !tokenData) {
      throw new Error('HubSpot integration not found or tokens not available');
    }

    // Check if token is expired and refresh if needed
    if (tokenData.expires_at && new Date(tokenData.expires_at) <= new Date()) {
      return await this.refreshAccessToken(userId, tokenData.refresh_token);
    }

    return tokenData.access_token;
  }

  /**
   * Refresh HubSpot access token
   */
  private async refreshAccessToken(userId: string, refreshToken: string): Promise<string> {
    const response = await fetch('https://api.hubapi.com/oauth/v1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: '', // Will be fetched from server-side API
        client_secret: '', // Server-side only
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh HubSpot access token');
    }

    const refreshData = await response.json();

    // Update tokens in database
    await supabase
      .from('oauth_tokens')
      .update({
        access_token: refreshData.access_token,
        refresh_token: refreshData.refresh_token || refreshToken,
        expires_at: new Date(Date.now() + refreshData.expires_in * 1000).toISOString(),
      })
      .eq('user_id', userId)
      .eq('provider', 'hubspot');

    return refreshData.access_token;
  }

  /**
   * Enhanced HubSpot data sync with intelligence
   */
  async syncHubSpotDataWithIntelligence(userId: string): Promise<ServiceResponse<{
    contactsSynced: number;
    companiesSynced: number;
    dealsSynced: number;
    insights: CrossPlatformInsight[];
    clientHealthScores: ClientHealthScore[];
  }>> {
    return this.executeDbOperation(async () => {
      try {
        const accessToken = await this.getAccessToken(userId);
        
        // Sync all HubSpot data
        const [contacts, companies, deals] = await Promise.all([
          this.fetchHubSpotContacts(accessToken),
          this.fetchHubSpotCompanies(accessToken),
          this.fetchHubSpotDeals(accessToken),
        ]);

        // Store data in database
        const syncResults = await Promise.all([
          this.storeContacts(contacts, userId),
          this.storeCompanies(companies, userId),
          this.storeDeals(deals, userId),
        ]);

        // Generate cross-platform insights
        const insights = await this.generateCrossPlatformInsights(contacts, companies, deals, userId);

        // Calculate client health scores
        const clientHealthScores = await this.calculateClientHealthScores(contacts, companies, deals, userId);

        // Update integration status
        await this.updateIntegrationStatus(userId, {
          last_sync: new Date().toISOString(),
          data_count: contacts.length + companies.length + deals.length,
          insights_generated: insights.length,
        });

        return {
          data: {
            contactsSynced: syncResults[0],
            companiesSynced: syncResults[1],
            dealsSynced: syncResults[2],
            insights,
            clientHealthScores,
          },
          error: null,
        };
      } catch (error) {
        return this.handleError('Failed to sync HubSpot data with intelligence', error);
      }
    }, 'syncHubSpotDataWithIntelligence');
  }

  /**
   * Fetch HubSpot contacts with enhanced properties
   */
  private async fetchHubSpotContacts(accessToken: string): Promise<HubSpotContact[]> {
    const properties = [
      'email', 'firstname', 'lastname', 'company', 'phone', 'lifecyclestage',
      'createdate', 'associatedcompanyid', 'jobtitle', 'department',
      'lead_status', 'last_activity_date', 'total_revenue',
      'num_contacted_notes', 'num_notes'
    ].join(',');

    const response = await retryFetch(
      `${this.apiBaseUrl}/objects/contacts?limit=100&properties=${properties}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      },
      this.maxRetries,
      this.retryDelay
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch HubSpot contacts: ${response.statusText}`);
    }

    const data = await response.json();
    return data.results || [];
  }

  /**
   * Fetch HubSpot companies with enhanced properties
   */
  private async fetchHubSpotCompanies(accessToken: string): Promise<HubSpotCompany[]> {
    const properties = [
      'name', 'domain', 'industry', 'numberofemployees', 'annualrevenue',
      'website', 'description', 'lifecyclestage', 'createdate',
      'total_revenue', 'num_contacts'
    ].join(',');

    const response = await retryFetch(
      `${this.apiBaseUrl}/objects/companies?limit=100&properties=${properties}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      },
      this.maxRetries,
      this.retryDelay
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch HubSpot companies: ${response.statusText}`);
    }

    const data = await response.json();
    return data.results || [];
  }

  /**
   * Fetch HubSpot deals with enhanced properties
   */
  private async fetchHubSpotDeals(accessToken: string): Promise<HubSpotDeal[]> {
    const properties = [
      'dealname', 'amount', 'dealstage', 'closedate', 'pipeline',
      'hs_is_closed_won', 'associatedcompanyid', 'probability',
      'hs_deal_stage_probability', 'hs_is_closed', 'hs_is_closed_lost'
    ].join(',');

    const response = await retryFetch(
      `${this.apiBaseUrl}/objects/deals?limit=100&properties=${properties}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      },
      this.maxRetries,
      this.retryDelay
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch HubSpot deals: ${response.statusText}`);
    }

    const data = await response.json();
    return data.results || [];
  }

  /**
   * Store contacts in database
   */
  private async storeContacts(contacts: HubSpotContact[], userId: string): Promise<number> {
    let synced = 0;
    
    for (const contact of contacts) {
      try {
        const contactData = {
          email: contact.properties.email,
          first_name: contact.properties.firstname,
          last_name: contact.properties.lastname,
          phone: contact.properties.phone,
          job_title: contact.properties.jobtitle,
          department: contact.properties.department,
          user_id: userId,
          hubspotid: contact.id,
          metadata: {
            lifecycle_stage: contact.properties.lifecyclestage,
            lead_status: contact.properties.lead_status,
            total_revenue: contact.properties.total_revenue,
            num_notes: contact.properties.num_notes,
            last_activity_date: contact.properties.last_activity_date,
          },
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from('contacts')
          .upsert(contactData, { onConflict: 'hubspotid' });

        if (!error) synced++;
      } catch (error) {
        logger.error(`Failed to store contact ${contact.id}:`, error);
      }
    }

    return synced;
  }

  /**
   * Store companies in database
   */
  private async storeCompanies(companies: HubSpotCompany[], userId: string): Promise<number> {
    let synced = 0;
    
    for (const company of companies) {
      try {
        const getCompanySize = (employeeCount: string | number) => {
          const count = parseInt(employeeCount as string) || 0;
          if (count === 0) return 'startup';
          if (count <= 10) return 'small';
          if (count <= 50) return 'medium';
          if (count <= 200) return 'large';
          return 'enterprise';
        };

        const companyData = {
          name: company.properties.name || 'Unknown Company',
          domain: company.properties.domain || `hubspot-id-${company.id}`,
          industry: company.properties.industry || 'Unknown',
          size: getCompanySize(company.properties.numberofemployees),
          description: company.properties.description,
          website: company.properties.website,
          hubspotid: company.id,
          metadata: {
            lifecycle_stage: company.properties.lifecyclestage,
            annual_revenue: company.properties.annualrevenue,
            total_revenue: company.properties.total_revenue,
            num_contacts: company.properties.num_contacts,
          },
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from('companies')
          .upsert(companyData, { onConflict: 'hubspotid' });

        if (!error) synced++;
      } catch (error) {
        logger.error(`Failed to store company ${company.id}:`, error);
      }
    }

    return synced;
  }

  /**
   * Store deals in database
   */
  private async storeDeals(deals: HubSpotDeal[], userId: string): Promise<number> {
    let synced = 0;
    
    for (const deal of deals) {
      try {
        const dealData = {
          title: deal.properties.dealname || 'Unnamed Deal',
          amount: parseFloat(deal.properties.amount || '0'),
          stage: deal.properties.dealstage || 'prospecting',
          close_date: deal.properties.closedate ? new Date(deal.properties.closedate).toISOString() : null,
          user_id: userId,
          hubspotid: deal.id,
          metadata: {
            pipeline: deal.properties.pipeline,
            probability: deal.properties.probability,
            is_closed: deal.properties.hs_is_closed === 'true',
            is_closed_won: deal.properties.hs_is_closed_won === 'true',
            is_closed_lost: deal.properties.hs_is_closed_lost === 'true',
          },
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from('deals')
          .upsert(dealData, { onConflict: 'hubspotid' });

        if (!error) synced++;
      } catch (error) {
        logger.error(`Failed to store deal ${deal.id}:`, error);
      }
    }

    return synced;
  }

  /**
   * Generate cross-platform insights
   */
  private async generateCrossPlatformInsights(
    contacts: HubSpotContact[],
    companies: HubSpotCompany[],
    deals: HubSpotDeal[],
    userId: string
  ): Promise<CrossPlatformInsight[]> {
    const insights: CrossPlatformInsight[] = [];

    // Client health insights
    const clientHealthInsights = this.analyzeClientHealth(contacts, companies, deals);
    insights.push(...clientHealthInsights);

    // Revenue optimization insights
    const revenueInsights = this.analyzeRevenueOptimization(contacts, companies, deals);
    insights.push(...revenueInsights);

    // Churn risk insights
    const churnInsights = this.analyzeChurnRisk(contacts, companies, deals);
    insights.push(...churnInsights);

    // Store insights in database
    await this.storeInsights(insights, userId);

    return insights;
  }

  /**
   * Analyze client health patterns
   */
  private analyzeClientHealth(
    contacts: HubSpotContact[],
    companies: HubSpotCompany[],
    deals: HubSpotDeal[]
  ): CrossPlatformInsight[] {
    const insights: CrossPlatformInsight[] = [];

    // Analyze inactive clients
    const inactiveClients = contacts.filter(contact => {
      const lastActivity = contact.properties.last_activity_date;
      if (!lastActivity) return false;
      const daysSinceActivity = (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceActivity > 30;
    });

    if (inactiveClients.length > 0) {
      insights.push({
        id: crypto.randomUUID(),
        type: 'client_health',
        confidence: 85,
        platforms: ['hubspot'],
        data: {
          inactiveClients: inactiveClients.length,
          totalClients: contacts.length,
          inactivePercentage: (inactiveClients.length / contacts.length) * 100,
        },
        businessImpact: 'medium',
        actionableRecommendations: [
          'Reach out to inactive clients with personalized re-engagement campaigns',
          'Analyze why clients became inactive and implement preventive measures',
          'Create automated follow-up sequences for clients showing signs of disengagement',
        ],
        createdAt: new Date().toISOString(),
      });
    }

    return insights;
  }

  /**
   * Analyze revenue optimization opportunities
   */
  private analyzeRevenueOptimization(
    contacts: HubSpotContact[],
    companies: HubSpotCompany[],
    deals: HubSpotDeal[]
  ): CrossPlatformInsight[] {
    const insights: CrossPlatformInsight[] = [];

    // Analyze high-value clients with low engagement
    const highValueLowEngagement = contacts.filter(contact => {
      const revenue = parseFloat(contact.properties.total_revenue || '0');
      const notes = parseInt(contact.properties.num_notes || '0');
      return revenue > 10000 && notes < 5;
    });

    if (highValueLowEngagement.length > 0) {
      insights.push({
        id: crypto.randomUUID(),
        type: 'revenue_optimization',
        confidence: 92,
        platforms: ['hubspot'],
        data: {
          highValueLowEngagement: highValueLowEngagement.length,
          totalHighValue: contacts.filter(c => parseFloat(c.properties.total_revenue || '0') > 10000).length,
          opportunityValue: highValueLowEngagement.reduce((sum, c) => sum + parseFloat(c.properties.total_revenue || '0'), 0),
        },
        businessImpact: 'high',
        actionableRecommendations: [
          'Implement dedicated account management for high-value clients',
          'Create personalized engagement strategies for each high-value client',
          'Develop upsell opportunities based on client needs analysis',
        ],
        createdAt: new Date().toISOString(),
      });
    }

    return insights;
  }

  /**
   * Analyze churn risk patterns
   */
  private analyzeChurnRisk(
    contacts: HubSpotContact[],
    companies: HubSpotCompany[],
    deals: HubSpotDeal[]
  ): CrossPlatformInsight[] {
    const insights: CrossPlatformInsight[] = [];

    // Analyze clients with declining engagement
    const decliningEngagement = contacts.filter(contact => {
      const notes = parseInt(contact.properties.num_notes || '0');
      const contactedNotes = parseInt(contact.properties.num_contacted_notes || '0');
      const ratio = contactedNotes / Math.max(notes, 1);
      return ratio < 0.3 && notes > 3;
    });

    if (decliningEngagement.length > 0) {
      insights.push({
        id: crypto.randomUUID(),
        type: 'churn_risk',
        confidence: 78,
        platforms: ['hubspot'],
        data: {
          atRiskClients: decliningEngagement.length,
          totalClients: contacts.length,
          riskPercentage: (decliningEngagement.length / contacts.length) * 100,
        },
        businessImpact: 'high',
        actionableRecommendations: [
          'Implement proactive outreach to at-risk clients',
          'Analyze root causes of declining engagement',
          'Create retention campaigns with personalized offers',
        ],
        createdAt: new Date().toISOString(),
      });
    }

    return insights;
  }

  /**
   * Calculate client health scores
   */
  private async calculateClientHealthScores(
    contacts: HubSpotContact[],
    companies: HubSpotCompany[],
    deals: HubSpotDeal[],
    userId: string
  ): Promise<ClientHealthScore[]> {
    const healthScores: ClientHealthScore[] = [];

    for (const contact of contacts) {
      const crmHealthScore = this.calculateCRMHealthScore(contact);
      const paymentHealthScore = this.calculatePaymentHealthScore(contact);
      const usageHealthScore = this.calculateUsageHealthScore(contact);
      const supportHealthScore = this.calculateSupportHealthScore(contact);

      const overallScore = Math.round(
        (crmHealthScore + paymentHealthScore + usageHealthScore + supportHealthScore) / 4
      );

      const churnRiskPercentage = this.calculateChurnRisk(contact, overallScore);

      const insights = this.generateClientInsights(contact, overallScore);

      healthScores.push({
        clientId: contact.id,
        overallScore,
        crmHealthScore,
        paymentHealthScore,
        usageHealthScore,
        supportHealthScore,
        churnRiskPercentage,
        lastUpdated: new Date().toISOString(),
        insights,
      });
    }

    // Store health scores in database
    await this.storeClientHealthScores(healthScores, userId);

    return healthScores;
  }

  /**
   * Calculate CRM health score based on contact data
   */
  private calculateCRMHealthScore(contact: HubSpotContact): number {
    let score = 50; // Base score

    // Lifecycle stage scoring
    const lifecycleStage = contact.properties.lifecyclestage;
    if (lifecycleStage === 'customer') score += 30;
    else if (lifecycleStage === 'lead') score += 20;
    else if (lifecycleStage === 'opportunity') score += 25;
    else if (lifecycleStage === 'subscriber') score += 15;

    // Activity scoring
    const notes = parseInt(contact.properties.num_notes || '0');
    if (notes > 10) score += 20;
    else if (notes > 5) score += 15;
    else if (notes > 0) score += 10;

    // Recent activity scoring
    const lastActivity = contact.properties.last_activity_date;
    if (lastActivity) {
      const daysSinceActivity = (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceActivity <= 7) score += 20;
      else if (daysSinceActivity <= 30) score += 10;
      else if (daysSinceActivity > 90) score -= 20;
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Calculate payment health score
   */
  private calculatePaymentHealthScore(contact: HubSpotContact): number {
    let score = 50; // Base score

    const revenue = parseFloat(contact.properties.total_revenue || '0');
    if (revenue > 50000) score += 30;
    else if (revenue > 10000) score += 20;
    else if (revenue > 1000) score += 10;

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Calculate usage health score
   */
  private calculateUsageHealthScore(contact: HubSpotContact): number {
    let score = 50; // Base score

    const notes = parseInt(contact.properties.num_notes || '0');
    const contactedNotes = parseInt(contact.properties.num_contacted_notes || '0');
    
    if (notes > 0) {
      const engagementRatio = contactedNotes / notes;
      if (engagementRatio > 0.8) score += 30;
      else if (engagementRatio > 0.5) score += 20;
      else if (engagementRatio > 0.3) score += 10;
      else score -= 20;
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Calculate support health score
   */
  private calculateSupportHealthScore(contact: HubSpotContact): number {
    let score = 50; // Base score

    // This would be enhanced with support ticket data from other platforms
    // For now, using engagement as a proxy
    const notes = parseInt(contact.properties.num_notes || '0');
    if (notes > 5) score += 20;
    else if (notes > 0) score += 10;

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Calculate churn risk percentage
   */
  private calculateChurnRisk(contact: HubSpotContact, overallScore: number): number {
    let risk = 50; // Base risk

    // Adjust based on overall health score
    if (overallScore < 30) risk += 40;
    else if (overallScore < 50) risk += 20;
    else if (overallScore > 80) risk -= 30;

    // Adjust based on activity
    const lastActivity = contact.properties.last_activity_date;
    if (lastActivity) {
      const daysSinceActivity = (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceActivity > 90) risk += 30;
      else if (daysSinceActivity > 60) risk += 20;
      else if (daysSinceActivity > 30) risk += 10;
    }

    return Math.min(100, Math.max(0, risk));
  }

  /**
   * Generate client-specific insights
   */
  private generateClientInsights(contact: HubSpotContact, overallScore: number): string[] {
    const insights: string[] = [];

    if (overallScore < 30) {
      insights.push('Client shows signs of disengagement - immediate intervention recommended');
    } else if (overallScore < 50) {
      insights.push('Client engagement is declining - proactive outreach needed');
    } else if (overallScore > 80) {
      insights.push('Client is highly engaged - upsell opportunities available');
    }

    const revenue = parseFloat(contact.properties.total_revenue || '0');
    if (revenue > 10000) {
      insights.push('High-value client - prioritize relationship management');
    }

    const notes = parseInt(contact.properties.num_notes || '0');
    if (notes < 3) {
      insights.push('Limited interaction history - increase engagement touchpoints');
    }

    return insights;
  }

  /**
   * Store insights in database
   */
  private async storeInsights(insights: CrossPlatformInsight[], userId: string): Promise<void> {
    for (const insight of insights) {
      try {
        await supabase
          .from('ai_insights')
          .upsert({
            user_id: userId,
            insight_type: insight.type,
            insight_data: insight.data,
            confidence_score: insight.confidence,
            platforms: insight.platforms,
            business_impact: insight.businessImpact,
            actionable_recommendations: insight.actionableRecommendations,
            created_at: insight.createdAt,
          });
      } catch (error) {
        logger.error(`Failed to store insight ${insight.id}:`, error);
      }
    }
  }

  /**
   * Store client health scores in database
   */
  private async storeClientHealthScores(healthScores: ClientHealthScore[], userId: string): Promise<void> {
    for (const healthScore of healthScores) {
      try {
        await supabase
          .from('client_health_scores')
          .upsert({
            user_id: userId,
            client_id: healthScore.clientId,
            overall_health_score: healthScore.overallScore,
            crm_health_score: healthScore.crmHealthScore,
            payment_health_score: healthScore.paymentHealthScore,
            usage_health_score: healthScore.usageHealthScore,
            support_health_score: healthScore.supportHealthScore,
            churn_risk_percentage: healthScore.churnRiskPercentage,
            insights: healthScore.insights,
            last_updated: healthScore.lastUpdated,
          });
      } catch (error) {
        logger.error(`Failed to store health score for client ${healthScore.clientId}:`, error);
      }
    }
  }

  /**
   * Update integration status
   */
  private async updateIntegrationStatus(userId: string, status: any): Promise<void> {
    await supabase
      .from('user_integrations')
      .update({
        credentials: {
          oauth_connected: true,
          ...status,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
                .eq('integration_slug', 'HubSpot');
  }

  /**
   * Get cross-platform insights for user
   */
  async getCrossPlatformInsights(userId: string): Promise<ServiceResponse<CrossPlatformInsight[]>> {
    return this.executeDbOperation(async () => {
      try {
        const { data: insights, error } = await supabase
          .from('ai_insights')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        return {
          data: insights || [],
          error: null,
        };
      } catch (error) {
        return this.handleError('Failed to get cross-platform insights', error);
      }
    }, 'getCrossPlatformInsights');
  }

  /**
   * Get client health scores for user
   */
  async getClientHealthScores(userId: string): Promise<ServiceResponse<ClientHealthScore[]>> {
    return this.executeDbOperation(async () => {
      try {
        const { data: healthScores, error } = await supabase
          .from('client_health_scores')
          .select('*')
          .eq('user_id', userId)
          .order('last_updated', { ascending: false });

        if (error) throw error;

        return {
          data: healthScores || [],
          error: null,
        };
      } catch (error) {
        return this.handleError('Failed to get client health scores', error);
      }
    }, 'getClientHealthScores');
  }
}
