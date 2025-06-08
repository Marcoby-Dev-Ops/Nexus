/**
 * OnboardingFlow.tsx
 * Complete onboarding flow for new Nexus users
 * Includes n8n connection setup and configuration
 */
import React, { useState, useEffect } from 'react';
import { CheckCircle, ArrowRight, ArrowLeft, Zap, Settings, Sparkles } from 'lucide-react';
import { N8nConnectionSetup } from './N8nConnectionSetup';
import { n8nOnboardingManager } from '../../lib/n8nOnboardingManager';
import type { OnboardingState, OnboardingStep } from '../../lib/n8nOnboardingManager';
import type { UserN8nConfig } from '../../lib/userN8nConfig';
import { LoadingStates } from '../patterns/LoadingStates';

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

// Welcome Step Component
const WelcomeStep: React.FC<{ onComplete: () => void }> = ({ onComplete }) => (
  <div className="bg-card dark:bg-background rounded-lg shadow-lg p-8 text-center">
    <Sparkles className="h-16 w-16 text-primary mx-auto mb-6" />
    <h2 className="text-3xl font-bold text-foreground dark:text-primary-foreground mb-4">
      Welcome to Nexus OS
    </h2>
    <p className="text-lg text-muted-foreground dark:text-muted-foreground mb-8 max-w-2xl mx-auto">
      Your AI-powered business operating system that brings together sales, finance, operations, and more into one intelligent platform.
    </p>
    
    <div className="grid md:grid-cols-3 gap-6 mb-8">
      <div className="p-4">
        <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
          <Zap className="h-6 w-6 text-primary" />
        </div>
        <h3 className="font-semibold text-foreground dark:text-primary-foreground mb-2">AI Assistants</h3>
        <p className="text-sm text-muted-foreground dark:text-muted-foreground">
          Department-specific AI assistants to help with daily tasks
        </p>
      </div>
      
      <div className="p-4">
        <div className="h-12 w-12 bg-success/10 rounded-lg flex items-center justify-center mx-auto mb-3">
          <Settings className="h-6 w-6 text-success" />
        </div>
        <h3 className="font-semibold text-foreground dark:text-primary-foreground mb-2">Automation</h3>
        <p className="text-sm text-muted-foreground dark:text-muted-foreground">
          Powerful workflow automation with n8n integration
        </p>
      </div>
      
      <div className="p-4">
        <div className="h-12 w-12 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
          <Sparkles className="h-6 w-6 text-secondary" />
        </div>
        <h3 className="font-semibold text-foreground dark:text-primary-foreground mb-2">Analytics</h3>
        <p className="text-sm text-muted-foreground dark:text-muted-foreground">
          Real-time insights and business intelligence
        </p>
      </div>
    </div>
    
    <button
      onClick={onComplete}
      className="px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-colors"
    >
      Get Started
    </button>
  </div>
);

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

// Complete Step Component
const CompleteStep: React.FC<{ onFinish: () => void }> = ({ onFinish }) => (
  <div className="bg-card dark:bg-background rounded-lg shadow-lg p-8 text-center">
    <CheckCircle className="h-16 w-16 text-success mx-auto mb-6" />
    <h2 className="text-3xl font-bold text-foreground dark:text-primary-foreground mb-4">
      You're All Set!
    </h2>
    <p className="text-lg text-muted-foreground dark:text-muted-foreground mb-8">
      Your Nexus workspace is configured and ready to transform your business operations.
    </p>
    
    <button
      onClick={onFinish}
      className="px-8 py-4 bg-success hover:bg-success/90 text-primary-foreground font-medium rounded-lg transition-colors"
    >
      Enter Nexus OS
    </button>
  </div>
);

export default OnboardingFlow; 