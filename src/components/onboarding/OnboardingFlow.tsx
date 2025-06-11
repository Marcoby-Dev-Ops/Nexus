/**
 * OnboardingFlow.tsx
 * Complete onboarding flow for new Nexus users
 * Includes n8n connection setup and configuration
 */
import React, { useState, useEffect } from 'react';
import { CheckCircle, ArrowRight, ArrowLeft, Zap, Settings, Sparkles, Users } from 'lucide-react';
import { N8nConnectionSetup } from './N8nConnectionSetup';
import { OrganizationSetupStep } from './OrganizationSetupStep';
import { UserContextStep } from './UserContextStep';
import { BusinessContextStep } from './BusinessContextStep';
import { SuccessCriteriaStep } from './SuccessCriteriaStep';
import { BusinessSnapshotStep } from './BusinessSnapshotStep';
import { n8nOnboardingManager } from '../../lib/n8nOnboardingManager';
import type { OnboardingState, OnboardingStep } from '../../lib/n8nOnboardingManager';
import type { UserN8nConfig } from '../../lib/userN8nConfig';
import { LoadingStates } from '../patterns/LoadingStates';
import { motion } from 'framer-motion';
import { useEnhancedUser } from '../../lib/contexts/EnhancedUserContext';

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
  const [onboardingData, setOnboardingData] = useState<Record<string, any>>({});

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

  const handleStepComplete = async (stepId: string, data?: Record<string, unknown>): Promise<void> => {
    if (data) {
      setOnboardingData(prev => ({ ...prev, ...data }));
    }

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
      <div className="h-full flex items-center justify-center">
        <LoadingStates.SetupLoader 
          title="Setting up your onboarding..." 
          subtitle="Preparing your personalized experience"
        />
      </div>
    );
  }

  const currentStep = onboardingState.steps.find(s => s.id === currentStepId);
  const currentStepIndex = onboardingState.steps.findIndex(s => s.id === currentStepId);

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 ${className}`}>
      {/* Centered Onboarding Container */}
      <div className="w-full max-w-4xl bg-background rounded-xl shadow-2xl border border-border">
        {/* Scrollable Content Container */}
        <div className="max-h-[90vh] overflow-y-auto">
          <div className="px-6 py-6 lg:px-8 lg:py-8">
            {/* Progress Header */}
            <div className="mb-6">
              <div className="text-center mb-6">
                <h1 className="text-xl lg:text-2xl font-bold text-foreground dark:text-primary-foreground mb-1">
                  Welcome to Nexus OS
                </h1>
                <p className="text-sm lg:text-base text-muted-foreground dark:text-muted-foreground">
                  Let's set up your AI-powered business operating system
                </p>
              </div>

              {/* Step Progress - Responsive */}
              <div className="hidden md:flex items-center justify-between mb-6">
                {onboardingState.steps.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <div
                      className={`flex items-center justify-center w-7 h-7 lg:w-8 lg:h-8 rounded-full border-2 transition-colors ${
                        step.completed
                          ? 'bg-success border-success text-primary-foreground'
                          : step.id === currentStepId
                          ? 'border-primary text-primary bg-card dark:bg-background'
                          : 'border-border text-muted-foreground/60 bg-card dark:bg-background'
                      }`}
                    >
                      {step.completed ? (
                        <CheckCircle className="h-3 w-3 lg:h-4 lg:w-4" />
                      ) : (
                        <span className="text-xs font-medium">{index + 1}</span>
                      )}
                    </div>
                    {index < onboardingState.steps.length - 1 && (
                      <div
                        className={`w-8 lg:w-12 h-1 mx-2 lg:mx-3 transition-colors ${
                          step.completed ? 'bg-success' : 'bg-muted'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Mobile Progress Indicator */}
              <div className="md:hidden mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">
                    Step {currentStepIndex + 1} of {onboardingState.steps.length}
                  </span>
                  <span className="text-xs font-medium text-primary">
                    {Math.round(((currentStepIndex + 1) / onboardingState.steps.length) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-muted h-1.5 rounded-full">
                  <div 
                    className="bg-success h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${((currentStepIndex + 1) / onboardingState.steps.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Step Content */}
            <div className="mb-6">
              {currentStepId === 'welcome' && (
                <WelcomeStep onComplete={() => handleStepComplete('welcome')} />
              )}

              {currentStepId === 'organization-setup' && (
                <div className="bg-card dark:bg-background rounded-lg shadow-lg p-4 lg:p-6">
                  <OrganizationSetupStep 
                    onNext={(data) => handleStepComplete('organization-setup', { enriched: data.enriched_data })}
                    onBack={() => goToStep('welcome')}
                  />
                </div>
              )}

              {currentStepId === 'user-context' && (
                <div className="bg-card dark:bg-background rounded-lg shadow-lg p-4 lg:p-6">
                  <UserContextStep 
                    onNext={() => handleStepComplete('user-context')}
                    onBack={() => goToStep('organization-setup')}
                  />
                </div>
              )}

              {currentStepId === 'business-context' && (
                <div className="bg-card dark:bg-background rounded-lg shadow-lg p-4 lg:p-6">
                  <BusinessContextStep 
                    onNext={(data) => handleStepComplete('business-context', data)}
                    onBack={() => goToStep('user-context')}
                    enrichedData={onboardingData.enriched}
                  />
                </div>
              )}

              {currentStepId === 'business-snapshot' && (
                <div className="bg-card dark:bg-background rounded-lg shadow-lg p-4 lg:p-6">
                  <BusinessSnapshotStep
                    onNext={(data) => handleStepComplete('business-snapshot', { baseline: data })}
                    onBack={() => goToStep('business-context')}
                  />
                </div>
              )}

              {currentStepId === 'success-criteria' && (
                <div className="bg-card dark:bg-background rounded-lg shadow-lg p-4 lg:p-6">
                  <SuccessCriteriaStep 
                    onNext={() => handleStepComplete('success-criteria')}
                    onBack={() => goToStep('business-context')}
                  />
                </div>
              )}

              {currentStepId === 'n8n-connection' && (
                <div className="bg-card dark:bg-background rounded-lg shadow-lg p-4 lg:p-6">
                  <div className="text-center mb-6">
                    <Zap className="h-8 w-8 lg:h-12 lg:w-12 text-primary mx-auto mb-4" />
                    <h2 className="text-xl lg:text-2xl font-bold text-foreground dark:text-primary-foreground mb-2">
                      Connect Your n8n Instance
                    </h2>
                    <p className="text-sm lg:text-base text-muted-foreground dark:text-muted-foreground">
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
            <div className="flex justify-between items-center border-t border-border pt-4">
              <button
                onClick={() => {
                  const prevIndex = Math.max(0, currentStepIndex - 1);
                  const prevStep = onboardingState.steps[prevIndex];
                  if (prevStep) goToStep(prevStep.id);
                }}
                disabled={currentStepIndex === 0}
                className="flex items-center space-x-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowLeft className="h-3 w-3" />
                <span>Previous</span>
              </button>

              <div className="text-xs text-muted-foreground dark:text-muted-foreground">
                Step {currentStepIndex + 1} of {onboardingState.totalSteps}
              </div>

              <button
                onClick={() => {
                  const nextIndex = Math.min(onboardingState.steps.length - 1, currentStepIndex + 1);
                  const nextStep = onboardingState.steps[nextIndex];
                  if (nextStep) goToStep(nextStep.id);
                }}
                disabled={currentStepIndex === onboardingState.steps.length - 1}
                className="flex items-center space-x-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span>Next</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Welcome Step Component - Simplified
const WelcomeStep: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const { profile } = useEnhancedUser();

  // Get user's first name or fallback to a generic greeting
  const getPersonalizedGreeting = () => {
    const firstName = profile?.first_name;
    if (firstName) {
      return `Hi ${firstName}! Let's Build Your AI-Powered Business`;
    }
    return "Let's Build Your AI-Powered Business";
  };

  const getPersonalizedSubtitle = () => {
    const firstName = profile?.first_name;
    if (firstName) {
      return `${firstName}, you've just unlocked the most powerful business operating system. We'll customize it specifically for your needs and goals.`;
    }
    return "You've just unlocked the most powerful business operating system. We'll customize it specifically for your needs and goals.";
  };

  return (
    <div className="text-center">
      <div className="relative">
        <Sparkles className="h-10 w-10 lg:h-12 lg:w-12 text-primary mx-auto mb-3" />
        <h2 className="text-xl lg:text-2xl font-bold text-foreground dark:text-primary-foreground mb-2">
          {getPersonalizedGreeting()}
        </h2>
        <p className="text-sm lg:text-base text-muted-foreground dark:text-muted-foreground mb-4 max-w-xl mx-auto">
          {getPersonalizedSubtitle()}
        </p>

        {/* Setup Promise - Focused on onboarding */}
        <div className="mb-6 p-4 bg-primary/5 dark:bg-blue-900/20 rounded-lg border border-border dark:border-blue-700/50">
          <div className="text-primary dark:text-blue-200 font-semibold text-sm lg:text-base mb-2">
            🚀 Quick Setup Process (5 minutes)
          </div>
          <div className="text-primary dark:text-blue-300 text-xs space-y-1">
            <div>✅ Tell us about your role and goals</div>
            <div>✅ Configure your business context</div>
            <div>✅ Define success metrics</div>
            <div>✅ Connect integrations (optional)</div>
          </div>
        </div>

        {/* Single action button - focused on getting started */}
        <div className="mb-6">
          <button
            onClick={onComplete}
            className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium text-base transition-colors flex items-center justify-center mx-auto"
          >
            Start Setup <ArrowRight className="ml-2 h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Simplified feature highlights - Focus on what's coming */}
      <div className="grid grid-cols-3 gap-2 lg:gap-4 mb-4">
        <div className="p-2">
          <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <h3 className="font-semibold text-xs lg:text-sm text-foreground dark:text-primary-foreground mb-1">AI Assistant</h3>
          <p className="text-xs text-muted-foreground dark:text-muted-foreground">
            Personalized for your role
          </p>
        </div>
        
        <div className="p-2">
          <div className="h-8 w-8 bg-success/10 rounded-lg flex items-center justify-center mx-auto mb-2">
            <Settings className="h-4 w-4 text-success" />
          </div>
          <h3 className="font-semibold text-xs lg:text-sm text-foreground dark:text-primary-foreground mb-1">Smart Setup</h3>
          <p className="text-xs text-muted-foreground dark:text-muted-foreground">
            Auto-configured workflows
          </p>
        </div>
        
        <div className="p-2">
          <div className="h-8 w-8 bg-warning/10 rounded-lg flex items-center justify-center mx-auto mb-2">
            <Users className="h-4 w-4 text-warning" />
          </div>
          <h3 className="font-semibold text-xs lg:text-sm text-foreground dark:text-primary-foreground mb-1">Team Ready</h3>
          <p className="text-xs text-muted-foreground dark:text-muted-foreground">
            Invite team later
          </p>
        </div>
      </div>

      {/* Simple progress indicator */}
      <div className="border-t pt-3">
        <div className="text-xs text-muted-foreground">
          We'll have you up and running in just a few minutes
        </div>
      </div>
    </div>
  );
};

// Department Setup Step Component
const DepartmentSetupStep: React.FC<{ onComplete: () => void }> = ({ onComplete }) => (
  <div className="text-center">
    <div className="mb-6">
      <Settings className="h-8 w-8 lg:h-12 lg:w-12 text-secondary mx-auto mb-4" />
      <h2 className="text-xl lg:text-2xl font-bold text-foreground dark:text-primary-foreground mb-2">
        Configure Your Departments
      </h2>
      <p className="text-sm lg:text-base text-muted-foreground dark:text-muted-foreground">
        Set up the departments that matter to your business
      </p>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
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
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center"
    >
      <motion.div
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-4xl lg:text-6xl mb-6"
      >
        🚀
      </motion.div>

      <h2 className="text-2xl lg:text-3xl font-bold text-foreground dark:text-primary-foreground mb-4">
        You're Ready to Transform Your Business!
      </h2>

      <div className="mb-8 p-4 lg:p-6 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl">
        <div className="text-base lg:text-lg font-semibold text-foreground mb-4">
          Your AI Assistant is already working:
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="text-left">
            <div className="font-medium text-success dark:text-success mb-2">✅ Immediate Actions:</div>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Analyzing your business patterns</li>
              <li>• Setting up automated workflows</li>
              <li>• Preparing your first insights</li>
              <li>• Optimizing your processes</li>
            </ul>
          </div>
          <div className="text-left">
            <div className="font-medium text-primary dark:text-primary mb-2">Next Steps:</div>
            <ul className="space-y-1 text-muted-foreground">
              <li>• View your personalized dashboard</li>
              <li>• Connect your business tools</li>
              <li>• Review initial insights</li>
              <li>• Start your first automation</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <button
          onClick={onFinish}
          className="px-6 lg:px-8 py-3 lg:py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-primary-foreground rounded-lg font-bold text-base lg:text-lg shadow-lg hover:shadow-xl transition-all duration-200"
        >
          Launch Your Dashboard →
        </button>
      </div>

      <div className="text-sm text-muted-foreground">
        💡 <strong>Pro Tip:</strong> Your first insights will be ready in 5 minutes
      </div>
    </motion.div>
  );
};

export default OnboardingFlow; 