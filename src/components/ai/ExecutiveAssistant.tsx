import React, { useState, useRef, useEffect, type JSX } from 'react';
import PropTypes from 'prop-types';
import { useNavigate, useLocation } from 'react-router-dom';
import { MessageSquare, ChevronDown, Send, Mic, MicOff, Paperclip, Zap } from 'lucide-react';
import { Spinner } from '../ui/Spinner';
import { chatHistory, supabase, type ChatMessage as SupabaseChatMessage } from '../../lib/core/supabase';
import { useRealtimeChat } from '@/lib/hooks/useRealtimeChat';
import { useAuth } from '@/contexts/AuthContext';
import { agentRegistry } from '@/lib/ai/agentRegistry';

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

    setLoading(true);
    setError(null);
    
    if (!message) {
      setInput('');
    }

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
      setError('Failed to send message. Please try again.');
      setLoading(false);
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
          <div className="space-y-6">
            {messages.map((msg, index) => (
              <div
                key={`${currentConversationId}-${index}`}
                className={`flex items-start gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-semibold">
                    N
                  </div>
                )}
                <div
                  className={`max-w-xl p-4 rounded-xl ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-24 right-6 w-10 h-10 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center border transition-opacity"
        >
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        </button>
      )}

      {/* Clean Input Area */}
      <div className="border-t p-4">
        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-4 rounded-md mb-3">
            {error}
          </div>
        )}
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask Nexus anything..."
            className="w-full bg-muted border-transparent rounded-lg py-3 pl-4 pr-28 resize-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
            rows={1}
            disabled={loading}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
            <button className="p-2 text-muted-foreground hover:text-foreground">
              <Paperclip className="w-5 h-5" />
            </button>
            <button className="p-2 text-muted-foreground hover:text-foreground">
              <Mic className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="p-2 rounded-full bg-primary text-primary-foreground disabled:bg-primary/50"
            >
              {loading ? (
                <Spinner className="w-5 h-5" />
              ) : (
                <Send className="w-5 h-5" />
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
  sessionId: PropTypes.string,
};

export default ExecutiveAssistant; 