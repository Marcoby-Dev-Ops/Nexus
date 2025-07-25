import { supabase } from '@/lib/supabase';
import { DatabaseQueryWrapper } from '@/core/database/queryWrapper';
import { logger } from '@/shared/utils/logger.ts';

export interface ChatMessage {
  id: string;
  user_id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: any;
  created_at: string;
}

export interface ChatConversation {
  id: string;
  user_id: string;
  title: string;
  summary?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChatContext {
  conversation: ChatConversation;
  messages: ChatMessage[];
  userContext: any;
  businessContext: any;
}

export interface ChatResponse {
  message: string;
  conversation_id: string;
  metadata?: any;
}

export class ChatService {
  private queryWrapper = new DatabaseQueryWrapper();

  /**
   * Send a message and get AI response with proper authentication
   */
  async sendMessage(userId: string, message: string, conversationId?: string): Promise<ChatResponse> {
    try {
      logger.info('Sending chat message for user:', userId);

      // Get or create conversation
      const conversation = conversationId 
        ? await this.getConversation(conversationId, userId)
        : await this.createConversation(userId, message);

      // Store user message with proper authentication
      const userMessage = await this.storeMessage(userId, conversation.id, 'user', message);

      // Get conversation context with proper authentication
      const context = await this.buildConversationContext(conversation.id, userId);

      // Generate AI response (placeholder - integrate with actual AI service)
      const aiResponse = await this.generateAIResponse(message, context);

      // Store AI response with proper authentication
      const assistantMessage = await this.storeMessage(userId, conversation.id, 'assistant', aiResponse);

      // Update conversation with proper authentication
      await this.updateConversation(conversation.id, {
        updated_at: new Date().toISOString(),
        summary: this.generateConversationSummary([userMessage, assistantMessage])
      });

      return {
        message: aiResponse,
        conversation_id: conversation.id,
        metadata: {
          message_id: assistantMessage.id,
          tokens_used: this.estimateTokenCount(aiResponse)
        }
      };
    } catch (error) {
      logger.error('Error sending chat message:', error);
      throw error;
    }
  }

  /**
   * Get conversation with proper authentication
   */
  async getConversation(conversationId: string, userId: string): Promise<ChatConversation> {
    try {
      const { data, error } = await this.queryWrapper.userQuery(
        async () => supabase
          .from('chat_conversations')
          .select('*')
          .eq('id', conversationId)
          .eq('user_id', userId)
          .single(),
        userId,
        'get-conversation'
      );

      if (error) {
        throw new Error(error.message || 'Failed to get conversation');
      }

      return data;
    } catch (error) {
      logger.error('Error getting conversation:', error);
      throw error;
    }
  }

  /**
   * Create new conversation with proper authentication
   */
  async createConversation(userId: string, initialMessage: string): Promise<ChatConversation> {
    try {
      const title = this.generateConversationTitle(initialMessage);
      
      const { data, error } = await this.queryWrapper.userQuery(
        async () => supabase
          .from('chat_conversations')
          .insert({
            user_id: userId,
            title,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single(),
        userId,
        'create-conversation'
      );

      if (error) {
        throw new Error(error.message || 'Failed to create conversation');
      }

      return data;
    } catch (error) {
      logger.error('Error creating conversation:', error);
      throw error;
    }
  }

  /**
   * Store message with proper authentication
   */
  async storeMessage(userId: string, conversationId: string, role: 'user' | 'assistant', content: string, metadata?: any): Promise<ChatMessage> {
    try {
      const { data, error } = await this.queryWrapper.userQuery(
        async () => supabase
          .from('chat_messages')
          .insert({
            user_id: userId,
            conversation_id: conversationId,
            role,
            content,
            metadata: metadata || {},
            created_at: new Date().toISOString()
          })
          .select()
          .single(),
        userId,
        'store-message'
      );

      if (error) {
        throw new Error(error.message || 'Failed to store message');
      }

      return data;
    } catch (error) {
      logger.error('Error storing message:', error);
      throw error;
    }
  }

  /**
   * Get conversation messages with proper authentication
   */
  async getConversationMessages(conversationId: string, userId: string, limit = 50): Promise<ChatMessage[]> {
    try {
      const { data, error } = await this.queryWrapper.userQuery(
        async () => supabase
          .from('chat_messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .eq('user_id', userId)
          .order('created_at', { ascending: true })
          .limit(limit),
        userId,
        'get-conversation-messages'
      );

      if (error) {
        logger.error('Error fetching conversation messages:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('Error in getConversationMessages:', error);
      return [];
    }
  }

  /**
   * Get user conversations with proper authentication
   */
  async getUserConversations(userId: string, limit = 20): Promise<ChatConversation[]> {
    try {
      const { data, error } = await this.queryWrapper.userQuery(
        async () => supabase
          .from('chat_conversations')
          .select('*')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false })
          .limit(limit),
        userId,
        'get-user-conversations'
      );

      if (error) {
        logger.error('Error fetching user conversations:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('Error in getUserConversations:', error);
      return [];
    }
  }

  /**
   * Update conversation with proper authentication
   */
  async updateConversation(conversationId: string, updates: Partial<ChatConversation>): Promise<void> {
    try {
      const { error } = await this.queryWrapper.userQuery(
        async () => supabase
          .from('chat_conversations')
          .update(updates)
          .eq('id', conversationId),
        updates.user_id || '',
        'update-conversation'
      );

      if (error) {
        throw new Error(error.message || 'Failed to update conversation');
      }
    } catch (error) {
      logger.error('Error updating conversation:', error);
      throw error;
    }
  }

  /**
   * Delete conversation with proper authentication
   */
  async deleteConversation(conversationId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.queryWrapper.userQuery(
        async () => supabase
          .from('chat_conversations')
          .delete()
          .eq('id', conversationId)
          .eq('user_id', userId),
        userId,
        'delete-conversation'
      );

      if (error) {
        throw new Error(error.message || 'Failed to delete conversation');
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete conversation';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Build conversation context with proper authentication
   */
  private async buildConversationContext(conversationId: string, userId: string): Promise<ChatContext> {
    try {
      const [conversation, messages] = await Promise.all([
        this.getConversation(conversationId, userId),
        this.getConversationMessages(conversationId, userId)
      ]);

      // Get user context with proper authentication
      const { data: profile } = await this.queryWrapper.getUserProfile(userId);
      
      // Get business context with proper authentication
      let businessContext = {};
      if (profile?.company_id) {
        const { data: company } = await this.queryWrapper.companyQuery(
          async () => supabase
            .from('companies')
            .select('*')
            .eq('id', profile.company_id)
            .single(),
          profile.company_id,
          'get-business-context'
        );
        businessContext = company || {};
      }

      return {
        conversation,
        messages,
        userContext: profile || {},
        businessContext
      };
    } catch (error) {
      logger.error('Error building conversation context:', error);
      throw error;
    }
  }

  /**
   * Generate AI response (placeholder - integrate with actual AI service)
   */
  private async generateAIResponse(message: string, _context: ChatContext): Promise<string> {
    // This is a placeholder implementation
    // In a real application, this would call your AI service
    return `I understand you said: "${message}". This is a placeholder response. In a real implementation, this would be generated by your AI service based on the conversation context.`;
  }

  /**
   * Generate conversation title from initial message
   */
  private generateConversationTitle(message: string): string {
    const words = message.split(' ').slice(0, 5);
    return words.join(' ') + (message.length > 25 ? '...' : '');
  }

  /**
   * Generate conversation summary from messages
   */
  private generateConversationSummary(messages: ChatMessage[]): string {
    const userMessages = messages.filter(m => m.role === 'user');
    if (userMessages.length === 0) return '';
    
    const lastUserMessage = userMessages[userMessages.length - 1];
    return lastUserMessage.content.substring(0, 100) + (lastUserMessage.content.length > 100 ? '...' : '');
  }

  /**
   * Estimate token count for response
   */
  private estimateTokenCount(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }
}

// Export singleton instance
export const chatService = new ChatService(); 