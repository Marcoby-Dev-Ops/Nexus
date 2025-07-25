import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth.ts';

export interface Thought {
  id: string;
  userid: string;
  createdby: string;
  updatedby: string;
  content: string;
  category: 'idea' | 'task' | 'reminder' | 'update';
  status: 'future_goals' | 'concept' | 'in_progress' | 'completed' | 'pending' | 'reviewed' | 'implemented' | 'not_started' | 'upcoming' | 'due' | 'overdue';
  personal_or_professional?: 'personal' | 'professional';
  mainsubcategories: string[];
  initiative: boolean;
  impact?: string;
  parent_idea_id?: string;
  workflow_stage?: 'create_idea' | 'update_idea' | 'implement_idea' | 'achievement';
  department?: string;
  priority?: 'low' | 'medium' | 'high';
  estimated_effort?: string;
  aiinsights: Record<string, unknown>;
  interaction_method?: 'text' | 'speech' | 'copy_paste' | 'upload';
  ai_clarification_data?: Record<string, unknown>;
  creationdate: Date;
  lastupdated: Date;
  createdat: Date;
  updatedat: Date;
}

export interface CreateThoughtRequest {
  content: string;
  category: Thought['category'];
  status?: Thought['status'];
  personal_or_professional?: 'personal' | 'professional';
  main_sub_categories?: string[];
  initiative?: boolean;
  impact?: string;
  parent_idea_id?: string;
  workflow_stage?: Thought['workflow_stage'];
  department?: string;
  priority?: 'low' | 'medium' | 'high';
  estimated_effort?: string;
  interaction_method?: 'text' | 'speech' | 'copy_paste' | 'upload';
}

export interface UpdateThoughtRequest {
  content?: string;
  category?: Thought['category'];
  status?: Thought['status'];
  personal_or_professional?: 'personal' | 'professional';
  main_sub_categories?: string[];
  initiative?: boolean;
  impact?: string;
  parent_idea_id?: string;
  workflow_stage?: Thought['workflow_stage'];
  department?: string;
  priority?: 'low' | 'medium' | 'high';
  estimated_effort?: string;
  ai_insights?: Record<string, unknown>;
  ai_clarification_data?: Record<string, unknown>;
}

export interface ThoughtFilters {
  category?: Thought['category'];
  status?: Thought['status'];
  personal_or_professional?: 'personal' | 'professional';
  department?: string;
  priority?: 'low' | 'medium' | 'high';
  initiative?: boolean;
  search_text?: string;
  user_id?: string;
}

export interface ThoughtsResponse {
  thoughts: Thought[];
  totalcount: number;
  hasmore: boolean;
}

export interface ThoughtMetrics {
  totalthoughts: number;
  bycategory: Record<string, number>;
  bystatus: Record<string, number>;
  bypriority: Record<string, number>;
  recentactivity: number;
  completionrate: number;
}

export const useThoughts = () => {
  const { user } = useAuth();
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<ThoughtMetrics | null>(null);

  // Fetch thoughts with filters
  const fetchThoughts = useCallback(async (
    filters: Partial<ThoughtFilters> = {},
    limit = 100,
    offset = 0
  ): Promise<ThoughtsResponse> => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('thoughts')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.personal_or_professional) {
        query = query.eq('personal_or_professional', filters.personal_or_professional);
      }
      if (filters.department) {
        query = query.eq('department', filters.department);
      }
      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters.initiative !== undefined) {
        query = query.eq('initiative', filters.initiative);
      }
      if (filters.search_text) {
        query = query.ilike('content', `%${filters.search_text}%`);
      }

      // Apply pagination
      if (limit) {
        query = query.limit(limit);
      }
      if (offset) {
        query = query.range(offset, offset + limit - 1);
      }

      const { data, count, error: queryError } = await query;

      if (queryError) {
        throw queryError;
      }

      const response: ThoughtsResponse = {
        thoughts: (data as Thought[]) || [],
        totalcount: count || 0,
        hasmore: !!(count && offset + limit < count)
      };

      setThoughts(response.thoughts);
      return response;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message: 'Failed to fetch thoughts';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Create a new thought
  const createThought = useCallback(async (thoughtData: CreateThoughtRequest): Promise<Thought> => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      const newThought = {
        ...thoughtData,
        userid: user.id,
        createdby: user.id,
        updatedby: user.id,
        mainsub_categories: thoughtData.main_sub_categories || [],
        initiative: thoughtData.initiative || false,
        aiinsights: {},
        interactionmethod: thoughtData.interaction_method || 'text',
        aiclarification_data: {},
        creationdate: new Date().toISOString(),
        lastupdated: new Date().toISOString()
      };

      const { data, error: insertError } = await supabase
        .from('thoughts')
        .insert(newThought)
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      const createdThought = data as Thought;
      setThoughts(prev => [createdThought, ...prev]);
      
      // Refresh metrics
      await fetchMetrics();
      
      return createdThought;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message: 'Failed to create thought';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Update a thought
  const updateThought = useCallback(async (thoughtId: string, updates: UpdateThoughtRequest): Promise<Thought> => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      const updateData = {
        ...updates,
        updatedby: user.id,
        lastupdated: new Date().toISOString()
      };

      const { data, error: updateError } = await supabase
        .from('thoughts')
        .update(updateData)
        .eq('id', thoughtId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      const updatedThought = data as Thought;
      setThoughts(prev => prev.map(thought => 
        thought.id === thoughtId ? updatedThought: thought
      ));
      
      // Refresh metrics
      await fetchMetrics();
      
      return updatedThought;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message: 'Failed to update thought';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Delete a thought
  const deleteThought = useCallback(async (thoughtId: string): Promise<void> => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('thoughts')
        .delete()
        .eq('id', thoughtId)
        .eq('user_id', user.id);

      if (deleteError) {
        throw deleteError;
      }

      setThoughts(prev => prev.filter(thought => thought.id !== thoughtId));
      
      // Refresh metrics
      await fetchMetrics();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message: 'Failed to delete thought';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Fetch metrics
  const fetchMetrics = useCallback(async (): Promise<ThoughtMetrics> => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      const { data, error } = await supabase
        .from('thoughts')
        .select('category, status, priority, created_at')
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      const thoughts = data as Thought[];
      
      // Calculate metrics
      const bycategory: Record<string, number> = {};
      const bystatus: Record<string, number> = {};
      const bypriority: Record<string, number> = {};
      
      thoughts.forEach(thought => {
        by_category[thought.category] = (by_category[thought.category] || 0) + 1;
        by_status[thought.status] = (by_status[thought.status] || 0) + 1;
        if (thought.priority) {
          by_priority[thought.priority] = (by_priority[thought.priority] || 0) + 1;
        }
      });

      // Calculate recent activity (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recent_activity = thoughts.filter(thought => 
        new Date(thought.created_at) > sevenDaysAgo
      ).length;

      // Calculate completion rate
      const completed = by_status['completed'] || 0;
      const total = thoughts.length;
      const completion_rate = total > 0 ? (completed / total) * 100: 0;

      const metrics: ThoughtMetrics = {
        totalthoughts: total,
        by_category,
        by_status,
        by_priority,
        recent_activity,
        completion_rate
      };

      setMetrics(metrics);
      return metrics;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message: 'Failed to fetch metrics';
      setError(errorMessage);
      throw err;
    }
  }, [user?.id]);

  // Load initial data
  useEffect(() => {
    if (user?.id) {
      fetchThoughts();
      fetchMetrics();
    }
  }, [user?.id, fetchThoughts, fetchMetrics]);

  return {
    // State
    thoughts,
    loading,
    error,
    metrics,
    
    // Actions
    fetchThoughts,
    createThought,
    updateThought,
    deleteThought,
    fetchMetrics,
    
    // Utilities
    refetch: () => {
      fetchThoughts();
      fetchMetrics();
    },
    clearError: () => setError(null)
  };
}; 