/**
 * Example Service
 * 
 * Demonstrates how to use the UnifiedService base class with PostgreSQL integration.
 * This service provides CRUD operations for a hypothetical 'examples' table.
 */

import { z } from 'zod';
import { UnifiedService, type ServiceResponse } from './UnifiedService';

// Define the data schema using Zod
const ExampleSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive', 'pending']).default('pending'),
  user_id: z.string().uuid(),
  company_id: z.string().uuid().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Example = z.infer<typeof ExampleSchema>;

/**
 * Example Service Configuration
 */
const ExampleServiceConfig = {
  tableName: 'examples',
  schema: ExampleSchema,
  cacheEnabled: true,
  cacheTTL: 5 * 60 * 1000, // 5 minutes
  enableLogging: true,
  defaultColumns: 'id, title, description, status, user_id, company_id, created_at, updated_at',
  enableRealtime: false,
};

/**
 * Example Service Class
 * 
 * Extends UnifiedService to provide standardized CRUD operations
 * with automatic PostgreSQL/Supabase integration.
 */
export class ExampleService extends UnifiedService<Example> {
  protected config = ExampleServiceConfig;
  db: any;

  /**
   * Get examples by user ID
   */
  async getByUserId(userId: string): Promise<ServiceResponse<Example[]>> {
    return this.list({ user_id: userId });
  }

  /**
   * Get active examples
   */
  async getActiveExamples(): Promise<ServiceResponse<Example[]>> {
    return this.list({ status: 'active' });
  }

  /**
   * Search examples by title
   */
  async searchByTitle(query: string): Promise<ServiceResponse<Example[]>> {
    return this.search(query, {
      searchColumns: ['title', 'description'],
      sort: { column: 'created_at', direction: 'desc' }
    });
  }

  /**
   * Create a new example with validation
   */
  async createExample(data: {
    title: string;
    description?: string;
    status?: 'active' | 'inactive' | 'pending';
    user_id: string;
    company_id?: string;
  }): Promise<ServiceResponse<Example>> {
    // Add timestamps
    const now = new Date().toISOString();
    const exampleData = {
      ...data,
      created_at: now,
      updated_at: now,
    };

    return this.create(exampleData);
  }

  /**
   * Update example status
   */
  async updateStatus(id: string, status: 'active' | 'inactive' | 'pending'): Promise<ServiceResponse<Example>> {
    return this.update(id, { 
      status,
      updated_at: new Date().toISOString()
    });
  }

  /**
   * Get examples with pagination
   */
  async getPaginatedExamples(
    page: number = 1,
    limit: number = 10,
    filters?: Record<string, any>
  ): Promise<ServiceResponse<{ data: Example[]; total: number; page: number; limit: number }>> {
    return this.executeDbOperation(async () => {
      // Get total count
      const countResult = await this.count(filters);
      if (!countResult.success) {
        return this.createErrorResponse<{ data: Example[]; total: number; page: number; limit: number }>(countResult.error || 'Failed to get count');
      }

      // Get paginated data
      const offset = (page - 1) * limit;
      const sql = `
        SELECT ${this.config.defaultColumns}
        FROM ${this.config.tableName}
        ${filters ? this.buildWhereClause(filters) : ''}
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
      `;

      const params = [limit, offset];
      const result = await this.db.rpc('exec_sql', { sql_query: sql, sql_params: params });

      if (result.error) {
        return this.createErrorResponse<{ data: Example[]; total: number; page: number; limit: number }>(result.error.message || 'Failed to get paginated data');
      }

      // Validate data
      try {
        const validatedData = result.data.map((item: any) => this.config.schema.parse(item));
        return this.createSuccessResponse({
          data: validatedData,
          total: countResult.data ?? 0,
          page,
          limit
        });
      } catch (validationError) {
        return this.createErrorResponse<{ data: Example[]; total: number; page: number; limit: number }>(`Invalid data format: ${validationError}`);
      }
    }, `get paginated examples`);
  }

  /**
   * Build WHERE clause from filters
   */
  private buildWhereClause(filters: Record<string, any>): string {
    const conditions = Object.entries(filters)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key], index) => `${key} = $${index + 3}`); // +3 because LIMIT and OFFSET are $1 and $2

    return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  }

  /**
   * Get database health status
   */
  async getHealthStatus(): Promise<ServiceResponse<{ status: string; type: string; connection: boolean }>> {
    return this.executeDbOperation(async () => {
      const db = await this.getDatabase();
      if (!db) {
        return this.createErrorResponse('Database connection not available');
      }

      // Basic health: we have a DB connection
      return this.createSuccessResponse({ status: 'ok', type: 'database', connection: true });
    }, 'get health status');
  }
}

// Export singleton instance
export const exampleService = new ExampleService();

// Export for convenience
export default exampleService;
