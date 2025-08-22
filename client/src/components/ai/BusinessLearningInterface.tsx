/**
 * Business Learning Interface
 * 
 * Enables intuitive interaction with Nexus to:
 * - Teach about business operations through natural conversation
 * - Manage thoughts and initiatives with AI assistance
 * - Learn from user patterns and preferences
 * - Provide contextual business intelligence
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Textarea } from '@/shared/components/ui/Textarea';
import { Input } from '@/shared/components/ui/Input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { 
  Brain, 
  Lightbulb, 
  BookOpen, 
  MessageSquare, 
  Target, 
  TrendingUp,
  Users,
  Settings,
  Plus,
  Save,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Clock,
  Star
} from 'lucide-react';
import { useAuth } from '@/hooks/index';
import { useToast } from '@/shared/ui/components/Toast';

interface BusinessConcept {
  id: string;
  name: string;
  description: string;
  category: 'process' | 'strategy' | 'team' | 'finance' | 'customers' | 'technology';
  confidence: number;
  lastUpdated: string;
  examples: string[];
  relatedConcepts: string[];
}

interface Thought {
  id: string;
  title: string;
  content: string;
  type: 'idea' | 'problem' | 'opportunity' | 'strategy' | 'reflection';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'draft' | 'active' | 'implemented' | 'archived';
  tags: string[];
  createdAt: string;
  updatedAt: string;
  aiInsights?: string[];
  nextActions?: string[];
}

interface Initiative {
  id: string;
  title: string;
  description: string;
  objective: string;
  status: 'planning' | 'active' | 'paused' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  timeline: {
    startDate: string;
    endDate: string;
    milestones: Array<{
      id: string;
      title: string;
      dueDate: string;
      completed: boolean;
    }>;
  };
  team: string[];
  resources: string[];
  progress: number;
  aiRecommendations?: string[];
}

interface BusinessLearningInterfaceProps {
  className?: string;
}

export const BusinessLearningInterface: React.FC<BusinessLearningInterfaceProps> = ({ className }) => {
  const [activeTab, setActiveTab] = useState('teach');
  const [concepts, setConcepts] = useState<BusinessConcept[]>([]);
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [isLearning, setIsLearning] = useState(false);
  const [currentInput, setCurrentInput] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Sample data for demonstration
  useEffect(() => {
    setConcepts([
      {
        id: '1',
        name: 'Customer Onboarding Process',
        description: 'How we welcome and set up new customers',
        category: 'process',
        confidence: 85,
        lastUpdated: new Date().toISOString(),
        examples: ['Email sequence', 'Welcome call', 'Account setup'],
        relatedConcepts: ['Customer Success', 'Sales Process']
      },
      {
        id: '2',
        name: 'Revenue Growth Strategy',
        description: 'Our approach to increasing revenue',
        category: 'strategy',
        confidence: 78,
        lastUpdated: new Date().toISOString(),
        examples: ['Upselling', 'Market expansion', 'Product development'],
        relatedConcepts: ['Sales', 'Marketing', 'Product']
      }
    ]);

    setThoughts([
      {
        id: '1',
        title: 'Improve customer retention',
        content: 'We need to better understand why customers leave and implement retention strategies',
        type: 'opportunity',
        priority: 'high',
        status: 'active',
        tags: ['customers', 'retention', 'strategy'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        aiInsights: ['Consider implementing customer feedback loops', 'Analyze churn patterns'],
        nextActions: ['Set up customer interviews', 'Review churn data']
      }
    ]);

    setInitiatives([
      {
        id: '1',
        title: 'Customer Success Program',
        description: 'Implement a comprehensive customer success program',
        objective: 'Reduce churn by 20% and increase customer satisfaction',
        status: 'active',
        priority: 'high',
        timeline: {
          startDate: '2024-01-01',
          endDate: '2024-06-30',
          milestones: [
            { id: '1', title: 'Define success metrics', dueDate: '2024-01-15', completed: true },
            { id: '2', title: 'Hire customer success manager', dueDate: '2024-02-01', completed: false },
            { id: '3', title: 'Launch pilot program', dueDate: '2024-03-01', completed: false }
          ]
        },
        team: ['Sarah Johnson', 'Mike Chen'],
        resources: ['Budget: $50K', 'CRM system'],
        progress: 35,
        aiRecommendations: ['Focus on early warning signals', 'Implement automated check-ins']
      }
    ]);
  }, []);

  const handleTeachNexus = async () => {
    if (!currentInput.trim()) return;

    setIsProcessing(true);
    setIsLearning(true);

    try {
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Analyze input and extract business concepts
      const newConcept: BusinessConcept = {
        id: Date.now().toString(),
        name: extractConceptName(currentInput),
        description: currentInput,
        category: categorizeInput(currentInput),
        confidence: 75,
        lastUpdated: new Date().toISOString(),
        examples: extractExamples(currentInput),
        relatedConcepts: findRelatedConcepts(currentInput, concepts)
      };

      setConcepts(prev => [...prev, newConcept]);
      setAiResponse(`I've learned about "${newConcept.name}". This relates to ${newConcept.category} and connects with ${newConcept.relatedConcepts.length} existing concepts. What else would you like to teach me?`);
      
      toast({
        title: "Knowledge Acquired",
        description: `Nexus learned about ${newConcept.name}`,
        variant: "default",
      });

    } catch (error) {
      console.error('Error teaching Nexus:', error);
      setAiResponse('I encountered an error while learning. Please try again.');
    } finally {
      setIsProcessing(false);
      setCurrentInput('');
    }
  };

  const handleAddThought = () => {
    if (!currentInput.trim()) return;

    const newThought: Thought = {
      id: Date.now().toString(),
      title: extractThoughtTitle(currentInput),
      content: currentInput,
      type: 'idea',
      priority: 'medium',
      status: 'draft',
      tags: extractTags(currentInput),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setThoughts(prev => [...prev, newThought]);
    setCurrentInput('');
    
    toast({
      title: "Thought Captured",
      description: "Your idea has been saved and will be analyzed",
      variant: "default",
    });
  };

  const handleAddInitiative = () => {
    if (!currentInput.trim()) return;

    const newInitiative: Initiative = {
      id: Date.now().toString(),
      title: extractInitiativeTitle(currentInput),
      description: currentInput,
      objective: extractObjective(currentInput),
      status: 'planning',
      priority: 'medium',
      timeline: {
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        milestones: []
      },
      team: [],
      resources: [],
      progress: 0
    };

    setInitiatives(prev => [...prev, newInitiative]);
    setCurrentInput('');
    
    toast({
      title: "Initiative Created",
      description: "Your initiative has been added to the planning board",
      variant: "default",
    });
  };

  const extractConceptName = (input: string): string => {
    // Simple extraction - in real implementation, use NLP
    const sentences = input.split('.');
    return sentences[0].substring(0, 50) + (sentences[0].length > 50 ? '...' : '');
  };

  const categorizeInput = (input: string): BusinessConcept['category'] => {
    const lower = input.toLowerCase();
    if (lower.includes('process') || lower.includes('workflow')) return 'process';
    if (lower.includes('strategy') || lower.includes('plan')) return 'strategy';
    if (lower.includes('team') || lower.includes('people')) return 'team';
    if (lower.includes('money') || lower.includes('revenue') || lower.includes('cost')) return 'finance';
    if (lower.includes('customer') || lower.includes('client')) return 'customers';
    if (lower.includes('tech') || lower.includes('software')) return 'technology';
    return 'strategy';
  };

  const extractExamples = (input: string): string[] => {
    // Simple extraction - in real implementation, use NLP
    const examples = [];
    if (input.includes('email')) examples.push('Email communication');
    if (input.includes('meeting')) examples.push('Team meetings');
    if (input.includes('call')) examples.push('Customer calls');
    return examples.length > 0 ? examples : ['General process'];
  };

  const findRelatedConcepts = (input: string, existingConcepts: BusinessConcept[]): string[] => {
    const lower = input.toLowerCase();
    return existingConcepts
      .filter(concept => 
        lower.includes(concept.name.toLowerCase()) ||
        concept.name.toLowerCase().includes(lower.split(' ')[0])
      )
      .map(concept => concept.name);
  };

  const extractThoughtTitle = (input: string): string => {
    return input.split('.')[0].substring(0, 60);
  };

  const extractTags = (input: string): string[] => {
    const tags = [];
    const lower = input.toLowerCase();
    if (lower.includes('customer')) tags.push('customers');
    if (lower.includes('revenue')) tags.push('revenue');
    if (lower.includes('team')) tags.push('team');
    if (lower.includes('process')) tags.push('process');
    return tags;
  };

  const extractInitiativeTitle = (input: string): string => {
    return input.split('.')[0].substring(0, 60);
  };

  const extractObjective = (input: string): string => {
    const sentences = input.split('.');
    return sentences.length > 1 ? sentences[1].trim() : 'Improve business performance';
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500 text-white';
      case 'planning': return 'bg-blue-500 text-white';
      case 'paused': return 'bg-yellow-500 text-white';
      case 'completed': return 'bg-gray-500 text-white';
      case 'cancelled': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Business Learning Interface</h2>
          <p className="text-muted-foreground">
            Teach Nexus about your business and manage your thoughts & initiatives
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isLearning && (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span className="text-sm text-muted-foreground">Learning...</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="teach" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Teach Nexus
          </TabsTrigger>
          <TabsTrigger value="thoughts" className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Thoughts
          </TabsTrigger>
          <TabsTrigger value="initiatives" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Initiatives
          </TabsTrigger>
        </TabsList>

        {/* Teach Nexus Tab */}
        <TabsContent value="teach" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Teach Nexus About Your Business
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">What would you like to teach Nexus?</label>
                <Textarea
                  ref={inputRef}
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  placeholder="Describe a business process, strategy, or concept you'd like Nexus to understand..."
                  rows={4}
                  disabled={isProcessing}
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  onClick={handleTeachNexus}
                  disabled={!currentInput.trim() || isProcessing}
                  className="flex items-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Learning...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Teach Nexus
                    </>
                  )}
                </Button>
                
                {aiResponse && (
                  <Button variant="outline" onClick={() => setAiResponse('')}>
                    Clear
                  </Button>
                )}
              </div>

              {aiResponse && (
                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-2">
                      <Brain className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm font-medium mb-1">Nexus Response:</p>
                        <p className="text-sm text-muted-foreground">{aiResponse}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          {/* Learned Concepts */}
          <Card>
            <CardHeader>
              <CardTitle>Learned Business Concepts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {concepts.map((concept) => (
                  <Card key={concept.id} className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold">{concept.name}</h4>
                      <Badge variant="outline">{concept.category}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{concept.description}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Confidence: {concept.confidence}%</span>
                      <span>{new Date(concept.lastUpdated).toLocaleDateString()}</span>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Thoughts Tab */}
        <TabsContent value="thoughts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                Capture Your Thoughts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">What's on your mind?</label>
                <Textarea
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  placeholder="Share an idea, problem, opportunity, or reflection..."
                  rows={3}
                />
              </div>
              
              <Button 
                onClick={handleAddThought}
                disabled={!currentInput.trim()}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Capture Thought
              </Button>
            </CardContent>
          </Card>

          {/* Thoughts List */}
          <Card>
            <CardHeader>
              <CardTitle>Your Thoughts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {thoughts.map((thought) => (
                  <Card key={thought.id} className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold">{thought.title}</h4>
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor(thought.priority)}>
                          {thought.priority}
                        </Badge>
                        <Badge variant="outline">{thought.status}</Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{thought.content}</p>
                    
                    {thought.aiInsights && thought.aiInsights.length > 0 && (
                      <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-blue-800 mb-1">AI Insights:</p>
                        <ul className="text-sm text-blue-700 space-y-1">
                          {thought.aiInsights.map((insight, index) => (
                            <li key={index}>• {insight}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        {thought.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <span>{new Date(thought.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Initiatives Tab */}
        <TabsContent value="initiatives" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Create New Initiative
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Describe your initiative</label>
                <Textarea
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  placeholder="Describe a new project, goal, or initiative you want to pursue..."
                  rows={3}
                />
              </div>
              
              <Button 
                onClick={handleAddInitiative}
                disabled={!currentInput.trim()}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Initiative
              </Button>
            </CardContent>
          </Card>

          {/* Initiatives List */}
          <Card>
            <CardHeader>
              <CardTitle>Your Initiatives</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {initiatives.map((initiative) => (
                  <Card key={initiative.id} className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold">{initiative.title}</h4>
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor(initiative.priority)}>
                          {initiative.priority}
                        </Badge>
                        <Badge className={getStatusColor(initiative.status)}>
                          {initiative.status}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{initiative.description}</p>
                    <p className="text-sm font-medium mb-3">Objective: {initiative.objective}</p>
                    
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>{initiative.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all" 
                          style={{ width: `${initiative.progress}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    {initiative.aiRecommendations && initiative.aiRecommendations.length > 0 && (
                      <div className="mb-3 p-3 bg-green-50 rounded-lg">
                        <p className="text-sm font-medium text-green-800 mb-1">AI Recommendations:</p>
                        <ul className="text-sm text-green-700 space-y-1">
                          {initiative.aiRecommendations.map((rec, index) => (
                            <li key={index}>• {rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Timeline: {initiative.timeline.startDate} - {initiative.timeline.endDate}</span>
                      <span>{initiative.team.length} team members</span>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
