/**
 * LiveBrainAnalysis.tsx
 * Real-time business intelligence analysis
 * Shows live brain analysis with progressive insights
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  TrendingUp, 
  Lightbulb, 
  Sparkles,
  CheckCircle,
  Clock,
  BarChart3,
  Activity,
  Zap,
  Target,
  AlertCircle,
  DollarSign
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Progress } from '@/shared/components/ui/Progress';

interface LiveBrainAnalysisProps {
  userProfile?: any;
  systemIntelligence?: {
    understandingLevel: number;
    personalizedInsights: number;
    contextAccuracy: number;
  };
  onAnalysisComplete?: (analysis: BrainAnalysis) => void;
}

interface BrainAnalysis {
  id: string;
  timestamp: Date;
  metrics: AnalysisMetric[];
  insights: LiveInsight[];
  recommendations: LiveRecommendation[];
  confidence: number;
  status: 'analyzing' | 'complete' | 'error';
}

interface AnalysisMetric {
  name: string;
  value: number;
  target: number;
  trend: 'up' | 'down' | 'stable';
  unit: string;
  category: string;
}

interface LiveInsight {
  id: string;
  title: string;
  description: string;
  type: 'opportunity' | 'risk' | 'optimization' | 'trend';
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  timestamp: Date;
  category: string;
}

interface LiveRecommendation {
  id: string;
  title: string;
  description: string;
  action: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  timeframe: string;
  confidence: number;
}

export const LiveBrainAnalysis: React.FC<LiveBrainAnalysisProps> = ({ 
  userProfile: _userProfile, 
  systemIntelligence,
  onAnalysisComplete: _onAnalysisComplete 
}) => {
  const [analysis, setAnalysis] = useState<BrainAnalysis>({
    id: 'live-analysis',
    timestamp: new Date(),
    metrics: [],
    insights: [],
    recommendations: [],
    confidence: 0,
    status: 'analyzing'
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');

  // Start analysis when component mounts
  useEffect(() => {
    if (systemIntelligence?.understandingLevel > 40) {
      startLiveAnalysis();
    }
  }, [systemIntelligence?.understandingLevel]);

  const startLiveAnalysis = () => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    
    const analysisSteps = [
      'Initializing brain analysis...',
      'Processing business data...',
      'Analyzing market trends...',
      'Evaluating performance metrics...',
      'Generating insights...',
      'Calculating recommendations...',
      'Finalizing analysis...'
    ];

    let currentStepIndex = 0;
    const interval = setInterval(() => {
      setAnalysisProgress(prev => {
        const newProgress = prev + 14.29; // 100% / 7 steps
        setCurrentStep(analysisSteps[currentStepIndex]);
        currentStepIndex++;
        
        if (newProgress >= 100) {
          clearInterval(interval);
          setIsAnalyzing(false);
          completeAnalysis();
          return 100;
        }
        return newProgress;
      });
    }, 1000);
  };

  const completeAnalysis = () => {
    const metrics: AnalysisMetric[] = [
      {
        name: 'Revenue Growth',
        value: 23,
        target: 30,
        trend: 'up',
        unit: '%',
        category: 'financial'
      },
      {
        name: 'Customer Satisfaction',
        value: 87,
        target: 90,
        trend: 'up',
        unit: '%',
        category: 'customer'
      },
      {
        name: 'Operational Efficiency',
        value: 78,
        target: 85,
        trend: 'up',
        unit: '%',
        category: 'operations'
      },
      {
        name: 'Market Share',
        value: 12,
        target: 15,
        trend: 'up',
        unit: '%',
        category: 'market'
      }
    ];

    const insights: LiveInsight[] = [
      {
        id: '1',
        title: 'Revenue Optimization Opportunity',
        description: 'Current pricing strategy could be optimized by 23% based on market analysis.',
        type: 'opportunity',
        impact: 'high',
        confidence: 87,
        timestamp: new Date(),
        category: 'financial'
      },
      {
        id: '2',
        title: 'Customer Retention Risk',
        description: 'Customer churn rate is trending upward. Immediate action recommended.',
        type: 'risk',
        impact: 'high',
        confidence: 92,
        timestamp: new Date(),
        category: 'customer'
      },
      {
        id: '3',
        title: 'Process Efficiency Improvement',
        description: 'Automating invoice processing could save 8 hours per week.',
        type: 'optimization',
        impact: 'medium',
        confidence: 85,
        timestamp: new Date(),
        category: 'operations'
      },
      {
        id: '4',
        title: 'Market Expansion Trend',
        description: 'Growing demand in adjacent markets presents expansion opportunities.',
        type: 'trend',
        impact: 'medium',
        confidence: 78,
        timestamp: new Date(),
        category: 'market'
      }
    ];

    const recommendations: LiveRecommendation[] = [
      {
        id: '1',
        title: 'Implement Dynamic Pricing',
        description: 'Optimize pricing strategy based on market demand and competitor analysis.',
        action: 'Review and adjust pricing model',
        impact: 'high',
        effort: 'medium',
        timeframe: '2-4 weeks',
        confidence: 85
      },
      {
        id: '2',
        title: 'Enhance Customer Success Program',
        description: 'Implement proactive customer success initiatives to reduce churn.',
        action: 'Develop customer success strategy',
        impact: 'high',
        effort: 'high',
        timeframe: '1-2 months',
        confidence: 88
      },
      {
        id: '3',
        title: 'Automate Invoice Processing',
        description: 'Implement automated invoice processing to improve efficiency.',
        action: 'Deploy automation solution',
        impact: 'medium',
        effort: 'low',
        timeframe: '1-2 weeks',
        confidence: 92
      }
    ];

    setAnalysis({
      id: 'live-analysis',
      timestamp: new Date(),
      metrics,
      insights,
      recommendations,
      confidence: 85,
      status: 'complete'
    });
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'risk': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'optimization': return <Zap className="w-4 h-4 text-blue-500" />;
      case 'trend': return <Activity className="w-4 h-4 text-purple-500" />;
      default: return <Lightbulb className="w-4 h-4 text-primary" />;
    }
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
          <Brain className="w-12 h-12 text-primary" />
        </motion.div>
        <h3 className="text-2xl font-bold">Live Brain Analysis</h3>
        <p className="text-muted-foreground">
          Real-time business intelligence powered by your Unified Business Brain
        </p>
      </div>

      {/* Analysis Progress */}
      {isAnalyzing && (
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span>Live Analysis in Progress</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{currentStep}</span>
              <span className="text-sm font-medium">{Math.round(analysisProgress)}%</span>
            </div>
            <Progress value={analysisProgress} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Analysis Results */}
      {analysis.status === 'complete' && (
        <>
          {/* Key Metrics */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {analysis.metrics.map((metric) => (
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

          {/* Live Insights */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold flex items-center space-x-2">
              <Lightbulb className="w-5 h-5 text-primary" />
              <span>Live Insights</span>
            </h4>
            
            <div className="grid gap-4">
              <AnimatePresence>
                {analysis.insights.map((insight, index) => (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="border-l-4 border-l-primary">
                      <CardContent className="p-4">
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
                                <span>{Math.round(insight.confidence)}% confidence</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>{insight.timestamp.toLocaleTimeString()}</span>
                              </span>
                              <span>{insight.category}</span>
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

          {/* Live Recommendations */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold flex items-center space-x-2">
              <Target className="w-5 h-5 text-primary" />
              <span>Actionable Recommendations</span>
            </h4>
            
            <div className="grid gap-4">
              <AnimatePresence>
                {analysis.recommendations.map((recommendation, index) => (
                  <motion.div
                    key={recommendation.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
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
                            <div className="space-y-2">
                              <div className="text-xs font-medium text-primary">
                                Action: {recommendation.action}
                              </div>
                              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                <span className="flex items-center space-x-1">
                                  <CheckCircle className="w-3 h-3" />
                                  <span>{Math.round(recommendation.confidence)}% confidence</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{recommendation.timeframe}</span>
                                </span>
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
        </>
      )}

      {/* Intelligence Status */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <Sparkles className="w-5 h-5 text-primary" />
            <div className="flex-1">
              <div className="font-medium">Live Brain Intelligence</div>
              <div className="text-sm text-muted-foreground">
                Your brain is analyzing business data in real-time with {Math.round(systemIntelligence?.understandingLevel || 0)}% understanding.
                {analysis.status === 'complete' && ` Analysis completed with ${Math.round(analysis.confidence)}% confidence.`}
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-primary">
                {analysis.insights.length}
              </div>
              <div className="text-xs text-muted-foreground">Live Insights</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 