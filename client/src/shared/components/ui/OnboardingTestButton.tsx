import React from 'react';
import { Button } from '@/shared/components/ui/Button';
import { Play, RotateCcw } from 'lucide-react';

interface OnboardingTestButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export const OnboardingTestButton: React.FC<OnboardingTestButtonProps> = ({
  variant = 'outline',
  size = 'sm',
  className = ''
}) => {
  const triggerOnboarding = () => {
    const currentURL = new URL(window.location);
    currentURL.searchParams.set('force-onboarding', 'true');
    window.location.href = currentURL.toString();
  };

  const resetOnboarding = () => {
    // Clear onboarding state
    localStorage.removeItem('nexus_onboarding_complete');
    localStorage.removeItem('nexus-onboarding-state');
    
    // Add force parameter and reload
    const currentURL = new URL(window.location);
    currentURL.searchParams.set('force-onboarding', 'true');
    window.location.href = currentURL.toString();
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      <Button
        variant={variant}
        size={size}
        onClick={triggerOnboarding}
      >
        <Play className="w-4 h-4 mr-2" />
        Test Onboarding
      </Button>
      
      <Button
        variant="ghost"
        size={size}
        onClick={resetOnboarding}
      >
        <RotateCcw className="w-4 h-4 mr-2" />
        Reset & Test
      </Button>
    </div>
  );
};

export default OnboardingTestButton; 
