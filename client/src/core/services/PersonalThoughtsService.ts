import { z } from 'zod';
import { BaseService, type ServiceResponse } from './BaseService';
import { selectOne, insertOne, updateOne, deleteOne, selectWithOptions, callEdgeFunction } from '@/lib/api-client';

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
      return await this.executeDbOperation(async () => {
        const resp = await selectOne<PersonalThought>(this.config.tableName, { id });
        if (!resp || resp.error) throw new Error(resp?.error || 'Failed to get personal thought');
        const validated = this.config.schema.parse(resp.data);
        return { data: validated, error: null, success: true };
      }, `get ${this.config.tableName} ${id}`);
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
      return await this.executeDbOperation(async () => {
        const payload = { ...validated, createdat: new Date().toISOString(), updatedat: new Date().toISOString() };
        const resp = await insertOne<PersonalThought>(this.config.tableName, payload);
        if (!resp || resp.error) throw new Error(resp?.error || 'Failed to create personal thought');
        const validatedCreated = this.config.schema.parse(resp.data);
        return { data: validatedCreated, error: null, success: true };
      }, `create ${this.config.tableName}`);
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

      return await this.executeDbOperation(async () => {
        const resp = await updateOne<PersonalThought>(this.config.tableName, id, { ...data, updatedat: new Date().toISOString() } as any);
        if (!resp || resp.error) throw new Error(resp?.error || 'Failed to update personal thought');
        const validated = this.config.schema.parse(resp.data);
        return { data: validated, error: null, success: true };
      }, `update ${this.config.tableName} ${id}`);
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

      return await this.executeDbOperation(async () => {
        const resp = await deleteOne(this.config.tableName, { id });
        if (!resp || resp.error) throw new Error(resp?.error || 'Failed to delete personal thought');
        return { data: true, error: null, success: true };
      }, `delete ${this.config.tableName} ${id}`);
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

      const queryFilters: Record<string, any> = {};
      if (filters?.userid) queryFilters.userid = filters.userid;
      if (filters?.company_id) queryFilters.company_id = filters.company_id;
      if (filters?.tags && filters.tags.length > 0) queryFilters.tags = filters.tags;

  const limit = filters?.limit ?? this.config.defaultLimit;

      const resp = await selectWithOptions<PersonalThought>(this.config.tableName, {
        filter: queryFilters as any,
        orderBy: { column: 'createdat', ascending: false },
        limit,
      });

      if (!resp || !resp.success) {
        return this.handleError(resp?.error || 'Failed to list personal thoughts', 'Failed to list personal thoughts');
      }

      const validated = z.array(this.config.schema).parse(resp.data || []);
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

      // Fallback to server RPC for ilike search, if not available use client selectData with filter
      const rpcResp = await callEdgeFunction<{ results: PersonalThought[] }>('search_personal_thoughts', {
        query,
        filters: filters || {},
      }).catch(() => null as any);

      if (rpcResp && rpcResp.results) {
        const validated = z.array(this.config.schema).parse(rpcResp.results || []);
        return this.createResponse(validated);
      }

      // If edge function not available, perform client-side select with content ilike via API query
      const queryFilters: Record<string, any> = {};
      if (filters?.userid) queryFilters.userid = filters.userid;
      if (filters?.company_id) queryFilters.company_id = filters.company_id;

      // For ilike on content we pass a special filter convention the API understands (ilike)
      (queryFilters as any).content = { ilike: `%${query}%` };

      const limit = filters?.limit ?? this.config.defaultLimit;

      const resp = await selectWithOptions<PersonalThought>(this.config.tableName, {
        filter: queryFilters as any,
        orderBy: { column: 'createdat', ascending: false },
        limit,
      });

      if (!resp || !resp.success) {
        return this.handleError(resp?.error || 'Failed to search personal thoughts', 'Failed to search personal thoughts');
      }

      const validated = z.array(this.config.schema).parse(resp.data || []);
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
