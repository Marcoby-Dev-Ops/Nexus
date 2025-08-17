/**
 * User Profile Service
 * Provides user profile management functionality with CRUD operations
 * 
 * Extends BaseService for consistent error handling and logging
 */

import { selectData as select, selectOne, insertOne, updateOne, deleteOne, callEdgeFunction } from '@/lib/api-client';
import { BaseService } from '@/core/services/BaseService';
import type { ServiceResponse } from '@/core/services/BaseService';
import type { CrudServiceInterface } from '@/core/services/interfaces';
import { z } from 'zod';

// User Profile Schema
export const UserProfileSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  email: z.string().email(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  full_name: z.string().optional(),
  display_name: z.string().optional(),
  avatar_url: z.string().optional(),
  bio: z.string().optional(),
  role: z.enum(['owner', 'admin', 'manager', 'user']).default('user'),
  department: z.string().optional(),
  job_title: z.string().optional(),
  company_id: z.string().optional(),
  business_email: z.string().email().optional(),
  personal_email: z.string().email().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  timezone: z.string().optional(),
  preferences: z.record(z.any()).optional(),
  onboarding_completed: z.boolean().default(false),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

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
  full_name?: string;
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

/**
 * User Profile Service
 * Provides user profile management functionality with CRUD operations
 * 
 * Extends BaseService for consistent error handling and logging
 */
export class UserProfileService extends BaseService implements CrudServiceInterface<UserProfile> {
  private tableName = 'user_profiles';

  /**
   * Get a single user profile by ID
   */
  async get(id: string): Promise<ServiceResponse<UserProfile>> {
    return this.executeDbOperation(async () => {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return { data: UserProfileSchema.parse(data), error: null };
    }, `get user profile ${id}`);
  }

  /**
   * Create a new user profile
   */
  async create(data: Partial<UserProfile>): Promise<ServiceResponse<UserProfile>> {
    return this.executeDbOperation(async () => {
      const { id, email, first_name, last_name, role = 'user', company_id, preferences } = data;

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

      const { data: result, error } = await supabase
        .from(this.tableName)
        .insert(profileData)
        .select()
        .single();

      if (error) throw error;
      return { data: UserProfileSchema.parse(result), error: null };
    }, `create user profile`);
  }

  /**
   * Update an existing user profile
   */
  async update(id: string, data: Partial<UserProfile>): Promise<ServiceResponse<UserProfile>> {
    return this.executeDbOperation(async () => {
      if (!id) {
        throw new Error('User ID is required');
      }

      // Validate role if provided
      if (data.role && !['owner', 'admin', 'manager', 'user'].includes(data.role)) {
        throw new Error('Invalid role value');
      }

      // Calculate full_name if first_name or last_name are updated
      let full_name = data.full_name;
      if (data.first_name || data.last_name) {
        const { data: currentProfile } = await this.get(id);
        const firstName = data.first_name || currentProfile?.first_name;
        const lastName = data.last_name || currentProfile?.last_name;
        
        if (firstName && lastName) {
          full_name = `${firstName} ${lastName}`.trim();
        } else {
          full_name = firstName || lastName || full_name;
        }
      }

      const updateData = {
        ...data,
        full_name,
        updated_at: new Date().toISOString()
      };

      const { data: result, error } = await supabase
        .from(this.tableName)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data: UserProfileSchema.parse(result), error: null };
    }, `update user profile ${id}`);
  }

  /**
   * Delete a user profile
   */
  async delete(id: string): Promise<ServiceResponse<boolean>> {
    return this.executeDbOperation(async () => {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { data: true, error: null };
    }, `delete user profile ${id}`);
  }

  /**
   * List user profiles with optional filters
   */
  async list(filters?: Record<string, any>): Promise<ServiceResponse<UserProfile[]>> {
    return this.executeDbOperation(async () => {
      let query = supabase
        .from(this.tableName)
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              query = query.in(key, value);
            } else {
              query = query.eq(key, value);
            }
          }
        });
      }

      const { data, error } = await query;

      if (error) throw error;
      const validatedData = data?.map(item => UserProfileSchema.parse(item)) || [];
      return { data: validatedData, error: null };
    }, `list user profiles`);
  }

  /**
   * Create a new user profile with proper validation
   */
  async createUserProfile(params: CreateUserProfileParams): Promise<ServiceResponse<UserProfile>> {
    return this.create(params);
  }

  /**
   * Update user profile with validation and proper field mapping
   */
  async updateUserProfile(userId: string, updates: UpdateUserProfileParams): Promise<ServiceResponse<UserProfile>> {
    return this.update(userId, updates);
  }

  /**
   * Get user profile by user ID
   */
  async getUserProfile(userId: string): Promise<ServiceResponse<UserProfile>> {
    return this.executeDbOperation(async () => {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return { data: UserProfileSchema.parse(data), error: null };
    }, `get user profile for user ${userId}`);
  }

  /**
   * Complete user onboarding
   */
  async completeOnboarding(userId: string, companyData?: any): Promise<ServiceResponse<UserProfile>> {
    return this.executeDbOperation(async () => {
      const updateData = {
        onboarding_completed: true,
        updated_at: new Date().toISOString()
      };

      // If company data is provided, update company_id
      if (companyData?.company_id) {
        updateData.company_id = companyData.company_id;
      }

      const { data: result, error } = await supabase
        .from(this.tableName)
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return { data: UserProfileSchema.parse(result), error: null };
    }, `complete onboarding for user ${userId}`);
  }

  /**
   * Calculate profile completion percentage
   */
  calculateProfileCompletion(profile: UserProfile): number {
    const requiredFields = ['email', 'first_name', 'last_name', 'role'];
    const optionalFields = ['avatar_url', 'bio', 'department', 'job_title', 'phone', 'location'];
    
    let completedFields = 0;
    const totalFields = requiredFields.length + optionalFields.length;

    // Check required fields
    requiredFields.forEach(field => {
      if (profile[field as keyof UserProfile]) {
        completedFields++;
      }
    });

    // Check optional fields
    optionalFields.forEach(field => {
      if (profile[field as keyof UserProfile]) {
        completedFields++;
      }
    });

    return Math.round((completedFields / totalFields) * 100);
  }

  /**
   * Validate profile data
   */
  validateProfileData(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      UserProfileSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push(...error.errors.map(e => e.message));
      } else {
        errors.push('Invalid profile data');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
export const userProfileService = new UserProfileService(); 
