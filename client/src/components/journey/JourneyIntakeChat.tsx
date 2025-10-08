/**
 * Journey Intake Chat Component
 * 
 * Provides a conversational interface for the journey intake process.
 * Uses AI to understand user intent and guide them to the appropriate journey type.
 * Features a split layout with step cards on the left and chat on the right.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Bot, User, ArrowRight, CheckCircle, Loader2, 
  Target, MessageSquare, Lightbulb, Users, Building, 
  Globe, Heart, Award, Zap, Rocket
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/Badge';
import { Progress } from '@/shared/components/ui/progress';
import { ScrollArea } from '@/shared/components/ui/ScrollArea';
import { useToast } from '@/shared/components/ui/use-toast';
import { journeyIntakeService, type JourneyIntakeSession, type ConversationMessage, type JourneyType } from '@/services/playbook/JourneyIntakeService';
import { documentProcessingService, type FileUpload } from '@/services/shared/DocumentProcessingService';
import { integrationOrchestratorService, type IntegrationRequest } from '@/services/shared/IntegrationOrchestratorService';
import { useAuth } from '@/hooks/useAuth';
import { useOrganizationStore } from '@/shared/stores/organizationStore';
import ModernChatInterface from '@/lib/ai/components/ModernChatInterface';
// Removed useOnboardingBrainIntegration import - not needed for this component

interface JourneyIntakeChatProps {
  onJourneyCreated?: (journeyId: string) => void;
  onClose?: () => void;
  preloadedContext?: {
    journeyType?: string;
    suggestedJourney?: Record<string, unknown>;
    focus?: string;
    knowledgeBase?: string;
    assistantMode?: string;
    topic?: string;
  };
}

interface IntakeStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: 'pending' | 'active' | 'completed';
  order: number;
}

const INTAKE_STEPS: IntakeStep[] = [
  {
    id: 'welcome',
    title: 'Welcome & Introduction',
    description: 'Understanding your needs',
    icon: MessageSquare,
    status: 'active',
    order: 1
  },
  {
    id: 'business-context',
    title: 'Business Context',
    description: 'Understanding your business',
    icon: Building,
    status: 'pending',
    order: 2
  },
  {
    id: 'goals-objectives',
    title: 'Goals & Objectives',
    description: 'What you want to achieve',
    icon: Target,
    status: 'pending',
    order: 3
  },
  {
    id: 'challenges-pain-points',
    title: 'Challenges & Pain Points',
    description: 'What you\'re struggling with',
    icon: Lightbulb,
    status: 'pending',
    order: 4
  },
  {
    id: 'journey-selection',
    title: 'Journey Selection',
    description: 'Finding the right journey',
    icon: Rocket,
    status: 'pending',
    order: 5
  },
  {
    id: 'journey-creation',
    title: 'Journey Creation',
    description: 'Setting up your journey',
    icon: CheckCircle,
    status: 'pending',
    order: 6
  }
];

export const JourneyIntakeChat: React.FC<JourneyIntakeChatProps> = ({
  onJourneyCreated,
  onClose,
  preloadedContext
}) => {
  const { user } = useAuth();
  const { activeOrgId } = useOrganizationStore();
  const { toast } = useToast();
  // Removed enhanceChatContext - not needed for this component
  
  const [session, setSession] = useState<JourneyIntakeSession | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [nextQuestions, setNextQuestions] = useState<string[]>([]);
  const [suggestedJourney, setSuggestedJourney] = useState<JourneyType | null>(null);
  const [confidenceScore, setConfidenceScore] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [attachments, setAttachments] = useState<FileUpload[]>([]);
  const [integrations, setIntegrations] = useState<IntegrationRequest[]>([]);
  const [steps, setSteps] = useState<IntakeStep[]>(INTAKE_STEPS);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  // Initialize session on mount
  useEffect(() => {
    if (user?.id && activeOrgId) {
      initializeSession();
    }
  }, [user?.id, activeOrgId, preloadedContext]);

  // Update step status based on conversation progress
  useEffect(() => {
    const updateStepStatus = () => {
      const newSteps = [...steps];
      const stepProgress = Math.floor((messages.length - 1) / 2); // Rough estimate based on conversation length
      
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
      
      // Update progress percentage
      const newProgress = Math.min(90, (messages.length + 1) * 15);
      setProgress(newProgress);
    };

    updateStepStatus();
  }, [messages.length]);

  const initializeSession = async () => {
    if (!user?.id || !activeOrgId) return;

    setIsLoading(true);
    try {
      // Start new session using API
      const sessionResult = await journeyIntakeService.startIntakeSession(activeOrgId, {
        preloadedContext,
        user_profile: {
          firstName: user.firstName,
          lastName: user.lastName,
          name: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : undefined,
          email: user.email
        }
      });

      if (sessionResult.success && sessionResult.data) {
        setSession(sessionResult.data);
        
        // Generate initial AI response
        const initialMessage = preloadedContext?.suggestedJourney 
          ? `I want to start the ${preloadedContext.suggestedJourney.name} journey. ${preloadedContext.suggestedJourney.description}`
          : preloadedContext?.focus 
          ? `I want to focus on ${preloadedContext.focus}`
          : preloadedContext?.topic 
          ? `I want to discuss ${preloadedContext.topic}`
          : "Hello, I'd like to start a new journey";

        const aiResponse = await journeyIntakeService.generateAIResponse(
          sessionResult.data, 
          initialMessage
        );

        if (aiResponse.success && aiResponse.data) {
          const assistantMessage: ConversationMessage = {
            id: `msg_${Date.now()}`,
            role: 'assistant',
            content: aiResponse.data.response,
            timestamp: new Date().toISOString()
          };

          setMessages([assistantMessage]);
          setNextQuestions(aiResponse.data.next_questions || []);
          
          if (aiResponse.data.journey_identified) {
            setSuggestedJourney(aiResponse.data.journey_identified);
            setConfidenceScore(aiResponse.data.confidence_score || 0);
          }

          // Save AI message to session
          await journeyIntakeService.addSessionMessage(
            sessionResult.data.id,
            aiResponse.data.response,
            'ai'
          );
        }
      } else {
        throw new Error(sessionResult.error || 'Failed to start intake session');
      }
    } catch (error) {
      console.error('Error initializing session:', error);
      toast({
        title: 'Error',
        description: 'Failed to start journey intake session. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (message: string, files?: File[]) => {
    if (!session || (!message.trim() && (!files || files.length === 0))) return;

    // Process file uploads if provided
    let processedAttachments: FileUpload[] = [];
    if (files && files.length > 0) {
      try {
        processedAttachments = await documentProcessingService.filesToUploads(files);
        setAttachments(prev => [...prev, ...processedAttachments]);
      } catch (error) {
        toast({
          title: 'File Upload Error',
          description: 'Failed to process uploaded files. Please try again.',
          variant: 'destructive'
        });
        return;
      }
    }

    // Add user message to chat
    const userMessage: ConversationMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
      metadata: {
        attachments: processedAttachments,
        integrations: integrations
      }
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      // Save user message to session
      await journeyIntakeService.addSessionMessage(session.id, message, 'user');

      // Generate AI response
      const aiResponse = await journeyIntakeService.generateAIResponse(session, message);

      if (aiResponse.success && aiResponse.data) {
        const assistantMessage: ConversationMessage = {
          id: `msg_${Date.now() + 1}`,
          role: 'assistant',
          content: aiResponse.data.response,
          timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, assistantMessage]);
        setNextQuestions(aiResponse.data.next_questions || []);
        
        if (aiResponse.data.journey_identified) {
          setSuggestedJourney(aiResponse.data.journey_identified);
          setConfidenceScore(aiResponse.data.confidence_score || 0);
        }

        // Save AI message to session
        await journeyIntakeService.addSessionMessage(
          session.id,
          aiResponse.data.response,
          'ai'
        );

        // Check if journey should be created
        if (aiResponse.data.journey_identified) {
          await createJourney(aiResponse.data.journey_identified.id);
        }
      } else {
        throw new Error(aiResponse.error || 'Failed to process message');
      }
    } catch (error) {
      console.error('Error processing message:', error);
      toast({
        title: 'Error',
        description: 'Failed to process your message. Please try again.',
        variant: 'destructive'
      });
    }
  };

    const createJourney = async (journeyTypeId: string) => {
    if (!session) return;

    try {
      const result = await journeyIntakeService.completeIntakeSession(
        session.id,
        journeyTypeId,
        {
          firstName: user?.firstName,
          lastName: user?.lastName,
          name: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : undefined,
          email: user?.email
        }
      );

      if (result.success && result.data) {
        toast({
          title: 'Journey Created!',
          description: `Your journey has been created successfully.`,
        });

        onJourneyCreated?.(result.data.journey_id);
        
        // Mark all steps as completed
        setSteps(prev => prev.map(step => ({ ...step, status: 'completed' as const })));
        setProgress(100);
        
        // Navigate to the journey
        navigate(`/journey/${result.data.journey_id}`);
      } else {
        throw new Error(result.error || 'Failed to create journey');
      }
    } catch (error) {
      console.error('Error creating journey:', error);
      toast({
        title: 'Error',
        description: 'Failed to create journey. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleIntegrationRequest = async (service: string, action: string, data?: any) => {
    const integration: IntegrationRequest = {
      service,
      action,
      data
    };

    setIntegrations(prev => [...prev, integration]);

    // Add a system message to show the integration request
    const systemMessage: ConversationMessage = {
      id: `integration_${Date.now()}`,
      role: 'assistant',
      content: `Connecting to ${service} to ${action}...`,
      timestamp: new Date().toISOString(),
      metadata: {
        integration_request: integration
      }
    };

    setMessages(prev => [...prev, systemMessage]);

         // Process the integration
     try {
       if (!user) return;
       
       const result = await integrationOrchestratorService.processIntegrations(
         [integration],
         user.id,
         activeOrgId
       );

      if (result.success && result.data) {
        const integrationResult = result.data[0];
        
        // Update the system message with results
        const updatedMessage: ConversationMessage = {
          ...systemMessage,
          content: `Successfully retrieved data from ${service}: ${JSON.stringify(integrationResult.data, null, 2)}`,
          metadata: {
            ...systemMessage.metadata,
            integration_result: integrationResult
          }
        };

        setMessages(prev => prev.map(msg => 
          msg.id === systemMessage.id ? updatedMessage : msg
        ));
      }
    } catch (error) {
      toast({
        title: 'Integration Error',
        description: `Failed to connect to ${service}. Please try again.`,
        variant: 'destructive'
      });
    }
  };

  const getStepIcon = (step: IntakeStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'active':
        return <step.icon className="h-4 w-4 text-primary" />;
      default:
        return <step.icon className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStepCardClass = (step: IntakeStep) => {
    switch (step.status) {
      case 'completed':
        return 'border-green-200 bg-green-50';
      case 'active':
        return 'border-primary bg-primary/5 ring-2 ring-primary/20';
      default:
        return 'border-muted bg-muted/30';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Initializing journey intake...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full max-w-7xl mx-auto overflow-hidden">
      {/* Left Side - Step Cards */}
      <div className="w-80 border-r bg-muted/20 p-6 space-y-4 overflow-y-auto flex-shrink-0">
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Rocket className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Journey Intake Steps</h2>
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

        {/* Suggested Journey */}
        {suggestedJourney && (
          <div className="pt-4 border-t">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Suggested Journey</h4>
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{suggestedJourney.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {suggestedJourney.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {suggestedJourney.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {confidenceScore}% match
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {suggestedJourney && progress >= 80 && (
          <div className="pt-4 border-t">
            <Button 
              onClick={() => createJourney(suggestedJourney.id)} 
              className="w-full gap-2"
              size="sm"
            >
              <CheckCircle className="h-4 w-4" />
              Start {suggestedJourney.name}
            </Button>
          </div>
        )}
      </div>

      {/* Right Side - Chat Interface */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <MessageSquare className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Journey Intake Chat</h1>
              <p className="text-sm text-muted-foreground">
                Let's find the perfect journey for your business needs
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {onClose && (
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            )}
          </div>
        </div>

        {/* Chat Interface */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <ModernChatInterface
            messages={messages.map(msg => ({
              id: msg.id,
              role: msg.role,
              content: msg.content,
              timestamp: new Date(msg.timestamp)
            }))}
            onSendMessage={handleSendMessage}
            isStreaming={false}
            placeholder="Tell me about your business goals and challenges..."
            showTypingIndicator={false}
            className="h-full"
          />
        </div>

        {/* Quick Questions */}
        {nextQuestions.length > 0 && (
          <div className="p-4 border-t bg-muted/30 flex-shrink-0">
            <div className="max-w-4xl mx-auto">
              <p className="text-sm text-muted-foreground mb-3">Quick questions to help guide you:</p>
              <div className="flex flex-wrap gap-2">
                {nextQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSendMessage(question)}
                    className="text-xs"
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
