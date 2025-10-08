import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { postgres } from "@/lib/postgres";
import { API_CONFIG } from '@/core/constants';
import { callEdgeFunction } from '@/lib/api-client';
import { authentikAuthService } from '@/core/auth/authentikAuthServiceInstance';

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
  sendMessage: (conversationId: string, message: string, userId: string, companyId?: string) => Promise<void>;
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

    async sendMessage(conversationId, message, userId, companyId) {
      set({ loading: true, error: null });
      const result = await authentikAuthService.getSession();
      const session = result.data;
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

        // Call AI Gateway to get AI response
        const res = await fetch(`${API_CONFIG.BASE_URL}/api/ai/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ 
            messages: [{ role: 'user', content: message }],
            tenantId: 'default-tenant',
            userId: userId 
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'AI error');
        }

        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'AI error');

        // Add AI response from backend
        const aiMsg: AIMessage = {
          id: crypto.randomUUID(),
          conversationId,
          userId,
          role: 'assistant',
          content: data.message,
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

        // Trigger n8n workflow for assessment analysis
        if (companyId) {
          try {
            const conversationText = get().conversations[conversationId].messages.map(m => `${m.role}: ${m.content}`).join('\n');
            
            // Fire-and-forget, no need to await
            await callEdgeFunction('trigger-n8n-workflow', {
              workflow: 'ai-chat-processing',
              data: {
                message: message,
                userId: session?.user?.id,
                timestamp: new Date().toISOString()
              }
            });

          } catch (e) {
             
     
    // eslint-disable-next-line no-console
    console.warn('Failed to trigger n8n workflow', e);
          }
        }

      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message: 'Failed to send message';
        set({ error: errorMessage });
      } finally {
        set({ loading: false });
      }
    },

    async loadConversation(conversationId) {
      set({ loading: true, error: null });
      const sessionResult = await authentikAuthService.getSession();
      const session = sessionResult.data;
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

        // Load conversation from AI Gateway
        const res = await fetch(`${API_CONFIG.BASE_URL}/api/ai/chat/${conversationId}`, {
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
        const errorMessage = e instanceof Error ? e.message: 'Failed to load conversation';
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
