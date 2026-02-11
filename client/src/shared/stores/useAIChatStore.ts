import { create } from 'zustand';
import { insertOne, updateOne, getAuthHeaders } from '@/lib/api-client';
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

  sendMessage: async (content: string, conversationId: string, attachments: FileAttachment[] = [], options: { persist?: boolean } = { persist: true }) => {
    const state = get();
    const { persist = true } = options;
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

      let savedMessage: ChatMessage | null = null;

      if (persist) {
        const insertResp = await insertOne('ai_messages', {
          ...userMessage,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

        // Normalize nested API response shape. The server often returns { success: true, data: { ...row... } }
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
      } else {
        // Create a local-only message with a temporary ID
        savedMessage = {
          id: `temp-${Date.now()}`,
          ...userMessage,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as ChatMessage;
      }

      // Add message to state
      if (savedMessage) {
        set(storeState => ({
          messages: [...storeState.messages, savedMessage],
          isLoading: false
        }));
      } else {
        set({ isLoading: false });
      }

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

  saveAIResponse: async (content: string, conversationId: string, options: { persist?: boolean } = { persist: true }) => {
    try {
      const { persist = true } = options;
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

      let savedMessage: ChatMessage | null = null;
      if (persist) {
        const insertResp = await insertOne('ai_messages', {
          ...aiMessage,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

        if (!insertResp || !insertResp.success) {
          logger.error('Failed to save AI response', { error: insertResp?.error });
          return;
        }

        if (insertResp.data && typeof insertResp.data === 'object') {
          if ('data' in (insertResp.data as any) && (insertResp.data as any).data) {
            savedMessage = (insertResp.data as any).data;
          } else {
            savedMessage = insertResp.data as any;
          }
        } else {
          savedMessage = insertResp.data as any;
        }
      } else {
        // Create a local-only message with a temporary ID
        savedMessage = {
          id: `ai-temp-${Date.now()}`,
          ...aiMessage,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as ChatMessage;
      }

      // Add message to state
      if (savedMessage) {
        set(state => ({
          messages: [...state.messages, savedMessage]
        }));
      }

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
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/ai/conversations/${conversationId}/messages`, { headers });
      const result = await response.json();

      if (!result.success) {
        logger.error('Failed to fetch messages', { error: result.error });
        set({ error: 'Failed to fetch messages', isLoading: false });
        return;
      }

      const messages: ChatMessage[] = result.data || [];

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
      const headers = await getAuthHeaders();
      const response = await fetch('/api/ai/conversations', { headers });
      const result = await response.json();

      if (!result.success) {
        logger.error('Failed to fetch conversations', { error: result.error });
        set({ error: 'Failed to fetch conversations', isLoading: false });
        return;
      }

      set({
        conversations: result.data || [],
        isLoading: false
      });

      // Proactively clean empty conversations to keep history organized
      if (result.data && result.data.length > 0) {
        const emptyCount = result.data.filter((c: any) => !c.message_count || c.message_count <= 1).length;
        if (emptyCount > 0) {
          get().cleanEmptyConversations();
        }
      }

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
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/ai/conversations/${conversationId}`, {
        method: 'DELETE',
        headers
      });
      const result = await response.json();

      if (!result.success) {
        logger.error('Failed to delete conversation', { error: result.error });
        return;
      }

      set(state => ({
        conversations: state.conversations.filter(conv => conv.id !== conversationId),
        currentConversation: state.currentConversation?.id === conversationId
          ? null
          : state.currentConversation,
        messages: state.currentConversation?.id === conversationId
          ? []
          : state.messages
      }));

    } catch (err) {
      logger.error('Error deleting conversation', { err });
    }
  },

  cleanEmptyConversations: async () => {
    try {
      const state = get();
      const emptyConvs = state.conversations.filter(conv => {
        if (conv.is_archived) return false;

        // Strictly empty
        if (!conv.message_count || conv.message_count === 0) return true;

        // Generic "New Conversation" with very low engagement
        if ((conv.title === 'New Conversation' || conv.title === 'Untitled Conversation') && conv.message_count <= 2) {
          return true;
        }

        return false;
      });

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
    let conversation = state.conversations.find(conv => conv.id === conversationId);

    if (!conversation) {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`/api/ai/conversations/${conversationId}`, { headers });
        const result = await response.json();
        if (result.success && result.data) {
          conversation = result.data;
          // Add to local state if missing
          set(store => ({
            conversations: [conversation!, ...store.conversations]
          }));
        }
      } catch (err) {
        logger.error('Failed to fetch conversation by ID', { conversationId, err });
      }
    }

    if (conversation) {
      set({ currentConversation: conversation, messages: [] });
      await get().fetchMessages(conversationId);
    }
  },

  renameConversation: async (conversationId: string, newTitle: string) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/ai/conversations/${conversationId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ title: newTitle })
      });
      const result = await response.json();

      if (!result.success) {
        logger.error('Failed to rename conversation', { error: result.error });
        return;
      }

      set(state => ({
        conversations: state.conversations.map(conv =>
          conv.id === conversationId ? { ...conv, title: newTitle } : conv
        ),
        currentConversation: state.currentConversation?.id === conversationId
          ? { ...state.currentConversation, title: newTitle }
          : state.currentConversation
      }));
    } catch (err) {
      logger.error('Error renaming conversation', { err });
    }
  },

  searchConversations: async (queryStr: string) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/ai/search?q=${encodeURIComponent(queryStr)}`, { headers });
      const result = await response.json();

      if (!result.success) {
        logger.error('Search failed', { error: result.error });
        return [];
      }

      return result.data || [];
    } catch (err) {
      logger.error('Error during search', { err });
      return [];
    }
  },
}));
