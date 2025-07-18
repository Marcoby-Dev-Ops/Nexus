import { supabase } from '@/core/supabase';
import type {
  Thought,
  CreateThoughtRequest,
  UpdateThoughtRequest,
  ThoughtFilters,
  ThoughtsResponse,
  ThoughtMetrics
} from '@/shared/types/thoughts';

export const thoughtsService = {
  async getThoughts(filters: Partial<ThoughtFilters> = {}, limit = 100, offset = 0): Promise<ThoughtsResponse> {
    // Basic filter: search_text, category, status, etc.
    let query = supabase.from('thoughts').select('*', { count: 'exact' }).order('created_at', { ascending: false });
    if (filters.category) query = query.in('category', filters.category);
    if (filters.status) query = query.in('status', filters.status);
    if (filters.personal_or_professional) query = query.eq('personal_or_professional', filters.personal_or_professional);
    if (filters.user_id) query = query.eq('user_id', filters.user_id);
    if (filters.search_text) query = query.ilike('content', `%${filters.search_text}%`);
    if (limit) query = query.limit(limit);
    if (offset) query = query.range(offset, offset + limit - 1);
    const { data, count, error } = await query;
    if (error) throw error;
    return {
      thoughts: (data as Thought[]) || [],
      total_count: count || 0,
      has_more: !!(count && offset + limit < count)
    };
  },

  async getMetrics(): Promise<ThoughtMetrics> {
    // This is a stub. In production, use a DB function or aggregate query.
    const { data, error } = await supabase.rpc('get_thought_metrics');
    if (error) throw error;
    return data as ThoughtMetrics;
  },

  async createThought(req: CreateThoughtRequest): Promise<Thought> {
    const { data, error } = await supabase.from('thoughts').insert(req).select('*').single();
    if (error) throw error;
    return data as Thought;
  },

  async updateThought(req: UpdateThoughtRequest): Promise<Thought> {
    const { id, ...updates } = req;
    const { data, error } = await supabase.from('thoughts').update(updates).eq('id', id).select('*').single();
    if (error) throw error;
    return data as Thought;
  },

  async deleteThought(id: string): Promise<void> {
    const { error } = await supabase.from('thoughts').delete().eq('id', id);
    if (error) throw error;
  }
}; 