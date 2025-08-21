/**
 * Simple API client for browser operations
 * Replaces UnifiedDatabaseService browser functionality
 */

/**
 * Get authorization headers for API requests
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // Get token from localStorage
  const sessionData = localStorage.getItem('authentik_session');
  let token: string | null = null;
  
  console.log('🔍 [getAuthHeaders] Checking localStorage for session...');
  
  if (sessionData) {
    try {
      const session = JSON.parse(sessionData);
      console.log('🔍 [getAuthHeaders] Session data found:', {
        hasAccessToken: !!session?.accessToken,
        tokenLength: session?.accessToken?.length,
        sessionKeys: Object.keys(session || {})
      });
      
      if (session?.accessToken) {
        token = session.accessToken;
        console.log('🔍 [getAuthHeaders] Using token from localStorage');
      }
    } catch (error) {
      console.error('🔍 [getAuthHeaders] Error parsing session data:', error);
    }
  } else {
    console.log('🔍 [getAuthHeaders] No session data in localStorage');
  }
  
  // Fallback to AuthentikAuthService
  if (!token) {
    console.log('🔍 [getAuthHeaders] Trying AuthentikAuthService fallback...');
    try {
      const { authentikAuthService } = await import('@/core/auth/AuthentikAuthService');
      const tokenResult = await authentikAuthService.getAccessToken();
      console.log('🔍 [getAuthHeaders] AuthentikAuthService result:', {
        success: tokenResult.success,
        hasData: !!tokenResult.data,
        error: tokenResult.error
      });
      
      if (tokenResult.success && tokenResult.data) {
        token = tokenResult.data;
        console.log('🔍 [getAuthHeaders] Using token from AuthentikAuthService');
      }
    } catch (error) {
      console.error('🔍 [getAuthHeaders] Error getting token from AuthentikAuthService:', error);
    }
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log('🔍 [getAuthHeaders] Authorization header set, token length:', token.length);
  } else {
    console.warn('🔍 [getAuthHeaders] No token available, request will be unauthenticated');
  }
  
  return headers;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const headers = await getAuthHeaders();
    return !!headers['Authorization'];
  } catch {
    return false;
  }
}

export interface ApiResponse<T = any> {
  data: T | null;
  error: string | null;
}

export interface RPCResult<T = any> {
  data: T | null;
  error: any;
  success: boolean;
}

/**
 * Call RPC function via Express server API
 */
export async function callRPC<T>(
  functionName: string,
  params: Record<string, unknown> = {}
): Promise<RPCResult<T>> {
  try {
    const response = await fetch(`http://localhost:3001/api/rpc/${functionName}`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(params),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return { data: result.data, error: result.error, success: result.success };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error', success: false };
  }
}

/**
 * Call edge function via Express server API
 */
export async function callEdgeFunction<T>(
  functionName: string,
  payload?: Record<string, unknown>
): Promise<T> {
  try {
    const response = await fetch(`http://localhost:3001/api/edge/${functionName}`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return result.data;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Unknown error');
  }
}

/**
 * Call edge function via Express server API without authentication
 */
export async function callPublicEdgeFunction<T>(
  functionName: string,
  payload?: Record<string, unknown>
): Promise<T> {
  try {
    const response = await fetch(`http://localhost:3001/api/edge/${functionName}/public`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return result.data;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Unknown error');
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
    
    const response = await fetch(`http://localhost:3001/api/db/${table}?${params.toString()}`, {
      method: 'GET',
      headers: await getAuthHeaders(),
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

    const response = await fetch(`http://localhost:3001/api/db/${table}/${id}?idColumn=${idColumn}`, {
      method: 'GET',
      headers: await getAuthHeaders(),
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
 * Insert one record into table
 */
export async function insertOne<T>(
  table: string,
  data: any
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`http://localhost:3001/api/db/${table}`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(data),
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
 * Update one record in table
 */
export async function updateOne<T>(
  table: string,
  id: string,
  data: Record<string, unknown>,
  idColumn: string = 'id'
): Promise<ApiResponse<T>> {
  try {
    // Validate ID parameter
    if (!id || id === 'undefined' || id === 'null') {
      console.warn(`updateOne called with invalid ID: ${id} for table: ${table}`);
      return { data: null, error: 'Invalid ID parameter' };
    }

    const response = await fetch(`http://localhost:3001/api/db/${table}/${id}?idColumn=${idColumn}`, {
      method: 'PUT',
      headers: await getAuthHeaders(),
      body: JSON.stringify(data),
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
 * Delete one record from table
 */
export async function deleteOne(
  table: string,
  id: string,
  idColumn: string = 'id'
): Promise<ApiResponse<any>> {
  try {
    // Validate ID parameter
    if (!id || id === 'undefined' || id === 'null') {
      console.warn(`deleteOne called with invalid ID: ${id} for table: ${table}`);
      return { data: null, error: 'Invalid ID parameter' };
    }

    const response = await fetch(`http://localhost:3001/api/db/${table}/${id}?idColumn=${idColumn}`, {
      method: 'DELETE',
      headers: await getAuthHeaders(),
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
 * Upsert one record in table
 */
export async function upsertOne<T>(
  table: string,
  data: any,
  onConflict?: string
): Promise<ApiResponse<T>> {
  try {
    const payload = { data, onConflict };
    const response = await fetch(`http://localhost:3001/api/db/${table}/upsert`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(payload),
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
    const response = await fetch(`http://localhost:3001/api/db/${table}/query`, {
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
