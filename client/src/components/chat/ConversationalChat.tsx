/**
 * Conversational Chat Component
 * 
 * Provides a responsive, streaming chat interface backed by the Nexus AI Gateway.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback } from '@/shared/components/ui/Avatar';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Send, Bot, User, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/shared/components/ui/use-toast';
import { cn } from '@/shared/lib/utils';
import { conversationalAIService, type ConversationContext } from '@/services/ai/ConversationalAIService';
import { useAuthStore } from '@/core/auth/authStore';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  error?: boolean;
  errorMessage?: string;
}

interface ConversationalChatProps {
  context: ConversationContext;
  onContextUpdate?: (context: ConversationContext) => void;
  className?: string;
}

export const ConversationalChat: React.FC<ConversationalChatProps> = ({ 
  context, 
  onContextUpdate, 
  className = '' 
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Retrieve auth token from Zustand auth store
  const getAuthToken = () => {
    const storeState = useAuthStore.getState();
    const session = storeState.session;
    return session?.session?.accessToken || session?.accessToken || '';
  };

  // Auto-scroll logic
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    setTimeout(() => chatInputRef.current?.focus(), 100);
  }, []);

  // Welcome message with context stats
  useEffect(() => {
    if (messages.length === 0) {
      const kb = context.businessContext.knowledgeBase;
      const name = kb?.companyData?.name || 'your business';
      const countTicks = kb?.brainTickets?.filter(t => t.status === 'open').length || 0;
      
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: `Hi! I'm Nexus. I maintain a live context of ${name}, including ${kb?.thoughts?.length || 0} insights and ${countTicks} active tasks. How can I help you today?`,
        timestamp: new Date()
      }]);
    }
  }, [context, messages.length]);

  const handleSendMessage = async () => {
    const text = inputValue.trim();
    if (!text || isProcessing) return;

    // 1. Add User Message
    const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: text,
        timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsProcessing(true);

    // 2. Prepare Assistant Message Placeholder
    const assistantMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        timestamp: new Date()
    }]);

    try {
        let streamContent = '';
        const token = getAuthToken();

        // Check for auth token
        if (!token) {
          throw new Error('Please sign in to use Nexus chat.');
        }

        // Build conversation history from existing messages (exclude welcome message and current placeholder)
        const conversationHistory = messages
            .filter(m => m.id !== 'welcome' && m.id !== assistantMsgId && !m.error)
            .map(m => ({ role: m.role, content: m.content }));

        await conversationalAIService.streamMessage(
            text,
            context,
            (chunk) => {
                streamContent += chunk;
                setMessages(prev => prev.map(m =>
                    m.id === assistantMsgId
                        ? { ...m, content: streamContent }
                        : m
                ));
            },
            token,
            conversationHistory
        );

        // Check for empty response
        if (!streamContent.trim()) {
          setMessages(prev => prev.map(m =>
            m.id === assistantMsgId
              ? { ...m, content: "I couldn't generate a response. Please try rephrasing your question." }
              : m
          ));
        }
    } catch (err) {
        console.error('Chat error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to generate response.';

        // Update the assistant message to show the error inline
        setMessages(prev => prev.map(m =>
          m.id === assistantMsgId
            ? { ...m, content: '', error: true, errorMessage }
            : m
        ));

        toast({
            title: "Connection Error",
            description: errorMessage,
            variant: "destructive"
        });
    } finally {
        setIsProcessing(false);
        chatInputRef.current?.focus();
    }
  };

  const handleRetry = (messageId: string) => {
    // Find the user message before the failed assistant message
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex > 0) {
      const userMessage = messages[messageIndex - 1];
      if (userMessage.role === 'user') {
        // Remove the failed message and retry
        setMessages(prev => prev.filter(m => m.id !== messageId));
        setInputValue(userMessage.content);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={cn("flex flex-col h-full bg-slate-900 overflow-hidden", className)}>
      {/* Configure Area - Top Bar if needed, currently empty/hidden */}
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-3 max-w-[85%]",
              message.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
            )}
          >
            <Avatar className={cn("h-8 w-8 mt-1", 
              message.role === 'assistant' ? "bg-indigo-500/20" : "bg-slate-700"
            )}>
              <AvatarFallback className={message.role === 'assistant' ? "text-indigo-400" : "text-slate-300"}>
                {message.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
              </AvatarFallback>
            </Avatar>

            <div className={cn(
              "rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap",
              message.role === 'user'
                ? "bg-indigo-600 text-white"
                : message.error
                  ? "bg-red-900/30 text-red-300 border border-red-800"
                  : "bg-slate-800 text-slate-200 border border-slate-700"
            )}>
              {message.error ? (
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p>{message.errorMessage || 'Something went wrong.'}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRetry(message.id)}
                      className="mt-2 h-7 px-2 text-xs text-red-300 hover:text-red-200 hover:bg-red-900/50"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Retry
                    </Button>
                  </div>
                </div>
              ) : message.content ? (
                message.content
              ) : isProcessing && message.id === messages[messages.length - 1].id ? (
                <div className="flex items-center gap-2 text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-xs">Thinking...</span>
                </div>
              ) : null}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-slate-900 border-t border-slate-800">
        <div className="flex gap-2 relative max-w-4xl mx-auto">
          <Input
            ref={chatInputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={isProcessing ? "Nexus is thinking..." : "Ask Nexus about your business..."}
            disabled={isProcessing}
            className="bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500 pr-12 h-12"
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={!inputValue.trim() || isProcessing}
            className="absolute right-1 top-1 h-10 w-10 p-0 bg-transparent hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </Button>
        </div>
        <div className="text-center mt-2">
            <span className="text-xs text-slate-600">Nexus AI Gateway • Enterprise Retrieval</span>
        </div>
      </div>
    </div>
  );
};
