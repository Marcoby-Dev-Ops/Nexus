import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import type { AssessmentQuestion, AssessmentCategory } from '@/types/supabase';
import AnswerInput from './AnswerInput';
import { supabase } from '../../lib/core/supabase';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip';
import { useToast } from '@/components/ui/Toast';

interface QuestionnaireProps {
  questions: (AssessmentQuestion & { category: AssessmentCategory })[];
  onAnswered: () => void;
}

const Questionnaire: React.FC<QuestionnaireProps> = ({ questions, onAnswered }) => {
  const [answeredQuestions, setAnsweredQuestions] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState<Record<string, boolean>>({});
  const { showToast } = useToast();

  const handleAnswer = async (questionId: string, value: string | number | boolean | null) => {
    setIsSubmitting((prev) => ({ ...prev, [questionId]: true }));
    try {
      const { error } = await supabase.functions.invoke('submit-assessment-response', {
        body: { questionId, answerValue: value },
      });

      if (error) {
        throw new Error(`Error submitting answer: ${error.message}`);
      }

      setAnsweredQuestions((prev) => ({ ...prev, [questionId]: true }));
      onAnswered(); // This will trigger a refetch on the parent page
    } catch (error) {
      console.error(error);
      showToast({
        title: 'Submission Error',
        description: error instanceof Error ? error.message : 'An error occurred while submitting your answer.',
        type: 'error',
      });
    } finally {
      setIsSubmitting((prev) => ({ ...prev, [questionId]: false }));
    }
  };

  const groupedQuestions = questions.reduce((acc, question) => {
    const categoryName = question.category.name;
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(question);
    return acc;
  }, {} as Record<string, typeof questions>);

  return (
    <div className="space-y-8">
      {Object.entries(groupedQuestions).map(([categoryName, questionsInCategory]) => (
        <Card key={categoryName}>
          <CardHeader>
            <CardTitle>{categoryName}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {questionsInCategory.map((question) => (
              <div key={question.id} className="p-4 border rounded-lg">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{question.prompt}</p>
                  {((question as any).explainer_text || (question as any).explainerText) && (
                    <Tooltip content={<p>{(question as any).explainer_text || (question as any).explainerText}</p>}>
                      <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
                    </Tooltip>
                  )}
                </div>
                <AnswerInput
                  question={question}
                  onAnswer={handleAnswer}
                  isAnswered={!!answeredQuestions[question.id] || isSubmitting[question.id]}
                />
                {question.marcovy_angle && (
                  <div className="mt-2 p-2 bg-muted rounded-md">
                    <p className="text-sm text-muted-foreground">{question.marcovy_angle}</p>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default Questionnaire; 