/**
 * Generic database error type to replace Supabase-specific error types
 */
export interface DatabaseError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
  status?: number;
}

/**
 * Generic API error response
 */
export interface ApiError {
  error: string;
  message?: string;
  status?: number;
  timestamp?: string;
}

/**
 * Generic success response
 */
export interface ApiSuccess<T = any> {
  success: true;
  data: T;
  timestamp?: string;
}

/**
 * Generic API response union type
 */
export type ApiResponse<T = any> = ApiSuccess<T> | ApiError;
