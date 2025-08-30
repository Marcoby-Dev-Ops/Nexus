/**
 * Database Service
 * Handles user profile operations with enhanced error handling and logging
 * Updated to use SupabaseService for all database operations
 */

import { UnifiedDatabaseService } from '@/core/services/UnifiedDatabaseService';
import { BaseService } from '@/core/services/BaseService';
import { logger } from '@/shared/utils/logger';
import type { ServiceResponse } from '@/core/services/BaseService';


export interface DatabaseProfile {
  id?: string;
  first_name?: string | null;
  last_name?: string | null;
  display_name?: string | null;
  name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  phone?: string | null;
  work_phone?: string | null;
  personal_email?: string | null;
  role?: string | null;
  department?: string | null;
  job_title?: string | null;
  employee_id?: string | null;
  hire_date?: string | null;
  manager_id?: string | null;
  direct_reports?: string[] | null;
  timezone?: string | null;
  location?: string | null;
  work_location?: string | null;
  address?: Record<string, unknown> | null;
  linkedin_url?: string | null;
  github_url?: string | null;
  twitter_url?: string | null;
  skills?: string[] | null;
  certifications?: string[] | null;
  languages?: Record<string, unknown> | null;
  emergency_contact?: Record<string, unknown> | null;
  preferences?: Record<string, unknown> | null;
  status?: string | null;
  last_login?: string | null;
  onboarding_completed?: boolean | null;
  profile_completion_percentage?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  company_id?: string | null;
}

export class DatabaseService extends BaseService {
  private unifiedDatabaseService = UnifiedDatabaseService.getInstance();

  constructor() {
    super();
  }

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string): Promise<ServiceResponse<DatabaseProfile>> {
    return this.executeDbOperation(async () => {
      this.logger.info('Getting user profile', { userId });
      
      // Use the ensure_user_profile RPC function which handles mapping and profile creation
      const result = await this.unifiedDatabaseService.callRPC('ensure_user_profile', { user_id: userId });
      
      if (result.error) {
        this.logger.error('Failed to get user profile', { userId, error: result.error });
        return { data: null, error: result.error || 'Failed to fetch user profile' };
      }

      // RPC returns an array, but we want a single record
      if (!result.data || result.data.length === 0) {
        return { data: null, error: 'User profile not found' };
      }

      this.logger.info('Successfully retrieved user profile', { userId });
      return { data: result.data[0], error: null };
    }, 'get user profile');
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, profileData: Partial<DatabaseProfile>): Promise<ServiceResponse<DatabaseProfile>> {
    try {
      logger.info('Updating user profile', { userId, fields: Object.keys(profileData) });
      
      // Use external user ID directly
      const internalUserId = userId;
      
      const updateData = {
        ...profileData,
        updated_at: new Date().toISOString(),
      };

      const result = await this.unifiedDatabaseService.updateOne<DatabaseProfile>('user_profiles', internalUserId, updateData);
      
      if (result.error) {
        logger.error('Failed to update user profile', { userId, error: result.error });
        return {
          success: false,
          error: result.error || 'Failed to update user profile',
          data: null,
        };
      }

      logger.info('Successfully updated user profile', { userId });
      return {
        success: true,
        data: result.data,
        error: null,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error updating user profile', { userId, error: errorMessage });
      return {
        success: false,
        error: typeof errorMessage === 'string' ? errorMessage : 'Unknown error',
        data: null,
      };
    }
  }

  /**
   * Create new user profile
   */
  async createUserProfile(profileData: Partial<DatabaseProfile>): Promise<ServiceResponse<DatabaseProfile>> {
    try {
      logger.info('Creating user profile', { userId: profileData.id });
      
      const insertData = {
        ...profileData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const result = await this.unifiedDatabaseService.insertOne<DatabaseProfile>('user_profiles', insertData);
      
      if (result.error) {
        logger.error('Failed to create user profile', { userId: profileData.id, error: result.error });
        return {
          success: false,
          error: result.error || 'Failed to create user profile',
          data: null,
        };
      }

      logger.info('Successfully created user profile', { userId: profileData.id });
      return {
        success: true,
        data: result.data,
        error: null,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error creating user profile', { userId: profileData.id, error: errorMessage });
      return {
        success: false,
        error: typeof errorMessage === 'string' ? errorMessage : 'Unknown error',
        data: null,
      };
    }
  }

  /**
   * Delete user profile
   */
  async deleteUserProfile(userId: string): Promise<ServiceResponse<void>> {
    try {
      logger.info('Deleting user profile', { userId });
      
      const result = await this.unifiedDatabaseService.deleteOne('user_profiles', userId);
      
      if (result.error) {
        logger.error('Failed to delete user profile', { userId, error: result.error });
        return {
          success: false,
          error: result.error || 'Failed to delete user profile',
          data: null,
        };
      }

      logger.info('Successfully deleted user profile', { userId });
      return {
        success: true,
        data: null,
        error: null,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error deleting user profile', { userId, error: errorMessage });
      return {
        success: false,
        error: typeof errorMessage === 'string' ? errorMessage : 'Unknown error',
        data: null,
      };
    }
  }

  /**
   * Search profiles with advanced filtering
   */
  async searchProfiles(query: string, companyId?: string): Promise<ServiceResponse<DatabaseProfile[]>> {
    try {
      logger.info('Searching profiles', { query, companyId });
      
      // Use selectWithOptions for more complex filtering
      const filter: Record<string, string | number | boolean> = {};
      if (companyId) {
        filter.company_id = companyId;
      }

      const result = await this.unifiedDatabaseService.selectWithOptions<DatabaseProfile>('user_profiles', {
        filter,
        columns: '*'
      });
      
      if (result.error) {
        logger.error('Failed to search profiles', { query, companyId, error: result.error });
        return {
          success: false,
          error: result.error || 'Failed to search profiles',
          data: null,
        };
      }

      // Filter results by query string
      const filteredData = result.data?.filter(profile => 
        profile.first_name?.toLowerCase().includes(query.toLowerCase()) ||
        profile.last_name?.toLowerCase().includes(query.toLowerCase()) ||
        profile.display_name?.toLowerCase().includes(query.toLowerCase())
      ) || [];

      logger.info('Successfully searched profiles', { 
        query, 
        companyId, 
        count: filteredData.length 
      });
      
      return {
        success: true,
        data: filteredData,
        error: null,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error searching profiles', { query, companyId, error: errorMessage });
      return {
        success: false,
        error: typeof errorMessage === 'string' ? errorMessage : 'Unknown error',
        data: null,
      };
    }
  }

  /**
   * Get profiles by company
   */
  async getProfilesByCompany(companyId: string): Promise<ServiceResponse<DatabaseProfile[]>> {
    try {
      logger.info('Getting profiles by company', { companyId });
      
      const result = await this.unifiedDatabaseService.selectWithOptions<DatabaseProfile>('user_profiles', {
        filter: { company_id: companyId },
        orderBy: { column: 'created_at', ascending: false }
      });
      
      if (result.error) {
        logger.error('Failed to get profiles by company', { companyId, error: result.error });
        return {
          success: false,
          error: result.error || 'Failed to get profiles by company',
          data: null,
        };
      }

      logger.info('Successfully retrieved profiles by company', { 
        companyId, 
        count: result.data?.length || 0 
      });
      
      return {
        success: true,
        data: result.data || [],
        error: null,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error getting profiles by company', { companyId, error: errorMessage });
      return {
        success: false,
        error: typeof errorMessage === 'string' ? errorMessage : 'Unknown error',
        data: null,
      };
    }
  }

  /**
   * Update profile completion percentage
   */
  async updateProfileCompletion(userId: string): Promise<ServiceResponse<number>> {
    try {
      logger.info('Updating profile completion percentage', { userId });
      
      // Get current profile
      const profileResult = await this.getUserProfile(userId);
      if (!profileResult.success || !profileResult.data) {
        return {
          success: false,
          error: 'Failed to get profile for completion calculation',
          data: null,
        };
      }

      const profile = profileResult.data;
      
      // Calculate completion percentage based on filled fields
      const requiredFields = [
        'first_name', 'last_name', 'display_name', 'personal_email', 
        'job_title', 'department', 'phone', 'avatar_url'
      ];
      
      const filledFields = requiredFields.filter(field => 
        profile[field as keyof DatabaseProfile] && 
        profile[field as keyof DatabaseProfile] !== ''
      );
      
      const completionPercentage = Math.round((filledFields.length / requiredFields.length) * 100);
      
      // Update the profile with new completion percentage
      const updateResult = await this.updateUserProfile(userId, {
        profile_completion_percentage: completionPercentage
      });
      
      if (!updateResult.success) {
        return {
          success: false,
          error: updateResult.error || 'Failed to update profile completion',
          data: null,
        };
      }

      logger.info('Successfully updated profile completion', { 
        userId, 
        completionPercentage 
      });
      
      return {
        success: true,
        data: completionPercentage,
        error: null,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error updating profile completion', { userId, error: errorMessage });
      return {
        success: false,
        error: typeof errorMessage === 'string' ? errorMessage : 'Unknown error',
        data: null,
      };
    }
  }

  /**
   * Get profile statistics
   */
  async getProfileStats(companyId?: string): Promise<ServiceResponse<{
    totalProfiles: number;
    activeProfiles: number;
    completedProfiles: number;
    averageCompletion: number;
  }>> {
    try {
      logger.info('Getting profile statistics', { companyId });
      
      const filter = companyId ? { company_id: companyId } : undefined;
      
      const result = await this.unifiedDatabaseService.selectWithOptions<DatabaseProfile>('user_profiles', {
        filter,
        columns: 'id,status,profile_completion_percentage'
      });
      
      if (result.error) {
        logger.error('Failed to get profile statistics', { companyId, error: result.error });
        return {
          success: false,
          error: result.error || 'Failed to get profile statistics',
          data: null,
        };
      }

      const profiles = result.data || [];
      const totalProfiles = profiles.length;
      const activeProfiles = profiles.filter((p: any) => p.status === 'active').length;
      const completedProfiles = profiles.filter((p: any) => 
        p.profile_completion_percentage && p.profile_completion_percentage >= 80
      ).length;
      
      const averageCompletion = profiles.length > 0 
        ? Math.round(profiles.reduce((sum: number, p: any) => sum + (p.profile_completion_percentage || 0), 0) / profiles.length)
        : 0;

      const stats = {
        totalProfiles,
        activeProfiles,
        completedProfiles,
        averageCompletion,
      };

      logger.info('Successfully retrieved profile statistics', { companyId, stats });
      
      return {
        success: true,
        data: stats,
        error: null,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error getting profile statistics', { companyId, error: errorMessage });
      return {
        success: false,
        error: typeof errorMessage === 'string' ? errorMessage : 'Unknown error',
        data: null,
      };
    }
  }
}

// Export singleton instance
export const databaseService = new DatabaseService(); 
