import { supabase } from '@/lib/supabase';
import type { 
  Thought, 
  CreateThoughtRequest, 
  UpdateThoughtRequest, 
  ThoughtsResponse,
  ThoughtFilters,
  ThoughtMetrics 
} from '@/core/types/thoughts';

/**
 * Thoughts Service
 * Handles CRUD operations for thoughts and ideas
 */
export class ThoughtsService {
  /**
   * Create a new thought
   */
  async createThought(request: CreateThoughtRequest): Promise<Thought> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const thoughtData = {
      ...request,
      user_id: user.id,
      created_by: user.id,
      updated_by: user.id,
      main_sub_categories: request.main_sub_categories || [],
      initiative: request.initiative || false,
      ai_insights: {},
      interaction_method: request.interaction_method || 'text',
      ai_clarification_data: request.ai_clarification_data || {},
      creation_date: new Date().toISOString(),
      last_updated: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('thoughts')
      .insert(thoughtData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return this.mapDatabaseToThought(data);
  }

  /**
   * Update an existing thought
   */
  async updateThought(request: UpdateThoughtRequest): Promise<Thought> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const updateData = {
      ...request,
      updated_by: user.id,
      last_updated: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('thoughts')
      .update(updateData)
      .eq('id', request.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return this.mapDatabaseToThought(data);
  }

  /**
   * Delete a thought
   */
  async deleteThought(thoughtId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('thoughts')
      .delete()
      .eq('id', thoughtId)
      .eq('user_id', user.id);

    if (error) {
      throw error;
    }
  }

  /**
   * Get thoughts with filters
   */
  async getThoughts(
    filters: Partial<ThoughtFilters> = {},
    limit = 100,
    offset = 0
  ): Promise<ThoughtsResponse> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

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

    const { data, count, error } = await query;

    if (error) {
      throw error;
    }

    const thoughts = (data || []).map(this.mapDatabaseToThought);

    return {
      thoughts,
      totalcount: count || 0,
      hasmore: !!(count && offset + limit < count)
    };
  }

  /**
   * Get a single thought by ID
   */
  async getThought(thoughtId: string): Promise<Thought> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('thoughts')
      .select('*')
      .eq('id', thoughtId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      throw error;
    }

    return this.mapDatabaseToThought(data);
  }

  /**
   * Get thought metrics
   */
  async getMetrics(): Promise<ThoughtMetrics> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('thoughts')
      .select('category, status, priority, created_at')
      .eq('user_id', user.id);

    if (error) {
      throw error;
    }

    const thoughts = data || [];
    
    // Calculate metrics
    const by_category: Record<string, number> = {};
    const by_status: Record<string, number> = {};
    const by_priority: Record<string, number> = {};
    
    thoughts.forEach((thought: any) => {
      by_category[thought.category] = (by_category[thought.category] || 0) + 1;
      by_status[thought.status] = (by_status[thought.status] || 0) + 1;
      if (thought.priority) {
        by_priority[thought.priority] = (by_priority[thought.priority] || 0) + 1;
      }
    });

    // Calculate recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recent_activity = thoughts.filter((thought: any) => 
      new Date(thought.created_at) > sevenDaysAgo
    ).length;

    // Calculate completion rate
    const completed = by_status['completed'] || 0;
    const total = thoughts.length;
    const completion_rate = total > 0 ? (completed / total) * 100 : 0;

    return {
      totalthoughts: total,
      by_category,
      by_status,
      by_priority,
      recent_activity,
      completion_rate
    };
  }

  /**
   * Map database row to Thought interface
   */
  private mapDatabaseToThought(data: any): Thought {
    return {
      id: data.id,
      userid: data.user_id,
      created_by: data.created_by,
      updated_by: data.updated_by,
      creationdate: new Date(data.creation_date || data.created_at),
      lastupdated: new Date(data.last_updated || data.updated_at),
      content: data.content,
      category: data.category,
      status: data.status,
      personal_or_professional: data.personal_or_professional,
      mainsubcategories: data.main_sub_categories || [],
      initiative: data.initiative || false,
      impact: data.impact,
      parent_idea_id: data.parent_idea_id,
      workflow_stage: data.workflow_stage,
      department: data.department,
      priority: data.priority,
      estimated_effort: data.estimated_effort,
      ai_clarification_data: data.ai_clarification_data || {},
      aiinsights: data.ai_insights || {},
      interaction_method: data.interaction_method,
      company_id: data.company_id,
      createdat: new Date(data.created_at),
      updatedat: new Date(data.updated_at)
    };
  }
}

// Export singleton instance
export const thoughtsService = new ThoughtsService(); 