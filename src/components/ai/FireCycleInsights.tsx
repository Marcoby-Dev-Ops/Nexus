import React, { useState } from 'react';
import { Target, Lightbulb, Map, Play, ArrowRight, Plus, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert';
import { Separator } from '@/shared/components/ui/Separator';
import type { FireCycleChatResponse } from '@/core/fire-cycle/fireCycleChatIntegration';

interface FireCycleInsightsProps {
  response: FireCycleChatResponse;
  onCreateThought?: (thought: any) => void;
  onDismiss?: () => void;
}

const firePhaseConfig = {
  focus: {
    icon: Target,
    color: 'bg-blue-500',
    title: 'Focus Phase',
    description: 'Clarifying the core idea or goal'
  },
  insight: {
    icon: Lightbulb,
    color: 'bg-yellow-500',
    title: 'Insight Phase',
    description: 'Gaining deeper understanding and context'
  },
  roadmap: {
    icon: Map,
    color: 'bg-green-500',
    title: 'Roadmap Phase',
    description: 'Planning the path forward'
  },
  execute: {
    icon: Play,
    color: 'bg-purple-500',
    title: 'Execute Phase',
    description: 'Taking action and implementing'
  }
};

export function FireCycleInsights({ response, onCreateThought, onDismiss }: FireCycleInsightsProps) {
  const [isCreatingThought, setIsCreatingThought] = useState(false);
  const [selectedActions, setSelectedActions] = useState<string[]>([]);

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
    <Card className="w-full max-w-2xl mx-auto border-l-4 border-l-blue-500">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${config.color} text-white`}>
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
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
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
                    variant="ghost"
                    size="sm"
                    className="flex-1 justify-start h-auto p-2"
                    onClick={() => handleActionToggle(action)}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <input
                        type="checkbox"
                        checked={selectedActions.includes(action)}
                        onChange={() => handleActionToggle(action)}
                        className="rounded"
                      />
                      <span className="text-sm text-left">{action}</span>
                    </div>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleCreateThought}
            disabled={isCreatingThought}
            className="flex-1"
          >
            <Plus className="w-4 h-4 mr-2" />
            {isCreatingThought ? 'Creating...' : 'Create Thought'}
          </Button>
          
          {onDismiss && (
            <Button
              variant="outline"
              onClick={onDismiss}
              className="flex-1"
            >
              Dismiss
            </Button>
          )}
        </div>

        {/* Next Steps */}
        {response.nextSteps && response.nextSteps.length > 0 && (
          <Alert>
            <ArrowRight className="h-4 w-4" />
            <AlertDescription>
              <strong>Next Steps:</strong> {response.nextSteps.join(', ')}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
} 