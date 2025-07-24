/**
 * @file thoughts.ts
 * @description TypeScript types for Nexus Idea Management System
 * Based on Marcoby Nexus diagrams and database schema
 *
 * Thought Model Documentation (Marcoby Nexus Thought Framework):
 *
 * - id: Unique identifier for the thought.
 * - userid: The user who owns or is responsible for the thought.
 * - createdby: The user who created the thought (may differ from user_id if created on behalf of another).
 * - updatedby: The user who last updated the thought.
 * - creationdate: When the thought was first created (immutable).
 * - lastupdated: When the thought was last updated.
 *
 * Content and Core Properties:
 * - content: The main text or description of the thought.
 * - category: The type of thought (idea, task, reminder, update).
 * - status: The current lifecycle state (future_goals, concept, in_progress, completed, etc.).
 *
 * Classification: * - personalorprofessional: Whether the thought is personal or professional.
 * - mainsubcategories: Sub-categories for further classification.
 * - initiative: Whether this thought is an initiative (true/false).
 * - impact: Qualitative or quantitative impact assessment.
 *
 * Workflow and Relationships:
 * - parentideaid: If this thought is a child of another idea.
 * - workflowstage: The current workflow stage (create_idea, update_idea, implement_idea, achievement).
 *
 * Workspace Integration Fields (now fully implemented in backend):
 * - department: Department or team associated with the thought.
 * - priority: Priority level (low, medium, high).
 * - estimatedeffort: Estimated effort required (string, e.g., '2h', '1d').
 * - aiclarification_data: Additional AI-generated clarifications or metadata.
 *
 * AI and Interaction Metadata:
 * - aiinsights: AI-generated insights, suggestions, or analysis.
 * - interactionmethod: How the thought was captured (text, speech, copy_paste, upload).
 *
 * Timestamps: * - createdat: Timestamp when the thought was created (for DB sync).
 * - updatedat: Timestamp when the thought was last updated (for DB sync).
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
  userid: string;
  created_by?: string;
  updated_by?: string;
  creationdate: Date;
  lastupdated: Date;
  
  // Content and core properties
  content: string;
  category: ThoughtCategory;
  status: ThoughtStatus;
  
  // Classification
  personal_or_professional?: PersonalOrProfessional;
  mainsubcategories: string[];
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
  aiinsights: Record<string, unknown>;
  interaction_method?: InteractionMethod;
  
  // Company association
  company_id?: string;
  
  // Timestamps
  createdat: Date;
  updatedat: Date;
}

// Thought relationship interface
export interface ThoughtRelationship {
  id: string;
  sourcethoughtid: string;
  targetthoughtid: string;
  relationshiptype: RelationshipType;
  createdat: Date;
}

// AI interaction interface
export interface AIInteraction {
  id: string;
  userid: string;
  thought_id?: string;
  prompt_text?: string;
  ai_response?: string;
  interactiontype: AIInteractionType;
  contextdata: Record<string, unknown>;
  createdat: Date;
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
  relatedthoughts: Thought[];
  aiinteractions: AIInteraction[];
}

// Workflow progress tracking
export interface WorkflowProgress {
  ideaid: string;
  currentstage: WorkflowStage;
  completedstages: WorkflowStage[];
  nextactions: string[];
  progresspercentage: number;
}

// AI insights structure
export interface AIInsights {
  suggestions: string[];
  nextsteps: string[];
  relatedideas: string[];
  potentialtasks: string[];
  reminders: string[];
  risk_assessment?: string;
  priority_score?: number;
}

// Interactive prompt data
export interface InteractivePrompt {
  id: string;
  userid: string;
  prompttext: string;
  prompttype: 'question' | 'suggestion' | 'reminder' | 'insight';
  context: {
    relatedthoughts: string[];
    trigger_event?: string;
    urgency_level?: 'low' | 'medium' | 'high';
  };
  response_options?: string[];
  autogenerated: boolean;
  createdat: Date;
}

// Thought analytics and metrics
export interface ThoughtMetrics {
  totalthoughts: number;
  thoughtsbycategory: Record<ThoughtCategory, number>;
  thoughtsby_status: Record<ThoughtStatus, number>;
  completionrate: number;
  activeideas: number;
  pendingtasks: number;
  overdueitems: number;
  productivityscore: number;
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
  thoughtids: string[];
  updates: Partial<UpdateThoughtRequest>;
}

// Export response types for API
export interface ThoughtsResponse {
  thoughts: Thought[];
  totalcount: number;
  hasmore: boolean;
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