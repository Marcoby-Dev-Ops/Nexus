import React, { useState, useCallback } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Card, CardContent } from '@/shared/components/ui/card';
import { useToast } from '@/shared/ui/components/Toast';
import { callEdgeFunction } from '@/lib/api-client';
import { useAuth } from '@/hooks/index';
import { Send, Bot, User } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface SimpleChatInterfaceProps {
  conversationId?: string | null;
  onConversationId?: (id: string) => void;
  agentId: string;
  context?: Record<string, any>;
  onMessageReceived?: (message: Message) => void;
  onMessageSent?: (message: Message) => void;
  onError?: (error: string) => void;
  onStreamingStart?: () => void;
  onStreamingEnd?: () => void;
  className?: string;
}

export default function SimpleChatInterface({ 
  conversationId,
  onConversationId,
  agentId = 'executive-assistant', 
  context = {},
  onMessageReceived,
  onMessageSent,
  onError,
  onStreamingStart,
  onStreamingEnd,
  className = '' 
}: SimpleChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !user) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    onStreamingStart?.();
    onMessageSent?.(userMessage);

    try {
      const response = await callEdgeFunction('ai_chat', {
        message: content,
        context: {
          ...context,
          agentId,
          userId: user.id,
          conversationId,
          previousMessages: messages.map(msg => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp
          }))
        }
      });

      if (response.success && response.data) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.data.content || 'Sorry, I couldn\'t process that request.',
          timestamp: new Date()
        };

        setMessages(prev => [...prev, assistantMessage]);
        onMessageReceived?.(assistantMessage);

        // Update conversation ID if provided
        if (response.data.conversationId && onConversationId) {
          onConversationId(response.data.conversationId);
        }
      } else {
        throw new Error(response.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      onError?.(errorMessage);
      
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        type: "error"
      });
    } finally {
      setIsLoading(false);
      onStreamingEnd?.();
    }
  }, [user, agentId, context, conversationId, messages, onMessageReceived, onMessageSent, onError, onStreamingStart, onStreamingEnd, onConversationId, toast]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  return (
    <div className={`flex flex-col h-full bg-gray-900 text-white ${className}`}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`flex gap-3 max-w-[80%] ${
                message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-700">
                {message.role === 'user' ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-white" />
                )}
              </div>
              <Card className="p-3 bg-gray-800 border-gray-700">
                <CardContent className="p-0">
                  <p className="text-sm text-white">{message.content}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-700">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <Card className="p-3 bg-gray-800 border-gray-700">
              <CardContent className="p-0">
                <p className="text-sm text-gray-400">Thinking...</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask me anything about your business..."
            disabled={isLoading}
            className="flex-1 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
          />
          <Button 
            type="submit" 
            disabled={isLoading || !inputValue.trim()}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
