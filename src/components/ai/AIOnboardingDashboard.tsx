import React from 'react';
import { useAuth } from '@/hooks/index';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Progress } from '@/shared/components/ui/Progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import {
  Brain,
  MessageSquare,
  Users,
  Settings,
  BarChart3,
  Rocket,
  CheckCircle,
  Play,
  BookOpen,
  GraduationCap,
  Star,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Clock,
  Target,
  Zap
} from 'lucide-react';
import useAIOnboarding from '@/hooks/ai/useAIOnboarding';
import AIOnboardingModules from './AIOnboardingModules';

interface AIOnboardingDashboardProps {
  showProgress?: boolean;
  onModuleStart?: (moduleId: string) => void;
  onModuleComplete?: (moduleId: string) => void;
}

const AIOnboardingDashboard: React.FC<AIOnboardingDashboardProps> = ({
  showProgress = true,
  onModuleStart,
  onModuleComplete
}) => {
  const { user, profile } = useAuth();
  const {
    features,
    completionPercentage,
    recommendedModules,
    nextRecommendedModule,
    startModule,
    completeModule,
    skipModule,
    closeModule,
    currentModule,
    isVisible
  } = useAIOnboarding();

  const handleModuleStart = (moduleId: string) => {
    startModule(moduleId);
    onModuleStart?.(moduleId);
  };

  const handleModuleComplete = (moduleId: string) => {
    completeModule(moduleId);
    onModuleComplete?.(moduleId);
  };

  const handleModuleSkip = (moduleId: string) => {
    skipModule(moduleId);
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

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            AI Learning Center
          </CardTitle>
          <CardDescription>
            Master your AI tools with guided tutorials and hands-on practice
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showProgress && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm text-muted-foreground">
                  {Math.round(completionPercentage)}% Complete
                </span>
              </div>
              <Progress value={completionPercentage} className="h-2" />
              <div className="flex items-center gap-2 mt-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-muted-foreground">
                  {features.filter(f => f.isCompleted).length} of {features.length} modules completed
                </span>
              </div>
            </div>
          )}

          <Tabs defaultValue="recommended" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="recommended">Recommended</TabsTrigger>
              <TabsTrigger value="all-modules">All Modules</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>

            <TabsContent value="recommended" className="space-y-4">
              {nextRecommendedModule ? (
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      {getFeatureIcon(nextRecommendedModule.id)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{nextRecommendedModule.name}</h3>
                        <Badge variant="secondary" className={getDifficultyColor(nextRecommendedModule.difficulty)}>
                          {nextRecommendedModule.difficulty}
                        </Badge>
                        {nextRecommendedModule.isRecommended && (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            <Star className="w-3 h-3 mr-1" />
                            Recommended
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {nextRecommendedModule.description}
                      </p>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          {nextRecommendedModule.estimatedTime}
                        </div>
                        <Button 
                          onClick={() => handleModuleStart(nextRecommendedModule.id)}
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <Play className="w-4 h-4" />
                          Start Learning
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">All Recommended Modules Complete!</h3>
                  <p className="text-muted-foreground mb-4">
                    You've completed all the recommended AI learning modules. 
                    Explore advanced features or review completed modules.
                  </p>
                  <Button variant="outline" onClick={() => document.querySelector('[data-value="all-modules"]')?.click()}>
                    Explore All Modules
                  </Button>
                </div>
              )}

              {recommendedModules.length > 1 && (
                <div>
                  <h4 className="font-semibold mb-3">Other Recommended Modules</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {recommendedModules.slice(1).map((feature) => (
                      <div key={feature.id} className="p-3 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          {getFeatureIcon(feature.id)}
                          <span className="font-medium text-sm">{feature.name}</span>
                          <Badge variant="secondary" className={getDifficultyColor(feature.difficulty)}>
                            {feature.difficulty}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {feature.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {feature.estimatedTime}
                          </span>
                          <Button 
                            onClick={() => handleModuleStart(feature.id)}
                            size="sm"
                            variant="outline"
                          >
                            Start
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="all-modules" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {features.map((feature) => (
                  <div key={feature.id} className="p-4 border rounded-lg">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        {getFeatureIcon(feature.id)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{feature.name}</h4>
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
                        <p className="text-sm text-muted-foreground mb-2">
                          {feature.description}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {feature.estimatedTime}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      {feature.isCompleted ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-green-600">Completed</span>
                        </div>
                      ) : (
                        <Button 
                          onClick={() => handleModuleStart(feature.id)}
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <Play className="w-4 h-4" />
                          Start Learning
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {features.filter(f => f.isCompleted).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {features.filter(f => f.isCompleted).map((feature) => (
                    <div key={feature.id} className="p-4 border rounded-lg bg-green-50/50">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          {getFeatureIcon(feature.id)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{feature.name}</h4>
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <Badge variant="secondary" className={getDifficultyColor(feature.difficulty)}>
                              {feature.difficulty}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {feature.description}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {feature.estimatedTime}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t">
                        <Button 
                          onClick={() => handleModuleStart(feature.id)}
                          size="sm"
                          variant="outline"
                          className="w-full"
                        >
                          <BookOpen className="w-4 h-4 mr-2" />
                          Review Module
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Completed Modules Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start your AI learning journey by completing your first module.
                  </p>
                  <Button onClick={() => document.querySelector('[data-value="recommended"]')?.click()}>
                    Start Learning
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* AI Onboarding Module Modal */}
      {currentModule && (
        <AIOnboardingModules
          moduleId={currentModule}
          onComplete={handleModuleComplete}
          onSkip={handleModuleSkip}
          isVisible={isVisible}
          onClose={closeModule}
        />
      )}
    </>
  );
};

export { AIOnboardingDashboard };
export default AIOnboardingDashboard; 