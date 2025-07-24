import { hubspotIntegration } from '@/domains/integrations/lib/hubspotIntegration';
import { supabase } from '@/core/supabase';

export interface SalesMetrics {
  totalRevenue: number;
  revenueChange: number;
  totalDeals: number;
  dealsChange: number;
  winRate: number;
  winRateChange: number;
  averageDealSize: number;
  dealSizeChange: number;
}

export interface PipelineStage {
  id: string;
  name: string;
  count: number;
  value: number;
  color: string;
}

export interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  deals: number;
  revenue: number;
  quota: number;
  progress: number;
}

export interface RecentDeal {
  id: string;
  company: string;
  status: string;
  value: number;
  rep: {
    name: string;
    avatar: string;
  };
  closedDate: string;
  product: string;
}

export interface TopOpportunity {
  id: string;
  company: string;
  probability: number;
  value: number;
  stage: string;
  nextAction: string;
  nextActionDate: string;
  rep: {
    name: string;
    avatar: string;
  };
}

class HubSpotSalesService {
  private initialized = false;

  async initialize(userId: string): Promise<void> {
    if (this.initialized) return;

    try {
      // Get user's HubSpot integration credentials
      const { error } = await supabase
        .from('user_integrations')
        .select('*')
        .eq('user_id', userId)
        .eq('integration_id', 'hubspot')
        .single();

      if (error || !integration) {
        throw new Error('HubSpot integration not found. Please connect your HubSpot account first.');
      }

      // Initialize HubSpot integration with user's credentials
      const config = {
        baseUrl: 'https://api.hubapi.com',
        accessToken: integration.access_token,
        refreshToken: integration.refresh_token,
        clientId: integration.client_id,
        clientSecret: integration.client_secret,
        expiresAt: integration.expires_at
      };

      await hubspotIntegration.initialize();
      this.initialized = true;
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Failed to initialize HubSpot service: ', error);
      throw error;
    }
  }

  async getSalesMetrics(userId: string): Promise<SalesMetrics> {
    await this.initialize(userId);

    try {
      // Get all deals from HubSpot
      const deals = await hubspotIntegration.getDeals(1000); // Get more deals for accurate metrics
      
      // Calculate metrics
      const totalRevenue = deals.reduce((sum, deal) => {
        const amount = parseFloat(deal.properties.amount || '0');
        return sum + amount;
      }, 0);

      const wonDeals = deals.filter(deal => 
        deal.properties.dealstage === 'closedwon' || 
        deal.properties.dealstage === 'closed_won'
      );

      const winRate = deals.length > 0 ? (wonDeals.length / deals.length) * 100: 0;
      const averageDealSize = deals.length > 0 ? totalRevenue / deals.length : 0;

      // Calculate changes (simplified - in real app, you'd compare with previous period)
      const revenueChange = 15.2; // Mock change percentage
      const dealsChange = 8.7;
      const winRateChange = 2.1;
      const dealSizeChange = 12.3;

      return {
        totalRevenue,
        revenueChange,
        totalDeals: deals.length,
        dealsChange,
        winRate,
        winRateChange,
        averageDealSize,
        dealSizeChange
      };
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Failed to get sales metrics: ', error);
      throw error;
    }
  }

  async getPipelineStages(userId: string): Promise<PipelineStage[]> {
    await this.initialize(userId);

    try {
      const deals = await hubspotIntegration.getDeals(1000);
      
      // Group deals by stage
      const stageGroups = deals.reduce((groups, deal) => {
        const stage = deal.properties.dealstage || 'lead';
        const amount = parseFloat(deal.properties.amount || '0');
        
        if (!groups[stage]) {
          groups[stage] = { count: 0, value: 0 };
        }
        
        groups[stage].count++;
        groups[stage].value += amount;
        
        return groups;
      }, {} as Record<string, { count: number; value: number }>);

      // Map to pipeline stages with colors
      const stageMapping = {
        'lead': { name: 'Lead', color: 'bg-info/20' },
        'qualified': { name: 'Qualified', color: 'bg-info/30' },
        'proposal': { name: 'Proposal', color: 'bg-info/40' },
        'negotiation': { name: 'Negotiation', color: 'bg-primary' },
        'closedwon': { name: 'Closed Won', color: 'bg-success' },
        'closed_lost': { name: 'Closed Lost', color: 'bg-destructive' }
      };

      return Object.entries(stageGroups).map(([stage, data]) => ({
        id: stage,
        name: stageMapping[stage as keyof typeof stageMapping]?.name || stage,
        count: data.count,
        value: data.value,
        color: stageMapping[stage as keyof typeof stageMapping]?.color || 'bg-gray-500'
      }));
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Failed to get pipeline stages: ', error);
      throw error;
    }
  }

  async getTeamPerformance(userId: string): Promise<TeamMember[]> {
    await this.initialize(userId);

    try {
      const deals = await hubspotIntegration.getDeals(1000);
      
      // Group deals by owner (simplified - in real app, you'd have user mapping)
      const ownerGroups = deals.reduce((groups, deal) => {
        const owner = deal.properties.hubspot_owner_id || 'unknown';
        const amount = parseFloat(deal.properties.amount || '0');
        
        if (!groups[owner]) {
          groups[owner] = { deals: 0, revenue: 0 };
        }
        
        groups[owner].deals++;
        groups[owner].revenue += amount;
        
        return groups;
      }, {} as Record<string, { deals: number; revenue: number }>);

      // Mock team data (in real app, you'd get this from user management)
      const teamMembers = [
        { id: 'alex', name: 'Alex Rodriguez', avatar: '/avatars/alex.jpg', quota: 100000 },
        { id: 'jordan', name: 'Jordan Lee', avatar: '/avatars/jordan.jpg', quota: 80000 },
        { id: 'taylor', name: 'Taylor Wong', avatar: '/avatars/taylor.jpg', quota: 80000 },
        { id: 'sam', name: 'Sam Jackson', avatar: '/avatars/sam.jpg', quota: 60000 }
      ];

      return teamMembers.map(member => {
        const performance = ownerGroups[member.id] || { deals: 0, revenue: 0 };
        const progress = (performance.revenue / member.quota) * 100;
        
        return {
          ...member,
          deals: performance.deals,
          revenue: performance.revenue,
          progress: Math.min(progress, 100)
        };
      });
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Failed to get team performance: ', error);
      throw error;
    }
  }

  async getRecentDeals(userId: string): Promise<RecentDeal[]> {
    await this.initialize(userId);

    try {
      const deals = await hubspotIntegration.getDeals(20); // Get recent deals
      
      return deals.map(deal => ({
        id: deal.id,
        company: deal.properties.company || 'Unknown Company',
        status: deal.properties.dealstage || 'lead',
        value: parseFloat(deal.properties.amount || '0'),
        rep: {
          name: 'Alex Rodriguez', // Mock rep name
          avatar: '/avatars/alex.jpg'
        },
        closedDate: deal.properties.closedate || new Date().toISOString().split('T')[0],
        product: deal.properties.dealname || 'Unknown Product'
      }));
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Failed to get recent deals: ', error);
      throw error;
    }
  }

  async getTopOpportunities(userId: string): Promise<TopOpportunity[]> {
    await this.initialize(userId);

    try {
      const deals = await hubspotIntegration.getDeals(100);
      
      // Filter for active deals (not closed)
      const activeDeals = deals.filter(deal => 
        deal.properties.dealstage !== 'closedwon' && 
        deal.properties.dealstage !== 'closed_lost'
      );

      // Sort by value and probability
      const sortedDeals = activeDeals.sort((a, b) => {
        const aValue = parseFloat(a.properties.amount || '0');
        const bValue = parseFloat(b.properties.amount || '0');
        return bValue - aValue;
      });

      return sortedDeals.slice(0, 10).map(deal => ({
        id: deal.id,
        company: deal.properties.company || 'Unknown Company',
        probability: this.getProbabilityFromStage(deal.properties.dealstage),
        value: parseFloat(deal.properties.amount || '0'),
        stage: deal.properties.dealstage || 'lead',
        nextAction: this.getNextActionFromStage(deal.properties.dealstage),
        nextActionDate: this.getNextActionDate(deal.properties.closedate),
        rep: {
          name: 'Alex Rodriguez', // Mock rep name
          avatar: '/avatars/alex.jpg'
        }
      }));
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Failed to get top opportunities: ', error);
      throw error;
    }
  }

  private getProbabilityFromStage(stage: string): number {
    const probabilities = {
      'lead': 10,
      'qualified': 25,
      'proposal': 50,
      'negotiation': 75,
      'closedwon': 100,
      'closed_lost': 0
    };
    return probabilities[stage as keyof typeof probabilities] || 10;
  }

  private getNextActionFromStage(stage: string): string {
    const actions = {
      'lead': 'Qualify lead',
      'qualified': 'Send proposal',
      'proposal': 'Follow up',
      'negotiation': 'Close deal',
      'closedwon': 'Handoff to customer success',
      'closed_lost': 'Review and learn'
    };
    return actions[stage as keyof typeof actions] || 'Follow up';
  }

  private getNextActionDate(closeDate: string): string {
    if (!closeDate) {
      // If no close date, set to next week
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      return nextWeek.toISOString().split('T')[0];
    }
    return closeDate;
  }
}

export const hubspotSalesService = new HubSpotSalesService(); 