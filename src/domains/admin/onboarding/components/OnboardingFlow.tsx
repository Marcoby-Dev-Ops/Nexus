/**
 * OnboardingFlow.tsx
 * Main onboarding flow component with brain integration
 * Now includes progressive intelligence and user personalization
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  User, 
  Sparkles, 
  TrendingUp,
  CheckCircle,
  Target
} from 'lucide-react';

import { useAuthContext } from '@/domains/admin/user/hooks/AuthContext';
import { Button } from '@/shared/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Progress } from '@/shared/components/ui/Progress';

// Brain Integration Components
import { UnifiedBrainOnboarding } from './UnifiedBrainOnboarding';

interface OnboardingFlowProps {
  onComplete: () => void;
  className?: string;
}

interface BrainInsight {
  id: string;
  type: 'opportunity' | 'risk' | 'optimization' | 'strategy';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  category: string;
  timestamp: Date;
}

interface ExpertKnowledge {
  id: string;
  domain: string;
  principle: string;
  description: string;
  application: string;
  confidence: number;
  relevance: number;
  source: string;
  timestamp: Date;
}

interface SystemIntelligence {
  understandingLevel: number;
  personalizedInsights: number;
  contextAccuracy: number;
  recommendationRelevance: number;
  learningProgress: number;
  lastUpdated: Date;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ 
  onComplete, 
  className = '' 
}) => {
  const { user } = useAuthContext();
  

  const [currentFlow] = useState<'unified-brain' | 'traditional' | 'ai-chat' | 'founder' | 'checklist'>('unified-brain');
  const [brainInsights] = useState<BrainInsight[]>([]);
  const [expertKnowledge] = useState<ExpertKnowledge[]>([]);
  const [systemIntelligence, setSystemIntelligence] = useState<SystemIntelligence>({
    understandingLevel: 0,
    personalizedInsights: 0,
    contextAccuracy: 0,
    recommendationRelevance: 0,
    learningProgress: 0,
    lastUpdated: new Date()
  });

  const getUserDisplayName = () => {
    if (user?.profile?.first_name) return user.profile.first_name;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };

  const handleFlowComplete = () => {
    // Final intelligence assessment
    const finalIntelligence = {
      ...systemIntelligence,
      understandingLevel: Math.min(100, systemIntelligence.understandingLevel + 20),
      learningProgress: Math.min(100, systemIntelligence.learningProgress + 30)
    };
    
    setSystemIntelligence(finalIntelligence);
    
    // Log completion with intelligence metrics
    console.log('Onboarding Complete - Final Intelligence:', finalIntelligence);
    console.log('Brain Insights Generated:', brainInsights.length);
    console.log('Expert Knowledge Applied:', expertKnowledge.length);
    
    onComplete();
  };

  // Progressive intelligence updates
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemIntelligence(prev => ({
        ...prev,
        learningProgress: Math.min(100, prev.learningProgress + 1),
        lastUpdated: new Date()
      }));
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`min-h-screen bg-gradient-to-br from-background via-muted/30 to-primary/5 ${className}`}>
      {/* Header with User Context and Intelligence Status */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Brain className="w-8 h-8 text-primary" />
                <h1 className="text-xl font-bold">Nexus Business Brain</h1>
              </div>
              <Badge variant="secondary" className="ml-2">
                {currentFlow === 'unified-brain' ? 'Unified Brain Flow' : 'Traditional Flow'}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* User Context */}
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {getUserDisplayName()}
                </span>
              </div>

              {/* System Intelligence Indicator */}
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">
                  {Math.round(systemIntelligence.understandingLevel)}% Understanding
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">
                  {brainInsights.length} Insights
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">
                  {expertKnowledge.length} Principles
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Intelligence Progress Bar */}
      <div className="bg-muted/50 border-b">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>System Intelligence</span>
            <span>{Math.round(systemIntelligence.understandingLevel)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-1 mt-1">
            <div
              className="bg-gradient-to-r from-primary to-primary/60 h-1 rounded-full transition-all duration-500"
              style={{ width: `${systemIntelligence.understandingLevel}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {currentFlow === 'unified-brain' ? (
            <motion.div
              key="unified-brain"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <UnifiedBrainOnboarding 
                onComplete={handleFlowComplete}
                className=""
              />
            </motion.div>
          ) : (
            <motion.div
              key="traditional"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <TraditionalOnboarding 
                onComplete={handleFlowComplete}
                user={user}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Brain Intelligence Dashboard (Floating) */}
      {(brainInsights.length > 0 || expertKnowledge.length > 0) && (
        <div className="fixed bottom-4 right-4 z-50">
          <Card className="w-80 shadow-lg border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-sm">
                <Brain className="w-4 h-4 text-primary" />
                <span>Brain Intelligence</span>
                <Badge variant="secondary" className="ml-auto text-xs">
                  Live
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="text-center p-2 bg-primary/5 rounded">
                  <div className="text-lg font-bold text-primary">{brainInsights.length}</div>
                  <div className="text-muted-foreground">Insights</div>
                </div>
                <div className="text-center p-2 bg-primary/5 rounded">
                  <div className="text-lg font-bold text-primary">{expertKnowledge.length}</div>
                  <div className="text-muted-foreground">Principles</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span>Understanding</span>
                  <span className="font-medium">{Math.round(systemIntelligence.understandingLevel)}%</span>
                </div>
                <Progress value={systemIntelligence.understandingLevel} className="h-1" />
                
                <div className="flex items-center justify-between text-xs">
                  <span>Learning</span>
                  <span className="font-medium">{Math.round(systemIntelligence.learningProgress)}%</span>
                </div>
                <Progress value={systemIntelligence.learningProgress} className="h-1" />
              </div>

              <div className="text-xs text-muted-foreground">
                Last updated: {systemIntelligence.lastUpdated.toLocaleTimeString()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

// Traditional onboarding fallback
const TraditionalOnboarding: React.FC<{
  onComplete: () => void;
  user: any;
}> = ({ onComplete, user }) => {
  const getUserFirstName = () => {
    if (user?.profile?.first_name) return user.profile.first_name;
    if (user?.email) return user.email.split('@')[0];
    return 'there';
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="inline-block p-4 bg-primary/10 rounded-full"
        >
          <Brain className="w-12 h-12 text-primary" />
        </motion.div>
        <h2 className="text-3xl font-bold">Welcome, {getUserFirstName()}!</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Let's get you set up with Nexus. This traditional onboarding will guide you through the basics.
        </p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Traditional Onboarding</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            This is a fallback onboarding flow. For the full brain-powered experience, 
            please use the Unified Brain Onboarding.
          </p>
          
          <div className="flex justify-center">
            <Button onClick={onComplete}>
              Complete Traditional Onboarding
              <CheckCircle className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 