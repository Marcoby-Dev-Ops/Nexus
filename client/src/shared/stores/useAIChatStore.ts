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

// Defensive duplicate detection: returns true if candidate matches an existing message by id
// or by identical content within a small timestamp window (2 seconds).
const isDuplicateMessage = (existing: ChatMessage[], candidate: any): boolean => {
  if (!candidate) return false;
  try {
    const candId = (candidate as any)?.id;
    if (candId && existing.some(m => (m as any).id === candId)) return true;

    const candContent = String((candidate as any)?.content || '').trim();
    if (!candContent) return false;

    const candTsRaw = (candidate as any)?.created_at || (candidate as any)?.updated_at || (candidate as any)?.timestamp;
    const candTs = candTsRaw ? new Date(candTsRaw).getTime() : null;

    for (const m of existing) {
      const mContent = String(m.content || '').trim();
      if (!mContent) continue;
      if (mContent === candContent) {
        const mTsRaw = (m as any).created_at || (m as any).updated_at || (m as any).timestamp;
        const mTs = mTsRaw ? new Date(mTsRaw).getTime() : null;
        if (mTs && candTs) {
          if (Math.abs(mTs - candTs) <= 2000) return true;
        } else {
          // same content and no reliable timestamps -> consider duplicate
          return true;
        }
      }
    }
  } catch (e) {
    // If duplicate detection fails, be conservative and return false.
    return false;
  }
  return false;
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
    // Debug: log sendMessage start
    logger.info('sendMessage:start', { conversationId, contentLength: String(content?.length || 0), beforeCount: get().messages.length });
    try {
      // also store debug events on window for easier retrieval during manual reproduction
      (window as any).__NEXUS_DEBUG_EVENTS = (window as any).__NEXUS_DEBUG_EVENTS || [];
      (window as any).__NEXUS_DEBUG_EVENTS.push({ ts: new Date().toISOString(), event: 'sendMessage:start', conversationId, contentLength: String(content?.length || 0), beforeCount: get().messages.length });
    } catch (e) {
      // ignore - window may not be present in SSR
    }
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

      // Add message to state (persisted user message)
      set(storeState => {
        // defensive dedupe
        if (isDuplicateMessage(storeState.messages, savedMessage)) {
          logger.info('sendMessage:duplicateSkipped', { savedMessageId: (savedMessage as any)?.id || null });
          return { isLoading: false } as any;
        }
        return { messages: [...storeState.messages, savedMessage], isLoading: false } as any;
      });

      // Debug: log after append
      logger.info('sendMessage:appended', { savedMessageId: (savedMessage as any)?.id || null, afterCount: get().messages.length });
      try {
        (window as any).__NEXUS_DEBUG_EVENTS = (window as any).__NEXUS_DEBUG_EVENTS || [];
        (window as any).__NEXUS_DEBUG_EVENTS.push({ ts: new Date().toISOString(), event: 'sendMessage:appended', savedMessageId: (savedMessage as any)?.id || null, afterCount: get().messages.length });
      } catch (e) {}

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

  // Streaming helpers
  startStreamingResponse: (tempId: string, conversationId: string, initialContent?: string) => {
    // Create a temporary assistant message that will be updated as chunks arrive
    const streamingMessage: Partial<ChatMessage> = {
      id: tempId,
      conversation_id: conversationId,
      role: 'assistant',
      content: initialContent,
      metadata: { streaming: true }
    } as any;

    set(state => ({
      messages: [...state.messages, streamingMessage as ChatMessage],
      streamingMessage: streamingMessage as ChatMessage
    }));

    // Debug: log temp message created
    logger.info('startStreamingResponse:created', { tempId, conversationId, afterCount: get().messages.length });
    try {
      (window as any).__NEXUS_DEBUG_EVENTS = (window as any).__NEXUS_DEBUG_EVENTS || [];
      (window as any).__NEXUS_DEBUG_EVENTS.push({ ts: new Date().toISOString(), event: 'startStreamingResponse:created', tempId, conversationId, afterCount: get().messages.length });
    } catch (e) {}
  },

  appendStreamingChunk: (tempId: string, chunk: string) => {
    set(state => {
      const updatedMessages = state.messages.map(msg => {
        if (msg.id === tempId) {
          return { ...msg, content: `${msg.content || ''}${chunk}` };
        }
        return msg;
      });
      const streamingMessage = updatedMessages.find(m => m.id === tempId) || null;
      return { messages: updatedMessages, streamingMessage } as any;
    });

    // Debug: log chunk append
    logger.info('appendStreamingChunk', { tempId, chunkLength: String(chunk?.length || 0) });
    try {
      (window as any).__NEXUS_DEBUG_EVENTS = (window as any).__NEXUS_DEBUG_EVENTS || [];
      (window as any).__NEXUS_DEBUG_EVENTS.push({ ts: new Date().toISOString(), event: 'appendStreamingChunk', tempId, chunkLength: String(chunk?.length || 0) });
    } catch (e) {}
  },

  finishStreamingResponse: async (tempId: string, finalContent: string, serverMessage?: any) => {
    try {
      // Replace temp message content with final content and mark streaming false.
      // Also mark as pendingPersist so saveAIResponse can detect and replace it later
      set(state => {
        const updatedMessages = state.messages.map(msg => {
          if (msg.id === tempId) {
            return { ...msg, content: finalContent, metadata: { ...(msg.metadata || {}), streaming: false, pendingPersist: true } } as ChatMessage;
          }
          return msg;
        });
        return { messages: updatedMessages, streamingMessage: null } as any;
      });

      // Debug: log after finishing streaming content
      logger.info('finishStreamingResponse:finalized', { tempId, afterCount: get().messages.length, hasServerMessage: !!serverMessage });
      try {
        (window as any).__NEXUS_DEBUG_EVENTS = (window as any).__NEXUS_DEBUG_EVENTS || [];
        (window as any).__NEXUS_DEBUG_EVENTS.push({ ts: new Date().toISOString(), event: 'finishStreamingResponse:finalized', tempId, afterCount: get().messages.length, hasServerMessage: !!serverMessage });
      } catch (e) {}

      // Persist assistant message if serverMessage was provided
      if (serverMessage) {
        // Normalized serverMessage expected to be the saved DB row; replace tempId with server id
          set(state => {
            // Replace the temp message with the serverMessage and remove any duplicate entries that match the serverMessage id
            const replaced = state.messages.map(msg => msg.id === tempId ? serverMessage : msg);
            const deduped = replaced.filter((m, idx) => {
              // keep the first occurrence of the serverMessage id
              if ((m as any).id === (serverMessage as any)?.id) {
                const firstIndex = replaced.findIndex(r => (r as any).id === (serverMessage as any)?.id);
                return idx === firstIndex;
              }
              return true;
            });
            return { messages: deduped } as any;
          });

          // Debug: log replacement with server message
          logger.info('finishStreamingResponse:replacedWithServerMessage', { tempId, serverMessageId: (serverMessage as any)?.id || null, afterCount: get().messages.length });

        // Debug: log replacement with server message
        logger.info('finishStreamingResponse:replacedWithServerMessage', { tempId, serverMessageId: (serverMessage as any)?.id || null, afterCount: get().messages.length });
        try {
          (window as any).__NEXUS_DEBUG_EVENTS = (window as any).__NEXUS_DEBUG_EVENTS || [];
          (window as any).__NEXUS_DEBUG_EVENTS.push({ ts: new Date().toISOString(), event: 'finishStreamingResponse:replacedWithServerMessage', tempId, serverMessageId: (serverMessage as any)?.id || null, afterCount: get().messages.length });
        } catch (e) {}
      }
    } catch (err) {
      logger.error('Error finishing streaming response', { err });
    }
  },

  cancelStreamingResponse: (tempId: string) => {
    // Mark streaming message as cancelled/error and clear streamingMessage
    set(state => ({
      messages: state.messages.map(msg => msg.id === tempId ? { ...msg, metadata: { ...(msg.metadata || {}), streaming: false, cancelled: true } } : msg),
      streamingMessage: null
    }));
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

      // Add message to state (persisted assistant message)
      set(state => {
        // If the savedMessage id already exists in state, skip append
        const exists = state.messages.some(m => (m as any).id === (savedMessage as any)?.id);
        if (exists) return state;

        // Defensive duplication check by content+timestamp
        if (isDuplicateMessage(state.messages, savedMessage)) return state;

        // Prefer replacing an existing streaming or recently-finalized temp assistant message for the same conversation.
        // Also match by identical content for the same conversation as a fallback when metadata wasn't set.
        const normalizedSavedContent = String((savedMessage as any)?.content || '').trim();
        const matchIdx = state.messages.findIndex(m => {
          if (m.conversation_id !== conversationId) return false;
          if (m.role !== 'assistant') return false;
          const meta = (m.metadata as any) || {};
          if (meta.streaming || meta.pendingPersist) return true;
          const mContent = String(m.content || '').trim();
          if (mContent && normalizedSavedContent && mContent === normalizedSavedContent) return true;
          return false;
        });
        let newMessages;
        if (matchIdx !== -1) {
          newMessages = state.messages.map((m, idx) => idx === matchIdx ? savedMessage : m);
        } else {
          newMessages = [...state.messages, savedMessage];
        }

        // Additional dedupe: remove any assistant temps in the same conversation that are
        // marked pendingPersist or whose content overlaps significantly with the saved message.
        try {
          const normalizedSaved = normalizedSavedContent.toLowerCase();
          const filtered: typeof newMessages = [] as any;
          for (const m of newMessages) {
            if ((m as any).id === (savedMessage as any)?.id) {
              // always keep the saved server row
              filtered.push(m);
              continue;
            }
            if (m.role === 'assistant' && m.conversation_id === conversationId) {
              const meta = (m.metadata as any) || {};
              const mContent = String(m.content || '').trim().toLowerCase();
              const isPending = !!meta.pendingPersist || !!meta.streaming;
              const overlaps = mContent && normalizedSaved && (mContent.includes(normalizedSaved) || normalizedSaved.includes(mContent));
              if (isPending || overlaps) {
                // drop this temp/duplicate
                continue;
              }
            }
            filtered.push(m);
          }
          newMessages = filtered;
        } catch (e) {
          // if anything goes wrong with dedupe, keep original newMessages
        }

        // Debug: indicate whether we replaced or appended
        try {
          (window as any).__NEXUS_DEBUG_EVENTS = (window as any).__NEXUS_DEBUG_EVENTS || [];
          (window as any).__NEXUS_DEBUG_EVENTS.push({ ts: new Date().toISOString(), event: 'saveAIResponse:applied', savedMessageId: (savedMessage as any)?.id || null, replacedIndex: matchIdx, afterCount: newMessages.length });
        } catch (e) {}

        logger.info('saveAIResponse:applied', { savedMessageId: (savedMessage as any)?.id || null, replacedIndex: matchIdx, afterCount: newMessages.length });

        return { messages: newMessages } as any;
      });

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
      logger.info('store.fetchMessages called', { conversationId });
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

      logger.info('Fetched messages', { conversationId, totalMessages: messages.length });

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

      const insertResp = await insertOne('ai_conversations', conversation);

      if (!insertResp || !insertResp.success) {
        const err = insertResp?.error || 'Insert failed';
        logger.error('Failed to create conversation', { error: err });
        throw new Error('Failed to create conversation');
      }

      // Normalize nested API response shape. Server may return { data: ROW } or ROW directly
      let data: any = null;
      if (insertResp.data && typeof insertResp.data === 'object') {
        if ('data' in (insertResp.data as any) && (insertResp.data as any).data) {
          data = (insertResp.data as any).data;
        } else {
          data = insertResp.data as any;
        }
      } else {
        data = insertResp.data as any;
      }


      // Optimistically add the new conversation and set it as current to
      // prevent other effects from auto-selecting a different conversation
      // while we refresh the canonical list from the server.
      set(state => ({
        conversations: [...state.conversations, data],
        currentConversation: data
      }));

      logger.info('createConversation: optimistic set currentConversation', { id: data?.id });

      // Refresh conversations from server to get the canonical ordering/row
      try {
        await get().fetchConversations();
    const canonical = get().conversations.find((c: Conversation) => c.id === data?.id) || data;
    // Update currentConversation to the canonical server row (if different)
    set({ currentConversation: canonical });
    logger.info('createConversation: refreshed canonical currentConversation', { id: canonical?.id });
      } catch (refreshErr) {
        // If refresh fails, keep the optimistic currentConversation
      }

  return data?.id;

    } catch (err) {
  logger.error('Error creating conversation', { err });
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
      const { error } = await updateOne('ai_conversations', conversationId, { 
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

  clearMessages: () => {
    set({ messages: [], error: null });
  },

  setCurrentConversation: (conversation: Conversation | null) => {
    set({ currentConversation: conversation });
    logger.info('setCurrentConversation called', { id: (conversation as any)?.id || null });
  },

  setCurrentConversationById: async (conversationId: string) => {
    const state = get();
    const conversation = state.conversations.find(conv => conv.id === conversationId);
    if (conversation) {
      set({ currentConversation: conversation });
      logger.info('setCurrentConversationById called', { id: conversationId });
    }
  },
})); 
