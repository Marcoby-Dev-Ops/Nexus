import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    // Remove flowType to use default
  },
});

// Helper function to handle Supabase errors
export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error);
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

// Type guard for Supabase error
export const isSupabaseError = (error: any): error is { message: string; code: string } => {
  return error && typeof error === 'object' && 'message' in error && 'code' in error;
};

// Chat history types
export interface ChatMessage {
  id: string;
  created_at: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  conversation_id: string;
  metadata?: {
    agent_id?: string;
    context?: string;
    [key: string]: any;
  };
}

export interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  agent_id: string;
  metadata?: {
    [key: string]: any;
  };
}

// Chat history functions
export const chatHistory = {
  // Create a new conversation
  async createConversation(title: string, agentId: string, metadata = {}) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('conversations')
      .insert([
        {
          title,
          agent_id: agentId,
          user_id: user.id,
          metadata,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Add a message to a conversation
  async addMessage(conversationId: string, message: Omit<ChatMessage, 'id' | 'created_at' | 'conversation_id'>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('chat_messages')
      .insert([
        {
          ...message,
          conversation_id: conversationId,
          user_id: user.id,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get conversation history
  async getConversationHistory(conversationId: string) {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  },

  // Get recent conversations
  async getRecentConversations(limit = 10) {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  // Update conversation title
  async updateConversationTitle(conversationId: string, title: string) {
    const { data, error } = await supabase
      .from('conversations')
      .update({ title })
      .eq('id', conversationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete a conversation and its messages
  async deleteConversation(conversationId: string) {
    // First delete all messages
    const { error: messagesError } = await supabase
      .from('chat_messages')
      .delete()
      .eq('conversation_id', conversationId);

    if (messagesError) throw messagesError;

    // Then delete the conversation
    const { error: conversationError } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId);

    if (conversationError) throw conversationError;
  },
}; 