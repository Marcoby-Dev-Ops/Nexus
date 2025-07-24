import React, { useState, useRef, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '@/core/auth/AuthProvider';
import { Sparkles, FileText, Code, Lightbulb, MessageSquare, Send } from 'lucide-react';
import { useAIChatStore, useActiveConversation, type AIConversation } from '@/shared/stores/useAIChatStore';
import { VirtualizedMessageList } from '@/domains/ai/chat';
import { MVPScopeIndicator } from '@/domains/ai/components/MVPScopeIndicator';
import { MessageFeedback } from '@/domains/ai/chat';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { ActionCard } from '@/domains/ai/components/ActionCard';
import { useActionCards } from '@/shared/hooks/useActionCards';
import { ContextChips } from '@/domains/ai/chat';
// Mock service for now
const ContextSourceService = {
  createMockContextSources: () => [
    { id: '1', type: 'business-data', name: 'Q3 Metrics', confidence: 0.95 },
    { id: '2', type: 'document', name: 'Strategy Doc', confidence: 0.88 }
  ]
};
import { ContextCompletionSuggestions } from '@/domains/ai/components/ContextCompletionSuggestions';
import { useContextualDataCompletion } from '@/domains/ai/hooks/useContextualDataCompletion';

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
          {userName ? `Back at it, ${userName}` : 'Welcome to Nex'}
        </h1>
        <p className="text-muted-foreground">
          Your intelligent business companion
        </p>
      </div>

      {/* Quick action buttons (Claude-inspired) */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-md">
        {quickActions.map((action) => (
          <button
            key={action.label}
            onClick={() => onQuickAction(action.prompt)}
            className="p-4 rounded-xl border border-border hover: border-primary/50 hover:bg-muted/50 transition-all text-left group"
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

      {/* MVP Scope Indicator */}
      <div className="mt-8 w-full max-w-2xl">
        <MVPScopeIndicator />
      </div>

      {/* Suggestions */}
      <div className="mt-6 text-sm text-muted-foreground max-w-md">
        <p>Try asking about your current page, data analysis, or workflow optimization.</p>
      </div>
    </div>
  );
};

type MessageType = import('@/shared/stores/useAIChatStore').AIMessage;
const MessageBubble: React.FC<{ msg: MessageType; conversationId: string }> = React.memo(
  ({ msg, conversationId }) => {
    const isUser = msg.role === 'user';
    return (
      <div className={`mb-4 flex ${isUser ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-[80%] ${isUser ? 'flex flex-col items-end' : 'flex flex-col items-start'}`}>
          <div
            className={`px-4 py-2 rounded-lg whitespace-pre-wrap break-words ${isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}
          >
            {isUser ? (
              msg.content
            ) : (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                className="prose prose-sm dark: prose-invert max-w-none"
                components={{
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                  a: ({node, ...props}: any) => <a {...props} target="_blank" rel="noreferrer" />,
                }}
              >
                {msg.content}
              </ReactMarkdown>
            )}
          </div>
          
          {/* Context chips for AI responses */}
          {!isUser && (
            <div className="mt-3 w-full">
              <ContextChips 
                sources={ContextSourceService.createMockContextSources()} 
                compact 
                className="mb-2"
              />
            </div>
          )}
          
          {/* Message Feedback for AI responses */}
          {!isUser && (
            <div className="mt-2 w-full">
                             <MessageFeedback
                 messageId={msg.id}
                 conversationId={conversationId}
                 agentId="executive"
                 messageContent={msg.content}
                 compact
               />
            </div>
          )}
        </div>
      </div>
    );
  }
);
MessageBubble.displayName = 'MessageBubble';

/**
 * Main Modern Executive Assistant Component
 */
export const ModernExecutiveAssistant: React.FC<ModernExecutiveAssistantProps> = ({ 
  onClose, 
  sessionId = '' 
}) => {
  const { user } = useAuth();
  const contextCompletion = useContextualDataCompletion({
    autoAnalyze: true,
    proactiveSuggestions: true,
    trackInteractions: true
  });
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<string>('');
  const { sendMessage, loading, error, newConversation, setActiveConversation, loadOlderMessages, loadConversation } = useAIChatStore();
  const conversation = useActiveConversation();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  

  const conv = conversation as AIConversation | undefined;
  const messagesLength = conv?.messages ? conv.messages.length: 0;
  const isConversationEmpty = !conversation || messagesLength === 0;

  // If a sessionId prop is passed, initialise that conversation
  useEffect(() => {
    if (sessionId && sessionId !== conversationId) {
      setConversationId(sessionId);
      setActiveConversation(sessionId);
      loadConversation(sessionId).catch(() => {/* ignore */});
    }
  }, [sessionId, conversationId, setActiveConversation, loadConversation]);

  // Auto-create a new conversation when none provided
  useEffect(() => {
    (async () => {
      if (!sessionId && !conversationId && user?.id) {
        const id = await newConversation('Executive Assistant');
        setConversationId(id);
        setActiveConversation(id);
      }
    })();
  }, [sessionId, user?.id, conversationId, newConversation, setActiveConversation]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || !conversationId || !user?.id) return;
    await sendMessage(conversationId, input, user.id, user.company_id ? user.company_id: undefined);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [input, conversationId, user?.id, user?.company_id, sendMessage]);

  useEffect(() => {
    if (autoScrollRef.current && conversation && conversation.messages.length) {
      chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [conversation?.messages?.length]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const kKey = isMac ? e.metaKey && e.key.toLowerCase() === 'k' : e.ctrlKey && e.key.toLowerCase() === 'k';
      if (kKey) {
        e.preventDefault();
        textareaRef.current?.focus();
      }

      const sendCombo = (isMac ? e.metaKey: e.ctrlKey) && e.shiftKey && e.key === 'Enter';
      if (sendCombo) {
        e.preventDefault();
        handleSend();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (prompt: string) => {
    setInput(prompt);
  };

  if (!conversation) {
    return <WelcomeScreen userName={user?.name} onQuickAction={handleQuickAction} />;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat messages */}
      <div
        ref={chatContainerRef}
        className="flex-1 min-h-0 overflow-hidden p-6"
      >
        {/* Action Cards at top */}
        {actionCards.length > 0 && (
          <div className="mb-6 space-y-4">
            {actionCards.map(card => (
              <ActionCard key={card.id} card={card} className="max-w-md" />
            ))}
          </div>
        )}
        {isConversationEmpty ? (
          <WelcomeScreen userName={user?.name} onQuickAction={handleQuickAction} />
        ) : (
          <VirtualizedMessageList
            messages={conversation!.messages}
            renderRow={(msg) => <MessageBubble key={msg.id} msg={msg} conversationId={conversation!.id} />}
            followOutput={autoScrollRef.current}
            onLoadMore={async () => {
              if (loadingOlder) return;
              setLoadingOlder(true);
              await loadOlderMessages(conversation!.id);
              setLoadingOlder(false);
            }}
            loadingMore={loadingOlder}
          />
        )}
      </div>
      {/* Input */}
      <div className="p-4 border-t border-border flex items-center gap-2 bg-background">
        <textarea
          ref={textareaRef}
          value={input}
          onInput={(e) => {
            const el = e.currentTarget;
            el.style.height = 'auto';
            el.style.height = `${el.scrollHeight}px`;
          }}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="flex-1 resize-none rounded-lg border border-border p-2 text-sm bg-background focus: outline-none focus:ring-2 focus:ring-primary"
          rows={1}
          disabled={loading}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="ml-2 p-2 rounded-lg bg-primary text-primary-foreground hover: bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
      {/* Error Toast (optional, can be handled globally) */}
      {error && <div className="p-2 text-destructive text-xs">{error}</div>}
    </div>
  );
};

ModernExecutiveAssistant.propTypes = {
  onClose: PropTypes.func,
  sessionId: PropTypes.string,
};

export default ModernExecutiveAssistant; 