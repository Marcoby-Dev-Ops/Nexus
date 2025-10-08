import { z } from 'zod';
import { BaseService } from '@/core/services/BaseService';
import type { ServiceResponse } from '@/core/services/BaseService';
import type { CrudServiceInterface, ServiceConfig } from '@/core/services/interfaces';
import { selectData as select, selectOne, insertOne, updateOne, deleteOne, callEdgeFunction } from '@/lib/database';
import { logger } from '@/shared/utils/logger';
import { auditLogService } from '@/shared/services/auditLogService';

// Contact Schema
export const ContactSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().optional(),
  company: z.string().optional(),
  notes: z.string().optional(),
  user_id: z.string().uuid(),
  company_id: z.string().uuid().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Contact = z.infer<typeof ContactSchema>;

/**
 * Contact Service Configuration
 */
const contactServiceConfig: ServiceConfig = {
  tableName: 'contacts',
  schema: ContactSchema,
  cacheEnabled: true,
  cacheTTL: 300000, // 5 minutes
  enableLogging: true,
};

/**
 * Contact Service
 * Extends BaseService for consistent CRUD operations
 */
export class ContactService extends BaseService implements CrudServiceInterface<Contact> {
  protected config = contactServiceConfig;

  constructor() {
    super();
  }

  // CRUD Methods required by CrudServiceInterface
  async get(id: string): Promise<ServiceResponse<Contact>> {
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
    }, `get ${this.config.tableName} ${id}`);
  }

  async create(data: Partial<Contact>): Promise<ServiceResponse<Contact>> {
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

  async update(id: string, data: Partial<Contact>): Promise<ServiceResponse<Contact>> {
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
    }, `update ${this.config.tableName} ${id}`);
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
    }, `delete ${this.config.tableName} ${id}`);
  }

  async list(filters?: Record<string, any>): Promise<ServiceResponse<Contact[]>> {
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

  /**
   * Create a contact with enhanced validation and audit logging
   */
  async createContact(data: Omit<Contact, 'id' | 'created_at' | 'updated_at'>) {
    this.logMethodCall('createContact', { email: data.email });
    
    return this.executeDbOperation(async () => {
      // Check for duplicate email within the same user/company scope
      const { data: existingContact } = await supabase
        .from('contacts')
        .select('id, email')
        .eq('email', data.email)
        .eq('user_id', data.user_id)
        .maybeSingle();

      if (existingContact) {
        throw new Error(`Contact with email ${data.email} already exists`);
      }

      // Create contact using inherited create method
      const result = await this.create(data);
      
      if (result.success && result.data) {
        // Enhanced audit logging
        await auditLogService.logUserAction(
          data.user_id,
          'create',
          'contact',
          result.data.id,
          { contact_email: data.email, contact_name: data.name }
        );
      }

      return result;
    }, 'createContact');
  }

  /**
   * Update a contact with ownership validation
   */
  async updateContact(contactId: string, userId: string, updates: Partial<Contact>) {
    this.logMethodCall('updateContact', { contactId, userId });
    
    return this.executeDbOperation(async () => {
      // Verify ownership
      const { data: existingContact } = await supabase
        .from('contacts')
        .select('id, user_id, name, email')
        .eq('id', contactId)
        .eq('user_id', userId)
        .single();

      if (!existingContact) {
        throw new Error('Contact not found or access denied');
      }

      // Update using inherited update method
      const result = await this.update(contactId, updates);
      
      if (result.success && result.data) {
        // Enhanced audit logging
        await auditLogService.logUserAction(
          userId,
          'update',
          'contact',
          contactId,
          { 
            updates,
            previous_name: existingContact.name,
            previous_email: existingContact.email
          }
        );
      }

      return result;
    }, 'updateContact');
  }

  /**
   * Delete a contact with ownership validation
   */
  async deleteContact(contactId: string, userId: string) {
    this.logMethodCall('deleteContact', { contactId, userId });
    
    return this.executeDbOperation(async () => {
      // Verify ownership and get contact data for audit
      const { data: existingContact } = await supabase
        .from('contacts')
        .select('id, user_id, name, email')
        .eq('id', contactId)
        .eq('user_id', userId)
        .single();

      if (!existingContact) {
        throw new Error('Contact not found or access denied');
      }

      // Delete using inherited delete method
      const result = await this.delete(contactId);
      
      if (result.success) {
        // Enhanced audit logging
        await auditLogService.logUserAction(
          userId,
          'delete',
          'contact',
          contactId,
          { 
            contact_name: existingContact.name,
            contact_email: existingContact.email
          }
        );
      }

      return result;
    }, 'deleteContact');
  }

  /**
   * Get contacts for a user with optional filters
   */
  async getUserContacts(userId: string, filters?: { companyId?: string; search?: string }) {
    this.logMethodCall('getUserContacts', { userId, filters });
    
    return this.executeDbOperation(async () => {
      let query = supabase
        .from('contacts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (filters?.companyId) {
        query = query.eq('company_id', filters.companyId);
      }

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      // Validate all contacts against schema
      const validatedContacts = data?.map(contact => ContactSchema.parse(contact)) || [];
      
      return { data: validatedContacts, error: null };
    }, 'getUserContacts');
  }
}

// Export singleton instance
export const contactService = new ContactService();
