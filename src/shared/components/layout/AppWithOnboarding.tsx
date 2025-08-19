import React, { useState } from 'react';
import { useAuth } from '@/hooks';
import { logger } from '@/shared/utils/logger';
import { WelcomeStep } from '@/shared/components/onboarding/WelcomeStep';
import { FIREConceptsIntroductionStep } from '@/shared/components/onboarding/FIREConceptsIntroductionStep';
import { LaunchAndFirstStepsStep } from '@/shared/components/onboarding/LaunchAndFirstStepsStep';

interface AppWithOnboardingProps {
  children: React.ReactNode;
}

interface OnboardingStepProps {
  onNext: (data: Record<string, unknown>) => void;
  onSkip: (data?: Record<string, unknown>) => void;
  onBack?: () => void;
  data: Record<string, unknown>;
  currentStep: number;
  totalSteps: number;
  user?: Record<string, unknown>;
}

// Main AppWithOnboarding Component
export const AppWithOnboarding: React.FC<AppWithOnboardingProps> = ({ children }) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState<Record<string, unknown>>({});

  const steps = [
    { 
      id: 'welcome', 
      component: WelcomeStep, 
      title: 'Profile & Knowledge Setup',
      description: 'Establish your foundation in our AI system',
      estimatedDuration: '5-8 minutes'
    },
    { 
      id: 'fire-concepts', 
      component: FIREConceptsIntroductionStep, 
      title: 'FIRE Concepts',
      description: 'AI generates personalized opportunities based on your profile',
      estimatedDuration: '3-5 minutes'
    },
    { 
      id: 'launch', 
      component: LaunchAndFirstStepsStep, 
      title: 'Launch & First Steps',
      description: 'Start using Nexus with your personalized dashboard',
      estimatedDuration: '2-3 minutes'
    }
  ];

  const handleNext = (data: Record<string, unknown>) => {
    logger.info('Onboarding step completed', { 
      step: steps[currentStep].id, 
      data: Object.keys(data) 
    });
    setOnboardingData(prev => ({ ...prev, ...data }));
    setCurrentStep(prev => prev + 1);
  };

  const handleSkip = (data?: Record<string, unknown>) => {
    logger.info('Onboarding step skipped', { 
      step: steps[currentStep].id 
    });
    if (data) {
      setOnboardingData(prev => ({ ...prev, ...data }));
    }
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  // If onboarding is complete, show the main app
  if (currentStep >= steps.length) {
    logger.info('Onboarding completed', { 
      totalSteps: steps.length, 
      finalData: Object.keys(onboardingData) 
    });
    return <>{children}</>;
  }

  const CurrentStepComponent = steps[currentStep].component;
  const stepProps = {
    onNext: handleNext,
    onSkip: handleSkip,
    onBack: currentStep > 0 ? handleBack : undefined,
    data: onboardingData,
    currentStep,
    totalSteps: steps.length,
    user
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Phase Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-primary">
                  {currentStep + 1}
                </span>
              </div>
                             <div>
                 <h2 className="text-sm font-medium text-foreground">
                   {steps[currentStep].title}
                 </h2>
                 <p className="text-xs text-muted-foreground">
                   {steps[currentStep].description} • {steps[currentStep].estimatedDuration}
                 </p>
               </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="flex-1 ml-8">
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>
          
          {/* Back Button */}
          {currentStep > 0 && (
            <button
              onClick={handleBack}
              className="ml-4 p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back
            </button>
          )}
        </div>
      </div>

      <CurrentStepComponent {...stepProps} />
    </div>
  );
};
