/**
 * Purposeful Experience Page
 * 
 * Showcases how every screen and experience in Nexus serves the vision.
 * This page demonstrates the purposeful design behind every interaction.
 */

import React from 'react';
import { PurposefulExperienceMap } from '@/components/experience/PurposefulExperienceMap';
import { UnifiedBusinessBrain } from '@/lib/ai/components/UnifiedBusinessBrain';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { 
  Brain, 
  Target, 
  CheckCircle, 
  Star,
  ArrowRight,
  Sparkles,
  BookOpen,
  MessageSquare,
  Settings,
  BarChart3,
  Activity,
  Lightbulb
} from 'lucide-react';

const PurposefulExperiencePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Brain className="w-12 h-12 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">
              Purposeful Experience Design
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-4xl mx-auto">
            Every screen and experience in Nexus serves a clear purpose aligned with the Unified Business Brain vision. 
            Each interaction moves users through the 4-phase transformation framework, ensuring no feature exists without purpose.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Badge className="bg-green-500 text-white">
              <CheckCircle className="w-3 h-3 mr-1" />
              Vision-Aligned Design
            </Badge>
            <Badge className="bg-blue-500 text-white">
              <Target className="w-3 h-3 mr-1" />
              Purpose-Driven Features
            </Badge>
            <Badge className="bg-purple-500 text-white">
              <Sparkles className="w-3 h-3 mr-1" />
              Transformation Focused
            </Badge>
          </div>
        </div>

        {/* Vision Statement */}
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold text-foreground">
                "A person with no business skill should have the opportunity of a seasoned business person because of the organization and insights provided by Nexus."
              </h2>
              <p className="text-lg text-muted-foreground">
                This is the central promise that drives every design decision, every feature, and every user interaction.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Star className="w-4 h-4" />
                Every screen serves this vision
                <ArrowRight className="w-4 h-4" />
                Every interaction builds expertise
                <ArrowRight className="w-4 h-4" />
                Every feature creates value
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Core Principles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="text-center">
              <div className="flex items-center justify-center mb-2">
                <BookOpen className="w-8 h-8 text-blue-600" />
              </div>
              <CardTitle className="text-lg">Clarity First</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground">
                Every feature makes it obvious what to do next. No confusion, no guesswork - just clear guidance toward business success.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <div className="flex items-center justify-center mb-2">
                <MessageSquare className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-lg">Delegation by Design</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground">
                Easily hand off tasks to team members or AI agents. The brain handles complexity while you focus on strategy.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Settings className="w-8 h-8 text-purple-600" />
              </div>
              <CardTitle className="text-lg">Role-Centric Structure</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground">
                See business through clear functional units. Each role has its command center with specialized intelligence.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Brain className="w-8 h-8 text-orange-600" />
              </div>
              <CardTitle className="text-lg">Integrated Intelligence</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground">
                All tools in one hub for context switching. The Unified Business Brain connects everything into a cohesive experience.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Transformation Framework */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              The 4-Phase Transformation Framework
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-6 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 mb-2">Phase 1</div>
                <h3 className="font-semibold text-blue-800 mb-2">Foundation</h3>
                <p className="text-sm text-blue-700 mb-4">Days 1-30</p>
                <ul className="text-xs text-blue-600 space-y-1 text-left">
                  <li>• Action Analysis & Expert Onboarding</li>
                  <li>• Mistake Prevention & Confidence Building</li>
                  <li>• Knowledge Acquisition & Pattern Recognition</li>
                </ul>
              </div>

              <div className="text-center p-6 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600 mb-2">Phase 2</div>
                <h3 className="font-semibold text-green-800 mb-2">Intelligence</h3>
                <p className="text-sm text-green-700 mb-4">Days 31-90</p>
                <ul className="text-xs text-green-600 space-y-1 text-left">
                  <li>• Pattern Recognition & Cross-Functional Insights</li>
                  <li>• Predictive Guidance & Skill Development</li>
                  <li>• Data Integration & Context Awareness</li>
                </ul>
              </div>

              <div className="text-center p-6 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 mb-2">Phase 3</div>
                <h3 className="font-semibold text-purple-800 mb-2">Mastery</h3>
                <p className="text-sm text-purple-700 mb-4">Days 91-180</p>
                <ul className="text-xs text-purple-600 space-y-1 text-left">
                  <li>• Autonomous Operations & Strategic Intelligence</li>
                  <li>• Resource Optimization & Team Intelligence</li>
                  <li>• Predictive Analytics & Strategic Planning</li>
                </ul>
              </div>

              <div className="text-center p-6 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600 mb-2">Phase 4</div>
                <h3 className="font-semibold text-orange-800 mb-2">Innovation</h3>
                <p className="text-sm text-orange-700 mb-4">Days 181+</p>
                <ul className="text-xs text-orange-600 space-y-1 text-left">
                  <li>• Innovation Catalyst & Market Leadership</li>
                  <li>• Strategic Intelligence & Growth Planning</li>
                  <li>• Team Intelligence & Skill Development</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Purposeful Experience Map */}
        <PurposefulExperienceMap />

        {/* Live Brain Demo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Live Unified Business Brain Demo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <UnifiedBusinessBrain showDetails={true} />
          </CardContent>
        </Card>

        {/* Success Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Success Metrics - Making Vision Statements True
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                <div className="text-3xl font-bold text-blue-600 mb-2">85%</div>
                <div className="text-sm font-medium text-blue-800">Decision Confidence Increase</div>
                <div className="text-xs text-blue-600 mt-2">
                  Users make expert-level decisions with confidence
                </div>
              </div>

              <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                <div className="text-3xl font-bold text-green-600 mb-2">3x</div>
                <div className="text-sm font-medium text-green-800">Faster Skill Acquisition</div>
                <div className="text-xs text-green-600 mt-2">
                  Business expertise democratized and accelerated
                </div>
              </div>

              <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                <div className="text-3xl font-bold text-purple-600 mb-2">80%</div>
                <div className="text-sm font-medium text-purple-800">Fewer Costly Mistakes</div>
                <div className="text-xs text-purple-600 mt-2">
                  Brain prevents common business pitfalls
                </div>
              </div>

              <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
                <div className="text-3xl font-bold text-orange-600 mb-2">40%</div>
                <div className="text-sm font-medium text-orange-800">Revenue Growth Average</div>
                <div className="text-xs text-orange-600 mt-2">
                  Within 6 months of using Nexus
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Card className="bg-gradient-to-r from-primary to-primary/80 text-white">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">
              Ready to Experience Purposeful Business Intelligence?
            </h2>
            <p className="text-lg mb-6 opacity-90">
              Every screen, every feature, every interaction is designed to transform you from novice to expert.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Badge className="bg-white text-primary px-4 py-2">
                <CheckCircle className="w-4 h-4 mr-2" />
                Vision-Aligned Design
              </Badge>
              <Badge className="bg-white text-primary px-4 py-2">
                <Target className="w-4 h-4 mr-2" />
                Purpose-Driven Features
              </Badge>
              <Badge className="bg-white text-primary px-4 py-2">
                <Sparkles className="w-4 h-4 mr-2" />
                Transformation Focused
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PurposefulExperiencePage;
