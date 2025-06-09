/**
 * contextualRAG.ts
 * 
 * Retrieval Augmented Generation system for Nexus AI assistants.
 * Provides contextual business data and user intelligence to enhance expert responses.
 */

import type { Agent } from './agentRegistry';
import { supabase } from './supabase';

export interface UserContext {
  profile: {
    id: string;
    email: string;
    name: string;
    role: string;
    department: string;
    company_id: string;
    permissions: string[];
    preferences: Record<string, any>;
  };
  activity: {
    recent_pages: string[];
    frequent_actions: string[];
    last_active: string;
    session_duration: number;
    total_sessions: number;
  };
  business_context: {
    company_name: string;
    industry: string;
    company_size: string;
    growth_stage: 'startup' | 'growth' | 'enterprise';
    fiscal_year_end: string;
    key_metrics: Record<string, any>;
  };
}

export interface DepartmentData {
  sales: {
    pipeline_value: number;
    deals_closing_this_month: number;
    conversion_rates: Record<string, number>;
    top_opportunities: Array<{
      company: string;
      value: number;
      stage: string;
      close_date: string;
    }>;
    team_performance: Record<string, any>;
    recent_wins: Array<{
      company: string;
      value: number;
      rep: string;
    }>;
  };
  marketing: {
    campaign_performance: Record<string, any>;
    lead_generation: {
      total_leads: number;
      qualified_leads: number;
      cost_per_lead: number;
    };
    website_analytics: {
      traffic: number;
      conversion_rate: number;
      top_pages: string[];
    };
    content_performance: Array<{
      title: string;
      views: number;
      engagement: number;
    }>;
  };
  finance: {
    revenue: {
      current_month: number;
      previous_month: number;
      ytd: number;
      forecast: number;
    };
    expenses: {
      current_month: number;
      budget_variance: number;
      top_categories: Array<{
        category: string;
        amount: number;
      }>;
    };
    cash_flow: {
      current_balance: number;
      projected_30_days: number;
      burn_rate: number;
    };
    key_metrics: {
      gross_margin: number;
      customer_acquisition_cost: number;
      lifetime_value: number;
    };
  };
  operations: {
    projects: {
      active_count: number;
      on_track: number;
      at_risk: number;
      recent_completions: Array<{
        name: string;
        completion_date: string;
        status: string;
      }>;
    };
    system_health: {
      uptime: number;
      performance_score: number;
      open_tickets: number;
    };
    team_utilization: {
      current_capacity: number;
      upcoming_availability: string;
    };
  };
}

export class ContextualRAG {
  private userContext: UserContext | null = null;
  private departmentData: Partial<DepartmentData> = {};

  /**
   * Initialize RAG system with user context
   */
  async initialize(userId: string): Promise<void> {
    this.userContext = await this.fetchUserContext(userId);
    // Pre-load frequently accessed department data
    await this.preloadDepartmentData();
  }

  /**
   * Get contextual prompt for Executive Assistant with full user intelligence
   */
  async getExecutiveContext(query: string): Promise<string> {
    if (!this.userContext) {
      throw new Error('RAG system not initialized');
    }

    const userIntelligence = this.buildUserIntelligence();
    const businessIntelligence = await this.getBusinessIntelligence();
    const queryContext = this.analyzeQuery(query);

    return `EXECUTIVE CONTEXT & INTELLIGENCE:

USER PROFILE:
- ${this.userContext.profile.name} (${this.userContext.profile.role}) from ${this.userContext.business_context.company_name}
- Department: ${this.userContext.profile.department}
- Company Stage: ${this.userContext.business_context.growth_stage} (${this.userContext.business_context.company_size})
- Industry: ${this.userContext.business_context.industry}

CURRENT SESSION INTELLIGENCE:
${userIntelligence}

BUSINESS INTELLIGENCE SUMMARY:
${businessIntelligence}

QUERY ANALYSIS:
${queryContext}

Based on this context, provide strategic guidance that considers the user's role, company situation, and current business performance. Reference specific data points when relevant and suggest department specialists if deeper analysis is needed.`;
  }

  /**
   * Get department-specific data context for specialized assistants
   */
  async getDepartmentContext(department: string, query: string): Promise<string> {
    const departmentData = await this.fetchDepartmentData(department);
    const relevantData = this.extractRelevantData(departmentData, query);
    const userRole = this.userContext?.profile.role || 'Team Member';

    return `DEPARTMENT CONTEXT & DATA:

CURRENT ${department.toUpperCase()} PERFORMANCE:
${this.formatDepartmentData(department, departmentData)}

RELEVANT TO YOUR QUERY:
${relevantData}

USER PERSPECTIVE:
- You are advising ${this.userContext?.profile.name} (${userRole})
- Their department: ${this.userContext?.profile.department}
- Company context: ${this.userContext?.business_context.company_name} (${this.userContext?.business_context.growth_stage})

Provide expert guidance using this real-time data. Reference specific metrics, trends, and opportunities from the data above.`;
  }

  /**
   * Determine which assistant should handle the query and provide routing intelligence
   */
  async getRoutingIntelligence(query: string): Promise<{
    recommendedAgent: string;
    confidence: number;
    reasoning: string;
    contextualPrompt: string;
  }> {
    const queryAnalysis = this.analyzeQuery(query);
    
    // Analyze query intent and determine best agent
    const routing = await this.analyzeQueryRouting(query, queryAnalysis);
    
    return {
      recommendedAgent: routing.agent,
      confidence: routing.confidence,
      reasoning: routing.reasoning,
      contextualPrompt: routing.agent === 'executive' 
        ? await this.getExecutiveContext(query)
        : await this.getDepartmentContext(routing.department!, query)
    };
  }

  /**
   * Fetch comprehensive user context from multiple data sources
   */
  private async fetchUserContext(userId: string): Promise<UserContext> {
    try {
      // Fetch user profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // Fetch user activity (using chat_messages as proxy for user activity)
      const { data: activity } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      // Fetch company context
      const { data: company } = await supabase
        .from('companies')
        .select('*')
        .eq('id', profile?.company_id || '')
        .single();

      return {
        profile: {
          id: profile?.id || userId,
          email: profile?.personal_email || '',
          name: profile?.first_name || 'User',
          role: profile?.role || 'Team Member',
          department: profile?.department || 'General',
          company_id: profile?.company_id || '',
          permissions: profile?.skills || [],
          preferences: typeof profile?.preferences === 'object' && profile?.preferences 
            ? profile.preferences as Record<string, any>
            : {}
        },
        activity: {
          recent_pages: activity?.slice(0, 10).map(() => 'chat') || [],
          frequent_actions: this.calculateFrequentActions(activity || []),
          last_active: activity?.[0]?.created_at || new Date().toISOString(),
          session_duration: this.calculateSessionDuration(activity || []),
          total_sessions: activity?.length || 0
        },
        business_context: {
          company_name: company?.name || 'Your Company',
          industry: company?.industry || 'Technology',
          company_size: company?.size || 'Small',
          growth_stage: 'growth', // Using default until schema is updated
          fiscal_year_end: '12-31', // Using default until schema is updated
          key_metrics: {
            employees: 50,
            annual_revenue: 5000000,
            growth_rate: 25,
            customer_count: 150
          }
        }
      };
    } catch (error) {
      console.error('Error fetching user context:', error);
      // Return default context
      return this.getDefaultUserContext(userId);
    }
  }

  /**
   * Fetch department-specific business data
   */
  private async fetchDepartmentData(department: string): Promise<any> {
    // For now, return demo data until database integration is complete
    return this.getDemoData(department);
  }

  /**
   * Get demo data for departments
   */
  private getDemoData(department: string): any {
    switch (department) {
      case 'sales':
        return {
          pipeline_value: 1850000,
          deals_closing_this_month: 8,
          conversion_rates: { prospect: 25, qualified: 45, proposal: 75, negotiation: 85 },
          top_opportunities: [
            { company: 'TechCorp Inc.', value: 250000, stage: 'Proposal', close_date: '2024-02-15' },
            { company: 'Innovation Labs', value: 185000, stage: 'Negotiation', close_date: '2024-02-28' },
            { company: 'Future Systems', value: 320000, stage: 'Qualified', close_date: '2024-03-15' }
          ],
          team_performance: { quota_attainment: 87, top_performer: 'Sarah Johnson' },
          recent_wins: [
            { company: 'DataFlow Corp', value: 125000, rep: 'Mike Chen' },
            { company: 'CloudTech Solutions', value: 95000, rep: 'Sarah Johnson' }
          ]
        };
      case 'marketing':
        return {
          campaign_performance: { total_campaigns: 12, active_campaigns: 5, avg_roi: 3.2 },
          lead_generation: { total_leads: 847, qualified_leads: 234, cost_per_lead: 45 },
          website_analytics: { traffic: 25000, conversion_rate: 2.8, top_pages: ['/pricing', '/features', '/demo'] },
          content_performance: [
            { title: 'Industry Report 2024', views: 5200, engagement: 78 },
            { title: 'Product Demo Video', views: 3800, engagement: 85 }
          ]
        };
      case 'finance':
        return {
          revenue: { current_month: 425000, previous_month: 385000, ytd: 4200000, forecast: 5200000 },
          expenses: { current_month: 298000, budget_variance: -12000, top_categories: [
            { category: 'Personnel', amount: 185000 },
            { category: 'Technology', amount: 65000 },
            { category: 'Marketing', amount: 48000 }
          ]},
          cash_flow: { current_balance: 850000, projected_30_days: 120000, burn_rate: 45000 },
          key_metrics: { gross_margin: 78.5, customer_acquisition_cost: 450, lifetime_value: 12500 }
        };
      case 'operations':
        return {
          projects: { active_count: 8, on_track: 6, at_risk: 2, recent_completions: [
            { name: 'Q4 Platform Update', completion_date: '2024-01-15', status: 'completed' },
            { name: 'Security Audit', completion_date: '2024-01-28', status: 'completed' }
          ]},
          system_health: { uptime: 99.8, performance_score: 92, open_tickets: 12 },
          team_utilization: { current_capacity: 85, upcoming_availability: '15% increase expected next month' }
        };
      default:
        return {};
    }
  }

  /**
   * Analyze query to determine intent and routing
   */
  private async analyzeQueryRouting(query: string, analysis: any): Promise<{
    agent: string;
    department?: string;
    confidence: number;
    reasoning: string;
  }> {
    const keywords = {
      sales: ['sales', 'revenue', 'deals', 'pipeline', 'customers', 'prospects', 'quota'],
      marketing: ['marketing', 'campaigns', 'leads', 'website', 'traffic', 'conversion', 'brand'],
      finance: ['finance', 'budget', 'costs', 'profit', 'cash', 'expenses', 'financial'],
      operations: ['operations', 'projects', 'tickets', 'capacity', 'team', 'process', 'efficiency']
    };

    const queryLower = query.toLowerCase();
    let maxScore = 0;
    let bestDepartment = '';

    // Score each department based on keyword matches
    for (const [dept, words] of Object.entries(keywords)) {
      const score = words.filter(word => queryLower.includes(word)).length;
      if (score > maxScore) {
        maxScore = score;
        bestDepartment = dept;
      }
    }

    // Strategic/high-level queries should go to Executive Assistant
    const strategicKeywords = ['strategy', 'planning', 'vision', 'roadmap', 'priorities', 'goals'];
    const isStrategic = strategicKeywords.some(word => queryLower.includes(word));

    if (isStrategic || maxScore === 0) {
      return {
        agent: 'executive',
        confidence: isStrategic ? 0.9 : 0.6,
        reasoning: isStrategic 
          ? 'Query involves strategic planning - routing to Executive Assistant'
          : 'General query without specific department focus - routing to Executive Assistant'
      };
    }

    return {
      agent: 'departmental',
      department: bestDepartment,
      confidence: Math.min(0.9, maxScore * 0.3),
      reasoning: `Query contains ${maxScore} ${bestDepartment} keywords - routing to ${bestDepartment} specialist`
    };
  }

  /**
   * Utility methods for data processing
   */
  private buildUserIntelligence(): string {
    if (!this.userContext) return '';

    return `- Active session: ${Math.round(this.userContext.activity.session_duration / 60)} minutes
- Recent focus: ${this.userContext.activity.recent_pages.slice(0, 3).join(', ')}
- User expertise: ${this.userContext.profile.role} with ${this.userContext.profile.permissions.length} platform permissions
- Department context: ${this.userContext.profile.department}`;
  }

  private async getBusinessIntelligence(): Promise<string> {
    const metrics = this.userContext?.business_context.key_metrics || {};
    return `- Company: ${this.userContext?.business_context.company_name} (${this.userContext?.business_context.growth_stage})
- Industry: ${this.userContext?.business_context.industry}
- Revenue: $${(metrics.annual_revenue || 0).toLocaleString()} annually
- Growth Rate: ${metrics.growth_rate || 0}%
- Team Size: ${metrics.employees || 0} employees`;
  }

  private analyzeQuery(query: string): string {
    const urgentKeywords = ['urgent', 'asap', 'emergency', 'critical', 'immediately'];
    const dataKeywords = ['show', 'report', 'analysis', 'metrics', 'performance'];
    
    const isUrgent = urgentKeywords.some(word => query.toLowerCase().includes(word));
    const isDataRequest = dataKeywords.some(word => query.toLowerCase().includes(word));

    return `- Query type: ${isDataRequest ? 'Data/Reporting' : 'Advisory'} ${isUrgent ? '(URGENT)' : ''}
- Intent: ${isDataRequest ? 'User wants specific data or analysis' : 'User seeks expert guidance'}
- Complexity: ${query.length > 100 ? 'Complex' : 'Standard'}`;
  }

  // Helper methods for data calculations
  private calculateFrequentActions(activity: any[]): string[] {
    return ['chat', 'dashboard', 'reports'];
  }

  private calculateSessionDuration(activity: any[]): number {
    return 1800; // 30 minutes in seconds
  }

  private getDefaultUserContext(userId: string): UserContext {
    return {
      profile: {
        id: userId,
        email: 'user@company.com',
        name: 'User',
        role: 'Team Member',
        department: 'General',
        company_id: 'default',
        permissions: [],
        preferences: {}
      },
      activity: {
        recent_pages: ['dashboard', 'chat', 'reports'],
        frequent_actions: ['view_dashboard', 'send_message', 'generate_report'],
        last_active: new Date().toISOString(),
        session_duration: 1800,
        total_sessions: 25
      },
      business_context: {
        company_name: 'Your Company',
        industry: 'Technology',
        company_size: 'Medium',
        growth_stage: 'growth',
        fiscal_year_end: '12-31',
        key_metrics: {
          employees: 50,
          annual_revenue: 5000000,
          growth_rate: 25,
          customer_count: 150
        }
      }
    };
  }

  private formatDepartmentData(department: string, data: any): string {
    return JSON.stringify(data, null, 2);
  }

  private extractRelevantData(data: any, query: string): string {
    // Simple keyword matching for relevance
    const queryLower = query.toLowerCase();
    
    if (queryLower.includes('performance') || queryLower.includes('metrics')) {
      return 'Current performance indicators and key metrics are highlighted above.';
    }
    
    if (queryLower.includes('forecast') || queryLower.includes('prediction')) {
      return 'Forecast data and projections are included in the performance summary.';
    }
    
    return 'All relevant data points for your query are included in the performance summary above.';
  }

  private preloadDepartmentData(): Promise<void> {
    // Pre-load demo data
    this.departmentData = {
      sales: this.getDemoData('sales'),
      marketing: this.getDemoData('marketing'),
      finance: this.getDemoData('finance'),
      operations: this.getDemoData('operations')
    };
    return Promise.resolve();
  }
} 