import { supabase } from '@/lib/core/supabase';

export interface BusinessProfile {
  // Core Business Identity
  company_name: string;
  industry: string;
  business_model: string; // B2B, B2C, SaaS, etc.
  founded_date?: string;
  company_size: 'solopreneur' | 'startup' | 'small' | 'medium' | 'enterprise';
  
  // Mission & Vision
  mission_statement?: string;
  vision_statement?: string;
  core_values?: string[];
  
  // What We Do
  primary_services: string[];
  secondary_services?: string[];
  service_descriptions: Record<string, string>;
  unique_value_proposition: string;
  competitive_advantages?: string[];
  
  // Who We Serve
  target_markets: string[];
  ideal_customer_profile: {
    demographics?: string;
    firmographics?: string;
    psychographics?: string;
    pain_points: string[];
    goals: string[];
  };
  customer_segments: Array<{
    name: string;
    description: string;
    size_percentage: number;
    revenue_contribution: number;
  }>;
  
  // How We Serve
  service_delivery_methods: string[];
  customer_journey_stages: string[];
  touchpoints: string[];
  communication_channels: string[];
  
  // Current Clients & Revenue
  total_clients: number;
  active_clients: number;
  client_categories: Record<string, number>;
  monthly_recurring_revenue?: number;
  average_deal_size?: number;
  customer_lifetime_value?: number;
  churn_rate?: number;
  
  // Operations & Management
  key_processes: string[];
  operational_challenges: string[];
  technology_stack: string[];
  team_structure?: Record<string, any>;
  
  // Financial Structure
  revenue_streams: Array<{
    name: string;
    type: 'recurring' | 'one-time' | 'usage-based';
    percentage: number;
    pricing_model: string;
  }>;
  cost_structure: string[];
  payment_methods: string[];
  billing_cycles: string[];
  
  // Goals & Strategy
  short_term_goals: string[];
  long_term_goals: string[];
  growth_strategy: string;
  expansion_plans?: string[];
  
  // Challenges & Opportunities
  current_challenges: string[];
  market_opportunities: string[];
  threats: string[];
  
  // Metrics & KPIs
  key_metrics: Record<string, any>;
  success_indicators: string[];
  
  // Metadata
  last_updated: string;
  updated_by: string;
}

export class BusinessProfileService {
  private static instance: BusinessProfileService;
  
  public static getInstance(): BusinessProfileService {
    if (!BusinessProfileService.instance) {
      BusinessProfileService.instance = new BusinessProfileService();
    }
    return BusinessProfileService.instance;
  }

  async getBusinessProfile(orgId: string): Promise<BusinessProfile | null> {
    const { data, error } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('org_id', orgId)
      .single();

    if (error) {
      console.error('Error fetching business profile:', error);
      return null;
    }

    return data;
  }

  async saveBusinessProfile(orgId: string, profile: Partial<BusinessProfile>): Promise<boolean> {
    const { error } = await supabase
      .from('business_profiles')
      .upsert({
        org_id: orgId,
        ...profile,
        last_updated: new Date().toISOString(),
      });

    if (error) {
      console.error('Error saving business profile:', error);
      return false;
    }

    return true;
  }

  async updateBusinessProfile(orgId: string, updates: Partial<BusinessProfile>): Promise<boolean> {
    const { error } = await supabase
      .from('business_profiles')
      .update({
        ...updates,
        last_updated: new Date().toISOString(),
      })
      .eq('org_id', orgId);

    if (error) {
      console.error('Error updating business profile:', error);
      return false;
    }

    return true;
  }

  // Generate business intelligence based on profile
  async generateBusinessInsights(orgId: string): Promise<string[]> {
    const profile = await this.getBusinessProfile(orgId);
    if (!profile) return [];

    const insights = [];

    // Revenue insights
    if (profile.revenue_streams) {
      const recurringRevenue = profile.revenue_streams
        .filter(stream => stream.type === 'recurring')
        .reduce((sum, stream) => sum + stream.percentage, 0);
      
      if (recurringRevenue > 70) {
        insights.push("Strong recurring revenue model provides predictable cash flow");
      } else if (recurringRevenue < 30) {
        insights.push("Consider developing more recurring revenue streams for stability");
      }
    }

    // Customer insights
    if (profile.customer_segments) {
      const topSegment = profile.customer_segments
        .sort((a, b) => b.revenue_contribution - a.revenue_contribution)[0];
      
      if (topSegment && topSegment.revenue_contribution > 60) {
        insights.push(`High dependency on ${topSegment.name} segment - consider diversification`);
      }
    }

    // Growth insights
    if (profile.company_size === 'solopreneur' && profile.total_clients > 50) {
      insights.push("Client base suggests readiness for team expansion");
    }

    return insights;
  }

  // Get AI context for business understanding
  async getAIBusinessContext(orgId: string): Promise<string> {
    const profile = await this.getBusinessProfile(orgId);
    if (!profile) return "No business profile available";

    return `
Business Profile for ${profile.company_name}:

WHAT WE DO:
- Primary Services: ${profile.primary_services?.join(', ')}
- Value Proposition: ${profile.unique_value_proposition}
- Business Model: ${profile.business_model}

WHO WE SERVE:
- Target Markets: ${profile.target_markets?.join(', ')}
- Total Clients: ${profile.total_clients}
- Customer Segments: ${profile.customer_segments?.map(s => `${s.name} (${s.revenue_contribution}% revenue)`).join(', ')}

HOW WE SERVE:
- Delivery Methods: ${profile.service_delivery_methods?.join(', ')}
- Communication Channels: ${profile.communication_channels?.join(', ')}

CURRENT SITUATION:
- Company Size: ${profile.company_size}
- Monthly Recurring Revenue: ${profile.monthly_recurring_revenue ? `$${profile.monthly_recurring_revenue}` : 'Not specified'}
- Key Challenges: ${profile.current_challenges?.join(', ')}

GOALS & STRATEGY:
- Short-term Goals: ${profile.short_term_goals?.join(', ')}
- Growth Strategy: ${profile.growth_strategy}

This context should inform all business advice and recommendations.
    `.trim();
  }
}

export const businessProfileService = BusinessProfileService.getInstance(); 