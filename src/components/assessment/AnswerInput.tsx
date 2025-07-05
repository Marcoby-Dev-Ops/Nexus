import React, { useState } from 'react';
import type { AssessmentQuestion } from '@prisma/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';

interface AnswerInputProps {
  question: AssessmentQuestion;
  onAnswer: (questionId: string, value: string | number | boolean | null) => void;
  isAnswered: boolean;
}

const AnswerInput: React.FC<AnswerInputProps> = ({ question, onAnswer, isAnswered }) => {
  const [value, setValue] = useState<string | number>('');

  const renderInput = () => {
    let inputComponent;

    switch (question.question_type) {
      case 'bool':
        inputComponent = (
          <div className="flex gap-2">
            <Button onClick={() => onAnswer(question.id, true)} variant="outline">Yes</Button>
            <Button onClick={() => onAnswer(question.id, false)} variant="outline">No</Button>
          </div>
        );
        break;
      case 'number':
      case 'text':
      case 'date':
        inputComponent = (
          <div className="flex gap-2">
            <Input
              type={question.question_type}
              value={value as string}
              onChange={(e) => setValue(e.target.value)}
              className="max-w-xs"
              placeholder={`Enter value...`}
            />
            <Button onClick={() => onAnswer(question.id, value)}>Submit</Button>
          </div>
        );
        break;
      case 'enum':
        inputComponent = (
          <Select onValueChange={(val) => onAnswer(question.id, val)}>
            <SelectTrigger className="max-w-xs">
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {question.options && typeof question.options === 'object' && !Array.isArray(question.options) ?
                Object.keys(question.options).map((key) => (
                  <SelectItem key={key} value={key}>{key}</SelectItem>
                )) : null}
            </SelectContent>
          </Select>
        );
        break;
      default:
        return <p className="text-red-500">Unknown question type</p>;
    }

    return (
      <div className="flex items-center gap-4 mt-2">
        {inputComponent}
        <Button onClick={() => onAnswer(question.id, null)} variant="ghost" size="sm">N/A</Button>
      </div>
    );
  };

  return (
    <div className="mt-4">
      {isAnswered ? (
        <p className="text-sm text-green-600 font-medium">Answered, thank you!</p>
      ) : (
        renderInput()
      )}
    </div>
  );
};

export default AnswerInput; 