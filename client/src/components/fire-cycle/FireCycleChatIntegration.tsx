import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, 
  Lightbulb, 
  Map, 
  Play, 
  Sparkles,
  MessageSquare,
  Send,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Zap,
  Brain,
  Eye,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Input } from '@/shared/components/ui/Input';
import { Textarea } from '@/shared/components/ui/Textarea';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert';
import { Progress } from '@/shared/components/ui/Progress';
import { useAuth } from '@/hooks/index';
import { useFireCycleChatIntegration } from '@/core/fire-cycle/fireCycleChatIntegration';
import { thoughtsService } from '@/lib/services/thoughtsService';
import type { Thought } from '@/core/types/thoughts';

interface FireCycleChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  firePhase?: 'focus' | 'insight' | 'roadmap' | 'execute';
  confidence?: number;
  suggestedActions?: string[];
  thoughtId?: string;
  isUpdate?: boolean;
}

interface FireCycleChatIntegrationProps {
  className?: string;
  onThoughtCreated?: (thoughtId: string) => void;
  onPhaseChange?: (phase: 'focus' | 'insight' | 'roadmap' | 'execute') => void;
  onConversationUpdate?: (message: string, firePhase: string) => void;
  autoAdvanceEnabled?: boolean;
  nlpUpdatesEnabled?: boolean;
  showInsights?: boolean;
}

interface ConversationUpdate {
  id: string;
  message: string;
  firePhase: 'focus' | 'insight' | 'roadmap' | 'execute';
  confidence: number;
  relatedThoughts: string[];
  timestamp: Date;
  processed: boolean;
}

export const FireCycleChatIntegration: React.FC<FireCycleChatIntegrationProps> = ({
  className = '',
  onThoughtCreated,
  onPhaseChange,
  onConversationUpdate,
  autoAdvanceEnabled = true,
  nlpUpdatesEnabled = true,
  showInsights = true
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<FireCycleChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showFireCycleInsights, setShowFireCycleInsights] = useState(false);
  const [currentFireCycleResponse, setCurrentFireCycleResponse] = useState<any>(null);
  const [conversationUpdates, setConversationUpdates] = useState<ConversationUpdate[]>([]);
  const [relatedThoughts, setRelatedThoughts] = useState<Thought[]>([]);
  const [processingUpdate, setProcessingUpdate] = useState(false);
  const [lastProcessedMessage, setLastProcessedMessage] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // FIRE Cycle integration
  const userContext = {
    userId: user?.id || '',
    companyId: (user as any)?.company_id || '',
    department: (user as any)?.department || '',
    role: (user as any)?.role || 'user',
    experienceLevel: 'intermediate' as const,
    goals: ['business_growth', 'efficiency'],
    challenges: ['time_management', 'prioritization'],
    currentProjects: [],
    preferences: {
      communicationStyle: 'professional',
      detailLevel: 'medium',
      automationLevel: 'high'
    },
    currentFocus: {
      phase: 'focus' as const,
      priority: 'medium' as const,
      context: 'general'
    },
    recentActivity: [],
    recentActivities: [],
    metrics: [] as any[],
    integrations: [],
    companySize: 'small',
    industry: 'technology',
    stage: 'growth' as const,
    skillLevels: {
      planning: 'intermediate',
      execution: 'intermediate',
      analysis: 'intermediate'
    }
  };

  const { analyzeChatMessage, createThoughtFromChat } = useFireCycleChatIntegration(userContext);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load related thoughts
  const loadRelatedThoughts = useCallback(async () => {
    if (!user?.id) return;

    try {
      const response = await thoughtsService.getThoughts(user?.id || '', { limit: 50 });
      if (response.success && response.data) {
        setRelatedThoughts(response.data);
      }
    } catch (error) {
      console.error('Failed to load related thoughts:', error);
    }
  }, [user?.id]);

  useEffect(() => {
    loadRelatedThoughts();
  }, [loadRelatedThoughts]);

  // Process conversation updates with NLP
  const processConversationUpdate = useCallback(async (message: string) => {
    if (!nlpUpdatesEnabled || !user?.id || message === lastProcessedMessage) return;

    setProcessingUpdate(true);
    try {
      const response = await analyzeChatMessage(message, user.id, (user as any).company_id);
      
      if (response.shouldTrigger && response.firePhase) {
        // Find related thoughts based on content similarity
        const relatedThoughts = findRelatedThoughts(message);
        
        const update: ConversationUpdate = {
          id: Date.now().toString(),
          message,
          firePhase: response.firePhase,
          confidence: response.confidence || 0,
          relatedThoughts: relatedThoughts.map(t => t.id),
          timestamp: new Date(),
          processed: false
        };

        setConversationUpdates(prev => [update, ...prev]);
        onConversationUpdate?.(message, response.firePhase);

        // Auto-advance related thoughts if enabled
        if (autoAdvanceEnabled && relatedThoughts.length > 0) {
          await autoAdvanceThoughts(relatedThoughts, response.firePhase);
        }
      }
    } catch (error) {
      console.error('Failed to process conversation update:', error);
    } finally {
      setProcessingUpdate(false);
      setLastProcessedMessage(message);
    }
  }, [nlpUpdatesEnabled, user?.id, lastProcessedMessage, autoAdvanceEnabled, onConversationUpdate]);

  // Find related thoughts using simple keyword matching
  const findRelatedThoughts = (message: string): Thought[] => {
    const messageWords = message.toLowerCase().split(' ');
    const messageFirstWord = messageWords[0];
    
    return relatedThoughts.filter(thought => {
      const thoughtWords = thought.content.toLowerCase().split(' ');
      const thoughtFirstWord = thoughtWords[0];
      
      // Check for word overlap
      const commonWords = messageWords.filter(word => 
        thoughtWords.some((thoughtWord: string) => 
          thoughtWord.includes(word) || word.includes(thoughtWord)
        )
      );
      
      // Check for first word similarity (common in updates)
      const firstWordSimilar = messageFirstWord === thoughtFirstWord;
      
      return commonWords.length > 0 || firstWordSimilar;
    });
  };

  // Auto-advance thoughts to new phases
  const autoAdvanceThoughts = async (thoughts: Thought[], newPhase: 'focus' | 'insight' | 'roadmap' | 'execute') => {
    for (const thought of thoughts) {
      try {
        await thoughtsService.updateThought(thought.id, {
          content: thought.content,
          status: newPhase === 'execute' ? 'completed' : 'in_progress',
          workflow_stage: newPhase === 'focus' ? 'create_idea' : 
                         newPhase === 'insight' ? 'update_idea' : 
                         newPhase === 'roadmap' ? 'implement_idea' : 'achievement',
          aiinsights: {
            ...thought.aiinsights,
            phaseChangedAt: new Date().toISOString(),
            previousPhase: thought.workflow_stage || 'create_idea',
            autoAdvanced: true,
            conversationTrigger: true
          }
        });
        
        onPhaseChange?.(newPhase);
      } catch (error) {
        console.error('Failed to auto-advance thought:', error);
      }
    }
  };

  // Handle message sending
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return;

    const userMessage: FireCycleChatMessage = {
      id: Date.now().toString(),
      content: inputValue,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      // Process for FIRE cycle triggers
              const fireCycleResponse = await analyzeChatMessage(inputValue, user?.id || '', (user as any)?.company_id);
      
      if (fireCycleResponse.shouldTrigger) {
        // Show FIRE cycle insights
        setCurrentFireCycleResponse(fireCycleResponse);
        setShowFireCycleInsights(true);
        
        // Add system message about FIRE cycle detection
        const systemMessage: FireCycleChatMessage = {
          id: (Date.now() + 1).toString(),
          content: `I detected this might be related to the ${fireCycleResponse.firePhase} phase of the FIRE cycle. Let me help you develop this idea.`,
          isUser: false,
          timestamp: new Date(),
          firePhase: fireCycleResponse.firePhase,
          confidence: fireCycleResponse.confidence,
          suggestedActions: fireCycleResponse.nextSteps
        };
        
        setMessages(prev => [...prev, systemMessage]);
        
        // Process as conversation update
        await processConversationUpdate(inputValue);
      } else {
        // Regular AI response
        const aiMessage: FireCycleChatMessage = {
          id: (Date.now() + 1).toString(),
          content: `I understand you said: "${inputValue}". How can I help you with this?`,
          isUser: false,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, aiMessage]);
        
        // Still process for potential updates
        await processConversationUpdate(inputValue);
      }
    } catch (error) {
      const errorMessage: FireCycleChatMessage = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error processing your message. Please try again.',
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  // Handle creating thought from FIRE cycle response
  const handleCreateThought = async () => {
    if (!currentFireCycleResponse || !user?.id) return;

    try {
      const thoughtId = await createThoughtFromChat(
        currentFireCycleResponse.originalMessage || inputValue,
        user.id,
        (user as any).company_id,
        currentFireCycleResponse.firePhase
      );

      if (thoughtId) {
        onThoughtCreated?.(thoughtId);
        setShowFireCycleInsights(false);
        setCurrentFireCycleResponse(null);
        
        // Add success message
        const successMessage: FireCycleChatMessage = {
          id: Date.now().toString(),
          content: `Great! I've captured this as a thought in the ${currentFireCycleResponse.firePhase} phase. You can track its progress in the FIRE Cycle Dashboard.`,
          isUser: false,
          timestamp: new Date(),
          thoughtId
        };
        
        setMessages(prev => [...prev, successMessage]);
      }
    } catch (error) {
      console.error('Failed to create thought:', error);
    }
  };

  // Handle dismissing FIRE cycle insights
  const handleDismissInsights = () => {
    setShowFireCycleInsights(false);
    setCurrentFireCycleResponse(null);
  };

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'focus': return Target;
      case 'insight': return Lightbulb;
      case 'roadmap': return Map;
      case 'execute': return Play;
      default: return Sparkles;
    }
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'focus': return 'bg-primary-subtle text-primary border-primary/20';
      case 'insight': return 'bg-warning-subtle text-warning border-warning/20';
      case 'roadmap': return 'bg-success-subtle text-success border-success/20';
      case 'execute': return 'bg-secondary-subtle text-secondary border-secondary/20';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">FIRE Cycle Chat</h3>
        </div>
        <div className="flex items-center gap-2">
          {processingUpdate && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
              Processing...
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs lg:max-w-md ${message.isUser ? 'order-2' : 'order-1'}`}>
                <Card className={`${message.isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  <CardContent className="p-3">
                    <p className="text-sm">{message.content}</p>
                    
                    {message.firePhase && (
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={`text-xs ${getPhaseColor(message.firePhase)}`}>
                          {message.firePhase}
                        </Badge>
                        {message.confidence && (
                          <span className={`text-xs ${getConfidenceColor(message.confidence)}`}>
                            {Math.round(message.confidence * 100)}% match
                          </span>
                        )}
                      </div>
                    )}
                    
                    {message.suggestedActions && message.suggestedActions.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium mb-1">Suggested Actions:</p>
                        <div className="space-y-1">
                          {message.suggestedActions.slice(0, 2).map((action, index) => (
                            <div key={index} className="flex items-center gap-1 text-xs">
                              <CheckCircle className="w-3 h-3" />
                              <span>{action}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                <p className="text-xs text-muted-foreground mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="max-w-xs lg:max-w-md">
              <Card className="bg-muted">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm text-muted-foreground">Processing...</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* FIRE Cycle Insights */}
      {showFireCycleInsights && currentFireCycleResponse && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 border-t bg-muted/50"
        >
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {React.createElement(getPhaseIcon(currentFireCycleResponse.firePhase), {
                    className: 'w-5 h-5'
                  })}
                  <CardTitle className="text-lg">
                    FIRE Cycle Detected
                  </CardTitle>
                </div>
                <Badge className={getPhaseColor(currentFireCycleResponse.firePhase)}>
                  {currentFireCycleResponse.firePhase?.toUpperCase()}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Your message indicates a {currentFireCycleResponse.firePhase} phase. Would you like to capture this as a thought?
              </p>
            </CardHeader>
            <CardContent>
              {currentFireCycleResponse.nextSteps && currentFireCycleResponse.nextSteps.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium mb-2">Suggested Next Steps:</p>
                  <div className="space-y-1">
                    {currentFireCycleResponse.nextSteps.map((step: string, index: number) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-muted-foreground" />
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <Button onClick={handleCreateThought} size="sm">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Create Thought
                </Button>
                <Button variant="outline" onClick={handleDismissInsights} size="sm">
                  Dismiss
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Conversation Updates */}
      {conversationUpdates.length > 0 && showInsights && (
        <div className="p-4 border-t bg-muted/30">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Recent Updates</h4>
            {conversationUpdates.slice(0, 3).map((update) => (
              <motion.div
                key={update.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 text-xs"
              >
                <div className={`p-1 rounded ${getPhaseColor(update.firePhase)}`}>
                  {React.createElement(getPhaseIcon(update.firePhase), {
                    className: 'w-3 h-3'
                  })}
                </div>
                <span className="flex-1">{update.message.substring(0, 50)}...</span>
                <Badge variant="outline" className="text-xs">
                  {update.firePhase}
                </Badge>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex items-center gap-2">
          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 min-h-[60px] resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={!inputValue.trim() || isTyping}
            size="icon"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}; 
