import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Progress } from '@/shared/components/ui/Progress';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  User,
  Building2,
  Settings,
  ArrowRight,
  Sparkles,
  Zap,
  BarChart3,
  Users,
  Target,
  Calendar,
  FileText,
  Shield,
  Globe
} from 'lucide-react';
import { onboardingService } from '@/shared/services/OnboardingService';
import { useUserProfile } from '@/shared/contexts/UserContext';

interface OnboardingProgressDashboardProps {
  onComplete: () => void;
  onContinue: () => void;
}

export const OnboardingProgressDashboard: React.FC<OnboardingProgressDashboardProps> = ({
  onComplete,
  onContinue
}) => {
  const { profile, loading: profileLoading } = useUserProfile();
  const [loading, setLoading] = useState(true);
  const [completionData, setCompletionData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.id) {
      loadCompletionData();
    }
  }, [profile?.id]);

  const loadCompletionData = async () => {
    if (!profile?.id) return;

    setLoading(true);
    setError(null);

    try {
      const result = await onboardingService.checkOnboardingCompletion(profile.id);
      
      if (result.success && result.data) {
        setCompletionData(result.data);
      } else {
        setError(result.error || 'Failed to load completion data');
      }
    } catch (err) {
      setError('Error loading completion data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your progress...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={loadCompletionData} className="w-full">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!completionData) {
    return null;
  }

  const { 
    isCompleted, 
    userProfileComplete, 
    businessProfileComplete, 
    requiredModulesComplete,
    missingRequirements,
    completionPercentage 
  } = completionData;

  const sections = [
    {
      id: 'user-profile',
      title: 'Personal Profile',
      description: 'Complete your personal information',
      icon: <User className="w-5 h-5" />,
      completed: userProfileComplete,
      items: [
        { name: 'Full Name', completed: !!profile?.first_name && !!profile?.last_name },
        { name: 'Email Address', completed: !!profile?.email },
        { name: 'Role & Department', completed: !!profile?.role && !!profile?.department },
        { name: 'Contact Information', completed: !!profile?.phone || !!profile?.mobile }
      ]
    },
    {
      id: 'business-profile',
      title: 'Business Profile',
      description: 'Set up your company information',
      icon: <Building2 className="w-5 h-5" />,
      completed: businessProfileComplete,
      items: [
        { name: 'Company Name', completed: businessProfileComplete },
        { name: 'Industry', completed: businessProfileComplete },
        { name: 'Company Size', completed: businessProfileComplete },
        { name: 'Business Goals', completed: businessProfileComplete }
      ]
    },
    {
      id: 'onboarding-modules',
      title: 'Onboarding Modules',
      description: 'Complete required setup steps',
      icon: <Settings className="w-5 h-5" />,
      completed: requiredModulesComplete,
      items: [
        { name: 'Welcome & Introduction', completed: true },
        { name: 'Account Security', completed: requiredModulesComplete },
        { name: 'Preferences Setup', completed: requiredModulesComplete },
        { name: 'Integration Discovery', completed: requiredModulesComplete }
      ]
    }
  ];

  const getSectionProgress = (items: any[]) => {
    const completed = items.filter(item => item.completed).length;
    return (completed / items.length) * 100;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-primary/5 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">
            {isCompleted ? 'Setup Complete!' : 'Complete Your Setup'}
          </h1>
          <p className="text-muted-foreground text-lg">
            {isCompleted 
              ? 'You\'re all set to use Nexus!' 
              : 'Let\'s finish setting up your account'
            }
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {sections.map((section) => (
            <Card key={section.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${
                      section.completed 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {section.icon}
                    </div>
                    <CardTitle className="text-lg">{section.title}</CardTitle>
                  </div>
                  {section.completed && (
                    <Badge variant="secondary" className="text-xs">
                      Complete
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{section.description}</p>
                <Progress value={getSectionProgress(section.items)} className="mt-2" />
              </CardHeader>
              
              <CardContent>
                <div className="space-y-2">
                  {section.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      {item.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-gray-400" />
                      )}
                      <span className={item.completed ? 'text-foreground' : 'text-muted-foreground'}>
                        {item.name}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Overall Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Completion Status</span>
                <span>{Math.round(completionPercentage)}% Complete</span>
              </div>
              <Progress value={completionPercentage} className="w-full" />
              
              {!isCompleted && missingRequirements.length > 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Missing Requirements
                  </h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {missingRequirements.map((requirement, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <XCircle className="w-3 h-3" />
                        {requirement}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center gap-4">
          {isCompleted ? (
            <Button onClick={onComplete} className="px-8 py-3">
              Continue to Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={onContinue} className="px-8 py-3">
              Complete Setup
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
