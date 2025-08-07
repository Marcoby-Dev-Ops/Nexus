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
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

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
        user_id: thought.user_id,
        created_by: thought.created_by,
        updated_by: thought.updated_by,
        creationdate: new Date(thought.created_at || new Date()),
        lastupdated: new Date(thought.updated_at || new Date()),
        content: thought.content,
        category: thought.category || 'idea',
        status: thought.status || 'concept',
        personal_or_professional: thought.personal_or_professional || 'personal',
        mainsubcategories: thought.mainsubcategories || [],
        initiative: thought.initiative || false,
        impact: thought.impact,
        parent_idea_id: thought.parent_idea_id,
        workflow_stage: thought.workflow_stage || 'concept',
        department: thought.department,
        priority: thought.priority || 'medium',
        estimated_effort: thought.estimated_effort,
        ai_clarification_data: thought.ai_clarification_data,
        aiinsights: thought.aiinsights || {},
        interaction_method: thought.interaction_method,
        company_id: thought.company_id,
        tags: thought.tags || [],
        attachments: thought.attachments || [],
        visibility: thought.visibility || 'private',
        collaboration_status: thought.collaboration_status || 'individual',
        review_status: thought.review_status || 'pending',
        approval_status: thought.approval_status || 'pending',
        implementation_notes: thought.implementation_notes,
        success_metrics: thought.success_metrics,
        risk_assessment: thought.risk_assessment,
        cost_estimate: thought.cost_estimate,
        timeline_estimate: thought.timeline_estimate,
        stakeholder_analysis: thought.stakeholder_analysis,
        resource_requirements: thought.resource_requirements,
        dependencies: thought.dependencies || [],
        related_thoughts: thought.related_thoughts || [],
        version: thought.version || 1,
        is_template: thought.is_template || false,
        template_category: thought.template_category,
        usage_count: thought.usage_count || 0,
        rating: thought.rating,
        feedback: thought.feedback,
        last_activity: thought.last_activity ? new Date(thought.last_activity) : undefined,
        completion_date: thought.completion_date ? new Date(thought.completion_date) : undefined,
        archived: thought.archived || false,
        archive_date: thought.archive_date ? new Date(thought.archive_date) : undefined,
        archive_reason: thought.archive_reason,
        createdat: new Date(thought.created_at || new Date()),
        updatedat: new Date(thought.updated_at || new Date()),
      } as Thought));

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
        user_id: data.user_id,
        created_by: undefined, // Not in database schema
        updated_by: undefined, // Not in database schema
        creationdate: new Date(data.created_at || new Date()),
        lastupdated: new Date(data.updated_at || new Date()),
        content: data.content,
        category: (data.category as any) || 'idea',
        status: (data.status as any) || 'concept',
        personal_or_professional: undefined, // Not in database schema
        mainsubcategories: [], // Not in database schema
        initiative: false, // Not in database schema
        impact: undefined, // Not in database schema
        parent_idea_id: undefined, // Not in database schema
        workflow_stage: undefined, // Not in database schema
        department: undefined, // Not in database schema
        priority: undefined, // Not in database schema
        estimated_effort: undefined, // Not in database schema
        ai_clarification_data: undefined, // Not in database schema
        aiinsights: {}, // Not in database schema
        interaction_method: undefined, // Not in database schema
        company_id: undefined, // Not in database schema
        createdat: new Date(data.created_at || new Date()),
        updatedat: new Date(data.updated_at || new Date()),
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
      this.logMethodCall('createThought', { userId: thought.user_id, category: thought.category });

      const { data, error } = await this.supabase
        .from('thoughts')
        .insert({
          user_id: thought.user_id,
          content: thought.content,
          category: thought.category,
          status: thought.status,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        this.logFailure('createThought', error.message);
        return { data: null, error };
      }

      const transformedThought = {
        ...data,
        creationdate: new Date(data.created_at),
        lastupdated: new Date(data.updated_at),
        createdat: new Date(data.created_at),
        updatedat: new Date(data.updated_at),
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

      // Map Thought interface fields to database column names
      const dbUpdates: any = {};
      if (updates.content !== undefined) dbUpdates.content = updates.content;
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.personal_or_professional !== undefined) dbUpdates.personal_or_professional = updates.personal_or_professional;
      if (updates.mainsubcategories !== undefined) dbUpdates.mainsubcategories = updates.mainsubcategories;
      if (updates.initiative !== undefined) dbUpdates.initiative = updates.initiative;
      if (updates.impact !== undefined) dbUpdates.impact = updates.impact;
      if (updates.parent_idea_id !== undefined) dbUpdates.parent_idea_id = updates.parent_idea_id;
      if (updates.workflow_stage !== undefined) dbUpdates.workflow_stage = updates.workflow_stage;
      if (updates.department !== undefined) dbUpdates.department = updates.department;
      if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
      if (updates.estimated_effort !== undefined) dbUpdates.estimated_effort = updates.estimated_effort;
      if (updates.ai_clarification_data !== undefined) dbUpdates.ai_clarification_data = updates.ai_clarification_data;
      if (updates.aiinsights !== undefined) dbUpdates.aiinsights = updates.aiinsights;
      if (updates.interaction_method !== undefined) dbUpdates.interaction_method = updates.interaction_method;
      if (updates.company_id !== undefined) dbUpdates.company_id = updates.company_id;
      if (updates.user_id !== undefined) dbUpdates.user_id = updates.user_id;

      const { data, error } = await this.supabase
        .from('thoughts')
        .update({
          ...dbUpdates,
          updated_at: new Date().toISOString()
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
        creationdate: new Date(data.created_at),
        lastupdated: new Date(data.updated_at),
        createdat: new Date(data.created_at),
        updatedat: new Date(data.updated_at),
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
        .eq('user_id', userId)
        .textSearch('content', query)
        .order('created_at', { ascending: false });

      if (error) {
        this.logFailure('searchThoughts', error.message);
        return { data: null, error };
      }

      const transformedData = (data || []).map((thought: any) => ({
        ...thought,
        creationdate: new Date(thought.created_at),
        lastupdated: new Date(thought.updated_at),
        createdat: new Date(thought.created_at),
        updatedat: new Date(thought.updated_at),
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
        .eq('user_id', userId);

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
        new Date(thought.updated_at) > oneWeekAgo
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
        .eq('user_id', userId)
        .eq('workflow_stage', phase)
        .order('created_at', { ascending: false });

      if (error) {
        this.logFailure('getThoughtsByFirePhase', error.message);
        return { data: null, error };
      }

      const transformedData = (data || []).map((thought: any) => ({
        ...thought,
        creationdate: new Date(thought.created_at),
        lastupdated: new Date(thought.updated_at),
        createdat: new Date(thought.created_at),
        updatedat: new Date(thought.updated_at),
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
        creationdate: new Date(thought.created_at),
        lastupdated: new Date(thought.updated_at),
        createdat: new Date(thought.created_at),
        updatedat: new Date(thought.updated_at),
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
        .eq('user_id', userId)
        .eq('category', category);

      if (error) {
        this.logFailure('getThoughtsByCategory', error.message);
        return { data: null, error };
      }

      const transformedData = (data || []).map((thought: any) => ({
        ...thought,
        creationdate: new Date(thought.created_at),
        lastupdated: new Date(thought.updated_at),
        createdat: new Date(thought.created_at),
        updatedat: new Date(thought.updated_at),
      })) as Thought[];

      this.logSuccess('getThoughtsByCategory', `Retrieved ${transformedData.length} thoughts in category ${category}`);
      return { data: transformedData, error: null };
    }, 'getThoughtsByCategory');
  }
}

// Export singleton instance
export const thoughtsService = new ThoughtsService(); 