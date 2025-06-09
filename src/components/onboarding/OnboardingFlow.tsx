/**
 * OnboardingFlow.tsx
 * Complete onboarding flow for new Nexus users
 * Includes n8n connection setup and configuration
 */
import React, { useState, useEffect } from 'react';
import { CheckCircle, ArrowRight, ArrowLeft, Zap, Settings, Sparkles, Users } from 'lucide-react';
import { N8nConnectionSetup } from './N8nConnectionSetup';
import { n8nOnboardingManager } from '../../lib/n8nOnboardingManager';
import type { OnboardingState, OnboardingStep } from '../../lib/n8nOnboardingManager';
import type { UserN8nConfig } from '../../lib/userN8nConfig';
import { LoadingStates } from '../patterns/LoadingStates';
import { motion } from 'framer-motion';

interface OnboardingFlowProps {
  onComplete: () => void;
  className?: string;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  onComplete,
  className = ''
}) => {
  const [onboardingState, setOnboardingState] = useState<OnboardingState | null>(null);
  const [currentStepId, setCurrentStepId] = useState<string>('welcome');
  const [isLoading, setIsLoading] = useState(true);

  // Load onboarding state
  useEffect(() => {
    const loadState = async () => {
      await n8nOnboardingManager.initialize();
      const state = await n8nOnboardingManager.getOnboardingState();
      setOnboardingState(state);
      
      // Set current step to first incomplete step
      const currentStep = state.steps.find(s => !s.completed);
      if (currentStep) {
        setCurrentStepId(currentStep.id);
      }
      
      setIsLoading(false);
    };

    loadState();

    // Subscribe to state changes
    const unsubscribe = n8nOnboardingManager.subscribe((state) => {
      setOnboardingState(state);
    });

    return unsubscribe;
  }, []);

  const handleStepComplete = async (stepId: string) => {
    await n8nOnboardingManager.completeStep(stepId);
    
    // Move to next step
    if (onboardingState) {
      const currentIndex = onboardingState.steps.findIndex(s => s.id === stepId);
      const nextStep = onboardingState.steps[currentIndex + 1];
      if (nextStep) {
        setCurrentStepId(nextStep.id);
      } else {
        // Onboarding complete
        onComplete();
      }
    }
  };

  const handleN8nComplete = async (config: UserN8nConfig) => {
    const success = await n8nOnboardingManager.completeN8nConfiguration(config);
    if (success) {
      handleStepComplete('n8n-connection');
    }
  };

  const handleN8nSkip = async () => {
    await n8nOnboardingManager.skipN8nConfiguration();
    handleStepComplete('n8n-connection');
  };

  const goToStep = (stepId: string) => {
    setCurrentStepId(stepId);
  };

  if (isLoading || !onboardingState) {
    return (
      <LoadingStates.SetupLoader 
        title="Setting up your onboarding..." 
        subtitle="Preparing your personalized experience"
      />
    );
  }

  const currentStep = onboardingState.steps.find(s => s.id === currentStepId);
  const currentStepIndex = onboardingState.steps.findIndex(s => s.id === currentStepId);

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 ${className}`}>
      <div className="container mx-auto px-4 py-8">
        {/* Progress Header */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground dark:text-primary-foreground mb-2">
              Welcome to Nexus OS
            </h1>
            <p className="text-lg text-muted-foreground dark:text-muted-foreground">
              Let's set up your AI-powered business operating system
            </p>
          </div>

          {/* Step Progress */}
          <div className="flex items-center justify-between mb-8">
            {onboardingState.steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                    step.completed
                      ? 'bg-success border-success text-primary-foreground'
                      : step.id === currentStepId
                      ? 'border-primary text-primary bg-card dark:bg-background'
                      : 'border-border text-muted-foreground/60 bg-card dark:bg-background'
                  }`}
                >
                  {step.completed ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                {index < onboardingState.steps.length - 1 && (
                  <div
                    className={`w-24 h-1 mx-4 transition-colors ${
                      step.completed ? 'bg-success' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="max-w-4xl mx-auto">
          {currentStepId === 'welcome' && (
            <WelcomeStep onComplete={() => handleStepComplete('welcome')} />
          )}

          {currentStepId === 'n8n-connection' && (
            <div className="bg-card dark:bg-background rounded-lg shadow-lg p-8">
              <div className="text-center mb-6">
                <Zap className="h-12 w-12 text-primary mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-foreground dark:text-primary-foreground mb-2">
                  Connect Your n8n Instance
                </h2>
                <p className="text-muted-foreground dark:text-muted-foreground">
                  Optional: Connect your n8n automation platform for advanced workflows
                </p>
              </div>
              <N8nConnectionSetup
                onComplete={(config) => handleN8nComplete({ ...config, userId: 'current-user' })}
                onSkip={handleN8nSkip}
              />
            </div>
          )}

          {currentStepId === 'department-setup' && (
            <DepartmentSetupStep onComplete={() => handleStepComplete('department-setup')} />
          )}

          {currentStepId === 'complete' && (
            <CompleteStep onFinish={onComplete} />
          )}
        </div>

        {/* Navigation */}
        <div className="max-w-4xl mx-auto mt-8 flex justify-between">
          <button
            onClick={() => {
              const prevIndex = Math.max(0, currentStepIndex - 1);
              const prevStep = onboardingState.steps[prevIndex];
              if (prevStep) goToStep(prevStep.id);
            }}
            disabled={currentStepIndex === 0}
            className="flex items-center space-x-2 px-4 py-4 text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Previous</span>
          </button>

          <div className="text-sm text-muted-foreground dark:text-muted-foreground">
            Step {currentStepIndex + 1} of {onboardingState.totalSteps}
          </div>

          <button
            onClick={() => {
              const nextIndex = Math.min(onboardingState.steps.length - 1, currentStepIndex + 1);
              const nextStep = onboardingState.steps[nextIndex];
              if (nextStep) goToStep(nextStep.id);
            }}
            disabled={currentStepIndex === onboardingState.steps.length - 1}
            className="flex items-center space-x-2 px-4 py-4 text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span>Next</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Welcome Step Component - Enhanced with immediate value demonstration
const WelcomeStep: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [currentDemo, setCurrentDemo] = useState(0);
  const [showingMagic, setShowingMagic] = useState(false);

  // Demo scenarios that show immediate value
  const magicMoments = [
    {
      title: "📊 Instant Business Insights",
      description: "AI analyzes your data patterns in real-time",
      visual: "Revenue trending up 23% this month",
      impact: "Save 4 hours weekly on reporting"
    },
    {
      title: "🤖 Smart Automation",
      description: "Workflows that learn and adapt to your business",
      visual: "Auto-generated 47 leads from website",
      impact: "Boost lead conversion by 35%"
    },
    {
      title: "⚡ Team Intelligence",
      description: "Every department gets an AI assistant",
      visual: "Sales AI closed 3 deals while you were away",
      impact: "Increase team productivity by 60%"
    }
  ];

  useEffect(() => {
    if (showingMagic) {
      const interval = setInterval(() => {
        setCurrentDemo((prev) => (prev + 1) % magicMoments.length);
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [showingMagic]);

  return (
    <div className="bg-card dark:bg-background rounded-lg shadow-lg p-8 text-center">
      <div className="relative">
        {/* Magic Demo Animation */}
        {showingMagic && (
          <motion.div
            key={currentDemo}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border-2 border-purple-200 dark:border-purple-700/50"
          >
            <div className="text-2xl mb-2">{magicMoments[currentDemo].title}</div>
            <div className="text-lg text-muted-foreground mb-3">
              {magicMoments[currentDemo].description}
            </div>
            <div className="text-xl font-bold text-purple-600 dark:text-purple-400 mb-2">
              {magicMoments[currentDemo].visual}
            </div>
            <div className="text-sm text-green-600 dark:text-green-400 font-medium">
              ✨ {magicMoments[currentDemo].impact}
            </div>
          </motion.div>
        )}

        <Sparkles className="h-16 w-16 text-primary mx-auto mb-6" />
        <h2 className="text-3xl font-bold text-foreground dark:text-primary-foreground mb-4">
          Welcome to Nexus OS
        </h2>
        <p className="text-lg text-muted-foreground dark:text-muted-foreground mb-8 max-w-2xl mx-auto">
          The AI Business Operating System that delivers <strong>immediate results</strong> for companies like yours.
        </p>

        {/* Instant Value Promise */}
        <div className="mb-8 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700/50">
          <div className="text-green-800 dark:text-green-200 font-bold text-lg">
            🎯 What You'll Achieve in the Next 5 Minutes:
          </div>
          <div className="text-green-700 dark:text-green-300 text-sm mt-2 space-y-1">
            <div>✅ Connect your business data instantly</div>
            <div>✅ See real-time insights from day one</div>
            <div>✅ Setup AI assistants for every department</div>
            <div>✅ Automate your first business process</div>
          </div>
        </div>

        {/* Demo buttons */}
        <div className="flex justify-center space-x-4 mb-8">
          <button
            onClick={() => setShowingMagic(!showingMagic)}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
          >
            {showingMagic ? 'Hide Preview' : '✨ See The Magic'}
          </button>
          <button
            onClick={onComplete}
            className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-colors flex items-center"
          >
            Start Setup <ArrowRight className="ml-2 h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Feature highlights with business impact */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="p-4">
          <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Zap className="h-6 w-6 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground dark:text-primary-foreground mb-2">AI That Actually Works</h3>
          <p className="text-sm text-muted-foreground dark:text-muted-foreground">
            No training needed. Immediate insights from day one.
          </p>
          <div className="text-xs text-green-600 dark:text-green-400 font-medium mt-1">
            ROI in first week
          </div>
        </div>
        
        <div className="p-4">
          <div className="h-12 w-12 bg-success/10 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Settings className="h-6 w-6 text-success" />
          </div>
          <h3 className="font-semibold text-foreground dark:text-primary-foreground mb-2">Zero-Config Automation</h3>
          <p className="text-sm text-muted-foreground dark:text-muted-foreground">
            Smart workflows that set themselves up automatically
          </p>
          <div className="text-xs text-green-600 dark:text-green-400 font-medium mt-1">
            Save 20+ hours/week
          </div>
        </div>
        
        <div className="p-4">
          <div className="h-12 w-12 bg-warning/10 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Users className="h-6 w-6 text-warning" />
          </div>
          <h3 className="font-semibold text-foreground dark:text-primary-foreground mb-2">Enterprise Ready</h3>
          <p className="text-sm text-muted-foreground dark:text-muted-foreground">
            Scales from startup to enterprise seamlessly
          </p>
          <div className="text-xs text-green-600 dark:text-green-400 font-medium mt-1">
            Built for growth
          </div>
        </div>
      </div>

      {/* Trust indicators */}
      <div className="border-t pt-6">
        <div className="text-xs text-muted-foreground mb-2">Trusted by teams at:</div>
        <div className="flex justify-center items-center space-x-6 text-sm text-muted-foreground">
          <span className="font-medium">Tech Startups</span>
          <span className="font-medium">Fortune 500s</span>
          <span className="font-medium">Remote Teams</span>
        </div>
      </div>
    </div>
  );
};

// Department Setup Step Component
const DepartmentSetupStep: React.FC<{ onComplete: () => void }> = ({ onComplete }) => (
  <div className="bg-card dark:bg-background rounded-lg shadow-lg p-8">
    <div className="text-center mb-6">
      <Settings className="h-12 w-12 text-secondary mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-foreground dark:text-primary-foreground mb-2">
        Configure Your Departments
      </h2>
      <p className="text-muted-foreground dark:text-muted-foreground">
        Set up the departments that matter to your business
      </p>
    </div>
    
    <div className="grid md:grid-cols-2 gap-4 mb-8">
      {['Sales', 'Finance', 'Operations', 'Marketing'].map((dept) => (
        <div key={dept} className="flex items-center p-4 border border-border dark:border-border rounded-lg">
          <CheckCircle className="h-5 w-5 text-success mr-3" />
          <span className="text-foreground dark:text-primary-foreground font-medium">{dept}</span>
        </div>
      ))}
    </div>
    
    <div className="text-center">
      <button
        onClick={onComplete}
        className="px-8 py-4 bg-secondary hover:bg-secondary/90 text-primary-foreground font-medium rounded-lg transition-colors"
      >
        Continue
      </button>
    </div>
  </div>
);

// Complete Step Component - Enhanced with success metrics
const CompleteStep: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
  const [celebrationPhase, setCelebrationPhase] = useState(0);

  useEffect(() => {
    const phases = [0, 1, 2];
    let currentPhase = 0;
    const interval = setInterval(() => {
      currentPhase = (currentPhase + 1) % phases.length;
      setCelebrationPhase(currentPhase);
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-card dark:bg-background rounded-lg shadow-lg p-8 text-center"
    >
      <motion.div
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-6xl mb-6"
      >
        🎉
      </motion.div>

      <h2 className="text-3xl font-bold text-foreground dark:text-primary-foreground mb-4">
        You're All Set! 🚀
      </h2>

      <div className="mb-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl">
        <div className="text-lg font-semibold text-foreground mb-4">
          Your Nexus OS is configured and ready to deliver results:
        </div>
        
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="text-left">
            <div className="font-medium text-green-600 dark:text-green-400 mb-2">✅ Immediate Benefits:</div>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Real-time business analytics</li>
              <li>• AI assistants for every team</li>
              <li>• Automated workflow triggers</li>
              <li>• Smart integrations active</li>
            </ul>
          </div>
          <div className="text-left">
            <div className="font-medium text-blue-600 dark:text-blue-400 mb-2">🎯 Next 24 Hours:</div>
            <ul className="space-y-1 text-muted-foreground">
              <li>• AI learns your business patterns</li>
              <li>• First automated actions execute</li>
              <li>• Performance insights generate</li>
              <li>• ROI tracking begins</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <button
          onClick={onFinish}
          className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-200"
        >
          Launch Nexus OS ✨
        </button>
      </div>

      <div className="text-sm text-muted-foreground">
        💡 <strong>Pro Tip:</strong> Check your dashboard in 10 minutes to see your first AI-generated insights
      </div>
    </motion.div>
  );
};

export default OnboardingFlow; 