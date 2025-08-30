/**
 * Consolidated User Service
 * 
 * Merges functionality from:
 * - src/services/business/UserService.ts
 * - src/services/auth/UserProfileService.ts  
 * - src/services/business/userProfileService.ts
 * 
 * Provides unified user management with clear separation of concerns
 */

import { z } from 'zod';
import { BaseService, type ServiceResponse } from '@/core/services/BaseService';
import type { CrudServiceInterface } from '@/core/services/interfaces';
import { selectData, selectOne, insertOne, updateOne, deleteOne, callRPC } from '@/lib/api-client';
import { logger } from '@/shared/utils/logger';

// ============================================================================
// SCHEMAS
// ============================================================================

// Core User Profile Schema
export const UserProfileSchema = z.object({
  id: z.string(),
  external_user_id: z.string(),
  email: z.string(),
  first_name: z.string().min(1).max(100).optional().nullable(),
  last_name: z.string().min(1).max(100).optional().nullable(),
  full_name: z.string().optional().nullable(),
  display_name: z.string().optional().nullable(),
  avatar_url: z.string().url().optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  role: z.enum(['user', 'owner', 'admin', 'manager']).default('user'),
  company_id: z.string().uuid().optional().nullable(),
  created_at: z.string().optional().nullable(),
  updated_at: z.string().optional().nullable(),
  
  // Business Profile Fields
  job_title: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  business_email: z.string().email().optional().nullable(),
  personal_email: z.string().email().optional().nullable(),
  location: z.string().optional().nullable(),
  linkedin_url: z.string().url().optional().nullable(),
  company: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  mobile: z.string().optional().nullable(),
  work_phone: z.string().optional().nullable(),
  timezone: z.string().optional().nullable(),
  work_location: z.enum(['office', 'remote', 'hybrid']).optional().nullable(),
  address: z.record(z.any()).optional().nullable(),
  github_url: z.string().url().optional().nullable(),
  twitter_url: z.string().url().optional().nullable(),
  skills: z.array(z.string()).optional().nullable(),
  certifications: z.array(z.string()).optional().nullable(),
  languages: z.array(z.record(z.any())).optional().nullable(),
  emergency_contact: z.record(z.any()).optional().nullable(),
  status: z.enum(['active', 'inactive', 'pending', 'suspended']).default('active'),
  last_login: z.string().optional().nullable(),
  onboarding_completed: z.boolean().default(false),
  profile_completion_percentage: z.number().optional().nullable(),
  employee_id: z.string().optional().nullable(),
  hire_date: z.string().optional().nullable(),
  manager_id: z.string().optional().nullable(),
  direct_reports: z.array(z.string()).optional().nullable(),
  date_of_birth: z.string().optional().nullable(),
  preferences: z.record(z.any()).optional().nullable(),
});

// Company Schema
export const CompanySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  industry: z.string().optional(),
  size: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  website: z.string().url().optional(),
  description: z.string().max(1000).optional(),
});

// User Business Data Schema
export const UserBusinessDataSchema = z.object({
  user: UserProfileSchema,
  company: CompanySchema.optional(),
  integrations: z.array(z.record(z.any())).optional(),
  analytics: z.record(z.any()).optional(),
});

// Update Profile Request Schema
export const UpdateProfileRequestSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  display_name: z.string().optional(),
  job_title: z.string().optional(),
  company: z.string().optional(),
  role: z.enum(['user', 'owner', 'admin', 'manager']).optional(),
  department: z.string().optional(),
  business_email: z.string().email().optional(),
  personal_email: z.string().email().optional(),
  bio: z.string().optional(),
  location: z.string().optional(),
  linkedin_url: z.string().url().optional(),
  phone: z.string().optional(),
  avatar_url: z.string().url().optional(),
  preferences: z.record(z.any()).optional(),
});

// ============================================================================
// TYPES
// ============================================================================

export type UserProfile = z.infer<typeof UserProfileSchema>;
export type Company = z.infer<typeof CompanySchema>;
export type UserBusinessData = z.infer<typeof UserBusinessDataSchema>;
export type UpdateProfileRequest = z.infer<typeof UpdateProfileRequestSchema>;

// ============================================================================
// SERVICE CONFIGURATION
// ============================================================================

const userServiceConfig = {
  tableName: 'user_profiles',
  schema: UserProfileSchema,
  cacheEnabled: true,
  cacheTTL: 300000, // 5 minutes
  enableLogging: true,
};

// ============================================================================
// MAIN SERVICE CLASS
// ============================================================================

/**
 * Consolidated User Service
 * 
 * Provides unified user management with:
 * - Auth profile operations
 * - Business profile operations  
 * - Company operations
 * - User mapping and external ID handling
 */
export class UserService extends BaseService implements CrudServiceInterface<UserProfile> {
  private profileCache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 30000; // 30 seconds cache TTL
  
  constructor() {
    super();
  }

  /**
   * Get cached profile or fetch from database
   */
  private async getCachedOrFetchProfile(userId: string): Promise<any> {
    const now = Date.now();
    const cached = this.profileCache.get(userId);
    
    // Return cached data if still valid
    if (cached && (now - cached.timestamp) < this.CACHE_TTL) {
      this.logger.debug('Returning cached profile', { userId });
      return cached.data;
    }
    
    // Fetch fresh data
    const rpcResult = await callRPC('ensure_user_profile', { external_user_id: userId });
    
    if (!rpcResult.success) {
      throw new Error(`Failed to ensure user profile: ${rpcResult.error}`);
    }
    
    // Handle different response formats from RPC
    let profileData: any;
    if (rpcResult.data && Array.isArray(rpcResult.data)) {
      if (rpcResult.data.length === 0) {
        throw new Error('No user profile returned from ensure_user_profile');
      }
      profileData = rpcResult.data[0];
    } else if (rpcResult.data && typeof rpcResult.data === 'object') {
      profileData = rpcResult.data;
    } else {
      throw new Error('Invalid user profile data returned from ensure_user_profile');
    }
    

    
    // Cache the result
    this.profileCache.set(userId, { data: profileData, timestamp: now });
    
    return profileData;
  }

  /**
   * Clear cache for a specific user (call after updates)
   */
  private clearUserCache(userId: string): void {
    this.profileCache.delete(userId);
  }

  /**
   * Convert ApiResponse to ServiceResponse
   */
  private convertApiResponse<T>(apiResponse: { data: any; error: string | null }): ServiceResponse<T> {
    return {
      data: apiResponse.data as T,
      error: apiResponse.error,
      success: !apiResponse.error
    };
  }

  protected config = userServiceConfig;

  // ============================================================================
  // CRUD OPERATIONS (CrudServiceInterface)
  // ============================================================================

  /**
   * Get user profile by ID
   */
  async get(id: string): Promise<ServiceResponse<UserProfile>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('get', { id });
      
      const result = await selectOne(this.config.tableName, id);
      const serviceResponse = this.convertApiResponse<UserProfile>(result);
      
      if (!serviceResponse.success) {
        return serviceResponse;
      }
      
      if (!serviceResponse.data) {
        return { data: null, error: 'User profile not found', success: false };
      }
      
      const validatedData = this.config.schema.parse(serviceResponse.data);
      return { data: validatedData, error: null, success: true };
    }, `get user profile ${id}`);
  }

  /**
   * Create new user profile
   */
  async create(data: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>): Promise<ServiceResponse<UserProfile>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('create', { data });
      
      const result = await insertOne(this.config.tableName, {
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      const serviceResponse = this.convertApiResponse<UserProfile>(result);
      
      if (!serviceResponse.success) {
        return serviceResponse;
      }
      
      const validatedData = this.config.schema.parse(serviceResponse.data);
      return { data: validatedData, error: null, success: true };
    }, `create user profile`);
  }

  /**
   * Update user profile
   */
  async update(id: string, data: Partial<UserProfile>): Promise<ServiceResponse<UserProfile>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('update', { id, data });
      
      const result = await updateOne(this.config.tableName, id, {
        ...data,
        updated_at: new Date().toISOString()
      });
      
      const serviceResponse = this.convertApiResponse<UserProfile>(result);
      
      if (!serviceResponse.success) {
        return serviceResponse;
      }
      
      const validatedData = this.config.schema.parse(serviceResponse.data);
      return { data: validatedData, error: null, success: true };
    }, `update user profile ${id}`);
  }

  /**
   * Delete user profile
   */
  async delete(id: string): Promise<ServiceResponse<boolean>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('delete', { id });
      
      const result = await deleteOne(this.config.tableName, id);
      const serviceResponse = this.convertApiResponse<boolean>(result);
      
      if (!serviceResponse.success) {
        return serviceResponse;
      }
      
      return { data: true, error: null, success: true };
    }, `delete user profile ${id}`);
  }

  /**
   * List user profiles with filters
   */
  async list(filters?: Record<string, any>): Promise<ServiceResponse<UserProfile[]>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('list', { filters });
      
      const result = await selectData(this.config.tableName, '*', filters);
      const serviceResponse = this.convertApiResponse<UserProfile[]>(result);
      
      if (!serviceResponse.success) {
        return serviceResponse;
      }
      
      const validatedData = (serviceResponse.data || []).map((item: any) => this.config.schema.parse(item));
      return { data: validatedData, error: null, success: true };
    }, `list user profiles`);
  }

  // ============================================================================
  // AUTH PROFILE OPERATIONS
  // ============================================================================

  /**
   * Get user profile by external user ID (handles mapping internally)
   */
  async getAuthProfile(userId: string): Promise<ServiceResponse<UserProfile>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('getAuthProfile', { userId });
      
      try {
        // Use cached profile fetching to prevent excessive RPC calls
        const rawData = await this.getCachedOrFetchProfile(userId);
        
        // Debug logging removed for security
        
        // Simple mapping - just return the basic data
        const profileData = {
          id: rawData.id ?? rawData.user_id,
          external_user_id: userId,
          email: rawData.email,
          first_name: rawData.first_name,
          last_name: rawData.last_name,
          created_at: rawData.created_at,
          updated_at: rawData.updated_at,
          role: 'user',
          status: 'active',
          company_id: rawData.company_id,
          organization_id: rawData.organization_id, // Added organization_id
          job_title: rawData.job_title,
          display_name: rawData.display_name,
          onboarding_completed: rawData.onboarding_completed,
          preferences: rawData.preferences
        };
        
        return { data: profileData as any, error: null, success: true };
      } catch (error) {
        this.logger.error('Exception in getAuthProfile', { userId, error });
        return { data: null, error: error instanceof Error ? error.message : 'Unknown error', success: false };
      }
    }, `get auth profile for user ${userId}`);
  }

  /**
   * Create or update auth profile (onboarding upsert)
   */
  async upsertAuthProfile(userId: string, profileData: Partial<UserProfile>): Promise<ServiceResponse<UserProfile>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('upsertAuthProfile', { userId, profileData });
      
      try {
        // First ensure the profile exists using cached fetching
        const existingProfile = await this.getCachedOrFetchProfile(userId);
        
        // Update the existing profile (use user_id as the key)
        const result = await updateOne(this.config.tableName, existingProfile.user_id, {
          ...profileData,
          updated_at: new Date().toISOString()
        }, 'user_id');
        
        const serviceResponse = this.convertApiResponse<UserProfile>(result);
        
        if (!serviceResponse.success) {
          return serviceResponse;
        }
        
        // Clear cache to ensure fresh data on next fetch
        this.clearUserCache(userId);
        
        // Add external_user_id and ensure id is mapped correctly
        const updatedProfileData = {
          ...(serviceResponse.data as any),
          id: (serviceResponse.data as any).id ?? (serviceResponse.data as any).user_id,
          external_user_id: userId
        };
        
        const validatedData = this.config.schema.parse(updatedProfileData);
        return { data: validatedData, error: null, success: true };
      } catch (error) {
        return { data: null, error: `Failed to upsert user profile: ${error instanceof Error ? error.message : 'Unknown error'}`, success: false };
      }
    }, `upsert auth profile for user ${userId}`);
  }

  // ============================================================================
  // BUSINESS PROFILE OPERATIONS
  // ============================================================================

  /**
   * Get complete business profile with company data
   */
  async getBusinessProfile(userId: string): Promise<ServiceResponse<UserBusinessData>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('getBusinessProfile', { userId });
      
      // Get user profile
      const userResult = await this.getAuthProfile(userId);
      if (!userResult.success || !userResult.data) {
        return { data: null, error: userResult.error || 'Failed to get user profile', success: false };
      }
      
      let companyData: Company | undefined;
      
      // Get company data if user has company_id
      if (userResult.data.company_id) {
        const companyResult = await this.getCompanyProfile(userResult.data.company_id);
        if (companyResult.success && companyResult.data) {
          companyData = companyResult.data;
        }
      }
      
      // Get integrations data
      const integrationsResult = await this.getUserIntegrations(userId);
      const integrations = integrationsResult.success && integrationsResult.data ? integrationsResult.data : [];
      
      // Get analytics data
      const analyticsResult = await this.getUserAnalytics(userId);
      const analytics = analyticsResult.success && analyticsResult.data ? analyticsResult.data : {};
      
      const businessData: UserBusinessData = {
        user: userResult.data,
        company: companyData,
        integrations,
        analytics
      };
      
      return { data: businessData, error: null, success: true };
    }, `get business profile for user ${userId}`);
  }

  /**
   * Update business profile
   */
  async updateBusinessProfile(userId: string, data: Partial<UserBusinessData>): Promise<ServiceResponse<UserBusinessData>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('updateBusinessProfile', { userId, data });
      
      // Update user profile
      if (data.user) {
        const userResult = await this.upsertAuthProfile(userId, data.user);
        if (!userResult.success) {
          return { data: null, error: userResult.error || 'Failed to update user profile', success: false };
        }
      }
      
      // Update company profile if provided
      if (data.company) {
        const companyResult = await this.updateCompanyProfile(data.company.id, data.company);
        if (!companyResult.success) {
          return { data: null, error: companyResult.error || 'Failed to update company profile', success: false };
        }
      }
      
      // Return updated business profile
      return await this.getBusinessProfile(userId);
    }, `update business profile for user ${userId}`);
  }

  // ============================================================================
  // COMPANY OPERATIONS
  // ============================================================================

  /**
   * Get company profile
   */
  async getCompanyProfile(companyId: string): Promise<ServiceResponse<Company>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('getCompanyProfile', { companyId });
      
      const result = await selectOne('companies', companyId);
      const serviceResponse = this.convertApiResponse<Company>(result);
      
      if (!serviceResponse.success) {
        return serviceResponse;
      }
      
      if (!serviceResponse.data) {
        return { data: null, error: 'Company not found', success: false };
      }
      
      const validatedData = CompanySchema.parse(serviceResponse.data);
      return { data: validatedData, error: null, success: true };
    }, `get company profile ${companyId}`);
  }

  /**
   * Update company profile
   */
  async updateCompanyProfile(companyId: string, data: Partial<Company>): Promise<ServiceResponse<Company>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('updateCompanyProfile', { companyId, data });
      
      const result = await updateOne('companies', companyId, {
        ...data,
        updated_at: new Date().toISOString()
      });
      
      const serviceResponse = this.convertApiResponse<Company>(result);
      
      if (!serviceResponse.success) {
        return serviceResponse;
      }
      
      const validatedData = CompanySchema.parse(serviceResponse.data);
      return { data: validatedData, error: null, success: true };
    }, `update company profile ${companyId}`);
  }

  /**
   * Create company profile
   */
  async createCompanyProfile(data: Partial<Company>): Promise<ServiceResponse<Company>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('createCompanyProfile', { data });
      
      const result = await insertOne('companies', {
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      const serviceResponse = this.convertApiResponse<Company>(result);
      
      if (!serviceResponse.success) {
        return serviceResponse;
      }
      
      const validatedData = CompanySchema.parse(serviceResponse.data);
      return { data: validatedData, error: null, success: true };
    }, `create company profile`);
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Get user integrations
   */
  private async getUserIntegrations(userId: string): Promise<ServiceResponse<any[]>> {
    try {
      // First try to get the user profile directly
      const profileResult = await selectData(this.config.tableName, 'user_id', {
        external_user_id: userId
      });
      
      let internalUserId = userId; // Default to the provided userId
      
      if (!profileResult.error && profileResult.data && profileResult.data.length > 0) {
        internalUserId = (profileResult.data[0] as any).user_id;
      } else {
        // If no profile found, try to create one using the RPC function
        const rpcResult = await callRPC('ensure_user_profile', { user_id: userId });
        
        if (rpcResult.success && rpcResult.data) {
          // Handle different response formats
          if (Array.isArray(rpcResult.data) && rpcResult.data.length > 0) {
            internalUserId = (rpcResult.data[0] as any).user_id;
          } else if (typeof rpcResult.data === 'object' && rpcResult.data) {
            internalUserId = (rpcResult.data as any).user_id;
          }
        }
      }
      
      // Now query user_integrations with the internal user ID
      const result = await selectData('user_integrations', '*', { user_id: internalUserId });
      const serviceResponse = this.convertApiResponse<any[]>(result);
      
      return { 
        data: serviceResponse.success ? (serviceResponse.data || []) : [], 
        error: null, 
        success: true 
      };
    } catch (error) {
      return { data: [], error: null, success: true }; // Return empty array on error
    }
  }

  /**
   * Get user analytics
   */
  private async getUserAnalytics(userId: string): Promise<ServiceResponse<any>> {
    try {
      const result = await callRPC('get_user_analytics', { user_uuid: userId });
      return { 
        data: result.success ? (result.data || {}) : {}, 
        error: null, 
        success: true 
      };
    } catch (error) {
      return { data: {}, error: null, success: true }; // Return empty object on error
    }
  }

  /**
   * Calculate profile completion percentage
   */
  calculateProfileCompletion(profile: UserProfile): number {
    const requiredFields = [
      'first_name', 'last_name', 'email', 'job_title', 
      'department', 'phone', 'location'
    ];
    
    const optionalFields = [
      'bio', 'linkedin_url', 'avatar_url', 'skills', 
      'certifications', 'emergency_contact'
    ];
    
    const allFields = [...requiredFields, ...optionalFields];
    let completedFields = 0;
    
    allFields.forEach(field => {
      const value = (profile as any)[field];
      if (value && (typeof value === 'string' ? value.trim() : true)) {
        completedFields++;
      }
    });
    
    return Math.round((completedFields / allFields.length) * 100);
  }

  /**
   * Update profile completion percentage
   */
  async updateProfileCompletion(userId: string): Promise<ServiceResponse<number>> {
    return this.executeDbOperation(async () => {
      const profileResult = await this.getAuthProfile(userId);
      if (!profileResult.success || !profileResult.data) {
        return { data: null, error: profileResult.error || 'Failed to get user profile', success: false };
      }
      
      const completionPercentage = this.calculateProfileCompletion(profileResult.data);
      
      const updateResult = await this.update(profileResult.data.id, {
        profile_completion_percentage: completionPercentage
      });
      
      if (!updateResult.success) {
        return { data: null, error: updateResult.error || 'Failed to update profile completion', success: false };
      }
      
      return { data: completionPercentage, error: null, success: true };
    }, `update profile completion for user ${userId}`);
  }
}

// ============================================================================
// EXPORT SINGLETON INSTANCE
// ============================================================================

export const userService = new UserService();
