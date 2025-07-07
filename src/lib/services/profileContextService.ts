import { supabase } from '../core/supabase';
import type { EnhancedUserContext } from '../ai/contextualRAG';

/**
 * Profile Context Service
 * Manages profile data specifically for RAG system context generation
 */

export interface RAGProfileContext {
  // Core Identity
  id: string;
  email: string;
  name: string;
  display_name?: string;
  avatar_url?: string;
  
  // Business Role Context
  role: 'owner' | 'admin' | 'manager' | 'user';
  job_title?: string;
  department?: string;
  company_id?: string;
  
  // RAG-Specific Context Fields
  experience_level: 'beginner' | 'intermediate' | 'advanced';
  communication_style: 'direct' | 'detailed' | 'visual';
  primary_responsibilities: string[];
  current_pain_points: string[];
  immediate_goals: string;
  success_metrics: string[];
  time_availability: 'low' | 'medium' | 'high';
  collaboration_frequency: 'solo' | 'small-team' | 'cross-functional';
  
  // Business Context
  automation_maturity: 'none' | 'basic' | 'intermediate' | 'advanced';
  business_priorities: string[];
  success_timeframe: string;
  key_tools: string[];
  data_sources: string[];
  
  // Learning Preferences
  learning_preferences: string[];
  decision_making_style: 'analytical' | 'intuitive' | 'collaborative';
  information_depth_preference: 'summary' | 'detailed' | 'comprehensive';
  
  // Completion Tracking
  profile_completion_percentage: number;
  context_quality_score: number;
  last_context_update: string;
}

export type ProfileContextUpdate = {
  // Allow partial updates to any field
  [K in keyof RAGProfileContext]?: RAGProfileContext[K];
}

export interface OnboardingQuestion {
  field: keyof RAGProfileContext;
  question: string;
  options?: string[];
  placeholder?: string;
}

class ProfileContextService {
  /**
   * Get complete RAG context for a user
   */
  async getUserRAGContext(userId: string): Promise<RAGProfileContext | null> {
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select(`
          *,
          companies (
            id,
            name,
            industry,
            size,
            description
          )
        `)
        .eq('id', userId)
        .single();

      if (error || !profile) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return this.mapToRAGContext(profile);
    } catch (error) {
      console.error('Error in getUserRAGContext:', error);
      return null;
    }
  }

  /**
   * Update RAG-specific context fields
   */
  async updateRAGContext(userId: string, updates: ProfileContextUpdate): Promise<boolean> {
    try {
      // Calculate new completion percentage
      const currentContext = await this.getUserRAGContext(userId);
      const updatedContext = { ...currentContext, ...updates };
      const completionPercentage = this.calculateCompletionPercentage(updatedContext);
      const qualityScore = this.calculateContextQualityScore(updatedContext);

      const { error } = await supabase
        .from('user_profiles')
        .update({
          ...updates,
          profile_completion_percentage: completionPercentage,
          context_quality_score: qualityScore,
          last_context_update: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('Error updating RAG context:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateRAGContext:', error);
      return false;
    }
  }

  /**
   * Get missing context fields for guided completion
   */
  async getMissingContextFields(userId: string): Promise<{
    critical: string[];
    important: string[];
    optional: string[];
  }> {
    const context = await this.getUserRAGContext(userId);
    if (!context) {
      return {
        critical: ['name', 'role', 'department'],
        important: ['job_title', 'experience_level', 'communication_style'],
        optional: ['bio', 'skills', 'location']
      };
    }

    const critical: string[] = [];
    const important: string[] = [];
    const optional: string[] = [];

    // Critical fields for basic RAG functionality
    if (!context.name || context.name === 'User') critical.push('name');
    if (!context.role || context.role === 'user') critical.push('role');
    if (!context.department) critical.push('department');
    if (!context.job_title) critical.push('job_title');

    // Important fields for good personalization
    if (!context.experience_level) important.push('experience_level');
    if (!context.communication_style) important.push('communication_style');
    if (!context.immediate_goals) important.push('immediate_goals');
    if (!context.primary_responsibilities?.length) important.push('primary_responsibilities');

    // Optional fields for excellent personalization
    if (!context.current_pain_points?.length) optional.push('current_pain_points');
    if (!context.success_metrics?.length) optional.push('success_metrics');
    if (!context.key_tools?.length) optional.push('key_tools');
    if (!context.business_priorities?.length) optional.push('business_priorities');

    return { critical, important, optional };
  }

  /**
   * Generate personalized onboarding questions based on role/department
   */
  getContextualOnboardingQuestions(role?: string, department?: string): OnboardingQuestion[] {
    const baseQuestions: OnboardingQuestion[] = [
      {
        field: 'experience_level' as keyof RAGProfileContext,
        question: 'How would you describe your experience with business intelligence tools?',
        options: ['beginner', 'intermediate', 'advanced']
      },
      {
        field: 'communication_style' as keyof RAGProfileContext,
        question: 'How do you prefer to receive information?',
        options: ['direct', 'detailed', 'visual']
      },
      {
        field: 'time_availability' as keyof RAGProfileContext,
        question: 'How much time do you typically have for reviewing insights?',
        options: ['low', 'medium', 'high']
      }
    ];

    // Add role-specific questions
    if (role === 'admin' || role === 'owner') {
      baseQuestions.push({
        field: 'business_priorities' as keyof RAGProfileContext,
        question: 'What are your top 3 business priorities this quarter?',
        placeholder: 'e.g., Increase revenue, Improve efficiency, Expand team'
      });
    }

    // Add department-specific questions
    if (department === 'sales') {
      baseQuestions.push({
        field: 'current_pain_points' as keyof RAGProfileContext,
        question: 'What are your biggest challenges in sales right now?',
        placeholder: 'e.g., Lead qualification, Pipeline management, Closing deals'
      });
    }

    return baseQuestions;
  }

  /**
   * Calculate profile completion percentage
   */
  private calculateCompletionPercentage(context: Partial<RAGProfileContext>): number {
    const criticalFields = ['name', 'role', 'department', 'job_title'];
    const importantFields = ['experience_level', 'communication_style', 'immediate_goals'];
    const optionalFields = ['current_pain_points', 'success_metrics', 'key_tools'];

    const criticalWeight = 50; // 50% weight
    const importantWeight = 30; // 30% weight
    const optionalWeight = 20;  // 20% weight

    const criticalCompleted = criticalFields.filter(field => 
      context[field as keyof RAGProfileContext] && 
      context[field as keyof RAGProfileContext] !== ''
    ).length;
    
    const importantCompleted = importantFields.filter(field => 
      context[field as keyof RAGProfileContext] && 
      context[field as keyof RAGProfileContext] !== ''
    ).length;
    
    const optionalCompleted = optionalFields.filter(field => {
      const value = context[field as keyof RAGProfileContext];
      return value && (Array.isArray(value) ? value.length > 0 : value !== '');
    }).length;

    const criticalScore = (criticalCompleted / criticalFields.length) * criticalWeight;
    const importantScore = (importantCompleted / importantFields.length) * importantWeight;
    const optionalScore = (optionalCompleted / optionalFields.length) * optionalWeight;

    return Math.round(criticalScore + importantScore + optionalScore);
  }

  /**
   * Calculate context quality score for RAG effectiveness
   */
  private calculateContextQualityScore(context: Partial<RAGProfileContext>): number {
    let score = 0;

    // Basic info quality (25 points)
    if (context.name && context.name !== 'User') score += 5;
    if (context.role && context.role !== 'user') score += 5;
    if (context.department) score += 5;
    if (context.job_title) score += 5;
    if (context.company_id) score += 5;

    // RAG context quality (50 points)
    if (context.experience_level) score += 10;
    if (context.communication_style) score += 10;
    if (context.immediate_goals) score += 10;
    if (context.primary_responsibilities?.length) score += 10;
    if (context.current_pain_points?.length) score += 10;

    // Business context quality (25 points)
    if (context.automation_maturity) score += 5;
    if (context.business_priorities?.length) score += 5;
    if (context.success_timeframe) score += 5;
    if (context.key_tools?.length) score += 5;
    if (context.success_metrics?.length) score += 5;

    return Math.min(score, 100);
  }

  /**
   * Map database profile to RAG context format
   */
  private mapToRAGContext(profile: any): RAGProfileContext {
    const preferences = typeof profile.preferences === 'object' ? profile.preferences : {};
    const ragContext = typeof profile.rag_context === 'object' ? profile.rag_context : {};

    return {
      // Core Identity
      id: profile.id,
      email: profile.email || '',
      name: profile.first_name || profile.display_name || profile.name || 'User',
      display_name: profile.display_name,
      avatar_url: profile.avatar_url,

      // Business Role Context
      role: profile.role || 'user',
      job_title: profile.job_title,
      department: profile.department,
      company_id: profile.company_id,

      // RAG-Specific Context Fields (with defaults)
      experience_level: ragContext.experience_level || 'intermediate',
      communication_style: ragContext.communication_style || 'direct',
      primary_responsibilities: ragContext.primary_responsibilities || [],
      current_pain_points: ragContext.current_pain_points || [],
      immediate_goals: ragContext.immediate_goals || '',
      success_metrics: ragContext.success_metrics || [],
      time_availability: ragContext.time_availability || 'medium',
      collaboration_frequency: ragContext.collaboration_frequency || 'small-team',

      // Business Context
      automation_maturity: ragContext.automation_maturity || 'basic',
      business_priorities: ragContext.business_priorities || [],
      success_timeframe: ragContext.success_timeframe || '3 months',
      key_tools: ragContext.key_tools || [],
      data_sources: ragContext.data_sources || [],

      // Learning Preferences
      learning_preferences: ragContext.learning_preferences || [],
      decision_making_style: ragContext.decision_making_style || 'analytical',
      information_depth_preference: ragContext.information_depth_preference || 'detailed',

      // Completion Tracking
      profile_completion_percentage: profile.profile_completion_percentage || 0,
      context_quality_score: profile.context_quality_score || 0,
      last_context_update: profile.last_context_update || profile.updated_at || new Date().toISOString()
    };
  }

  /**
   * Convert RAG context to Enhanced User Context for RAG system
   */
  convertToEnhancedUserContext(ragContext: RAGProfileContext, companyData?: any): EnhancedUserContext {
    return {
      profile: {
        id: ragContext.id,
        email: ragContext.email,
        name: ragContext.name,
        role: ragContext.role,
        department: ragContext.department || 'General',
        company_id: ragContext.company_id || '',
        permissions: [], // TODO: Implement permissions
        preferences: {},
        experience_level: ragContext.experience_level,
        communication_style: ragContext.communication_style,
        primary_responsibilities: ragContext.primary_responsibilities,
        current_pain_points: ragContext.current_pain_points,
        immediate_goals: ragContext.immediate_goals,
        success_metrics: ragContext.success_metrics,
        time_availability: ragContext.time_availability,
        collaboration_frequency: ragContext.collaboration_frequency
      },
      activity: {
        recent_pages: [], // TODO: Implement activity tracking
        frequent_actions: [],
        last_active: new Date().toISOString(),
        session_duration: 0,
        total_sessions: 0,
        most_used_features: [],
        skill_level: ragContext.experience_level
      },
      business_context: {
        company_name: companyData?.name || 'Your Company',
        industry: companyData?.industry || 'Technology',
        company_size: companyData?.size || 'Medium',
        business_model: 'B2B', // TODO: Make configurable
        revenue_stage: 'growth', // TODO: Make configurable
        growth_stage: 'growth',
        fiscal_year_end: '12-31', // TODO: Make configurable
        key_metrics: {},
        primary_departments: [ragContext.department || 'General'],
        key_tools: ragContext.key_tools,
        data_sources: ragContext.data_sources,
        automation_maturity: ragContext.automation_maturity,
        business_priorities: ragContext.business_priorities,
        success_timeframe: ragContext.success_timeframe
      },
      success_criteria: {
        primary_success_metric: ragContext.success_metrics[0] || 'Business Growth',
        secondary_metrics: ragContext.success_metrics.slice(1),
        time_savings_goal: '2 hours per day', // TODO: Make configurable
        roi_expectation: '300%', // TODO: Make configurable
        usage_frequency: 'daily', // TODO: Track actual usage
        success_scenarios: [],
        failure_conditions: [],
        immediate_wins: [],
        long_term_vision: ragContext.immediate_goals
      }
    };
  }
}

export const profileContextService = new ProfileContextService(); 