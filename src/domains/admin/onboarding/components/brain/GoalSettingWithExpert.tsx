/**
 * GoalSettingWithExpert.tsx
 * Expert-guided goal setting with progressive intelligence
 * Shows expert recommendations based on business context
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, 
  TrendingUp, 
  Lightbulb, 
  Sparkles,
  CheckCircle,
  Clock,
  DollarSign,
  Zap,
  Award,
  Brain,
  ArrowRight
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Progress } from '@/shared/components/ui/Progress';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Textarea } from '@/shared/components/ui/Textarea';

interface GoalSettingWithExpertProps {
  userProfile?: any;
  systemIntelligence?: {
    understandingLevel: number;
    personalizedInsights: number;
    contextAccuracy: number;
  };
  onGoalsSet?: (goals: BusinessGoals) => void;
}

interface BusinessGoals {
  primary: Goal;
  secondary: Goal[];
  metrics: GoalMetric[];
  timeframes: Record<string, string>;
  expertRecommendations: ExpertRecommendation[];
}

interface Goal {
  id: string;
  title: string;
  description: string;
  category: 'revenue' | 'efficiency' | 'growth' | 'quality' | 'innovation';
  priority: 'high' | 'medium' | 'low';
  targetValue: number;
  currentValue: number;
  unit: string;
  timeframe: string;
  confidence: number;
  expertInsights: string[];
}

interface GoalMetric {
  name: string;
  current: number;
  target: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
}

interface ExpertRecommendation {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  timeframe: string;
  confidence: number;
  category: string;
}

export const GoalSettingWithExpert: React.FC<GoalSettingWithExpertProps> = ({ 
  userProfile: _userProfile, 
  systemIntelligence,
  onGoalsSet: _onGoalsSet 
}) => {
  const [goals, setGoals] = useState<BusinessGoals>({
    primary: {
      id: 'primary',
      title: '',
      description: '',
      category: 'revenue',
      priority: 'high',
      targetValue: 0,
      currentValue: 0,
      unit: '',
      timeframe: '',
      confidence: 0,
      expertInsights: []
    },
    secondary: [],
    metrics: [],
    timeframes: {},
    expertRecommendations: []
  });
  const [expertAnalysis, setExpertAnalysis] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [currentInsight, setCurrentInsight] = useState('');

  const goalCategories = [
    {
      id: 'revenue',
      name: 'Revenue Growth',
      icon: <DollarSign className="w-5 h-5" />,
      description: 'Increase sales and revenue',
      examples: ['Increase monthly revenue by 25%', 'Improve customer lifetime value', 'Optimize pricing strategy']
    },
    {
      id: 'efficiency',
      name: 'Operational Efficiency',
      icon: <Zap className="w-5 h-5" />,
      description: 'Streamline processes and reduce costs',
      examples: ['Reduce operational costs by 15%', 'Automate manual processes', 'Improve team productivity']
    },
    {
      id: 'growth',
      name: 'Business Growth',
      icon: <TrendingUp className="w-5 h-5" />,
      description: 'Expand market reach and customer base',
      examples: ['Enter new markets', 'Increase market share', 'Launch new products/services']
    },
    {
      id: 'quality',
      name: 'Quality & Customer Success',
      icon: <Award className="w-5 h-5" />,
      description: 'Improve customer satisfaction and retention',
      examples: ['Improve customer satisfaction score', 'Reduce customer churn', 'Enhance product quality']
    },
    {
      id: 'innovation',
      name: 'Innovation & Development',
      icon: <Lightbulb className="w-5 h-5" />,
      description: 'Develop new capabilities and innovations',
      examples: ['Launch new product features', 'Implement new technologies', 'Develop strategic partnerships']
    }
  ];

  // Simulate expert analysis based on system intelligence
  useEffect(() => {
    if (systemIntelligence?.understandingLevel > 30) {
      startExpertAnalysis();
    }
  }, [systemIntelligence?.understandingLevel]);

  const startExpertAnalysis = () => {
    setExpertAnalysis(true);
    setAnalysisProgress(0);
    
    const analysisSteps = [
      'Analyzing business context...',
      'Evaluating market opportunities...',
      'Identifying growth potential...',
      'Calculating optimal targets...',
      'Generating expert recommendations...',
      'Finalizing goal strategy...'
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      setAnalysisProgress(prev => {
        const newProgress = prev + 16.67;
        setCurrentInsight(analysisSteps[currentStep]);
        currentStep++;
        
        if (newProgress >= 100) {
          clearInterval(interval);
          setExpertAnalysis(false);
          generateExpertRecommendations();
          return 100;
        }
        return newProgress;
      });
    }, 1500);
  };

  const generateExpertRecommendations = () => {
    const recommendations: ExpertRecommendation[] = [
      {
        id: '1',
        title: 'Revenue Optimization Strategy',
        description: 'Based on your industry and current metrics, focus on pricing optimization and customer retention.',
        impact: 'high',
        effort: 'medium',
        timeframe: '3-6 months',
        confidence: 85,
        category: 'revenue'
      },
      {
        id: '2',
        title: 'Process Automation Implementation',
        description: 'Automate repetitive tasks to improve efficiency and reduce operational costs.',
        impact: 'medium',
        effort: 'low',
        timeframe: '1-2 months',
        confidence: 92,
        category: 'efficiency'
      },
      {
        id: '3',
        title: 'Market Expansion Plan',
        description: 'Identify and enter new market segments to drive growth.',
        impact: 'high',
        effort: 'high',
        timeframe: '6-12 months',
        confidence: 78,
        category: 'growth'
      }
    ];

    setGoals(prev => ({
      ...prev,
      expertRecommendations: recommendations
    }));
  };

  const handleGoalUpdate = (field: keyof Goal, value: any) => {
    setGoals(prev => ({
      ...prev,
      primary: {
        ...prev.primary,
        [field]: value
      }
    }));
  };

  const getCategoryIcon = (category: string) => {
    const cat = goalCategories.find(c => c.id === category);
    return cat?.icon || <Target className="w-5 h-5" />;
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-500 bg-red-50';
      case 'medium': return 'text-yellow-500 bg-yellow-50';
      case 'low': return 'text-green-500 bg-green-50';
      default: return 'text-blue-500 bg-blue-50';
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-blue-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="inline-block p-4 bg-primary/10 rounded-full"
        >
          <Target className="w-12 h-12 text-primary" />
        </motion.div>
        <h3 className="text-2xl font-bold text-foreground">Define Your Success</h3>
        <p className="text-foreground/70">
          Set goals with expert-level business guidance
        </p>
      </div>

      {/* Expert Analysis */}
      {expertAnalysis && (
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="w-5 h-5 text-primary" />
              <span>Expert Analysis in Progress</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground/70">{currentInsight}</span>
              <span className="text-sm font-medium text-foreground">{Math.round(analysisProgress)}%</span>
            </div>
            <Progress value={analysisProgress} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Goal Categories */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {goalCategories.map((category) => (
          <Card 
            key={category.id}
            className={`cursor-pointer transition-all duration-300 ${
              goals.primary.category === category.id 
                ? 'ring-2 ring-primary shadow-lg' 
                : 'hover:shadow-md'
            }`}
            onClick={() => handleGoalUpdate('category', category.id)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-lg">
                {category.icon}
                <span>{category.name}</span>
                {goals.primary.category === category.id && (
                  <Badge variant="secondary" className="ml-auto">
                    Selected
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-foreground/70">
                {category.description}
              </p>
              
              <div className="space-y-1">
                <div className="text-xs font-medium text-primary">Examples:</div>
                {category.examples.slice(0, 2).map((example, index) => (
                  <div key={index} className="text-xs text-foreground/70 flex items-center space-x-1">
                    <div className="w-1 h-1 bg-primary rounded-full" />
                    <span>{example}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Primary Goal Setting */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {getCategoryIcon(goals.primary.category)}
            <span>Primary Goal</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">Goal Title</label>
              <Input
                type="text"
                value={goals.primary.title}
                onChange={(e) => handleGoalUpdate('title', e.target.value)}
                placeholder="e.g., Increase monthly revenue by 25%"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-foreground">Timeframe</label>
              <select
                value={goals.primary.timeframe}
                onChange={(e) => handleGoalUpdate('timeframe', e.target.value)}
                className="w-full mt-1 p-2 border rounded-md bg-background text-foreground"
              >
                <option value="">Select timeframe</option>
                <option value="1 month">1 month</option>
                <option value="3 months">3 months</option>
                <option value="6 months">6 months</option>
                <option value="1 year">1 year</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Description</label>
            <Textarea
              value={goals.primary.description}
              onChange={(e) => handleGoalUpdate('description', e.target.value)}
              placeholder="Describe your goal in detail..."
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">Current Value</label>
              <Input
                type="number"
                value={goals.primary.currentValue}
                onChange={(e) => handleGoalUpdate('currentValue', parseFloat(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-foreground">Target Value</label>
              <Input
                type="number"
                value={goals.primary.targetValue}
                onChange={(e) => handleGoalUpdate('targetValue', parseFloat(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-foreground">Unit</label>
              <Input
                type="text"
                value={goals.primary.unit}
                onChange={(e) => handleGoalUpdate('unit', e.target.value)}
                placeholder="%, $, customers, etc."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expert Recommendations */}
      {goals.expertRecommendations.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold flex items-center space-x-2">
            <Lightbulb className="w-5 h-5 text-primary" />
            <span>Expert Recommendations</span>
          </h4>
          
          <div className="grid gap-4">
            <AnimatePresence>
              {goals.expertRecommendations.map((recommendation, index) => (
                <motion.div
                  key={recommendation.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.2 }}
                >
                  <Card className="border-l-4 border-l-primary">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h5 className="font-semibold">{recommendation.title}</h5>
                            <Badge variant="secondary" className={getImpactColor(recommendation.impact)}>
                              {recommendation.impact} impact
                            </Badge>
                            <Badge variant="outline" className={getEffortColor(recommendation.effort)}>
                              {recommendation.effort} effort
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {recommendation.description}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <span className="flex items-center space-x-1">
                              <CheckCircle className="w-3 h-3" />
                              <span>{recommendation.confidence}% confidence</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{recommendation.timeframe}</span>
                            </span>
                            <span>{recommendation.category}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Intelligence Growth Indicator */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <Sparkles className="w-5 h-5 text-primary" />
            <div className="flex-1">
              <div className="font-medium">Expert Goal Guidance</div>
              <div className="text-sm text-muted-foreground">
                Your brain is analyzing your goals and providing expert-level recommendations 
                based on {Math.round(systemIntelligence?.understandingLevel || 0)}% understanding of your business.
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-primary">
                {goals.expertRecommendations.length}
              </div>
              <div className="text-xs text-muted-foreground">Recommendations</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Continue Button */}
      <div className="flex justify-center pt-6">
        <Button
          onClick={() => _onGoalsSet?.(goals)}
          disabled={!goals.primary.title || !goals.primary.timeframe}
          className="px-8 py-3 text-lg"
        >
          Continue to Next Step
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}; 