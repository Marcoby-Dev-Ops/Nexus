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
import { selectData, selectOne, insertOne, updateOne, deleteOne, callRPC } from '@/lib/database';
import type { ApiResponse } from '@/lib/api-client';
import { logger } from '@/shared/utils/logger';

// ============================================================================
// SCHEMAS
// ============================================================================

// Contact detail schemas (for dynamic emails/phones in profile forms)
export const UserEmailSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  email: z.string().email(),
  label: z.string().optional(),
  is_primary: z.boolean().optional(),
  verified: z.boolean().optional(),
});

export const UserPhoneSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  phone: z.string().min(3).max(32),
  label: z.string().optional(),
  is_primary: z.boolean().optional(),
  verified: z.boolean().optional(),
});

// Core User Profile Schema (reverted and simplified)
export const UserProfileSchema = z.object({
  id: z.string(),
  external_user_id: z.string(),
  email: z.string().email().optional().nullable(), // Signup email
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
  location: z.string().optional().nullable(),
  linkedin_url: z.string().url().optional().nullable(),
  company: z.string().optional().nullable(),
  company_name: z.string().optional().nullable(),
  work_phone: z.string().optional().nullable(), // The only phone field
  timezone: z.string().optional().nullable(),
  work_location: z.enum(['office', 'remote', 'hybrid']).optional().nullable(),
  address: z.record(z.any()).optional().nullable(),
  github_url: z.string().url().optional().nullable(),
  twitter_url: z.string().url().optional().nullable(),
  skills: z.array(z.string()).optional().nullable(),
  certifications: z.array(z.string()).optional().nullable(),
  languages: z.array(z.record(z.any())).optional().nullable(),
  emergency_contact: z.record(z.any()).optional().nullable(),
  experience: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
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

// Update Profile Request Schema (reverted and simplified)
export const UpdateProfileRequestSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  display_name: z.string().optional(),
  job_title: z.string().optional(),
  company: z.string().optional(),
  role: z.enum(['user', 'owner', 'admin', 'manager']).optional(),
  department: z.string().optional(),
  bio: z.string().optional(),
  location: z.string().optional(),
  linkedin_url: z.string().url().optional(),
  avatar_url: z.string().url().optional(),
  preferences: z.record(z.any()).optional(),
  work_phone: z.string().optional(),
  timezone: z.string().optional(),
  work_location: z.enum(['office', 'remote', 'hybrid']).optional(),
  address: z.record(z.any()).optional(),
  github_url: z.string().url().optional(),
  twitter_url: z.string().url().optional(),
  skills: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
  languages: z.array(z.record(z.any())).optional(),
  emergency_contact: z.record(z.any()).optional(),
  status: z.enum(['active', 'inactive', 'pending', 'suspended']).optional(),
  last_login: z.string().optional(),
  onboarding_completed: z.boolean().optional(),
  profile_completion_percentage: z.number().optional(),
  employee_id: z.string().optional(),
  hire_date: z.string().optional(),
  manager_id: z.string().optional(),
  direct_reports: z.array(z.string()).optional(),
  date_of_birth: z.string().optional(),
  experience: z.string().optional(),
  company_name: z.string().optional(),
  website: z.string().optional(),
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
  protected config = userServiceConfig;

  constructor() {
    super();
  }

  /**
   * Extract a canonical profile object from common API/RPC envelopes.
   */
  private extractProfileRecord(input: any): any {
    let current = input;
    const seen = new Set<any>();
    let depth = 0;

    while (current && typeof current === 'object' && !seen.has(current) && depth < 12) {
      seen.add(current);
      depth += 1;

      if (Array.isArray(current)) {
        current = current.length > 0 ? current[0] : null;
        continue;
      }

      if ('profile' in current && current.profile && typeof current.profile === 'object') {
        current = current.profile;
        continue;
      }

      if ('data' in current && current.data && typeof current.data === 'object') {
        current = current.data;
        continue;
      }

      break;
    }

    return current;
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

    // Debug logging to see the actual response structure
    console.log('getCachedOrFetchProfile debug:', {
      userId,
      rpcResultData: rpcResult.data,
      isArray: Array.isArray(rpcResult.data),
      type: typeof rpcResult.data
    });

    // Handle different response formats from RPC
    let profileData: any;
    if (rpcResult.data && Array.isArray(rpcResult.data)) {
      if (rpcResult.data.length === 0) {
        throw new Error('No user profile returned from ensure_user_profile');
      }
      profileData = rpcResult.data[0];
    } else if (rpcResult.data && typeof rpcResult.data === 'object') {
      // Handle nested response structure: { success: true, profile: {...} }
      if ('profile' in rpcResult.data) {
        profileData = rpcResult.data.profile;
      } else {
        profileData = rpcResult.data;
      }
    } else {
      throw new Error('Invalid user profile data returned from ensure_user_profile');
    }

    profileData = this.extractProfileRecord(profileData);
    if (!profileData || typeof profileData !== 'object') {
      throw new Error('Unable to extract profile record from ensure_user_profile response');
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
  private convertApiResponse<T>(apiResponse: ApiResponse<T>): ServiceResponse<T> {
    let data = (apiResponse && 'data' in apiResponse ? apiResponse.data : null) as any;

    // Handle nested response structure where the actual data is wrapped in another data property
    // Example: { success: true, data: { success: true, data: {...} } }
    if (data && typeof data === 'object' && 'data' in data && 'success' in data) {
      data = data.data;
    }

    const error = (apiResponse && 'error' in apiResponse ? apiResponse.error : undefined) ?? null;
    return {
      data: data as T | null,
      error,
      success: error === null,
    };
  }

  /**
   * Normalize profile data to ensure proper data types
   */
  private normalizeProfileData(rawData: any): any {
    if (!rawData) return rawData;

    const unwrapped = this.extractProfileRecord(rawData);

    // Debug logging for normalized data input
    this.logger.info('normalizeProfileData - Input:', {
      rawData: unwrapped,
      company_id: unwrapped.company_id,
      hasCompanyId: !!unwrapped.company_id
    });

    // Derive a human-readable location from address JSON when location is missing
    let derivedLocation = unwrapped?.location;
    if ((!derivedLocation || (typeof derivedLocation === 'string' && derivedLocation.trim().length === 0)) && unwrapped?.address) {
      try {
        const addr = unwrapped.address;
        const display = addr.display_name || addr.formatted || addr.formatted_address;
        const parts: string[] = [];
        if (addr.city || addr.town || addr.village) parts.push(addr.city || addr.town || addr.village);
        if (addr.state || addr.region) parts.push(addr.state || addr.region);
        if (addr.country) parts.push(addr.country);
        const joined = parts.filter(Boolean).join(', ');
        derivedLocation = display || joined || undefined;
      } catch (_e) {
        // noop: keep location undefined if parsing fails
      }
    }

    return {
      ...unwrapped,
      id: unwrapped.id ?? unwrapped.user_id ?? unwrapped.external_user_id,
      location: derivedLocation ?? unwrapped.location ?? null,
      avatar_url: this.sanitizeUrl(unwrapped.avatar_url, 'avatar_url'),
      linkedin_url: this.sanitizeUrl(unwrapped.linkedin_url, 'linkedin_url'),
      github_url: this.sanitizeUrl(unwrapped.github_url, 'github_url'),
      twitter_url: this.sanitizeUrl(unwrapped.twitter_url, 'twitter_url'),
      // Ensure skills is properly formatted as array
      skills: unwrapped.skills ? (
        Array.isArray(unwrapped.skills)
          ? unwrapped.skills
          : typeof unwrapped.skills === 'string'
            ? unwrapped.skills.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0)
            : []
      ) : null,
      // Ensure other array fields are properly formatted
      certifications: unwrapped.certifications ? (
        Array.isArray(unwrapped.certifications)
          ? unwrapped.certifications
          : typeof unwrapped.certifications === 'string'
            ? unwrapped.certifications.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0)
            : []
      ) : null,
      direct_reports: unwrapped.direct_reports ? (
        Array.isArray(unwrapped.direct_reports)
          ? unwrapped.direct_reports
          : typeof unwrapped.direct_reports === 'string'
            ? unwrapped.direct_reports.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0)
            : []
      ) : null
    };
  }

  /**
   * Sanitize URL-like fields: empty -> null, add https:// if missing, convert handles to URLs
   */
  private sanitizeUrl(value: unknown, fieldName: string): string | null {
    if (value === null || value === undefined) return null;
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (trimmed.length === 0) return null;

    const coerceHandleToUrl = (handle: string): string => {
      const withoutScheme = handle.replace(/^https?:\/\//i, '');
      const withoutAt = withoutScheme.replace(/^@/, '');

      if (fieldName === 'twitter_url') {
        if (/^(twitter\.com|x\.com)\//i.test(withoutAt)) {
          return `https://${withoutAt}`;
        }
        if (!withoutAt.includes('/')) {
          return `https://twitter.com/${withoutAt}`;
        }
        return `https://${withoutAt}`;
      }

      if (fieldName === 'github_url') {
        if (/^github\.com\//i.test(withoutAt)) {
          return `https://${withoutAt}`;
        }
        if (!withoutAt.includes('/')) {
          return `https://github.com/${withoutAt}`;
        }
        return `https://${withoutAt}`;
      }

      if (/^www\./i.test(withoutAt)) {
        return `https://${withoutAt}`;
      }

      return `https://${withoutAt}`;
    };

    const candidates: string[] = [];

    if (/^https?:\/\//i.test(trimmed)) {
      candidates.push(trimmed);
    } else if (/^(www\.|twitter\.com\/|x\.com\/|github\.com\/)/i.test(trimmed) || fieldName === 'twitter_url' || fieldName === 'github_url') {
      candidates.push(coerceHandleToUrl(trimmed));
    } else {
      candidates.push(`https://${trimmed}`);
    }

    for (const candidate of candidates) {
      try {
        const url = new URL(candidate);
        if (fieldName === 'twitter_url' && url.hostname.toLowerCase() === 'x.com') {
          return `https://twitter.com${url.pathname}`;
        }
        return url.toString();
      } catch {
        // try next candidate
      }
    }

    return null;
  }

  // ============================================================================
  // CRUD OPERATIONS (CrudServiceInterface)
  // ============================================================================

  /**
   * Get user profile by ID
   */
  async get(id: string): Promise<ServiceResponse<UserProfile>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('get', { id });

      const result = await selectOne<UserProfile>(this.config.tableName, { id });
      const serviceResponse = this.convertApiResponse<UserProfile>(result);

      if (!serviceResponse.success) {
        return serviceResponse;
      }

      if (!serviceResponse.data) {
        return { data: null, error: 'User profile not found', success: false };
      }

      const normalizedData = this.normalizeProfileData(serviceResponse.data);
      const validatedData = this.config.schema.parse(normalizedData);
      return { data: validatedData, error: null, success: true };
    }, `get user profile ${id}`);
  }

  /**
   * Create new user profile
   */
  async create(data: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>): Promise<ServiceResponse<UserProfile>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('create', { data });

      const result = await insertOne<UserProfile>(this.config.tableName, {
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      const serviceResponse = this.convertApiResponse<UserProfile>(result);

      if (!serviceResponse.success) {
        return serviceResponse;
      }

      const normalizedData = this.normalizeProfileData(serviceResponse.data);
      const validatedData = this.config.schema.parse(normalizedData);
      return { data: validatedData, error: null, success: true };
    }, `create user profile`);
  }

  /**
   * Update user profile
   */
  async update(id: string, data: Partial<UserProfile>): Promise<ServiceResponse<UserProfile>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('update', { id, data });

      const result = await updateOne<UserProfile>(this.config.tableName, { id }, {
        ...data,
        updated_at: new Date().toISOString()
      });

      const serviceResponse = this.convertApiResponse<UserProfile>(result);

      if (!serviceResponse.success) {
        return serviceResponse;
      }

      const normalizedData = this.normalizeProfileData(serviceResponse.data);
      const validatedData = this.config.schema.parse(normalizedData);
      return { data: validatedData, error: null, success: true };
    }, `update user profile ${id}`);
  }

  /**
   * Delete user profile
   */
  async delete(id: string): Promise<ServiceResponse<boolean>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('delete', { id });

      const result = await deleteOne<boolean>(this.config.tableName, { id });
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

      const result = await selectData<UserProfile>(this.config.tableName, '*', filters);
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
        const profileResult = await selectData<UserProfile>(this.config.tableName, '*', { user_id: userId });

        const rows = profileResult.data as any;
        if (rows && Array.isArray(rows) && rows.length > 0) {
          const rawData = rows[0];
          const normalizedData = this.normalizeProfileData(rawData);
          const profileData = {
            ...normalizedData,
            external_user_id: userId,
          };
          const validatedData = this.config.schema.parse(profileData);
          return { data: validatedData, error: null, success: true };
        }

        // Fall back to RPC method if no profile in DB
        this.logger.info('No profile in database, using RPC fallback path');
        const rawData = await this.getCachedOrFetchProfile(userId);

        const normalizedData = this.normalizeProfileData(rawData);
        const profileData = {
          ...normalizedData,
          external_user_id: userId,
        };
        const validatedData = this.config.schema.parse(profileData);
        return { data: validatedData, error: null, success: true };

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
        const existingProfile = await this.getCachedOrFetchProfile(userId);

        const sanitizedProfileData: Partial<UserProfile> = {
          ...profileData,
          avatar_url: this.sanitizeUrl((profileData as any)?.avatar_url, 'avatar_url'),
          linkedin_url: this.sanitizeUrl((profileData as any)?.linkedin_url, 'linkedin_url'),
          github_url: this.sanitizeUrl((profileData as any)?.github_url, 'github_url'),
          twitter_url: this.sanitizeUrl((profileData as any)?.twitter_url, 'twitter_url')
        };

        const updateData = {
          ...sanitizedProfileData,
          updated_at: new Date().toISOString()
        };

        // Try likely user_id candidates. The db route adds its own user_id scope, so a
        // mismatch here can silently return no updated row.
        const userIdCandidates = Array.from(new Set([
          existingProfile?.user_id,
          userId,
        ].filter((value): value is string => typeof value === 'string' && value.trim().length > 0)));

        let updatedRow: UserProfile | null = null;
        for (const candidateUserId of userIdCandidates) {
          const result = await updateOne<UserProfile>(
            this.config.tableName,
            { user_id: candidateUserId },
            updateData
          );

          const serviceResponse = this.convertApiResponse<UserProfile>(result);
          if (!serviceResponse.success) {
            return serviceResponse;
          }

          if (serviceResponse.data) {
            updatedRow = serviceResponse.data;
            break;
          }
        }

        if (!updatedRow) {
          throw new Error('Profile update returned no row. Check user_id mapping/scoping.');
        }

        this.clearUserCache(userId);

        // Re-read canonical profile after update to avoid validating partial update responses.
        const freshProfile = await this.getCachedOrFetchProfile(userId);
        const normalizedData = this.normalizeProfileData(freshProfile ?? updatedRow);
        const updatedProfileData = {
          ...normalizedData,
          id: normalizedData?.id ?? normalizedData?.user_id ?? userId,
          external_user_id: userId
        };

        this.logger.info('upsertAuthProfile - Final data before validation:', {
          id: updatedProfileData.id,
          external_user_id: updatedProfileData.external_user_id,
          hasNormalizedData: !!normalizedData,
          normalizedId: normalizedData?.id,
          normalizedUserId: normalizedData?.user_id,
          passedUserId: userId
        });

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

      const result = await selectOne<Company>('companies', { id: companyId });
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

      const result = await updateOne<Company>('companies', { id: companyId }, {
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

      const result = await insertOne<Company>('companies', {
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
      const profileResult = await selectData<{ user_id: string }>(this.config.tableName, 'user_id', {
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
      const result = await selectData<any>('user_integrations', '*', { user_id: internalUserId });
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
      'department', 'work_phone', 'location'
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
