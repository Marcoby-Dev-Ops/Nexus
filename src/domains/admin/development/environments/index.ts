/**
 * Development Environments Subdomain
 * Handles environment management and configuration
 */

export * from './components';
export * from './hooks';
export * from './services';
export * from './types';

export interface DevelopmentEnvironment {
  id: string;
  name: string;
  type: 'development' | 'staging' | 'production' | 'testing';
  status: 'active' | 'inactive' | 'maintenance';
  config: EnvironmentConfig;
  variables: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface EnvironmentConfig {
  url: string;
  database: DatabaseConfig;
  services: ServiceConfig[];
  security: SecurityConfig;
}

export interface DatabaseConfig {
  type: 'postgresql' | 'mysql' | 'mongodb' | 'redis';
  host: string;
  port: number;
  name: string;
  ssl: boolean;
}

export interface ServiceConfig {
  name: string;
  url: string;
  health: 'healthy' | 'unhealthy' | 'unknown';
  lastCheck: string;
}

export interface SecurityConfig {
  ssl: boolean;
  cors: string[];
  rateLimit: number;
} 