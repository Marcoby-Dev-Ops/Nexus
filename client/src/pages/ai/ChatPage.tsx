import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/index';
import { Button } from '@/shared/components/ui/Button';
import ModernChatInterface from '@/lib/ai/components/ModernChatInterface';
import { ConversationalAIService } from '@/services/ai/ConversationalAIService';
import { useToast } from '@/components/ui/use-toast';
import { logger } from '@/shared/utils/logger';
import { useUserProfile } from '@/shared/contexts/UserContext';
import { useHeaderContext } from '@/shared/hooks/useHeaderContext';
import { Sparkles, X } from 'lucide-react';
import { useAIChatStore } from '@/shared/stores/useAIChatStore';

// Initialize AI Service
const conversationalAIService = new ConversationalAIService();

export const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { toast } = useToast();
  const { setHeaderContent } = useHeaderContext();

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
    setCurrentConversationById,
    // Add additional keys for streaming if available, otherwise we use local state
  } = useAIChatStore();

  // Local state for streaming UI since store might not expose everything needed for this view's specifics or we want isolation
  const [localIsLoading, setLocalIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');

  // Knowledge context state
  const [ragEnabled, setRagEnabled] = useState(true);
  const [ragConfidence, setRagConfidence] = useState<'high' | 'medium' | 'low'>('high');
  const [knowledgeTypes, setKnowledgeTypes] = useState<string[]>([]);
  const [ragSources, setRagSources] = useState<any[]>([]);
  const [ragRecommendations, setRagRecommendations] = useState<string[]>([]);
  const [businessContextData, setBusinessContextData] = useState<any>(null);

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

  const conversationId = currentConversation?.id;

  const handleSendMessage = async (message: string, attachments?: any[]) => {
    if (!message.trim() || !user) return;

    try {
      // Create or get conversation
      let currentConversationId = conversationId;

      if (!currentConversationId) {
        if (createConversation) {
          const title = message.slice(0, 50);
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

      const token = localStorage.getItem('nexus_auth_token') || '';

      await conversationalAIService.streamMessage(
        message,
        aiContext,
        (chunk) => {
          accumulatedResponse += chunk;
          setStreamingContent(accumulatedResponse);
        },
        token
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
    <div className="flex flex-col h-full bg-background">
      {/* Welcome Back Greeting */}
      {storeMessages.length === 0 && (
        <div className="flex flex-col items-center justify-center pt-12 pb-4">
          <h2 className="text-2xl font-semibold text-foreground mb-2">Welcome back, {displayName}!</h2>
          <p className="text-muted-foreground text-sm">How can I help you today?</p>
        </div>
      )}

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
            agentId="nexus-assistant"
            agentName="Executive Assistant"
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
