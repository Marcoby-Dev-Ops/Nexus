/**
 * Base Service Class
 * 
 * Provides common functionality for all services including:
 * - Standardized error handling with retry logic
 * - Database operation wrappers with exponential backoff
 * - Transaction-like utilities for multi-step operations
 * - Logging and debugging utilities
 * - Parameter validation
 * 
 * @template T - The type of data this service handles
 */

import { logger } from '@/shared/utils/logger';

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
export interface DatabaseOperationResult<T> {
  /** The actual data payload */
  data: T | null;
  /** Error message if operation failed */
  error: string | null;
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  /** Whether the validation passed */
  isValid: boolean;
  /** Error message if validation failed */
  error?: string;
}

/**
 * Retry configuration interface
 */
interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
}

// ============================================================================
// BASE SERVICE CLASS
// ============================================================================

/**
 * Abstract base class for all services
 * 
 * Provides common functionality that all services inherit:
 * - Error handling and logging with retry support
 * - Database operation wrappers with exponential backoff
 * - Transaction-like utilities for multi-step operations
 * - Parameter validation
 * - Response standardization
 */
export abstract class BaseService {
  // ========================================================================
  // STATIC CONFIGURATION
  // ========================================================================
  
  /**
   * Default retry configuration for all services
   * Centralized to ensure consistent retry behavior across the application
   */
  protected static readonly RETRY_CONFIG: RetryConfig = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
  };

  // ========================================================================
  // PROTECTED PROPERTIES
  // ========================================================================
  
  /** Logger instance for service operations */
  protected readonly logger = logger;

  /** Database instance for service operations */
  private _database: any = null;



  /** Get database instance (lazy loaded) */
  protected async getDatabase() {
    if (typeof window !== 'undefined') {
      return null;
    }
    if (!this._database) {
      try {
        const { getDatabase } = await import('@/lib/database.dynamic');
        this._database = await getDatabase();
      } catch (error) {
        this.logger.error('Failed to load database', error);
        return null;
      }
    }
    return this._database;
  }



  /** Get database instance (synchronous, returns null in browser) */
  protected get database() {
    if (typeof window !== 'undefined') {
      return null;
    }
    return this._database;
  }



  // ========================================================================
  // CORE METHODS
  // ========================================================================

  /**
   * Execute a database operation with error handling and retry logic
   * 
   * @param operation - The database operation to execute
   * @param operationName - Name of the operation for logging
   * @param retryConfig - Optional retry configuration
   * @returns Promise<ServiceResponse<T>>
   */
  protected async executeDbOperation<T>(
    operation: () => Promise<ServiceResponse<T>>,
    operationName: string,
    retryConfig?: Partial<RetryConfig>
  ): Promise<ServiceResponse<T>> {
    const config = { ...BaseService.RETRY_CONFIG, ...retryConfig };
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        this.logMethodCall(operationName, { attempt });

        const result = await operation();

        if (result.error) {
          throw new Error(result.error);
        }

        this.logSuccess(operationName, `Operation completed successfully on attempt ${attempt}`);
        return result;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        this.logFailure(operationName, lastError.message, { attempt, maxAttempts: config.maxAttempts });

        // Don't retry on the last attempt
        if (attempt === config.maxAttempts) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          config.baseDelay * Math.pow(2, attempt - 1),
          config.maxDelay
        );

        this.logInfo(operationName, `Retrying in ${delay}ms...`, { attempt, delay });
        await this.sleep(delay);
      }
    }

    // All attempts failed
    this.logError(operationName, `Operation failed after ${config.maxAttempts} attempts`, { 
      lastError: lastError?.message 
    });

    return {
      data: null,
      error: lastError?.message || 'Operation failed after multiple attempts',
      success: false
    };
  }

  /**
   * Execute multiple database operations in a transaction-like manner
   * 
   * @param operations - Array of operations to execute
   * @param transactionName - Name of the transaction for logging
   * @returns Promise<ServiceResponse<T[]>>
   */
  protected async executeTransaction<T>(
    operations: (() => Promise<ServiceResponse<T>>)[],
    transactionName: string
  ): Promise<ServiceResponse<T[]>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall(transactionName, { operationCount: operations.length });

      const results: T[] = [];
      const errors: string[] = [];

      for (let i = 0; i < operations.length; i++) {
        try {
          const result = await operations[i]();
          
          if (result.error) {
            errors.push(`Operation ${i + 1} failed: ${result.error}`);
          } else if (result.data !== null) {
            results.push(result.data);
          }
        } catch (error) {
          errors.push(`Operation ${i + 1} failed: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      if (errors.length > 0) {
        this.logFailure(transactionName, `Transaction failed: ${errors.join('; ')}`);
        return {
          data: null,
          error: `Transaction failed: ${errors.join('; ')}`,
          success: false
        };
      }

      this.logSuccess(transactionName, `Transaction completed successfully with ${results.length} operations`);
      return {
        data: results,
        error: null,
        success: true
      };
    }, transactionName);
  }

  // ========================================================================
  // VALIDATION METHODS
  // ========================================================================

  /**
   * Validate required parameters
   * 
   * @param params - Object containing parameters to validate
   * @param requiredFields - Array of required field names
   * @returns ValidationResult
   */
  protected validateRequiredParams(
    params: Record<string, any>,
    requiredFields: string[]
  ): ValidationResult {
    for (const field of requiredFields) {
      if (params[field] === undefined || params[field] === null || params[field] === '') {
        return {
          isValid: false,
          error: `Missing required parameter: ${field}`
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Validate string parameters
   * 
   * @param params - Object containing parameters to validate
   * @param stringFields - Array of field names that should be strings
   * @returns ValidationResult
   */
  protected validateStringParams(
    params: Record<string, any>,
    stringFields: string[]
  ): ValidationResult {
    for (const field of stringFields) {
      if (params[field] !== undefined && typeof params[field] !== 'string') {
        return {
          isValid: false,
          error: `Parameter ${field} must be a string`
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Validate numeric parameters
   * 
   * @param params - Object containing parameters to validate
   * @param numericFields - Array of field names that should be numbers
   * @returns ValidationResult
   */
  protected validateNumericParams(
    params: Record<string, any>,
    numericFields: string[]
  ): ValidationResult {
    for (const field of numericFields) {
      if (params[field] !== undefined && (typeof params[field] !== 'number' || isNaN(params[field]))) {
        return {
          isValid: false,
          error: `Parameter ${field} must be a valid number`
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Validate ID parameter
   * 
   * @param id - The ID value to validate
   * @param paramName - Name of the parameter for error messages
   * @returns string | null - Error message if validation fails, null if valid
   */
  protected validateIdParam(id: any, paramName: string = 'id'): string | null {
    if (id === undefined || id === null || id === '') {
      return `Missing required parameter: ${paramName}`;
    }

    if (typeof id !== 'string' && typeof id !== 'number') {
      return `Parameter ${paramName} must be a string or number`;
    }

    if (typeof id === 'string' && id.trim() === '') {
      return `Parameter ${paramName} cannot be empty`;
    }

    if (typeof id === 'number' && (isNaN(id) || id <= 0)) {
      return `Parameter ${paramName} must be a positive number`;
    }

    return null;
  }

  // ========================================================================
  // UTILITY METHODS
  // ========================================================================

  /**
   * Sleep for a specified number of milliseconds
   * 
   * @param ms - Milliseconds to sleep
   * @returns Promise<void>
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate a unique ID
   * 
   * @returns string
   */
  protected generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Deep clone an object
   * 
   * @param obj - Object to clone
   * @returns T
   */
  protected deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * Check if a value is empty (null, undefined, empty string, empty array, empty object)
   * 
   * @param value - Value to check
   * @returns boolean
   */
  protected isEmpty(value: any): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  }

  // ========================================================================
  // LOGGING METHODS
  // ========================================================================

  /**
   * Log method call
   * 
   * @param methodName - Name of the method being called
   * @param params - Parameters passed to the method
   */
  protected logMethodCall(methodName: string, params?: Record<string, any>): void {
    // Only log method calls in development and when debug logging is enabled
    if (import.meta.env.MODE === 'development' && import.meta.env.VITE_ENABLE_DEBUG_LOGS === 'true') {
      this.logger.info(`[${this.constructor.name}] ${methodName} called`, params);
    }
  }

  /**
   * Log successful operation
   * 
   * @param operationName - Name of the operation
   * @param message - Success message
   * @param data - Additional data to log
   */
  protected logSuccess(operationName: string, message: string, data?: Record<string, any>): void {
    this.logger.info(`[${this.constructor.name}] ${operationName} success: ${message}`, data);
  }

  /**
   * Log failed operation
   * 
   * @param operationName - Name of the operation
   * @param error - Error message
   * @param data - Additional data to log
   */
  protected logFailure(operationName: string, error: string, data?: Record<string, any>): void {
    this.logger.error(`[${this.constructor.name}] ${operationName} failed: ${error}`, data);
  }

  /**
   * Log informational message
   * 
   * @param operationName - Name of the operation
   * @param message - Informational message
   * @param data - Additional data to log
   */
  protected logInfo(operationName: string, message: string, data?: Record<string, any>): void {
    this.logger.info(`[${this.constructor.name}] ${operationName}: ${message}`, data);
  }

  /**
   * Log error message
   * 
   * @param operationName - Name of the operation
   * @param message - Error message
   * @param data - Additional data to log
   */
  protected logError(operationName: string, message: string, data?: Record<string, any>): void {
    this.logger.error(`[${this.constructor.name}] ${operationName} error: ${message}`, data);
  }

  /**
   * Log debug message
   * 
   * @param operationName - Name of the operation
   * @param message - Debug message
   * @param data - Additional data to log
   */
  protected logDebug(operationName: string, message: string, data?: Record<string, any>): void {
    this.logger.debug(`[${this.constructor.name}] ${operationName} debug: ${message}`, data);
  }

  // ========================================================================
  // RESPONSE CREATION METHODS
  // ========================================================================

  /**
   * Create a successful response
   * 
   * @param data - The data to return
   * @param metadata - Optional metadata
   * @returns ServiceResponse<T>
   */
  protected createSuccessResponse<T>(data: T, metadata?: Record<string, any>): ServiceResponse<T> {
    return {
      data,
      error: null,
      success: true,
      metadata
    };
  }

  /**
   * Create an error response
   * 
   * @param error - The error message
   * @param metadata - Optional metadata
   * @returns ServiceResponse<T>
   */
  protected createErrorResponse<T>(error: string, metadata?: Record<string, any>): ServiceResponse<T> {
    return {
      data: null,
      error,
      success: false,
      metadata
    };
  }

  /**
   * Create a response (alias for createSuccessResponse for backward compatibility)
   * 
   * @param data - The data to return
   * @param metadata - Optional metadata
   * @returns ServiceResponse<T>
   */
  protected createResponse<T>(data: T, metadata?: Record<string, any>): ServiceResponse<T> {
    return this.createSuccessResponse(data, metadata);
  }

  /**
   * Handle errors and create appropriate error response
   * 
   * @param error - The error that occurred
   * @param defaultMessage - Default error message if error is not an Error instance
   * @param metadata - Optional metadata
   * @returns ServiceResponse<T>
   */
  protected handleError<T>(error: unknown, defaultMessage: string, metadata?: Record<string, any>): ServiceResponse<T> {
    const errorMessage = error instanceof Error ? error.message : String(error);
    this.logError('handleError', `${defaultMessage}: ${errorMessage}`, metadata);
    
    return this.createErrorResponse<T>(errorMessage, metadata);
  }
} 
