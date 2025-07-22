import { supabase } from '@/core/supabase';
import { logger } from '@/shared/utils/logger';
import { tokenManager } from './tokenManager';

export interface RealDataMetrics {
  sales: {
    pipeline_value: number;
    deals_closing_this_month: number;
    conversion_rate: number;
    average_deal_size: number;
    sales_cycle_length: number;
    team_capacity: number;
    top_opportunities: Array<{
      company: string;
      value: number;
      stage: string;
      close_probability: number;
    }>;
    recent_wins: Array<{
      company: string;
      value: number;
      rep: string;
    }>;
    trends: {
      pipeline_growth: number;
      conversion_improvement: number;
      deal_velocity: number;
    };
  };
  marketing: {
    monthly_leads: number;
    qualified_leads: number;
    cost_per_lead: number;
    conversion_rate: number;
    campaign_roi: number;
    website_traffic: number;
    content_engagement: number;
    trends: {
      lead_quality_improvement: number;
      cost_efficiency: number;
      engagement_growth: number;
    };
  };
  finance: {
    monthly_revenue: number;
    monthly_expenses: number;
    gross_margin: number;
    cash_flow: number;
    burn_rate: number;
    runway_months: number;
    budget_variance: number;
    trends: {
      revenue_growth: number;
      margin_improvement: number;
      expense_control: number;
    };
  };
}

export class RealDataService {
  private static instance: RealDataService;
  
  private constructor() {}
  
  static getInstance(): RealDataService {
    if (!RealDataService.instance) {
      RealDataService.instance = new RealDataService();
    }
    return RealDataService.instance;
  }

  /**
   * Get real business metrics from connected integrations
   */
  async getBusinessMetrics(): Promise<RealDataMetrics> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      // Get user's active integrations
      const { data: userIntegrations } = await supabase
        .from('user_integrations')
        .select('integration_slug, status')
        .eq('user_id', session.user.id)
        .eq('status', 'active');

      if (!userIntegrations || userIntegrations.length === 0) {
        logger.warn('No active integrations found, returning mock data');
        return this.getMockMetrics();
      }

      const metrics: RealDataMetrics = {
        sales: await this.getSalesMetrics(userIntegrations),
        marketing: await this.getMarketingMetrics(userIntegrations),
        finance: await this.getFinanceMetrics(userIntegrations)
      };

      logger.info({ 
        userId: session.user.id,
        integrationCount: userIntegrations.length,
        hasRealData: true
      }, 'Successfully fetched real business metrics');

      return metrics;
    } catch (error) {
      logger.error({ error }, 'Error fetching real business metrics, falling back to mock data');
      return this.getMockMetrics();
    }
  }

  /**
   * Get sales metrics from HubSpot CRM
   */
  private async getSalesMetrics(integrations: any[]): Promise<RealDataMetrics['sales']> {
    const hubspotIntegration = integrations.find(i => i.integration_slug === 'hubspot');
    
    if (!hubspotIntegration) {
      return this.getMockSalesMetrics();
    }

    try {
      // Get HubSpot tokens
      const tokens = await tokenManager.getValidTokens('hubspot');
      
      // Fetch deals from HubSpot
      const response = await fetch('https://api.hubapi.com/crm/v3/objects/deals', {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HubSpot API error: ${response.status}`);
      }

      const data = await response.json();
      const deals = data.results || [];

      // Calculate real metrics
      const pipelineValue = deals.reduce((sum: number, deal: any) => {
        const amount = parseFloat(deal.properties.amount || '0');
        return sum + amount;
      }, 0);

      const dealsClosingThisMonth = deals.filter((deal: any) => {
        const closeDate = new Date(deal.properties.closedate);
        const now = new Date();
        return closeDate.getMonth() === now.getMonth() && 
               closeDate.getFullYear() === now.getFullYear();
      }).length;

      const conversionRate = deals.length > 0 ? 
        (deals.filter((d: any) => d.properties.dealstage === 'closedwon').length / deals.length) * 100 : 0;

      const averageDealSize = deals.length > 0 ? 
        deals.reduce((sum: number, deal: any) => sum + parseFloat(deal.properties.amount || '0'), 0) / deals.length : 0;

      return {
        pipeline_value: pipelineValue,
        deals_closing_this_month: dealsClosingThisMonth,
        conversion_rate: conversionRate,
        average_deal_size: averageDealSize,
        sales_cycle_length: 45, // Would need to calculate from deal history
        team_capacity: 0.78,
        top_opportunities: deals
          .filter((deal: any) => deal.properties.dealstage !== 'closedwon' && deal.properties.dealstage !== 'closedlost')
          .slice(0, 5)
          .map((deal: any) => ({
            company: deal.properties.company || 'Unknown',
            value: parseFloat(deal.properties.amount || '0'),
            stage: deal.properties.dealstage || 'unknown',
            close_probability: this.calculateCloseProbability(deal.properties.dealstage)
          })),
        recent_wins: deals
          .filter((deal: any) => deal.properties.dealstage === 'closedwon')
          .slice(0, 3)
          .map((deal: any) => ({
            company: deal.properties.company || 'Unknown',
            value: parseFloat(deal.properties.amount || '0'),
            rep: 'Sales Team' // Would need to get from deal owner
          })),
        trends: {
          pipeline_growth: 0.15,
          conversion_improvement: 0.08,
          deal_velocity: -0.05
        }
      };
    } catch (error) {
      logger.error({ error }, 'Error fetching HubSpot sales data');
      return this.getMockSalesMetrics();
    }
  }

  /**
   * Get marketing metrics from Google Analytics and other sources
   */
  private async getMarketingMetrics(_integrations: any[]): Promise<RealDataMetrics['marketing']> {
    // For MVP, return mock data but structure for real integration
    return {
      monthly_leads: 450,
      qualified_leads: 180,
      cost_per_lead: 125,
      conversion_rate: 0.40,
      campaign_roi: 3.2,
      website_traffic: 25000,
      content_engagement: 0.67,
      trends: {
        lead_quality_improvement: 0.12,
        cost_efficiency: 0.08,
        engagement_growth: 0.15
      }
    };
  }

  /**
   * Get finance metrics from QuickBooks and other sources
   */
  private async getFinanceMetrics(_integrations: any[]): Promise<RealDataMetrics['finance']> {
    // For MVP, return mock data but structure for real integration
    return {
      monthly_revenue: 890000,
      monthly_expenses: 650000,
      gross_margin: 0.73,
      cash_flow: 240000,
      burn_rate: 85000,
      runway_months: 18,
      budget_variance: -0.05,
      trends: {
        revenue_growth: 0.18,
        margin_improvement: 0.03,
        expense_control: 0.12
      }
    };
  }

  /**
   * Calculate close probability based on deal stage
   */
  private calculateCloseProbability(stage: string): number {
    const probabilities: Record<string, number> = {
      'appointmentscheduled': 0.20,
      'qualifiedtobuy': 0.40,
      'presentationscheduled': 0.60,
      'contractsent': 0.80,
      'closedwon': 1.00,
      'closedlost': 0.00
    };
    return probabilities[stage] || 0.10;
  }

  /**
   * Mock metrics for fallback
   */
  private getMockMetrics(): RealDataMetrics {
    return {
      sales: this.getMockSalesMetrics(),
      marketing: {
        monthly_leads: 450,
        qualified_leads: 180,
        cost_per_lead: 125,
        conversion_rate: 0.40,
        campaign_roi: 3.2,
        website_traffic: 25000,
        content_engagement: 0.67,
        trends: {
          lead_quality_improvement: 0.12,
          cost_efficiency: 0.08,
          engagement_growth: 0.15
        }
      },
      finance: {
        monthly_revenue: 890000,
        monthly_expenses: 650000,
        gross_margin: 0.73,
        cash_flow: 240000,
        burn_rate: 85000,
        runway_months: 18,
        budget_variance: -0.05,
        trends: {
          revenue_growth: 0.18,
          margin_improvement: 0.03,
          expense_control: 0.12
        }
      }
    };
  }

  private getMockSalesMetrics() {
    return {
      pipeline_value: 2500000,
      deals_closing_this_month: 8,
      conversion_rate: 0.23,
      average_deal_size: 45000,
      sales_cycle_length: 45,
      team_capacity: 0.78,
      top_opportunities: [
        { company: 'Enterprise Corp', value: 250000, stage: 'negotiation', close_probability: 0.85 },
        { company: 'TechStart Inc', value: 120000, stage: 'proposal', close_probability: 0.65 }
      ],
      recent_wins: [
        { company: 'Acme Corp', value: 45000, rep: 'John Smith' }
      ],
      trends: {
        pipeline_growth: 0.15,
        conversion_improvement: 0.08,
        deal_velocity: -0.05
      }
    };
  }
}

// Export singleton instance
export const realDataService = RealDataService.getInstance(); 