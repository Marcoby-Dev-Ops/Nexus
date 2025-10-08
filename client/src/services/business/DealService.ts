import { z } from 'zod';
import { BaseService } from '@/core/services/BaseService';
import type { ServiceResponse } from '@/core/services/BaseService';
import type { CrudServiceInterface, ServiceConfig } from '@/core/services/interfaces';
import { selectData as select, selectOne, insertOne, updateOne, deleteOne, callEdgeFunction } from '@/lib/api-client';
import { auditLogService } from '@/shared/services/auditLogService';

// Deal Schema
export const DealSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  value: z.number().positive(),
  stage: z.string().optional(),
  contact_id: z.string().uuid().optional(),
  notes: z.string().optional(),
  user_id: z.string().uuid(),
  company_id: z.string().uuid().optional(),
  expected_close_date: z.string().optional(),
  hubspotid: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Deal = z.infer<typeof DealSchema>;

/**
 * Deal Service Configuration
 */
const dealServiceConfig: ServiceConfig = {
  tableName: 'deals',
  schema: DealSchema,
  cacheEnabled: true,
  cacheTTL: 300000, // 5 minutes
  enableLogging: true,
};

/**
 * Deal Service
 * Extends BaseService for consistent CRUD operations
 */
export class DealService extends BaseService implements CrudServiceInterface<Deal> {
  protected config = dealServiceConfig;

  constructor() {
    super();
  }

  // CRUD Methods required by CrudServiceInterface
  async get(id: string): Promise<ServiceResponse<Deal>> {
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

  async create(data: Partial<Deal>): Promise<ServiceResponse<Deal>> {
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

  async update(id: string, data: Partial<Deal>): Promise<ServiceResponse<Deal>> {
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

  async list(filters?: Record<string, any>): Promise<ServiceResponse<Deal[]>> {
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
   * Create a deal with enhanced validation and audit logging
   */
  async createDeal(data: Omit<Deal, 'id' | 'created_at' | 'updated_at'>) {
    this.logMethodCall('createDeal', { title: data.title, value: data.value });
    
    return this.executeDbOperation(async () => {
      // Validate business rules
      if (data.value <= 0) {
        throw new Error('Deal value must be positive');
      }

      // Verify contact exists if contact_id provided
      if (data.contact_id) {
        const { data: contact } = await supabase
          .from('contacts')
          .select('id')
          .eq('id', data.contact_id)
          .eq('user_id', data.user_id)
          .single();

        if (!contact) {
          throw new Error('Associated contact not found or access denied');
        }
      }

      // Set default stage if not provided
      const dealData = {
        ...data,
        stage: data.stage || 'prospect'
      };

      // Create deal using inherited create method
      const result = await this.create(dealData);
      
      if (result.success && result.data) {
        // Enhanced audit logging
        await auditLogService.logUserAction(
          data.user_id,
          'create',
          'deal',
          result.data.id,
          { 
            deal_title: data.title, 
            deal_value: data.value,
            deal_stage: dealData.stage
          }
        );
      }

      return result;
    }, 'createDeal');
  }

  /**
   * Update a deal with ownership validation
   */
  async updateDeal(dealId: string, userId: string, updates: Partial<Deal>) {
    this.logMethodCall('updateDeal', { dealId, userId });
    
    return this.executeDbOperation(async () => {
      // Verify ownership
      const { data: existingDeal } = await supabase
        .from('deals')
        .select('id, user_id, title, value, stage')
        .eq('id', dealId)
        .eq('user_id', userId)
        .single();

      if (!existingDeal) {
        throw new Error('Deal not found or access denied');
      }

      // Validate value if being updated
      if (updates.value !== undefined && updates.value <= 0) {
        throw new Error('Deal value must be positive');
      }

      // Verify contact exists if contact_id being updated
      if (updates.contact_id) {
        const { data: contact } = await supabase
          .from('contacts')
          .select('id')
          .eq('id', updates.contact_id)
          .eq('user_id', userId)
          .single();

        if (!contact) {
          throw new Error('Associated contact not found or access denied');
        }
      }

      // Update using inherited update method
      const result = await this.update(dealId, updates);
      
      if (result.success && result.data) {
        // Enhanced audit logging
        await auditLogService.logUserAction(
          userId,
          'update',
          'deal',
          dealId,
          { 
            updates,
            previous_value: existingDeal.value,
            previous_stage: existingDeal.stage
          }
        );
      }

      return result;
    }, 'updateDeal');
  }

  /**
   * Delete a deal with ownership validation
   */
  async deleteDeal(dealId: string, userId: string) {
    this.logMethodCall('deleteDeal', { dealId, userId });
    
    return this.executeDbOperation(async () => {
      // Verify ownership and get deal data for audit
      const { data: existingDeal } = await supabase
        .from('deals')
        .select('id, user_id, title, value')
        .eq('id', dealId)
        .eq('user_id', userId)
        .single();

      if (!existingDeal) {
        throw new Error('Deal not found or access denied');
      }

      // Delete using inherited delete method
      const result = await this.delete(dealId);
      
      if (result.success) {
        // Enhanced audit logging
        await auditLogService.logUserAction(
          userId,
          'delete',
          'deal',
          dealId,
          { 
            deal_title: existingDeal.title,
            deal_value: existingDeal.value
          }
        );
      }

      return result;
    }, 'deleteDeal');
  }

  /**
   * Get deals for a user with optional filters
   */
  async getUserDeals(
    userId: string, 
    filters?: { 
      companyId?: string; 
      stage?: string; 
      contactId?: string;
      search?: string;
    }
  ) {
    this.logMethodCall('getUserDeals', { userId, filters });
    
    return this.executeDbOperation(async () => {
      let query = supabase
        .from('deals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (filters?.companyId) {
        query = query.eq('company_id', filters.companyId);
      }

      if (filters?.stage) {
        query = query.eq('stage', filters.stage);
      }

      if (filters?.contactId) {
        query = query.eq('contact_id', filters.contactId);
      }

      if (filters?.search) {
        query = query.ilike('title', `%${filters.search}%`);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      // Validate all deals against schema
      const validatedDeals = data?.map(deal => DealSchema.parse(deal)) || [];
      
      return { data: validatedDeals, error: null };
    }, 'getUserDeals');
  }

  /**
   * Get deal pipeline summary for a user
   */
  async getDealPipelineSummary(userId: string, companyId?: string) {
    this.logMethodCall('getDealPipelineSummary', { userId, companyId });
    
    return this.executeDbOperation(async () => {
      let query = supabase
        .from('deals')
        .select('stage, value')
        .eq('user_id', userId);

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      // Calculate pipeline summary
      const summary = (data || []).reduce((acc, deal) => {
        const stage = deal.stage || 'unknown';
        if (!acc[stage]) {
          acc[stage] = { count: 0, totalValue: 0 };
        }
        acc[stage].count++;
        acc[stage].totalValue += deal.value || 0;
        return acc;
      }, {} as Record<string, { count: number; totalValue: number }>);
      
      return { data: summary, error: null };
    }, 'getDealPipelineSummary');
  }

  /**
   * Upsert deal (for HubSpot sync integration)
   */
  async upsertDealByHubSpotId(dealData: Partial<Deal> & { hubspotid: string }) {
    this.logMethodCall('upsertDealByHubSpotId', { hubspotid: dealData.hubspotid });
    
    return this.executeDbOperation(async () => {
      const { data, error } = await supabase
        .from('deals')
        .upsert(dealData, { onConflict: 'hubspotid' })
        .select()
        .single();
      
      if (error) throw error;
      
      // Validate against schema
      const validatedDeal = DealSchema.parse(data);
      
      return { data: validatedDeal, error: null };
    }, 'upsertDealByHubSpotId');
  }
}

// Export singleton instance
export const dealService = new DealService();
