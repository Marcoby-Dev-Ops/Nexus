import { supabase } from '@/core/supabase';
import { DatabaseQueryWrapper } from '@/core/database/queryWrapper';
import { logger } from '@/shared/utils/logger';

export interface Thought {
  id?: string;
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ThoughtsQueryOptions {
  category?: string;
  tags?: string[];
  search?: string;
  limit?: number;
  offset?: number;
}

export class ThoughtsService {
  private queryWrapper = new DatabaseQueryWrapper();

  /**
   * Get thoughts with proper authentication
   */
  async getThoughts(options: ThoughtsQueryOptions = {}, userId?: string) {
    try {
      if (!userId) {
        logger.warn('Cannot get thoughts: No user ID provided');
        return { data: null, error: 'User ID required' };
      }

      const { data, error } = await this.queryWrapper.userQuery(
        async () => {
          let query = supabase.from('thoughts').select('*', { count: 'exact' }).order('created_at', { ascending: false });
          
          if (options.category) {
            query = query.eq('category', options.category);
          }
          
          if (options.search) {
            query = query.or(`title.ilike.%${options.search}%,content.ilike.%${options.search}%`);
          }
          
          if (options.limit) {
            query = query.limit(options.limit);
          }
          
          if (options.offset) {
            query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
          }
          
          return query;
        },
        userId,
        'get-thoughts'
      );

      if (error) {
        logger.error('Error getting thoughts:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      logger.error('Error in getThoughts:', error);
      return { data: null, error };
    }
  }

  /**
   * Get a single thought by ID with proper authentication
   */
  async getThought(id: string, userId?: string) {
    try {
      if (!userId) {
        logger.warn('Cannot get thought: No user ID provided');
        return { data: null, error: 'User ID required' };
      }

      const { data, error } = await this.queryWrapper.userQuery(
        async () => supabase.from('thoughts').select('*').eq('id', id).single(),
        userId,
        'get-thought'
      );

      if (error) {
        logger.error('Error getting thought:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      logger.error('Error in getThought:', error);
      return { data: null, error };
    }
  }

  /**
   * Create a new thought with proper authentication
   */
  async createThought(thoughtData: Omit<Thought, 'id' | 'created_at' | 'updated_at'>, userId?: string) {
    try {
      if (!userId) {
        logger.warn('Cannot create thought: No user ID provided');
        return { data: null, error: 'User ID required' };
      }

      const insertData = {
        ...thoughtData,
        user_id: userId
      };

      const { data, error } = await this.queryWrapper.userQuery(
        async () => supabase.from('thoughts').insert(insertData).select('*').single(),
        userId,
        'create-thought'
      );

      if (error) {
        logger.error('Error creating thought:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      logger.error('Error in createThought:', error);
      return { data: null, error };
    }
  }

  /**
   * Update a thought with proper authentication
   */
  async updateThought(id: string, updateData: Partial<Thought>, userId?: string) {
    try {
      if (!userId) {
        logger.warn('Cannot update thought: No user ID provided');
        return { data: null, error: 'User ID required' };
      }

      const { data, error } = await this.queryWrapper.userQuery(
        async () => supabase.from('thoughts').update(updateData).eq('id', id).select('*').single(),
        userId,
        'update-thought'
      );

      if (error) {
        logger.error('Error updating thought:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      logger.error('Error in updateThought:', error);
      return { data: null, error };
    }
  }

  /**
   * Delete a thought with proper authentication
   */
  async deleteThought(id: string, userId?: string) {
    try {
      if (!userId) {
        logger.warn('Cannot delete thought: No user ID provided');
        return { error: 'User ID required' };
      }

      const { error } = await this.queryWrapper.userQuery(
        async () => supabase.from('thoughts').delete().eq('id', id),
        userId,
        'delete-thought'
      );

      if (error) {
        logger.error('Error deleting thought:', error);
        return { error };
      }

      return { error: null };
    } catch (error) {
      logger.error('Error in deleteThought:', error);
      return { error };
    }
  }

  /**
   * Get thought categories with proper authentication
   */
  async getCategories(userId?: string) {
    try {
      if (!userId) {
        logger.warn('Cannot get categories: No user ID provided');
        return { data: null, error: 'User ID required' };
      }

      const { data, error } = await this.queryWrapper.userQuery(
        async () => supabase.from('thoughts').select('category').not('category', 'is', null),
        userId,
        'get-categories'
      );

      if (error) {
        logger.error('Error getting categories:', error);
        return { data: null, error };
      }

      // Extract unique categories
      const categories = [...new Set(data?.map(thought => thought.category).filter(Boolean))];
      return { data: categories, error: null };
    } catch (error) {
      logger.error('Error in getCategories:', error);
      return { data: null, error };
    }
  }

  /**
   * Get thought tags with proper authentication
   */
  async getTags(userId?: string) {
    try {
      if (!userId) {
        logger.warn('Cannot get tags: No user ID provided');
        return { data: null, error: 'User ID required' };
      }

      const { data, error } = await this.queryWrapper.userQuery(
        async () => supabase.from('thoughts').select('tags').not('tags', 'is', null),
        userId,
        'get-tags'
      );

      if (error) {
        logger.error('Error getting tags:', error);
        return { data: null, error };
      }

      // Extract unique tags from all thoughts
      const allTags = data?.flatMap(thought => thought.tags || []).filter(Boolean) || [];
      const uniqueTags = [...new Set(allTags)];
      return { data: uniqueTags, error: null };
    } catch (error) {
      logger.error('Error in getTags:', error);
      return { data: null, error };
    }
  }
}

// Export singleton instance
export const thoughtsService = new ThoughtsService(); 