/**
 * User Profile Service
 * Handles all user profile creation, provisioning, and update operations
 */

import { supabase } from '@/lib/supabase';
import { DatabaseQueryWrapper } from '@/core/database/queryWrapper';
import { logger } from '@/shared/utils/logger.ts';

export interface CreateUserProfileParams {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: 'owner' | 'admin' | 'manager' | 'user';
  company_id?: string;
  preferences?: Record<string, unknown>;
}

export interface UpdateUserProfileParams {
  first_name?: string;
  last_name?: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  role?: 'owner' | 'admin' | 'manager' | 'user';
  department?: string;
  job_title?: string;
  company_id?: string;
  business_email?: string;
  personal_email?: string;
  phone?: string;
  location?: string;
  timezone?: string;
  preferences?: Record<string, unknown>;
  onboarding_completed?: boolean;
}

export class UserProfileService {
  private queryWrapper = new DatabaseQueryWrapper();

  /**
   * Create a new user profile with proper validation
   */
  async createUserProfile(params: CreateUserProfileParams) {
    try {
      const { id, email, first_name, last_name, role = 'user', company_id, preferences } = params;

      // Validate required fields
      if (!id || !email) {
        throw new Error('User ID and email are required');
      }

      // Calculate full_name if first_name and last_name are provided
      const full_name = first_name && last_name 
        ? `${first_name} ${last_name}`.trim()
        : first_name || last_name || email.split('@')[0];

      const profileData = {
        id,
        user_id: id, // Must match id
        email,
        first_name,
        last_name,
        full_name,
        display_name: full_name,
        role,
        company_id,
        preferences: {
          theme: 'system',
          notifications: true,
          language: 'en',
          ...preferences
        },
        onboarding_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await this.queryWrapper.query(
        async () => {
          const result = await supabase
            .from('user_profiles')
            .insert(profileData)
            .select()
            .single();
          return result;
        },
        { context: `create-user-profile-${id}` }
      );

      if (error) {
        logger.error(`Failed to create user profile for ${id}:`, error);
        throw new Error(`Failed to create user profile: ${error.message}`);
      }

      logger.info(`Successfully created user profile for ${id}`);
      return { data, error: null };
    } catch (error) {
      logger.error(`Exception creating user profile:`, error);
      return { data: null, error };
    }
  }

  /**
   * Update user profile with validation and proper field mapping
   */
  async updateUserProfile(userId: string, updates: UpdateUserProfileParams) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      // Validate role if provided
      if (updates.role && !['owner', 'admin', 'manager', 'user'].includes(updates.role)) {
        throw new Error('Invalid role value');
      }

      // Calculate full_name if first_name or last_name are updated
      let full_name = updates.full_name;
      if (updates.first_name || updates.last_name) {
        const currentProfile = await this.getUserProfile(userId);
        const firstName = updates.first_name || currentProfile?.first_name;
        const lastName = updates.last_name || currentProfile?.last_name;
        
        if (firstName && lastName) {
          full_name = `${firstName} ${lastName}`.trim();
        } else {
          full_name = firstName || lastName || full_name;
        }
      }

      const updateData = {
        ...updates,
        full_name,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await this.queryWrapper.updateUserProfile(userId, updateData);

      if (error) {
        logger.error(`Failed to update user profile for ${userId}:`, error);
        return { data: null, error };
      }

      logger.info(`Successfully updated user profile for ${userId}`);
      return { data, error: null };
    } catch (error) {
      logger.error(`Exception updating user profile for ${userId}:`, error);
      return { data: null, error };
    }
  }

  /**
   * Get user profile with proper error handling
   */
  async getUserProfile(userId: string) {
    try {
      const { data, error } = await this.queryWrapper.getUserProfile(userId);

      if (error) {
        logger.error(`Failed to fetch user profile for ${userId}:`, error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      logger.error(`Exception fetching user profile for ${userId}:`, error);
      return { data: null, error };
    }
  }

  /**
   * Complete user onboarding
   */
  async completeOnboarding(userId: string, companyData?: any) {
    try {
      const updates: UpdateUserProfileParams = {
        onboarding_completed: true,
        preferences: {
          onboarding_completed_at: new Date().toISOString()
        }
      };

      // If company data is provided, create company and link user
      if (companyData) {
        const { data: company, error: companyError } = await supabase
          .from('companies')
          .insert({
            name: companyData.name,
            industry: companyData.industry,
            size: companyData.size,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (companyError) {
          throw new Error(`Failed to create company: ${companyError.message}`);
        }

        updates.company_id = company.id;
        updates.role = 'owner';
      }

      return await this.updateUserProfile(userId, updates);
    } catch (error) {
      logger.error(`Exception completing onboarding for ${userId}:`, error);
      return { data: null, error };
    }
  }

  /**
   * Calculate profile completion percentage
   */
  calculateProfileCompletion(profile: any): number {
    const requiredFields = [
      'first_name', 'last_name', 'email', 'role'
    ];

    const optionalFields = [
      'avatar_url', 'bio', 'department', 'job_title', 
      'business_email', 'personal_email', 'phone', 'location'
    ];

    let completedFields = 0;
    const totalFields = requiredFields.length + optionalFields.length;

    // Check required fields
    requiredFields.forEach(field => {
      if (profile[field]) completedFields++;
    });

    // Check optional fields
    optionalFields.forEach(field => {
      if (profile[field]) completedFields++;
    });

    return Math.round((completedFields / totalFields) * 100);
  }

  /**
   * Validate profile data
   */
  validateProfileData(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required field validation
    if (!data.id) errors.push('User ID is required');
    if (!data.email) errors.push('Email is required');
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('Invalid email format');
    }

    // Role validation
    if (data.role && !['owner', 'admin', 'manager', 'user'].includes(data.role)) {
      errors.push('Invalid role value');
    }

    // Email validation
    if (data.business_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.business_email)) {
      errors.push('Invalid business email format');
    }
    if (data.personal_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.personal_email)) {
      errors.push('Invalid personal email format');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
export const userProfileService = new UserProfileService(); 