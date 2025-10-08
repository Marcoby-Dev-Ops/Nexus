import { BaseService, type ServiceResponse } from '@/core/services/BaseService';
import { logger } from '@/shared/utils/logger';
import { authentikAuthService } from '@/core/auth/authentikAuthServiceInstance';
import { selectData as select, selectOne, insertOne, updateOne, deleteOne } from '@/lib/database';

export interface UnifiedClientProfile {
  id: string;
  client_id: string;
  profile_data: {
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
  source_integrations: string[];
  primary_source: string;
  completeness_score: number;
  engagement_score: number;
  estimated_value: number;
  last_interaction: string;
  last_enrichment_at: string;
  insights: any[];
  created_at: string;
  updated_at: string;
}

export interface ClientInteraction {
  id: string;
  client_profile_id: string;
  interaction_type: 'email' | 'call' | 'meeting' | 'transaction' | 'support' | 'website_visit';
  channel: string;
  summary: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  value: number;
  metadata: any;
  occurred_at: string;
}

export interface ClientIntelligenceAlert {
  id: string;
  client_profile_id: string;
  alert_type: 'opportunity' | 'risk' | 'milestone' | 'anomaly';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  is_resolved: boolean;
  created_at: string;
}

export class UnifiedClientService extends BaseService {
  constructor() {
    super();
  }

  /**
   * Populate unified client profiles from existing integrations
   */
  async populateUnifiedClients(userId: string): Promise<ServiceResponse<{ profilesCreated: number; interactionsCreated: number; alertsCreated: number }>> {
    try {
      this.logger.info('Starting unified client population for user:', userId);
      
      let profilesCreated = 0;
      let interactionsCreated = 0;
      let alertsCreated = 0;

      // 1. Populate from HubSpot contacts and companies
      const hubspotResult = await this.populateFromHubSpot(userId);
      profilesCreated += hubspotResult.profilesCreated;
      interactionsCreated += hubspotResult.interactionsCreated;
      alertsCreated += hubspotResult.alertsCreated;

      // 2. Populate from Microsoft Graph contacts (if available)
      const microsoftResult = await this.populateFromMicrosoft(userId);
      profilesCreated += microsoftResult.profilesCreated;
      interactionsCreated += microsoftResult.interactionsCreated;
      alertsCreated += microsoftResult.alertsCreated;

      // 3. Generate cross-platform correlations
      await this.generateCrossPlatformCorrelations(userId);

      this.logger.info('Unified client population completed', {
        profilesCreated,
        interactionsCreated,
        alertsCreated
      });

      return this.createResponse({
        profilesCreated,
        interactionsCreated,
        alertsCreated
      });
    } catch (error) {
      return this.handleError(error, 'populate unified clients');
    }
  }

  /**
   * Get unified client profiles for a user
   */
  async getUnifiedClientProfiles(userId: string): Promise<ServiceResponse<UnifiedClientProfile[]>> {
    return this.executeDbOperation(async () => {
      // Check authentication before making database calls
      const result = await authentikAuthService.getSession();
      const session = result.data;
      if (!session) {
        throw new Error('Authentication required - no valid session found');
      }

      const result2 = await select('unified_client_profiles', ['*'], {
        user_id: userId,
        order_by: 'updated_at.desc'
      });

      if (!result2.success) throw new Error(result2.error);

      return { data: result2.data || [], error: null };
    }, `get unified client profiles for user ${userId}`);
  }

  /**
   * Get client interactions for a user
   */
  async getClientInteractions(userId: string): Promise<ServiceResponse<ClientInteraction[]>> {
    return this.executeDbOperation(async () => {
      // Check authentication before making database calls
      const authResult = await authentikAuthService.getSession();
      const session = authResult.data;
      if (!session) {
        throw new Error('Authentication required - no valid session found');
      }

      const result = await select('ai_client_interactions', ['*'], {
        user_id: userId,
        order_by: 'occurred_at.desc'
      });

      if (!result.success) throw new Error(result.error);

      return { data: result.data || [], error: null };
    }, `get client interactions for user ${userId}`);
  }

  /**
   * Get client intelligence alerts for a user
   */
  async getClientIntelligenceAlerts(userId: string): Promise<ServiceResponse<ClientIntelligenceAlert[]>> {
    return this.executeDbOperation(async () => {
      // Check authentication before making database calls
      const authResult = await authentikAuthService.getSession();
      const session = authResult.data;
      if (!session) {
        throw new Error('Authentication required - no valid session found');
      }

      const result = await select('ai_client_intelligence_alerts', ['*'], {
        user_id: userId,
        is_resolved: false,
        order_by: 'created_at.desc'
      });

      if (!result.success) throw new Error(result.error);

      return { data: result.data || [], error: null };
    }, `get client intelligence alerts for user ${userId}`);
  }

  // Private helper methods remain the same but use this.supabase instead of direct supabase calls
  private async populateFromHubSpot(userId: string): Promise<{ profilesCreated: number; interactionsCreated: number; alertsCreated: number }> {
    let profilesCreated = 0;
    let interactionsCreated = 0;
    let alertsCreated = 0;

    try {
      // Get HubSpot contacts
      const contactsResult = await select('contacts', ['*'], {
        user_id: userId,
        hubspotid_not: null
      });

      if (!contactsResult.success) throw new Error(contactsResult.error);

      // Get HubSpot companies
      const companiesResult = await select('companies', ['*'], {
        user_id: userId,
        hubspotid_not: null
      });

      if (!companiesResult.success) throw new Error(companiesResult.error);

      // Get HubSpot deals
      const dealsResult = await select('deals', ['*'], {
        user_id: userId,
        hubspotid_not: null
      });

      if (!dealsResult.success) throw new Error(dealsResult.error);

      const contacts = contactsResult.data || [];
      const companies = companiesResult.data || [];
      const deals = dealsResult.data || [];

      // Create unified profiles from contacts
      for (const contact of contacts || []) {
        const company = companies?.find(c => c.id === contact.company_id);
        
        const profileData = {
          name: contact.name || contact.email,
          email: contact.email,
          phone: contact.phone,
          company: company?.name,
          location: company?.city ? `${company.city}, ${company.state}` : undefined,
          industry: company?.industry,
          website: company?.website,
          demographics: {
            company_size: company?.employees,
            revenue_range: company?.annualrevenue,
            role: contact.jobtitle
          }
        };

        const completenessScore = this.calculateCompletenessScore(profileData);
        const engagementScore = this.calculateEngagementScore(contact, company, deals);
        const estimatedValue = this.calculateEstimatedValue(contact, company, deals);

        // Check if profile already exists
        const existingProfileResult = await selectOne('ai_unified_client_profiles', ['id'], {
          user_id: userId,
          client_id: `hubspot_contact_${contact.hubspotid}`
        });

        if (!existingProfileResult.success || !existingProfileResult.data) {
          const insertResult = await insertOne('ai_unified_client_profiles', {
            user_id: userId,
            client_id: `hubspot_contact_${contact.hubspotid}`,
            profile_data: profileData,
            source_integrations: ['hubspot'],
            primary_source: 'hubspot',
            completeness_score: completenessScore,
            engagement_score: engagementScore,
            estimated_value: estimatedValue,
            last_interaction: contact.updated_at,
            insights: []
          });

          if (insertResult.success) {
            profilesCreated++;
            
            // Create interactions from deals
            if (deals) {
              const contactDeals = deals.filter(d => d.contact_id === contact.id);
              for (const deal of contactDeals) {
                await this.createInteractionFromDeal(userId, `hubspot_contact_${contact.hubspotid}`, deal);
                interactionsCreated++;
              }
            }

            // Create intelligence alerts
            if (engagementScore < 30) {
              await this.createAlert(userId, `hubspot_contact_${contact.hubspotid}`, {
                type: 'risk',
                title: 'Low Engagement Client',
                description: `Client ${profileData.name} has low engagement (${engagementScore}%)`,
                priority: 'medium'
              });
              alertsCreated++;
            }
          }
        }
      }

      // Create unified profiles from companies (if not already created from contacts)
      for (const company of companies || []) {
        const companyContacts = contacts?.filter(c => c.company_id === company.id);
        
        if (companyContacts && companyContacts.length > 0) {
          // Company already covered by contacts
          continue;
        }

        const profileData = {
          name: company.name,
          company: company.name,
          location: company.city ? `${company.city}, ${company.state}` : undefined,
          industry: company.industry,
          website: company.website,
          demographics: {
            company_size: company.employees,
            revenue_range: company.annualrevenue
          }
        };

        const completenessScore = this.calculateCompletenessScore(profileData);
        const engagementScore = this.calculateEngagementScore(null, company, deals);
        const estimatedValue = this.calculateEstimatedValue(null, company, deals);

        // Check if profile already exists
        const existingProfileResult = await selectOne('ai_unified_client_profiles', ['id'], {
          user_id: userId,
          client_id: `hubspot_company_${company.hubspotid}`
        });

        if (!existingProfileResult.success || !existingProfileResult.data) {
          const insertResult = await insertOne('ai_unified_client_profiles', {
            user_id: userId,
            client_id: `hubspot_company_${company.hubspotid}`,
            profile_data: profileData,
            source_integrations: ['hubspot'],
            primary_source: 'hubspot',
            completeness_score: completenessScore,
            engagement_score: engagementScore,
            estimated_value: estimatedValue,
            last_interaction: company.updated_at,
            insights: []
          });

          if (insertResult.success) {
            profilesCreated++;
          }
        }
      }

    } catch (error) {
      this.logger.error('Error populating from HubSpot:', error);
    }

    return { profilesCreated, interactionsCreated, alertsCreated };
  }

  private async populateFromMicrosoft(userId: string): Promise<{ profilesCreated: number; interactionsCreated: number; alertsCreated: number }> {
    const profilesCreated = 0;
    const interactionsCreated = 0;
    const alertsCreated = 0;

    try {
      // This would integrate with Microsoft Graph API
      // For now, we'll create placeholder logic
      this.logger.info('Microsoft Graph integration for unified clients not yet implemented');
    } catch (error) {
      this.logger.error('Error populating from Microsoft:', error);
    }

    return { profilesCreated, interactionsCreated, alertsCreated };
  }

  private async generateCrossPlatformCorrelations(userId: string): Promise<void> {
    try {
      // Get all unified profiles
      const result = await select('ai_unified_client_profiles', ['*'], {
        user_id: userId
      });

      if (!result.success) throw new Error(result.error);

      // Find potential matches across platforms
      for (let i = 0; i < result.data.length; i++) {
        for (let j = i + 1; j < result.data.length; j++) {
          const profile1 = result.data[i];
          const profile2 = result.data[j];

          const matchScore = this.calculateMatchScore(profile1.profile_data, profile2.profile_data);
          
          if (matchScore > 0.8) {
            // High confidence match - could be the same client across platforms
            await this.createCrossPlatformCorrelation(userId, profile1, profile2, matchScore);
          }
        }
      }
    } catch (error) {
      this.logger.error('Error generating cross-platform correlations:', error);
    }
  }

  /**
   * Calculate completeness score for a profile
   */
  private calculateCompletenessScore(profileData: any): number {
    const fields = [
      'name', 'email', 'phone', 'company', 'location', 
      'industry', 'website', 'demographics.company_size', 
      'demographics.revenue_range', 'demographics.role'
    ];

    let filledFields = 0;
    for (const field of fields) {
      const value = field.includes('.') 
        ? field.split('.').reduce((obj, key) => obj?.[key], profileData)
        : profileData[field];
      
      if (value && value.toString().trim() !== '') {
        filledFields++;
      }
    }

    return Math.round((filledFields / fields.length) * 100);
  }

  /**
   * Calculate engagement score
   */
  private calculateEngagementScore(contact: any, company: any, deals: any[]): number {
    let score = 50; // Base score

    // Recent activity
    const lastActivity = contact?.updated_at || company?.updated_at;
    if (lastActivity) {
      const daysSinceActivity = (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceActivity < 7) score += 20;
      else if (daysSinceActivity < 30) score += 10;
      else if (daysSinceActivity > 90) score -= 20;
    }

    // Deal activity
    const contactDeals = deals?.filter(d => d.contact_id === contact?.id || d.company_id === company?.id) || [];
    if (contactDeals.length > 0) score += 15;
    if (contactDeals.some(d => d.stage === 'closedwon')) score += 15;

    // Profile completeness
    if (contact?.email) score += 5;
    if (contact?.phone) score += 5;
    if (company?.website) score += 5;

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Calculate estimated value
   */
  private calculateEstimatedValue(contact: any, company: any, deals: any[]): number {
    let value = 0;

    // Sum up deal values
    const contactDeals = deals?.filter(d => d.contact_id === contact?.id || d.company_id === company?.id) || [];
    for (const deal of contactDeals) {
      value += parseFloat(deal.amount || 0);
    }

    // If no deals, estimate based on company size
    if (value === 0 && company?.annualrevenue) {
      value = parseFloat(company.annualrevenue) * 0.01; // 1% of annual revenue as potential value
    }

    return value;
  }

  /**
   * Calculate match score between two profiles
   */
  private calculateMatchScore(profile1: any, profile2: any): number {
    let score = 0;
    let totalWeight = 0;

    // Email match (highest weight)
    if (profile1.email && profile2.email && profile1.email.toLowerCase() === profile2.email.toLowerCase()) {
      score += 40;
      totalWeight += 40;
    }

    // Name match
    if (profile1.name && profile2.name) {
      const name1 = profile1.name.toLowerCase();
      const name2 = profile2.name.toLowerCase();
      if (name1 === name2) {
        score += 30;
      } else if (name1.includes(name2) || name2.includes(name1)) {
        score += 20;
      }
      totalWeight += 30;
    }

    // Company match
    if (profile1.company && profile2.company) {
      const company1 = profile1.company.toLowerCase();
      const company2 = profile2.company.toLowerCase();
      if (company1 === company2) {
        score += 20;
      } else if (company1.includes(company2) || company2.includes(company1)) {
        score += 10;
      }
      totalWeight += 20;
    }

    // Phone match
    if (profile1.phone && profile2.phone && profile1.phone === profile2.phone) {
      score += 10;
      totalWeight += 10;
    }

    return totalWeight > 0 ? score / totalWeight : 0;
  }

  /**
   * Create interaction from deal
   */
  private async createInteractionFromDeal(userId: string, clientProfileId: string, deal: any): Promise<void> {
    try {
      await insertOne('ai_client_interactions', {
        user_id: userId,
        client_profile_id: clientProfileId,
        interaction_type: 'transaction',
        channel: 'hubspot',
        summary: `Deal: ${deal.name} - ${deal.stage}`,
        sentiment: deal.stage === 'closedwon' ? 'positive' : 'neutral',
        value: parseFloat(deal.amount || 0),
        metadata: { deal_id: deal.id, deal_stage: deal.stage },
        occurred_at: deal.updated_at
      });
    } catch (error) {
      this.logger.error('Error creating interaction from deal:', error);
    }
  }

  /**
   * Create intelligence alert
   */
  private async createAlert(userId: string, clientProfileId: string, alertData: {
    type: string;
    title: string;
    description: string;
    priority: string;
  }): Promise<void> {
    try {
      await insertOne('ai_client_intelligence_alerts', {
        user_id: userId,
        client_profile_id: clientProfileId,
        alert_type: alertData.type as any,
        title: alertData.title,
        description: alertData.description,
        priority: alertData.priority as any,
        is_resolved: false
      });
    } catch (error) {
      this.logger.error('Error creating alert:', error);
    }
  }

  /**
   * Create cross-platform correlation
   */
  private async createCrossPlatformCorrelation(userId: string, profile1: any, profile2: any, matchScore: number): Promise<void> {
    try {
      await insertOne('cross_platform_correlations', {
        user_id: userId,
        correlation_type: 'client_match',
        platform_a: profile1.primary_source,
        platform_b: profile2.primary_source,
        entity_id_a: profile1.client_id,
        entity_id_b: profile2.client_id,
        confidence_score: matchScore,
        correlation_data: {
          profile1_data: profile1.profile_data,
          profile2_data: profile2.profile_data,
          match_score: matchScore
        }
      });
    } catch (error) {
      this.logger.error('Error creating cross-platform correlation:', error);
    }
  }
}

// Export singleton instance
export const unifiedClientService = new UnifiedClientService();
