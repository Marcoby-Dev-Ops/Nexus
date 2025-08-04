import { supabase } from '@/lib/supabase';
import { logger } from '@/shared/utils/logger';
import type { ServiceResponse } from '@/core/services/BaseService';

export interface Tenant {
  id: string;
  name: string;
  domain?: string;
  email?: string;
  phone?: string;
  website?: string;
  industry?: string;
  size?: string;
  status: 'active' | 'suspended' | 'pending';
  createdat: string;
  updatedat: string;
  user_count?: number;
  subscription_tier?: string;
  billing_status?: 'active' | 'past_due' | 'cancelled' | 'trial';
  subscription_plan?: 'free' | 'pro' | 'enterprise' | 'custom';
  monthly_revenue?: number;
  total_revenue?: number;
  next_billing_date?: string;
  contract_end_date?: string;
  license_count?: number;
  license_usage?: number;
  monthly_messages?: number;
  monthly_messages_limit?: number;
  storage_used_gb?: number;
  storage_limit_gb?: number;
  account_manager?: string;
  sales_rep?: string;
  contract_value?: number;
  renewal_date?: string;
}

export class TenantService {
  static async getTenants(): Promise<ServiceResponse<Tenant[]>> {
    try {
      const { data, error } = await supabase.from('companies').select('*');
      if (error) {
        logger.error('Error fetching tenants', error);
        return { success: false, error: error.message };
      }
      // TODO: Transform data to match Tenant interface if needed
      return { success: true, data: data as Tenant[] };
    } catch (err: any) {
      logger.error('Unexpected error fetching tenants', err);
      return { success: false, error: err.message };
    }
  }

  static async createTenant(tenant: Omit<Tenant, 'id' | 'createdat' | 'updatedat'>): Promise<ServiceResponse<Tenant>> {
    try {
      const { data, error } = await supabase.from('companies').insert(tenant).select().single();
      if (error) {
        logger.error('Error creating tenant', error);
        return { success: false, error: error.message };
      }
      return { success: true, data: data as Tenant };
    } catch (err: any) {
      logger.error('Unexpected error creating tenant', err);
      return { success: false, error: err.message };
    }
  }

  static async updateTenant(id: string, updates: Partial<Tenant>): Promise<ServiceResponse<Tenant>> {
    try {
      const { data, error } = await supabase.from('companies').update(updates).eq('id', id).select().single();
      if (error) {
        logger.error('Error updating tenant', error);
        return { success: false, error: error.message };
      }
      return { success: true, data: data as Tenant };
    } catch (err: any) {
      logger.error('Unexpected error updating tenant', err);
      return { success: false, error: err.message };
    }
  }

  static async deleteTenant(id: string): Promise<ServiceResponse<null>> {
    try {
      const { error } = await supabase.from('companies').delete().eq('id', id);
      if (error) {
        logger.error('Error deleting tenant', error);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      logger.error('Unexpected error deleting tenant', err);
      return { success: false, error: err.message };
    }
  }
}