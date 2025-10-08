/**
 * Production-optimized chat hook with quota management, caching, and performance optimizations
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks';
import { quotaService, type ChatQuotaLimits } from '../services/quotaService';
import type { ChatMessage, ChatState, ChatActions, AttachmentData } from '@/core/types/chat';
import { logger } from '@/shared/utils/logger';
import { selectData, insertOne } from '@/lib/database';

interface UseProductionChatOptions {
  conversationId: string;
  enableReactions?: boolean;
  autoMarkAsRead?: boolean;
  pageSize?: number;
  enableCaching?: boolean;
}

interface ProductionChatState extends ChatState {
  quotas?: ChatQuotaLimits;
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
  conversationid: string;
  userid: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdat: string;
  metadata?: (Record<string, unknown> & { type?: ChatMessageType });
};

function extractRows<T>(payload: unknown): T[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload as T[];
  if (typeof payload === 'object') {
    const data = (payload as any).data;
    if (Array.isArray(data)) return data as T[];
  }
  return [];
}

export function useProductionChat(options: UseProductionChatOptions): ProductionChatState & ProductionChatActions {
  const {
    conversationId,
    enableReactions = false,
    autoMarkAsRead = false,
    pageSize = 50,
    enableCaching = true,
  } = options;

  // Capture current route info so we can include it in AI chat context
  // This hook is used within React components, so react-router hooks are available here.
  const location = useLocation();
  const params = useParams();

  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [hasMoreMessages, setHasMoreMessages] = useState<boolean>(true);
  const [quotas, setQuotas] = useState<ChatQuotaLimits>();
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
  // Keep refs for frequently-read values to avoid stale closures in async callbacks
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

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
    try {
      messageCache.set(key, { messages, timestamp: Date.now() });
    } catch (err) {
      // Ignore cache errors (shouldn't happen for in-memory Map)
      logger.warn('Failed to set message cache', err);
    }
  }, [enableCaching]);

  const checkQuotas = useCallback(async () => {
    const uid = userRef.current?.id;
    if (!uid) return { allowed: false, reason: 'Not authenticated' };

    const now = Date.now();
    if (now - lastQuotaCheckRef.current < 60_000) {
      return { allowed: !stateRef.current.isQuotaExceeded };
    }
    lastQuotaCheckRef.current = now;

    try {
      const quotaCheck = await quotaService.canSendMessage(uid);

      setState(prev => ({
        ...prev,
        quotas: quotaCheck.quotas,
        isQuotaExceeded: !quotaCheck.allowed,
        retryAfter: quotaCheck.retryAfter,
      }));

      if (quotaCheck.quotas) setQuotas(quotaCheck.quotas);

      return quotaCheck;
    } catch (err) {
      logger.error('Quota check failed: ', err);
      // Fail open for better UX: allow message send if quota service is down
      return { allowed: true };
    }
  }, []);

  const fetchMessages = useCallback(async (page: number = 0, skipCache: boolean = false) => {
    const uid = userRef.current?.id;
    if (!conversationId || !uid) return;

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

      const response = await selectData<ChatMessageRow>({
        table: 'chat_messages',
        filters: { conversationid: conversationId },
        orderBy: [{ column: 'createdat', ascending: false }],
        limit: pageSize,
        offset: page * pageSize,
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch messages');
      }

      const rows = extractRows<ChatMessageRow>(response.data);
      const formattedMessages: ChatMessage[] = rows.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.createdat),
        status: 'delivered' as const,
        type: (msg.metadata?.type as ChatMessageType) || 'text',
        metadata: msg.metadata as ChatMessage['metadata'],
      })).reverse();

      setCachedMessages(key, formattedMessages);

      setState(prev => ({
        ...prev,
        messages: page === 0 ? formattedMessages : [...prev.messages, ...formattedMessages],
        isLoading: false,
      }));

      setHasMoreMessages(formattedMessages.length === pageSize);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setState(prev => ({
        ...prev,
        error: message || 'Failed to fetch messages',
        isLoading: false,
      }));
      logger.error('fetchMessages error', { err, conversationId, page });
    }
  }, [conversationId, pageSize, getCachedMessages, setCachedMessages]);

  const sendMessage = useCallback(async (content: string, attachments: File[] = []) => {
    const uid = userRef.current?.id;
    if (!content?.trim() || !conversationId || !uid) return;

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
    const attachmentMetadata: AttachmentData[] = attachments.map((file, index) => ({
      id: `temp-attachment-${index}-${Date.now()}`,
      name: file.name,
      size: file.size,
      type: file.type,
      url: '',
    }));
    const optimisticMessage: ChatMessage = {
      id: tempId,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
      status: 'sending' as const,
      type: 'text',
      metadata: { attachments: attachmentMetadata },
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, optimisticMessage],
      isLoading: true,
      error: null,
      isQuotaExceeded: false,
    }));

    try {
      const { data: savedMessage, error: saveError } = await insertOne('chat_messages', {
        conversationid: conversationId,
        userid: uid,
        role: 'user',
        content: content.trim(),
        metadata: { attachments: attachmentMetadata },
      });

      if (saveError) throw saveError;

      await quotaService.recordUsage(uid, 'message');

      setState(prev => ({
        ...prev,
        messages: prev.messages.map(msg =>
          msg.id === tempId
            ? { ...msg, id: savedMessage?.id || tempId, status: 'sent' as const }
            : msg
        ),
      }));

      // Invalidate page 0 cache for this conversation
      messageCache.delete(`${conversationId}-0`);

      // Lazy-load heavy AI modules only when needed
      const [{ enhancedChatService }, { getAgent }] = await Promise.all([
        import('@/lib/ai/core/enhancedChatService'),
        import('@/lib/ai/core/agentRegistry'),
      ]);

      const recent = stateRef.current.messages.slice(-3).map(m => m.content);
      const companyId = (userRef.current as any)?.company_id ?? (userRef.current as any)?.companyId ?? null;

      const chatContext = {
        userId: uid,
        companyId: companyId ?? undefined,
        sessionId: conversationId,
        currentTopic: 'business discussion',
        recentInteractions: recent,
        userPreferences: {},
        route: {
          pathname: location?.pathname,
          search: location?.search,
          hash: location?.hash,
          state: (location as any)?.state,
          params: params || {},
          title: typeof document !== 'undefined' ? document.title : undefined,
        },
      };

      const result = await enhancedChatService.sendMessageWithContext({
        message: content.trim(),
        conversationId,
        agent: getAgent('concierge-director'),
        context: chatContext,
      });

      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: result.response,
        timestamp: new Date(),
        status: 'sent' as const,
        type: 'text',
        metadata: {
          agent: result.agent?.name,
          processingTime: result.metadata?.processingTime,
          companyDataUsed: result.metadata?.companyDataUsed,
          buildingBlocksUsed: result.metadata?.buildingBlocksUsed,
        },
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, aiMessage],
        isLoading: false,
      }));

    } catch (err) {
      logger.error('Failed to send message: ', err);
      setState(prev => ({
        ...prev,
        messages: prev.messages.map(msg => (msg.id === tempId ? { ...msg, status: 'error' as const } : msg)),
        error: err instanceof Error ? err.message : String(err),
        isLoading: false,
      }));
    }
  }, [conversationId, checkQuotas, location, params]);

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
    const uid = userRef.current?.id;
    if (!uid) return;
    try {
      const stats = await quotaService.getUserUsageStats(uid);
      setUsageStats({
        messagesRemaining: Math.max(0, stats.currentQuotas.max_messages_per_day - (stats.todayUsage.message_count || 0)),
        aiRequestsRemaining: Math.max(0, stats.currentQuotas.max_ai_requests_per_hour - stats.todayUsage.ai_requests_made),
        costToday: stats.todayUsage.estimated_cost_usd,
      });
      setQuotas(stats.currentQuotas);
    } catch (error) {
      logger.error('Failed to get usage stats: ', error);
    }
  }, []);

  // Stub implementations
  const retryMessage = useCallback(async (messageId: string) => {
    logger.info('Retry message', { messageId });
  }, []);

  const editMessage = useCallback(async (messageId: string, newContent: string) => {
    logger.info('Edit message', { messageId, newContent });
  }, []);

  const deleteMessage = useCallback(async (messageId: string) => {
    logger.info('Delete message', { messageId });
  }, []);

  const reactToMessage = useCallback(async (messageId: string, emoji: string) => {
    if (!enableReactions) return;
    logger.info('React to message', { messageId, emoji });
  }, [enableReactions]);

  const markAsRead = useCallback(async (messageId: string) => {
    if (!autoMarkAsRead) return;
    logger.info('Mark as read', { messageId });
  }, [autoMarkAsRead]);

  useEffect(() => {
    fetchMessages(0);
    checkQuotas();
    getUsageStats();
  }, [conversationId, fetchMessages, checkQuotas, getUsageStats]);

  useEffect(() => {
    // Use longer intervals in development to reduce resource usage
    const refreshInterval = import.meta.env.DEV ? 10 * 60 * 1000 : 5 * 60 * 1000; // 10min dev, 5min prod
    const interval = setInterval(() => {
      refreshQuotas();
      getUsageStats();
    }, refreshInterval);
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
