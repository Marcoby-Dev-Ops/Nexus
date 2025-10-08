/**
 * Generic database client interface to replace Supabase-specific client types
 */
export interface DatabaseClient {
  // Auth methods
  auth: {
    getSession(): Promise<{ data: { session: any } | null; error: any }>;
    getUser(): Promise<{ data: { user: any } | null; error: any }>;
    signOut(): Promise<{ error: any }>;
    refreshSession(): Promise<{ data: { session: any } | null; error: any }>;
    setSession(sessionData: any): Promise<{ data: { session: any } | null; error: any }>;
    updateUser(updates: any): Promise<{ data: { user: any } | null; error: any }>;
  };
  
  // Database methods
  from(table: string): any;
  rpc(functionName: string, params?: any): Promise<{ data: any; error: any }>;
  
  // Storage methods
  storage: {
    from(bucket: string): any;
  };
  
  // Functions methods
  functions: {
    invoke(functionName: string, options?: any): Promise<{ data: any; error: any }>;
  };
  
  // Raw SQL
  sql(strings: TemplateStringsArray, ...values: any[]): any;
  raw(sql: string): any;
  
  // URL for edge functions
  supabaseUrl?: string;
}

/**
 * Generic database query result
 */
export interface QueryResult<T = any> {
  data: T | null;
  error: any;
  count?: number;
}

/**
 * Generic database insert result
 */
export interface InsertResult<T = any> {
  data: T | null;
  error: any;
}

/**
 * Generic database update result
 */
export interface UpdateResult<T = any> {
  data: T | null;
  error: any;
}

/**
 * Generic database delete result
 */
export interface DeleteResult {
  error: any;
}
