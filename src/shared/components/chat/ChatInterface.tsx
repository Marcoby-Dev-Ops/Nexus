import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/index';
import { chatService } from '@/services/ai/chatService.ts';
import { logger } from '@/shared/utils/logger.ts';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ChatInterfaceProps {
  conversationId?: string;
  onConversationChange?: (conversationId: string) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  conversationId, 
  onConversationChange 
}) => {
  const { user } = useAuth();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(conversationId);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load conversation messages with proper authentication
  const loadConversationMessages = useCallback(async (convId: string) => {
    if (!user?.id) return;

    try {
      const chatMessages = await chatService.getConversationMessages(convId, user.id);
      
      const formattedMessages: Message[] = chatMessages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.created_at
      }));

      setMessages(formattedMessages);
    } catch (error) {
      logger.error('Error loading conversation messages:', error);
      setError('Failed to load conversation messages');
    }
  }, [user?.id]);

  // Load conversation when conversationId changes
  useEffect(() => {
    if (conversationId && user?.id) {
      setCurrentConversationId(conversationId);
      loadConversationMessages(conversationId);
    }
  }, [conversationId, user?.id, loadConversationMessages]);

  // Send message with proper authentication
  const sendMessage = useCallback(async (content: string) => {
    if (!user?.id || !content.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await chatService.sendMessage(user.id, content, currentConversationId);

      // Update conversation ID if this is a new conversation
      if (!currentConversationId) {
        setCurrentConversationId(response.conversation_id);
        onConversationChange?.(response.conversation_id);
      }

      // Add messages to the conversation
      const newUserMessage: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content,
        timestamp: new Date().toISOString()
      };

      const newAssistantMessage: Message = {
        id: response.metadata?.message_id || `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.message,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, newUserMessage, newAssistantMessage]);
      setInputValue('');
    } catch (error) {
      logger.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, currentConversationId, onConversationChange]);

  // Handle form submission
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      sendMessage(inputValue);
    }
  }, [inputValue, isLoading, sendMessage]);

  // Handle key press
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputValue.trim() && !isLoading) {
        sendMessage(inputValue);
      }
    }
  }, [inputValue, isLoading, sendMessage]);

  // Clear conversation with proper authentication
  const clearConversation = useCallback(async () => {
    if (!user?.id || !currentConversationId) return;

    try {
      const result = await chatService.deleteConversation(currentConversationId, user.id);
      
      if (result.success) {
        setMessages([]);
        setCurrentConversationId(undefined);
        onConversationChange?.('');
      } else {
        setError('Failed to clear conversation');
      }
    } catch (error) {
      logger.error('Error clearing conversation:', error);
      setError('Failed to clear conversation');
    }
  }, [user?.id, currentConversationId, onConversationChange]);

  // Get user conversations with proper authentication
  const loadUserConversations = useCallback(async () => {
    if (!user?.id) return;

    try {
      await chatService.getUserConversations(user.id);
      // Handle conversations list if needed
    } catch (error) {
      logger.error('Error loading user conversations:', error);
    }
  }, [user?.id]);

  // Load user conversations on mount
  useEffect(() => {
    if (user?.id) {
      loadUserConversations();
    }
  }, [user?.id, loadUserConversations]);

  if (!user?.id) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Please log in to use the chat</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900">AI Assistant</h3>
        <div className="flex items-center space-x-2">
          {currentConversationId && (
            <button
              onClick={clearConversation}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !isLoading && (
          <div className="text-center text-gray-500 py-8">
            <p>Start a conversation with your AI assistant</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <p className="text-xs opacity-70 mt-1">
                {new Date(message.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                <span className="text-sm">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-center">
            <div className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex space-x-2">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={1}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}; 