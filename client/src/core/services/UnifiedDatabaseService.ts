/**
 * Unified Database Service
 * 
 * Provides a unified interface for database operations using the API client pattern.
 * This service abstracts database operations and provides consistent error handling.
 */

import { selectData, selectOne, insertOne, updateOne, deleteOne, callRPC } from '@/lib/api-client';
import type { ServiceResponse } from './BaseService';

export class UnifiedDatabaseService {
  /**
   * Select data from a table
   */
  async select<T = any>(
    table: string,
    columns: string = '*',
    filters?: Record<string, any>
  ): Promise<ServiceResponse<T[]>> {
    try {
      const result = await selectData(table, columns, filters);
      return {
        success: !result.error,
        data: result.data || [],
        error: result.error || null
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Database select failed',
        details: error
      };
    }
  }

  /**
   * Select a single record from a table
   */
  async selectOne<T = any>(
    table: string,
    columns: string = '*',
    filters?: Record<string, any>
  ): Promise<ServiceResponse<T>> {
    try {
      const result = await selectOne(table, columns, filters);
      return {
        success: !result.error,
        data: result.data || null,
        error: result.error || null
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Database selectOne failed',
        details: error
      };
    }
  }

  /**
   * Insert data into a table
   */
  async insert<T = any>(table: string, data: any): Promise<ServiceResponse<T>> {
    try {
      const result = await insertOne(table, data);
      return {
        success: !result.error,
        data: result.data || null,
        error: result.error || null
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Database insert failed',
        details: error
      };
    }
  }

  /**
   * Update data in a table
   */
  async update<T = any>(
    table: string,
    data: any,
    filters?: Record<string, any>
  ): Promise<ServiceResponse<T>> {
    try {
      const result = await updateOne(table, data, filters);
      return {
        success: !result.error,
        data: result.data || null,
        error: result.error || null
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Database update failed',
        details: error
      };
    }
  }

  /**
   * Delete data from a table
   */
  async delete<T = any>(
    table: string,
    filters?: Record<string, any>
  ): Promise<ServiceResponse<T>> {
    try {
      const result = await deleteOne(table, filters);
      return {
        success: !result.error,
        data: result.data || null,
        error: result.error || null
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Database delete failed',
        details: error
      };
    }
  }

  /**
   * Call a database function
   */
  async rpc<T = any>(
    functionName: string,
    params?: Record<string, any>
  ): Promise<ServiceResponse<T>> {
    try {
      const result = await callRPC(functionName, params);
      return {
        success: !result.error,
        data: result.data || null,
        error: result.error || null
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Database RPC failed',
        details: error
      };
    }
  }
}

// Export singleton instance
export const unifiedDatabaseService = new UnifiedDatabaseService();
