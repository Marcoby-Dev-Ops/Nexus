/**
 * @file database-field-mappings.ts
 * @description TypeScript interfaces that match the database field dictionary
 * Ensures type safety and consistency across the application
 */

// User Profile Fields
export interface UserProfileFields {
  id: string;
  userid: string;
  email: string;
  business_email?: string;
  personal_email?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  role: 'owner' | 'admin' | 'manager' | 'user';
  department?: string;
  job_title?: string;
  company?: string;
  company_id?: string;
  phone?: string;
  work_phone?: string;
  mobile?: string;
  linkedin_url?: string;
  location?: string;
  timezone?: string;
  work_location?: string;
  preferences: Record<string, unknown>;
  skills: string[];
  certifications: string[];
  github_url?: string;
  twitter_url?: string;
  onboardingcompleted: boolean;
  profilecompletionpercentage: number;
  createdat: Date;
  updatedat: Date;
}

// Company Fields
export interface CompanyFields {
  id: string;
  name: string;
  domain?: string;
  website?: string;
  description?: string;
  industry?: string;
  size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  founded_year?: number;
  revenue_range?: string;
  createdat: Date;
  updatedat: Date;
}

// Business Profile Fields
export interface BusinessProfileFields {
  id: string;
  userid: string;
  companyid: string;
  revenue_trend?: string;
  customer_satisfaction_score?: number;
  employee_count?: number;
  customer_count?: number;
  createdat: Date;
  updatedat: Date;
}

// User Integration Fields
export interface UserIntegrationFields {
  id: string;
  userid: string;
  integrationid: string;
  integrationtype: string;
  integrationname: string;
  status: 'pending' | 'active' | 'error' | 'disabled';
  credentials: Record<string, unknown>;
  settings: Record<string, unknown>;
  last_sync?: Date;
  createdat: Date;
  updatedat: Date;
}

// Thought Management Fields
export interface ThoughtFields {
  id: string;
  userid: string;
  createdby: string;
  updatedby: string;
  content: string;
  category: 'idea' | 'task' | 'reminder' | 'update';
  status: 'future_goals' | 'concept' | 'in_progress' | 'completed' | 'pending' | 'reviewed' | 'implemented' | 'not_started' | 'upcoming' | 'due' | 'overdue';
  personal_or_professional?: 'personal' | 'professional';
  mainsubcategories: string[];
  initiative: boolean;
  impact?: string;
  parent_idea_id?: string;
  workflow_stage?: 'create_idea' | 'update_idea' | 'implement_idea' | 'achievement';
  department?: string;
  priority?: 'low' | 'medium' | 'high';
  estimated_effort?: string;
  aiinsights: Record<string, unknown>;
  interaction_method?: 'text' | 'speech' | 'copy_paste' | 'upload';
  ai_clarification_data?: Record<string, unknown>;
  creationdate: Date;
  lastupdated: Date;
  createdat: Date;
  updatedat: Date;
}

// FIRE Cycle Fields
export interface FireCycleLogFields {
  id: string;
  userid: string;
  phase: 'focus' | 'insight' | 'roadmap' | 'execute';
  insights: unknown[];
  actions: unknown[];
  priority: 'critical' | 'high' | 'medium' | 'low';
  confidence: number;
  createdat: Date;
  updatedat: Date;
}

// World Insight Fields
export interface WorldInsightFields {
  id: string;
  userid: string;
  type: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  urgency: 'immediate' | 'today' | 'this-week' | 'ongoing';
  source: string;
  action_url?: string;
  createdat: Date;
  updatedat: Date;
}

// Action Item Fields
export interface ActionItemFields {
  id: string;
  userid: string;
  title: string;
  description: string;
  type: 'task' | 'automation' | 'decision' | 'meeting' | 'analysis' | 'optimization';
  priority: 'critical' | 'high' | 'medium' | 'low';
  effort: 'quick' | 'moderate' | 'intensive';
  impact: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed' | 'deferred';
  automationpossible: boolean;
  aiassisted: boolean;
  source: string;
  context?: string;
  due_date?: Date;
  estimatedtime: number;
  createdat: Date;
  updatedat: Date;
}

// Knowledge Insight Fields
export interface KnowledgeInsightFields {
  id: string;
  userid: string;
  title: string;
  description: string;
  type: 'pattern' | 'trend' | 'anomaly' | 'opportunity' | 'risk' | 'prediction';
  source: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  urgency: 'immediate' | 'today' | 'this-week' | 'ongoing';
  datapoints: number;
  actionable: boolean;
  action_url?: string;
  relatedintegrations: string[];
  aigenerated: boolean;
  createdat: Date;
  updatedat: Date;
}

// AI Insight Fields
export interface AIInsightFields {
  userid: string;
  insighttype: string;
  content: Record<string, unknown>;
  priority: 'low' | 'medium' | 'high';
}

// Form to Database Mapping
export interface FormToDatabaseMapping {
  // User Profile Mappings
  firstName: 'first_name';
  lastName: 'last_name';
  businessEmail: 'business_email';
  personalEmail: 'personal_email';
  displayName: 'display_name';
  jobTitle: 'job_title';
  workPhone: 'work_phone';
  linkedinUrl: 'linkedin_url';
  
  // Company Mappings
  companyName: 'name';
  companyDomain: 'domain';
  companyWebsite: 'website';
  companySize: 'size';
  
  // Business Profile Mappings
  revenueTrend: 'revenue_trend';
  customerSatisfaction: 'customer_satisfaction_score';
  employeeCount: 'employee_count';
  
  // Integration Mappings
  integrationType: 'integration_type';
  integrationName: 'integration_name';
  integrationStatus: 'status';
  
  // Thought Mappings
  thoughtContent: 'content';
  thoughtCategory: 'category';
  thoughtStatus: 'status';
  thoughtPriority: 'priority';
  thoughtDepartment: 'department';
  thoughtEffort: 'estimated_effort';
  
  // FIRE Cycle Mappings
  firePhase: 'phase';
  firePriority: 'priority';
  fireConfidence: 'confidence';
  
  // Action Item Mappings
  actionTitle: 'title';
  actionDescription: 'description';
  actionType: 'type';
  actionPriority: 'priority';
  actionEffort: 'effort';
  actionImpact: 'impact';
  actionStatus: 'status';
  actionSource: 'source';
  actionContext: 'context';
  actionDueDate: 'due_date';
  actionEstimatedTime: 'estimated_time';
  
  // Knowledge Insight Mappings
  insightTitle: 'title';
  insightDescription: 'description';
  insightType: 'type';
  insightSource: 'source';
  insightConfidence: 'confidence';
  insightImpact: 'impact';
  insightUrgency: 'urgency';
  insightDataPoints: 'data_points';
  insightActionable: 'actionable';
  insightActionUrl: 'action_url';
  insightRelatedIntegrations: 'related_integrations';
  insightAiGenerated: 'ai_generated';
}

// Validation Functions
export const validateUserProfile = (data: Partial<UserProfileFields>): boolean => {
  return !!(data.user_id && data.email);
};

export const validateThought = (data: Partial<ThoughtFields>): boolean => {
  return !!(data.user_id && data.content && data.category);
};

export const validateActionItem = (data: Partial<ActionItemFields>): boolean => {
  return !!(data.user_id && data.title && data.type);
};

export const validateKnowledgeInsight = (data: Partial<KnowledgeInsightFields>): boolean => {
  return !!(data.user_id && data.title && data.type && data.source);
};

// Mapping Functions
export const mapFormToDatabase = <T extends keyof FormToDatabaseMapping>(
  formField: T,
  value: unknown
): Record<FormToDatabaseMapping[T], unknown> => {
  return { [formField]: value } as Record<FormToDatabaseMapping[T], unknown>;
};

export const mapDatabaseToForm = <T extends keyof FormToDatabaseMapping>(
  dbField: FormToDatabaseMapping[T],
  value: unknown
): Record<T, unknown> => {
  return { [dbField]: value } as Record<T, unknown>;
}; 