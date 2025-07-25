import React, { useEffect, useState } from 'react';
import { Target, Lightbulb, Map, Play, AlertTriangle, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { useEnhancedFireCycle } from './enhancedFireCycleStore';
import type { FireCyclePhase } from '@/types/business/fire-cycle';

interface IntelligentFireCycleProps {
  variant?: 'compact' | 'expanded' | 'contextual';
  className?: string;
  autoAnalyze?: boolean;
}

export const IntelligentFireCycle: React.FC<IntelligentFireCycleProps> = ({
  variant = 'compact',
  className = '',
  autoAnalyze = true
}) => {
  const {
    phase,
    analysis,
    currentInsights,
    currentRecommendations,
    currentActions,
    priority,
    confidence,
    triggerAnalysis,
    getPrioritizedActions
  } = useEnhancedFireCycle();

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (autoAnalyze && !analysis) {
      handleAnalysis();
    }
  }, [autoAnalyze, analysis]);

  const handleAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      await triggerAnalysis();
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Analysis failed: ', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getPhaseIcon = (phaseId: FireCyclePhase) => {
    switch (phaseId) {
      case 'focus': return Target;
      case 'insight': return Lightbulb;
      case 'roadmap': return Map;
      case 'execute': return Play;
      default: return Target;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-100 border-green-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (variant === 'compact') {
    return (
      <div className={`bg-card border rounded-lg p-4 shadow-sm ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-full bg-primary/10">
              {React.createElement(getPhaseIcon(phase), { className: "w-5 h-5 text-primary" })}
            </div>
            <div>
              <h3 className="font-semibold text-foreground">FIRE Cycle</h3>
              <p className="text-sm text-muted-foreground">
                {analysis?.reasoning || 'Analyzing your context...'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {isAnalyzing ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            ) : (
              <button
                onClick={handleAnalysis}
                className="p-1 rounded hover: bg-muted transition-colors"
                title="Refresh Analysis"
              >
                <TrendingUp className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Priority and Confidence */}
        <div className="flex items-center justify-between mb-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(priority)}`}>
            {priority.toUpperCase()} Priority
          </span>
          <span className={`text-xs font-medium ${getConfidenceColor(confidence)}`}>
            {Math.round(confidence * 100)}% Confidence
          </span>
        </div>

        {/* Top Recommendation */}
        {currentRecommendations.length > 0 && (
          <div className="bg-muted/30 rounded-lg p-3 mb-3">
            <h4 className="font-medium text-foreground mb-1">
              {currentRecommendations[0].title}
            </h4>
            <p className="text-sm text-muted-foreground">
              {currentRecommendations[0].description}
            </p>
          </div>
        )}

        {/* Top Action */}
        {currentActions.length > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="font-medium text-foreground text-sm">
                {currentActions[0].title}
              </h4>
              <p className="text-xs text-muted-foreground">
                {currentActions[0].description}
              </p>
            </div>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="ml-2 p-1 rounded hover: bg-muted transition-colors"
            >
              <CheckCircle className="w-4 h-4 text-primary" />
            </button>
          </div>
        )}

        {/* Expanded Details */}
        {showDetails && (
          <div className="mt-4 space-y-3">
            {/* Insights */}
            {currentInsights.length > 0 && (
              <div>
                <h4 className="font-medium text-foreground mb-2">Insights</h4>
                <div className="space-y-2">
                  {currentInsights.slice(0, 2).map((insight) => (
                    <div key={insight.id} className="flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{insight.title}</p>
                        <p className="text-xs text-muted-foreground">{insight.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            {currentActions.length > 0 && (
              <div>
                <h4 className="font-medium text-foreground mb-2">Actions</h4>
                <div className="space-y-2">
                  {getPrioritizedActions().slice(0, 3).map((action) => (
                    <div key={action.id} className="flex items-center justify-between p-2 bg-muted/20 rounded">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{action.title}</p>
                        <p className="text-xs text-muted-foreground">{action.description}</p>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(action.priority)}`}>
                          {action.priority}
                        </span>
                        {action.estimatedDuration && (
                          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>{action.estimatedDuration}m</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Expanded variant
  return (
    <div className={`bg-card border rounded-lg p-6 shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-foreground">Intelligent FIRE Cycle</h3>
          <p className="text-sm text-muted-foreground">
            Data-driven recommendations based on your context
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(priority)}`}>
            {priority.toUpperCase()} Priority
          </span>
          <span className={`text-sm font-medium ${getConfidenceColor(confidence)}`}>
            {Math.round(confidence * 100)}% Confidence
          </span>
        </div>
      </div>

      {/* Current Phase */}
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-3">
          <div className="p-3 rounded-full bg-primary/10">
            {React.createElement(getPhaseIcon(phase), { className: "w-6 h-6 text-primary" })}
          </div>
          <div>
            <h4 className="font-semibold text-foreground capitalize">{phase} Phase</h4>
            <p className="text-sm text-muted-foreground">
              {analysis?.reasoning || 'Analyzing your current context...'}
            </p>
          </div>
        </div>
      </div>

      {/* Insights */}
      {currentInsights.length > 0 && (
        <div className="mb-6">
          <h4 className="font-semibold text-foreground mb-3">Key Insights</h4>
          <div className="space-y-3">
            {currentInsights.map((insight) => (
              <div key={insight.id} className="flex items-start space-x-3 p-3 bg-muted/20 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
                <div className="flex-1">
                  <h5 className="font-medium text-foreground">{insight.title}</h5>
                  <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(insight.impact)}`}>
                      {insight.impact} Impact
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {Math.round(insight.confidence * 100)}% Confidence
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {currentRecommendations.length > 0 && (
        <div className="mb-6">
          <h4 className="font-semibold text-foreground mb-3">Recommendations</h4>
          <div className="space-y-3">
            {currentRecommendations.map((rec) => (
              <div key={rec.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <h5 className="font-medium text-foreground">{rec.title}</h5>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(rec.priority)}`}>
                    {rec.priority}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{rec.description}</p>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="font-medium">Effort: </span> {rec.effort}
                  </div>
                  <div>
                    <span className="font-medium">Expected Outcome:</span> {rec.expectedOutcome}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      {currentActions.length > 0 && (
        <div>
          <h4 className="font-semibold text-foreground mb-3">Prioritized Actions</h4>
          <div className="space-y-3">
            {getPrioritizedActions().map((action) => (
              <div key={action.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h5 className="font-medium text-foreground">{action.title}</h5>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                  <div className="flex items-center space-x-4 mt-2 text-xs">
                    <span>Type: {action.type}</span>
                    <span>Effort: {action.effort}</span>
                    <span>Impact: {action.impact}</span>
                    {action.estimatedDuration && (
                      <span>Duration: {action.estimatedDuration}m</span>
                    )}
                  </div>
                </div>
                <button className="ml-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover: bg-primary/90 transition-colors">
                  Start
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analysis Controls */}
      <div className="mt-6 pt-4 border-t">
        <button
          onClick={handleAnalysis}
          disabled={isAnalyzing}
          className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover: bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isAnalyzing ? 'Analyzing...' : 'Refresh Analysis'}
        </button>
      </div>
    </div>
  );
}; 