import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  Send, 
  Sparkles, 
  Maximize2, 
  X,
  ChevronDown,
  MessageSquare,
  Zap
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';
import { enhancedChatService } from '@/lib/chatContext';
import { executiveAgent } from '@/lib/agentRegistry';

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
  message: { role: 'user' | 'assistant'; content: string; timestamp: Date };
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
  const [messages, setMessages] = useState<Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize input
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 80) + 'px';
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      role: 'user' as const,
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Check if user is authenticated
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Create a temporary conversation ID for quick chat
      const quickConversationId = `quick-${user.id}-${Date.now()}`;
      
      // Send message using enhanced chat service
      const result = await enhancedChatService.sendMessageWithContext(
        quickConversationId,
        userMessage.content,
        executiveAgent,
        `quick-session-${Date.now()}`
      );

      if (result?.assistantMessage?.content) {
        const aiMessage = {
          role: 'assistant' as const,
          content: result.assistantMessage.content,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        // Fallback response
        const aiMessage = {
          role: 'assistant' as const,
          content: `I can help you with that! For more detailed assistance, consider using the full chat experience.`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error('Quick chat error:', error);
      
      // Fallback on error
      const errorMessage = {
        role: 'assistant' as const,
        content: error instanceof Error && error.message.includes('not authenticated')
          ? `Please sign in to use the chat feature.`
          : `I'm having trouble connecting right now. Try the full chat for better assistance.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
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
    // Navigate to full chat page and transfer context
    navigate('/chat', { 
      state: { 
        quickChatHistory: messages,
        initialPrompt: input 
      } 
    });
    onExpandToFullChat();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-4 bottom-4 w-80 h-96 bg-background border border-border rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
            <Zap className="w-3 h-3 text-primary-foreground" />
          </div>
          <span className="text-sm font-medium">Quick Chat</span>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={handleExpandToFullChat}
            className="p-1 rounded-md hover:bg-muted transition-colors"
            title="Open full chat"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-muted transition-colors"
            title="Close chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Actions (when no messages) */}
      {messages.length === 0 && (
        <QuickActions onAction={handleQuickAction} />
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="text-center py-6">
            <Sparkles className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-xs text-muted-foreground">
              Ask me anything or use quick actions above
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {messages.map((message, index) => (
              <CompactMessage
                key={index}
                message={message}
                isUser={message.role === 'user'}
              />
            ))}
            
            {isLoading && (
              <div className="flex gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">
                  AI
                </div>
                <div className="bg-muted rounded-lg p-2 mr-2">
                  <div className="flex items-center gap-1">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-1 h-1 bg-muted-foreground/50 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 150}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border p-4">
        <div className="flex items-end gap-2 bg-muted/50 rounded-lg p-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a quick question..."
            className="flex-1 bg-transparent resize-none border-none outline-none text-sm min-h-[20px] max-h-[60px]"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`p-1 rounded-md transition-colors ${
              input.trim() && !isLoading
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            <Send className="w-3 h-3" />
          </button>
        </div>
        
        {/* Expand hint */}
        <div className="text-center mt-2">
          <button
            onClick={handleExpandToFullChat}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Need more help? Open full chat →
          </button>
        </div>
      </div>
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