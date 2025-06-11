import React, { useState, useRef, useEffect, type JSX } from 'react';
import PropTypes from 'prop-types';
import { useNavigate, useLocation } from 'react-router-dom';
import { MessageSquare, ChevronDown, Send, Mic, MicOff, Paperclip, Zap } from 'lucide-react';
import { Spinner } from '../ui/Spinner';
import { chatHistory, supabase, type ChatMessage as SupabaseChatMessage } from '@/lib/supabase';
import { useRealtimeChat } from '@/lib/useRealtimeChat';
import { useAuth } from '@/lib/auth';
import { enhancedChatService, ChatContextBuilder } from '@/lib/chatContext';
import { executiveAgent } from '@/lib/agentRegistry';
import { useOnboardingContext } from '../../contexts/OnboardingContext';

/**
 * ExecutiveAssistant
 *
 * Clean, Microsoft Copilot-inspired AI assistant with minimal interface design
 * @component
 */

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ExecutiveAssistantProps {
  onClose: () => void;
  sessionId?: string;
}

const SYSTEM_PROMPT = `You are Nexus, an intelligent AI assistant for a Microsoft 365-like productivity platform. You help users navigate their workspace, manage tasks, analyze data, and boost productivity. Be helpful, concise, and professional. When users ask about specific pages or features, provide guidance on how to use them effectively.`;

const agents = [
  {
    id: 'nexus',
    name: 'Nexus Assistant',
    description: 'Your intelligent productivity companion',
    icon: '🤖'
  }
];

export const ExecutiveAssistant: React.FC<ExecutiveAssistantProps> = ({ onClose, sessionId = '' }): JSX.Element => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [retryCount, setRetryCount] = useState(0);
  const [selectedAgent, setSelectedAgent] = useState('nexus');
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const { user } = useAuth();
  const MAX_RETRIES = 3;
  const { isOnboardingActive } = useOnboardingContext();

  // Ref for the transcript container
  const transcriptRef = useRef<HTMLDivElement>(null);

  // Use realtime chat hook for messages
  const { 
    messages, 
    loading: messagesLoading, 
    error: messagesError 
  } = useRealtimeChat(currentConversationId || '');

  // Get current page name for context
  const currentPageName = React.useMemo(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    if (pathSegments.length === 0) return 'Dashboard';
    return pathSegments[pathSegments.length - 1]
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }, [location.pathname]);

  // Initialize conversation - use existing or create new
  useEffect(() => {
    const initConversation = async () => {
      if (!user) return;

      try {
        // First, try to get the most recent conversation
        const recentConversations = await chatHistory.getRecentConversations(1);
        
        if (recentConversations && recentConversations.length > 0) {
          // Use the most recent conversation
          const existingConversation = recentConversations[0];
          setCurrentConversationId(existingConversation.id);
          console.log('Using existing conversation:', existingConversation.id);
        } else {
          // Create a new conversation only if none exists
          const conversation = await chatHistory.createConversation(
            'New Conversation',
            selectedAgent,
            { 
              page: location.pathname,
              user_id: user.id 
            }
          );
          setCurrentConversationId(conversation.id);
          
          // Add system message
          const systemMessage = {
            role: 'system' as const,
            content: SYSTEM_PROMPT,
            metadata: { agent_id: selectedAgent }
          };
          await chatHistory.addMessage(conversation.id, systemMessage);
          console.log('Created new conversation:', conversation.id);
        }
      } catch (err) {
        console.error('Failed to initialize conversation:', err);
        setError('Failed to initialize chat. Please try again.');
      }
    };

    initConversation();
  }, [selectedAgent, user]);

  const handleSend = async (message?: string) => {
    const textToSend = message || input.trim();
    if (!textToSend || loading || !currentConversationId || !user || !sessionId) return;

    try {
      setLoading(true);
      setError(null);
      
      if (!message) {
        setInput('');
      }

      // Use enhanced chat service with comprehensive context
      const result = await enhancedChatService.sendMessageWithContext(
        currentConversationId,
        textToSend,
        executiveAgent,
        sessionId
      );

      console.log('Message sent with context:', result.context);
      
      // ✅ FIXED: Always set loading to false after successful response
      setLoading(false);

    } catch (err) {
      console.error('Error in handleSend:', err);
      setError('Failed to send message. Please try again.');
      
      // Fallback: Add message directly if enhanced service fails
      try {
        await chatHistory.addMessage(currentConversationId, {
          role: 'user',
          content: textToSend,
          metadata: { 
            agent_id: selectedAgent,
            context: `Current page: ${currentPageName}`,
            session_id: sessionId
          }
        });

        // Simple fallback response
        setTimeout(async () => {
          await chatHistory.addMessage(currentConversationId, {
            role: 'assistant',
            content: `I understand you asked: "${textToSend}". I'm here to help you with your tasks and productivity needs. How can I assist you further?`,
            metadata: { agent_id: selectedAgent }
          });
          setLoading(false);
        }, 1000);
      } catch (fallbackErr) {
        console.error('Fallback also failed:', fallbackErr);
        setLoading(false);
      }
    }
  };

  // Auto-scroll to bottom when messages change or conversation loads
  useEffect(() => {
    if (transcriptRef.current && messages.length > 0) {
      // Force scroll to bottom with slight delay
      const scrollToBottom = () => {
        if (transcriptRef.current) {
          transcriptRef.current.scrollTo({
            top: transcriptRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }
      };
      
      // Immediate scroll
      scrollToBottom();
      
      // Also scroll after a short delay to ensure DOM is fully updated
      setTimeout(scrollToBottom, 50);
      setTimeout(scrollToBottom, 200);
    }
  }, [messages, currentConversationId]);

  // Monitor scroll position to show/hide scroll button
  useEffect(() => {
    const handleScroll = () => {
      if (transcriptRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = transcriptRef.current;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
        setShowScrollButton(!isNearBottom && messages.length > 3);
      }
    };

    const scrollContainer = transcriptRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, [messages.length]);

  const scrollToBottom = () => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTo({
        top: transcriptRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  // Simple scroll event handler without preventDefault (which causes passive event errors)
  const handleScrollEvent = (e: React.UIEvent) => {
    // Just stop propagation, no preventDefault needed
    e.stopPropagation();
  };

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden">
      {/* Clean Messages Container - Copilot Style */}
      <div
        className="flex-1 overflow-y-auto px-6 py-4"
        ref={transcriptRef}
        tabIndex={0}
        onScroll={handleScrollEvent}
        style={{ overscrollBehavior: 'contain' }}
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <MessageSquare className="w-10 h-10 text-primary dark:text-primary" />
            </div>
            <h3 className="text-2xl font-semibold text-foreground mb-3">
              Welcome to Nexus
            </h3>
            <p className="text-muted-foreground text-lg mb-6">
              Your AI-powered productivity assistant
            </p>
            <div className="space-y-4 w-full">
              <p className="text-sm text-muted-foreground mb-4">Try asking me about:</p>
              <div className="grid gap-2">
                <button
                  onClick={() => handleSend('What can you help me with?')}
                  className="text-left p-4 bg-muted hover:bg-muted/80 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  💡 What can you help me with?
                </button>
                <button
                  onClick={() => handleSend('Show me my schedule for today')}
                  className="text-left p-4 bg-muted hover:bg-muted/80 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  📅 Show me my schedule for today
                </button>
                <button
                  onClick={() => handleSend('Help me organize my tasks')}
                  className="text-left p-4 bg-muted hover:bg-muted/80 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  ✅ Help me organize my tasks
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6 pb-4">
                         {messages.map((msg, idx) => {
               if (msg.role === 'system') {
                 return (
                   <div key={idx} className="text-center text-xs text-muted-foreground py-4">
                     System initialized
                   </div>
                 );
               }
               const isUser = msg.role === 'user';
               return (
                 <div key={idx} className="space-y-2">
                   <div className={`flex items-start gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                     <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center ${
                       isUser 
                         ? 'bg-primary' 
                         : 'bg-gradient-to-br from-primary to-secondary'
                     }`}>
                       {isUser ? (
                         <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                         </svg>
                       ) : (
                         <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                         </svg>
                       )}
                     </div>
                     <div className={`flex-1 ${isUser ? 'text-right' : 'text-left'}`}>
                       <div className={`inline-block max-w-full ${
                         isUser 
                           ? 'bg-primary text-primary-foreground' 
                           : 'bg-muted text-foreground'
                       } rounded-2xl px-4 py-4 break-words`}>
                         <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                       </div>
                     </div>
                   </div>
                 </div>
               );
             })}
            {loading && (
              <div className="flex items-start gap-4">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-secondary flex-shrink-0 flex items-center justify-center">
                  <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                                 <div className="flex-1">
                   <div className="inline-block bg-muted rounded-2xl px-4 py-4">
                     <div className="flex items-center gap-1">
                       <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                       <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                       <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                     </div>
                   </div>
                 </div>
              </div>
            )}
          </div>
        )}
        {error && (
          <div className="max-w-3xl mx-auto mt-4">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-destructive">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="ml-auto text-destructive hover:text-destructive/80"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Scroll to Bottom Button - Hidden during onboarding */}
      {showScrollButton && !isOnboardingActive && (
        <div className="absolute bottom-20 right-6 z-10">
          <button
            onClick={scrollToBottom}
            className="p-4 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors"
            aria-label="Scroll to bottom"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Clean Input Area - Copilot Style */}
      <div className="border-t border-border p-4 bg-background">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-4 bg-muted rounded-xl p-4 border border-border focus-within:border-primary focus-within:ring-1 focus-within:ring-blue-500 transition-all">
            <div className="flex-1">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask me anything..."
                className="w-full bg-transparent resize-none border-none outline-none text-foreground placeholder-muted-foreground text-sm leading-relaxed min-h-[24px] max-h-32"
                rows={1}
                style={{
                  height: 'auto',
                  minHeight: '24px',
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = Math.min(target.scrollHeight, 128) + 'px';
                }}
              />
            </div>
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className={`p-4 rounded-lg transition-all ${
                loading || !input.trim()
                  ? 'bg-muted text-muted-foreground cursor-not-allowed'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
              }`}
            >
              {loading ? (
                <Spinner size={16} className="text-muted-foreground" />
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

ExecutiveAssistant.propTypes = {
  onClose: PropTypes.func.isRequired,
}; 