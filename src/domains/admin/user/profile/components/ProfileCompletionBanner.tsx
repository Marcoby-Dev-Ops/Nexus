import React, { useState } from 'react';
import { Card, CardContent } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Progress } from '@/shared/components/ui/Progress';
import { Badge } from '@/shared/components/ui/Badge';
import { User, Brain, X, ChevronRight, Sparkles, Target, Clock } from 'lucide-react';
import { useAuth } from '@/core/auth/AuthProvider';
import { useNavigate } from 'react-router-dom';

interface ProfileCompletionBannerProps {
  onDismiss?: () => void;
  showDetailed?: boolean;
}

export const ProfileCompletionBanner: React.FC<ProfileCompletionBannerProps> = ({ 
  onDismiss, 
  showDetailed = false 
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  // Calculate profile completion
  const calculateCompletion = () => {
    if (!user?.profile) return 0;
    
    const essentialFields = [
      'first_name', 'last_name', 'job_title', 'department', 
      'location', 'timezone', 'bio'
    ];
    
    const ragContextFields = [
      'skills', 'role', 'work_location'
    ];
    
    const allFields = [...essentialFields, ...ragContextFields];
    const completedFields = allFields.filter(field => {
      const value = user.profile?.[field as keyof typeof user.profile];
      return value && value !== '';
    });
    
    return Math.round((completedFields.length / allFields.length) * 100);
  };

  const completion = calculateCompletion();
  const displayName = user?.profile?.display_name || 
                     user?.profile?.first_name || 
                     user?.full_name || 
                     user?.email?.split('@')[0] || 
                     'User';

  const getAIQualityLevel = (completion: number) => {
    if (completion >= 80) return { level: 'Expert', color: 'bg-success', description: 'Highly personalized responses' };
    if (completion >= 60) return { level: 'Good', color: 'bg-primary', description: 'Contextual responses' };
    if (completion >= 40) return { level: 'Basic', color: 'bg-warning', description: 'Some personalization' };
    return { level: 'Generic', color: 'bg-muted', description: 'Standard responses only' };
  };

  const aiQuality = getAIQualityLevel(completion);

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  const handleCompleteProfile = () => {
    navigate('/onboarding');
  };

  if (completion >= 90) return null; // Don't show if profile is nearly complete

  return (
    <Card className="border-l-4 border-l-primary bg-gradient-to-r from-primary/5 to-background">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-4 mb-4">
              <div className="relative">
                <User className="h-8 w-8 text-primary" />
                <div className="absolute -top-1 -right-1 h-4 w-4 bg-warning rounded-full flex items-center justify-center">
                  <span className="text-xs text-primary-foreground font-bold">!</span>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold">
                  Hi {displayName}! Help Nexus understand you better
                </h3>
                <p className="text-sm text-muted-foreground">
                  Complete your profile to unlock personalized AI assistance
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Progress Section */}
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Profile Completion</span>
                    <span className="text-sm text-muted-foreground">{completion}%</span>
                  </div>
                  <Progress value={completion} className="h-2" />
                </div>
                <Badge 
                  variant="outline" 
                  className={`${aiQuality.color} text-primary-foreground border-none`}
                >
                  AI Quality: {aiQuality.level}
                </Badge>
              </div>

              {/* Benefits Preview */}
              {showDetailed && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="flex items-center space-x-4 p-4 bg-background/50 rounded-lg">
                    <Brain className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Smarter Responses</p>
                      <p className="text-xs text-muted-foreground">AI understands your role & goals</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 p-4 bg-background/50 rounded-lg">
                    <Target className="h-5 w-5 text-success" />
                    <div>
                      <p className="text-sm font-medium">Relevant Insights</p>
                      <p className="text-xs text-muted-foreground">Tailored to your department</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 p-4 bg-background/50 rounded-lg">
                    <Clock className="h-5 w-5 text-secondary" />
                    <div>
                      <p className="text-sm font-medium">Time Savings</p>
                      <p className="text-xs text-muted-foreground">Skip repetitive explanations</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Before/After Example */}
              <div className="bg-background/30 rounded-lg p-4 space-y-4">
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-4 w-4 text-warning" />
                  <span className="text-sm font-medium">See the difference: </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <p className="font-medium text-destructive">Generic Response:</p>
                    <p className="text-muted-foreground italic">
                      "Here's your sales data. Revenue is $187K this month."
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium text-success">Personalized Response:</p>
                    <p className="text-muted-foreground italic">
                      "{displayName}, as {user?.profile?.job_title || 'your role'}, your $187K revenue is 15% above target. Focus on the $340K deal closing next week."
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-4">
                <Button onClick={handleCompleteProfile} className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Complete Profile</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleDismiss}>
                  Maybe Later
                </Button>
              </div>
            </div>
          </div>

          {/* Dismiss Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="ml-4"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}; 