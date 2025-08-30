import React from 'react';
import { Button } from './Button';
import { useOnboardingValidation } from '@/shared/hooks/useOnboardingValidation';

interface OnboardingTriggerProps {
  onTrigger?: () => void;
  className?: string;
}

export const OnboardingTrigger: React.FC<OnboardingTriggerProps> = ({
  onTrigger,
  className,
}) => {
  const { triggerOnboarding } = useOnboardingValidation();

  const handleClick = () => {
    triggerOnboarding();
    onTrigger?.();
  };

  return (
    <Button
      onClick={handleClick}
      className={className}
      variant="outline"
      size="sm"
    >
      Test Onboarding
    </Button>
  );
}; 
