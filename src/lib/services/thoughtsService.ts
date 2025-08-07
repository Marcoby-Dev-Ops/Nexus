/**
 * Unified Thoughts Service
 * Handles comprehensive thought management and organization
 * Consolidates functionality from both main and help-center thoughts services
 */

import { BaseService, type ServiceResponse } from '@/core/services/BaseService';
import type { Thought, ThoughtCategory, ThoughtStatus } from '@/core/types/thoughts';

// ============================================================================
// THOUGHTS SERVICE CLASS
// ============================================================================

export class ThoughtsService extends BaseService {
  /**
   * Get thoughts for a user with optional filtering
   */
  async getThoughts(userId: string, options?: {
    limit?: number;
    offset?: number;
    tags?: string[];
    category?: string;
    status?: string;
  }): Promise<ServiceResponse<Thought[]>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('getThoughts', { userId, options });

      let query = this.supabase
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
        query = query.eq('category', options.category);
      }

      if (options?.status) {
        query = query.eq('status', options.status);
      }

      const { data, error } = await query;

      if (error) {
        this.logFailure('getThoughts', error.message);
        return { data: null, error };
      }

      // Transform the data to match the comprehensive Thought type
      const transformedData = (data || []).map((thought: any) => ({
        id: thought.id,
        userid: thought.userid,
        created_by: thought.created_by,
        updated_by: thought.updated_by,
        creationdate: new Date(thought.creationdate || thought.createdat),
        lastupdated: new Date(thought.lastupdated || thought.updatedat),
        content: thought.content,
        category: thought.category || 'idea',
        status: thought.status || 'concept',
        personal_or_professional: thought.personal_or_professional,
        mainsubcategories: thought.mainsubcategories || [],
        initiative: thought.initiative || false,
        impact: thought.impact,
        parent_idea_id: thought.parent_idea_id,
        workflow_stage: thought.workflow_stage,
        department: thought.department,
        priority: thought.priority,
        estimated_effort: thought.estimated_effort,
        ai_clarification_data: thought.ai_clarification_data,
        aiinsights: thought.aiinsights || {},
        interaction_method: thought.interaction_method,
        company_id: thought.company_id,
        createdat: new Date(thought.createdat),
        updatedat: new Date(thought.updatedat),
      })) as Thought[];

      this.logSuccess('getThoughts', `Retrieved ${transformedData.length} thoughts for user ${userId}`);
      return { data: transformedData, error: null };
    }, 'getThoughts');
  }

  /**
   * Get a thought by ID
   */
  async getThoughtById(thoughtId: string): Promise<ServiceResponse<Thought | null>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('getThoughtById', { thoughtId });

      const { data, error } = await this.supabase
        .from('thoughts')
        .select('*')
        .eq('id', thoughtId)
        .single();

      if (error) {
        this.logFailure('getThoughtById', error.message);
        return { data: null, error };
      }

      // Transform the data to match the comprehensive Thought type
      const transformedThought = {
        id: data.id,
        userid: data.userid,
        created_by: data.created_by,
        updated_by: data.updated_by,
        creationdate: new Date(data.creationdate || data.createdat),
        lastupdated: new Date(data.lastupdated || data.updatedat),
        content: data.content,
        category: data.category || 'idea',
        status: data.status || 'concept',
        personal_or_professional: data.personal_or_professional,
        mainsubcategories: data.mainsubcategories || [],
        initiative: data.initiative || false,
        impact: data.impact,
        parent_idea_id: data.parent_idea_id,
        workflow_stage: data.workflow_stage,
        department: data.department,
        priority: data.priority,
        estimated_effort: data.estimated_effort,
        ai_clarification_data: data.ai_clarification_data,
        aiinsights: data.aiinsights || {},
        interaction_method: data.interaction_method,
        company_id: data.company_id,
        createdat: new Date(data.createdat),
        updatedat: new Date(data.updatedat),
      } as Thought;

      this.logSuccess('getThoughtById', `Retrieved thought ${thoughtId}`);
      return { data: transformedThought, error: null };
    }, 'getThoughtById');
  }

  /**
   * Create a new thought
   */
  async createThought(thought: Omit<Thought, 'id' | 'createdat' | 'updatedat' | 'creationdate' | 'lastupdated'>): Promise<ServiceResponse<Thought>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('createThought', { userId: thought.userid, category: thought.category });

      const { data, error } = await this.supabase
        .from('thoughts')
        .insert({
          ...thought,
          createdat: new Date().toISOString(),
          updatedat: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        this.logFailure('createThought', error.message);
        return { data: null, error };
      }

      const transformedThought = {
        ...data,
        creationdate: new Date(data.createdat),
        lastupdated: new Date(data.updatedat),
        createdat: new Date(data.createdat),
        updatedat: new Date(data.updatedat),
      } as Thought;

      this.logSuccess('createThought', `Created thought ${data.id} for user ${thought.userid}`);
      return { data: transformedThought, error: null };
    }, 'createThought');
  }

  /**
   * Update a thought
   */
  async updateThought(thoughtId: string, updates: Partial<Thought>): Promise<ServiceResponse<Thought>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('updateThought', { thoughtId });

      const { data, error } = await this.supabase
        .from('thoughts')
        .update({
          ...updates,
          updatedat: new Date().toISOString()
        })
        .eq('id', thoughtId)
        .select()
        .single();

      if (error) {
        this.logFailure('updateThought', error.message);
        return { data: null, error };
      }

      const transformedThought = {
        ...data,
        creationdate: new Date(data.createdat),
        lastupdated: new Date(data.updatedat),
        createdat: new Date(data.createdat),
        updatedat: new Date(data.updatedat),
      } as Thought;

      this.logSuccess('updateThought', `Updated thought ${thoughtId}`);
      return { data: transformedThought, error: null };
    }, 'updateThought');
  }

  /**
   * Delete a thought
   */
  async deleteThought(thoughtId: string): Promise<ServiceResponse<void>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('deleteThought', { thoughtId });

      const { error } = await this.supabase
        .from('thoughts')
        .delete()
        .eq('id', thoughtId);

      if (error) {
        this.logFailure('deleteThought', error.message);
        return { data: null, error };
      }

      this.logSuccess('deleteThought', `Deleted thought ${thoughtId}`);
      return { data: null, error: null };
    }, 'deleteThought');
  }

  /**
   * Search thoughts
   */
  async searchThoughts(userId: string, query: string): Promise<ServiceResponse<Thought[]>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('searchThoughts', { userId, query });

      const { data, error } = await this.supabase
        .from('thoughts')
        .select('*')
        .eq('userid', userId)
        .textSearch('content', query)
        .order('createdat', { ascending: false });

      if (error) {
        this.logFailure('searchThoughts', error.message);
        return { data: null, error };
      }

      const transformedData = (data || []).map((thought: any) => ({
        ...thought,
        creationdate: new Date(thought.createdat),
        lastupdated: new Date(thought.updatedat),
        createdat: new Date(thought.createdat),
        updatedat: new Date(thought.updatedat),
      })) as Thought[];

      this.logSuccess('searchThoughts', `Found ${transformedData.length} thoughts matching "${query}"`);
      return { data: transformedData, error: null };
    }, 'searchThoughts');
  }

  /**
   * Get thought statistics
   */
  async getThoughtStats(userId: string): Promise<ServiceResponse<{
    total: number;
    byCategory: Record<string, number>;
    byStatus: Record<string, number>;
    byFirePhase: Record<string, number>;
    recentActivity: number;
  }>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('getThoughtStats', { userId });

      const { data: thoughts, error } = await this.supabase
        .from('thoughts')
        .select('*')
        .eq('userid', userId);

      if (error) {
        this.logFailure('getThoughtStats', error.message);
        return { data: null, error };
      }

      const stats = {
        total: thoughts?.length || 0,
        byCategory: {} as Record<string, number>,
        byStatus: {} as Record<string, number>,
        byFirePhase: {} as Record<string, number>,
        recentActivity: 0
      };

      // Group by category, status, and fire phase
      thoughts?.forEach(thought => {
        // Count by category
        const category = thought.category || 'unknown';
        stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;

        // Count by status
        const status = thought.status || 'unknown';
        stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;

        // Count by fire phase (workflow_stage)
        const firePhase = thought.workflow_stage || 'unknown';
        stats.byFirePhase[firePhase] = (stats.byFirePhase[firePhase] || 0) + 1;
      });

      // Count recent activity (last 7 days)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      stats.recentActivity = thoughts?.filter(thought => 
        new Date(thought.updatedat) > oneWeekAgo
      ).length || 0;

      this.logSuccess('getThoughtStats', `Retrieved stats: ${stats.total} total thoughts, ${stats.recentActivity} recent`);
      return { data: stats, error: null };
    }, 'getThoughtStats');
  }

  /**
   * Get thoughts by fire phase
   */
  async getThoughtsByFirePhase(userId: string, phase: string): Promise<ServiceResponse<Thought[]>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('getThoughtsByFirePhase', { userId, phase });

      const { data, error } = await this.supabase
        .from('thoughts')
        .select('*')
        .eq('userid', userId)
        .eq('workflow_stage', phase)
        .order('createdat', { ascending: false });

      if (error) {
        this.logFailure('getThoughtsByFirePhase', error.message);
        return { data: null, error };
      }

      const transformedData = (data || []).map((thought: any) => ({
        ...thought,
        creationdate: new Date(thought.createdat),
        lastupdated: new Date(thought.updatedat),
        createdat: new Date(thought.createdat),
        updatedat: new Date(thought.updatedat),
      })) as Thought[];

      this.logSuccess('getThoughtsByFirePhase', `Retrieved ${transformedData.length} thoughts in phase ${phase}`);
      return { data: transformedData, error: null };
    }, 'getThoughtsByFirePhase');
  }

  /**
   * Get public thoughts
   */
  async getPublicThoughts(): Promise<ServiceResponse<Thought[]>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('getPublicThoughts', {});

      const { data, error } = await this.supabase
        .from('thoughts')
        .select('*')
        .eq('is_public', true);

      if (error) {
        this.logFailure('getPublicThoughts', error.message);
        return { data: null, error };
      }

      const transformedData = (data || []).map((thought: any) => ({
        ...thought,
        creationdate: new Date(thought.createdat),
        lastupdated: new Date(thought.updatedat),
        createdat: new Date(thought.createdat),
        updatedat: new Date(thought.updatedat),
      })) as Thought[];

      this.logSuccess('getPublicThoughts', `Retrieved ${transformedData.length} public thoughts`);
      return { data: transformedData, error: null };
    }, 'getPublicThoughts');
  }

  /**
   * Get thoughts by category
   */
  async getThoughtsByCategory(userId: string, category: string): Promise<ServiceResponse<Thought[]>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('getThoughtsByCategory', { userId, category });

      const { data, error } = await this.supabase
        .from('thoughts')
        .select('*')
        .eq('userid', userId)
        .eq('category', category);

      if (error) {
        this.logFailure('getThoughtsByCategory', error.message);
        return { data: null, error };
      }

      const transformedData = (data || []).map((thought: any) => ({
        ...thought,
        creationdate: new Date(thought.createdat),
        lastupdated: new Date(thought.updatedat),
        createdat: new Date(thought.createdat),
        updatedat: new Date(thought.updatedat),
      })) as Thought[];

      this.logSuccess('getThoughtsByCategory', `Retrieved ${transformedData.length} thoughts in category ${category}`);
      return { data: transformedData, error: null };
    }, 'getThoughtsByCategory');
  }
}

// Export singleton instance
export const thoughtsService = new ThoughtsService(); 