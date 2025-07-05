/**
 * @file workspaceThoughtsIntegration.ts
 * @description Integration service between WorkspacePage and Nexus Thoughts System
 * Converts clarified ideas into actionable thoughts, tasks, and projects
 */

import { thoughtsService } from './thoughtsService';
import type { 
  ClarifyIdeaResponse, 
  ClarifyIdeaRequest 
} from '../automation/n8n/workspaceClarifyWorkflow';
import type { 
  Thought, 
  CreateThoughtRequest, 
  ThoughtCategory, 
  ThoughtStatus, 
  WorkflowStage,
  PersonalOrProfessional,
  RelationshipType
} from '../types/thoughts';

export interface ActionPlanResult {
  success: boolean;
  mainThought?: Thought;
  relatedTasks?: Thought[];
  error?: string;
}

export interface DepartmentMapping {
  [key: string]: {
    category: ThoughtCategory;
    subCategories: string[];
    defaultStatus: ThoughtStatus;
    workflowStage: WorkflowStage;
  };
}

/**
 * Maps departments to thought categories and workflow stages
 */
const DEPARTMENT_MAPPING: DepartmentMapping = {
  'Marketing': {
    category: 'idea',
    subCategories: ['campaign', 'content', 'social_media', 'branding'],
    defaultStatus: 'concept',
    workflowStage: 'create_idea'
  },
  'Sales': {
    category: 'task',
    subCategories: ['deal', 'proposal', 'sow', 'pipeline'],
    defaultStatus: 'not_started',
    workflowStage: 'create_idea'
  },
  'Support': {
    category: 'task',
    subCategories: ['ticket', 'issue', 'customer_service'],
    defaultStatus: 'pending',
    workflowStage: 'create_idea'
  },
  'Operations': {
    category: 'task',
    subCategories: ['process', 'automation', 'workflow'],
    defaultStatus: 'not_started',
    workflowStage: 'create_idea'
  },
  'Finance': {
    category: 'task',
    subCategories: ['invoice', 'report', 'budget', 'expense'],
    defaultStatus: 'pending',
    workflowStage: 'create_idea'
  }
};

class WorkspaceThoughtsIntegration {
  private thoughtsService: typeof thoughtsService;

  constructor() {
    this.thoughtsService = thoughtsService;
  }

  /**
   * Convert a clarified idea into an action plan using the Nexus Thoughts system
   */
  async createActionPlanFromClarifiedIdea(
    clarification: ClarifyIdeaResponse['data'],
    originalIdea: string,
    userId: string
  ): Promise<ActionPlanResult> {
    try {
      if (!clarification) {
        throw new Error('No clarification data provided');
      }

      // Get department mapping
      const departmentConfig = DEPARTMENT_MAPPING[clarification.suggestedDepartment] || 
        DEPARTMENT_MAPPING['Operations']; // Default fallback

      // Create main thought (the clarified idea)
      const mainThought = await this.createMainThought(
        clarification,
        originalIdea,
        departmentConfig,
        userId
      );

      // Create related tasks from the breakdown
      const relatedTasks = await this.createRelatedTasks(
        clarification,
        mainThought.id,
        departmentConfig,
        userId
      );

      // Create relationships between main thought and tasks
      await this.createThoughtRelationships(mainThought.id, relatedTasks);

      // Log AI interaction for the clarification
      await this.logClarificationInteraction(mainThought.id, clarification);

      return {
        success: true,
        mainThought,
        relatedTasks
      };

    } catch (error: any) {
      console.error('Failed to create action plan:', error);
      return {
        success: false,
        error: error.message || 'Failed to create action plan'
      };
    }
  }

  /**
   * Create the main thought from the clarified idea
   */
  private async createMainThought(
    clarification: NonNullable<ClarifyIdeaResponse['data']>,
    originalIdea: string,
    departmentConfig: DepartmentMapping[string],
    userId: string
  ): Promise<Thought> {
    const createRequest: CreateThoughtRequest = {
      content: originalIdea,
      category: departmentConfig.category,
      status: departmentConfig.defaultStatus,
      personal_or_professional: 'professional',
      main_sub_categories: departmentConfig.subCategories,
      initiative: true,
      impact: `Estimated effort: ${clarification.estimatedEffort}, Priority: ${clarification.priority}`,
      workflow_stage: departmentConfig.workflowStage,
      interaction_method: 'text',
      department: clarification.suggestedDepartment,
      priority: clarification.priority,
      estimated_effort: clarification.estimatedEffort,
      ai_clarification_data: {
        type: clarification.type,
        breakdown: clarification.breakdown,
        nextSteps: clarification.nextSteps,
        reasoning: clarification.reasoning,
        suggestedDepartment: clarification.suggestedDepartment
      }
    };

    return this.thoughtsService.createThought(createRequest);
  }

  /**
   * Create related tasks from the breakdown
   */
  private async createRelatedTasks(
    clarification: NonNullable<ClarifyIdeaResponse['data']>,
    parentThoughtId: string,
    departmentConfig: DepartmentMapping[string],
    userId: string
  ): Promise<Thought[]> {
    const tasks: Thought[] = [];

    for (const step of clarification.breakdown) {
      const taskRequest: CreateThoughtRequest = {
        content: step,
        category: 'task',
        status: 'not_started',
        personal_or_professional: 'professional',
        main_sub_categories: departmentConfig.subCategories,
        initiative: false,
        parent_idea_id: parentThoughtId,
        workflow_stage: 'create_idea',
        interaction_method: 'text'
      };

      const task = await this.thoughtsService.createThought(taskRequest);
      tasks.push(task);
    }

    return tasks;
  }

  /**
   * Create relationships between main thought and tasks
   */
  private async createThoughtRelationships(
    mainThoughtId: string,
    tasks: Thought[]
  ): Promise<void> {
    for (const task of tasks) {
      await this.thoughtsService.createRelationship(
        mainThoughtId,
        task.id,
        'spawns_task'
      );
    }
  }

  /**
   * Log the AI clarification interaction
   */
  private async logClarificationInteraction(
    thoughtId: string,
    clarification: NonNullable<ClarifyIdeaResponse['data']>
  ): Promise<void> {
    const promptText = `Clarify and structure this idea for implementation`;
    const aiResponse = JSON.stringify({
      type: clarification.type,
      department: clarification.suggestedDepartment,
      breakdown: clarification.breakdown,
      effort: clarification.estimatedEffort,
      priority: clarification.priority,
      nextSteps: clarification.nextSteps,
      reasoning: clarification.reasoning
    }, null, 2);

    await this.thoughtsService.logAIInteraction(
      thoughtId,
      promptText,
      aiResponse,
      'analysis'
    );
  }

  /**
   * Get action plan summary for display in Action Board
   */
  async getActionPlanSummary(thoughtId: string): Promise<{
    mainThought: Thought;
    relatedTasks: Thought[];
    progress: {
      totalTasks: number;
      completedTasks: number;
      progressPercentage: number;
    };
  } | null> {
    try {
      const thoughtResponse = await this.thoughtsService.getThought(thoughtId, true);
      
      // Get related tasks by querying the database directly for thoughts with this parent_idea_id
      const { data: { user } } = await import('../core/supabase').then(m => m.supabase.auth.getUser());
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const { data: relatedTasksData, error } = await import('../core/supabase').then(m => m.supabase
        .from('thoughts')
        .select('*')
        .eq('user_id', user.id)
        .eq('parent_idea_id', thoughtId)
        .eq('category', 'task')
      );

      if (error) {
        throw new Error(`Failed to get related tasks: ${error.message}`);
      }

      const relatedTasks: Thought[] = [];
      for (const taskData of relatedTasksData || []) {
        const task = await this.thoughtsService.getThought(taskData.id);
        relatedTasks.push(task.thought);
      }
      const completedTasks = relatedTasks.filter(
        (task: Thought) => task.status === 'completed'
      ).length;

      const progress = {
        totalTasks: relatedTasks.length,
        completedTasks,
        progressPercentage: relatedTasks.length > 0 
          ? Math.round((completedTasks / relatedTasks.length) * 100)
          : 0
      };

      return {
        mainThought: thoughtResponse.thought,
        relatedTasks,
        progress
      };

    } catch (error) {
      console.error('Failed to get action plan summary:', error);
      return null;
    }
  }

  /**
   * Get all action plans for the current user
   */
  async getUserActionPlans(): Promise<Thought[]> {
    try {
      const response = await this.thoughtsService.getThoughts({
        initiative_only: true,
        workflow_stage: ['create_idea', 'update_idea', 'implement_idea']
      });

      return response.thoughts;
    } catch (error) {
      console.error('Failed to get user action plans:', error);
      return [];
    }
  }

  /**
   * Update action plan status
   */
  async updateActionPlanStatus(
    thoughtId: string,
    newStatus: ThoughtStatus,
    newWorkflowStage?: WorkflowStage
  ): Promise<Thought> {
    const updateRequest = {
      id: thoughtId,
      status: newStatus,
      ...(newWorkflowStage && { workflow_stage: newWorkflowStage })
    };

    return this.thoughtsService.updateThought(updateRequest);
  }
}

// Export singleton instance
export const workspaceThoughtsIntegration = new WorkspaceThoughtsIntegration();

// Export helper functions
export async function createActionPlanFromClarifiedIdea(
  clarification: ClarifyIdeaResponse['data'],
  originalIdea: string,
  userId: string
): Promise<ActionPlanResult> {
  return workspaceThoughtsIntegration.createActionPlanFromClarifiedIdea(
    clarification,
    originalIdea,
    userId
  );
}

export async function getActionPlanSummary(thoughtId: string) {
  return workspaceThoughtsIntegration.getActionPlanSummary(thoughtId);
}

export async function getUserActionPlans(): Promise<Thought[]> {
  return workspaceThoughtsIntegration.getUserActionPlans();
} 