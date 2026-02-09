/**
 * Unified Thoughts Service
 * Handles comprehensive thought management and organization
 * Consolidates functionality from both main and help-center thoughts services
 */

import { BaseService, type ServiceResponse } from '@/core/services/BaseService';
import type { Thought, ThoughtCategory, ThoughtStatus } from '@/core/types/thoughts';
import { selectData, selectOne, insertOne, updateOne, deleteOne, callRPC } from '@/lib/api-client';

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

      // Build filters for the query
      const filters: Record<string, any> = { user_id: userId };
      if (options?.category) filters.category = options.category;
      if (options?.status) filters.status = options.status;

      // Use the API client for the query
      const result = await selectData<any>('personal_thoughts', '*', filters);
      const { data, error } = result;

      if (error) {
        this.logFailure('getThoughts', error);
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
   * Get a single thought by ID
   */
  async getThought(thoughtId: string): Promise<ServiceResponse<Thought>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('getThought', { thoughtId });

      const result = await selectOne<any>('personal_thoughts', thoughtId);
      const { data, error } = result;

      if (error) {
        this.logFailure('getThought', error);
        return { data: null, error };
      }

      if (!data) {
        this.logFailure('getThought', 'Thought not found');
        return { data: null, error: 'Thought not found' };
      }

      const transformedData = {
        id: data.id,
        user_id: data.user_id,
        created_by: data.created_by,
        updated_by: data.updated_by,
        creationdate: new Date(data.created_at || new Date()),
        lastupdated: new Date(data.updated_at || new Date()),
        content: data.content,
        category: data.category || 'idea',
        status: data.status || 'concept',
        personal_or_professional: data.personal_or_professional || 'personal',
        mainsubcategories: data.mainsubcategories || [],
        initiative: data.initiative || false,
        impact: data.impact,
        parent_idea_id: data.parent_idea_id,
        workflow_stage: data.workflow_stage || 'concept',
        department: data.department,
        priority: data.priority || 'medium',
        estimated_effort: data.estimated_effort,
        ai_clarification_data: data.ai_clarification_data,
        aiinsights: data.aiinsights || {},
        interaction_method: data.interaction_method,
        company_id: data.company_id,
        tags: data.tags || [],
        attachments: data.attachments || [],
        visibility: data.visibility || 'private',
        collaboration_status: data.collaboration_status || 'individual',
        review_status: data.review_status || 'pending',
        approval_status: data.approval_status || 'pending',
        implementation_notes: data.implementation_notes,
        success_metrics: data.success_metrics,
        risk_assessment: data.risk_assessment,
        cost_estimate: data.cost_estimate,
        timeline_estimate: data.timeline_estimate,
        stakeholder_analysis: data.stakeholder_analysis,
        resource_requirements: data.resource_requirements,
        dependencies: data.dependencies || [],
        related_thoughts: data.related_thoughts || [],
        version: data.version || 1,
        is_template: data.is_template || false,
        template_category: data.template_category,
        usage_count: data.usage_count || 0,
        rating: data.rating,
        feedback: data.feedback,
        last_activity: data.last_activity ? new Date(data.last_activity) : undefined,
        completion_date: data.completion_date ? new Date(data.completion_date) : undefined,
        archived: data.archived || false,
        archive_date: data.archive_date ? new Date(data.archive_date) : undefined,
        archive_reason: data.archive_reason,
        createdat: new Date(data.created_at || new Date()),
        updatedat: new Date(data.updated_at || new Date()),
      } as Thought;

      this.logSuccess('getThought', `Retrieved thought ${thoughtId}`);
      return { data: transformedData, error: null };
    }, 'getThought');
  }

  /**
   * Create a new thought
   */
  async createThought(thoughtData: Partial<Thought>): Promise<ServiceResponse<Thought>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('createThought', { thoughtData });

      const result = await insertOne<any>('personal_thoughts', thoughtData);
      const { data, error } = result;

      if (error) {
        this.logFailure('createThought', error);
        return { data: null, error };
      }

      this.logSuccess('createThought', `Created thought ${data?.id}`);
      return { data: data as Thought, error: null };
    }, 'createThought');
  }

  /**
   * Update an existing thought
   */
  async updateThought(thoughtId: string, updates: Partial<Thought>): Promise<ServiceResponse<Thought>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('updateThought', { thoughtId, updates });

      const result = await updateOne<any>('personal_thoughts', thoughtId, updates);
      const { data, error } = result;

      if (error) {
        this.logFailure('updateThought', error);
        return { data: null, error };
      }

      this.logSuccess('updateThought', `Updated thought ${thoughtId}`);
      return { data: data as Thought, error: null };
    }, 'updateThought');
  }

  /**
   * Delete a thought
   */
  async deleteThought(thoughtId: string): Promise<ServiceResponse<boolean>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('deleteThought', { thoughtId });

      const result = await deleteOne('personal_thoughts', thoughtId);
      const { error } = result;

      if (error) {
        this.logFailure('deleteThought', error);
        return { data: null, error };
      }

      this.logSuccess('deleteThought', `Deleted thought ${thoughtId}`);
      return { data: true, error: null };
    }, 'deleteThought');
  }

  /**
   * Search thoughts
   */
  async searchThoughts(userId: string, query: string): Promise<ServiceResponse<Thought[]>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('searchThoughts', { userId, query });

      // Use RPC for search functionality
      const result = await callRPC('search_thoughts', { userId, query });
      const { data, error } = result;

      if (error) {
        this.logFailure('searchThoughts', error);
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
  async getThoughtStats(userId: string): Promise<ServiceResponse<any>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('getThoughtStats', { userId });

      const result = await callRPC('get_thought_stats', { userId });
      const { data, error } = result;

      if (error) {
        this.logFailure('getThoughtStats', error);
        return { data: null, error };
      }

      this.logSuccess('getThoughtStats', `Retrieved stats for user ${userId}`);
      return { data, error: null };
    }, 'getThoughtStats');
  }

  /**
   * Get thoughts by fire phase
   */
  async getThoughtsByFirePhase(userId: string, phase: string): Promise<ServiceResponse<Thought[]>> {
    return this.executeDbOperation(async () => {
      this.logMethodCall('getThoughtsByFirePhase', { userId, phase });

      const result = await selectData<any>('personal_thoughts', '*', { 
        user_id: userId, 
        workflow_stage: phase 
      });
      const { data, error } = result;

      if (error) {
        this.logFailure('getThoughtsByFirePhase', error);
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

      const result = await selectData<any>('personal_thoughts', '*', { is_public: true });
      const { data, error } = result;

      if (error) {
        this.logFailure('getPublicThoughts', error);
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

      const result = await selectData<any>('personal_thoughts', '*', { 
        user_id: userId, 
        category: category 
      });
      const { data, error } = result;

      if (error) {
        this.logFailure('getThoughtsByCategory', error);
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
