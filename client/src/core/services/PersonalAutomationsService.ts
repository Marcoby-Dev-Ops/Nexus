import { z } from 'zod';
import { BaseService, type ServiceResponse } from './BaseService';
import { unifiedDatabaseService } from '@/core/services/UnifiedDatabaseService';
import { apiAdapter } from '@/core/database/apiAdapter';

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

      return await this.executeDbOperation(async () => {
  const resp = await unifiedDatabaseService.selectOne<PersonalAutomation>(this.config.tableName, { id });
  if (!resp.success || !resp.data) throw new Error(resp.error || 'Failed to get personal automation');
  const validated = this.config.schema.parse(resp.data);
  return { data: validated, error: null, success: true };
      }, `get ${this.config.tableName} ${id}`);
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
      return await this.executeDbOperation(async () => {
        const payload = { ...validated, createdat: new Date().toISOString(), updatedat: new Date().toISOString() };
        const resp = await unifiedDatabaseService.insert<PersonalAutomation>(this.config.tableName, payload);
        if (!resp.success || !resp.data) throw new Error(resp.error || 'Failed to create personal automation');
        const validatedCreated = this.config.schema.parse(resp.data);
        return { data: validatedCreated, error: null, success: true };
      }, `create ${this.config.tableName}`);
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

      return await this.executeDbOperation(async () => {
        const resp = await unifiedDatabaseService.update<PersonalAutomation>(
          this.config.tableName,
          { ...data, updatedat: new Date().toISOString() },
          { id }
        );
        if (!resp.success || !resp.data) throw new Error(resp.error || 'Failed to update personal automation');
        const validated = this.config.schema.parse(resp.data);
        return { data: validated, error: null, success: true };
      }, `update ${this.config.tableName} ${id}`);
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

      return await this.executeDbOperation(async () => {
        const resp = await unifiedDatabaseService.delete(this.config.tableName, { id });
        if (!resp.success) throw new Error(resp.error || 'Failed to delete personal automation');
        return { data: true, error: null, success: true };
      }, `delete ${this.config.tableName} ${id}`);
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

  const limit = filters?.limit ?? this.config.defaultLimit;

      // Emulate ordering/limit manually since unified service selectWithOptions is a pass-through currently
      const resp = await unifiedDatabaseService.select<PersonalAutomation>(this.config.tableName, '*', queryFilters);
      if (!resp.success) {
        return this.handleError(resp.error || 'Failed to list personal automations', 'Failed to list personal automations');
      }
      // Manual sort (desc by createdat) and slice limit
      const sorted = (resp.data || []).sort((a: any, b: any) => (b.createdat || '').localeCompare(a.createdat || ''))
        .slice(0, limit);
      const validated = z.array(this.config.schema).parse(sorted);
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

      // Prefer server edge function if available
      const rpcResp = await apiAdapter.callEdgeFunction<{ results: PersonalAutomation[] }>('search_personal_automations', {
        query,
        filters: filters || {},
      }).catch(() => null as any);

      if (rpcResp && rpcResp.results) {
        const validated = z.array(this.config.schema).parse(rpcResp.results || []);
        return this.createResponse(validated);
      }

      const queryFilters: Record<string, any> = {};
      if (filters?.userid) queryFilters.userid = filters.userid;

      // Support OR ilike via filter convention
      queryFilters._or = [
        { name: { ilike: `%${query}%` } },
        { description: { ilike: `%${query}%` } },
      ];

      const limit = filters?.limit ?? this.config.defaultLimit;

      const resp = await unifiedDatabaseService.select<PersonalAutomation>(this.config.tableName, '*', queryFilters as any);
      if (!resp.success) {
        return this.handleError(resp.error || 'Failed to search personal automations', 'Failed to search personal automations');
      }
      const sorted = (resp.data || []).sort((a: any, b: any) => (b.createdat || '').localeCompare(a.createdat || ''))
        .slice(0, limit);
      const validated = z.array(this.config.schema).parse(sorted);
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

      const resp = await unifiedDatabaseService.selectOne<PersonalAutomation>(this.config.tableName, { userid, name });
      if (!resp.success) {
        // If no record found, selectOne returns success=false with error 'No record found'
        return this.createResponse(null);
      }
      const validated = this.config.schema.parse(resp.data);
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
