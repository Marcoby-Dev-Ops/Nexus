import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { produce } from 'immer';
import type { AgentResponse } from '@/domains/ai/lib/assistant/types';
import { supabase } from '@/core/supabase';
import { immer } from 'zustand/middleware/immer';

export type AIRole = 'user' | 'assistant' | 'system';

export interface AIMessage {
  id: string;
  conversationId: string;
  userId: string;
  role: AIRole;
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
  loadOlderMessages: (conversationId: string, before?: string, limit?: number) => Promise<number>;
  reset: () => void;
}

// Helper to call Edge Function with dev fallback
const callAIEndpoint = async (payload: any) => {
  const endpoints = ['/functions/v1/ai_chat', '/api/ai_chat'];
  let lastErr: any;
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) return res;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error('AI endpoint not available');
};

const streamAI = async (
  payload: { message: string; conversationId: string; metadata: any },
  onToken: (token: string) => void
): Promise<string> => {
  const res = await callAIEndpoint(payload);
  if (!res.body) throw new Error('No stream');
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    full += chunk;
    onToken(full);
  }
  return full;
};

export const useAIChatStore = create<AIChatStoreState>()(
  devtools((set, get) => ({
    conversations: {},
    activeConversationId: null,
    loading: false,
    error: null,

    async sendMessage(conversationId, message, userId, companyId) {
      set({ loading: true, error: null });
      const msg: AIMessage = {
        id: crypto.randomUUID(),
        conversationId,
        userId,
        role: 'user',
        content: message,
        createdAt: new Date().toISOString(),
      };
      set(produce((state: AIChatStoreState) => {
        if (!state.conversations[conversationId]) {
          state.conversations[conversationId] = {
            id: conversationId,
            title: 'Untitled',
            messages: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        }
        state.conversations[conversationId].messages.push(msg);
      }));
      // Call Supabase Edge Function to get AI response
      const aiMsgId = crypto.randomUUID();
      try {
        const { data, error } = await (supabase as any).functions.invoke('ai_chat', {
          body: {
            message,
            conversationId,
            metadata: { userId },
          },
        });

        if (error) throw error;

        const aiContent = (data as any)?.message ||
          (typeof data === 'string' ? data : '');

        // Persist AI response (edge function already does, but we keep local state in sync)
        set(produce((state: AIChatStoreState) => {
          const conv = state.conversations[conversationId];
          if (!conv) return;
          const aiMsg: AIMessage = {
            id: aiMsgId,
            conversationId,
            userId: 'assistant',
            role: 'assistant',
            content: aiContent,
            createdAt: new Date().toISOString(),
          };
          conv.messages.push(aiMsg);
        }));

        // After successful AI response, trigger Executive Assistant Orchestrator
        // for complex query analysis and potential workflow routing
        if (companyId) {
          try {
            // Get conversation history for context
            const conversation = get().conversations[conversationId];
            const conversationText = conversation?.messages
              .slice(-5) // Last 5 messages for context
              .map(m => `${m.role}: ${m.content}`)
              .join('\n');

            // Trigger orchestrator workflow (non-blocking)
            await (supabase as any).functions.invoke('trigger-n8n-workflow', {
              body: {
                workflow_name: 'executive_assistant_orchestrator',
                payload: {
                  query: message,
                  conversation: conversationText,
                  user_id: userId,
                  company_id: companyId,
                  conversation_id: conversationId,
                  user_context: `Recent conversation with ${conversation?.messages.length || 0} messages`,
                  supabase_url: import.meta.env.VITE_SUPABASE_URL,
                  supabase_anon_key: import.meta.env.VITE_SUPABASE_ANON_KEY,
                },
              },
            });
          } catch (orchestratorError) {
            // Don't fail the main chat if orchestrator fails
            console.warn('Executive Assistant Orchestrator failed:', orchestratorError);
          }
        }
      } catch (e: any) {
        set({ error: e.message || 'Failed to send message' });
      } finally {
        set({ loading: false });
      }
    },

    async loadConversation(conversationId) {
      set({ loading: true, error: null });
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(conversationId)) {
        set({ loading: false });
        return;
      }
      try {
        // Fetch from both tables in parallel
        const { data: aiMessages, error: aiError } = await supabase
          .from('ai_messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        const { data: chatMessages, error: chatError } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (aiError) throw aiError;
        if (chatError) throw chatError;

        const combined = [...(aiMessages || []), ...(chatMessages || [])] as any[];

        combined.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        set(produce((state: AIChatStoreState) => {
          state.conversations[conversationId] = {
            id: conversationId,
            title: 'Untitled',
            messages: combined.map((m) => ({
              id: m.id,
              conversationId: m.conversation_id,
              userId: m.user_id,
              role: m.role ?? 'assistant',
              content: m.content,
              createdAt: m.created_at,
            })),
            createdAt: combined[0]?.created_at || new Date().toISOString(),
            updatedAt: combined[combined.length - 1]?.created_at || new Date().toISOString(),
          };
        }));
      } catch (e: any) {
        set({ error: e.message || 'Failed to load conversation' });
      } finally {
        set({ loading: false });
      }
    },

    setActiveConversation(conversationId) {
      set({ activeConversationId: conversationId });
    },

    async newConversation(title = 'New Conversation') {
      // Get current user id for conversation owner
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Persist conversation row and retrieve the generated id
      const { data, error } = await supabase
        .from('ai_conversations')
        .insert({
          title,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      const id = data.id as string;

      set(produce((state: AIChatStoreState) => {
        state.conversations[id] = {
          id,
          title,
          messages: [],
          createdAt: data.created_at || new Date().toISOString(),
          updatedAt: data.updated_at || new Date().toISOString(),
        };
        state.activeConversationId = id;
      }));
      return id;
    },

    /**
     * Fetch older messages before a given timestamp (or before the earliest
     * currently loaded message) and prepend them to local state. Returns the
     * number of messages loaded so the caller can decide whether to keep
     * requesting more.
     */
    async loadOlderMessages(conversationId, before, limit = 50) {
      const state = get();
      const conv = state.conversations[conversationId];
      if (!conv) return 0;

      const anchor = before || conv.messages[0]?.createdAt;
      if (!anchor) return 0;

      const { data, error } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .lt('created_at', anchor)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
         
        console.error('loadOlderMessages error', error);
        return 0;
      }

      if (!data || data.length === 0) return 0;

      set(produce((draft: AIChatStoreState) => {
        const dConv = draft.conversations[conversationId];
        if (!dConv) return;
        const newMsgs = (data as any[]).map((m) => ({
          id: m.id,
          conversationId: m.conversation_id,
          userId: m.user_id,
          role: m.role,
          content: m.content,
          createdAt: m.created_at,
        }));
        // Prepend in chronological order
        dConv.messages = [...newMsgs.reverse(), ...dConv.messages];
      }));

      return data.length;
    },

    reset() {
      set({ conversations: {}, activeConversationId: null, loading: false, error: null });
    },
  }))
);

/**
 * Memoized selector for active conversation.
 */
export const useActiveConversation = () =>
  useAIChatStore(s => s.activeConversationId ? s.conversations[s.activeConversationId] : undefined); 