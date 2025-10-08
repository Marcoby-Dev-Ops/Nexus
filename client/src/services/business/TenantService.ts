/**
 * Tenant Service
 * Handles multi-tenant company management
 */

import { selectData as select, selectOne, insertOne, updateOne, deleteOne } from '@/lib/api-client';
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

  /**
   * Get all tenants
   */
  static async getTenants(): Promise<ServiceResponse<Tenant[]>> {
    const service = new TenantService();
    return service.executeDbOperation(async () => {
      service.logMethodCall('getTenants', {});

      try {
        const result = await select<Tenant>('companies', '*', {});

        if (!result.success) {
          service.logFailure('getTenants', String(result.error ?? 'Unknown error'));
          return service.handleError<Tenant[]>(result.error ?? 'Unknown error', 'Failed to fetch tenants');
        }

        const tenants = (result.data as Tenant[] | undefined) ?? [];

        service.logSuccess('getTenants', 'loaded', { count: tenants.length });
        return service.createResponse(tenants);
      } catch (error) {
        service.logFailure('getTenants', error instanceof Error ? error.message : String(error));
        return service.handleError<Tenant[]>(error, 'Failed to fetch tenants');
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
        const { data, success, error } = await insertOne<Tenant>('companies', tenant as unknown as Record<string, unknown>);

        if (!success || !data) {
          service.logFailure('createTenant', String(error ?? 'Unknown error'), { name: tenant.name });
          return service.handleError<Tenant>(error ?? 'Unknown error', 'Failed to create tenant');
        }

        service.logSuccess('createTenant', 'created', { tenantId: (data as any).id, name: tenant.name });
        return service.createResponse(data as Tenant);
      } catch (error) {
        service.logFailure('createTenant', error instanceof Error ? error.message : String(error), { name: tenant.name });
        return service.handleError<Tenant>(error, 'Failed to create tenant');
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
        const { data, success, error } = await updateOne<Tenant>('companies', id, updates as Record<string, unknown>, 'id');

        if (!success || !data) {
          service.logFailure('updateTenant', String(error ?? 'Unknown error'), { id });
          return service.handleError<Tenant>(error ?? 'Unknown error', 'Failed to update tenant');
        }

        service.logSuccess('updateTenant', 'updated', { id });
        return service.createResponse(data as Tenant);
      } catch (error) {
        service.logFailure('updateTenant', error instanceof Error ? error.message : String(error), { id });
        return service.handleError<Tenant>(error, 'Failed to update tenant');
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
        const { success, error } = await deleteOne('companies', { id });

        if (!success) {
          service.logFailure('deleteTenant', String(error ?? 'Unknown error'), { id });
          return service.handleError<null>(error ?? 'Unknown error', 'Failed to delete tenant');
        }

        service.logSuccess('deleteTenant', 'deleted', { id });
        return service.createResponse<null>(null);
      } catch (error) {
        service.logFailure('deleteTenant', error instanceof Error ? error.message : String(error), { id });
        return service.handleError<null>(error, 'Failed to delete tenant');
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
        const { success, data, error } = await selectOne<Tenant>('companies', { id });

        if (!success) {
          service.logFailure('getTenantById', String(error ?? 'Not found'), { id });
          return service.createResponse<Tenant | null>(null);
        }

        service.logSuccess('getTenantById', 'loaded', { id });
        return service.createResponse(data ?? null);
      } catch (error) {
        service.logFailure('getTenantById', error instanceof Error ? error.message : String(error), { id });
        return service.handleError<Tenant | null>(error, 'Failed to fetch tenant');
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
        const result = await select<Tenant>('companies', '*', { status });

        if (!result.success) {
          service.logFailure('getTenantsByStatus', String(result.error ?? 'Unknown error'), { status });
          return service.handleError<Tenant[]>(result.error ?? 'Unknown error', 'Failed to fetch tenants by status');
        }

        const tenants = (result.data as Tenant[] | undefined) ?? [];
        service.logSuccess('getTenantsByStatus', 'loaded', { status, count: tenants.length });
        return service.createResponse(tenants);
      } catch (error) {
        service.logFailure('getTenantsByStatus', error instanceof Error ? error.message : String(error), { status });
        return service.handleError<Tenant[]>(error, 'Failed to fetch tenants by status');
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
        const result = await select<Tenant>('companies', '*', { subscription_plan: plan });

        if (!result.success) {
          service.logFailure('getTenantsByPlan', String(result.error ?? 'Unknown error'), { plan });
          return service.handleError<Tenant[]>(result.error ?? 'Unknown error', 'Failed to fetch tenants by plan');
        }

        const tenants = (result.data as Tenant[] | undefined) ?? [];
        service.logSuccess('getTenantsByPlan', 'loaded', { plan, count: tenants.length });
        return service.createResponse(tenants);
      } catch (error) {
        service.logFailure('getTenantsByPlan', error instanceof Error ? error.message : String(error), { plan });
        return service.handleError<Tenant[]>(error, 'Failed to fetch tenants by plan');
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
        const result = await select<Pick<Tenant, 'status' | 'subscription_plan'>>('companies', 'status, subscription_plan', {});

        if (!result.success) {
          service.logFailure('getTenantStats', String(result.error ?? 'Unknown error'));
          return service.handleError(result.error ?? 'Unknown error', 'Failed to fetch tenant stats');
        }

        const tenants = (result.data as Array<Pick<Tenant, 'status' | 'subscription_plan'>> | undefined) ?? [];

        // Calculate statistics
        const totalTenants = tenants.length;
        const activeTenants = tenants.filter(t => t.status === 'active').length;
        const suspendedTenants = tenants.filter(t => t.status === 'suspended').length;
        const pendingTenants = tenants.filter(t => t.status === 'pending').length;

        const byPlan: Record<string, number> = {};
        const byStatus: Record<string, number> = {};

        tenants.forEach((tenant) => {
          const plan = tenant.subscription_plan || 'unknown';
          byPlan[plan] = (byPlan[plan] || 0) + 1;

          const status = tenant.status || 'unknown';
          byStatus[status] = (byStatus[status] || 0) + 1;
        });

        const stats = {
          totalTenants,
          activeTenants,
          suspendedTenants,
          pendingTenants,
          byPlan,
          byStatus,
        };

        service.logSuccess('getTenantStats', 'calculated', stats);
        return service.createResponse(stats);
      } catch (error) {
        service.logFailure('getTenantStats', error instanceof Error ? error.message : String(error));
        return service.handleError(error, 'Failed to fetch tenant stats');
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
        const { success, error } = await updateOne('companies', id, { status: 'suspended', updatedat: new Date().toISOString() }, 'id');

        if (!success) {
          service.logFailure('suspendTenant', String(error ?? 'Unknown error'), { id });
          return service.createResponse<{ success: boolean; error?: string }>({ success: false, error: String(error ?? 'Unknown error') });
        }

        service.logSuccess('suspendTenant', 'suspended', { id, reason });
        return service.createResponse<{ success: boolean }>({ success: true });
      } catch (error) {
        service.logFailure('suspendTenant', error instanceof Error ? error.message : String(error), { id });
        return service.handleError<{ success: boolean; error?: string }>(error, 'Failed to suspend tenant');
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
        const { success, error } = await updateOne('companies', id, { status: 'active', updatedat: new Date().toISOString() }, 'id');

        if (!success) {
          service.logFailure('activateTenant', String(error ?? 'Unknown error'), { id });
          return service.createResponse<{ success: boolean; error?: string }>({ success: false, error: String(error ?? 'Unknown error') });
        }

        service.logSuccess('activateTenant', 'activated', { id });
        return service.createResponse<{ success: boolean }>({ success: true });
      } catch (error) {
        service.logFailure('activateTenant', error instanceof Error ? error.message : String(error), { id });
        return service.handleError<{ success: boolean; error?: string }>(error, 'Failed to activate tenant');
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
        const { data, success, error } = await updateOne<Tenant>(
          'companies',
          id,
          { ...billingInfo, updatedat: new Date().toISOString() } as Record<string, unknown>,
          'id'
        );

        if (!success || !data) {
          service.logFailure('updateTenantBilling', String(error ?? 'Unknown error'), { id });
          return service.handleError<Tenant>(error ?? 'Unknown error', 'Failed to update tenant billing');
        }

        service.logSuccess('updateTenantBilling', 'updated', { id });
        return service.createResponse(data as Tenant);
      } catch (error) {
        service.logFailure('updateTenantBilling', error instanceof Error ? error.message : String(error), { id });
        return service.handleError<Tenant>(error, 'Failed to update tenant billing');
      }
    }, 'updateTenantBilling');
  }
}

// Export singleton instance
export const tenantService = new TenantService();
