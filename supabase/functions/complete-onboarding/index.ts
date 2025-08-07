import { createEdgeFunction, createErrorResponse, createSuccessResponse } from '../_shared/template.ts';

interface OnboardingData {
  userId: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  jobTitle?: string;
  company?: string;
  industry?: string;
  companySize?: string;
  primaryGoals?: string[];
  businessChallenges?: string[];
  selectedIntegrations?: string[];
  selectedUseCases?: string[];
  completedAt?: string;
}

interface OnboardingResponse {
  success: boolean;
  data?: {
    userId: string;
    companyId?: string;
    onboardingCompleted: boolean;
    profileUpdated: boolean;
    companyCreated: boolean;
  };
  error?: string;
}

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
 * Generate a UUID for database inserts
 */
function generateUUID(): string {
  return crypto.randomUUID();
}

export const completeOnboarding = createEdgeFunction(async (req, auth) => {
  const { user, supabase } = auth;
  
  console.log('Edge function called with method:', req.method);
  console.log('User authenticated:', user?.id);

  try {
    // Parse request body
    const onboardingData: OnboardingData = await req.json();
    console.log('Received onboarding data:', JSON.stringify(onboardingData, null, 2));

    // Validate required fields
    if (!onboardingData.userId) {
      return createErrorResponse('Missing required field: userId', 400);
    }

    // Validate user authentication
    if (!user?.id || user.id !== onboardingData.userId) {
      return createErrorResponse('User authentication failed or user ID mismatch', 401);
    }

    // 1. Ensure user profile exists using our helper function
    const { error: ensureProfileError } = await supabase.rpc('ensure_user_profile', {
      user_id: onboardingData.userId
    });

    if (ensureProfileError) {
      console.error('Error ensuring user profile exists:', ensureProfileError);
      return createErrorResponse(`Failed to ensure user profile: ${ensureProfileError.message}`, 500);
    }

    console.log('User profile ensured successfully');

    // 2. Update user profile with basic info using safe helper
    const userProfileUpdates: any = {};
    
    if (onboardingData.firstName) userProfileUpdates.first_name = onboardingData.firstName;
    if (onboardingData.lastName) userProfileUpdates.last_name = onboardingData.lastName;
    if (onboardingData.displayName) userProfileUpdates.display_name = onboardingData.displayName;
    if (onboardingData.jobTitle) userProfileUpdates.job_title = onboardingData.jobTitle;
    userProfileUpdates.onboarding_completed = true;
    userProfileUpdates.updated_at = new Date().toISOString();

    // Use the service role update function
    const { error: profileError } = await supabase.rpc('update_user_profile_service_role', {
      user_id: onboardingData.userId,
      updates: userProfileUpdates
    });

    if (profileError) {
      console.error('Error updating user profile:', profileError);
      return createErrorResponse(`Failed to update user profile: ${profileError.message}`, 500);
    }

    console.log('User profile updated successfully');

    // 3. Create new company
    const companyName = onboardingData.company || `${onboardingData.firstName} ${onboardingData.lastName}'s Company`;
    
    const { data: newCompany, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: companyName,
        industry: onboardingData.industry || 'Technology',
        size: mapCompanySizeToDatabaseValue(onboardingData.companySize || '1-10'),
        created_by: onboardingData.userId,
        owner_id: onboardingData.userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (companyError) {
      console.error('Error creating company:', companyError);
      return createErrorResponse(`Failed to create company: ${companyError.message}`, 500);
    }

    const companyId = newCompany.id;
    console.log('Created company with ID:', companyId);

    // 4. Create business profile using safe helper function
    const businessProfileData: any = {
      id: generateUUID(),
      user_id: onboardingData.userId,
      company_id: companyId,
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    if (onboardingData.industry) businessProfileData.industry = onboardingData.industry;
    if (onboardingData.companySize) businessProfileData.team_size = mapCompanySizeToDatabaseValue(onboardingData.companySize);
    if (onboardingData.primaryGoals) businessProfileData.primary_goals = onboardingData.primaryGoals;
    if (onboardingData.businessChallenges) businessProfileData.business_challenges = onboardingData.businessChallenges;
    if (onboardingData.selectedIntegrations) businessProfileData.selected_integrations = onboardingData.selectedIntegrations;
    if (onboardingData.selectedUseCases) businessProfileData.selected_use_cases = onboardingData.selectedUseCases;

    // Use direct insert with service role (should work now that we've ensured user profile)
    const { error: businessProfileError } = await supabase
      .from('business_profiles')
      .insert(businessProfileData);

    if (businessProfileError) {
      console.error('Error creating business profile:', businessProfileError);
      return createErrorResponse(`Failed to create business profile: ${businessProfileError.message}`, 500);
    }

    console.log('Created business profile for user:', onboardingData.userId);

    // 5. Associate user with the company using safe helper
    const { error: associationError } = await supabase.rpc('update_user_profile_service_role', {
      user_id: onboardingData.userId,
      updates: {
        company_id: companyId,
        role: 'owner',
        updated_at: new Date().toISOString()
      }
    });

    if (associationError) {
      console.error('Error associating user with company:', associationError);
      return createErrorResponse(`Failed to associate user with company: ${associationError.message}`, 500);
    }

    console.log('Associated user with company:', companyId);

    console.log('Onboarding completed successfully for user:', onboardingData.userId);

    const responseData = {
      userId: onboardingData.userId,
      companyId,
      onboardingCompleted: true,
      profileUpdated: true,
      companyCreated: true
    };

    return createSuccessResponse(responseData);

  } catch (error) {
    console.error('Onboarding completion error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Unknown error occurred',
      500
    );
  }
});

// Export the serve function for Supabase
export const serve = completeOnboarding; 