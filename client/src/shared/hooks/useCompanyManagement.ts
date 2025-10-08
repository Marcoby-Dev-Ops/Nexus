/**
 * World-Class Company Management Hook
 * 
 * Extends user management with comprehensive organizational structure,
 * inspired by Google Workspace, Microsoft 365, and modern SaaS platforms.
 */

import { useState, useCallback } from 'react';
import { selectData as select, selectOne, insertOne, updateOne, deleteOne } from '@/lib/api-client';
import { logger } from '@/shared/utils/logger';

interface Company {
  id: string;
  name: string;
  industry: string;
  size: string;
  created_at: string;
  updated_at: string;
}

export const useCompanyManagement = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await select('companies', '*');
      if (error) {
        logger.error({ error }, 'Failed to fetch companies');
        setError('Failed to fetch companies');
        return;
      }
      setCompanies(data || []);
    } catch (err) {
      logger.error({ err }, 'Error fetching companies');
      setError('Error fetching companies');
    } finally {
      setLoading(false);
    }
  }, []);

  const getCompany = useCallback(async (id: string) => {
    try {
      const { data, error } = await selectOne('companies', id);
      if (error) {
        logger.error({ error }, 'Failed to fetch company');
        return null;
      }
      return data;
    } catch (err) {
      logger.error({ err }, 'Error fetching company');
      return null;
    }
  }, []);

  const createCompany = useCallback(async (companyData: Omit<Company, 'id' | 'created_at' | 'updated_at'>) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await insertOne('companies', companyData);
      if (error) {
        logger.error({ error }, 'Failed to create company');
        setError('Failed to create company');
        return null;
      }
      setCompanies(prev => [...prev, data]);
      return data;
    } catch (err) {
      logger.error({ err }, 'Error creating company');
      setError('Error creating company');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCompany = useCallback(async (id: string, updates: Partial<Company>) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await updateOne('companies', id, updates);
      if (error) {
        logger.error({ error }, 'Failed to update company');
        setError('Failed to update company');
        return null;
      }
      setCompanies(prev => prev.map(company => (company.id === id ? { ...company, ...updates } : company)));
      return data;
    } catch (err) {
      logger.error({ err }, 'Error updating company');
      setError('Error updating company');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteCompany = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await deleteOne('companies', id);
      if (error) {
        logger.error({ error }, 'Failed to delete company');
        setError('Failed to delete company');
        return false;
      }
      setCompanies(prev => prev.filter(company => company.id !== id));
      return true;
    } catch (err) {
      logger.error({ err }, 'Error deleting company');
      setError('Error deleting company');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    companies,
    loading,
    error,
    fetchCompanies,
    getCompany,
    createCompany,
    updateCompany,
    deleteCompany,
  };
}; 
