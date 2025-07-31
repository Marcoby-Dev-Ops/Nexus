import { supabase } from '@/lib/supabase';
import { logger } from '@/shared/utils/logger.ts';
import { BaseService, ServiceResponse } from './BaseService';
import { BaseServiceInterface, ServiceConfig } from './interfaces';
import { z } from 'zod';

/**
 * Unified Service Base Class
 * Provides standardized CRUD operations with consistent error handling
 */
export abstract class UnifiedService<T> extends BaseService implements BaseServiceInterface<T> {
  protected abstract config: ServiceConfig;

  /**
   * Get a single record by ID
   */
  async get(id: string): Promise<ServiceResponse<T>> {
    this.logMethodCall('get', { id });
    
    return this.executeDbOperation(async () => {
      const { data, error } = await supabase
        .from(this.config.tableName)
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      // Validate data against schema
      const validatedData = this.config.schema.parse(data);
      return { data: validatedData, error: null };
    }, `get ${this.config.tableName}`);
  }

  /**
   * Create a new record
   */
  async create(data: Partial<T>): Promise<ServiceResponse<T>> {
    this.logMethodCall('create', { data });
    
    return this.executeDbOperation(async () => {
      const { data: result, error } = await supabase
        .from(this.config.tableName)
        .insert({
          ...data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Validate data against schema
      const validatedData = this.config.schema.parse(result);
      return { data: validatedData, error: null };
    }, `create ${this.config.tableName}`);
  }

  /**
   * Update an existing record
   */
  async update(id: string, data: Partial<T>): Promise<ServiceResponse<T>> {
    this.logMethodCall('update', { id, data });
    
    return this.executeDbOperation(async () => {
      const { data: result, error } = await supabase
        .from(this.config.tableName)
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Validate data against schema
      const validatedData = this.config.schema.parse(result);
      return { data: validatedData, error: null };
    }, `update ${this.config.tableName}`);
  }

  /**
   * Delete a record
   */
  async delete(id: string): Promise<ServiceResponse<boolean>> {
    this.logMethodCall('delete', { id });
    
    return this.executeDbOperation(async () => {
      const { error } = await supabase
        .from(this.config.tableName)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      return { data: true, error: null };
    }, `delete ${this.config.tableName}`);
  }

  /**
   * List records with optional filters
   */
  async list(filters?: Record<string, any>): Promise<ServiceResponse<T[]>> {
    this.logMethodCall('list', { filters });
    
    return this.executeDbOperation(async () => {
      let query = supabase
        .from(this.config.tableName)
        .select('*');
      
      // Apply filters
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Validate each item against schema
      const validatedData = data.map(item => this.config.schema.parse(item));
      return { data: validatedData, error: null };
    }, `list ${this.config.tableName}`);
  }

  /**
   * Search records with text query
   */
  async search(query: string, filters?: Record<string, any>): Promise<ServiceResponse<T[]>> {
    this.logMethodCall('search', { query, filters });
    
    return this.executeDbOperation(async () => {
      let supabaseQuery = supabase
        .from(this.config.tableName)
        .select('*');
      
      // Apply text search if table supports it
      if (this.config.tableName === 'user_profiles') {
        supabaseQuery = supabaseQuery.or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`);
      } else {
        // Fallback to basic filtering
        supabaseQuery = supabaseQuery.ilike('name', `%${query}%`);
      }
      
      // Apply additional filters
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            supabaseQuery = supabaseQuery.eq(key, value);
          }
        });
      }
      
      const { data, error } = await supabaseQuery;
      
      if (error) throw error;
      
      // Validate each item against schema
      const validatedData = data.map(item => this.config.schema.parse(item));
      return { data: validatedData, error: null };
    }, `search ${this.config.tableName}`);
  }

  /**
   * Bulk create records
   */
  async bulkCreate(data: Partial<T>[]): Promise<ServiceResponse<T[]>> {
    this.logMethodCall('bulkCreate', { count: data.length });
    
    return this.executeDbOperation(async () => {
      const { data: result, error } = await supabase
        .from(this.config.tableName)
        .insert(data.map(item => ({
          ...item,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })))
        .select();
      
      if (error) throw error;
      
      // Validate each item against schema
      const validatedData = result.map(item => this.config.schema.parse(item));
      return { data: validatedData, error: null };
    }, `bulkCreate ${this.config.tableName}`);
  }

  /**
   * Bulk update records
   */
  async bulkUpdate(updates: { id: string; data: Partial<T> }[]): Promise<ServiceResponse<T[]>> {
    this.logMethodCall('bulkUpdate', { count: updates.length });
    
    return this.executeDbOperation(async () => {
      const results: T[] = [];
      
      for (const { id, data: updateData } of updates) {
        const { data: result, error } = await supabase
          .from(this.config.tableName)
          .update({
            ...updateData,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single();
        
        if (error) throw error;
        
        const validatedData = this.config.schema.parse(result);
        results.push(validatedData);
      }
      
      return { data: results, error: null };
    }, `bulkUpdate ${this.config.tableName}`);
  }

  /**
   * Bulk delete records
   */
  async bulkDelete(ids: string[]): Promise<ServiceResponse<boolean>> {
    this.logMethodCall('bulkDelete', { count: ids.length });
    
    return this.executeDbOperation(async () => {
      const { error } = await supabase
        .from(this.config.tableName)
        .delete()
        .in('id', ids);
      
      if (error) throw error;
      
      return { data: true, error: null };
    }, `bulkDelete ${this.config.tableName}`);
  }
} 