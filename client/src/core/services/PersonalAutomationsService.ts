import { z } from 'zod';
import { BaseService, type ServiceResponse } from './BaseService';
import { selectData, selectOne, insertOne, updateOne, deleteOne, callEdgeFunction } from '@/lib/api-client';
import { logger } from '@/shared/utils/logger';

// ============================================================================
// SCHEMAS
// ============================================================================

export const PersonalAutomationSchema = z.object({
  id: z.string().uuid().optional(),
  userid: z.string().uuid(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  config: z.record(z.any()).optional(),
  createdat: z.string().optional(),
  updatedat: z.string().optional(),
});

export type PersonalAutomation = z.infer<typeof PersonalAutomationSchema>;

export const CreatePersonalAutomationSchema = PersonalAutomationSchema.omit({
  id: true,
  createdat: true,
  updatedat: true,
});

export type CreatePersonalAutomation = z.infer<typeof CreatePersonalAutomationSchema>;

// ============================================================================
// SERVICE CONFIGURATION
// ============================================================================

const SERVICE_CONFIG = {
  tableName: 'personal_automations',
  schema: PersonalAutomationSchema,
  createSchema: CreatePersonalAutomationSchema,
  defaultOrderBy: 'createdat.desc',
  defaultLimit: 50,
} as const;

// ============================================================================
// PERSONAL AUTOMATIONS SERVICE
// ============================================================================

/**
 * Service for managing personal automations
 * 
 * Provides type-safe, RBAC-compliant operations for personal automations
 * following the service layer architecture standards.
 */
export class PersonalAutomationsService extends BaseService {
  private readonly config = SERVICE_CONFIG;

  /**
   * Get a personal automation by ID
   */
  async get(id: string): Promise<ServiceResponse<PersonalAutomation>> {
    try {
      this.logger.info('Getting personal automation', { id });

      const { data, error, success } = await selectOne<PersonalAutomation>(this.config.tableName, { id });

      if (!success) {
        return this.handleError(error || 'Automation not found', 'Failed to get personal automation');
      }

      const validated = this.config.schema.parse(data);
      return this.createResponse(validated);
    } catch (error) {
      return this.handleError(error, 'Failed to get personal automation');
    }
  }

  /**
   * Create a new personal automation
   */
  async create(data: CreatePersonalAutomation): Promise<ServiceResponse<PersonalAutomation>> {
    try {
      this.logger.info('Creating personal automation', { userid: data.userid, name: data.name });

      const validated = this.config.createSchema.parse(data);

      const { data: created, error, success } = await insertOne<PersonalAutomation>(this.config.tableName, {
        ...validated,
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString(),
      });

      if (!success) {
        return this.handleError(error || 'Failed to create automation', 'Failed to create personal automation');
      }

      const validatedCreated = this.config.schema.parse(created);
      return this.createResponse(validatedCreated);
    } catch (error) {
      return this.handleError(error, 'Failed to create personal automation');
    }
  }

  /**
   * Update a personal automation
   */
  async update(id: string, data: Partial<CreatePersonalAutomation>): Promise<ServiceResponse<PersonalAutomation>> {
    try {
      this.logger.info('Updating personal automation', { id });

      const { data: updated, error, success } = await updateOne<PersonalAutomation>(
        this.config.tableName,
        { id },
        {
          ...data,
          updatedat: new Date().toISOString(),
        }
      );

      if (!success) {
        return this.handleError(error || 'Failed to update automation', 'Failed to update personal automation');
      }

      const validated = this.config.schema.parse(updated);
      return this.createResponse(validated);
    } catch (error) {
      return this.handleError(error, 'Failed to update personal automation');
    }
  }

  /**
   * Delete a personal automation
   */
  async delete(id: string): Promise<ServiceResponse<boolean>> {
    try {
      this.logger.info('Deleting personal automation', { id });

      const { error, success } = await deleteOne(this.config.tableName, { id });

      if (!success) {
        return this.handleError(error || 'Failed to delete automation', 'Failed to delete personal automation');
      }

      return this.createResponse(true);
    } catch (error) {
      return this.handleError(error, 'Failed to delete personal automation');
    }
  }

  /**
   * List personal automations with optional filters
   */
  async list(filters?: {
    userid?: string;
    limit?: number;
    offset?: number;
  }): Promise<ServiceResponse<PersonalAutomation[]>> {
    try {
      this.logger.info('Listing personal automations', { filters });

      const queryFilters: Record<string, any> = {};
      if (filters?.userid) queryFilters.userid = filters.userid;

      const { data, error, success } = await selectData<PersonalAutomation>({
        table: this.config.tableName,
        filters: queryFilters,
        orderBy: [{ column: 'createdat', ascending: false }],
        limit: filters?.limit || this.config.defaultLimit,
        offset: filters?.offset
      });

      if (!success) {
        return this.handleError(error || 'Failed to list automations', 'Failed to list personal automations');
      }

      const validated = z.array(this.config.schema).parse(data);
      return this.createResponse(validated);
    } catch (error) {
      return this.handleError(error, 'Failed to list personal automations');
    }
  }

  /**
   * Search personal automations by name or description
   */
  async search(query: string, filters?: {
    userid?: string;
    limit?: number;
  }): Promise<ServiceResponse<PersonalAutomation[]>> {
    try {
      this.logger.info('Searching personal automations', { query, filters });

      // Search functionality might need more backend support or complex filters
      // For now, mapping to a basic search pattern if supported.
      const queryFilters: Record<string, any> = {};
      if (filters?.userid) queryFilters.userid = filters.userid;

      // Using keyword search if the backend supports it in selectData or a specialized method
      const { data, error, success } = await selectData<PersonalAutomation>({
        table: this.config.tableName,
        filters: { ...queryFilters, search: query }, // Assuming backend handles 'search' param
        orderBy: [{ column: 'createdat', ascending: false }],
        limit: filters?.limit || this.config.defaultLimit
      });

      if (!success) {
        return this.handleError(error || 'Failed to search automations', 'Failed to search personal automations');
      }

      const validated = z.array(this.config.schema).parse(data);
      return this.createResponse(validated);
    } catch (error) {
      return this.handleError(error, 'Failed to search personal automations');
    }
  }

  /**
   * Get recent automations for a user
   */
  async getRecentAutomations(userid: string, limit: number = 5): Promise<ServiceResponse<PersonalAutomation[]>> {
    return this.list({
      userid,
      limit,
    });
  }

  /**
   * Get automation by name for a user
   */
  async getAutomationByName(userid: string, name: string): Promise<ServiceResponse<PersonalAutomation | null>> {
    try {
      this.logger.info('Getting automation by name', { userid, name });

      const { data, error, success } = await selectOne<PersonalAutomation>(this.config.tableName, { userid, name });

      if (!success) {
        if (error === 'No record found') {
          return this.createResponse(null);
        }
        return this.handleError(error || 'Failed to get automation', 'Failed to get automation by name');
      }

      const validated = this.config.schema.parse(data);
      return this.createResponse(validated);
    } catch (error) {
      return this.handleError(error, 'Failed to get automation by name');
    }
  }
}

// ============================================================================
// SERVICE INSTANCE
// ============================================================================

export const personalAutomationsService = new PersonalAutomationsService(); 
