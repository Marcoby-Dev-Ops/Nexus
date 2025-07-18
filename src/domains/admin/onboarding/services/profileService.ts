import { supabase } from '@/core/supabase';
import type { Database } from '@/core/types/database.types';

type Tables = Database['public']['Tables'];
type OnboardingProfile = Tables<'ai_onboarding_profiles'>;

export interface UserProfile {
  company_name?: string;
  industry?: string;
  role?: string;
  team_size?: number;
  goals?: string[];
  challenges?: string[];
  preferences?: Record<string, any>;
  onboarding_stage?: string;
  completed_steps?: string[];
}

export interface UpsertOnboardingProfileParams {
  profile: UserProfile;
  user_id: string;
}

export const profileService = {
  /**
   * Upsert onboarding profile for a user
   */
  async upsertOnboardingProfile(params: UpsertOnboardingProfileParams): Promise<OnboardingProfile> {
    const { profile, user_id } = params;

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('ai_onboarding_profiles')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (existingProfile) {
      // Update existing profile
      const { data, error } = await supabase
        .from('ai_onboarding_profiles')
        .update({
          profile_data: profile,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user_id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update onboarding profile: ${error.message}`);
      }

      return data;
    } else {
      // Create new profile
      const { data, error } = await supabase
        .from('ai_onboarding_profiles')
        .insert({
          user_id,
          profile_data: profile,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create onboarding profile: ${error.message}`);
      }

      return data;
    }
  },

  /**
   * Get onboarding profile for a user
   */
  async getOnboardingProfile(userId: string): Promise<OnboardingProfile | null> {
    const { data, error } = await supabase
      .from('ai_onboarding_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      throw new Error(`Failed to get onboarding profile: ${error.message}`);
    }

    return data;
  },

  /**
   * Update specific fields in the onboarding profile
   */
  async updateOnboardingProfile(userId: string, updates: Partial<UserProfile>): Promise<OnboardingProfile> {
    const existingProfile = await this.getOnboardingProfile(userId);
    
    if (!existingProfile) {
      throw new Error('Onboarding profile not found');
    }

    const currentProfileData = existingProfile.profile_data as UserProfile;
    const updatedProfileData = { ...currentProfileData, ...updates };

    const { data, error } = await supabase
      .from('ai_onboarding_profiles')
      .update({
        profile_data: updatedProfileData,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update onboarding profile: ${error.message}`);
    }

    return data;
  },

  /**
   * Mark onboarding step as completed
   */
  async markStepCompleted(userId: string, stepName: string): Promise<void> {
    const existingProfile = await this.getOnboardingProfile(userId);
    
    if (!existingProfile) {
      throw new Error('Onboarding profile not found');
    }

    const currentProfileData = existingProfile.profile_data as UserProfile;
    const completedSteps = currentProfileData.completed_steps || [];
    
    if (!completedSteps.includes(stepName)) {
      completedSteps.push(stepName);
    }

    await this.updateOnboardingProfile(userId, {
      completed_steps: completedSteps,
    });
  },
}; 