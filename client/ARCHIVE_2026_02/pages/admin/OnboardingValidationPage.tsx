import React from 'react';
import { OnboardingValidationDisplay } from '@/shared/components/ui/OnboardingValidationDisplay';
import { OnboardingTrigger } from '@/shared/components/ui/OnboardingTrigger';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { useAuth } from '@/hooks';
import { validateOnboardingWithProfiles, checkOnboardingTrulyCompleted } from '@/shared/utils/triggerOnboarding';
import { logger } from '@/shared/utils/logger';

export const OnboardingValidationPage: React.FC = () => {
  const { user } = useAuth();
  const [validationResult, setValidationResult] = React.useState<any>(null);
  const [isValidating, setIsValidating] = React.useState(false);

  const handleManualValidation = async () => {
    if (!user?.id) return;

    setIsValidating(true);
    try {
      const result = await validateOnboardingWithProfiles(user.id);
      setValidationResult(result);
      logger.info('Manual validation completed', result);
    } catch (error) {
      logger.error('Manual validation failed:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const handleCheckCompletion = async () => {
    if (!user?.id) return;

    try {
      const isCompleted = await checkOnboardingTrulyCompleted(user.id);
      alert(`Onboarding truly completed: ${isCompleted ? 'Yes' : 'No'}`);
    } catch (error) {
      logger.error('Completion check failed:', error);
      alert('Failed to check completion status');
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Onboarding Validation</h1>
          <p className="text-muted-foreground">
            Validate onboarding completion by matching data against user and company profiles
          </p>
        </div>
        <OnboardingTrigger showStatus={true} />
      </div>

      {/* Manual Validation Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Manual Validation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={handleManualValidation} 
              disabled={isValidating || !user?.id}
            >
              {isValidating ? 'Validating...' : 'Run Manual Validation'}
            </Button>
            <Button 
              onClick={handleCheckCompletion} 
              variant="outline"
              disabled={!user?.id}
            >
              Check Completion Status
            </Button>
          </div>
          
          {validationResult && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Last Validation Result:</h3>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(validationResult, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Real-time Validation Display */}
      <OnboardingValidationDisplay showDetails={true} showActions={true} />

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">1. Trigger Onboarding</h3>
            <p className="text-sm text-muted-foreground">
              Use the "Start Onboarding" button above or add <code>?force-onboarding=true</code> to any URL.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">2. Complete Onboarding Steps</h3>
            <p className="text-sm text-muted-foreground">
              Fill out all onboarding steps: Basic Info, Business Context, Integration Discovery, and AI Capabilities.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">3. Validate Completion</h3>
            <p className="text-sm text-muted-foreground">
              The validation system will check if the onboarding data matches your user and company profiles.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">4. Review Results</h3>
            <p className="text-sm text-muted-foreground">
              Check the validation display above to see what's missing or mismatched.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingValidationPage; 
