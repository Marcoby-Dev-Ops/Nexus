/**
 * Integrations OAuth Subdomain
 * Handles OAuth connections and authentication
 */

// OAuth Components
export * from './components';

// OAuth Hooks
export * from './hooks';

// OAuth Services
export * from './services';

// OAuth Pages
export * from './pages';

// OAuth Types
export interface OAuthConnection {
  id: string;
  provider: string;
  name: string;
  description: string;
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  scopes: string[];
  expiresAt?: string;
  refreshToken?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface OAuthProvider {
  id: string;
  name: string;
  displayName: string;
  icon: string;
  authUrl: string;
  tokenUrl: string;
  scopes: string[];
  clientId: string;
  clientSecret: string;
  enabled: boolean;
}

export interface OAuthConfig {
  enableAutoRefresh: boolean;
  enableScopes: boolean;
  enableRevoke: boolean;
  tokenExpiryBuffer: number;
} 