import { supabase } from '@/lib/supabase';

export interface QueryOptions {
  select?: string;
  filters?: Record<string, any>;
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;
  offset?: number;
}

export interface QueryResult<T> {
  data: T[] | null;
  error: any;
  count?: number;
}

export class QueryWrapper {
  static async query<T>(
    table: string,
    options: QueryOptions = {}
  ): Promise<QueryResult<T>> {
    try {
      let query = supabase.from(table).select(options.select || '*');

      // Apply filters
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (typeof value === 'object' && !Array.isArray(value)) {
              // Handle JSON field queries
              Object.entries(value).forEach(([jsonKey, jsonValue]) => {
                query = query.eq(`${key}->${jsonKey}`, jsonValue);
              });
            } else {
              query = query.eq(key, value);
            }
          }
        });
      }

      // Apply ordering
      if (options.orderBy) {
        query = query.order(options.orderBy.column, {
          ascending: options.orderBy.ascending ?? true,
        });
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error, count } = await query;

      return {
        data,
        error,
        count,
      };
    } catch (error) {
      return {
        data: null,
        error,
      };
    }
  }

  static async insert<T>(
    table: string,
    data: Partial<T>
  ): Promise<QueryResult<T>> {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .insert(data)
        .select()
        .single();

      return {
        data: result ? [result] : null,
        error,
      };
    } catch (error) {
      return {
        data: null,
        error,
      };
    }
  }

  static async update<T>(
    table: string,
    id: string,
    data: Partial<T>
  ): Promise<QueryResult<T>> {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      return {
        data: result ? [result] : null,
        error,
      };
    } catch (error) {
      return {
        data: null,
        error,
      };
    }
  }

  static async delete(
    table: string,
    id: string
  ): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      return { error };
    } catch (error) {
      return { error };
    }
  }

  static async upsert<T>(
    table: string,
    data: Partial<T>,
    conflictColumn: string = 'id'
  ): Promise<QueryResult<T>> {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .upsert(data, { onConflict: conflictColumn })
        .select()
        .single();

      return {
        data: result ? [result] : null,
        error,
      };
    } catch (error) {
      return {
        data: null,
        error,
      };
    }
  }

  static async count(
    table: string,
    filters?: Record<string, any>
  ): Promise<{ count: number | null; error: any }> {
    try {
      let query = supabase.from(table).select('*', { count: 'exact', head: true });

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }

      const { count, error } = await query;

      return { count, error };
    } catch (error) {
      return { count: null, error };
    }
  }

  static async search<T>(
    table: string,
    searchColumn: string,
    searchTerm: string,
    options: QueryOptions = {}
  ): Promise<QueryResult<T>> {
    try {
      let query = supabase
        .from(table)
        .select(options.select || '*')
        .ilike(searchColumn, `%${searchTerm}%`);

      // Apply additional filters
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }

      // Apply ordering
      if (options.orderBy) {
        query = query.order(options.orderBy.column, {
          ascending: options.orderBy.ascending ?? true,
        });
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await query;

      return {
        data,
        error,
      };
    } catch (error) {
      return {
        data: null,
        error,
      };
    }
  }

  static async batchInsert<T>(
    table: string,
    data: Partial<T>[]
  ): Promise<QueryResult<T>> {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .insert(data)
        .select();

      return {
        data: result,
        error,
      };
    } catch (error) {
      return {
        data: null,
        error,
      };
    }
  }

  static async batchUpdate<T>(
    table: string,
    updates: Array<{ id: string; data: Partial<T> }>
  ): Promise<QueryResult<T>> {
    try {
      const promises = updates.map(({ id, data }) =>
        supabase
          .from(table)
          .update(data)
          .eq('id', id)
          .select()
          .single()
      );

      const results = await Promise.all(promises);
      const successfulResults = results
        .filter(result => result.data)
        .map(result => result.data);

      const errors = results
        .filter(result => result.error)
        .map(result => result.error);

      return {
        data: successfulResults.length > 0 ? successfulResults : null,
        error: errors.length > 0 ? errors : null,
      };
    } catch (error) {
      return {
        data: null,
        error,
      };
    }
  }
}

// Export DatabaseQueryWrapper as an alias for compatibility
export const DatabaseQueryWrapper = QueryWrapper; 