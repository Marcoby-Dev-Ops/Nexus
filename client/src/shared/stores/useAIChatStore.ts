import { create } from 'zustand';
import { selectData, insertOne, updateOne } from '@/lib/api-client';
import { logger } from '@/shared/utils/logger';
import type { 
  ChatMessage, 
  Conversation, 
  ChatState, 
  ChatActions, 
  FileAttachment 
} from '../types/chat';
import { truncateContext, needsTruncation, getConversationStats } from '../utils/contextWindow';

export const useAIChatStore = create<ChatState & ChatActions>((set, get) => ({
  messages: [],
  currentConversation: null,
  conversations: [],
  isLoading: false,
  error: null,
  streamingMessage: null,
  typingUsers: [],

  sendMessage: async (content: string, attachments?: FileAttachment[]) => {
    const state = get();
    set({ isLoading: true, error: null });
    
    try {
      // Create user message
      const userMessage: Omit<ChatMessage, 'id' | 'created_at' | 'updated_at'> = {
        conversation_id: state.currentConversation?.id || 'default',
        role: 'user',
        content,
        metadata: {
          tokens: Math.ceil(content.length / 4),
          model: state.currentConversation?.model || 'gpt-4',
          streaming: false,
          attachments: attachments || []
        }
      };

      const { data: savedMessage, error } = await insertOne('ai_messages', {
        ...userMessage,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      if (error) {
        logger.error({ error }, 'Failed to save user message');
        set({ error: 'Failed to send message', isLoading: false });
        return;
      }

      // Add message to state
      set(state => ({
        messages: [...state.messages, savedMessage],
        isLoading: false
      }));

      // Update conversation metadata
      if (state.currentConversation) {
        await get().updateConversation(state.currentConversation.id, {
          updated_at: new Date().toISOString(),
          message_count: state.messages.length + 1,
          context: {
            ...state.currentConversation.context,
            last_activity: new Date().toISOString()
          }
        });
      }

    } catch (err) {
      logger.error({ err }, 'Error sending message');
      set({ error: 'Error sending message', isLoading: false });
    }
  },

  saveAIResponse: async (content: string, conversationId: string) => {
    try {
      // Create AI response message
      const aiMessage: Omit<ChatMessage, 'id' | 'created_at' | 'updated_at'> = {
        conversation_id: conversationId,
        role: 'assistant',
        content,
        metadata: {
          tokens: Math.ceil(content.length / 4),
          model: 'gpt-4',
          streaming: false
        }
      };

      const { data: savedMessage, error } = await insertOne('ai_messages', {
        ...aiMessage,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      if (error) {
        logger.error({ error }, 'Failed to save AI response');
        return;
      }

      // Add message to state
      set(state => ({
        messages: [...state.messages, savedMessage]
      }));

      // Update conversation metadata
      await get().updateConversation(conversationId, {
        updated_at: new Date().toISOString(),
        message_count: get().messages.length + 1,
        context: {
          last_activity: new Date().toISOString()
        }
      });

    } catch (err) {
      logger.error({ err }, 'Error saving AI response');
    }
  },

  fetchMessages: async (conversationId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await selectData('ai_messages', '*', { 
        conversation_id: conversationId 
      });
      
      if (error) {
        logger.error({ error }, 'Failed to fetch messages');
        set({ error: 'Failed to fetch messages', isLoading: false });
        return;
      }

      // Apply context window management and sort messages chronologically
      const messages = data || [];
      
      // Sort messages by created_at in ascending order (oldest first)
      const sortedMessages = messages.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      
      const truncatedMessages = needsTruncation(sortedMessages) 
        ? truncateContext(sortedMessages)
        : sortedMessages;

      set({ 
        messages: truncatedMessages, 
        isLoading: false 
      });

      logger.info('Fetched messages', { 
        conversationId, 
        totalMessages: messages.length,
        truncatedMessages: truncatedMessages.length,
        stats: getConversationStats(truncatedMessages)
      });

    } catch (err) {
      logger.error({ err }, 'Error fetching messages');
      set({ error: 'Error fetching messages', isLoading: false });
    }
  },

  fetchConversations: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await selectData('ai_conversations', '*', {});
      
      if (error) {
        logger.error({ error }, 'Failed to fetch conversations');
        set({ error: 'Failed to fetch conversations', isLoading: false });
        return;
      }

      // Auto-clean empty conversations
      await get().cleanEmptyConversations(data || []);

      set({ 
        conversations: data || [], 
        isLoading: false 
      });

    } catch (err) {
      logger.error({ err }, 'Error fetching conversations');
      set({ error: 'Error fetching conversations', isLoading: false });
    }
  },

  cleanEmptyConversations: async (conversations?: Conversation[]) => {
    try {
      const conversationsToCheck = conversations || get().conversations;
      const emptyConversations = conversationsToCheck.filter(conv => conv.message_count === 0);
      
      if (emptyConversations.length === 0) {
        logger.info('No empty conversations to clean');
        return;
      }

      logger.info(`Found ${emptyConversations.length} empty conversations to clean`);

      // Delete empty conversations from database
      for (const conversation of emptyConversations) {
        try {
          const { error } = await deleteOne('ai_conversations', conversation.id);

          if (error) {
            logger.error({ error, conversationId: conversation.id }, 'Failed to delete empty conversation');
          } else {
            logger.info(`Deleted empty conversation: ${conversation.id}`);
          }
        } catch (err) {
          logger.error({ err, conversationId: conversation.id }, 'Error deleting empty conversation');
        }
      }

      // Update local state to remove empty conversations
      set(state => ({
        conversations: state.conversations.filter(conv => conv.message_count > 0),
        currentConversation: state.currentConversation?.message_count === 0 
          ? null 
          : state.currentConversation
      }));

      logger.info(`Cleaned ${emptyConversations.length} empty conversations`);

    } catch (err) {
      logger.error({ err }, 'Error cleaning empty conversations');
    }
  },

  createConversation: async (title: string, model: string, systemPrompt?: string, userId?: string) => {
    try {
      const conversation: Omit<Conversation, 'id'> = {
        title,
        model,
        system_prompt: systemPrompt,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        message_count: 0,
        user_id: userId || 'current-user', // Use provided userId or fallback
        is_archived: false,
        context: {
          last_activity: new Date().toISOString(),
          total_tokens: 0,
          context_length: 0
        }
      };

      const { data, error } = await insertOne('ai_conversations', conversation);
      
      if (error) {
        logger.error({ error }, 'Failed to create conversation');
        throw new Error('Failed to create conversation');
      }

      set(state => ({
        conversations: [...state.conversations, data],
        currentConversation: data
      }));

      return data.id;

    } catch (err) {
      logger.error({ err }, 'Error creating conversation');
      throw err;
    }
  },

  updateConversation: async (conversationId: string, updates: Partial<Conversation>) => {
    try {
      const { data, error } = await updateOne('ai_conversations', conversationId, {
        ...updates,
        updated_at: new Date().toISOString()
      });

      if (error) {
        logger.error({ error }, 'Failed to update conversation');
        return;
      }

      set(state => ({
        conversations: state.conversations.map(conv => 
          conv.id === conversationId ? { ...conv, ...data } : conv
        ),
        currentConversation: state.currentConversation?.id === conversationId 
          ? { ...state.currentConversation, ...data }
          : state.currentConversation
      }));

    } catch (err) {
      logger.error({ err }, 'Error updating conversation');
    }
  },

  archiveConversation: async (conversationId: string) => {
    await get().updateConversation(conversationId, { is_archived: true });
  },

  deleteConversation: async (conversationId: string) => {
    try {
      // TODO: Implement soft delete or hard delete based on requirements
      const { error } = await updateOne('ai_conversations', conversationId, { 
        is_archived: true 
      });

      if (error) {
        logger.error({ error }, 'Failed to delete conversation');
        return;
      }

      set(state => ({
        conversations: state.conversations.filter(conv => conv.id !== conversationId),
        currentConversation: state.currentConversation?.id === conversationId 
          ? null 
          : state.currentConversation
      }));

    } catch (err) {
      logger.error({ err }, 'Error deleting conversation');
    }
  },

  clearMessages: () => {
    set({ messages: [], error: null });
  },

  setCurrentConversation: (conversation: Conversation | null) => {
    set({ currentConversation: conversation });
  },

  setCurrentConversationById: async (conversationId: string) => {
    const state = get();
    const conversation = state.conversations.find(conv => conv.id === conversationId);
    if (conversation) {
      set({ currentConversation: conversation });
    }
  },
})); 
