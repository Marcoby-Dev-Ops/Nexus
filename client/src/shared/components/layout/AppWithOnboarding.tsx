import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks';
import { logger } from '@/shared/utils/logger';
import { selectData, updateOne } from '@/lib/api-client';
import { WelcomeStep } from '@/shared/components/onboarding/WelcomeStep';
import FIREConceptsIntroductionStep from '@/shared/components/onboarding/FIREConceptsIntroductionStep';
import { MentalModelsIntroductionStep } from '@/shared/components/onboarding/MentalModelsIntroductionStep';
import { LaunchAndFirstStepsStep } from '@/shared/components/onboarding/LaunchAndFirstStepsStep';
import { useOnboardingService } from '@/shared/hooks/useOnboardingService';
import { useOnboardingProgress } from '@/shared/hooks/useOnboardingProgress';
import { useToast } from '@/shared/components/ui/use-toast';

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

// Local storage keys for backup
const STORAGE_KEYS = {
  ONBOARDING_DATA: 'nexus-onboarding-data',
  CURRENT_STEP: 'nexus-onboarding-current-step',
  LAST_SAVED: 'nexus-onboarding-last-saved'
};

// Main AppWithOnboarding Component
export const AppWithOnboarding: React.FC<AppWithOnboardingProps> = ({ children }) => {
  const { user } = useAuth();
  const { saveStep, isProcessing, error } = useOnboardingService();
  const { fetchProgress, completeStep, getProgressPercentage } = useOnboardingProgress();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState<Record<string, unknown>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRecovering, setIsRecovering] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

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
      id: 'mental-models', 
      component: MentalModelsIntroductionStep, 
      title: 'Mental Models Framework',
      description: 'Discover proven business principles for success',
      estimatedDuration: '4-6 minutes'
    },
    { 
      id: 'launch', 
      component: LaunchAndFirstStepsStep, 
      title: 'Launch & First Steps',
      description: 'Start using Nexus with your personalized dashboard',
      estimatedDuration: '2-3 minutes'
    }
  ];

  // Save to localStorage as backup
  const saveToLocalStorage = useCallback((data: Record<string, unknown>, step: number) => {
    try {
      localStorage.setItem(STORAGE_KEYS.ONBOARDING_DATA, JSON.stringify(data));
      localStorage.setItem(STORAGE_KEYS.CURRENT_STEP, step.toString());
      localStorage.setItem(STORAGE_KEYS.LAST_SAVED, new Date().toISOString());
      setLastSaved(new Date());
    } catch (error) {
      logger.warn('Failed to save to localStorage', { error });
    }
  }, []);

  // Load from localStorage as fallback
  const loadFromLocalStorage = useCallback(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEYS.ONBOARDING_DATA);
      const savedStep = localStorage.getItem(STORAGE_KEYS.CURRENT_STEP);
      const savedTimestamp = localStorage.getItem(STORAGE_KEYS.LAST_SAVED);

      if (savedData && savedStep) {
        const data = JSON.parse(savedData);
        const step = parseInt(savedStep, 10);
        const timestamp = savedTimestamp ? new Date(savedTimestamp) : null;

        logger.info('Loaded from localStorage', { step, dataKeys: Object.keys(data), timestamp });
        return { data, step, timestamp };
      }
    } catch (error) {
      logger.warn('Failed to load from localStorage', { error });
    }
    return null;
  }, []);

  // Load saved progress on component mount
  useEffect(() => {
    const loadSavedProgress = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsRecovering(true);
        logger.info('Loading saved onboarding progress', { userId: user.id });

        // First, check if user profile shows onboarding as completed
        const { data: userProfile, error: profileError } = await selectData(
          'user_profiles',
          'onboarding_completed, onboarding_completed_at',
          { user_id: user.id }
        );

        if (!profileError && userProfile && userProfile.length > 0) {
          const profile = userProfile[0] as { onboarding_completed: boolean; onboarding_completed_at: string };
          if (profile.onboarding_completed === true) {
            logger.info('User profile shows onboarding completed, showing main app', { 
              userId: user.id, 
              onboardingCompleted: profile.onboarding_completed,
              completedAt: profile.onboarding_completed_at
            });
            setCurrentStep(steps.length); // Mark as complete
            setIsLoading(false);
            return;
          }
        }

        // Fetch saved progress from database
        await fetchProgress(user.id);

        // Check if onboarding is already completed based on progress
        const progressPercentage = getProgressPercentage();
        if (progressPercentage >= 100) {
          logger.info('Onboarding already completed based on progress, showing main app');
          setCurrentStep(steps.length); // Mark as complete
          setIsLoading(false);
          return;
        }

        // Load saved step data from database
        const savedSteps = await loadSavedStepData(user.id);
        if (savedSteps) {
          setOnboardingData(savedSteps);
          
          // Determine current step based on completed steps
          const completedStepIds = Object.keys(savedSteps);
          const lastCompletedIndex = steps.findIndex(step => 
            !completedStepIds.includes(step.id)
          );
          
          if (lastCompletedIndex > 0) {
            setCurrentStep(lastCompletedIndex);
            logger.info('Restored onboarding progress from database', { 
              currentStep: lastCompletedIndex, 
              completedSteps: completedStepIds 
            });
          }
        } else {
          // Fallback to localStorage if no database data
          const localData = loadFromLocalStorage();
          if (localData) {
            setOnboardingData(localData.data);
            setCurrentStep(localData.step);
            setLastSaved(localData.timestamp);
            logger.info('Restored onboarding progress from localStorage', { 
              currentStep: localData.step, 
              dataKeys: Object.keys(localData.data) 
            });
          }
        }

        setIsLoading(false);
      } catch (error) {
        logger.error('Failed to load saved progress', { error, userId: user.id });
        
        // Fallback to localStorage on error
        const localData = loadFromLocalStorage();
        if (localData) {
          setOnboardingData(localData.data);
          setCurrentStep(localData.step);
          setLastSaved(localData.timestamp);
          logger.info('Fallback to localStorage due to error', { 
            currentStep: localData.step, 
            dataKeys: Object.keys(localData.data) 
          });
        }
        
        setIsLoading(false);
      } finally {
        setIsRecovering(false);
      }
    };

    loadSavedProgress();
  }, [user?.id, loadFromLocalStorage]);

  // Load saved step data from database
  const loadSavedStepData = async (userId: string): Promise<Record<string, unknown> | null> => {
    try {
      // Use the API client directly to call the server
      const { data: savedSteps, error } = await selectData(
        'user_onboarding_steps',
        'step_id, step_data, completed_at',
        { user_id: userId }
      );

      if (error || !savedSteps) {
        logger.warn('No saved step data found', { userId });
        return null;
      }

      // Combine all step data into a single object
      const combinedData: Record<string, unknown> = {};
      savedSteps.forEach((step: any) => {
        if (step.step_data) {
          Object.assign(combinedData, step.step_data);
        }
      });

      logger.info('Loaded saved step data', { 
        userId, 
        stepCount: savedSteps.length,
        dataKeys: Object.keys(combinedData)
      });

      return combinedData;
    } catch (error) {
      logger.error('Failed to load saved step data', { error, userId });
      return null;
    }
  };

  const handleNext = useCallback(async (data: Record<string, unknown>) => {
    if (!user?.id) {
      logger.error('No user ID available for saving step');
      return;
    }

    const stepId = steps[currentStep].id;
    const isLastStep = currentStep === steps.length - 1;
    
    try {
      logger.info('Saving onboarding step', { 
        stepId, 
        userId: user.id,
        dataKeys: Object.keys(data),
        isLastStep
      });

      // Save step data to database
      const success = await saveStep(stepId, {
        ...data,
        userId: user.id
      });

      if (!success) {
        logger.error('Failed to save step', { stepId, userId: user.id });
        toast({
          title: "Warning",
          description: "Your progress was saved locally but couldn't be synced to the cloud. Don't worry, you can continue.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Progress Saved",
          description: "Your progress has been saved successfully."
        });
      }

      // Mark step as completed in progress tracking
      await completeStep(user.id, stepId);

      // If this is the last step, mark onboarding as completed in user profile
      if (isLastStep) {
        try {
          // First get the user profile to get the internal ID
          const { data: userProfile, error: profileError } = await selectData(
            'user_profiles',
            'id',
            { user_id: user.id }
          );

          if (!profileError && userProfile && userProfile.length > 0) {
            const profileId = (userProfile[0] as { id: string }).id;
            const { error: updateError } = await updateOne(
              'user_profiles',
              profileId,
              {
                onboarding_completed: true,
                onboarding_completed_at: new Date().toISOString()
              }
            );

            if (updateError) {
              logger.error('Failed to mark onboarding as completed in user profile', { 
                error: updateError, 
                userId: user.id 
              });
            } else {
              logger.info('Successfully marked onboarding as completed in user profile', { 
                userId: user.id,
                completedAt: new Date().toISOString()
              });
            }
          } else {
            logger.error('Failed to find user profile for onboarding completion', { 
              error: profileError, 
              userId: user.id 
            });
          }
        } catch (profileError) {
          logger.error('Error updating user profile onboarding status', { 
            error: profileError, 
            userId: user.id 
          });
        }
      }

      // Update local state
      const updatedData = { ...onboardingData, ...data };
      setOnboardingData(updatedData);
      setCurrentStep(prev => prev + 1);

      // Save to localStorage as backup
      saveToLocalStorage(updatedData, currentStep + 1);

      logger.info('Onboarding step completed and saved', { 
        stepId, 
        userId: user.id,
        currentStep: currentStep + 1,
        isLastStep
      });
    } catch (error) {
      logger.error('Error saving onboarding step', { error, stepId, userId: user.id });
      
      // Continue to next step even if save fails
      const updatedData = { ...onboardingData, ...data };
      setOnboardingData(updatedData);
      setCurrentStep(prev => prev + 1);
      
      // Save to localStorage as backup
      saveToLocalStorage(updatedData, currentStep + 1);
      
      toast({
        title: "Progress Saved Locally",
        description: "Your progress has been saved locally. We'll sync to the cloud when possible.",
        variant: "destructive"
      });
    }
  }, [user?.id, currentStep, steps, saveStep, completeStep, onboardingData, saveToLocalStorage]);

  const handleSkip = useCallback(async (data?: Record<string, unknown>) => {
    if (!user?.id) {
      logger.error('No user ID available for skipping step');
      return;
    }

    const stepId = steps[currentStep].id;
    
    try {
      logger.info('Skipping onboarding step', { 
        stepId, 
        userId: user.id 
      });

      // Save skip data if provided
      if (data) {
        const success = await saveStep(stepId, {
          ...data,
          userId: user.id
        });

        if (!success) {
          logger.error('Failed to save skip data', { stepId, userId: user.id });
        }
      }

      // Mark step as completed (even if skipped)
      await completeStep(user.id, stepId);

      // Update local state
      const updatedData = data ? { ...onboardingData, ...data } : onboardingData;
      if (data) {
        setOnboardingData(updatedData);
      }
      setCurrentStep(prev => prev + 1);

      // Save to localStorage as backup
      saveToLocalStorage(updatedData, currentStep + 1);

      logger.info('Onboarding step skipped and saved', { 
        stepId, 
        userId: user.id,
        currentStep: currentStep + 1
      });
    } catch (error) {
      logger.error('Error skipping onboarding step', { error, stepId, userId: user.id });
      
      // Continue to next step even if save fails
      const updatedData = data ? { ...onboardingData, ...data } : onboardingData;
      if (data) {
        setOnboardingData(updatedData);
      }
      setCurrentStep(prev => prev + 1);
      
      // Save to localStorage as backup
      saveToLocalStorage(updatedData, currentStep + 1);
    }
  }, [user?.id, currentStep, steps, saveStep, completeStep, onboardingData, saveToLocalStorage]);

  const handleBack = useCallback(() => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  }, []);

  // Show loading state while recovering progress
  if (isLoading || isRecovering) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">
            {isRecovering ? 'Restoring your progress...' : 'Loading...'}
          </p>
          {lastSaved && (
            <p className="text-xs text-muted-foreground">
              Last saved: {lastSaved.toLocaleString()}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Show error state if there's a critical error
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md mx-auto p-6">
          <div className="text-red-500 text-lg font-semibold">Something went wrong</div>
          <p className="text-muted-foreground">
            We encountered an error while loading your onboarding progress. 
            Please refresh the page to try again.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // If onboarding is complete, show the main app
  if (currentStep >= steps.length) {
    logger.info('Onboarding completed', { 
      totalSteps: steps.length, 
      finalData: Object.keys(onboardingData) 
    });
    
    // Clear localStorage after successful completion
    try {
      localStorage.removeItem(STORAGE_KEYS.ONBOARDING_DATA);
      localStorage.removeItem(STORAGE_KEYS.CURRENT_STEP);
      localStorage.removeItem(STORAGE_KEYS.LAST_SAVED);
    } catch (error) {
      logger.warn('Failed to clear localStorage', { error });
    }
    
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
          
          {/* Save Status Indicator */}
          {lastSaved && (
            <div className="ml-4 text-xs text-muted-foreground">
              Saved {lastSaved.toLocaleTimeString()}
            </div>
          )}
          
          {/* Back Button */}
          {currentStep > 0 && (
            <button
              onClick={handleBack}
              className="ml-4 p-2 text-muted-foreground hover:text-foreground transition-colors"
              disabled={isProcessing}
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
