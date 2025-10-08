/**
 * Database Query Wrapper
 * 
 * This wrapper provides a consistent interface for database operations
 * with proper authentication, error handling, and logging.
 * Updated to use SupabaseService for all database operations.
 */

import { 
  callEdgeFunction, 
  callRPC, 
  selectData, 
  selectWithOptions, 
  insertOne, 
  updateOne, 
  deleteOne 
} from '@/lib/api-client';
import { logger } from '@/shared/utils/logger';

export interface QueryContext {
  context: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface UserQueryContext extends QueryContext {
  userId: string;
  operation: string;
}

export class DatabaseQueryWrapper {

  /**
   * Execute a query with user authentication and enhanced logging
   */
  async userQuery<T>(
    queryFn: () => Promise<{ data: T | null; error: any }>,
    userId: string,
    operation: string,
    metadata?: Record<string, any>
  ): Promise<{ data: T | null; error: any }> {
    try {
      logger.info(`Executing user query: ${operation}`, { userId, operation, metadata });
      
      const result = await queryFn();
      
      if (result.error) {
        logger.error(`User query failed: ${operation}`, { userId, operation, error: result.error });
        
        // Log to edge function for analytics
        await this.logQueryToEdgeFunction('user_query_failed', {
          userId,
          operation,
          error: result.error,
          metadata
        });
      } else {
        logger.info(`User query successful: ${operation}`, { userId, operation });
        
        // Log to edge function for analytics
        await this.logQueryToEdgeFunction('user_query_success', {
          userId,
          operation,
          metadata
        });
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`User query error: ${operation}`, { userId, operation, error: errorMessage });
      
      // Log to edge function for analytics
      await this.logQueryToEdgeFunction('user_query_error', {
        userId,
        operation,
        error: errorMessage,
        metadata
      });
      
      return { data: null, error: typeof errorMessage === 'string' ? errorMessage : 'Unknown error' };
    }
  }

  /**
   * Execute a query with general context and enhanced logging
   */
  async query<T>(
    queryFn: () => Promise<{ data: T | null; error: any }>,
    context: QueryContext
  ): Promise<{ data: T | null; error: any }> {
    try {
      logger.info(`Executing query: ${context.context}`, context);
      
      const result = await queryFn();
      
      if (result.error) {
        logger.error(`Query failed: ${context.context}`, { ...context, error: result.error });
        
        // Log to edge function for analytics
        await this.logQueryToEdgeFunction('query_failed', {
          context: context.context,
          error: result.error,
          metadata: context.metadata
        });
      } else {
        logger.info(`Query successful: ${context.context}`, context);
        
        // Log to edge function for analytics
        await this.logQueryToEdgeFunction('query_success', {
          context: context.context,
          metadata: context.metadata
        });
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Query error: ${context.context}`, { ...context, error: errorMessage });
      
      // Log to edge function for analytics
      await this.logQueryToEdgeFunction('query_error', {
        context: context.context,
        error: errorMessage,
        metadata: context.metadata
      });
      
      return { data: null, error: typeof errorMessage === 'string' ? errorMessage : 'Unknown error' };
    }
  }

  /**
   * Log query analytics to edge function
   */
  private async logQueryToEdgeFunction(type: string, data: any): Promise<void> {
    try {
      await callEdgeFunction('log_query_analytics', {
        type,
        data,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'production'
      });
    } catch (error) {
      // Silent fail for analytics logging
      logger.warn('Failed to log query analytics', { type, error });
    }
  }

  /**
   * Get user integrations with proper authentication using UnifiedDatabaseService
   */
  async getUserIntegrations(userId: string): Promise<{ data: any[] | null; error: any }> {
    return this.userQuery(
      async () => {
        const result = await selectData('user_integrations', '*', { user_id: userId });
        
        return {
          data: result.data,
          error: result.error
        };
      },
      userId,
      'get-user-integrations'
    );
  }

  /**
   * Get integration by platform for a user using UnifiedDatabaseService
   */
  async getUserIntegrationByPlatform(userId: string, platform: string): Promise<{ data: any | null; error: any }> {
    return this.userQuery(
      async () => {
        const result = await selectWithOptions('user_integrations', {
          filter: { user_id: userId, platform },
          limit: 1
        });
        
        return {
          data: result.data && result.data.length > 0 ? result.data[0] : null,
          error: result.error
        };
      },
      userId,
      'get-user-integration-by-platform'
    );
  }

  /**
   * Create or update user integration using SupabaseService
   */
  async upsertUserIntegration(userId: string, platform: string, data: any): Promise<{ data: any | null; error: any }> {
    return this.userQuery(
      async () => {
        // First try to find existing integration
        const existingResult = await selectWithOptions('user_integrations', {
          filter: { user_id: userId, platform },
          limit: 1
        });

        if (existingResult.data && existingResult.data.length > 0) {
          // Update existing
          const updateResult = await updateOne('user_integrations', existingResult.data[0].id, {
            ...data,
            updated_at: new Date().toISOString()
          });
          
          return {
            data: updateResult.data,
            error: updateResult.error
          };
        } else {
          // Create new
          const insertResult = await insertOne('user_integrations', {
            user_id: userId,
            platform,
            ...data,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
          return {
            data: insertResult.data,
            error: insertResult.error
          };
        }
      },
      userId,
      'upsert-user-integration'
    );
  }

  /**
   * Update user integration using SupabaseService
   */
  async updateUserIntegration(userId: string, platform: string, data: any): Promise<{ data: any | null; error: any }> {
    return this.userQuery(
      async () => {
        // First find the integration to get its ID
        const findResult = await selectWithOptions('user_integrations', {
          filter: { user_id: userId, platform },
          limit: 1
        });

        if (!findResult.data || findResult.data.length === 0) {
          return {
            data: null,
            error: 'Integration not found'
          };
        }

        const updateResult = await updateOne('user_integrations', findResult.data[0].id, {
          ...data,
          updated_at: new Date().toISOString()
        });
        
        return {
          data: updateResult.data,
          error: updateResult.error
        };
      },
      userId,
      'update-user-integration'
    );
  }

  /**
   * Delete user integration using SupabaseService
   */
  async deleteUserIntegration(userId: string, platform: string): Promise<{ data: any | null; error: any }> {
    return this.userQuery(
      async () => {
        // First find the integration to get its ID
        const findResult = await selectWithOptions('user_integrations', {
          filter: { user_id: userId, platform },
          limit: 1
        });

        if (!findResult.data || findResult.data.length === 0) {
          return {
            data: null,
            error: 'Integration not found'
          };
        }

        const deleteResult = await deleteOne('user_integrations', findResult.data[0].id);
        
        return {
          data: deleteResult.data ? { deleted: true } : null,
          error: deleteResult.error
        };
      },
      userId,
      'delete-user-integration'
    );
  }

  /**
   * Get available platforms using SupabaseService
   */
  async getAvailablePlatforms(): Promise<{ data: any[] | null; error: any }> {
    return this.query(
      async () => {
                 const result = await selectWithOptions('integration_platforms', {
          filter: { is_active: true },
          orderBy: { column: 'display_name', ascending: true }
        });
        
        return {
          data: result.data,
          error: result.error
        };
      },
      { context: 'get-available-platforms' }
    );
  }

  /**
   * Execute a stored procedure with enhanced error handling
   */
  async executeRPC<T>(
    functionName: string,
    params: Record<string, any>,
    context: QueryContext
  ): Promise<{ data: T | null; error: any }> {
    return this.query(
      async () => {
        try {
                     const result = await callRPC(functionName, params);
          
          return {
            data: result.data,
            error: result.error
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          return {
            data: null,
            error: typeof errorMessage === 'string' ? errorMessage : 'Unknown error'
          };
        }
      },
      context
    );
  }

  /**
   * Execute a raw SQL query with enhanced security and error handling
   */
  async executeRawSQL<T>(
    sql: string,
    params: any[],
    context: QueryContext
  ): Promise<{ data: T | null; error: any }> {
    return this.query(
      async () => {
        try {
                     const result = await callEdgeFunction('execute_sql', {
            sql,
            params,
            context: context.context
          });
          
          return {
            data: result.success ? result.data : null,
            error: result.success ? null : result.error
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          return {
            data: null,
            error: typeof errorMessage === 'string' ? errorMessage : 'Unknown error'
          };
        }
      },
      context
    );
  }

  /**
   * Get query performance metrics
   */
  async getQueryMetrics(userId?: string): Promise<{ data: any | null; error: any }> {
    return this.query(
      async () => {
        try {
                     const result = await callEdgeFunction('get_query_metrics', {
            userId,
            timestamp: new Date().toISOString()
          });
          
          return {
            data: result.success ? result.data : null,
            error: result.success ? null : result.error
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          return {
            data: null,
            error: typeof errorMessage === 'string' ? errorMessage : 'Unknown error'
          };
        }
      },
      { context: 'get-query-metrics', userId }
    );
  }
} 
