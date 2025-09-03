/**
 * Identity Setup Chat
 * 
 * A conversational interface that guides users through defining their business identity
 * using proper conversation pacing techniques with step cards on the left.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Progress } from '@/shared/components/ui/Progress';
import { useToast } from '@/shared/ui/components/Toast';
import { ConsolidatedAIService } from '@/services/ai/ConsolidatedAIService';
import { logger } from '@/shared/utils/logger';
import { callEdgeFunction } from '@/lib/api-client';
import { 
  Sparkles, 
  CheckCircle,
  ArrowRight,
  Lightbulb,
  Target,
  Users,
  Building,
  Globe,
  Heart,
  Award,
  MessageSquare
} from 'lucide-react';
import ModernChatInterface from '@/lib/ai/components/ModernChatInterface';
import type { ChatMessage } from '@/shared/types/chat';

interface IdentitySetupChatProps {
  onComplete: (identity: any) => void;
  onBack: () => void;
}



interface IdentityStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: 'pending' | 'active' | 'completed';
  order: number;
}

const IDENTITY_PROMPT = `I'm here to help you define your business identity. Let's start by understanding your vision and goals.

I'll ask you one question at a time to help shape your business identity. Let's begin with the most fundamental question:

**What problem are you solving?** 

What specific need or pain point does your business address?`;

const IDENTITY_STEPS: IdentityStep[] = [
  {
    id: 'problem-definition',
    title: 'Problem Definition',
    description: 'What problem are you solving?',
    icon: Target,
    status: 'active',
    order: 1
  },
  {
    id: 'target-audience',
    title: 'Target Audience',
    description: 'Who are your ideal customers?',
    icon: Users,
    status: 'pending',
    order: 2
  },
  {
    id: 'unique-value',
    title: 'Unique Value',
    description: 'What makes you different?',
    icon: Award,
    status: 'pending',
    order: 3
  },
  {
    id: 'vision-mission',
    title: 'Vision & Mission',
    description: 'What is your purpose?',
    icon: Building,
    status: 'pending',
    order: 4
  },
  {
    id: 'core-values',
    title: 'Core Values',
    description: 'What do you stand for?',
    icon: Heart,
    status: 'pending',
    order: 5
  },
  {
    id: 'brand-positioning',
    title: 'Brand Positioning',
    description: 'How do you want to be perceived?',
    icon: Globe,
    status: 'pending',
    order: 6
  }
];

export default function IdentitySetupChat({ onComplete, onBack }: IdentitySetupChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      conversation_id: 'identity-setup',
      role: 'assistant',
      content: IDENTITY_PROMPT,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: {
        model: 'Claude 3.5 Sonnet'
      }
    }
  ]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [identityData, setIdentityData] = useState<any>({});
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<IdentityStep[]>(IDENTITY_STEPS);
  const { toast } = useToast();

  const aiService = new ConsolidatedAIService();

  // Update step status based on conversation progress
  useEffect(() => {
    const updateStepStatus = () => {
      const newSteps = [...steps];
      const stepProgress = Math.floor((messages.length - 1) / 3); // Rough estimate based on conversation length
      
      newSteps.forEach((step, index) => {
        if (index < stepProgress) {
          step.status = 'completed';
        } else if (index === stepProgress) {
          step.status = 'active';
        } else {
          step.status = 'pending';
        }
      });
      
      setSteps(newSteps);
      setCurrentStep(stepProgress);
    };

    updateStepStatus();
  }, [messages.length]);

  const handleSendMessage = useCallback(async (message: string) => {
    if (!message.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      conversation_id: 'identity-setup',
      role: 'user',
      content: message,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: {}
    };

    setMessages(prev => [...prev, userMessage]);
    setIsStreaming(true);

    try {
      // Call the AI chat endpoint with conversation pacing and business identity context
      const response = await callEdgeFunction('ai_chat', {
        message,
        context: {
          conversationId: null,
          agentId: 'business-identity-consultant',
          previousMessages: messages.map(msg => ({
            role: msg.role,
            content: msg.content,
            created_at: msg.created_at,
            updated_at: msg.updated_at
          })),
          userContext: {
            setupType: 'business-identity',
            currentStep: 'identity-definition'
          },
          dashboard: {},
          nextBestActions: []
        },
        attachments: []
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to get response from AI');
      }

      const assistantResponse = (response.data as any)?.content || 'I understand. Please tell me more about your business.';
      
      // Add the assistant response
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        conversation_id: 'identity-setup',
        role: 'assistant',
        content: assistantResponse,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {
          model: 'Claude 3.5 Sonnet'
        }
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Check if we have enough information to complete
      if (assistantResponse.toLowerCase().includes('business identity summary') || 
          assistantResponse.toLowerCase().includes('here\'s your business identity')) {
        
        // Extract identity data from the conversation
        const identity = extractIdentityFromConversation([...messages, userMessage, assistantMessage]);
        
        setIdentityData(identity);
        setProgress(100);
        
        // Mark all steps as completed
        setSteps(prev => prev.map(step => ({ ...step, status: 'completed' as const })));
        
        // Show completion toast
        toast({
          title: "Business Identity Complete!",
          description: "Your business identity has been defined successfully.",
          type: "success"
        });
      } else {
        // Update progress based on conversation length
        const newProgress = Math.min(90, (messages.length + 2) * 15);
        setProgress(newProgress);
      }

    } catch (error) {
      logger.error('Error in identity chat:', error);
      toast({
        title: "Error",
        description: "Failed to process your message. Please try again.",
        type: "error"
      });
    } finally {
      setIsStreaming(false);
    }
  }, [messages, aiService, toast]);

  const extractIdentityFromConversation = (conversation: ChatMessage[]) => {
    // Simple extraction - in a real app, you'd use more sophisticated NLP
    const userMessages = conversation.filter(msg => msg.role === 'user');
    const assistantMessages = conversation.filter(msg => msg.role === 'assistant');
    
    return {
      problem: extractFromMessages(userMessages, ['problem', 'solving', 'pain point']),
      targetAudience: extractFromMessages(userMessages, ['audience', 'customers', 'users', 'target']),
      uniqueValue: extractFromMessages(userMessages, ['unique', 'different', 'special', 'advantage']),
      vision: extractFromMessages(userMessages, ['vision', 'future', 'goal', 'aspiration']),
      conversation: conversation.map(msg => ({
        role: msg.role,
        content: msg.content,
        created_at: msg.created_at
      }))
    };
  };

  const extractFromMessages = (messages: ChatMessage[], keywords: string[]) => {
    for (const message of messages) {
      for (const keyword of keywords) {
        if (message.content.toLowerCase().includes(keyword)) {
          return message.content;
        }
      }
    }
    return '';
  };

  const handleComplete = () => {
    onComplete(identityData);
  };

  const getStepIcon = (step: IdentityStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'active':
        return <step.icon className="h-4 w-4 text-primary" />;
      default:
        return <step.icon className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStepCardClass = (step: IdentityStep) => {
    switch (step.status) {
      case 'completed':
        return 'border-green-200 bg-green-50';
      case 'active':
        return 'border-primary bg-primary/5 ring-2 ring-primary/20';
      default:
        return 'border-muted bg-muted/30';
    }
  };

  return (
    <div className="flex h-full max-w-7xl mx-auto">
      {/* Left Side - Step Cards */}
      <div className="w-80 border-r bg-muted/20 p-6 space-y-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Identity Setup Steps</h2>
          </div>
          
          <div className="space-y-2">
            {steps.map((step, index) => (
              <Card 
                key={step.id} 
                className={`cursor-pointer transition-all ${getStepCardClass(step)}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getStepIcon(step)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{step.title}</span>
                        {step.status === 'active' && (
                          <Badge variant="secondary" className="text-xs">Current</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Progress Summary */}
        <div className="pt-4 border-t">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {steps.filter(s => s.status === 'completed').length} of {steps.length} steps completed
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        {progress === 100 && (
          <div className="pt-4 border-t">
            <Button 
              onClick={handleComplete} 
              className="w-full gap-2"
              size="sm"
            >
              <CheckCircle className="h-4 w-4" />
              Complete Setup
            </Button>
          </div>
        )}
      </div>

      {/* Right Side - Chat Interface */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <MessageSquare className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Business Identity Chat</h1>
              <p className="text-sm text-muted-foreground">
                Let's define your business identity together
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={onBack}>
              Back
            </Button>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="flex-1 min-h-0">
          <ModernChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
            isStreaming={isStreaming}
            placeholder="Tell me about your business idea..."
            showTypingIndicator={isStreaming}
            className="h-full"
          />
        </div>

        {/* Quick Actions */}
        {messages.length === 1 && (
          <div className="p-4 border-t bg-muted/30">
            <div className="max-w-4xl mx-auto">
              <p className="text-sm text-muted-foreground mb-3">Quick start suggestions:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  "I want to create a tech startup",
                  "I'm starting a local service business", 
                  "I have a product idea but need help defining it",
                  "I want to help people with [specific problem]"
                ].map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSendMessage(suggestion)}
                    className="text-xs"
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
