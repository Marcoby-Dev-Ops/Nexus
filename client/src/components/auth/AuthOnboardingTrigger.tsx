import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { 
  User, 
  Shield, 
  Bell, 
  Eye, 
  Download, 
  Settings,
  Play,
  GraduationCap
} from 'lucide-react';
import { useAuthOnboarding } from '@/hooks/auth/useAuthOnboarding';
import { AuthOnboardingModules } from './AuthOnboardingModules';

interface AuthOnboardingTriggerProps {
  featureId?: string;
  variant?: 'card' | 'button' | 'minimal';
  onStart?: (moduleId: string) => void;
  onComplete?: (moduleId: string) => void;
  onSkip?: (moduleId: string) => void;
}

export function AuthOnboardingTrigger({ 
  featureId,
  variant = 'button',
  onStart,
  onComplete,
  onSkip 
}: AuthOnboardingTriggerProps) {
  const {
    features,
    completionPercentage,
    nextRecommendedModule,
    startModule,
    completeModule,
    skipModule,
    currentModule,
    isVisible,
    closeModule,
  } = useAuthOnboarding();

  const handleStartModule = (moduleId: string) => {
    startModule(moduleId);
    onStart?.(moduleId);
  };

  const handleCompleteModule = (moduleId: string) => {
    completeModule(moduleId);
    onComplete?.(moduleId);
  };

  const handleSkipModule = (moduleId: string) => {
    skipModule(moduleId);
    onSkip?.(moduleId);
  };

  const getFeatureIcon = (featureId: string) => {
    switch (featureId) {
      case 'account-setup':
      case 'profile-management':
        return <User className="w-4 h-4" />;
      case 'security-settings':
        return <Shield className="w-4 h-4" />;
      case 'notification-preferences':
        return <Bell className="w-4 h-4" />;
      case 'privacy-settings':
        return <Eye className="w-4 h-4" />;
      case 'data-management':
        return <Download className="w-4 h-4" />;
      default:
        return <Settings className="w-4 h-4" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (variant === 'minimal') {
    return (
      <>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleStartModule(featureId || nextRecommendedModule?.id || 'account-setup')}
          className="text-xs"
        >
          <GraduationCap className="w-3 h-3 mr-1" />
          Learn
        </Button>
        <AuthOnboardingModules
          isOpen={isVisible}
          onClose={closeModule}
          onComplete={handleCompleteModule}
          onSkip={handleSkipModule}
          moduleId={currentModule}
        />
      </>
    );
  }

  if (variant === 'card') {
    const targetFeature = featureId 
      ? features.find(f => f.id === featureId)
      : nextRecommendedModule;

    if (!targetFeature) return null;

    return (
      <>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleStartModule(targetFeature.id)}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getFeatureIcon(targetFeature.id)}
                <CardTitle className="text-base">{targetFeature.name}</CardTitle>
              </div>
              <Badge className={getDifficultyColor(targetFeature.difficulty)}>
                {targetFeature.difficulty}
              </Badge>
            </div>
            <CardDescription className="text-sm">
              {targetFeature.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Play className="w-3 h-3" />
                {targetFeature.estimatedTime} min
              </div>
              <Button size="sm" variant="outline">
                Start Learning
              </Button>
            </div>
          </CardContent>
        </Card>
        <AuthOnboardingModules
          isOpen={isVisible}
          onClose={closeModule}
          onComplete={handleCompleteModule}
          onSkip={handleSkipModule}
          moduleId={currentModule}
        />
      </>
    );
  }

  // Default button variant
  return (
    <>
      <Button
        variant="outline"
        onClick={() => handleStartModule(featureId || nextRecommendedModule?.id || 'account-setup')}
        className="flex items-center gap-2"
      >
        <GraduationCap className="w-4 h-4" />
        {featureId ? 'Learn This Feature' : 'Start Learning'}
      </Button>
      <AuthOnboardingModules
        isOpen={isVisible}
        onClose={closeModule}
        onComplete={handleCompleteModule}
        onSkip={handleSkipModule}
        moduleId={currentModule}
      />
    </>
  );
} 
