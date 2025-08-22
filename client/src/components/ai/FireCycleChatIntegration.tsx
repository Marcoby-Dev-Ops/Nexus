import React, { useState, useEffect, useCallback } from 'react';
import { Target, Lightbulb, Map, Play, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert';
import { useAuth } from '@/hooks/index';
import { useFireCycleChatIntegration } from '@/core/fire-cycle/fireCycleChatIntegration';
import type { FireCycleChatResponse } from '@/core/fire-cycle/fireCycleChatIntegration';
import type { UserContext } from '@/core/fire-cycle/fireCycleLogic';

interface FireCycleChatIntegrationProps {
  message: string;
  onThoughtCreated?: (thoughtId: string) => void;
  onFireCycleTriggered?: (response: FireCycleChatResponse) => void;
  className?: string;
}

/**
 * FIRE Cycle Chat Integration Component
 * 
 * Analyzes chat messages and automatically triggers FIRE cycle processing
 * when users make statements that indicate ideas, goals, or initiatives.
 */
export const FireCycleChatIntegration: React.FC<FireCycleChatIntegrationProps> = ({
  message,
  onThoughtCreated,
  onFireCycleTriggered,
  className = ''
}) => {
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState<FireCycleChatResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCreatingThought, setIsCreatingThought] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create user context for FIRE cycle processing
  const userContext: UserContext = {
    userId: user?.id || '',
    companyId: user?.company_id || '',
    department: user?.department || '',
    role: user?.role || 'user',
    preferences: {
      communicationStyle: 'professional',
      detailLevel: 'medium',
      automationLevel: 'high'
    },
    currentFocus: {
      phase: 'focus',
      priority: 'medium',
      context: 'general'
    }
  };

  const { analyzeChatMessage, createThoughtFromChat } = useFireCycleChatIntegration(userContext);

  // Analyze message when it changes
  useEffect(() => {
    if (!message.trim() || !user?.id) return;

    const analyzeMessage = async () => {
      setIsAnalyzing(true);
      setError(null);

      try {
        const response = await analyzeChatMessage(message, user.id, user.company_id);
        setAnalysis(response);

        if (response.shouldTrigger) {
          onFireCycleTriggered?.(response);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to analyze message');
      } finally {
        setIsAnalyzing(false);
      }
    };

    // Debounce analysis to avoid excessive processing
    const timeoutId = setTimeout(analyzeMessage, 500);
    return () => clearTimeout(timeoutId);
  }, [message, user?.id, user?.company_id, analyzeChatMessage, onFireCycleTriggered]);

  const handleCreateThought = useCallback(async () => {
    if (!analysis?.shouldTrigger || !user?.id) return;

    setIsCreatingThought(true);
    setError(null);

    try {
      const thoughtId = await createThoughtFromChat(
        message,
        user.id,
        user.company_id,
        analysis.firePhase
      );

      if (thoughtId) {
        onThoughtCreated?.(thoughtId);
        setAnalysis(null); // Clear analysis after creating thought
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create thought');
    } finally {
      setIsCreatingThought(false);
    }
  }, [analysis, message, user?.id, user?.company_id, createThoughtFromChat, onThoughtCreated]);

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'focus': return Target;
      case 'insight': return Lightbulb;
      case 'roadmap': return Map;
      case 'execute': return Play;
      default: return Sparkles;
    }
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'focus': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'insight': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'roadmap': return 'bg-green-100 text-green-800 border-green-200';
      case 'execute': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!analysis?.shouldTrigger) {
    return null;
  }

  return (
    <Card className={`border-l-4 border-l-primary ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {React.createElement(getPhaseIcon(analysis.firePhase!), {
              className: 'w-5 h-5'
            })}
            <CardTitle className="text-lg">
              FIRE Cycle Detected
            </CardTitle>
          </div>
          <Badge className={getPhaseColor(analysis.firePhase!)}>
            {analysis.firePhase?.toUpperCase()}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Your message indicates a {analysis.firePhase} phase. Would you like to capture this as a thought?
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Confidence Indicator */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Confidence:</span>
          <span className={`text-sm font-medium ${getConfidenceColor(analysis.confidence || 0)}`}>
            {Math.round((analysis.confidence || 0) * 100)}%
          </span>
        </div>

        {/* Suggested Thought */}
        {analysis.suggestedThought && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Suggested Thought:</h4>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm">{analysis.suggestedThought.content}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant="secondary" className="text-xs">
                  {analysis.suggestedThought.category}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {analysis.suggestedThought.priority}
                </Badge>
                {analysis.suggestedThought.estimatedEffort && (
                  <Badge variant="outline" className="text-xs">
                    {analysis.suggestedThought.estimatedEffort}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Next Steps */}
        {analysis.nextSteps && analysis.nextSteps.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Next Steps:</h4>
            <ul className="space-y-1">
              {analysis.nextSteps.map((step, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Reasoning */}
        {analysis.reasoning && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {analysis.reasoning}
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleCreateThought}
            disabled={isCreatingThought}
            className="flex-1"
          >
            {isCreatingThought ? 'Creating...' : 'Capture as Thought'}
          </Button>
          <Button
            variant="outline"
            onClick={() => setAnalysis(null)}
            disabled={isCreatingThought}
          >
            Dismiss
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default FireCycleChatIntegration; 