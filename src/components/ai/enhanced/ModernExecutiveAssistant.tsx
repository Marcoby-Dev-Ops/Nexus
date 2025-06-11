import React, { useState, useRef, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Send, 
  Copy, 
  ThumbsUp, 
  ThumbsDown, 
  RefreshCw, 
  Sparkles,
  Code,
  FileText,
  Lightbulb,
  Settings,
  ChevronDown,
  Mic,
  Paperclip,
  Plus,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { executiveAgent } from '@/lib/agentRegistry';
import { useEnhancedChat } from '@/lib/hooks/useEnhancedChat';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';

/**
 * Modern Executive Assistant inspired by ChatGPT and Claude interfaces
 */
interface ModernExecutiveAssistantProps {
  onClose?: () => void;
  sessionId?: string;
}

/**
 * Welcome screen component (Claude-inspired)
 */
const WelcomeScreen: React.FC<{
  userName?: string;
  onQuickAction: (prompt: string) => void;
}> = ({ userName, onQuickAction }) => {
  const quickActions = [
    {
      icon: <FileText className="w-5 h-5" />,
      label: 'Write',
      description: 'Help with documents and content',
      prompt: 'Help me write a professional document'
    },
    {
      icon: <Code className="w-5 h-5" />,
      label: 'Code',
      description: 'Debug and write code',
      prompt: 'Help me with a coding problem'
    },
    {
      icon: <Lightbulb className="w-5 h-5" />,
      label: 'Ideas',
      description: 'Brainstorm and strategize',
      prompt: 'Help me brainstorm ideas for'
    },
    {
      icon: <MessageSquare className="w-5 h-5" />,
      label: 'Chat',
      description: 'General conversation',
      prompt: 'Let\'s have a conversation about'
    }
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      {/* Personalized greeting (Claude-style) */}
      <div className="mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mb-4 mx-auto">
          <Sparkles className="w-8 h-8 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-semibold text-foreground mb-2">
          {userName ? `Back at it, ${userName}` : 'Welcome to Nexus AI'}
        </h1>
        <p className="text-muted-foreground">
          Your intelligent productivity companion
        </p>
      </div>

      {/* Quick action buttons (Claude-inspired) */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-md">
        {quickActions.map((action) => (
          <button
            key={action.label}
            onClick={() => onQuickAction(action.prompt)}
            className="p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/50 transition-all text-left group"
          >
            <div className="flex items-center gap-4 mb-2">
              <div className="text-primary group-hover:scale-110 transition-transform">
                {action.icon}
              </div>
              <span className="font-medium text-foreground">{action.label}</span>
            </div>
            <p className="text-sm text-muted-foreground">{action.description}</p>
          </button>
        ))}
      </div>

      {/* Suggestions */}
      <div className="mt-8 text-sm text-muted-foreground max-w-md">
        <p>Try asking about your current page, data analysis, or workflow optimization.</p>
      </div>
    </div>
  );
};

/**
 * Message actions toolbar (ChatGPT-inspired)
 */
const MessageActions: React.FC<{
  messageId: string;
  content: string;
  onCopy: (content: string) => void;
  onRegenerate: (messageId: string) => void;
  onReact: (messageId: string, type: 'like' | 'dislike') => void;
}> = ({ messageId, content, onCopy, onRegenerate, onReact }) => {
  const [showActions, setShowActions] = useState(false);

  return (
    <div 
      className="opacity-0 group-hover:opacity-100 transition-opacity"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-center gap-1 mt-2">
        <button
          onClick={() => onCopy(content)}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          title="Copy message"
        >
          <Copy className="w-4 h-4" />
        </button>
        <button
          onClick={() => onReact(messageId, 'like')}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          title="Good response"
        >
          <ThumbsUp className="w-4 h-4" />
        </button>
        <button
          onClick={() => onReact(messageId, 'dislike')}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          title="Poor response"
        >
          <ThumbsDown className="w-4 h-4" />
        </button>
        <button
          onClick={() => onRegenerate(messageId)}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          title="Regenerate response"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

/**
 * Main Modern Executive Assistant Component
 */
export const ModernExecutiveAssistant: React.FC<ModernExecutiveAssistantProps> = ({ 
  onClose, 
  sessionId = '' 
}) => {
  const { user } = useAuth();
  const location = useLocation();
  const [conversationId, setConversationId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Enhanced chat hook
  const {
    messages,
    isLoading,
    error,
    streamingMessage,
    sendMessage,
    retryMessage,
    editMessage,
    deleteMessage,
    reactToMessage,
    markAsRead
  } = useEnhancedChat({
    conversationId,
    enableStreaming: false, // Temporarily disabled until Edge Function supports streaming
    enableReactions: true,
    enableTypingIndicators: true
  });

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage, scrollToBottom]);

  // Initialize conversation using your existing chat system
  useEffect(() => {
    const initConversation = async () => {
      if (!user || conversationId) return;

      try {
        // Import your existing chat history service
        const { chatHistory } = await import('@/lib/supabase');
        const { executiveAgent } = await import('@/lib/agentRegistry');
        
        // Try to get recent conversations first
        const recentConversations = await chatHistory.getRecentConversations(1);
        
        if (recentConversations && recentConversations.length > 0 && !sessionId) {
          // Use the most recent conversation if no specific session is provided
          setConversationId(recentConversations[0].id);
        } else {
          // Create a new conversation
          const conversation = await chatHistory.createConversation(
            'New Conversation',
            executiveAgent.id,
            { 
              page: location.pathname,
              user_id: user.id,
              session_id: sessionId 
            }
          );
          setConversationId(conversation.id);
          
          // Add system message
          const systemMessage = {
            role: 'system' as const,
            content: `You are Nexus, an intelligent AI assistant for a Microsoft 365-like productivity platform. You help users navigate their workspace, manage tasks, analyze data, and boost productivity. Be helpful, concise, and professional.`,
            metadata: { agent_id: executiveAgent.id }
          };
          await chatHistory.addMessage(conversation.id, systemMessage);
        }
      } catch (err) {
        console.error('Failed to initialize conversation:', err);
      }
    };

    initConversation();
  }, [user, conversationId, sessionId, location.pathname]);

  // Handle quick actions from welcome screen
  const handleQuickAction = (prompt: string) => {
    sendMessage(prompt);
  };

  // Handle message copy
  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Handle message regeneration
  const handleRegenerate = (messageId: string) => {
    retryMessage(messageId);
  };

  // Handle reactions
  const handleReact = (messageId: string, type: 'like' | 'dislike') => {
    const emoji = type === 'like' ? '👍' : '👎';
    reactToMessage(messageId, emoji);
  };

  // Filter out system messages for display
  const displayMessages = messages.filter(msg => msg.role !== 'system');
  const hasMessages = displayMessages.length > 0 || streamingMessage;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header (inspired by modern chat interfaces) */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Nexus AI</h2>
            <p className="text-xs text-muted-foreground">
              {isLoading ? 'Thinking...' : 'Ready to help'}
            </p>
          </div>
        </div>
        
        {/* Model indicator (Claude-inspired) */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">GPT-4</span>
          <div className="w-2 h-2 bg-success rounded-full" />
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        {!hasMessages ? (
          <WelcomeScreen 
            userName={user?.user_metadata?.full_name || user?.email?.split('@')[0]}
            onQuickAction={handleQuickAction}
          />
        ) : (
          <div className="max-w-4xl mx-auto px-4 py-6">
            {/* Message history */}
            <div className="space-y-6">
              {displayMessages.map((message) => (
                <div key={message.id} className="group">
                  <MessageBubble
                    message={message}
                    isCurrentUser={message.role === 'user'}
                    showAvatar={true}
                    showTimestamp={true}
                    onEdit={editMessage}
                    onDelete={deleteMessage}
                    onRetry={retryMessage}
                    onReact={reactToMessage}
                    onCopy={handleCopy}
                  />
                  
                  {/* Message actions (only for assistant messages) */}
                  {message.role === 'assistant' && (
                    <MessageActions
                      messageId={message.id}
                      content={message.content}
                      onCopy={handleCopy}
                      onRegenerate={handleRegenerate}
                      onReact={handleReact}
                    />
                  )}
                </div>
              ))}

              {/* Streaming message */}
              {streamingMessage && (
                <div className="group">
                  <MessageBubble
                    message={{
                      ...streamingMessage,
                      timestamp: new Date(),
                      status: 'delivered',
                      type: 'streaming',
                      metadata: { isComplete: streamingMessage.isComplete }
                    }}
                    isCurrentUser={false}
                    showAvatar={true}
                    showTimestamp={false}
                  />
                </div>
              )}

              {/* Loading indicator */}
              {isLoading && !streamingMessage && (
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div className="bg-muted rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-1">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"
                          style={{ animationDelay: `${i * 150}ms` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Error display */}
            {error && (
              <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area (modern, ChatGPT/Claude inspired) */}
      <div className="border-t border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto">
          <ChatInput
            onSendMessage={sendMessage}
            placeholder={hasMessages ? "Message Nexus AI..." : "How can I help you today?"}
            disabled={isLoading}
            maxLength={4000}
            enableVoiceInput={true}
            enableFileUpload={true}
            className="border-none bg-transparent"
          />
        </div>

        {/* Footer disclaimer (ChatGPT-inspired) */}
        <div className="text-center py-2 text-xs text-muted-foreground">
          Nexus AI can make mistakes. Check important info.
        </div>
      </div>
    </div>
  );
};

ModernExecutiveAssistant.propTypes = {
  onClose: PropTypes.func,
  sessionId: PropTypes.string,
};

export default ModernExecutiveAssistant; 