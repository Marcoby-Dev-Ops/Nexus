/**
 * Service Factory
 * 
 * Central registry for all services with dependency injection and type safety.
 * Provides a singleton pattern for accessing services throughout the application.
 */

import { BaseService } from './BaseService';

/**
 * Service factory interface
 */
export interface ServiceFactoryInterface {
  /** Register a service with a name */
  register<T extends BaseService>(name: string, service: T): void;
  
  /** Get a service by name */
  get<T extends BaseService>(name: string): T;
  
  /** Check if a service exists */
  has(name: string): boolean;
  
  /** List all registered service names */
  list(): string[];
  
  /** Get service instance (singleton) */
  getInstance(): ServiceFactory;
}

/**
 * Service Factory Class
 * 
 * Manages service instances with dependency injection and type safety.
 * Implements singleton pattern for global access.
 */
export class ServiceFactory implements ServiceFactoryInterface {
  private static instance: ServiceFactory;
  private services = new Map<string, BaseService>();

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ServiceFactory {
    if (!ServiceFactory.instance) {
      ServiceFactory.instance = new ServiceFactory();
    }
    return ServiceFactory.instance;
  }

  /**
   * Register a service with a name
   */
  register<T extends BaseService>(name: string, service: T): void {
    if (!name || typeof name !== 'string') {
      throw new Error('Service name must be a non-empty string');
    }

    if (!service || typeof service !== 'object') {
      throw new Error('Service must be a valid object');
    }

    if (!(service instanceof BaseService)) {
      throw new Error('Service must extend BaseService');
    }

    if (this.services.has(name)) {
      console.warn(`Service '${name}' is already registered. Overwriting...`);
    }

    this.services.set(name, service);
  }

  /**
   * Get a service by name
   */
  get<T extends BaseService>(name: string): T {
    if (!name || typeof name !== 'string') {
      throw new Error('Service name must be a non-empty string');
    }

    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service '${name}' not found. Available services: ${this.list().join(', ')}`);
    }

    return service as T;
  }

  /**
   * Check if a service exists
   */
  has(name: string): boolean {
    return this.services.has(name);
  }

  /**
   * List all registered service names
   */
  list(): string[] {
    return Array.from(this.services.keys());
  }

  /**
   * Get service instance (singleton)
   */
  getInstance(): ServiceFactory {
    return ServiceFactory.getInstance();
  }

  /**
   * Clear all registered services (useful for testing)
   */
  clear(): void {
    this.services.clear();
  }

  /**
   * Get service count
   */
  size(): number {
    return this.services.size;
  }

  /**
   * Get all services as a map
   */
  getAll(): Map<string, BaseService> {
    return new Map(this.services);
  }
}

/**
 * Global service factory instance
 */
export const serviceFactory = ServiceFactory.getInstance();

/**
 * Service registration helper
 */
export const registerService = <T extends BaseService>(name: string, service: T): void => {
  serviceFactory.register(name, service);
};

/**
 * Service retrieval helper
 */
export const getService = <T extends BaseService>(name: string): T => {
  return serviceFactory.get<T>(name);
};

/**
 * Service existence check helper
 */
export const hasService = (name: string): boolean => {
  return serviceFactory.has(name);
};

/**
 * List all services helper
 */
export const listServices = (): string[] => {
  return serviceFactory.list();
};
