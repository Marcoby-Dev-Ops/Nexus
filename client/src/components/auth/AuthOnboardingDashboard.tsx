import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { Badge } from '@/shared/components/ui/Badge';
import { Progress } from '@/shared/components/ui/Progress';
import { Separator } from '@/shared/components/ui/Separator';
import { 
  User, 
  Shield, 
  Bell, 
  Eye, 
  Download, 
  Settings,
  CheckCircle,
  Clock,
  Play,
  GraduationCap,
  Target,
  BookOpen
} from 'lucide-react';
import { useAuthOnboarding } from '@/hooks/auth/useAuthOnboarding';
import { AuthOnboardingModules } from './AuthOnboardingModules';

interface AuthOnboardingDashboardProps {
  showProgress?: boolean;
  onModuleStart?: (moduleId: string) => void;
  onModuleComplete?: (moduleId: string) => void;
}

export function AuthOnboardingDashboard({ 
  showProgress = true,
  onModuleStart,
  onModuleComplete 
}: AuthOnboardingDashboardProps) {
  const {
    features,
    completionPercentage,
    recommendedModules,
    nextRecommendedModule,
    startModule,
    completeModule,
    skipModule,
    currentModule,
    isVisible,
    closeModule,
  } = useAuthOnboarding();

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
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            Auth Learning Center
          </CardTitle>
          <CardDescription>
            Master your account management and security features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="recommended" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="recommended">Recommended</TabsTrigger>
              <TabsTrigger value="all">All Modules</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>

            <TabsContent value="recommended" className="space-y-6">
              {showProgress && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Overall Progress</span>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(completionPercentage)}% complete
                    </span>
                  </div>
                  <Progress value={completionPercentage} className="w-full" />
                </div>
              )}

              {nextRecommendedModule && (
                <div className="p-4 border rounded-lg bg-primary/5">
                  <div className="flex items-center gap-3 mb-3">
                    <Target className="w-5 h-5 text-primary" />
                    <h4 className="font-semibold">Next Recommended</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      {getFeatureIcon(nextRecommendedModule.id)}
                      <div className="flex-1">
                        <h5 className="font-medium">{nextRecommendedModule.name}</h5>
                        <p className="text-sm text-muted-foreground">
                          {nextRecommendedModule.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getDifficultyColor(nextRecommendedModule.difficulty)}>
                          {nextRecommendedModule.difficulty}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {nextRecommendedModule.estimatedTime}m
                        </div>
                      </div>
                    </div>
                    <Button 
                      onClick={() => handleModuleStart(nextRecommendedModule.id)}
                      className="w-full"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start {nextRecommendedModule.name}
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <h4 className="font-semibold">Other Recommended Modules</h4>
                {recommendedModules.slice(1).map((module) => (
                  <div key={module.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getFeatureIcon(module.id)}
                        <div>
                          <h5 className="font-medium">{module.name}</h5>
                          <p className="text-sm text-muted-foreground">
                            {module.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getDifficultyColor(module.difficulty)}>
                          {module.difficulty}
                        </Badge>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleModuleStart(module.id)}
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="all" className="space-y-6">
              <div className="space-y-3">
                {features.map((module) => (
                  <div key={module.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getFeatureIcon(module.id)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h5 className="font-medium">{module.name}</h5>
                            {module.isCompleted && (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {module.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getDifficultyColor(module.difficulty)}>
                          {module.difficulty}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {module.estimatedTime}m
                        </div>
                        {module.isCompleted ? (
                          <Badge variant="secondary">Completed</Badge>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleModuleStart(module.id)}
                          >
                            <Play className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="completed" className="space-y-6">
              <div className="space-y-3">
                {features.filter(module => module.isCompleted).map((module) => (
                  <div key={module.id} className="p-4 border rounded-lg bg-green-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getFeatureIcon(module.id)}
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="font-medium">{module.name}</h5>
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {module.description}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">Completed</Badge>
                    </div>
                  </div>
                ))}
                
                {features.filter(module => module.isCompleted).length === 0 && (
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h4 className="font-medium mb-2">No completed modules yet</h4>
                    <p className="text-sm text-muted-foreground">
                      Start with the recommended modules to begin your learning journey.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <AuthOnboardingModules
        isOpen={isVisible}
        onClose={closeModule}
        onComplete={handleModuleComplete}
        onSkip={handleModuleSkip}
        moduleId={currentModule}
      />
    </>
  );
} 
