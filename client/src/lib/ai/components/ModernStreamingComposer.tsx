/**
 * Modern Streaming Composer
 * 
 * A ChatGPT/Claude-inspired chat interface that wraps the existing StreamingComposer
 * functionality with a modern, polished UI design.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/shared/ui/components/Toast';
import { AIService } from '@/services/ai';
import type { SlashCommand } from '@/services/ai';
import SlashCommandMenu from './SlashCommandMenu';
import SourceDrawer from './SourceDrawer';
import type { SourceMeta } from './SourceDrawer';
import { callEdgeFunction } from '@/lib/database';
import { contextualRAG } from '@/lib/ai/core/contextualRAG';
import { useAuth, useCurrentUser } from '@/hooks/index';
import { useSimpleDashboard } from '@/hooks/dashboard/useSimpleDashboard';
import { useNextBestActions } from '@/hooks/useNextBestActions';
import { useLiveBusinessHealth } from '@/hooks/dashboard/useLiveBusinessHealth';
import ModernChatInterface from './ModernChatInterface';

// Initialize AIService instance for slash commands
const aiService = new AIService();

interface ModernStreamingComposerProps {
  conversationId?: string | null;
  onConversationId?: (id: string) => void;
  agentId: string;
  context?: Record<string, unknown>;
  // MVP Essential Callbacks
  onMessageReceived?: (message: ChatMessage) => void;
  onMessageSent?: (message: ChatMessage) => void;
  onError?: (error: string) => void;
  onStreamingStart?: () => void;
  onStreamingEnd?: () => void;
  className?: string;
}

import type { ChatMessage } from '@/shared/types/chat';

interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  file?: File;
}

// Type for AI chat response
interface AIChatResponse {
  content: string;
  sources?: SourceMeta[];
  routing?: {
    agent: string;
    confidence: number;
    reasoning: string;
  };
  agentId?: string;
  domainCapabilities?: {
    tools: string[];
    expertise: string[];
    insights: string[];
  };
  modelInfo?: {
    model: string;
    provider: string;
  };
  conversationId?: string;
}

export default function ModernStreamingComposer({
  conversationId,
  onConversationId,
  agentId,
  context = {},
  onMessageReceived,
  onMessageSent,
  onError,
  onStreamingStart,
  onStreamingEnd,
  className
}: ModernStreamingComposerProps) {
  // Debug: Log agentId prop (removed for production)
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const [currentSources, setCurrentSources] = useState<SourceMeta[]>([]);
  const [slashCommands, setSlashCommands] = useState<SlashCommand[]>([]);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [currentMessageId, setCurrentMessageId] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { currentUser } = useCurrentUser();
  const { toast } = useToast();
  const { data: dashboardData } = useSimpleDashboard();
  const { actions: nextBestActions } = useNextBestActions();
  const { healthData: businessHealth } = useLiveBusinessHealth();

  // Load slash commands
  useEffect(() => {
    const loadCommands = async () => {
      try {
        const commands = await aiService.getSlashCommands();
        setSlashCommands(commands);
      } catch {
        // Silently fail for slash commands - not critical for core functionality
      }
    };
    loadCommands();
  }, []);

  // Monitor messages state changes (reduced logging)
  useEffect(() => {
    // Messages state monitoring removed for production
  }, [messages]);

  const handleSendMessage = useCallback(async (message: string, attachments: FileAttachment[] = []) => {
    if (!message.trim() && attachments.length === 0) return;
    
    // Ensure user is authenticated
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to use the chat.",
        type: "error"
      });
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      conversation_id: conversationId || 'temp',
      role: 'user',
      content: message,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: {
        attachments
      }
    };

    setMessages(prev => [...prev, userMessage]);
    setIsStreaming(true);
    onStreamingStart?.();
    onMessageSent?.(userMessage);

    try {
      // Prepare context data
      const contextData = {
        ...context,
        user: user ? {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        } : null,
        dashboard: dashboardData,
        nextBestActions,
        businessHealth, // ✅ Add business health data to context
        conversationId,
        agentId
      };

      // Call the AI chat endpoint with conversation history
      
      let response;
      try {
        response = await callEdgeFunction('ai_chat', {
          message,
          context: {
            ...contextData,
            agentId,
            previousMessages: messages.map(msg => ({
              role: msg.role,
              content: msg.content,
              timestamp: msg.created_at
            }))
          },
          attachments: attachments.map(att => ({
            name: att.name,
            size: att.size,
            type: att.type,
            url: att.url
          }))
        });
        
      } catch (apiError: unknown) {
        throw new Error(`API call failed: ${apiError instanceof Error ? apiError.message : 'Unknown error'}`);
      }

      if (!response.success) {
        throw new Error(response.error || 'Failed to get response from AI');
      }

      const responseData = response.data as AIChatResponse;
      
      if (!responseData) {
        throw new Error('AI response data is null or undefined');
      }

      // Ensure we have content to display
      const messageContent = responseData.content || 'I received your message but I\'m having trouble generating a response right now. Please try again.';
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        conversation_id: conversationId || 'temp',
        role: 'assistant',
        content: messageContent,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {
          streaming: true
        }
      };
      
      setCurrentMessageId(assistantMessage.id);
      setMessages(prev => [...prev, assistantMessage]);
      setCurrentSources(responseData.sources || []);

      // Update user context
      if (user?.id) {
        try {
          await contextualRAG.updateUserContext(user.id, {
            currentTopic: message,
            recentInteractions: [message, responseData.content || '']
          });
        } catch {
          // Silently fail for context updates - not critical for core functionality
        }
      }

      // Update conversation ID if provided
      if (responseData.conversationId && onConversationId) {
        onConversationId(responseData.conversationId);
      }

      // Finalize message
      setMessages(prev => {
        const updatedMessages = prev.map(msg => 
          msg.id === assistantMessage.id 
            ? { ...msg, isStreaming: false }
            : msg
        );
        return updatedMessages;
      });

      onMessageReceived?.(assistantMessage);
      setCurrentMessageId(null);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      onError?.(errorMessage);
      
      // Determine the type of error and provide appropriate feedback
      let fallbackContent = "I apologize, but I'm having trouble connecting to my services right now. Please try again in a moment, or contact support if the issue persists.";
      let toastTitle = "Connection Error";
      let toastDescription = "Unable to connect to AI services. Please try again.";
      
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        fallbackContent = "I'm unable to connect to the server right now. Please check your internet connection and try again.";
        toastTitle = "Network Error";
        toastDescription = "Please check your internet connection and try again.";
      } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        fallbackContent = "Your session has expired. Please refresh the page and sign in again.";
        toastTitle = "Authentication Error";
        toastDescription = "Please refresh the page and sign in again.";
      } else if (errorMessage.includes('500') || errorMessage.includes('Internal Server Error')) {
        fallbackContent = "The server is experiencing issues right now. Please try again in a few minutes.";
        toastTitle = "Server Error";
        toastDescription = "The server is experiencing issues. Please try again later.";
      }
      
      // Add a fallback response if the AI service is unavailable
      const fallbackMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        conversation_id: conversationId || 'temp',
        role: 'assistant',
        content: fallbackContent,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {
          streaming: false
        }
      };
      
      setMessages(prev => [...prev, fallbackMessage]);
      
      toast({
        title: toastTitle,
        description: toastDescription,
        type: "error"
      });
    } finally {
      setIsStreaming(false);
      onStreamingEnd?.();
    }
  }, [user, dashboardData, nextBestActions, businessHealth, context, conversationId, agentId, onMessageSent, onMessageReceived, onError, onStreamingStart, onStreamingEnd, onConversationId, toast, messages]);

  const handleStopGeneration = useCallback(() => {
    setIsStreaming(false);
    onStreamingEnd?.();
    
    // Mark current message as not streaming
    if (currentMessageId) {
      setMessages(prev => prev.map(msg => 
        msg.id === currentMessageId 
          ? { ...msg, isStreaming: false }
          : msg
      ));
      setCurrentMessageId(null);
    }
  }, [currentMessageId, onStreamingEnd]);

  // Utility functions for future use - commented out to avoid unused variable warnings
  // const copyMessage = (content: string) => {
  //   navigator.clipboard.writeText(content);
  //   toast({ 
  //     title: "Copied to clipboard",
  //     description: "Message copied to clipboard",
  //     type: "success"
  //   });
  // };

  // const regenerateMessage = (messageId: string) => {
  //   const message = messages.find(msg => msg.id === messageId);
  //   if (message && message.role === 'user') {
  //     // Remove the assistant response and regenerate
  //     setMessages(prev => prev.filter(msg => msg.id !== messageId && msg.id !== (parseInt(messageId) + 1).toString()));
  //     handleSendMessage(message.content, message.metadata.attachments || []);
  //   }
  // };

  return (
    <div className="flex flex-col h-full">
      {/* Modern Chat Interface */}
      <div className="flex-1 min-h-0">
        <ModernChatInterface
          messages={messages}
          onSendMessage={handleSendMessage}
          onStopGeneration={handleStopGeneration}
          isStreaming={isStreaming}
          placeholder="Ask me anything about your business..."
          showTypingIndicator={isStreaming}
          className={className}
          userName={currentUser.name}
          userEmail={currentUser.email}
          userAvatarUrl={currentUser.avatarUrl}
        />
      </div>

      {/* Sources Drawer */}
      {showSources && currentSources.length > 0 && (
        <SourceDrawer
          open={showSources}
          source={currentSources[0]}
          onClose={() => setShowSources(false)}
        />
      )}

      {/* Slash Command Menu */}
      {showSlashMenu && (
        <SlashCommandMenu
          commands={slashCommands}
          selectedIndex={0}
          onSelectCommand={(_command: SlashCommand) => {
            setShowSlashMenu(false);
            // Handle slash command execution
          }}
          onMouseEnter={() => {}}
        />
      )}
    </div>
  );
}
