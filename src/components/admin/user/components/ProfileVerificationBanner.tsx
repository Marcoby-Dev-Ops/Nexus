import React from 'react';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { CheckCircle, AlertTriangle, Clock, UserCheck } from 'lucide-react';

interface ProfileVerificationBannerProps {
  verificationStatus?: 'verified' | 'pending' | 'unverified';
  onVerify?: () => void;
  className?: string;
}

export const ProfileVerificationBanner: React.FC<ProfileVerificationBannerProps> = ({
  verificationStatus = 'unverified',
  onVerify,
  className = ''
}) => {
  const getStatusConfig = () => {
    switch (verificationStatus) {
      case 'verified':
        return {
          icon: CheckCircle,
          variant: 'default' as const,
          title: 'Profile Verified',
          description: 'Your profile has been successfully verified.',
          badge: <Badge variant="default">Verified</Badge>,
          action: null
        };
      case 'pending':
        return {
          icon: Clock,
          variant: 'default' as const,
          title: 'Verification Pending',
          description: 'Your profile is currently under review.',
          badge: <Badge variant="secondary">Pending</Badge>,
          action: null
        };
      case 'unverified':
      default:
        return {
          icon: AlertTriangle,
          variant: 'destructive' as const,
          title: 'Profile Not Verified',
          description: 'Please verify your profile to access all features.',
          badge: <Badge variant="destructive">Unverified</Badge>,
          action: (
            <Button size="sm" onClick={onVerify}>
              Verify Profile
            </Button>
          )
        };
    }
  };

  const config = getStatusConfig();
  const IconComponent = config.icon;

  return (
    <Alert variant={config.variant} className={className}>
      <IconComponent className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium">{config.title}</span>
              {config.badge}
            </div>
            <p className="text-sm text-muted-foreground">{config.description}</p>
          </div>
        </div>
        {config.action}
      </AlertDescription>
    </Alert>
  );
}; 