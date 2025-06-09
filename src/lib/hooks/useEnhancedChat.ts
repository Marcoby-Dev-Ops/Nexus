import { useState, useEffect, useCallback, useRef } from 'react';
import { useSupabase } from '../SupabaseProvider';
import { supabase } from '../supabase';
import type { ChatMessage, ChatState, ChatActions, StreamingMessage, AttachmentData } from '../types/chat';

interface UseEnhancedChatOptions {
  conversationId: string;
  enableTypingIndicators?: boolean;
  enableStreaming?: boolean;
  enableReactions?: boolean;
  autoMarkAsRead?: boolean;
}

export function useEnhancedChat(options: UseEnhancedChatOptions): ChatState & ChatActions {
  const {
    conversationId,
    enableTypingIndicators = true,
    enableStreaming = true,
    enableReactions = true,
    autoMarkAsRead = true,
  } = options;

  const { user } = useSupabase();

  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    error: null,
    currentConversationId: conversationId,
    typingUsers: [],
    streamingMessage: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Enhanced message fetching with offline support
  const fetchMessages = useCallback(async () => {
    if (!conversationId || !user) return;

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedMessages: ChatMessage[] = data.map((msg: any) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.created_at),
        status: 'delivered',
        type: msg.metadata?.type || 'text',
        metadata: msg.metadata,
      }));

      setState(prev => ({
        ...prev,
        messages: formattedMessages,
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to fetch messages',
        isLoading: false,
      }));
    }
  }, [conversationId, user]);

  // Enhanced send message with streaming support
  const sendMessage = useCallback(async (content: string, attachments?: File[]) => {
    if (!content.trim() || !conversationId || !user) return;

    // Create optimistic message
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
    }));

    try {
      // Handle file attachments if provided
      let attachmentData: AttachmentData[] = [];
      if (attachments && attachments.length > 0) {
        // TODO: Implement file upload logic
        console.log('File attachments:', attachments);
      }

      // Save user message to database
      const { data: savedMessage, error: saveError } = await supabase
        .from('chat_messages')
        .insert([
          {
            conversation_id: conversationId,
            user_id: user.id,
            role: 'user',
            content: content.trim(),
            metadata: { attachments: attachmentData },
          },
        ])
        .select()
        .single();

      if (saveError) throw saveError;

      // Update optimistic message with real ID
      setState(prev => ({
        ...prev,
        messages: prev.messages.map(msg =>
          msg.id === tempId
            ? { ...msg, id: savedMessage.id, status: 'sent' }
            : msg
        ),
      }));

      // Start AI response with streaming if enabled
      if (enableStreaming) {
        await handleStreamingResponse(content);
      } else {
        await handleRegularResponse(content);
      }
    } catch (error) {
      // Update message status to error
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
  }, [conversationId, enableStreaming]);

  // Streaming response handler using Supabase Edge Function
  const handleStreamingResponse = useCallback(async (userMessage: string) => {
    if (!user) {
      setState(prev => ({
        ...prev,
        error: 'User not authenticated',
        isLoading: false,
      }));
      return;
    }

    const streamingId = `streaming-${Date.now()}`;
    
    setState(prev => ({
      ...prev,
      streamingMessage: {
        id: streamingId,
        role: 'assistant',
        content: '',
        isComplete: false,
        chunks: [],
      },
    }));

    try {
      // Cancel any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      // Get project URL from environment
      const projectUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!projectUrl) throw new Error('Supabase URL not configured');

      const response = await fetch(`${projectUrl}/functions/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          message: userMessage,
          conversationId,
          enableStreaming: true,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      // Check if response is a stream
      const reader = response.body?.getReader();
      if (!reader) {
        // Fallback to regular response
        const data = await response.json();
        const finalMessage: ChatMessage = {
          id: data.message?.id || `msg-${Date.now()}`,
          role: 'assistant',
          content: data.message?.content || '',
          timestamp: new Date(),
          status: 'delivered',
          type: 'text',
        };

        setState(prev => ({
          ...prev,
          messages: [...prev.messages, finalMessage],
          streamingMessage: null,
          isLoading: false,
        }));
        return;
      }

      const decoder = new TextDecoder();
      let content = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        content += chunk;

        setState(prev => ({
          ...prev,
          streamingMessage: prev.streamingMessage
            ? {
                ...prev.streamingMessage,
                content,
                chunks: [...prev.streamingMessage.chunks, chunk],
              }
            : null,
        }));
      }

      // Complete the streaming message and save to database
      const finalMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content,
        timestamp: new Date(),
        status: 'delivered',
        type: 'text',
      };

      // Save AI response to database
      const { data: savedMessage } = await supabase
        .from('chat_messages')
        .insert([
          {
            conversation_id: conversationId,
            user_id: user.id,
            role: 'assistant',
            content,
            metadata: {},
          },
        ])
        .select()
        .single();

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, {
          ...finalMessage,
          id: savedMessage?.id || finalMessage.id,
        }],
        streamingMessage: null,
        isLoading: false,
      }));

    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        // Fall back to regular response on streaming failure
        await handleRegularResponse(userMessage);
      }
    }
  }, [conversationId, user?.id]);

  // Regular response handler (fallback)
  const handleRegularResponse = useCallback(async (userMessage: string) => {
    try {
      // Import your existing chat service
      const { enhancedChatService } = await import('../chatContext');
      const { executiveAgent } = await import('../agentRegistry');
      
      // Use your existing chat service with enhanced context
      const result = await enhancedChatService.sendMessageWithContext(
        conversationId,
        userMessage,
        executiveAgent,
        `session-${Date.now()}`
      );

      if (result.assistantMessage) {
        const aiMessage: ChatMessage = {
          id: result.assistantMessage.id,
          role: 'assistant',
          content: result.assistantMessage.content,
          timestamp: new Date(result.assistantMessage.created_at),
          status: 'delivered',
          type: 'text',
          metadata: result.assistantMessage.metadata,
        };

        setState(prev => ({
          ...prev,
          messages: [...prev.messages, aiMessage],
          isLoading: false,
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to get AI response',
        isLoading: false,
      }));
    }
  }, [conversationId]);

  // Retry failed message
  const retryMessage = useCallback(async (messageId: string) => {
    const message = state.messages.find(msg => msg.id === messageId);
    if (!message) return;

    setState(prev => ({
      ...prev,
      messages: prev.messages.map(msg =>
        msg.id === messageId
          ? { ...msg, status: 'sending' }
          : msg
      ),
    }));

    await sendMessage(message.content);
  }, [state.messages, sendMessage]);

  // Edit message
  const editMessage = useCallback(async (messageId: string, newContent: string) => {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({ content: newContent })
        .eq('id', messageId);

      if (error) throw error;

      setState(prev => ({
        ...prev,
        messages: prev.messages.map(msg =>
          msg.id === messageId
            ? { ...msg, content: newContent }
            : msg
        ),
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to edit message',
      }));
    }
  }, []);

  // Delete message
  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      setState(prev => ({
        ...prev,
        messages: prev.messages.filter(msg => msg.id !== messageId),
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to delete message',
      }));
    }
  }, []);

  // React to message
  const reactToMessage = useCallback(async (messageId: string, emoji: string) => {
    if (!enableReactions) return;

    try {
      // Implementation for message reactions
      console.log('React to message:', messageId, emoji);
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to add reaction',
      }));
    }
  }, [enableReactions]);

  // Mark message as read
  const markAsRead = useCallback(async (messageId: string) => {
    if (!autoMarkAsRead) return;
    // Implementation for read receipts
    console.log('Mark as read:', messageId);
  }, [autoMarkAsRead]);

  // Initialize and subscribe to changes
  useEffect(() => {
    if (!conversationId) return;

    fetchMessages();

    // Subscribe to new messages
    const subscription = supabase
      .channel(`chat:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload: any) => {
          const newMessage: ChatMessage = {
            id: payload.new.id,
            role: payload.new.role,
            content: payload.new.content,
            timestamp: new Date(payload.new.created_at),
            status: 'delivered',
            type: payload.new.metadata?.type || 'text',
            metadata: payload.new.metadata,
          };

          setState(prev => ({
            ...prev,
            messages: [...prev.messages, newMessage],
          }));
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [conversationId, fetchMessages]);

  return {
    ...state,
    sendMessage,
    retryMessage,
    editMessage,
    deleteMessage,
    reactToMessage,
    markAsRead,
  };
} 