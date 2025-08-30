import { useState, useCallback } from 'react';
import { selectData, selectOne, insertOne, updateOne, deleteOne } from '@/lib/api-client';
import { logger } from '@/shared/utils/logger';

interface CompanyOwnership {
  id: string;
  company_id: string;
  owner_id: string;
  ownership_percentage: number;
  created_at: string;
  updated_at: string;
}

export const useCompanyOwnership = () => {
  const [ownerships, setOwnerships] = useState<CompanyOwnership[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOwnerships = useCallback(async (companyId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await selectData('company_ownership', '*', { company_id: companyId });
      if (error) {
        logger.error({ error }, 'Failed to fetch company ownerships');
        setError('Failed to fetch ownerships');
        return;
      }
      setOwnerships(data || []);
    } catch (err) {
      logger.error({ err }, 'Error fetching company ownerships');
      setError('Error fetching ownerships');
    } finally {
      setLoading(false);
    }
  }, []);

  const getOwnership = useCallback(async (id: string) => {
    try {
      const { data, error } = await selectOne('company_ownership', id);
      if (error) {
        logger.error({ error }, 'Failed to fetch ownership');
        return null;
      }
      return data;
    } catch (err) {
      logger.error({ err }, 'Error fetching ownership');
      return null;
    }
  }, []);

  const createOwnership = useCallback(async (ownershipData: Omit<CompanyOwnership, 'id' | 'created_at' | 'updated_at'>) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await insertOne('company_ownership', ownershipData);
      if (error) {
        logger.error({ error }, 'Failed to create ownership');
        setError('Failed to create ownership');
        return null;
      }
      setOwnerships(prev => [...prev, data]);
      return data;
    } catch (err) {
      logger.error({ err }, 'Error creating ownership');
      setError('Error creating ownership');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateOwnership = useCallback(async (id: string, updates: Partial<CompanyOwnership>) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await updateOne('company_ownership', id, updates);
      if (error) {
        logger.error({ error }, 'Failed to update ownership');
        setError('Failed to update ownership');
        return null;
      }
      setOwnerships(prev => prev.map(ownership => (ownership.id === id ? { ...ownership, ...updates } : ownership)));
      return data;
    } catch (err) {
      logger.error({ err }, 'Error updating ownership');
      setError('Error updating ownership');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteOwnership = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await deleteOne('company_ownership', id);
      if (error) {
        logger.error({ error }, 'Failed to delete ownership');
        setError('Failed to delete ownership');
        return false;
      }
      setOwnerships(prev => prev.filter(ownership => ownership.id !== id));
      return true;
    } catch (err) {
      logger.error({ err }, 'Error deleting ownership');
      setError('Error deleting ownership');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    ownerships,
    loading,
    error,
    fetchOwnerships,
    getOwnership,
    createOwnership,
    updateOwnership,
    deleteOwnership,
  };
}; 
