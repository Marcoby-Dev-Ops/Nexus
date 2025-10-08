/**
 * Enhanced Chat Types - Open WebUI inspired
 * Provides rich conversation and message management
 */

export interface Conversation {
  id: string;
  title: string;
  model: string;
  system_prompt?: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  user_id: string;
  is_archived: boolean;
  context: {
    last_activity: string;
    total_tokens?: number;
    context_length?: number;
    temperature?: number;
    max_tokens?: number;
  };
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  updated_at: string;
  metadata: {
    tokens?: number;
    model?: string;
    temperature?: number;
    streaming?: boolean;
    error?: string;
    attachments?: FileAttachment[];
    pacing_analysis?: PacingAnalysis;
  };
  transparency?: {
    decisionExplanation: {
      reasoning: string;
      methodology: string;
      confidence: number;
      alternatives: string[];
      dataSources: string[];
      impact: string;
    };
    personalityType: string;
    contextAnalysis: {
      isFavorableDecision: boolean;
      isHighPressure: boolean;
      isSensitiveTopic: boolean;
      isTechnicalTask: boolean;
      userExperienceLevel: string;
    };
    performanceMetrics: {
      accuracy: string;
      responseTime: string;
      userSatisfaction: string;
      successRate: string;
    };
    agentInfo: {
      name: string;
      background: string;
      transparencyStyle: string;
    };
  };
}

export interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  downloadUrl?: string;
  file?: File;
  status?: 'pending' | 'uploaded' | 'failed';
}

export interface PacingAnalysis {
  follows_pacing_rules: boolean;
  issues: string[];
  suggestions: string[];
}

export interface ChatState {
  messages: ChatMessage[];
  currentConversation: Conversation | null;
  conversations: Conversation[];
  isLoading: boolean;
  error: string | null;
  streamingMessage: ChatMessage | null;
  typingUsers: string[];
}

export interface ChatActions {
  sendMessage: (content: string, conversationId: string, attachments?: FileAttachment[]) => Promise<void>;
  saveAIResponse: (content: string, conversationId: string) => Promise<void>;
  fetchMessages: (conversationId: string) => Promise<void>;
  fetchConversations: () => Promise<void>;
  createConversation: (title: string, model: string, systemPrompt?: string, userId?: string) => Promise<string>;
  updateConversation: (conversationId: string, updates: Partial<Conversation>) => Promise<void>;
  archiveConversation: (conversationId: string) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
  clearMessages: () => void;
  setCurrentConversation: (conversation: Conversation | null) => void;
  setCurrentConversationById: (conversationId: string) => Promise<void>;
  // Streaming lifecycle helpers
  startStreamingResponse?: (tempId: string, conversationId: string, initialContent?: string) => void;
  appendStreamingChunk?: (tempId: string, chunk: string) => void;
  finishStreamingResponse?: (tempId: string, finalContent: string, serverMessage?: any) => Promise<void> | void;
  cancelStreamingResponse?: (tempId: string) => void;
}

export interface ChatQuotas {
  messages_per_day: number;
  ai_requests_per_day: number;
  max_conversations: number;
  max_message_length: number;
}

export interface ContextWindowConfig {
  maxTokens: number;
  maxMessages: number;
  preserveSystemPrompt: boolean;
  truncationStrategy: 'oldest' | 'middle' | 'smart';
}
