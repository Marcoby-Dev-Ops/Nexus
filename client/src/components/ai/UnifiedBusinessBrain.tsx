/**
 * Unified Business Brain
 * 
 * The central intelligence system that powers every Nexus experience.
 * This is the core that makes all the vision statements true.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Progress } from '@/shared/components/ui/Progress';
import { 
  Brain, 
  TrendingUp, 
  Target, 
  Users, 
  DollarSign, 
  Lightbulb,
  AlertCircle,
  CheckCircle,
  Clock,
  Star,
  Zap,
  BookOpen,
  MessageSquare,
  Settings,
  BarChart3,
  Activity,
  Sparkles,
  ArrowRight,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '@/hooks/index';
import { useToast } from '@/shared/ui/components/Toast';

interface BrainAnalysis {
  id: string;
  type: 'action' | 'pattern' | 'opportunity' | 'risk' | 'learning';
  title: string;
  description: string;
  businessPrinciple: string;
  expertAdvice: string;
  implementation: string;
  expectedOutcome: string;
  confidence: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'sales' | 'marketing' | 'ops' | 'finance' | 'strategy' | 'customers';
  timestamp: string;
  userPhase: 'foundation' | 'intelligence' | 'mastery' | 'innovation';
  skillGap?: string;
  nextAction?: string;
}

interface UserTransformation {
  phase: 'foundation' | 'intelligence' | 'mastery' | 'innovation';
  daysInPhase: number;
  skillLevel: number; // 0-100
  confidence: number; // 0-100
  decisionsMade: number;
  mistakesAvoided: number;
  expertBehaviors: number;
  businessImpact: {
    revenueGrowth: number;
    efficiencyGain: number;
    customerSatisfaction: number;
    teamProductivity: number;
  };
}

interface BrainMetrics {
  actionsAnalyzed: number;
  expertRecommendations: number;
  predictiveInsights: number;
  learningEffectiveness: number;
  brainAccuracy: number;
  transformationProgress: number;
}

interface UnifiedBusinessBrainProps {
  className?: string;
  showDetails?: boolean;
  compact?: boolean;
}

export const UnifiedBusinessBrain: React.FC<UnifiedBusinessBrainProps> = ({ 
  className, 
  showDetails = true, 
  compact = false 
}) => {
  const [brainAnalyses, setBrainAnalyses] = useState<BrainAnalysis[]>([]);
  const [userTransformation, setUserTransformation] = useState<UserTransformation>({
    phase: 'foundation',
    daysInPhase: 15,
    skillLevel: 25,
    confidence: 30,
    decisionsMade: 12,
    mistakesAvoided: 8,
    expertBehaviors: 5,
    businessImpact: {
      revenueGrowth: 15,
      efficiencyGain: 20,
      customerSatisfaction: 25,
      teamProductivity: 18
    }
  });
  const [brainMetrics, setBrainMetrics] = useState<BrainMetrics>({
    actionsAnalyzed: 156,
    expertRecommendations: 89,
    predictiveInsights: 23,
    learningEffectiveness: 87,
    brainAccuracy: 94,
    transformationProgress: 35
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeAnalysis, setActiveAnalysis] = useState<BrainAnalysis | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Sample brain analyses that demonstrate the transformation
  useEffect(() => {
    setBrainAnalyses([
      {
        id: '1',
        type: 'action',
        title: 'Customer Onboarding Process Analysis',
        description: 'Analyzed your customer onboarding workflow and identified optimization opportunities',
        businessPrinciple: 'First impressions create lasting customer relationships',
        expertAdvice: 'Implement a 5-touch welcome sequence within 48 hours of signup',
        implementation: 'Set up automated email sequence with personalization based on customer type',
        expectedOutcome: '30% increase in customer activation and 25% reduction in early churn',
        confidence: 92,
        priority: 'high',
        category: 'customers',
        timestamp: new Date().toISOString(),
        userPhase: 'foundation',
        skillGap: 'Customer success fundamentals',
        nextAction: 'Review and implement the 5-touch sequence'
      },
      {
        id: '2',
        type: 'pattern',
        title: 'Revenue Growth Pattern Detected',
        description: 'Identified seasonal revenue patterns and growth opportunities',
        businessPrinciple: 'Predictable revenue growth comes from systematic processes',
        expertAdvice: 'Implement quarterly business reviews with 90-day action plans',
        implementation: 'Schedule QBRs with key metrics review and strategic planning',
        expectedOutcome: '40% more predictable revenue growth and better resource allocation',
        confidence: 88,
        priority: 'medium',
        category: 'finance',
        timestamp: new Date().toISOString(),
        userPhase: 'intelligence',
        nextAction: 'Schedule your first quarterly business review'
      },
      {
        id: '3',
        type: 'opportunity',
        title: 'Market Expansion Opportunity',
        description: 'Your organic reach is 3x your paid reach - ready for market expansion',
        businessPrinciple: 'Scale where you have proven product-market fit',
        expertAdvice: 'Launch targeted campaigns in adjacent markets with similar customer profiles',
        implementation: 'Identify 3 adjacent markets and create market-specific messaging',
        expectedOutcome: '200% increase in market reach and 50% growth in qualified leads',
        confidence: 85,
        priority: 'high',
        category: 'marketing',
        timestamp: new Date().toISOString(),
        userPhase: 'mastery',
        nextAction: 'Define your 3 target adjacent markets'
      }
    ]);
  }, []);

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'foundation': return 'bg-blue-500 text-white';
      case 'intelligence': return 'bg-green-500 text-white';
      case 'mastery': return 'bg-purple-500 text-white';
      case 'innovation': return 'bg-orange-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'action': return <Play className="w-4 h-4" />;
      case 'pattern': return <BarChart3 className="w-4 h-4" />;
      case 'opportunity': return <Lightbulb className="w-4 h-4" />;
      case 'risk': return <AlertCircle className="w-4 h-4" />;
      case 'learning': return <BookOpen className="w-4 h-4" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  const handleAnalyzeAction = async () => {
    setIsAnalyzing(true);
    
    // Simulate brain analysis
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const newAnalysis: BrainAnalysis = {
      id: Date.now().toString(),
      type: 'action',
      title: 'Real-time Action Analysis',
      description: 'Analyzed your recent business actions and identified optimization opportunities',
      businessPrinciple: 'Every action should move you closer to your business goals',
      expertAdvice: 'Focus on high-impact activities that align with your strategic objectives',
      implementation: 'Review your daily activities and prioritize based on business impact',
      expectedOutcome: '25% increase in productivity and better goal alignment',
      confidence: 90,
      priority: 'medium',
      category: 'strategy',
      timestamp: new Date().toISOString(),
      userPhase: userTransformation.phase,
      nextAction: 'Review your current activity priorities'
    };

    setBrainAnalyses(prev => [newAnalysis, ...prev]);
    setActiveAnalysis(newAnalysis);
    setIsAnalyzing(false);
    
    toast({
      title: "Brain Analysis Complete",
      description: "New insights available for your business",
      variant: "default",
    });
  };

  const handleImplementAdvice = (analysis: BrainAnalysis) => {
    toast({
      title: "Implementation Started",
      description: `Applying: ${analysis.title}`,
      variant: "default",
    });
    
    // Update user transformation metrics
    setUserTransformation(prev => ({
      ...prev,
      decisionsMade: prev.decisionsMade + 1,
      expertBehaviors: prev.expertBehaviors + 1,
      skillLevel: Math.min(100, prev.skillLevel + 2),
      confidence: Math.min(100, prev.confidence + 3)
    }));
  };

  if (compact) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Brain className="w-5 h-5 text-primary" />
            Business Brain
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Transformation Phase</span>
            <Badge className={getPhaseColor(userTransformation.phase)}>
              {userTransformation.phase.charAt(0).toUpperCase() + userTransformation.phase.slice(1)}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Skill Level</span>
              <span>{userTransformation.skillLevel}%</span>
            </div>
            <Progress value={userTransformation.skillLevel} className="h-2" />
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span>Brain Accuracy</span>
            <span>{brainMetrics.brainAccuracy}%</span>
          </div>
          
          <Button 
            onClick={handleAnalyzeAction}
            disabled={isAnalyzing}
            size="sm"
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3 mr-2" />
                Analyze Action
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Brain Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" />
            Unified Business Brain
          </h2>
          <p className="text-muted-foreground">
            Your 24/7 business intelligence system
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getPhaseColor(userTransformation.phase)}>
            Phase {userTransformation.phase.charAt(0).toUpperCase() + userTransformation.phase.slice(1)}
          </Badge>
          <Button 
            onClick={handleAnalyzeAction}
            disabled={isAnalyzing}
            size="sm"
          >
            {isAnalyzing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Analyze Action
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Transformation Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Your Business Transformation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{userTransformation.skillLevel}%</div>
              <div className="text-sm text-muted-foreground">Skill Level</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{userTransformation.confidence}%</div>
              <div className="text-sm text-muted-foreground">Confidence</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{userTransformation.decisionsMade}</div>
              <div className="text-sm text-muted-foreground">Expert Decisions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{userTransformation.mistakesAvoided}</div>
              <div className="text-sm text-muted-foreground">Mistakes Avoided</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Transformation Progress</span>
              <span>{brainMetrics.transformationProgress}%</span>
            </div>
            <Progress value={brainMetrics.transformationProgress} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Brain Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Brain Intelligence Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-lg font-bold">{brainMetrics.actionsAnalyzed}</div>
              <div className="text-sm text-muted-foreground">Actions Analyzed</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-lg font-bold">{brainMetrics.expertRecommendations}</div>
              <div className="text-sm text-muted-foreground">Expert Recommendations</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-lg font-bold">{brainMetrics.predictiveInsights}</div>
              <div className="text-sm text-muted-foreground">Predictive Insights</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-lg font-bold">{brainMetrics.learningEffectiveness}%</div>
              <div className="text-sm text-muted-foreground">Learning Effectiveness</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-lg font-bold">{brainMetrics.brainAccuracy}%</div>
              <div className="text-sm text-muted-foreground">Brain Accuracy</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-lg font-bold">{userTransformation.daysInPhase}</div>
              <div className="text-sm text-muted-foreground">Days in Phase</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Brain Analyses */}
      {showDetails && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Brain Analyses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {brainAnalyses.map((analysis) => (
                <Card 
                  key={analysis.id} 
                  className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                    activeAnalysis?.id === analysis.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setActiveAnalysis(activeAnalysis?.id === analysis.id ? null : analysis)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(analysis.type)}
                      <h4 className="font-semibold">{analysis.title}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor(analysis.priority)}>
                        {analysis.priority}
                      </Badge>
                      <Badge variant="outline">
                        {analysis.confidence}% confidence
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">
                    {analysis.description}
                  </p>
                  
                  {activeAnalysis?.id === analysis.id && (
                    <div className="space-y-3 mt-4 p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-primary mb-1">Business Principle:</p>
                        <p className="text-sm">{analysis.businessPrinciple}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-primary mb-1">Expert Advice:</p>
                        <p className="text-sm">{analysis.expertAdvice}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-primary mb-1">Implementation:</p>
                        <p className="text-sm">{analysis.implementation}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-primary mb-1">Expected Outcome:</p>
                        <p className="text-sm">{analysis.expectedOutcome}</p>
                      </div>
                      
                      <div className="flex items-center gap-2 pt-2">
                        <Button 
                          size="sm"
                          onClick={() => handleImplementAdvice(analysis)}
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Implement
                        </Button>
                        {analysis.nextAction && (
                          <Button variant="outline" size="sm">
                            <ArrowRight className="w-3 h-3 mr-1" />
                            {analysis.nextAction}
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground mt-3">
                    <span>{analysis.category}</span>
                    <span>{new Date(analysis.timestamp).toLocaleTimeString()}</span>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
