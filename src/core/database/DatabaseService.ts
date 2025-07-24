import { supabase } from '@/core/supabase';
import type { Database } from '@/core/types/supabase';

/**
 * Simple database service that uses the authenticated Supabase client
 * All operations are automatically authenticated using the current session
 */
export class DatabaseService {
  /**
   * Get user profile
   */
  static async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(userId: string, updates: any) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get user integrations
   */
  static async getUserIntegrations(userId: string) {
    const { data, error } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get company data
   */
  static async getCompany(companyId: string) {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update company data
   */
  static async updateCompany(companyId: string, updates: any) {
    const { data, error } = await supabase
      .from('companies')
      .update(updates)
      .eq('id', companyId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Generic query method for authenticated operations
   */
  static async query<T>(
    table: keyof Database['public']['Tables'],
    options: {
      select?: string;
      filters?: Record<string, any>;
      orderBy?: string;
      limit?: number;
    } = {}
  ): Promise<T[]> {
    let query = supabase.from(table).select(options.select || '*');

    // Apply filters
    if (options.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }

    // Apply ordering
    if (options.orderBy) {
      query = query.order(options.orderBy);
    }

    // Apply limit
    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  /**
   * Insert a new record
   */
  static async insert<T>(
    table: keyof Database['public']['Tables'],
    data: any
  ): Promise<T> {
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  /**
   * Update a record
   */
  static async update<T>(
    table: keyof Database['public']['Tables'],
    id: string,
    data: any
  ): Promise<T> {
    const { data: result, error } = await supabase
      .from(table)
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  /**
   * Delete a record
   */
  static async delete(
    table: keyof Database['public']['Tables'],
    id: string
  ): Promise<void> {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
} 