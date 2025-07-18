/**
 * MessageFeedback Component
 * Pillar: 1,2 - Continuous improvement through user feedback loops
 * Provides immediate feedback collection on AI responses with follow-up tracking
 */

import React, { useState } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { Textarea } from '@/shared/components/ui/Textarea';
import { Card, CardContent } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { 
  ThumbsUp, 
  ThumbsDown, 
  MessageCircle, 
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  X
} from 'lucide-react';
import { useToast } from '@/shared/components/ui/Toast';
import { supabase } from '../../lib/core/supabase';
import { useAuth } from '@/domains/admin/user/hooks/AuthContext';

interface MessageFeedbackProps {
  messageId: string;
  conversationId: string;
  agentId?: string;
  messageContent: string;
  compact?: boolean;
  onFeedbackSubmitted?: (feedback: MessageFeedback) => void;
}

interface MessageFeedback {
  messageId: string;
  rating: 'helpful' | 'unhelpful';
  category?: 'accuracy' | 'relevance' | 'completeness' | 'clarity' | 'actionability';
  comment?: string;
  followUpNeeded?: boolean;
  improvementSuggestion?: string;
}

export const MessageFeedback: React.FC<MessageFeedbackProps> = ({
  messageId,
  conversationId,
  agentId,
  messageContent,
  compact = false,
  onFeedbackSubmitted
}) => {
  const [rating, setRating] = useState<'helpful' | 'unhelpful' | null>(null);
  const [showDetailedFeedback, setShowDetailedFeedback] = useState(false);
  const [category, setCategory] = useState<string>('');
  const [comment, setComment] = useState('');
  const [followUpNeeded, setFollowUpNeeded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const { user } = useAuth();
  const { showToast } = useToast();

  const feedbackCategories = [
    { id: 'accuracy', label: 'Accuracy', icon: <CheckCircle2 className="h-4 w-4" /> },
    { id: 'relevance', label: 'Relevance', icon: <Lightbulb className="h-4 w-4" /> },
    { id: 'completeness', label: 'Completeness', icon: <MessageCircle className="h-4 w-4" /> },
    { id: 'clarity', label: 'Clarity', icon: <AlertCircle className="h-4 w-4" /> },
    { id: 'actionability', label: 'Actionability', icon: <CheckCircle2 className="h-4 w-4" /> }
  ];

  const handleRatingClick = (newRating: 'helpful' | 'unhelpful') => {
    setRating(newRating);
    
    if (newRating === 'helpful') {
      // For positive feedback, submit immediately unless they want to add details
      submitFeedback(newRating);
    } else {
      // For negative feedback, always show detailed form
      setShowDetailedFeedback(true);
    }
  };

  const submitFeedback = async (
    feedbackRating: 'helpful' | 'unhelpful',
    detailedFeedback?: Partial<MessageFeedback>
  ) => {
    if (!user?.id || isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const feedback: MessageFeedback = {
        messageId,
        rating: feedbackRating,
        category: detailedFeedback?.category as any,
        comment: detailedFeedback?.comment,
        followUpNeeded: detailedFeedback?.followUpNeeded || false,
        improvementSuggestion: detailedFeedback?.improvementSuggestion
      };

      // Store feedback in database
      await supabase.from('ai_message_feedback').insert({
        message_id: messageId,
        conversation_id: conversationId,
        user_id: user.id,
        agent_id: agentId,
        rating: feedbackRating,
        feedback_category: feedback.category,
        comment: feedback.comment,
        follow_up_needed: feedback.followUpNeeded,
        improvement_suggestion: feedback.improvementSuggestion,
        message_content_hash: btoa(messageContent).slice(0, 50), // For analysis
        created_at: new Date().toISOString()
      });

      // Track in analytics
      await supabase.from('ai_audit_logs').insert({
        user_id: user.id,
        action: 'message_feedback_submitted',
        table_name: 'ai_message_feedback',
        record_id: messageId,
        details: {
          rating: feedbackRating,
          category: feedback.category,
          has_comment: !!feedback.comment,
          follow_up_needed: feedback.followUpNeeded,
          agent_id: agentId
        }
      });

      setIsSubmitted(true);
      onFeedbackSubmitted?.(feedback);
      
      showToast({
        title: 'Feedback Submitted',
        description: feedbackRating === 'helpful' 
          ? 'Thanks for the positive feedback!' 
          : 'Thanks for helping us improve!',
        type: 'success'
      });

      // Auto-hide after successful submission
      setTimeout(() => {
        setShowDetailedFeedback(false);
      }, 2000);

    } catch (error) {
      console.error('Error submitting feedback:', error);
      showToast({
        title: 'Feedback Failed',
        description: 'Unable to submit feedback. Please try again.',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDetailedSubmit = () => {
    if (!rating) return;
    
    submitFeedback(rating, {
      category: category as any,
      comment: comment.trim() || undefined,
      followUpNeeded,
      improvementSuggestion: comment.trim() || undefined
    });
  };

  if (isSubmitted && !showDetailedFeedback) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <CheckCircle2 className="h-4 w-4 text-success" />
        <span>Feedback submitted</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleRatingClick('helpful')}
          className={`h-8 px-2 ${rating === 'helpful' ? 'bg-success/10 text-success' : ''}`}
          disabled={isSubmitting}
        >
          <ThumbsUp className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleRatingClick('unhelpful')}
          className={`h-8 px-2 ${rating === 'unhelpful' ? 'bg-destructive/10 text-destructive' : ''}`}
          disabled={isSubmitting}
        >
          <ThumbsDown className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Initial Rating */}
      {!rating && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Was this helpful?</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleRatingClick('helpful')}
            className="h-8 px-4"
            disabled={isSubmitting}
          >
            <ThumbsUp className="h-4 w-4 mr-1" />
            Yes
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleRatingClick('unhelpful')}
            className="h-8 px-4"
            disabled={isSubmitting}
          >
            <ThumbsDown className="h-4 w-4 mr-1" />
            No
          </Button>
        </div>
      )}

      {/* Detailed Feedback Form */}
      {showDetailedFeedback && (
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-900/10">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Help us improve</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetailedFeedback(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Feedback Category */}
            <div className="space-y-2">
              <label className="text-sm font-medium">What could be better?</label>
              <div className="flex flex-wrap gap-2">
                {feedbackCategories.map((cat) => (
                  <Button
                    key={cat.id}
                    variant={category === cat.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCategory(category === cat.id ? '' : cat.id)}
                    className="h-8"
                  >
                    {cat.icon}
                    <span className="ml-1">{cat.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Additional feedback (optional)</label>
              <Textarea
                placeholder="What would make this response more helpful?"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="min-h-[80px]"
              />
            </div>

            {/* Follow-up */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="followUp"
                checked={followUpNeeded}
                onChange={(e) => setFollowUpNeeded(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="followUp" className="text-sm">
                I'd like someone to follow up on this
              </label>
            </div>

            {/* Submit */}
            <div className="flex gap-2">
              <Button
                onClick={handleDetailedSubmit}
                disabled={isSubmitting}
                size="sm"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowDetailedFeedback(false)}
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success State */}
      {rating && !showDetailedFeedback && (
        <div className="flex items-center gap-2">
          <Badge variant={rating === 'helpful' ? 'default' : 'secondary'}>
            {rating === 'helpful' ? (
              <>
                <ThumbsUp className="h-3 w-3 mr-1" />
                Helpful
              </>
            ) : (
              <>
                <ThumbsDown className="h-3 w-3 mr-1" />
                Needs improvement
              </>
            )}
          </Badge>
          {rating === 'unhelpful' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetailedFeedback(true)}
              className="h-6 text-xs"
            >
              Add details
            </Button>
          )}
        </div>
      )}
    </div>
  );
}; 