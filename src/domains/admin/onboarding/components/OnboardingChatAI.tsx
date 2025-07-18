/**
 * OnboardingChatAI.tsx
 * AI-Powered Executive Assistant Meeting
 * Conversational onboarding with REAL AI instead of predefined responses
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Bot, 
  User, 
  CheckCircle,
  ArrowRight,
  Building2,
  Target,
  TrendingUp,
  Zap
} from 'lucide-react';

// Hooks and Context
import { useAuth } from '@/domains/admin/user/hooks/AuthContext';
import { useOnboardingChatStore } from '@/shared/stores/onboardingChatStore';

// Services
import { chatHistory } from '@/domains/admin/onboarding/services/chatHistoryService';
import { profileService } from '@/domains/admin/onboarding/services/profileService';

// Define a structured user profile for onboarding
export interface UserOnboardingProfile {
  company: {
    name?: string;
    domain?: string;
    industry?: string;
    size?: string;
    description?: string;
  };
  user: {
    role?: string;
    responsibilities?: string;
    experience?: string;
    team?: string;
  };
  goals: {
    businessChallenges?: string;
    shortTerm?: string;
    longTerm?: string;
    successMetrics?: string;
  };
  preferences: {
    communicationStyle?: string;
    toolPreferences?: string;
    workingHours?: string;
  };
  // Tracks which profile sections have been fully completed
  completedSections: {
    company: boolean;
    user: boolean;
    goals: boolean;
    preferences: boolean;
  };
}



interface OnboardingStep {
  id: string;
  title: string;
  icon: React.ReactNode;
  completed: boolean;
  description: string;
  requiredProfileFields: (keyof UserOnboardingProfile['completedSections'])[];
}

export const OnboardingChatAI: React.FC = () => {
  const { user, completeOnboarding } = useAuth();
  const { messages, isTyping, addMessage, setIsTyping } = useOnboardingChatStore();
  
  // UI State
  const [currentStep, setCurrentStep] = useState(0);
  const [userInput, setUserInput] = useState('');
  
  // Structured user profile instead of generic collectedData
  const [userProfile, setUserProfile] = useState<UserOnboardingProfile>({
    company: {},
    user: {},
    goals: {},
    preferences: {},
    completedSections: {
      company: false,
      user: false,
      goals: false,
      preferences: false
    }
  });
  
  // AI Conversation State
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /**
   * Merge incoming updates from the AI into the existing local profile and re-validate completion status.
   */
  const updateUserProfile = (updates: Partial<UserOnboardingProfile>) => {
    setUserProfile((prev) => {
      const merged: UserOnboardingProfile = {
        ...prev,
        company: { ...prev.company, ...updates.company },
        user: { ...prev.user, ...updates.user },
        goals: { ...prev.goals, ...updates.goals },
        preferences: { ...prev.preferences, ...updates.preferences },
        completedSections: { ...prev.completedSections },
      };
      return checkSectionCompletion(merged);
    });
  };

  const onboardingSteps: OnboardingStep[] = [
    { 
      id: 'quick-start', 
      title: 'Quick Start', 
      icon: <Zap className="w-4 h-4" />, 
      completed: false,
      description: 'Let\'s get you set up in 2 minutes',
      requiredProfileFields: []
    },
    { 
      id: 'business-context', 
      title: 'Business Context', 
      icon: <Building2 className="w-4 h-4" />, 
      completed: false,
      description: 'Company, role, and goals',
      requiredProfileFields: ['company', 'user']
    },
    { 
      id: 'success-metrics', 
      title: 'Success Metrics', 
      icon: <Target className="w-4 h-4" />, 
      completed: false,
      description: 'Define your success criteria',
      requiredProfileFields: ['goals']
    },
    { 
      id: 'launch', 
      title: 'Launch', 
      icon: <TrendingUp className="w-4 h-4" />, 
      completed: false,
      description: 'Start achieving your goals',
      requiredProfileFields: ['company', 'user', 'goals']
    }
  ];

  const [steps, setSteps] = useState(onboardingSteps);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check if profile has enough data to consider a section complete (with validation)
  const checkSectionCompletion = (profile: UserOnboardingProfile): UserOnboardingProfile => {
    const updatedCompletedSections = { ...profile.completedSections };
    
    // Company section validation
    const companyName = profile.company.name?.trim() || '';
    const companyIndustry = profile.company.industry?.trim() || '';
    const companyDescription = profile.company.description?.trim() || '';
    const isCompanyValid = companyName.length >= 2 &&
      (companyIndustry.length >= 3 || companyDescription.length >= 10);
    updatedCompletedSections.company = isCompanyValid;
    
    // User section validation
    const userRole = profile.user.role?.trim() || '';
    const userResponsibilities = profile.user.responsibilities?.trim() || '';
    const userExperience = profile.user.experience?.trim() || '';
    const userTeam = profile.user.team?.trim() || '';
    const isUserValid = userRole.length >= 2 &&
      (userResponsibilities.length >= 5 || userExperience.length >= 3 || userTeam.length >= 2);
    updatedCompletedSections.user = isUserValid;
    
    // Goals section validation
    const businessChallenges = profile.goals.businessChallenges?.trim() || '';
    const shortTermGoals = profile.goals.shortTerm?.trim() || '';
    const longTermGoals = profile.goals.longTerm?.trim() || '';
    const successMetrics = profile.goals.successMetrics?.trim() || '';
    const isGoalsValid = businessChallenges.length >= 5 &&
      (shortTermGoals.length >= 5 || longTermGoals.length >= 5 || successMetrics.length >= 5);
    updatedCompletedSections.goals = isGoalsValid;
    
    // Preferences section validation
    const communicationStyle = profile.preferences.communicationStyle?.trim() || '';
    const isPreferencesValid = communicationStyle.length >= 3;
    updatedCompletedSections.preferences = isPreferencesValid;

    return {
      ...profile,
      completedSections: updatedCompletedSections
    };
  };

  // Validate profile when userProfile changes
  useEffect(() => {
    const validatedProfile = checkSectionCompletion(userProfile);
    if (JSON.stringify(validatedProfile) !== JSON.stringify(userProfile)) {
      setUserProfile(validatedProfile);
    }
  }, [userProfile]);

  // Update steps completion when profile sections change
  useEffect(() => {
    setSteps(prevSteps =>
      prevSteps.map(step => ({
        ...step,
        completed:
          step.requiredProfileFields.length === 0 ||
          step.requiredProfileFields.every(field =>
            userProfile.completedSections[field]
          )
      }))
    );
  }, [userProfile.completedSections]);

  // Auto-advance to next incomplete step when steps update
  useEffect(() => {
    const nextIncomplete = steps.findIndex(step => !step.completed);
    if (nextIncomplete !== -1 && nextIncomplete !== currentStep) {
      setCurrentStep(nextIncomplete);
    }
  }, [steps]);

  // Initialize AI conversation
  useEffect(() => {
    const initializeAIConversation = async () => {
      if (!user || isInitialized) return;

      try {
        // Generate session ID
        const newSessionId = `onboarding-${user.id}-${Date.now()}`;

        // Create conversation in database
        const conversation = await chatHistory.createConversation({
          user_id: user.id,
          title: 'Onboarding Chat',
          context: { type: 'onboarding' }
        });

        // Set state synchronously to avoid race conditions
        setSessionId(conversation.id);
        setConversationId(conversation.id);
        setIsInitialized(true);

        // Send initial AI greeting after state is set
        setTimeout(async () => {
          await sendInitialGreeting('temp-conversation-id', newSessionId);
        }, 100);

      } catch (error) {
        console.error('Failed to initialize AI conversation:', error);
        // Fallback to display error message
        addMessage({
          role: 'assistant',
          content: "I'm having trouble connecting right now. Let me try that again...",
          type: 'message'
        });
      }
    };

    initializeAIConversation();
  }, [user?.id]); // Only depend on user.id to prevent re-initialization

  // Update the initial greeting to be more action-oriented and clarify the goal
  const sendInitialGreeting = async (_convId: string, _sessId: string) => {
    if (messages.length > 0) {
      console.log('Initial greeting already sent, skipping...');
      return;
    }

    try {
      setIsTyping(true);

      const greetingContent = `Hi! I'm your AI Executive Assistant. The goal of our conversation is for me to learn about you and your business so I can provide personalized support.

To start, I need just 3 key pieces of information:
1. Your company name and role
2. Your main business
3. How you measure success

What's your company name and what role do you play?`;

      addMessage({
        role: 'assistant',
        content: greetingContent,
        type: 'introduction',
        metadata: {
          step: steps[0]?.id,
          emotion: 'friendly',
          suggestions: [
            '🚀 Start Setup',
            '⏱️ Quick Setup (2 min)',
            '🎯 Skip to Goals'
          ]
        }
      });

    } catch (error) {
      console.error('Error sending initial greeting:', error);
      addMessage({
        role: 'assistant',
        content: "Hi! I'm your AI Executive Assistant. The goal of our conversation is for me to learn about you and your business so I can provide personalized support. What's your company name and role?",
        type: 'introduction'
      });
    } finally {
      setIsTyping(false);
    }
  };

  const sendAIMessage = async (userMessage: string) => {
    // Ensure we have required data
    if (!conversationId || !sessionId || !user) {
      console.error('Missing required data for AI message', { conversationId, sessionId, user: !!user });
      addMessage({
        role: 'assistant',
        content: "I'm still setting up our conversation. Please wait a moment and try again.",
        type: 'message'
      });
      return;
    }

    try {
      setIsTyping(true);

      // Add user message to UI
      addMessage({
        role: 'user',
        content: userMessage,
        type: 'message'
      });

      // Create enhanced context for onboarding
      const currentOnboardingStep = steps[currentStep];
      
      // Format the profile for the AI to understand what we already know
      const profileJson = JSON.stringify(userProfile, null, 2);
      
      const onboardingContext = `
ONBOARDING CONTEXT:
- This is an onboarding conversation with a new user.
- Current step: ${currentStep + 1} of ${steps.length} (${currentOnboardingStep?.title}: ${currentOnboardingStep?.description})
- User name: ${user?.profile?.first_name || 'there'}
- USER PROFILE SO FAR: ${profileJson}
- Goal: Build rapport, learn about their business, and personalize their workspace.

You are Nex, their Executive Assistant with access to real business tools and data. Be warm, professional, and genuinely interested.
Ask thoughtful follow-up questions.

To help me track what you've learned, please include a structured JSON block at the end of your message like this:
\`\`\`json
{
  "extracted_info": {
    "company_name": "Example Corp",
    "company_industry": "Technology",
    "user_role": "CTO",
    // ... any other fields you've extracted
  }
}
\`\`\`
Only include fields that you were able to extract from the user's message.`;

      // Call the new Edge Function directly instead of the removed chat context
      const response = await fetch('/functions/v1/ai_chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `${userMessage}\n\n${onboardingContext}`,
          conversationId,
          metadata: {
            userId: user.id,
            sessionId,
            step: currentOnboardingStep?.id,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('AI service error');
      }

      const data = await response.json();
      const content: string = data.content || '';

      // Extract profile updates from AI response
      const profileUpdates: Partial<UserOnboardingProfile> = {};
      
      // Try to extract JSON from the AI's response
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
      
      if (jsonMatch && jsonMatch[1]) {
        try {
          const extractedData = JSON.parse(jsonMatch[1]);
          
          if (extractedData.extracted_info) {
            const info = extractedData.extracted_info;
            
            // Map the flat response to our structured profile
            if (info.company_name || info.company_industry || info.company_size || info.company_description) {
              profileUpdates.company = {
                name: info.company_name || userProfile.company.name,
                industry: info.company_industry || userProfile.company.industry,
                size: info.company_size || userProfile.company.size,
                description: info.company_description || userProfile.company.description
              };
            }
            
            if (info.user_role || info.user_responsibilities || info.user_experience || info.user_team) {
              profileUpdates.user = {
                role: info.user_role || userProfile.user.role,
                responsibilities: info.user_responsibilities || userProfile.user.responsibilities,
                experience: info.user_experience || userProfile.user.experience,
                team: info.user_team || userProfile.user.team
              };
            }
            
            if (info.business_challenges || info.short_term_goals || info.long_term_goals || info.success_metrics) {
              profileUpdates.goals = {
                businessChallenges: info.business_challenges || userProfile.goals.businessChallenges,
                shortTerm: info.short_term_goals || userProfile.goals.shortTerm,
                longTerm: info.long_term_goals || userProfile.goals.longTerm,
                successMetrics: info.success_metrics || userProfile.goals.successMetrics
              };
            }
            
            if (info.communication_style || info.tool_preferences || info.working_hours) {
              profileUpdates.preferences = {
                communicationStyle: info.communication_style || userProfile.preferences.communicationStyle,
                toolPreferences: info.tool_preferences || userProfile.preferences.toolPreferences,
                workingHours: info.working_hours || userProfile.preferences.workingHours
              };
            }
          }
        } catch (error) {
          console.error('Error parsing extracted JSON data:', error);
        }
      }

      // Remove the JSON block from the displayed message
      const cleanedContent = content.replace(/```json\n[\s\S]*?\n```/, '').trim();

      // Add AI response to UI with any profile updates
      addMessage({
        role: 'assistant',
        content: cleanedContent,
        type: 'message',
        metadata: {
          step: currentOnboardingStep?.id,
          emotion: 'friendly'
        }
      });
      
      // Apply profile updates directly
      if (Object.keys(profileUpdates).length > 0) {
        updateUserProfile(profileUpdates);
      }

      // Check if we should advance to the final step
      if (userProfile.completedSections.company && 
          userProfile.completedSections.user && 
          userProfile.completedSections.goals && 
          userProfile.completedSections.preferences &&
          currentStep < steps.length - 1) {
        // Advance to the final "partnership" step
        setCurrentStep(steps.length - 1);
      }

    } catch (error) {
      console.error('Error sending AI message:', error);
      addMessage({
        role: 'assistant',
        content: "I apologize, but I'm having trouble processing that right now. Could you try again?",
        type: 'message'
      });
    } finally {
      setIsTyping(false);
    }
  };

  // Check if all required sections are complete to finish onboarding
  const checkOnboardingCompletion = () => {
    const allSectionsComplete = 
      userProfile.completedSections.company && 
      userProfile.completedSections.user && 
      userProfile.completedSections.goals && 
      userProfile.completedSections.preferences;
      
    if (allSectionsComplete && currentStep === steps.length - 1) {
      // Send a final message
      addMessage({
        role: 'assistant',
        content: `Thank you for sharing all this information with me! I now have a good understanding of you and your business. I'll use this to personalize your Nexus experience. Let's get started!`,
        type: 'relationship-building',
        metadata: {
          emotion: 'celebratory'
        }
      });
      
      // Persist onboarding profile, then complete
      setTimeout(async () => {
        if (user) {
          try {
            // Save profile to database
            await profileService.upsertOnboardingProfile({
              profile: {
                ...userProfile,
                goals: [
                  userProfile.goals?.businessChallenges,
                  userProfile.goals?.shortTerm,
                  userProfile.goals?.longTerm,
                  userProfile.goals?.successMetrics
                ].filter(Boolean) as string[]
              },
              user_id: user.id
            });
            console.log('Onboarding profile would be saved:', userProfile);
          } catch (error) {
            console.error('Failed to persist onboarding profile:', error);
          } finally {
            completeOnboarding();
          }
        }
      }, 3000);
    }
  };

  // Check for completion whenever profile or step changes
  useEffect(() => {
    checkOnboardingCompletion();
  }, [userProfile, currentStep]);

  const handleSendMessage = async () => {
    if (!userInput.trim() || isTyping) return;
    
    const message = userInput.trim();
    setUserInput('');
    
    await sendAIMessage(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-lg font-medium text-foreground mb-2">Please sign in to continue</div>
          <div className="text-sm text-muted-foreground">You need to be authenticated to meet Nex</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Progress Steps */}
      <div className="border-b border-border bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-4 flex-shrink-0">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-foreground">Meeting Your Executive Assistant</h3>
            <span className="text-xs text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center gap-2 flex-shrink-0">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all ${
                  step.completed 
                    ? 'bg-success/20 text-success border border-success/30'
                    : index === currentStep
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : 'bg-background/60 text-muted-foreground border border-border'
                }`}>
                  {step.completed ? <CheckCircle className="w-3 h-3" /> : step.icon}
                  <span>{step.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <ArrowRight className="w-3 h-3 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 min-h-0">
        <div className="max-w-4xl mx-auto space-y-4">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-4 ${
                  message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.role === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-gradient-to-br from-purple-500 to-blue-500 text-primary-foreground shadow-lg'
                }`}>
                  {message.role === 'user' ? (
                    <User className="w-5 h-5" />
                  ) : (
                    <Bot className="w-5 h-5" />
                  )}
                </div>
                
                <div className={`flex-1 max-w-[80%] ${
                  message.role === 'user' ? 'text-right' : 'text-left'
                }`}>
                  {message.role === 'assistant' && (
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      Nex - Executive Assistant
                    </div>
                  )}
                  
                  <div className={`rounded-xl p-4 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground ml-auto shadow-md'
                      : 'bg-card border border-border shadow-sm'
                  }`}>
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {message.content}
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground mt-2">
                    {message.timestamp.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-4"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-primary-foreground flex items-center justify-center shadow-lg">
                <Bot className="w-5 h-5" />
              </div>
              <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                <div className="text-xs font-medium text-muted-foreground mb-2">
                  Nex is thinking...
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-muted/30 p-4 flex-shrink-0">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message to Nex..."
                disabled={isTyping}
                className="w-full resize-none border border-border rounded-xl px-4 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary min-h-[52px] max-h-32 transition-all"
                rows={1}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!userInput.trim() || isTyping}
              className="px-4 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="text-xs text-muted-foreground mt-2 text-center">
            💡 Having a real conversation with AI-powered Nex
          </div>
        </div>
      </div>
    </div>
  );
}; 