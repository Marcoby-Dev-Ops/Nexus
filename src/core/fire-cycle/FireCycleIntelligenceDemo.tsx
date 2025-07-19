import React, { useState, useEffect } from 'react';
import { FireCycleAgent, type AgentResponse } from './fireCycleAgent';
import { useEnhancedFireCycle } from './enhancedFireCycleStore';
import type { UserContext } from './fireCycleLogic';

interface FireCycleIntelligenceDemoProps {
  className?: string;
}

export const FireCycleIntelligenceDemo: React.FC<FireCycleIntelligenceDemoProps> = ({
  className = ''
}) => {
  const [input, setInput] = useState('');
  const [responses, setResponses] = useState<AgentResponse[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  
  const { updateGoals, updateProjects, updateMetrics, updateChallenges } = useEnhancedFireCycle();

  // Initialize demo user context
  useEffect(() => {
    const demoContext: UserContext = {
      role: 'Product Manager',
      department: 'Product',
      experienceLevel: 'intermediate',
      goals: [
        'Increase user engagement by 30%',
        'Launch new feature by Q2',
        'Improve customer satisfaction score'
      ],
      challenges: [
        'Limited development resources',
        'Competitive market pressure',
        'User feedback integration'
      ],
      currentProjects: [
        {
          id: '1',
          name: 'User Engagement Campaign',
          status: 'active',
          priority: 'high',
          progress: 65,
          team: ['Marketing', 'Product'],
          metrics: []
        },
        {
          id: '2',
          name: 'Feature Launch',
          status: 'planning',
          priority: 'medium',
          progress: 25,
          team: ['Engineering', 'Design'],
          metrics: []
        }
      ],
      recentActivities: [],
      metrics: [
        {
          id: '1',
          name: 'Daily Active Users',
          value: 12500,
          target: 15000,
          unit: 'users',
          category: 'growth',
          trend: 'up',
          changePercent: 8.5,
          lastUpdated: new Date()
        }
      ],
      integrations: [],
      companySize: '50-100',
      industry: 'SaaS',
      stage: 'growth'
    };

    setUserContext(demoContext);
    
    // Update FIRE cycle store with demo data
    updateGoals(demoContext.goals);
    updateProjects(demoContext.currentProjects);
    updateMetrics(demoContext.metrics);
    updateChallenges(demoContext.challenges);
  }, [updateGoals, updateProjects, updateMetrics, updateChallenges]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !userContext) return;

    setIsProcessing(true);
    
    try {
      const agent = new FireCycleAgent(userContext);
      const response = await agent.processInput(input);
      
      setResponses(prev => [response, ...prev]);
      setInput('');
    } catch (error) {
      console.error('Processing error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'focus': return 'text-blue-600 bg-blue-100';
      case 'insight': return 'text-yellow-600 bg-yellow-100';
      case 'roadmap': return 'text-green-600 bg-green-100';
      case 'execute': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!userContext) {
    return (
      <div className={`bg-card border rounded-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded mb-4"></div>
          <div className="h-4 bg-muted rounded mb-2"></div>
          <div className="h-4 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-card border rounded-lg p-6">
        <h2 className="text-xl font-semibold text-foreground mb-2">
          FIRE Cycle Intelligence Demo
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Try entering different types of inputs to see how the FIRE cycle processes them intelligently.
        </p>
        
        {/* Example inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <h4 className="font-medium text-foreground">Focus Examples:</h4>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div>• "I need to increase revenue by 20%"</div>
              <div>• "Having trouble with team productivity"</div>
              <div>• "Goal: Launch new product by Q3"</div>
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-foreground">Insight Examples:</h4>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div>• "User engagement increased 15% this month"</div>
              <div>• "Discovered customers want mobile app"</div>
              <div>• "Conversion rate dropped 5%"</div>
            </div>
          </div>
        </div>
      </div>

      {/* Input Form */}
      <div className="bg-card border rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="input" className="block text-sm font-medium text-foreground mb-2">
              Enter your input:
            </label>
            <textarea
              id="input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Try: 'I need to increase user engagement by 30%' or 'Revenue increased 25% this quarter'"
              className="w-full p-3 border rounded-lg bg-background text-foreground placeholder-muted-foreground resize-none"
              rows={3}
              disabled={isProcessing}
            />
          </div>
          <button
            type="submit"
            disabled={isProcessing || !input.trim()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isProcessing ? 'Processing...' : 'Analyze Input'}
          </button>
        </form>
      </div>

      {/* Responses */}
      {responses.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Analysis Results</h3>
          {responses.map((response) => (
            <div key={response.id} className="bg-card border rounded-lg p-6">
              {/* Input Summary */}
              <div className="mb-4 p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Original Input:</span>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getPhaseColor(response.firePhase)}`}>
                      {response.firePhase.toUpperCase()}
                    </span>
                    <span className={`text-xs font-medium ${getConfidenceColor(response.confidence)}`}>
                      {Math.round(response.confidence * 100)}% Confidence
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{response.input.originalInput}</p>
              </div>

              {/* Agent Response */}
              <div className="mb-4">
                <h4 className="font-medium text-foreground mb-2">FIRE Analysis:</h4>
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-sm text-foreground">
                    {response.response}
                  </div>
                </div>
              </div>

              {/* Reasoning */}
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-1">Reasoning:</h4>
                <p className="text-sm text-blue-800">{response.reasoning}</p>
              </div>

              {/* Suggestions */}
              {response.suggestions.length > 0 && (
                <div>
                  <h4 className="font-medium text-foreground mb-2">Suggestions:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {response.suggestions.map((suggestion) => (
                      <div
                        key={suggestion.id}
                        className="p-3 border rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={suggestion.action}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-foreground">
                            {suggestion.title}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getPhaseColor(suggestion.firePhase)}`}>
                            {suggestion.firePhase}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{suggestion.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Entity Analysis */}
              {response.input.entities.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-foreground mb-2">Detected Entities:</h4>
                  <div className="flex flex-wrap gap-2">
                    {response.input.entities.map((entity, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-muted text-xs rounded-full"
                      >
                        {entity.type}: {entity.value}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Processing Stats */}
      {responses.length > 0 && (
        <div className="bg-card border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Processing Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{responses.length}</div>
              <div className="text-xs text-muted-foreground">Total Processed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {Math.round(responses.reduce((sum, r) => sum + r.confidence, 0) / responses.length * 100)}%
              </div>
              <div className="text-xs text-muted-foreground">Avg Confidence</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {responses.filter(r => r.input.isNewItem).length}
              </div>
              <div className="text-xs text-muted-foreground">New Items</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {responses.filter(r => !r.input.isNewItem).length}
              </div>
              <div className="text-xs text-muted-foreground">Updates</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 