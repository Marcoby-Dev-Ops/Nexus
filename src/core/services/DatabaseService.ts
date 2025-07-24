/**
 * Database Service with RLS Policy Compliance
 * 
 * Ensures all database operations are properly authenticated and comply with RLS policies.
 */

import { supabase } from '@/core/supabase';
import { DatabaseQueryWrapper } from '@/core/database/queryWrapper';
import { logger } from '@/shared/utils/logger';

export interface QueryOptions {
  select?: string;
  where?: Record<string, any>;
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;
  offset?: number;
}

export interface InsertOptions {
  returning?: string;
}

export interface UpdateOptions {
  returning?: string;
}

export class DatabaseService {
  private queryWrapper = new DatabaseQueryWrapper();

  /**
   * Generic select query with proper authentication
   */
  async select<T = any>(
    table: string,
    options: QueryOptions = {},
    _userId?: string
  ): Promise<{ data: T[] | null; error: any }> {
    try {
      const { data, error } = await this.queryWrapper.query(
        async () => {
          let query = supabase.from(table).select(options.select || '*');
          
          if (options.where) {
            Object.entries(options.where).forEach(([key, value]) => {
              query = query.eq(key, value);
            });
          }
          
          if (options.orderBy) {
            query = query.order(options.orderBy.column, {
              ascending: options.orderBy.ascending ?? true
            });
          }
          
          if (options.limit) {
            query = query.limit(options.limit);
          }
          
          if (options.offset) {
            query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
          }
          
          return query;
        },
        { context: `select-${table}` }
      );

      return { data, error };
    } catch (error) {
      logger.error(`Error in select query for table ${table}:`, error);
      return { data: null, error };
    }
  }

  /**
   * Generic upsert query with proper authentication
   */
  async upsert<T = any>(
    table: string,
    data: any,
    options: InsertOptions = {},
    _userId?: string
  ): Promise<{ data: T | null; error: any }> {
    try {
      const { data: result, error } = await this.queryWrapper.query(
        async () => {
          let query = supabase.from(table).upsert(data);
          
          if (options.returning) {
            query = query.select(options.returning);
          }
          
          return query;
        },
        { context: `upsert-${table}` }
      );

      return { data: result, error };
    } catch (error) {
      logger.error(`Error in upsert query for table ${table}:`, error);
      return { data: null, error };
    }
  }

  /**
   * Generic insert query with proper authentication
   */
  async insert<T = any>(
    table: string,
    data: any,
    options: InsertOptions = {},
    _userId?: string
  ): Promise<{ data: T | null; error: any }> {
    try {
      const { data: result, error } = await this.queryWrapper.query(
        async () => {
          let query = supabase.from(table).insert(data);
          
          if (options.returning) {
            query = query.select(options.returning);
          } else {
            query = query.select().single();
          }
          
          return query;
        },
        { context: `insert-${table}` }
      );

      return { data: result, error };
    } catch (error) {
      logger.error(`Error in insert query for table ${table}:`, error);
      return { data: null, error };
    }
  }

  /**
   * Generic update query with proper authentication
   */
  async update<T = any>(
    table: string,
    data: any,
    where: Record<string, any>,
    options: UpdateOptions = {},
    _userId?: string
  ): Promise<{ data: T | null; error: any }> {
    try {
      const { data: result, error } = await this.queryWrapper.query(
        async () => {
          let query = supabase.from(table).update(data);
          
          Object.entries(where).forEach(([key, value]) => {
            query = query.eq(key, value);
          });
          
          if (options.returning) {
            query = query.select(options.returning);
          } else {
            query = query.select().single();
          }
          
          return query;
        },
        { context: `update-${table}` }
      );

      return { data: result, error };
    } catch (error) {
      logger.error(`Error in update query for table ${table}:`, error);
      return { data: null, error };
    }
  }

  /**
   * Generic delete query with proper authentication
   */
  async delete(
    table: string,
    where: Record<string, any>,
    _userId?: string
  ): Promise<{ error: any }> {
    try {
      const { error } = await this.queryWrapper.query(
        async () => {
          let query = supabase.from(table).delete();
          
          Object.entries(where).forEach(([key, value]) => {
            query = query.eq(key, value);
          });
          
          return query;
        },
        { context: `delete-${table}` }
      );

      return { error };
    } catch (error) {
      logger.error(`Error in delete query for table ${table}:`, error);
      return { error };
    }
  }

  /**
   * User-specific select query with proper authentication
   */
  async selectForUser<T = any>(
    table: string,
    userId: string,
    options: QueryOptions = {}
  ): Promise<{ data: T[] | null; error: any }> {
    try {
      const { data, error } = await this.queryWrapper.userQuery(
        async () => {
          let query = supabase.from(table).select(options.select || '*');
          
          // Add user_id filter for user-specific data
          query = query.eq('user_id', userId);
          
          if (options.where) {
            Object.entries(options.where).forEach(([key, value]) => {
              query = query.eq(key, value);
            });
          }
          
          if (options.orderBy) {
            query = query.order(options.orderBy.column, {
              ascending: options.orderBy.ascending ?? true
            });
          }
          
          if (options.limit) {
            query = query.limit(options.limit);
          }
          
          if (options.offset) {
            query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
          }
          
          return query;
        },
        userId,
        `select-${table}-for-user`
      );

      return { data, error };
    } catch (error) {
      logger.error(`Error in selectForUser query for table ${table}:`, error);
      return { data: null, error };
    }
  }

  /**
   * Company-specific select query with proper authentication
   */
  async selectForCompany<T = any>(
    table: string,
    companyId: string,
    options: QueryOptions = {}
  ): Promise<{ data: T[] | null; error: any }> {
    try {
      const { data, error } = await this.queryWrapper.companyQuery(
        async () => {
          let query = supabase.from(table).select(options.select || '*');
          
          // Add company_id filter for company-specific data
          query = query.eq('company_id', companyId);
          
          if (options.where) {
            Object.entries(options.where).forEach(([key, value]) => {
              query = query.eq(key, value);
            });
          }
          
          if (options.orderBy) {
            query = query.order(options.orderBy.column, {
              ascending: options.orderBy.ascending ?? true
            });
          }
          
          if (options.limit) {
            query = query.limit(options.limit);
          }
          
          if (options.offset) {
            query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
          }
          
          return query;
        },
        companyId,
        `select-${table}-for-company`
      );

      return { data, error };
    } catch (error) {
      logger.error(`Error in selectForCompany query for table ${table}:`, error);
      return { data: null, error };
    }
  }
}

// Export singleton instance
export const databaseService = new DatabaseService(); 