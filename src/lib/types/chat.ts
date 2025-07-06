export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'error';
  type: 'text' | 'code' | 'image' | 'file' | 'error' | 'thinking' | 'streaming';
  metadata?: {
    agent_id?: string;
    context?: string;
    citations?: string[];
    attachments?: AttachmentData[];
    reactions?: MessageReaction[];
    [key: string]: unknown;
  };
}

export interface AttachmentData {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

export interface MessageReaction {
  emoji: string;
  users: string[];
  count: number;
}

export interface StreamingMessage {
  id: string;
  role: 'assistant';
  content: string;
  isComplete: boolean;
  chunks: string[];
}

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  currentConversationId: string | null;
  typingUsers: string[];
  streamingMessage: StreamingMessage | null;
}

export interface ChatActions {
  sendMessage: (content: string, attachments?: File[]) => Promise<void>;
  retryMessage: (messageId: string) => Promise<void>;
  editMessage: (messageId: string, newContent: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  reactToMessage: (messageId: string, emoji: string) => Promise<void>;
  markAsRead: (messageId: string) => Promise<void>;
} 