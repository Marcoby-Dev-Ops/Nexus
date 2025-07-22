/**
 * Integrations Domain - Main Index
 * Consolidates all integration functionality including third-party services and APIs
 */

// Integrations Subdomains
export * from './components';
export * from './services';
export * from './hooks';

// Integration Services
export { orchestrator } from './services/centralizedAppsOrchestrator';
export { googlePlacesService } from './services/googlePlacesService';

// Integration Types
export interface IntegrationConfig {
  provider: string;
  apiKey?: string;
  webhookUrl?: string;
  enabled: boolean;
  lastSync?: string;
}

export interface IntegrationStatus {
  id: string;
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync: string;
  errorCount: number;
} 