/**
 * Marketplace Integrations Subdomain
 * Handles third-party integrations and connectors
 */

export * from './components';
export * from './hooks';
export * from './services';
export * from './types';

export interface MarketplaceIntegration {
  id: string;
  name: string;
  description: string;
  provider: string;
  category: 'communication' | 'productivity' | 'analytics' | 'finance' | 'crm';
  status: 'available' | 'beta' | 'deprecated';
  features: string[];
  pricing: {
    type: 'free' | 'paid' | 'freemium';
    price?: number;
    currency?: string;
  };
  requirements: string[];
  documentation: string;
}

export interface IntegrationConnection {
  id: string;
  integrationId: string;
  userId: string;
  status: 'connected' | 'disconnected' | 'error';
  config: Record<string, any>;
  lastSync?: string;
  syncStatus: 'success' | 'failed' | 'pending';
} 