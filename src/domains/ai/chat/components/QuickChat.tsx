import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Send, Bot, Maximize2, X, Plus, Mic, Paperclip, Clipboard } from 'lucide-react';
import { useAuth } from '@/core/auth/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { useAIChatStore, useActiveConversation } from '@/shared/stores/useAIChatStore';
import { executiveAgent } from '@/domains/ai/lib/agentRegistry';
// import { MVPScopeIndicator } from '@/shared/components/chat/MVPScopeIndicator';
// import { MessageFeedback } from '@/shared/components/chat/MessageFeedback';

// Mock components for now
const MVPScopeIndicator = () => null;
const MessageFeedback = () => null;

// Add context detection (placeholder)
// import { usePageContext } from '@/domains/hooks/usePageContext'; // TODO: Implement this hook for context detection

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
            className="p-2 text-xs rounded-md bg-muted/50 hover: bg-muted transition-colors text-left"
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
};

// ExecutiveAssistantWidget: Floating, context-aware assistant
export interface ExecutiveAssistantWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  onExpandToFullChat: () => void;
  // New: context props
  pageContext?: Record<string, any>;
  userContext?: Record<string, any>;
}

const ExecutiveAssistantWidget: React.FC<ExecutiveAssistantWidgetProps> = ({
  isOpen,
  onClose,
  onExpandToFullChat,
  pageContext,
  userContext
}) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [showInputMenu, setShowInputMenu] = useState(false);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 80) + 'px';
    }
  }, [input]);

  // Streaming fetch to /assistant endpoint
  const sendToAssistant = async (userInput: string) => {
    setError(null);
    setIsStreaming(true);
    setMessages((prev) => [...prev, { role: 'user', content: userInput }]);
    let assistantMsg = '';
    try {
      const res = await fetch('/functions/v1/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userInput }),
      });
      if (!res.body) throw new Error('No response body');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      while (!done) {
        const { value } = await reader.read();
        done = doneReading;
        if (value) {
          assistantMsg += decoder.decode(value, { stream: true });
          setMessages((prev) => {
            // If last message is assistant, update it; else, append
            if (prev.length && prev[prev.length - 1].role === 'assistant') {
              return [...prev.slice(0, -1), { role: 'assistant', content: assistantMsg }];
            } else {
              return [...prev, { role: 'assistant', content: assistantMsg }];
            }
          });
        }
      }
    } catch (e: any) {
      setError(e.message || 'Failed to connect to assistant.');
    } finally {
      setIsStreaming(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    await sendToAssistant(input.trim());
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

  // TODO: Add multi-modal input (voice, file, clipboard) UI and logic

  if (!isOpen) return null;

  return (
    <div className="fixed right-4 bottom-4 w-80 h-96 bg-background border border-border rounded-xl shadow-2xl z-[120] flex flex-col overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-background">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          <span className="font-semibold text-foreground">Executive Assistant</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onExpandToFullChat} title="Expand to full chat" className="p-2 rounded hover: bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20">
            <Maximize2 className="w-4 h-4" />
          </button>
          <button onClick={onClose} title="Close" className="p-2 rounded hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      {/* Quick Actions */}
      <QuickActions onAction={handleQuickAction} />
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
        {messages.length > 0 ? (
          messages.map((msg, idx) => (
            <div key={idx} className={`mb-1 transition-all duration-200 ${msg.role === 'assistant' ? 'animate-fade-in' : ''}`}>
              <CompactMessage message={msg} isUser={msg.role === 'user'} />
              {/* Typing indicator below last assistant message */}
              {isStreaming && idx === messages.length - 1 && msg.role === 'assistant' && (
                <div className="flex items-center gap-2 pl-8 mt-1 animate-pulse text-muted-foreground text-xs">
                  <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" />
                  <span>Assistant is typing…</span>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center animate-fade-in">
            <p className="text-xs text-muted-foreground text-center mb-2">
              👋 Welcome to your Executive Assistant.<br />
              Ask anything, or try a quick action below!
            </p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      {/* Input */}
      <div className="p-2 border-t border-border flex items-center gap-2 bg-background">
        {/* Multi-modal input menu */}
        <div className="relative">
          <button
            onClick={() => setShowInputMenu((v) => !v)}
            className="p-2 rounded-full bg-muted hover: bg-muted/70 focus:outline-none focus:ring-2 focus:ring-primary/20"
            aria-label="More input options"
          >
            <Plus className="w-5 h-5" />
          </button>
          {showInputMenu && (
            <div className="absolute left-0 top-12 z-10 bg-background border border-border rounded-lg shadow-lg flex flex-col min-w-[120px] animate-fade-in">
              <button className="flex items-center gap-2 px-4 py-2 hover:bg-muted focus:outline-none" aria-label="Voice input (coming soon)" disabled>
                <Mic className="w-4 h-4" /> Voice (soon)
              </button>
              <button className="flex items-center gap-2 px-4 py-2 hover: bg-muted focus:outline-none" aria-label="Attach file (coming soon)" disabled>
                <Paperclip className="w-4 h-4" /> File (soon)
              </button>
              <button className="flex items-center gap-2 px-4 py-2 hover: bg-muted focus:outline-none" aria-label="Paste from clipboard (coming soon)" disabled>
                <Clipboard className="w-4 h-4" /> Clipboard (soon)
              </button>
            </div>
          )}
        </div>
        <textarea
          ref={inputRef}
          className="flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder: text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 min-h-[36px] max-h-20"
          placeholder="Type your message..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isStreaming}
          aria-label="Message input"
        />
        <button
          onClick={handleSend}
          className="ml-2 p-2 rounded-full bg-primary text-primary-foreground hover: bg-primary/90 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary/20"
          disabled={!input.trim() || isStreaming}
          aria-label="Send"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
      {error && <div className="text-destructive text-xs p-2">{error}</div>}
    </div>
  );
};

export { ExecutiveAssistantWidget };
export default ExecutiveAssistantWidget; 