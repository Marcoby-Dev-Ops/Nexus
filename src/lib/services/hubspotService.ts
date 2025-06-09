/**
 * HubSpot Integration Service
 * Manages Nexus waitlist leads in HubSpot CRM
 * Automates lead scoring, task creation, and campaign management
 */

import { n8nService } from '../n8nService';
import { waitlistService, type WaitlistSignup } from './waitlistService';

export interface HubSpotContact {
  id?: string;
  email: string;
  firstname: string;
  lastname?: string;
  company?: string;
  phone?: string;
  website?: string;
  jobtitle?: string;
  lifecyclestage?: 'subscriber' | 'lead' | 'marketingqualifiedlead' | 'salesqualifiedlead' | 'opportunity' | 'customer';
  hs_lead_status?: 'NEW' | 'OPEN' | 'IN_PROGRESS' | 'OPEN_DEAL' | 'UNQUALIFIED' | 'ATTEMPTED_TO_CONTACT' | 'CONNECTED' | 'BAD_TIMING';
  hubspot_owner_id?: string;
  hs_analytics_source?: string;
  nexus_waitlist_position?: number;
  nexus_waitlist_tier?: 'founder' | 'vip' | 'early-bird';
  nexus_referral_code?: string;
  nexus_referral_count?: number;
  nexus_demo_interest?: 'high' | 'medium' | 'low' | 'none';
}

export interface HubSpotDeal {
  id?: string;
  dealname: string;
  amount?: number;
  dealstage: string;
  pipeline: string;
  hubspot_owner_id?: string;
  closedate?: string;
  deal_source?: string;
  nexus_waitlist_contact_id?: string;
}

export interface HubSpotCampaign {
  id?: string;
  name: string;
  type: 'EMAIL' | 'SOCIAL' | 'CONTENT' | 'AD' | 'OTHER';
  status: 'DRAFT' | 'SCHEDULED' | 'PROCESSING' | 'SENT' | 'COMPLETED';
  subject?: string;
  from_name?: string;
  from_email?: string;
  created_at?: string;
  updated_at?: string;
  recipients_count?: number;
  opens?: number;
  clicks?: number;
  replies?: number;
}

export interface HubSpotCompany {
  id?: string;
  name: string;
  domain?: string;
  industry?: string;
  numberofemployees?: number;
  annualrevenue?: number;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  hubspot_owner_id?: string;
}

export interface HubSpotNote {
  type: 'NOTE';
  ownerId: string;
  contactIds: number[];
  body: string;
}

export interface HubSpotTask {
  type: 'TASK';
  ownerId: string;
  contactIds: number[];
  subject: string;
  body: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'DEFERRED';
  taskType: 'CALL' | 'EMAIL' | 'TODO';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface CampaignMetrics {
  totalContacts: number;
  newLeads: number;
  qualifiedLeads: number;
  dealsCreated: number;
  totalDealValue: number;
  conversionRate: number;
  avgDealSize: number;
  timeToConversion: number;
}

interface LeadScoringCriteria {
  tier: string;
  position: number;
  hasCompany: boolean;
  referralCount: number;
  signupRecency: number; // days
}

class HubSpotService {
  private readonly NEXUS_WAITLIST_CAMPAIGN = 'Nexus Waitlist Campaign';
  private readonly NEXUS_PIPELINE = 'Nexus Sales Pipeline';
  private readonly hubspotOwnerId = '374144594'; // Von Jackson's HubSpot ID
  private readonly baseUrl = import.meta.env.VITE_HUBSPOT_API_URL || 'https://api.hubspot.com';
  
  /**
   * Syncs a waitlist signup to HubSpot as a lead
   */
  async syncWaitlistSignup(waitlistData: WaitlistSignup): Promise<{ success: boolean; contactId?: string; error?: string }> {
    try {
      // Map waitlist data to HubSpot contact
      const hubspotContact: HubSpotContact = {
        email: waitlistData.email,
        firstname: waitlistData.first_name,
        company: waitlistData.company_name,
        lifecyclestage: 'lead',
        hs_lead_status: 'NEW',
        hs_analytics_source: 'OTHER_CAMPAIGNS',
        nexus_waitlist_position: waitlistData.position,
        nexus_waitlist_tier: waitlistData.tier as 'founder' | 'vip' | 'early-bird',
        nexus_referral_code: waitlistData.referral_code,
        nexus_referral_count: waitlistData.referral_count,
        nexus_demo_interest: this.determineDemoInterest(waitlistData),
        hubspot_owner_id: this.hubspotOwnerId
      };

      console.log('Syncing waitlist signup to HubSpot:', hubspotContact);

      // In a real implementation, this would use the HubSpot API
      // For now, we'll simulate the sync
      return { success: true, contactId: `hubspot_${Date.now()}` };
    } catch (error) {
      console.error('HubSpot sync failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Determines demo interest level based on waitlist data
   */
  private determineDemoInterest(waitlistData: WaitlistSignup): 'high' | 'medium' | 'low' | 'none' {
    if (waitlistData.tier === 'founder') return 'high';
    if (waitlistData.tier === 'vip') return 'medium';
    if (waitlistData.position <= 1000) return 'medium';
    return 'low';
  }

  /**
   * Finds a contact by email address
   */
  private async findContactByEmail(email: string): Promise<HubSpotContact | null> {
    // This would call the HubSpot API to search for contacts
    // For now, return null to indicate not found
    return null;
  }

  /**
   * Creates a new contact in HubSpot
   */
  private async createContact(contact: HubSpotContact): Promise<HubSpotContact> {
    // This would call the HubSpot API to create a contact
    // For demo purposes, return a mock response
    return { ...contact, id: Date.now().toString() };
  }

  /**
   * Updates an existing contact in HubSpot
   */
  private async updateContact(contactId: string, contact: Partial<HubSpotContact>): Promise<void> {
    // This would call the HubSpot API to update a contact
    console.log(`Updating HubSpot contact ${contactId}:`, contact);
  }

  /**
   * Creates a detailed note about the waitlist signup
   */
  private async createWaitlistNote(contactId: string, waitlistData: WaitlistSignup): Promise<void> {
    const tierEmoji = {
      founder: '👑',
      vip: '⭐',
      'early-bird': '🐦'
    };

    const signupDate = waitlistData.created_at 
      ? new Date(waitlistData.created_at).toLocaleDateString()
      : new Date().toLocaleDateString();

    const noteBody = `
      <h3>${tierEmoji[waitlistData.tier]} Nexus Waitlist ${waitlistData.tier.charAt(0).toUpperCase() + waitlistData.tier.slice(1)} #${waitlistData.position}</h3>
      
      <p><strong>Contact Details:</strong></p>
      <ul>
        <li><strong>Position:</strong> #${waitlistData.position} (${waitlistData.tier.charAt(0).toUpperCase() + waitlistData.tier.slice(1)} Tier)</li>
        <li><strong>Referral Code:</strong> ${waitlistData.referral_code}</li>
        <li><strong>Referrals Made:</strong> ${waitlistData.referral_count}</li>
        ${waitlistData.company_name ? `<li><strong>Company:</strong> ${waitlistData.company_name}</li>` : ''}
        <li><strong>Signup Date:</strong> ${signupDate}</li>
      </ul>
      
      <p><strong>Next Steps:</strong></p>
      <ul>
        ${waitlistData.tier === 'founder' ? '<li>🎯 <strong>Priority Contact</strong> - Founder tier with exclusive benefits</li>' : ''}
        <li>📞 Schedule ${waitlistData.tier === 'founder' ? 'personalized' : ''} demo call</li>
        <li>💰 Discuss ${this.getTierBenefits(waitlistData.tier)}</li>
        <li>📈 Understand current business needs and pain points</li>
        ${waitlistData.tier === 'founder' ? '<li>🤝 Explore potential partnership opportunities</li>' : ''}
      </ul>
      
      <p><strong>Campaign:</strong> Nexus Pre-Launch Lead Nurturing<br>
      <strong>Source:</strong> Nexus Waitlist Landing Page</p>
    `;

    console.log(`Creating HubSpot note for contact ${contactId}:`, noteBody);
  }

  /**
   * Creates a follow-up task based on waitlist tier
   */
  private async createFollowUpTask(contactId: string, waitlistData: WaitlistSignup): Promise<void> {
    const urgency = {
      founder: { priority: 'HIGH' as const, timeframe: '24 hours' },
      vip: { priority: 'MEDIUM' as const, timeframe: '48 hours' },
      'early-bird': { priority: 'MEDIUM' as const, timeframe: '1 week' }
    };

    const task = urgency[waitlistData.tier];
    
    const taskSubject = `${task.priority === 'HIGH' ? '🎯 PRIORITY: ' : ''}Contact Nexus ${waitlistData.tier.charAt(0).toUpperCase() + waitlistData.tier.slice(1)} #${waitlistData.position} for Demo`;
    
    const taskBody = `Schedule ${waitlistData.tier === 'founder' ? 'personalized ' : ''}Nexus demo call with ${waitlistData.tier} tier contact within ${task.timeframe}`;

    console.log(`Creating HubSpot task for contact ${contactId}:`, { taskSubject, taskBody, priority: task.priority });
  }

  /**
   * Gets tier-specific benefits description
   */
  private getTierBenefits(tier: 'founder' | 'vip' | 'early-bird'): string {
    const benefits = {
      founder: 'founder benefits: 50% lifetime discount, exclusive features, direct access',
      vip: 'VIP benefits: 25% first-year discount, priority support, beta access',
      'early-bird': 'early-bird benefits: 15% first-year discount, early access'
    };
    return benefits[tier];
  }

  /**
   * Updates a contact's demo interest level
   */
  async updateDemoInterest(contactId: string, interestLevel: 'high' | 'medium' | 'low' | 'none'): Promise<void> {
    await this.updateContact(contactId, { nexus_demo_interest: interestLevel });
  }

  /**
   * Promotes a contact in the sales funnel (e.g., from lead to MQL)
   */
  async promoteContact(contactId: string, newStage: HubSpotContact['lifecyclestage']): Promise<void> {
    await this.updateContact(contactId, { lifecyclestage: newStage });
  }

  /**
   * Creates a demo booking confirmation note
   */
  async createDemoBookedNote(contactId: string, demoDetails: { date: string; type: string; duration: string }): Promise<void> {
    const noteBody = `
      <h3>🎯 Nexus Demo Scheduled!</h3>
      
      <p><strong>Demo Details:</strong></p>
      <ul>
        <li><strong>Date:</strong> ${demoDetails.date}</li>
        <li><strong>Type:</strong> ${demoDetails.type}</li>
        <li><strong>Duration:</strong> ${demoDetails.duration}</li>
      </ul>
      
      <p><strong>Pre-Demo Checklist:</strong></p>
      <ul>
        <li>📧 Send calendar invite with Zoom link</li>
        <li>📋 Send demo preparation questionnaire</li>
        <li>🎯 Review contact's tier benefits and company needs</li>
        <li>📊 Prepare custom demo script based on their industry</li>
      </ul>
    `;

    console.log(`Creating demo booked note for contact ${contactId}:`, noteBody);
  }

  /**
   * Generates HubSpot dashboard links for monitoring waitlist campaign
   */
  generateDashboardLinks(): { contacts: string; reports: string; workflows: string } {
    const portalId = '24453878';
    const baseUrl = 'https://app.hubspot.com';
    
    return {
      contacts: `${baseUrl}/contacts/${portalId}/objects/0-1/views/all/list?query=nexus_waitlist_position%3A*`,
      reports: `${baseUrl}/reports-dashboard/${portalId}/view/custom`,
      workflows: `${baseUrl}/workflows/${portalId}/view/all`
    };
  }

  /**
   * Create a deal for high-value waitlist leads
   */
  async createDealForLead(contactId: string, waitlistSignup: WaitlistSignup): Promise<{ success: boolean; dealId?: string; error?: string }> {
    try {
      const dealValue = this.estimateDealValue(waitlistSignup);
      const dealStage = this.getDealStage(waitlistSignup);

      const deal: HubSpotDeal = {
        dealname: `${waitlistSignup.first_name} - Nexus Platform (${waitlistSignup.tier})`,
        amount: dealValue,
        dealstage: dealStage,
        pipeline: this.NEXUS_PIPELINE,
        deal_source: 'Nexus Waitlist',
        nexus_waitlist_contact_id: contactId,
        closedate: this.getEstimatedCloseDate(waitlistSignup.tier)
      };

      const result = await n8nService.salesAction('pipeline', {
        action: 'create_hubspot_deal',
        deal,
        contactId,
        waitlistData: waitlistSignup
      });

      if (result.success) {
        return {
          success: true,
          dealId: result.data?.dealId
        };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to create HubSpot deal'
        };
      }
    } catch (error) {
      console.error('Error creating HubSpot deal:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Sync all waitlist signups to HubSpot
   */
  async syncWaitlistToHubSpot(): Promise<{ success: boolean; synced: number; errors: string[] }> {
    try {
      const statsResult = await waitlistService.getStats();
      if (!statsResult.success || !statsResult.data) {
        return { success: false, synced: 0, errors: ['Failed to get waitlist stats'] };
      }

      // Get all waitlist signups (you'll need to add this method to waitlistService)
      const syncResult = await n8nService.salesAction('lead', {
        action: 'sync_waitlist_to_hubspot',
        totalSignups: statsResult.data.total_signups
      });

      if (syncResult.success) {
        return {
          success: true,
          synced: syncResult.data?.synced || 0,
          errors: syncResult.data?.errors || []
        };
      } else {
        return {
          success: false,
          synced: 0,
          errors: [syncResult.error || 'Sync failed']
        };
      }
    } catch (error) {
      console.error('Error syncing waitlist to HubSpot:', error);
      return {
        success: false,
        synced: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Create email campaign for waitlist segments
   */
  async createEmailCampaign(
    name: string,
    tier: 'founder' | 'vip' | 'early-bird' | 'all',
    template: 'welcome' | 'nurture' | 'demo_invite' | 'launch_announcement',
    scheduledDate?: Date
  ): Promise<{ success: boolean; campaignId?: string; error?: string }> {
    try {
      const campaign: HubSpotCampaign = {
        name: `${this.NEXUS_WAITLIST_CAMPAIGN} - ${name}`,
        type: 'EMAIL',
        status: scheduledDate ? 'SCHEDULED' : 'DRAFT',
        subject: this.getEmailSubject(template, tier),
        from_name: 'Nexus Team',
        from_email: 'hello@nexusplatform.com'
      };

      const result = await n8nService.salesAction('lead', {
        action: 'create_hubspot_campaign',
        campaign,
        tier,
        template,
        scheduledDate: scheduledDate?.toISOString()
      });

      if (result.success) {
        return {
          success: true,
          campaignId: result.data?.campaignId
        };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to create email campaign'
        };
      }
    } catch (error) {
      console.error('Error creating email campaign:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get campaign metrics and analytics
   */
  async getCampaignMetrics(): Promise<{ success: boolean; metrics?: CampaignMetrics; error?: string }> {
    try {
      const result = await n8nService.salesAction('forecast', {
        action: 'get_hubspot_campaign_metrics',
        campaign: this.NEXUS_WAITLIST_CAMPAIGN
      });

      if (result.success) {
        return {
          success: true,
          metrics: result.data?.metrics
        };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to get campaign metrics'
        };
      }
    } catch (error) {
      console.error('Error getting campaign metrics:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Score and qualify leads based on waitlist data
   */
  async scoreLeads(): Promise<{ success: boolean; scored: number; error?: string }> {
    try {
      const result = await n8nService.salesAction('lead', {
        action: 'score_waitlist_leads',
        criteria: this.getLeadScoringCriteria()
      });

      if (result.success) {
        return {
          success: true,
          scored: result.data?.scored || 0
        };
      } else {
        return {
          success: false,
          scored: 0,
          error: result.error || 'Failed to score leads'
        };
      }
    } catch (error) {
      console.error('Error scoring leads:', error);
      return {
        success: false,
        scored: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Schedule demo calls for qualified leads
   */
  async scheduleDemoCalls(tier: 'founder' | 'vip', limit = 10): Promise<{ success: boolean; scheduled: number; error?: string }> {
    try {
      const result = await n8nService.salesAction('pipeline', {
        action: 'schedule_demo_calls',
        tier,
        limit,
        campaign: this.NEXUS_WAITLIST_CAMPAIGN
      });

      if (result.success) {
        return {
          success: true,
          scheduled: result.data?.scheduled || 0
        };
      } else {
        return {
          success: false,
          scheduled: 0,
          error: result.error || 'Failed to schedule demo calls'
        };
      }
    } catch (error) {
      console.error('Error scheduling demo calls:', error);
      return {
        success: false,
        scheduled: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Private helper methods

  private getLifecycleStage(tier: string): HubSpotContact['lifecyclestage'] {
    switch (tier) {
      case 'founder':
        return 'salesqualifiedlead';
      case 'vip':
        return 'marketingqualifiedlead';
      case 'early-bird':
        return 'lead';
      default:
        return 'subscriber';
    }
  }

  private estimateDealValue(waitlistSignup: WaitlistSignup): number {
    const baseDealValue = {
      founder: 50000,  // Premium early access
      vip: 25000,      // Standard pricing
      'early-bird': 15000  // Basic tier
    };

    let value = baseDealValue[waitlistSignup.tier as keyof typeof baseDealValue] || 15000;

    // Increase value based on company presence
    if (waitlistSignup.company_name) {
      value *= 1.5;
    }

    // Increase value based on referrals (viral coefficient)
    if (waitlistSignup.referral_count > 0) {
      value *= (1 + (waitlistSignup.referral_count * 0.1));
    }

    return Math.round(value);
  }

  private getDealStage(waitlistSignup: WaitlistSignup): string {
    switch (waitlistSignup.tier) {
      case 'founder':
        return 'qualifiedtobuy';
      case 'vip':
        return 'presentationscheduled';
      case 'early-bird':
        return 'appointmentscheduled';
      default:
        return 'appointmentscheduled';
    }
  }

  private getEstimatedCloseDate(tier: string): string {
    const daysToClose = {
      founder: 30,    // Fast track for founders
      vip: 60,        // Standard sales cycle
      'early-bird': 90    // Longer nurture cycle
    };

    const days = daysToClose[tier as keyof typeof daysToClose] || 90;
    const closeDate = new Date();
    closeDate.setDate(closeDate.getDate() + days);
    
    return closeDate.toISOString().split('T')[0];
  }

  private getEmailSubject(template: string, tier: string): string {
    const subjects = {
      welcome: {
        founder: '🎉 Welcome to Nexus - Your Founder Access is Ready!',
        vip: '🌟 Welcome to Nexus VIP - Exclusive Access Awaits',
        'early-bird': '🚀 Welcome to Nexus - You\'re on the List!',
        all: '👋 Welcome to the Nexus Revolution'
      },
      nurture: {
        founder: '🔥 Founder Update: Behind the Scenes at Nexus',
        vip: '💎 VIP Exclusive: New Features Preview',
        'early-bird': '📈 Early Bird Update: Progress & Timeline',
        all: '📰 Nexus Newsletter: Updates & Insights'
      },
      demo_invite: {
        founder: '🎯 Your Personal Nexus Demo - Let\'s Schedule',
        vip: '📞 VIP Demo Invitation - See Nexus in Action',
        'early-bird': '👀 Demo Request: Ready to See Nexus?',
        all: '🎪 Join Our Live Demo - See What You\'ve Been Waiting For'
      },
      launch_announcement: {
        founder: '🚀 It\'s Here! Nexus is Live - Founder Access Active',
        vip: '🎉 Launch Day! VIP Early Access Now Available',
        'early-bird': '🎊 We\'re Live! Early Bird Access Ready',
        all: '🌟 Nexus is Live! Your Business OS Awaits'
      }
    };

    return subjects[template as keyof typeof subjects]?.[tier as keyof typeof subjects.welcome] || 
           subjects[template as keyof typeof subjects]?.all || 
           'Nexus Platform Update';
  }

  private getLeadScoringCriteria(): LeadScoringCriteria[] {
    return [
      {
        tier: 'founder',
        position: 100,
        hasCompany: true,
        referralCount: 1,
        signupRecency: 30
      },
      {
        tier: 'vip',
        position: 500,
        hasCompany: false,
        referralCount: 0,
        signupRecency: 60
      },
      {
        tier: 'early-bird',
        position: 1000,
        hasCompany: false,
        referralCount: 0,
        signupRecency: 90
      }
    ];
  }
}

// Export singleton instance
export const hubspotService = new HubSpotService(); 