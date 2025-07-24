/**
 * Centralized Data Service
 * Uses backend connector for all data fetching operations
 * Provides consistent error handling and retry logic
 */

import { supabase } from '@/core/supabase';
import { DatabaseQueryWrapper } from '@/core/database/queryWrapper';
import { logger } from '@/shared/utils/logger';

export interface DataServiceOptions {
  timeout?: number;
  retries?: number;
  cacheTime?: number;
  maxCacheSize?: number;
}

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  accessCount: number;
}

export class DataService {
  private queryWrapper = new DatabaseQueryWrapper();

  /**
   * Fetch data from Supabase with proper authentication
   */
  async fetchFromSupabase(table: string, query: string) {
    try {
      const { data, error } = await this.queryWrapper.query(
        async () => {
          const result = await supabase
            .from(table)
            .select(query);
          return result;
        },
        { context: `fetch-${table}` }
      );

      if (error) {
        logger.error(`Failed to fetch from ${table}:`, error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      logger.error(`Exception fetching from ${table}:`, error);
      return { data: null, error };
    }
  }

  /**
   * Fetch user profile data with proper authentication
   */
  async fetchUserProfile(userId: string) {
    try {
      const { data, error } = await this.queryWrapper.getUserProfile(userId);
      
      if (error) {
        logger.error(`Failed to fetch user profile for ${userId}:`, error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      logger.error(`Exception fetching user profile for ${userId}:`, error);
      return { data: null, error };
    }
  }

  /**
   * Fetch company data with proper authentication
   */
  async fetchCompany(companyId: string) {
    try {
      const { data, error } = await this.queryWrapper.getCompany(companyId);
      
      if (error) {
        logger.error(`Failed to fetch company ${companyId}:`, error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      logger.error(`Exception fetching company ${companyId}:`, error);
      return { data: null, error };
    }
  }

  /**
   * Fetch user integrations with proper authentication
   */
  async fetchUserIntegrations(userId: string) {
    try {
      const { data, error } = await this.queryWrapper.getUserIntegrations(userId);
      
      if (error) {
        logger.error(`Failed to fetch integrations for ${userId}:`, error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      logger.error(`Exception fetching integrations for ${userId}:`, error);
      return { data: null, error };
    }
  }

  /**
   * Update user profile with proper authentication
   */
  async updateUserProfile(userId: string, updates: any) {
    try {
      const { data, error } = await this.queryWrapper.updateUserProfile(userId, updates);
      
      if (error) {
        logger.error(`Failed to update user profile for ${userId}:`, error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      logger.error(`Exception updating user profile for ${userId}:`, error);
      return { data: null, error };
    }
  }

  /**
   * Generic update method with proper authentication
   */
  async updateRecord(table: string, id: string, updates: any) {
    try {
      const { data, error } = await this.queryWrapper.query(
        async () => {
          const result = await supabase
            .from(table)
            .update({
              ...updates,
              updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();
          return result;
        },
        { 
          requireAuth: true, 
          context: `update-${table}-${id}` 
        }
      );

      if (error) {
        logger.error(`Failed to update ${table} ${id}:`, error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      logger.error(`Exception updating ${table} ${id}:`, error);
      return { data: null, error };
    }
  }

  /**
   * Generic insert method with proper authentication
   */
  async insertRecord(table: string, record: any) {
    try {
      const { data, error } = await this.queryWrapper.query(
        async () => {
          const result = await supabase
            .from(table)
            .insert({
              ...record,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single();
          return result;
        },
        { 
          requireAuth: true, 
          context: `insert-${table}` 
        }
      );

      if (error) {
        logger.error(`Failed to insert into ${table}:`, error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      logger.error(`Exception inserting into ${table}:`, error);
      return { data: null, error };
    }
  }

  /**
   * Generic delete method with proper authentication
   */
  async deleteRecord(table: string, id: string) {
    try {
      const { data, error } = await this.queryWrapper.query(
        async () => {
          const result = await supabase
            .from(table)
            .delete()
            .eq('id', id)
            .select()
            .single();
          return result;
        },
        { 
          requireAuth: true, 
          context: `delete-${table}-${id}` 
        }
      );

      if (error) {
        logger.error(`Failed to delete ${table} ${id}:`, error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      logger.error(`Exception deleting ${table} ${id}:`, error);
      return { data: null, error };
    }
  }
}

// Export singleton instance
export const dataService = new DataService(); 