import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Textarea } from '@/shared/components/ui/Textarea';
import { Label } from '@/shared/components/ui/Label';
import { Progress } from '@/shared/components/ui/Progress';
import { logger } from '@/shared/utils/logger';

interface AssessmentQuestion {
  id: string;
  prompt: string;
  offer?: {
    name: string;
    description: string;
  };
}

interface QuestionnaireProps {
  questions: AssessmentQuestion[];
  onAnswered: () => void;
}

export const Questionnaire: React.FC<QuestionnaireProps> = ({ questions, onAnswered }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const handleAnswerChange = (value: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: value
    }));
  };

  const handleNext = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Submit all answers
      setIsSubmitting(true);
      try {
        // TODO: Submit answers to backend
        logger.info('Submitting answers', { answers });
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
        onAnswered();
      } catch (error) {
        logger.error('Failed to submit answers', { error });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const canProceed = answers[currentQuestion?.id] && answers[currentQuestion?.id].trim() !== '';

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
          <span className="text-sm font-medium">{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{currentQuestion?.prompt}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`answer-${currentQuestion?.id}`}>Your Answer</Label>
            <Textarea
              id={`answer-${currentQuestion?.id}`}
              placeholder="Please provide your detailed response..."
              value={answers[currentQuestion?.id] || ''}
              onChange={(e) => handleAnswerChange(e.target.value)}
              rows={4}
              className="min-h-[100px]"
            />
          </div>

          {currentQuestion?.offer && (
            <div className="p-4 bg-secondary/20 rounded-lg border border-secondary/30">
              <h4 className="font-semibold text-secondary-foreground mb-2">
                💡 Opportunity Available
              </h4>
              <p className="text-sm text-secondary-foreground/80">
                <strong>{currentQuestion.offer.name}</strong> - {currentQuestion.offer.description}
              </p>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
            >
              Previous
            </Button>
            
            <Button
              onClick={handleNext}
              disabled={!canProceed || isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 
               currentQuestionIndex === questions.length - 1 ? 'Submit Assessment' : 'Next'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Questionnaire; 
