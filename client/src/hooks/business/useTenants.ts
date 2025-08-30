import { useState, useCallback } from 'react';
import { serviceRegistry } from '@/core/services/ServiceRegistry';
import { useNotifications } from '@/shared/hooks/NotificationContext';
import type { Tenant } from '@/services/business/TenantService';

export function useTenants() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addNotification } = useNotifications();

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await serviceRegistry.tenant.getTenants();
      if (result.success && result.data) {
        setTenants(result.data);
      } else {
        setError(result.error || 'Failed to fetch tenants');
        addNotification({
          type: 'error',
          title: 'Error',
          message: result.error || 'Failed to fetch tenants'
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch tenants';
      setError(errorMessage);
      addNotification({
        type: 'error',
        title: 'Error',
        message: errorMessage
      });
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  const createTenant = useCallback(async (tenant: Omit<Tenant, 'id' | 'createdat' | 'updatedat'>) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await serviceRegistry.tenant.createTenant(tenant);
      if (result.success && result.data) {
        setTenants(prev => [...prev, result.data!]);
        addNotification({
          type: 'success',
          title: 'Success',
          message: 'Tenant created successfully'
        });
      } else {
        setError(result.error || 'Failed to create tenant');
        addNotification({
          type: 'error',
          title: 'Error',
          message: result.error || 'Failed to create tenant'
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create tenant';
      setError(errorMessage);
      addNotification({
        type: 'error',
        title: 'Error',
        message: errorMessage
      });
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  const updateTenant = useCallback(async (id: string, updates: Partial<Tenant>) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await serviceRegistry.tenant.updateTenant(id, updates);
      if (result.success && result.data) {
        setTenants(prev => prev.map(tenant => 
          tenant.id === id ? result.data! : tenant
        ));
        addNotification({
          type: 'success',
          title: 'Success',
          message: 'Tenant updated successfully'
        });
      } else {
        setError(result.error || 'Failed to update tenant');
        addNotification({
          type: 'error',
          title: 'Error',
          message: result.error || 'Failed to update tenant'
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update tenant';
      setError(errorMessage);
      addNotification({
        type: 'error',
        title: 'Error',
        message: errorMessage
      });
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  const deleteTenant = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await serviceRegistry.tenant.deleteTenant(id);
      if (result.success) {
        setTenants(prev => prev.filter(tenant => tenant.id !== id));
        addNotification({
          type: 'success',
          title: 'Success',
          message: 'Tenant deleted successfully'
        });
      } else {
        setError(result.error || 'Failed to delete tenant');
        addNotification({
          type: 'error',
          title: 'Error',
          message: result.error || 'Failed to delete tenant'
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete tenant';
      setError(errorMessage);
      addNotification({
        type: 'error',
        title: 'Error',
        message: errorMessage
      });
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  return { tenants, loading, error, fetchTenants, createTenant, updateTenant, deleteTenant, setTenants };
}
