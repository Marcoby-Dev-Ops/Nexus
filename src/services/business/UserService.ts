import { z } from 'zod';
import { BaseService } from '@/core/services/BaseService';
import type { ServiceResponse } from '@/core/services/BaseService';
import type { CrudServiceInterface, ServiceConfig } from '@/core/services/interfaces';

// User Profile Schema
export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().optional().nullable(),
  first_name: z.string().min(1).max(100).optional().nullable(),
  last_name: z.string().min(1).max(100).optional().nullable(),
  role: z.enum(['user', 'owner', 'admin', 'manager']).optional().nullable(),
  company_id: z.string().uuid().optional().nullable(),
  created_at: z.string().datetime().optional().nullable(),
  updated_at: z.string().datetime().optional().nullable(),
  avatar_url: z.string().url().optional().nullable(),
  phone: z.string().optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  preferences: z.record(z.any()).optional().nullable(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

// Company Schema
export const CompanySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  industry: z.string().optional(),
  size: z.string().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
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
const userServiceConfig: ServiceConfig = {
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
   * Get user by ID with additional business data
   */
  async getUserWithBusinessData(userId: string) {
    this.logMethodCall('getUserWithBusinessData', { userId });
    
    return this.executeDbOperation(async () => {
      // Get user profile
      const { data: user, error: userError } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (userError) throw userError;
      
      // Get company data if user has company_id
      let company = null;
      if (user.company_id) {
        const { data: companyData, error: companyError } = await this.supabase
          .from('companies')
          .select('*')
          .eq('id', user.company_id)
          .single();
        
        if (!companyError && companyData) {
          company = CompanySchema.parse(companyData);
        }
      }
      
      // Get integrations data
      const { data: integrations } = await this.supabase
        .from('user_integrations')
        .select('*')
        .eq('user_id', userId);
      
      // Get analytics data
      const { data: analytics } = await this.supabase
        .from('user_analytics')
        .select('*')
        .eq('user_id', userId)
        .single();
      
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
      const { data, error } = await this.supabase
        .from(this.config.tableName)
        .select('*')
        .eq('email', email)
        .single();
      
      if (error) throw error;
      
      const validatedData = this.config.schema.parse(data);
      return { data: validatedData, error: null };
    }, 'getUserByEmail');
  }

  /**
   * Bulk update user roles
   */
  async bulkUpdateRoles(updates: { userId: string; role: string }[]) {
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
      const { count: activityCount } = await this.supabase
        .from('user_activities')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      
      // Get integration count
      const { count: integrationCount } = await this.supabase
        .from('user_integrations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      
      // Get last login
      const { data: lastLogin } = await this.supabase
        .from('auth_logs')
        .select('created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      const stats = {
        activityCount: activityCount || 0,
        integrationCount: integrationCount || 0,
        lastLogin: lastLogin?.created_at || null,
      };
      
      return { data: stats, error: null };
    }, 'getUserStats');
  }

  // CRUD Methods required by CrudServiceInterface
  async get(id: string): Promise<ServiceResponse<UserProfile>> {
    this.logMethodCall('get', { id });
    
    return this.executeDbOperation(async () => {
      const { data, error } = await this.supabase
        .from(this.config.tableName)
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      const validatedData = this.config.schema.parse(data);
      return { data: validatedData, error: null };
    }, `get user ${id}`);
  }

  async create(data: Partial<UserProfile>): Promise<ServiceResponse<UserProfile>> {
    this.logMethodCall('create', { data });
    
    return this.executeDbOperation(async () => {
      const { data: result, error } = await this.supabase
        .from(this.config.tableName)
        .insert({
          ...data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      const validatedData = this.config.schema.parse(result);
      return { data: validatedData, error: null };
    }, `create user`);
  }

  async update(id: string, data: Partial<UserProfile>): Promise<ServiceResponse<UserProfile>> {
    this.logMethodCall('update', { id, data });
    
    return this.executeDbOperation(async () => {
      const { data: result, error } = await this.supabase
        .from(this.config.tableName)
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      const validatedData = this.config.schema.parse(result);
      return { data: validatedData, error: null };
    }, `update user ${id}`);
  }

  async delete(id: string): Promise<ServiceResponse<boolean>> {
    this.logMethodCall('delete', { id });
    
    return this.executeDbOperation(async () => {
      const { error } = await this.supabase
        .from(this.config.tableName)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      return { data: true, error: null };
    }, `delete user ${id}`);
  }

  async list(filters?: Record<string, any>): Promise<ServiceResponse<UserProfile[]>> {
    this.logMethodCall('list', { filters });
    
    return this.executeDbOperation(async () => {
      let query = this.supabase
        .from(this.config.tableName)
        .select('*');
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      const validatedData = data.map(item => this.config.schema.parse(item));
      return { data: validatedData, error: null };
    }, `list users`);
  }

  async search(query: string, filters?: Record<string, any>): Promise<ServiceResponse<UserProfile[]>> {
    this.logMethodCall('search', { query, filters });
    
    return this.executeDbOperation(async () => {
      let supabaseQuery = this.supabase
        .from(this.config.tableName)
        .select('*')
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`);
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            supabaseQuery = supabaseQuery.eq(key, value);
          }
        });
      }
      
      const { data, error } = await supabaseQuery;
      
      if (error) throw error;
      
      const validatedData = data.map(item => this.config.schema.parse(item));
      return { data: validatedData, error: null };
    }, `search users`);
  }

  async bulkUpdate(updates: { id: string; data: Partial<UserProfile> }[]): Promise<ServiceResponse<UserProfile[]>> {
    this.logMethodCall('bulkUpdate', { count: updates.length });
    
    return this.executeDbOperation(async () => {
      const results: UserProfile[] = [];
      
      for (const { id, data: updateData } of updates) {
        const { data: result, error } = await this.supabase
          .from(this.config.tableName)
          .update({
            ...updateData,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single();
        
        if (error) throw error;
        
        const validatedData = this.config.schema.parse(result);
        results.push(validatedData);
      }
      
      return { data: results, error: null };
    }, `bulkUpdate users`);
  }
}

// Create and export service instance
export const userService = new UserService(); 
