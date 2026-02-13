import { BaseService, type ServiceResponse } from '@/core/services/BaseService';
import { selectData, deleteOne, insertOne } from '@/lib/api-client';
import { callEdgeFunction } from '@/lib/database';
import type { OnboardingInsight, OnboardingContext } from './OnboardingInsightsService';

/**
 * Client-side service for AI insights that calls server-side API
 * This ensures API keys are never exposed to the client
 */
export class OnboardingInsightsClient extends BaseService {
  constructor() {
    super();
  }

  /**
   * Generate AI-powered insights via server-side API
   */
  async generateOnboardingInsights(context: OnboardingContext): Promise<ServiceResponse<OnboardingInsight[]>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('generateOnboardingInsights', {
        company: context.user.company,
        industry: context.user.industry,
        integrationCount: context.selectedIntegrations?.length || 0
      });

      // First, check for existing insights to avoid duplicates
      const existingInsights = await this.checkForExistingInsights(context);
      if (existingInsights.length > 0) {
        this.logger.info('Found existing insights, returning cached results', {
          count: existingInsights.length,
          company: context.user.company
        });
        return this.createSuccessResponse(existingInsights);
      }

      let result: any = null;

      try {
        // Call server-side API via edge function
        result = await callEdgeFunction('ai-insights-onboarding', {
          context
        });

        this.logger.info('AI insights API response received', {
          success: result?.success,
          hasData: !!result?.data,
          dataType: typeof result?.data,
          isArray: Array.isArray(result?.data),
          nestedData: result?.data?.data ? 'yes' : 'no'
        });

        if (!result?.success) {
          throw new Error(result?.error || 'Failed to generate insights');
        }

        // Validate response structure - handle both direct array and nested data structure
        let insightsData = result.data;
        if (result.data && result.data.data && Array.isArray(result.data.data)) {
          // Handle nested structure: { data: { data: [...] } }
          insightsData = result.data.data;
        } else if (!Array.isArray(result.data)) {
          throw new Error('Invalid response format from AI insights service');
        }

        // Transform to ensure proper typing
        const insights: OnboardingInsight[] = insightsData.map((insight: any, index: number) => ({
          id: insight.id || `insight-${Date.now()}-${index}`,
          type: insight.type || 'recommendation',
          title: insight.title || insight.name || `Insight ${index + 1}`,
          description: insight.description || insight.summary || insight.content,
          impact: insight.impact || insight.priority || 'Medium',
          confidence: Math.min(100, Math.max(0, insight.confidence || 75)),
          action: insight.action || insight.recommendation || 'Review and implement',
          reasoning: insight.reasoning || insight.explanation || 'Based on industry best practices',
          estimatedValue: insight.estimatedValue || insight.value,
          timeframe: insight.timeframe || insight.duration || '30-90 days',
          category: insight.category || 'Business Intelligence',
          implementationDifficulty: insight.implementationDifficulty || 'Beginner'
        }));

        // Store insights for future deduplication
        await this.storeInsightsForDeduplication(insights, context);

        return this.createSuccessResponse(insights);
      } catch (error) {
        this.logger.error('Error generating insights', { error });
        return this.createErrorResponse(error instanceof Error ? error.message : 'Failed to generate insights');
      }
    }, 'generateOnboardingInsights');
  }

  /**
   * Calculate business maturity score (client-side calculation)
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
   * Generate fallback insights when server API fails
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
   * Check for existing insights to avoid duplicates
   */
  private async checkForExistingInsights(context: OnboardingContext): Promise<OnboardingInsight[]> {
    try {
      // Query existing insights from the personal_thoughts table using api-client
      const { data: existingThoughts, success, error } = await selectData<any>({
        table: 'personal_thoughts',
        filters: {
          category: 'fire_initiative',
          user_id: context.user.id || 'onboarding'
        },
        orderBy: [{ column: 'created_at', ascending: false }],
        limit: 10
      });

      if (!success || !existingThoughts || existingThoughts.length === 0) {
        if (error) this.logger.error('Error checking for existing insights', { error });
        return [];
      }

      // Filter by date client-side (last 24 hours)
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const recentThoughts = existingThoughts.filter(t => t.created_at >= yesterday);

      if (recentThoughts.length === 0) {
        return [];
      }

      // Remove duplicates based on title similarity
      const uniqueThoughts = this.removeDuplicateThoughts(recentThoughts);

      // Transform thoughts back to insights format
      const insights: OnboardingInsight[] = uniqueThoughts.map((thought: any) => {
        const metadata = thought.metadata || {};
        return {
          id: thought.id,
          type: 'recommendation',
          title: thought.title || 'Business Insight',
          description: thought.content || '',
          impact: metadata.impact_level || 'Medium',
          confidence: metadata.confidence_score || 75,
          action: metadata.action || 'Review and implement',
          reasoning: metadata.reasoning || 'Based on business analysis',
          estimatedValue: metadata.estimated_value,
          timeframe: metadata.timeframe || '30-90 days',
          category: metadata.category || 'Business Intelligence',
          implementationDifficulty: metadata.implementation_difficulty || 'Beginner'
        };
      });

      this.logger.info('Found existing insights for deduplication', {
        count: insights.length,
        originalCount: existingThoughts.length,
        company: context.user.company
      });

      return insights;
    } catch (error) {
      this.logger.error('Error checking for existing insights', { error });
      return [];
    }
  }

  /**
   * Remove duplicate thoughts based on title similarity
   */
  private removeDuplicateThoughts(thoughts: any[]): any[] {
    const seen = new Set<string>();
    const unique: any[] = [];

    for (const thought of thoughts) {
      // Normalize title for comparison (lowercase, remove extra spaces)
      const normalizedTitle = thought.title?.toLowerCase().replace(/\s+/g, ' ').trim() || '';

      if (!seen.has(normalizedTitle)) {
        seen.add(normalizedTitle);
        unique.push(thought);
      } else {
        this.logger.info('Removing duplicate insight', {
          title: thought.title,
          id: thought.id
        });
      }
    }

    return unique;
  }

  /**
   * Clean up duplicate insights (one-time cleanup function)
   */
  async cleanupDuplicateInsights(): Promise<void> {
    try {
      this.logger.info('Starting duplicate insights cleanup');

      // Get all fire_initiative thoughts from the last 24 hours
      const { data: allThoughts, success, error } = await selectData<any>({
        table: 'personal_thoughts',
        filters: { category: 'fire_initiative' },
        orderBy: [{ column: 'created_at', ascending: false }]
      });

      if (!success || !allThoughts || allThoughts.length === 0) {
        if (error) this.logger.error('Error fetching insights for cleanup', { error });
        this.logger.info('No insights to clean up');
        return;
      }

      // Filter by date client-side
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const recentThoughts = allThoughts.filter(t => t.created_at >= yesterday);

      if (recentThoughts.length === 0) {
        this.logger.info('No recent insights to clean up');
        return;
      }

      // Group by normalized title
      const groupedByTitle = new Map<string, any[]>();

      for (const thought of allThoughts) {
        const normalizedTitle = thought.title?.toLowerCase().replace(/\s+/g, ' ').trim() || '';
        if (!groupedByTitle.has(normalizedTitle)) {
          groupedByTitle.set(normalizedTitle, []);
        }
        groupedByTitle.get(normalizedTitle)!.push(thought);
      }

      // Remove duplicates (keep the oldest one)
      let removedCount = 0;
      for (const [title, thoughts] of groupedByTitle) {
        if (thoughts.length > 1) {
          // Sort by creation time, keep the oldest
          thoughts.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

          // Remove all but the first (oldest) one
          const toRemove = thoughts.slice(1);

          for (const thought of toRemove) {
            await deleteOne('personal_thoughts', { id: thought.id });
            removedCount++;
          }

          this.logger.info('Removed duplicate insights', {
            title,
            kept: thoughts[0].id,
            removed: toRemove.map(t => t.id)
          });
        }
      }

      this.logger.info('Duplicate cleanup completed', {
        totalRemoved: removedCount,
        totalProcessed: allThoughts.length
      });
    } catch (error) {
      this.logger.error('Error during duplicate cleanup', { error });
    }
  }

  /**
   * Store insights for future deduplication
   */
  private async storeInsightsForDeduplication(insights: OnboardingInsight[], context: OnboardingContext): Promise<void> {
    try {
      // Store insights in personal_thoughts table for future deduplication
      for (const insight of insights) {
        await insertOne('personal_thoughts', {
          user_id: context.user.id || 'onboarding',
          company_id: context.user.companyId,
          title: insight.title,
          content: insight.description,
          category: 'fire_initiative',
          tags: [
            'fire_initiative',
            'onboarding',
            insight.impact.toLowerCase(),
            insight.category.toLowerCase(),
            context.user.industry?.toLowerCase()
          ].filter(Boolean) as any,
          metadata: {
            insight_id: insight.id,
            impact_level: insight.impact,
            confidence_score: insight.confidence,
            category: insight.category,
            estimated_value: insight.estimatedValue,
            timeframe: insight.timeframe,
            implementation_difficulty: insight.implementationDifficulty,
            company: context.user.company,
            industry: context.user.industry,
            company_size: context.user.companySize,
            integrations: context.selectedIntegrations || [],
            tools: context.selectedTools || {},
            priorities: context.user.keyPriorities || [],
            generated_at: new Date().toISOString()
          } as any
        });
      }

      this.logger.info('Stored insights for future deduplication', {
        count: insights.length,
        company: context.user.company
      });
    } catch (error) {
      this.logger.error('Error storing insights for deduplication', { error });
      // Don't fail the operation if storage fails
    }
  }

  /**
   * Check if AI insights service is available
   */
  async checkServiceHealth(): Promise<boolean> {
    try {
      const result = await callEdgeFunction('ai-insights-health', {});
      return result.success === true;
    } catch (error) {
      this.logger.warn('AI insights service health check failed', { error });
      return false;
    }
  }
}

// Export singleton instance
export const onboardingInsightsClient = new OnboardingInsightsClient();
