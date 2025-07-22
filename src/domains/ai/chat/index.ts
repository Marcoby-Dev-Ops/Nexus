/**
 * AI Chat Subdomain
 * Handles all chat-related functionality including quick chat, organizational chat, and chat integration
 */

// Chat Components
export { BusinessIntelligentChat } from './components/BusinessIntelligentChat';
export { ChatIntegrationExample } from './components/ChatIntegrationExample';
export { OrganizationalChatPanel } from './components/OrganizationalChatPanel';
export { default as ExecutiveAssistantWidget } from './components/QuickChat';
export { QuickChatTrigger } from './components/QuickChatTrigger';
export { MessageFeedback } from './components/MessageFeedback';
export { default as VirtualizedMessageList } from './components/VirtualizedMessageList';
export { default as ContextChips } from './components/ContextChips';
export { ContextChipsDemo } from './components/ContextChipsDemo';

// Chat Types
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
  metadata?: Record<string, any>;
}

export interface ChatContext {
  userId: string;
  sessionId: string;
  conversationId: string;
  pageContext?: Record<string, any>;
  userContext?: Record<string, any>;
}

export interface ChatConfig {
  enableQuickChat: boolean;
  enableFullChat: boolean;
  enableOrganizationalChat: boolean;
  maxMessageLength: number;
  enableStreaming: boolean;
} 