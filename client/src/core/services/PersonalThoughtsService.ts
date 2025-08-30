import { z } from 'zod';
import { BaseService, type ServiceResponse } from './BaseService';
import { selectData as select, selectOne, insertOne, updateOne, deleteOne, callEdgeFunction } from '@/lib/api-client';
import { logger } from '@/shared/utils/logger';

// ============================================================================
// SCHEMAS
// ============================================================================

export const PersonalThoughtSchema = z.object({
  id: z.string().uuid().optional(),
  content: z.string().min(1, 'Content is required'),
  userid: z.string().uuid(),
  company_id: z.string().uuid().optional(),
  createdat: z.string().optional(),
  updatedat: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

export type PersonalThought = z.infer<typeof PersonalThoughtSchema>;

export const CreatePersonalThoughtSchema = PersonalThoughtSchema.omit({
  id: true,
  createdat: true,
  updatedat: true,
});

export type CreatePersonalThought = z.infer<typeof CreatePersonalThoughtSchema>;

// ============================================================================
// SERVICE CONFIGURATION
// ============================================================================

const SERVICE_CONFIG = {
  tableName: 'personal_thoughts',
  schema: PersonalThoughtSchema,
  createSchema: CreatePersonalThoughtSchema,
  defaultOrderBy: 'createdat.desc',
  defaultLimit: 50,
} as const;

// ============================================================================
// PERSONAL THOUGHTS SERVICE
// ============================================================================

/**
 * Service for managing personal thoughts
 * 
 * Provides type-safe, RBAC-compliant operations for personal thoughts
 * following the service layer architecture standards.
 */
export class PersonalThoughtsService extends BaseService {
  private readonly config = SERVICE_CONFIG;

  /**
   * Get a personal thought by ID
   */
  async get(id: string): Promise<ServiceResponse<PersonalThought>> {
    try {
      this.logger.info('Getting personal thought', { id });

      const { data, error } = await this.supabase
        .from(this.config.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return this.handleError(error, 'Failed to get personal thought');
      }

      const validated = this.config.schema.parse(data);
      return this.createResponse(validated);
    } catch (error) {
      return this.handleError(error, 'Failed to get personal thought');
    }
  }

  /**
   * Create a new personal thought
   */
  async create(data: CreatePersonalThought): Promise<ServiceResponse<PersonalThought>> {
    try {
      this.logger.info('Creating personal thought', { userid: data.userid });

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
        return this.handleError(error, 'Failed to create personal thought');
      }

      const validatedCreated = this.config.schema.parse(created);
      return this.createResponse(validatedCreated);
    } catch (error) {
      return this.handleError(error, 'Failed to create personal thought');
    }
  }

  /**
   * Update a personal thought
   */
  async update(id: string, data: Partial<CreatePersonalThought>): Promise<ServiceResponse<PersonalThought>> {
    try {
      this.logger.info('Updating personal thought', { id });

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
        return this.handleError(error, 'Failed to update personal thought');
      }

      const validated = this.config.schema.parse(updated);
      return this.createResponse(validated);
    } catch (error) {
      return this.handleError(error, 'Failed to update personal thought');
    }
  }

  /**
   * Delete a personal thought
   */
  async delete(id: string): Promise<ServiceResponse<boolean>> {
    try {
      this.logger.info('Deleting personal thought', { id });

      const { error } = await this.supabase
        .from(this.config.tableName)
        .delete()
        .eq('id', id);

      if (error) {
        return this.handleError(error, 'Failed to delete personal thought');
      }

      return this.createResponse(true);
    } catch (error) {
      return this.handleError(error, 'Failed to delete personal thought');
    }
  }

  /**
   * List personal thoughts with optional filters
   */
  async list(filters?: {
    userid?: string;
    company_id?: string;
    tags?: string[];
    limit?: number;
    offset?: number;
  }): Promise<ServiceResponse<PersonalThought[]>> {
    try {
      this.logger.info('Listing personal thoughts', { filters });

      let query = this.supabase
        .from(this.config.tableName)
        .select('*')
        .order('createdat', { ascending: false });

      // Apply filters
      if (filters?.userid) {
        query = query.eq('userid', filters.userid);
      }

      if (filters?.company_id) {
        query = query.eq('company_id', filters.company_id);
      }

      if (filters?.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
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
        return this.handleError(error, 'Failed to list personal thoughts');
      }

      const validated = z.array(this.config.schema).parse(data);
      return this.createResponse(validated);
    } catch (error) {
      return this.handleError(error, 'Failed to list personal thoughts');
    }
  }

  /**
   * Search personal thoughts by content
   */
  async search(query: string, filters?: {
    userid?: string;
    company_id?: string;
    limit?: number;
  }): Promise<ServiceResponse<PersonalThought[]>> {
    try {
      this.logger.info('Searching personal thoughts', { query, filters });

      let dbQuery = this.supabase
        .from(this.config.tableName)
        .select('*')
        .ilike('content', `%${query}%`)
        .order('createdat', { ascending: false });

      // Apply filters
      if (filters?.userid) {
        dbQuery = dbQuery.eq('userid', filters.userid);
      }

      if (filters?.company_id) {
        dbQuery = dbQuery.eq('company_id', filters.company_id);
      }

      if (filters?.limit) {
        dbQuery = dbQuery.limit(filters.limit);
      } else {
        dbQuery = dbQuery.limit(this.config.defaultLimit);
      }

      const { data, error } = await dbQuery;

      if (error) {
        return this.handleError(error, 'Failed to search personal thoughts');
      }

      const validated = z.array(this.config.schema).parse(data);
      return this.createResponse(validated);
    } catch (error) {
      return this.handleError(error, 'Failed to search personal thoughts');
    }
  }

  /**
   * Get recent thoughts for a user
   */
  async getRecentThoughts(userid: string, limit: number = 10): Promise<ServiceResponse<PersonalThought[]>> {
    return this.list({
      userid,
      limit,
    });
  }

  /**
   * Get thoughts by tags
   */
  async getThoughtsByTags(userid: string, tags: string[]): Promise<ServiceResponse<PersonalThought[]>> {
    return this.list({
      userid,
      tags,
    });
  }
}

// ============================================================================
// SERVICE INSTANCE
// ============================================================================

export const personalThoughtsService = new PersonalThoughtsService(); 
