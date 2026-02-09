import { useState, useCallback } from 'react';
import { selectData, insertOne, updateOne, deleteOne } from '@/lib/api-client';
import { logger } from '@/shared/utils/logger';

interface Thought {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  category?: string;
  status?: string;
  priority?: string;
}

export const useThoughts = () => {
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchThoughts = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await selectData('personal_thoughts', { filters: { user_id: userId } });
      if (error) {
        logger.error({ error }, 'Failed to fetch thoughts');
        setError('Failed to fetch thoughts');
        setThoughts([]);
        return;
      }
      setThoughts(data || []);
    } catch (err) {
      logger.error({ err }, 'Error fetching thoughts');
      setError('Error fetching thoughts');
      setThoughts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const addThought = useCallback(async (thought: Omit<Thought, 'id' | 'created_at' | 'updated_at'>) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await insertOne('personal_thoughts', thought);
      if (error) {
        logger.error({ error }, 'Failed to add thought');
        setError('Failed to add thought');
        return;
      }
      setThoughts(prev => [...prev, data]);
    } catch (err) {
      logger.error({ err }, 'Error adding thought');
      setError('Error adding thought');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateThought = useCallback(async (id: string, updates: Partial<Thought>) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await updateOne('personal_thoughts', id, updates);
      if (error) {
        logger.error({ error }, 'Failed to update thought');
        setError('Failed to update thought');
        return;
      }
      setThoughts(prev => prev.map(thought => (thought.id === id ? { ...thought, ...updates } : thought)));
    } catch (err) {
      logger.error({ err }, 'Error updating thought');
      setError('Error updating thought');
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteThought = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await deleteOne('personal_thoughts', id);
      if (error) {
        logger.error({ error }, 'Failed to delete thought');
        setError('Failed to delete thought');
        return;
      }
      setThoughts(prev => prev.filter(thought => thought.id !== id));
    } catch (err) {
      logger.error({ err }, 'Error deleting thought');
      setError('Error deleting thought');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    thoughts,
    loading,
    error,
    fetchThoughts,
    addThought,
    updateThought,
    deleteThought,
  };
}; 
