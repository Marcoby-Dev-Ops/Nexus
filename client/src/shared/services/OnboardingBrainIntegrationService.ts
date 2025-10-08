/**
 * Onboarding Brain Integration Service
 * 
 * Integrates onboarding data with the unified brain system to provide
 * rich, personalized context for chat interactions and AI responses.
 */

import { BaseService } from '@/core/services/BaseService';
import type { ServiceResponse } from '@/core/services/BaseService';
import { logger } from '@/shared/utils/logger';
import { selectData, selectOne } from '@/lib/api-client';

// Types for onboarding data integration
export interface OnboardingUserProfile {
  userId: string;
  personal: {
    firstName: string;
    lastName: string;
    email: string;
    displayName?: string;
    jobTitle?: string;
    role: string;
    experience: 'beginner' | 'intermediate' | 'expert';
    learningStyle: 'hands-on' | 'visual' | 'theoretical';
    timeAvailability: 'part-time' | 'full-time' | 'flexible';
    decisionAuthority: 'full' | 'partial' | 'consultant';
  };
  business: {
    companyName: string;
    industry: string;
    companySize: string;
    foundedYear?: string;
    businessModel: string;
    targetMarket: string;
    growthStage: string;
    companyId?: string;
  };
  goals: {
    primaryGoals: string[];
    businessChallenges: string[];
    successMetrics: string[];
    timeHorizon: string;
  };
  tools: {
    currentTools: string[];
    selectedIntegrations: string[];
    preferredPlatforms: string[];
  };
  preferences: {
    communicationStyle: string;
    notificationPreferences: string[];
    automationLevel: 'basic' | 'intermediate' | 'advanced';
  };
}

export interface BrainContextData {
  userProfile: OnboardingUserProfile;
  businessContext: {
    industry: string;
    size: string;
    stage: string;
    model: string;
    market: string;
  };
  goals: {
    primary: string[];
    challenges: string[];
    metrics: string[];
  };
  tools: {
    current: string[];
    integrations: string[];
    platforms: string[];
  };
  preferences: {
    communication: string;
    notifications: string[];
    automation: string;
  };
  recommendations: {
    priorityActions: string[];
    suggestedIntegrations: string[];
    automationOpportunities: string[];
  };
}

export interface ChatContextEnhancement {
  systemPrompt: string;
  userContext: string;
  businessContext: string;
  goalsContext: string;
  toolsContext: string;
  recommendations: string;
}

/**
 * Service that integrates onboarding data with the unified brain system
 */
export class OnboardingBrainIntegrationService extends BaseService {
  private static instance: OnboardingBrainIntegrationService;
  private userProfileCache: Map<string, OnboardingUserProfile> = new Map();

  private constructor() {
    super();
  }

  public static getInstance(): OnboardingBrainIntegrationService {
    if (!OnboardingBrainIntegrationService.instance) {
      OnboardingBrainIntegrationService.instance = new OnboardingBrainIntegrationService();
    }
    return OnboardingBrainIntegrationService.instance;
  }

  /**
   * Get comprehensive onboarding data for a user
   */
  async getOnboardingContext(userId: string): Promise<ServiceResponse<BrainContextData>> {
    try {
      logger.info('Fetching onboarding context for user', { userId });

      // Check cache first
      if (this.userProfileCache.has(userId)) {
        const cached = this.userProfileCache.get(userId)!;
        const brainContext = this.transformToBrainContext(cached);
        return this.createResponse(brainContext);
      }

      // Fetch user profile
      const { data: userProfile, error: profileError } = await selectOne(
        'user_profiles',
        '*',
        { user_id: userId }
      );

      if (profileError || !userProfile) {
        logger.error('Failed to fetch user profile', { userId, error: profileError });
        return this.handleError('User profile not found');
      }

      // Fetch onboarding completion data
      const { data: onboardingData, error: onboardingError } = await selectOne(
        'user_onboarding_completions',
        '*',
        { user_id: userId }
      );

      if (onboardingError) {
        logger.warn('Failed to fetch onboarding data, using profile only', { userId, error: onboardingError });
      }

      // Fetch company data if available
      let companyData = null;
      if (userProfile.company_id) {
        const { data: company, error: companyError } = await selectOne(
          'companies',
          '*',
          { id: userProfile.company_id }
        );
        if (!companyError && company) {
          companyData = company;
        }
      }

      // Transform to unified format
      const onboardingProfile = this.buildOnboardingProfile(userProfile, onboardingData, companyData);
      
      // Cache the result
      this.userProfileCache.set(userId, onboardingProfile);

      // Transform to brain context
      const brainContext = this.transformToBrainContext(onboardingProfile);

      logger.info('Successfully fetched onboarding context', { 
        userId, 
        hasOnboardingData: !!onboardingData,
        hasCompanyData: !!companyData 
      });

      return this.createResponse(brainContext);

    } catch (error) {
      logger.error('Error fetching onboarding context', { userId, error });
      return this.handleError('Failed to fetch onboarding context');
    }
  }

  /**
   * Enhance chat context with onboarding data
   */
  async enhanceChatContext(userId: string, basePrompt?: string): Promise<ServiceResponse<ChatContextEnhancement>> {
    try {
      const contextResponse = await this.getOnboardingContext(userId);
      if (!contextResponse.success || !contextResponse.data) {
        return this.handleError('Failed to get onboarding context');
      }

      const context = contextResponse.data;
      const enhancement = this.buildChatEnhancement(context, basePrompt);

      return this.createResponse(enhancement);

    } catch (error) {
      logger.error('Error enhancing chat context', { userId, error });
      return this.handleError('Failed to enhance chat context');
    }
  }

  /**
   * Get personalized system prompt for AI interactions
   */
  async getPersonalizedSystemPrompt(userId: string, agentType: string = 'executive'): Promise<ServiceResponse<string>> {
    try {
      const contextResponse = await this.getOnboardingContext(userId);
      if (!contextResponse.success || !contextResponse.data) {
        return this.createResponse(this.getDefaultSystemPrompt(agentType));
      }

      const context = contextResponse.data;
      const personalizedPrompt = this.buildPersonalizedSystemPrompt(context, agentType);

      return this.createResponse(personalizedPrompt);

    } catch (error) {
      logger.error('Error getting personalized system prompt', { userId, error });
      return this.createResponse(this.getDefaultSystemPrompt(agentType));
    }
  }

  /**
   * Clear user profile cache (useful for updates)
   */
  clearUserCache(userId: string): void {
    this.userProfileCache.delete(userId);
    logger.info('Cleared user profile cache', { userId });
  }

  /**
   * Build onboarding profile from database data
   */
  private buildOnboardingProfile(
    userProfile: any, 
    onboardingData: any, 
    companyData: any
  ): OnboardingUserProfile {
    const onboardingJson = onboardingData?.onboarding_data || {};
    
    return {
      userId: userProfile.user_id,
      personal: {
        firstName: userProfile.first_name || onboardingJson.firstName || '',
        lastName: userProfile.last_name || onboardingJson.lastName || '',
        email: userProfile.email || '',
        displayName: userProfile.display_name || onboardingJson.displayName,
        jobTitle: userProfile.job_title || onboardingJson.jobTitle,
        role: userProfile.job_title || onboardingJson.role || 'User',
        experience: onboardingJson.experience || 'intermediate',
        learningStyle: onboardingJson.learningStyle || 'hands-on',
        timeAvailability: onboardingJson.timeAvailability || 'full-time',
        decisionAuthority: onboardingJson.decisionAuthority || 'full'
      },
      business: {
        companyName: userProfile.company_name || companyData?.name || onboardingJson.company || '',
        industry: companyData?.industry || onboardingJson.industry || 'Technology',
        companySize: companyData?.size || onboardingJson.companySize || '1-10',
        foundedYear: companyData?.founded_year || onboardingJson.foundedYear,
        businessModel: onboardingJson.businessModel || 'Consulting',
        targetMarket: onboardingJson.targetMarket || 'Small business',
        growthStage: onboardingJson.growthStage || 'Growth phase',
        companyId: userProfile.company_id
      },
      goals: {
        primaryGoals: onboardingJson.primaryGoals || ['Improve efficiency'],
        businessChallenges: onboardingJson.businessChallenges || ['Time management'],
        successMetrics: onboardingJson.successMetrics || ['Increased productivity'],
        timeHorizon: onboardingJson.timeHorizon || '3-6 months'
      },
      tools: {
        currentTools: onboardingJson.currentTools || [],
        selectedIntegrations: onboardingJson.selectedIntegrations || [],
        preferredPlatforms: onboardingJson.preferredPlatforms || []
      },
      preferences: {
        communicationStyle: onboardingJson.communicationStyle || 'Direct and actionable',
        notificationPreferences: onboardingJson.notificationPreferences || ['Important updates'],
        automationLevel: onboardingJson.automationLevel || 'intermediate'
      }
    };
  }

  /**
   * Transform onboarding profile to brain context
   */
  private transformToBrainContext(profile: OnboardingUserProfile): BrainContextData {
    return {
      userProfile: profile,
      businessContext: {
        industry: profile.business.industry,
        size: profile.business.companySize,
        stage: profile.business.growthStage,
        model: profile.business.businessModel,
        market: profile.business.targetMarket
      },
      goals: {
        primary: profile.goals.primaryGoals,
        challenges: profile.goals.businessChallenges,
        metrics: profile.goals.successMetrics
      },
      tools: {
        current: profile.tools.currentTools,
        integrations: profile.tools.selectedIntegrations,
        platforms: profile.tools.preferredPlatforms
      },
      preferences: {
        communication: profile.preferences.communicationStyle,
        notifications: profile.preferences.notificationPreferences,
        automation: profile.preferences.automationLevel
      },
      recommendations: this.generateRecommendations(profile)
    };
  }

  /**
   * Generate personalized recommendations based on profile
   */
  private generateRecommendations(profile: OnboardingUserProfile) {
    const recommendations = {
      priorityActions: [] as string[],
      suggestedIntegrations: [] as string[],
      automationOpportunities: [] as string[]
    };

    // Priority actions based on goals and challenges
    if (profile.goals.primaryGoals.includes('Improve efficiency')) {
      recommendations.priorityActions.push('Set up workflow automation for repetitive tasks');
    }
    if (profile.goals.businessChallenges.includes('Time management')) {
      recommendations.priorityActions.push('Implement time tracking and productivity monitoring');
    }
    if (profile.business.growthStage === 'Growth phase') {
      recommendations.priorityActions.push('Scale operations with automated systems');
    }

    // Suggested integrations based on industry and size
    if (profile.business.industry === 'Technology') {
      recommendations.suggestedIntegrations.push('GitHub', 'Slack', 'Notion');
    }
    if (profile.business.companySize === '1-10') {
      recommendations.suggestedIntegrations.push('QuickBooks', 'HubSpot', 'Zapier');
    }

    // Automation opportunities based on preferences
    if (profile.preferences.automationLevel === 'intermediate') {
      recommendations.automationOpportunities.push('Email marketing automation', 'Customer onboarding workflows');
    }

    return recommendations;
  }

  /**
   * Build chat context enhancement
   */
  private buildChatEnhancement(context: BrainContextData, basePrompt?: string): ChatContextEnhancement {
    const userContext = `
User Profile: ${context.userProfile.personal.firstName} ${context.userProfile.personal.lastName}
Role: ${context.userProfile.personal.role} at ${context.userProfile.business.companyName}
Experience: ${context.userProfile.personal.experience} level
Learning Style: ${context.userProfile.personal.learningStyle}
Decision Authority: ${context.userProfile.personal.decisionAuthority}
    `.trim();

    const businessContext = `
Business Context:
- Company: ${context.businessContext.industry} industry, ${context.businessContext.size} employees
- Stage: ${context.businessContext.stage} phase
- Model: ${context.businessContext.model}
- Target Market: ${context.businessContext.market}
    `.trim();

    const goalsContext = `
Current Goals: ${context.goals.primary.join(', ')}
Key Challenges: ${context.goals.challenges.join(', ')}
Success Metrics: ${context.goals.metrics.join(', ')}
    `.trim();

    const toolsContext = `
Current Tools: ${context.tools.current.join(', ') || 'None specified'}
Selected Integrations: ${context.tools.integrations.join(', ') || 'None yet'}
    `.trim();

    const recommendations = `
Recommended Actions: ${context.recommendations.priorityActions.join(', ')}
Suggested Integrations: ${context.recommendations.suggestedIntegrations.join(', ')}
Automation Opportunities: ${context.recommendations.automationOpportunities.join(', ')}
    `.trim();

    const systemPrompt = `
${basePrompt || 'You are an AI assistant helping with business operations.'}

IMPORTANT CONTEXT - Use this information to provide personalized, relevant responses:

${userContext}

${businessContext}

${goalsContext}

${toolsContext}

${recommendations}

Always consider the user's specific business context, goals, and challenges when providing advice.
    `.trim();

    return {
      systemPrompt,
      userContext,
      businessContext,
      goalsContext,
      toolsContext,
      recommendations
    };
  }

  /**
   * Build personalized system prompt for specific agent types
   */
  private buildPersonalizedSystemPrompt(context: BrainContextData, agentType: string): string {
    const basePrompt = this.getAgentBasePrompt(agentType);
    const enhancement = this.buildChatEnhancement(context, basePrompt);
    return enhancement.systemPrompt;
  }

  /**
   * Get base prompt for different agent types
   */
  private getAgentBasePrompt(agentType: string): string {
    switch (agentType) {
      case 'executive':
        return 'You are an executive-level AI assistant with 20+ years of business experience. You provide strategic insights and high-level guidance.';
      case 'sales':
        return 'You are a sales expert AI assistant with deep knowledge of sales processes, CRM systems, and revenue optimization.';
      case 'finance':
        return 'You are a financial expert AI assistant specializing in business finance, accounting, and financial planning.';
      case 'operations':
        return 'You are an operations expert AI assistant focused on process optimization, automation, and operational efficiency.';
      case 'marketing':
        return 'You are a marketing expert AI assistant with expertise in digital marketing, campaigns, and customer acquisition.';
      default:
        return 'You are an AI assistant helping with business operations.';
    }
  }

  /**
   * Get default system prompt when no context is available
   */
  private getDefaultSystemPrompt(agentType: string): string {
    return this.getAgentBasePrompt(agentType);
  }
}

// Export singleton instance
export const onboardingBrainIntegration = OnboardingBrainIntegrationService.getInstance();
