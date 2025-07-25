/**
 * Base Service Class
 * Provides common functionality for all services
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/shared/utils/logger.ts';

export interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
  metadata?: Record<string, any>;
}

export abstract class BaseService {
  protected logger = logger;
  protected supabase = supabase;

  /**
   * Create a standardized service response
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
      metadata
    };
  }

  /**
   * Handle errors consistently across services
   */
  protected handleError(error: unknown, context: string): ServiceResponse<never> {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    this.logger.error({ error, context }, `Service error in ${context}`);
    
    return this.createResponse<never>(
      null,
      errorMessage,
      { context, timestamp: new Date().toISOString() }
    );
  }

  /**
   * Validate required parameters
   */
  protected validateParams(params: Record<string, any>, required: string[]): string | null {
    for (const field of required) {
      if (params[field] === undefined || params[field] === null) {
        return `Missing required parameter: ${field}`;
      }
    }
    return null;
  }

  /**
   * Execute a database operation with error handling
   */
  protected async executeDbOperation<T>(
    operation: () => Promise<{ data: T | null; error: any }>,
    context: string
  ): Promise<ServiceResponse<T>> {
    try {
      const result = await operation();
      
      if (result.error) {
        this.logger.error({ error: result.error, context }, 'Database operation failed');
        return this.createResponse<T>(null, result.error.message || 'Database operation failed');
      }
      
      return this.createResponse<T>(result.data);
    } catch (error) {
      return this.handleError(error, context);
    }
  }

  /**
   * Log service method calls for debugging
   */
  protected logMethodCall(method: string, params: Record<string, any>): void {
    this.logger.debug({ method, params }, 'Service method called');
  }
} 