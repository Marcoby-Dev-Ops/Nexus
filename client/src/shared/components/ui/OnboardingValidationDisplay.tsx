import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Progress } from '@/shared/components/ui/Progress';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  User, 
  Building2, 
  Settings,
  TrendingUp
} from 'lucide-react';
import { useOnboardingValidation } from '@/shared/hooks/useOnboardingValidation';

interface OnboardingValidationDisplayProps {
  showDetails?: boolean;
  showActions?: boolean;
  className?: string;
}

export const OnboardingValidationDisplay: React.FC<OnboardingValidationDisplayProps> = ({
  showDetails = true,
  showActions = true,
  className = ''
}) => {
  const {
    validationResult,
    isLoading,
    error,
    validateOnboarding,
    isCompleted,
    completionPercentage,
    missingFields,
    mismatchedFields,
    recommendations,
    userProfileValidation,
    companyProfileValidation,
    onboardingDataValidation
  } = useOnboardingValidation();

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-6">
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Validating onboarding...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-destructive" />
            Validation Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive mb-4">{error}</p>
          {showActions && (
            <Button onClick={validateOnboarding} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Validation
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (!validationResult) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-6">
          <span className="text-muted-foreground">No validation data available</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Overall Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isCompleted ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-yellow-600" />
            )}
            Onboarding Validation
            <Badge variant={isCompleted ? 'default' : 'secondary'}>
              {isCompleted ? 'Completed' : 'Incomplete'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Completion</span>
              <span>{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="font-semibold">{missingFields.length}</div>
              <div className="text-muted-foreground">Missing</div>
            </div>
            <div className="text-center">
              <div className="font-semibold">{mismatchedFields.length}</div>
              <div className="text-muted-foreground">Mismatched</div>
            </div>
            <div className="text-center">
              <div className="font-semibold">{recommendations.length}</div>
              <div className="text-muted-foreground">Actions</div>
            </div>
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex gap-2">
              <Button onClick={validateOnboarding} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Breakdown */}
      {showDetails && (
        <div className="grid gap-4 md:grid-cols-3">
          {/* User Profile Validation */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4" />
                User Profile
                <Badge variant={userProfileValidation?.isValid ? 'default' : 'secondary'} className="text-xs">
                  {userProfileValidation?.profileCompleteness?.toFixed(0)}%
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {userProfileValidation?.missingFields.length ? (
                <div className="text-xs text-muted-foreground">
                  Missing: {userProfileValidation.missingFields.join(', ')}
                </div>
              ) : (
                <div className="text-xs text-green-600">✓ Complete</div>
              )}
              {userProfileValidation?.mismatchedFields.length ? (
                <div className="text-xs text-yellow-600">
                  Mismatched: {userProfileValidation.mismatchedFields.join(', ')}
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Company Profile Validation */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Building2 className="w-4 h-4" />
                Company Profile
                <Badge variant={companyProfileValidation?.isValid ? 'default' : 'secondary'} className="text-xs">
                  {companyProfileValidation?.profileCompleteness?.toFixed(0)}%
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {companyProfileValidation?.missingFields.length ? (
                <div className="text-xs text-muted-foreground">
                  Missing: {companyProfileValidation.missingFields.join(', ')}
                </div>
              ) : (
                <div className="text-xs text-green-600">✓ Complete</div>
              )}
              {companyProfileValidation?.mismatchedFields.length ? (
                <div className="text-xs text-yellow-600">
                  Mismatched: {companyProfileValidation.mismatchedFields.join(', ')}
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Onboarding Data Validation */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Settings className="w-4 h-4" />
                Onboarding Data
                <Badge variant={onboardingDataValidation?.isValid ? 'default' : 'secondary'} className="text-xs">
                  {onboardingDataValidation?.dataCompleteness?.toFixed(0)}%
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {onboardingDataValidation?.missingSteps.length ? (
                <div className="text-xs text-muted-foreground">
                  Missing: {onboardingDataValidation.missingSteps.join(', ')}
                </div>
              ) : (
                <div className="text-xs text-green-600">✓ Complete</div>
              )}
              {onboardingDataValidation?.incompleteSteps.length ? (
                <div className="text-xs text-yellow-600">
                  Incomplete: {onboardingDataValidation.incompleteSteps.join(', ')}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span>{recommendation}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OnboardingValidationDisplay; 
