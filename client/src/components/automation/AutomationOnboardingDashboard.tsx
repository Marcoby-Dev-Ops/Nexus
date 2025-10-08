import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { Badge } from '@/shared/components/ui/Badge';
import { Progress } from '@/shared/components/ui/Progress';
import { Separator } from '@/shared/components/ui/Separator';
import {
  Zap,
  Workflow,
  Target,
  CheckCircle,
  Clock,
  Play,
  GraduationCap,
  BookOpen,
  Settings
} from 'lucide-react';
import { useAutomationOnboarding } from '@/hooks/automation/useAutomationOnboarding';
import { AutomationOnboardingModules } from './AutomationOnboardingModules';

interface AutomationOnboardingDashboardProps {
  showProgress?: boolean;
  onModuleStart?: (moduleId: string) => void;
  onModuleComplete?: (moduleId: string) => void;
}

export function AutomationOnboardingDashboard({
  showProgress = false,
  onModuleStart,
  onModuleComplete
}: AutomationOnboardingDashboardProps) {
  const {
    features,
    completionPercentage,
    recommendedModules,
    nextRecommendedModule,
    startModule,
    completeModule,
    skipModule,
    closeModule,
    isVisible,
    currentModule
  } = useAutomationOnboarding();

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
      case 'beginner': return 'bg-success/10 text-success';
      case 'intermediate': return 'bg-warning/10 text-warning-foreground';
      case 'advanced': return 'bg-destructive/10 text-destructive';
      default: return 'bg-muted/50 text-muted-foreground';
    }
  };

  const getFeatureIcon = (featureId: string) => {
    switch (featureId) {
      case 'workflow-basics': return <Workflow className="w-4 h-4" />;
      case 'recipe-deployment': return <Zap className="w-4 h-4" />;
      case 'advanced-workflows': return <Settings className="w-4 h-4" />;
      case 'workflow-monitoring': return <Target className="w-4 h-4" />;
      case 'integration-setup': return <BookOpen className="w-4 h-4" />;
      case 'workflow-optimization': return <GraduationCap className="w-4 h-4" />;
      default: return <Workflow className="w-4 h-4" />;
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
              Automation Learning Progress
            </CardTitle>
            <CardDescription>
              Track your automation workflow learning journey
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span>{Math.round(completionPercentage)}%</span>
              </div>
              <Progress value={completionPercentage} className="h-2" />
            </div>
            
            {nextRecommendedModule && (
              <div className="p-4 bg-primary/5 rounded-lg">
                <h4 className="font-medium mb-2">Next Recommended</h4>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getFeatureIcon(nextRecommendedModule.id)}
                    <span>{nextRecommendedModule.name}</span>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => handleModuleStart(nextRecommendedModule.id)}
                  >
                    <Play className="w-3 h-3 mr-1" />
                    Start
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Module Browser */}
      <Card>
        <CardHeader>
          <CardTitle>Automation Learning Modules</CardTitle>
          <CardDescription>
            Master automation workflows with interactive tutorials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="recommended" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="recommended">Recommended</TabsTrigger>
              <TabsTrigger value="all">All Modules</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>

            <TabsContent value="recommended" className="space-y-4">
              {recommendedModules.length > 0 ? (
                recommendedModules.map((feature) => (
                  <div key={feature.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {getFeatureIcon(feature.id)}
                        <div className="flex-1">
                          <h4 className="font-medium">{feature.name}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{feature.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className={getDifficultyColor(feature.difficulty)}>
                              {feature.difficulty}
                            </Badge>
                            <Badge variant="outline">
                              <Clock className="w-3 h-3 mr-1" />
                              {feature.estimatedTime} min
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => handleModuleStart(feature.id)}
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Start
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                  <p>All recommended modules completed!</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="all" className="space-y-4">
              {features.map((feature) => (
                <div key={feature.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getFeatureIcon(feature.id)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{feature.name}</h4>
                          {feature.isCompleted && (
                            <CheckCircle className="w-4 h-4 text-success" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{feature.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className={getDifficultyColor(feature.difficulty)}>
                            {feature.difficulty}
                          </Badge>
                          <Badge variant="outline">
                            <Clock className="w-3 h-3 mr-1" />
                            {feature.estimatedTime} min
                          </Badge>
                          {feature.isRecommended && (
                            <Badge variant="secondary">Recommended</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant={feature.isCompleted ? "outline" : "default"}
                      onClick={() => handleModuleStart(feature.id)}
                      disabled={feature.isCompleted}
                    >
                      {feature.isCompleted ? (
                        <>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Completed
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 mr-1" />
                          Start
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {features.filter(f => f.isCompleted).length > 0 ? (
                features.filter(f => f.isCompleted).map((feature) => (
                  <div key={feature.id} className="p-4 border rounded-lg bg-success/5">
                    <div className="flex items-start gap-3">
                      {getFeatureIcon(feature.id)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{feature.name}</h4>
                          <CheckCircle className="w-4 h-4 text-success" />
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{feature.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className={getDifficultyColor(feature.difficulty)}>
                            {feature.difficulty}
                          </Badge>
                          <Badge variant="outline">
                            <Clock className="w-3 h-3 mr-1" />
                            {feature.estimatedTime} min
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="w-8 h-8 mx-auto mb-2" />
                  <p>No modules completed yet. Start with the recommended modules!</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Onboarding Modules Modal */}
      <AutomationOnboardingModules
        isOpen={isVisible}
        onClose={closeModule}
        onComplete={handleModuleComplete}
        onSkip={handleModuleSkip}
        featureId={currentModule || undefined}
      />
    </div>
  );
} 
