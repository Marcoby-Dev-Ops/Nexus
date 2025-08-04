import { BaseService } from '@/core/services/BaseService';
import type { ServiceResponse } from '@/core/services/BaseService';
import { supabase } from '@/lib/supabase';

export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  job_title?: string | null;
  company?: string | null;
  role?: string | null;
  department?: string | null;
  business_email?: string | null;
  personal_email?: string | null;
  location?: string | null;
  linkedin_url?: string | null;
  phone?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  company_id?: string | null;
}

export interface UpdateProfileRequest {
  first_name?: string;
  last_name?: string;
  display_name?: string;
  job_title?: string;
  company?: string;
  role?: string;
  department?: string;
  business_email?: string;
  personal_email?: string;
  bio?: string;
  location?: string;
  linkedin_url?: string;
  phone?: string;
}

export class UserProfileService extends BaseService {
  constructor() {
    super('UserProfileService');
  }

  /**
   * Get user profile by user ID
   */
  async getUserProfile(userId: string): Promise<ServiceResponse<UserProfile>> {
    this.logMethodCall('getUserProfile', { userId });
    
    // Validate parameters
    const validationError = this.validateIdParam(userId, 'userId');
    if (validationError) {
      return this.createErrorResponse(validationError);
    }
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      return this.createSuccessResponse(data);
    } catch (error) {
      return this.handleError(error, 'getUserProfile');
    }
  }

  /**
   * Create or update user profile
   */
  async upsertUserProfile(userId: string, profileData: Partial<UserProfile>): Promise<ServiceResponse<UserProfile>> {
    this.logMethodCall('upsertUserProfile', { userId, profileData });
    
    // Validate parameters
    const validationError = this.validateIdParam(userId, 'userId');
    if (validationError) {
      return this.createErrorResponse(validationError);
    }
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: userId,
          ...profileData,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      return this.createSuccessResponse(data);
    } catch (error) {
      return this.handleError(error, 'upsertUserProfile');
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, updates: UpdateProfileRequest): Promise<ServiceResponse<UserProfile>> {
    this.logMethodCall('updateUserProfile', { userId, updates });
    
    // Validate parameters
    const validationError = this.validateIdParam(userId, 'userId');
    if (validationError) {
      return this.createErrorResponse(validationError);
    }
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      return this.createSuccessResponse(data);
    } catch (error) {
      return this.handleError(error, 'updateUserProfile');
    }
  }

  /**
   * Delete user profile
   */
  async deleteUserProfile(userId: string): Promise<ServiceResponse<boolean>> {
    this.logMethodCall('deleteUserProfile', { userId });
    
    // Validate parameters
    const validationError = this.validateIdParam(userId, 'userId');
    if (validationError) {
      return this.createErrorResponse(validationError);
    }
    
    try {
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      return this.createSuccessResponse(true);
    } catch (error) {
      return this.handleError(error, 'deleteUserProfile');
    }
  }

  /**
   * Upload profile avatar
   */
  async uploadAvatar(userId: string, file: File): Promise<ServiceResponse<UserProfile>> {
    this.logMethodCall('uploadAvatar', { userId, fileName: file.name });
    
    // Validate parameters
    const validationError = this.validateIdParam(userId, 'userId');
    if (validationError) {
      return this.createErrorResponse(validationError);
    }
    
    if (!file || file.size === 0) {
      return this.createErrorResponse('File is required');
    }
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('user-avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('user-avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          avatar_url: urlData.publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      return this.createSuccessResponse(data);
    } catch (error) {
      return this.handleError(error, 'uploadAvatar');
    }
  }

  /**
   * Get user profile by email
   */
  async getUserProfileByEmail(email: string): Promise<ServiceResponse<UserProfile>> {
    this.logMethodCall('getUserProfileByEmail', { email });
    
    // Validate parameters
    const validationError = this.validateStringParam(email, 'email');
    if (validationError) {
      return this.createErrorResponse(validationError);
    }
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('email', email)
        .single();

      if (error) throw error;

      return this.createSuccessResponse(data);
    } catch (error) {
      return this.handleError(error, 'getUserProfileByEmail');
    }
  }

  /**
   * Search users by name or company
   */
  async searchUsers(query: string, limit = 10): Promise<ServiceResponse<UserProfile[]>> {
    this.logMethodCall('searchUsers', { query, limit });
    
    // Validate parameters
    const validationError = this.validateStringParam(query, 'query');
    if (validationError) {
      return this.createErrorResponse(validationError);
    }
    
    if (limit < 1 || limit > 100) {
      return this.createErrorResponse('Limit must be between 1 and 100');
    }
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .or(`full_name.ilike.%${query}%,company.ilike.%${query}%`)
        .limit(limit);

      if (error) throw error;

      return this.createSuccessResponse(data || []);
    } catch (error) {
      return this.handleError(error, 'searchUsers');
    }
  }
}

export const userProfileService = new UserProfileService(); 