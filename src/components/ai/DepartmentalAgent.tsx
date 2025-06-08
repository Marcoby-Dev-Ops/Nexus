/**
 * DepartmentalAgent.tsx
 * 
 * Department AI assistant with intelligent routing to sub-assistants
 * Can switch between department head and specialists based on conversation needs
 */

import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate, useLocation } from 'react-router-dom';
import { Send, ArrowLeft, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { chatHistory } from '@/lib/supabase';
import { useRealtimeChat } from '@/lib/useRealtimeChat';
import { useAuth } from '@/lib/auth';
import { getChildAgents, type Agent } from '@/lib/agentRegistry';

/**
 * @interface DepartmentalAgentProps
 */
interface DepartmentalAgentProps {
  agent: Agent;
  onClose?: () => void;
  onBack?: () => void;
}

/**
 * @interface Message
 */
interface Message {
  sender: 'user' | 'assistant' | 'system';
  text: string;
}

/**
 * Get department-specific system prompt with routing capabilities
 */
const getDepartmentSystemPrompt = (agent: Agent, specialists: Agent[]): string => {
  const basePrompt = `You are ${agent.name}, a specialized AI assistant for the ${agent.department} department in the Nexus productivity platform.`;
  
  const specialistList = specialists.map(s => `${s.name} (${s.specialties?.join(', ')})`).join(', ');
  
  const departmentPrompts: Record<string, string> = {
    sales: `${basePrompt} You help with lead qualification, pipeline management, CRM optimization, deal closing strategies, and sales performance analysis. 

Your specialties include: ${agent.specialties?.join(', ')}.

You have access to these specialist assistants: ${specialistList}. When a user's question is highly specific to one of these areas, suggest they could get more detailed help from the relevant specialist, but still provide helpful guidance yourself.

Be results-focused and data-driven in your responses.`,
    
    marketing: `${basePrompt} You assist with campaign management, content strategy, lead generation, brand development, and marketing analytics.

Your specialties include: ${agent.specialties?.join(', ')}.

You have access to these specialist assistants: ${specialistList}. When users need deep expertise in specific areas like SEO, content creation, or analytics, mention that specialists are available while still providing valuable insights.

Focus on creative solutions and measurable ROI.`,
    
    finance: `${basePrompt} You handle financial planning, budgeting, accounting, reporting, and compliance matters.

Your specialties include: ${agent.specialties?.join(', ')}.

You have access to these specialist assistants: ${specialistList}. For complex accounting, tax, or analytical questions, you can suggest consulting with specialists while providing general guidance.

Ensure accuracy and regulatory compliance in all recommendations.`,
    
    operations: `${basePrompt} You manage process optimization, project coordination, quality assurance, and operational efficiency.

Your specialties include: ${agent.specialties?.join(', ')}.

You have access to these specialist assistants: ${specialistList}. For technical IT issues, detailed project management, or quality processes, specialists are available for deeper expertise.

Focus on streamlining processes and improving productivity.`
  };

  return departmentPrompts[agent.department || ''] || `${basePrompt} You are a helpful assistant specialized in ${agent.specialties?.join(', ')}.`;
};

/**
 * Get department-specific quick actions
 */
const getDepartmentQuickActions = (department: string): string[] => {
  const actions: Record<string, string[]> = {
    sales: [
      "Show me today's pipeline",
      "Help me qualify this lead",
      "Create a follow-up sequence",
      "Analyze deal probability"
    ],
    marketing: [
      "Plan a new campaign",
      "Analyze campaign performance", 
      "Create content ideas",
      "Review lead generation"
    ],
    finance: [
      "Generate monthly report",
      "Review budget variance",
      "Calculate ROI",
      "Check compliance status"
    ],
    operations: [
      "Review project status",
      "Optimize workflow",
      "Quality check process",
      "Resource allocation"
    ]
  };

  return actions[department] || ["How can I help you today?"];
};

/**
 * DepartmentalAgent Component
 */
export const DepartmentalAgent: React.FC<DepartmentalAgentProps> = ({ 
  agent, 
  onClose, 
  onBack 
}) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [showSpecialists, setShowSpecialists] = useState(false);
  const [activeAgent, setActiveAgent] = useState<Agent>(agent); // Can switch between dept head and specialists
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const transcriptRef = useRef<HTMLDivElement>(null);

  // Get specialists under this department
  const specialists = getChildAgents(agent.id);

  // Use realtime chat hook for messages
  const { 
    messages, 
    loading: messagesLoading, 
    error: messagesError 
  } = useRealtimeChat(currentConversationId || '');

  // Get department-specific data
  const systemPrompt = getDepartmentSystemPrompt(agent, specialists);
  const quickActions = getDepartmentQuickActions(agent.department || '');

  // Initialize conversation
  useEffect(() => {
    const initConversation = async () => {
      if (!user) return;

      try {
        const conversation = await chatHistory.createConversation(
          `${agent.name} Conversation`,
          agent.id,
          { 
            page: location.pathname,
            user_id: user.id,
            department: agent.department
          }
        );
        setCurrentConversationId(conversation.id);
        
        // Add system message
        const systemMessage = {
          role: 'system' as const,
          content: systemPrompt,
          metadata: { 
            agent_id: agent.id,
            department: agent.department
          }
        };
        await chatHistory.addMessage(conversation.id, systemMessage);

        // Add welcome message
        const welcomeMessage = {
          role: 'assistant' as const,
          content: `Hello! I'm ${agent.name}. I'm here to help you with ${agent.department} tasks. ${agent.specialties ? `I specialize in ${agent.specialties.join(', ')}.` : ''} ${specialists.length > 0 ? `\n\nI also have access to ${specialists.length} specialist assistants who can provide deeper expertise when needed.` : ''} How can I assist you today?`,
          metadata: { agent_id: agent.id }
        };
        await chatHistory.addMessage(conversation.id, welcomeMessage);
      } catch (err) {
        console.error('Failed to initialize conversation:', err);
        setError('Failed to initialize chat. Please try again.');
      }
    };

    initConversation();
  }, [agent, user, location.pathname, systemPrompt, specialists.length]);

  const handleSend = async (message?: string) => {
    const textToSend = message || input.trim();
    if (!textToSend || loading || !currentConversationId || !user) return;

    try {
      setLoading(true);
      setError(null);
      
      if (!message) {
        setInput('');
      }

      // Add user message
      await chatHistory.addMessage(currentConversationId, {
        role: 'user',
        content: textToSend,
        metadata: { 
          agent_id: activeAgent.id,
          department: agent.department
        }
      });

      // TODO: Replace with actual AI service call that can analyze intent and suggest specialist routing
      setTimeout(async () => {
        try {
          const aiResponse = `As your ${activeAgent.name}, I understand you're asking about: "${textToSend}". Based on my expertise in ${activeAgent.specialties?.join(', ')}, I recommend...

${specialists.length > 0 ? `\n💡 *If you need more specialized help, I can connect you with one of our ${agent.department} specialists: ${specialists.map(s => s.name).join(', ')}*` : ''}`;
          
          await chatHistory.addMessage(currentConversationId, {
            role: 'assistant',
            content: aiResponse,
            metadata: { agent_id: activeAgent.id }
          });
        } catch (err) {
          console.error('Failed to get AI response:', err);
          setError('Failed to get response. Please try again.');
        } finally {
          setLoading(false);
        }
      }, 1000);

    } catch (err) {
      console.error('Error in handleSend:', err);
      setError('Failed to send message. Please try again.');
      setLoading(false);
    }
  };

  const handleSpecialistSwitch = (specialist: Agent) => {
    setActiveAgent(specialist);
    setShowSpecialists(false);
    
    // Add a system message about the switch
    if (currentConversationId) {
      const switchMessage = {
        role: 'assistant' as const,
        content: `I'm now connecting you with ${specialist.name}, our ${specialist.name.toLowerCase()}. They specialize in ${specialist.specialties?.join(', ')}.`,
        metadata: { 
          agent_id: specialist.id,
          agent_switch: true
        }
      };
      chatHistory.addMessage(currentConversationId, switchMessage);
    }
  };

  const handleBackToDepartmentHead = () => {
    setActiveAgent(agent);
    
    // Add a system message about switching back
    if (currentConversationId) {
      const switchMessage = {
        role: 'assistant' as const,
        content: `You're back with ${agent.name}. I can help with general ${agent.department} questions or connect you with other specialists as needed.`,
        metadata: { 
          agent_id: agent.id,
          agent_switch: true
        }
      };
      chatHistory.addMessage(currentConversationId, switchMessage);
    }
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [messages]);

  const getDepartmentColor = (dept: string): string => {
    const colors: Record<string, string> = {
      sales: 'bg-success',
      marketing: 'bg-secondary',
      finance: 'bg-primary',
      operations: 'bg-warning'
    };
    return colors[dept] || 'bg-muted';
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background">
        {/* Main Header */}
        <div className="flex items-center gap-4 p-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              aria-label="Back to department selection"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div className={`w-10 h-10 rounded-lg ${getDepartmentColor(agent.department || '')} flex items-center justify-center`}>
            <span className="text-xl">{activeAgent.avatar}</span>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">{activeAgent.name}</h3>
            <p className="text-xs text-muted-foreground capitalize">
              {activeAgent.type === 'specialist' ? `${agent.department} Specialist` : `${agent.department} Department`}
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="w-3 h-3" />
            <span>{activeAgent.type}</span>
          </div>
        </div>

        {/* Specialists Toggle */}
        {specialists.length > 0 && (
          <div className="px-4 pb-3">
            <button
              onClick={() => setShowSpecialists(!showSpecialists)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>{specialists.length} specialists available</span>
              {showSpecialists ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            
            {/* Specialists List */}
            {showSpecialists && (
              <div className="mt-2 space-y-1">
                {activeAgent.id !== agent.id && (
                  <button
                    onClick={handleBackToDepartmentHead}
                    className="w-full flex items-center gap-2 p-2 text-left text-sm bg-muted/50 hover:bg-muted rounded-lg transition-colors"
                  >
                    <span className="text-base">{agent.avatar}</span>
                    <span className="font-medium">{agent.name}</span>
                    <span className="text-xs text-muted-foreground ml-auto">Department Head</span>
                  </button>
                )}
                {specialists.map((specialist) => (
                  <button
                    key={specialist.id}
                    onClick={() => handleSpecialistSwitch(specialist)}
                    className={`w-full flex items-center gap-2 p-2 text-left text-sm rounded-lg transition-colors ${
                      activeAgent.id === specialist.id
                        ? 'bg-primary/10 border border-primary/20'
                        : 'bg-muted/50 hover:bg-muted'
                    }`}
                  >
                    <span className="text-base">{specialist.avatar}</span>
                    <div className="flex-1">
                      <div className="font-medium">{specialist.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {specialist.specialties?.slice(0, 2).join(', ')}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Messages */}
      <div 
        className="flex-1 overflow-y-auto px-6 py-4"
        ref={transcriptRef}
        tabIndex={0}
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
            <div className={`w-20 h-20 rounded-full ${getDepartmentColor(agent.department || '')} bg-opacity-10 flex items-center justify-center mb-6`}>
              <span className="text-3xl">{activeAgent.avatar}</span>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {activeAgent.name}
            </h3>
            <p className="text-muted-foreground text-sm mb-6">
              {activeAgent.description}
            </p>
            
            {/* Quick Actions */}
            <div className="w-full space-y-2">
              <p className="text-sm font-medium text-foreground">Quick Actions:</p>
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleSend(action)}
                  className="w-full p-4 text-left text-sm bg-muted hover:bg-muted/80 rounded-lg transition-colors border border-border hover:border-border/80"
                >
                  {action}
                </button>
              ))}
            </div>

            {/* Specialists Preview */}
            {specialists.length > 0 && (
              <div className="w-full mt-6 p-4 bg-muted/30 rounded-lg">
                <p className="text-sm font-medium text-foreground mb-2">Available Specialists:</p>
                <div className="flex flex-wrap gap-2">
                  {specialists.map((specialist) => (
                    <span
                      key={specialist.id}
                      className="px-2 py-1 bg-background text-muted-foreground text-xs rounded-full"
                    >
                      {specialist.avatar} {specialist.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg, idx) => {
              if (msg.role === 'system') return null;
              
              const isUser = msg.role === 'user';
              const isAgentSwitch = msg.metadata?.agent_switch;
              
              if (isAgentSwitch) {
                return (
                  <div key={idx} className="text-center text-xs text-muted-foreground py-2 bg-muted/20 rounded-lg">
                    {msg.content}
                  </div>
                );
              }
              
              return (
                <div key={idx} className="space-y-2">
                  <div className={`flex items-start gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center ${
                      isUser 
                        ? 'bg-primary' 
                        : getDepartmentColor(agent.department || '')
                    }`}>
                      {isUser ? (
                        <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      ) : (
                        <span className="text-sm text-primary-foreground">{activeAgent.avatar}</span>
                      )}
                    </div>
                    <div className={`flex-1 ${isUser ? 'text-right' : 'text-left'}`}>
                      <div className={`inline-block max-w-full ${
                        isUser 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted text-foreground'
                      } rounded-2xl px-4 py-2 break-words`}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {loading && (
              <div className="flex items-start gap-4">
                <div className={`w-7 h-7 rounded-full ${getDepartmentColor(agent.department || '')} flex-shrink-0 flex items-center justify-center`}>
                  <span className="text-sm text-primary-foreground">{activeAgent.avatar}</span>
                </div>
                <div className="flex-1">
                  <div className="inline-block bg-muted rounded-2xl px-4 py-3">
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
      </div>

      {/* Input */}
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
                placeholder={`Ask ${activeAgent.name} anything...`}
                className="w-full bg-transparent resize-none border-none outline-none text-foreground placeholder-muted-foreground text-sm leading-relaxed min-h-[24px] max-h-32"
                rows={1}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = Math.min(target.scrollHeight, 128) + 'px';
                }}
              />
            </div>
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className={`p-2 rounded-lg transition-colors ${
                input.trim() && !loading
                  ? `${getDepartmentColor(agent.department || '')} hover:opacity-90 text-primary-foreground`
                  : 'bg-muted-foreground/20 text-muted-foreground cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

DepartmentalAgent.propTypes = {
  agent: PropTypes.object.isRequired,
  onClose: PropTypes.func,
  onBack: PropTypes.func,
};

export default DepartmentalAgent; 