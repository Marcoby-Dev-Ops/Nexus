import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import {
  Zap,
  Workflow,
  Target,
  Play,
  GraduationCap
} from 'lucide-react';
import { useAutomationOnboarding } from '@/hooks/automation/useAutomationOnboarding';
import { AutomationOnboardingModules } from './AutomationOnboardingModules';

interface AutomationOnboardingTriggerProps {
  featureId?: string;
  variant?: 'card' | 'button' | 'minimal';
  onStart?: (moduleId: string) => void;
  onComplete?: (moduleId: string) => void;
  onSkip?: (moduleId: string) => void;
}

export function AutomationOnboardingTrigger({
  featureId,
  variant = 'button',
  onStart,
  onComplete,
  onSkip
}: AutomationOnboardingTriggerProps) {
  const {
    features,
    completionPercentage,
    nextRecommendedModule,
    startModule,
    completeModule,
    skipModule,
    closeModule,
    isVisible,
    currentModule
  } = useAutomationOnboarding();

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
      case 'workflow-basics': return <Workflow className="w-4 h-4" />;
      case 'recipe-deployment': return <Zap className="w-4 h-4" />;
      case 'advanced-workflows': return <Target className="w-4 h-4" />;
      case 'workflow-monitoring': return <Target className="w-4 h-4" />;
      case 'integration-setup': return <Workflow className="w-4 h-4" />;
      case 'workflow-optimization': return <GraduationCap className="w-4 h-4" />;
      default: return <Workflow className="w-4 h-4" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-success/10 text-success';
      case 'intermediate': return 'bg-warning/10 text-warning-foreground';
      case 'advanced': return 'bg-destructive/10 text-destructive';
      default: return 'bg-muted/50 text-muted-foreground';
    }
  };

  const targetFeature = featureId 
    ? features.find(f => f.id === featureId)
    : nextRecommendedModule;

  if (variant === 'minimal') {
    return (
      <>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => targetFeature && handleStartModule(targetFeature.id)}
          className="text-xs"
        >
          <GraduationCap className="w-3 h-3 mr-1" />
          Learn
        </Button>
        <AutomationOnboardingModules
          isOpen={isVisible}
          onClose={closeModule}
          onComplete={handleCompleteModule}
          onSkip={handleSkipModule}
          featureId={currentModule || undefined}
        />
      </>
    );
  }

  if (variant === 'card') {
    return (
      <>
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => targetFeature && handleStartModule(targetFeature.id)}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              {targetFeature && getFeatureIcon(targetFeature.id)}
              Automation Learning
            </CardTitle>
            <CardDescription>
              {targetFeature ? `Start learning ${targetFeature.name}` : 'Begin your automation journey'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Progress</span>
                <span className="text-sm font-medium">{Math.round(completionPercentage)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              {targetFeature && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={getDifficultyColor(targetFeature.difficulty)}>
                    {targetFeature.difficulty}
                  </Badge>
                  <Badge variant="outline">
                    {targetFeature.estimatedTime} min
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        <AutomationOnboardingModules
          isOpen={isVisible}
          onClose={closeModule}
          onComplete={handleCompleteModule}
          onSkip={handleSkipModule}
          featureId={currentModule || undefined}
        />
      </>
    );
  }

  // Default button variant
  return (
    <>
      <Button
        variant="outline"
        onClick={() => targetFeature && handleStartModule(targetFeature.id)}
        className="flex items-center gap-2"
      >
        <GraduationCap className="w-4 h-4" />
        {targetFeature ? `Learn ${targetFeature.name}` : 'Start Learning'}
      </Button>
      <AutomationOnboardingModules
        isOpen={isVisible}
        onClose={closeModule}
        onComplete={handleCompleteModule}
        onSkip={handleSkipModule}
        featureId={currentModule || undefined}
      />
    </>
  );
} 
