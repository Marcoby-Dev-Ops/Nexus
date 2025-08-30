/**
 * Orchestrated Page Component
 * Reusable page wrapper that provides orchestrated loading, error handling, and progress tracking
 * Can be used on any page with multiple components and data dependencies
 */

import type { ReactNode } from 'react';
import React from 'react';
import { Card, CardContent } from '@/shared/components/ui/Card';
import { Progress } from '@/shared/components/ui/Progress';
import { Button } from '@/shared/components/ui/Button';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert';
import { 
  Loader2, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react';
import type { 
  OrchestrationStep,
  UsePageOrchestrationOptions 
} from '@/hooks/orchestration/usePageOrchestration';
import { 
  usePageOrchestration 
} from '@/hooks/orchestration/usePageOrchestration';
import { logger } from '@/shared/utils/logger';

export interface OrchestratedPageProps {
  // Page configuration
  title: string;
  description?: string;
  steps: OrchestrationStep[];
  
  // Orchestration options
  orchestrationOptions?: Partial<UsePageOrchestrationOptions>;
  
  // Content
  children: ReactNode;
  
  // Custom components
  LoadingComponent?: React.ComponentType<{ message: string; progress: number }>;
  ErrorComponent?: React.ComponentType<{ errors: string[]; onRetry: () => void }>;
  
  // Callbacks
  onStepComplete?: (stepId: string) => void;
  onStepError?: (stepId: string, error: string) => void;
  onAllComplete?: () => void;
  
  // Styling
  className?: string;
  showProgressBar?: boolean;
  showStepStatus?: boolean;
}

const DefaultLoadingComponent: React.FC<{ message: string; progress: number }> = ({ message, progress }) => (
  <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6 p-8">
    <div className="text-center space-y-4">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
        <CheckCircle className="w-6 h-6 text-green-500 absolute -bottom-1 -right-1" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Loading Page</h3>
        <p className="text-muted-foreground">{message}</p>
      </div>
      <div className="w-full max-w-md space-y-2">
        <Progress value={progress} className="w-full" />
        <p className="text-sm text-muted-foreground">{progress}% Complete</p>
      </div>
    </div>
  </div>
);

const DefaultErrorComponent: React.FC<{ errors: string[]; onRetry: () => void }> = ({ errors, onRetry }) => (
  <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6 p-8">
    <div className="text-center space-y-4">
      <AlertCircle className="w-16 h-16 text-destructive mx-auto" />
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Page Loading Error</h3>
        <p className="text-muted-foreground">Some components failed to load properly</p>
      </div>
      <div className="space-y-2">
        {errors.map((error, index) => (
          <Alert key={index} variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ))}
      </div>
      <Button onClick={onRetry} variant="outline" className="mt-4">
        <RefreshCw className="w-4 h-4 mr-2" />
        Retry Loading
      </Button>
    </div>
  </div>
);

const StepStatusIndicator: React.FC<{ 
  step: OrchestrationStep;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  isReady: boolean;
}> = ({ step, status, progress, isReady }) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'running':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300';
      case 'failed':
        return 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300';
      case 'running':
        return 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300';
      default:
        return isReady ? 'bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-300' : 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className={`flex items-center space-x-3 p-3 rounded-md transition-colors ${getStatusColor()}`}>
      {getStatusIcon()}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium truncate">{step.name}</span>
          {status === 'running' && (
            <span className="text-xs text-muted-foreground">{progress}%</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">{step.description}</p>
        {step.dependencies && step.dependencies.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Depends on: {step.dependencies.join(', ')}
          </p>
        )}
      </div>
      {status === 'running' && (
        <div className="w-16">
          <Progress value={progress} className="h-1" />
        </div>
      )}
    </div>
  );
};

export const OrchestratedPage: React.FC<OrchestratedPageProps> = ({
  title,
  description,
  steps,
  orchestrationOptions = {},
  children,
  LoadingComponent = DefaultLoadingComponent,
  ErrorComponent = DefaultErrorComponent,
  onStepComplete,
  onStepError,
  onAllComplete,
  className = '',
  showProgressBar = true,
  showStepStatus = true
}) => {
  const orchestration = usePageOrchestration({
    steps,
    onStepComplete,
    onStepError,
    onAllComplete,
    ...orchestrationOptions
  });

  const { state, retryAllFailed, reset, getStepStatus, getStepProgress, isStepReady } = orchestration;

  const handleRetry = async () => {
    try {
      await retryAllFailed();
      logger.info('Page retry initiated');
    } catch (error) {
      logger.error('Failed to retry page loading', { error });
    }
  };

  const handleReset = () => {
    reset();
    logger.info('Page orchestration reset');
  };

  // Show loading state while initializing
  if (state.isInitializing) {
    const currentStep = steps.find(s => s.id === state.currentStep);
    const message = currentStep ? `Loading ${currentStep.name.toLowerCase()}...` : 'Initializing page...';
    
    return (
      <div className={`space-y-6 p-6 ${className}`}>
        <LoadingComponent message={message} progress={state.progress} />
        
        {showStepStatus && (
          <Card>
            <CardContent className="p-6">
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground">Component Status</h4>
                <div className="space-y-2">
                  {steps.map(step => (
                    <StepStatusIndicator
                      key={step.id}
                      step={step}
                      status={getStepStatus(step.id)}
                      progress={getStepProgress(step.id)}
                      isReady={isStepReady(step.id)}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Show error state if there are errors
  if (state.hasErrors && state.errors.length > 0) {
    const errorMessages = state.errors.map(e => `${e.stepId}: ${e.error}`);
    return (
      <div className={`space-y-6 p-6 ${className}`}>
        <ErrorComponent errors={errorMessages} onRetry={handleRetry} />
      </div>
    );
  }

  // Show loading state while not ready
  if (!state.isReady) {
    const currentStep = steps.find(s => s.id === state.currentStep);
    const message = currentStep ? `Loading ${currentStep.name.toLowerCase()}...` : 'Preparing page...';
    
    return (
      <div className={`space-y-6 p-6 ${className}`}>
        <LoadingComponent message={message} progress={state.progress} />
      </div>
    );
  }

  // Page is ready - render content
  return (
    <div className={`space-y-6 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {showProgressBar && state.progress < 100 && (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Zap className="w-4 h-4" />
              <span>{state.progress}% Complete</span>
            </div>
          )}
          <Button onClick={handleReset} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      {/* Progress indicator */}
      {showProgressBar && state.progress < 100 && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Loading Progress</span>
                <span>{state.progress}%</span>
              </div>
              <Progress value={state.progress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main content */}
      <div className="space-y-6">
        {children}
      </div>

      {/* Success indicator */}
      {state.isReady && state.progress === 100 && (
        <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-800 dark:text-green-200">
                Page fully loaded and operational
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OrchestratedPage;

