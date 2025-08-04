import { supabase } from '@/lib/supabase';
import { logger } from '@/shared/utils/logger.ts';
import { BaseService } from './BaseService';
import type { ServiceResponse } from './BaseService';
import type { CrudServiceInterface, ServiceConfig } from './interfaces';
import { z } from 'zod';

/**
 * NOTE: UnifiedService is currently disabled due to conflicts with Supabase's strict typing system.
 * 
 * The issue is that Supabase requires specific table names and types, but UnifiedService tries to be
 * generic. This creates type conflicts where Supabase expects specific table types but gets generic ones.
 * 
 * Instead, create specific service classes that extend BaseService directly:
 * 
 * @example
 * ```typescript
 * export class UserService extends BaseService implements CrudServiceInterface<User> {
 *   async get(id: string): Promise<ServiceResponse<User>> {
 *     return this.executeDbOperation(async () => {
 *       const { data, error } = await supabase
 *         .from('users')
 *         .select('*')
 *         .eq('id', id)
 *         .single();
 *       return { data, error };
 *     }, `get user ${id}`);
 *   }
 *   // ... other methods
 * }
 * ```
 */

/*
export abstract class UnifiedService<T> extends BaseService implements CrudServiceInterface<T> {
  protected abstract config: ServiceConfig;

  async get(id: string): Promise<ServiceResponse<T>> {
    this.logMethodCall('get', { id });
    
    return this.executeDbOperation(async () => {
      const { data, error } = await supabase
        .from(this.config.tableName)
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      const validatedData = this.config.schema.parse(data);
      return { data: validatedData, error: null };
    }, `get ${this.config.tableName}`);
  }

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
      
      const validatedData = this.config.schema.parse(result);
      return { data: validatedData, error: null };
    }, `create ${this.config.tableName}`);
  }

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
      
      const validatedData = this.config.schema.parse(result);
      return { data: validatedData, error: null };
    }, `update ${this.config.tableName}`);
  }

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

  async list(filters?: Record<string, any>): Promise<ServiceResponse<T[]>> {
    this.logMethodCall('list', { filters });
    
    return this.executeDbOperation(async () => {
      let query = supabase
        .from(this.config.tableName)
        .select('*');
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      const validatedData = data.map(item => this.config.schema.parse(item));
      return { data: validatedData, error: null };
    }, `list ${this.config.tableName}`);
  }

  async search(query: string, filters?: Record<string, any>): Promise<ServiceResponse<T[]>> {
    this.logMethodCall('search', { query, filters });
    
    return this.executeDbOperation(async () => {
      let supabaseQuery = supabase
        .from(this.config.tableName)
        .select('*');
      
      if (this.config.tableName === 'user_profiles') {
        supabaseQuery = supabaseQuery.or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`);
      } else {
        supabaseQuery = supabaseQuery.ilike('name', `%${query}%`);
      }
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            supabaseQuery = supabaseQuery.eq(key, value);
          }
        });
      }
      
      const { data, error } = await supabaseQuery;
      
      if (error) throw error;
      
      const validatedData = data.map(item => this.config.schema.parse(item));
      return { data: validatedData, error: null };
    }, `search ${this.config.tableName}`);
  }

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
      
      const validatedData = result.map(item => this.config.schema.parse(item));
      return { data: validatedData, error: null };
    }, `bulkCreate ${this.config.tableName}`);
  }

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
*/ 