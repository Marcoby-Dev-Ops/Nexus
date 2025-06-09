/**
 * Database Type Fixes for 1.0
 * These types provide compatibility between database nullable fields and our TypeScript strict mode
 */

// Database type fixes disabled for 1.0 - using simple types instead

// Simplified types for 1.0
export interface SimpleUser {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  subscription_tier?: 'FREE' | 'PRO' | 'ENTERPRISE';
  created_at: string;
}

export interface SimpleChatMessage {
  id: string;
  conversation_id: string;
  user_id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
  metadata?: any;
}

export interface SimpleConversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  status?: string;
}

export interface SimpleThought {
  id: string;
  user_id: string;
  content: string;
  title?: string;
  tags?: string[];
  created_at: string;
} 