/**
 * Authentication Types for Integrations
 * Supports both OAuth 2.0 and API Key authentication patterns
 */

export type AuthType = 'oauth' | 'api_key' | 'basic_auth' | 'custom';

export interface OAuthCredentials {
  type: 'oauth';
  accesstoken: string;
  refresh_token?: string;
  expires_at?: number;
  scope?: string;
  token_type?: string;
}

export interface ApiKeyCredentials {
  type: 'api_key';
  apikey: string;
  key_name?: string; // e.g., 'X-API-Key', 'Authorization'
  key_location?: 'header' | 'query' | 'body'; // Default: header
}

export interface BasicAuthCredentials {
  type: 'basic_auth';
  username: string;
  password: string;
}

export interface CustomCredentials {
  type: 'custom';
  [key: string]: any;
}

export type IntegrationCredentials = 
  | OAuthCredentials 
  | ApiKeyCredentials 
  | BasicAuthCredentials 
  | CustomCredentials;

export interface AuthConfig {
  type: AuthType;
  required: boolean;
  description?: string;
  fields?: {
    [key: string]: {
      type: 'string' | 'password' | 'number' | 'boolean';
      required: boolean;
      label: string;
      placeholder?: string;
      help?: string;
    };
  };
}

export interface IntegrationAuthConfig {
  oauth?: {
    clientid: string;
    clientsecret: string;
    authurl: string;
    tokenurl: string;
    scope: string;
    redirecturi: string;
  };
  api_key?: {
    keyname: string;
    keylocation: 'header' | 'query' | 'body';
    validation_endpoint?: string;
  };
  basic_auth?: {
    usernamefield: string;
    passwordfield: string;
  };
  custom?: {
    [key: string]: any;
  };
}

/**
 * Authentication Service Interface
 * Provides unified methods for different auth types
 */
export interface AuthService {
  /**
   * Get credentials for an integration
   */
  getCredentials(integrationId: string, userId: string): Promise<IntegrationCredentials | null>;
  
  /**
   * Store credentials for an integration
   */
  storeCredentials(
    integrationId: string, 
    userId: string, 
    credentials: IntegrationCredentials
  ): Promise<void>;
  
  /**
   * Test connection with stored credentials
   */
  testConnection(integrationId: string, userId: string): Promise<boolean>;
  
  /**
   * Refresh OAuth tokens if needed
   */
  refreshTokens(integrationId: string, userId: string): Promise<OAuthCredentials | null>;
  
  /**
   * Remove stored credentials
   */
  removeCredentials(integrationId: string, userId: string): Promise<void>;
}

/**
 * API Client Factory
 * Creates configured HTTP clients for different auth types
 */
export interface ApiClientFactory {
  /**
   * Create API client with appropriate authentication
   */
  createClient(
    baseUrl: string,
    credentials: IntegrationCredentials,
    options?: {
      timeout?: number;
      retries?: number;
      headers?: Record<string, string>;
    }
  ): ApiClient;
}

export interface ApiClient {
  get<T>(url: string, params?: Record<string, any>): Promise<T>;
  post<T>(url: string, data?: any, params?: Record<string, any>): Promise<T>;
  put<T>(url: string, data?: any, params?: Record<string, any>): Promise<T>;
  delete<T>(url: string, params?: Record<string, any>): Promise<T>;
  patch<T>(url: string, data?: any, params?: Record<string, any>): Promise<T>;
}

/**
 * Authentication Validation
 */
export interface AuthValidation {
  /**
   * Validate API key by making a test request
   */
  validateApiKey(
    apiKey: string,
    validationEndpoint: string,
    keyName?: string,
    keyLocation?: 'header' | 'query' | 'body'
  ): Promise<boolean>;
  
  /**
   * Validate OAuth tokens
   */
  validateOAuthTokens(credentials: OAuthCredentials): Promise<boolean>;
  
  /**
   * Check if OAuth tokens need refresh
   */
  needsTokenRefresh(credentials: OAuthCredentials): boolean;
}

 