import { businessProfileService } from '@/shared/lib/business/businessProfileService';

export interface BusinessAdvice {
  category: 'revenue' | 'operations' | 'growth' | 'risk' | 'strategy' | 'efficiency';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  reasoning: string;
  actionSteps: string[];
  expectedOutcome: string;
  timeframe: string;
  confidence: number;
}

export class BusinessAdvisor {
  private static instance: BusinessAdvisor;
  
  public static getInstance(): BusinessAdvisor {
    if (!BusinessAdvisor.instance) {
      BusinessAdvisor.instance = new BusinessAdvisor();
    }
    return BusinessAdvisor.instance;
  }

  async getBusinessAdvice(orgId: string, query?: string): Promise<BusinessAdvice[]> {
    const profile = await businessProfileService.getBusinessProfile(orgId);
    if (!profile) {
      return [{
        category: 'strategy',
        priority: 'high',
        title: 'Complete Business Profile Setup',
        description: 'Set up your business profile to receive personalized advice',
        reasoning: 'Nexus needs to understand your business to provide relevant insights',
        actionSteps: ['Complete the business profile setup wizard'],
        expectedOutcome: 'Receive personalized business advice and insights',
        timeframe: '30 minutes',
        confidence: 100
      }];
    }

    const advice: BusinessAdvice[] = [];

    // Revenue optimization advice
    if (profile.company_size === 'solopreneur' && profile.total_clients > 20) {
      advice.push({
        category: 'growth',
        priority: 'high',
        title: 'Consider Team Expansion',
        description: 'Your client base suggests you\'re ready to scale beyond solo operations',
        reasoning: `With ${profile.total_clients} clients as a solopreneur, you're likely hitting capacity limits`,
        actionSteps: [
          'Calculate current capacity utilization',
          'Identify which tasks could be delegated',
          'Create job descriptions for first hire',
          'Set up hiring process and onboarding'
        ],
        expectedOutcome: 'Increased capacity to serve more clients and grow revenue',
        timeframe: '3-6 months',
        confidence: 85
      });
    }

    // Revenue stream diversification
    if (profile.revenue_streams && profile.revenue_streams.length < 2) {
      advice.push({
        category: 'revenue',
        priority: 'medium',
        title: 'Diversify Revenue Streams',
        description: 'Reduce business risk by developing multiple revenue sources',
        reasoning: 'Single revenue streams create vulnerability to market changes',
        actionSteps: [
          'Analyze current service offerings for expansion opportunities',
          'Consider recurring revenue models (retainers, subscriptions)',
          'Explore passive income opportunities (training, digital products)',
          'Test new revenue streams with existing clients'
        ],
        expectedOutcome: 'More stable and predictable revenue',
        timeframe: '6-12 months',
        confidence: 75
      });
    }

    // Operational efficiency
    if (profile.operational_challenges && profile.operational_challenges.length > 0) {
      advice.push({
        category: 'efficiency',
        priority: 'medium',
        title: 'Address Operational Challenges',
        description: `Focus on resolving: ${profile.operational_challenges.slice(0, 2).join(', ')}`,
        reasoning: 'Operational inefficiencies limit growth and profitability',
        actionSteps: [
          'Prioritize challenges by impact and effort',
          'Implement automation where possible',
          'Standardize recurring processes',
          'Consider technology solutions'
        ],
        expectedOutcome: 'Improved efficiency and reduced operational stress',
        timeframe: '2-4 months',
        confidence: 80
      });
    }

    // Customer concentration risk
    if (profile.customer_segments && profile.customer_segments.length > 0) {
      const topSegment = profile.customer_segments
        .sort((a, b) => b.revenue_contribution - a.revenue_contribution)[0];
      
      if (topSegment.revenue_contribution > 60) {
        advice.push({
          category: 'risk',
          priority: 'high',
          title: 'Reduce Customer Concentration Risk',
          description: `${topSegment.revenue_contribution}% revenue dependency on ${topSegment.name} is risky`,
          reasoning: 'High concentration in one customer segment creates business vulnerability',
          actionSteps: [
            'Identify adjacent market segments to target',
            'Develop marketing strategies for new segments',
            'Adapt service offerings for broader appeal',
            'Set target of <50% revenue from any single segment'
          ],
          expectedOutcome: 'More resilient business with diversified customer base',
          timeframe: '6-12 months',
          confidence: 90
        });
      }
    }

    // Goal alignment advice
    if (profile.short_term_goals && profile.short_term_goals.length > 0) {
      advice.push({
        category: 'strategy',
        priority: 'medium',
        title: 'Track Goal Progress',
        description: 'Implement systems to monitor progress on your short-term goals',
        reasoning: 'Goal tracking increases achievement probability by 42%',
        actionSteps: [
          'Break down goals into measurable milestones',
          'Set up monthly progress reviews',
          'Create accountability systems',
          'Adjust strategies based on progress'
        ],
        expectedOutcome: 'Higher goal achievement rate and strategic focus',
        timeframe: '1 month to implement',
        confidence: 95
      });
    }

    // Technology stack optimization
    if (profile.technology_stack && profile.technology_stack.length > 10) {
      advice.push({
        category: 'efficiency',
        priority: 'low',
        title: 'Consolidate Technology Stack',
        description: 'Simplify your technology tools to reduce complexity and costs',
        reasoning: 'Too many tools create inefficiency and integration challenges',
        actionSteps: [
          'Audit current tool usage and overlap',
          'Identify consolidation opportunities',
          'Research integrated solutions',
          'Plan migration strategy'
        ],
        expectedOutcome: 'Reduced costs and improved workflow efficiency',
        timeframe: '3-6 months',
        confidence: 70
      });
    }

    // Query-specific advice
    if (query) {
      const contextualAdvice = await this.generateContextualAdvice(profile, query);
      advice.push(...contextualAdvice);
    }

    return advice.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  private async generateContextualAdvice(profile: any, query: string): Promise<BusinessAdvice[]> {
    const lowerQuery = query.toLowerCase();
    const advice: BusinessAdvice[] = [];

    // Revenue-related queries
    if (lowerQuery.includes('revenue') || lowerQuery.includes('money') || lowerQuery.includes('income')) {
      advice.push({
        category: 'revenue',
        priority: 'high',
        title: 'Revenue Growth Strategy',
        description: 'Based on your current business model, here are revenue optimization opportunities',
        reasoning: `With ${profile.total_clients} clients and ${profile.business_model} model, focus on value maximization`,
        actionSteps: [
          'Analyze client profitability by segment',
          'Identify upselling opportunities',
          'Implement value-based pricing',
          'Develop recurring revenue streams'
        ],
        expectedOutcome: '20-40% revenue increase within 12 months',
        timeframe: '6-12 months',
        confidence: 80
      });
    }

    // Growth-related queries
    if (lowerQuery.includes('grow') || lowerQuery.includes('scale') || lowerQuery.includes('expand')) {
      advice.push({
        category: 'growth',
        priority: 'high',
        title: 'Strategic Growth Plan',
        description: 'Systematic approach to scaling your business',
        reasoning: 'Sustainable growth requires systems and processes',
        actionSteps: [
          'Document current processes',
          'Identify bottlenecks and constraints',
          'Build scalable systems',
          'Plan team expansion'
        ],
        expectedOutcome: 'Sustainable 50-100% growth capacity',
        timeframe: '3-6 months',
        confidence: 85
      });
    }

    return advice;
  }

  async getBusinessInsights(orgId: string): Promise<string[]> {
    const profile = await businessProfileService.getBusinessProfile(orgId);
    if (!profile) return ['Complete business profile setup to receive insights'];

    const insights = [];

    // Business health insights
    if (profile.monthly_recurring_revenue && profile.total_clients) {
      const revenuePerClient = profile.monthly_recurring_revenue / profile.total_clients;
      insights.push(`Average revenue per client: $${revenuePerClient.toFixed(0)}/month`);
    }

    // Growth indicators
    if (profile.company_size === 'solopreneur' && profile.total_clients > 15) {
      insights.push('Your client base indicates readiness for business scaling');
    }

    // Market position
    if (profile.competitive_advantages && profile.competitive_advantages.length > 2) {
      insights.push('Strong competitive positioning with multiple advantages');
    }

    return insights;
  }

  // Generate business context for AI conversations
  async getBusinessContext(orgId: string): Promise<string> {
    const profile = await businessProfileService.getBusinessProfile(orgId);
    if (!profile) return 'No business profile available';

    return `
BUSINESS CONTEXT FOR AI ASSISTANCE: Company: ${profile.company_name}
Industry: ${profile.industry}
Business Model: ${profile.business_model}
Size: ${profile.company_size}

SERVICES:
${profile.primary_services?.join(', ')}

VALUE PROPOSITION: ${profile.unique_value_proposition}

TARGET MARKET:
${profile.target_markets?.join(', ')}

CURRENT SITUATION: - Total Clients: ${profile.total_clients}
- Active Clients: ${profile.active_clients}
- MRR: $${profile.monthly_recurring_revenue || 'Not specified'}

GOALS:
Short-term: ${profile.short_term_goals?.join(', ')}
Long-term: ${profile.long_term_goals?.join(', ')}

CHALLENGES: ${profile.current_challenges?.join(', ')}

Use this context to provide specific, actionable business advice tailored to this company's situation.
    `.trim();
  }
}

export const businessAdvisor = BusinessAdvisor.getInstance(); 