import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { AgentResponse } from '@/features/ai-assistant/lib/agents/types';

export interface AIMessage {
  id: string;
  conversationId: string;
  userId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

export interface AIConversation {
  id: string;
  title: string;
  messages: AIMessage[];
  createdAt: string;
  updatedAt: string;
}

interface AIChatStoreState {
  conversations: Record<string, AIConversation>;
  activeConversationId: string | null;
  loading: boolean;
  error: string | null;
  sendMessage: (conversationId: string, message: string, userId: string) => Promise<void>;
  loadConversation: (conversationId: string) => Promise<void>;
  setActiveConversation: (conversationId: string) => void;
  newConversation: (title?: string) => Promise<string>;
}

export const useAIChatStore = create<AIChatStoreState>()(
  devtools((set, get) => ({
    conversations: {},
    activeConversationId: null,
    loading: false,
    error: null,

    async sendMessage(conversationId, message, userId) {
      set({ loading: true, error: null });
      try {
        // Optimistically add user message
        const msg: AIMessage = {
          id: crypto.randomUUID(),
          conversationId,
          userId,
          role: 'user',
          content: message,
          createdAt: new Date().toISOString(),
        };
        const conv = get().conversations[conversationId];
        set({
          conversations: {
            ...get().conversations,
            [conversationId]: {
              ...conv,
              messages: [...(conv?.messages || []), msg],
            },
          },
        });
        // Call Edge Function
        const res = await fetch('/functions/v1/ai_chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, conversationId, metadata: { userId } }),
        });
        const data: AgentResponse & { success?: boolean } = await res.json();
        if (!res.ok || !data.success) throw new Error((data as any).error || 'AI error');
        // Add AI response
        const aiMsg: AIMessage = {
          id: crypto.randomUUID(),
          conversationId,
          userId: 'assistant',
          role: 'assistant',
          content: data.content,
          createdAt: new Date().toISOString(),
        };
        set({
          conversations: {
            ...get().conversations,
            [conversationId]: {
              ...get().conversations[conversationId],
              messages: [...get().conversations[conversationId].messages, aiMsg],
            },
          },
        });
      } catch (e: any) {
        set({ error: e.message || 'Failed to send message' });
      } finally {
        set({ loading: false });
      }
    },

    async loadConversation(conversationId) {
      set({ loading: true, error: null });
      try {
        // TODO: fetch from Supabase if needed
        // For now, just ensure conversation exists
        if (!get().conversations[conversationId]) {
          set({
            conversations: {
              ...get().conversations,
              [conversationId]: {
                id: conversationId,
                title: 'Untitled',
                messages: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            },
          });
        }
      } finally {
        set({ loading: false });
      }
    },

    setActiveConversation(conversationId) {
      set({ activeConversationId: conversationId });
    },

    async newConversation(title = 'New Conversation') {
      const id = crypto.randomUUID();
      set({
        conversations: {
          ...get().conversations,
          [id]: {
            id,
            title,
            messages: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        },
        activeConversationId: id,
      });
      return id;
    },
  }))
); 