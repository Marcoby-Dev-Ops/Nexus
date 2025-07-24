  import React, { useState } from 'react';
import type { Tables } from '@/core/types/database.types';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/Select';

type AssessmentQuestion = Tables<'ai_assessment_questions'>;

interface AnswerInputProps {
  question: AssessmentQuestion;
  onAnswer: (questionId: string, value: string | number | boolean | null) => void;
  isAnswered: boolean;
}

const AnswerInput: React.FC<AnswerInputProps> = ({ question, onAnswer, isAnswered }) => {
  const [value, setValue] = useState<string | number>('');

  const renderInput = () => {
    let inputComponent;

    // Since the database doesn't have question_type, we'll use assessment_category as a proxy
    const questionType = question.assessment_category === 'boolean' ? 'bool' : 
                        question.assessment_category === 'number' ? 'number' : 
                        question.assessment_category === 'enum' ? 'enum' : 'text';

    switch (questionType) {
      case 'bool':
        inputComponent = (
          <div className="flex gap-2">
            <Button onClick={() => onAnswer(question.id.toString(), true)} variant="outline">Yes</Button>
            <Button onClick={() => onAnswer(question.id.toString(), false)} variant="outline">No</Button>
          </div>
        );
        break;
      case 'number':
      case 'text':
        inputComponent = (
          <div className="flex gap-2">
            <Input
              type={questionType}
              value={value as string}
              onChange={(e) => setValue(e.target.value)}
              className="max-w-xs"
              placeholder={`Enter value...`}
            />
            <Button onClick={() => onAnswer(question.id.toString(), value)}>Submit</Button>
          </div>
        );
        break;
      case 'enum':
        inputComponent = (
          <Select onValueChange={(val) => onAnswer(question.id.toString(), val)}>
            <SelectTrigger className="max-w-xs">
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {question.required_fields && typeof question.required_fields === 'object' && !Array.isArray(question.required_fields) ?
                Object.keys(question.required_fields).map((key) => (
                  <SelectItem key={key} value={key}>{key}</SelectItem>
                )) : null}
            </SelectContent>
          </Select>
        );
        break;
      default: return <p className="text-destructive">Unknown question type</p>;
    }

    return (
      <div className="flex items-center gap-4 mt-2">
        {inputComponent}
        <Button onClick={() => onAnswer(question.id.toString(), null)} variant="ghost" size="sm">N/A</Button>
      </div>
    );
  };

  return (
    <div className="mt-4">
      {isAnswered ? (
        <p className="text-sm text-success font-medium">Answered, thank you!</p>
      ) : (
        renderInput()
      )}
    </div>
  );
};

export default AnswerInput; 