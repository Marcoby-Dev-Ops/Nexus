import { BaseService, type ServiceResponse } from '@/core/services/BaseService';
import { selectData as select, selectOne, insertOne, updateOne, deleteOne, callEdgeFunction } from '@/lib/database';
import { logger } from '@/shared/utils/logger';

interface HubSpotContact {
  id: string;
  properties: {
    email?: string;
    firstname?: string;
    lastname?: string;
    phone?: string;
    company?: string;
    lifecyclestage?: string;
    createdate?: string;
    associatedcompanyid?: string;
    [key: string]: any;
  };
}

interface HubSpotCompany {
  id: string;
  properties: {
    name?: string;
    domain?: string;
    industry?: string;
    numberofemployees?: string;
    annualrevenue?: string;
    website?: string;
    description?: string;
    [key: string]: any;
  };
}

interface HubSpotDeal {
  id: string;
  properties: {
    dealname?: string;
    amount?: string;
    dealstage?: string;
    closedate?: string;
    pipeline?: string;
    hs_is_closed_won?: string;
    associatedcompanyid?: string;
    [key: string]: any;
  };
}

interface UnifiedClientProfile {
  id: string;
  clientid: string;
  profiledata: {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    location?: string;
    industry?: string;
    website?: string;
    social_profiles?: {
      linkedin?: string;
      twitter?: string;
    };
    demographics?: {
      company_size?: string;
      revenue_range?: string;
      role?: string;
    };
  };
  sourceintegrations: string[];
  primarysource: string;
  completenessscore: number;
  engagementscore: number;
  estimatedvalue: number;
  lastinteraction: string;
  lastenrichmentat: string;
  insights: ClientInsight[];
  createdat: string;
  updatedat: string;
}

interface ClientInsight {
  type: string;
  value: string;
  confidence: number;
}

export class HubSpotClientIntelligenceService extends BaseService {
  /**
   * Sync HubSpot data and transform it into client intelligence profiles
   */
  async syncToClientIntelligence(userId: string): Promise<ServiceResponse<{
    profilesCreated: number;
    profilesUpdated: number;
    insightsGenerated: number;
  }>> {
    return this.executeDbOperation(async () => {
      try {
        logger.info('Starting HubSpot to Client Intelligence sync', { userId });

        // Get HubSpot integration with tokens
        const { data: integration, error: integrationError } = await this.supabase
          .from('user_integrations')
          .select('config')
          .eq('user_id', userId)
          .eq('integration_slug', 'HubSpot')
          .eq('status', 'connected')
          .single();

        if (integrationError || !integration) {
          return { data: null, error: 'HubSpot integration not found or not connected' };
        }

        const config = integration.config as any;
        const accessToken = config.access_token;

        if (!accessToken) {
          return { data: null, error: 'No access token found for HubSpot integration' };
        }

        // Fetch data from HubSpot
        const [contacts, companies, deals] = await Promise.all([
          this.fetchHubSpotContacts(accessToken),
          this.fetchHubSpotCompanies(accessToken),
          this.fetchHubSpotDeals(accessToken)
        ]);

        logger.info('HubSpot data fetched', {
          contactsCount: contacts.length,
          companiesCount: companies.length,
          dealsCount: deals.length
        });

        // Transform and create unified client profiles
        const profiles = await this.createUnifiedProfiles(contacts, companies, deals, userId);
        
        // Generate AI insights for each profile
        const insightsGenerated = await this.generateAIInsights(profiles);

        // Store profiles in client intelligence system
        const { profilesCreated, profilesUpdated } = await this.storeClientProfiles(profiles);

        logger.info('HubSpot client intelligence sync completed', {
          profilesCreated,
          profilesUpdated,
          insightsGenerated
        });

        return {
          data: {
            profilesCreated,
            profilesUpdated,
            insightsGenerated
          },
          error: null
        };

      } catch (error) {
        logger.error('HubSpot client intelligence sync failed', { error, userId });
        return { data: null, error: 'Failed to sync HubSpot data to client intelligence' };
      }
    }, `sync HubSpot data to client intelligence for user ${userId}`);
  }

  /**
   * Fetch contacts from HubSpot API
   */
  private async fetchHubSpotContacts(accessToken: string): Promise<HubSpotContact[]> {
    const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts?limit=100&properties=email,firstname,lastname,phone,company,lifecyclestage,createdate,associatedcompanyid', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch HubSpot contacts: ${response.statusText}`);
    }

    const data = await response.json();
    return data.results || [];
  }

  /**
   * Fetch companies from HubSpot API
   */
  private async fetchHubSpotCompanies(accessToken: string): Promise<HubSpotCompany[]> {
    const response = await fetch('https://api.hubapi.com/crm/v3/objects/companies?limit=100&properties=name,domain,industry,numberofemployees,annualrevenue,website,description', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch HubSpot companies: ${response.statusText}`);
    }

    const data = await response.json();
    return data.results || [];
  }

  /**
   * Fetch deals from HubSpot API
   */
  private async fetchHubSpotDeals(accessToken: string): Promise<HubSpotDeal[]> {
    const response = await fetch('https://api.hubapi.com/crm/v3/objects/deals?limit=100&properties=dealname,amount,dealstage,closedate,pipeline,hs_is_closed_won,associatedcompanyid', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch HubSpot deals: ${response.statusText}`);
    }

    const data = await response.json();
    return data.results || [];
  }

  /**
   * Create unified client profiles from HubSpot data
   */
  private async createUnifiedProfiles(
    contacts: HubSpotContact[],
    companies: HubSpotCompany[],
    deals: HubSpotDeal[],
    userId: string
  ): Promise<UnifiedClientProfile[]> {
    const profiles: UnifiedClientProfile[] = [];
    const companyMap = new Map(companies.map(c => [c.id, c]));
    const dealMap = new Map<string, HubSpotDeal[]>();

    // Group deals by company
    deals.forEach(deal => {
      const companyId = deal.properties.associatedcompanyid;
      if (companyId) {
        if (!dealMap.has(companyId)) {
          dealMap.set(companyId, []);
        }
        dealMap.get(companyId)!.push(deal);
      }
    });

    // Create profiles from contacts
    for (const contact of contacts) {
      const company = contact.properties.associatedcompanyid 
        ? companyMap.get(contact.properties.associatedcompanyid)
        : null;

      const companyDeals = contact.properties.associatedcompanyid
        ? dealMap.get(contact.properties.associatedcompanyid) || []
        : [];

      const profile = this.transformToUnifiedProfile(contact, company, companyDeals, userId);
      profiles.push(profile);
    }

    // Create profiles from companies that don't have contacts
    for (const company of companies) {
      const hasContact = contacts.some(c => c.properties.associatedcompanyid === company.id);
      if (!hasContact) {
        const companyDeals = dealMap.get(company.id) || [];
        const profile = this.transformCompanyToUnifiedProfile(company, companyDeals, userId);
        profiles.push(profile);
      }
    }

    return profiles;
  }

  /**
   * Transform HubSpot contact to unified client profile
   */
  private transformToUnifiedProfile(
    contact: HubSpotContact,
    company: HubSpotCompany | null,
    deals: HubSpotDeal[],
    userId: string
  ): UnifiedClientProfile {
    const name = `${contact.properties.firstname || ''} ${contact.properties.lastname || ''}`.trim() || contact.properties.email || 'Unnamed Contact';
    
    const totalDealValue = deals.reduce((sum, deal) => {
      return sum + parseFloat(deal.properties.amount || '0');
    }, 0);

    const completenessScore = this.calculateCompletenessScore(contact, company);
    const engagementScore = this.calculateEngagementScore(contact, deals);

    return {
      id: `hubspot_${contact.id}`,
      clientid: contact.id,
      profiledata: {
        name,
        email: contact.properties.email,
        phone: contact.properties.phone,
        company: company?.properties.name || contact.properties.company,
        industry: company?.properties.industry,
        website: company?.properties.website,
        demographics: {
          company_size: company?.properties.numberofemployees,
          revenue_range: company?.properties.annualrevenue,
          role: contact.properties.lifecyclestage
        }
      },
      sourceintegrations: ['hubspot'],
      primarysource: 'hubspot',
      completenessscore: completenessScore,
      engagementscore: engagementScore,
      estimatedvalue: totalDealValue,
      lastinteraction: contact.properties.createdate || new Date().toISOString(),
      lastenrichmentat: new Date().toISOString(),
      insights: [],
      createdat: contact.properties.createdate || new Date().toISOString(),
      updatedat: new Date().toISOString()
    };
  }

  /**
   * Transform HubSpot company to unified client profile
   */
  private transformCompanyToUnifiedProfile(
    company: HubSpotCompany,
    deals: HubSpotDeal[],
    userId: string
  ): UnifiedClientProfile {
    const totalDealValue = deals.reduce((sum, deal) => {
      return sum + parseFloat(deal.properties.amount || '0');
    }, 0);

    const completenessScore = this.calculateCompanyCompletenessScore(company);
    const engagementScore = this.calculateCompanyEngagementScore(company, deals);

    return {
      id: `hubspot_company_${company.id}`,
      clientid: company.id,
      profiledata: {
        name: company.properties.name || 'Unnamed Company',
        company: company.properties.name,
        industry: company.properties.industry,
        website: company.properties.website,
        demographics: {
          company_size: company.properties.numberofemployees,
          revenue_range: company.properties.annualrevenue
        }
      },
      sourceintegrations: ['hubspot'],
      primarysource: 'hubspot',
      completenessscore: completenessScore,
      engagementscore: engagementScore,
      estimatedvalue: totalDealValue,
      lastinteraction: new Date().toISOString(),
      lastenrichmentat: new Date().toISOString(),
      insights: [],
      createdat: new Date().toISOString(),
      updatedat: new Date().toISOString()
    };
  }

  /**
   * Calculate completeness score for contact profile
   */
  private calculateCompletenessScore(contact: HubSpotContact, company: HubSpotCompany | null): number {
    let score = 0;
    const fields = [
      contact.properties.email,
      contact.properties.firstname,
      contact.properties.lastname,
      contact.properties.phone,
      company?.properties.name,
      company?.properties.industry,
      company?.properties.website
    ];

    const filledFields = fields.filter(field => field && field.trim() !== '').length;
    score = Math.round((filledFields / fields.length) * 100);
    
    return Math.min(score, 100);
  }

  /**
   * Calculate completeness score for company profile
   */
  private calculateCompanyCompletenessScore(company: HubSpotCompany): number {
    let score = 0;
    const fields = [
      company.properties.name,
      company.properties.industry,
      company.properties.website,
      company.properties.numberofemployees,
      company.properties.annualrevenue
    ];

    const filledFields = fields.filter(field => field && field.trim() !== '').length;
    score = Math.round((filledFields / fields.length) * 100);
    
    return Math.min(score, 100);
  }

  /**
   * Calculate engagement score based on contact lifecycle and deals
   */
  private calculateEngagementScore(contact: HubSpotContact, deals: HubSpotDeal[]): number {
    let score = 0;

    // Base score from lifecycle stage
    const lifecycleScores: Record<string, number> = {
      'lead': 20,
      'subscriber': 30,
      'marketingqualifiedlead': 40,
      'salesqualifiedlead': 60,
      'opportunity': 70,
      'customer': 90,
      'evangelist': 95,
      'other': 50
    };

    const lifecycle = contact.properties.lifecyclestage?.toLowerCase() || 'other';
    score += lifecycleScores[lifecycle] || 50;

    // Bonus for having deals
    if (deals.length > 0) {
      score += Math.min(deals.length * 10, 30);
    }

    // Bonus for high-value deals
    const highValueDeals = deals.filter(deal => parseFloat(deal.properties.amount || '0') > 10000);
    score += highValueDeals.length * 5;

    return Math.min(score, 100);
  }

  /**
   * Calculate engagement score for company
   */
  private calculateCompanyEngagementScore(company: HubSpotCompany, deals: HubSpotDeal[]): number {
    let score = 50; // Base score

    // Bonus for having deals
    if (deals.length > 0) {
      score += Math.min(deals.length * 15, 40);
    }

    // Bonus for high-value deals
    const highValueDeals = deals.filter(deal => parseFloat(deal.properties.amount || '0') > 10000);
    score += highValueDeals.length * 10;

    return Math.min(score, 100);
  }

  /**
   * Generate AI insights for client profiles
   */
  private async generateAIInsights(profiles: UnifiedClientProfile[]): Promise<number> {
    let insightsGenerated = 0;

    for (const profile of profiles) {
      const insights: ClientInsight[] = [];

      // Generate insights based on profile data
      if (profile.estimatedvalue > 50000) {
        insights.push({
          type: 'high_value',
          value: 'High-value client with significant deal potential',
          confidence: 85
        });
      }

      if (profile.engagementscore > 80) {
        insights.push({
          type: 'high_engagement',
          value: 'Highly engaged client, consider upselling opportunities',
          confidence: 90
        });
      }

      if (profile.completenessscore < 50) {
        insights.push({
          type: 'incomplete_profile',
          value: 'Profile needs enrichment for better targeting',
          confidence: 75
        });
      }

      if (profile.profiledata.demographics?.company_size === '1000+') {
        insights.push({
          type: 'enterprise',
          value: 'Enterprise client with complex buying process',
          confidence: 80
        });
      }

      // Add insights to profile
      profile.insights = insights;
      insightsGenerated += insights.length;
    }

    return insightsGenerated;
  }

  /**
   * Store client profiles in the client intelligence system
   */
  private async storeClientProfiles(profiles: UnifiedClientProfile[]): Promise<{
    profilesCreated: number;
    profilesUpdated: number;
  }> {
    let profilesCreated = 0;
    let profilesUpdated = 0;

    for (const profile of profiles) {
      try {
        // Check if profile already exists
        const { data: existingProfile } = await this.supabase
          .from('unified_client_profiles')
          .select('id')
          .eq('clientid', profile.clientid)
          .eq('primarysource', 'hubspot')
          .single();

        if (existingProfile) {
          // Update existing profile
          const { error } = await this.supabase
            .from('unified_client_profiles')
            .update({
              profiledata: profile.profiledata,
              completenessscore: profile.completenessscore,
              engagementscore: profile.engagementscore,
              estimatedvalue: profile.estimatedvalue,
              lastinteraction: profile.lastinteraction,
              lastenrichmentat: profile.lastenrichmentat,
              insights: profile.insights,
              updatedat: profile.updatedat
            })
            .eq('id', existingProfile.id);

          if (!error) {
            profilesUpdated++;
          }
        } else {
          // Create new profile
          const { error } = await this.supabase
            .from('unified_client_profiles')
            .insert(profile);

          if (!error) {
            profilesCreated++;
          }
        }
      } catch (error) {
        logger.error('Failed to store client profile', { error, profileId: profile.id });
      }
    }

    return { profilesCreated, profilesUpdated };
  }

  /**
   * Get client intelligence summary for a user
   */
  async getClientIntelligenceSummary(userId: string): Promise<ServiceResponse<{
    totalProfiles: number;
    averageCompleteness: number;
    averageEngagement: number;
    totalValue: number;
    topInsights: ClientInsight[];
  }>> {
    return this.executeDbOperation(async () => {
      try {
        const { data: profiles, error } = await this.supabase
          .from('unified_client_profiles')
          .select('*')
          .eq('primarysource', 'hubspot');

        if (error) {
          return { data: null, error: 'Failed to fetch client profiles' };
        }

        const totalProfiles = profiles.length;
        const averageCompleteness = profiles.length > 0 
          ? Math.round(profiles.reduce((sum, p) => sum + p.completenessscore, 0) / profiles.length)
          : 0;
        const averageEngagement = profiles.length > 0
          ? Math.round(profiles.reduce((sum, p) => sum + p.engagementscore, 0) / profiles.length)
          : 0;
        const totalValue = profiles.reduce((sum, p) => sum + p.estimatedvalue, 0);

        // Get top insights
        const allInsights = profiles.flatMap(p => p.insights);
        const topInsights = allInsights
          .sort((a, b) => b.confidence - a.confidence)
          .slice(0, 5);

        return {
          data: {
            totalProfiles,
            averageCompleteness,
            averageEngagement,
            totalValue,
            topInsights
          },
          error: null
        };

      } catch (error) {
        logger.error('Failed to get client intelligence summary', { error, userId });
        return { data: null, error: 'Failed to get client intelligence summary' };
      }
    }, `get client intelligence summary for user ${userId}`);
  }
}

export const hubSpotClientIntelligenceService = new HubSpotClientIntelligenceService();
