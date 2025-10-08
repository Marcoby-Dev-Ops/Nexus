/**
 * Onboarding-Aware Homepage Component
 * 
 * Provides a personalized homepage experience for users who have completed onboarding.
 * Transforms onboarding data into a unified brain system experience with pre-populated
 * Identity blocks and business context.
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/shared/hooks/useAuth';
import { onboardingBrainIntegrationService, type HomepageState } from '@/shared/services/OnboardingBrainIntegrationService';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/Badge';
import { Progress } from '@/shared/components/ui/Progress';
import { 
  Building2, 
  Target, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight,
  Brain,
  Users,
  DollarSign,
  Settings,
  BookOpen,
  Truck,
  Palette
} from 'lucide-react';

interface OnboardingAwareHomepageProps {
  className?: string;
}

export const OnboardingAwareHomepage: React.FC<OnboardingAwareHomepageProps> = ({ 
  className = '' 
}) => {
  const { user } = useAuth();
  const [homepageState, setHomepageState] = useState<HomepageState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadHomepageState();
    }
  }, [user?.id]);

  const loadHomepageState = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const result = await onboardingBrainIntegrationService.getHomepageState(user.id);
      
      if (result.success && result.data) {
        setHomepageState(result.data);
      } else {
        setError(result.error || 'Failed to load homepage state');
      }
    } catch (err) {
      setError('An error occurred while loading your homepage');
      console.error('Homepage state error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-[400px] ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your personalized dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center min-h-[400px] ${className}`}>
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-4" />
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={loadHomepageState} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!homepageState) {
    return null;
  }

  // If user hasn't completed onboarding, show default homepage
  if (!homepageState.onboardingCompleted) {
    return <DefaultHomepage className={className} />;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Welcome Banner */}
      <WelcomeBanner homepageState={homepageState} />
      
      {/* Business Health Overview */}
      <BusinessHealthCard homepageState={homepageState} />
      

      
      {/* Recommended Actions */}
      <RecommendedActionsCard homepageState={homepageState} />
      
      {/* AI Assistant Recommendations */}
      <AIAssistantsCard homepageState={homepageState} />
    </div>
  );
};

// Welcome Banner Component
const WelcomeBanner: React.FC<{ homepageState: HomepageState }> = ({ homepageState }) => {
  const brainData = homepageState.brainData;
  
  if (!brainData) return null;

  return (
    <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">
              Welcome back, {brainData.identity.name}! 👋
            </h1>
            <p className="text-muted-foreground">
              Your {brainData.identity.company} dashboard is ready with personalized insights and recommendations.
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Building2 className="h-4 w-4" />
                {brainData.identity.industry} • {brainData.identity.size}
              </span>
              <span className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                {brainData.businessContext.priorities.length} priorities set
              </span>
            </div>
          </div>
          <div className="text-right">
            <Badge variant="secondary" className="mb-2">
              Business Health: {homepageState.businessHealthScore}%
            </Badge>
            <div className="text-sm text-muted-foreground">
              Baseline established
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Business Health Card Component
const BusinessHealthCard: React.FC<{ homepageState: HomepageState }> = ({ homepageState }) => {
  const brainData = homepageState.brainData;
  
  if (!brainData) return null;

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (score >= 60) return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    return <AlertCircle className="h-5 w-5 text-red-600" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Business Health Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {getHealthIcon(homepageState.businessHealthScore)}
              <span className={`font-semibold ${getHealthColor(homepageState.businessHealthScore)}`}>
                {homepageState.businessHealthScore}% Overall Health
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Based on your onboarding data and tool configuration
            </p>
          </div>
          <Button variant="outline" size="sm">
            View Details
          </Button>
        </div>
        
        <Progress value={homepageState.businessHealthScore} className="h-2" />
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="text-center">
            <div className="font-semibold">{brainData.businessContext.maturityScore}%</div>
            <div className="text-muted-foreground">Maturity</div>
          </div>
          <div className="text-center">
            <div className="font-semibold">{brainData.aiAssistants.recommended.length}</div>
            <div className="text-muted-foreground">AI Assistants</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};



// Recommended Actions Card Component
const RecommendedActionsCard: React.FC<{ homepageState: HomepageState }> = ({ homepageState }) => {
  if (homepageState.recommendedActions.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Recommended Next Steps
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Based on your business profile and current setup
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {homepageState.recommendedActions.map((action, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm">{action}</span>
              <Button variant="ghost" size="sm">
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// AI Assistants Card Component
const AIAssistantsCard: React.FC<{ homepageState: HomepageState }> = ({ homepageState }) => {
  const brainData = homepageState.brainData;
  
  if (!brainData || brainData.aiAssistants.recommended.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Recommended AI Assistants
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          AI assistants tailored to your business needs
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {brainData.aiAssistants.recommended.map((assistant, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-sm font-medium">{assistant}</span>
              </div>
              <Button variant="outline" size="sm">
                Activate
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Default Homepage Component (for users who haven't completed onboarding)
const DefaultHomepage: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <Brain className="h-12 w-12 text-primary mx-auto" />
            <h1 className="text-2xl font-bold">Welcome to Nexus</h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Complete your onboarding to unlock personalized business insights and AI-powered recommendations.
            </p>
            <Button>
              Start Onboarding
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingAwareHomepage;
