/**
 * Intelligent Business Advisor
 * Leverages RAG and NLP capabilities to provide interactive, contextual business guidance
 * 
 * Pillar: 1 (Efficient Automation) - AI-powered business intelligence
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/shared/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Badge } from '@/shared/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { 
  MessageSquare, 
  TrendingUp, 
  Settings, 
  Users, 
  DollarSign,
  Target,
  Zap,
  BookOpen,
  Shield,
  Lightbulb,
  ArrowRight,
  Search,
  Filter,
  Sparkles
} from 'lucide-react';

import { 
  industryConfigs, 
  getIndustryConfig, 
  getIndustryBusinessUnits,
  getIndustryKPIs,
  getIndustryProcesses,
  getIndustryStandards,
  getIndustryIntegrations,
  getIndustryBusinessModels
} from '@/core/config/industryConfigs';

import { 
  businessUnitConfigs,
  getBusinessUnitConfig,
  getBusinessUnitsForModel,
  getBusinessUnitsForIndustry,
  getBusinessUnitKPIs,
  getBusinessUnitProcesses,
  getBusinessUnitRoles,
  getBusinessUnitTools,
  getBusinessUnitAutomations
} from '@/core/config/businessUnitConfigs';

import { 
  standardsLibrary,
  processesLibrary,
  getStandard,
  getProcess,
  getStandardsByIndustry,
  getProcessesByIndustry,
  getMandatoryStandards,
  getRecommendedStandards
} from '@/core/config/standardsLibrary';

// ============================================================================
// TYPES
// ============================================================================

interface BusinessContext {
  industry: string;
  businessModel: string;
  companySize: string;
  currentChallenges: string[];
  goals: string[];
  priorities: string[];
}

interface AdvisorResponse {
  type: 'insight' | 'recommendation' | 'action' | 'question';
  content: string;
  confidence: number;
  relatedData: any;
  nextSteps: string[];
  automationPotential: 'low' | 'medium' | 'high';
}

interface InteractiveSession {
  id: string;
  context: BusinessContext;
  conversation: Array<{
    role: 'user' | 'advisor';
    content: string;
    timestamp: Date;
    metadata?: any;
  }>;
  insights: AdvisorResponse[];
  recommendations: AdvisorResponse[];
}

// ============================================================================
// COMPONENT
// ============================================================================

export const IntelligentBusinessAdvisor: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [session, setSession] = useState<InteractiveSession | null>(null);
  const [currentQuery, setCurrentQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [selectedBusinessModel, setSelectedBusinessModel] = useState('');
  const [activeTab, setActiveTab] = useState('chat');
  const [filterCategory, setFilterCategory] = useState('all');

  // ============================================================================
  // BUSINESS CONTEXT MANAGEMENT
  // ============================================================================

  const initializeSession = useCallback((context: BusinessContext) => {
    const newSession: InteractiveSession = {
      id: `session_${Date.now()}`,
      context,
      conversation: [],
      insights: [],
      recommendations: []
    };
    setSession(newSession);
    return newSession;
  }, []);

  const updateBusinessContext = useCallback((updates: Partial<BusinessContext>) => {
    if (session) {
      setSession(prev => prev ? {
        ...prev,
        context: { ...prev.context, ...updates }
      } : null);
    }
  }, [session]);

  // ============================================================================
  // RAG-ENHANCED ANALYSIS
  // ============================================================================

  const analyzeBusinessQuery = useCallback(async (query: string): Promise<AdvisorResponse[]> => {
    if (!session) return [];

    setIsProcessing(true);
    
    try {
      const responses: AdvisorResponse[] = [];
      const { context } = session;

      // 1. Industry-Specific Analysis
      if (context.industry) {
        const industryConfig = getIndustryConfig(context.industry);
        if (industryConfig) {
          // Analyze KPIs relevant to the query
          const relevantKPIs = industryConfig.kpis.filter(kpi => 
            query.toLowerCase().includes(kpi.name.toLowerCase()) ||
            query.toLowerCase().includes(kpi.category.toLowerCase())
          );

          if (relevantKPIs.length > 0) {
            responses.push({
              type: 'insight',
              content: `Based on ${context.industry} industry standards, here are the key KPIs you should focus on: ${relevantKPIs.map(kpi => kpi.name).join(', ')}. Industry benchmarks show excellent performance at ${relevantKPIs[0]?.excellent} ${relevantKPIs[0]?.unit}.`,
              confidence: 0.85,
              relatedData: { kpis: relevantKPIs },
              nextSteps: ['Set up KPI tracking', 'Establish baseline measurements', 'Create improvement plan'],
              automationPotential: 'high'
            });
          }

          // Analyze processes relevant to the query
          const relevantProcesses = industryConfig.processes.filter(process => 
            query.toLowerCase().includes(process.name.toLowerCase()) ||
            query.toLowerCase().includes(process.category.toLowerCase())
          );

          if (relevantProcesses.length > 0) {
            responses.push({
              type: 'recommendation',
              content: `For ${context.industry}, I recommend implementing the ${relevantProcesses[0].name} process. This typically takes ${relevantProcesses[0].estimatedTime} and has ${relevantProcesses[0].automationPotential} automation potential.`,
              confidence: 0.90,
              relatedData: { processes: relevantProcesses },
              nextSteps: ['Document current process', 'Identify automation opportunities', 'Train team on new process'],
              automationPotential: relevantProcesses[0].automationPotential
            });
          }
        }
      }

      // 2. Business Model Analysis
      if (context.businessModel) {
        const businessUnits = getBusinessUnitsForModel(context.businessModel);
        const relevantUnits = businessUnits.filter(unit => 
          query.toLowerCase().includes(unit.name.toLowerCase()) ||
          query.toLowerCase().includes(unit.category.toLowerCase())
        );

        if (relevantUnits.length > 0) {
          responses.push({
            type: 'insight',
            content: `For ${context.businessModel} businesses, the ${relevantUnits[0].name} unit is ${relevantUnits[0].priority} priority. Key metrics include ${relevantUnits[0].kpis.slice(0, 3).map(kpi => kpi.name).join(', ')}.`,
            confidence: 0.88,
            relatedData: { businessUnits: relevantUnits },
            nextSteps: ['Review current performance', 'Identify improvement areas', 'Implement recommended tools'],
            automationPotential: 'medium'
          });
        }
      }

      // 3. Standards and Compliance Analysis
      const relevantStandards = getStandardsByIndustry(context.industry);
      const mandatoryStandards = relevantStandards.filter(s => s.complianceLevel === 'mandatory');
      
      if (mandatoryStandards.length > 0 && query.toLowerCase().includes('compliance')) {
        responses.push({
          type: 'action',
          content: `⚠️ Critical: ${mandatoryStandards.length} mandatory compliance standards apply to your ${context.industry} business. Priority: ${mandatoryStandards[0].name} (${mandatoryStandards[0].estimatedTime} implementation).`,
          confidence: 0.95,
          relatedData: { standards: mandatoryStandards },
          nextSteps: ['Conduct compliance audit', 'Develop implementation plan', 'Allocate resources'],
          automationPotential: 'medium'
        });
      }

      // 4. Process Optimization Analysis
      const relevantProcesses = getProcessesByIndustry(context.industry);
      const highAutomationProcesses = relevantProcesses.filter(p => p.automationPotential === 'high');
      
      if (highAutomationProcesses.length > 0 && query.toLowerCase().includes('automation')) {
        responses.push({
          type: 'recommendation',
          content: `🚀 High automation opportunity: ${highAutomationProcesses.length} processes in ${context.industry} can be automated. Top candidate: ${highAutomationProcesses[0].name} (${highAutomationProcesses[0].estimatedTime} manual time → 80% automation potential).`,
          confidence: 0.92,
          relatedData: { processes: highAutomationProcesses },
          nextSteps: ['Map current process', 'Identify automation tools', 'Pilot automation'],
          automationPotential: 'high'
        });
      }

      // 5. Tool Recommendations
      if (context.industry && context.businessModel) {
        const industryIntegrations = getIndustryIntegrations(context.industry);
        const essentialTools = industryIntegrations.filter(tool => tool.category === 'essential');
        
        if (essentialTools.length > 0 && query.toLowerCase().includes('tools')) {
          responses.push({
            type: 'recommendation',
            content: `🛠️ Essential tools for ${context.industry} ${context.businessModel}: ${essentialTools.map(tool => tool.name).join(', ')}. Estimated ROI: ${essentialTools[0].estimatedROI}.`,
            confidence: 0.87,
            relatedData: { tools: essentialTools },
            nextSteps: ['Evaluate tool options', 'Plan integration', 'Budget allocation'],
            automationPotential: 'medium'
          });
        }
      }

      return responses;

    } catch (error) {
      console.error('Error analyzing business query:', error);
      toast({
        title: 'Analysis Error',
        description: 'Failed to analyze your query. Please try again.',
        variant: 'destructive'
      });
      return [];
    } finally {
      setIsProcessing(false);
    }
  }, [session, toast]);

  // ============================================================================
  // INTERACTIVE CONVERSATION
  // ============================================================================

  const handleQuerySubmit = useCallback(async () => {
    if (!currentQuery.trim() || !session) return;

    const userMessage = {
      role: 'user' as const,
      content: currentQuery,
      timestamp: new Date()
    };

    // Add user message to conversation
    setSession(prev => prev ? {
      ...prev,
      conversation: [...prev.conversation, userMessage]
    } : null);

    // Analyze query and generate responses
    const responses = await analyzeBusinessQuery(currentQuery);

    // Add advisor responses to conversation
    const advisorMessages = responses.map(response => ({
      role: 'advisor' as const,
      content: response.content,
      timestamp: new Date(),
      metadata: response
    }));

    setSession(prev => prev ? {
      ...prev,
      conversation: [...prev.conversation, ...advisorMessages],
      insights: [...prev.insights, ...responses.filter(r => r.type === 'insight')],
      recommendations: [...prev.recommendations, ...responses.filter(r => r.type === 'recommendation')]
    } : null);

    setCurrentQuery('');
  }, [currentQuery, session, analyzeBusinessQuery]);

  // ============================================================================
  // CONTEXTUAL RECOMMENDATIONS
  // ============================================================================

  const generateContextualRecommendations = useCallback(() => {
    if (!session) return [];

    const { context } = session;
    const recommendations: AdvisorResponse[] = [];

    // Industry-specific recommendations
    if (context.industry) {
      const industryConfig = getIndustryConfig(context.industry);
      if (industryConfig) {
        const highPriorityUnits = industryConfig.businessUnits.filter(unit => unit.priority === 'core');
        if (highPriorityUnits.length > 0) {
          recommendations.push({
            type: 'recommendation',
            content: `Focus on ${highPriorityUnits[0].name} - it's a core business unit for ${context.industry} companies.`,
            confidence: 0.90,
            relatedData: { businessUnit: highPriorityUnits[0] },
            nextSteps: ['Review current processes', 'Identify improvement opportunities', 'Set up monitoring'],
            automationPotential: 'medium'
          });
        }
      }
    }

    // Business model recommendations
    if (context.businessModel) {
      const businessUnits = getBusinessUnitsForModel(context.businessModel);
      const criticalUnits = businessUnits.filter(unit => unit.priority === 'critical');
      if (criticalUnits.length > 0) {
        recommendations.push({
          type: 'recommendation',
          content: `For ${context.businessModel} success, prioritize ${criticalUnits[0].name} - it's critical for your business model.`,
          confidence: 0.95,
          relatedData: { businessUnit: criticalUnits[0] },
          nextSteps: ['Assess current performance', 'Implement recommended tools', 'Set up KPIs'],
          automationPotential: 'high'
        });
      }
    }

    return recommendations;
  }, [session]);

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderConversationMessage = (message: any, index: number) => {
    const isUser = message.role === 'user';
    
    return (
      <div key={index} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-[80%] ${isUser ? 'bg-blue-500 text-white' : 'bg-gray-100'} rounded-lg p-3`}>
          <p className="text-sm">{message.content}</p>
          {message.metadata && (
            <div className="mt-2 text-xs opacity-75">
              <Badge variant="outline" className="mr-1">
                {message.metadata.type}
              </Badge>
              <span>Confidence: {Math.round(message.metadata.confidence * 100)}%</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderInsightCard = (insight: AdvisorResponse, index: number) => (
    <Card key={index} className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center">
            <Lightbulb className="w-4 h-4 mr-2 text-yellow-500" />
            {insight.type === 'insight' ? 'Business Insight' : 'Recommendation'}
          </CardTitle>
          <Badge variant={insight.automationPotential === 'high' ? 'default' : 'secondary'}>
            {insight.automationPotential} automation
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm mb-3">{insight.content}</p>
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-600">Next Steps:</p>
          <ul className="text-xs space-y-1">
            {insight.nextSteps.map((step, i) => (
              <li key={i} className="flex items-center">
                <ArrowRight className="w-3 h-3 mr-1" />
                {step}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Intelligent Business Advisor</h1>
        <p className="text-gray-600">
          AI-powered guidance for your industry, business model, and growth objectives
        </p>
      </div>

      {/* Business Context Setup */}
      {!session && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Set Up Your Business Context
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Industry</label>
                <select 
                  className="w-full p-2 border rounded-md"
                  value={selectedIndustry}
                  onChange={(e) => setSelectedIndustry(e.target.value)}
                >
                  <option value="">Select industry</option>
                  {industryConfigs.map(industry => (
                    <option key={industry.id} value={industry.id}>
                      {industry.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Business Model</label>
                <select 
                  className="w-full p-2 border rounded-md"
                  value={selectedBusinessModel}
                  onChange={(e) => setSelectedBusinessModel(e.target.value)}
                >
                  <option value="">Select business model</option>
                  <option value="B2B">B2B</option>
                  <option value="B2C">B2C</option>
                  <option value="SaaS">SaaS</option>
                  <option value="Consulting">Consulting</option>
                  <option value="E-commerce">E-commerce</option>
                  <option value="Manufacturing">Manufacturing</option>
                </select>
              </div>
            </div>
            <Button 
              className="mt-4"
              onClick={() => {
                if (selectedIndustry && selectedBusinessModel) {
                  initializeSession({
                    industry: selectedIndustry,
                    businessModel: selectedBusinessModel,
                    companySize: 'small',
                    currentChallenges: [],
                    goals: [],
                    priorities: []
                  });
                }
              }}
              disabled={!selectedIndustry || !selectedBusinessModel}
            >
              Start Advisor Session
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Main Advisor Interface */}
      {session && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <Card className="h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Business Advisor Chat
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                {/* Conversation Area */}
                <div className="flex-1 overflow-y-auto mb-4 p-4 bg-gray-50 rounded-lg">
                  {session.conversation.map((message, index) => 
                    renderConversationMessage(message, index)
                  )}
                  {isProcessing && (
                    <div className="flex justify-start mb-4">
                      <div className="bg-gray-100 rounded-lg p-3">
                        <div className="flex items-center">
                          <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
                          Analyzing your business context...
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input Area */}
                <div className="flex gap-2">
                  <Input
                    value={currentQuery}
                    onChange={(e) => setCurrentQuery(e.target.value)}
                    placeholder="Ask about KPIs, processes, tools, or business strategy..."
                    onKeyPress={(e) => e.key === 'Enter' && handleQuerySubmit()}
                  />
                  <Button onClick={handleQuerySubmit} disabled={isProcessing}>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Insights Panel */}
          <div className="space-y-6">
            {/* Business Context */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center">
                  <Target className="w-4 h-4 mr-2" />
                  Business Context
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-xs">
                  <span className="font-medium">Industry:</span> {session.context.industry}
                </div>
                <div className="text-xs">
                  <span className="font-medium">Model:</span> {session.context.businessModel}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-2"
                  onClick={() => setSession(null)}
                >
                  Change Context
                </Button>
              </CardContent>
            </Card>

            {/* Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center">
                  <Lightbulb className="w-4 h-4 mr-2" />
                  Insights & Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {session.insights.map((insight, index) => 
                    renderInsightCard(insight, index)
                  )}
                  {session.insights.length === 0 && (
                    <p className="text-xs text-gray-500">
                      Start a conversation to get personalized insights
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center">
                  <Zap className="w-4 h-4 mr-2" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => setCurrentQuery("What are the most important KPIs for my business?")}
                  >
                    <TrendingUp className="w-3 h-3 mr-2" />
                    Key KPIs
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => setCurrentQuery("What processes should I automate first?")}
                  >
                    <Zap className="w-3 h-3 mr-2" />
                    Automation Opportunities
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => setCurrentQuery("What tools do I need for my business?")}
                  >
                    <Settings className="w-3 h-3 mr-2" />
                    Tool Recommendations
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => setCurrentQuery("What compliance standards apply to my business?")}
                  >
                    <Shield className="w-3 h-3 mr-2" />
                    Compliance Check
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntelligentBusinessAdvisor;
