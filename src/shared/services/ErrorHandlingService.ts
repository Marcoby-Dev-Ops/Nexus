import { logger } from '@/shared/utils/logger';

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  timestamp: string;
  retryCount?: number;
}

export interface ErrorRecoveryStrategy {
  shouldRetry: boolean;
  maxRetries: number;
  retryDelay: number;
  exponentialBackoff: boolean;
  shouldLog: boolean;
  shouldNotify: boolean;
}

/**
 * Centralized error handling service
 * Provides consistent error handling across the application
 */
export class ErrorHandlingService {
  private static instance: ErrorHandlingService;
  private errorCounts = new Map<string, number>();
  private readonly ERROR_THRESHOLD = 5; // Max errors before considering it a persistent issue
  private readonly ERROR_RESET_INTERVAL = 5 * 60 * 1000; // 5 minutes

  static getInstance(): ErrorHandlingService {
    if (!ErrorHandlingService.instance) {
      ErrorHandlingService.instance = new ErrorHandlingService();
    }
    return ErrorHandlingService.instance;
  }

  /**
   * Handle API errors with appropriate recovery strategies
   */
  handleApiError(
    error: any, 
    context: ErrorContext, 
    strategy: Partial<ErrorRecoveryStrategy> = {}
  ): { shouldRetry: boolean; retryDelay: number; errorMessage: string } {
    const defaultStrategy: ErrorRecoveryStrategy = {
      shouldRetry: true,
      maxRetries: 3,
      retryDelay: 1000,
      exponentialBackoff: true,
      shouldLog: true,
      shouldNotify: false,
    };

    const finalStrategy = { ...defaultStrategy, ...strategy };
    const errorKey = `${context.component}-${context.action}`;
    const currentCount = this.errorCounts.get(errorKey) || 0;

    // Log the error if enabled
    if (finalStrategy.shouldLog) {
      this.logError(error, context);
    }

    // Check if we should retry
    const shouldRetry = finalStrategy.shouldRetry && 
                       currentCount < finalStrategy.maxRetries &&
                       this.isRetryableError(error);

    // Calculate retry delay
    const retryDelay = shouldRetry && finalStrategy.exponentialBackoff
      ? finalStrategy.retryDelay * Math.pow(2, currentCount)
      : finalStrategy.retryDelay;

    // Increment error count
    if (shouldRetry) {
      this.errorCounts.set(errorKey, currentCount + 1);
      
      // Reset count after interval
      setTimeout(() => {
        this.errorCounts.delete(errorKey);
      }, this.ERROR_RESET_INTERVAL);
    }

    // Determine error message
    const errorMessage = this.getErrorMessage(error, context);

    return {
      shouldRetry,
      retryDelay,
      errorMessage
    };
  }

  /**
   * Check if an error is retryable
   */
  private isRetryableError(error: any): boolean {
    // Network errors are retryable
    if (error?.message?.includes('Network') || error?.message?.includes('fetch')) {
      return true;
    }

    // 5xx server errors are retryable
    if (error?.status >= 500 && error?.status < 600) {
      return true;
    }

    // 429 (Too Many Requests) is retryable
    if (error?.status === 429) {
      return true;
    }

    // 408 (Request Timeout) is retryable
    if (error?.status === 408) {
      return true;
    }

    // Don't retry authentication errors
    if (error?.status === 401 || error?.status === 403) {
      return false;
    }

    // Don't retry client errors (4xx except 408, 429)
    if (error?.status >= 400 && error?.status < 500) {
      return false;
    }

    return false;
  }

  /**
   * Get user-friendly error message
   */
  private getErrorMessage(error: any, context: ErrorContext): string {
    // Authentication errors
    if (error?.status === 401) {
      return 'Authentication failed. Please log in again.';
    }

    if (error?.status === 403) {
      return 'Access denied. Please check your permissions.';
    }

    // Server errors
    if (error?.status >= 500) {
      return 'Server error. Please try again later.';
    }

    // Network errors
    if (error?.message?.includes('Network') || error?.message?.includes('fetch')) {
      return 'Network error. Please check your connection and try again.';
    }

    // Rate limiting
    if (error?.status === 429) {
      return 'Too many requests. Please wait a moment and try again.';
    }

    // Timeout
    if (error?.status === 408) {
      return 'Request timed out. Please try again.';
    }

    // User mapping errors
    if (error?.message?.includes('user mapping') || error?.message?.includes('mapping')) {
      return 'User session error. Please refresh the page.';
    }

    // Default error message
    return error?.message || 'An unexpected error occurred. Please try again.';
  }

  /**
   * Log error with context
   */
  private logError(error: any, context: ErrorContext): void {
    const errorInfo = {
      message: error?.message || 'Unknown error',
      status: error?.status,
      statusText: error?.statusText,
      component: context.component,
      action: context.action,
      userId: context.userId,
      timestamp: context.timestamp,
      retryCount: context.retryCount,
      stack: error?.stack,
    };

    if (error?.status >= 500) {
      logger.error('Server error occurred', errorInfo);
    } else if (error?.status >= 400) {
      logger.warn('Client error occurred', errorInfo);
    } else {
      logger.error('Unexpected error occurred', errorInfo);
    }
  }

  /**
   * Reset error counts for a specific component/action
   */
  resetErrorCount(component: string, action: string): void {
    const errorKey = `${component}-${action}`;
    this.errorCounts.delete(errorKey);
  }

  /**
   * Get current error count for a component/action
   */
  getErrorCount(component: string, action: string): number {
    const errorKey = `${component}-${action}`;
    return this.errorCounts.get(errorKey) || 0;
  }

  /**
   * Check if there are too many errors for a component/action
   */
  hasTooManyErrors(component: string, action: string): boolean {
    return this.getErrorCount(component, action) >= this.ERROR_THRESHOLD;
  }
}

// Export singleton instance
export const errorHandlingService = ErrorHandlingService.getInstance();
