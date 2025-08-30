import { useState, useEffect, useCallback } from 'react';
import { IntegrationService } from '../services/IntegrationService';
import type { Integration, CreateIntegrationRequest, UpdateIntegrationRequest, IntegrationFilter } from '../types/integration';

export const useIntegrations = (filter?: IntegrationFilter) => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [service] = useState(() => new IntegrationService());

  const fetchIntegrations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await service.getIntegrations(filter);
      setIntegrations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch integrations');
    } finally {
      setLoading(false);
    }
  }, [service, filter]);

  const createIntegration = useCallback(async (data: CreateIntegrationRequest) => {
    try {
      setError(null);
      const newIntegration = await service.createIntegration(data);
      setIntegrations(prev => [...prev, newIntegration]);
      return newIntegration;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create integration');
      throw err;
    }
  }, [service]);

  const updateIntegration = useCallback(async (id: string, data: UpdateIntegrationRequest) => {
    try {
      setError(null);
      const updatedIntegration = await service.updateIntegration(id, data);
      setIntegrations(prev => 
        prev.map(integration => 
          integration.id === id ? updatedIntegration : integration
        )
      );
      return updatedIntegration;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update integration');
      throw err;
    }
  }, [service]);

  const deleteIntegration = useCallback(async (id: string) => {
    try {
      setError(null);
      await service.deleteIntegration(id);
      setIntegrations(prev => prev.filter(integration => integration.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete integration');
      throw err;
    }
  }, [service]);

  const testIntegration = useCallback(async (id: string) => {
    try {
      setError(null);
      return await service.testIntegration(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to test integration');
      throw err;
    }
  }, [service]);

  const activateIntegration = useCallback(async (id: string) => {
    try {
      setError(null);
      const updatedIntegration = await service.activateIntegration(id);
      setIntegrations(prev => 
        prev.map(integration => 
          integration.id === id ? updatedIntegration : integration
        )
      );
      return updatedIntegration;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to activate integration');
      throw err;
    }
  }, [service]);

  const deactivateIntegration = useCallback(async (id: string) => {
    try {
      setError(null);
      const updatedIntegration = await service.deactivateIntegration(id);
      setIntegrations(prev => 
        prev.map(integration => 
          integration.id === id ? updatedIntegration : integration
        )
      );
      return updatedIntegration;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deactivate integration');
      throw err;
    }
  }, [service]);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  return {
    integrations,
    loading,
    error,
    refetch: fetchIntegrations,
    createIntegration,
    updateIntegration,
    deleteIntegration,
    testIntegration,
    activateIntegration,
    deactivateIntegration,
  };
};
