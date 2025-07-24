/**
 * Enhanced Database Types for Nexus
 * Pillar: 2 - Minimum Lovable Feature Set
 * 
 * This file provides enhanced type safety for database operations,
 * especially for tables that might be missing from auto-generated types
 */

import type { Database } from '../core/database.types';

// Enhanced types for better type safety
export type Tables = Database['public']['Tables'];
export type Views = Database['public']['Views'];
export type Functions = Database['public']['Functions'];

// AI Models and Preferences (ensure these tables exist)
export interface AIModel {
  id: string;
  modelname: string;
  provider: string;
  displayname: string;
  description?: string;
  isactive: boolean;
  createdat: string;
  updatedat: string;
}

export interface UserAIModelPreference {
  id: string;
  userid: string;
  selectedmodelid: string;
  createdat: string;
  updatedat: string;
}

// Unified Inbox Types
export interface EmailAccount {
  id: string;
  userid: string;
  companyid: string;
  emailaddress: string;
  display_name?: string;
  provider: 'gmail' | 'outlook' | 'exchange' | 'imap' | 'smtp';
  access_token?: string;
  refresh_token?: string;
  token_expires_at?: string;
  syncenabled: boolean;
  syncstatus: 'pending' | 'syncing' | 'success' | 'error';
  last_sync_at?: string;
  createdat: string;
  updatedat: string;
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
    [key: string]: unknown;
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
  languages?: unknown | null;
  address?: unknown | null;
  emergency_contact?: unknown | null;
  preferences?: unknown | null;
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
  userid: string;
  keyname: string;
  provider?: string;
  createdat: string;
  updatedat: string;
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
  custom_fields?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface EnhancedUserIntegration extends Omit<Tables['user_integrations']['Row'], 'config'> {
  config: IntegrationConfig;
  integration?: Tables['integrations']['Row'];
  metadata?: {
    department?: string;
    context?: string;
    session_id?: string;
    [key: string]: unknown;
  };
}

// Conversation and Message Types
export interface AIConversation {
  id: string;
  userid: string;
  title?: string;
  agent_id?: string;
  createdat: string;
  updatedat: string;
  metadata?: {
    department?: string;
    context?: string;
    session_id?: string;
    [key: string]: unknown;
  };
}

export interface AIMessage {
  id: string;
  conversationid: string;
  userid: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdat: string;
  metadata?: {
    model?: string;
    tokens_used?: number;
    response_time_ms?: number;
    sources?: Array<{
      type: string;
      title: string;
      url?: string;
    }>;
    [key: string]: unknown;
  };
}

// Thought and AI Interaction Types
export interface Thought {
  id: string;
  userid: string;
  content: string;
  category: 'idea' | 'task' | 'reminder' | 'update';
  status: string;
  personal_or_professional?: 'personal' | 'professional';
  impact?: string;
  initiative?: boolean;
  workflow_stage?: string;
  parent_idea_id?: string;
  ai_insights?: Record<string, unknown>;
  interaction_method?: 'text' | 'speech' | 'copy_paste' | 'upload';
  createdat: string;
  updatedat: string;
}

export interface AIInteraction {
  id: string;
  userid: string;
  thought_id?: string;
  prompt_text?: string;
  ai_response?: string;
  interaction_type?: string;
  context_data?: Record<string, unknown>;
  createdat: string;
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

export const isAIConversation = (obj: any): obj is AIConversation => {
  return obj && typeof obj.id === 'string' && typeof obj.user_id === 'string';
};

export const isThought = (obj: any): obj is Thought => {
  return obj && typeof obj.id === 'string' && typeof obj.content === 'string';
}; 