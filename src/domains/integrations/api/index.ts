/**
 * Integrations API Subdomain
 * Handles API integrations and external service connections
 */

// API Components
export * from './components';

// API Hooks
export * from './hooks';

// API Services
export * from './services';

// API Pages
export * from './pages';

// API Types
export interface APIIntegration {
  id: string;
  name: string;
  description: string;
  service: string;
  baseUrl: string;
  apiKey?: string;
  status: 'active' | 'inactive' | 'error';
  rateLimit: number;
  lastUsed?: string;
  createdAt: string;
}

export interface APIEndpoint {
  id: string;
  integrationId: string;
  name: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  description: string;
  parameters: APIParameter[];
  responseSchema: Record<string, any>;
  enabled: boolean;
}

export interface APIParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object';
  required: boolean;
  description: string;
  defaultValue?: any;
}

export interface APIConfig {
  enableRateLimiting: boolean;
  enableCaching: boolean;
  enableLogging: boolean;
  timeoutSeconds: number;
} 