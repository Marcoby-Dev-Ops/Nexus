import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { ContextCompletionSuggestions } from '@/domains/ai/components/ContextCompletionSuggestions';
import { useContextualDataCompletion } from '@/domains/ai/hooks/useContextualDataCompletion';
import { useAuthContext } from '@/domains/admin/user/hooks/AuthContext';
import { Brain, Zap, TrendingUp, CheckCircle2, AlertCircle } from 'lucide-react';

/**
 * Demo component to showcase Contextual Data Completion functionality
 */
export const ContextualDataCompletionDemo: React.FC = () => {
  const { user } = useAuthContext();
  const [demoMode, setDemoMode] = useState<'conversation' | 'proactive' | 'queryBased'>('conversation');
  const [selectedQuery, setSelectedQuery] = useState('');
  const [selectedResponse, setSelectedResponse] = useState('');
  
  const contextCompletion = useContextualDataCompletion({
    autoAnalyze: true,
    proactiveSuggestions: true,
    trackInteractions: true
  });

  // Demo queries and responses
  const demoScenarios = {
    conversation: [
      {
        query: "How is our sales performance this quarter?",
        response: "I'd love to provide specific sales insights, but I need access to your CRM data first. Based on general business trends, Q3 typically sees a 15-20% increase...",
        expectedGaps: ['CRM integration', 'Sales role context', 'Company industry']
      },
      {
        query: "What should I focus on as a manager?",
        response: "As a business professional, I recommend focusing on team productivity and strategic planning. However, I could provide more specific guidance if I knew your department and experience level...",
        expectedGaps: ['Job title', 'Department', 'Experience level', 'Team size']
      },
      {
        query: "Help me improve our marketing campaigns",
        response: "Marketing optimization depends on your current tools and performance data. Generally, focus on audience segmentation and A/B testing...",
        expectedGaps: ['Marketing tools', 'Campaign data', 'Target audience', 'Budget information']
      }
    ],
    proactive: {
      title: "Proactive Context Suggestions",
      description: "Based on your profile and usage patterns, here are suggestions to improve AI assistance:"
    },
    queryBased: [
      {
        query: "Show me my sales pipeline",
        department: "sales",
        expectedSuggestions: ['Connect CRM', 'Add sales role info', 'Set up HubSpot integration']
      },
      {
        query: "What's our cash flow looking like?",
        department: "finance", 
        expectedSuggestions: ['Connect accounting software', 'Add financial role', 'Link banking data']
      },
      {
        query: "How can I be more productive?",
        department: undefined,
        expectedSuggestions: ['Complete personal profile', 'Add work preferences', 'Connect productivity tools']
      }
    ]
  };

  const handleAnalyzeConversation = async (query: string, response: string) => {
    if (!user?.id) return;
    
    setSelectedQuery(query);
    setSelectedResponse(response);
    
    await contextCompletion.analyzeConversation(query, response);
  };

  const handleGenerateContextualSuggestions = async (query: string, department?: string) => {
    setSelectedQuery(query);
    await contextCompletion.generateContextualSuggestions(query, department);
  };

  const handleContextCompleted = (completedGaps: any[]) => {
    console.log('Context completed:', completedGaps);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card className="border-border bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-4">
            <Brain className="w-6 h-6 text-primary" />
            Contextual Data Completion System
          </CardTitle>
          <p className="text-muted-foreground">
            Proactive AI system that detects missing context and suggests what data to add for better personalization and "source of truth" qualities.
          </p>
        </CardHeader>
      </Card>

      {/* Demo Mode Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Demo Scenarios</CardTitle>
          <div className="flex gap-2">
            <Button 
              variant={demoMode === 'conversation' ? 'default' : 'outline'}
              onClick={() => setDemoMode('conversation')}
              size="sm"
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              Conversation Analysis
            </Button>
            <Button 
              variant={demoMode === 'proactive' ? 'default' : 'outline'}
              onClick={() => setDemoMode('proactive')}
              size="sm"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Proactive Suggestions
            </Button>
            <Button 
              variant={demoMode === 'queryBased' ? 'default' : 'outline'}
              onClick={() => setDemoMode('queryBased')}
              size="sm"
            >
              <Zap className="w-4 h-4 mr-2" />
              Query-Based
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Current Context Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Context Completion Status</span>
            <Badge variant="outline">
              {contextCompletion.completionPercentage.toFixed(0)}% Complete
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{contextCompletion.totalGaps}</div>
              <div className="text-sm text-muted-foreground">Total Gaps</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-success">{contextCompletion.completedGaps}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-warning">{contextCompletion.suggestions.length}</div>
              <div className="text-sm text-muted-foreground">Suggestions</div>
            </div>
            <div className="flex items-center justify-center">
              {contextCompletion.hasHighPrioritySuggestions ? (
                <Badge variant="destructive">High Priority</Badge>
              ) : contextCompletion.needsAttention ? (
                <Badge variant="secondary">Needs Attention</Badge>
              ) : (
                <Badge variant="default" className="bg-success/10 text-success">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Good
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Demo Content based on selected mode */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Demo Scenarios */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {demoMode === 'conversation' && 'Conversation Analysis Demo'}
              {demoMode === 'proactive' && 'Proactive Suggestions Demo'}  
              {demoMode === 'queryBased' && 'Query-Based Suggestions Demo'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {demoMode === 'conversation' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Try these example conversations to see how the AI detects missing context:
                </p>
                {demoScenarios.conversation.map((scenario, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="space-y-2">
                      <div className="text-sm">
                        <strong>User:</strong> {scenario.query}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <strong>AI:</strong> {scenario.response}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleAnalyzeConversation(scenario.query, scenario.response)}
                        >
                          Analyze Context Gaps
                        </Button>
                        <div className="text-xs text-muted-foreground">
                          Expected gaps: {scenario.expectedGaps.join(', ')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {demoMode === 'proactive' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {demoScenarios.proactive.description}
                </p>
                <Button 
                  onClick={() => contextCompletion.loadProactiveSuggestions()}
                  disabled={contextCompletion.loading}
                >
                  {contextCompletion.loading ? 'Loading...' : 'Load Proactive Suggestions'}
                </Button>
              </div>
            )}

            {demoMode === 'queryBased' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  See how different query types generate specific context suggestions:
                </p>
                {demoScenarios.queryBased.map((scenario, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="space-y-2">
                      <div className="text-sm">
                        <strong>Query:</strong> {scenario.query}
                        {scenario.department && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            {scenario.department}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleGenerateContextualSuggestions(scenario.query, scenario.department)}
                        >
                          Generate Suggestions
                        </Button>
                        <div className="text-xs text-muted-foreground">
                          Expected: {scenario.expectedSuggestions.join(', ')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Context Completion Suggestions</CardTitle>
            {selectedQuery && (
              <div className="text-sm text-muted-foreground">
                Analyzing: "{selectedQuery}"
              </div>
            )}
          </CardHeader>
          <CardContent>
            {contextCompletion.loading ? (
              <div className="flex items-center justify-center py-8">
                <Brain className="w-6 h-6 text-primary animate-spin mr-2" />
                <span>Analyzing context...</span>
              </div>
            ) : contextCompletion.suggestions.length > 0 || contextCompletion.conversationAnalysis ? (
              <ContextCompletionSuggestions
                conversationAnalysis={contextCompletion.conversationAnalysis}
                showProactive={demoMode === 'proactive'}
                onComplete={handleContextCompleted}
                className="h-full"
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Brain className="w-12 h-12 mx-auto mb-4 text-muted-foreground/60" />
                <p>Run a demo scenario to see context completion suggestions</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Feature Benefits */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Key Benefits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4">
              <Brain className="w-8 h-8 text-primary mx-auto mb-2" />
              <h4 className="font-medium mb-1">Proactive Intelligence</h4>
              <p className="text-sm text-muted-foreground">
                Detects when AI responses need specific context that isn't available
              </p>
            </div>
            <div className="text-center p-4">
              <Zap className="w-8 h-8 text-warning mx-auto mb-2" />
              <h4 className="font-medium mb-1">Smart Suggestions</h4>
              <p className="text-sm text-muted-foreground">
                Recommends specific data based on what the user is trying to do
              </p>
            </div>
            <div className="text-center p-4">
              <TrendingUp className="w-8 h-8 text-success mx-auto mb-2" />
              <h4 className="font-medium mb-1">Source of Truth</h4>
              <p className="text-sm text-muted-foreground">
                Transforms Nexus into comprehensive business intelligence hub
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Technical Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <strong>1. Context Gap Detection:</strong> Analyzes user queries and AI responses to identify missing context that would improve personalization
            </div>
            <div>
              <strong>2. Intelligent Suggestions:</strong> Generates specific, actionable suggestions based on query intent, user role, and department focus
            </div>
            <div>
              <strong>3. Proactive Completion:</strong> Provides one-click fills for common fields and guided completion flows for complex data
            </div>
            <div>
              <strong>4. Learning & Adaptation:</strong> Tracks user behavior to improve suggestion quality and timing over time
            </div>
            <div>
              <strong>5. Impact Measurement:</strong> Quantifies the expected and actual impact of completed context on AI assistance quality
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContextualDataCompletionDemo; 