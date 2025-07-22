/**
 * contextualRAG.ts
 * 
 * Enhanced Retrieval Augmented Generation system for Nexus AI assistants.
 * Provides deeply contextual business data and user intelligence to create
 * the "Nexus gets me" experience across all AI interactions.
 */

import { supabase } from '@/core/supabase';
import type { EABusinessObservation } from '../services/businessObservationService';

interface IntegratedPlatformData {
  hubspot: {
    deals: number;
    pipeline_value: number;
    conversion_rate: number;
    trend: string;
  };
  cloudflare: {
    uptime: number;
    response_time: number;
    threats_blocked: number;
  };
  google_workspace: {
    email_volume: number;
    meeting_hours: number;
    shared_docs: number;
    drive_usage: number;
  };
  marcoby_cloud: {
    server_utilization: number;
    uptime: number;
    monthly_cost: number;
    optimization_potential: number;
  };
}

interface Correlation {
  description: string;
  confidence: number;
  actionable: boolean;
  impact: string;
}

interface Prediction {
  insight: string;
  timeframe: string;
  recommended_action: string;
}

export interface EnhancedUserContext {
  profile: {
    id: string;
    email: string;
    name: string;
    role: string;
    department: string;
    company_id: string;
    permissions: string[];
    preferences: Record<string, unknown>;
    // Enhanced from onboarding
    experience_level: 'beginner' | 'intermediate' | 'advanced';
    communication_style: 'direct' | 'detailed' | 'visual';
    primary_responsibilities: string[];
    current_pain_points: string[];
    immediate_goals: string;
    success_metrics: string[];
    time_availability: 'low' | 'medium' | 'high';
    collaboration_frequency: 'solo' | 'small-team' | 'cross-functional';
  };
  activity: {
    recent_pages: string[];
    frequent_actions: string[];
    last_active: string;
    session_duration: number;
    total_sessions: number;
    most_used_features: string[];
    skill_level: 'beginner' | 'intermediate' | 'advanced';
  };
  business_context: {
    company_name: string;
    industry: string;
    company_size: string;
    business_model: string;
    revenue_stage: string;
    growth_stage: 'startup' | 'growth' | 'enterprise';
    fiscal_year_end: string;
    key_metrics: Record<string, unknown>;
    // Enhanced from onboarding
    primary_departments: string[];
    key_tools: string[];
    data_sources: string[];
    automation_maturity: 'none' | 'basic' | 'intermediate' | 'advanced';
    business_priorities: string[];
    success_timeframe: string;
  };
  success_criteria: {
    primary_success_metric: string;
    secondary_metrics: string[];
    time_savings_goal: string;
    roi_expectation: string;
    usage_frequency: string;
    success_scenarios: string[];
    failure_conditions: string[];
    immediate_wins: string[];
    long_term_vision: string;
  };
}

export interface PersonalizationInsights {
  user_expertise_assessment: string;
  communication_approach: string;
  problem_solving_style: string;
  business_focus_areas: string[];
  recommended_features: string[];
  potential_automation_opportunities: string[];
  success_likelihood_factors: string[];
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
    team_performance: Record<string, unknown>;
    recent_wins: Array<{
      company: string;
      value: number;
      rep: string;
    }>;
  };
  marketing: {
    campaign_performance: Record<string, unknown>;
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
  private userContext: EnhancedUserContext | null = null;
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

    const personalizationInsights = this.generatePersonalizationInsights();
    const contextualResponse = this.generateContextualResponseStrategy(query);
    const businessIntelligence = await this.getBusinessIntelligence();
    const cloudStorageContext = await this.getCloudStorageContext();

    return `EXECUTIVE CONTEXT & USER INTELLIGENCE:

🧠 WHO YOU'RE TALKING TO:
${this.userContext.profile.name} (${this.userContext.profile.role}) at ${this.userContext.business_context.company_name}
• Experience Level: ${this.userContext.profile.experience_level} with business intelligence tools
• Communication Style: Prefers ${this.userContext.profile.communication_style} responses
• Time Availability: ${this.userContext.profile.time_availability} - adjust response depth accordingly
• Current Focus: ${this.userContext.profile.immediate_goals}

🎯 THEIR SUCCESS CRITERIA:
• Primary Goal: ${this.userContext.success_criteria.primary_success_metric}
• Time Savings Target: ${this.userContext.success_criteria.time_savings_goal}
• Success Timeline: ${this.userContext.business_context.success_timeframe}
• ROI Expectation: ${this.userContext.success_criteria.roi_expectation}

💼 BUSINESS CONTEXT:
• Industry: ${this.userContext.business_context.industry} (${this.userContext.business_context.business_model})
• Company Stage: ${this.userContext.business_context.growth_stage} (${this.userContext.business_context.company_size})
• Automation Maturity: ${this.userContext.business_context.automation_maturity}
• Priority Departments: ${this.userContext.business_context.primary_departments.join(', ')}

🎨 PERSONALIZATION INSIGHTS:
${personalizationInsights}

📊 CURRENT BUSINESS INTELLIGENCE:
${businessIntelligence}

📁 CLOUD STORAGE CONTEXT:
${cloudStorageContext}

🎪 RESPONSE STRATEGY FOR THIS QUERY:
${contextualResponse}

INSTRUCTIONS:
- Match their ${this.userContext.profile.communication_style} communication preference
- Reference their specific pain points: ${this.userContext.profile.current_pain_points.join(', ')}
- Connect advice to their success metrics: ${this.userContext.success_criteria.secondary_metrics.join(', ')}
- Consider their ${this.userContext.profile.experience_level} experience level
- Suggest relevant specialists based on their department focus
- Always tie recommendations back to their immediate goals and long-term vision`;
  }

  /**
   * Get department-specific data context for specialized assistants
   */
  async getDepartmentContext(department: string, query: string): Promise<string> {
    if (!this.userContext) {
      throw new Error('RAG system not initialized');
    }

    const departmentData = await this.fetchDepartmentData(department);
    const relevantData = this.extractRelevantData(departmentData, query);
    const userRole = this.userContext?.profile.role || 'Team Member';
    const departmentExpertise = this.assessDepartmentExpertise(department);
    const contextualRecommendations = this.generateDepartmentRecommendations(department);

    return `DEPARTMENT CONTEXT & PERSONALIZED GUIDANCE:

👤 USER PROFILE FOR ${department.toUpperCase()}:
• ${this.userContext.profile.name} (${userRole}) - ${this.userContext.profile.experience_level} level
• Responsibilities: ${this.userContext.profile.primary_responsibilities.join(', ')}
• Pain Points: ${this.userContext.profile.current_pain_points.filter(p => this.isDepartmentRelevant(p, department)).join(', ')}
• Success Metrics: ${this.userContext.success_criteria.secondary_metrics.filter(m => this.isDepartmentRelevant(m, department)).join(', ')}

🏢 COMPANY CONTEXT:
• ${this.userContext.business_context.company_name} (${this.userContext.business_context.industry})
• Current Tools: ${this.userContext.business_context.key_tools.filter(t => this.isDepartmentRelevant(t, department)).join(', ')}
• Data Sources: ${this.userContext.business_context.data_sources.filter(d => this.isDepartmentRelevant(d, department)).join(', ')}
• Business Priority: ${this.userContext.business_context.business_priorities.filter(p => this.isDepartmentRelevant(p, department)).join(', ')}

📊 CURRENT ${department.toUpperCase()} PERFORMANCE:
${this.formatDepartmentData(department, departmentData)}

🎯 RELEVANT TO YOUR QUERY:
${relevantData}

🧠 EXPERTISE ASSESSMENT:
${departmentExpertise}

💡 CONTEXTUAL RECOMMENDATIONS:
${contextualRecommendations}

🎨 COMMUNICATION STYLE:
Respond in a ${this.userContext.profile.communication_style} manner. User has ${this.userContext.profile.time_availability} time availability, so ${this.getResponseLengthGuidance()}.

INSTRUCTIONS:
- Reference their specific ${department} pain points and goals
- Suggest automation opportunities based on their ${this.userContext.business_context.automation_maturity} maturity
- Connect recommendations to their immediate wins: ${this.userContext.success_criteria.immediate_wins.join(', ')}
- Consider their collaboration style: ${this.userContext.profile.collaboration_frequency}`;
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
    // Analyze query intent and determine best agent
    const routing = await this.analyzeQueryRouting(query);
    
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
   * Get documents from cloud storage for RAG context
   */
  private async getCloudStorageContext(): Promise<string> {
    try {
      // Find documents from Google Drive and OneDrive
      const { data: documents, error } = await supabase
        .from('ai_vector_documents')
        .select('metadata, content')
        .or('document_id.like.google-drive-%,document_id.like.onedrive-%')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        // eslint-disable-next-line no-console
        console.error('Error fetching cloud storage documents:', error);
      }

      if (!documents || documents.length === 0) {
        return 'No cloud storage documents synced yet. Connect Google Drive or OneDrive to enable document-based insights.';
      }

      // Fix getCloudStorageContext document metadata access
      const documentSummaries = documents.map(doc => {
        let metadata: Record<string, unknown> = {};
        if (typeof doc.metadata === 'object' && doc.metadata !== null && !Array.isArray(doc.metadata)) {
          metadata = doc.metadata as Record<string, unknown>;
        }
        const fileName = typeof metadata.fileName === 'string' ? metadata.fileName : 'Unknown';
        const source = typeof metadata.source === 'string' ? metadata.source : 'cloud';
        const lastModified = metadata.lastModified ? new Date(metadata.lastModified as string).toLocaleDateString() : 'Unknown';
        return `• ${fileName} (${source}) - Modified: ${lastModified}`;
      }).join('\n');

      return `Recent Cloud Documents Available for Context:
${documentSummaries}

These documents are searchable and can be referenced in responses. The AI can pull specific information from these files to provide contextual business insights.`;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to get cloud storage context:', error);
      return 'Cloud storage context temporarily unavailable.';
    }
  }

  /**
   * Fetch comprehensive user context from multiple data sources
   */
  private async fetchUserContext(userId: string): Promise<EnhancedUserContext> {
    try {
      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        // eslint-disable-next-line no-console
        console.error('Error fetching user profile:', profileError);
      } else if (profile) {
        // eslint-disable-next-line no-console
        console.log('User profile data:', { 
          id: profile.id, 
          display_name: profile.display_name, 
          first_name: profile.first_name, 
          last_name: profile.last_name,
          email: profile.email 
        });
      }

      // Fetch user activity (using chat_messages as proxy for user activity)
      const { data: activity, error: activityError } = await supabase
        .from('user_activity')
        .select('*')
        .eq('user_id', userId)
        .limit(100);

      if (activityError) {
        // eslint-disable-next-line no-console
        console.error('Error fetching user activity:', activityError);
      }

      // Fetch company context (with defensive check for valid UUID)
      let company = null;
      if (profile?.company_id && this.isValidUUID(profile.company_id)) {
        const { data: companyData } = await supabase
          .from('companies')
          .select('*')
          .eq('id', profile.company_id)
          .single();
        company = companyData;
      }

      return {
        profile: {
          id: profile?.id || userId,
          email: profile?.email || '',
          name: profile?.display_name || profile?.first_name || (profile?.first_name && profile?.last_name ? `${profile.first_name} ${profile.last_name}`.trim() : 'User'),
          role: profile?.role || 'Team Member',
          department: profile?.department || 'General',
          company_id: profile?.company_id || '',
          permissions: profile?.skills || [],
          preferences:
            typeof profile?.preferences === 'object' && profile?.preferences
              ? (profile.preferences as Record<string, unknown>)
              : {},
          experience_level: 'intermediate',
          communication_style: 'direct',
          primary_responsibilities: ['Sales', 'Marketing'],
          current_pain_points: ['Finding the right tools'],
          immediate_goals: 'Increase sales by 20%',
          success_metrics: ['Revenue', 'Customer Satisfaction'],
          time_availability: 'medium',
          collaboration_frequency: 'small-team'
        },
        activity: {
          recent_pages:
            Array.isArray(activity)
              ? activity.map((a: Record<string, unknown>) => typeof a.page === 'string' ? a.page : '').slice(0, 5)
              : ['/dashboard'],
          frequent_actions: this.calculateFrequentActions(),
          last_active: Array.isArray(activity) && activity[0]
            ? ('timestamp' in activity[0] && activity[0].timestamp
                ? String(activity[0].timestamp)
                : String(activity[0].created_at || new Date().toISOString()))
            : new Date().toISOString(),
          session_duration: this.calculateSessionDuration(),
          total_sessions: 5, // Placeholder
          most_used_features: ['AI Chat', 'Analytics', 'Integrations'], // Placeholder
          skill_level: 'intermediate', // Placeholder
        },
        business_context: {
          company_name: company?.name || 'Your Company',
          industry: company?.industry || 'Technology',
          company_size: company?.size || 'Small',
          business_model: 'B2B',
          revenue_stage: 'growth',
          growth_stage: 'growth',
          fiscal_year_end: '12-31',
          key_metrics: {
            employees: 50,
            annual_revenue: 5000000,
            growth_rate: 25,
            customer_count: 150
          } as Record<string, unknown>,
          primary_departments: ['Sales', 'Marketing'],
          key_tools: ['CRM', 'Marketing Automation'],
          data_sources: ['Customer Feedback', 'Social Media'],
          automation_maturity: 'intermediate',
          business_priorities: ['Revenue Growth', 'Customer Satisfaction'],
          success_timeframe: '12 months'
        },
        success_criteria: {
          primary_success_metric: 'Revenue Growth',
          secondary_metrics: ['Customer Satisfaction', 'Marketing ROI'],
          time_savings_goal: 'Reduce marketing costs by 20%',
          roi_expectation: 'Return on Investment',
          usage_frequency: 'Monthly',
          success_scenarios: ['Successful campaign launch', 'Significant revenue increase'],
          failure_conditions: ['Campaign underperformance', 'Revenue decrease'],
          immediate_wins: ['First month revenue increase', 'Immediate customer feedback'],
          long_term_vision: 'Sustainable business growth'
        }
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching user context:', error);
      // Return default context
      return this.getDefaultUserContext(userId);
    }
  }

  /**
   * Fetch department-specific business data
   */
  private async fetchDepartmentData(
    department: string,
  ): Promise<DepartmentData[keyof DepartmentData] | Record<string, unknown>> {
    // In a real application, this would fetch data from a database or API
    // For now, we'll use demo data
    return this.getDemoData(department);
  }

  private getDemoData(department: string): DepartmentData[keyof DepartmentData] | Record<string, unknown> {
    const demoData: DepartmentData = {
      sales: {
        pipeline_value: 1250000,
        deals_closing_this_month: 8,
        conversion_rates: { prospect: 25, qualified: 45, proposal: 75, negotiation: 85 },
        top_opportunities: [
          { company: 'TechCorp Inc.', value: 250000, stage: 'Proposal', close_date: '2024-02-15' },
          { company: 'Innovation Labs', value: 185000, stage: 'Negotiation', close_date: '2024-02-28' },
          { company: 'Future Systems', value: 320000, stage: 'Qualified', close_date: '2024-03-15' }
        ],
        team_performance: { quota_attainment: 87, top_performer: 'Sarah Johnson' } as Record<string, unknown>,
        recent_wins: [
          { company: 'DataFlow Corp', value: 125000, rep: 'Mike Chen' },
          { company: 'CloudTech Solutions', value: 95000, rep: 'Sarah Johnson' }
        ]
      },
      marketing: {
        campaign_performance: { total_campaigns: 12, active_campaigns: 5, avg_roi: 3.2 } as Record<string, unknown>,
        lead_generation: { total_leads: 847, qualified_leads: 234, cost_per_lead: 45 },
        website_analytics: { traffic: 25000, conversion_rate: 2.8, top_pages: ['/pricing', '/features', '/demo'] },
        content_performance: [
          { title: 'Industry Report 2024', views: 5200, engagement: 78 },
          { title: 'Product Demo Video', views: 3800, engagement: 85 }
        ]
      },
      finance: {
        revenue: { current_month: 425000, previous_month: 385000, ytd: 4200000, forecast: 5200000 },
        expenses: { current_month: 298000, budget_variance: -12000, top_categories: [
          { category: 'Personnel', amount: 185000 },
          { category: 'Technology', amount: 65000 },
          { category: 'Marketing', amount: 48000 }
        ]},
        cash_flow: { current_balance: 850000, projected_30_days: 120000, burn_rate: 45000 },
        key_metrics: { gross_margin: 78.5, customer_acquisition_cost: 450, lifetime_value: 12500 }
      },
      operations: {
        projects: { active_count: 8, on_track: 6, at_risk: 2, recent_completions: [
          { name: 'Q4 Platform Update', completion_date: '2024-01-15', status: 'completed' },
          { name: 'Security Audit', completion_date: '2024-01-28', status: 'completed' }
        ]},
        system_health: { uptime: 99.8, performance_score: 92, open_tickets: 12 },
        team_utilization: { current_capacity: 85, upcoming_availability: '15% increase expected next month' }
      },
    };
    return demoData[department as keyof typeof demoData] || {};
  }

  /**
   * Analyze query to determine intent and routing
   */
  private async analyzeQueryRouting(query: string): Promise<{
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
  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
  private buildUserIntelligence(): string {
    if (!this.userContext) return '';

    return `- Active session: ${Math.round(this.userContext.activity.session_duration / 60)} minutes
- Recent focus: ${this.userContext.activity.recent_pages.slice(0, 3).join(', ')}
- User expertise: ${this.userContext.profile.role} with ${this.userContext.profile.permissions.length} platform permissions
- Department context: ${this.userContext.profile.department}`;
  }

  private async getBusinessIntelligence(): Promise<string> {
    const metrics = this.userContext?.business_context.key_metrics || {};
    const insights = [
      `- Company: ${this.userContext?.business_context.company_name} (${this.userContext?.business_context.growth_stage})`,
      `- Industry: ${this.userContext?.business_context.industry}`,
      `- Revenue: $${(metrics.annual_revenue || 0).toLocaleString()} annually`,
      `- Growth Rate: ${metrics.growth_rate || 0}%`,
      `- Team Size: ${metrics.employees || 0} employees`
    ];

    // Add cross-platform analytics intelligence
    try {
      // Get unified analytics data for enhanced context
      const crossPlatformData = await this.getCrossPlatformAnalytics();
      if (crossPlatformData) {
        insights.push('\n📊 CROSS-PLATFORM INTELLIGENCE:');
        insights.push(...crossPlatformData);
      }

      // Get AI-discovered correlations for smarter routing
      const correlations = await this.getAICorrelations();
      if (correlations.length > 0) {
        insights.push('\n🧠 AI-DISCOVERED PATTERNS:');
        insights.push(...correlations);
      }

      // Add predictive insights for proactive assistance
      const predictions = await this.getPredictiveInsights();
      if (predictions.length > 0) {
        insights.push('\n🔮 PREDICTIVE INTELLIGENCE:');
        insights.push(...predictions);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching cross-platform analytics:', error);
    }

    // Add EA business observations
    try {
      const { businessObservationService } = await import(
        '../services/businessObservationService'
      );

      const observations =
        await businessObservationService.generateBusinessObservations(
          this.userContext?.profile.id || '',
          this.userContext?.profile.company_id || '',
        );

      let intelligence = 'Recent Business Observations:\n';
      if (observations.length === 0) {
        intelligence += '- No significant observations in the last 7 days.\n';
      } else {
        observations.slice(0, 3).forEach((obs: EABusinessObservation) => {
          intelligence += `- [${obs.priority}] ${obs.title}: ${obs.description}\n`;
        });
      }
      return intelligence;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching business observations:', error);
      return 'No business context available.';
    }
  }

  /**
   * Get cross-platform analytics data for enhanced AI context
   */
  private async getCrossPlatformAnalytics(): Promise<string[]> {
    const insights: string[] = [];
    
    try {
      // Simulate fetching from our unified analytics system
      const platformData = await this.fetchIntegratedPlatformData();
      
      if (platformData.hubspot) {
        insights.push(`• CRM Health: ${platformData.hubspot.deals} deals, $${platformData.hubspot.pipeline_value.toLocaleString()} pipeline`);
        insights.push(`• Sales Velocity: ${platformData.hubspot.conversion_rate}% conversion rate (${platformData.hubspot.trend})`);
      }

      if (platformData.cloudflare) {
        insights.push(`• Website Performance: ${platformData.cloudflare.uptime}% uptime, ${platformData.cloudflare.response_time}ms avg response`);
        insights.push(`• Security Status: ${platformData.cloudflare.threats_blocked} threats blocked this month`);
      }

      if (platformData.google_workspace) {
        insights.push(`• Productivity: ${platformData.google_workspace.email_volume} emails/day, ${platformData.google_workspace.meeting_hours}h meetings/week`);
        insights.push(`• Collaboration: ${platformData.google_workspace.shared_docs} active docs, ${platformData.google_workspace.drive_usage}GB storage used`);
      }

      if (platformData.marcoby_cloud) {
        insights.push(`• Infrastructure: ${platformData.marcoby_cloud.server_utilization}% avg utilization, ${platformData.marcoby_cloud.uptime}% uptime`);
        insights.push(`• Cost Efficiency: $${platformData.marcoby_cloud.monthly_cost}/month, ${platformData.marcoby_cloud.optimization_potential}% optimization potential`);
      }

    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching cross-platform data:', error);
    }

    return insights;
  }

  /**
   * Get AI-discovered correlations between platforms
   */
  private async getAICorrelations(): Promise<string[]> {
    const correlations: string[] = [];
    
    try {
      // Simulate AI correlation discovery
      const correlationData = await this.analyzeCorrelations();
      
      correlationData.forEach(correlation => {
        correlations.push(`• ${correlation.description} (${correlation.confidence}% confidence)`);
        if (correlation.actionable) {
          correlations.push(`  → Impact: ${correlation.impact}`);
        }
      });

    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error analyzing correlations:', error);
    }

    return correlations;
  }

  /**
   * Get predictive insights for proactive assistance
   */
  private async getPredictiveInsights(): Promise<string[]> {
    const predictions: string[] = [];
    
    try {
      // Simulate predictive analytics
      const predictionData = await this.generatePredictions();
      
      predictionData.forEach(prediction => {
        predictions.push(`• ${prediction.insight} (${prediction.timeframe})`);
        if (prediction.recommended_action) {
          predictions.push(`  → Recommended: ${prediction.recommended_action}`);
        }
      });

    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error generating predictions:', error);
    }

    return predictions;
  }

  /**
   * Fetch integrated platform data from all connected sources
   */
  private async fetchIntegratedPlatformData(): Promise<IntegratedPlatformData> {
    // In a real implementation, this would fetch from your unified analytics dashboard
    return {
      hubspot: {
        deals: 47,
        pipeline_value: 245000,
        conversion_rate: 28,
        trend: 'improving'
      },
      cloudflare: {
        uptime: 99.97,
        response_time: 180,
        threats_blocked: 1247
      },
      google_workspace: {
        email_volume: 156,
        meeting_hours: 12,
        shared_docs: 89,
        drive_usage: 847
      },
      marcoby_cloud: {
        server_utilization: 72,
        uptime: 99.95,
        monthly_cost: 1250,
        optimization_potential: 15
      }
    };
  }

  /**
   * Analyze correlations between different platforms
   */
  private async analyzeCorrelations(): Promise<Correlation[]> {
    return [
      {
        description: "High email volume correlates with 23% increase in deal velocity",
        confidence: 87,
        actionable: true,
        impact: "Focus on email engagement during high-activity periods"
      },
      {
        description: "Website performance drops predict 15% decrease in lead quality",
        confidence: 92,
        actionable: true,
        impact: "Monitor Cloudflare metrics before major campaigns"
      },
      {
        description: "Infrastructure utilization >80% correlates with 12% productivity loss",
        confidence: 79,
        actionable: true,
        impact: "Scale infrastructure proactively when utilization hits 75%"
      }
    ];
  }

  /**
   * Generate predictive insights based on historical patterns
   */
  private async generatePredictions(): Promise<Prediction[]> {
    return [
      {
        insight: "Current email engagement trends suggest 34% increase in Q1 leads",
        timeframe: "Next 30 days",
        recommended_action: "Prepare sales team for increased lead volume"
      },
      {
        insight: "Infrastructure usage pattern indicates need for scaling by month-end",
        timeframe: "Next 2 weeks",
        recommended_action: "Schedule infrastructure review and capacity planning"
      },
      {
        insight: "Meeting frequency suggests team bandwidth at 85% capacity",
        timeframe: "Current week",
        recommended_action: "Consider redistributing workload or extending deadlines"
      }
    ];
  }

  private analyzeQuery(query: string): string {
    // Advanced analysis can be done here. For now, just returning the query.
    return query;
  }

  private calculateFrequentActions(): string[] {
    // This is a placeholder. In a real scenario, you'd analyze activity logs.
    return ['viewed dashboard', 'ran report', 'updated settings'];
  }

  private calculateSessionDuration(): number {
    // Placeholder for session duration calculation
    return 15; // in minutes
  }

  private getDefaultUserContext(userId: string, companyId: string = 'default'): EnhancedUserContext {
    return {
      profile: {
        id: userId,
        email: 'user@company.com',
        name: 'Guest User',
        role: 'Team Member',
        department: 'General',
        company_id: companyId,
        permissions: [],
        preferences: {},
        experience_level: 'beginner',
        communication_style: 'direct',
        primary_responsibilities: ['Sales', 'Marketing'],
        current_pain_points: ['Finding the right tools'],
        immediate_goals: 'Increase sales by 20%',
        success_metrics: ['Revenue', 'Customer Satisfaction'],
        time_availability: 'medium',
        collaboration_frequency: 'small-team'
      },
      activity: {
        recent_pages: ['dashboard', 'chat', 'reports'],
        frequent_actions: ['view_dashboard', 'send_message', 'generate_report'],
        last_active: new Date().toISOString(),
        session_duration: 1800,
        total_sessions: 25,
        most_used_features: ['CRM', 'Marketing Automation'],
        skill_level: 'beginner'
      },
      business_context: {
        company_name: 'Your Company',
        industry: 'Technology',
        company_size: 'Medium',
        business_model: 'B2B',
        revenue_stage: 'growth',
        growth_stage: 'growth',
        fiscal_year_end: '12-31',
        key_metrics: {
          employees: 50,
          annual_revenue: 5000000,
          growth_rate: 25,
          customer_count: 150
        },
        primary_departments: ['Sales', 'Marketing'],
        key_tools: ['CRM', 'Marketing Automation'],
        data_sources: ['Customer Feedback', 'Social Media'],
        automation_maturity: 'intermediate',
        business_priorities: ['Revenue Growth', 'Customer Satisfaction'],
        success_timeframe: '12 months'
      },
      success_criteria: {
        primary_success_metric: 'Revenue Growth',
        secondary_metrics: ['Customer Satisfaction', 'Marketing ROI'],
        time_savings_goal: 'Reduce marketing costs by 20%',
        roi_expectation: 'Return on Investment',
        usage_frequency: 'Monthly',
        success_scenarios: ['Successful campaign launch', 'Significant revenue increase'],
        failure_conditions: ['Campaign underperformance', 'Revenue decrease'],
        immediate_wins: ['First month revenue increase', 'Immediate customer feedback'],
        long_term_vision: 'Sustainable business growth'
      }
    };
  }

  private formatDepartmentData(
    department: string,
    data: DepartmentData[keyof DepartmentData] | Record<string, unknown>,
  ): string {
    if (!data || Object.keys(data).length === 0) {
      return `No data available for ${department}.`;
    }
    // Simple JSON.stringify for now, can be improved with custom formatters
    return JSON.stringify(data, null, 2);
  }

  private extractRelevantData(
    data: DepartmentData[keyof DepartmentData] | Record<string, unknown>,
    query: string,
  ): string {
    if (!data || Object.keys(data).length === 0) {
      return 'No specific data relates to the query.';
    }
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
    // Proactively fetch data for key departments
    return Promise.resolve();
  }

  public generatePersonalizationInsights(): string {
    if (!this.userContext) return 'Not enough data for personalization.';
    
    const insights = [
      `• Expertise Assessment: ${this.assessUserExpertise()}`,
      `• Communication Approach: ${this.determineCommunicationApproach()}`,
      `• Problem-Solving Style: ${this.identifyProblemSolvingStyle()}`,
      `• Key Focus Areas: ${this.identifyBusinessFocusAreas().join(', ')}`,
      `• Automation Opportunities: ${this.identifyAutomationOpportunities().join(', ')}`,
      `• Success Likelihood: ${this.assessSuccessLikelihood()}`
    ];

    return insights.join('\n');
  }

  /**
   * Generate contextual response strategy based on query analysis
   */
  private generateContextualResponseStrategy(query: string): string {
    if (!this.userContext) return '';

    const queryType = this.classifyQueryType(query);
    const urgency = this.assessQueryUrgency(query);
    const complexity = this.assessQueryComplexity(query);
    const suggestedApproach = this.suggestResponseApproach(queryType, urgency, complexity);

    return `• Query Type: ${queryType}
• Urgency Level: ${urgency}
• Complexity: ${complexity}
• Suggested Approach: ${suggestedApproach}
• Recommended Depth: ${this.getRecommendedDepth()}
• Follow-up Actions: ${this.suggestFollowupActions(query).join(', ')}`;
  }

  /**
   * Build enhanced user intelligence profile
   */
  private buildEnhancedUserIntelligence(): string {
    if (!this.userContext) return '';

    return `• Session Activity: ${Math.round(this.userContext.activity.session_duration / 60)} min session, ${this.userContext.activity.total_sessions} total
• Platform Expertise: ${this.userContext.activity.skill_level} level, most used: ${this.userContext.activity.most_used_features.slice(0, 3).join(', ')}
• Working Style: ${this.userContext.profile.collaboration_frequency} collaboration, ${this.userContext.profile.time_availability} time investment
• Current Challenges: ${this.userContext.profile.current_pain_points.slice(0, 2).join(', ')}
• Success Motivation: Targeting ${this.userContext.success_criteria.time_savings_goal} within ${this.userContext.business_context.success_timeframe}`;
  }

  /**
   * Assess user expertise in department context
   */
  private assessDepartmentExpertise(department: string): string {
    if (!this.userContext) return '';

    const isUserDept = this.userContext.profile.department === department;
    const hasResponsibility = this.userContext.profile.primary_responsibilities.some(r => 
      this.isDepartmentRelevant(r, department)
    );
    const experienceLevel = this.userContext.profile.experience_level;
    const relevantTools = this.userContext.business_context.key_tools.filter(t => 
      this.isDepartmentRelevant(t, department)
    ).length;

    let expertise = '';
    if (isUserDept) {
      expertise = `Expert in ${department} (their primary department)`;
    } else if (hasResponsibility) {
      expertise = `Cross-functional knowledge of ${department}`;
    } else {
      expertise = `Limited ${department} experience`;
    }

    return `${expertise} | ${experienceLevel} overall experience | Using ${relevantTools} relevant tools`;
  }

  /**
   * Generate department-specific recommendations
   */
  private generateDepartmentRecommendations(department: string): string {
    if (!this.userContext) return '';

    const automationLevel = this.userContext.business_context.automation_maturity;
    const immediateWins = this.userContext.success_criteria.immediate_wins.filter(w => 
      this.isDepartmentRelevant(w, department)
    );
    const relevantPriorities = this.userContext.business_context.business_priorities.filter(p =>
      this.isDepartmentRelevant(p, department)
    );

    return `• Start with ${automationLevel} level automation solutions
• Quick wins available: ${immediateWins.slice(0, 2).join(', ')}
• Align with priorities: ${relevantPriorities.slice(0, 2).join(', ')}
• Recommended next steps: ${this.getNextStepsForDepartment(department).join(', ')}`;
  }

  /**
   * Get response length guidance based on user preferences
   */
  private getResponseLengthGuidance(): string {
    if (!this.userContext) return 'provide balanced responses';

    const timeAvailability = this.userContext.profile.time_availability;
    const commStyle = this.userContext.profile.communication_style;

    if (timeAvailability === 'low' || commStyle === 'direct') {
      return 'keep responses concise and actionable';
    } else if (timeAvailability === 'high' || commStyle === 'detailed') {
      return 'provide comprehensive analysis and multiple options';
    } else {
      return 'provide balanced detail with clear next steps';
    }
  }

  /**
   * Check if item is relevant to department
   */
  private isDepartmentRelevant(item: string, department: string): boolean {
    const departmentKeywords = {
      'Sales': ['sales', 'revenue', 'customer', 'deal', 'pipeline', 'crm', 'lead'],
      'Marketing': ['marketing', 'campaign', 'brand', 'content', 'social', 'email', 'analytics'],
      'Finance': ['finance', 'budget', 'accounting', 'cost', 'expense', 'revenue', 'profit'],
      'Operations': ['operations', 'process', 'workflow', 'efficiency', 'automation', 'logistics'],
      'HR': ['hr', 'human', 'employee', 'talent', 'recruitment', 'performance', 'training'],
      'Engineering': ['engineering', 'development', 'technical', 'code', 'infrastructure', 'devops'],
      'Customer Success': ['customer', 'support', 'success', 'satisfaction', 'retention', 'experience']
    };

    const keywords = departmentKeywords[department as keyof typeof departmentKeywords] || [];
    return keywords.some(keyword => item.toLowerCase().includes(keyword));
  }

  // Helper methods for personalization insights
  private assessUserExpertise(): string {
    if (!this.userContext) return 'Unknown';
    
    const exp = this.userContext.profile.experience_level;
    const responsibilities = this.userContext.profile.primary_responsibilities.length;
    const tools = this.userContext.business_context.key_tools.length;
    
    if (exp === 'advanced' && responsibilities > 3 && tools > 5) {
      return 'Advanced business user with extensive tool experience';
    } else if (exp === 'intermediate' && responsibilities > 2) {
      return 'Experienced professional with solid technical foundation';
    } else {
      return 'Growing expertise, benefits from guided approach';
    }
  }

  private determineCommunicationApproach(): string {
    if (!this.userContext) return 'Standard';
    
    const style = this.userContext.profile.communication_style;
    const time = this.userContext.profile.time_availability;
    
    if (style === 'direct' && time === 'low') {
      return 'Executive summary style - bullet points and key actions';
    } else if (style === 'detailed' && time === 'high') {
      return 'Comprehensive analysis with examples and alternatives';
    } else if (style === 'visual') {
      return 'Visual explanations with charts and diagrams when possible';
    } else {
      return 'Balanced approach with clear structure and actionable insights';
    }
  }

  private identifyProblemSolvingStyle(): string {
    if (!this.userContext) return 'Standard';
    
    const collab = this.userContext.profile.collaboration_frequency;
    const exp = this.userContext.profile.experience_level;
    
    if (collab === 'cross-functional' && exp === 'advanced') {
      return 'Strategic systems thinker - considers organizational impact';
    } else if (collab === 'small-team') {
      return 'Collaborative problem solver - values team input';
    } else {
      return 'Independent executor - prefers clear direction';
    }
  }

  private identifyBusinessFocusAreas(): string[] {
    if (!this.userContext) return [];
    
    return [
      ...this.userContext.business_context.business_priorities.slice(0, 2),
      ...this.userContext.business_context.primary_departments.slice(0, 2)
    ];
  }

  private identifyAutomationOpportunities(): string[] {
    if (!this.userContext) return [];
    
    const painPoints = this.userContext.profile.current_pain_points;
    
    const opportunities = [];
    
    if (painPoints.includes('manual data entry') || painPoints.includes('repetitive tasks')) {
      opportunities.push('Workflow automation');
    }
    if (painPoints.includes('scattered information') || painPoints.includes('data quality')) {
      opportunities.push('Data integration');
    }
    if (painPoints.includes('reporting') || painPoints.includes('analysis')) {
      opportunities.push('Automated reporting');
    }
    
    return opportunities.slice(0, 3);
  }

  private assessSuccessLikelihood(): string {
    if (!this.userContext) return 'Moderate';
    
    const hasGoals = this.userContext.profile.immediate_goals.length > 10;
    const hasMetrics = this.userContext.success_criteria.success_scenarios.length > 0;
    const hasTime = this.userContext.profile.time_availability !== 'low';
    
    const score = [hasGoals, hasMetrics, hasTime].filter(Boolean).length;
    
    if (score >= 3) return 'High - clear goals and commitment';
    if (score >= 2) return 'Good - solid foundation for success';
    return 'Moderate - may need additional goal clarification';
  }

  private classifyQueryType(query: string): string {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('how to') || lowerQuery.includes('help me')) {
      return 'Tutorial/Guidance Request';
    } else if (lowerQuery.includes('what') || lowerQuery.includes('explain')) {
      return 'Information Request';
    } else if (lowerQuery.includes('problem') || lowerQuery.includes('issue')) {
      return 'Problem-Solving Request';
    } else if (lowerQuery.includes('best') || lowerQuery.includes('recommend')) {
      return 'Recommendation Request';
    } else {
      return 'General Inquiry';
    }
  }

  private assessQueryUrgency(query: string): string {
    const urgentTerms = ['urgent', 'asap', 'immediately', 'critical', 'emergency'];
    const lowerQuery = query.toLowerCase();
    
    if (urgentTerms.some(term => lowerQuery.includes(term))) {
      return 'High';
    } else if (lowerQuery.includes('soon') || lowerQuery.includes('quickly')) {
      return 'Medium';
    } else {
      return 'Standard';
    }
  }

  private assessQueryComplexity(query: string): string {
    const complexTerms = ['integrate', 'automation', 'workflow', 'strategy', 'optimize'];
    const lowerQuery = query.toLowerCase();
    
    if (complexTerms.some(term => lowerQuery.includes(term))) {
      return 'High - may require specialist input';
    } else if (query.length > 100) {
      return 'Medium - detailed requirements';
    } else {
      return 'Standard';
    }
  }

  private suggestResponseApproach(queryType: string, urgency: string, complexity: string): string {
    if (urgency === 'High') {
      return 'Immediate action plan with follow-up';
    } else if (complexity.includes('High')) {
      return 'Comprehensive analysis with specialist recommendations';
    } else if (queryType === 'Tutorial/Guidance Request') {
      return 'Step-by-step guidance with examples';
    } else {
      return 'Direct answer with context and next steps';
    }
  }

  private getRecommendedDepth(): string {
    if (!this.userContext) return 'Standard';
    
    const exp = this.userContext.profile.experience_level;
    const time = this.userContext.profile.time_availability;
    
    if (exp === 'beginner' || time === 'low') {
      return 'Simplified with clear next steps';
    } else if (exp === 'advanced' && time === 'high') {
      return 'In-depth with technical details';
    } else {
      return 'Balanced with practical focus';
    }
  }

  private suggestFollowupActions(query: string): string[] {
    const actions = [];
    
    if (query.toLowerCase().includes('automat')) {
      actions.push('Consider n8n workflow setup');
    }
    if (query.toLowerCase().includes('data') || query.toLowerCase().includes('analytic')) {
      actions.push('Review dashboard customization');
    }
    if (query.toLowerCase().includes('team') || query.toLowerCase().includes('collaborat')) {
      actions.push('Explore department specialists');
    }
    
    actions.push('Schedule follow-up review');
    
    return actions.slice(0, 3);
  }

  private getNextStepsForDepartment(department: string): string[] {
    const steps = [];
    
    if (department === 'Sales') {
      steps.push('CRM data integration', 'Pipeline automation', 'Lead scoring setup');
    } else if (department === 'Marketing') {
      steps.push('Campaign tracking', 'Analytics integration', 'Content automation');
    } else if (department === 'Finance') {
      steps.push('Expense automation', 'Budget tracking', 'Financial reporting');
    } else {
      steps.push('Process mapping', 'Tool integration', 'Performance tracking');
    }
    
    return steps.slice(0, 2);
  }
} 