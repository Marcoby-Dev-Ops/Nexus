/**
 * Unified Service Base Class
 * 
 * Provides standardized CRUD operations for all services with:
 * - Consistent error handling and logging
 * - Schema validation using Zod
 * - Caching support
 * - Bulk operations
 * - Search functionality
 * 
 * @template T - The type of data this service handles
 */

import { z } from 'zod';
import { BaseService, type ServiceResponse } from './BaseService';

/**
 * Service configuration interface
 */
export interface ServiceConfig {
  /** Database table name */
  tableName: string;
  /** Zod schema for validation */
  schema: z.ZodSchema<any>;
  /** Enable caching */
  cacheEnabled?: boolean;
  /** Cache TTL in milliseconds */
  cacheTTL?: number;
  /** Enable method call logging */
  enableLogging?: boolean;
  /** Default select columns */
  defaultColumns?: string;
  /** Enable real-time subscriptions */
  enableRealtime?: boolean;
}

/**
 * Search options for list operations
 */
export interface SearchOptions {
  /** Search query string */
  query?: string;
  /** Searchable columns */
  searchColumns?: string[];
  /** Additional filters */
  filters?: Record<string, any>;
  /** Sort options */
  sort?: {
    column: string;
    direction: 'asc' | 'desc';
  };
  /** Pagination */
  pagination?: {
    page: number;
    limit: number;
  };
}

/**
 * Unified Service Base Class
 * 
 * Provides standardized CRUD operations that all services can inherit.
 * Extends BaseService for consistent error handling and logging.
 */
export abstract class UnifiedService<T> extends BaseService {
  protected abstract config: ServiceConfig;

  // ========================================================================
  // CORE CRUD OPERATIONS
  // ========================================================================

  /**
   * Get a single item by ID
   */
  async get(id: string): Promise<ServiceResponse<T>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('get', { id });

      const validationError = this.validateIdParam(id);
      if (validationError) {
        return this.createErrorResponse(validationError);
      }

      const { data, error } = await this.supabase
        .from(this.config.tableName)
        .select(this.config.defaultColumns || '*')
        .eq('id', id)
        .single();

      if (error) {
        this.logFailure('get', error.message);
        return this.createErrorResponse(`Failed to get ${this.config.tableName}: ${error.message}`);
      }

      if (!data) {
        return this.createErrorResponse(`${this.config.tableName} not found`);
      }

      // Validate data against schema
      try {
        const validatedData = this.config.schema.parse(data);
        return this.createSuccessResponse(validatedData);
      } catch (validationError) {
        this.logFailure('get', `Schema validation failed: ${validationError}`);
        return this.createErrorResponse(`Invalid data format: ${validationError}`);
      }
    });
  }

  /**
   * Create a new item
   */
  async create(data: Partial<T>): Promise<ServiceResponse<T>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('create', { data });

      // Validate input data
      try {
        const validatedData = this.config.schema.partial().parse(data);
        const { data: createdData, error } = await this.supabase
          .from(this.config.tableName)
          .insert(validatedData)
          .select(this.config.defaultColumns || '*')
          .single();

        if (error) {
          this.logFailure('create', error.message);
          return this.createErrorResponse(`Failed to create ${this.config.tableName}: ${error.message}`);
        }

        // Validate response data
        const validatedResponse = this.config.schema.parse(createdData);
        return this.createSuccessResponse(validatedResponse);
      } catch (validationError) {
        this.logFailure('create', `Schema validation failed: ${validationError}`);
        return this.createErrorResponse(`Invalid data format: ${validationError}`);
      }
    });
  }

  /**
   * Update an existing item
   */
  async update(id: string, data: Partial<T>): Promise<ServiceResponse<T>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('update', { id, data });

      const validationError = this.validateIdParam(id);
      if (validationError) {
        return this.createErrorResponse(validationError);
      }

      try {
        const validatedData = this.config.schema.partial().parse(data);
        const { data: updatedData, error } = await this.supabase
          .from(this.config.tableName)
          .update(validatedData)
          .eq('id', id)
          .select(this.config.defaultColumns || '*')
          .single();

        if (error) {
          this.logFailure('update', error.message);
          return this.createErrorResponse(`Failed to update ${this.config.tableName}: ${error.message}`);
        }

        if (!updatedData) {
          return this.createErrorResponse(`${this.config.tableName} not found`);
        }

        const validatedResponse = this.config.schema.parse(updatedData);
        return this.createSuccessResponse(validatedResponse);
      } catch (validationError) {
        this.logFailure('update', `Schema validation failed: ${validationError}`);
        return this.createErrorResponse(`Invalid data format: ${validationError}`);
      }
    });
  }

  /**
   * Delete an item by ID
   */
  async delete(id: string): Promise<ServiceResponse<boolean>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('delete', { id });

      const validationError = this.validateIdParam(id);
      if (validationError) {
        return this.createErrorResponse(validationError);
      }

      const { error } = await this.supabase
        .from(this.config.tableName)
        .delete()
        .eq('id', id);

      if (error) {
        this.logFailure('delete', error.message);
        return this.createErrorResponse(`Failed to delete ${this.config.tableName}: ${error.message}`);
      }

      return this.createSuccessResponse(true);
    });
  }

  /**
   * List items with optional filters
   */
  async list(filters?: Record<string, any>): Promise<ServiceResponse<T[]>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('list', { filters });

      let query = this.supabase
        .from(this.config.tableName)
        .select(this.config.defaultColumns || '*');

      // Apply filters
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }

      const { data, error } = await query;

      if (error) {
        this.logFailure('list', error.message);
        return this.createErrorResponse(`Failed to list ${this.config.tableName}: ${error.message}`);
      }

      // Validate each item
      try {
        const validatedData = data.map(item => this.config.schema.parse(item));
        return this.createSuccessResponse(validatedData);
      } catch (validationError) {
        this.logFailure('list', `Schema validation failed: ${validationError}`);
        return this.createErrorResponse(`Invalid data format: ${validationError}`);
      }
    });
  }

  // ========================================================================
  // ADVANCED OPERATIONS
  // ========================================================================

  /**
   * Search items with text query
   */
  async search(query: string, options?: SearchOptions): Promise<ServiceResponse<T[]>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('search', { query, options });

      if (!query || query.trim() === '') {
        return this.createErrorResponse('Search query is required');
      }

      let dbQuery = this.supabase
        .from(this.config.tableName)
        .select(this.config.defaultColumns || '*');

      // Apply text search if searchColumns are configured
      if (options?.searchColumns && options.searchColumns.length > 0) {
        const searchConditions = options.searchColumns.map(column => 
          `${column}.ilike.%${query}%`
        );
        dbQuery = dbQuery.or(searchConditions.join(','));
      }

      // Apply additional filters
      if (options?.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            dbQuery = dbQuery.eq(key, value);
          }
        });
      }

      // Apply sorting
      if (options?.sort) {
        dbQuery = dbQuery.order(options.sort.column, { ascending: options.sort.direction === 'asc' });
      }

      // Apply pagination
      if (options?.pagination) {
        const { page, limit } = options.pagination;
        const from = (page - 1) * limit;
        const to = from + limit - 1;
        dbQuery = dbQuery.range(from, to);
      }

      const { data, error } = await dbQuery;

      if (error) {
        this.logFailure('search', error.message);
        return this.createErrorResponse(`Failed to search ${this.config.tableName}: ${error.message}`);
      }

      // Validate results
      try {
        const validatedData = data.map(item => this.config.schema.parse(item));
        return this.createSuccessResponse(validatedData);
      } catch (validationError) {
        this.logFailure('search', `Schema validation failed: ${validationError}`);
        return this.createErrorResponse(`Invalid data format: ${validationError}`);
      }
    });
  }

  /**
   * Bulk create multiple items
   */
  async bulkCreate(data: Partial<T>[]): Promise<ServiceResponse<T[]>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('bulkCreate', { count: data.length });

      if (!data || data.length === 0) {
        return this.createErrorResponse('No data provided for bulk create');
      }

      try {
        const validatedData = data.map(item => this.config.schema.partial().parse(item));
        const { data: createdData, error } = await this.supabase
          .from(this.config.tableName)
          .insert(validatedData)
          .select(this.config.defaultColumns || '*');

        if (error) {
          this.logFailure('bulkCreate', error.message);
          return this.createErrorResponse(`Failed to bulk create ${this.config.tableName}: ${error.message}`);
        }

        const validatedResponse = createdData.map(item => this.config.schema.parse(item));
        return this.createSuccessResponse(validatedResponse);
      } catch (validationError) {
        this.logFailure('bulkCreate', `Schema validation failed: ${validationError}`);
        return this.createErrorResponse(`Invalid data format: ${validationError}`);
      }
    });
  }

  /**
   * Bulk update multiple items
   */
  async bulkUpdate(updates: { id: string; data: Partial<T> }[]): Promise<ServiceResponse<T[]>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('bulkUpdate', { count: updates.length });

      if (!updates || updates.length === 0) {
        return this.createErrorResponse('No updates provided for bulk update');
      }

      const results: T[] = [];

      for (const update of updates) {
        const result = await this.update(update.id, update.data);
        if (result.success && result.data) {
          results.push(result.data);
        }
      }

      return this.createSuccessResponse(results);
    });
  }

  /**
   * Bulk delete multiple items
   */
  async bulkDelete(ids: string[]): Promise<ServiceResponse<boolean>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('bulkDelete', { count: ids.length });

      if (!ids || ids.length === 0) {
        return this.createErrorResponse('No IDs provided for bulk delete');
      }

      // Validate all IDs
      for (const id of ids) {
        const validationError = this.validateIdParam(id);
        if (validationError) {
          return this.createErrorResponse(`Invalid ID: ${id}`);
        }
      }

      const { error } = await this.supabase
        .from(this.config.tableName)
        .delete()
        .in('id', ids);

      if (error) {
        this.logFailure('bulkDelete', error.message);
        return this.createErrorResponse(`Failed to bulk delete ${this.config.tableName}: ${error.message}`);
      }

      return this.createSuccessResponse(true);
    });
  }

  // ========================================================================
  // UTILITY METHODS
  // ========================================================================

  /**
   * Get count of items with optional filters
   */
  async count(filters?: Record<string, any>): Promise<ServiceResponse<number>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('count', { filters });

      let query = this.supabase
        .from(this.config.tableName)
        .select('id', { count: 'exact', head: true });

      // Apply filters
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }

      const { count, error } = await query;

      if (error) {
        this.logFailure('count', error.message);
        return this.createErrorResponse(`Failed to count ${this.config.tableName}: ${error.message}`);
      }

      return this.createSuccessResponse(count || 0);
    });
  }

  /**
   * Check if an item exists
   */
  async exists(id: string): Promise<ServiceResponse<boolean>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('exists', { id });

      const validationError = this.validateIdParam(id);
      if (validationError) {
        return this.createErrorResponse(validationError);
      }

      const { data, error } = await this.supabase
        .from(this.config.tableName)
        .select('id')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        this.logFailure('exists', error.message);
        return this.createErrorResponse(`Failed to check existence: ${error.message}`);
      }

      return this.createSuccessResponse(!!data);
    });
  }
}
