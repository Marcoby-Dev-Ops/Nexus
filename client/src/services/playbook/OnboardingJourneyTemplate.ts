/**
 * Onboarding Journey Template
 * 
 * Converts the comprehensive onboarding flow into a journey that feeds into the unified brain.
 * This journey collects all the business knowledge needed to train the AI about the user.
 */

import type { JourneyTemplate, JourneyItem } from './JourneyTypes';

// ============================================================================
// ONBOARDING JOURNEY TEMPLATE
// ============================================================================

export const ONBOARDING_PLAYBOOK_TEMPLATE_ID = '550e8400-e29b-41d4-a716-446655440000';

/**
 * Generate the foundation journey template
 */
export function generateOnboardingPlaybookTemplate(): JourneyTemplate {
  return {
         id: ONBOARDING_PLAYBOOK_TEMPLATE_ID,
    title: 'Foundation Journey - Your Business Brain Setup',
    description: 'Complete your business profile to train Nexus AI with your unique context and goals. This journey establishes your foundation for expert-level business guidance.',
    version: '1.0.0',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    playbook_id: '550e8400-e29b-41d4-a716-446655440000',
    estimated_duration_minutes: 15,
    complexity: 'beginner',
    prerequisites: [],
    success_metrics: [
      'Complete business profile established',
      'Unified brain trained with user context',
      'Personalized AI guidance activated',
      'Business intelligence foundation ready'
    ],
    category: 'onboarding',
    tags: ['foundation', 'brain-training', 'profile-setup', 'ai-context'],
    status: 'active',
    maturity_framework_id: 'business-foundation-framework'
  };
}

/**
 * Generate onboarding journey items
 */
export function generateOnboardingPlaybookItems(): JourneyItem[] {
  return [
    {
      id: 'welcome-brain-introduction',
      title: 'Welcome to Your Business Brain',
      description: 'Meet Nexus AI and understand how it will transform your business operations with expert-level guidance.',
      step_type: 'introduction',
      estimated_duration_minutes: 2,
      is_required: true,
      order: 1,
      metadata: {
        brain_introduction: true,
        expert_knowledge_preview: true,
        transformation_promise: true
      }
    },
    {
      id: 'personal-identity-setup',
      title: 'Tell Us About You',
      description: 'Help us personalize your experience by sharing your name and role.',
      step_type: 'form',
      estimated_duration_minutes: 2,
      is_required: true,
      order: 2,
      validation_schema: {
        firstName: { type: 'string', required: true, minLength: 2 },
        lastName: { type: 'string', required: true, minLength: 2 },
        role: { type: 'string', required: false },
        phone: { type: 'string', required: false }
      },
      metadata: {
        personal_identity: true,
        brain_training_data: true,
        user_context: true
      }
    },
    {
      id: 'business-context-setup',
      title: 'Tell Us About Your Business',
      description: 'Share your company details so we can provide industry-specific insights and best practices.',
      step_type: 'form',
      estimated_duration_minutes: 3,
      is_required: true,
      order: 3,
      validation_schema: {
        companyName: { type: 'string', required: true, minLength: 2 },
        businessType: { type: 'string', required: true },
        industry: { type: 'string', required: true },
        companySize: { type: 'string', required: true }
      },
      metadata: {
        business_context: true,
        industry_context: true,
        business_intelligence: true
      }
    },
    {
      id: 'business-strategy-enrichment',
      title: 'Business Goals & Challenges (Optional)',
      description: 'Help us understand your priorities and challenges to provide more targeted guidance.',
      step_type: 'form',
      estimated_duration_minutes: 3,
      is_required: false,
      order: 4,
      validation_schema: {
        businessModel: { type: 'string', required: false },
        growthStage: { type: 'string', required: false },
        priorities: { type: 'array', required: false },
        challenges: { type: 'array', required: false },
        targetMarket: { type: 'string', required: false }
      },
      metadata: {
        business_strategy: true,
        goals_priorities: true,
        challenge_identification: true,
        optional_enrichment: true
      }
    },
    {
      id: 'brain-training-activation',
      title: 'Activate Your Business Brain',
      description: 'See how Nexus AI analyzes your business context and provides expert-level insights tailored to your situation.',
      step_type: 'demo',
      estimated_duration_minutes: 2,
      is_required: true,
      order: 5,
      metadata: {
        brain_demo: true,
        ai_analysis: true,
        expert_insights: true,
        personalized_guidance: true
      }
    },
    {
      id: 'transformation-preview',
      title: 'Your Transformation Journey',
      description: 'Preview how Nexus will transform your business operations and accelerate your path to expert-level decision making.',
      step_type: 'preview',
      estimated_duration_minutes: 2,
      is_required: true,
      order: 6,
      metadata: {
        transformation_preview: true,
        success_metrics: true,
        learning_path: true,
        confidence_building: true
      }
    }
  ];
}

/**
 * Get brain training data from onboarding responses
 */
export function extractBrainTrainingData(responses: Record<string, any>): Record<string, any> {
  return {
    // Personal Identity Intelligence
    personal_intelligence: {
      first_name: responses.firstName,
      last_name: responses.lastName,
      full_name: `${responses.firstName} ${responses.lastName}`,
      role: responses.role,
      contact_info: {
        phone: responses.phone
      }
    },

    // Business Context Intelligence
    business_context_intelligence: {
      company_name: responses.companyName,
      business_type: responses.businessType,
      industry: responses.industry,
      company_size: responses.companySize
    },

    // Business Strategy Intelligence (Optional)
    strategy_intelligence: responses.businessModel ? {
      business_model: responses.businessModel,
      growth_stage: responses.growthStage,
      target_market: responses.targetMarket,
      business_priorities: responses.priorities,
      current_challenges: responses.challenges
    } : null,

    // AI Training Context
    ai_training_context: {
      expertise_domains: determineExpertiseDomains(responses),
      guidance_level: determineGuidanceLevel(responses),
      business_complexity: determineBusinessComplexity(responses),
      data_completeness: determineDataCompleteness(responses)
    }
  };
}

/**
 * Determine which expertise domains to activate based on responses
 */
function determineExpertiseDomains(responses: Record<string, any>): string[] {
  const domains = [];

  // Always include core domains
  domains.push('business_fundamentals', 'strategy_planning');

  // Add domain-specific expertise based on responses
  if (responses.businessType === 'startup') {
    domains.push('startup_growth', 'fundraising', 'product_development');
  }
  
  if (responses.industry) {
    domains.push(`${responses.industry}_expertise`);
  }

  if (responses.priorities?.includes('Get more customers')) {
    domains.push('sales_strategy', 'marketing_strategy');
  }

  if (responses.priorities?.includes('Keep existing customers happy')) {
    domains.push('customer_success', 'retention_strategy');
  }

  if (responses.priorities?.includes('Make more money from each customer')) {
    domains.push('revenue_optimization', 'pricing_strategy');
  }

  return domains;
}

/**
 * Determine guidance level based on available data
 */
function determineGuidanceLevel(responses: Record<string, any>): string {
  // Default to adaptive guidance since we don't collect experience level
  return 'adaptive_guidance';
}

/**
 * Determine business complexity level
 */
function determineBusinessComplexity(responses: Record<string, any>): string {
  const size = responses.companySize;
  const type = responses.businessType;
  
  if (size === 'enterprise' || type === 'enterprise') {
    return 'high_complexity';
  } else if (size === 'large' || type === 'medium-business') {
    return 'medium_complexity';
  } else {
    return 'low_complexity';
  }
}

/**
 * Determine data completeness level
 */
function determineDataCompleteness(responses: Record<string, any>): string {
  const hasBasicInfo = responses.firstName && responses.lastName && responses.companyName;
  const hasBusinessContext = responses.businessType && responses.industry && responses.companySize;
  const hasStrategy = responses.businessModel && responses.growthStage;
  
  if (hasBasicInfo && hasBusinessContext && hasStrategy) {
    return 'complete_profile';
  } else if (hasBasicInfo && hasBusinessContext) {
    return 'basic_profile';
  } else if (hasBasicInfo) {
    return 'minimal_profile';
  } else {
    return 'incomplete_profile';
  }
}
