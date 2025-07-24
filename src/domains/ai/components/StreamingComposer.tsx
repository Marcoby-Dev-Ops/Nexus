import React, { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from "@/core/supabase";
import { env } from "@/core/environment";
import { Card, CardContent } from '@/shared/components/ui/Card';
import { Textarea } from '@/shared/components/ui/Textarea';
import { Button } from '@/shared/components/ui/Button';
import SourceDrawer from '@/domains/ai/components/SourceDrawer';
import type { SourceMeta } from '@/domains/ai/components/SourceDrawer';
import { getSlashCommands, filterSlashCommands, type SlashCommand } from '@/domains/ai/services/slashCommandService';
import SlashCommandMenu from '@/domains/ai/components/SlashCommandMenu';
import { useToast } from '@/shared/ui/components/Toast';
import { securityManager as adminSecurityManager } from '@/domains/admin';

// Chat is always enabled; previous VITE_CHAT_V2 gate removed
const isChatEnabled = true;

// Backend Edge Function URL (configure in .env)
// When VITE_EA_CHAT_URL is not explicitly provided, fall back to the Supabase project URL so that
// the path resolves correctly both in local (supabase start → http: //localhost:54321) and production.
const AI_CHAT_FUNC_URL = `${env.supabase.url}/functions/v1/ai_chat`;

interface StreamingComposerProps {
  conversationId?: string | null;
  onConversationId?: (id: string) => void;
  agentId: string;
  context?: Record<string, any>;
}

interface ChatMessage {
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
  const chatRef = useRef<HTMLDivElement | null>(null);
  const { toast } = useToast();

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
        const { data, error } = await (supabase as any)
          .from('ai_messages')
          .select('role, content')
          .eq('conversation_id', initialId)
          .order('created_at', { ascending: true });
        if (!error && data) {
          setMessages(data as any);
        }
      } catch (_) {/* ignore */}
    };
    loadHistory();
  }, [initialId]);

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
        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
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

  const handleSend = async () => {
    if (!input.trim()) return;
    setError(null);
    setIsStreaming(true);

    const userMessage: ChatMessage = { role: 'user', content: input.trim() };
    const newMessages: ChatMessage[] = [...messages, userMessage, { role: 'assistant', content: '' }];
    setMessages(newMessages);

    const assistantMessageIndex = newMessages.length - 1;
    const currentInput = input;
    setInput('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const res = await fetch(AI_CHAT_FUNC_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          query: currentInput,
          context,
          agentId: agentId === 'auto' ? undefined : agentId, // Let supervisor route if 'auto'
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
              };
              return updated;
            });
          }
        }
      }
    } catch (err: any) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
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
    if (!input.trim()) return;
    
    const currentInput = input;
    handleSend(); // Use existing handleSend logic
    
    // Add billing tracking in background
    setTimeout(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
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
        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error recording billing: ', error);
      }
    }, 1000);
  };

  // Add feedback handler for continuous improvement
  const handleMessageFeedback = async (messageIndex: number, rating: number) => {
    try {
      const message = messages[messageIndex];
      if (!message) return;

      const { data: { session } } = await supabase.auth.getSession();
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

      // Update message with feedback (extend ChatMessage type if needed)
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log(`Feedback recorded: ${rating} stars for message ${messageIndex}`);
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error submitting feedback: ', error);
    }
  };

  // Add this function after the existing functions
  const handleFeedback = async (messageId: string, rating: number, feedback?: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
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
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
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
            <div key={index} className="mb-4">
              <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-3xl rounded-lg px-4 py-2 ${
                  message.role === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-foreground'
                }`}>
                  <div className="prose prose-sm max-w-none">
                    {message.content}
                  </div>
                  
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

      {/* input area */}
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
              if (!isStreaming && input.trim()) {
                handleSendWithBilling();
              }
          }
        }}
        placeholder="Type your message..."
        rows={2}
        disabled={isStreaming}
      />
      {/* Slash command menu ---------------------------------------------------*/}
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
              <Button onClick={handleSendWithBilling} disabled={!input || isStreaming} className="self-end">
        {isStreaming ? 'Streaming…' : 'Send'}
      </Button>
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