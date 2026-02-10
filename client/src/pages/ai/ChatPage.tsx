import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/index';
import { useAuthStore } from '@/core/auth/authStore';
import { Button } from '@/shared/components/ui/Button';
import ModernChatInterface from '@/lib/ai/components/ModernChatInterface';
import { ConversationalAIService } from '@/services/ai/ConversationalAIService';
import { useToast } from '@/components/ui/use-toast';
import { logger } from '@/shared/utils/logger';
import { useUserProfile } from '@/shared/contexts/UserContext';
import { useHeaderContext } from '@/shared/hooks/useHeaderContext';
import { Sparkles, X } from 'lucide-react';
import { useAIChatStore } from '@/shared/stores/useAIChatStore';
import { useSearchParams } from 'react-router-dom';

// Initialize AI Service
const conversationalAIService = new ConversationalAIService();

function generateTitle(message: string, maxLen = 50): string {
  const cleaned = message.replace(/\n/g, ' ').trim();
  if (cleaned.length <= maxLen) return cleaned;
  const truncated = cleaned.substring(0, maxLen);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > maxLen * 0.3 ? truncated.substring(0, lastSpace) : truncated) + '...';
}

export const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { toast } = useToast();
  const { setHeaderContent } = useHeaderContext();
  const [searchParams] = useSearchParams();
  const requestedAgentId = searchParams.get('agent') || 'nexus-assistant';

  const AGENT_LABELS: Record<string, string> = {
    'nexus-assistant': 'Executive Assistant',
    'executive-assistant': 'Executive Assistant',
    'concierge-director': 'Concierge Director',
    'business-identity-consultant': 'Business Identity Consultant',
    'sales-dept': 'Sales Specialist',
    'finance-dept': 'Finance Specialist',
    'operations-dept': 'Operations Specialist',
    'marketing-dept': 'Marketing Specialist'
  };

  const selectedAgentName = AGENT_LABELS[requestedAgentId] || 'Executive Assistant';

  // Connect to AIChatStore
  const {
    messages: storeMessages,
    sendMessage,
    saveAIResponse, // Confirmed exists in store
    createConversation, // Confirmed exists in store
    fetchConversations,
    isLoading: conversationsLoading,
    error,
    currentConversation,
    // Add additional keys for streaming if available, otherwise we use local state
  } = useAIChatStore();

  // Local state for streaming UI since store might not expose everything needed for this view's specifics or we want isolation
  const [localIsLoading, setLocalIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');

  // Knowledge context state
  const ragEnabled = true;
  const ragConfidence: 'high' | 'medium' | 'low' = 'high';
  const knowledgeTypes: string[] = [];
  const ragSources: any[] = [];
  const ragRecommendations: string[] = [];
  const businessContextData = null;

  // Update Header
  useEffect(() => {
    setHeaderContent('Chat', 'Business Intelligence Assistant');
    return () => setHeaderContent(null);
  }, [setHeaderContent]);

  // Load conversations on mount
  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user, fetchConversations]);

  // Reset streaming state when switching conversations
  useEffect(() => {
    setIsStreaming(false);
    setStreamingContent('');
    setLocalIsLoading(false);
  }, [currentConversation?.id]);

  const conversationId = currentConversation?.id;

  const handleSendMessage = async (message: string, attachments?: any[]) => {
    if (!message.trim() || !user) return;

    try {
      // Create or get conversation
      let currentConversationId = conversationId;

      if (!currentConversationId) {
        if (createConversation) {
          const title = generateTitle(message);
          currentConversationId = await createConversation(title, 'gpt-4', undefined, user.id);
        } else {
          // Fallback if somehow not available (should not happen based on store check)
          throw new Error("Create conversation not available");
        }
      }

      // IMMEDIATELY save and display the user message via store
      if (currentConversationId) {
        await sendMessage(message, currentConversationId, attachments || []);
      } else {
        // If we couldn't create one, we can't proceed with store `sendMessage`.
        throw new Error("Could not create conversation");
      }

      // Now set loading states for AI response
      setLocalIsLoading(true);
      setIsStreaming(true);

      // Use Conversational AI Service (Streaming)
      const orgId = 'default';

      const contextInit = await conversationalAIService.initializeContext(user.id, orgId);
      const aiContext = (contextInit.success && contextInit.data) ? contextInit.data : {
        userId: user.id,
        organizationId: orgId,
        businessContext: {}
      };

      let accumulatedResponse = '';
      setStreamingContent('');

      // Get auth token from Zustand auth store
      const storeState = useAuthStore.getState();
      const session = storeState.session;
      const token = session?.session?.accessToken || session?.accessToken || '';

      await conversationalAIService.streamMessage(
        message,
        aiContext,
        (chunk) => {
          accumulatedResponse += chunk;
          setStreamingContent(accumulatedResponse);
        },
        token,
        storeMessages
          .filter((msg) => msg.role === 'user' || msg.role === 'assistant')
          .slice(-20)
          .map((msg) => ({ role: msg.role as 'user' | 'assistant', content: msg.content })),
        {
          conversationId: currentConversationId || undefined,
          agentId: requestedAgentId
        }
      );

      // Save final response
      if (saveAIResponse && currentConversationId) {
        await saveAIResponse(accumulatedResponse, currentConversationId);
      }

      setStreamingContent('');

      // Refresh conversations to update snippets/order
      await fetchConversations();

    } catch (error) {
      logger.error('Chat error', { error });
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLocalIsLoading(false);
      setIsStreaming(false);
    }
  };

  const handleStopGeneration = () => {
    setIsStreaming(false);
    setLocalIsLoading(false);
  };

  // Show error state if there's an error
  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="text-center">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-destructive" />
          </div>
          <p className="text-destructive mb-4">{error}</p>
          <Button
            onClick={() => {
              // we probably need a clearError action in store, or just re-fetch
              fetchConversations();
            }}
            variant="outline"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Determine the best display name for the user
  const displayName = profile?.display_name || profile?.full_name || profile?.first_name || user?.name || "User";

  return (
    <div className="flex flex-col h-full min-h-0 bg-background">
      {/* Chat Interface */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <React.Suspense fallback={
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center mx-auto mb-2">
                <Sparkles className="w-4 h-4 text-muted-foreground animate-pulse" />
              </div>
              <p className="text-muted-foreground text-sm">Loading chat...</p>
            </div>
          </div>
        }>
          <ModernChatInterface
            messages={
              isStreaming && streamingContent
                ? [
                  ...storeMessages,
                  {
                    id: 'streaming-msg',
                    conversation_id: conversationId || 'temp',
                    role: 'assistant',
                    content: streamingContent,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    metadata: { streaming: true, model: 'gpt-4' }
                  }
                ]
                : storeMessages
            }
            onSendMessage={handleSendMessage}
            onStopGeneration={handleStopGeneration} // Make sure this prop exists on ModernChatInterface
            isStreaming={isStreaming}
            disabled={localIsLoading || conversationsLoading}
            placeholder="Ask anything — general questions or ask about your business."
            showTypingIndicator={isStreaming}
            className="h-full"
            userName={displayName}
            userEmail={profile?.email || user?.email}
            agentId={requestedAgentId}
            agentName={selectedAgentName}
            ragEnabled={ragEnabled}
            ragConfidence={ragConfidence === 'high' ? 0.9 : ragConfidence === 'medium' ? 0.7 : 0.4} // Map string to number
            knowledgeTypes={knowledgeTypes}
            ragSources={ragSources}
            ragRecommendations={ragRecommendations}
            businessContext={businessContextData}
          />
        </React.Suspense>
      </div>
    </div>
  );
};

export default ChatPage;
