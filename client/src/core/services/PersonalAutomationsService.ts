import { z } from 'zod';
import { BaseService, type ServiceResponse } from './BaseService';
import { selectData as select, selectOne, insertOne, updateOne, deleteOne, callEdgeFunction } from '@/lib/api-client';
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

      const { data, error } = await this.supabase
        .from(this.config.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return this.handleError(error, 'Failed to get personal automation');
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
      
      const { data: created, error } = await this.supabase
        .from(this.config.tableName)
        .insert({
          ...validated,
          createdat: new Date().toISOString(),
          updatedat: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        return this.handleError(error, 'Failed to create personal automation');
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

      const { data: updated, error } = await this.supabase
        .from(this.config.tableName)
        .update({
          ...data,
          updatedat: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return this.handleError(error, 'Failed to update personal automation');
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

      const { error } = await this.supabase
        .from(this.config.tableName)
        .delete()
        .eq('id', id);

      if (error) {
        return this.handleError(error, 'Failed to delete personal automation');
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

      let query = this.supabase
        .from(this.config.tableName)
        .select('*')
        .order('createdat', { ascending: false });

      // Apply filters
      if (filters?.userid) {
        query = query.eq('userid', filters.userid);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      } else {
        query = query.limit(this.config.defaultLimit);
      }

      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || this.config.defaultLimit) - 1);
      }

      const { data, error } = await query;

      if (error) {
        return this.handleError(error, 'Failed to list personal automations');
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

      let dbQuery = this.supabase
        .from(this.config.tableName)
        .select('*')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .order('createdat', { ascending: false });

      // Apply filters
      if (filters?.userid) {
        dbQuery = dbQuery.eq('userid', filters.userid);
      }

      if (filters?.limit) {
        dbQuery = dbQuery.limit(filters.limit);
      } else {
        dbQuery = dbQuery.limit(this.config.defaultLimit);
      }

      const { data, error } = await dbQuery;

      if (error) {
        return this.handleError(error, 'Failed to search personal automations');
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

      const { data, error } = await this.supabase
        .from(this.config.tableName)
        .select('*')
        .eq('userid', userid)
        .eq('name', name)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return this.createResponse(null);
        }
        return this.handleError(error, 'Failed to get automation by name');
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
