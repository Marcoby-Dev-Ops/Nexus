/**
 * Database Query Wrapper
 * 
 * This wrapper provides a consistent interface for database operations
 * with proper authentication, error handling, and logging.
 */

import { supabase } from '@/lib/supabase';
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
   * Execute a query with user authentication
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
      } else {
        logger.info(`User query successful: ${operation}`, { userId, operation });
      }
      
      return result;
    } catch (error) {
      logger.error(`User query error: ${operation}`, { userId, operation, error });
      return { data: null, error };
    }
  }

  /**
   * Execute a query with general context
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
      } else {
        logger.info(`Query successful: ${context.context}`, context);
      }
      
      return result;
    } catch (error) {
      logger.error(`Query error: ${context.context}`, { ...context, error });
      return { data: null, error };
    }
  }

  /**
   * Get user integrations with proper authentication
   */
  async getUserIntegrations(userId: string): Promise<{ data: any[] | null; error: any }> {
    return this.userQuery(
      async () => supabase
        .from('user_integrations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      userId,
      'get-user-integrations'
    );
  }

  /**
   * Get integration by platform for a user
   */
  async getUserIntegrationByPlatform(userId: string, platform: string): Promise<{ data: any | null; error: any }> {
    return this.userQuery(
      async () => supabase
        .from('user_integrations')
        .select('*')
        .eq('user_id', userId)
        .eq('platform', platform)
        .single(),
      userId,
      'get-user-integration-by-platform'
    );
  }

  /**
   * Create or update user integration
   */
  async upsertUserIntegration(userId: string, platform: string, data: any): Promise<{ data: any | null; error: any }> {
    return this.userQuery(
      async () => supabase
        .from('user_integrations')
        .upsert({
          user_id: userId,
          platform,
          ...data,
          updated_at: new Date().toISOString()
        })
        .select()
        .single(),
      userId,
      'upsert-user-integration'
    );
  }

  /**
   * Update user integration
   */
  async updateUserIntegration(userId: string, platform: string, data: any): Promise<{ data: any | null; error: any }> {
    return this.userQuery(
      async () => supabase
        .from('user_integrations')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('platform', platform)
        .select()
        .single(),
      userId,
      'update-user-integration'
    );
  }

  /**
   * Delete user integration
   */
  async deleteUserIntegration(userId: string, platform: string): Promise<{ data: any | null; error: any }> {
    return this.userQuery(
      async () => supabase
        .from('user_integrations')
        .delete()
        .eq('user_id', userId)
        .eq('platform', platform),
      userId,
      'delete-user-integration'
    );
  }

  /**
   * Get available platforms
   */
  async getAvailablePlatforms(): Promise<{ data: any[] | null; error: any }> {
    return this.query(
      async () => supabase
        .from('integration_platforms')
        .select('*')
        .eq('is_active', true)
        .order('display_name'),
      { context: 'get-available-platforms' }
    );
  }

  /**
   * Execute a stored procedure
   */
  async executeRPC<T>(
    functionName: string,
    params: Record<string, any>,
    context: QueryContext
  ): Promise<{ data: T | null; error: any }> {
    return this.query(
      async () => supabase.rpc(functionName, params),
      context
    );
  }

  /**
   * Execute a raw SQL query (use with caution)
   */
  async executeRawSQL<T>(
    sql: string,
    params: any[],
    context: QueryContext
  ): Promise<{ data: T | null; error: any }> {
    return this.query(
      async () => supabase.rpc('execute_sql', { sql, params }),
      context
    );
  }
} 