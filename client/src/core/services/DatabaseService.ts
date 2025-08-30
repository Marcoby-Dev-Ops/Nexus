import { query, transaction, testConnection, testVectorExtension } from '@/lib/postgres';
import { environment } from '@/core/environment';
import { logger } from '@/shared/utils/logger';
import { BaseService } from './BaseService';

export interface DatabaseConfig {
  type: 'postgres';
  url: string;
}

export interface DatabaseHealth {
  status: 'healthy' | 'unhealthy' | 'unknown';
  type: 'postgres';
  connection: boolean;
  vectorSupport: boolean;
  error?: string;
}

export interface QueryResult<T = any> {
  data: T[] | null;
  error: string | null;
  count?: number;
}

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

/**
 * Database Service
 * Provides a consistent interface for PostgreSQL database operations
 */
export class DatabaseService extends BaseService {
  private config: DatabaseConfig;

  constructor(config?: DatabaseConfig) {
    super();
    // Always use PostgreSQL with pgvector
    this.config = config || {
      type: 'postgres',
      url: environment.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/vector_db'
    };
  }

  /**
   * Execute a query using PostgreSQL
   */
  async query<T = any>(
    sql: string,
    params?: any[]
  ): Promise<QueryResult<T>> {
    try {
      // Use PostgreSQL client (server-side only)
      if (isBrowser) {
        throw new Error('PostgreSQL queries are not available in browser environment');
      }
      
      const result = await query<T>(sql, params);
      
      return {
        data: result.rows,
        error: null,
        count: result.rowCount
      };
    } catch (error) {
      this.logger.error('Database query error:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown database error'
      };
    }
  }

  /**
   * Execute a transaction
   */
  async transaction<T>(
    callback: (client: any) => Promise<T>
  ): Promise<{ data: T | null; error: string | null }> {
    try {
      // Use PostgreSQL transaction (server-side only)
      if (isBrowser) {
        throw new Error('PostgreSQL transactions are not available in browser environment');
      }
      
      const result = await transaction(callback);
      return { data: result, error: null };
    } catch (error) {
      this.logger.error('Database transaction error:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown database error'
      };
    }
  }

  /**
   * Check database health
   */
  async healthCheck(): Promise<DatabaseHealth> {
    try {
      // Test PostgreSQL connection (server-side only)
      if (isBrowser) {
        return {
          status: 'unknown',
          type: 'postgres',
          connection: false,
          vectorSupport: false,
          error: 'PostgreSQL not available in browser environment'
        };
      }
      
      const connectionTest = await testConnection();
      const vectorTest = await testVectorExtension();

      if (!connectionTest.success) {
        return {
          status: 'unhealthy',
          type: 'postgres',
          connection: false,
          vectorSupport: false,
          error: connectionTest.error
        };
      }

      return {
        status: 'healthy',
        type: 'postgres',
        connection: true,
        vectorSupport: vectorTest.success
      };
    } catch (error) {
      return {
        status: 'unknown',
        type: 'postgres',
        connection: false,
        vectorSupport: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get database configuration
   */
  getConfig(): DatabaseConfig {
    return this.config;
  }

  /**
   * Check if using PostgreSQL
   */
  isUsingPostgres(): boolean {
    return true;
  }

  /**
   * Check if running in client environment
   */
  isClientEnvironment(): boolean {
    return isBrowser;
  }
}

// Export singleton instance (server-side only)
export const databaseService = isBrowser ? null : new DatabaseService();

// Export for convenience
export default databaseService;
