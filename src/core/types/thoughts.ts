/**
 * @file thoughts.ts
 * @description TypeScript types for Nexus Idea Management System
 * Based on Marcoby Nexus diagrams and database schema
 *
 * Thought Model Documentation (Marcoby Nexus Thought Framework):
 *
 * - id: Unique identifier for the thought.
 * - user_id: The user who owns or is responsible for the thought.
 * - created_by: The user who created the thought (may differ from user_id if created on behalf of another).
 * - updated_by: The user who last updated the thought.
 * - creation_date: When the thought was first created (immutable).
 * - last_updated: When the thought was last updated.
 *
 * Content and Core Properties:
 * - content: The main text or description of the thought.
 * - category: The type of thought (idea, task, reminder, update).
 * - status: The current lifecycle state (future_goals, concept, in_progress, completed, etc.).
 *
 * Classification:
 * - personal_or_professional: Whether the thought is personal or professional.
 * - main_sub_categories: Sub-categories for further classification.
 * - initiative: Whether this thought is an initiative (true/false).
 * - impact: Qualitative or quantitative impact assessment.
 *
 * Workflow and Relationships:
 * - parent_idea_id: If this thought is a child of another idea.
 * - workflow_stage: The current workflow stage (create_idea, update_idea, implement_idea, achievement).
 *
 * Workspace Integration Fields (now fully implemented in backend):
 * - department: Department or team associated with the thought.
 * - priority: Priority level (low, medium, high).
 * - estimated_effort: Estimated effort required (string, e.g., '2h', '1d').
 * - ai_clarification_data: Additional AI-generated clarifications or metadata.
 *
 * AI and Interaction Metadata:
 * - ai_insights: AI-generated insights, suggestions, or analysis.
 * - interaction_method: How the thought was captured (text, speech, copy_paste, upload).
 *
 * Timestamps:
 * - created_at: Timestamp when the thought was created (for DB sync).
 * - updated_at: Timestamp when the thought was last updated (for DB sync).
 *
 *
 * Allowed Status Values (ThoughtStatus):
 * - future_goals, concept, in_progress, completed, pending, reviewed, implemented, not_started, upcoming, due, overdue
 *
 * Allowed Workflow Stages (WorkflowStage):
 * - create_idea, update_idea, implement_idea, achievement
 *
 * All fields are required unless marked as optional (?).
 *
 * All fields above are now fully implemented in both the data model and backend services as of [latest update].
 */

// Core thought categories from diagrams
export type ThoughtCategory = 'idea' | 'task' | 'reminder' | 'update';

// Status types from the diagrams
export type ThoughtStatus = 
  | 'future_goals' 
  | 'concept' 
  | 'in_progress' 
  | 'completed'
  | 'pending' 
  | 'reviewed' 
  | 'implemented'
  | 'not_started' 
  | 'upcoming' 
  | 'due' 
  | 'overdue';

// Workflow stages from the idea workflow diagram
export type WorkflowStage = 'create_idea' | 'update_idea' | 'implement_idea' | 'achievement';

// Interaction methods from the interactive prompts diagram
export type InteractionMethod = 'text' | 'speech' | 'copy_paste' | 'upload';

// Classification types
export type PersonalOrProfessional = 'personal' | 'professional';

// Relationship types for thought connections
export type RelationshipType = 
  | 'spawns_task' 
  | 'spawns_reminder' 
  | 'implements' 
  | 'relates_to' 
  | 'depends_on' 
  | 'blocks';

// AI interaction types
export type AIInteractionType = 'insight' | 'suggestion' | 'reminder' | 'analysis';

// Main Thought interface matching database schema
export interface Thought {
  id: string;
  user_id: string;
  created_by?: string;
  updated_by?: string;
  creation_date: Date;
  last_updated: Date;
  
  // Content and core properties
  content: string;
  category: ThoughtCategory;
  status: ThoughtStatus;
  
  // Classification
  personal_or_professional?: PersonalOrProfessional;
  main_sub_categories: string[];
  initiative: boolean;
  impact?: string;
  
  // Workflow and relationships
  parent_idea_id?: string;
  workflow_stage?: WorkflowStage;
  
  // Workspace integration fields
  department?: string;
  priority?: 'low' | 'medium' | 'high';
  estimated_effort?: string;
  ai_clarification_data?: Record<string, unknown>;
  
  // AI and interaction metadata
  ai_insights: Record<string, unknown>;
  interaction_method?: InteractionMethod;
  
  // Timestamps
  created_at: Date;
  updated_at: Date;
}

// Thought relationship interface
export interface ThoughtRelationship {
  id: string;
  source_thought_id: string;
  target_thought_id: string;
  relationship_type: RelationshipType;
  created_at: Date;
}

// AI interaction interface
export interface AIInteraction {
  id: string;
  user_id: string;
  thought_id?: string;
  prompt_text?: string;
  ai_response?: string;
  interaction_type: AIInteractionType;
  context_data: Record<string, unknown>;
  created_at: Date;
}

// Create thought request (for API calls)
export interface CreateThoughtRequest {
  content: string;
  category: ThoughtCategory;
  status?: ThoughtStatus;
  personal_or_professional?: PersonalOrProfessional;
  main_sub_categories?: string[];
  initiative?: boolean;
  impact?: string;
  parent_idea_id?: string;
  workflow_stage?: WorkflowStage;
  interaction_method?: InteractionMethod;
  // Workspace integration fields
  department?: string;
  priority?: 'low' | 'medium' | 'high';
  estimated_effort?: string;
  ai_clarification_data?: Record<string, unknown>;
  company_id?: string;
}

// Update thought request
export interface UpdateThoughtRequest extends Partial<CreateThoughtRequest> {
  id: string;
}

// Thought with relationships (for complex queries)
export interface ThoughtWithRelationships extends Thought {
  children: Thought[];
  parents: Thought[];
  related_thoughts: Thought[];
  ai_interactions: AIInteraction[];
}

// Workflow progress tracking
export interface WorkflowProgress {
  idea_id: string;
  current_stage: WorkflowStage;
  completed_stages: WorkflowStage[];
  next_actions: string[];
  progress_percentage: number;
}

// AI insights structure
export interface AIInsights {
  suggestions: string[];
  next_steps: string[];
  related_ideas: string[];
  potential_tasks: string[];
  reminders: string[];
  risk_assessment?: string;
  priority_score?: number;
}

// Interactive prompt data
export interface InteractivePrompt {
  id: string;
  user_id: string;
  prompt_text: string;
  prompt_type: 'question' | 'suggestion' | 'reminder' | 'insight';
  context: {
    related_thoughts: string[];
    trigger_event?: string;
    urgency_level?: 'low' | 'medium' | 'high';
  };
  response_options?: string[];
  auto_generated: boolean;
  created_at: Date;
}

// Thought analytics and metrics
export interface ThoughtMetrics {
  total_thoughts: number;
  thoughts_by_category: Record<ThoughtCategory, number>;
  thoughts_by_status: Record<ThoughtStatus, number>;
  completion_rate: number;
  active_ideas: number;
  pending_tasks: number;
  overdue_items: number;
  productivity_score: number;
}

// Search and filter options
export interface ThoughtFilters {
  category?: ThoughtCategory[];
  status?: ThoughtStatus[];
  personal_or_professional?: PersonalOrProfessional;
  workflow_stage?: WorkflowStage[];
  date_range?: {
    start: Date;
    end: Date;
  };
  search_text?: string;
  has_ai_insights?: boolean;
  initiative_only?: boolean;
  user_id?: string; // Added for backend filtering by user
}

// Bulk operations
export interface BulkUpdateRequest {
  thought_ids: string[];
  updates: Partial<UpdateThoughtRequest>;
}

// Export response types for API
export interface ThoughtsResponse {
  thoughts: Thought[];
  total_count: number;
  has_more: boolean;
}

export interface ThoughtResponse {
  thought: Thought;
  relationships?: ThoughtRelationship[];
  ai_interactions?: AIInteraction[];
}

// Error types
export interface ThoughtError {
  code: string;
  message: string;
  field?: string;
} 