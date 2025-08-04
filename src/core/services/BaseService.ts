/**
 * Base Service Class
 * 
 * Provides common functionality for all services including:
 * - Standardized error handling
 * - Database operation wrappers
 * - Logging and debugging utilities
 * - Parameter validation
 * 
 * @template T - The type of data this service handles
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/shared/utils/logger.ts';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Standardized service response interface
 * 
 * @template T - The type of data being returned
 */
export interface ServiceResponse<T> {
  /** The actual data payload, null if operation failed */
  data: T | null;
  /** Error message if operation failed, null if successful */
  error: string | null;
  /** Whether the operation was successful */
  success: boolean;
  /** Additional metadata about the operation */
  metadata?: Record<string, any>;
}

/**
 * Database operation result interface
 * 
 * @template T - The type of data being returned
 */
interface DatabaseOperationResult<T> {
  data: T | null;
  error: any;
}

/**
 * Parameter validation result
 */
type ValidationResult = string | null;

// ============================================================================
// BASE SERVICE CLASS
// ============================================================================

/**
 * Abstract base class for all services
 * 
 * Provides common functionality that all services inherit:
 * - Error handling and logging
 * - Database operation wrappers
 * - Parameter validation
 * - Response standardization
 */
export abstract class BaseService {
  // ========================================================================
  // PROTECTED PROPERTIES
  // ========================================================================
  
  /** Logger instance for service operations */
  protected readonly logger = logger;
  
  /** Supabase client instance */
  protected readonly supabase = supabase;

  // ========================================================================
  // RESPONSE CREATION METHODS
  // ========================================================================

  /**
   * Creates a standardized service response
   * 
   * @param data - The data payload
   * @param error - Error message if operation failed
   * @param metadata - Additional metadata
   * @returns Standardized ServiceResponse
   * 
   * @example
   * ```typescript
   * return this.createResponse(userData, null, { timestamp: Date.now() });
   * ```
   */
  protected createResponse<T>(
    data: T | null,
    error: string | null = null,
    metadata?: Record<string, any>
  ): ServiceResponse<T> {
    return {
      data,
      error,
      success: error === null,
      metadata: {
        timestamp: new Date().toISOString(),
        ...metadata
      }
    };
  }

  /**
   * Creates a success response
   * 
   * @param data - The successful data payload
   * @param metadata - Additional metadata
   * @returns Success ServiceResponse
   */
  protected createSuccessResponse<T>(
    data: T,
    metadata?: Record<string, any>
  ): ServiceResponse<T> {
    return this.createResponse(data, null, metadata);
  }

  /**
   * Creates an error response
   * 
   * @param error - Error message
   * @param metadata - Additional error metadata
   * @returns Error ServiceResponse
   */
  protected createErrorResponse<T>(
    error: string,
    metadata?: Record<string, any>
  ): ServiceResponse<T> {
    return this.createResponse<T>(null, error, metadata);
  }

  // ========================================================================
  // ERROR HANDLING METHODS
  // ========================================================================

  /**
   * Handles errors consistently across services
   * 
   * @param error - The error that occurred
   * @param context - Context where the error occurred
   * @returns Standardized error response
   */
  protected handleError(error: unknown, context: string): ServiceResponse<never> {
    const errorMessage = this.extractErrorMessage(error);
    
    this.logger.error(
      { error, context, timestamp: new Date().toISOString() },
      `Service error in ${context}: ${errorMessage}`
    );
    
    return this.createErrorResponse<never>(
      errorMessage,
      { 
        context, 
        timestamp: new Date().toISOString(),
        errorType: this.getErrorType(error)
      }
    );
  }

  /**
   * Extracts error message from various error types
   * 
   * @param error - The error to extract message from
   * @returns Human-readable error message
   */
  private extractErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    
    if (typeof error === 'string') {
      return error;
    }
    
    if (error && typeof error === 'object' && 'message' in error) {
      return String(error.message);
    }
    
    return 'Unknown error occurred';
  }

  /**
   * Determines the type of error for logging
   * 
   * @param error - The error to classify
   * @returns Error type string
   */
  private getErrorType(error: unknown): string {
    if (error instanceof Error) {
      return error.constructor.name;
    }
    
    if (typeof error === 'string') {
      return 'StringError';
    }
    
    if (error && typeof error === 'object') {
      return 'ObjectError';
    }
    
    return 'UnknownError';
  }

  // ========================================================================
  // VALIDATION METHODS
  // ========================================================================

  /**
   * Validates required parameters
   * 
   * @param params - Object containing parameters to validate
   * @param required - Array of required parameter names
   * @returns Validation result (error message or null)
   * 
   * @example
   * ```typescript
   * const validationError = this.validateParams(
   *   { id, name, email },
   *   ['id', 'name']
   * );
   * if (validationError) return this.createErrorResponse(validationError);
   * ```
   */
  protected validateParams(
    params: Record<string, any>, 
    required: string[]
  ): ValidationResult {
    for (const field of required) {
      if (params[field] === undefined || params[field] === null) {
        return `Missing required parameter: ${field}`;
      }
    }
    return null;
  }

  /**
   * Validates that a string parameter is not empty
   * 
   * @param value - The string value to validate
   * @param fieldName - Name of the field for error messages
   * @returns Validation result
   */
  protected validateStringParam(
    value: string | undefined | null,
    fieldName: string
  ): ValidationResult {
    if (!value || value.trim() === '') {
      return `${fieldName} cannot be empty`;
    }
    return null;
  }

  /**
   * Validates that an ID parameter is valid
   * 
   * @param id - The ID to validate
   * @param fieldName - Name of the field for error messages
   * @returns Validation result
   */
  protected validateIdParam(
    id: string | undefined | null,
    fieldName: string = 'id'
  ): ValidationResult {
    if (!id || id.trim() === '') {
      return `${fieldName} is required`;
    }
    
    if (id.length < 1) {
      return `${fieldName} must be at least 1 character long`;
    }
    
    return null;
  }

  // ========================================================================
  // DATABASE OPERATION METHODS
  // ========================================================================

  /**
   * Executes a database operation with standardized error handling
   * 
   * @param operation - The database operation to execute
   * @param context - Context for logging and error messages
   * @returns Standardized service response
   * 
   * @example
   * ```typescript
   * return this.executeDbOperation(
   *   async () => {
   *     const { data, error } = await supabase
   *       .from('users')
   *       .select('*')
   *       .eq('id', userId)
   *       .single();
   *     return { data, error };
   *   },
   *   `get user ${userId}`
   * );
   * ```
   */
  protected async executeDbOperation<T>(
    operation: () => Promise<DatabaseOperationResult<T>>,
    context: string
  ): Promise<ServiceResponse<T>> {
    try {
      this.logMethodCall('executeDbOperation', { context });
      
      const result = await operation();
      
      if (result.error) {
        this.logger.error(
          { error: result.error, context },
          'Database operation failed'
        );
        
        return this.createErrorResponse<T>(
          result.error.message || 'Database operation failed',
          { context, operation: 'database' }
        );
      }
      
      return this.createSuccessResponse(result.data);
      
    } catch (error) {
      return this.handleError(error, context);
    }
  }

  // ========================================================================
  // LOGGING METHODS
  // ========================================================================

  /**
   * Logs service method calls for debugging
   * 
   * @param method - Name of the method being called
   * @param params - Parameters passed to the method
   */
  protected logMethodCall(
    method: string, 
    params: Record<string, any>
  ): void {
    this.logger.debug(
      { 
        method, 
        params,
        service: this.constructor.name,
        timestamp: new Date().toISOString()
      },
      'Service method called'
    );
  }

  /**
   * Logs successful operations
   * 
   * @param operation - Description of the operation
   * @param metadata - Additional metadata
   */
  protected logSuccess(
    operation: string,
    metadata?: Record<string, any>
  ): void {
    this.logger.info(
      {
        operation,
        service: this.constructor.name,
        timestamp: new Date().toISOString(),
        ...metadata
      },
      'Service operation completed successfully'
    );
  }

  /**
   * Logs failed operations
   * 
   * @param operation - Description of the operation
   * @param error - The error that occurred
   * @param metadata - Additional metadata
   */
  protected logFailure(
    operation: string,
    error: unknown,
    metadata?: Record<string, any>
  ): void {
    this.logger.error(
      {
        operation,
        error,
        service: this.constructor.name,
        timestamp: new Date().toISOString(),
        ...metadata
      },
      'Service operation failed'
    );
  }
} 