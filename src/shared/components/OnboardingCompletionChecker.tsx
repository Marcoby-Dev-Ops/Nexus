import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Progress } from '@/shared/components/ui/Progress';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  User,
  Building2,
  Settings,
  ArrowRight
} from 'lucide-react';
import { onboardingService } from '@/shared/services/OnboardingService';
import { useUserProfile } from '@/shared/contexts/UserContext';

interface OnboardingCompletionCheckerProps {
  onComplete: () => void;
  onIncomplete: (missingRequirements: string[]) => void;
}

export const OnboardingCompletionChecker: React.FC<OnboardingCompletionCheckerProps> = ({
  onComplete,
  onIncomplete
}) => {
  const { profile } = useUserProfile();
  const [loading, setLoading] = useState(true);
  const [completionData, setCompletionData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.id) {
      checkCompletion();
    }
  }, [profile?.id]);

  const checkCompletion = async () => {
    if (!profile?.id) return;

    setLoading(true);
    setError(null);

    try {
      const result = await onboardingService.checkOnboardingCompletion(profile.id);
      
      if (result.success && result.data) {
        setCompletionData(result.data);
        
        if (result.data.isCompleted) {
          onComplete();
        } else {
          onIncomplete(result.data.missingRequirements);
        }
      } else {
        setError(result.error || 'Failed to check onboarding completion');
        onIncomplete(['Unable to verify onboarding completion']);
      }
    } catch (err) {
      setError('Error checking onboarding completion');
      onIncomplete(['Unable to verify onboarding completion']);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking your onboarding status...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={checkCompletion} className="w-full">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!completionData) {
    return null;
  }

  const { 
    isCompleted, 
    userProfileComplete, 
    businessProfileComplete, 
    requiredModulesComplete,
    missingRequirements,
    completionPercentage 
  } = completionData;

  const checks = [
    {
      name: 'User Profile',
      completed: userProfileComplete,
      icon: <User className="w-4 h-4" />,
      description: 'Complete your personal profile with name and email'
    },
    {
      name: 'Business Profile',
      completed: businessProfileComplete,
      icon: <Building2 className="w-4 h-4" />,
      description: 'Set up your business information'
    },
    {
      name: 'Onboarding Modules',
      completed: requiredModulesComplete,
      icon: <Settings className="w-4 h-4" />,
      description: 'Complete required onboarding steps'
    }
  ];

  return (
    <div className="flex items-center justify-center min-h-screen p-6">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold mb-2">
            {isCompleted ? 'Onboarding Complete!' : 'Complete Your Setup'}
          </CardTitle>
          <p className="text-muted-foreground">
            {isCompleted 
              ? 'You\'re all set to use Nexus!' 
              : 'Let\'s finish setting up your account'
            }
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {checks.map((check, index) => (
              <div key={index} className="flex items-center gap-3 p-3 rounded-lg border">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  check.completed 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {check.completed ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    check.icon
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{check.name}</span>
                    {check.completed && (
                      <Badge variant="secondary" className="text-xs">
                        Complete
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {check.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Completion Progress</span>
              <span>{Math.round(completionPercentage)}%</span>
            </div>
            <Progress value={completionPercentage} className="w-full" />
          </div>

          {!isCompleted && missingRequirements.length > 0 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">Missing Requirements:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                {missingRequirements.map((requirement, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <XCircle className="w-3 h-3" />
                    {requirement}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-center pt-4">
            {isCompleted ? (
              <Button onClick={onComplete} className="px-8">
                Continue to Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={() => onIncomplete(missingRequirements)} className="px-8">
                Complete Setup
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
