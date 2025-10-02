/**
 * Tenant Service
 * Handles multi-tenant company management
 */

import { selectData as select, selectOne, insertOne, updateOne, deleteOne, callEdgeFunction } from '@/lib/api-client';
import { BaseService, type ServiceResponse } from '@/core/services/BaseService';

// ============================================================================
// INTERFACES
// ============================================================================

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

// ============================================================================
// TENANT SERVICE CLASS
// ============================================================================

export class TenantService extends BaseService {
  constructor() {
    super('TenantService');
  }

  /**
   * Get all tenants
   */
  static async getTenants(): Promise<ServiceResponse<Tenant[]>> {
    const service = new TenantService();
    return service.executeDbOperation(async () => {
      service.logMethodCall('getTenants', {});

      try {
        const { data, error } = await service.supabase
          .from('companies')
          .select('*');

        if (error) {
          service.logFailure('getTenants', error);
          return { data: null, error };
        }

        // Transform data to match Tenant interface if needed
        const tenants = data as Tenant[] || [];

        service.logSuccess('getTenants', { count: tenants.length });
        return { data: tenants, error: null };
      } catch (error) {
        service.logFailure('getTenants', error);
        return { data: null, error };
      }
    }, 'getTenants');
  }

  /**
   * Create a new tenant
   */
  static async createTenant(tenant: Omit<Tenant, 'id' | 'createdat' | 'updatedat'>): Promise<ServiceResponse<Tenant>> {
    const service = new TenantService();
    return service.executeDbOperation(async () => {
      service.logMethodCall('createTenant', { name: tenant.name });

      try {
        const { data, error } = await service.supabase
          .from('companies')
          .insert(tenant)
          .select()
          .single();

        if (error) {
          service.logFailure('createTenant', error, { name: tenant.name });
          return { data: null, error };
        }

        service.logSuccess('createTenant', { 
          tenantId: data.id, 
          name: tenant.name 
        });
        return { data: data as Tenant, error: null };
      } catch (error) {
        service.logFailure('createTenant', error, { name: tenant.name });
        return { data: null, error };
      }
    }, 'createTenant');
  }

  /**
   * Update a tenant
   */
  static async updateTenant(id: string, updates: Partial<Tenant>): Promise<ServiceResponse<Tenant>> {
    const service = new TenantService();
    return service.executeDbOperation(async () => {
      service.logMethodCall('updateTenant', { id, updates });

      try {
        const { data, error } = await service.supabase
          .from('companies')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          service.logFailure('updateTenant', error, { id });
          return { data: null, error };
        }

        service.logSuccess('updateTenant', { id });
        return { data: data as Tenant, error: null };
      } catch (error) {
        service.logFailure('updateTenant', error, { id });
        return { data: null, error };
      }
    }, 'updateTenant');
  }

  /**
   * Delete a tenant
   */
  static async deleteTenant(id: string): Promise<ServiceResponse<null>> {
    const service = new TenantService();
    return service.executeDbOperation(async () => {
      service.logMethodCall('deleteTenant', { id });

      try {
        const { error } = await service.supabase
          .from('companies')
          .delete()
          .eq('id', id);

        if (error) {
          service.logFailure('deleteTenant', error, { id });
          return { data: null, error };
        }

        service.logSuccess('deleteTenant', { id });
        return { data: null, error: null };
      } catch (error) {
        service.logFailure('deleteTenant', error, { id });
        return { data: null, error };
      }
    }, 'deleteTenant');
  }

  /**
   * Get tenant by ID
   */
  static async getTenantById(id: string): Promise<ServiceResponse<Tenant | null>> {
    const service = new TenantService();
    return service.executeDbOperation(async () => {
      service.logMethodCall('getTenantById', { id });

      try {
        const { data, error } = await service.supabase
          .from('companies')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          service.logFailure('getTenantById', error, { id });
          return { data: null, error };
        }

        service.logSuccess('getTenantById', { id });
        return { data: data as Tenant, error: null };
      } catch (error) {
        service.logFailure('getTenantById', error, { id });
        return { data: null, error };
      }
    }, 'getTenantById');
  }

  /**
   * Get tenants by status
   */
  static async getTenantsByStatus(status: Tenant['status']): Promise<ServiceResponse<Tenant[]>> {
    const service = new TenantService();
    return service.executeDbOperation(async () => {
      service.logMethodCall('getTenantsByStatus', { status });

      try {
        const { data, error } = await service.supabase
          .from('companies')
          .select('*')
          .eq('status', status);

        if (error) {
          service.logFailure('getTenantsByStatus', error, { status });
          return { data: null, error };
        }

        service.logSuccess('getTenantsByStatus', { 
          status, 
          count: data?.length || 0 
        });
        return { data: data as Tenant[] || [], error: null };
      } catch (error) {
        service.logFailure('getTenantsByStatus', error, { status });
        return { data: null, error };
      }
    }, 'getTenantsByStatus');
  }

  /**
   * Get tenants by subscription plan
   */
  static async getTenantsByPlan(plan: Tenant['subscription_plan']): Promise<ServiceResponse<Tenant[]>> {
    const service = new TenantService();
    return service.executeDbOperation(async () => {
      service.logMethodCall('getTenantsByPlan', { plan });

      try {
        const { data, error } = await service.supabase
          .from('companies')
          .select('*')
          .eq('subscription_plan', plan);

        if (error) {
          service.logFailure('getTenantsByPlan', error, { plan });
          return { data: null, error };
        }

        service.logSuccess('getTenantsByPlan', { 
          plan, 
          count: data?.length || 0 
        });
        return { data: data as Tenant[] || [], error: null };
      } catch (error) {
        service.logFailure('getTenantsByPlan', error, { plan });
        return { data: null, error };
      }
    }, 'getTenantsByPlan');
  }

  /**
   * Get tenant statistics
   */
  static async getTenantStats(): Promise<ServiceResponse<{
    totalTenants: number;
    activeTenants: number;
    suspendedTenants: number;
    pendingTenants: number;
    byPlan: Record<string, number>;
    byStatus: Record<string, number>;
  }>> {
    const service = new TenantService();
    return service.executeDbOperation(async () => {
      service.logMethodCall('getTenantStats', {});

      try {
        // Get all tenants
        const { data: tenants, error } = await service.supabase
          .from('companies')
          .select('status, subscription_plan');

        if (error) {
          service.logFailure('getTenantStats', error);
          return { data: null, error };
        }

        // Calculate statistics
        const totalTenants = tenants?.length || 0;
        const activeTenants = tenants?.filter(t => t.status === 'active').length || 0;
        const suspendedTenants = tenants?.filter(t => t.status === 'suspended').length || 0;
        const pendingTenants = tenants?.filter(t => t.status === 'pending').length || 0;

        const byPlan: Record<string, number> = {};
        const byStatus: Record<string, number> = {};

        tenants?.forEach(tenant => {
          // Count by plan
          const plan = tenant.subscription_plan || 'unknown';
          byPlan[plan] = (byPlan[plan] || 0) + 1;

          // Count by status
          const status = tenant.status || 'unknown';
          byStatus[status] = (byStatus[status] || 0) + 1;
        });

        const stats = {
          totalTenants,
          activeTenants,
          suspendedTenants,
          pendingTenants,
          byPlan,
          byStatus
        };

        service.logSuccess('getTenantStats', stats);
        return { data: stats, error: null };
      } catch (error) {
        service.logFailure('getTenantStats', error);
        return { data: null, error };
      }
    }, 'getTenantStats');
  }

  /**
   * Suspend a tenant
   */
  static async suspendTenant(id: string, reason?: string): Promise<ServiceResponse<{ success: boolean; error?: string }>> {
    const service = new TenantService();
    return service.executeDbOperation(async () => {
      service.logMethodCall('suspendTenant', { id, reason });

      try {
        const { error } = await service.supabase
          .from('companies')
          .update({ 
            status: 'suspended',
            updatedat: new Date().toISOString()
          })
          .eq('id', id);

        if (error) {
          service.logFailure('suspendTenant', error, { id });
          return { 
            data: { 
              success: false, 
              error: error.message 
            }, 
            error: null 
          };
        }

        service.logSuccess('suspendTenant', { id, reason });
        return { 
          data: { success: true }, 
          error: null 
        };
      } catch (error) {
        service.logFailure('suspendTenant', error, { id });
        return { data: null, error };
      }
    }, 'suspendTenant');
  }

  /**
   * Activate a tenant
   */
  static async activateTenant(id: string): Promise<ServiceResponse<{ success: boolean; error?: string }>> {
    const service = new TenantService();
    return service.executeDbOperation(async () => {
      service.logMethodCall('activateTenant', { id });

      try {
        const { error } = await service.supabase
          .from('companies')
          .update({ 
            status: 'active',
            updatedat: new Date().toISOString()
          })
          .eq('id', id);

        if (error) {
          service.logFailure('activateTenant', error, { id });
          return { 
            data: { 
              success: false, 
              error: error.message 
            }, 
            error: null 
          };
        }

        service.logSuccess('activateTenant', { id });
        return { 
          data: { success: true }, 
          error: null 
        };
      } catch (error) {
        service.logFailure('activateTenant', error, { id });
        return { data: null, error };
      }
    }, 'activateTenant');
  }

  /**
   * Update tenant billing information
   */
  static async updateTenantBilling(
    id: string, 
    billingInfo: Partial<Pick<Tenant, 
      'billing_status' | 
      'subscription_plan' | 
      'monthly_revenue' | 
      'next_billing_date' | 
      'contract_end_date' | 
      'contract_value'
    >>
  ): Promise<ServiceResponse<Tenant>> {
    const service = new TenantService();
    return service.executeDbOperation(async () => {
      service.logMethodCall('updateTenantBilling', { id, billingInfo });

      try {
        const { data, error } = await service.supabase
          .from('companies')
          .update({
            ...billingInfo,
            updatedat: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single();

        if (error) {
          service.logFailure('updateTenantBilling', error, { id });
          return { data: null, error };
        }

        service.logSuccess('updateTenantBilling', { id });
        return { data: data as Tenant, error: null };
      } catch (error) {
        service.logFailure('updateTenantBilling', error, { id });
        return { data: null, error };
      }
    }, 'updateTenantBilling');
  }
}

// Export singleton instance
export const tenantService = new TenantService();
