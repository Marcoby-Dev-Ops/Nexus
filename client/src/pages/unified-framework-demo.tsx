import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { 
  Brain, 
  Target, 
  Lightbulb, 
  Map, 
  Play, 
  Building2,
  Zap,
  Users,
  BarChart3,
  ArrowRight,
  CheckCircle,
  Clock
} from 'lucide-react';
import { UnifiedFrameworkChat } from '@/components/ai/UnifiedFrameworkChat';
import { useUnifiedFramework } from '@/hooks/useUnifiedFramework';

// Mock user context for demo
const demoUserContext = {
  userId: 'demo-user-123',
  organizationId: 'demo-org-456',
  userRole: 'founder',
  businessDomain: 'technology',
  experienceLevel: 'intermediate' as const,
  currentGoals: ['Improve sales process', 'Scale operations', 'Increase customer retention'],
  availableTime: 20, // hours per week
  technicalCapabilities: ['Email marketing', 'CRM systems', 'Basic automation'],
  businessMetrics: {
    monthlyRevenue: 50000,
    customerCount: 150,
    conversionRate: 0.15
  }
};

const examplePrompts = [
  {
    phase: 'focus',
    prompt: "I want to improve our sales process",
    description: "Goal setting and problem identification"
  },
  {
    phase: 'insight',
    prompt: "I think we should focus on automated follow-up first",
    description: "Understanding and analysis"
  },
  {
    phase: 'roadmap',
    prompt: "I plan to implement this over the next 3 weeks",
    description: "Planning and strategy"
  },
  {
    phase: 'execute',
    prompt: "I'm starting the implementation today",
    description: "Action and execution"
  }
];

export const UnifiedFrameworkDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState('demo');
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);

  const {
    currentResponse,
    isLoading,
    error,
    messages,
    processInput,
    clearMessages,
    getPhaseIcon,
    getPhaseColor,
    getPhaseProgress
  } = useUnifiedFramework({
    userContext: demoUserContext,
    autoProcess: false,
    onPhaseChange: (phase) => {
      console.log('Phase changed to:', phase);
    },
    onInsightGenerated: (insights) => {
      console.log('Insights generated:', insights);
    }
  });

  const handlePromptSelect = async (prompt: string) => {
    setSelectedPrompt(prompt);
    await processInput(prompt);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🧠 Unified Framework Demo
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience how Mental Models, Building Blocks, and FIRE Cycle work together 
            to transform business decisions into intelligent, actionable plans.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="demo" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Interactive Demo
            </TabsTrigger>
            <TabsTrigger value="examples" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Example Prompts
            </TabsTrigger>
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Framework Overview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="demo" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chat Interface */}
              <div className="lg:col-span-2">
                <Card className="h-[600px]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="w-5 h-5" />
                      Unified Framework Chat
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-[500px] p-0">
                    <UnifiedFrameworkChat 
                      userContext={demoUserContext}
                      onPhaseChange={(phase) => console.log('Phase:', phase)}
                      onInsightGenerated={(insights) => console.log('Insights:', insights)}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Current Status */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Current Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {currentResponse ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span>Phase:</span>
                          <Badge className={getPhaseColor(currentResponse.firePhase)}>
                            {getPhaseColor(currentResponse.firePhase).includes('blue') && <Target className="w-3 h-3 mr-1" />}
                            {getPhaseColor(currentResponse.firePhase).includes('yellow') && <Lightbulb className="w-3 h-3 mr-1" />}
                            {getPhaseColor(currentResponse.firePhase).includes('green') && <Map className="w-3 h-3 mr-1" />}
                            {getPhaseColor(currentResponse.firePhase).includes('purple') && <Play className="w-3 h-3 mr-1" />}
                            {currentResponse.firePhase.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Confidence:</span>
                          <Badge variant="outline">
                            {Math.round(currentResponse.confidence * 100)}%
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <span className="text-sm font-medium">Progress:</span>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${getPhaseProgress(currentResponse.firePhase)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        Start a conversation to see status
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start"
                      onClick={() => handlePromptSelect("I want to improve our sales process")}
                      disabled={isLoading}
                    >
                      <Target className="w-4 h-4 mr-2" />
                      Focus: Sales Improvement
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start"
                      onClick={() => handlePromptSelect("I think we should focus on automated follow-up first")}
                      disabled={isLoading}
                    >
                      <Lightbulb className="w-4 h-4 mr-2" />
                      Insight: Automation Strategy
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start"
                      onClick={() => handlePromptSelect("I plan to implement this over the next 3 weeks")}
                      disabled={isLoading}
                    >
                      <Map className="w-4 h-4 mr-2" />
                      Roadmap: Implementation Plan
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start"
                      onClick={() => handlePromptSelect("I'm starting the implementation today")}
                      disabled={isLoading}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Execute: Start Implementation
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start"
                      onClick={clearMessages}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Clear Conversation
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="examples" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {examplePrompts.map((example, index) => (
                <Card key={index} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {getPhaseIcon(example.phase)}
                      {example.phase.charAt(0).toUpperCase() + example.phase.slice(1)} Phase
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">{example.description}</p>
                    <div className="bg-gray-50 p-3 rounded-lg mb-4">
                      <p className="text-sm font-medium">"{example.prompt}"</p>
                    </div>
                    <Button 
                      onClick={() => handlePromptSelect(example.prompt)}
                      disabled={isLoading}
                      className="w-full"
                    >
                      Try This Example
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Mental Models */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    Mental Models Framework
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="default">Success Pattern Recognition</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">Risk Minimization</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">Time Allocation</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">Low-Hanging Fruit</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">Skin in the Game</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">Circle of Competence</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">Givers vs Takers</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">Rule of 72</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">Dhandho Framework</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* FIRE Cycle */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    FIRE Cycle System
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Target className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">Focus</div>
                        <div className="text-sm text-gray-600">Clarify goals and context</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                        <Lightbulb className="w-4 h-4 text-yellow-600" />
                      </div>
                      <div>
                        <div className="font-medium">Insight</div>
                        <div className="text-sm text-gray-600">Gain understanding</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Map className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium">Roadmap</div>
                        <div className="text-sm text-gray-600">Plan the path forward</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <Play className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <div className="font-medium">Execute</div>
                        <div className="text-sm text-gray-600">Take action</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Building Blocks */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Building Blocks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Sales Automation</span>
                      <Badge variant="outline" className="text-xs">Simple</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Lead Scoring</span>
                      <Badge variant="outline" className="text-xs">Medium</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Pipeline Management</span>
                      <Badge variant="outline" className="text-xs">Medium</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Email Marketing</span>
                      <Badge variant="outline" className="text-xs">Simple</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Customer Feedback</span>
                      <Badge variant="outline" className="text-xs">Simple</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Process Automation</span>
                      <Badge variant="outline" className="text-xs">Medium</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Analytics Dashboard</span>
                      <Badge variant="outline" className="text-xs">Complex</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Cash Flow Tracking</span>
                      <Badge variant="outline" className="text-xs">Simple</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Budget Management</span>
                      <Badge variant="outline" className="text-xs">Medium</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Integration Flow */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Integration Flow
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center space-x-4">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="text-sm font-medium">User Input</div>
                  </div>
                  <ArrowRight className="w-6 h-6 text-gray-400" />
                  <div className="text-center">
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Target className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div className="text-sm font-medium">FIRE Analysis</div>
                  </div>
                  <ArrowRight className="w-6 h-6 text-gray-400" />
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Brain className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="text-sm font-medium">Mental Models</div>
                  </div>
                  <ArrowRight className="w-6 h-6 text-gray-400" />
                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Building2 className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="text-sm font-medium">Building Blocks</div>
                  </div>
                  <ArrowRight className="w-6 h-6 text-gray-400" />
                  <div className="text-center">
                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <CheckCircle className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div className="text-sm font-medium">Success</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UnifiedFrameworkDemo;
