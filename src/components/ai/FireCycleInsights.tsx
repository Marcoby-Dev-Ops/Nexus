import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Target, Lightbulb, Map, Play, CheckCircle, X, Sparkles, MessageSquare } from 'lucide-react';
import { InsightFeedbackWidget, type InsightData } from '@/shared/components/insights/InsightFeedbackWidget';

interface FireCycleInsightsProps {
  response: {
    firePhase: 'focus' | 'insight' | 'roadmap' | 'execute';
    confidence: number;
    originalMessage: string;
    suggestedActions: string[];
    processedInput: {
      insights?: string[];
      nextSteps?: string[];
    };
  };
  onCreateThought?: (thought: any) => void;
  onDismiss?: () => void;
}

const firePhaseConfig = {
  focus: {
    icon: Target,
    color: 'bg-primary',
    title: 'Focus Phase',
    description: 'Clarifying the core idea or goal'
  },
  insight: {
    icon: Lightbulb,
    color: 'bg-warning',
    title: 'Insight Phase',
    description: 'Gaining deeper understanding and context'
  },
  roadmap: {
    icon: Map,
    color: 'bg-success',
    title: 'Roadmap Phase',
    description: 'Planning the path forward'
  },
  execute: {
    icon: Play,
    color: 'bg-secondary',
    title: 'Execute Phase',
    description: 'Taking action and implementing'
  }
};

export function FireCycleInsights({ response, onCreateThought, onDismiss }: FireCycleInsightsProps) {
  const [isCreatingThought, setIsCreatingThought] = useState(false);
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);

  const config = firePhaseConfig[response.firePhase];
  const IconComponent = config.icon;

  const handleCreateThought = async () => {
    if (!onCreateThought) return;
    
    setIsCreatingThought(true);
    try {
      await onCreateThought({
        content: response.originalMessage,
        firePhase: response.firePhase,
        confidence: response.confidence,
        suggestedActions: response.suggestedActions
      });
    } finally {
      setIsCreatingThought(false);
    }
  };

  const handleActionToggle = (action: string) => {
    setSelectedActions(prev => 
      prev.includes(action) 
        ? prev.filter(a => a !== action)
        : [...prev, action]
    );
  };

  return (
    <Card className="w-full max-w-2xl mx-auto border-l-4 border-l-primary">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${config.color} text-primary-foreground`}>
            <IconComponent className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold">
              {config.title} Detected
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {config.description}
            </p>
          </div>
          <Badge variant="secondary" className="ml-auto">
            {Math.round(response.confidence * 100)}% match
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Original Message */}
        <div className="bg-muted/50 p-3 rounded-lg">
          <p className="text-sm font-medium text-muted-foreground mb-1">
            Original Message:
          </p>
          <p className="text-sm">{response.originalMessage}</p>
        </div>

        {/* Key Insights */}
        {response.processedInput.insights && response.processedInput.insights.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Key Insights:</h4>
            <ul className="space-y-1">
              {response.processedInput.insights.map((insight, index) => (
                <li key={index} className="text-sm flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Suggested Actions */}
        {response.suggestedActions && response.suggestedActions.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Suggested Actions:</h4>
            <div className="space-y-2">
              {response.suggestedActions.map((action, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Button
                    variant={selectedActions.includes(action) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleActionToggle(action)}
                    className="text-left justify-start h-auto py-2 px-3"
                  >
                    <Sparkles className="w-3 h-3 mr-2" />
                    {action}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next Steps */}
        {response.processedInput.nextSteps && response.processedInput.nextSteps.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Recommended Next Steps:</h4>
            <ul className="space-y-1">
              {response.processedInput.nextSteps.map((step, index) => (
                <li key={index} className="text-sm flex items-start gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          {onCreateThought && (
            <Button 
              onClick={handleCreateThought}
              disabled={isCreatingThought}
              className="flex-1"
            >
              {isCreatingThought ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2" />
                  Creating Thought...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Create FIRE Thought
                </>
              )}
            </Button>
          )}
          
          <Button 
            variant="outline" 
            onClick={() => setShowFeedback(!showFeedback)}
            className="flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            {showFeedback ? 'Hide Feedback' : 'Give Feedback'}
          </Button>
          
          {onDismiss && (
            <Button variant="outline" onClick={onDismiss}>
              <X className="w-4 h-4 mr-2" />
              Dismiss
            </Button>
          )}
        </div>

        {/* Feedback Widget */}
        {showFeedback && (
          <div className="mt-4">
            <InsightFeedbackWidget
              insight={{
                id: `fire-insight-${response.firePhase}-${Date.now()}`,
                title: `${config.title} Insight`,
                content: response.originalMessage,
                type: 'fire_insight',
                category: response.firePhase,
                impact: 'medium',
                confidence: response.confidence,
                businessContext: {
                  firePhase: response.firePhase,
                  suggestedActions: response.suggestedActions,
                  processedInput: response.processedInput,
                },
              }}
              compact={true}
              onFeedbackSubmitted={(feedback) => {
                console.log('FIRE insight feedback submitted:', feedback);
                // Optionally hide feedback widget after submission
                setShowFeedback(false);
              }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
} 