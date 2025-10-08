/**
 * Simple API client for browser operations
 * Replaces UnifiedDatabaseService browser functionality
 */

import { getEnv } from '@/core/environment';

function getApiBaseUrl(): string {
  // Use empty string to leverage Vite proxy for relative URLs
  return '';
}
import { loggingUtils } from '@/core/config/logging';
import { useAuthStore } from '@/core/auth/authStore';

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

  const storeState = useAuthStore.getState();
  const session = storeState.session;
  let token: string | null = null;

  if (session) {
    token = session.session?.accessToken || session.accessToken || null;
    
    // Check if token is expired before using it
    if (token) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          const now = Math.floor(Date.now() / 1000);
          
          if (payload.exp && payload.exp < now) {
            if (authLogsEnabled) {
              loggingUtils.auth('Token expired, attempting refresh', {
                exp: new Date(payload.exp * 1000).toISOString(),
                now: new Date().toISOString()
              });
            }
            
            // Attempt to refresh the token
            const refreshSuccess = await attemptTokenRefresh();
            if (refreshSuccess) {
              const freshSession = await authentikAuthService.getSession();
              token = freshSession?.data?.session?.accessToken || freshSession?.data?.accessToken || null;
              if (authLogsEnabled && token) {
                loggingUtils.auth('Token refreshed successfully');
              }
            } else {
              if (authLogsEnabled) {
                loggingUtils.auth('Token refresh failed, clearing session');
              }
              token = null;
            }
          } else if (authLogsEnabled) {
            loggingUtils.auth('Using valid access token from auth store');
          }
        }
      } catch (error) {
        if (authLogsEnabled) {
          loggingUtils.auth('Error checking token expiration', { error });
        }
      }
    }
  }

  if (!token) {
    const sessionData = localStorage.getItem('authentik_session');
    if (sessionData) {
      try {
        const storedSession = JSON.parse(sessionData);
        token = storedSession?.session?.accessToken || storedSession?.accessToken || null;
        
        // Check if stored token is expired
        if (token) {
          try {
            const parts = token.split('.');
            if (parts.length === 3) {
              const payload = JSON.parse(atob(parts[1]));
              const now = Math.floor(Date.now() / 1000);
              
              if (payload.exp && payload.exp < now) {
                if (authLogsEnabled) {
                  loggingUtils.auth('Stored token expired, attempting refresh', {
                    exp: new Date(payload.exp * 1000).toISOString(),
                    now: new Date().toISOString()
                  });
                }
                
                // Attempt to refresh the token
                const refreshSuccess = await attemptTokenRefresh();
                if (refreshSuccess) {
                  const freshSession = await authentikAuthService.getSession();
                  token = freshSession?.data?.session?.accessToken || freshSession?.data?.accessToken || null;
                  if (authLogsEnabled && token) {
                    loggingUtils.auth('Stored token refreshed successfully');
                  }
                } else {
                  if (authLogsEnabled) {
                    loggingUtils.auth('Stored token refresh failed, clearing session');
                  }
                  token = null;
                }
              } else if (authLogsEnabled) {
                loggingUtils.auth('Using valid stored token from localStorage');
              }
            }
          } catch (error) {
            if (authLogsEnabled) {
              loggingUtils.auth('Error checking stored token expiration', { error });
            }
          }
        }
        
        if (token && !session) {
          // Hydrate the store asynchronously without blocking callers
          try {
            useAuthStore.getState().setAuthState(storedSession);
          } catch (_error) {
            /* no-op */
          }
        }
      } catch (error) {
        if (authLogsEnabled) console.error('Error parsing session data:', error);
      }
    } else if (authLogsEnabled) {
      console.log('No authentik_session found in localStorage');
    }
  }

  if (!token) {
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
    if (
      typeof window !== 'undefined' &&
      !window.location.pathname.includes('/auth/') &&
      !window.location.pathname.includes('/login')
    ) {
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
    if (attemptTokenRefresh.isRefreshing) {
      loggingUtils.auth('Token refresh already in progress, waiting...');
      while (attemptTokenRefresh.isRefreshing) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
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

attemptTokenRefresh.isRefreshing = false;

async function makeAuthenticatedRequest<T>(
  url: string,
  options: RequestInit,
  retryCount: number = 0
): Promise<Response> {
  const maxRetries = 1;

  try {
    const response = await fetch(url, options);

    if (response.status === 401 && retryCount < maxRetries) {
      loggingUtils.auth('Received 401, attempting token refresh');

      const refreshSuccess = await attemptTokenRefresh();
      if (refreshSuccess) {
        const freshHeaders = await getAuthHeaders();
        const retryOptions = {
          ...options,
          headers: {
            ...options.headers,
            ...freshHeaders,
          },
        };

        loggingUtils.auth('Retrying request with refreshed token');
        return makeAuthenticatedRequest(url, retryOptions, retryCount + 1);
      }

      const isDev =
        typeof import.meta !== 'undefined' &&
        (import.meta as any).env &&
        (((import.meta as any).env.DEV || (import.meta as any).env.VITE_DEV === 'true') ||
          (import.meta as any).env.VITE_DEV === '1');
      if (isDev) {
        loggingUtils.auth('Token refresh failed in dev, NOT redirecting. Surfacing 401 for debugging');
        return response;
      }

      if (
        typeof window !== 'undefined' &&
        !window.location.pathname.includes('/auth/') &&
        !window.location.pathname.includes('/login') &&
        !window.location.pathname.includes('/callback')
      ) {
        loggingUtils.auth('Token refresh failed, redirecting to login');
        useAuthStore.getState().clearAuthState(true);
        localStorage.removeItem('authentik_session');
        window.location.href = '/login';
      }
    }

    return response;
  } catch (error) {
    loggingUtils.auth('Request failed', { error, retryCount });
    throw error;
  }
}

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
  data?: T | null;
  error?: string | null;
  status?: number;
}

export interface RPCResult<T = any> {
  success: boolean;
  data?: T | null;
  error?: string | null;
}

export class ApiClient {
  private config: ApiClientConfig;
  private baseHeaders: Record<string, string>;

  constructor(config: ApiClientConfig) {
    this.config = config;
    this.baseHeaders = {
      'Content-Type': 'application/json',
      ...(config.apiKey ? { 'X-API-Key': config.apiKey } : {}),
    };
  }

  private async buildHeaders(additionalHeaders?: Record<string, string>): Promise<Record<string, string>> {
    const headers = { ...this.baseHeaders, ...additionalHeaders };

    if (!headers.Authorization) {
      const authHeaders = await getAuthHeaders();
      Object.assign(headers, authHeaders);
    }

    return headers;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const headers = await this.buildHeaders(options.headers as Record<string, string> | undefined);

    try {
      const response = await makeAuthenticatedRequest(url, {
        ...options,
        headers,
      });

      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      const data = isJson ? await response.json() : await response.text();

      if (!response.ok) {
        return {
          success: false,
          error: typeof data === 'string' ? data : data?.error || response.statusText,
          status: response.status,
        };
      }

      return {
        success: true,
        data: data as T,
        status: response.status,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Request failed',
      };
    }
  }

  async get<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

/**
 * Convenience helpers mirroring legacy API
 */
export interface SelectOptions {
  table: string;
  columns?: string;
  filters?: Record<string, unknown>;
  orderBy?: { column: string; ascending?: boolean}[];
  limit?: number;
  offset?: number;
}

function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    if (value instanceof Date) {
      searchParams.append(key, value.toISOString());
      return;
    }

    if (Array.isArray(value)) {
      searchParams.append(key, JSON.stringify(value));
      return;
    }

    if (typeof value === 'object') {
      searchParams.append(key, JSON.stringify(value));
      return;
    }

    searchParams.append(key, String(value));
  });

  return searchParams.toString();
}

// Implementation
function normalizeSelectPayload<T>(payload: unknown): { data: T[]; metadata?: Record<string, any> } | null {
  if (Array.isArray(payload)) {
    return { data: payload as T[] };
  }

  if (payload && typeof payload === 'object') {
    const value = payload as Record<string, unknown>;

    if (Array.isArray(value.data)) {
      const { data, ...metadata } = value as { data: T[] } & Record<string, any>;
      return { data, metadata };
    }

    if (Array.isArray(value.records)) {
      const { records, ...metadata } = value as { records: T[] } & Record<string, any>;
      return { data: records, metadata };
    }
  }

  return null;
}

export async function selectData<T = any>(
  optionsOrTable: SelectOptions | string,
  columns?: string,
  filters?: Record<string, unknown>
): Promise<ApiResponse<T[]>> {
  const client = new ApiClient({ baseUrl: getApiBaseUrl() });
  
  // Handle both signatures
  let table: string;
  let queryFilters: Record<string, unknown> = {};
  let queryColumns: string | undefined;
  
  if (typeof optionsOrTable === 'string') {
    // Old signature: selectData(table, columns, filters)
    table = optionsOrTable;
    queryColumns = columns;
    queryFilters = filters || {};
  } else {
    // New signature: selectData({ table, columns, filters })
    table = optionsOrTable.table;
    queryColumns = optionsOrTable.columns;
    queryFilters = optionsOrTable.filters || {};
  }

  const params: Record<string, unknown> = {
    ...queryFilters,
  };

  // Add query parameters for columns, limit, offset
  if (queryColumns) {
    params.columns = queryColumns;
  }
  if (typeof optionsOrTable === 'object' && optionsOrTable.limit) {
    params.limit = optionsOrTable.limit;
  }
  if (typeof optionsOrTable === 'object' && optionsOrTable.offset) {
    params.offset = optionsOrTable.offset;
  }

  const queryString = buildQueryString(params);
  const endpoint = queryString ? `/api/db/${table}?${queryString}` : `/api/db/${table}`;

  const result = await client.get<T[] | Record<string, unknown>>(endpoint);

  if (!result.success) {
    return result as ApiResponse<T[]>;
  }

  const normalized = normalizeSelectPayload<T>(result.data);

  if (normalized) {
    const response: ApiResponse<T[]> = {
      success: true,
      data: normalized.data,
    };

    if (normalized.metadata) {
      (response as any).metadata = normalized.metadata;
    }

    return response;
  }

  return {
    success: true,
    data: []
  };
}

export async function selectOne<T = any>(
  table: string,
  filters: Record<string, unknown>
): Promise<ApiResponse<T>> {
  const client = new ApiClient({ baseUrl: getApiBaseUrl() });
  // For selectOne, we'll use the same endpoint but expect a single result
  const queryString = buildQueryString(filters);
  const endpoint = queryString ? `/api/db/${table}?${queryString}` : `/api/db/${table}`;
  const result = await client.get<T[]>(endpoint);
  
  // Debug logging
  console.log('selectOne debug:', { table, filters, endpoint, result });
  console.log('selectOne result.data type:', typeof result.data, 'isArray:', Array.isArray(result.data), 'value:', result.data);
  
  if (result.success && result.data) {
    // Handle nested response structure: { success: true, data: { success: true, data: [...], count: 1 } }
    if (result.data && typeof result.data === 'object' && 'data' in result.data && Array.isArray(result.data.data)) {
      if (result.data.data.length > 0) {
        console.log('selectOne returning nested array item:', result.data.data[0]);
        return {
          success: true,
          data: result.data.data[0],
          error: null
        };
      }
    }
    // Handle direct array response
    else if (Array.isArray(result.data) && result.data.length > 0) {
      console.log('selectOne returning array item:', result.data[0]);
      return {
        success: true,
        data: result.data[0],
        error: null
      };
    }
    // Handle case where API returns single object directly
    else if (!Array.isArray(result.data) && result.data && typeof result.data === 'object') {
      console.log('selectOne returning single object:', result.data);
      return {
        success: true,
        data: result.data,
        error: null
      };
    }
  }
  
  // If we get here, either result.success is false or result.data is null/undefined
  console.log('selectOne no data found:', { success: result.success, hasData: !!result.data, error: result.error });
  return {
    success: false,
    data: null,
    error: result.error || 'No record found'
  };
}

export async function insertOne<T = any>(
  table: string,
  data: Record<string, unknown>
): Promise<ApiResponse<T>> {
  const client = new ApiClient({ baseUrl: getApiBaseUrl() });
  return client.post<T>('/api/db/insert', { table, data });
}

export async function updateOne<T = any>(
  table: string,
  id: string,
  data: Record<string, unknown>,
  idColumn: string = 'id'
): Promise<ApiResponse<T>> {
  const client = new ApiClient({ baseUrl: getApiBaseUrl() });
  const encodedId = encodeURIComponent(id);
  const query = idColumn ? `?idColumn=${encodeURIComponent(idColumn)}` : '';
  return client.put<T>(`/api/db/${table}/${encodedId}${query}`, data);
}

export async function upsertOne<T = any>(
  table: string,
  data: Record<string, unknown>,
  onConflict: string = 'id'
): Promise<ApiResponse<T>> {
  const client = new ApiClient({ baseUrl: getApiBaseUrl() });
  return client.post<T>('/api/db/upsert', { table, data, onConflict });
}

export async function deleteOne<T = any>(
  table: string,
  filters: Record<string, unknown>
): Promise<ApiResponse<T>> {
  const client = new ApiClient({ baseUrl: getApiBaseUrl() });
  return client.post<T>('/api/db/delete', { table, filters });
}

export interface SelectWithOptionsParams {
  filter?: Record<string, string | number | boolean>;
  orderBy?: { column: string; ascending: boolean };
  limit?: number;
}

export async function selectWithOptions<T = any>(
  table: string,
  options: SelectWithOptionsParams = {}
): Promise<ApiResponse<T[]>> {
  const client = new ApiClient({ baseUrl: getApiBaseUrl() });
  return client.post<T[]>(`/api/db/${table}/query`, options);
}

export async function callRPC<T = any>(
  functionName: string,
  params: Record<string, unknown>
): Promise<RPCResult<T>> {
  const client = new ApiClient({ baseUrl: getApiBaseUrl() });
  const response = await client.post<T>(`/api/rpc/${functionName}`, params);

  if (!response.success) {
    return { success: false, error: response.error };
  }

  // Handle nested RPC response structure
  let actualData = response.data;
  if (response.data && typeof response.data === 'object' && 'data' in (response.data as any)) {
    actualData = (response.data as any).data;
  }

  return { success: true, data: actualData as T };
}

export async function callEdgeFunction<T = any>(
  functionName: string,
  payload: Record<string, unknown> = {},
  options: { signal?: AbortSignal } = {}
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const headers = await getAuthHeaders();

  const requestInit: RequestInit = {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
    signal: options.signal
  };

  const response = await makeAuthenticatedRequest(`${baseUrl}/api/edge/${functionName}`, requestInit);

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    if (typeof data === 'string') {
      return {
        success: false,
        error: data || response.statusText,
      } as T;
    }
    return data as T;
  }

  return data as T;
}
