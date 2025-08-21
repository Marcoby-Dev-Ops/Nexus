export interface Integration {
  id: string;
  name: string;
  description: string;
  provider: string;
  type: 'api' | 'webhook' | 'oauth' | 'custom';
  status: 'active' | 'inactive' | 'error' | 'pending';
  config: IntegrationConfig;
  metadata: IntegrationMetadata;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface IntegrationConfig {
  baseUrl?: string;
  apiKey?: string;
  webhookUrl?: string;
  oauthConfig?: OAuthConfig;
  customConfig?: Record<string, any>;
  headers?: Record<string, string>;
  timeout?: number;
  retryAttempts?: number;
}

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string[];
  authorizationUrl: string;
  tokenUrl: string;
}

export interface IntegrationMetadata {
  version: string;
  category: string;
  tags: string[];
  documentation?: string;
  supportUrl?: string;
  icon?: string;
  color?: string;
}

export interface IntegrationTestResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
  timestamp: string;
}

export interface IntegrationEvent {
  id: string;
  integrationId: string;
  type: 'webhook' | 'api_call' | 'oauth_callback' | 'error';
  payload: any;
  timestamp: string;
  status: 'success' | 'error' | 'pending';
}

export interface CreateIntegrationRequest {
  name: string;
  description: string;
  provider: string;
  type: Integration['type'];
  config: IntegrationConfig;
  metadata?: Partial<IntegrationMetadata>;
}

export interface UpdateIntegrationRequest {
  name?: string;
  description?: string;
  config?: Partial<IntegrationConfig>;
  metadata?: Partial<IntegrationMetadata>;
  status?: Integration['status'];
}

export interface IntegrationFilter {
  provider?: string;
  type?: Integration['type'];
  status?: Integration['status'];
  category?: string;
  tags?: string[];
}
