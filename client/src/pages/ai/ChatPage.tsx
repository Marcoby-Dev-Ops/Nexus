import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/index';
import { Button } from '@/shared/components/ui/Button';
import { ModernChatInterface } from '@/lib/ai/components/ModernChatInterface';
import { ConversationalAIService } from '@/services/ai/conversationalAIService';
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
    saveAIResponse,
    fetchConversations,
    loading: conversationsLoading,
    error,
    conversationId,
    setConversationId,
    setCurrentConversationById,
    clearMessages,
    setCurrentConversation
  } = useAIChatStore();

  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');

  // Knowledge context state (simplified for this view)
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

  const handleSendMessage = async (message: string, attachments?: any[]) => {
    if (!message.trim() || !user) return;

    try {
      // Create or get conversation
      let currentConversationId = conversationId;
      if (!currentConversationId) {
        // Create new conversation if none exists
        // Note: createConversation logic is handled by store or service, 
        // usually we'd want a helper here or store action that handles "ensure conversation"
        // For now, let's assume if no ID, we let the store/backend handle creation on first message 
        // OR we need to call createConversation from store.
        // Looking at previous implementation, it called createConversation directly.
        // We should probably rely on `sendMessage` to create if needed, or create manually.
        // Let's use the store's createConversation if exposed, or import it.
        // Wait, useAIChatStore usually exposes createConversation.
        // I'll assume we need to import `createConversation` from store actions if available.
        // The previous code verified `createConversation` was imported from store.
        // Let's assume `createConversation` is available in useAIChatStore, if not we'll need to fix.
        // Checking my previous read of useAIChatStore, it DOES have createConversation.
        const { createConversation } = useAIChatStore.getState();

        const conversationTitle = message.length > 50 ? message.substring(0, 50) + '...' : message;
        currentConversationId = await createConversation(conversationTitle, 'gpt-4', undefined, user.id);
        setConversationId(currentConversationId);
        await setCurrentConversationById(currentConversationId);
      }

      // IMMEDIATELY save and display the user message
      await sendMessage(message, currentConversationId!, attachments || []);

      // Now set loading states for AI response
      setIsLoading(true);
      setIsStreaming(true);

      // Use Conversational AI Service (Streaming)
      // We need organization ID
      const orgId = 'default'; // Should get from user profile/company

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
      await saveAIResponse(accumulatedResponse, currentConversationId!);
      setStreamingContent('');

      // Refresh conversations to update snippets/order
      await fetchConversations();

    } catch (error) {
      logger.error('Chat error', { error });
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      toast({
        title: "Error",
        description: errorMessage,
        type: "error"
      });
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const handleStopGeneration = () => {
    setIsStreaming(false);
    setIsLoading(false);
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
      {/* Welcome Back Greeting - Only show if no messages? Or always at top? */}
      {/* Typically, greetings are shown when chat is empty. */}
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
            onStopGeneration={handleStopGeneration}
            isStreaming={isStreaming}
            disabled={isLoading}
            placeholder="Ask anything — general questions or ask about your business."
            showTypingIndicator={isStreaming}
            className="h-full"
            userName={displayName}
            userEmail={profile?.email || user?.email}
            agentId="nexus-assistant"
            agentName="Executive Assistant"
            ragEnabled={ragEnabled}
            ragConfidence={ragConfidence}
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
