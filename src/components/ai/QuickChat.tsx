import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  Send, 
  Bot, 
  Maximize2, 
  X,
  ChevronDown,
  MessageSquare,
  Zap
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useAIChatStore, useActiveConversation } from '@/lib/stores/useAIChatStore';
import { executiveAgent } from '@/lib/ai/agentRegistry';
import { MVPScopeIndicator } from '@/components/chat/MVPScopeIndicator';
import { MessageFeedback } from '@/components/chat/MessageFeedback';

/**
 * Quick Chat - Compact sidebar chat for quick interactions
 * Similar to GitHub Copilot Chat or VS Code chat assistants
 */
interface QuickChatProps {
  isOpen: boolean;
  onClose: () => void;
  onExpandToFullChat: () => void;
}

/**
 * Compact message bubble for sidebar
 */
const CompactMessage: React.FC<{
  message: { role: 'user' | 'assistant' | 'system'; content: string };
  isUser: boolean;
}> = ({ message, isUser }) => (
  <div className={`flex gap-2 mb-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
    <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs ${
      isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
    }`}>
      {isUser ? 'U' : 'AI'}
    </div>
    <div className={`flex-1 min-w-0 ${isUser ? 'text-right' : 'text-left'}`}>
      <div className={`inline-block max-w-full p-2 rounded-lg text-xs leading-relaxed ${
        isUser 
          ? 'bg-primary text-primary-foreground ml-2' 
          : 'bg-muted text-foreground mr-2'
      }`}>
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
      </div>
    </div>
  </div>
);

/**
 * Quick action suggestions
 */
const QuickActions: React.FC<{ onAction: (prompt: string) => void }> = ({ onAction }) => {
  const actions = [
    { label: 'Explain this code', prompt: 'Explain the current code I\'m looking at' },
    { label: 'Find bugs', prompt: 'Help me find potential bugs in this code' },
    { label: 'Optimize', prompt: 'How can I optimize this code?' },
    { label: 'Add comments', prompt: 'Add helpful comments to this code' }
  ];

  return (
    <div className="p-4 border-b border-border">
      <h4 className="text-xs font-medium text-muted-foreground mb-2">Quick Actions</h4>
      <div className="grid grid-cols-2 gap-1">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={() => onAction(action.prompt)}
            className="p-2 text-xs rounded-md bg-muted/50 hover:bg-muted transition-colors text-left"
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
};

const QuickChatContent: React.FC<QuickChatProps> = ({ 
  isOpen, 
  onClose, 
  onExpandToFullChat 
}) => {
  const [input, setInput] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();
  const { sendMessage, loading, error, newConversation, setActiveConversation } = useAIChatStore();
  const [conversationId, setConversationId] = useState<string>('');
  const conversation = useActiveConversation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    (async () => {
      if (!conversationId && user?.id) {
        // Use a stable quick chat conversation per user session
        const id = await newConversation('Executive Assistant');
        setConversationId(id);
        setActiveConversation(id);
      }
    })();
  }, [user?.id, conversationId, newConversation, setActiveConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages.length]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 80) + 'px';
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || !conversationId || !user?.id) return;
    await sendMessage(conversationId, input, user.id, user.company_id || undefined);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (prompt: string) => {
    setInput(prompt);
  };

  const handleExpandToFullChat = () => {
    navigate('/chat', { 
      state: { 
        quickChatHistory: conversation?.messages || [],
        initialPrompt: input 
      } 
    });
    onExpandToFullChat();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-4 bottom-4 w-80 h-96 bg-background border border-border rounded-xl shadow-2xl z-[120] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-background">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          <span className="font-semibold text-foreground">Executive Assistant</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onExpandToFullChat} title="Expand to full chat" className="p-2 rounded hover:bg-muted transition-colors">
            <Maximize2 className="w-4 h-4" />
          </button>
          <button onClick={onClose} title="Close" className="p-2 rounded hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      <QuickActions onAction={handleQuickAction} />
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {conversation?.messages && conversation.messages.length > 0 ? (
          conversation.messages.map((msg, idx) => (
            <div key={msg.id} className="mb-3">
              <CompactMessage message={msg} isUser={msg.role === 'user'} />
              {/* Add feedback for AI responses */}
              {msg.role === 'assistant' && (
                <div className="mt-2 pl-8">
                  <MessageFeedback
                    messageId={msg.id}
                    conversationId={conversationId}
                    agentId="quick-chat"
                    messageContent={msg.content}
                    compact
                  />
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center">
            <div className="w-full mb-4">
              <MVPScopeIndicator compact />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Start a conversation with your Executive Assistant.
            </p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      {/* Input */}
      <div className="p-2 border-t border-border flex items-center gap-2 bg-background">
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="flex-1 resize-none rounded-lg border border-border p-2 text-xs bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          rows={1}
          disabled={loading}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="ml-2 p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
      {error && <div className="p-2 text-destructive text-xs">{error}</div>}
    </div>
  );
};

// Error boundary wrapper
export const QuickChat: React.FC<QuickChatProps> = (props) => {
  try {
    return <QuickChatContent {...props} />;
  } catch (error) {
    console.error('QuickChat error:', error);
    return (
      <div className="fixed right-4 bottom-4 w-80 h-48 bg-background border border-border rounded-xl shadow-2xl z-50 flex flex-col items-center justify-center p-4">
        <X className="w-6 h-6 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground text-center">
          Chat temporarily unavailable. Please try again.
        </p>
        <button 
          onClick={props.onClose}
          className="mt-2 px-4 py-1 text-xs bg-muted rounded-md hover:bg-muted/80"
        >
          Close
        </button>
      </div>
    );
  }
};

QuickChat.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onExpandToFullChat: PropTypes.func.isRequired,
};

export default QuickChat; 