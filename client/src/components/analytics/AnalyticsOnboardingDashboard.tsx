import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Progress } from '@/shared/components/ui/Progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { 
  GraduationCap, 
  BarChart3, 
  TrendingUp, 
  Activity, 
  Database,
  CheckCircle, 
  Play, 
  Star, 
  Clock, 
  ArrowRight,
  Target,
  Users
} from 'lucide-react';
import useAnalyticsOnboarding from '@/hooks/analytics/useAnalyticsOnboarding';
import AnalyticsOnboardingModules from './AnalyticsOnboardingModules';

interface AnalyticsOnboardingDashboardProps {
  showProgress?: boolean;
  onModuleStart?: (moduleId: string) => void;
  onModuleComplete?: (moduleId: string) => void;
}

const AnalyticsOnboardingDashboard: React.FC<AnalyticsOnboardingDashboardProps> = ({
  showProgress = true, onModuleStart, onModuleComplete
}) => {
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
  } = useAnalyticsOnboarding();

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
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      {showProgress && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5" />
              Analytics Learning Progress
            </CardTitle>
            <CardDescription>
              Master your analytics capabilities step by step
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-muted-foreground">
                {Math.round(completionPercentage)}% Complete
              </span>
            </div>
            <Progress value={completionPercentage} className="w-full" />
            
            {nextRecommendedModule && (
              <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-sm">Next Recommended</p>
                    <p className="text-sm text-muted-foreground">
                      {nextRecommendedModule.name}
                    </p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => handleModuleStart(nextRecommendedModule.id)}
                >
                  Start
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modules Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle>Analytics Learning Modules</CardTitle>
          <CardDescription>
            Choose a module to start learning about analytics features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="recommended" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="recommended">Recommended</TabsTrigger>
              <TabsTrigger value="all">All Modules</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>

            <TabsContent value="recommended" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {recommendedModules.map((feature) => {
                  const Icon = getFeatureIcon(feature.id);
                  return (
                    <Card key={feature.id} className="relative">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className="w-5 h-5 text-blue-600" />
                            <CardTitle className="text-base">{feature.name}</CardTitle>
                          </div>
                          {feature.isRecommended && (
                            <Star className="w-4 h-4 text-yellow-500" />
                          )}
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
                        <Button 
                          className="w-full" 
                          onClick={() => handleModuleStart(feature.id)}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Start Learning
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="all" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {features.map((feature) => {
                  const Icon = getFeatureIcon(feature.id);
                  return (
                    <Card key={feature.id} className="relative">
                      {feature.isCompleted && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                      )}
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className="w-5 h-5 text-blue-600" />
                            <CardTitle className="text-base">{feature.name}</CardTitle>
                          </div>
                          {feature.isRecommended && (
                            <Star className="w-4 h-4 text-yellow-500" />
                          )}
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
                        <Button 
                          className="w-full" 
                          variant={feature.isCompleted ? "outline" : "default"}
                          onClick={() => handleModuleStart(feature.id)}
                        >
                          {feature.isCompleted ? (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Review
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 mr-2" />
                              Start Learning
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {features.filter(f => f.isCompleted).map((feature) => {
                  const Icon = getFeatureIcon(feature.id);
                  return (
                    <Card key={feature.id} className="relative">
                      <div className="absolute top-2 right-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                          <Icon className="w-5 h-5 text-green-600" />
                          <CardTitle className="text-base">{feature.name}</CardTitle>
                        </div>
                        <CardDescription className="text-sm">
                          {feature.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center justify-between mb-3">
                          <Badge className="bg-green-100 text-green-800">
                            Completed
                          </Badge>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {feature.estimatedTime}
                          </div>
                        </div>
                        <Button 
                          className="w-full" 
                          variant="outline"
                          onClick={() => handleModuleStart(feature.id)}
                        >
                          <ArrowRight className="w-4 h-4 mr-2" />
                          Review Module
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Onboarding Module Modal */}
      {currentModule && (
        <AnalyticsOnboardingModules
          moduleId={currentModule}
          isVisible={isVisible}
          onComplete={handleModuleComplete}
          onSkip={handleModuleSkip}
          onClose={closeModule}
        />
      )}
    </div>
  );
};

export default AnalyticsOnboardingDashboard; 
