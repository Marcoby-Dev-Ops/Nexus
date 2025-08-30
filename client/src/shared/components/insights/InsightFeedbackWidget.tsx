/**
 * Insight Feedback Widget
 * 
 * Allows users to provide feedback on AI-generated insights, including:
 * - Value assessment (valuable, not valuable, already implemented, not applicable)
 * - Implementation status tracking
 * - Rating system (1-5 stars)
 * - Optional comments
 * 
 * This feedback is used to improve the RAG system and prevent suggesting
 * already implemented or low-value insights in the future.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Textarea } from '@/shared/components/ui/Textarea';
import { 
  ThumbsUp, 
  CheckCircle, 
  XCircle, 
  Star, 
  MessageSquare,
  Clock,
  Play,
  AlertCircle,
  Check,
  X
} from 'lucide-react';
import { useToast } from '@/shared/components/ui/use-toast';
import { useAuth } from '@/hooks/index';
import { insightFeedbackService, type InsightFeedback } from '@/services/ai/InsightFeedbackService';
import { logger } from '@/shared/utils/logger';

// ============================================================================
// TYPES
// ============================================================================

export interface InsightData {
  id: string;
  title: string;
  content?: string;
  type: string;
  category?: string;
  impact?: string;
  confidence?: number;
  businessContext?: Record<string, unknown>;
}

export interface InsightFeedbackWidgetProps {
  insight: InsightData;
  onFeedbackSubmitted?: (feedback: InsightFeedback) => void;
  onDismiss?: () => void;
  className?: string;
  showRating?: boolean;
  showImplementationStatus?: boolean;
  compact?: boolean;
}

// ============================================================================
// VALUE ASSESSMENT OPTIONS
// ============================================================================

const valueAssessmentOptions = [
  {
    value: 'need_this' as const,
    label: 'I Need This',
    description: 'This is valuable and I want to implement it',
    icon: ThumbsUp,
    color: 'text-success',
    bgColor: 'bg-success/10',
  },
  {
    value: 'already_implemented' as const,
    label: 'I Have This',
    description: 'I have already implemented this solution',
    icon: CheckCircle,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    value: 'not_applicable' as const,
    label: 'Doesn\'t Apply',
    description: 'This doesn\'t apply to my current business',
    icon: XCircle,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/10',
  },
];

// ============================================================================
// IMPLEMENTATION STATUS OPTIONS
// ============================================================================

const implementationStatusOptions = [
  {
    value: 'not_started' as const,
    label: 'Not Started',
    description: 'Haven\'t started implementing',
    icon: Clock,
    color: 'text-muted-foreground',
  },
  {
    value: 'in_progress' as const,
    label: 'In Progress',
    description: 'Currently implementing',
    icon: Play,
    color: 'text-warning',
  },
  {
    value: 'completed' as const,
    label: 'Completed',
    description: 'Successfully implemented',
    icon: CheckCircle,
    color: 'text-success',
  },
  {
    value: 'abandoned' as const,
    label: 'Abandoned',
    description: 'Decided not to implement',
    icon: AlertCircle,
    color: 'text-destructive',
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function InsightFeedbackWidget({
  insight,
  onFeedbackSubmitted,
  onDismiss,
  className = '',
  showRating = true,
  showImplementationStatus = true,
  compact = false,
}: InsightFeedbackWidgetProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [selectedValueAssessment, setSelectedValueAssessment] = useState<InsightFeedback['value_assessment'] | null>(null);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [selectedImplementationStatus, setSelectedImplementationStatus] = useState<InsightFeedback['implementation_status']>('not_started');
  const [feedbackComment, setFeedbackComment] = useState('');
  const [implementationDetails, setImplementationDetails] = useState(''); // How the user has implemented this
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [existingFeedback, setExistingFeedback] = useState<InsightFeedback | null>(null);

  // Load existing feedback on mount
  useEffect(() => {
    if (user?.id && insight.id) {
      loadExistingFeedback();
    }
  }, [user?.id, insight.id]);

  const loadExistingFeedback = async () => {
    try {
      const result = await insightFeedbackService.getFeedbackForInsight(insight.id, user!.id);
      if (result.success && result.data) {
        setExistingFeedback(result.data);
        setSelectedValueAssessment(result.data.value_assessment);
        setSelectedRating(result.data.rating || null);
        setSelectedImplementationStatus(result.data.implementation_status);
        setFeedbackComment(result.data.feedback_comment || '');
        setIsSubmitted(true);
      }
    } catch (error) {
      logger.error('Error loading existing feedback:', error);
    }
  };

  const handleSubmit = async () => {
    if (!user?.id || !selectedValueAssessment) {
      toast({
        title: 'Missing Information',
        description: 'Please select a value assessment before submitting feedback.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const feedbackData = {
        user_id: user.id,
        company_id: user.company_id,
        insight_id: insight.id,
        insight_type: insight.type,
        insight_title: insight.title,
        insight_content: insight.content,
        rating: selectedRating,
        value_assessment: selectedValueAssessment,
        implementation_status: selectedImplementationStatus,
        implementation_details: implementationDetails.trim() || undefined,
        feedback_comment: feedbackComment.trim() || undefined,
        business_context: insight.businessContext || {},
        insight_category: insight.category,
        insight_impact: insight.impact,
        insight_confidence: insight.confidence,
      };

      const result = await insightFeedbackService.saveFeedback(feedbackData);

      if (result.success) {
        setIsSubmitted(true);
        setExistingFeedback(result.data!);
        
        toast({
          title: 'Feedback Submitted',
          description: 'Thank you for your feedback! This will help improve future recommendations.',
        });

        onFeedbackSubmitted?.(result.data!);
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to submit feedback. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      logger.error('Error submitting feedback:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleValueAssessmentSelect = (assessment: InsightFeedback['value_assessment']) => {
    setSelectedValueAssessment(assessment);
    
    // Auto-select implementation status based on value assessment
    if (assessment === 'already_implemented') {
      setSelectedImplementationStatus('completed');
    } else if (assessment === 'not_applicable') {
      setSelectedImplementationStatus('abandoned');
    } else if (assessment === 'need_this') {
      setSelectedImplementationStatus('not_started');
    }
  };

  const handleImplementationStatusSelect = (status: InsightFeedback['implementation_status']) => {
    setSelectedImplementationStatus(status);
    
    // Auto-update value assessment based on implementation status
    if (status === 'completed') {
      setSelectedValueAssessment('already_implemented');
    } else if (status === 'abandoned') {
      setSelectedValueAssessment('not_applicable');
    }
  };

  if (isSubmitted && existingFeedback) {
    return (
      <Card className={`${className} border-l-4 border-l-success`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-success" />
            <span className="text-sm font-medium text-success">Feedback Submitted</span>
          </div>
          <div className="text-sm text-muted-foreground">
            You marked this insight as{' '}
            <Badge variant="secondary" className="text-xs">
              {valueAssessmentOptions.find(opt => opt.value === existingFeedback.value_assessment)?.label}
            </Badge>
            {existingFeedback.implementation_status !== 'not_started' && (
              <>
                {' '}and implementation status as{' '}
                <Badge variant="secondary" className="text-xs">
                  {implementationStatusOptions.find(opt => opt.value === existingFeedback.implementation_status)?.label}
                </Badge>
              </>
            )}
          </div>
          {existingFeedback.feedback_comment && (
            <div className="mt-2 text-sm text-muted-foreground">
              <MessageSquare className="w-3 h-3 inline mr-1" />
              "{existingFeedback.feedback_comment}"
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className} ${compact ? 'border-l-4 border-l-primary' : ''}`}>
      <CardHeader className={compact ? 'pb-2' : 'pb-4'}>
                 <CardTitle className={`${compact ? 'text-sm' : 'text-base'} flex items-center gap-2`}>
           <MessageSquare className="w-4 h-4" />
           {compact ? 'Rate this insight' : 'What do you think about this insight?'}
         </CardTitle>
         {!compact && (
           <p className="text-sm text-muted-foreground">
             Your feedback helps us provide better recommendations and won't suggest similar insights if they don't apply to your business.
           </p>
         )}
      </CardHeader>

      <CardContent className={`space-y-4 ${compact ? 'pt-0' : ''}`}>
        {/* Value Assessment */}
                 <div>
           <h4 className={`font-medium mb-2 ${compact ? 'text-sm' : 'text-base'}`}>
             Your Response
           </h4>
          <div className={`grid gap-2 ${compact ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'}`}>
            {valueAssessmentOptions.map((option) => {
              const IconComponent = option.icon;
              const isSelected = selectedValueAssessment === option.value;
              
              return (
                <Button
                  key={option.value}
                  variant={isSelected ? 'default' : 'outline'}
                  size={compact ? 'sm' : 'default'}
                  onClick={() => handleValueAssessmentSelect(option.value)}
                  className={`justify-start h-auto p-3 ${isSelected ? option.bgColor : ''}`}
                >
                  <IconComponent className={`w-4 h-4 mr-2 ${isSelected ? 'text-primary-foreground' : option.color}`} />
                  <div className="text-left">
                    <div className={`font-medium ${compact ? 'text-xs' : 'text-sm'}`}>
                      {option.label}
                    </div>
                    {!compact && (
                      <div className="text-xs text-muted-foreground">
                        {option.description}
                      </div>
                    )}
                  </div>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Implementation Details - Show when user selects "I Have This" */}
        {selectedValueAssessment === 'already_implemented' && (
          <div>
            <h4 className={`font-medium mb-2 ${compact ? 'text-sm' : 'text-base'}`}>
              How do you have this implemented?
            </h4>
            <Textarea
              value={implementationDetails}
              onChange={(e) => setImplementationDetails(e.target.value)}
              placeholder="e.g., through Microsoft 365, using HubSpot, with QuickBooks, etc."
              className={compact ? 'min-h-[60px]' : 'min-h-[80px]'}
              maxLength={200}
            />
            <div className="text-xs text-muted-foreground mt-1">
              This helps us create integration tasks to connect your tools to Nexus for better monitoring and analysis.
            </div>
          </div>
        )}

        {/* Rating (Optional) */}
        {showRating && (
          <div>
            <h4 className={`font-medium mb-2 ${compact ? 'text-sm' : 'text-base'}`}>
              Rating (Optional)
            </h4>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((rating) => (
                <Button
                  key={rating}
                  variant={selectedRating === rating ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedRating(selectedRating === rating ? null : rating)}
                  className="w-8 h-8 p-0"
                >
                  <Star className={`w-4 h-4 ${selectedRating === rating ? 'fill-current' : ''}`} />
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Implementation Status */}
        {showImplementationStatus && (
          <div>
            <h4 className={`font-medium mb-2 ${compact ? 'text-sm' : 'text-base'}`}>
              Implementation Status
            </h4>
            <div className={`grid gap-2 ${compact ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'}`}>
              {implementationStatusOptions.map((option) => {
                const IconComponent = option.icon;
                const isSelected = selectedImplementationStatus === option.value;
                
                return (
                  <Button
                    key={option.value}
                    variant={isSelected ? 'default' : 'outline'}
                    size={compact ? 'sm' : 'default'}
                    onClick={() => handleImplementationStatusSelect(option.value)}
                    className={`justify-start h-auto p-3 ${isSelected ? 'bg-primary/10' : ''}`}
                  >
                    <IconComponent className={`w-4 h-4 mr-2 ${isSelected ? 'text-primary' : option.color}`} />
                    <div className="text-left">
                      <div className={`font-medium ${compact ? 'text-xs' : 'text-sm'}`}>
                        {option.label}
                      </div>
                      {!compact && (
                        <div className="text-xs text-muted-foreground">
                          {option.description}
                        </div>
                      )}
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {/* Comment */}
        <div>
          <h4 className={`font-medium mb-2 ${compact ? 'text-sm' : 'text-base'}`}>
            Additional Comments (Optional)
          </h4>
          <Textarea
            value={feedbackComment}
            onChange={(e) => setFeedbackComment(e.target.value)}
            placeholder="Share any additional thoughts about this insight..."
            className={compact ? 'min-h-[60px]' : 'min-h-[80px]'}
            maxLength={500}
          />
          <div className="text-xs text-muted-foreground mt-1 text-right">
            {feedbackComment.length}/500
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleSubmit}
            disabled={!selectedValueAssessment || isSubmitting}
            className="flex-1"
            size={compact ? 'sm' : 'default'}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2" />
                Submitting...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Submit Feedback
              </>
            )}
          </Button>
          
          {onDismiss && (
            <Button
              variant="outline"
              onClick={onDismiss}
              size={compact ? 'sm' : 'default'}
            >
              <X className="w-4 h-4 mr-2" />
              Dismiss
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
