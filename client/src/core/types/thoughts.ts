/**
 * @file thoughts.ts
 * @description TypeScript types for Nexus Idea Management System with FIRE Framework
 * Based on Marcoby Nexus diagrams and enhanced database schema
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
 * FIRE Framework Integration:
 * - fire_phase: Current FIRE framework phase (focus, insight, roadmap, execute)
 * - fire_assessment: JSONB containing FIRE framework assessment scores
 * - progress_percentage: Overall progress percentage (0-100)
 * - confidence_score: Confidence in current assessment (0-1)
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
 * Allowed FIRE Phases (FirePhase):
 * - focus, insight, roadmap, execute
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

// FIRE framework phases
export type FirePhase = 'focus' | 'insight' | 'roadmap' | 'execute';

// Interaction methods from the interactive prompts diagram
export type InteractionMethod = 'text' | 'speech' | 'copy_paste' | 'upload';

// Classification types
export type PersonalOrProfessional = 'personal' | 'professional';

// Initiative types
export type InitiativeType = 'product' | 'business' | 'marketing' | 'operations' | 'personal' | 'general';

// Relationship types for thought connections
export type RelationshipType = 
  | 'spawns_task' 
  | 'spawns_reminder' 
  | 'implements' 
  | 'relates_to' 
  | 'depends_on' 
  | 'blocks';

// Initiative relationship types
export type InitiativeRelationshipType = 
  | 'depends_on' 
  | 'blocks' 
  | 'enables' 
  | 'related_to' 
  | 'part_of' 
  | 'spawns' 
  | 'implements';

// AI interaction types
export type AIInteractionType = 'insight' | 'suggestion' | 'reminder' | 'analysis';

// FIRE framework assessment scores (0-100)
export interface FireAssessmentScores {
  focus: {
    clarity: number;
    specificity: number;
    alignment: number;
    overall: number;
  };
  insight: {
    understanding: number;
    context: number;
    analysis: number;
    overall: number;
  };
  roadmap: {
    planning: number;
    milestones: number;
    timeline: number;
    overall: number;
  };
  execution: {
    progress: number;
    velocity: number;
    quality: number;
    overall: number;
  };
  overall: number;
  confidence: number;
  assessed_at: string;
}

// Initiative update types
export type InitiativeUpdateType = 
  | 'progress_update' 
  | 'phase_change' 
  | 'blocker_added' 
  | 'blocker_resolved' 
  | 'next_step_added' 
  | 'next_step_completed' 
  | 'completion' 
  | 'priority_change'
  | 'deadline_change' 
  | 'stakeholder_update' 
  | 'resource_update';

// Main Thought interface matching enhanced database schema
export interface Thought {
  id: string;
  user_id: string;
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
  
  // FIRE Framework Integration
  fire_phase?: FirePhase;
  fire_assessment?: FireAssessmentScores;
  initiative_type?: InitiativeType;
  estimated_completion?: string;
  actual_completion?: string;
  blockers?: string[];
  next_steps?: string[];
  success_metrics?: string[];
  business_impact?: string;
  risk_assessment?: string;
  cost_estimate?: number;
  timeline_estimate?: string;
  stakeholder_analysis?: Record<string, unknown>;
  resource_requirements?: Record<string, unknown>;
  dependencies?: string[];
  related_initiatives?: string[];
  confidence_score?: number;
  progress_percentage?: number;
  velocity_score?: number;
  quality_score?: number;
  last_assessment_date?: string;
  assessment_version?: number;
  
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

// FIRE Assessment interface
export interface FireAssessment {
  id: string;
  thought_id: string;
  user_id: string;
  fire_phase: FirePhase;
  
  // FIRE framework scores (0-100)
  focus_clarity?: number;
  focus_specificity?: number;
  focus_alignment?: number;
  focus_overall?: number;
  
  insight_understanding?: number;
  insight_context?: number;
  insight_analysis?: number;
  insight_overall?: number;
  
  roadmap_planning?: number;
  roadmap_milestones?: number;
  roadmap_timeline?: number;
  roadmap_overall?: number;
  
  execution_progress?: number;
  execution_velocity?: number;
  execution_quality?: number;
  execution_overall?: number;
  
  overall_score?: number;
  confidence_score: number;
  
  // Assessment metadata
  assessment_notes?: string;
  recommendations?: string[];
  questions?: string[];
  blockers?: string[];
  next_steps?: string[];
  
  // Assessment context
  assessment_context?: Record<string, unknown>;
  trigger_event?: string;
  conversation_context?: string;
  
  created_at: Date;
  updated_at: Date;
}

// Initiative Update interface
export interface InitiativeUpdate {
  id: string;
  thought_id: string;
  user_id: string;
  
  update_type: InitiativeUpdateType;
  previous_value?: Record<string, unknown>;
  new_value?: Record<string, unknown>;
  update_description: string;
  
  // FIRE framework context
  fire_phase_before?: FirePhase;
  fire_phase_after?: FirePhase;
  progress_before?: number;
  progress_after?: number;
  
  // Update metadata
  update_source?: 'manual' | 'conversation' | 'system' | 'ai';
  conversation_id?: string;
  confidence_score: number;
  
  created_at: Date;
}

// Initiative Relationship interface
export interface InitiativeRelationship {
  id: string;
  source_initiative_id: string;
  target_initiative_id: string;
  
  relationship_type: InitiativeRelationshipType;
  relationship_strength: number;
  relationship_notes?: string;
  
  created_at: Date;
  updated_at: Date;
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
  user_id: string;
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
  
  // FIRE Framework fields
  fire_phase?: FirePhase;
  initiative_type?: InitiativeType;
  estimated_completion?: string;
  blockers?: string[];
  next_steps?: string[];
  success_metrics?: string[];
  business_impact?: string;
  risk_assessment?: string;
  cost_estimate?: number;
  timeline_estimate?: string;
  stakeholder_analysis?: Record<string, unknown>;
  resource_requirements?: Record<string, unknown>;
  dependencies?: string[];
  related_initiatives?: string[];
  
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

// Create FIRE assessment request
export interface CreateFireAssessmentRequest {
  thought_id: string;
  fire_phase: FirePhase;
  
  // FIRE framework scores
  focus_clarity?: number;
  focus_specificity?: number;
  focus_alignment?: number;
  
  insight_understanding?: number;
  insight_context?: number;
  insight_analysis?: number;
  
  roadmap_planning?: number;
  roadmap_milestones?: number;
  roadmap_timeline?: number;
  
  execution_progress?: number;
  execution_velocity?: number;
  execution_quality?: number;
  
  confidence_score: number;
  
  // Assessment metadata
  assessment_notes?: string;
  recommendations?: string[];
  questions?: string[];
  blockers?: string[];
  next_steps?: string[];
  
  // Assessment context
  assessment_context?: Record<string, unknown>;
  trigger_event?: string;
  conversation_context?: string;
}

// Thought with relationships (for complex queries)
export interface ThoughtWithRelationships extends Thought {
  children: Thought[];
  parents: Thought[];
  relatedthoughts: Thought[];
  aiinteractions: AIInteraction[];
  fire_assessments?: FireAssessment[];
  initiative_updates?: InitiativeUpdate[];
  initiative_relationships?: InitiativeRelationship[];
}

// Workflow progress tracking
export interface WorkflowProgress {
  ideaid: string;
  currentstage: WorkflowStage;
  completedstages: WorkflowStage[];
  nextactions: string[];
  progresspercentage: number;
}

// FIRE framework progress tracking
export interface FireProgress {
  thought_id: string;
  current_phase: FirePhase;
  completed_phases: FirePhase[];
  phase_progress: Record<FirePhase, number>;
  overall_progress: number;
  next_phase?: FirePhase;
  phase_recommendations: Record<FirePhase, string[]>;
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
  user_id: string;
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

// FIRE framework analytics
export interface FireAnalytics {
  total_initiatives: number;
  initiatives_by_phase: Record<FirePhase, number>;
  average_progress: number;
  phase_transition_rate: Record<FirePhase, number>;
  confidence_distribution: {
    high: number;
    medium: number;
    low: number;
  };
  assessment_frequency: number;
  completion_rate: number;
}

// Search and filter options
export interface ThoughtFilters {
  category?: ThoughtCategory[];
  status?: ThoughtStatus[];
  personal_or_professional?: PersonalOrProfessional;
  workflow_stage?: WorkflowStage[];
  fire_phase?: FirePhase[];
  initiative_type?: InitiativeType[];
  date_range?: {
    start: Date;
    end: Date;
  };
  search_text?: string;
  has_ai_insights?: boolean;
  initiative_only?: boolean;
  user_id?: string; // Added for backend filtering by user
  progress_range?: {
    min: number;
    max: number;
  };
  confidence_range?: {
    min: number;
    max: number;
  };
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
  fire_assessments?: FireAssessment[];
  initiative_updates?: InitiativeUpdate[];
}

// FIRE assessment response
export interface FireAssessmentResponse {
  assessment: FireAssessment;
  thought: Thought;
  recommendations: string[];
  questions: string[];
  next_phase?: FirePhase;
}

// Initiative portfolio response
export interface InitiativePortfolioResponse {
  initiatives: Thought[];
  portfolio_health: {
    overall: number;
    focus: number;
    insight: number;
    roadmap: number;
    execution: number;
  };
  recommendations: string[];
  priorities: string[];
}

// Error types
export interface ThoughtError {
  code: string;
  message: string;
  field?: string;
} 
