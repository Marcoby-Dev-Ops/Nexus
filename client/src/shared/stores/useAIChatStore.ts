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

const extractRows = <T,>(payload: unknown): T[] => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload as T[];
  if (typeof payload === 'object' && payload !== null) {
    const data = (payload as any).data;
    if (Array.isArray(data)) return data as T[];
  }
  return [];
};

export const useAIChatStore = create<ChatState & ChatActions>((set, get) => ({
  messages: [],
  currentConversation: null,
  conversations: [],
  isLoading: false,
  error: null,
  streamingMessage: null,
  typingUsers: [],

  sendMessage: async (content: string, conversationId: string, attachments: FileAttachment[] = []) => {
    const state = get();
    set({ isLoading: true, error: null });

    if (!conversationId) {
      logger.error('No conversation ID provided for sendMessage');
      set({ error: 'No conversation selected', isLoading: false });
      return;
    }

    try {
      // Create user message
      const userMessage: Omit<ChatMessage, 'id' | 'created_at' | 'updated_at'> = {
        conversation_id: conversationId,
        role: 'user',
        content,
        metadata: {
          tokens: Math.ceil(content.length / 4),
          model: state.currentConversation?.model || 'gpt-4',
          streaming: false,
          attachments
        }
      };

      const insertResp = await insertOne('ai_messages', {
        ...userMessage,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // Normalize nested API response shape. The server often returns { success: true, data: { ...row... } }
      let savedMessage = null;
      if (!insertResp || !insertResp.success) {
        const err = insertResp?.error || 'Insert failed';
        logger.error('Failed to save user message', { error: err });
        set({ error: 'Failed to send message', isLoading: false });
        return;
      }

      if (insertResp.data && typeof insertResp.data === 'object') {
        // If server wrapped the payload as { success: true, data: ROW }
        if ('data' in (insertResp.data as any) && (insertResp.data as any).data) {
          savedMessage = (insertResp.data as any).data;
        } else {
          savedMessage = insertResp.data as any;
        }
      } else {
        savedMessage = insertResp.data as any;
      }

      // Add message to state
      set(storeState => ({
        messages: [...storeState.messages, savedMessage],
        isLoading: false
      }));

      // Update conversation metadata
      if (state.currentConversation?.id === conversationId) {
        await get().updateConversation(conversationId, {
          updated_at: new Date().toISOString(),
          message_count: state.messages.length + 1,
          context: {
            ...state.currentConversation.context,
            last_activity: new Date().toISOString()
          }
        });
      }

    } catch (err) {
      logger.error('Error sending message', { err });
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

      const insertResp = await insertOne('ai_messages', {
        ...aiMessage,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      if (!insertResp || !insertResp.success) {
        logger.error('Failed to save AI response', { error: insertResp?.error });
        return;
      }

      let savedMessage = null;
      if (insertResp.data && typeof insertResp.data === 'object') {
        if ('data' in (insertResp.data as any) && (insertResp.data as any).data) {
          savedMessage = (insertResp.data as any).data;
        } else {
          savedMessage = insertResp.data as any;
        }
      } else {
        savedMessage = insertResp.data as any;
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
      logger.error('Error saving AI response', { err });
    }
  },

  fetchMessages: async (conversationId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await selectData('ai_messages', '*', {
        conversation_id: conversationId
      });

      if (error) {
        logger.error('Failed to fetch messages', { error });
        set({ error: 'Failed to fetch messages', isLoading: false });
        return;
      }

      const rows = extractRows<ChatMessage>(data);
      // Apply context window management and sort messages chronologically
      const messages = rows || [];

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
      logger.error('Error fetching messages', { err });
      set({ error: 'Error fetching messages', isLoading: false });
    }
  },

  fetchConversations: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await selectData('ai_conversations', '*', {});

      if (error) {
        logger.error('Failed to fetch conversations', { error });
        set({ error: 'Failed to fetch conversations', isLoading: false });
        return;
      }

      const rows = extractRows<Conversation>(data);

      set({
        conversations: rows,
        isLoading: false
      });

    } catch (err) {
      logger.error('Error fetching conversations', { err });
      set({ error: 'Error fetching conversations', isLoading: false });
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
        logger.error('Failed to create conversation', { error });
        throw new Error('Failed to create conversation');
      }

      let conversationData = data;
      if (data && typeof data === 'object') {
        if ('data' in (data as any) && (data as any).data) {
          conversationData = (data as any).data;
        }
      }

      set(state => ({
        conversations: [...state.conversations, conversationData],
        currentConversation: conversationData
      }));

      return conversationData.id;

    } catch (err) {
      logger.error('Error creating conversation', { err });
      throw err;
    }
  },

  updateConversation: async (conversationId: string, updates: Partial<Conversation>) => {
    try {
      const { data, error } = await updateOne('ai_conversations', { id: conversationId }, {
        ...updates,
        updated_at: new Date().toISOString()
      });

      if (error) {
        logger.error('Failed to update conversation', { error });
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
      logger.error('Error updating conversation', { err });
    }
  },

  archiveConversation: async (conversationId: string) => {
    await get().updateConversation(conversationId, { is_archived: true });
  },

  deleteConversation: async (conversationId: string) => {
    try {
      // TODO: Implement soft delete or hard delete based on requirements
      const { error } = await updateOne('ai_conversations', { id: conversationId }, {
        is_archived: true
      });

      if (error) {
        logger.error('Failed to delete conversation', { error });
        return;
      }

      set(state => ({
        conversations: state.conversations.filter(conv => conv.id !== conversationId),
        currentConversation: state.currentConversation?.id === conversationId
          ? null
          : state.currentConversation
      }));

    } catch (err) {
      logger.error('Error deleting conversation', { err });
    }
  },

  cleanEmptyConversations: async () => {
    try {
      const state = get();
      const emptyConvs = state.conversations.filter(conv => !conv.is_archived && (conv.message_count === 0 || !conv.message_count));
      for (const conv of emptyConvs) {
        // Archive empty conversation
        await get().updateConversation(conv.id, { is_archived: true });
      }
      // Refresh conversations
      await get().fetchConversations();
    } catch (err) {
      logger.error('Error cleaning empty conversations', { err });
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
