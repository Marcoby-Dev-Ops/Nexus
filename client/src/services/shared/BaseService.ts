/**
 * Shared Base Service for Services Directory
 * 
 * Extends the core BaseService with additional functionality
 * specific to the services directory organization.
 */

import { BaseService as CoreBaseService } from '@/core/services/BaseService';
import type { ServiceResponse } from '@/core/services/BaseService';
import type { CrudServiceInterface } from '@/core/services/interfaces';

/**
 * Abstract base class for all services in the services directory
 * 
 * Provides common functionality that all services inherit:
 * - Extends core BaseService functionality
 * - Implements CrudServiceInterface for consistent CRUD operations
 * - Service-specific utilities and patterns
 */
export abstract class BaseService<T = any> extends CoreBaseService implements CrudServiceInterface<T> {
  
  /**
   * Service configuration
   */
  protected abstract config: {
    tableName: string;
    schema?: any;
    cacheTimeout?: number;
    retryAttempts?: number;
    retryDelay?: number;
  };

  /**
   * Constructor
   * 
   * @param serviceName - Name of the service for logging
   */
  constructor(serviceName: string) {
    super();
    this.logger.info(`[${serviceName}] Service initialized`);
  }

  // ========================================================================
  // CRUD OPERATIONS (CrudServiceInterface Implementation)
  // ========================================================================

  /**
   * Get a single item by ID
   * 
   * @param id - The ID of the item to retrieve
   * @returns Promise<ServiceResponse<T>>
   */
  async get(id: string): Promise<ServiceResponse<T>> {
    const validation = this.validateIdParam(id);
    if (validation) {
      return this.createErrorResponse<T>(validation);
    }

    return this.executeDbOperation(async () => {
      this.logMethodCall('get', { id });
      
      // This is a base implementation - subclasses should override
      // with their specific database logic
      throw new Error('get method must be implemented by subclass');
    }, 'get');
  }

  /**
   * Create a new item
   * 
   * @param data - The data to create
   * @returns Promise<ServiceResponse<T>>
   */
  async create(data: Partial<T>): Promise<ServiceResponse<T>> {
    if (!data || Object.keys(data).length === 0) {
      return this.createErrorResponse<T>('No data provided for creation');
    }

    return this.executeDbOperation(async () => {
      this.logMethodCall('create', { dataKeys: Object.keys(data) });
      
      // This is a base implementation - subclasses should override
      // with their specific database logic
      throw new Error('create method must be implemented by subclass');
    }, 'create');
  }

  /**
   * Update an existing item
   * 
   * @param id - The ID of the item to update
   * @param data - The data to update
   * @returns Promise<ServiceResponse<T>>
   */
  async update(id: string, data: Partial<T>): Promise<ServiceResponse<T>> {
    const validation = this.validateIdParam(id);
    if (validation) {
      return this.createErrorResponse<T>(validation);
    }

    if (!data || Object.keys(data).length === 0) {
      return this.createErrorResponse<T>('No data provided for update');
    }

    return this.executeDbOperation(async () => {
      this.logMethodCall('update', { id, dataKeys: Object.keys(data) });
      
      // This is a base implementation - subclasses should override
      // with their specific database logic
      throw new Error('update method must be implemented by subclass');
    }, 'update');
  }

  /**
   * Delete an item by ID
   * 
   * @param id - The ID of the item to delete
   * @returns Promise<ServiceResponse<boolean>>
   */
  async delete(id: string): Promise<ServiceResponse<boolean>> {
    const validation = this.validateIdParam(id);
    if (validation) {
      return this.createErrorResponse<boolean>(validation);
    }

    return this.executeDbOperation(async () => {
      this.logMethodCall('delete', { id });
      
      // This is a base implementation - subclasses should override
      // with their specific database logic
      throw new Error('delete method must be implemented by subclass');
    }, 'delete');
  }

  /**
   * List items with optional filters
   * 
   * @param filters - Optional filters to apply
   * @returns Promise<ServiceResponse<T[]>>
   */
  async list(filters?: Record<string, any>): Promise<ServiceResponse<T[]>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('list', { filters });
      
      // This is a base implementation - subclasses should override
      // with their specific database logic
      throw new Error('list method must be implemented by subclass');
    }, 'list');
  }

  // ========================================================================
  // UTILITY METHODS
  // ========================================================================

  /**
   * Validate data against schema if configured
   * 
   * @param data - Data to validate
   * @returns ValidationResult
   */
  protected validateData(data: any): { isValid: boolean; error?: string } {
    if (!this.config.schema) {
      return { isValid: true };
    }

    try {
      this.config.schema.parse(data);
      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Validation failed'
      };
    }
  }

  /**
   * Get cache key for this service
   * 
   * @param key - The key to cache
   * @returns string
   */
  protected getCacheKey(key: string): string {
    return `${this.constructor.name}:${key}`;
  }

  /**
   * Check if caching is enabled for this service
   * 
   * @returns boolean
   */
  protected isCachingEnabled(): boolean {
    return this.config.cacheTimeout !== undefined && this.config.cacheTimeout > 0;
  }

  /**
   * Get retry configuration for this service
   * 
   * @returns RetryConfig
   */
  protected getRetryConfig() {
    return {
      maxAttempts: this.config.retryAttempts || 3,
      baseDelay: this.config.retryDelay || 1000,
      maxDelay: 10000,
    };
  }
}
