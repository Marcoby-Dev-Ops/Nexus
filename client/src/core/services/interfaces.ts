import type { ServiceResponse } from './BaseService';

/**
 * Standard CRUD service interface
 * Provides common operations for all services
 */
export interface CrudServiceInterface<T> {
  /** Get a single item by ID */
  get(id: string): Promise<ServiceResponse<T>>;
  
  /** Create a new item */
  create(data: Partial<T>): Promise<ServiceResponse<T>>;
  
  /** Update an existing item */
  update(id: string, data: Partial<T>): Promise<ServiceResponse<T>>;
  
  /** Delete an item by ID */
  delete(id: string): Promise<ServiceResponse<boolean>>;
  
  /** List items with optional filters */
  list(filters?: Record<string, any>): Promise<ServiceResponse<T[]>>;
}

/**
 * Extended service interface with search capabilities
 */
export interface SearchableServiceInterface<T> extends CrudServiceInterface<T> {
  /** Search items by query string */
  search(query: string, filters?: Record<string, any>): Promise<ServiceResponse<T[]>>;
  
  /** Bulk create multiple items */
  bulkCreate(data: Partial<T>[]): Promise<ServiceResponse<T[]>>;
  
  /** Bulk update multiple items */
  bulkUpdate(updates: { id: string; data: Partial<T> }[]): Promise<ServiceResponse<T[]>>;
  
  /** Bulk delete multiple items */
  bulkDelete(ids: string[]): Promise<ServiceResponse<boolean>>;
}

/**
 * Service configuration interface
 */
export interface ServiceConfig {
  tableName: string;
  schema: any; // z.ZodSchema<any>; // This line was removed as per the new_code, as zod is no longer imported.
  cacheEnabled?: boolean;
  cacheTTL?: number;
  enableLogging?: boolean;
}

/**
 * Service factory interface
 */
export interface ServiceFactoryInterface {
  register<T>(name: string, service: T): void;
  get<T>(name: string): T;
  has(name: string): boolean;
  list(): string[];
}

/**
 * Service hook interface for React components
 */
export interface ServiceHookInterface<T> {
  useGet: (id: string) => {
    data: T | null;
    error: string | null;
    isLoading: boolean;
    refetch: () => void;
  };
  useList: (filters?: Record<string, any>) => {
    data: T[] | null;
    error: string | null;
    isLoading: boolean;
    refetch: () => void;
  };
  useCreate: () => {
    mutate: (data: Partial<T>) => void;
    isLoading: boolean;
    error: string | null;
    isSuccess: boolean;
  };
  useUpdate: () => {
    mutate: (id: string, data: Partial<T>) => void;
    isLoading: boolean;
    error: string | null;
    isSuccess: boolean;
  };
  useDelete: () => {
    mutate: (id: string) => void;
    isLoading: boolean;
    error: string | null;
    isSuccess: boolean;
  };
} 
