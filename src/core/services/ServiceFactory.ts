import { ServiceFactoryInterface } from './interfaces';

/**
 * Service Factory
 * Central registry for all application services
 */
export class ServiceFactory implements ServiceFactoryInterface {
  private static instance: ServiceFactory;
  private services: Map<string, any> = new Map();

  private constructor() {}

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
   * Register a service with the factory
   */
  register<T>(name: string, service: T): void {
    if (this.services.has(name)) {
      console.warn(`Service ${name} is already registered. Overwriting...`);
    }
    this.services.set(name, service);
  }

  /**
   * Get a service by name
   */
  get<T>(name: string): T {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service ${name} not found. Available services: ${this.list().join(', ')}`);
    }
    return service;
  }

  /**
   * Check if a service is registered
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
   * Clear all registered services (useful for testing)
   */
  clear(): void {
    this.services.clear();
  }

  /**
   * Get service count
   */
  get count(): number {
    return this.services.size;
  }
}

// Export singleton instance
export const serviceFactory = ServiceFactory.getInstance(); 