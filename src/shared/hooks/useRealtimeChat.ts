import { useEffect, useState } from 'react';
import { supabase } from "@/core/supabase";
import type { ChatMessage } from "@/core/supabase";

export function useRealtimeChat(conversationId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Don't fetch if conversationId is empty
    if (!conversationId) {
      setLoading(false);
      return;
    }

    // Initial fetch of messages
    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setMessages(data);
      } catch (err) {
        setError(err instanceof Error ? err: new Error('Failed to fetch messages'));
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Subscribe to new messages
    const subscription = supabase
      .channel(`chat: ${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((current) => [...current, payload.new as ChatMessage]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [conversationId]);

  return { messages, loading, error };
} 