import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks';
import { personalThoughtsService, type PersonalThought, type CreatePersonalThought } from '@/core/services/PersonalThoughtsService';
import { useNotifications } from './NotificationContext';

/**
 * React hook for managing personal thoughts
 * 
 * Provides a clean interface for CRUD operations on personal thoughts
 * using the service layer architecture.
 */
export const usePersonalThoughts = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [thoughts, setThoughts] = useState<PersonalThought[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch thoughts for the current user
   */
  const fetchThoughts = useCallback(async (filters?: {
    company_id?: string;
    tags?: string[];
    limit?: number;
  }) => {
    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await personalThoughtsService.list({
        userid: user.id,
        ...filters,
      });

      if (result.success) {
        setThoughts(result.data || []);
      } else {
        setError(result.error || 'Failed to fetch thoughts');
        addNotification({
          type: 'error',
          title: 'Error',
          message: result.error || 'Failed to fetch thoughts'
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
  }, [user?.id, addNotification]);

  /**
   * Create a new thought
   */
  const createThought = useCallback(async (data: Omit<CreatePersonalThought, 'userid'>) => {
    if (!user?.id) {
      setError('User not authenticated');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await personalThoughtsService.create({
        ...data,
        userid: user.id,
      });

      if (result.success && result.data) {
        setThoughts(prev => [result.data!, ...prev]);
        addNotification({
          type: 'success',
          title: 'Success',
          message: 'Thought created successfully'
        });
        return result.data;
      } else {
        setError(result.error || 'Failed to create thought');
        addNotification({
          type: 'error',
          title: 'Error',
          message: result.error || 'Failed to create thought'
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
  }, [user?.id, addNotification]);

  /**
   * Update an existing thought
   */
  const updateThought = useCallback(async (id: string, data: Partial<CreatePersonalThought>) => {
    setLoading(true);
    setError(null);

    try {
      const result = await personalThoughtsService.update(id, data);

      if (result.success && result.data) {
        setThoughts(prev => prev.map(thought => 
          thought.id === id ? result.data! : thought
        ));
        addNotification({
          type: 'success',
          title: 'Success',
          message: 'Thought updated successfully'
        });
        return result.data;
      } else {
        setError(result.error || 'Failed to update thought');
        addNotification({
          type: 'error',
          title: 'Error',
          message: result.error || 'Failed to update thought'
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
  }, [addNotification]);

  /**
   * Delete a thought
   */
  const deleteThought = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await personalThoughtsService.delete(id);

      if (result.success) {
        setThoughts(prev => prev.filter(thought => thought.id !== id));
        addNotification({
          type: 'success',
          title: 'Success',
          message: 'Thought deleted successfully'
        });
        return true;
      } else {
        setError(result.error || 'Failed to delete thought');
        addNotification({
          type: 'error',
          title: 'Error',
          message: result.error || 'Failed to delete thought'
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
  }, [addNotification]);

  /**
   * Search thoughts
   */
  const searchThoughts = useCallback(async (query: string, filters?: {
    company_id?: string;
    limit?: number;
  }) => {
    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await personalThoughtsService.search(query, {
        userid: user.id,
        ...filters,
      });

      if (result.success) {
        setThoughts(result.data || []);
      } else {
        setError(result.error || 'Failed to search thoughts');
        addNotification({
          type: 'error',
          title: 'Error',
          message: result.error || 'Failed to search thoughts'
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
  }, [user?.id, addNotification]);

  /**
   * Get recent thoughts
   */
  const getRecentThoughts = useCallback(async (limit: number = 10) => {
    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await personalThoughtsService.getRecentThoughts(user.id, limit);

      if (result.success) {
        setThoughts(result.data || []);
      } else {
        setError(result.error || 'Failed to fetch recent thoughts');
        addNotification({
          type: 'error',
          title: 'Error',
          message: result.error || 'Failed to fetch recent thoughts'
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
  }, [user?.id, addNotification]);

  /**
   * Get thoughts by tags
   */
  const getThoughtsByTags = useCallback(async (tags: string[]) => {
    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await personalThoughtsService.getThoughtsByTags(user.id, tags);

      if (result.success) {
        setThoughts(result.data || []);
      } else {
        setError(result.error || 'Failed to fetch thoughts by tags');
        addNotification({
          type: 'error',
          title: 'Error',
          message: result.error || 'Failed to fetch thoughts by tags'
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
  }, [user?.id, addNotification]);

  // Auto-fetch thoughts on mount
  useEffect(() => {
    if (user?.id) {
      fetchThoughts();
    }
  }, [user?.id, fetchThoughts]);

  return {
    // State
    thoughts,
    loading,
    error,

    // Actions
    fetchThoughts,
    createThought,
    updateThought,
    deleteThought,
    searchThoughts,
    getRecentThoughts,
    getThoughtsByTags,

    // Computed values
    hasThoughts: thoughts.length > 0,
    thoughtCount: thoughts.length,
  };
};

export default usePersonalThoughts; 
