import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Progress } from '@/shared/components/ui/progress';
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
  Clock,
  Copy,
  Shield,
  Timer,
  TrendingUp,
  Star,
  Award,
  BookOpen,
  Rocket
} from 'lucide-react';

interface MentalModelsIntroductionStepProps {
  onNext: (data: Record<string, unknown>) => void;
  onSkip: (data?: Record<string, unknown>) => void;
  onBack?: () => void;
  data: Record<string, unknown>;
  currentStep: number;
  totalSteps: number;
  user?: Record<string, unknown>;
}

const mentalModels = [
  {
    id: 'successPatternRecognition',
    name: 'Success Pattern Recognition',
    icon: Copy,
    principle: 'Study organizations that solved your same problem and follow their proven patterns',
    description: 'Learn from proven examples instead of reinventing the wheel',
    nexusHelp: 'Nexus will identify successful companies in your industry and show you exactly what they did right',
    color: 'bg-blue-500'
  },
  {
    id: 'riskMinimization',
    name: 'Risk Minimization',
    icon: Shield,
    principle: 'Heads I win, tails I don\'t lose much',
    description: 'Structure opportunities where the upside is huge and downside is minimal',
    nexusHelp: 'Nexus will analyze your business decisions and show you how to minimize risk while maximizing potential',
    color: 'bg-green-500'
  },
  {
    id: 'timeAllocation',
    name: 'Time Allocation',
    icon: Timer,
    principle: 'Optimize your 168-hour week for maximum business impact',
    description: 'Make every hour count toward your business goals',
    nexusHelp: 'Nexus will help you allocate your time effectively and track your progress',
    color: 'bg-purple-500'
  },
  {
    id: 'lowHangingFruit',
    name: 'Low-Hanging Fruit',
    icon: TrendingUp,
    principle: 'Identify and execute high-impact, low-effort opportunities first',
    description: 'Focus on quick wins that deliver immediate value',
    nexusHelp: 'Nexus will identify the easiest wins in your business and guide you through implementation',
    color: 'bg-orange-500'
  },
  {
    id: 'skinInTheGame',
    name: 'Skin in the Game',
    icon: Award,
    principle: 'Personal accountability drives better decisions and outcomes',
    description: 'When you have something at stake, you make better choices',
    nexusHelp: 'Nexus will help you set up accountability systems and track your personal investment',
    color: 'bg-red-500'
  },
  {
    id: 'circleOfCompetence',
    name: 'Circle of Competence',
    icon: Target,
    principle: 'Stay within your areas of expertise and knowledge',
    description: 'Focus on what you know well and delegate or learn what you don\'t',
    nexusHelp: 'Nexus will assess your strengths and guide you toward opportunities that match your expertise',
    color: 'bg-indigo-500'
  },
  {
    id: 'giversVsTakers',
    name: 'Givers vs Takers',
    icon: Users,
    principle: 'Focus on creating value for others rather than extracting it',
    description: 'Build relationships and businesses that benefit everyone involved',
    nexusHelp: 'Nexus will help you identify value-creation opportunities and build win-win relationships',
    color: 'bg-teal-500'
  },
  {
    id: 'ruleOf72',
    name: 'Rule of 72',
    icon: BarChart3,
    principle: 'Understand compound growth and its impact on your business',
    description: 'Small improvements compound into massive results over time',
    nexusHelp: 'Nexus will track your business metrics and show you how small changes compound over time',
    color: 'bg-pink-500'
  },
  {
    id: 'dhandhoFramework',
    name: 'Dhandho Framework',
    icon: Rocket,
    principle: 'Zero-risk entrepreneurship through smart business design',
    description: 'Structure your business so that success is likely and failure is survivable',
    nexusHelp: 'Nexus will help you design your business model to minimize risk while maximizing upside',
    color: 'bg-yellow-500'
  }
];

export const MentalModelsIntroductionStep: React.FC<MentalModelsIntroductionStepProps> = ({
  onNext,
  onSkip,
  onBack,
  data,
  currentStep,
  totalSteps,
  user
}) => {
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [currentModelIndex, setCurrentModelIndex] = useState(0);
  const [showDemo, setShowDemo] = useState(false);

  const handleModelToggle = (modelId: string) => {
    setSelectedModels(prev => 
      prev.includes(modelId) 
        ? prev.filter(id => id !== modelId)
        : [...prev, modelId]
    );
  };

  const handleNext = () => {
    onNext({
      ...data,
      selectedMentalModels: selectedModels,
      mentalModelsIntroductionCompleted: true
    });
  };

  const handleSkip = () => {
    onSkip({
      ...data,
      mentalModelsIntroductionCompleted: true
    });
  };

  const currentModel = mentalModels[currentModelIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mr-4">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Mental Models for Business Success
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Discover the proven mental models that successful entrepreneurs use to make better decisions, 
            minimize risk, and maximize their chances of success.
          </p>
        </div>

        {!showDemo ? (
          <div className="space-y-8">
            {/* Mental Models Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mentalModels.map((model) => {
                const IconComponent = model.icon;
                const isSelected = selectedModels.includes(model.id);
                
                return (
                  <Card 
                    key={model.id}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                      isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleModelToggle(model.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 ${model.color} rounded-full flex items-center justify-center`}>
                            <IconComponent className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{model.name}</CardTitle>
                            <p className="text-sm text-gray-600">{model.principle}</p>
                          </div>
                        </div>
                        {isSelected && (
                          <CheckCircle className="w-5 h-5 text-primary" />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-3">{model.description}</p>
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-xs text-blue-700 font-medium">How Nexus helps:</p>
                        <p className="text-xs text-blue-600">{model.nexusHelp}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Selection Summary */}
            {selectedModels.length > 0 && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-primary mb-2">
                      You've selected {selectedModels.length} mental models
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Nexus will personalize your experience based on these models and help you apply them to your business.
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {selectedModels.map(modelId => {
                        const model = mentalModels.find(m => m.id === modelId);
                        return (
                          <Badge key={modelId} variant="secondary" className="bg-primary/10 text-primary">
                            {model?.name}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Demo Preview */}
            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
              <CardContent className="pt-6">
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    See How It Works
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Experience how Nexus will help you apply these mental models to your business decisions.
                  </p>
                  <Button 
                    onClick={() => setShowDemo(true)}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Try Interactive Demo
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Interactive Demo */
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Brain className="w-5 h-5 mr-2" />
                    Interactive Demo: Applying Mental Models
                  </CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowDemo(false)}
                  >
                    ← Back to Selection
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Demo Scenario */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Scenario: Improving Sales Process</h4>
                    <p className="text-blue-800 text-sm">
                      Let's see how Nexus would apply mental models to help you improve your sales process.
                    </p>
                  </div>

                  {/* Mental Model Application */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {mentalModels.slice(0, 4).map((model) => {
                      const IconComponent = model.icon;
                      return (
                        <Card key={model.id} className="border-l-4 border-l-primary">
                          <CardContent className="pt-4">
                            <div className="flex items-center mb-3">
                              <div className={`w-8 h-8 ${model.color} rounded-full flex items-center justify-center mr-3`}>
                                <IconComponent className="w-4 h-4 text-white" />
                              </div>
                              <h5 className="font-semibold">{model.name}</h5>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{model.principle}</p>
                            <div className="bg-green-50 p-3 rounded text-sm">
                              <p className="font-medium text-green-800 mb-1">Nexus would suggest:</p>
                              <ul className="text-green-700 space-y-1">
                                <li>• Research top-performing sales teams in your industry</li>
                                <li>• Identify low-risk, high-impact improvements</li>
                                <li>• Focus on your strongest sales channels first</li>
                                <li>• Track metrics to see compound improvements</li>
                              </ul>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Action Plan Preview */}
                  <Card className="bg-gradient-to-r from-green-50 to-blue-50">
                    <CardContent className="pt-6">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <Map className="w-5 h-5 mr-2" />
                        Your Personalized Action Plan
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">1</span>
                          </div>
                          <span className="text-sm">Research 3 successful companies in your industry</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">2</span>
                          </div>
                          <span className="text-sm">Implement automated follow-up system (low-risk, high-impact)</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">3</span>
                          </div>
                          <span className="text-sm">Track conversion rates weekly to see compound growth</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t">
          <div className="flex items-center space-x-4">
            {onBack && (
              <Button variant="outline" onClick={onBack}>
                ← Back
              </Button>
            )}
            <Button variant="ghost" onClick={handleSkip}>
              Skip for now
            </Button>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500">
              {selectedModels.length} models selected
            </div>
            <Button 
              onClick={handleNext}
              disabled={selectedModels.length === 0}
              className="bg-primary hover:bg-primary/90"
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentalModelsIntroductionStep;
