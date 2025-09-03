/**
 * Simple API client for browser operations
 * Replaces UnifiedDatabaseService browser functionality
 */

import { getEnv } from '@/core/environment';
import { loggingUtils } from '@/core/config/logging';

// Import the AuthentikAuthService for token refresh
import { authentikAuthService } from '@/core/auth/authentikAuthServiceInstance';

/**
 * Get authorization headers for API requests
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const authLogsEnabled = (import.meta as any)?.env?.VITE_ENABLE_AUTH_LOGS === 'true';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // Get token from localStorage
  const sessionData = localStorage.getItem('authentik_session');
  let token: string | null = null;
  
  if (sessionData) {
    try {
      const session = JSON.parse(sessionData);
      if (session?.session?.accessToken) {
        token = session.session.accessToken;
      } else if (session?.accessToken) {
        token = session.accessToken;
      } else if (authLogsEnabled) {
        loggingUtils.auth('No access token found in session data', {
          hasSession: !!session.session,
          hasAccessToken: !!session.accessToken,
          sessionKeys: Object.keys(session)
        });
      }
    } catch (error) {
      if (authLogsEnabled) console.error('Error parsing session data:', error);
    }
  } else {
    if (authLogsEnabled) console.log('No authentik_session found in localStorage');
  }
  
  // Fallback to localStorage token (removed AuthentikAuthService dependency)
  if (!token) {
    // Try to get token from other localStorage keys
    const tokenKeys = ['access_token', 'token', 'auth_token'];
    for (const key of tokenKeys) {
      const storedToken = localStorage.getItem(key);
      if (storedToken) {
        token = storedToken;
        if (authLogsEnabled) loggingUtils.auth(`Found token in ${key}`);
        break;
      }
    }
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    if (authLogsEnabled) loggingUtils.auth('Authorization header set');
  } else {
    if (authLogsEnabled) loggingUtils.auth('No token found, requests will be unauthenticated');
    // Show a helpful message to the user
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth/') && !window.location.pathname.includes('/login')) {
      if (authLogsEnabled) console.warn('User not authenticated. Please sign in to access the application.');
    }
  }
  
  return headers;
}

/**
 * Attempt to refresh the authentication token
 */
async function attemptTokenRefresh(): Promise<boolean> {
  try {
    // Prevent multiple simultaneous refresh attempts
    if (attemptTokenRefresh.isRefreshing) {
      loggingUtils.auth('Token refresh already in progress, waiting...');
      // Wait for the current refresh to complete
      while (attemptTokenRefresh.isRefreshing) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      // Check if we have a valid token now
      const headers = await getAuthHeaders();
      return !!headers.Authorization;
    }
    
    attemptTokenRefresh.isRefreshing = true;
    
    const refreshResult = await authentikAuthService.refreshSession();
    if (refreshResult.success && refreshResult.data) {
      loggingUtils.auth('Token refreshed successfully');
      return true;
    } else {
      loggingUtils.auth('Token refresh failed', { error: refreshResult.error });
      return false;
    }
  } catch (error) {
    loggingUtils.auth('Token refresh error', { error });
    return false;
  } finally {
    attemptTokenRefresh.isRefreshing = false;
  }
}

// Add a flag to prevent multiple simultaneous refresh attempts
attemptTokenRefresh.isRefreshing = false;

/**
 * Make an authenticated request with automatic token refresh
 */
async function makeAuthenticatedRequest<T>(
  url: string,
  options: RequestInit,
  retryCount: number = 0
): Promise<Response> {
  const maxRetries = 1; // Only retry once after token refresh
  
  try {
    const response = await fetch(url, options);
    
    // If we get a 401 and haven't retried yet, attempt token refresh
    if (response.status === 401 && retryCount < maxRetries) {
      loggingUtils.auth('Received 401, attempting token refresh');
      
      const refreshSuccess = await attemptTokenRefresh();
      if (refreshSuccess) {
        // Get fresh headers with new token
        const freshHeaders = await getAuthHeaders();
        const retryOptions = {
          ...options,
          headers: {
            ...options.headers,
            ...freshHeaders
          }
        };
        
        loggingUtils.auth('Retrying request with refreshed token');
        return makeAuthenticatedRequest(url, retryOptions, retryCount + 1);
      } else {
        // Token refresh failed
        const isDev = typeof import.meta !== 'undefined' && (import.meta as any).env && ((import.meta as any).env.DEV || (import.meta as any).env.VITE_DEV === 'true' || (import.meta as any).env.VITE_DEV === '1');
        if (isDev) {
          loggingUtils.auth('Token refresh failed in dev, NOT redirecting. Surfacing 401 for debugging');
          // Do not redirect in development; let caller handle the 401
          return response;
        }
        // In production, redirect to login if we're not already on an auth page
        if (typeof window !== 'undefined' && 
            !window.location.pathname.includes('/auth/') && 
            !window.location.pathname.includes('/login') &&
            !window.location.pathname.includes('/callback')) {
          loggingUtils.auth('Token refresh failed, redirecting to login');
          localStorage.removeItem('authentik_session');
          window.location.href = '/login';
        }
      }
    }
    
    return response;
  } catch (error) {
    loggingUtils.auth('Request failed', { error, retryCount });
    throw error;
  }
}

/**
 * API Client for making HTTP requests
 */
export interface ApiClientConfig {
  baseUrl: string;
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  timeout?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

export interface RPCResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export class ApiClient {
  private config: ApiClientConfig;
  private baseHeaders: Record<string, string>;

  constructor(config: ApiClientConfig) {
    this.config = {
      timeout: 30000,
      ...config,
    };
    
    this.baseHeaders = {
      'Content-Type': 'application/json',
    };

    // Add API key if provided
    if (this.config.apiKey) {
      this.baseHeaders['X-API-Key'] = this.config.apiKey;
    }

    // Add OAuth token if provided
    if (this.config.accessToken) {
      this.baseHeaders['Authorization'] = `Bearer ${this.config.accessToken}`;
    }
  }

  /**
   * Make a request with automatic retry and error handling
   */
  async request<T = any>(
    method: 'get' | 'post' | 'put' | 'patch' | 'delete',
    path: string,
    options: {
      body?: any;
      headers?: Record<string, string>;
      params?: Record<string, string>;
    } = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = new URL(path, this.config.baseUrl);
      
      // Add query parameters
      if (options.params) {
        Object.entries(options.params).forEach(([key, value]) => {
          url.searchParams.append(key, value);
        });
      }

      const headers = {
        ...this.baseHeaders,
        ...options.headers,
      };

      const requestOptions: RequestInit = {
        method: method.toUpperCase(),
        headers,
        signal: AbortSignal.timeout(this.config.timeout!),
      };

      // Add body for non-GET requests
      if (method !== 'get' && options.body) {
        requestOptions.body = JSON.stringify(options.body);
      }

      const response = await makeAuthenticatedRequest(url.toString(), requestOptions);

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`,
          status: response.status,
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
        status: response.status,
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Convenience methods
  async get<T = any>(path: string, options?: { headers?: Record<string, string>; params?: Record<string, string> }): Promise<ApiResponse<T>> {
    return this.request<T>('get', path, options);
  }

  async post<T = any>(path: string, body?: any, options?: { headers?: Record<string, string> }): Promise<ApiResponse<T>> {
    return this.request<T>('post', path, { body, ...options });
  }

  async put<T = any>(path: string, body?: any, options?: { headers?: Record<string, string> }): Promise<ApiResponse<T>> {
    return this.request<T>('put', path, { body, ...options });
  }

  async patch<T = any>(path: string, body?: any, options?: { headers?: Record<string, string> }): Promise<ApiResponse<T>> {
    return this.request<T>('patch', path, { body, ...options });
  }

  async delete<T = any>(path: string, options?: { headers?: Record<string, string> }): Promise<ApiResponse<T>> {
    return this.request<T>('delete', path, options);
  }

  /**
   * Refresh OAuth token if needed
   */
  async refreshToken(): Promise<boolean> {
    if (!this.config.refreshToken || !this.config.clientId || !this.config.clientSecret) {
      return false;
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.config.refreshToken,
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        this.config.accessToken = data.access_token;
        this.config.refreshToken = data.refresh_token;
        this.baseHeaders['Authorization'] = `Bearer ${data.access_token}`;
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    return false;
  }
}

/**
 * Call edge function via Express server API
 */
export async function callEdgeFunction<T>(
  functionName: string,
  params: Record<string, unknown> = {}
): Promise<RPCResult<T>> {
  try {
    const headers = await getAuthHeaders();
    const apiUrl = getEnv().api.url;
    const response = await makeAuthenticatedRequest(`${apiUrl}/api/edge/${functionName}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });

    const result = await response.json();
    return {
      data: result.data || null,
      error: result.error || null,
      success: response.ok,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false,
    };
  }
}

/**
 * Call public edge function via Express server API
 */
export async function callPublicEdgeFunction<T>(
  functionName: string,
  params: Record<string, unknown> = {}
): Promise<RPCResult<T>> {
  try {
    const headers = await getAuthHeaders();
    const apiUrl = getEnv().api.url;
    const response = await makeAuthenticatedRequest(`${apiUrl}/api/edge/${functionName}/public`, {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });

    const result = await response.json();
    return {
      data: result.data || null,
      error: result.error || null,
      success: response.ok,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false,
    };
  }
}

/**
 * Select data from table
 */
export async function selectData<T>(
  table: string,
  columns?: string,
  filter?: Record<string, string | number | boolean>
): Promise<ApiResponse<T[]>> {
  try {
    const params = new URLSearchParams();
    if (columns) params.append('columns', columns);
    if (filter) {
      Object.entries(filter).forEach(([key, value]) => {
        params.append(`filter[${key}]`, String(value));
      });
    }
    
    const apiUrl = getEnv().api.url;
    if (!apiUrl) {
      console.error('No API URL configured');
      return { 
        data: null, 
        error: 'API URL not configured' 
      };
    }
    
    const response = await makeAuthenticatedRequest(`${apiUrl}/api/db/${table}?${params.toString()}`, {
      method: 'GET',
      headers: await getAuthHeaders(),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error response body:', errorText);
      return { 
        data: null, 
        error: `HTTP error! status: ${response.status}, body: ${errorText}` 
      };
    }
    
    const result = await response.json();
    return { data: result.data, error: result.error };
  } catch (error) {
    console.error('Exception caught:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Select one record from table
 */
export async function selectOne<T>(
  table: string,
  id: string,
  idColumn: string = 'id'
): Promise<ApiResponse<T>> {
  try {
    // Validate ID parameter
    if (!id || id === 'undefined' || id === 'null') {
      console.warn(`selectOne called with invalid ID: ${id} for table: ${table}`);
      return { data: null, error: 'Invalid ID parameter' };
    }

    const apiUrl = getEnv().api.url;
    if (!apiUrl) {
      console.error('No API URL configured');
      return { data: null, error: 'API URL not configured' };
    }
    
    const response = await makeAuthenticatedRequest(`${apiUrl}/api/db/${table}/${id}?idColumn=${idColumn}`, {
      method: 'GET',
      headers: await getAuthHeaders(),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error response body:', errorText);
      return { 
        data: null, 
        error: `HTTP error! status: ${response.status}, body: ${errorText}` 
      };
    }
    
    const result = await response.json();
    return { data: result.data, error: result.error };
  } catch (error) {
    console.error('Exception caught:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Insert one record into table
 */
export async function insertOne<T>(
  table: string,
  data: any
): Promise<ApiResponse<T>> {
  try {
    const apiUrl = getEnv().api.url;
    if (!apiUrl) {
      console.error('No API URL configured');
      return { data: null, error: 'API URL not configured' };
    }
    
    const response = await makeAuthenticatedRequest(`${apiUrl}/api/db/${table}`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error response body:', errorText);
      return { 
        data: null, 
        error: `HTTP error! status: ${response.status}, body: ${errorText}` 
      };
    }
    
    const result = await response.json();
    return { data: result.data, error: result.error };
  } catch (error) {
    console.error('Exception caught:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Update one record in table
 */
export async function updateOne<T>(
  table: string,
  id: string,
  data: any,
  idColumn: string = 'id'
): Promise<ApiResponse<T>> {
  try {
    const apiUrl = getEnv().api.url;
    if (!apiUrl) {
      console.error('No API URL configured');
      return { data: null, error: 'API URL not configured' };
    }
    
    const response = await makeAuthenticatedRequest(`${apiUrl}/api/db/${table}/${id}?idColumn=${idColumn}`, {
      method: 'PUT',
      headers: await getAuthHeaders(),
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error response body:', errorText);
      return { 
        data: null, 
        error: `HTTP error! status: ${response.status}, body: ${errorText}` 
      };
    }
    
    const result = await response.json();
    return { data: result.data, error: result.error };
  } catch (error) {
    console.error('Exception caught:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Delete one record from table
 */
export async function deleteOne<T>(
  table: string,
  id: string,
  idColumn: string = 'id'
): Promise<ApiResponse<T>> {
  try {
    const apiUrl = getEnv().api.url;
    if (!apiUrl) {
      console.error('No API URL configured');
      return { data: null, error: 'API URL not configured' };
    }
    
    const response = await makeAuthenticatedRequest(`${apiUrl}/api/db/${table}/${id}?idColumn=${idColumn}`, {
      method: 'DELETE',
      headers: await getAuthHeaders(),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error response body:', errorText);
      return { 
        data: null, 
        error: `HTTP error! status: ${response.status}, body: ${errorText}` 
      };
    }
    
    const result = await response.json();
    return { data: result.data, error: result.error };
  } catch (error) {
    console.error('Exception caught:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Upsert one record in table
 */
export async function upsertOne<T>(
  table: string,
  data: any,
  onConflict: string = 'id'
): Promise<ApiResponse<T>> {
  try {
    const apiUrl = getEnv().api.url;
    if (!apiUrl) {
      console.error('No API URL configured');
      return { data: null, error: 'API URL not configured' };
    }
    
    const response = await makeAuthenticatedRequest(`${apiUrl}/api/db/${table}/upsert`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({
        data,
        onConflict,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error response body:', errorText);
      return { 
        data: null, 
        error: `HTTP error! status: ${response.status}, body: ${errorText}` 
      };
    }
    
    const result = await response.json();
    return { data: result.data, error: result.error };
  } catch (error) {
    console.error('Exception caught:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Select data from table with advanced options
 */
export async function selectWithOptions<T>(
  table: string,
  options: {
    filter?: Record<string, string | number | boolean>;
    orderBy?: { column: string; ascending: boolean };
    limit?: number;
  }
): Promise<ApiResponse<T[]>> {
  try {
    const apiUrl = getEnv().api.url;
    const response = await makeAuthenticatedRequest(`${apiUrl}/api/db/${table}/query`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(options),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return { data: result.data, error: result.error };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Call RPC function via Express server API
 */
export async function callRPC<T>(
  functionName: string,
  params: Record<string, unknown> = {}
): Promise<RPCResult<T>> {
  try {
    const headers = await getAuthHeaders();
    const apiUrl = getEnv().api.url;
    const response = await makeAuthenticatedRequest(`${apiUrl}/api/rpc/${functionName}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });

    const result = await response.json();
    return {
      data: result.data || null,
      error: result.error || null,
      success: response.ok,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false,
    };
  }
}
