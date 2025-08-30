/**
 * World-Class User Management Hook
 * 
 * Provides comprehensive user management features inspired by:
 * - Google Workspace Admin Console
 * - Microsoft 365 Admin Center
 * - Modern SaaS platforms
 */

import { useState, useCallback } from 'react';
import { selectData, selectOne, insertOne, updateOne, deleteOne } from '@/lib/api-client';
import { logger } from '@/shared/utils/logger';

interface User {
  id: string;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export const useUserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await selectData('users');
      if (error) {
        logger.error({ error }, 'Failed to fetch users');
        setError('Failed to fetch users');
        return;
      }
      setUsers(data || []);
    } catch (err) {
      logger.error({ err }, 'Error fetching users');
      setError('Error fetching users');
    } finally {
      setLoading(false);
    }
  }, []);

  const getUser = useCallback(async (id: string) => {
    try {
      const { data, error } = await selectOne('users', id);
      if (error) {
        logger.error({ error }, 'Failed to fetch user');
        return null;
      }
      return data;
    } catch (err) {
      logger.error({ err }, 'Error fetching user');
      return null;
    }
  }, []);

  const createUser = useCallback(async (userData: Omit<User, 'id' | 'created_at' | 'updated_at'>) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await insertOne('users', userData);
      if (error) {
        logger.error({ error }, 'Failed to create user');
        setError('Failed to create user');
        return null;
      }
      setUsers(prev => [...prev, data]);
      return data;
    } catch (err) {
      logger.error({ err }, 'Error creating user');
      setError('Error creating user');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUser = useCallback(async (id: string, updates: Partial<User>) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await updateOne('users', id, updates);
      if (error) {
        logger.error({ error }, 'Failed to update user');
        setError('Failed to update user');
        return null;
      }
      setUsers(prev => prev.map(user => (user.id === id ? { ...user, ...updates } : user)));
      return data;
    } catch (err) {
      logger.error({ err }, 'Error updating user');
      setError('Error updating user');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteUser = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await deleteOne('users', id);
      if (error) {
        logger.error({ error }, 'Failed to delete user');
        setError('Failed to delete user');
        return false;
      }
      setUsers(prev => prev.filter(user => user.id !== id));
      return true;
    } catch (err) {
      logger.error({ err }, 'Error deleting user');
      setError('Error deleting user');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    users,
    loading,
    error,
    fetchUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
  };
}; 
