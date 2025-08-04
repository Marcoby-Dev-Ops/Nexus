import { useState, useCallback } from 'react';
import type { ServiceResponse } from '@/core/services/BaseService';
import { useNotifications } from './NotificationContext';
import { UserService } from '@/services/business';
import { CompanyService } from '@/services/business';
import { BillingService } from '@/services/business';
import { AnalyticsService } from '@/services/analytics';
// import { IntegrationService } from '@/services/integrations';
import { NotificationService } from '@/services/business';
import { AIService } from '@/services/ai';
import { TaskService } from '@/services/tasks';
import { ContactService } from '@/services/business';
import { DealService } from '@/services/business';
import { AuthService } from '@/core/auth';
import { CalendarService } from '@/services/business';
import { EmailService } from '@/services/email';
import { OAuthTokenService } from '@/core/auth';

// Service registry for standalone approach
const serviceRegistry = {
  user: new UserService(),
  company: new CompanyService(),
  billing: new BillingService(),
  analytics: new AnalyticsService(),
  // integrations: new IntegrationService(),
  notifications: new NotificationService(),
  ai: new AIService(),
  tasks: new TaskService(),
  contacts: new ContactService(),
  deals: new DealService(),
  auth: new AuthService(),
  calendar: new CalendarService(),
  email: new EmailService(),
  oauthTokens: new OAuthTokenService(),
} as const;

type ServiceName = keyof typeof serviceRegistry;

export const useService = <T = any>(serviceName: ServiceName) => {
  const service = serviceRegistry[serviceName];
  if (!service) {
    throw new Error(`Service '${serviceName}' not found. Available services: ${Object.keys(serviceRegistry).join(', ')}`);
  }
  return service;
};

export const useServiceGet = <T = any>(serviceName: ServiceName, id: string) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addNotification } = useNotifications();

  const service = useService<T>(serviceName);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await service.get(id);
      
      if (result.success) {
        setData(result.data as T);
      } else {
        setError(result.error || 'Failed to fetch data');
        addNotification({
          type: 'error',
          title: 'Error',
          message: result.error || 'Failed to fetch data'
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      addNotification({
        type: 'error',
        title: 'Error',
        message: errorMessage
      });
    } finally {
      setLoading(false);
    }
  }, [service, id, addNotification]);

  return { data, loading, error, refetch: fetchData };
};

export const useServiceList = <T = any>(serviceName: ServiceName, filters?: Record<string, any>) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addNotification } = useNotifications();

  const service = useService<T>(serviceName);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await service.list(filters);
      
      if (result.success) {
        setData(result.data as T[]);
      } else {
        setError(result.error || 'Failed to fetch data');
        addNotification({
          type: 'error',
          title: 'Error',
          message: result.error || 'Failed to fetch data'
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      addNotification({
        type: 'error',
        title: 'Error',
        message: errorMessage
      });
    } finally {
      setLoading(false);
    }
  }, [service, filters, addNotification]);

  return { data, loading, error, refetch: fetchData };
};

export const useServiceCreate = <T = any>(serviceName: ServiceName) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addNotification } = useNotifications();

  const service = useService<T>(serviceName);

  const create = useCallback(async (data: Partial<T>) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await service.create(data);
      
      if (result.success) {
        addNotification({
          type: 'success',
          title: 'Success',
          message: 'Item created successfully'
        });
        return result.data;
      } else {
        setError(result.error || 'Failed to create item');
        addNotification({
          type: 'error',
          title: 'Error',
          message: result.error || 'Failed to create item'
        });
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      addNotification({
        type: 'error',
        title: 'Error',
        message: errorMessage
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [service, addNotification]);

  return { create, loading, error };
};

export const useServiceUpdate = <T = any>(serviceName: ServiceName) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addNotification } = useNotifications();

  const service = useService<T>(serviceName);

  const update = useCallback(async (id: string, data: Partial<T>) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await service.update(id, data);
      
      if (result.success) {
        addNotification({
          type: 'success',
          title: 'Success',
          message: 'Item updated successfully'
        });
        return result.data;
      } else {
        setError(result.error || 'Failed to update item');
        addNotification({
          type: 'error',
          title: 'Error',
          message: result.error || 'Failed to update item'
        });
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      addNotification({
        type: 'error',
        title: 'Error',
        message: errorMessage
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [service, addNotification]);

  return { update, loading, error };
};

export const useServiceDelete = <T = any>(serviceName: ServiceName) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addNotification } = useNotifications();

  const service = useService<T>(serviceName);

  const remove = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await service.delete(id);
      
      if (result.success) {
        addNotification({
          type: 'success',
          title: 'Success',
          message: 'Item deleted successfully'
        });
        return true;
      } else {
        setError(result.error || 'Failed to delete item');
        addNotification({
          type: 'error',
          title: 'Error',
          message: result.error || 'Failed to delete item'
        });
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      addNotification({
        type: 'error',
        title: 'Error',
        message: errorMessage
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [service, addNotification]);

  return { remove, loading, error };
}; 