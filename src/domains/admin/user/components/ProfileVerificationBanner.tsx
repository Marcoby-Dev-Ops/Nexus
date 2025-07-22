/**
 * Profile Verification Banner
 * Shows onboarding status and allows verification from the profile page
 */

import React from 'react';
import { Card, CardContent } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert';
import { CheckCircle, AlertTriangle, RefreshCw, User } from 'lucide-react';
import { useOnboardingVerification } from '@/domains/admin/onboarding/hooks/useOnboardingVerification';

interface ProfileVerificationBannerProps {
  className?: string;
}

export const ProfileVerificationBanner: React.FC<ProfileVerificationBannerProps> = ({
  className = ''
}) => {
  const { 
    isVerifying, 
    verificationResult, 
    verifyOnboarding, 
    isComplete, 
    hasIssues 
  } = useOnboardingVerification();

  const handleVerify = async () => {
    await verifyOnboarding();
  };

  // Don't show if verification is complete and successful
  if (isComplete && !hasIssues) {
    return null;
  }

  return (
    <Card className={`bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full">
              <User className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-medium text-blue-900">Profile Verification</h3>
              <p className="text-sm text-blue-700">
                {isVerifying 
                  ? 'Checking your profile completion...' 
                  : hasIssues 
                    ? 'Some profile information needs attention'
                    : 'Verify your profile is complete'
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {verificationResult && (
              <Badge 
                variant={isComplete ? "default" : "destructive"}
                className="text-xs"
              >
                {isComplete ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Complete
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Issues Found
                  </>
                )}
              </Badge>
            )}
            
            <Button
              size="sm"
              onClick={handleVerify}
              disabled={isVerifying}
              variant="outline"
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  Checking...
                </>
              ) : (
                'Verify Profile'
              )}
            </Button>
          </div>
        </div>

        {/* Show specific issues if any */}
        {verificationResult && !isComplete && (
          <div className="mt-3 pt-3 border-t border-blue-200">
            <Alert className="bg-blue-50 border-blue-200">
              <AlertTriangle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Issues found:</strong> {verificationResult.checks
                  .filter(check => check.status === 'fail')
                  .map(check => check.name)
                  .join(', ')
                }
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileVerificationBanner; 