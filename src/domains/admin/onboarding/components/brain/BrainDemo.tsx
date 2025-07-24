/**
 * BrainDemo.tsx
 * Real-time Business Brain Analysis Demo
 * Shows progressive intelligence as user provides more information
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  TrendingUp, 
  Zap, 
  Lightbulb, 
  Target, 
  BarChart3,
  Sparkles,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Progress } from '@/shared/components/ui/Progress';

interface BrainDemoProps {
  userProfile?: any;
  systemIntelligence?: {
    understandingLevel: number;
    personalizedInsights: number;
    contextAccuracy: number;
    recommendationRelevance: number;
  };
  onInsightGenerated?: (insight: BrainInsight) => void;
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

interface AnalysisMetric {
  name: string;
  value: number;
  target: number;
  trend: 'up' | 'down' | 'stable';
  unit: string;
}

export const BrainDemo: React.FC<BrainDemoProps> = ({ 
  userProfile: userProfile, 
  systemIntelligence,
  onInsightGenerated 
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [insights, setInsights] = useState<BrainInsight[]>([]);
  const [metrics, setMetrics] = useState<AnalysisMetric[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<string>('');

  // Simulate progressive brain analysis
  useEffect(() => {
    if (systemIntelligence?.understandingLevel > 0) {
      startAnalysis();
    }
  }, [systemIntelligence?.understandingLevel]);

  const startAnalysis = () => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    
    const analysisSteps = [
      'Analyzing business context...',
      'Processing market data...',
      'Evaluating competitive landscape...',
      'Identifying optimization opportunities...',
      'Generating expert insights...',
      'Calculating impact metrics...'
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      setAnalysisProgress(prev => {
        const newProgress = prev + 16.67; // 100% / 6 steps
        setCurrentAnalysis(analysisSteps[currentStep]);
        currentStep++;
        
        if (newProgress >= 100) {
          clearInterval(interval);
          setIsAnalyzing(false);
          generateInsights();
          return 100;
        }
        return newProgress;
      });
    }, 1000);
  };

  const generateInsights = () => {
    const newInsights: BrainInsight[] = [
      {
        id: '1',
        type: 'opportunity',
        title: 'Revenue Optimization Opportunity',
        description: 'Based on your industry and current metrics, implementing dynamic pricing could increase revenue by 23%.',
        confidence: 87,
        impact: 'high',
        category: 'Pricing Strategy',
        timestamp: new Date()
      },
      {
        id: '2',
        type: 'optimization',
        title: 'Process Efficiency Improvement',
        description: 'Automating invoice processing could save 8 hours per week and reduce errors by 95%.',
        confidence: 92,
        impact: 'medium',
        category: 'Operations',
        timestamp: new Date()
      },
      {
        id: '3',
        type: 'strategy',
        title: 'Customer Retention Strategy',
        description: 'Implementing a follow-up sequence could improve customer retention by 34%.',
        confidence: 78,
        impact: 'high',
        category: 'Customer Success',
        timestamp: new Date()
      }
    ];

    setInsights(newInsights);
    
    // Generate metrics based on insights
    setMetrics([
      {
        name: 'Revenue Growth Potential',
        value: 23,
        target: 30,
        trend: 'up',
        unit: '%'
      },
      {
        name: 'Time Savings',
        value: 8,
        target: 10,
        trend: 'up',
        unit: 'hrs/week'
      },
      {
        name: 'Customer Retention',
        value: 34,
        target: 40,
        trend: 'up',
        unit: '%'
      }
    ]);

    // Notify parent component
    newInsights.forEach(insight => {
      onInsightGenerated?.(insight);
    });
  };

  const getInsightIcon = (type: BrainInsight['type']) => {
    switch (type) {
      case 'opportunity': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'risk': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'optimization': return <Zap className="w-4 h-4 text-blue-500" />;
      case 'strategy': return <Target className="w-4 h-4 text-purple-500" />;
    }
  };

  const getImpactColor = (impact: BrainInsight['impact']) => {
    switch (impact) {
      case 'high': return 'text-red-500 bg-red-50';
      case 'medium': return 'text-yellow-500 bg-yellow-50';
      case 'low': return 'text-green-500 bg-green-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Brain Analysis Header */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="inline-block p-4 bg-primary/10 rounded-full"
        >
          <Brain className="w-12 h-12 text-primary" />
        </motion.div>
        <h3 className="text-2xl font-bold">Your Business Brain Analysis</h3>
        <p className="text-muted-foreground">
          Real-time analysis powered by 20+ years of business expertise
        </p>
      </div>

      {/* System Intelligence Status */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Brain className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">Understanding</span>
            </div>
            <div className="text-2xl font-bold mt-2">{Math.round(systemIntelligence?.understandingLevel || 0)}%</div>
            <Progress value={systemIntelligence?.understandingLevel || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Lightbulb className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">Insights</span>
            </div>
            <div className="text-2xl font-bold mt-2">{Math.round(systemIntelligence?.personalizedInsights || 0)}</div>
            <Progress value={systemIntelligence?.personalizedInsights || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">Accuracy</span>
            </div>
            <div className="text-2xl font-bold mt-2">{Math.round(systemIntelligence?.contextAccuracy || 0)}%</div>
            <Progress value={systemIntelligence?.contextAccuracy || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">Relevance</span>
            </div>
            <div className="text-2xl font-bold mt-2">{Math.round(systemIntelligence?.recommendationRelevance || 0)}%</div>
            <Progress value={systemIntelligence?.recommendationRelevance || 0} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Live Analysis */}
      {isAnalyzing && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span>Live Analysis in Progress</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{currentAnalysis}</span>
              <span className="text-sm font-medium">{Math.round(analysisProgress)}%</span>
            </div>
            <Progress value={analysisProgress} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Generated Insights */}
      {insights.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold flex items-center space-x-2">
            <Lightbulb className="w-5 h-5 text-primary" />
            <span>Expert Insights Generated</span>
          </h4>
          
          <div className="grid gap-4">
            <AnimatePresence>
              {insights.map((insight, index) => (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.2 }}
                >
                  <Card className="border-l-4 border-l-primary">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          {getInsightIcon(insight.type)}
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h5 className="font-semibold">{insight.title}</h5>
                              <Badge variant="secondary" className={getImpactColor(insight.impact)}>
                                {insight.impact} impact
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {insight.description}
                            </p>
                            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                              <span className="flex items-center space-x-1">
                                <CheckCircle className="w-3 h-3" />
                                <span>{insight.confidence}% confidence</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>{insight.timestamp.toLocaleTimeString()}</span>
                              </span>
                              <span>{insight.category}</span>
                            </div>
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

      {/* Impact Metrics */}
      {metrics.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <span>Projected Impact</span>
          </h4>
          
          <div className="grid md: grid-cols-3 gap-4">
            {metrics.map((metric) => (
              <Card key={metric.name}>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-1">{metric.name}</div>
                    <div className="text-2xl font-bold text-primary">
                      {metric.value}{metric.unit}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Target: {metric.target}{metric.unit}
                    </div>
                    <div className="flex items-center justify-center mt-2">
                      <TrendingUp className={`w-4 h-4 ${metric.trend === 'up' ? 'text-green-500' : 'text-red-500'}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Progressive Learning Indicator */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <Sparkles className="w-5 h-5 text-primary" />
            <div className="flex-1">
              <div className="font-medium">Brain Getting Smarter</div>
              <div className="text-sm text-muted-foreground">
                As you provide more information, your brain generates more accurate and personalized insights.
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-primary">
                +{Math.round((systemIntelligence?.understandingLevel || 0) * 0.3)}%
              </div>
              <div className="text-xs text-muted-foreground">Intelligence Gain</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 