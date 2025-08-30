import { useState, useEffect, useCallback } from 'react';
import { selectData as select, selectWithOptions } from '@/lib/api-client';
import { logger } from '@/shared/utils/logger';

interface ActionCard {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
  updated_at: string;
}

interface ActionCardsState {
  cards: ActionCard[];
  loading: boolean;
  error: string | null;
}

export const useActionCards = () => {
  const [state, setState] = useState<ActionCardsState>({
    cards: [],
    loading: false,
    error: null,
  });

  const fetchActionCards = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const { data, error } = await select('action_cards', '*');
      
      if (error) {
        logger.error({ error }, 'Failed to fetch action cards');
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: 'Failed to fetch action cards' 
        }));
        return;
      }

      setState(prev => ({ 
        ...prev, 
        cards: data || [], 
        loading: false 
      }));
    } catch (error) {
      logger.error({ error }, 'Error fetching action cards');
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'Failed to fetch action cards' 
      }));
    }
  }, []);

  const fetchActionCardsByCategory = useCallback(async (category: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const { data, error } = await selectWithOptions('action_cards', {
        filter: { category },
        orderBy: { column: 'created_at', ascending: false }
      });
      
      if (error) {
        logger.error({ error, category }, 'Failed to fetch action cards by category');
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: 'Failed to fetch action cards' 
        }));
        return;
      }

      setState(prev => ({ 
        ...prev, 
        cards: data || [], 
        loading: false 
      }));
    } catch (error) {
      logger.error({ error, category }, 'Error fetching action cards by category');
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'Failed to fetch action cards' 
      }));
    }
  }, []);

  useEffect(() => {
    fetchActionCards();
  }, [fetchActionCards]);

  return {
    ...state,
    fetchActionCards,
    fetchActionCardsByCategory,
  };
}; 
