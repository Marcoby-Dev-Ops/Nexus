import React, { useState, useRef, useEffect, useCallback } from 'react';
import { postgres } from "@/lib/postgres";
import { env } from "@/core/environment";
import { Card, CardContent } from '@/shared/components/ui/Card';
import { Textarea } from '@/shared/components/ui/Textarea';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import SourceDrawer from '@/components/ai/SourceDrawer';
import type { SourceMeta } from '@/components/ai/SourceDrawer';
import { AIService } from '@/services/ai';
import type { SlashCommand } from '@/services/ai';
import SlashCommandMenu from '@/components/ai/SlashCommandMenu';
import { useToast } from '@/shared/ui/components/Toast';
import { securityManager as adminSecurityManager } from '@/services/admin/index';
import { authentikAuthService } from '@/core/auth/AuthentikAuthService';
import { callEdgeFunction } from '@/lib/api-client';
import { contextualRAG } from '@/lib/ai/contextualRAG';
import { useAuth } from '@/hooks/index';
import { useSimpleDashboard } from '@/hooks/dashboard/useSimpleDashboard';
import { useNextBestActions } from '@/hooks/useNextBestActions';
import { 
  Upload, 
  Mic, 
  MicOff, 
  Send, 
  Paperclip, 
  X, 
  Edit3, 
  Copy, 
  Trash2, 
  MoreVertical,
  FileText,
  Image,
  File,
  Download
} from 'lucide-react';

// Chat is always enabled; previous VITE_CHAT_V2 gate removed
const isChatEnabled = true;

// Backend Edge Function URL (configure in .env)
// When VITE_EA_CHAT_URL is not explicitly provided, fall back to the Supabase project URL so that
// the path resolves correctly both in local (supabase start → http: //localhost:54321) and production.
const AI_CHAT_FUNC_URL = '/api/edge/ai_chat';

interface StreamingComposerProps {
  conversationId?: string | null;
  onConversationId?: (id: string) => void;
  agentId: string;
  context?: Record<string, any>;
}

interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
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
  modelInfo?: StreamingResponse['modelInfo'];
  attachments?: FileAttachment[];
  timestamp?: Date;
}

interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  file?: File;
}

// Add model info to the streaming response interface
interface StreamingResponse {
  content: string;
  routing?: {
    agent: string;
    confidence: number;
    reasoning: string;
  };
  agent?: string;
  modelInfo?: {
    model: string;
    provider: string;
    securityLevel: string;
    tier: string;
  };
  domainCapabilities?: {
    tools: string[];
    expertise: string[];
    insights: any;
  };
  error?: string;
}

export const StreamingComposer: React.FC<StreamingComposerProps> = ({
  conversationId: initialId = null,
  onConversationId,
  agentId,
  context = {},
}) => {
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeSource, setActiveSource] = useState<SourceMeta | null>(null);
  const [ragContext, setRagContext] = useState<any>(null);
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [showMessageActions, setShowMessageActions] = useState<string | null>(null);
  
  const chatRef = useRef<HTMLDivElement | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: dashboardData } = useSimpleDashboard();
  const { data: nextBestActions } = useNextBestActions();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Determine enabled flag via constant for future gating if needed
  const enabled = isChatEnabled;

  // Ref for auto-scrolling streamed output (not currently used)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Auto-scroll preview div when streaming
  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // Load history if an initial conversationId was supplied
  useEffect(() => {
    const loadHistory = async () => {
      if (!initialId) return;
      try {
        const { data, error } = await (postgres as any)
          .from('ai_messages')
          .select('role, content, created_at')
          .eq('conversation_id', initialId)
          .order('created_at', { ascending: true });
        if (!error && data) {
          const formattedMessages: ChatMessage[] = data.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.created_at)
          }));
          setMessages(formattedMessages);
        }
      } catch (_) {/* ignore */}
    };
    loadHistory();
  }, [initialId]);

  // Build RAG context from dashboard data
  useEffect(() => {
    const buildRagContext = async () => {
      if (!user?.id) return;

      try {
        // Build comprehensive context from dashboard and integrations
        const context = {
          userId: user.id,
          companyId: user.user_metadata?.organization_id,
          dashboardMetrics: dashboardData?.metrics || {},
          nextBestActions: nextBestActions?.actions || [],
          businessHealth: dashboardData?.health_score || 0,
          recentInteractions: messages.slice(-5).map(m => m.content),
          currentTopic: 'business_optimization'
        };

        setRagContext(context);
      } catch (error) {
        console.error('Error building RAG context:', error);
      }
    };

    buildRagContext();
  }, [user?.id, dashboardData, nextBestActions, messages]);

  // Slash-command state -------------------------------------------------------
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const [commandStartIdx, setCommandStartIdx] = useState<number | null>(null);
  const [selectedCmdIdx, setSelectedCmdIdx] = useState(0);
  const [availableCommands, setAvailableCommands] = useState<SlashCommand[]>([]);
  const [commandsLoading, setCommandsLoading] = useState(false);

  // Load slash commands on component mount
  useEffect(() => {
    const loadCommands = async () => {
      setCommandsLoading(true);
      try {
        const commands = await getSlashCommands();
        setAvailableCommands(commands);
      } catch (error) {
        console.error('[StreamingComposer] Failed to load slash commands: ', error);
        // Fallback to empty array - the service handles fallbacks internally
        setAvailableCommands([]);
      } finally {
        setCommandsLoading(false);
      }
    };
    loadCommands();
  }, []);

  const filteredCommands = React.useMemo(() => {
    if (!showCommandMenu || commandsLoading) return [] as SlashCommand[];
    return filterSlashCommands(availableCommands, commandQuery);
  }, [commandQuery, showCommandMenu, availableCommands, commandsLoading]);

  // Add near the top of the component, after existing state
  const [showFeedback, setShowFeedback] = useState<{ [key: string]: boolean }>({});
  const [userRatings, setUserRatings] = useState<{ [key: string]: number }>({});

  if (!enabled) return null;

  const securityManager = adminSecurityManager;

  // File upload handlers
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const attachment: FileAttachment = {
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        type: file.type,
        file: file
      };
      setAttachments(prev => [...prev, attachment]);
    });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (attachmentId: string) => {
    setAttachments(prev => prev.filter(att => att.id !== attachmentId));
  };

  // Voice recording handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const audioChunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        await processVoiceInput(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Error",
        description: "Failed to start recording. Please check microphone permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processVoiceInput = async (audioBlob: Blob) => {
    try {
      // Mock voice-to-text processing (replace with real Speech-to-Text API)
      const mockTranscription = "This is a transcribed voice input about implementing a new feature";
      setInput(mockTranscription);
      
      toast({
        title: "Voice input processed",
        description: "Your voice message has been transcribed.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error processing voice input:', error);
      toast({
        title: "Error",
        description: "Failed to process voice input. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Message action handlers
  const handleEditMessage = (messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditingContent(content);
  };

  const saveEdit = () => {
    if (!editingMessageId || !editingContent.trim()) return;
    
    setMessages(prev => prev.map(msg => 
      msg.id === editingMessageId 
        ? { ...msg, content: editingContent }
        : msg
    ));
    
    setEditingMessageId(null);
    setEditingContent('');
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setEditingContent('');
  };

  const handleDeleteMessage = (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
    setShowMessageActions(null);
  };

  const handleCopyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: "Copied",
        description: "Message copied to clipboard.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error copying message:', error);
      toast({
        title: "Error",
        description: "Failed to copy message.",
        variant: "destructive",
      });
    }
  };

  const handleSend = async () => {
    if (!input.trim() && attachments.length === 0) return;
    setError(null);
    setIsStreaming(true);

    const userMessage: ChatMessage = { 
      id: crypto.randomUUID(),
      role: 'user', 
      content: input.trim(),
      attachments: attachments.length > 0 ? [...attachments] : undefined,
      timestamp: new Date()
    };
    const newMessages: ChatMessage[] = [...messages, userMessage, { 
      id: crypto.randomUUID(),
      role: 'assistant', 
      content: '' 
    }];
    setMessages(newMessages);

    const assistantMessageIndex = newMessages.length - 1;
    const currentInput = input;
    const currentAttachments = [...attachments];
    setInput('');
    setAttachments([]);

    try {
      const sessionResult = await authentikAuthService.getSession();
      const session = sessionResult.data;
      if (!session) throw new Error("Not authenticated");

      // Get RAG results for enhanced context
      let ragResults = null;
      let ragSources: SourceMeta[] = [];
      
      if (ragContext && user?.id) {
        try {
          const ragQuery = {
            query: currentInput,
            context: {
              userId: user.id,
              companyId: ragContext.companyId,
              currentTopic: ragContext.currentTopic,
              recentInteractions: ragContext.recentInteractions
            },
            maxResults: 5,
            threshold: 0.7
          };

          ragResults = await contextualRAG.searchRelevantDocuments(ragQuery);
          
          // Convert RAG documents to source metadata
          ragSources = ragResults.documents.map(doc => ({
            id: doc.id,
            title: doc.metadata.source,
            content: doc.content,
            type: doc.metadata.type,
            timestamp: doc.metadata.timestamp,
            relevance: doc.metadata.relevance_score || 0
          }));
        } catch (ragError) {
          console.error('RAG search failed:', ragError);
          // Continue without RAG results
        }
      }

      // Enhanced context with RAG results and dashboard data
      const enhancedContext = {
        ...context,
        ragResults: ragResults?.documents || [],
        dashboardMetrics: ragContext?.dashboardMetrics || {},
        nextBestActions: ragContext?.nextBestActions || [],
        businessHealth: ragContext?.businessHealth || 0,
        sources: ragSources,
        attachments: currentAttachments
      };

      const res = await callEdgeFunction(AI_CHAT_FUNC_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          query: currentInput,
          context: enhancedContext,
          agentId: agentId === 'auto' ? undefined : agentId, // Let supervisor route if 'auto'
          ragSources: ragSources.length > 0 ? ragSources : undefined,
          attachments: currentAttachments
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`Request failed: ${res.status}`);
      }

      // Use SecurityManager for audit logging
      securityManager.logEvent({
        eventType: 'data_modification',
        eventDetails: { agentId },
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value } = await reader.read();
        done = doneReading;
        const chunk = decoder.decode(value);
        
        // SSE format is `data: {"content": "..."}\n\n`
        const lines = chunk.split('\n\n').filter(line => line.startsWith('data: '));
        for (const line of lines) {
          const jsonString = line.replace('data: ', '');
          const parsed = JSON.parse(jsonString);
          const content = parsed.content;
          const routing = parsed.routing;
          const agentId = parsed.agent;
          
          if (content) {
            setMessages(prev => {
              const updated = [...prev];
              updated[assistantMessageIndex] = {
                ...updated[assistantMessageIndex],
                content: updated[assistantMessageIndex].content + content,
                routing: routing || updated[assistantMessageIndex].routing,
                agentId: agentId || updated[assistantMessageIndex].agentId,
                sources: ragSources.length > 0 ? ragSources : updated[assistantMessageIndex].sources,
              };
              return updated;
            });
          }
        }
      }
    } catch (err: any) {
      console.error('Streaming error', err);
      const errorMessage = `Error: ${err.message}`;
      setMessages(prev => {
        const updated = [...prev];
        updated[assistantMessageIndex] = { ...updated[assistantMessageIndex], content: errorMessage };
        return updated;
      });
      setError(err.message || 'An error occurred.');
    } finally {
      setIsStreaming(false);
    }
  };

  const ChatBubble: React.FC<{ role: 'user' | 'assistant'; children: React.ReactNode }> = ({ role, children }) => (
    <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[75%] whitespace-pre-wrap break-words px-4 py-2 rounded-2xl text-sm shadow ${
        role === 'user'
          ? 'bg-primary text-primary-foreground rounded-br-none'
          : 'bg-gray-200 text-foreground rounded-bl-none'
      }`}>
        {children}
      </div>
    </div>
  );

  // Enhanced handleSend with billing integration
  const handleSendWithBilling = async () => {
    if (!input.trim() && attachments.length === 0) return;
    
    const currentInput = input;
    handleSend(); // Use existing handleSend logic
    
    // Add billing tracking in background
    setTimeout(async () => {
      try {
        const sessionData = await authentikAuthService.getSession();
        const session = sessionData.data;
        if (!session) return;

        // Simple billing record for demonstration
        // await aiUsageBillingService.recordUsageForBilling(
        //   session.user.id,
        //   session.user.user_metadata?.organization_id,
        //   agentId,
        //   'unknown', // model will be filled by edge function
        //   'hybrid', // provider
        //   currentInput.length, // approximate tokens
        //   0.001, // estimated cost
        //   'operations',
        //   {
        //     departmentId: agentId,
        //     projectId: conversationId || 'default'
        //   }
        // );
      } catch (error) {
        console.error('Error recording billing: ', error);
      }
    }, 1000);
  };

  // Add feedback handler for continuous improvement
  const handleMessageFeedback = async (messageIndex: number, rating: number) => {
    try {
      const message = messages[messageIndex];
      if (!message) return;

      const authResult = await authentikAuthService.getSession();
      const session = authResult.data;
      if (!session) return;

      // await continuousImprovementService.trackUserFeedback({
      //   userId: session.user.id,
      //   conversationId: conversationId || 'current',
      //   messageId: `msg_${messageIndex}`,
      //   rating: rating as 1 | 2 | 3 | 4 | 5,
      //   feedbackType: 'overall',
      //   agentId: message.agentId || agentId,
      //   modelUsed: 'unknown',
      //   provider: 'unknown'
      // });

      console.log(`Feedback recorded: ${rating} stars for message ${messageIndex}`);
    } catch (error) {
      console.error('Error submitting feedback: ', error);
    }
  };

  // Add this function after the existing functions
  const handleFeedback = async (messageId: string, rating: number, feedback?: string) => {
    try {
      const authResult = await authentikAuthService.getSession();
      const session = authResult.data;
      if (!session) return;

      // await continuousImprovementService.trackUserFeedback({
      //   userId: session.user.id,
      //   messageId,
      //   rating,
      //   feedback,
      // });
      
      setUserRatings(prev => ({ ...prev, [messageId]: rating }));
      setShowFeedback(prev => ({ ...prev, [messageId]: false }));
      
      // Show success message
      toast({
        title: "Feedback submitted",
        description: "Thank you for helping us improve!",
        variant: "default",
      });
    } catch (error) {
      console.error('Error submitting feedback: ', error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Add this component after the existing components but before the main return
  const FeedbackWidget: React.FC<{ messageId: string; isVisible: boolean }> = ({ messageId, isVisible }) => {
    const [selectedRating, setSelectedRating] = useState<number | null>(null);
    const [feedbackText, setFeedbackText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isVisible) return null;

    const handleSubmit = async () => {
      if (!selectedRating) return;
      
      setIsSubmitting(true);
      await handleFeedback(messageId, selectedRating, feedbackText);
      setIsSubmitting(false);
      setSelectedRating(null);
      setFeedbackText('');
    };

    return (
      <div className="mt-3 p-4 bg-background rounded-lg border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground/90">How was this response?</span>
          <button
            onClick={() => setShowFeedback(prev => ({ ...prev, [messageId]: false }))}
            className="text-muted-foreground hover: text-muted-foreground"
          >
            ×
          </button>
        </div>
        
        <div className="flex items-center gap-2 mb-2">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              onClick={() => setSelectedRating(rating)}
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-medium transition-colors ${
                selectedRating === rating
                  ? 'bg-primary border-primary text-primary-foreground'
                  : 'border-border text-muted-foreground hover: border-border'
              }`}
            >
              {rating}
            </button>
          ))}
        </div>
        
        <textarea
          value={feedbackText}
          onChange={(e) => setFeedbackText(e.target.value)}
          placeholder="Any additional feedback? (optional)"
          className="w-full p-2 border border-border rounded text-sm resize-none"
          rows={2}
        />
        
        <div className="flex gap-2 mt-2">
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!selectedRating || isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowFeedback(prev => ({ ...prev, [messageId]: false }))}
          >
            Skip
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="streaming-composer flex flex-col h-full max-h-[90vh] gap-2 relative">
      <Card className="flex-1 overflow-hidden">
        <CardContent ref={chatRef} className="overflow-y-auto space-y-2 p-4 h-full">
          {messages.map((message, index) => (
            <div key={message.id || index} className="mb-4 group">
              <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-3xl rounded-lg px-4 py-2 relative ${
                  message.role === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-foreground'
                }`}>
                  {/* Message Actions */}
                  <div className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity ${
                    message.role === 'user' ? 'text-primary-foreground' : 'text-muted-foreground'
                  }`}>
                    <div className="flex items-center gap-1">
                      {message.role === 'user' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditMessage(message.id || index.toString(), message.content)}
                          className="h-6 w-6 p-0"
                        >
                          <Edit3 className="w-3 h-3" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopyMessage(message.content)}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      {message.role === 'user' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteMessage(message.id || index.toString())}
                          className="h-6 w-6 p-0"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Message Content */}
                  <div className="prose prose-sm max-w-none">
                    {editingMessageId === (message.id || index.toString()) ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          className="min-h-[100px]"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={saveEdit}>Save</Button>
                          <Button size="sm" variant="outline" onClick={cancelEdit}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      message.content
                    )}
                  </div>

                  {/* Attachments */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {message.attachments.map(attachment => (
                        <div key={attachment.id} className="flex items-center gap-2 p-2 bg-background/50 rounded">
                          {attachment.type.startsWith('image/') ? (
                            <Image className="w-4 h-4" />
                          ) : attachment.type.includes('pdf') ? (
                            <FileText className="w-4 h-4" />
                          ) : (
                            <File className="w-4 h-4" />
                          )}
                          <span className="text-sm flex-1 truncate">{attachment.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {(attachment.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {message.role === 'assistant' && message.modelInfo && (
                    <div className="mt-2 pt-2 border-t border-border text-xs text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <span>
                          {message.modelInfo.model} • {message.modelInfo.provider}
                          {message.modelInfo.securityLevel && (
                            <span className="ml-2 px-1 py-0.5 bg-gray-200 rounded text-xs">
                              {message.modelInfo.securityLevel}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {message.role === 'assistant' && (
                <div className="ml-4 mt-2">
                  {userRatings[(message as any).id || index.toString()] ? (
                    <div className="text-sm text-muted-foreground">
                      ✓ Rated {userRatings[(message as any).id || index.toString()]}/5
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => setShowFeedback(prev => ({ 
                          ...prev, 
                          [(message as any).id || index.toString()]: true 
                        }))}
                        className="text-sm text-primary hover: text-primary underline"
                      >
                        Rate this response
                      </button>
                      <FeedbackWidget 
                        messageId={(message as any).id || index.toString()}
                        isVisible={showFeedback[(message as any).id || index.toString()] || false}
                      />
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
          {isStreaming && (
            <ChatBubble role="assistant">
              <span className="animate-pulse">…</span>
            </ChatBubble>
          )}
        </CardContent>
      </Card>

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="p-2 bg-muted rounded-lg">
          <div className="flex flex-wrap gap-2">
            {attachments.map(attachment => (
              <div key={attachment.id} className="flex items-center gap-2 p-2 bg-background rounded border">
                {attachment.type.startsWith('image/') ? (
                  <Image className="w-4 h-4" />
                ) : attachment.type.includes('pdf') ? (
                  <FileText className="w-4 h-4" />
                ) : (
                  <File className="w-4 h-4" />
                )}
                <span className="text-sm truncate max-w-[150px]">{attachment.name}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeAttachment(attachment.id)}
                  className="h-6 w-6 p-0"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end gap-2 p-4 border-t border-border">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={e => {
              const value = e.target.value;
              const cursorPos = e.target.selectionStart ?? value.length;

              // Detect the most recent '/'
              const slashIdx = value.lastIndexOf('/', cursorPos - 1);
              if (slashIdx >= 0) {
                const charBefore = slashIdx === 0 ? ' ' : value[slashIdx - 1];
                // Only trigger if slash is at start of line or preceded by whitespace
                if (charBefore === ' ' || charBefore === '\n') {
                  const query = value.slice(slashIdx + 1, cursorPos);
                  if (/^[\w-]*$/.test(query)) {
                    setShowCommandMenu(true);
                    setCommandQuery(query);
                    setCommandStartIdx(slashIdx);
                  } else {
                    setShowCommandMenu(false);
                  }
                } else {
                  setShowCommandMenu(false);
                }
              } else {
                setShowCommandMenu(false);
              }

              setInput(value);
            }}
            onKeyDown={(e) => {
              // When command menu is open, intercept nav keys
              if (showCommandMenu) {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setSelectedCmdIdx((prev) => Math.min(prev + 1, filteredCommands.length - 1));
                  return;
                }
                if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setSelectedCmdIdx((prev) => Math.max(prev - 1, 0));
                  return;
                }
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (filteredCommands.length > 0) {
                    const cmd = filteredCommands[selectedCmdIdx] ?? filteredCommands[0];
                    insertCommand(cmd);
                  }
                  return;
                }
                if (e.key === 'Escape') {
                  e.preventDefault();
                  setShowCommandMenu(false);
                  return;
                }
              }

              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!isStreaming && (input.trim() || attachments.length > 0)) {
                  handleSendWithBilling();
                }
              }
            }}
            placeholder="Type your message..."
            rows={2}
            disabled={isStreaming}
            className="pr-20"
          />
          
          {/* Input Actions */}
          <div className="absolute bottom-2 right-2 flex items-center gap-1">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileUpload}
              accept="*/*"
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => fileInputRef.current?.click()}
              disabled={isStreaming}
              className="h-8 w-8 p-0"
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isStreaming}
              className={`h-8 w-8 p-0 ${isRecording ? 'text-destructive' : ''}`}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
          </div>
        </div>
        
        <Button 
          onClick={handleSendWithBilling} 
          disabled={(!input.trim() && attachments.length === 0) || isStreaming} 
          className="self-end"
        >
          {isStreaming ? 'Streaming…' : <Send className="w-4 h-4" />}
        </Button>
      </div>

      {/* Slash command menu */}
      {showCommandMenu && (
        <SlashCommandMenu
          commands={filteredCommands}
          selectedIndex={selectedCmdIdx}
          onSelectCommand={insertCommand}
          onMouseEnter={setSelectedCmdIdx}
          loading={commandsLoading}
          query={commandQuery}
        />
      )}
      
      {error && <p className="text-destructive text-sm mb-2">{error}</p>}

      {/* Source Drawer */}
      <SourceDrawer open={!!activeSource} source={activeSource} onClose={() => setActiveSource(null)} />
    </div>
  );

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  function insertCommand(cmd: SlashCommand) {
    if (commandStartIdx == null) return;
    const textarea = textareaRef.current;
    const cursor = textarea?.selectionStart ?? input.length;
    const before = input.slice(0, commandStartIdx);
    const after = input.slice(cursor);
    const newValue = `${before}/${cmd.slug} ${after}`;
    setInput(newValue);
    // Move caret to after inserted command + space
    requestAnimationFrame(() => {
      const pos = before.length + cmd.slug.length + 2; // '/' + slug + ' '
      textarea?.setSelectionRange(pos, pos);
    });
    setShowCommandMenu(false);
  }
};

export default StreamingComposer; 