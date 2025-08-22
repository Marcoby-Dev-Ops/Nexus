import { create } from 'zustand';
import { selectData, insertOne, updateOne } from '@/lib/api-client';
import { logger } from '@/shared/utils/logger';

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
}

interface ChatState {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
}

interface ChatActions {
  sendMessage: (content: string) => Promise<void>;
  fetchMessages: (conversationId: string) => Promise<void>;
  clearMessages: () => void;
}

export const useAIChatStore = create<ChatState & ChatActions>((set, get) => ({
  messages: [],
  loading: false,
  error: null,

  sendMessage: async (content: string) => {
    set({ loading: true, error: null });
    try {
      const message: Omit<ChatMessage, 'id' | 'timestamp'> = {
        content,
        role: 'user',
      };
      const { data, error } = await insertOne('chat_messages', message);
      if (error) {
        logger.error({ error }, 'Failed to send message');
        set({ error: 'Failed to send message', loading: false });
        return;
      }
      set(state => ({
        messages: [...state.messages, data],
        loading: false,
      }));
    } catch (err) {
      logger.error({ err }, 'Error sending message');
      set({ error: 'Error sending message', loading: false });
    }
  },

  fetchMessages: async (conversationId: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await select('chat_messages', '*', { conversation_id: conversationId });
      if (error) {
        logger.error({ error }, 'Failed to fetch messages');
        set({ error: 'Failed to fetch messages', loading: false });
        return;
      }
      set({ messages: data || [], loading: false });
    } catch (err) {
      logger.error({ err }, 'Error fetching messages');
      set({ error: 'Error fetching messages', loading: false });
    }
  },

  clearMessages: () => {
    set({ messages: [], error: null });
  },
})); 