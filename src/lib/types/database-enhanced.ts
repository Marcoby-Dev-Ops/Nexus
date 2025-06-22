/**
 * Enhanced Database Types for Nexus
 * Pillar: 2 - Minimum Lovable Feature Set
 * 
 * This file provides enhanced type safety for database operations,
 * especially for tables that might be missing from auto-generated types
 */

import type { Database } from '../database.types';

// Enhanced types for better type safety
export type Tables = Database['public']['Tables'];
export type Views = Database['public']['Views'];
export type Functions = Database['public']['Functions'];

// AI Models and Preferences (ensure these tables exist)
export interface AIModel {
  id: string;
  model_name: string;
  provider: string;
  display_name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserAIModelPreference {
  id: string;
  user_id: string;
  selected_model_id: string;
  created_at: string;
  updated_at: string;
}

// Unified Inbox Types
export interface EmailAccount {
  id: string;
  user_id: string;
  company_id: string;
  email_address: string;
  display_name?: string;
  provider: 'gmail' | 'outlook' | 'exchange' | 'imap' | 'smtp';
  access_token?: string;
  refresh_token?: string;
  token_expires_at?: string;
  sync_enabled: boolean;
  sync_status: 'pending' | 'syncing' | 'success' | 'error';
  last_sync_at?: string;
  created_at: string;
  updated_at: string;
}

export interface InboxItem {
  id: string;
  user_id: string;
  company_id: string;
  item_type: 'email' | 'notification' | 'system' | 'task' | 'calendar';
  source_id?: string;
  source_type?: string;
  title: string;
  preview?: string;
  sender?: string;
  is_read: boolean;
  is_important: boolean;
  is_archived: boolean;
  priority_score: number;
  item_timestamp: string;
  received_at: string;
  ai_category?: string;
  ai_action_suggestion?: string;
  ai_urgency?: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
}

// Enhanced Company and User Profile Types
export interface EnhancedCompany {
  id: string;
  name: string;
  domain?: string | null;
  industry?: string | null;
  size?: string | null;
  logo_url?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  settings?: {
    theme?: 'light' | 'dark' | 'system';
    branding?: {
      primary_color?: string;
      logo_url?: string;
      custom_css?: string;
    };
    integrations?: {
      enabled_categories?: string[];
      auto_sync?: boolean;
    };
    notifications?: {
      email_enabled?: boolean;
      slack_enabled?: boolean;
      frequency?: 'real-time' | 'daily' | 'weekly';
    };
    security?: {
      enforce_2fa?: boolean;
      session_timeout?: number;
      allowed_domains?: string[];
    };
    [key: string]: any;
  } | null;
}

export interface EnhancedUserProfile {
  id: string;
  company_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  role?: string | null;
  department?: string | null;
  job_title?: string | null;
  phone?: string | null;
  mobile?: string | null;
  work_phone?: string | null;
  personal_email?: string | null;
  timezone?: string | null;
  location?: string | null;
  work_location?: string | null;
  linkedin_url?: string | null;
  github_url?: string | null;
  twitter_url?: string | null;
  bio?: string | null;
  skills?: string[] | null;
  certifications?: string[] | null;
  languages?: any | null;
  address?: any | null;
  emergency_contact?: any | null;
  preferences?: any | null;
  onboarding_completed?: boolean | null;
  profile_completion_percentage?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  company?: EnhancedCompany;
  full_name?: string;
  initials?: string;
  can_manage_company?: boolean;
}

// API Key Management Types
export interface SecureAPIKey {
  id: string;
  user_id: string;
  key_name: string;
  provider?: string;
  created_at: string;
  updated_at: string;
  // Note: actual key value is never exposed in API responses
}

// Integration Types
export interface IntegrationConfig {
  api_key?: string;
  secret_key?: string;
  base_url?: string;
  webhook_url?: string;
  sync_frequency?: 'real-time' | 'hourly' | 'daily' | 'weekly' | 'manual';
  enabled_features?: string[];
  custom_fields?: Record<string, any>;
  [key: string]: any;
}

export interface EnhancedUserIntegration extends Omit<Tables['user_integrations']['Row'], 'config'> {
  config: IntegrationConfig;
  integration?: Tables['integrations']['Row'];
}

// Conversation and Message Types
export interface AIConversation {
  id: string;
  user_id: string;
  title?: string;
  agent_id?: string;
  created_at: string;
  updated_at: string;
  metadata?: {
    department?: string;
    context?: string;
    session_id?: string;
    [key: string]: any;
  };
}

export interface AIMessage {
  id: string;
  conversation_id: string;
  user_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  metadata?: {
    model?: string;
    tokens_used?: number;
    response_time_ms?: number;
    sources?: Array<{
      type: string;
      title: string;
      url?: string;
    }>;
    [key: string]: any;
  };
}

// Thought and AI Interaction Types
export interface Thought {
  id: string;
  user_id: string;
  content: string;
  category: 'idea' | 'task' | 'reminder' | 'update';
  status: string;
  personal_or_professional?: 'personal' | 'professional';
  impact?: string;
  initiative?: boolean;
  workflow_stage?: string;
  parent_idea_id?: string;
  ai_insights?: Record<string, any>;
  interaction_method?: 'text' | 'speech' | 'copy_paste' | 'upload';
  created_at: string;
  updated_at: string;
}

export interface AIInteraction {
  id: string;
  user_id: string;
  thought_id?: string;
  prompt_text?: string;
  ai_response?: string;
  interaction_type?: string;
  context_data?: Record<string, any>;
  created_at: string;
}

// Utility types for database operations
export type InsertType<T extends keyof Tables> = Tables[T]['Insert'];
export type UpdateType<T extends keyof Tables> = Tables[T]['Update'];
export type RowType<T extends keyof Tables> = Tables[T]['Row'];

// Error handling types
export interface DatabaseError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
}

export interface DatabaseResponse<T> {
  data: T | null;
  error: DatabaseError | null;
}

// Pagination types
export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  hasMore: boolean;
  nextCursor?: string;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
  cursor?: string;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

// Search and filter types
export interface SearchFilters {
  query?: string;
  category?: string[];
  status?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  userId?: string;
  companyId?: string;
}

// Type guards for runtime type checking
export const isEmailAccount = (obj: any): obj is EmailAccount => {
  return obj && typeof obj.id === 'string' && typeof obj.email_address === 'string';
};

export const isInboxItem = (obj: any): obj is InboxItem => {
  return obj && typeof obj.id === 'string' && typeof obj.title === 'string';
};

export const isAIConversation = (obj: any): obj is AIConversation => {
  return obj && typeof obj.id === 'string' && typeof obj.user_id === 'string';
};

export const isThought = (obj: any): obj is Thought => {
  return obj && typeof obj.id === 'string' && typeof obj.content === 'string';
}; 