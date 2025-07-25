/**
 * Production-optimized chat hook with quota management, caching, and performance optimizations
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth.ts';
import { supabase } from '../core/supabase';
import { quotaService } from '../services/quotaService';
import type { ChatMessage, ChatState, ChatActions } from '../types/chat';
import type { ChatQuotas } from '../types/licensing';

interface UseProductionChatOptions {
  conversationId: string;
  enableReactions?: boolean;
  autoMarkAsRead?: boolean;
  pageSize?: number;
  enableCaching?: boolean;
}

interface ProductionChatState extends ChatState {
  quotas?: ChatQuotas;
  usageStats?: {
    messagesRemaining: number;
    aiRequestsRemaining: number;
    costToday: number;
  };
  isQuotaExceeded?: boolean;
  retryAfter?: number;
}

interface ProductionChatActions extends ChatActions {
  loadMoreMessages: () => Promise<void>;
  refreshQuotas: () => Promise<void>;
  getUsageStats: () => Promise<void>;
}

const messageCache = new Map<string, { messages: ChatMessage[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

type ChatMessageType = ChatMessage['type'];

type ChatMessageRow = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdat: string;
  metadata: { [key: string]: any; type?: ChatMessageType };
};

export function useProductionChat(options: UseProductionChatOptions): ProductionChatState & ProductionChatActions {
  const { conversationId,  } = options;

  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [quotas, setQuotas] = useState<ChatQuotas>();
  const [usageStats, setUsageStats] = useState<ProductionChatState['usageStats']>();

  const [state, setState] = useState<ProductionChatState>({
    messages: [],
    isLoading: false,
    error: null,
    currentConversationId: conversationId,
    typingUsers: [],
    streamingMessage: null,
    isQuotaExceeded: false,
    retryAfter: undefined,
  });

  const lastQuotaCheckRef = useRef<number>(0);

  const getCachedMessages = useCallback((key: string): ChatMessage[] | null => {
    if (!enableCaching) return null;
    
    const cached = messageCache.get(key);
    if (!cached) return null;
    
    const isExpired = Date.now() - cached.timestamp > CACHE_TTL;
    if (isExpired) {
      messageCache.delete(key);
      return null;
    }
    
    return cached.messages;
  }, [enableCaching]);

  const setCachedMessages = useCallback((key: string, messages: ChatMessage[]) => {
    if (!enableCaching) return;
    messageCache.set(key, { messages, timestamp: Date.now() });
  }, [enableCaching]);

  const checkQuotas = useCallback(async () => {
    if (!user?.id) return { allowed: false, reason: 'Not authenticated' };
    
    const now = Date.now();
    if (now - lastQuotaCheckRef.current < 60000) {
      return { allowed: !state.isQuotaExceeded };
    }
    lastQuotaCheckRef.current = now;

    try {
      const quotaCheck = await quotaService.canSendMessage(user.id);
      
      setState(prev => ({
        ...prev,
        quotas: quotaCheck.quotas,
        isQuotaExceeded: !quotaCheck.allowed,
        retryAfter: quotaCheck.retryAfter,
      }));

      if (quotaCheck.quotas) {
        setQuotas(quotaCheck.quotas);
      }

      return quotaCheck;
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Quota check failed: ', error);
      return { allowed: true };
    }
  }, [user?.id, state.isQuotaExceeded]);

  const fetchMessages = useCallback(async (page: number = 0, skipCache: boolean = false) => {
    if (!conversationId || !user?.id) return;

    const key = `${conversationId}-${page}`;
    
    if (!skipCache) {
      const cachedMessages = getCachedMessages(key);
      if (cachedMessages) {
        setState(prev => ({
          ...prev,
          messages: page === 0 ? cachedMessages : [...prev.messages, ...cachedMessages],
          isLoading: false,
        }));
        return;
      }
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) throw error;

      const formattedMessages: ChatMessage[] = (data || []).map((msg: ChatMessageRow) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.created_at),
        status: 'delivered' as const,
        type: msg.metadata?.type || 'text',
        metadata: msg.metadata,
      })).reverse();

      setCachedMessages(key, formattedMessages);

      setState(prev => ({
        ...prev,
        messages: page === 0 ? formattedMessages : [...prev.messages, ...formattedMessages],
        isLoading: false,
      }));

      setHasMoreMessages(formattedMessages.length === pageSize);
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to fetch messages',
        isLoading: false,
      }));
    }
  }, [conversationId, user?.id, pageSize, getCachedMessages, setCachedMessages]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !conversationId || !user?.id) return;

    const quotaCheck = await checkQuotas();
    if (!quotaCheck.allowed) {
      setState(prev => ({
        ...prev,
        error: quotaCheck.reason || 'Quota exceeded',
        isQuotaExceeded: true,
        retryAfter: quotaCheck.retryAfter,
      }));
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: ChatMessage = {
      id: tempId,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
      status: 'sending',
      type: 'text',
      metadata: { attachments: [] },
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, optimisticMessage],
      isLoading: true,
      error: null,
      isQuotaExceeded: false,
    }));

    try {
      const { error: saveError } = await supabase
        .from('chat_messages')
        .insert([
          {
            conversationid: conversationId,
            userid: user.id,
            role: 'user',
            content: content.trim(),
            metadata: {},
          },
        ])
        .select()
        .single();

      if (saveError) throw saveError;

      await quotaService.recordUsage(user.id, 'message');

      setState(prev => ({
        ...prev,
        messages: prev.messages.map(msg =>
          msg.id === tempId
            ? { ...msg, id: savedMessage.id, status: 'sent' }
            : msg
        ),
      }));

      messageCache.delete(`${conversationId}-0`);

      // AI Response
      /*
      const { enhancedChatService } = await import('../chatContext');
      const { executiveAgent } = await import('../agentRegistry');
      
      const result = await enhancedChatService.sendMessageWithContext(
        conversationId,
        content.trim(),
        executiveAgent,
        user.id,
      );
      */
      
      setState(prev => ({ ...prev, isLoading: false }));

    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error("Failed to send message: ", error);
      setState(prev => ({
        ...prev,
        messages: prev.messages.map(msg =>
          msg.id === tempId
            ? { ...msg, status: 'error' }
            : msg
        ),
        error: error instanceof Error ? error.message : 'Failed to send message',
        isLoading: false,
      }));
    }
  }, [conversationId, user?.id, checkQuotas]);

  const loadMoreMessages = useCallback(async () => {
    if (!hasMoreMessages || state.isLoading) return;
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    await fetchMessages(nextPage);
  }, [hasMoreMessages, state.isLoading, currentPage, fetchMessages]);

  const refreshQuotas = useCallback(async () => {
    lastQuotaCheckRef.current = 0;
    await checkQuotas();
  }, [checkQuotas]);

  const getUsageStats = useCallback(async () => {
    if (!user?.id) return;
    try {
      const stats = await quotaService.getUserUsageStats(user.id);
      setUsageStats({
        messagesRemaining: Math.max(0, stats.currentQuotas.max_messages_per_day - (stats.todayUsage.message_count || 0)),
        aiRequestsRemaining: Math.max(0, stats.currentQuotas.max_ai_requests_per_hour - stats.todayUsage.ai_requests_made),
        costToday: stats.todayUsage.estimated_cost_usd,
      });
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Failed to get usage stats: ', error);
    }
  }, [user?.id]);

  // Stub implementations
  const retryMessage = useCallback(async (messageId: string) => {
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('Retry message: ', messageId);
  }, []);

  const editMessage = useCallback(async (messageId: string, newContent: string) => {
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('Edit message: ', messageId, newContent);
  }, []);

  const deleteMessage = useCallback(async (messageId: string) => {
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('Delete message: ', messageId);
  }, []);

  const reactToMessage = useCallback(async (messageId: string, emoji: string) => {
    if (!enableReactions) return;
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('React to message: ', messageId, emoji);
  }, [enableReactions]);

  const markAsRead = useCallback(async (messageId: string) => {
    if (!autoMarkAsRead) return;
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('Mark as read: ', messageId);
  }, [autoMarkAsRead]);

  useEffect(() => {
    fetchMessages(0);
    checkQuotas();
    getUsageStats();
  }, [conversationId, fetchMessages, checkQuotas, getUsageStats]);

  useEffect(() => {
    const interval = setInterval(() => {
      refreshQuotas();
      getUsageStats();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refreshQuotas, getUsageStats]);

  return {
    ...state,
    quotas,
    usageStats,
    sendMessage,
    retryMessage,
    editMessage,
    deleteMessage,
    reactToMessage,
    markAsRead,
    loadMoreMessages,
    refreshQuotas,
    getUsageStats,
  };
}

// Clean up old cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of messageCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      messageCache.delete(key);
    }
  }
}, 10 * 60 * 1000); // Every 10 minutes 