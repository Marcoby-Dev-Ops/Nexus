import React, { useState, useEffect } from 'react';
import { CheckCircle, Play, Clock, Target, Lightbulb, Map, Zap, ChevronRight, ChevronDown } from 'lucide-react';
import { useFireCyclePlaybooks, type PlaybookRecommendation, type SolutionsPlaybook } from './fireCyclePlaybooks';
import type { UserContext } from './fireCycleLogic';
import type { FireCyclePhase } from '@/domains/business/fire-cycle/types';

interface SolutionsPlaybookUIProps {
  userContext: UserContext;
  currentPhase: FireCyclePhase;
  detectedProblem?: string;
  className?: string;
}

export const SolutionsPlaybookUI: React.FC<SolutionsPlaybookUIProps> = ({
  userContext,
  currentPhase,
  detectedProblem,
  className = ''
}) => {
  const [recommendations, setRecommendations] = useState<PlaybookRecommendation[]>([]);
  const [selectedPlaybook, setSelectedPlaybook] = useState<SolutionsPlaybook | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const { recommendPlaybook } = useFireCyclePlaybooks();

  useEffect(() => {
    const loadRecommendations = async () => {
      setIsLoading(true);
      try {
        const recs = await recommendPlaybook(userContext, currentPhase, detectedProblem);
        setRecommendations(recs);
      } catch (error) {
        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error loading playbook recommendations: ', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRecommendations();
  }, [userContext, currentPhase, detectedProblem, recommendPlaybook]);

  const handlePlaybookSelect = (playbook: SolutionsPlaybook) => {
    setSelectedPlaybook(playbook);
    setExpandedSteps(new Set(['step-1'])); // Auto-expand first step
  };

  const toggleStepExpansion = (stepId: string) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedSteps(newExpanded);
  };

  const markStepComplete = (stepId: string) => {
    const newCompleted = new Set(completedSteps);
    newCompleted.add(stepId);
    setCompletedSteps(newCompleted);
  };

  const getPhaseIcon = (phase: FireCyclePhase) => {
    switch (phase) {
      case 'focus': return <Target className="w-4 h-4" />;
      case 'insight': return <Lightbulb className="w-4 h-4" />;
      case 'roadmap': return <Map className="w-4 h-4" />;
      case 'execute': return <Zap className="w-4 h-4" />;
    }
  };

  const getPhaseColor = (phase: FireCyclePhase) => {
    switch (phase) {
      case 'focus': return 'text-blue-600 bg-blue-100';
      case 'insight': return 'text-yellow-600 bg-yellow-100';
      case 'roadmap': return 'text-green-600 bg-green-100';
      case 'execute': return 'text-purple-600 bg-purple-100';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'sales': return 'text-red-600 bg-red-100';
      case 'marketing': return 'text-blue-600 bg-blue-100';
      case 'product': return 'text-green-600 bg-green-100';
      case 'operations': return 'text-orange-600 bg-orange-100';
      case 'finance': return 'text-purple-600 bg-purple-100';
      case 'hr': return 'text-pink-600 bg-pink-100';
      case 'customer-success': return 'text-indigo-600 bg-indigo-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (isLoading) {
    return (
      <div className={`bg-card border rounded-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-card border rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 rounded-lg bg-primary bg-opacity-10">
            <Play className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Solutions Playbooks</h2>
            <p className="text-sm text-muted-foreground">
              FIRE-driven solutions for your current challenge
            </p>
          </div>
        </div>

        {detectedProblem && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-1">Detected Challenge: </h3>
            <p className="text-sm text-blue-800">{detectedProblem}</p>
          </div>
        )}

        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Target className="w-4 h-4" />
            <span>Current Phase: {currentPhase.toUpperCase()}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>{recommendations.length} playbooks available</span>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Recommended Playbooks</h3>
          {recommendations.map((rec) => (
            <div key={rec.playbook.id} className="bg-card border rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="text-lg font-semibold text-foreground">{rec.playbook.name}</h4>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(rec.playbook.category)}`}>
                      {rec.playbook.category}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {Math.round(rec.relevance * 100)}% match
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{rec.playbook.description}</p>
                  
                  <div className="grid grid-cols-1 md: grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>{rec.playbook.estimatedTime} min</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Map className="w-4 h-4 text-muted-foreground" />
                      <span>{rec.playbook.roadmap.length} steps</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Zap className="w-4 h-4 text-muted-foreground" />
                      <span>{rec.playbook.execute.length} actions</span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => handlePlaybookSelect(rec.playbook)}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover: bg-primary/90 transition-colors"
                >
                  Start Playbook
                </button>
              </div>

              <div className="p-3 bg-muted/30 rounded-lg">
                <h5 className="font-medium text-foreground mb-1">Why this playbook:</h5>
                <p className="text-sm text-muted-foreground">{rec.reasoning}</p>
              </div>

              <div className="mt-4">
                <h5 className="font-medium text-foreground mb-2">Next Action:</h5>
                <div className="flex items-center space-x-2 p-2 bg-primary/10 rounded-lg">
                  {getPhaseIcon(rec.nextAction.firePhase)}
                  <span className="text-sm font-medium">{rec.nextAction.title}</span>
                  <span className="text-xs text-muted-foreground">
                    ({rec.nextAction.estimatedEffort} min)
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected Playbook Details */}
      {selectedPlaybook && (
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-foreground">{selectedPlaybook.name}</h3>
              <p className="text-sm text-muted-foreground">{selectedPlaybook.description}</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(selectedPlaybook.category)}`}>
                {selectedPlaybook.category}
              </span>
              <span className="text-xs text-muted-foreground">
                {Math.round(selectedPlaybook.confidence * 100)}% confidence
              </span>
            </div>
          </div>

          {/* FIRE Overview */}
          <div className="grid grid-cols-1 md: grid-cols-4 gap-4 mb-6">
            <div className="p-3 border rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Target className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-foreground">Focus</span>
              </div>
              <p className="text-sm text-muted-foreground">{selectedPlaybook.focus}</p>
            </div>
            
            <div className="p-3 border rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Lightbulb className="w-4 h-4 text-yellow-600" />
                <span className="font-medium text-foreground">Insight</span>
              </div>
              <p className="text-sm text-muted-foreground">{selectedPlaybook.insight}</p>
            </div>
            
            <div className="p-3 border rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Map className="w-4 h-4 text-green-600" />
                <span className="font-medium text-foreground">Roadmap</span>
              </div>
              <p className="text-sm text-muted-foreground">{selectedPlaybook.roadmap.length} steps</p>
            </div>
            
            <div className="p-3 border rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Zap className="w-4 h-4 text-purple-600" />
                <span className="font-medium text-foreground">Execute</span>
              </div>
              <p className="text-sm text-muted-foreground">{selectedPlaybook.execute.length} actions</p>
            </div>
          </div>

          {/* Roadmap Steps */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-foreground">Roadmap Steps</h4>
            {selectedPlaybook.roadmap.map((step) => (
              <div key={step.id} className="border rounded-lg">
                <div 
                  className="flex items-center justify-between p-4 cursor-pointer hover: bg-muted/30 transition-colors"
                  onClick={() => toggleStepExpansion(step.id)}
                >
                  <div className="flex items-center space-x-3">
                    {completedSteps.has(step.id) ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-muted-foreground"></div>
                    )}
                    <div>
                      <h5 className="font-medium text-foreground">{step.title}</h5>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getPhaseColor(step.firePhase)}`}>
                      {step.firePhase}
                    </span>
                    <span className="text-xs text-muted-foreground">{step.estimatedTime} min</span>
                    {expandedSteps.has(step.id) ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </div>
                </div>
                
                {expandedSteps.has(step.id) && (
                  <div className="px-4 pb-4 space-y-3">
                    {step.resources.length > 0 && (
                      <div>
                        <h6 className="font-medium text-foreground mb-2">Resources: </h6>
                        <div className="space-y-2">
                          {step.resources.map((resource, index) => (
                            <div key={index} className="flex items-center space-x-2 text-sm">
                              <span className="w-2 h-2 rounded-full bg-primary"></span>
                              <span className="font-medium">{resource.name}</span>
                              <span className="text-muted-foreground">- {resource.description}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {step.checkpoints.length > 0 && (
                      <div>
                        <h6 className="font-medium text-foreground mb-2">Checkpoints: </h6>
                        <div className="space-y-2">
                          {step.checkpoints.map((checkpoint) => (
                            <div key={checkpoint.id} className="text-sm">
                              <div className="font-medium">{checkpoint.question}</div>
                              <div className="text-muted-foreground">
                                {checkpoint.criteria.join(', ')}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => markStepComplete(step.id)}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded hover: bg-green-700 transition-colors"
                      >
                        Mark Complete
                      </button>
                      <button className="px-3 py-1 text-sm border border-muted-foreground rounded hover:bg-muted transition-colors">
                        Start Step
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Execute Actions */}
          <div className="mt-6">
            <h4 className="text-lg font-semibold text-foreground mb-4">Execute Actions</h4>
            <div className="grid grid-cols-1 md: grid-cols-2 gap-4">
              {selectedPlaybook.execute.map((action) => (
                <div key={action.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getPhaseIcon(action.firePhase)}
                      <h5 className="font-medium text-foreground">{action.title}</h5>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      action.priority === 'critical' ? 'text-red-600 bg-red-100' :
                      action.priority === 'high' ? 'text-orange-600 bg-orange-100' :
                      action.priority === 'medium' ? 'text-yellow-600 bg-yellow-100' :
                      'text-green-600 bg-green-100'
                    }`}>
                      {action.priority}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{action.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {action.estimatedEffort} min • {action.type}
                    </span>
                    <button className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover: bg-primary/90 transition-colors">
                      {action.canAutomate ? 'Auto-Execute' : 'Start Action'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Success Metrics */}
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">Success Metrics</h4>
            <div className="space-y-1">
              {selectedPlaybook.successMetrics.map((metric, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm text-green-800">
                  <CheckCircle className="w-4 h-4" />
                  <span>{metric}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* No Recommendations */}
      {recommendations.length === 0 && !isLoading && (
        <div className="bg-card border rounded-lg p-6 text-center">
          <div className="w-12 h-12 bg-muted rounded-lg mx-auto mb-4 flex items-center justify-center">
            <Play className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No Playbooks Found</h3>
          <p className="text-muted-foreground">
            We couldn't find specific playbooks for your current context. Try updating your user profile or providing more details about your challenge.
          </p>
        </div>
      )}
    </div>
  );
}; 