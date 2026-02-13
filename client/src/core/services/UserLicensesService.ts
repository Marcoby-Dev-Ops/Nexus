import { z } from 'zod';
import { BaseService, type ServiceResponse } from './BaseService';
import { selectData, selectOne, insertOne, updateOne, deleteOne } from '@/lib/api-client';
import { logger } from '@/shared/utils/logger';

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

      const { data, error, success } = await selectOne<UserLicense>(this.config.tableName, { id });

      if (!success) {
        return this.handleError(error || 'License not found', 'Failed to get user license');
      }

      const validated = this.config.schema.parse(data);
      return this.createResponse(validated);
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

      const { data: created, error, success } = await insertOne<UserLicense>(this.config.tableName, {
        ...validated,
        issued_at: new Date().toISOString(),
      });

      if (!success) {
        return this.handleError(error || 'Failed to create license', 'Failed to create user license');
      }

      const validatedCreated = this.config.schema.parse(created);
      return this.createResponse(validatedCreated);
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

      const { data: updated, error, success } = await updateOne<UserLicense>(this.config.tableName, { id }, data);

      if (!success) {
        return this.handleError(error || 'Failed to update license', 'Failed to update user license');
      }

      const validated = this.config.schema.parse(updated);
      return this.createResponse(validated);
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

      const { error, success } = await deleteOne(this.config.tableName, { id });

      if (!success) {
        return this.handleError(error || 'Failed to delete license', 'Failed to delete user license');
      }

      return this.createResponse(true);
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

      const filterParams: Record<string, any> = {};
      if (filters?.user_id) filterParams.user_id = filters.user_id;
      if (filters?.license_type) filterParams.license_type = filters.license_type;

      const { data, error, success } = await selectData<UserLicense>({
        table: this.config.tableName,
        filters: filterParams,
        orderBy: [{ column: 'issued_at', ascending: false }],
        limit: filters?.limit || this.config.defaultLimit,
        offset: filters?.offset
      });

      if (!success) {
        return this.handleError(error || 'Failed to list licenses', 'Failed to list user licenses');
      }

      const validated = z.array(this.config.schema).parse(data);
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

      const { data, error, success } = await selectData<UserLicense>({
        table: this.config.tableName,
        filters: { user_id, expires_at: null },
        orderBy: [{ column: 'issued_at', ascending: false }],
        limit: 1
      });

      if (!success) {
        return this.handleError(error || 'Failed to get current license', 'Failed to get current license');
      }

      if (!data || data.length === 0) {
        return this.createResponse(null);
      }

      const validated = this.config.schema.parse(data[0]);
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

      const { data, error, success } = await selectData<UserLicense>({
        table: this.config.tableName,
        filters: { user_id, expires_at: null },
        limit: 1
      });

      if (!success) {
        return this.handleError(error || 'Failed to check active license', 'Failed to check active license');
      }

      return this.createResponse(!!data && data.length > 0);
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

      const { data, error, success } = await selectData<UserLicense>({
        table: this.config.tableName,
        filters: { user_id, license_type },
        orderBy: [{ column: 'issued_at', ascending: false }],
        limit: 1
      });

      if (!success) {
        return this.handleError(error || 'Failed to get license by type', 'Failed to get license by type');
      }

      if (!data || data.length === 0) {
        return this.createResponse(null);
      }

      const validated = this.config.schema.parse(data[0]);
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
