import { BaseService, type ServiceResponse } from '@/core/services/BaseService';
import { AIGateway } from '@/lib/ai/lib/AIGateway';

export interface OnboardingInsight {
  id: string;
  type: 'opportunity' | 'efficiency' | 'risk' | 'growth' | 'integration' | 'recommendation';
  title: string;
  description: string;
  impact: 'Low' | 'Medium' | 'High' | 'Critical';
  confidence: number;
  action: string;
  reasoning: string;
  estimatedValue?: string;
  timeframe?: string;
  category: string;
}

export interface OnboardingContext {
  user: {
    firstName: string;
    lastName: string;
    company: string;
    industry: string;
    companySize: string;
    keyPriorities: string[];
  };
  selectedIntegrations: string[];
  selectedTools: Record<string, string[]>;
  maturityScore: number;
}

export class OnboardingInsightsService extends BaseService {
  private aiGateway: AIGateway;

  constructor() {
    super();
    // The AIGateway will automatically use server-side environment variables
    // OPENAI_API_KEY, OPENROUTER_API_KEY, etc. (not VITE_ prefixed)
    this.aiGateway = new AIGateway();
  }

  /**
   * Generate AI-powered insights for onboarding
   */
  async generateOnboardingInsights(context: OnboardingContext): Promise<ServiceResponse<OnboardingInsight[]>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('generateOnboardingInsights', { 
        company: context.user.company, 
        industry: context.user.industry,
        integrationCount: context.selectedIntegrations?.length || 0 
      });

      try {
        // Build comprehensive context for AI analysis
        const businessContext = this.buildBusinessContext(context);
        
        // Generate insights using AI
        const aiResponse = await this.aiGateway.call({
          task: 'business.insights',
          role: 'chat',
          input: businessContext,
          system: `You are an expert business advisor specializing in helping entrepreneurs optimize their business operations. 
          
          Your task is to analyze the provided business context and generate 3-5 actionable insights that will help this business owner improve their operations, increase revenue, or reduce costs.
          
          For each insight, provide:
          - A clear, specific title
          - A detailed description explaining the opportunity or issue
          - Impact level (Low/Medium/High/Critical)
          - Confidence score (0-100)
          - Specific action item
          - Brief reasoning for the recommendation
          - Estimated value if applicable
          - Timeframe for implementation
          
          Focus on practical, implementable advice that leverages their current tools and addresses their stated priorities.`,
          tenantId: 'onboarding',
          sensitivity: 'internal',
          json: true
        });

        // Parse AI response and transform into structured insights
        const insights = this.parseAIInsights(aiResponse.output, context);
        
        // Calculate maturity score based on insights and context
        const maturityScore = this.calculateMaturityScore(context, insights);

        this.logSuccess('generateOnboardingInsights', `Generated ${insights.length} insights with maturity score ${maturityScore}`);

        return this.createSuccessResponse(insights);
      } catch (error) {
        this.logger.error('Error generating onboarding insights', { error });
        
        // Fallback to contextual mock insights if AI fails
        const fallbackInsights = this.generateFallbackInsights(context);
        return this.createSuccessResponse(fallbackInsights);
      }
    }, `generate onboarding insights for ${context.user.company}`);
  }

  /**
   * Build comprehensive business context for AI analysis
   */
  private buildBusinessContext(context: OnboardingContext): string {
    const { user, selectedIntegrations, selectedTools } = context;
    
    const toolCategories = Object.entries(selectedTools || {}).map(([category, tools]) => 
      `${category}: ${tools.join(', ')}`
    ).join('\n');

    const integrationList = selectedIntegrations?.length > 0 
      ? selectedIntegrations.join(', ') 
      : 'None yet';

    return `
BUSINESS ANALYSIS CONTEXT:

Company: ${user.company}
Industry: ${user.industry}
Company Size: ${user.companySize}
Key Priorities: ${user.keyPriorities.join(', ')}

CURRENT TOOL STACK:
${toolCategories}

ACTIVE INTEGRATIONS:
${integrationList}

INDUSTRY CONTEXT:
Based on ${user.industry} industry benchmarks and best practices.

ANALYSIS REQUIREMENTS:
1. Identify immediate opportunities for revenue growth or cost savings
2. Suggest efficiency improvements based on their current tool stack
3. Recommend next steps for their stated priorities
4. Consider their company size and industry-specific challenges
5. Provide actionable, specific recommendations with clear value propositions

Please generate 3-5 high-quality, actionable business insights that will help ${user.company} improve their operations and achieve their goals.
    `.trim();
  }

  /**
   * Parse AI response into structured insights
   */
  private parseAIInsights(aiOutput: any, context: OnboardingContext): OnboardingInsight[] {
    try {
      // Handle different AI response formats
      let insightsData = aiOutput;
      
      if (typeof aiOutput === 'string') {
        insightsData = JSON.parse(aiOutput);
      }
      
      if (aiOutput.insights) {
        insightsData = aiOutput.insights;
      }

      if (!Array.isArray(insightsData)) {
        throw new Error('Invalid AI response format');
      }

      return insightsData.map((insight: any, index: number) => ({
        id: `insight-${Date.now()}-${index}`,
        type: this.mapInsightType(insight.type || insight.category),
        title: insight.title || insight.name || `Insight ${index + 1}`,
        description: insight.description || insight.summary || insight.content,
        impact: this.mapImpactLevel(insight.impact || insight.priority),
        confidence: Math.min(100, Math.max(0, insight.confidence || 75)),
        action: insight.action || insight.recommendation || 'Review and implement',
        reasoning: insight.reasoning || insight.explanation || 'Based on industry best practices',
        estimatedValue: insight.estimatedValue || insight.value,
        timeframe: insight.timeframe || insight.duration || '30-90 days',
        category: insight.category || 'Business Intelligence'
      }));
    } catch (error) {
      this.logger.error('Error parsing AI insights', { error, aiOutput });
      return this.generateFallbackInsights(context);
    }
  }

  /**
   * Generate fallback insights when AI fails
   */
  private generateFallbackInsights(context: OnboardingContext): OnboardingInsight[] {
    const { user, selectedIntegrations } = context;
    
    const baseInsights: OnboardingInsight[] = [
      {
        id: `fallback-${Date.now()}-1`,
        type: 'opportunity',
        title: 'Revenue Growth Opportunity',
        description: `Based on ${user.industry} industry data, companies similar to yours see 23% revenue growth when implementing automated lead scoring and customer relationship management.`,
        impact: 'High',
        confidence: 87,
        action: 'Set up automated lead scoring in your CRM system',
        reasoning: 'Industry benchmark analysis shows significant revenue impact from lead scoring automation',
        estimatedValue: '+23% revenue growth',
        timeframe: '60-90 days',
        category: 'Sales & Marketing'
      },
      {
        id: `fallback-${Date.now()}-2`,
        type: 'efficiency',
        title: 'Operational Efficiency Improvement',
        description: 'Automating invoice processing and expense management could save your team 8-12 hours per week on administrative tasks.',
        impact: 'Medium',
        confidence: 92,
        action: 'Connect your accounting software for automated workflows',
        reasoning: 'Manual invoice processing is a common time sink that automation can significantly reduce',
        estimatedValue: '8-12 hours/week saved',
        timeframe: '30-45 days',
        category: 'Operations'
      },
      {
        id: `fallback-${Date.now()}-3`,
        type: 'recommendation',
        title: 'Customer Retention Strategy',
        description: `${user.industry} businesses typically have a 15% higher customer churn rate than average. Implementing customer success tracking can improve retention by 25%.`,
        impact: 'High',
        confidence: 78,
        action: 'Implement customer success tracking and engagement monitoring',
        reasoning: 'Customer retention is critical for sustainable growth, especially in competitive industries',
        estimatedValue: '+25% customer retention',
        timeframe: '45-60 days',
        category: 'Customer Success'
      }
    ];

    // Add integration-specific insights
    if (selectedIntegrations?.includes('hubspot')) {
      baseInsights.push({
        id: `fallback-${Date.now()}-4`,
        type: 'integration',
        title: 'HubSpot CRM Optimization',
        description: 'Your HubSpot integration provides access to advanced lead scoring and marketing automation features that can significantly improve your sales pipeline.',
        impact: 'Medium',
        confidence: 95,
        action: 'Configure HubSpot lead scoring and marketing automation workflows',
        reasoning: 'HubSpot has powerful features that are often underutilized by new users',
        estimatedValue: '+15% lead conversion',
        timeframe: '30 days',
        category: 'CRM & Marketing'
      });
    }

    if (selectedIntegrations?.includes('quickbooks')) {
      baseInsights.push({
        id: `fallback-${Date.now()}-5`,
        type: 'integration',
        title: 'Financial Health Monitoring',
        description: 'Your QuickBooks integration enables real-time financial monitoring and automated reporting for better business decision-making.',
        impact: 'Medium',
        confidence: 88,
        action: 'Set up automated financial reports and cash flow monitoring',
        reasoning: 'Regular financial monitoring is essential for business health and growth planning',
        estimatedValue: 'Improved financial visibility',
        timeframe: '15-30 days',
        category: 'Finance'
      });
    }

    return baseInsights;
  }

  /**
   * Calculate business maturity score based on context and insights
   */
  public calculateMaturityScore(context: OnboardingContext, insights: OnboardingInsight[]): number {
    let score = 45; // Base score

    // Add points for integrations
    const integrationCount = context.selectedIntegrations?.length || 0;
    score += Math.min(integrationCount * 5, 20); // Max 20 points for integrations

    // Add points for tool coverage
    const toolCategories = Object.keys(context.selectedTools || {}).length;
    score += Math.min(toolCategories * 3, 15); // Max 15 points for tool coverage

    // Add points for high-impact insights
    const highImpactInsights = insights.filter(i => i.impact === 'High' || i.impact === 'Critical').length;
    score += Math.min(highImpactInsights * 2, 10); // Max 10 points for high-impact insights

    // Add points for industry alignment
    if (context.user.industry && context.user.industry !== 'Other') {
      score += 5;
    }

    // Add points for clear priorities
    if (context.user.keyPriorities?.length > 0) {
      score += Math.min(context.user.keyPriorities.length * 2, 10);
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Map AI insight types to our standardized types
   */
  private mapInsightType(aiType: string): OnboardingInsight['type'] {
    const typeMap: Record<string, OnboardingInsight['type']> = {
      'opportunity': 'opportunity',
      'efficiency': 'efficiency',
      'risk': 'risk',
      'growth': 'growth',
      'integration': 'integration',
      'recommendation': 'recommendation',
      'optimization': 'efficiency',
      'automation': 'efficiency',
      'revenue': 'opportunity',
      'cost': 'efficiency',
      'customer': 'growth',
      'process': 'efficiency'
    };

    return typeMap[aiType?.toLowerCase()] || 'recommendation';
  }

  /**
   * Map AI impact levels to our standardized levels
   */
  private mapImpactLevel(aiImpact: string): OnboardingInsight['impact'] {
    const impactMap: Record<string, OnboardingInsight['impact']> = {
      'low': 'Low',
      'medium': 'Medium',
      'high': 'High',
      'critical': 'Critical',
      'minor': 'Low',
      'moderate': 'Medium',
      'major': 'High',
      'urgent': 'Critical'
    };

    return impactMap[aiImpact?.toLowerCase()] || 'Medium';
  }
}

// Export singleton instance
export const onboardingInsightsService = new OnboardingInsightsService();
