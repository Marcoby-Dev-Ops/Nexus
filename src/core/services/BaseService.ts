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

import { supabase } from '@/lib/supabase';
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
interface DatabaseOperationResult<T> {
  data: T | null;
  error: any;
}

/**
 * Parameter validation result
 */
type ValidationResult = string | null;

/**
 * Retry configuration for operations
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
        service: this.constructor.name,
        environment: process.env.NODE_ENV,
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
   * Creates an error response with enhanced metadata
   * 
   * @param error - Error message
   * @param metadata - Additional error metadata
   * @returns Error ServiceResponse
   */
  protected createErrorResponse<T>(
    error: string,
    metadata?: Record<string, any>
  ): ServiceResponse<T> {
    return this.createResponse<T>(null, error, {
      service: this.constructor.name,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      ...metadata
    });
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
      `Service error in ${context}: ${errorMessage}`,
      { error, context, timestamp: new Date().toISOString() }
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
   * const validation = this.validateParams(data, ['email', 'password']);
   * if (validation) {
   *   return this.createErrorResponse(validation);
   * }
   * ```
   */
  protected validateParams(
    params: Record<string, any>, 
    required: string[]
  ): ValidationResult {
    for (const field of required) {
      if (!params[field]) {
        return `Missing required field: ${field}`;
      }
    }
    return null;
  }

  /**
   * Validates a string parameter
   * 
   * @param value - The value to validate
   * @param fieldName - Name of the field for error messages
   * @returns Validation result
   */
  protected validateStringParam(
    value: string | undefined | null,
    fieldName: string
  ): ValidationResult {
    if (!value || typeof value !== 'string' || value.trim() === '') {
      return `${fieldName} is required and must be a non-empty string`;
    }
    return null;
  }

  /**
   * Validates an ID parameter
   * 
   * @param id - The ID to validate
   * @param fieldName - Name of the field for error messages
   * @returns Validation result
   */
  protected validateIdParam(
    id: string | undefined | null,
    fieldName: string = 'id'
  ): ValidationResult {
    if (!id || typeof id !== 'string' || id.trim() === '') {
      return `${fieldName} is required and must be a valid ID`;
    }
    return null;
  }

  /**
   * Validates that a required parameter is provided
   * 
   * @param value - The value to validate
   * @param fieldName - The name of the field for error messages
   * @returns ValidationResult - null if valid, error message if invalid
   */
  protected validateRequiredParam(
    value: any,
    fieldName: string
  ): ValidationResult {
    if (value === undefined || value === null) {
      return `${fieldName} is required`;
    }
    
    if (typeof value === 'string' && value.trim() === '') {
      return `${fieldName} is required and cannot be empty`;
    }
    
    return null;
  }

  // ========================================================================
  // DATABASE OPERATION WRAPPERS
  // ========================================================================

  /**
   * Executes a database operation with consistent error handling
   * 
   * @param operation - The database operation to execute
   * @param context - Context for error messages
   * @returns Standardized service response
   */
  protected async executeDbOperation<T>(
    operation: () => Promise<DatabaseOperationResult<T>>,
    context: string
  ): Promise<ServiceResponse<T>> {
    try {
      this.logMethodCall(context, {});
      
      const result = await operation();
      
      if (result.error) {
        this.logFailure(context, result.error);
        return this.createErrorResponse(
          `Database operation failed: ${this.extractErrorMessage(result.error)}`,
          { error: result.error, context }
        );
      }
      
      this.logSuccess(context);
      return this.createSuccessResponse(result.data as T);
    } catch (error) {
      return this.handleError(error, context);
    }
  }

  /**
   * Executes a database operation with retry logic and exponential backoff
   * 
   * @param operation - The database operation to execute
   * @param context - Context for error messages
   * @param config - Retry configuration (optional, uses defaults if not provided)
   * @returns Standardized service response
   * 
   * @example
   * ```typescript
   * return this.executeDbOperationWithRetry(
   *   () => supabase.from('users').select('*').eq('id', userId),
   *   'get-user-profile',
   *   { maxAttempts: 5, baseDelay: 500 }
   * );
   * ```
   */
  protected async executeDbOperationWithRetry<T>(
    operation: () => Promise<DatabaseOperationResult<T>>,
    context: string,
    config?: Partial<RetryConfig>
  ): Promise<ServiceResponse<T>> {
    const retryConfig = { ...BaseService.RETRY_CONFIG, ...config };
    
    for (let attempt = 0; attempt < retryConfig.maxAttempts; attempt++) {
      try {
        if (attempt > 0) {
          const delay = Math.min(
            retryConfig.baseDelay * Math.pow(2, attempt - 1), 
            retryConfig.maxDelay
          );
          this.logger.warn(
            `Retrying operation "${context}" in ${delay}ms (attempt ${attempt + 1}/${retryConfig.maxAttempts})`
          );
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        this.logMethodCall(context, { attempt: attempt + 1 });
        const result = await operation();
        
        if (!result.error) {
          this.logSuccess(context);
          return this.createSuccessResponse(result.data as T);
        }
        
        this.logFailure(context, result.error);
        
        // If last attempt, throw the error to be handled by catch block
        if (attempt === retryConfig.maxAttempts - 1) {
          throw result.error;
        }
      } catch (error) {
        if (attempt === retryConfig.maxAttempts - 1) {
          return this.handleError(error, context);
        }
      }
    }
    
    return this.createErrorResponse<T>('Unknown error in executeDbOperationWithRetry');
  }

  /**
   * Executes a series of database operations as a transaction-like workflow
   * 
   * Note: This is client-side only and does not provide rollback functionality.
   * All steps must be idempotent for safety.
   * 
   * @param steps - Array of database operations to execute in sequence
   * @param context - Context for error messages
   * @returns Standardized service response with the result of the last step
   * 
   * @example
   * ```typescript
   * return this.executeTransaction([
   *   () => this.createUser(userData),
   *   () => this.createUserProfile(profileData),
   *   () => this.assignUserToCompany(userId, companyId)
   * ], 'user-onboarding');
   * ```
   */
  protected async executeTransaction<T>(
    steps: (() => Promise<DatabaseOperationResult<T>>)[],
    context: string
  ): Promise<ServiceResponse<T>> {
    let lastResult: T | null = null;
    
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const stepContext = `${context}-step-${i + 1}`;
      
      const result = await this.executeDbOperation(step, stepContext);
      
      if (!result.success) {
        this.logger.error(
          `Transaction failed at step ${i + 1} in ${context}`,
          { step: i + 1, totalSteps: steps.length, error: result.error }
        );
        return result as ServiceResponse<T>;
      }
      
      lastResult = result.data;
    }
    
    this.logSuccess(context);
    return this.createSuccessResponse(lastResult as T);
  }

  // ========================================================================
  // UTILITY METHODS
  // ========================================================================

  /**
   * Calculates exponential backoff delay
   * 
   * @param attempt - Current attempt number (0-based)
   * @param baseDelay - Base delay in milliseconds
   * @param maxDelay - Maximum delay in milliseconds
   * @returns Delay in milliseconds
   */
  protected calculateBackoffDelay(
    attempt: number,
    baseDelay: number = BaseService.RETRY_CONFIG.baseDelay,
    maxDelay: number = BaseService.RETRY_CONFIG.maxDelay
  ): number {
    return Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
  }

  /**
   * Checks if an error is retryable
   * 
   * @param error - The error to check
   * @returns True if the error should trigger a retry
   */
  protected isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
      const retryableMessages = [
        'network',
        'timeout',
        'connection',
        'temporary',
        'rate limit',
        'too many requests',
        'service unavailable'
      ];
      
      return retryableMessages.some(msg => 
        error.message.toLowerCase().includes(msg)
      );
    }
    
    return false;
  }

  // ========================================================================
  // LOGGING METHODS
  // ========================================================================

  /**
   * Logs method calls for debugging
   * 
   * @param method - Method name being called
   * @param params - Parameters passed to the method
   */
  protected logMethodCall(
    method: string, 
    params: Record<string, any>
  ): void {
    this.logger.info(
      `Service method called: ${method}`,
      {
        method,
        params,
        service: this.constructor.name,
        timestamp: new Date().toISOString()
      }
    );
  }

  /**
   * Logs successful operations
   * 
   * @param operation - Operation that succeeded
   * @param metadata - Additional metadata
   */
  protected logSuccess(
    operation: string,
    metadata?: Record<string, any>
  ): void {
    this.logger.info(
      `Service operation successful: ${operation}`,
      {
        operation,
        service: this.constructor.name,
        timestamp: new Date().toISOString(),
        ...metadata
      }
    );
  }

  /**
   * Logs failed operations
   * 
   * @param operation - Operation that failed
   * @param error - The error that occurred
   * @param metadata - Additional metadata
   */
  protected logFailure(
    operation: string,
    error: unknown,
    metadata?: Record<string, any>
  ): void {
    this.logger.error(
      `Service operation failed: ${operation}`,
      {
        operation,
        error,
        service: this.constructor.name,
        timestamp: new Date().toISOString(),
        ...metadata
      }
    );
  }
} 