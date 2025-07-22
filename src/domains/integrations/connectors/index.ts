/**
 * Integrations Connectors Subdomain
 * Handles third-party service connectors and adapters
 */

// Connectors Components
export * from './components';

// Connectors Hooks
export * from './hooks';

// Connectors Services
export * from './services';

// Connectors Pages
export * from './pages';

// Connectors Types
export interface Connector {
  id: string;
  name: string;
  displayName: string;
  description: string;
  category: 'crm' | 'marketing' | 'finance' | 'productivity' | 'communication';
  icon: string;
  status: 'available' | 'beta' | 'deprecated';
  version: string;
  configSchema: Record<string, any>;
  enabled: boolean;
}

export interface ConnectorInstance {
  id: string;
  connectorId: string;
  name: string;
  config: Record<string, any>;
  status: 'connected' | 'disconnected' | 'error' | 'configuring';
  lastSync?: string;
  syncInterval: number;
  createdAt: string;
}

export interface ConnectorConfig {
  enableAutoSync: boolean;
  enableErrorHandling: boolean;
  enableLogging: boolean;
  maxRetries: number;
} 