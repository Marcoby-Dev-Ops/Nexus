// Database service that uses API endpoints instead of direct database calls
// This follows the client-server architecture pattern

// Base API URL
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Helper function to make API calls
async function apiCall<T = any>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<{ data: T | null; error: any }> {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { data: null, error: errorData };
    }

    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    console.error('API call failed:', error);
    return { data: null, error };
  }
}

// Database service to replace Supabase functionality
export const database = {
  // Basic CRUD operations
  from: (table: string) => ({
    select: (columns?: string) => ({
      eq: (column: string, value: any) => 
        apiCall(`/${table}?${column}=${encodeURIComponent(value)}`),
      neq: (column: string, value: any) => 
        apiCall(`/${table}?${column}!=${encodeURIComponent(value)}`),
      gt: (column: string, value: any) => 
        apiCall(`/${table}?${column}>${encodeURIComponent(value)}`),
      lt: (column: string, value: any) => 
        apiCall(`/${table}?${column}<${encodeURIComponent(value)}`),
      gte: (column: string, value: any) => 
        apiCall(`/${table}?${column}>=${encodeURIComponent(value)}`),
      lte: (column: string, value: any) => 
        apiCall(`/${table}?${column}<=${encodeURIComponent(value)}`),
      like: (column: string, value: string) => 
        apiCall(`/${table}?${column}=like:${encodeURIComponent(value)}`),
      ilike: (column: string, value: string) => 
        apiCall(`/${table}?${column}=ilike:${encodeURIComponent(value)}`),
      in: (column: string, values: any[]) => 
        apiCall(`/${table}?${column}=in:${encodeURIComponent(JSON.stringify(values))}`),
      order: (column: string, options?: { ascending?: boolean }) => 
        apiCall(`/${table}?order=${column}:${options?.ascending ? 'asc' : 'desc'}`),
      limit: (count: number) => 
        apiCall(`/${table}?limit=${count}`),
      range: (from: number, to: number) => 
        apiCall(`/${table}?range=${from}-${to}`),
      single: () => 
        apiCall(`/${table}?limit=1`).then(result => ({
          data: result.data?.[0] || null,
          error: result.error
        })),
      maybeSingle: () => 
        apiCall(`/${table}?limit=1`).then(result => ({
          data: result.data?.[0] || null,
          error: result.error
        })),
      then: (callback: (result: any) => void) => 
        apiCall(`/${table}`).then(callback),
    }),
    insert: (data: any) => 
      apiCall(`/${table}`, { method: 'POST', body: JSON.stringify(data) }),
    update: (data: any) => ({
      eq: (column: string, value: any) => 
        apiCall(`/${table}?${column}=${encodeURIComponent(value)}`, { 
          method: 'PUT', 
          body: JSON.stringify(data) 
        }),
      neq: (column: string, value: any) => 
        apiCall(`/${table}?${column}!=${encodeURIComponent(value)}`, { 
          method: 'PUT', 
          body: JSON.stringify(data) 
        }),
      then: (callback: (result: any) => void) => 
        apiCall(`/${table}`, { method: 'PUT', body: JSON.stringify(data) }).then(callback),
    }),
    upsert: (data: any) => 
      apiCall(`/${table}/upsert`, { method: 'POST', body: JSON.stringify(data) }),
    delete: () => ({
      eq: (column: string, value: any) => 
        apiCall(`/${table}?${column}=${encodeURIComponent(value)}`, { method: 'DELETE' }),
      neq: (column: string, value: any) => 
        apiCall(`/${table}?${column}!=${encodeURIComponent(value)}`, { method: 'DELETE' }),
      then: (callback: (result: any) => void) => 
        apiCall(`/${table}`, { method: 'DELETE' }).then(callback),
    }),
  }),
  
  // Auth operations (mocked for now - should use your auth service)
  auth: {
    getSession: () => apiCall('/auth/session'),
    getUser: () => apiCall('/auth/user'),
    signOut: () => apiCall('/auth/signout', { method: 'POST' }),
    onAuthStateChange: (callback: (event: string, session: any) => void) => ({
      data: { subscription: { unsubscribe: () => {} } }
    }),
  },
  
  // RPC calls
  rpc: (functionName: string, params?: any) => {
    return apiCall(`/rpc/${functionName}`, { 
      method: 'POST', 
      body: JSON.stringify(params || {}) 
    });
  },
};

// Helper functions to replace Supabase patterns
export const select = (table: string, options?: any) => {
  let endpoint = `/${table}`;
  const params = new URLSearchParams();
  
  if (options?.columns) {
    params.append('select', options.columns);
  }
  
  if (options?.filters) {
    Object.entries(options.filters).forEach(([key, value]) => {
      params.append(key, String(value));
    });
  }
  
  if (options?.orderBy) {
    params.append('order', `${options.orderBy.column}:${options.orderBy.ascending ? 'asc' : 'desc'}`);
  }
  
  if (options?.limit) {
    params.append('limit', String(options.limit));
  }
  
  if (params.toString()) {
    endpoint += `?${params.toString()}`;
  }
  
  return apiCall(endpoint);
};

export const selectOne = (table: string, id?: string, options?: any) => {
  if (id) {
    return apiCall(`/${table}/${id}`);
  }
  return select(table, { ...options, limit: 1 }).then(result => ({
    data: result.data?.[0] || null,
    error: result.error
  }));
};

export const selectWithOptions = (table: string, options?: any) => {
  return select(table, options);
};

export const insertOne = (table: string, data: any) => {
  return apiCall(`/${table}`, { method: 'POST', body: JSON.stringify(data) });
};

export const updateOne = (table: string, id: string, data: any) => {
  return apiCall(`/${table}/${id}`, { method: 'PUT', body: JSON.stringify(data) });
};

export const deleteOne = (table: string, id: string) => {
  return apiCall(`/${table}/${id}`, { method: 'DELETE' });
};

export const callRPC = (functionName: string, params?: any) => {
  return database.rpc(functionName, params);
};

// Export supabase for backward compatibility (temporary)
export const supabase = database;

// Additional exports that might be needed
export const selectData = select;
export const insertData = insertOne;
export const updateData = updateOne;
export const deleteData = deleteOne;
