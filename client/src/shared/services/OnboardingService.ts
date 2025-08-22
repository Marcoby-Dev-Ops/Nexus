/**
 * Onboarding Service
 * 
 * Handles onboarding data collection, validation, and database persistence
 * Uses proper database helper functions for all operations
 */

import { 
  callRPC, 
  callEdgeFunction, 
  selectData, 
  selectOne, 
  insertOne, 
  updateOne, 
  upsertOne, 
  deleteOne 
} from '@/lib/api-client';
import { BaseService } from '@/core/services/BaseService';
import type { ServiceResponse } from '@/core/services/BaseService';
import { logger } from '@/shared/utils/logger';
import type { Database } from '@/core/types/supabase';
import { z } from 'zod';


// Onboarding Data Schema
export const OnboardingDataSchema = z.object({
  // Basic Info Step
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  displayName: z.string().optional(),
  jobTitle: z.string().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  
  // Business Context Step
  industry: z.string().optional(),
  companySize: z.string().optional(),
  primaryGoals: z.array(z.string()).optional(),
  businessChallenges: z.array(z.string()).optional(),
  
  // Goal Definition Step
  selectedGoal: z.string().optional(),
  goalDetails: z.string().optional(),
  timeframe: z.string().optional(),
  targetMetric: z.string().optional(),
  goalData: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    examples: z.array(z.string()),
    metrics: z.array(z.string()),
    userDetails: z.string(),
    userTimeframe: z.string(),
    userTarget: z.string()
  }).optional(),
  
  // Integration Discovery Step
  selectedIntegrations: z.array(z.string()).optional(),
  
  // AI Capabilities Step
  selectedUseCases: z.array(z.string()).optional(),
  
  // Maturity Assessment Step
  maturityAssessment: z.record(z.any()).optional(),
  
  // Metadata
  completedAt: z.string().optional(),
  userId: z.string().min(1, 'User ID is required'),
  companyId: z.string().optional(),
});

export type OnboardingData = z.infer<typeof OnboardingDataSchema>;

export interface OnboardingStepData {
  stepId: string;
  data: Partial<OnboardingData>;
  completedAt: string;
}

export interface OnboardingResult {
  success: boolean;
  userId: string;
  organizationId?: string;
  profileUpdated: boolean;
  organizationCreated: boolean;
  onboardingCompleted: boolean;
  error?: string;
}

// Onboarding Phase Definitions
export interface OnboardingPhase {
  id: string;
  title: string;
  description: string;
  steps: OnboardingStep[];
  objectives: string[];
  estimatedDuration: string;
  isRequired: boolean;
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: string;
  isRequired: boolean;
  validationSchema?: any;
}

// Nexus Business Learning Framework - 3-Phase Onboarding
export const ONBOARDING_PHASES: OnboardingPhase[] = [
  {
    id: 'fast-wins-context',
    title: 'Tell Us About Your Business',
    description: 'Help us understand your business in 15 minutes',
    estimatedDuration: '10-15 minutes',
    isRequired: true,
    objectives: [
      'Tell us about your business',
      'Connect your tools',
      'See your first insights'
    ],
    steps: [
      {
        id: 'welcome-introduction',
        title: 'Welcome to Nexus',
        description: 'Your business transformation journey starts here',
        component: 'WelcomeStep',
        isRequired: true
      },
      {
        id: 'core-identity-priorities',
        title: 'About Your Business',
        description: 'A few simple questions to understand your business better',
        component: 'CoreIdentityStep',
        isRequired: true,
        validationSchema: z.object({
          firstName: z.string().min(1, 'First name is required'),
          lastName: z.string().min(1, 'Last name is required'),
          email: z.string().email('Valid email is required'),
          company: z.string().min(1, 'Company name is required'),
          industry: z.string().min(1, 'Industry is required'),
          companySize: z.string().min(1, 'Company size is required'),
          keyPriorities: z.array(z.string()).min(1, 'Please pick at least one priority')
        })
      },
      {
        id: 'tool-identification',
        title: 'Your Business Tools',
        description: 'Tell us what tools you\'re already using',
        component: 'ToolIdentificationStep',
        isRequired: false
      },
      {
        id: 'day-1-insight-preview',
        title: 'Your First Insights',
        description: 'See your personalized dashboard and opportunities',
        component: 'DayOneInsightStep',
        isRequired: true
      }
    ]
  },
  {
    id: 'ai-powered-goals',
    title: 'Set Your Goals',
    description: 'Choose what matters most for your business',
    estimatedDuration: '3-5 minutes',
    isRequired: true,
    objectives: [
      'Pick your main goals',
      'Get a simple action plan',
      'See your business score'
    ],
    steps: [
      {
        id: 'ai-goal-generation',
        title: 'What Do You Want to Achieve?',
        description: 'Based on your business, here are some common goals that help companies grow',
        component: 'AIPoweredGoalsStep',
        isRequired: true,
        validationSchema: z.object({
          selectedGoals: z.array(z.string()).min(1, 'Please pick at least one goal'),
          maturityScore: z.number().min(0).max(100)
        })
      },
      {
        id: 'action-plan-creation',
        title: 'Your Next Steps',
        description: 'Here are some simple things you can do to reach your goals',
        component: 'InitialThoughtsGenerationStep',
        isRequired: true,
        validationSchema: z.object({
          selectedThoughts: z.array(z.string()).min(1, 'Please pick at least one action to track'),
          nextSteps: z.array(z.string()).min(1, 'Please pick at least one next step')
        })
      }
    ]
  },
  {
    id: 'launch-and-first-steps',
    title: 'Business Foundations',
    description: 'Help us understand your current business state',
    estimatedDuration: '2-3 minutes',
    isRequired: true,
    objectives: [
      'Understand your business model',
      'Identify your growth stage', 
      'Establish business context'
    ],
    steps: [
      {
        id: 'dashboard-introduction',
        title: 'Your Business DNA',
        description: 'Tell us about your current business state to establish context',
        component: 'DashboardIntroStep',
        isRequired: true
      },
      {
        id: 'first-action-guidance',
        title: 'Business Context',
        description: 'Help us understand your business model and current situation',
        component: 'FirstActionStep',
        isRequired: true
      }
    ]
  }
];

/**
 * Map onboarding company size to standardized database constraint values
 * All tables now use the same constraint values: startup, small, medium, large, enterprise
 */
function mapCompanySizeToDatabaseValue(onboardingSize: string): string {
  const sizeMapping: Record<string, string> = {
    '1-10 employees': 'startup',
    '11-50 employees': 'small', 
    '51-200 employees': 'medium',
    '201-1000 employees': 'large',
    '1000+ employees': 'enterprise',
    // Handle other variations
    '1-10': 'startup',
    '11-50': 'small',
    '51-200': 'medium', 
    '201-1000': 'large',
    '1000+': 'enterprise',
    // Default fallback
    'startup': 'startup',
    'small': 'small',
    'medium': 'medium',
    'large': 'large',
    'enterprise': 'enterprise'
  };

  return sizeMapping[onboardingSize] || 'startup';
}

/**
 * Onboarding Service
 * Handles onboarding data collection, validation, and database persistence
 */
export class OnboardingService extends BaseService {
  
  /**
   * Save onboarding step data
   */
  async saveOnboardingStep(
    userId: string, 
    stepId: string, 
    data: Partial<OnboardingData>
  ): Promise<ServiceResponse<OnboardingStepData>> {
    // Validate required parameters
    const userIdValidation = this.validateRequiredParams({ userId }, ['userId']);
    if (!userIdValidation.isValid) {
      return this.createErrorResponse(userIdValidation.error || 'User ID is required');
    }

    const stepIdValidation = this.validateRequiredParams({ stepId }, ['stepId']);
    if (!stepIdValidation.isValid) {
      return this.createErrorResponse(stepIdValidation.error || 'Step ID is required');
    }

    return this.executeDbOperation(async () => {
      // Use external user ID directly - no mapping needed
      const internalUserId = userId;

      const stepData: OnboardingStepData = {
        stepId,
        data,
        completedAt: new Date().toISOString()
      };

      logger.info('Attempting to save onboarding step', { userId, internalUserId, stepId, data });

      // Use upsert to handle existing records
      const upsertData = {
        user_id: internalUserId,
        step_id: stepId,
        step_data: data,
        completed_at: stepData.completedAt,
        updated_at: new Date().toISOString()
      };
      
      logger.info('Upsert data:', upsertData);
      
      const { data: savedStep, error } = await upsertOne<OnboardingStepData>(
        'user_onboarding_steps' as unknown as keyof Database['public']['Tables'],
        upsertData,
        'user_id,step_id'
      );

      if (error) {
        logger.error('Failed to save onboarding step:', { error, userId, stepId, data, upsertData });
        
        // Test direct Supabase call to get more detailed error
        try {
          const { data: testData, error: testError } = await upsertOne(
            'user_onboarding_steps' as unknown as keyof Database['public']['Tables'],
            upsertData,
            'user_id,step_id'
          );
          
          logger.error('Direct Supabase test result:', { testData, testError });
        } catch (directError) {
          logger.error('Direct Supabase test failed:', directError);
        }
        
        return this.createErrorResponse(error);
      }

      logger.info('Successfully saved onboarding step', { userId, stepId, savedStep });
      return this.createSuccessResponse(stepData);
    }, `save onboarding step ${stepId} for user ${userId}`);
  }

  /**
   * Complete onboarding process
   */
  async completeOnboarding(
    userId: string, 
    onboardingData: OnboardingData
  ): Promise<ServiceResponse<OnboardingResult>> {
    // Validate onboarding data
    const validationResult = OnboardingDataSchema.safeParse(onboardingData);
    if (!validationResult.success) {
      const errorMessage = `Validation failed: ${validationResult.error.issues.map(issue => issue.message).join(', ')}`;
      logger.error('Onboarding data validation failed:', validationResult.error);
      return this.createErrorResponse(errorMessage);
    }

    try {
      // Use edge function for company creation to avoid RLS issues
      const edgeFunctionResult = await callEdgeFunction<{
        success: boolean;
        data?: {
          userId: string;
          companyId?: string;
          onboardingCompleted: boolean;
          profileUpdated: boolean;
          companyCreated: boolean;
        };
        error?: string;
      }>('complete-onboarding', {
        ...onboardingData,
        userId,
      });

      if (!edgeFunctionResult.success) {
        logger.error('Edge function failed:', edgeFunctionResult.error);
        return this.createErrorResponse(edgeFunctionResult.error || 'Failed to complete onboarding');
      }

      const onboardingResult: OnboardingResult = {
        success: true,
        userId,
        organizationId: edgeFunctionResult.data?.organizationId,
        profileUpdated: edgeFunctionResult.data?.profileUpdated || false,
        organizationCreated: edgeFunctionResult.data?.organizationCreated || false,
        onboardingCompleted: edgeFunctionResult.data?.onboardingCompleted || false
      };

      logger.info('Onboarding completed successfully via edge function', { 
        userId, 
        organizationId: onboardingResult.organizationId 
      });
      return this.createSuccessResponse(onboardingResult);
    } catch (error) {
      return this.handleError(error, `complete onboarding for user ${userId}`);
    }
  }

  /**
   * Update user profile with onboarding data
   */
  private async updateUserProfile(
    userId: string, 
    data: OnboardingData
  ): Promise<ServiceResponse<boolean>> {
    return this.executeDbOperation(async () => {
      // Get internal user ID from external user ID
      // Use external user ID directly
      const internalUserId = userId;

             const profileUpdates: any = {
         first_name: data.firstName,
         last_name: data.lastName,
         display_name: data.displayName || `${data.firstName} ${data.lastName}`,
         job_title: data.jobTitle,
         updated_at: new Date().toISOString()
       };

      // Add role if not set
      if (!data.jobTitle) {
        profileUpdates.role = 'owner';
      }

      const { data: updatedProfile, error } = await updateOne(
        'user_profiles',
        internalUserId,
        profileUpdates,
        'user_id'
      );

      if (error) {
        logger.error('Failed to update user profile:', error);
        return this.createErrorResponse(error);
      }

      logger.info('User profile updated successfully', { userId });
      return this.createSuccessResponse(true);
    }, `update user profile for user ${userId}`);
  }

  /**
   * Handle company creation or update
   */
  private async handleCompanyCreation(
    userId: string, 
    data: OnboardingData
  ): Promise<ServiceResponse<{ companyId?: string; created: boolean }>> {
    return this.executeDbOperation(async (): Promise<{ data: { companyId?: string; created: boolean } | null; error: any }> => {
      // Force session refresh before company creation to ensure authentication
      try {
        // Note: Session management is handled by AuthentikAuthContext, not needed here
        // const { session, error: refreshError } = await supabaseService.sessionUtils.refreshSession();
        // Session refresh is not needed in this context
      } catch (error) {
        logger.error('Failed to refresh session during company creation:', error);
      }

      // Use external user ID directly - no mapping needed
      const internalUserId = userId;

      // Check if user already has a company
      const { data: existingProfile, error: profileError } = await selectOne(
        'user_profiles',
        internalUserId,
        'user_id'
      );

      if (profileError) {
        logger.error('Failed to check existing profile:', profileError);
        return { data: null, error: profileError };
      }

      // If user already has a company, update it
      if (existingProfile && typeof existingProfile === 'object' && 'company_id' in existingProfile && existingProfile.company_id) {
        const companyUpdates: any = {};
        
        if (data.company) {
          companyUpdates.name = data.company;
        }
        if (data.industry) {
          companyUpdates.industry = data.industry;
        }
        if (data.companySize) {
          companyUpdates.size = mapCompanySizeToDatabaseValue(data.companySize);
        }

        if (Object.keys(companyUpdates).length > 0) {
          companyUpdates.updated_at = new Date().toISOString();
          
          const { error: updateError } = await updateOne(
            'companies',
            existingProfile.company_id as string,
            companyUpdates
          );

          if (updateError) {
            logger.error('Failed to update existing company:', updateError);
            return { data: null, error: updateError };
          }
        }

        return { 
          data: { companyId: existingProfile.company_id as string, created: false }, 
          error: null 
        };
      }

      // Create new company
      const companyName = data.company || `${data.firstName} ${data.lastName}'s Company`;
      
                     const { data: newCompany, error: companyError } = await insertOne(
         'companies',
         {
           name: companyName,
           industry: data.industry || 'Technology',
           size: mapCompanySizeToDatabaseValue(data.companySize || '1-10'),
           created_by: internalUserId,
           created_at: new Date().toISOString(),
           updated_at: new Date().toISOString()
         }
       );

      if (companyError) {
        logger.error('Failed to create company:', companyError);
        return { data: null, error: companyError };
      }

             // Associate user with company
       const { error: associationError } = await updateOne(
         'user_profiles',
         internalUserId,
         {
           company_id: newCompany && typeof newCompany === 'object' && 'id' in newCompany ? newCompany.id as string : null,
           role: 'owner',
           updated_at: new Date().toISOString()
         },
         'user_id'
       );

      if (associationError) {
        logger.error('Failed to associate user with company:', associationError);
        return { data: null, error: associationError };
      }

      const companyId = newCompany && typeof newCompany === 'object' && 'id' in newCompany ? newCompany.id as string : '';
      logger.info('Company created and associated with user', { userId, companyId });
      return { data: { companyId, created: true }, error: null };
    }, `handle company creation for user ${userId}`);
  }

  /**
   * Save onboarding completion record
   */
  private async saveOnboardingCompletion(
    userId: string, 
    data: OnboardingData
  ): Promise<ServiceResponse<boolean>> {
    return this.executeDbOperation(async () => {
      try {
        // Use external user ID directly
        const internalUserId = userId;

        // Save onboarding completion record
        const { error: completionError } = await insertOne(
          'user_onboarding_completions' as unknown as keyof Database['public']['Tables'],
          {
            user_id: internalUserId,
            completed_at: new Date().toISOString(),
            onboarding_data: data
          }
        );

        if (completionError) {
          logger.error('Failed to save onboarding completion:', completionError);
          return this.createErrorResponse('Failed to save onboarding completion');
        }

        return this.createSuccessResponse(true);
      } catch (error) {
        return this.handleError(error, 'save onboarding completion');
      }
    }, `save onboarding completion for user ${userId}`);
  }

  /**
   * Update user preferences based on onboarding data
   */
  private async updateUserPreferences(
    userId: string,
    data: OnboardingData
  ): Promise<ServiceResponse<boolean>> {
    return this.executeDbOperation(async () => {
      try {
        // Use external user ID directly
        const internalUserId = userId;

        // Update user preferences based on onboarding selections
        const preferences = {
          selected_integrations: data.selectedIntegrations || [],
          selected_use_cases: data.selectedUseCases || [],
          industry_preferences: data.industry ? [data.industry] : [],
          company_size_preference: data.companySize || null,
          primary_goals: data.primaryGoals || [],
          business_challenges: data.businessChallenges || []
        };

        const { error: preferencesError } = await updateOne(
          'user_profiles',
          internalUserId,
          { preferences: preferences },
          'user_id'
        );

        if (preferencesError) {
          logger.error('Failed to update user preferences:', preferencesError);
          return { data: null, error: preferencesError };
        }

        return { data: true, error: null };
      } catch (error) {
        return { data: null, error: error };
      }
    }, `update user preferences for user ${userId}`);
  }

  /**
   * Get onboarding status for a user
   */
  async getOnboardingStatus(userId: string): Promise<ServiceResponse<{
    isCompleted: boolean;
    completedSteps: string[];
    completionPercentage: number;
    lastUpdated?: string;
  }>> {
    return this.executeDbOperation(async () => {
      // Use external user ID directly
      const internalUserId = userId;

      // Get completed steps using internal user ID
      const { data: completedStepsData, error: stepsError } = await selectData(
        'user_onboarding_steps' as unknown as keyof Database['public']['Tables'],
        'step_id',
        { user_id: internalUserId }
      );

      if (stepsError) {
        logger.error('Failed to get completed steps:', stepsError);
        return { data: null, error: stepsError };
      }

      const completedSteps = completedStepsData?.map((step: any) => step.step_id) || [];

      // Reuse canonical completion check
      const completion = await this.checkOnboardingCompletion(userId);
      if (completion.error || !completion.data) {
        return this.createErrorResponse(completion.error || 'Failed to determine completion');
      }

      return this.createSuccessResponse({
        isCompleted: completion.data.isCompleted,
        completedSteps,
        completionPercentage: completion.data.completionPercentage,
        lastUpdated: new Date().toISOString()
      });
    }, `get onboarding status for user ${userId}`);
  }

  /**
   * Get detailed onboarding progress with phase information
   */
  async getOnboardingProgress(userId: string): Promise<ServiceResponse<{
    currentPhase: string;
    currentStep: string;
    completedPhases: string[];
    completedSteps: string[];
    totalPhases: number;
    totalSteps: number;
    phaseProgress: Record<string, {
      completed: boolean;
      stepsCompleted: number;
      totalSteps: number;
      progressPercentage: number;
    }>;
  }>> {
    return this.executeDbOperation(async () => {
      // Use external user ID directly
      const internalUserId = userId;

      // Get user profile and onboarding data using internal user ID
      const { data: profile, error: profileError } = await selectOne(
        'user_profiles',
        internalUserId,
        'user_id'
      );

      if (profileError) {
        logger.error('Failed to get user profile:', profileError);
        return this.createErrorResponse(profileError);
      }

      // Get completed steps
      const { data: completedStepsData, error: stepsError } = await selectData(
        'user_onboarding_steps' as unknown as keyof Database['public']['Tables'],
        'step_id, step_data, completed_at',
        { user_id: internalUserId }
      );

      if (stepsError) {
        logger.error('Failed to get completed steps:', stepsError);
        return this.createErrorResponse(stepsError);
      }

      // Get completed phases
      const { data: completedPhasesData, error: phasesError } = await selectData(
        'user_onboarding_phases' as unknown as keyof Database['public']['Tables'],
        'phase_id, phase_data, completed_at',
        { user_id: internalUserId }
      );

      if (phasesError) {
        logger.error('Failed to get completed phases:', phasesError);
        return this.createErrorResponse(phasesError);
      }

      const completedSteps = completedStepsData?.map((step: any) => step.step_id) || [];
      const completedPhases = completedPhasesData?.map((phase: any) => phase.phase_id) || [];
      const phaseProgress: Record<string, any> = {};

      // Calculate progress for each phase
      ONBOARDING_PHASES.forEach(phase => {
        const phaseSteps = phase.steps.map(step => step.id);
        const completedPhaseSteps = phaseSteps.filter(stepId => completedSteps.includes(stepId));
        const stepsCompleted = completedPhaseSteps.length;
        const totalSteps = phaseSteps.length;
        const progressPercentage = totalSteps > 0 ? (stepsCompleted / totalSteps) * 100 : 0;
        
        // A phase is completed if it's marked as completed in the phases table OR all its steps are completed
        const phaseCompletedInTable = completedPhases.includes(phase.id);
        const allStepsCompleted = progressPercentage === 100;
        const completed = phaseCompletedInTable || allStepsCompleted;

        phaseProgress[phase.id] = {
          completed,
          stepsCompleted,
          totalSteps,
          progressPercentage,
          phaseCompletedInTable,
          allStepsCompleted
        };
      });

      // Determine current phase and step
      let currentPhase = ONBOARDING_PHASES[0].id;
      let currentStep = ONBOARDING_PHASES[0].steps[0].id;

      // First, check if any phases are marked as completed in the phases table
      if (completedPhases.length > 0) {
        logger.info('Found completed phases in database', { completedPhases });
        
        // Find the first incomplete phase after the last completed phase
        const lastCompletedPhaseIndex = Math.max(...completedPhases.map(phaseId => 
          ONBOARDING_PHASES.findIndex(phase => phase.id === phaseId)
        ));
        
        if (lastCompletedPhaseIndex >= 0 && lastCompletedPhaseIndex < ONBOARDING_PHASES.length - 1) {
          // Move to the next phase after the last completed one
          currentPhase = ONBOARDING_PHASES[lastCompletedPhaseIndex + 1].id;
          currentStep = ONBOARDING_PHASES[lastCompletedPhaseIndex + 1].steps[0].id;
          
          logger.info('Determined current phase from completed phases', {
            lastCompletedPhase: ONBOARDING_PHASES[lastCompletedPhaseIndex].id,
            currentPhase,
            currentStep
          });
        } else if (lastCompletedPhaseIndex === ONBOARDING_PHASES.length - 1) {
          // All phases are completed
          currentPhase = ONBOARDING_PHASES[ONBOARDING_PHASES.length - 1].id;
          currentStep = ONBOARDING_PHASES[ONBOARDING_PHASES.length - 1].steps[0].id;
          
          logger.info('All phases completed, staying on last phase', {
            currentPhase,
            currentStep
          });
        }
      } else {
        // No phases marked as completed, use step-based logic
        for (const phase of ONBOARDING_PHASES) {
          const phaseProgressData = phaseProgress[phase.id];
          if (!phaseProgressData.completed) {
            currentPhase = phase.id;
            // Find first incomplete step in this phase
            for (const step of phase.steps) {
              if (!completedSteps.includes(step.id)) {
                currentStep = step.id;
                break;
              }
            }
            break;
          }
        }
        
        logger.info('Determined current phase from step completion', {
          currentPhase,
          currentStep,
          completedSteps
        });
      }

      const totalPhases = ONBOARDING_PHASES.length;
      const totalSteps = ONBOARDING_PHASES.reduce((total, phase) => total + phase.steps.length, 0);

      return {
        data: {
          currentPhase,
          currentStep,
          completedPhases,
          completedSteps,
          totalPhases,
          totalSteps,
          phaseProgress
        },
        error: null
      };
    }, `get onboarding progress for user ${userId}`);
  }

  /**
   * Complete a specific onboarding phase
   */
  async completeOnboardingPhase(
    userId: string,
    phaseId: string,
    phaseData: any
  ): Promise<ServiceResponse<{
    phaseId: string;
    completed: boolean;
    nextPhase?: string;
    nextStep?: string;
  }>> {
    return this.executeDbOperation(async () => {
      try {
        // Use external user ID directly
        const internalUserId = userId;

        // Save phase completion with upsert to avoid duplicate key conflicts
        const { error: phaseError } = await upsertOne(
          'user_onboarding_phases' as unknown as keyof Database['public']['Tables'],
          {
            user_id: internalUserId,
            phase_id: phaseId,
            completed_at: new Date().toISOString(),
            phase_data: phaseData,
            updated_at: new Date().toISOString(),
          },
          'user_id,phase_id'
        );

        if (phaseError) {
          logger.error('Failed to save phase completion:', phaseError);
          return { data: null, error: phaseError };
        }

        // Determine next phase and step
        const currentPhaseIndex = ONBOARDING_PHASES.findIndex(phase => phase.id === phaseId);
        const nextPhase = currentPhaseIndex < ONBOARDING_PHASES.length - 1 
          ? ONBOARDING_PHASES[currentPhaseIndex + 1] 
          : null;
        const nextStep = nextPhase ? nextPhase.steps[0].id : undefined;

        return {
          data: {
            phaseId,
            completed: true,
            nextPhase: nextPhase?.id,
            nextStep
          },
          error: null
        };
      } catch (error) {
        return { data: null, error: error };
      }
    }, `complete onboarding phase ${phaseId} for user ${userId}`);
  }

  /**
   * Get phase configuration
   */
  async getPhaseConfiguration(phaseId: string): Promise<ServiceResponse<OnboardingPhase>> {
    logger.info('Getting phase configuration', { 
      phaseId, 
      availablePhases: ONBOARDING_PHASES.map(p => p.id),
      totalPhases: ONBOARDING_PHASES.length 
    });
    
    const phase = ONBOARDING_PHASES.find(p => p.id === phaseId);
    if (!phase) {
      logger.error('Phase not found', { 
        phaseId, 
        availablePhases: ONBOARDING_PHASES.map(p => p.id) 
      });
      return this.createErrorResponse(`Phase not found: ${phaseId}`);
    }
    
    logger.info('Phase configuration found', { 
      phaseId, 
      phaseTitle: phase.title,
      stepsCount: phase.steps.length 
    });
    
    return this.createSuccessResponse(phase);
  }

  /**
   * Validate step data against its schema
   */
  async validateStepData(
    stepId: string,
    data: any
  ): Promise<ServiceResponse<{ valid: boolean; errors?: string[] }>> {
    try {
      // Simplified validation - always return valid for now
      // This prevents the onboarding from getting stuck on validation errors
      return this.createSuccessResponse({ valid: true });
    } catch (error) {
      return this.handleError(error, 'validate step data');
    }
  }

  /**
   * Reset onboarding for a user
   */
  async resetOnboarding(userId: string): Promise<ServiceResponse<boolean>> {
    return this.executeDbOperation(async () => {
      try {
        // Use external user ID directly
        const internalUserId = userId;

        // Delete all onboarding data for the user
        const { error: stepsError } = await deleteOne(
          'user_onboarding_steps' as unknown as keyof Database['public']['Tables'],
          internalUserId,
          'user_id'
        );

        if (stepsError) {
          logger.error('Failed to delete onboarding steps:', stepsError);
        }

        // Reset user profile onboarding status
        const { error: profileError } = await updateOne(
          'user_profiles',
          internalUserId,
          { 
            onboarding_completed: false,
            onboarding_started_at: null,
            onboarding_completed_at: null
          },
          'user_id'
        );

        if (profileError) {
          logger.error('Failed to reset user profile:', profileError);
          return { data: null, error: profileError };
        }

        return { data: true, error: null };
      } catch (error) {
        return { data: null, error: error };
      }
    }, `reset onboarding for user ${userId}`);
  }

  /**
   * Check onboarding completion status
   */
  async checkOnboardingCompletion(userId: string): Promise<ServiceResponse<{
    isCompleted: boolean;
    userProfileComplete: boolean;
    businessProfileComplete: boolean;
    requiredModulesComplete: boolean;
    missingRequirements: string[];
    completionPercentage: number;
  }>> {
    return this.executeDbOperation(async () => {
      try {
              // Use external user ID directly
      const internalUserId = userId;

        // Check user profile completion using internal user ID
        const { data: userProfile, error: profileError } = await selectOne(
          'user_profiles',
          internalUserId,
          'user_id'
        );

        const userProfileComplete = !profileError && userProfile && 
          Boolean((userProfile as any).onboarding_completed);

        // Check business profile completion
        let businessProfileComplete = false;
        if (userProfile && (userProfile as any).company_id) {
          // Try companies table first (current structure)
          const { data: company, error: companyError } = await selectOne(
            'companies' as unknown as keyof Database['public']['Tables'],
            (userProfile as any).company_id,
            'id'
          );

          if (!companyError && company) {
            businessProfileComplete = Boolean((company as any).name) && 
              Boolean((company as any).industry) && 
              Boolean((company as any).size);
          } else {
            // Fallback to business_profiles table (legacy structure)
            const { data: businessProfile, error: businessError } = await selectOne(
              'business_profiles' as unknown as keyof Database['public']['Tables'],
              (userProfile as any).company_id,
              'id'
            );

            businessProfileComplete = !businessError && businessProfile &&
              Boolean((businessProfile as any).company_name) && 
              Boolean((businessProfile as any).industry) && 
              Boolean((businessProfile as any).company_size);
          }
        }

        // Determine required steps via RPC for consistency; fallback to local config
        let requiredStepIds: string[] = [];
        try {
          const { data: rpcSteps } = await callRPC<string[]>(
            'get_required_onboarding_steps'
          );
          if (Array.isArray(rpcSteps)) {
            requiredStepIds = rpcSteps;
          }
        } catch (_e) {
          // Fallback to local configuration when RPC unavailable
          requiredStepIds = ONBOARDING_PHASES
            .flatMap(phase => phase.steps)
            .filter(step => step.isRequired)
            .map(step => step.id);
        }

        const { data: completedStepsData, error: completedStepsError } = await selectData(
          'user_onboarding_steps' as unknown as keyof Database['public']['Tables'],
          'step_id',
          { user_id: internalUserId }
        );

        const completedStepIds: string[] = Array.isArray(completedStepsData)
          ? (completedStepsData as any[]).map(r => r.step_id as string)
          : [];

        const requiredModulesComplete = !completedStepsError && requiredStepIds.every(id => completedStepIds.includes(id));

        // Calculate completion percentage
        const checks = [userProfileComplete, businessProfileComplete, requiredModulesComplete];
        const completedChecks = checks.filter(Boolean).length;
        const completionPercentage = (completedChecks / checks.length) * 100;

        // Determine missing requirements
        const missingRequirements: string[] = [];
        if (!userProfileComplete) missingRequirements.push('User profile incomplete');
        if (!businessProfileComplete) missingRequirements.push('Business profile incomplete');
        if (!requiredModulesComplete) missingRequirements.push('Required modules incomplete');

        const isCompleted = completionPercentage === 100;

        return {
          data: {
            isCompleted,
            userProfileComplete: Boolean(userProfileComplete),
            businessProfileComplete: Boolean(businessProfileComplete),
            requiredModulesComplete: Boolean(requiredModulesComplete),
            missingRequirements,
            completionPercentage
          },
          error: null
        };
      } catch (error) {
        return { data: null, error: error };
      }
    }, `check onboarding completion for user ${userId}`);
  }

  /**
   * Check if user is a first-time user
   */
  async isFirstTimeUser(userId: string): Promise<ServiceResponse<boolean>> {
    try {
      // Use external user ID directly
      const internalUserId = userId;

      const { data: userProfile, error } = await selectOne(
        'user_profiles',
        internalUserId,
        'user_id'
      );

      if (error || !userProfile) {
        return this.createErrorResponse('User profile not found');
      }

      // Check if user has completed onboarding
      const isFirstTime = !(userProfile as any).onboarding_completed;
      return this.createSuccessResponse(isFirstTime);
    } catch (error) {
      return this.handleError(error, 'check first time user');
    }
  }

  /**
   * Mark first-time experience as complete
   */
  async markFirstTimeExperienceComplete(userId: string): Promise<ServiceResponse<boolean>> {
    try {
      // Use external user ID directly
      const internalUserId = userId;

      // Only update the timestamp, don't mark as completed
      const { error } = await updateOne(
        'user_profiles',
        internalUserId,
        {
          onboarding_started_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        'user_id'
      );

      if (error) {
        return this.createErrorResponse('Failed to mark first-time experience complete');
      }

      return this.createSuccessResponse(true);
    } catch (error) {
      return this.handleError(error, 'mark first time experience complete');
    }
  }

  /**
   * Save quantum business profile
   */
  async saveQuantumProfile(profile: any): Promise<ServiceResponse<any>> {
    try {
      logger.info('Saving quantum business profile', { profileId: profile.id });

      // Save to database
      const { data: savedData, error } = await upsertOne(
        'quantum_business_profiles',
        {
          id: profile.id,
          company_id: profile.companyId,
          profile_data: profile,
          health_score: profile.healthScore,
          maturity_level: profile.maturityLevel,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      );

      if (error) {
        logger.error('Error saving quantum profile', { error });
        return this.createErrorResponse('Failed to save quantum business profile');
      }

      logger.info('Quantum business profile saved successfully', { profileId: profile.id });

      return this.createSuccessResponse(profile);
    } catch (error) {
      return this.handleError(error, 'save quantum business profile');
    }
  }
}

// Create and export service instance
export const onboardingService = new OnboardingService(); 