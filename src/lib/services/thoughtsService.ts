/**
 * @file thoughtsService.ts
 * @description Service layer for Nexus Thoughts System
 * Handles all CRUD operations, AI interactions, and workflow management
 */

import { supabase } from '../core/supabase';
import type {
  Thought,
  CreateThoughtRequest,
  UpdateThoughtRequest,
  ThoughtRelationship,
  AIInteraction,
  ThoughtWithRelationships,
  ThoughtFilters,
  ThoughtsResponse,
  ThoughtResponse,
  ThoughtMetrics,
  WorkflowProgress,
  AIInsights,
  InteractivePrompt,
  ThoughtCategory,
  ThoughtStatus,
  WorkflowStage,
  RelationshipType,
  AIInteractionType
} from '../types/thoughts';

class ThoughtsService {
  
  // ====== CRUD Operations ======
  
  /**
   * Create a new thought with n8n workflow integration
   */
  async createThought(request: CreateThoughtRequest): Promise<Thought> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    // First trigger smart deduplication workflow
    const deduplicationResult = await this.triggerSmartDeduplication(request.content, user.id);
    
    // If deduplication suggests existing thought, handle accordingly
    if (deduplicationResult?.recommendedAction !== 'create_new') {
      // Return action card for user approval instead of creating immediately
      throw new Error(`Similar thought detected: ${deduplicationResult.reasoning}. Please review the suggested action.`);
    }

    const thoughtData = {
      user_id: user.id,
      created_by: user.id,
      content: request.content,
      category: request.category,
      status: request.status || 'concept',
      personal_or_professional: request.personal_or_professional,
      main_sub_categories: request.main_sub_categories || [],
      initiative: request.initiative || false,
      impact: request.impact,
      parent_idea_id: request.parent_idea_id,
      workflow_stage: request.workflow_stage || 'create_idea',
      interaction_method: request.interaction_method,
      ai_insights: {}
    };

    const { data, error } = await supabase
      .from('thoughts')
      .insert([thoughtData])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create thought: ${error.message}`);
    }

    // Trigger intelligent thought processor workflow
    await this.triggerIntelligentProcessor(data.id, user.id);

    return this.mapDatabaseToThought(data);
  }

  /**
   * Get thought by ID with optional relationships
   */
  async getThought(id: string, includeRelationships = false): Promise<ThoughtResponse> {
    const { data, error } = await supabase
      .from('thoughts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to get thought: ${error.message}`);
    }

    const thought = this.mapDatabaseToThought(data);
    const response: ThoughtResponse = { thought };

    if (includeRelationships) {
      response.relationships = await this.getThoughtRelationships(id);
      response.ai_interactions = await this.getAIInteractions(id);
    }

    return response;
  }

  /**
   * Get all thoughts for user with filtering and pagination
   */
  async getThoughts(
    filters: ThoughtFilters = {},
    limit = 50,
    offset = 0
  ): Promise<ThoughtsResponse> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    let query = supabase
      .from('thoughts')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id);

    // Apply filters
    if (filters.category?.length) {
      query = query.in('category', filters.category);
    }
    if (filters.status?.length) {
      query = query.in('status', filters.status);
    }
    if (filters.personal_or_professional) {
      query = query.eq('personal_or_professional', filters.personal_or_professional);
    }
    if (filters.workflow_stage?.length) {
      query = query.in('workflow_stage', filters.workflow_stage);
    }
    if (filters.initiative_only) {
      query = query.eq('initiative', true);
    }
    if (filters.search_text) {
      query = query.ilike('content', `%${filters.search_text}%`);
    }
    if (filters.date_range) {
      query = query
        .gte('created_at', filters.date_range.start.toISOString())
        .lte('created_at', filters.date_range.end.toISOString());
    }

    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to get thoughts: ${error.message}`);
    }

    const thoughts = (data || []).map(this.mapDatabaseToThought);
    
    return {
      thoughts,
      total_count: count || 0,
      has_more: (count || 0) > offset + limit
    };
  }

  /**
   * Update thought
   */
  async updateThought(request: UpdateThoughtRequest): Promise<Thought> {
    const { data, error } = await supabase
      .from('thoughts')
      .update({
        content: request.content,
        category: request.category,
        status: request.status,
        personal_or_professional: request.personal_or_professional,
        main_sub_categories: request.main_sub_categories,
        initiative: request.initiative,
        impact: request.impact,
        workflow_stage: request.workflow_stage,
        parent_idea_id: request.parent_idea_id
      })
      .eq('id', request.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update thought: ${error.message}`);
    }

    // Update AI insights after content change
    if (request.content || request.status) {
      await this.generateAIInsights(request.id);
    }

    return this.mapDatabaseToThought(data);
  }

  /**
   * Delete thought
   */
  async deleteThought(id: string): Promise<void> {
    const { error } = await supabase
      .from('thoughts')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete thought: ${error.message}`);
    }
  }

  // ====== Relationship Management ======

  /**
   * Create relationship between thoughts
   */
  async createRelationship(
    sourceId: string,
    targetId: string,
    type: RelationshipType
  ): Promise<ThoughtRelationship> {
    const { data, error } = await supabase
      .from('thought_relationships')
      .insert([{
        source_thought_id: sourceId,
        target_thought_id: targetId,
        relationship_type: type
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create relationship: ${error.message}`);
    }

    return data;
  }

  /**
   * Get all relationships for a thought
   */
  async getThoughtRelationships(thoughtId: string): Promise<ThoughtRelationship[]> {
    const { data, error } = await supabase
      .from('thought_relationships')
      .select('*')
      .or(`source_thought_id.eq.${thoughtId},target_thought_id.eq.${thoughtId}`);

    if (error) {
      throw new Error(`Failed to get relationships: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get thought with all relationships and related thoughts
   */
  async getThoughtWithRelationships(id: string): Promise<ThoughtWithRelationships> {
    const thoughtResponse = await this.getThought(id, true);
    const relationships = thoughtResponse.relationships || [];

    // Get all related thought IDs
    const relatedIds = new Set<string>();
    relationships.forEach(rel => {
      if (rel.source_thought_id !== id) relatedIds.add(rel.source_thought_id);
      if (rel.target_thought_id !== id) relatedIds.add(rel.target_thought_id);
    });

    // Fetch related thoughts
    const relatedThoughts: Thought[] = [];
    if (relatedIds.size > 0) {
      const { data, error } = await supabase
        .from('thoughts')
        .select('*')
        .in('id', Array.from(relatedIds));

      if (!error && data) {
        relatedThoughts.push(...data.map(this.mapDatabaseToThought));
      }
    }

    // Categorize relationships
    const children = relatedThoughts.filter(t => 
      relationships.some(r => r.source_thought_id === id && r.target_thought_id === t.id)
    );
    const parents = relatedThoughts.filter(t => 
      relationships.some(r => r.target_thought_id === id && r.source_thought_id === t.id)
    );

    return {
      ...thoughtResponse.thought,
      children,
      parents,
      related_thoughts: relatedThoughts,
      ai_interactions: thoughtResponse.ai_interactions || []
    };
  }

  // ====== N8N Workflow Integration ======

  /**
   * Trigger smart thought deduplication workflow
   */
  private async triggerSmartDeduplication(content: string, userId: string): Promise<any> {
    try {
      const n8nUrl = import.meta.env.VITE_N8N_URL;
      const response = await fetch(`${n8nUrl}/webhook/smart-thought-deduplication`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          user_id: userId,
          company_id: 'default', // TODO: Get from user context
          openai_api_key: import.meta.env.VITE_OPENROUTER_API_KEY,
          supabase_url: import.meta.env.VITE_SUPABASE_URL,
          supabase_anon_key: import.meta.env.VITE_SUPABASE_ANON_KEY
        })
      });

      if (!response.ok) {
        console.warn('Smart deduplication workflow failed, proceeding with creation');
        return { recommendedAction: 'create_new' };
      }

      return await response.json();
    } catch (error) {
      console.warn('Smart deduplication workflow error, proceeding with creation:', error);
      return { recommendedAction: 'create_new' };
    }
  }

  /**
   * Trigger intelligent thought processor workflow
   */
  private async triggerIntelligentProcessor(thoughtId: string, userId: string): Promise<void> {
    try {
      const n8nUrl = import.meta.env.VITE_N8N_URL;
      await fetch(`${n8nUrl}/webhook/intelligent-thought-processor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          thought_id: thoughtId,
          user_id: userId,
          company_id: 'default', // TODO: Get from user context
          supabase_url: import.meta.env.VITE_SUPABASE_URL,
          supabase_anon_key: import.meta.env.VITE_SUPABASE_ANON_KEY
        })
      });
    } catch (error) {
      console.warn('Intelligent thought processor workflow failed:', error);
      // Don't throw error as thought creation should still succeed
    }
  }

  // ====== AI Integration ======

  /**
   * Generate AI insights for a thought
   */
  async generateAIInsights(thoughtId: string): Promise<AIInsights> {
    const thought = await this.getThought(thoughtId);
    
    // Mock AI insights generation (replace with real AI API call)
    const insights: AIInsights = {
      suggestions: [
        `Consider breaking "${thought.thought.content}" into smaller, actionable tasks`,
        `Set a specific deadline to maintain momentum`,
        `Identify potential obstacles and create contingency plans`
      ],
      next_steps: [
        'Define success criteria',
        'Identify required resources',
        'Create implementation timeline'
      ],
      related_ideas: [],
      potential_tasks: [
        'Research best practices',
        'Create project outline',
        'Schedule initial planning session'
      ],
      reminders: [
        'Weekly progress check-in',
        'Milestone review in 2 weeks'
      ],
      priority_score: Math.floor(Math.random() * 100)
    };

    // Store insights
    await supabase
      .from('thoughts')
      .update({ ai_insights: insights })
      .eq('id', thoughtId);

    // Log AI interaction
    await this.logAIInteraction(
      thoughtId,
      `Generated insights for: ${thought.thought.content}`,
      JSON.stringify(insights),
      'insight'
    );

    return insights;
  }

  /**
   * Get AI interactions for a thought
   */
  async getAIInteractions(thoughtId: string): Promise<AIInteraction[]> {
    const { data, error } = await supabase
      .from('ai_interactions')
      .select('*')
      .eq('thought_id', thoughtId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get AI interactions: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Log AI interaction
   */
  async logAIInteraction(
    thoughtId: string,
    prompt: string,
    response: string,
    type: AIInteractionType
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) return;

    await supabase
      .from('ai_interactions')
      .insert([{
        user_id: user.id,
        thought_id: thoughtId,
        prompt_text: prompt,
        ai_response: response,
        interaction_type: type,
        context_data: {}
      }]);
  }

  // ====== Workflow Management ======

  /**
   * Progress thought through workflow stages
   */
  async progressWorkflow(thoughtId: string, newStage: WorkflowStage): Promise<WorkflowProgress> {
    await supabase
      .from('thoughts')
      .update({ workflow_stage: newStage })
      .eq('id', thoughtId);

    return this.getWorkflowProgress(thoughtId);
  }

  /**
   * Get workflow progress for a thought
   */
  async getWorkflowProgress(thoughtId: string): Promise<WorkflowProgress> {
    const thought = await this.getThought(thoughtId);
    const stages: WorkflowStage[] = ['create_idea', 'update_idea', 'implement_idea', 'achievement'];
    const currentIndex = stages.indexOf(thought.thought.workflow_stage || 'create_idea');
    
    return {
      idea_id: thoughtId,
      current_stage: thought.thought.workflow_stage || 'create_idea',
      completed_stages: stages.slice(0, currentIndex + 1),
      next_actions: this.getNextActions(thought.thought.workflow_stage || 'create_idea'),
      progress_percentage: Math.round(((currentIndex + 1) / stages.length) * 100)
    };
  }

  // ====== Analytics & Metrics ======

  /**
   * Get user thought metrics
   */
  async getMetrics(): Promise<ThoughtMetrics> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    const { data: thoughts } = await supabase
      .from('thoughts')
      .select('category, status')
      .eq('user_id', user.id);

    if (!thoughts) {
      return this.getEmptyMetrics();
    }

    const categoryCount: Record<string, number> = {};
    const statusCount: Record<string, number> = {};

    thoughts.forEach(t => {
      categoryCount[t.category] = (categoryCount[t.category] || 0) + 1;
      statusCount[t.status] = (statusCount[t.status] || 0) + 1;
    });

    const completedCount = statusCount['completed'] || 0;
    const totalCount = thoughts.length;

    return {
      total_thoughts: totalCount,
      thoughts_by_category: categoryCount as Record<ThoughtCategory, number>,
      thoughts_by_status: statusCount as Record<ThoughtStatus, number>,
      completion_rate: totalCount > 0 ? (completedCount / totalCount) * 100 : 0,
      active_ideas: categoryCount['idea'] || 0,
      pending_tasks: statusCount['pending'] || 0,
      overdue_items: statusCount['overdue'] || 0,
      productivity_score: Math.min(100, (completedCount * 10) + ((statusCount['in_progress'] || 0) * 5))
    };
  }

  // ====== Helper Methods ======

  private mapDatabaseToThought(data: any): Thought {
    return {
      ...data,
      creation_date: new Date(data.creation_date || data.created_at),
      last_updated: new Date(data.last_updated || data.updated_at),
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at)
    };
  }

  private getNextActions(stage: WorkflowStage): string[] {
    const actionMap: Record<WorkflowStage, string[]> = {
      create_idea: ['Define the idea clearly', 'Add relevant details and context'],
      update_idea: ['Refine the concept', 'Add implementation details'],
      implement_idea: ['Break into actionable tasks', 'Start execution'],
      achievement: ['Document lessons learned', 'Celebrate success']
    };
    
    return actionMap[stage] || [];
  }

  private getEmptyMetrics(): ThoughtMetrics {
    return {
      total_thoughts: 0,
      thoughts_by_category: {} as Record<ThoughtCategory, number>,
      thoughts_by_status: {} as Record<ThoughtStatus, number>,
      completion_rate: 0,
      active_ideas: 0,
      pending_tasks: 0,
      overdue_items: 0,
      productivity_score: 0
    };
  }
}

// Export singleton instance
export const thoughtsService = new ThoughtsService(); 