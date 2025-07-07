import React, { useState, useEffect } from 'react';
import { AlertCircle, Brain, CheckCircle2, Clock, Zap, ArrowRight, Plus, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useAuth } from '@/contexts/AuthContext';
import { contextualDataCompletionService } from '@/lib/services/contextualDataCompletionService';
import type { 
  ContextCompletionSuggestion, 
  ContextGap, 
  ConversationContextAnalysis 
} from '@/lib/services/contextualDataCompletionService';

interface ContextCompletionSuggestionsProps {
  conversationAnalysis?: ConversationContextAnalysis;
  showProactive?: boolean;
  onComplete?: (completedGaps: ContextGap[]) => void;
  className?: string;
}

export const ContextCompletionSuggestions: React.FC<ContextCompletionSuggestionsProps> = ({
  conversationAnalysis,
  showProactive = false,
  onComplete,
  className = ''
}) => {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<ContextCompletionSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedSuggestion, setExpandedSuggestion] = useState<string | null>(null);
  const [completingGaps, setCompletingGaps] = useState<Set<string>>(new Set());
  const [completedGaps, setCompletedGaps] = useState<Set<string>>(new Set());

  // Load suggestions on mount or when analysis changes
  useEffect(() => {
    if (conversationAnalysis?.suggestedCompletions) {
      setSuggestions(conversationAnalysis.suggestedCompletions);
    } else if (showProactive && user?.id) {
      loadProactiveSuggestions();
    }
  }, [conversationAnalysis, showProactive, user?.id]);

  const loadProactiveSuggestions = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const proactiveSuggestions = await contextualDataCompletionService.getProactiveContextSuggestions(user.id);
      setSuggestions(proactiveSuggestions);
    } catch (error) {
      console.error('Error loading proactive suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteGap = async (gap: ContextGap, value: any) => {
    if (!user?.id) return;

    setCompletingGaps(prev => new Set(prev).add(gap.id));
    
    try {
      const success = await contextualDataCompletionService.applyContextSuggestion(
        user.id,
        gap.field,
        value
      );
      
      if (success) {
        setCompletedGaps(prev => new Set(prev).add(gap.id));
        onComplete?.([gap]);
      }
    } catch (error) {
      console.error('Error completing gap:', error);
    } finally {
      setCompletingGaps(prev => {
        const newSet = new Set(prev);
        newSet.delete(gap.id);
        return newSet;
      });
    }
  };

  const handleCompleteSuggestion = async (suggestion: ContextCompletionSuggestion) => {
    if (!user?.id) return;

    // If it has a one-click fill action, use that
    if (suggestion.oneClickFill && suggestion.fillAction) {
      setCompletingGaps(prev => new Set(prev).add(suggestion.id));
      try {
        await suggestion.fillAction();
        suggestion.gaps.forEach(gap => {
          setCompletedGaps(prev => new Set(prev).add(gap.id));
        });
        onComplete?.(suggestion.gaps);
      } catch (error) {
        console.error('Error completing suggestion:', error);
      } finally {
        setCompletingGaps(prev => {
          const newSet = new Set(prev);
          newSet.delete(suggestion.id);
          return newSet;
        });
      }
    } else {
      // Open detailed completion flow
      setExpandedSuggestion(suggestion.id);
    }
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'bg-destructive/10 text-destructive';
      case 'medium': return 'bg-warning/10 text-yellow-800';
      case 'low': return 'bg-success/10 text-success';
      default: return 'bg-muted text-foreground';
    }
  };

  const getPriorityIcon = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return <AlertCircle className="w-4 h-4" />;
      case 'medium': return <Clock className="w-4 h-4" />;
      case 'low': return <Plus className="w-4 h-4" />;
      default: return <Plus className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity: 'critical' | 'important' | 'optional') => {
    switch (severity) {
      case 'critical': return 'text-destructive';
      case 'important': return 'text-warning';
      case 'optional': return 'text-primary';
      default: return 'text-muted-foreground';
    }
  };

  const totalGaps = suggestions.reduce((sum, s) => sum + s.gaps.length, 0);
  const totalCompleted = suggestions.reduce((sum, s) => 
    sum + s.gaps.filter(g => completedGaps.has(g.id)).length, 0
  );
  const completionPercentage = totalGaps > 0 ? (totalCompleted / totalGaps) * 100 : 0;

  if (loading) {
    return (
      <Card className={`${className} animate-pulse`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary animate-spin" />
            <span className="text-sm text-muted-foreground">Analyzing context needs...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!suggestions.length) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Context Analysis Summary */}
      {conversationAnalysis && (
        <Card className="border-border bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <Brain className="w-5 h-5 text-primary mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-blue-900">Context Analysis</h4>
                <p className="text-sm text-primary mt-1">
                  {conversationAnalysis.priorityRecommendation}
                </p>
                <div className="flex items-center gap-4 mt-2">
                  <div className="text-xs text-primary">
                    Intent: {conversationAnalysis.queryIntent}
                  </div>
                  <div className="text-xs text-primary">
                    Confidence: {Math.round(conversationAnalysis.confidenceScore * 100)}%
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completion Progress */}
      {totalGaps > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Context Completion</span>
              <span className="text-sm text-muted-foreground">
                {totalCompleted}/{totalGaps} completed
              </span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Suggestions List */}
      <div className="space-y-4">
        {suggestions.map((suggestion) => {
          const isCompleting = completingGaps.has(suggestion.id);
          const completedCount = suggestion.gaps.filter(g => completedGaps.has(g.id)).length;
          const isFullyCompleted = completedCount === suggestion.gaps.length;
          
          return (
            <Card 
              key={suggestion.id} 
              className={`transition-all ${isFullyCompleted ? 'bg-success/5 border-green-200' : ''}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    {isFullyCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-success mt-0.5" />
                    ) : (
                      getPriorityIcon(suggestion.priority)
                    )}
                    <div>
                      <CardTitle className="text-base">{suggestion.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {suggestion.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge 
                          variant="secondary" 
                          className={getPriorityColor(suggestion.priority)}
                        >
                          {suggestion.priority} priority
                        </Badge>
                        <Badge variant="outline">
                          {suggestion.category}
                        </Badge>
                        {completedCount > 0 && (
                          <Badge variant="secondary" className="bg-success/10 text-success">
                            {completedCount}/{suggestion.gaps.length} completed
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {!isFullyCompleted && (
                    <Button
                      size="sm"
                      onClick={() => handleCompleteSuggestion(suggestion)}
                      disabled={isCompleting}
                      className="shrink-0"
                    >
                      {isCompleting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Completing...
                        </>
                      ) : suggestion.oneClickFill ? (
                        <>
                          <Zap className="w-4 h-4 mr-2" />
                          Quick Fill
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Complete
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                {/* Expected Impact */}
                <div className="bg-background rounded-lg p-4 mb-3">
                  <div className="flex items-start gap-2">
                    <ArrowRight className="w-4 h-4 text-primary mt-0.5" />
                    <span className="text-sm font-medium text-foreground">Expected Impact:</span>
                  </div>
                  <p className="text-sm text-foreground/90 mt-1">{suggestion.expectedImpact}</p>
                </div>

                {/* Context Gaps */}
                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-foreground">Required Information:</h5>
                  <div className="grid gap-2">
                    {suggestion.gaps.map((gap) => {
                      const isGapCompleted = completedGaps.has(gap.id);
                      const isGapCompleting = completingGaps.has(gap.id);
                      
                      return (
                        <div 
                          key={gap.id}
                          className={`p-4 rounded-lg border ${
                            isGapCompleted 
                              ? 'bg-success/5 border-green-200' 
                              : 'bg-card border-border'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{gap.description}</span>
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${getSeverityColor(gap.severity)}`}
                                >
                                  {gap.severity}
                                </Badge>
                                {isGapCompleted && (
                                  <CheckCircle2 className="w-4 h-4 text-success" />
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {gap.impact}
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                <span>~{gap.estimatedTimeToFill} min</span>
                                <span>{gap.fillMethod}</span>
                              </div>
                            </div>
                            
                            {!isGapCompleted && gap.quickFillOptions && (
                              <QuickFillSelector
                                gap={gap}
                                onComplete={(value) => handleCompleteGap(gap, value)}
                                isCompleting={isGapCompleting}
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detailed Completion Dialog */}
      {expandedSuggestion && (
        <DetailedCompletionDialog
          suggestion={suggestions.find(s => s.id === expandedSuggestion)!}
          onClose={() => setExpandedSuggestion(null)}
          onComplete={(gaps) => {
            gaps.forEach(gap => setCompletedGaps(prev => new Set(prev).add(gap.id)));
            onComplete?.(gaps);
            setExpandedSuggestion(null);
          }}
        />
      )}
    </div>
  );
};

// Quick Fill Selector Component
interface QuickFillSelectorProps {
  gap: ContextGap;
  onComplete: (value: any) => void;
  isCompleting: boolean;
}

const QuickFillSelector: React.FC<QuickFillSelectorProps> = ({
  gap,
  onComplete,
  isCompleting
}) => {
  const [selectedValue, setSelectedValue] = useState<string>('');

  const handleSubmit = () => {
    if (selectedValue) {
      onComplete(selectedValue);
    }
  };

  if (gap.quickFillOptions) {
    return (
      <div className="flex items-center gap-2">
        <Select onValueChange={setSelectedValue} disabled={isCompleting}>
          <SelectTrigger className="w-40 h-8 text-xs">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {gap.quickFillOptions.map((option) => (
              <SelectItem key={option} value={option} className="text-xs">
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          variant="outline"
          onClick={handleSubmit}
          disabled={!selectedValue || isCompleting}
          className="h-8 px-4 text-xs"
        >
          {isCompleting ? '...' : 'Set'}
        </Button>
      </div>
    );
  }

  return null;
};

// Detailed Completion Dialog Component
interface DetailedCompletionDialogProps {
  suggestion: ContextCompletionSuggestion;
  onClose: () => void;
  onComplete: (gaps: ContextGap[]) => void;
}

const DetailedCompletionDialog: React.FC<DetailedCompletionDialogProps> = ({
  suggestion,
  onClose,
  onComplete
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [completing, setCompleting] = useState(false);

  const handleSubmit = async () => {
    if (!user?.id) return;

    setCompleting(true);
    try {
      const completedGaps: ContextGap[] = [];
      
      for (const gap of suggestion.gaps) {
        const value = formData[gap.field];
        if (value) {
          const success = await contextualDataCompletionService.applyContextSuggestion(
            user.id,
            gap.field,
            value
          );
          if (success) {
            completedGaps.push(gap);
          }
        }
      }
      
      onComplete(completedGaps);
    } catch (error) {
      console.error('Error completing suggestion:', error);
    } finally {
      setCompleting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            {suggestion.title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {suggestion.description}
          </p>
          
          <div className="space-y-4">
            {suggestion.gaps.map((gap) => (
              <div key={gap.id} className="space-y-2">
                <label className="text-sm font-medium">
                  {gap.description}
                  <Badge 
                    variant="outline" 
                    className={`ml-2 ${getSeverityColor(gap.severity)}`}
                  >
                    {gap.severity}
                  </Badge>
                </label>
                
                {gap.quickFillOptions ? (
                  <Select onValueChange={(value) => setFormData(prev => ({ ...prev, [gap.field]: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an option..." />
                    </SelectTrigger>
                    <SelectContent>
                      {gap.quickFillOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Textarea
                    placeholder={`Enter your ${gap.description.toLowerCase()}...`}
                    value={formData[gap.field] || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, [gap.field]: e.target.value }))}
                    className="resize-none"
                    rows={3}
                  />
                )}
                
                <p className="text-xs text-muted-foreground">{gap.impact}</p>
              </div>
            ))}
          </div>
          
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Expected impact: {suggestion.expectedImpact}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} disabled={completing}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={completing}>
                {completing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Completing...
                  </>
                ) : (
                  'Complete Setup'
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContextCompletionSuggestions; 