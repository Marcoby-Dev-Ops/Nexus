/**
 * Onboarding Service
 * 
 * Handles onboarding data collection, validation, and database persistence
 * Uses proper database helper functions for all operations
 */

import { supabaseService } from '@/core/services/SupabaseService';
import { BaseService } from '@/core/services/BaseService';
import type { ServiceResponse } from '@/core/services/BaseService';
import { logger } from '@/shared/utils/logger';
import { z } from 'zod';

// Onboarding Data Schema
export const OnboardingDataSchema = z.object({
  // Basic Info Step
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  displayName: z.string().optional(),
  jobTitle: z.string().optional(),
  company: z.string().optional(),
  
  // Business Context Step
  industry: z.string().optional(),
  companySize: z.string().optional(),
  primaryGoals: z.array(z.string()).optional(),
  businessChallenges: z.array(z.string()).optional(),
  
  // Integration Discovery Step
  selectedIntegrations: z.array(z.string()).optional(),
  
  // AI Capabilities Step
  selectedUseCases: z.array(z.string()).optional(),
  
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
  companyId?: string;
  profileUpdated: boolean;
  companyCreated: boolean;
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

// 5-Phase Onboarding Orchestration
export const ONBOARDING_PHASES: OnboardingPhase[] = [
  {
    id: 'new-user-setup',
    title: 'New User Setup',
    description: 'Establish your identity and basic account configuration',
    estimatedDuration: '2-3 minutes',
    isRequired: true,
    objectives: [
      'Establish user identity',
      'Create secure authentication',
      'Initialize user profile',
      'Set up basic preferences'
    ],
    steps: [
      {
        id: 'welcome-introduction',
        title: 'Welcome to Nexus',
        description: 'Meet your AI-powered business operating system',
        component: 'WelcomeStep',
        isRequired: true
      },
      {
        id: 'basic-profile-creation',
        title: 'Your Profile',
        description: 'Tell us about yourself',
        component: 'BasicInfoStep',
        isRequired: true,
        validationSchema: z.object({
          firstName: z.string().min(1, 'First name is required'),
          lastName: z.string().min(1, 'Last name is required'),
          jobTitle: z.string().optional(),
          company: z.string().optional()
        })
      },
      {
        id: 'authentication-verification',
        title: 'Account Security',
        description: 'Verify your account and set up security',
        component: 'AuthVerificationStep',
        isRequired: true
      },
      {
        id: 'account-activation',
        title: 'Account Activation',
        description: 'Activate your account and set preferences',
        component: 'AccountActivationStep',
        isRequired: true
      }
    ]
  },
  {
    id: 'business-profile-setup',
    title: 'Business Profile Setup',
    description: 'Configure your business context and goals',
    estimatedDuration: '3-4 minutes',
    isRequired: true,
    objectives: [
      'Understand business context',
      'Define success metrics',
      'Identify key challenges',
      'Set up business intelligence foundation'
    ],
    steps: [
      {
        id: 'company-information',
        title: 'Company Information',
        description: 'Tell us about your business',
        component: 'CompanyInfoStep',
        isRequired: true,
        validationSchema: z.object({
          company: z.string().min(1, 'Company name is required'),
          industry: z.string().min(1, 'Industry is required'),
          companySize: z.string().min(1, 'Company size is required')
        })
      },
      {
        id: 'industry-selection',
        title: 'Industry Context',
        description: 'Configure industry-specific insights',
        component: 'IndustrySelectionStep',
        isRequired: true
      },
      {
        id: 'business-context',
        title: 'Business Context',
        description: 'Define your business model and operations',
        component: 'BusinessContextStep',
        isRequired: true
      },
      {
        id: 'goal-definition',
        title: 'Business Goals',
        description: 'Define your primary business objectives',
        component: 'GoalDefinitionStep',
        isRequired: true
      },
      {
        id: 'challenge-identification',
        title: 'Business Challenges',
        description: 'Identify key challenges to address',
        component: 'ChallengeIdentificationStep',
        isRequired: false
      }
    ]
  },
  {
    id: 'user-integration-setup',
    title: 'User Integration Setup',
    description: 'Connect your existing business tools and data sources',
    estimatedDuration: '2-3 minutes',
    isRequired: false,
    objectives: [
      'Connect existing business tools',
      'Configure data sources',
      'Set up automated workflows',
      'Establish data pipelines'
    ],
    steps: [
      {
        id: 'integration-discovery',
        title: 'Integration Discovery',
        description: 'Discover available integrations for your business',
        component: 'IntegrationDiscoveryStep',
        isRequired: false
      },
      {
        id: 'tool-connection-setup',
        title: 'Tool Connections',
        description: 'Connect your existing business tools',
        component: 'ToolConnectionStep',
        isRequired: false
      },
      {
        id: 'data-source-configuration',
        title: 'Data Sources',
        description: 'Configure your data sources and pipelines',
        component: 'DataSourceStep',
        isRequired: false
      },
      {
        id: 'permission-granting',
        title: 'Permissions',
        description: 'Grant necessary permissions for integrations',
        component: 'PermissionStep',
        isRequired: false
      }
    ]
  },
  {
    id: 'ai-process-setup',
    title: 'AI Process Setup',
    description: 'Configure your AI capabilities and business intelligence',
    estimatedDuration: '3-4 minutes',
    isRequired: true,
    objectives: [
      'Configure AI capabilities',
      'Set up business intelligence',
      'Train the Unified Business Brain',
      'Calibrate for user\'s business context'
    ],
    steps: [
      {
        id: 'ai-capability-selection',
        title: 'AI Capabilities',
        description: 'Select AI capabilities for your business',
        component: 'AICapabilityStep',
        isRequired: true
      },
      {
        id: 'use-case-configuration',
        title: 'Use Case Configuration',
        description: 'Configure AI use cases for your business',
        component: 'UseCaseConfigurationStep',
        isRequired: true
      },
      {
        id: 'brain-training-setup',
        title: 'Brain Training',
        description: 'Train your Unified Business Brain',
        component: 'BrainTrainingStep',
        isRequired: true
      },
      {
        id: 'intelligence-calibration',
        title: 'Intelligence Calibration',
        description: 'Calibrate AI for your business context',
        component: 'IntelligenceCalibrationStep',
        isRequired: true
      }
    ]
  },
  {
    id: 'confirmation-and-experience',
    title: 'Confirmation and Begin User Experience',
    description: 'Verify setup and begin your business transformation',
    estimatedDuration: '1-2 minutes',
    isRequired: true,
    objectives: [
      'Verify all setup is complete',
      'Confirm successful onboarding',
      'Introduce user experience',
      'Guide first business action'
    ],
    steps: [
      {
        id: 'setup-verification',
        title: 'Setup Verification',
        description: 'Verify all components are properly configured',
        component: 'SetupVerificationStep',
        isRequired: true
      },
      {
        id: 'success-confirmation',
        title: 'Success Confirmation',
        description: 'Confirm successful onboarding completion',
        component: 'SuccessConfirmationStep',
        isRequired: true
      },
      {
        id: 'experience-introduction',
        title: 'Experience Introduction',
        description: 'Introduce your new business operating system',
        component: 'ExperienceIntroductionStep',
        isRequired: true
      },
      {
        id: 'first-action-guidance',
        title: 'First Action Guidance',
        description: 'Take your first business action with AI assistance',
        component: 'FirstActionGuidanceStep',
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
    const validation = this.validateParams({ userId, stepId }, ['userId', 'stepId']);
    if (validation) {
      return this.createErrorResponse(validation);
    }

    return this.executeDbOperation(async () => {
      const stepData: OnboardingStepData = {
        stepId,
        data,
        completedAt: new Date().toISOString()
      };

      logger.info('Attempting to save onboarding step', { userId, stepId, data });

      // Use upsert to handle existing records
      const upsertData = {
        user_id: userId,
        step_id: stepId,
        step_data: data,
        completed_at: stepData.completedAt,
        updated_at: new Date().toISOString()
      };
      
      logger.info('Upsert data:', upsertData);
      
      const { data: savedStep, error } = await supabaseService.upsertOne<OnboardingStepData>(
        'user_onboarding_steps',
        upsertData,
        'user_id,step_id'
      );

      if (error) {
        logger.error('Failed to save onboarding step:', { error, userId, stepId, data, upsertData });
        
        // Test direct Supabase call to get more detailed error
        try {
          const { data: testData, error: testError } = await supabaseService.upsertOne(
            'user_onboarding_steps',
            upsertData,
            'user_id,step_id'
          );
          
          logger.error('Direct Supabase test result:', { testData, testError });
        } catch (directError) {
          logger.error('Direct Supabase test failed:', directError);
        }
        
        return { data: null, error };
      }

      logger.info('Successfully saved onboarding step', { userId, stepId, savedStep });
      return { data: stepData, error: null };
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
      const edgeFunctionResult = await supabaseService.callEdgeFunction<{
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
        companyId: edgeFunctionResult.data?.companyId,
        profileUpdated: edgeFunctionResult.data?.profileUpdated || false,
        companyCreated: edgeFunctionResult.data?.companyCreated || false,
        onboardingCompleted: edgeFunctionResult.data?.onboardingCompleted || false
      };

      logger.info('Onboarding completed successfully via edge function', { 
        userId, 
        companyId: onboardingResult.companyId 
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
      const profileUpdates: any = {
        first_name: data.firstName,
        last_name: data.lastName,
        display_name: data.displayName || `${data.firstName} ${data.lastName}`,
        job_title: data.jobTitle,
        onboarding_completed: true,
        updated_at: new Date().toISOString()
      };

      // Add role if not set
      if (!data.jobTitle) {
        profileUpdates.role = 'owner';
      }

      const { data: updatedProfile, error } = await supabaseService.updateOne(
        'user_profiles',
        userId,
        profileUpdates
      );

      if (error) {
        logger.error('Failed to update user profile:', error);
        return { data: null, error };
      }

      logger.info('User profile updated successfully', { userId });
      return { data: true, error: null };
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
        const { session, error: refreshError } = await supabaseService.sessionUtils.refreshSession();
        if (refreshError) {
          logger.error('Failed to refresh session during company creation:', refreshError);
        }
      } catch (refreshError) {
        logger.error('Failed to refresh session during company creation:', refreshError);
      }

      // Check if user already has a company
      const { data: existingProfile, error: profileError } = await supabaseService.selectOne(
        'user_profiles',
        userId
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
          
          const { error: updateError } = await supabaseService.updateOne(
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
      
      const { data: newCompany, error: companyError } = await supabaseService.insertOne(
        'companies',
        {
          name: companyName,
          industry: data.industry || 'Technology',
          size: mapCompanySizeToDatabaseValue(data.companySize || '1-10'),
          created_by: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      );

      if (companyError) {
        logger.error('Failed to create company:', companyError);
        return { data: null, error: companyError };
      }

      // Associate user with company
      const { error: associationError } = await supabaseService.updateOne(
        'user_profiles',
        userId,
        {
          company_id: newCompany && typeof newCompany === 'object' && 'id' in newCompany ? newCompany.id as string : null,
          role: 'owner',
          updated_at: new Date().toISOString()
        }
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
        // Save onboarding completion record
        const { error: completionError } = await supabaseService.insertOne(
          'user_onboarding_completions' as any,
          {
            user_id: userId,
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
        // Update user preferences based on onboarding selections
        const preferences = {
          selected_integrations: data.selectedIntegrations || [],
          selected_use_cases: data.selectedUseCases || [],
          industry_preferences: data.industry ? [data.industry] : [],
          company_size_preference: data.companySize || null,
          primary_goals: data.primaryGoals || [],
          business_challenges: data.businessChallenges || []
        };

        const { error: preferencesError } = await supabaseService.updateOne(
          'user_profiles',
          userId,
          { preferences: preferences }
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
      // Get user profile
      const { data: profile, error: profileError } = await supabaseService.selectOne(
        'user_profiles',
        userId,
        'id'
      );

      if (profileError) {
        logger.error('Failed to get user profile:', profileError);
        return { data: null, error: profileError };
      }

      // Get completed steps
      const { data: completedStepsData, error: stepsError } = await supabaseService.select(
        'user_onboarding_steps' as any,
        'step_id',
        { user_id: userId }
      );

      if (stepsError) {
        logger.error('Failed to get completed steps:', stepsError);
        return { data: null, error: stepsError };
      }

      const completedSteps = completedStepsData?.map((step: any) => step.step_id) || [];

      return {
        data: {
          isCompleted: completedSteps.length > 0,
          completedSteps,
          completionPercentage: (completedSteps.length / 10) * 100, // Assuming 10 total steps
          lastUpdated: new Date().toISOString()
        },
        error: null
      };
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
      // Get user profile and onboarding data
      const { data: profile, error: profileError } = await supabaseService.selectOne(
        'user_profiles',
        userId,
        'id'
      );

      if (profileError) {
        logger.error('Failed to get user profile:', profileError);
        return { data: null, error: profileError };
      }

      // Get completed steps
      const { data: completedStepsData, error: stepsError } = await supabaseService.select(
        'user_onboarding_steps' as any,
        'step_id, step_data, completed_at',
        { user_id: userId }
      );

      if (stepsError) {
        logger.error('Failed to get completed steps:', stepsError);
        return { data: null, error: stepsError };
      }

      const completedSteps = completedStepsData?.map((step: any) => step.step_id) || [];
      const completedPhases: string[] = [];
      const phaseProgress: Record<string, any> = {};

      // Calculate progress for each phase
      ONBOARDING_PHASES.forEach(phase => {
        const phaseSteps = phase.steps.map(step => step.id);
        const completedPhaseSteps = phaseSteps.filter(stepId => completedSteps.includes(stepId));
        const stepsCompleted = completedPhaseSteps.length;
        const totalSteps = phaseSteps.length;
        const progressPercentage = totalSteps > 0 ? (stepsCompleted / totalSteps) * 100 : 0;
        const completed = progressPercentage === 100;

        phaseProgress[phase.id] = {
          completed,
          stepsCompleted,
          totalSteps,
          progressPercentage
        };

        if (completed) {
          completedPhases.push(phase.id);
        }
      });

      // Determine current phase and step
      let currentPhase = ONBOARDING_PHASES[0].id;
      let currentStep = ONBOARDING_PHASES[0].steps[0].id;

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
        // Save phase completion
        const { error: phaseError } = await supabaseService.insertOne(
          'user_onboarding_phases' as any,
          {
            user_id: userId,
            phase_id: phaseId,
            completed_at: new Date().toISOString(),
            phase_data: phaseData
          }
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
    const phase = ONBOARDING_PHASES.find(p => p.id === phaseId);
    if (!phase) {
      return this.createErrorResponse('Phase not found');
    }
    return this.createSuccessResponse(phase);
  }

  /**
   * Validate step data against schema
   */
  async validateStepData(
    stepId: string,
    data: any
  ): Promise<ServiceResponse<{ valid: boolean; errors?: string[] }>> {
    try {
      // Find the step and its validation schema
      const step = ONBOARDING_PHASES.flatMap(phase => phase.steps).find(s => s.id === stepId);
      
      if (!step) {
        return this.createErrorResponse('Step not found');
      }

      // For now, return valid - you can add specific validation logic here
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
        // Delete all onboarding data for the user
        const { error: stepsError } = await supabaseService.deleteOne(
          'user_onboarding_steps' as any,
          userId,
          'user_id'
        );

        if (stepsError) {
          logger.error('Failed to delete onboarding steps:', stepsError);
        }

        // Reset user profile onboarding status
        const { error: profileError } = await supabaseService.updateOne(
          'user_profiles',
          userId,
          { 
            onboarding_completed: false,
            onboarding_started_at: null,
            onboarding_completed_at: null
          }
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
        // Check user profile completion
        const { data: userProfile, error: profileError } = await supabaseService.selectOne(
          'user_profiles',
          userId,
          'id'
        );

        const userProfileComplete = !profileError && userProfile && 
          Boolean((userProfile as any).onboarding_completed);

        // Check business profile completion
        let businessProfileComplete = false;
        if (userProfile && (userProfile as any).company_id) {
          const { data: businessProfile, error: businessError } = await supabaseService.selectOne(
            'business_profiles' as any,
            (userProfile as any).company_id,
            'id'
          );

          businessProfileComplete = !businessError && businessProfile &&
            Boolean((businessProfile as any).company_name) && 
            Boolean((businessProfile as any).industry) && 
            Boolean((businessProfile as any).company_size);
        }

        // Check required onboarding modules
        const { data: onboardingProgress, error: progressError } = await supabaseService.selectOne(
          'user_onboarding_progress' as any,
          userId,
          'user_id'
        );

        const requiredModulesComplete = !progressError && onboardingProgress &&
          Boolean((onboardingProgress as any).onboarding_completed);

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
      const { data: userProfile, error } = await supabaseService.selectOne(
        'user_profiles',
        userId,
        'id'
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
      const { error } = await supabaseService.updateOne(
        'user_profiles',
        userId,
        {
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      );

      if (error) {
        return this.createErrorResponse('Failed to mark first-time experience complete');
      }

      return this.createSuccessResponse(true);
    } catch (error) {
      return this.handleError(error, 'mark first time experience complete');
    }
  }
}

// Create and export service instance
export const onboardingService = new OnboardingService(); 