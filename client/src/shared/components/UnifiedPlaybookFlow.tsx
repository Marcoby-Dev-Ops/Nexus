/**
 * Unified Playbook Flow Component
 * 
 * Single component for all playbook functionality:
 * - Playbook templates (blueprints)
 * - User journeys (active instances)
 * - Onboarding (specialized playbook type)
 * 
 * Replaces: OnboardingFlow, JourneyFlow, PlaybookViewer, etc.
 */

import React from 'react';
import { useUnifiedPlaybook } from '@/shared/hooks/useUnifiedPlaybook';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Progress } from '@/shared/components/ui/Progress';
import { Badge } from '@/shared/components/ui/Badge';
import { Icon } from '@/shared/components/ui/Icon';
import { logger } from '@/shared/utils/logger';

// ============================================================================
// TYPES
// ============================================================================

interface PlaybookStep {
  id: string;
  title: string;
  description?: string;
  type: string;
  required?: boolean;
  [key: string]: unknown;
}

interface PlaybookJourney {
  id: string;
  playbookId: string;
  status: string;
  currentStep?: number;
  completedSteps: string[];
  data: Record<string, unknown>;
  [key: string]: unknown;
}

interface StepResponse {
  [key: string]: unknown;
}

export interface UnifiedPlaybookFlowProps {
  // Core props
  playbookId: string;
  autoStart?: boolean;
  
  // Callbacks
  onStepComplete?: (stepId: string, response: StepResponse) => void;
  onComplete?: (journey: PlaybookJourney) => void;
  onError?: (error: string) => void;
  onPause?: () => void;
  onResume?: () => void;
  
  // UI customization
  showProgress?: boolean;
  showNavigation?: boolean;
  showPauseResume?: boolean;
  className?: string;
  
  // Step rendering
  renderStep?: (step: PlaybookStep, onComplete: (response: StepResponse) => void) => React.ReactNode;
  renderWelcome?: (onStart: () => void) => React.ReactNode;
  renderComplete?: (journey: PlaybookJourney) => React.ReactNode;
  renderError?: (error: string, onRetry: () => void) => React.ReactNode;
}

// ============================================================================
// UNIFIED PLAYBOOK FLOW COMPONENT
// ============================================================================

export function UnifiedPlaybookFlow({
  playbookId,
  autoStart = false,
  onStepComplete,
  onComplete,
  onError,
  onPause,
  onResume,
  showProgress = true,
  showNavigation = true,
  showPauseResume = true,
  className = '',
  renderStep,
  renderWelcome,
  renderComplete,
  renderError
}: UnifiedPlaybookFlowProps) {
  
  // ============================================================================
  // HOOKS
  // ============================================================================
  
  const {
    // State
    template,
    journey,
    loadingTemplate,
    loadingJourney,
    saving,
    error,
    currentStep,
    totalSteps,
    progressPercentage,
    isCompleted,
    isStarted,
    
    // Actions
    startJourney,
    completeStep,
    pauseJourney,
    resumeJourney,
    startOnboarding,
    completeOnboardingStep,
    clearError
  } = useUnifiedPlaybook({
    playbookId,
    autoStart,
    onComplete,
    onError
  });

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleStart = async () => {
    try {
      if (playbookId === 'onboarding-v1') {
        await startOnboarding();
      } else {
        await startJourney();
      }
    } catch (err) {
      logger.error('Failed to start playbook:', err);
    }
  };

  const handleStepComplete = async (stepId: string, response: StepResponse) => {
    try {
      if (playbookId === 'onboarding-v1') {
        await completeOnboardingStep(stepId, response);
      } else {
        await completeStep(stepId, response);
      }
      
      onStepComplete?.(stepId, response);
    } catch (err) {
      logger.error('Failed to complete step:', err);
    }
  };

  const handlePause = async () => {
    try {
      await pauseJourney();
      onPause?.();
    } catch (err) {
      logger.error('Failed to pause journey:', err);
    }
  };

  const handleResume = async () => {
    try {
      await resumeJourney();
      onResume?.();
    } catch (err) {
      logger.error('Failed to resume journey:', err);
    }
  };

  const handleRetry = () => {
    clearError();
    if (template) {
      handleStart();
    }
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderDefaultWelcome = (onStart: () => void) => (
    <Card className="p-8 text-center">
      <div className="mb-6">
        <Icon name="rocket" className="w-16 h-16 mx-auto text-primary mb-4" />
        <h1 className="text-3xl font-bold mb-2">{template?.title || 'Welcome to Your Journey'}</h1>
        <p className="text-muted-foreground text-lg">
          {template?.description || 'Let\'s get started with your personalized experience'}
        </p>
      </div>
      
      <div className="space-y-4">
        {template?.steps && (
          <div className="text-left max-w-md mx-auto">
            <h3 className="font-semibold mb-2">What you'll accomplish:</h3>
            <ul className="space-y-2">
              {template.steps.slice(0, 3).map((step, index) => (
                <li key={index} className="flex items-center text-sm">
                  <Icon name="check" className="w-4 h-4 text-green-500 mr-2" />
                  {step.title}
                </li>
              ))}
              {template.steps.length > 3 && (
                <li className="text-sm text-muted-foreground">
                  ...and {template.steps.length - 3} more steps
                </li>
              )}
            </ul>
          </div>
        )}
        
        <Button 
          onClick={onStart} 
          disabled={loadingJourney}
          className="w-full"
          size="lg"
        >
          {loadingJourney ? 'Starting...' : 'Get Started'}
        </Button>
      </div>
    </Card>
  );

  const renderDefaultStep = (step: any, onComplete: (response: Record<string, any>) => void) => (
    <Card className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <Badge variant="secondary">
            Step {currentStep} of {totalSteps}
          </Badge>
          {step.estimatedTime && (
            <span className="text-sm text-muted-foreground">
              ~{step.estimatedTime} minutes
            </span>
          )}
        </div>
        
        <h2 className="text-2xl font-bold mb-2">{step.title}</h2>
        {step.description && (
          <p className="text-muted-foreground mb-4">{step.description}</p>
        )}
      </div>
      
      <div className="space-y-4">
        {step.content && (
          <div className="prose max-w-none">
            {step.content}
          </div>
        )}
        
        {step.actions && (
          <div className="flex gap-3">
            {step.actions.map((action: any, index: number) => (
              <Button
                key={index}
                onClick={() => onComplete({ action: action.id, ...action.data })}
                variant={action.primary ? 'default' : 'outline'}
                disabled={saving}
              >
                {saving ? 'Saving...' : action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </Card>
  );

  const renderDefaultComplete = (journey: any) => (
    <Card className="p-8 text-center">
      <div className="mb-6">
        <Icon name="check-circle" className="w-16 h-16 mx-auto text-green-500 mb-4" />
        <h1 className="text-3xl font-bold mb-2">Congratulations!</h1>
        <p className="text-muted-foreground text-lg">
          You've successfully completed {template?.title || 'your journey'}
        </p>
      </div>
      
      <div className="space-y-4">
        {journey?.metadata?.completionMessage && (
          <p className="text-sm text-muted-foreground">
            {journey.metadata.completionMessage}
          </p>
        )}
        
        <div className="flex gap-3 justify-center">
          <Button onClick={() => window.location.href = '/dashboard'}>
            Go to Dashboard
          </Button>
          <Button variant="outline" onClick={() => resetJourney()}>
            Start Over
          </Button>
        </div>
      </div>
    </Card>
  );

  const renderDefaultError = (error: string, onRetry: () => void) => (
    <Card className="p-8 text-center">
      <div className="mb-6">
        <Icon name="alert-circle" className="w-16 h-16 mx-auto text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
        <p className="text-muted-foreground mb-4">{error}</p>
      </div>
      
      <div className="flex gap-3 justify-center">
        <Button onClick={onRetry}>
          Try Again
        </Button>
        <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>
          Go to Dashboard
        </Button>
      </div>
    </Card>
  );

  // ============================================================================
  // RENDER STATES
  // ============================================================================

  // Loading state
  if (loadingTemplate || loadingJourney) {
    return (
      <div className={`flex items-center justify-center min-h-64 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {loadingTemplate ? 'Loading template...' : 'Starting journey...'}
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={className}>
        {renderError ? renderError(error, handleRetry) : renderDefaultError(error, handleRetry)}
      </div>
    );
  }

  // No template state
  if (!template) {
    return (
      <div className={`flex items-center justify-center min-h-64 ${className}`}>
        <div className="text-center">
          <Icon name="file-x" className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Template Not Found</h2>
          <p className="text-muted-foreground">
            The playbook template "{playbookId}" could not be loaded.
          </p>
        </div>
      </div>
    );
  }

  // Welcome state (not started)
  if (!isStarted) {
    return (
      <div className={className}>
        {renderWelcome ? renderWelcome(handleStart) : renderDefaultWelcome(handleStart)}
      </div>
    );
  }

  // Complete state
  if (isCompleted && journey) {
    return (
      <div className={className}>
        {renderComplete ? renderComplete(journey) : renderDefaultComplete(journey)}
      </div>
    );
  }

  // Active journey state
  if (journey && template.steps) {
    const currentStepData = template.steps[currentStep - 1];
    
    if (!currentStepData) {
      return (
        <div className={`flex items-center justify-center min-h-64 ${className}`}>
          <div className="text-center">
            <Icon name="alert-triangle" className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Step Not Found</h2>
            <p className="text-muted-foreground">
              Step {currentStep} could not be found in the template.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className={`space-y-6 ${className}`}>
        {/* Progress Bar */}
        {showProgress && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        )}

        {/* Current Step */}
        <div>
          {renderStep ? 
            renderStep(currentStepData, (response) => handleStepComplete(currentStepData.id, response)) :
            renderDefaultStep(currentStepData, (response) => handleStepComplete(currentStepData.id, response))
          }
        </div>

        {/* Navigation */}
        {showNavigation && (
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              {showPauseResume && (
                <>
                  <Button
                    variant="outline"
                    onClick={handlePause}
                    disabled={saving}
                  >
                    <Icon name="pause" className="w-4 h-4 mr-2" />
                    Pause
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleResume}
                    disabled={saving}
                  >
                    <Icon name="play" className="w-4 h-4 mr-2" />
                    Resume
                  </Button>
                </>
              )}
            </div>
            
            <div className="text-sm text-muted-foreground">
              Step {currentStep} of {totalSteps}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Fallback state
  return (
    <div className={`flex items-center justify-center min-h-64 ${className}`}>
      <div className="text-center">
        <Icon name="help-circle" className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Unexpected State</h2>
        <p className="text-muted-foreground">
          The playbook is in an unexpected state. Please try refreshing the page.
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// LEGACY EXPORTS FOR BACKWARD COMPATIBILITY
// ============================================================================

// Legacy onboarding flow
export const OnboardingFlow = (props: Omit<UnifiedPlaybookFlowProps, 'playbookId'>) => (
  <UnifiedPlaybookFlow {...props} playbookId="onboarding-v1" />
);

// Legacy journey flow
export const JourneyFlow = (props: UnifiedPlaybookFlowProps) => (
  <UnifiedPlaybookFlow {...props} />
);

// Legacy playbook viewer
export const PlaybookViewer = (props: UnifiedPlaybookFlowProps) => (
  <UnifiedPlaybookFlow {...props} />
);
