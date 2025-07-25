import { supabase } from '@/lib/supabase';

export interface Thought {
  id: string;
  content: string;
  userid: string;
  company_id?: string;
  createdat: string;
  updatedat?: string;
  tags?: string[];
  metadata?: {
    category?: string;
    priority?: 'low' | 'medium' | 'high';
    status?: 'draft' | 'active' | 'archived';
    fire_phase?: 'focus' | 'insight' | 'roadmap' | 'execute';
    confidence?: number;
    suggested_actions?: string[];
    [key: string]: any;
  };
}

interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class ThoughtsService {
  async getThoughts(userId: string, options?: {
    limit?: number;
    offset?: number;
    tags?: string[];
    category?: string;
    status?: string;
  }): Promise<ServiceResponse<Thought[]>> {
    try {
      let query = supabase
        .from('thoughts')
        .select('*')
        .eq('userid', userId)
        .order('createdat', { ascending: false });

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      if (options?.tags && options.tags.length > 0) {
        query = query.overlaps('tags', options.tags);
      }

      if (options?.category) {
        query = query.eq('metadata->category', options.category);
      }

      if (options?.status) {
        query = query.eq('metadata->status', options.status);
      }

      const { data, error } = await query;

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch thoughts',
      };
    }
  }

  async createThought(thought: Omit<Thought, 'id' | 'createdat' | 'updatedat'>): Promise<ServiceResponse<Thought>> {
    try {
      const { data, error } = await supabase
        .from('thoughts')
        .insert({
          content: thought.content,
          userid: thought.userid,
          company_id: thought.company_id,
          tags: thought.tags || [],
          metadata: thought.metadata || {},
          createdat: new Date().toISOString(),
          updatedat: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create thought',
      };
    }
  }

  async updateThought(thoughtId: string, updates: Partial<Thought>): Promise<ServiceResponse<Thought>> {
    try {
      const { data, error } = await supabase
        .from('thoughts')
        .update({
          ...updates,
          updatedat: new Date().toISOString(),
        })
        .eq('id', thoughtId)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update thought',
      };
    }
  }

  async deleteThought(thoughtId: string): Promise<ServiceResponse<void>> {
    try {
      const { error } = await supabase
        .from('thoughts')
        .delete()
        .eq('id', thoughtId);

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to delete thought',
      };
    }
  }

  async searchThoughts(userId: string, query: string): Promise<ServiceResponse<Thought[]>> {
    try {
      const { data, error } = await supabase
        .from('thoughts')
        .select('*')
        .eq('userid', userId)
        .ilike('content', `%${query}%`)
        .order('createdat', { ascending: false });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to search thoughts',
      };
    }
  }

  async getThoughtStats(userId: string): Promise<ServiceResponse<{
    total: number;
    byCategory: Record<string, number>;
    byStatus: Record<string, number>;
    byFirePhase: Record<string, number>;
    recentActivity: number;
  }>> {
    try {
      const { data, error } = await supabase
        .from('thoughts')
        .select('*')
        .eq('userid', userId);

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      const thoughts = data || [];
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const stats = {
        total: thoughts.length,
        byCategory: {} as Record<string, number>,
        byStatus: {} as Record<string, number>,
        byFirePhase: {} as Record<string, number>,
        recentActivity: thoughts.filter(t => new Date(t.createdat) > thirtyDaysAgo).length,
      };

      thoughts.forEach(thought => {
        const category = thought.metadata?.category || 'uncategorized';
        const status = thought.metadata?.status || 'active';
        const firePhase = thought.metadata?.fire_phase || 'focus';

        stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
        stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
        stats.byFirePhase[firePhase] = (stats.byFirePhase[firePhase] || 0) + 1;
      });

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get thought stats',
      };
    }
  }

  async getThoughtsByFirePhase(userId: string, phase: string): Promise<ServiceResponse<Thought[]>> {
    try {
      const { data, error } = await supabase
        .from('thoughts')
        .select('*')
        .eq('userid', userId)
        .eq('metadata->fire_phase', phase)
        .order('createdat', { ascending: false });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get thoughts by fire phase',
      };
    }
  }
}

export const thoughtsService = new ThoughtsService(); 