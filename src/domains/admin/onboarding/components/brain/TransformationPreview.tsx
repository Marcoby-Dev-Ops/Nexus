/**
 * TransformationPreview.tsx
 * Shows user transformation journey and future capabilities
 * Demonstrates the power of the Unified Business Brain
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Lightbulb, Sparkles, CheckCircle, Clock, BarChart3, Users, Target, Award, Rocket, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Progress } from '@/shared/components/ui/Progress';

interface TransformationPreviewProps {
  userProfile?: any;
  systemIntelligence?: {
    understandingLevel: number;
    personalizedInsights: number;
    contextAccuracy: number;
  };
  onTransformationComplete?: (transformation: UserTransformation) => void;
}

interface UserTransformation {
  id: string;
  currentLevel: 'novice' | 'intermediate' | 'expert' | 'master';
  targetLevel: 'expert' | 'master';
  progress: number;
  capabilities: TransformationCapability[];
  milestones: TransformationMilestone[];
  timeline: TransformationTimeline;
}

interface TransformationCapability {
  id: string;
  name: string;
  description: string;
  category: 'strategy' | 'operations' | 'leadership' | 'innovation';
  status: 'unlocked' | 'in-progress' | 'locked';
  confidence: number;
  impact: 'high' | 'medium' | 'low';
}

interface TransformationMilestone {
  id: string;
  title: string;
  description: string;
  timeframe: string;
  status: 'completed' | 'in-progress' | 'upcoming';
  impact: string;
}

interface TransformationTimeline {
  phases: TimelinePhase[];
  totalDuration: string;
  currentPhase: number;
}

interface TimelinePhase {
  id: string;
  name: string;
  duration: string;
  description: string;
  status: 'completed' | 'current' | 'upcoming';
  capabilities: string[];
}

export const TransformationPreview: React.FC<TransformationPreviewProps> = ({ 
  userProfile: userProfile, 
  systemIntelligence,
  onTransformationComplete: onTransformationComplete 
}) => {
  const [transformation, setTransformation] = useState<UserTransformation>({
    id: 'user-transformation',
    currentLevel: 'novice',
    targetLevel: 'expert',
    progress: 0,
    capabilities: [],
    milestones: [],
    timeline: {
      phases: [],
      totalDuration: '',
      currentPhase: 0
    }
  });
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationProgress, setCalculationProgress] = useState(0);

  // Calculate transformation based on system intelligence
  useEffect(() => {
    if (systemIntelligence?.understandingLevel > 50) {
      calculateTransformation();
    }
  }, [systemIntelligence?.understandingLevel]);

  const calculateTransformation = () => {
    setIsCalculating(true);
    setCalculationProgress(0);
    
    const calculationSteps = [
      'Analyzing current capabilities...',
      'Identifying growth opportunities...',
      'Calculating transformation timeline...',
      'Mapping skill development...',
      'Generating milestones...',
      'Finalizing transformation plan...'
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      setCalculationProgress(prev => {
        const newProgress = prev + 16.67;
        currentStep++;
        
        if (newProgress >= 100) {
          clearInterval(interval);
          setIsCalculating(false);
          generateTransformationPlan();
          return 100;
        }
        return newProgress;
      });
    }, 1200);
  };

  const generateTransformationPlan = () => {
    const capabilities: TransformationCapability[] = [
      {
        id: 'strategic-thinking',
        name: 'Strategic Business Thinking',
        description: 'Develop expert-level strategic thinking and business acumen',
        category: 'strategy',
        status: 'unlocked',
        confidence: 85,
        impact: 'high'
      },
      {
        id: 'data-driven-decisions',
        name: 'Data-Driven Decision Making',
        description: 'Master analytics and data-driven business decisions',
        category: 'operations',
        status: 'unlocked',
        confidence: 78,
        impact: 'high'
      },
      {
        id: 'leadership-skills',
        name: 'Advanced Leadership',
        description: 'Develop executive leadership and team management skills',
        category: 'leadership',
        status: 'in-progress',
        confidence: 65,
        impact: 'high'
      },
      {
        id: 'innovation-mindset',
        name: 'Innovation Mindset',
        description: 'Cultivate creative problem-solving and innovation capabilities',
        category: 'innovation',
        status: 'locked',
        confidence: 45,
        impact: 'medium'
      },
      {
        id: 'market-analysis',
        name: 'Market Analysis Expert',
        description: 'Become proficient in market research and competitive analysis',
        category: 'strategy',
        status: 'unlocked',
        confidence: 72,
        impact: 'medium'
      },
      {
        id: 'operational-excellence',
        name: 'Operational Excellence',
        description: 'Master process optimization and operational efficiency',
        category: 'operations',
        status: 'in-progress',
        confidence: 68,
        impact: 'medium'
      }
    ];

    const milestones: TransformationMilestone[] = [
      {
        id: '1',
        title: 'Foundation Building',
        description: 'Establish core business understanding and basic capabilities',
        timeframe: 'Month 1-2',
        status: 'completed',
        impact: 'High - Sets foundation for all future growth'
      },
      {
        id: '2',
        title: 'Skill Development',
        description: 'Develop intermediate business skills and analytical thinking',
        timeframe: 'Month 3-4',
        status: 'in-progress',
        impact: 'High - Builds practical business expertise'
      },
      {
        id: '3',
        title: 'Expert Application',
        description: 'Apply advanced business concepts and strategic thinking',
        timeframe: 'Month 5-6',
        status: 'upcoming',
        impact: 'Critical - Transforms into business expert'
      },
      {
        id: '4',
        title: 'Mastery Achievement',
        description: 'Achieve mastery level in business strategy and leadership',
        timeframe: 'Month 7-8',
        status: 'upcoming',
        impact: 'Transformative - Reaches full business mastery'
      }
    ];

    const timeline: TransformationTimeline = {
      phases: [
        {
          id: 'phase-1',
          name: 'Foundation Phase',
          duration: '2 months',
          description: 'Build core business understanding and basic capabilities',
          status: 'completed',
          capabilities: ['Business Fundamentals', 'Basic Analytics', 'Market Awareness']
        },
        {
          id: 'phase-2',
          name: 'Development Phase',
          duration: '2 months',
          description: 'Develop intermediate skills and analytical thinking',
          status: 'current',
          capabilities: ['Strategic Thinking', 'Data Analysis', 'Process Optimization']
        },
        {
          id: 'phase-3',
          name: 'Expert Phase',
          duration: '2 months',
          description: 'Apply advanced concepts and strategic thinking',
          status: 'upcoming',
          capabilities: ['Advanced Strategy', 'Leadership Skills', 'Innovation']
        },
        {
          id: 'phase-4',
          name: 'Mastery Phase',
          duration: '2 months',
          description: 'Achieve mastery level in business strategy',
          status: 'upcoming',
          capabilities: ['Business Mastery', 'Executive Leadership', 'Strategic Innovation']
        }
      ],
      totalDuration: '8 months',
      currentPhase: 2
    };

    setTransformation({
      id: 'user-transformation',
      currentLevel: 'novice',
      targetLevel: 'expert',
      progress: 35,
      capabilities,
      milestones,
      timeline
    });
  };

  const getCapabilityIcon = (category: string) => {
    switch (category) {
      case 'strategy': return <Target className="w-4 h-4" />;
      case 'operations': return <BarChart3 className="w-4 h-4" />;
      case 'leadership': return <Users className="w-4 h-4" />;
      case 'innovation': return <Lightbulb className="w-4 h-4" />;
      default: return <Star className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unlocked': return 'text-green-500 bg-green-50';
      case 'in-progress': return 'text-blue-500 bg-blue-50';
      case 'locked': return 'text-gray-500 bg-gray-50';
      case 'completed': return 'text-green-500 bg-green-50';
      case 'current': return 'text-blue-500 bg-blue-50';
      case 'upcoming': return 'text-gray-500 bg-gray-50';
      default: return 'text-gray-500 bg-gray-50';
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="inline-block p-4 bg-primary/10 rounded-full"
        >
          <Rocket className="w-12 h-12 text-primary" />
        </motion.div>
        <h3 className="text-2xl font-bold">Your Transformation Journey</h3>
        <p className="text-muted-foreground">
          From novice to business expert with your Unified Business Brain
        </p>
      </div>

      {/* Calculation Progress */}
      {isCalculating && (
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="w-5 h-5 text-primary" />
              <span>Calculating Your Transformation</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Analyzing your potential...</span>
              <span className="text-sm font-medium">{Math.round(calculationProgress)}%</span>
            </div>
            <Progress value={calculationProgress} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Transformation Overview */}
      {transformation.capabilities.length > 0 && (
        <>
          <div className="grid md: grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary mb-2">
                  {transformation.currentLevel.toUpperCase()}
                </div>
                <div className="text-sm text-muted-foreground">Current Level</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary mb-2">
                  {transformation.targetLevel.toUpperCase()}
                </div>
                <div className="text-sm text-muted-foreground">Target Level</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary mb-2">
                  {transformation.progress}%
                </div>
                <div className="text-sm text-muted-foreground">Progress</div>
                <Progress value={transformation.progress} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          {/* Capabilities Grid */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold flex items-center space-x-2">
              <Award className="w-5 h-5 text-primary" />
              <span>Your Capabilities</span>
            </h4>
            
            <div className="grid md: grid-cols-2 gap-4">
              {transformation.capabilities.map((capability) => (
                <Card key={capability.id} className="hover: shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      {getCapabilityIcon(capability.category)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h5 className="font-semibold">{capability.name}</h5>
                          <Badge variant="secondary" className={getStatusColor(capability.status)}>
                            {capability.status}
                          </Badge>
                          <Badge variant="outline" className={getImpactColor(capability.impact)}>
                            {capability.impact} impact
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {capability.description}
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <CheckCircle className="w-3 h-3" />
                          <span>{Math.round(capability.confidence)}% confidence</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Transformation Timeline */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold flex items-center space-x-2">
              <Clock className="w-5 h-5 text-primary" />
              <span>Transformation Timeline</span>
            </h4>
            
            <div className="space-y-4">
              {transformation.timeline.phases.map((phase, index) => (
                <Card key={phase.id} className="border-l-4 border-l-primary">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h5 className="font-semibold">{phase.name}</h5>
                          <Badge variant="secondary" className={getStatusColor(phase.status)}>
                            {phase.status}
                          </Badge>
                          <span className="text-sm text-muted-foreground">{phase.duration}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {phase.description}
                        </p>
                        <div className="space-y-1">
                          <div className="text-xs font-medium text-primary">Capabilities: </div>
                          <div className="flex flex-wrap gap-1">
                            {phase.capabilities.map((capability, capIndex) => (
                              <Badge key={capIndex} variant="outline" className="text-xs">
                                {capability}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Milestones */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold flex items-center space-x-2">
              <Target className="w-5 h-5 text-primary" />
              <span>Key Milestones</span>
            </h4>
            
            <div className="grid gap-4">
              {transformation.milestones.map((milestone) => (
                <Card key={milestone.id} className="border-l-4 border-l-primary">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h5 className="font-semibold">{milestone.title}</h5>
                          <Badge variant="secondary" className={getStatusColor(milestone.status)}>
                            {milestone.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {milestone.description}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{milestone.timeframe}</span>
                          </span>
                          <span className="text-primary font-medium">{milestone.impact}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Transformation Summary */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <Sparkles className="w-5 h-5 text-primary" />
            <div className="flex-1">
              <div className="font-medium">Your Business Transformation</div>
              <div className="text-sm text-muted-foreground">
                Your Unified Business Brain will guide you from {transformation.currentLevel} to {transformation.targetLevel} 
                over {transformation.timeline.totalDuration}, unlocking {transformation.capabilities.length} key capabilities.
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-primary">
                {transformation.timeline.totalDuration}
              </div>
              <div className="text-xs text-muted-foreground">Journey Duration</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 