import React, { useState, useEffect } from 'react';
import { MessageSquare, Target, Lightbulb, Map, Zap, Clock, TrendingUp, Users, BarChart3, ChevronRight, Play, BookOpen, CheckCircle } from 'lucide-react';
import { useExecutiveAssistant, type ExecutiveAssistantResponse, type CoachingSession } from '@/core/fire-cycle/executiveAssistant';
import type { UserContext } from '@/core/fire-cycle/fireCycleLogic';

interface ExecutiveAssistantProps {
  userContext: UserContext;
  className?: string;
}

export const ExecutiveAssistant: React.FC<ExecutiveAssistantProps> = ({
  userContext,
  className = ''
}) => {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentResponse, setCurrentResponse] = useState<ExecutiveAssistantResponse | null>(null);
  const [sessionHistory, setSessionHistory] = useState<CoachingSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const { provideCoaching, getCoachingHistory } = useExecutiveAssistant(userContext);

  useEffect(() => {
    // Load coaching history
    const history = getCoachingHistory();
    setSessionHistory(history);
  }, [getCoachingHistory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsProcessing(true);
    try {
      const response = await provideCoaching(input);
      setCurrentResponse(response);
      setInput('');
      
      // Refresh history
      const history = getCoachingHistory();
      setSessionHistory(history);
    } catch (error) {
      console.error('Coaching error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getResponseTypeIcon = (type: string) => {
    switch (type) {
      case 'coaching': return <Target className="w-5 h-5" />;
      case 'analysis': return <BarChart3 className="w-5 h-5" />;
      case 'recommendation': return <Map className="w-5 h-5" />;
      case 'action': return <Zap className="w-5 h-5" />;
      case 'insight': return <Lightbulb className="w-5 h-5" />;
      default: return <MessageSquare className="w-5 h-5" />;
    }
  };

  const getResponseTypeColor = (type: string) => {
    switch (type) {
      case 'coaching': return 'text-blue-600 bg-blue-100';
      case 'analysis': return 'text-purple-600 bg-purple-100';
      case 'recommendation': return 'text-green-600 bg-green-100';
      case 'action': return 'text-orange-600 bg-orange-100';
      case 'insight': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'transformational': return 'text-purple-600 bg-purple-100';
      case 'high': return 'text-blue-600 bg-blue-100';
      case 'medium': return 'text-green-600 bg-green-100';
      case 'low': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-card border rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 rounded-lg bg-primary bg-opacity-10">
            <MessageSquare className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Executive Assistant</h2>
            <p className="text-sm text-muted-foreground">
              AI-powered business coaching with FIRE cycle intelligence
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Users className="w-4 h-4" />
            <span>Role: {userContext.role}</span>
          </div>
          <div className="flex items-center space-x-1">
            <BarChart3 className="w-4 h-4" />
            <span>{sessionHistory.length} coaching sessions</span>
          </div>
        </div>
      </div>

      {/* Input Form */}
      <div className="bg-card border rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="coaching-input" className="block text-sm font-medium text-foreground mb-2">
              What would you like to discuss?
            </label>
            <textarea
              id="coaching-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Try: 'I need to improve our sales pipeline' or 'How can we optimize our marketing campaigns?'"
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
            {isProcessing ? 'Processing...' : 'Get Executive Coaching'}
          </button>
        </form>
      </div>

      {/* Current Response */}
      {currentResponse && (
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              {getResponseTypeIcon(currentResponse.type)}
              <div>
                <h3 className="text-lg font-semibold text-foreground">{currentResponse.title}</h3>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getResponseTypeColor(currentResponse.type)}`}>
                    {currentResponse.type}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {Math.round(currentResponse.confidence * 100)}% confidence
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Message */}
          <div className="prose prose-sm max-w-none mb-6">
            <div className="whitespace-pre-wrap text-foreground">
              {currentResponse.message}
            </div>
          </div>

          {/* Context */}
          <div className="mb-6 p-3 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground">{currentResponse.context}</p>
          </div>

          {/* Data Insights */}
          {currentResponse.dataInsights && currentResponse.dataInsights.length > 0 && (
            <div className="mb-6">
              <h4 className="font-medium text-foreground mb-3">Data Insights</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentResponse.dataInsights.map((insight) => (
                  <div key={insight.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-foreground">{insight.title}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        insight.category === 'performance' ? 'text-blue-600 bg-blue-100' :
                        insight.category === 'trend' ? 'text-green-600 bg-green-100' :
                        insight.category === 'anomaly' ? 'text-yellow-600 bg-yellow-100' :
                        insight.category === 'opportunity' ? 'text-purple-600 bg-purple-100' :
                        'text-red-600 bg-red-100'
                      }`}>
                        {insight.category}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{insight.description}</p>
                    {insight.actionable && (
                      <div className="mt-2 flex items-center space-x-1">
                        <CheckCircle className="w-3 h-3 text-green-600" />
                        <span className="text-xs text-green-600">Actionable</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {currentResponse.suggestions.length > 0 && (
            <div className="mb-6">
              <h4 className="font-medium text-foreground mb-3">Executive Suggestions</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentResponse.suggestions.map((suggestion) => (
                  <div key={suggestion.id} className="p-3 border rounded-lg hover:bg-muted/30 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-foreground">{suggestion.title}</span>
                      <div className="flex items-center space-x-1">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(suggestion.priority)}`}>
                          {suggestion.priority}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getImpactColor(suggestion.impact)}`}>
                          {suggestion.impact}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{suggestion.description}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{suggestion.estimatedEffort} min</span>
                      {suggestion.canAutomate && (
                        <span className="flex items-center space-x-1">
                          <Play className="w-3 h-3" />
                          <span>Auto</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next Steps */}
          {currentResponse.nextSteps.length > 0 && (
            <div>
              <h4 className="font-medium text-foreground mb-3">Strategic Next Steps</h4>
              <div className="space-y-3">
                {currentResponse.nextSteps.map((step) => (
                  <div key={step.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-foreground">{step.title}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(step.priority)}`}>
                        {step.priority}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{step.description}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{step.estimatedTime} min</span>
                      <span>{step.resources.length} resources</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Playbook */}
          {currentResponse.playbook && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Recommended Playbook</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-900">{currentResponse.playbook.playbook.name}</span>
                </div>
                <p className="text-sm text-green-800">{currentResponse.playbook.playbook.description}</p>
                <div className="flex items-center space-x-2 text-xs text-green-700">
                  <span>{currentResponse.playbook.playbook.estimatedTime} min</span>
                  <span>•</span>
                  <span>{Math.round(currentResponse.playbook.relevance * 100)}% match</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Session History */}
      {sessionHistory.length > 0 && (
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Coaching History</h3>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center space-x-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>{showHistory ? 'Hide' : 'Show'} History</span>
              <ChevronRight className={`w-4 h-4 transition-transform ${showHistory ? 'rotate-90' : ''}`} />
            </button>
          </div>

          {showHistory && (
            <div className="space-y-4">
              {sessionHistory.slice(0, 5).map((session) => (
                <div key={session.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-foreground">{session.assistantResponse.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {session.timestamp.toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{session.userInput}</p>
                  <div className="flex items-center space-x-2 text-xs">
                    <span className={`px-2 py-1 rounded ${getResponseTypeColor(session.assistantResponse.type)}`}>
                      {session.assistantResponse.type}
                    </span>
                    <span>{session.actionItems.length} actions</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 