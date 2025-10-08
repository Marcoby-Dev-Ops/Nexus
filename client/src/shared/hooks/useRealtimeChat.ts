import { useState, useCallback } from 'react';
import { selectData, insertOne } from '@/lib/api-client';
import { logger } from '@/shared/utils/logger';

interface RealtimeMessage {
  id: string;
  content: string;
  user_id: string;
  channel: string;
  timestamp: string;
}

export const useRealtimeChat = (channel: string) => {
  const [messages, setMessages] = useState<RealtimeMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await select('realtime_messages', '*', { channel });
      if (error) {
        logger.error({ error }, 'Failed to fetch realtime messages');
        setError('Failed to fetch messages');
        return;
      }
      setMessages(data || []);
    } catch (err) {
      logger.error({ err }, 'Error fetching realtime messages');
      setError('Error fetching messages');
    } finally {
      setLoading(false);
    }
  }, [channel]);

  const sendMessage = useCallback(async (content: string, userId: string) => {
    try {
      const message: Omit<RealtimeMessage, 'id' | 'timestamp'> = {
        content,
        user_id: userId,
        channel,
      };
      const { data, error } = await insertOne('realtime_messages', message);
      if (error) {
        logger.error({ error }, 'Failed to send realtime message');
        return;
      }
      setMessages(prev => [...prev, data]);
    } catch (err) {
      logger.error({ err }, 'Error sending realtime message');
    }
  }, [channel]);

  return {
    messages,
    loading,
    error,
    fetchMessages,
    sendMessage,
  };
}; 
