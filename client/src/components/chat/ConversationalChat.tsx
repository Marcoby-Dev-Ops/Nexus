/**
 * Conversational Chat Component
 * 
 * Provides "ChatGPT but it knows their business" experience with:
 * - Focused questions and validation
 * - Progress tracking
 * - Business context awareness
 * - Step-by-step task completion
 * - Clean, professional layout matching ModernChatInterface
 */

import React, { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback } from '@/shared/components/ui/Avatar';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Send, Brain, Lightbulb, Ticket, Building, Target, BookOpen, Bot, User, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/shared/components/ui/use-toast';
import { cn } from '@/shared/lib/utils';
import { conversationalAIService, type ConversationContext } from '@/services/ai/ConversationalAIService';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  knowledgeContext?: {
    relevantThoughts?: string[];
    activeTickets?: string[];
    businessInsights?: string[];
    focusAreas?: string[];
    recommendations?: string[];
  };
}

interface ConversationalChatProps {
  context: ConversationContext;
  onContextUpdate?: (context: ConversationContext) => void;
  className?: string;
}

export const ConversationalChat: React.FC<ConversationalChatProps> = ({ 
  context, 
  onContextUpdate, 
  className = '' 
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedContext, setExpandedContext] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initial focus when component mounts
  useEffect(() => {
    setTimeout(() => {
      chatInputRef.current?.focus();
    }, 100);
  }, []);

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const knowledgeBase = context.businessContext.knowledgeBase;
      const companyName = knowledgeBase?.companyData?.name || 'your business';
      const industry = knowledgeBase?.companyData?.industry || 'your industry';
      const activeTasks = knowledgeBase?.brainTickets?.filter(t => t.status === 'open').length || 0;
      const insights = knowledgeBase?.thoughts?.length || 0;
      
      // Get recent focus areas
      const recentThoughts = knowledgeBase?.thoughts?.slice(0, 3) || [];
      const focusAreas = recentThoughts.map(t => t.title.split(' - ')[1] || t.title.split(' ')[0]).slice(0, 2);
      
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        role: 'assistant',
        content: `Hi! I'm your Nexus AI assistant, and I have deep knowledge of ${companyName}. 

I can see you're in the ${industry} industry and have ${insights} business insights in your knowledgebase. You currently have ${activeTasks} active tasks that need attention.

${focusAreas.length > 0 ? `Based on your recent work, I know you've been focusing on ${focusAreas.join(' and ')}. ` : ''}

I'm here to help you with anything related to your business - from optimizing your processes to growing your revenue, managing your team, or working through your active tasks. What would you like to work on today?`,
        timestamp: new Date(),
        knowledgeContext: {
          businessInsights: [`I understand ${companyName}'s ${industry} business context`],
          focusAreas: focusAreas,
          activeTickets: knowledgeBase?.brainTickets?.filter(t => t.status === 'open').slice(0, 2).map(t => t.title) || [],
          recommendations: [
            activeTasks > 0 ? `You have ${activeTasks} active tasks that might need attention` : null,
            insights > 0 ? `I can reference ${insights} insights from your business knowledgebase` : null
          ].filter(Boolean) as string[]
        }
      };
      setMessages([welcomeMessage]);
    }
  }, [context, messages.length]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);

    try {
      const response = await conversationalAIService.processMessage(
        inputValue.trim(),
        context
      );

      if (response.success && response.data) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.data.response,
          timestamp: new Date(),
          knowledgeContext: response.data.knowledgeContext
        };

        setMessages(prev => [...prev, assistantMessage]);

        // Update context if provided
        if (response.data.collectedData && Object.keys(response.data.collectedData).length > 0) {
          const updatedContext = {
            ...context,
            collectedData: { ...context.collectedData, ...response.data.collectedData }
          };
          onContextUpdate?.(updatedContext);
        }
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to process message",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error processing message:', error);
      toast({
        title: "Error",
        description: "Failed to process message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleContextSection = (sectionId: string) => {
    setExpandedContext(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const renderKnowledgeContext = (knowledgeContext?: any, messageId: string) => {
    if (!knowledgeContext) return null;
    
    const sections = [
      { id: 'insights', icon: Lightbulb, title: 'Business Insights', data: knowledgeContext.businessInsights, color: 'text-yellow-400' },
      { id: 'focus', icon: Target, title: 'Recent Focus Areas', data: knowledgeContext.focusAreas, color: 'text-green-400' },
      { id: 'tasks', icon: Ticket, title: 'Active Tasks', data: knowledgeContext.activeTickets, color: 'text-orange-400' },
      { id: 'recommendations', icon: BookOpen, title: 'Recommendations', data: knowledgeContext.recommendations, color: 'text-purple-400' },
      { id: 'thoughts', icon: Brain, title: 'Related Knowledge', data: knowledgeContext.relevantThoughts, color: 'text-blue-400' }
    ].filter(section => section.data && section.data.length > 0);

    if (sections.length === 0) return null;

    return (
      <div className="mt-3 space-y-2">
        {sections.map((section) => {
          const IconComponent = section.icon;
          const isExpanded = expandedContext.has(`${messageId}-${section.id}`);
          
          return (
            <div key={section.id} className="bg-gray-800/50 rounded-lg border border-gray-700/50 overflow-hidden">
              <button
                onClick={() => toggleContextSection(`${messageId}-${section.id}`)}
                className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <IconComponent className={cn("w-4 h-4", section.color)} />
                  <span className="text-sm font-medium text-gray-200">{section.title}</span>
                  <span className="text-xs text-gray-400">({section.data.length})</span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>
              
              {isExpanded && (
                <div className="px-3 pb-3 border-t border-gray-700/50">
                  <div className="text-sm text-gray-300 space-y-1 pt-2">
                    {section.data.map((item: string, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        <span className="text-gray-500 mt-1">•</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={cn(
      "flex flex-col h-full bg-gray-900 text-white rounded-lg border border-gray-700 overflow-hidden",
      className
    )}>
      {/* Agent Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-200">Business-Aware AI Assistant</span>
          </div>
          <div className="text-xs text-gray-400">
            Connected and ready to help with your business
          </div>
        </div>
      </div>

      {/* Messages Container - Fixed height with proper scrolling */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 [scrollbar-gutter:stable]">
        <div className="px-4 py-4 space-y-4">
          <div className="space-y-6">
            {messages.map((message) => (
              <div key={message.id} className="flex gap-4 max-w-4xl mx-auto justify-start">
                <div className="flex-shrink-0">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className={cn(
                      "text-gray-300",
                      message.role === 'assistant' ? "bg-gray-700" : "bg-blue-600"
                    )}>
                      {message.role === 'assistant' ? (
                        <Bot className="w-4 h-4" />
                      ) : (
                        <User className="w-4 h-4" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-1 max-w-3xl">
                  <div className={cn(
                    "rounded-2xl px-4 py-3",
                    message.role === 'assistant' 
                      ? "bg-gray-800 text-gray-100" 
                      : "bg-blue-600 text-white"
                  )}>
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {message.content}
                    </div>
                    {renderKnowledgeContext(message.knowledgeContext, message.id)}
                  </div>
                  <div className="mt-2 text-xs text-gray-400">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Typing Indicator */}
            {isProcessing && (
              <div className="flex gap-4 max-w-4xl mx-auto justify-start">
                <div className="flex-shrink-0">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-gray-700 text-gray-300">
                      <Bot className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-1 max-w-3xl">
                  <div className="bg-gray-800 rounded-2xl px-4 py-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="border-t border-gray-700 bg-gray-800 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2">
            <Input
              ref={chatInputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about your business..."
              disabled={isProcessing}
              className="flex-1 bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isProcessing}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
