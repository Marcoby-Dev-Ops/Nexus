import React, { useState } from 'react';
import { Star, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';

interface FeedbackButtonProps {
  messageId: string;
  onFeedback?: (messageId: string, rating: number, feedback?: string) => void;
  className?: string;
}

export const FeedbackButton: React.FC<FeedbackButtonProps> = ({ 
  messageId, 
  onFeedback,
  className = ""
}) => {
  const [showFeedback, setShowFeedback] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);

  const handleRatingSubmit = (rating: number) => {
    setSelectedRating(rating);
    setSubmitted(true);
    setShowFeedback(false);
    
    if (onFeedback) {
      onFeedback(messageId, rating);
    }
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      setSubmitted(false);
    }, 3000);
  };

  if (submitted) {
    return (
      <div className={`flex items-center gap-1 text-sm text-success ${className}`}>
        <Star className="w-3 h-3 fill-current" />
        <span>Thanks for your feedback!</span>
      </div>
    );
  }

  if (showFeedback) {
    return (
      <div className={`flex items-center gap-2 p-2 bg-background rounded-lg ${className}`}>
        <span className="text-sm text-muted-foreground">Rate this response:</span>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleRatingSubmit(1)}
            className="p-1 h-7 w-7"
            title="Poor"
          >
            <ThumbsDown className="w-3 h-3" />
          </Button>
          {[2, 3, 4, 5].map((rating) => (
            <Button
              key={rating}
              size="sm"
              variant="outline"
              onClick={() => handleRatingSubmit(rating)}
              className="p-1 h-7 w-7"
              title={`${rating} stars`}
            >
              <Star className="w-3 h-3" />
            </Button>
          ))}
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowFeedback(false)}
          className="text-xs text-muted-foreground"
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={() => setShowFeedback(true)}
      className={`text-xs text-muted-foreground hover:text-primary ${className}`}
    >
      Rate response
    </Button>
  );
}; 