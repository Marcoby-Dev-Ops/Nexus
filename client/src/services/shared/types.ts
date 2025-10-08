/**
 * Shared Types for Services
 * 
 * Provides common type definitions used across all services
 */





/**
 * Service configuration interface
 */
export interface ServiceConfig {
  tableName: string;
  schema: any;
  cacheEnabled?: boolean;
  cacheTTL?: number;
  enableLogging?: boolean;
}

/**
 * Service metadata for registry
 */
export interface ServiceMetadata {
  name: string;
  category: 'core' | 'business' | 'ai' | 'integration' | 'department' | 'utility' | 'playbook';
  description: string;
  dependencies: string[];
  isSingleton: boolean;
  isInitialized: boolean;
}
