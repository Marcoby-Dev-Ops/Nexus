import { z } from 'zod';
import { BaseService, type ServiceResponse } from './BaseService';
import { unifiedDatabaseService } from '@/core/services/UnifiedDatabaseService';

// ============================================================================
// SCHEMAS
// ============================================================================

export const UserLicenseSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid(),
  license_type: z.string().min(1, 'License type is required'),
  issued_at: z.string().optional(),
  expires_at: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export type UserLicense = z.infer<typeof UserLicenseSchema>;

export const CreateUserLicenseSchema = UserLicenseSchema.omit({
  id: true,
  issued_at: true,
});

export type CreateUserLicense = z.infer<typeof CreateUserLicenseSchema>;

// ============================================================================
// SERVICE CONFIGURATION
// ============================================================================

const SERVICE_CONFIG = {
  tableName: 'user_licenses',
  schema: UserLicenseSchema,
  createSchema: CreateUserLicenseSchema,
  defaultOrderBy: 'issued_at.desc',
  defaultLimit: 50,
} as const;

// ============================================================================
// USER LICENSES SERVICE
// ============================================================================

/**
 * Service for managing user licenses
 * 
 * Provides type-safe, RBAC-compliant operations for user licenses
 * following the service layer architecture standards.
 */
export class UserLicensesService extends BaseService {
  protected config = SERVICE_CONFIG;

  /**
   * Get a user license by ID
   */
  async get(id: string): Promise<ServiceResponse<UserLicense>> {
    try {
      this.logger.info('Getting user license', { id });
      return await this.executeDbOperation(async () => {
        const resp = await unifiedDatabaseService.selectOne<UserLicense>(this.config.tableName, { id });
        if (!resp.success || !resp.data) throw new Error(resp.error || 'Failed to get user license');
        const validated = this.config.schema.parse(resp.data);
        return { data: validated, error: null, success: true };
      }, `get ${this.config.tableName} ${id}`);
    } catch (error) {
      return this.handleError(error, 'Failed to get user license');
    }
  }

  /**
   * Create a new user license
   */
  async create(data: CreateUserLicense): Promise<ServiceResponse<UserLicense>> {
    try {
      this.logger.info('Creating user license', { user_id: data.user_id, license_type: data.license_type });

      const validated = this.config.createSchema.parse(data);
      return await this.executeDbOperation(async () => {
        const payload = { ...validated, issued_at: new Date().toISOString() };
        const resp = await unifiedDatabaseService.insert<UserLicense>(this.config.tableName, payload);
        if (!resp.success || !resp.data) throw new Error(resp.error || 'Failed to create user license');
        const validatedCreated = this.config.schema.parse(resp.data);
        return { data: validatedCreated, error: null, success: true };
      }, `create ${this.config.tableName}`);
    } catch (error) {
      return this.handleError(error, 'Failed to create user license');
    }
  }

  /**
   * Update a user license
   */
  async update(id: string, data: Partial<CreateUserLicense>): Promise<ServiceResponse<UserLicense>> {
    try {
      this.logger.info('Updating user license', { id });

      return await this.executeDbOperation(async () => {
        const resp = await unifiedDatabaseService.update<UserLicense>(this.config.tableName, data as any, { id });
        if (!resp.success || !resp.data) throw new Error(resp.error || 'Failed to update user license');
        const validated = this.config.schema.parse(resp.data);
        return { data: validated, error: null, success: true };
      }, `update ${this.config.tableName} ${id}`);
    } catch (error) {
      return this.handleError(error, 'Failed to update user license');
    }
  }

  /**
   * Delete a user license
   */
  async delete(id: string): Promise<ServiceResponse<boolean>> {
    try {
      this.logger.info('Deleting user license', { id });

      return await this.executeDbOperation(async () => {
        const resp = await unifiedDatabaseService.delete(this.config.tableName, { id });
        if (!resp.success) throw new Error(resp.error || 'Failed to delete user license');
        return { data: true, error: null, success: true };
      }, `delete ${this.config.tableName} ${id}`);
    } catch (error) {
      return this.handleError(error, 'Failed to delete user license');
    }
  }

  /**
   * List user licenses with optional filters
   */
  async list(filters?: {
    user_id?: string;
    license_type?: string;
    limit?: number;
    offset?: number;
  }): Promise<ServiceResponse<UserLicense[]>> {
    try {
      this.logger.info('Listing user licenses', { filters });
      const queryFilters: Record<string, any> = {};
      if (filters?.user_id) queryFilters.user_id = filters.user_id;
      if (filters?.license_type) queryFilters.license_type = filters.license_type;

      const limit = filters?.limit ?? this.config.defaultLimit;

      const resp = await unifiedDatabaseService.select<UserLicense>(this.config.tableName, '*', queryFilters);
      if (!resp.success) {
        return this.handleError(resp.error || 'Failed to list user licenses', 'Failed to list user licenses');
      }
      // Manual sort (desc by issued_at) and slice
      const sorted = (resp.data || []).sort((a: any, b: any) => (b.issued_at || '').localeCompare(a.issued_at || '')).slice(0, limit);
      const validated = z.array(this.config.schema).parse(sorted);
      return this.createResponse(validated);
    } catch (error) {
      return this.handleError(error, 'Failed to list user licenses');
    }
  }

  /**
   * Get current active license for a user
   */
  async getCurrentLicense(user_id: string): Promise<ServiceResponse<UserLicense | null>> {
    try {
      this.logger.info('Getting current license', { user_id });
      const resp = await unifiedDatabaseService.select<UserLicense>(this.config.tableName, '*', { user_id, expires_at: null } as any);
      if (!resp.success) {
        return this.handleError(resp.error || 'Failed to get current license', 'Failed to get current license');
      }
      const sorted = (resp.data || []).filter(r => r.expires_at === null).sort((a: any, b: any) => (b.issued_at || '').localeCompare(a.issued_at || ''));
      if (sorted.length === 0) return this.createResponse(null);
      const validated = this.config.schema.parse(sorted[0]);
      return this.createResponse(validated);
    } catch (error) {
      return this.handleError(error, 'Failed to get current license');
    }
  }

  /**
   * Get all licenses for a user
   */
  async getUserLicenses(user_id: string): Promise<ServiceResponse<UserLicense[]>> {
    return this.list({
      user_id,
    });
  }

  /**
   * Check if user has an active license
   */
  async hasActiveLicense(user_id: string): Promise<ServiceResponse<boolean>> {
    try {
      this.logger.info('Checking active license', { user_id });
      const resp = await unifiedDatabaseService.select<UserLicense>(this.config.tableName, '*', { user_id, expires_at: null } as any);
      if (!resp.success) {
        return this.handleError(resp.error || 'Failed to check active license', 'Failed to check active license');
      }
      const active = (resp.data || []).some(r => r.expires_at === null);
      return this.createResponse(active);
    } catch (error) {
      return this.handleError(error, 'Failed to check active license');
    }
  }

  /**
   * Get license by type for a user
   */
  async getLicenseByType(user_id: string, license_type: string): Promise<ServiceResponse<UserLicense | null>> {
    try {
      this.logger.info('Getting license by type', { user_id, license_type });
      const resp = await unifiedDatabaseService.select<UserLicense>(this.config.tableName, '*', { user_id, license_type } as any);
      if (!resp.success) {
        return this.handleError(resp.error || 'Failed to get license by type', 'Failed to get license by type');
      }
      const sorted = (resp.data || []).filter(r => r.license_type === license_type).sort((a: any, b: any) => (b.issued_at || '').localeCompare(a.issued_at || ''));
      if (sorted.length === 0) return this.createResponse(null);
      const validated = this.config.schema.parse(sorted[0]);
      return this.createResponse(validated);
    } catch (error) {
      return this.handleError(error, 'Failed to get license by type');
    }
  }
}

// ============================================================================
// SERVICE INSTANCE
// ============================================================================

export const userLicensesService = new UserLicensesService(); 
