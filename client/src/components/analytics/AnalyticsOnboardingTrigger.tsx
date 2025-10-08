import React from 'react';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { 
  GraduationCap, 
  BarChart3, 
  TrendingUp, 
  Activity, 
  Database,
  Play, 
  CheckCircle, 
  Star, 
  Clock, 
  Sparkles 
} from 'lucide-react';
import useAnalyticsOnboarding from '@/hooks/analytics/useAnalyticsOnboarding';
import AnalyticsOnboardingModules from './AnalyticsOnboardingModules';

interface AnalyticsOnboardingTriggerProps {
  featureId?: string;
  showProgress?: boolean;
  variant?: 'card' | 'button' | 'minimal';
  position?: 'inline' | 'floating';
  onStart?: (moduleId: string) => void;
  onComplete?: (moduleId: string) => void;
}

const AnalyticsOnboardingTrigger: React.FC<AnalyticsOnboardingTriggerProps> = ({
  featureId, showProgress = true, variant = 'card', position = 'inline', onStart, onComplete
}) => {
  const { 
    features, 
    completionPercentage, 
    nextRecommendedModule, 
    startModule, 
    completeModule, 
    skipModule, 
    closeModule, 
    currentModule, 
    isVisible 
  } = useAnalyticsOnboarding();

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
  };

  const getFeatureIcon = (featureId: string) => {
    switch (featureId) {
      case 'data-warehouse': return Database;
      case 'unified-analytics': return BarChart3;
      case 'fire-cycle-analytics': return TrendingUp;
      case 'integration-tracking': return Activity;
      default: return BarChart3;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // If a specific feature is requested, show that module
  if (featureId) {
    const feature = features.find(f => f.id === featureId);
    if (!feature) return null;

    const Icon = getFeatureIcon(feature.id);

    if (variant === 'button') {
      return (
        <>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleStartModule(feature.id)}
            className="flex items-center gap-2"
          >
            <GraduationCap className="w-4 h-4" />
            Learn {feature.name}
          </Button>
          
          {currentModule && (
            <AnalyticsOnboardingModules
              moduleId={currentModule}
              isVisible={isVisible}
              onComplete={handleCompleteModule}
              onSkip={handleSkipModule}
              onClose={closeModule}
            />
          )}
        </>
      );
    }

    if (variant === 'minimal') {
      return (
        <>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleStartModule(feature.id)}
          >
            <Sparkles className="w-4 h-4" />
          </Button>
          
          {currentModule && (
            <AnalyticsOnboardingModules
              moduleId={currentModule}
              isVisible={isVisible}
              onComplete={handleCompleteModule}
              onSkip={handleSkipModule}
              onClose={closeModule}
            />
          )}
        </>
      );
    }

    // Default card variant
    return (
      <>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleStartModule(feature.id)}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-base">{feature.name}</CardTitle>
              </div>
              {feature.isRecommended && <Star className="w-4 h-4 text-yellow-500" />}
            </div>
            <CardDescription className="text-sm">
              {feature.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between mb-3">
              <Badge className={getDifficultyColor(feature.difficulty)}>
                {feature.difficulty}
              </Badge>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {feature.estimatedTime}
              </div>
            </div>
            <Button className="w-full" size="sm">
              <Play className="w-4 h-4 mr-2" />
              Start Learning
            </Button>
          </CardContent>
        </Card>
        
        {currentModule && (
          <AnalyticsOnboardingModules
            moduleId={currentModule}
            isVisible={isVisible}
            onComplete={handleCompleteModule}
            onSkip={handleSkipModule}
            onClose={closeModule}
          />
        )}
      </>
    );
  }

  // Show general analytics onboarding trigger
  if (variant === 'button') {
    return (
      <>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => nextRecommendedModule && handleStartModule(nextRecommendedModule.id)}
          disabled={!nextRecommendedModule}
          className="flex items-center gap-2"
        >
          <GraduationCap className="w-4 h-4" />
          {nextRecommendedModule ? `Learn ${nextRecommendedModule.name}` : 'All Modules Complete'}
        </Button>
        
        {currentModule && (
          <AnalyticsOnboardingModules
            moduleId={currentModule}
            isVisible={isVisible}
            onComplete={handleCompleteModule}
            onSkip={handleSkipModule}
            onClose={closeModule}
          />
        )}
      </>
    );
  }

  if (variant === 'minimal') {
    return (
      <>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => nextRecommendedModule && handleStartModule(nextRecommendedModule.id)}
          disabled={!nextRecommendedModule}
        >
          <Sparkles className="w-4 h-4" />
        </Button>
        
        {currentModule && (
          <AnalyticsOnboardingModules
            moduleId={currentModule}
            isVisible={isVisible}
            onComplete={handleCompleteModule}
            onSkip={handleSkipModule}
            onClose={closeModule}
          />
        )}
      </>
    );
  }

  // Default card variant for general analytics onboarding
  return (
    <>
      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => nextRecommendedModule && handleStartModule(nextRecommendedModule.id)}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-base">Analytics Learning</CardTitle>
          </div>
          <CardDescription className="text-sm">
            Master your analytics capabilities
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {showProgress && (
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span>Progress</span>
                <span>{Math.round(completionPercentage)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
          )}
          
          {nextRecommendedModule ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Next: {nextRecommendedModule.name}</span>
                <Badge className={getDifficultyColor(nextRecommendedModule.difficulty)}>
                  {nextRecommendedModule.difficulty}
                </Badge>
              </div>
              <Button className="w-full" size="sm">
                <Play className="w-4 h-4 mr-2" />
                Start Learning
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">All modules completed!</span>
            </div>
          )}
        </CardContent>
      </Card>
      
      {currentModule && (
        <AnalyticsOnboardingModules
          moduleId={currentModule}
          isVisible={isVisible}
          onComplete={handleCompleteModule}
          onSkip={handleSkipModule}
          onClose={closeModule}
        />
      )}
    </>
  );
};

export default AnalyticsOnboardingTrigger; 
