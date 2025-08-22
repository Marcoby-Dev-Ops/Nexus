import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import { Progress } from '@/shared/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { 
  Brain, 
  Target, 
  Lightbulb, 
  Map, 
  Play, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Building2,
  Zap,
  Users,
  BarChart3
} from 'lucide-react';
import { UnifiedFrameworkService } from '@/services/UnifiedFrameworkService';
import type { UnifiedResponse, UserContext } from '@/services/types';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  metadata?: {
    firePhase?: string;
    mentalModels?: Record<string, any>;
    buildingBlocks?: any[];
    nextActions?: any;
    confidence?: number;
  };
}

interface UnifiedFrameworkChatProps {
  userContext: UserContext;
  onPhaseChange?: (phase: string) => void;
  onInsightGenerated?: (insights: any) => void;
}

export const UnifiedFrameworkChat: React.FC<UnifiedFrameworkChatProps> = ({
  userContext,
  onPhaseChange,
  onInsightGenerated
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentResponse, setCurrentResponse] = useState<UnifiedResponse | null>(null);
  const [activeTab, setActiveTab] = useState('chat');

  const unifiedFramework = new UnifiedFrameworkService(
    // These would be injected via dependency injection in a real app
    {} as any, // MentalModelsService
    {} as any, // FireCycleService  
    {} as any  // BuildingBlocksService
  );

  const handleSubmit = useCallback(async (input: string) => {
    if (!input.trim() || isProcessing) return;

    setIsProcessing(true);
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    try {
      const response = await unifiedFramework.processUserInput(input, userContext);
      
      if (response.success && response.data) {
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: formatUnifiedResponse(response.data),
          timestamp: new Date(),
          metadata: {
            firePhase: response.data.firePhase,
            mentalModels: response.data.mentalModelInsights,
            buildingBlocks: response.data.recommendedBlocks,
            nextActions: response.data.nextActions,
            confidence: response.data.confidence
          }
        };

        setMessages(prev => [...prev, aiMessage]);
        setCurrentResponse(response.data);
        
        // Notify parent components
        onPhaseChange?.(response.data.firePhase);
        onInsightGenerated?.(response.data.mentalModelInsights);
      }
    } catch (error) {
      console.error('Error processing input:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  }, [userContext, isProcessing, unifiedFramework, onPhaseChange, onInsightGenerated]);

  const formatUnifiedResponse = (response: UnifiedResponse): string => {
    let formatted = `🧠 **${response.firePhase.toUpperCase()} Phase Analysis**\n\n`;
    
    formatted += `**Confidence:** ${Math.round(response.confidence * 100)}%\n\n`;
    
    if (response.mentalModelInsights && Object.keys(response.mentalModelInsights).length > 0) {
      formatted += `**Mental Model Insights:**\n`;
      Object.entries(response.mentalModelInsights).forEach(([model, insights]) => {
        formatted += `• ${model}: ${JSON.stringify(insights).substring(0, 100)}...\n`;
      });
      formatted += '\n';
    }

    if (response.recommendedBlocks && response.recommendedBlocks.length > 0) {
      formatted += `**Recommended Building Blocks:**\n`;
      response.recommendedBlocks.forEach(block => {
        formatted += `• ${block.name} (${block.complexity}, ${block.expectedImpact} impact)\n`;
      });
      formatted += '\n';
    }

    if (response.nextActions) {
      formatted += `**Next Actions:**\n`;
      if (response.nextActions.immediate.length > 0) {
        formatted += `**Immediate:** ${response.nextActions.immediate.join(', ')}\n`;
      }
      if (response.nextActions.shortTerm.length > 0) {
        formatted += `**Short Term:** ${response.nextActions.shortTerm.join(', ')}\n`;
      }
    }

    return formatted;
  };

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'focus': return <Target className="w-4 h-4" />;
      case 'insight': return <Lightbulb className="w-4 h-4" />;
      case 'roadmap': return <Map className="w-4 h-4" />;
      case 'execute': return <Play className="w-4 h-4" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'focus': return 'bg-blue-100 text-blue-800';
      case 'insight': return 'bg-yellow-100 text-yellow-800';
      case 'roadmap': return 'bg-green-100 text-green-800';
      case 'execute': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="blocks" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Building Blocks
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Progress
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="flex-1 flex flex-col">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <Card className={`max-w-3xl ${message.type === 'user' ? 'bg-blue-50' : 'bg-white'}`}>
                  <CardContent className="p-4">
                    {message.metadata?.firePhase && (
                      <div className="flex items-center gap-2 mb-2">
                        {getPhaseIcon(message.metadata.firePhase)}
                        <Badge className={getPhaseColor(message.metadata.firePhase)}>
                          {message.metadata.firePhase.toUpperCase()}
                        </Badge>
                        {message.metadata.confidence && (
                          <Badge variant="outline">
                            {Math.round(message.metadata.confidence * 100)}% confidence
                          </Badge>
                        )}
                      </div>
                    )}
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  </CardContent>
                </Card>
              </div>
            ))}
            {isProcessing && (
              <div className="flex justify-start">
                <Card className="bg-gray-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span>Processing your request...</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit(inputValue);
              }}
              className="flex gap-2"
            >
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Describe your business goal or challenge..."
                disabled={isProcessing}
                className="flex-1"
              />
              <Button type="submit" disabled={isProcessing || !inputValue.trim()}>
                Send
              </Button>
            </form>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="flex-1 p-4">
          {currentResponse ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    Mental Model Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(currentResponse.mentalModelInsights).map(([model, insights]) => (
                      <div key={model} className="border rounded-lg p-4">
                        <h4 className="font-semibold mb-2">{model.replace(/([A-Z])/g, ' $1').trim()}</h4>
                        <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                          {JSON.stringify(insights, null, 2)}
                        </pre>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Success Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Primary Metrics</h4>
                      <div className="flex flex-wrap gap-2">
                        {currentResponse.successMetrics.primary.map((metric, index) => (
                          <Badge key={index} variant="default">{metric}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Tracking Metrics</h4>
                      <div className="flex flex-wrap gap-2">
                        {currentResponse.successMetrics.tracking.map((metric, index) => (
                          <Badge key={index} variant="outline">{metric}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              Start a conversation to see insights
            </div>
          )}
        </TabsContent>

        <TabsContent value="blocks" className="flex-1 p-4">
          {currentResponse?.recommendedBlocks ? (
            <div className="space-y-4">
              {currentResponse.recommendedBlocks.map((block) => (
                <Card key={block.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Building2 className="w-5 h-5" />
                        {block.name}
                      </span>
                      <div className="flex gap-2">
                        <Badge variant={block.complexity === 'simple' ? 'default' : 'secondary'}>
                          {block.complexity}
                        </Badge>
                        <Badge variant={block.expectedImpact === 'high' ? 'default' : 'outline'}>
                          {block.expectedImpact} impact
                        </Badge>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">{block.description}</p>
                    <div className="space-y-2">
                      <div>
                        <span className="font-semibold">Implementation Time:</span> {block.implementationTime} hours
                      </div>
                      <div>
                        <span className="font-semibold">Prerequisites:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {block.prerequisites.map((prereq, index) => (
                            <Badge key={index} variant="outline" className="text-xs">{prereq}</Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="font-semibold">Success Metrics:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {block.successMetrics.map((metric, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">{metric}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              Start a conversation to see recommended building blocks
            </div>
          )}
        </TabsContent>

        <TabsContent value="progress" className="flex-1 p-4">
          {currentResponse ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    FIRE Cycle Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Current Phase: {currentResponse.firePhase}</span>
                      <Badge className={getPhaseColor(currentResponse.firePhase)}>
                        {currentResponse.firePhase.toUpperCase()}
                      </Badge>
                    </div>
                    <Progress value={getPhaseProgress(currentResponse.firePhase)} className="w-full" />
                    <div className="text-sm text-gray-600">
                      Confidence: {Math.round(currentResponse.confidence * 100)}%
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Next Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {currentResponse.nextActions.immediate.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Zap className="w-4 h-4" />
                          Immediate Actions
                        </h4>
                        <ul className="space-y-1">
                          {currentResponse.nextActions.immediate.map((action, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              {action}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {currentResponse.nextActions.shortTerm.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Short Term Actions
                        </h4>
                        <ul className="space-y-1">
                          {currentResponse.nextActions.shortTerm.map((action, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                              {action}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              Start a conversation to see progress tracking
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

const getPhaseProgress = (phase: string): number => {
  switch (phase) {
    case 'focus': return 25;
    case 'insight': return 50;
    case 'roadmap': return 75;
    case 'execute': return 100;
    default: return 0;
  }
};
