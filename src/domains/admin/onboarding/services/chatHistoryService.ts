import { supabase } from '@/core/supabase';
import type { Database } from '@/core/types/database.types';

type Tables = Database['public']['Tables'];
type ChatConversation = Tables<'chat_conversations'>;
type ChatMessage = Tables<'chat_messages'>;

export interface CreateConversationParams {
  userid: string;
  title?: string;
  context?: Record<string, any>;
}

export interface AddMessageParams {
  conversationid: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  metadata?: Record<string, any>;
}

export const chatHistory = {
  /**
   * Create a new conversation
   */
  async createConversation(params: CreateConversationParams): Promise<ChatConversation> {
    const { data, error } = await supabase
      .from('chat_conversations')
      .insert({
        userid: params.user_id,
        title: params.title || 'Onboarding Chat',
        context: params.context || {},
        createdat: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create conversation: ${error.message}`);
    }

    return data;
  },

  /**
   * Add a message to a conversation
   */
  async addMessage(params: AddMessageParams): Promise<ChatMessage> {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        conversationid: params.conversation_id,
        content: params.content,
        role: params.role,
        metadata: params.metadata || {},
        createdat: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add message: ${error.message}`);
    }

    return data;
  },

  /**
   * Get recent conversations for a user
   */
  async getRecentConversations(userId: string, limit: number = 10): Promise<ChatConversation[]> {
    const { data, error } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to get recent conversations: ${error.message}`);
    }

    return data || [];
  },

  /**
   * Get messages for a conversation
   */
  async getConversationMessages(conversationId: string): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to get conversation messages: ${error.message}`);
    }

    return data || [];
  },
}; 