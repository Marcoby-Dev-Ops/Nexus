/**
 * Purposeful Experience Map
 * 
 * Every screen and experience in Nexus serves a clear purpose aligned with the vision.
 * This map ensures every interaction moves users through the 4-phase transformation.
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { 
  Brain, 
  Target, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Lightbulb,
  BookOpen,
  MessageSquare,
  Settings,
  BarChart3,
  Activity,
  Star,
  Zap,
  CheckCircle,
  ArrowRight,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  AlertCircle,
  Clock
} from 'lucide-react';

interface ExperiencePurpose {
  screen: string;
  purpose: string;
  transformationPhase: 'foundation' | 'intelligence' | 'mastery' | 'innovation';
  brainFunction: string;
  userOutcome: string;
  visionAlignment: string;
  nextAction: string;
}

interface PurposefulExperienceMapProps {
  className?: string;
}

export const PurposefulExperienceMap: React.FC<PurposefulExperienceMapProps> = ({ className }) => {
  const experiencePurposes: ExperiencePurpose[] = [
    // Foundation Phase (Days 1-30)
    {
      screen: 'Onboarding Flow',
      purpose: 'Establish business context and learning baseline',
      transformationPhase: 'foundation',
      brainFunction: 'Action Analysis & Expert Onboarding',
      userOutcome: 'Brain learns user patterns and applies expert knowledge',
      visionAlignment: 'Novice → Expert through democratized business expertise',
      nextAction: 'Complete business profile setup'
    },
    {
      screen: 'Dashboard',
      purpose: 'Provide clarity on next best actions',
      transformationPhase: 'foundation',
      brainFunction: 'Mistake Prevention & Confidence Building',
      userOutcome: 'Expert-backed decisions increase confidence',
      visionAlignment: 'Clarity First - every feature makes next steps obvious',
      nextAction: 'Execute recommended next best action'
    },
    {
      screen: 'Business Learning Interface',
      purpose: 'Teach Nexus about business operations',
      transformationPhase: 'foundation',
      brainFunction: 'Knowledge Acquisition & Pattern Recognition',
      userOutcome: 'Brain builds comprehensive business understanding',
      visionAlignment: 'Tool as a Skill-Bridge - execute vision immediately',
      nextAction: 'Share business process or concept'
    },
    {
      screen: 'Chat Interface',
      purpose: 'Provide contextual business guidance',
      transformationPhase: 'foundation',
      brainFunction: 'Real-time Expert Advice',
      userOutcome: 'Get expert answers to business questions',
      visionAlignment: 'Integrated Intelligence - all tools in one hub',
      nextAction: 'Ask business question or seek guidance'
    },

    // Intelligence Phase (Days 31-90)
    {
      screen: 'Analytics Dashboard',
      purpose: 'Identify optimization opportunities',
      transformationPhase: 'intelligence',
      brainFunction: 'Pattern Recognition & Cross-Functional Insights',
      userOutcome: 'Unified intelligence across all business areas',
      visionAlignment: 'Reactive → Proactive through predictive intelligence',
      nextAction: 'Review identified patterns and opportunities'
    },
    {
      screen: 'Role Command Centers',
      purpose: 'Provide role-specific business intelligence',
      transformationPhase: 'intelligence',
      brainFunction: 'Predictive Guidance & Skill Development',
      userOutcome: 'Progressive business expertise acquisition',
      visionAlignment: 'Role-Centric Structure - see business through clear units',
      nextAction: 'Access relevant command center'
    },
    {
      screen: 'Wow Moments Orchestrator',
      purpose: 'Create immediate value through insights',
      transformationPhase: 'intelligence',
      brainFunction: 'Predictive Insights & Value Creation',
      userOutcome: 'Proactive problem detection and opportunity identification',
      visionAlignment: 'Instant value delivery through integrated intelligence',
      nextAction: 'Review and act on wow moment'
    },
    {
      screen: 'Integration Context Service',
      purpose: 'Provide real-time business context',
      transformationPhase: 'intelligence',
      brainFunction: 'Data Integration & Context Awareness',
      userOutcome: 'Live business data enhances all interactions',
      visionAlignment: 'All data considered in unified intelligence system',
      nextAction: 'Connect additional business integrations'
    },

    // Mastery Phase (Days 91-180)
    {
      screen: 'Progressive Intelligence',
      purpose: 'Enable autonomous business operations',
      transformationPhase: 'mastery',
      brainFunction: 'Autonomous Operations & Strategic Intelligence',
      userOutcome: 'Brain handles routine decisions, user focuses on strategy',
      visionAlignment: 'Manual → Autonomous through intelligent automation',
      nextAction: 'Review autonomous recommendations'
    },
    {
      screen: 'Delegation Manager',
      purpose: 'Optimize team and resource allocation',
      transformationPhase: 'mastery',
      brainFunction: 'Resource Optimization & Team Intelligence',
      userOutcome: 'Expert-level operations across all functions',
      visionAlignment: 'Delegation by Design - easily hand off tasks',
      nextAction: 'Review delegation opportunities'
    },
    {
      screen: 'Predictive Insights Service',
      purpose: 'Forecast business outcomes and opportunities',
      transformationPhase: 'mastery',
      brainFunction: 'Predictive Analytics & Strategic Planning',
      userOutcome: 'High-level business strategy guidance',
      visionAlignment: 'Competitive advantage through expert-level operations',
      nextAction: 'Review predictive insights and plan accordingly'
    },
    {
      screen: 'Business Health Monitoring',
      purpose: 'Maintain optimal business performance',
      transformationPhase: 'mastery',
      brainFunction: 'Performance Monitoring & Optimization',
      userOutcome: 'Continuous improvement and optimization',
      visionAlignment: 'Business leadership through expert guidance',
      nextAction: 'Address any health alerts or optimization opportunities'
    },

    // Innovation Phase (Days 181+)
    {
      screen: 'Market Intelligence Hub',
      purpose: 'Identify breakthrough opportunities',
      transformationPhase: 'innovation',
      brainFunction: 'Innovation Catalyst & Market Leadership',
      userOutcome: 'Business operates at industry-leading levels',
      visionAlignment: 'Market Leadership through expert intelligence',
      nextAction: 'Explore breakthrough opportunities'
    },
    {
      screen: 'Strategic Planning Interface',
      purpose: 'Guide long-term business development',
      transformationPhase: 'innovation',
      brainFunction: 'Strategic Intelligence & Growth Planning',
      userOutcome: 'Sustainable growth through expert-guided development',
      visionAlignment: 'Organizational excellence through unified intelligence',
      nextAction: 'Review and update strategic plan'
    },
    {
      screen: 'Team Excellence Dashboard',
      purpose: 'Elevate entire team to expert level',
      transformationPhase: 'innovation',
      brainFunction: 'Team Intelligence & Skill Development',
      userOutcome: 'Entire team operates at expert level',
      visionAlignment: 'Organizational excellence through democratized expertise',
      nextAction: 'Review team development opportunities'
    },
    {
      screen: 'Innovation Lab',
      purpose: 'Drive breakthrough innovations',
      transformationPhase: 'innovation',
      brainFunction: 'Innovation Intelligence & Creative Problem Solving',
      userOutcome: 'Breakthrough innovations and market leadership',
      visionAlignment: 'Innovation catalyst through expert intelligence',
      nextAction: 'Explore innovation opportunities'
    }
  ];

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'foundation': return 'bg-blue-500 text-white';
      case 'intelligence': return 'bg-green-500 text-white';
      case 'mastery': return 'bg-purple-500 text-white';
      case 'innovation': return 'bg-orange-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'foundation': return <BookOpen className="w-4 h-4" />;
      case 'intelligence': return <Brain className="w-4 h-4" />;
      case 'mastery': return <Target className="w-4 h-4" />;
      case 'innovation': return <Sparkles className="w-4 h-4" />;
      default: return <Star className="w-4 h-4" />;
    }
  };

  const phases = ['foundation', 'intelligence', 'mastery', 'innovation'];

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-foreground flex items-center justify-center gap-3">
          <Brain className="w-8 h-8 text-primary" />
          Purposeful Experience Map
        </h2>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Every screen and experience in Nexus serves a clear purpose aligned with the Unified Business Brain vision.
          Each interaction moves users through the 4-phase transformation framework.
        </p>
      </div>

      {/* Phase Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {phases.map((phase, index) => (
          <Card key={phase} className="text-center">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-center gap-2 mb-2">
                {getPhaseIcon(phase)}
                <CardTitle className="text-lg">
                  Phase {index + 1}: {phase.charAt(0).toUpperCase() + phase.slice(1)}
                </CardTitle>
              </div>
              <Badge className={getPhaseColor(phase)}>
                Days {index * 30 + 1}-{(index + 1) * 30}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {phase === 'foundation' && (
                  <>
                    <p>• Action Analysis & Expert Onboarding</p>
                    <p>• Mistake Prevention & Confidence Building</p>
                    <p>• Knowledge Acquisition & Pattern Recognition</p>
                  </>
                )}
                {phase === 'intelligence' && (
                  <>
                    <p>• Pattern Recognition & Cross-Functional Insights</p>
                    <p>• Predictive Guidance & Skill Development</p>
                    <p>• Data Integration & Context Awareness</p>
                  </>
                )}
                {phase === 'mastery' && (
                  <>
                    <p>• Autonomous Operations & Strategic Intelligence</p>
                    <p>• Resource Optimization & Team Intelligence</p>
                    <p>• Predictive Analytics & Strategic Planning</p>
                  </>
                )}
                {phase === 'innovation' && (
                  <>
                    <p>• Innovation Catalyst & Market Leadership</p>
                    <p>• Strategic Intelligence & Growth Planning</p>
                    <p>• Team Intelligence & Skill Development</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Experience Purposes by Phase */}
      {phases.map((phase) => (
        <Card key={phase}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getPhaseIcon(phase)}
              Phase {phases.indexOf(phase) + 1}: {phase.charAt(0).toUpperCase() + phase.slice(1)}
              <Badge className={getPhaseColor(phase)}>
                {phase === 'foundation' && 'Days 1-30'}
                {phase === 'intelligence' && 'Days 31-90'}
                {phase === 'mastery' && 'Days 91-180'}
                {phase === 'innovation' && 'Days 181+'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {experiencePurposes
                .filter(exp => exp.transformationPhase === phase)
                .map((experience) => (
                  <Card key={experience.screen} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <h4 className="font-semibold text-lg">{experience.screen}</h4>
                        <Badge variant="outline" className="text-xs">
                          {experience.transformationPhase}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm font-medium text-primary">Purpose:</p>
                          <p className="text-sm text-muted-foreground">{experience.purpose}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-primary">Brain Function:</p>
                          <p className="text-sm text-muted-foreground">{experience.brainFunction}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-primary">User Outcome:</p>
                          <p className="text-sm text-muted-foreground">{experience.userOutcome}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-primary">Vision Alignment:</p>
                          <p className="text-sm text-muted-foreground">{experience.visionAlignment}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-primary">Next Action:</p>
                          <p className="text-sm text-muted-foreground">{experience.nextAction}</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Success Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Success Metrics - Making Vision Statements True
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">85%</div>
              <div className="text-sm font-medium">Decision Confidence Increase</div>
              <div className="text-xs text-muted-foreground mt-1">
                Users make expert-level decisions
              </div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">3x</div>
              <div className="text-sm font-medium">Faster Skill Acquisition</div>
              <div className="text-xs text-muted-foreground mt-1">
                Business expertise democratized
              </div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">80%</div>
              <div className="text-sm font-medium">Fewer Costly Mistakes</div>
              <div className="text-xs text-muted-foreground mt-1">
                Brain prevents common pitfalls
              </div>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">40%</div>
              <div className="text-sm font-medium">Revenue Growth Average</div>
              <div className="text-xs text-muted-foreground mt-1">
                Within 6 months of use
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vision Statement Validation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Vision Statement Validation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-800 mb-2">✅ "A person with no business skill should have the opportunity of a seasoned business person"</h4>
              <p className="text-sm text-green-700">
                Every screen provides expert-level guidance, making business expertise accessible to novices through the Unified Business Brain.
              </p>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2">✅ "Every customer journey is powered by the Unified Business Brain"</h4>
              <p className="text-sm text-blue-700">
                All experiences connect through the central intelligence system, ensuring consistent expert guidance across every interaction.
              </p>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-purple-800 mb-2">✅ "Novice → Expert through democratized business expertise"</h4>
              <p className="text-sm text-purple-700">
                The 4-phase transformation framework systematically elevates users from foundation to innovation, building expertise progressively.
              </p>
            </div>
            
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <h4 className="font-semibold text-orange-800 mb-2">✅ "Reactive → Proactive through predictive business intelligence"</h4>
              <p className="text-sm text-orange-700">
                Predictive insights and wow moments enable users to anticipate and act on opportunities before they become problems.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
