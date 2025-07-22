/**
 * UnifiedBrainOnboarding.tsx
 * Vision-Aligned Onboarding Flow
 * Transforms novices into business experts through the Unified Business Brain
 * Now includes personalized user context and progressive intelligence
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Target, 
  TrendingUp, 
  Zap, 
  ArrowRight,
  Building2,
  Users,
  BarChart3,
  Lightbulb,
  Rocket,
  User
} from 'lucide-react';

import { useAuthContext } from '@/domains/admin/user/hooks/AuthContext';
import { Button } from '@/shared/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { BusinessContextCollector } from './brain/BusinessContextCollector';
import { GoalSettingWithExpert } from './brain/GoalSettingWithExpert';
import { DepartmentIntelligenceSetup } from './brain/DepartmentIntelligenceSetup';
import { LiveBrainAnalysis } from './brain/LiveBrainAnalysis';
import { TransformationPreview } from './brain/TransformationPreview';
import { brainOnboardingService, type BrainOnboardingSession } from '../services/brainOnboardingService';
import { ProfileConfirmationStep } from './ProfileConfirmationStep';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  component: React.ComponentType<any>;
  duration: number; // estimated minutes
  brainIntegration: 'action-analysis' | 'expert-guidance' | 'progressive-learning' | 'confidence-building';
}

interface BrainOnboardingState {
  currentStep: number;
  completedSteps: string[];
  userProfile: UserBusinessProfile;
  brainAnalysis: BrainAnalysisData;
  learningProgression: LearningProgression;
  confidenceMetrics: ConfidenceMetrics;
  systemIntelligence: SystemIntelligence;
}

interface UserBusinessProfile {
  company: {
    name: string;
    industry: string;
    size: string;
    description: string;
    challenges: string[];
  };
  user: {
    role: string;
    experience: string;
    responsibilities: string[];
    goals: string[];
  };
  business: {
    currentMetrics: Record<string, number>;
    targetMetrics: Record<string, number>;
    timeframes: Record<string, string>;
  };
}

interface BrainAnalysisData {
  actionAnalysis: {
    totalActions: number;
    analyzedActions: number;
    businessContextScore: number;
    expertInsightsGenerated: number;
  };
  expertKnowledge: {
    domainsAccessed: string[];
    principlesApplied: string[];
    realWorldExamples: string[];
  };
  progressiveLearning: {
    currentLevel: 'novice' | 'intermediate' | 'expert';
    skillAreas: string[];
    learningVelocity: number;
    nextMilestones: string[];
  };
}

interface SystemIntelligence {
  understandingLevel: number; // 0-100
  personalizedInsights: number;
  contextAccuracy: number;
  recommendationRelevance: number;
  learningProgress: number;
  lastUpdated: Date;
}

interface LearningProgression {
  currentLevel: 'novice' | 'intermediate' | 'expert';
  skillAreas: BusinessSkillArea[];
  confidenceMetrics: ConfidenceScore[];
  nextLearningMilestones: LearningMilestone[];
}

interface ConfidenceMetrics {
  decisionConfidence: number;
  expertBehaviorAdoption: number;
  mistakePrevention: number;
  learningVelocity: number;
}

interface BusinessSkillArea {
  name: string;
  currentLevel: number;
  targetLevel: number;
  progress: number;
}

interface ConfidenceScore {
  area: string;
  score: number;
  trend: 'increasing' | 'stable' | 'decreasing';
}

interface LearningMilestone {
  id: string;
  title: string;
  description: string;
  estimatedTime: string;
  prerequisites: string[];
}

export const UnifiedBrainOnboarding: React.FC<{
  onComplete: () => void;
  className?: string;
}> = ({ onComplete, className = '' }) => {
  const { user } = useAuthContext();
  const [session, setSession] = useState<BrainOnboardingSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [state, setState] = useState<BrainOnboardingState>({
    currentStep: 0,
    completedSteps: [],
    userProfile: {
      company: { name: '', industry: '', size: '', description: '', challenges: [] },
      user: { role: '', experience: '', responsibilities: [], goals: [] },
      business: { currentMetrics: {}, targetMetrics: {}, timeframes: {} }
    },
    brainAnalysis: {
      actionAnalysis: { totalActions: 0, analyzedActions: 0, businessContextScore: 0, expertInsightsGenerated: 0 },
      expertKnowledge: { domainsAccessed: [], principlesApplied: [], realWorldExamples: [] },
      progressiveLearning: { currentLevel: 'novice', skillAreas: [], learningVelocity: 1, nextMilestones: [] }
    },
    learningProgression: {
      currentLevel: 'novice',
      skillAreas: [],
      confidenceMetrics: [],
      nextLearningMilestones: []
    },
    confidenceMetrics: {
      decisionConfidence: 0,
      expertBehaviorAdoption: 0,
      mistakePrevention: 0,
      learningVelocity: 1
    },
    systemIntelligence: {
      understandingLevel: 0,
      personalizedInsights: 0,
      contextAccuracy: 0,
      recommendationRelevance: 0,
      learningProgress: 0,
      lastUpdated: new Date()
    }
  });

  // Initialize brain onboarding session
  useEffect(() => {
    const initializeSession = async () => {
      if (!user?.id) return;
      
      try {
        setIsLoading(true);
        const sessionData = await brainOnboardingService.createOrGetSession(user.id);
        setSession(sessionData);
        
        // Load existing session data if available
        if (sessionData.system_intelligence) {
          setState(prev => ({
            ...prev,
            currentStep: sessionData.current_step || 0,
            completedSteps: sessionData.completed_steps || [],
            userProfile: sessionData.user_profile || prev.userProfile,
            brainAnalysis: sessionData.brain_analysis || prev.brainAnalysis,
            learningProgression: sessionData.learning_progression || prev.learningProgression,
            confidenceMetrics: sessionData.confidence_metrics || prev.confidenceMetrics,
            systemIntelligence: sessionData.system_intelligence || prev.systemIntelligence
          }));
        }
      } catch (error) {
        console.error('Error initializing brain onboarding session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeSession();
  }, [user?.id]);

  // Get user's full name for personalization
  const getUserFullName = () => {
    if (user?.profile?.first_name && user?.profile?.last_name) {
      return `${user.profile.first_name} ${user.profile.last_name}`;
    }
    if (user?.profile?.first_name) return user.profile.first_name;
    if (user?.email) return user.email.split('@')[0];
    return 'there';
  };

  const onboardingSteps: OnboardingStep[] = [
    {
      id: 'profile-confirmation',
      title: 'Confirm Your Profile',
      description: 'Let\'s make sure we have your information correct',
      icon: <User className="w-6 h-6" />,
      component: ProfileConfirmationStep,
      duration: 1,
      brainIntegration: 'action-analysis'
    },
    {
      id: 'brain-introduction',
      title: `Meet Your Business Brain, ${getUserFullName()}!`,
      description: 'Experience how Nexus transforms business operations',
      icon: <Brain className="w-6 h-6" />,
      component: BrainIntroductionStep,
      duration: 2,
      brainIntegration: 'action-analysis'
    },
    {
      id: 'business-context',
      title: 'Your Business Context',
      description: 'Help your brain understand your unique situation',
      icon: <Building2 className="w-6 h-6" />,
      component: BusinessContextStep,
      duration: 3,
      brainIntegration: 'expert-guidance'
    },
    {
      id: 'goal-setting',
      title: 'Define Your Success',
      description: 'Set goals with expert-level business guidance',
      icon: <Target className="w-6 h-6" />,
      component: GoalSettingStep,
      duration: 3,
      brainIntegration: 'progressive-learning'
    },
    {
      id: 'department-setup',
      title: 'Configure Your Business Intelligence',
      description: 'Set up department-specific AI agents and insights',
      icon: <Users className="w-6 h-6" />,
      component: DepartmentSetupStep,
      duration: 2,
      brainIntegration: 'confidence-building'
    },
    {
      id: 'brain-demo',
      title: 'See Your Brain in Action',
      description: 'Experience real-time business intelligence',
      icon: <BarChart3 className="w-6 h-6" />,
      component: BrainDemoStep,
      duration: 2,
      brainIntegration: 'action-analysis'
    },
    {
      id: 'transformation-preview',
      title: 'Your Transformation Journey',
      description: 'See what expert-level business operation looks like',
      icon: <Rocket className="w-6 h-6" />,
      component: TransformationPreviewStep,
      duration: 2,
      brainIntegration: 'progressive-learning'
    }
  ];

  const currentStep = onboardingSteps[state.currentStep];

  const handleStepComplete = async (stepData: Partial<BrainOnboardingState>) => {
    if (!session || !user) return;

    try {
      // Call brain analysis Edge Function for real-time intelligence
      const brainAnalysis = await brainOnboardingService.callBrainAnalysis(
        session.session_id,
        user.id,
        `step_${state.currentStep}`,
        'feedback',
        stepData,
        state.systemIntelligence,
        state.userProfile,
        'feedback'
      );

      // Update state with brain analysis results
      const updatedState = {
        ...state,
        ...stepData,
        systemIntelligence: brainAnalysis.updatedIntelligence || state.systemIntelligence,
        brainAnalysis: {
          ...state.brainAnalysis,
          actionAnalysis: {
            ...state.brainAnalysis.actionAnalysis,
            analyzedActions: state.brainAnalysis.actionAnalysis.analyzedActions + 1,
            expertInsightsGenerated: state.brainAnalysis.actionAnalysis.expertInsightsGenerated + (brainAnalysis.insights?.length || 0)
          }
        }
      };

      setState(updatedState);

      // Save session progress
      await brainOnboardingService.updateSessionProgress(session.session_id, {
        current_step: state.currentStep + 1,
        completed_steps: [...state.completedSteps, `step_${state.currentStep}`],
        system_intelligence: brainAnalysis.updatedIntelligence,
        last_interaction_at: new Date().toISOString()
      });

      // Record FIRE action
      await brainOnboardingService.recordFireAction(session.session_id, {
        action_type: 'feedback',
        step_id: `step_${state.currentStep}`,
        action_data: stepData,
        fire_cycle_phase: 'feedback',
        intelligence_gain: brainAnalysis.intelligenceGain || 0,
        brain_response: brainAnalysis.brainResponse,
        response_confidence: brainAnalysis.brainResponse?.confidence || 0.8
      });

      // Generate insights from brain analysis
      if (brainAnalysis.insights?.length > 0) {
        for (const insight of brainAnalysis.insights) {
          await brainOnboardingService.generateInsight(session.session_id, {
            insight_type: insight.type,
            title: insight.title,
            description: insight.description,
            category: insight.category,
            impact: insight.impact,
            confidence: insight.confidence,
            step_id: `step_${state.currentStep}`,
            brain_integration_type: 'action-analysis'
          });
        }
      }

      // Move to next step
      setState(prev => ({
        ...prev,
        currentStep: prev.currentStep + 1
      }));

    } catch (error) {
      console.error('Error completing step:', error);
      // Continue without brain analysis if it fails
      setState(prev => ({
        ...prev,
        ...stepData,
        currentStep: prev.currentStep + 1
      }));
    }
  };

  const handleComplete = async () => {
    if (!session?.id) return;
    
    try {
      // Complete onboarding in backend
      await brainOnboardingService.completeOnboarding(session.id, {
        finalState: state,
        transformationAnalysis: analyzeTransformation(state),
        completionTimestamp: new Date().toISOString()
      });
      
      // Clear session
      brainOnboardingService.clearCurrentSession();
      
      console.log('Onboarding Complete - Transformation Analysis:', analyzeTransformation(state));
      onComplete();
    } catch (error) {
      console.error('Error completing onboarding:', error);
      onComplete(); // Still complete even if backend fails
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-primary/5 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-foreground/70">Initializing your business brain...</p>
        </div>
      </div>
    );
  }

  if (state.currentStep >= onboardingSteps.length) {
    return <OnboardingComplete onComplete={handleComplete} state={state} user={user} />;
  }

  const StepComponent = currentStep.component;

  return (
    <div className={`min-h-screen bg-gradient-to-br from-background via-muted/30 to-primary/5 ${className}`}>
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <StepComponent
              step={currentStep}
              state={state}
              onComplete={handleStepComplete}
              onBack={() => setState(prev => ({ ...prev, currentStep: Math.max(0, prev.currentStep - 1) }))}
              user={user}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

// Step Components with User Personalization
const BrainIntroductionStep: React.FC<{
  step: OnboardingStep;
  state: BrainOnboardingState;
  onComplete: (data: Partial<BrainOnboardingState>) => void;
  onBack: () => void;
  user: any;
}> = ({ step, state, onComplete, user }) => {
  const getUserFirstName = () => {
    if (user?.profile?.first_name) return user.profile.first_name;
    if (user?.profile?.full_name) return user.profile.full_name.split(' ')[0];
    if (user?.email) return user.email.split('@')[0];
    return 'there';
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-block p-4 bg-primary/10 rounded-full"
        >
          <Brain className="w-12 h-12 text-primary" />
        </motion.div>
        <h2 className="text-3xl font-bold">Welcome, {getUserFirstName()}! 👋</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {step.description}
        </p>
        
        {/* Personalized Welcome Message */}
        <div className="bg-primary/5 rounded-lg p-4 max-w-2xl mx-auto">
          <p className="text-sm text-muted-foreground">
            <strong>Your Brain is Learning:</strong> I'm analyzing your profile and preparing personalized insights. 
            As you provide more information, I'll get smarter and provide more targeted guidance.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-primary" />
              <span>Real-time Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Every action you take is analyzed with business context, providing expert insights instantly.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Lightbulb className="w-5 h-5 text-primary" />
              <span>Expert Knowledge</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Access 20+ years of business expertise across sales, finance, operations, and more.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span>Progressive Learning</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Transform from novice to expert in weeks, not years, with accelerated skill development.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="text-center">
        <Button 
          size="lg" 
          onClick={() => onComplete({
            brainAnalysis: {
              ...state.brainAnalysis,
              actionAnalysis: {
                ...state.brainAnalysis.actionAnalysis,
                totalActions: 1,
                analyzedActions: 1,
                businessContextScore: 85
              }
            }
          })}
        >
          Experience Your Brain
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

const BusinessContextStep: React.FC<{
  step: OnboardingStep;
  state: BrainOnboardingState;
  onComplete: (data: Partial<BrainOnboardingState>) => void;
  onBack: () => void;
  user: any;
}> = ({ step: _step, state, onComplete, onBack: _onBack, user: _user }) => {
  const handleContextUpdated = (context: any) => {
    const updatedIntelligence = {
      ...state.systemIntelligence,
      understandingLevel: Math.min(100, state.systemIntelligence.understandingLevel + 25),
      personalizedInsights: state.systemIntelligence.personalizedInsights + 3,
      contextAccuracy: Math.min(100, state.systemIntelligence.contextAccuracy + 30),
      lastUpdated: new Date()
    };

    onComplete({
      userProfile: { ...state.userProfile, ...context },
      systemIntelligence: updatedIntelligence
    });
  };

  return (
    <BusinessContextCollector
      userProfile={state.userProfile}
      systemIntelligence={state.systemIntelligence}
      onContextUpdated={handleContextUpdated}
    />
  );
};

const GoalSettingStep: React.FC<{
  step: OnboardingStep;
  state: BrainOnboardingState;
  onComplete: (data: Partial<BrainOnboardingState>) => void;
  onBack: () => void;
}> = ({ step: _step, state, onComplete, onBack: _onBack }) => {
  const handleGoalsSet = (_goals: any) => {
    const updatedIntelligence = {
      ...state.systemIntelligence,
      understandingLevel: Math.min(100, state.systemIntelligence.understandingLevel + 20),
      personalizedInsights: state.systemIntelligence.personalizedInsights + 2,
      recommendationRelevance: Math.min(100, state.systemIntelligence.recommendationRelevance + 25),
      lastUpdated: new Date()
    };

    onComplete({
      brainAnalysis: {
        ...state.brainAnalysis,
        expertKnowledge: {
          ...state.brainAnalysis.expertKnowledge,
          domainsAccessed: [...state.brainAnalysis.expertKnowledge.domainsAccessed, 'goal-setting', 'strategy-planning'],
          principlesApplied: [...state.brainAnalysis.expertKnowledge.principlesApplied, 'smart-goal-framework', 'kpi-alignment']
        }
      },
      systemIntelligence: updatedIntelligence
    });
  };

  return (
    <GoalSettingWithExpert
      userProfile={state.userProfile}
      systemIntelligence={state.systemIntelligence}
      onGoalsSet={handleGoalsSet}
    />
  );
};

const DepartmentSetupStep: React.FC<{
  step: OnboardingStep;
  state: BrainOnboardingState;
  onComplete: (data: Partial<BrainOnboardingState>) => void;
  onBack: () => void;
}> = ({ step: _step, state, onComplete, onBack: _onBack }) => {
  const handleDepartmentsConfigured = (_departments: any) => {
    const updatedIntelligence = {
      ...state.systemIntelligence,
      understandingLevel: Math.min(100, state.systemIntelligence.understandingLevel + 15),
      personalizedInsights: state.systemIntelligence.personalizedInsights + 4,
      contextAccuracy: Math.min(100, state.systemIntelligence.contextAccuracy + 20),
      lastUpdated: new Date()
    };

    onComplete({
      brainAnalysis: {
        ...state.brainAnalysis,
        expertKnowledge: {
          ...state.brainAnalysis.expertKnowledge,
          domainsAccessed: [...state.brainAnalysis.expertKnowledge.domainsAccessed, 'department-intelligence', 'operational-excellence'],
          principlesApplied: [...state.brainAnalysis.expertKnowledge.principlesApplied, 'department-optimization', 'cross-functional-alignment']
        }
      },
      systemIntelligence: updatedIntelligence
    });
  };

  return (
    <DepartmentIntelligenceSetup
      userProfile={state.userProfile}
      systemIntelligence={state.systemIntelligence}
      onDepartmentsConfigured={handleDepartmentsConfigured}
    />
  );
};

const BrainDemoStep: React.FC<{
  step: OnboardingStep;
  state: BrainOnboardingState;
  onComplete: (data: Partial<BrainOnboardingState>) => void;
  onBack: () => void;
}> = ({ step: _step, state, onComplete, onBack: _onBack }) => {
  const handleAnalysisComplete = (_analysis: any) => {
    const updatedIntelligence = {
      ...state.systemIntelligence,
      understandingLevel: Math.min(100, state.systemIntelligence.understandingLevel + 30),
      personalizedInsights: state.systemIntelligence.personalizedInsights + 8,
      recommendationRelevance: Math.min(100, state.systemIntelligence.recommendationRelevance + 35),
      lastUpdated: new Date()
    };

    onComplete({
      brainAnalysis: {
        ...state.brainAnalysis,
        actionAnalysis: {
          ...state.brainAnalysis.actionAnalysis,
          analyzedActions: 15,
          expertInsightsGenerated: 12
        }
      },
      systemIntelligence: updatedIntelligence
    });
  };

  return (
    <LiveBrainAnalysis
      userProfile={state.userProfile}
      systemIntelligence={state.systemIntelligence}
      onAnalysisComplete={handleAnalysisComplete}
    />
  );
};

const TransformationPreviewStep: React.FC<{
  step: OnboardingStep;
  state: BrainOnboardingState;
  onComplete: (data: Partial<BrainOnboardingState>) => void;
  onBack: () => void;
}> = ({ step: _step, state, onComplete, onBack: _onBack }) => {
  const handleTransformationComplete = (_transformation: any) => {
    const updatedIntelligence = {
      ...state.systemIntelligence,
      understandingLevel: Math.min(100, state.systemIntelligence.understandingLevel + 25),
      personalizedInsights: state.systemIntelligence.personalizedInsights + 5,
      learningProgress: Math.min(100, state.systemIntelligence.learningProgress + 40),
      lastUpdated: new Date()
    };

    onComplete({
      confidenceMetrics: {
        ...state.confidenceMetrics,
        decisionConfidence: 90,
        expertBehaviorAdoption: 85,
        mistakePrevention: 80
      },
      systemIntelligence: updatedIntelligence
    });
  };

  return (
    <TransformationPreview
      userProfile={state.userProfile}
      systemIntelligence={state.systemIntelligence}
      onTransformationComplete={handleTransformationComplete}
    />
  );
};

const OnboardingComplete: React.FC<{
  onComplete: () => void;
  state: BrainOnboardingState;
  user: any;
}> = ({ onComplete, state, user }) => {
  const getUserFirstName = () => {
    if (user?.profile?.first_name) return user.profile.first_name;
    if (user?.profile?.full_name) return user.profile.full_name.split(' ')[0];
    if (user?.email) return user.email.split('@')[0];
    return 'there';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-primary/5">
      <Card className="max-w-2xl mx-auto text-center">
        <CardHeader>
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-block p-4 bg-primary/10 rounded-full mx-auto mb-4"
          >
            <Brain className="w-12 h-12 text-primary" />
          </motion.div>
          <CardTitle className="text-3xl">Welcome to Your Business Brain, {getUserFirstName()}!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-lg text-muted-foreground">
            Your Nexus Business Brain is now active and ready to transform your business operations.
          </p>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center p-3 bg-primary/5 rounded-lg">
              <div className="text-2xl font-bold text-primary">{state.confidenceMetrics.decisionConfidence}%</div>
              <div className="text-muted-foreground">Decision Confidence</div>
            </div>
            <div className="text-center p-3 bg-primary/5 rounded-lg">
              <div className="text-2xl font-bold text-primary">{state.confidenceMetrics.expertBehaviorAdoption}%</div>
              <div className="text-muted-foreground">Expert Behavior</div>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-semibold mb-2">System Intelligence Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Understanding Level:</span>
                <span className="font-medium">{Math.round(state.systemIntelligence.understandingLevel)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Personalized Insights:</span>
                <span className="font-medium">{Math.round(state.systemIntelligence.personalizedInsights)}</span>
              </div>
              <div className="flex justify-between">
                <span>Context Accuracy:</span>
                <span className="font-medium">{Math.round(state.systemIntelligence.contextAccuracy)}%</span>
              </div>
            </div>
          </div>

          <Button size="lg" onClick={onComplete}>
            Enter Your Dashboard
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

// Helper function to analyze transformation
const analyzeTransformation = (state: BrainOnboardingState) => {
  return {
    userTransformation: {
      confidenceIncrease: state.confidenceMetrics.decisionConfidence,
      expertBehaviorAdoption: state.confidenceMetrics.expertBehaviorAdoption,
      learningVelocity: state.confidenceMetrics.learningVelocity
    },
    businessImpact: {
      brainAnalysis: state.brainAnalysis.actionAnalysis,
      expertKnowledge: state.brainAnalysis.expertKnowledge,
      progressiveLearning: state.brainAnalysis.progressiveLearning
    },
    systemIntelligence: {
      understandingLevel: state.systemIntelligence.understandingLevel,
      personalizedInsights: state.systemIntelligence.personalizedInsights,
      contextAccuracy: state.systemIntelligence.contextAccuracy
    },
    successMetrics: {
      onboardingComplete: true,
      brainActivated: true,
      transformationInitiated: true
    }
  };
}; 