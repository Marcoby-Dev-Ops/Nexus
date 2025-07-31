import { z } from 'zod';

/**
 * Standardized service response interface
 */
export interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
  metadata?: Record<string, any>;
}

/**
 * Base service interface for CRUD operations
 */
export interface BaseServiceInterface<T> {
  get(id: string): Promise<ServiceResponse<T>>;
  create(data: Partial<T>): Promise<ServiceResponse<T>>;
  update(id: string, data: Partial<T>): Promise<ServiceResponse<T>>;
  delete(id: string): Promise<ServiceResponse<boolean>>;
  list(filters?: Record<string, any>): Promise<ServiceResponse<T[]>>;
}

/**
 * Service interface for complex operations
 */
export interface AdvancedServiceInterface<T> extends BaseServiceInterface<T> {
  search(query: string, filters?: Record<string, any>): Promise<ServiceResponse<T[]>>;
  bulkCreate(data: Partial<T>[]): Promise<ServiceResponse<T[]>>;
  bulkUpdate(updates: { id: string; data: Partial<T> }[]): Promise<ServiceResponse<T[]>>;
  bulkDelete(ids: string[]): Promise<ServiceResponse<boolean>>;
}

/**
 * Service configuration interface
 */
export interface ServiceConfig {
  tableName: string;
  schema: z.ZodSchema<any>;
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