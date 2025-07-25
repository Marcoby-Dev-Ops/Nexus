import React from 'react';
import { Button } from '@/shared/components/ui/Button.tsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card.tsx';
import { AlertCircle, RefreshCw, Settings } from 'lucide-react';
import { clearOnboardingStateAndRefresh } from '@/shared/utils/clearOnboardingState';

interface OnboardingErrorHandlerProps {
  error?: string;
  onRetry?: () => void;
  onClearState?: () => void;
}

export const OnboardingErrorHandler: React.FC<OnboardingErrorHandlerProps> = ({
  error,
  onRetry,
  onClearState
}) => {
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  const handleClearState = () => {
    if (onClearState) {
      onClearState();
    } else {
      clearOnboardingStateAndRefresh();
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          Onboarding Issue
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {error || "We encountered an issue loading your onboarding data. This is usually a temporary problem."}
        </p>
        
        <div className="flex flex-col gap-2">
          <Button onClick={handleRetry} className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          
          <Button 
            onClick={handleClearState} 
            variant="outline" 
            className="w-full"
          >
            <Settings className="h-4 w-4 mr-2" />
            Reset Onboarding
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground text-center">
          If the problem persists, try resetting your onboarding state.
        </p>
      </CardContent>
    </Card>
  );
}; 