import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';
import { API_CONFIG } from '@/lib/constants';

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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        set({ error: 'Not authenticated', loading: false });
        return;
      }

      try {
        // Optimistically add user message
        const userMsg: AIMessage = {
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
              messages: [...(conv?.messages || []), userMsg],
            },
          },
        });

        // Call Edge Function to get AI response
        const res = await fetch(`${API_CONFIG.BASE_URL}/functions/v1/ai_chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ message, conversationId, metadata: { userId } }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'AI error');
        }

        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'AI error');

        // Add AI response from backend
        const aiMsg: AIMessage = data.message;
        set({
          conversations: {
            ...get().conversations,
            [conversationId]: {
              ...get().conversations[conversationId],
              messages: [...get().conversations[conversationId].messages, aiMsg],
            },
          },
        });
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : 'Failed to send message';
        set({ error: errorMessage });
      } finally {
        set({ loading: false });
      }
    },

    async loadConversation(conversationId) {
      set({ loading: true, error: null });
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        set({ error: 'Not authenticated', loading: false });
        return;
      }
      
      try {
        // Check if conversation already exists in memory
        if (get().conversations[conversationId]) {
          set({ loading: false });
          return;
        }

        // Load conversation from Supabase
        const res = await fetch(`${API_CONFIG.BASE_URL}/functions/v1/ai_chat/${conversationId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
        });
        
        if (res.ok) {
          const conversation: AIConversation = await res.json();
          set((state) => ({
            conversations: {
              ...state.conversations,
              [conversationId]: conversation,
            },
          }));
        } else {
          const err = await res.json();
          throw new Error(err.error || `Conversation ${conversationId} not found`);
        }
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : 'Failed to load conversation';
        set({ error: errorMessage });
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