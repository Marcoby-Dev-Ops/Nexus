/**
 * Apollo Integration Service
 * Integrates with Apollo.io for sales prospecting, outreach, and lead generation
 * Pillar: 1,2 - Automated prospecting and business development
 */

import { supabase } from '../core/supabase';
import { logger } from '../security/logger';

export interface ApolloConfig {
  apiKey: string;
  baseUrl: string;
}

export interface ApolloContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  title: string;
  company: string;
  industry: string;
  location: string;
  linkedinUrl?: string;
  phone?: string;
  score: number;
  lastContactedAt?: string;
  status: 'new' | 'contacted' | 'replied' | 'interested' | 'not_interested';
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ApolloSequence {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'archived';
  steps: Array<{
    id: string;
    type: 'email' | 'linkedin' | 'call' | 'manual';
    waitTime: number;
    template: string;
  }>;
  performance: {
    sent: number;
    delivered: number;
    opened: number;
    replied: number;
    clicked: number;
    bounced: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ApolloAccount {
  id: string;
  name: string;
  domain: string;
  industry: string;
  size: string;
  location: string;
  revenue?: number;
  employees?: number;
  technologies: string[];
  score: number;
  contacts: ApolloContact[];
  createdAt: string;
  updatedAt: string;
}

export interface ApolloMetrics {
  prospecting: {
    totalContacts: number;
    newContactsThisMonth: number;
    qualifiedLeads: number;
    contactsInSequences: number;
    averageScore: number;
  };
  outreach: {
    totalSequences: number;
    activeSequences: number;
    emailsSent: number;
    emailsOpened: number;
    emailsReplied: number;
    openRate: number;
    replyRate: number;
    clickRate: number;
  };
  conversion: {
    leadsGenerated: number;
    meetingsBooked: number;
    dealsCreated: number;
    conversionRate: number;
    avgTimeToReply: number;
  };
  performance: {
    topPerformingSequences: Array<{
      id: string;
      name: string;
      replyRate: number;
    }>;
    industryBreakdown: Array<{
      industry: string;
      contacts: number;
      replyRate: number;
    }>;
  };
}

export class ApolloService {
  private config: ApolloConfig | null = null;

  async initialize(): Promise<boolean> {
    try {
      const { data: integration, error } = await supabase
        .from('user_integrations')
        .select('config, credentials')
        .eq('integration_slug', 'apollo')
        .eq('status', 'active')
        .maybeSingle();

      if (error || !integration) {
        logger.warn('Apollo integration not found or inactive');
        return false;
      }

      this.config = {
        apiKey: integration.credentials?.api_key,
        baseUrl: integration.config?.base_url || 'https://api.apollo.io/v1'
      };

      return true;
    } catch (error) {
      logger.error({ error }, 'Failed to initialize Apollo service');
      return false;
    }
  }

  private async apiRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    if (!this.config?.apiKey) {
      throw new Error('Apollo not properly configured');
    }

    const url = `${this.config.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json',
        'X-Api-Key': this.config.apiKey,
        ...options.headers
      }
    });

    if (!response.ok) {
      throw new Error(`Apollo API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Test connection to Apollo API
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.apiRequest('/auth/health');
      return { success: true, message: 'Connected to Apollo successfully' };
    } catch (error) {
      logger.error({ error }, 'Failed to test Apollo connection');
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Connection failed' 
      };
    }
  }

  /**
   * Search for contacts based on criteria
   */
  async searchContacts(criteria: {
    companyNames?: string[];
    titles?: string[];
    industries?: string[];
    locations?: string[];
    companySize?: string[];
    limit?: number;
  }): Promise<ApolloContact[]> {
    try {
      const params = new URLSearchParams();
      
      if (criteria.companyNames) {
        params.append('organization_names', criteria.companyNames.join(','));
      }
      if (criteria.titles) {
        params.append('person_titles', criteria.titles.join(','));
      }
      if (criteria.industries) {
        params.append('organization_industry_tag_names', criteria.industries.join(','));
      }
      if (criteria.locations) {
        params.append('person_locations', criteria.locations.join(','));
      }
      if (criteria.companySize) {
        params.append('organization_num_employees_ranges', criteria.companySize.join(','));
      }
      
      params.append('per_page', (criteria.limit || 25).toString());

      const response = await this.apiRequest(`/mixed_people/search?${params.toString()}`);
      
      return (response.people || []).map((person: any) => ({
        id: person.id,
        firstName: person.first_name,
        lastName: person.last_name,
        email: person.email,
        title: person.title,
        company: person.organization?.name || '',
        industry: person.organization?.industry || '',
        location: person.city ? `${person.city}, ${person.state}` : '',
        linkedinUrl: person.linkedin_url,
        phone: person.phone,
        score: person.contact_score || 0,
        status: 'new',
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
    } catch (error) {
      logger.error({ error, criteria }, 'Failed to search Apollo contacts');
      return [];
    }
  }

  /**
   * Get all contacts from Apollo
   */
  async getContacts(): Promise<ApolloContact[]> {
    try {
      const response = await this.apiRequest('/contacts');
      return (response.contacts || []).map((contact: any) => ({
        id: contact.id,
        firstName: contact.first_name,
        lastName: contact.last_name,
        email: contact.email,
        title: contact.title,
        company: contact.account?.name || '',
        industry: contact.account?.industry || '',
        location: contact.city ? `${contact.city}, ${contact.state}` : '',
        linkedinUrl: contact.linkedin_url,
        phone: contact.phone,
        score: contact.contact_score || 0,
        lastContactedAt: contact.last_contacted_at,
        status: contact.status || 'new',
        tags: contact.tags || [],
        createdAt: contact.created_at,
        updatedAt: contact.updated_at
      }));
    } catch (error) {
      logger.error({ error }, 'Failed to fetch Apollo contacts');
      return [];
    }
  }

  /**
   * Get all sequences from Apollo
   */
  async getSequences(): Promise<ApolloSequence[]> {
    try {
      const response = await this.apiRequest('/emailer_campaigns');
      return (response.emailer_campaigns || []).map((sequence: any) => ({
        id: sequence.id,
        name: sequence.name,
        status: sequence.active ? 'active' : 'paused',
        steps: sequence.emailer_steps?.map((step: any) => ({
          id: step.id,
          type: step.type,
          waitTime: step.wait_time,
          template: step.template
        })) || [],
        performance: {
          sent: sequence.num_sent || 0,
          delivered: sequence.num_delivered || 0,
          opened: sequence.num_opened || 0,
          replied: sequence.num_replied || 0,
          clicked: sequence.num_clicked || 0,
          bounced: sequence.num_bounced || 0
        },
        createdAt: sequence.created_at,
        updatedAt: sequence.updated_at
      }));
    } catch (error) {
      logger.error({ error }, 'Failed to fetch Apollo sequences');
      return [];
    }
  }

  /**
   * Get accounts from Apollo
   */
  async getAccounts(): Promise<ApolloAccount[]> {
    try {
      const response = await this.apiRequest('/accounts');
      return (response.accounts || []).map((account: any) => ({
        id: account.id,
        name: account.name,
        domain: account.website_url,
        industry: account.industry,
        size: account.organization_num_employees_ranges,
        location: account.city ? `${account.city}, ${account.state}` : '',
        revenue: account.estimated_num_employees,
        employees: account.num_employees,
        technologies: account.technologies || [],
        score: account.account_score || 0,
        contacts: [],
        createdAt: account.created_at,
        updatedAt: account.updated_at
      }));
    } catch (error) {
      logger.error({ error }, 'Failed to fetch Apollo accounts');
      return [];
    }
  }

  /**
   * Get comprehensive metrics from Apollo
   */
  async getMetrics(): Promise<ApolloMetrics> {
    try {
      const [contacts, sequences, accounts] = await Promise.all([
        this.getContacts(),
        this.getSequences(),
        this.getAccounts()
      ]);

      // Calculate prospecting metrics
      const currentMonth = new Date();
      currentMonth.setDate(1);
      
      const newContactsThisMonth = contacts.filter(c => 
        new Date(c.createdAt) >= currentMonth
      ).length;

      const qualifiedLeads = contacts.filter(c => 
        c.score > 70 || ['interested', 'replied'].includes(c.status)
      ).length;

      const contactsInSequences = contacts.filter(c => 
        c.lastContactedAt
      ).length;

      const averageScore = contacts.length > 0
        ? contacts.reduce((sum, c) => sum + c.score, 0) / contacts.length
        : 0;

      // Calculate outreach metrics
      const activeSequences = sequences.filter(s => s.status === 'active');
      const totalSent = sequences.reduce((sum, s) => sum + s.performance.sent, 0);
      const totalOpened = sequences.reduce((sum, s) => sum + s.performance.opened, 0);
      const totalReplied = sequences.reduce((sum, s) => sum + s.performance.replied, 0);
      const totalClicked = sequences.reduce((sum, s) => sum + s.performance.clicked, 0);

      const openRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;
      const replyRate = totalSent > 0 ? (totalReplied / totalSent) * 100 : 0;
      const clickRate = totalSent > 0 ? (totalClicked / totalSent) * 100 : 0;

      // Calculate conversion metrics
      const leadsGenerated = qualifiedLeads;
      const conversionRate = contacts.length > 0 ? (leadsGenerated / contacts.length) * 100 : 0;

      // Top performing sequences
      const topPerformingSequences = sequences
        .map(s => ({
          id: s.id,
          name: s.name,
          replyRate: s.performance.sent > 0 
            ? (s.performance.replied / s.performance.sent) * 100 
            : 0
        }))
        .sort((a, b) => b.replyRate - a.replyRate)
        .slice(0, 5);

      // Industry breakdown
      const industryMap = new Map<string, { contacts: number; replies: number }>();
      contacts.forEach(contact => {
        const industry = contact.industry || 'Unknown';
        const current = industryMap.get(industry) || { contacts: 0, replies: 0 };
        current.contacts++;
        if (contact.status === 'replied') current.replies++;
        industryMap.set(industry, current);
      });

      const industryBreakdown = Array.from(industryMap.entries()).map(([industry, data]) => ({
        industry,
        contacts: data.contacts,
        replyRate: data.contacts > 0 ? (data.replies / data.contacts) * 100 : 0
      }));

      return {
        prospecting: {
          totalContacts: contacts.length,
          newContactsThisMonth,
          qualifiedLeads,
          contactsInSequences,
          averageScore: Math.round(averageScore)
        },
        outreach: {
          totalSequences: sequences.length,
          activeSequences: activeSequences.length,
          emailsSent: totalSent,
          emailsOpened: totalOpened,
          emailsReplied: totalReplied,
          openRate: Math.round(openRate * 100) / 100,
          replyRate: Math.round(replyRate * 100) / 100,
          clickRate: Math.round(clickRate * 100) / 100
        },
        conversion: {
          leadsGenerated,
          meetingsBooked: 0, // Would need calendar integration
          dealsCreated: 0, // Would need CRM integration
          conversionRate: Math.round(conversionRate * 100) / 100,
          avgTimeToReply: 0 // Would need detailed tracking
        },
        performance: {
          topPerformingSequences,
          industryBreakdown
        }
      };

    } catch (error) {
      logger.error({ error }, 'Failed to calculate Apollo metrics');
      throw error;
    }
  }

  /**
   * Create a new contact in Apollo
   */
  async createContact(contactData: Partial<ApolloContact>): Promise<ApolloContact> {
    try {
      const response = await this.apiRequest('/contacts', {
        method: 'POST',
        body: JSON.stringify({
          first_name: contactData.firstName,
          last_name: contactData.lastName,
          email: contactData.email,
          title: contactData.title,
          organization_name: contactData.company
        })
      });
      
      return {
        id: response.contact.id,
        firstName: response.contact.first_name,
        lastName: response.contact.last_name,
        email: response.contact.email,
        title: response.contact.title,
        company: response.contact.organization?.name || '',
        industry: response.contact.organization?.industry || '',
        location: '',
        score: 0,
        status: 'new',
        tags: [],
        createdAt: response.contact.created_at,
        updatedAt: response.contact.updated_at
      };
    } catch (error) {
      logger.error({ error, contactData }, 'Failed to create Apollo contact');
      throw error;
    }
  }

  /**
   * Add contacts to a sequence
   */
  async addContactsToSequence(sequenceId: string, contactIds: string[]): Promise<boolean> {
    try {
      await this.apiRequest(`/emailer_campaigns/${sequenceId}/add_contact_ids`, {
        method: 'POST',
        body: JSON.stringify({
          contact_ids: contactIds,
          send_email_from_email_account_id: null // Use default
        })
      });
      
      return true;
    } catch (error) {
      logger.error({ error, sequenceId, contactIds }, 'Failed to add contacts to Apollo sequence');
      return false;
    }
  }

  /**
   * Update business health KPIs with Apollo data
   */
  async updateBusinessHealthKPIs(): Promise<void> {
    try {
      const metrics = await this.getMetrics();
      
      const snapshots = [
        // Lead Generation KPI
        {
          department_id: 'sales',
          kpi_id: 'lead_generation',
          value: metrics.prospecting.newContactsThisMonth,
          source: 'apollo_api',
          captured_at: new Date().toISOString(),
          metadata: {
            total_contacts: metrics.prospecting.totalContacts,
            qualified_leads: metrics.prospecting.qualifiedLeads,
            average_score: metrics.prospecting.averageScore,
            contacts_in_sequences: metrics.prospecting.contactsInSequences
          }
        },
        // Outreach Performance KPI
        {
          department_id: 'sales',
          kpi_id: 'outreach_performance',
          value: metrics.outreach.replyRate,
          source: 'apollo_api',
          captured_at: new Date().toISOString(),
          metadata: {
            emails_sent: metrics.outreach.emailsSent,
            open_rate: metrics.outreach.openRate,
            click_rate: metrics.outreach.clickRate,
            active_sequences: metrics.outreach.activeSequences
          }
        },
        // Sales Conversion KPI
        {
          department_id: 'sales',
          kpi_id: 'sales_conversion',
          value: metrics.conversion.conversionRate,
          source: 'apollo_api',
          captured_at: new Date().toISOString(),
          metadata: {
            leads_generated: metrics.conversion.leadsGenerated,
            meetings_booked: metrics.conversion.meetingsBooked,
            deals_created: metrics.conversion.dealsCreated
          }
        }
      ];

      // Update using the secure edge function
      const { error } = await supabase.functions.invoke('upsert_kpis', {
        body: { snapshots }
      });

      if (error) {
        logger.error({ error }, 'Failed to update Apollo KPIs');
        throw error;
      }

      logger.info('Successfully updated business health KPIs with Apollo data');

    } catch (error) {
      logger.error({ error }, 'Error updating Apollo business health KPIs');
      throw error;
    }
  }

  /**
   * Get key metrics for dashboard display
   */
  async getKeyMetrics(): Promise<Array<{
    name: string;
    value: string | number;
    trend: 'up' | 'down' | 'stable';
    unit?: string;
  }>> {
    const metrics = await this.getMetrics();

    return [
      {
        name: 'Total Prospects',
        value: metrics.prospecting.totalContacts,
        trend: metrics.prospecting.newContactsThisMonth > 0 ? 'up' : 'stable',
        unit: 'contacts'
      },
      {
        name: 'Qualified Leads',
        value: metrics.prospecting.qualifiedLeads,
        trend: 'up',
        unit: 'leads'
      },
      {
        name: 'Email Open Rate',
        value: `${metrics.outreach.openRate}%`,
        trend: metrics.outreach.openRate > 25 ? 'up' : 'down',
        unit: '%'
      },
      {
        name: 'Reply Rate',
        value: `${metrics.outreach.replyRate}%`,
        trend: metrics.outreach.replyRate > 5 ? 'up' : 'down',
        unit: '%'
      },
      {
        name: 'Active Sequences',
        value: metrics.outreach.activeSequences,
        trend: 'stable',
        unit: 'sequences'
      }
    ];
  }
}

export const apolloService = new ApolloService(); 