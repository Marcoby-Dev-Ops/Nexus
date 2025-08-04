import React from 'react';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import {
  Brain,
  MessageSquare,
  Users,
  Settings,
  BarChart3,
  Rocket,
  GraduationCap,
  Play,
  CheckCircle,
  Star,
  Clock,
  Sparkles
} from 'lucide-react';
import useAIOnboarding from '@/hooks/ai/useAIOnboarding';
import AIOnboardingModules from './AIOnboardingModules';

interface AIOnboardingTriggerProps {
  featureId?: string;
  showProgress?: boolean;
  variant?: 'card' | 'button' | 'minimal';
  position?: 'inline' | 'floating';
  onStart?: (moduleId: string) => void;
  onComplete?: (moduleId: string) => void;
}

const AIOnboardingTrigger: React.FC<AIOnboardingTriggerProps> = ({
  featureId,
  showProgress = true,
  variant = 'card',
  position = 'inline',
  onStart,
  onComplete
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
  } = useAIOnboarding();

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
      case 'chat-assistant':
        return <MessageSquare className="w-5 h-5" />;
      case 'agents':
        return <Users className="w-5 h-5" />;
      case 'models':
        return <Brain className="w-5 h-5" />;
      case 'performance':
        return <BarChart3 className="w-5 h-5" />;
      case 'capabilities':
        return <Rocket className="w-5 h-5" />;
      default:
        return <Brain className="w-5 h-5" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'advanced':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // If specific feature is requested, show that module
  if (featureId) {
    const feature = features.find(f => f.id === featureId);
    if (!feature) return null;

    if (variant === 'button') {
      return (
        <>
          <Button
            onClick={() => handleStartModule(featureId)}
            variant={feature.isCompleted ? 'outline' : 'default'}
            size="sm"
            className="flex items-center gap-2"
          >
            {feature.isCompleted ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {feature.isCompleted ? 'Review' : 'Learn'} {feature.name}
          </Button>

          {/* Module Modal */}
          {currentModule === featureId && (
            <AIOnboardingModules
              moduleId={featureId}
              onComplete={handleCompleteModule}
              onSkip={handleSkipModule}
              isVisible={isVisible}
              onClose={closeModule}
            />
          )}
        </>
      );
    }

    if (variant === 'minimal') {
      return (
        <>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => handleStartModule(featureId)}
              variant="ghost"
              size="sm"
              className="h-auto p-2"
            >
              {getFeatureIcon(featureId)}
            </Button>
            {feature.isCompleted && (
              <CheckCircle className="w-4 h-4 text-green-500" />
            )}
          </div>

          {/* Module Modal */}
          {currentModule === featureId && (
            <AIOnboardingModules
              moduleId={featureId}
              onComplete={handleCompleteModule}
              onSkip={handleSkipModule}
              isVisible={isVisible}
              onClose={closeModule}
            />
          )}
        </>
      );
    }

    // Default card variant
    return (
      <>
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                {getFeatureIcon(featureId)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <CardTitle className="text-base">{feature.name}</CardTitle>
                  {feature.isCompleted && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                  <Badge variant="secondary" className={getDifficultyColor(feature.difficulty)}>
                    {feature.difficulty}
                  </Badge>
                  {feature.isRecommended && (
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                      <Star className="w-3 h-3 mr-1" />
                      Recommended
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-sm">
                  {feature.description}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                {feature.estimatedTime}
              </div>
              <Button
                onClick={() => handleStartModule(featureId)}
                size="sm"
                variant={feature.isCompleted ? 'outline' : 'default'}
                className="flex items-center gap-2"
              >
                {feature.isCompleted ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Review
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Start Learning
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Module Modal */}
        {currentModule === featureId && (
          <AIOnboardingModules
            moduleId={featureId}
            onComplete={handleCompleteModule}
            onSkip={handleSkipModule}
            isVisible={isVisible}
            onClose={closeModule}
          />
        )}
      </>
    );
  }

  // Show recommended module or progress
  if (variant === 'button') {
    return (
      <>
        <Button
          onClick={() => nextRecommendedModule && handleStartModule(nextRecommendedModule.id)}
          disabled={!nextRecommendedModule}
          size="sm"
          className="flex items-center gap-2"
        >
          <GraduationCap className="w-4 h-4" />
          {nextRecommendedModule ? `Learn ${nextRecommendedModule.name}` : 'All Modules Complete'}
        </Button>

        {/* Module Modal */}
        {currentModule && (
          <AIOnboardingModules
            moduleId={currentModule}
            onComplete={handleCompleteModule}
            onSkip={handleSkipModule}
            isVisible={isVisible}
            onClose={closeModule}
          />
        )}
      </>
    );
  }

  // Default: show progress card
  return (
    <>
      <Card className={position === 'floating' ? 'fixed bottom-4 right-4 w-80 z-50 shadow-lg' : ''}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">AI Learning Progress</CardTitle>
              <CardDescription className="text-sm">
                {Math.round(completionPercentage)}% Complete
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {showProgress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Progress</span>
                <span>{features.filter(f => f.isCompleted).length} of {features.length}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
          )}

          {nextRecommendedModule ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {getFeatureIcon(nextRecommendedModule.id)}
                <span className="text-sm font-medium">{nextRecommendedModule.name}</span>
                <Badge variant="secondary" className={getDifficultyColor(nextRecommendedModule.difficulty)}>
                  {nextRecommendedModule.difficulty}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {nextRecommendedModule.description}
              </p>
              <Button
                onClick={() => handleStartModule(nextRecommendedModule.id)}
                size="sm"
                className="w-full flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Start Learning
                <Sparkles className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="text-center py-2">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-green-600">All modules completed!</p>
              <p className="text-xs text-muted-foreground">
                You've mastered all AI features
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Module Modal */}
      {currentModule && (
        <AIOnboardingModules
          moduleId={currentModule}
          onComplete={handleCompleteModule}
          onSkip={handleSkipModule}
          isVisible={isVisible}
          onClose={closeModule}
        />
      )}
    </>
  );
};

export { AIOnboardingTrigger };
export default AIOnboardingTrigger; 