export interface FireInitiative {
  id: string;
  title: string;
  description: string;
  action: string;
  reasoning: string;
  impact: string;
  confidence: number;
  category: string;
  estimatedValue?: string;
  timeframe?: string;
  implementationDifficulty?: string;
  source: 'onboarding_insight';
  createdAt: string;
}

export class FireInitiativeService {
  /**
   * Save a valuable insight as a FIRE initiative in the thoughts table
   */
  static async saveAsFireInitiative(insight: any, userId: string, companyId: string): Promise<boolean> {
    try {
      // Validate required parameters
      if (!userId || !insight?.title) {
        console.error('Missing required parameters for FIRE initiative');
        return false;
      }

      const fireInitiative: FireInitiative = {
        id: `fire-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: insight.title || 'Untitled FIRE Initiative',
        description: insight.description || '',
        action: insight.action || '',
        reasoning: insight.reasoning || '',
        impact: insight.impact || 'Medium',
        confidence: insight.confidence || 75,
        category: insight.category || 'General',
        estimatedValue: insight.estimatedValue || null,
        timeframe: insight.timeframe || null,
        implementationDifficulty: insight.implementationDifficulty || null,
        source: 'onboarding_insight',
        createdAt: new Date().toISOString()
      };

      // Prepare the request payload with proper sanitization
      const payload = {
        user_id: userId,
        company_id: companyId || null,
        title: fireInitiative.title,
        content: this.formatThoughtContent(fireInitiative),
        category: 'fire_initiative',
        tags: [
          'fire_initiative',
          'onboarding',
          (fireInitiative.impact || 'medium').toLowerCase(),
          (fireInitiative.category || 'general').toLowerCase(),
          fireInitiative.source
        ].filter(Boolean), // Remove any falsy values
        metadata: {
          fire_initiative_id: fireInitiative.id,
          source: fireInitiative.source,
          impact_level: fireInitiative.impact,
          confidence_score: fireInitiative.confidence,
          category: fireInitiative.category,
          estimated_value: fireInitiative.estimatedValue,
          timeframe: fireInitiative.timeframe,
          implementation_difficulty: fireInitiative.implementationDifficulty,
          created_at: fireInitiative.createdAt
        }
      };

      // Debug: Log the payload (remove in production)
      console.log('Sending FIRE initiative payload:', JSON.stringify(payload, null, 2));

      // Save to thoughts table via API
      const response = await fetch('/api/thoughts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`Failed to save FIRE initiative: ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      return result.thought ? true : false;
    } catch (error) {
      console.error('Error saving FIRE initiative:', error);
      return false;
    }
  }

  /**
   * Format the thought content for storage
   */
  private static formatThoughtContent(initiative: FireInitiative): string {
    // Sanitize all values to prevent undefined/null issues
    const title = initiative.title || 'Untitled FIRE Initiative';
    const description = initiative.description || 'No description provided';
    const action = initiative.action || 'No action specified';
    const reasoning = initiative.reasoning || 'No reasoning provided';
    const impact = initiative.impact || 'Medium';
    const confidence = initiative.confidence || 75;
    const category = initiative.category || 'General';
    const estimatedValue = initiative.estimatedValue || 'Not specified';
    const timeframe = initiative.timeframe || 'Not specified';
    const implementationDifficulty = initiative.implementationDifficulty || 'Not specified';

    return `
FIRE INITIATIVE: ${title}

Description: ${description}
Action Required: ${action}
Reasoning: ${reasoning}
Impact Level: ${impact}
Confidence: ${confidence}%
Category: ${category}
Estimated Value: ${estimatedValue}
Timeframe: ${timeframe}
Implementation Difficulty: ${implementationDifficulty}

This FIRE initiative was identified during onboarding and marked as valuable for your business.
    `.trim();
  }

  /**
   * Get alternative insights when user disagrees with current ones
   */
  static getAlternativeInsights(userContext: any): any[] {
    const { user, selectedIntegrations, selectedTools } = userContext;
    
    // Generate alternative insights based on user context
    const alternatives = [
      {
        id: `alt-${Date.now()}-1`,
        type: 'efficiency',
        title: 'Streamline Communication Workflows',
        description: 'Based on your tool stack, you can reduce meeting time by 30% by implementing structured communication protocols and automated scheduling.',
        impact: 'Medium',
        confidence: 85,
        action: 'Set up automated meeting scheduling and communication templates',
        reasoning: 'Most teams spend excessive time on meeting coordination and follow-ups',
        estimatedValue: '30% reduction in meeting time',
        timeframe: '15-30 days',
        category: 'Operations',
        implementationDifficulty: 'Beginner'
      },
      {
        id: `alt-${Date.now()}-2`,
        type: 'optimization',
        title: 'Data-Driven Decision Making',
        description: 'Implement regular data review processes to make more informed business decisions and identify growth opportunities.',
        impact: 'High',
        confidence: 90,
        action: 'Set up weekly data review meetings and create key performance dashboards',
        reasoning: 'Data-driven companies outperform competitors by 23% on average',
        estimatedValue: '+23% performance improvement',
        timeframe: '30-45 days',
        category: 'Business Intelligence',
        implementationDifficulty: 'Intermediate'
      },
      {
        id: `alt-${Date.now()}-3`,
        type: 'growth',
        title: 'Customer Feedback Loop',
        description: 'Establish a systematic approach to collecting and acting on customer feedback to improve products and services.',
        impact: 'High',
        confidence: 88,
        action: 'Implement customer feedback collection and analysis processes',
        reasoning: 'Customer feedback is the most reliable indicator of product-market fit',
        estimatedValue: '+40% customer satisfaction',
        timeframe: '45-60 days',
        category: 'Customer Success',
        implementationDifficulty: 'Beginner'
      },
      {
        id: `alt-${Date.now()}-4`,
        type: 'automation',
        title: 'Process Automation Opportunities',
        description: 'Identify and automate repetitive tasks to free up time for strategic work and improve team productivity.',
        impact: 'Medium',
        confidence: 82,
        action: 'Audit current processes and implement automation for repetitive tasks',
        reasoning: 'Automation can save 6-10 hours per week per team member',
        estimatedValue: '6-10 hours/week saved per team member',
        timeframe: '30-60 days',
        category: 'Operations',
        implementationDifficulty: 'Intermediate'
      },
      {
        id: `alt-${Date.now()}-5`,
        type: 'optimization',
        title: 'Tool Integration Optimization',
        description: 'Maximize the value of your existing tools by ensuring they work together seamlessly and share data effectively.',
        impact: 'Medium',
        confidence: 87,
        action: 'Review and optimize integrations between your current tools',
        reasoning: 'Integrated tools can improve efficiency by 25-40%',
        estimatedValue: '+25-40% efficiency improvement',
        timeframe: '20-40 days',
        category: 'Operations',
        implementationDifficulty: 'Intermediate'
      }
    ];

    // Add integration-specific alternatives
    if (selectedIntegrations?.includes('hubspot')) {
      alternatives.push({
        id: `alt-${Date.now()}-6`,
        type: 'integration',
        title: 'HubSpot Lead Nurturing',
        description: 'Implement automated lead nurturing sequences in HubSpot to convert more prospects into customers.',
        impact: 'High',
        confidence: 92,
        action: 'Create automated email sequences and lead scoring in HubSpot',
        reasoning: 'Automated lead nurturing can increase conversion rates by 50%',
        estimatedValue: '+50% lead conversion',
        timeframe: '30 days',
        category: 'Sales & Marketing',
        implementationDifficulty: 'Intermediate'
      });
    }

    if (selectedIntegrations?.includes('quickbooks')) {
      alternatives.push({
        id: `alt-${Date.now()}-7`,
        type: 'integration',
        title: 'Financial Health Monitoring',
        description: 'Set up automated financial reporting and cash flow monitoring in QuickBooks for better business insights.',
        impact: 'Medium',
        confidence: 89,
        action: 'Configure automated financial reports and cash flow alerts',
        reasoning: 'Regular financial monitoring prevents cash flow issues',
        estimatedValue: 'Improved financial visibility and planning',
        timeframe: '15-30 days',
        category: 'Finance',
        implementationDifficulty: 'Beginner'
      });
    }

    return alternatives;
  }
}
