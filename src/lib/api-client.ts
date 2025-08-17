/**
 * Simple API client for browser operations
 * Replaces UnifiedDatabaseService browser functionality
 */

/**
 * Get authorization headers for API requests
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // Get token from localStorage
  const sessionData = localStorage.getItem('authentik_session');
  let token: string | null = null;
  
  if (sessionData) {
    try {
      const session = JSON.parse(sessionData);
      if (session?.accessToken) {
        token = session.accessToken;
      }
    } catch (error) {
      // Silent fail - will try alternative methods
    }
  }
  
  // Fallback to AuthentikAuthService
  if (!token) {
    try {
      const { authentikAuthService } = await import('@/core/auth/AuthentikAuthService');
      const tokenResult = await authentikAuthService.getAccessToken();
      if (tokenResult.success && tokenResult.data) {
        token = tokenResult.data;
      }
    } catch (error) {
      // Silent fail
    }
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
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
    return { data: result.data, error: result.error };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
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
