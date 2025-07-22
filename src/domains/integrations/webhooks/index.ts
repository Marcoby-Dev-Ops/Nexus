/**
 * Integrations Webhooks Subdomain
 * Handles webhook management and event processing
 */

// Webhooks Components
export * from './components';

// Webhooks Hooks
export * from './hooks';

// Webhooks Services
export * from './services';

// Webhooks Pages
export * from './pages';

// Webhooks Types
export interface Webhook {
  id: string;
  name: string;
  description: string;
  url: string;
  events: string[];
  status: 'active' | 'inactive' | 'error';
  secret: string;
  retryCount: number;
  lastTriggered?: string;
  createdAt: string;
}

export interface WebhookEvent {
  id: string;
  webhookId: string;
  event: string;
  payload: Record<string, any>;
  status: 'pending' | 'sent' | 'failed' | 'retrying';
  responseCode?: number;
  responseBody?: string;
  attempts: number;
  createdAt: string;
}

export interface WebhookConfig {
  enableRetries: boolean;
  maxRetries: number;
  retryDelay: number;
  enableLogging: boolean;
  timeoutSeconds: number;
} 