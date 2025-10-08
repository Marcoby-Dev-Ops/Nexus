/**
 * Unified Database Service
 * 
 * Provides a unified interface for database operations using the API client pattern.
 * This service abstracts database operations and provides consistent error handling.
 */

import { apiAdapter } from '@/core/database/apiAdapter';
import type { ServiceResponse } from './BaseService';

export class UnifiedDatabaseService {
  /**
   * Backward compatibility wrapper for older callRPC usage.
   */
  async callRPC<T = any>(functionName: string, params?: Record<string, any>): Promise<ServiceResponse<T>> {
    return this.rpc<T>(functionName, params);
  }

  /**
   * Backward compatibility: previous interface expected updateOne(table, id, data)
   * We adapt to update(table, data, { id }).
   */
  async updateOne<T = any>(table: string, id: string, data: any): Promise<ServiceResponse<T>> {
    return this.update<T>(table, data, { id });
  }

  /**
   * Backward compatibility for insertOne(table, data).
   */
  async insertOne<T = any>(table: string, data: any): Promise<ServiceResponse<T>> {
    return this.insert<T>(table, data);
  }

  /**
   * Backward compatibility for deleteOne(table, id)
   */
  async deleteOne<T = any>(table: string, id: string): Promise<ServiceResponse<T>> {
    return this.delete<T>(table, { id });
  }

  /**
   * Emulated selectWithOptions combining filtering, ordering, limiting.
   * arg1: { filter, columns, orderBy?, limit?, offset? }
   */
  async selectWithOptions<T = any>(
    table: string,
    options: {
      filter?: Record<string, any>;
      columns?: string;
      orderBy?: { column: string; ascending?: boolean } | { column: string; ascending?: boolean }[];
      limit?: number;
      offset?: number;
    }
  ): Promise<ServiceResponse<T[]>> {
    // For now delegate to basic select; ordering/limit to be handled API-side later if needed
    const { filter, columns } = options;
    return this.select<T>(table, columns || '*', filter);
  }
  /**
   * Select data from a table
   */
  async select<T = any>(
    table: string,
    columns: string = '*',
    filters?: Record<string, any>
  ): Promise<ServiceResponse<T[]>> {
    try {
  const result = await apiAdapter.select(table, columns, filters);
      return {
        success: !result.error,
        data: result.data || [],
        error: result.error || null
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Database select failed',
        data: []
      };
    }
  }

  /**
   * Select a single record from a table
   */
  async selectOne<T = any>(table: string, filters: Record<string, any>): Promise<ServiceResponse<T>> {
    try {
  const result = await apiAdapter.selectOne(table, filters || {});
      return {
        success: !result.error,
        data: result.data || null,
        error: result.error || null
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Database selectOne failed',
        data: null
      };
    }
  }

  /**
   * Insert data into a table
   */
  async insert<T = any>(table: string, data: any): Promise<ServiceResponse<T>> {
    try {
  const result = await apiAdapter.insert(table, data);
      return {
        success: !result.error,
        data: result.data || null,
        error: result.error || null
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Database insert failed',
        data: null
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
  const result = await apiAdapter.update(table, data, filters || {});
      return {
        success: !result.error,
        data: result.data || null,
        error: result.error || null
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Database update failed',
        data: null
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
  const result = await apiAdapter.delete(table, filters || {});
      return {
        success: !result.error,
        data: result.data || null,
        error: result.error || null
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Database delete failed',
        data: null
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
  const result = await apiAdapter.rpc(functionName, params || {});
      return {
        success: !result.error,
        data: result.data || null,
        error: result.error || null
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Database RPC failed',
        data: null
      };
    }
  }
}

// Export singleton instance
export const unifiedDatabaseService = new UnifiedDatabaseService();
