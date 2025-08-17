import { z } from 'zod';
import { BaseService, type ServiceResponse } from '@/core/services/BaseService';
import type { CrudServiceInterface } from '@/core/services/interfaces';
import { selectOne, insertOne, updateOne, deleteOne, selectData, callRPC } from '@/lib/api-client';
import { logger } from '@/shared/utils/logger';
import { userMappingService } from '@/shared/services/UserMappingService';

// User Profile Schema
export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().optional().nullable(),
  first_name: z.string().min(1).max(100).optional().nullable(),
  last_name: z.string().min(1).max(100).optional().nullable(),
  display_name: z.string().optional().nullable(),
  role: z.enum(['user', 'owner', 'admin', 'manager']).optional().nullable(),
  company_id: z.string().uuid().optional().nullable(),
  created_at: z.string().optional().nullable(),
  updated_at: z.string().optional().nullable(),
  avatar_url: z.string().url().optional().nullable(),
  phone: z.string().optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  preferences: z.record(z.any()).optional().nullable(),
  
  // Additional fields that AccountSettings expects
  job_title: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  business_email: z.string().email().optional().nullable(),
  personal_email: z.string().email().optional().nullable(),
  location: z.string().optional().nullable(),
  linkedin_url: z.string().url().optional().nullable(),
  company: z.string().optional().nullable(),
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
  status: z.enum(['active', 'inactive', 'pending', 'suspended']).optional().nullable(),
  last_login: z.string().optional().nullable(),
  onboarding_completed: z.boolean().optional().nullable(),
  profile_completion_percentage: z.number().optional().nullable(),
  employee_id: z.string().optional().nullable(),
  hire_date: z.string().optional().nullable(),
  manager_id: z.string().optional().nullable(),
  direct_reports: z.array(z.string()).optional().nullable(),
  date_of_birth: z.string().optional().nullable(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

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

export type Company = z.infer<typeof CompanySchema>;

// User Business Data Schema
export const UserBusinessDataSchema = z.object({
  user: UserProfileSchema,
  company: CompanySchema.optional(),
  integrations: z.array(z.record(z.any())).optional(),
  analytics: z.record(z.any()).optional(),
});

export type UserBusinessData = z.infer<typeof UserBusinessDataSchema>;

/**
 * User Service Configuration
 */
const userServiceConfig = {
  tableName: 'user_profiles',
  schema: UserProfileSchema,
  cacheEnabled: true,
  cacheTTL: 300000, // 5 minutes
  enableLogging: true,
};

/**
 * Modernized User Service
 * Extends BaseService for consistent CRUD operations
 */
export class UserService extends BaseService implements CrudServiceInterface<UserProfile> {
  protected config = userServiceConfig;

  /**
   * Get user profile by external user ID (handles mapping internally)
   */
  async getByExternalId(externalUserId: string): Promise<ServiceResponse<UserProfile>> {
    this.logMethodCall('getByExternalId', { externalUserId });
    
    return this.executeDbOperation(async () => {
      // Use the ensure_user_profile RPC function to get or create the profile
      const { data, error } = await callRPC('ensure_user_profile', { user_id: externalUserId });
      
      if (error) throw new Error(error);
      if (!data || !data[0]) throw new Error('User profile not found');
      
      const validatedData = this.config.schema.parse(data[0]);
      return { data: validatedData, error: null };
    }, `get user by external ID ${externalUserId}`);
  }

  /**
   * Get user by ID with additional business data
   */
  async getUserWithBusinessData(userId: string) {
    this.logMethodCall('getUserWithBusinessData', { userId });
    
    return this.executeDbOperation(async () => {
      // Get user profile
      const { data: user, error: userError } = await selectOne<UserProfile>('user_profiles', userId);
      
      if (userError) throw new Error(userError);
      if (!user) throw new Error('User not found');
      
      // Get company data if user has company_id
      let company: Company | undefined = undefined;
      if (user.company_id) {
        const { data: companyData, error: companyError } = await selectOne<Company>('companies', user.company_id);
        
        if (!companyError && companyData) {
          company = CompanySchema.parse(companyData);
        }
      }
      
      // Get integrations data
      const { data: integrations } = await selectData<any>('user_integrations', '*', { user_id: userId });
      
      // Get analytics data
      const { data: analytics } = await selectOne<any>('user_analytics', userId);
      
      const businessData: UserBusinessData = {
        user: UserProfileSchema.parse(user),
        company,
        integrations: integrations || [],
        analytics: analytics || {},
      };
      
      return { data: businessData, error: null };
    }, 'getUserWithBusinessData');
  }

  /**
   * Update user profile with validation
   */
  async updateUserProfile(userId: string, updates: Partial<UserProfile>) {
    this.logMethodCall('updateUserProfile', { userId, updates });
    
    // Validate updates against schema
    const validatedUpdates = UserProfileSchema.partial().parse(updates);
    
    return this.update(userId, validatedUpdates);
  }

    /**
   * Update user profile by external user ID (handles mapping internally)
   */
  async updateByExternalId(externalUserId: string, updates: Partial<UserProfile>): Promise<ServiceResponse<UserProfile>> {
    this.logMethodCall('updateByExternalId', { externalUserId, updates });
    
    return this.executeDbOperation(async () => {
      // Validate updates against schema
      const validatedUpdates = UserProfileSchema.partial().parse(updates);
      
      // Get internal user ID from external user ID
      const internalUserIdResponse = await userMappingService.getInternalUserId(externalUserId);
      if (!internalUserIdResponse.success || !internalUserIdResponse.data) {
        logger.error('Failed to get internal user ID for user profile update', { 
          externalUserId, 
          error: internalUserIdResponse.error 
        });
        return { data: null, error: internalUserIdResponse.error || 'Failed to get internal user ID' };
      }

      const internalUserId = internalUserIdResponse.data;
      
      // First, try to get the existing profile to see if it exists
      const { data: existingProfile, error: getError } = await selectOne<UserProfile>(this.config.tableName, internalUserId, 'user_id');
      
      let result;
      if (getError || !existingProfile) {
        // Profile doesn't exist, create it
        logger.info('User profile does not exist, creating new profile', { externalUserId, internalUserId });
        const { data: newProfile, error: createError } = await insertOne<UserProfile>(this.config.tableName, {
          user_id: internalUserId,
          ...validatedUpdates,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
        if (createError) throw new Error(createError);
        result = newProfile;
      } else {
        // Profile exists, update it
        // Use the internal user ID for the update
        const { data: updatedProfile, error: updateError } = await updateOne<UserProfile>(this.config.tableName, internalUserId, {
          ...validatedUpdates,
          updated_at: new Date().toISOString()
        }, 'user_id');
        
        if (updateError) throw new Error(updateError);
        result = updatedProfile;
      }
      
      const validatedData = this.config.schema.parse(result);
      return { data: validatedData, error: null };
    }, `update user by external ID ${externalUserId}`);
  }

  /**
   * Get users by company
   */
  async getUsersByCompany(companyId: string) {
    this.logMethodCall('getUsersByCompany', { companyId });
    
    return this.list({ company_id: companyId });
  }

  /**
   * Search users by name or email
   */
  async searchUsers(query: string, filters?: Record<string, any>) {
    this.logMethodCall('searchUsers', { query, filters });
    
    return this.search(query, filters);
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string) {
    this.logMethodCall('getUserByEmail', { email });
    
    return this.executeDbOperation(async () => {
      const { data, error } = await selectOne<UserProfile>(this.config.tableName, email, 'email');
      
      if (error) throw new Error(error);
      
      const validatedData = this.config.schema.parse(data);
      return { data: validatedData, error: null };
    }, `get user by email`);
  }

  /**
   * Bulk update user roles
   */
  async bulkUpdateRoles(updates: { userId: string; role: 'user' | 'owner' | 'admin' | 'manager' }[]) {
    this.logMethodCall('bulkUpdateRoles', { count: updates.length });
    
    const roleUpdates = updates.map(({ userId, role }) => ({
      id: userId,
      data: { role }
    }));
    
    return this.bulkUpdate(roleUpdates);
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: string) {
    this.logMethodCall('getUserStats', { userId });
    
    return this.executeDbOperation(async () => {
      // Get user activity count
      const { data: activities } = await selectData<any>('user_activities', '*', { user_id: userId });
      const activityCount = activities?.length || 0;
      
      // Get integration count
      const { data: integrations } = await selectData<any>('user_integrations', '*', { user_id: userId });
      const integrationCount = integrations?.length || 0;
      
      // Get last login
      const { data: lastLogin } = await selectOne<any>('auth_logs', userId, 'user_id');
      
      const stats = {
        activityCount,
        integrationCount,
        lastLogin: lastLogin?.created_at || null,
      };
      
      return { data: stats, error: null };
    }, 'getUserStats');
  }

  // CRUD Methods required by CrudServiceInterface
  async get(id: string): Promise<ServiceResponse<UserProfile>> {
    this.logMethodCall('get', { id });
    
    return this.executeDbOperation(async () => {
      const { data, error } = await selectOne<UserProfile>(this.config.tableName, id);
      
      if (error) throw new Error(error);
      
      const validatedData = this.config.schema.parse(data);
      return { data: validatedData, error: null };
    }, `get user ${id}`);
  }

  async create(data: Partial<UserProfile>): Promise<ServiceResponse<UserProfile>> {
    this.logMethodCall('create', { data });
    
    return this.executeDbOperation(async () => {
      const { data: result, error } = await insertOne<UserProfile>(this.config.tableName, {
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      if (error) throw new Error(error);
      
      const validatedData = this.config.schema.parse(result);
      return { data: validatedData, error: null };
    }, `create user`);
  }

  async update(id: string, data: Partial<UserProfile>): Promise<ServiceResponse<UserProfile>> {
    this.logMethodCall('update', { id, data });
    
    return this.executeDbOperation(async () => {
      const { data: result, error } = await updateOne<UserProfile>(this.config.tableName, id, {
        ...data,
        updated_at: new Date().toISOString()
      });
      
      if (error) throw new Error(error);
      
      const validatedData = this.config.schema.parse(result);
      return { data: validatedData, error: null };
    }, `update user ${id}`);
  }

  async delete(id: string): Promise<ServiceResponse<boolean>> {
    this.logMethodCall('delete', { id });
    
    return this.executeDbOperation(async () => {
      const { error } = await deleteOne(this.config.tableName, id);
      
      if (error) throw new Error(error);
      
      return { data: true, error: null };
    }, `delete user ${id}`);
  }

  async list(filters?: Record<string, any>): Promise<ServiceResponse<UserProfile[]>> {
    this.logMethodCall('list', { filters });
    
    return this.executeDbOperation(async () => {
      const { data, error } = await selectData<UserProfile>(this.config.tableName, '*', filters);
      
      if (error) throw new Error(error);
      
      const validatedData = (data || []).map(item => this.config.schema.parse(item));
      return { data: validatedData, error: null };
    }, `list users`);
  }

  async search(query: string, filters?: Record<string, any>): Promise<ServiceResponse<UserProfile[]>> {
    this.logMethodCall('search', { query, filters });
    
    return this.executeDbOperation(async () => {
      // For search, we'll use selectData with filters and implement text search
      const searchFilters = {
        ...filters,
        // Add text search filters if needed
      };
      
      const { data, error } = await selectData<UserProfile>(this.config.tableName, '*', searchFilters);
      
      if (error) throw new Error(error);
      
      // Filter results by query if needed
      const filteredData = (data || []).filter(item => 
        item.first_name?.toLowerCase().includes(query.toLowerCase()) ||
        item.last_name?.toLowerCase().includes(query.toLowerCase()) ||
        item.email?.toLowerCase().includes(query.toLowerCase())
      );
      
      const validatedData = filteredData.map(item => this.config.schema.parse(item));
      return { data: validatedData, error: null };
    }, `search users`);
  }

  /**
   * Bulk update users
   */
  async bulkUpdate(updates: Array<{ id: string; data: Partial<UserProfile> }>) {
    this.logMethodCall('bulkUpdate', { updateCount: updates.length });
    
    return this.executeDbOperation(async () => {
      const results: UserProfile[] = [];
      
      for (const { id, data: updateData } of updates) {
        const { data: result, error } = await updateOne<UserProfile>(this.config.tableName, id, {
          ...updateData,
          updated_at: new Date().toISOString()
        });
        
        if (error) throw new Error(error);
        if (result) {
          const validatedData = this.config.schema.parse(result);
          results.push(validatedData);
        }
      }
      
      return { data: results, error: null };
    }, `bulk update users`);
  }
}

// Create and export service instance
export const userService = new UserService(); 
