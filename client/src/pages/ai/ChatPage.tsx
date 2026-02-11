import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/index';
import { useAuthStore } from '@/core/auth/authStore';
import { Button } from '@/shared/components/ui/Button';
import ModernChatInterface from '@/lib/ai/components/ModernChatInterface';
import { ConversationalAIService } from '@/services/ai/ConversationalAIService';
import { useToast } from '@/shared/components/ui/use-toast';
import { logger } from '@/shared/utils/logger';
import { useUserProfile } from '@/shared/contexts/UserContext';
import { useHeaderContext } from '@/shared/hooks/useHeaderContext';
import { Sparkles, X } from 'lucide-react';
import { useAIChatStore } from '@/shared/stores/useAIChatStore';
import { useSearchParams } from 'react-router-dom';
import type { StreamRuntimeMetadata, StreamRuntimeStatus } from '@/services/ai/ConversationalAIService';
import type { FileAttachment } from '@/shared/types/chat';
import { chatAttachmentService } from '@/lib/ai/services/chatAttachmentService';
import { ATTACHMENT_ONLY_PLACEHOLDER } from '@/shared/constants/chat';

// Initialize AI Service
const conversationalAIService = new ConversationalAIService();

function generateTitle(message: string, maxLen = 50): string {
  const cleaned = message.replace(/\n/g, ' ').trim();
  if (cleaned.length <= maxLen) return cleaned;
  const truncated = cleaned.substring(0, maxLen);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > maxLen * 0.3 ? truncated.substring(0, lastSpace) : truncated) + '...';
}

function generateAttachmentTitle(attachments: FileAttachment[]): string {
  if (!attachments.length) return 'New Conversation';
  if (attachments.length === 1) return `File: ${attachments[0].name}`;
  return `Files: ${attachments[0].name} +${attachments.length - 1}`;
}

function buildAttachmentSummary(attachments: FileAttachment[]): string {
  if (!attachments.length) return '';
  const lines = attachments.map((attachment) => `- ${attachment.name}`);
  return `\n\nAttached files:\n${lines.join('\n')}`;
}

function toRuntimeAttachments(attachments: FileAttachment[]) {
  return attachments.map((attachment) => ({
    id: attachment.id,
    name: attachment.name,
    size: attachment.size,
    type: attachment.type,
    url: attachment.url || attachment.downloadUrl || '',
    downloadUrl: attachment.downloadUrl || attachment.url || ''
  }));
}

type GeneratedAttachment = {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  downloadUrl?: string;
};

function mergeGeneratedAttachments(existing: GeneratedAttachment[], incoming: GeneratedAttachment[]): GeneratedAttachment[] {
  const byKey = new Map<string, GeneratedAttachment>();
  for (const attachment of [...existing, ...incoming]) {
    const link = attachment.downloadUrl || attachment.url || '';
    const key = `${link}::${attachment.name}`;
    if (!link || !attachment.name || byKey.has(key)) continue;
    byKey.set(key, attachment);
  }
  return Array.from(byKey.values());
}

function appendGeneratedAttachmentSummary(content: string, attachments: GeneratedAttachment[]): string {
  if (!attachments.length) return content;
  const missingLinks = attachments.filter((attachment) => {
    const link = attachment.downloadUrl || attachment.url || '';
    return link && !content.includes(link);
  });
  if (!missingLinks.length) return content;

  const lines = missingLinks.map((attachment) => {
    const link = attachment.downloadUrl || attachment.url || '';
    return `- [${attachment.name}](${link})`;
  });

  return `${content}\n\nGenerated files:\n${lines.join('\n')}`;
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
    setCurrentConversationById,
    // Add additional keys for streaming if available, otherwise we use local state
  } = useAIChatStore();

  // Local state for streaming UI since store might not expose everything needed for this view's specifics or we want isolation
  const [localIsLoading, setLocalIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [contextInjectedForStream, setContextInjectedForStream] = useState(false);
  const [streamStatus, setStreamStatus] = useState<StreamRuntimeStatus | null>(null);
  const [contextChips, setContextChips] = useState<string[]>([]);

  // Knowledge context state
  const ragEnabled = contextInjectedForStream;
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
    setContextInjectedForStream(false);
    setStreamStatus(null);
  }, [currentConversation?.id]);

  const conversationId = currentConversation?.id;

  const getAccessToken = () => {
    const storeState = useAuthStore.getState();
    const session = storeState.session;
    return session?.session?.accessToken || session?.accessToken || '';
  };

  const loadContextChips = useCallback(async () => {
    if (!user) return;

    try {
      const token = getAccessToken();
      if (!token) return;

      const query = new URLSearchParams({
        agentId: requestedAgentId,
        limit: '4'
      });

      if (conversationId) {
        query.set('conversationId', conversationId);
      }

      const response = await fetch(`/api/knowledge/context-chips?${query.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) return;
      const payload = await response.json();
      const chips = Array.isArray(payload?.data?.chips) ? payload.data.chips : [];
      setContextChips(chips.filter((chip: unknown): chip is string => typeof chip === 'string' && chip.trim().length > 0));
    } catch {
      // Keep fallback chips in ChatWelcome if API is unavailable.
    }
  }, [user, requestedAgentId, conversationId]);

  useEffect(() => {
    loadContextChips();
  }, [loadContextChips]);

  const handleSendMessage = async (message: string, attachments: FileAttachment[] = []) => {
    if (!user) return;

    const trimmedMessage = message.trim();
    const hasAttachments = attachments.length > 0;
    if (!trimmedMessage && !hasAttachments) return;

    try {
      // Check if this is an explicit switching command to avoid creating dummy "New Chat" threads
      const lowerMessage = trimmedMessage.toLowerCase();
      const isExplicitSwitch = lowerMessage.startsWith('continue this:') || lowerMessage.startsWith('switch to:');

      // Create or get conversation
      let currentConversationId = conversationId;

      if (!currentConversationId && !isExplicitSwitch) {
        if (createConversation) {
          const title = trimmedMessage ? generateTitle(trimmedMessage) : generateAttachmentTitle(attachments);
          currentConversationId = await createConversation(title, 'gpt-4', undefined, user.id);
        } else {
          // Fallback if somehow not available (should not happen based on store check)
          throw new Error("Create conversation not available");
        }
      }

      let uploadedAttachments: FileAttachment[] = [];
      if (hasAttachments) {
        if (!currentConversationId) {
          throw new Error('Select or create a conversation before uploading files.');
        }

        const filesToUpload = attachments
          .map((attachment) => attachment.file)
          .filter((file): file is File => file instanceof File);

        if (filesToUpload.length !== attachments.length) {
          throw new Error('Some selected files are missing file data. Please re-attach and try again.');
        }

        uploadedAttachments = await chatAttachmentService.uploadAttachments({
          conversationId: currentConversationId,
          files: filesToUpload
        });
      }

      const messageContent = trimmedMessage || ATTACHMENT_ONLY_PLACEHOLDER;
      const runtimeAttachments = toRuntimeAttachments(uploadedAttachments);
      const aiMessage = `${messageContent}${buildAttachmentSummary(runtimeAttachments)}`;

      // save and display the user message via store (only if not a switch or inside an existing conversation)
      if (currentConversationId) {
        // We use persist: false because the backend /api/ai/chat already saves the user message for audit/metadata purposes
        await sendMessage(messageContent, currentConversationId, runtimeAttachments, { persist: false });
      }

      // Now set loading states for AI response
      setLocalIsLoading(true);
      setIsStreaming(true);
      setContextInjectedForStream(false);
      setStreamStatus({ stage: 'thinking', label: 'Agent is thinking', detail: 'Preparing response.' });

      // Use Conversational AI Service (Streaming)
      const orgId = 'default';

      const contextInit = await conversationalAIService.initializeContext(user.id, orgId);
      const aiContext = (contextInit.success && contextInit.data) ? contextInit.data : {
        userId: user.id,
        organizationId: orgId,
        businessContext: {}
      };

      let accumulatedResponse = '';
      let generatedAttachmentsFromStream: GeneratedAttachment[] = [];
      setStreamingContent('');

      // Get auth token from Zustand auth store
      const token = getAccessToken();

      await conversationalAIService.streamMessage(
        aiMessage,
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
          agentId: requestedAgentId,
          attachments: runtimeAttachments
        },
        (metadata: StreamRuntimeMetadata) => {
          if (typeof metadata.contextInjected === 'boolean') {
            setContextInjectedForStream(metadata.contextInjected);
          }
          if (Array.isArray(metadata.generatedAttachments) && metadata.generatedAttachments.length > 0) {
            generatedAttachmentsFromStream = mergeGeneratedAttachments(
              generatedAttachmentsFromStream,
              metadata.generatedAttachments
            );
          }
          if (metadata.switchTarget && currentConversationId !== metadata.switchTarget) {
            logger.info('Switch intent detected, navigating to conversation', { target: metadata.switchTarget });
            setTimeout(() => {
              setCurrentConversationById(metadata.switchTarget!);
              toast({
                title: "Context Switched",
                description: "Switched to requested conversation.",
              });
            }, 1000); // Small delay to let user see "Switching..." message if any
          }
        },
        (status: StreamRuntimeStatus) => {
          setStreamStatus(status);
        }
      );

      // Save final response
      if (saveAIResponse && currentConversationId) {
        const finalResponse = appendGeneratedAttachmentSummary(accumulatedResponse, generatedAttachmentsFromStream);
        // We use persist: false because the backend /api/ai/chat already saves the assistant message for audit/metadata purposes
        await saveAIResponse(finalResponse, currentConversationId, { persist: false });
      }

      setStreamingContent('');

      // Refresh conversations to update snippets/order
      await fetchConversations();
      await loadContextChips();

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
      setStreamStatus(null);
    }
  };

  const handleStopGeneration = () => {
    setIsStreaming(false);
    setLocalIsLoading(false);
    setStreamStatus(null);
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
            suggestions={contextChips}
            streamStatus={streamStatus}
          />
        </React.Suspense>
      </div>
    </div>
  );
};

export default ChatPage;
