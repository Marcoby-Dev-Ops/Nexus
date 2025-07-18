import React from 'react';
import type { Tables } from '@/core/types/database.types';

type AssessmentQuestion = Tables<'ai_assessment_questions'>;
type AssessmentCategory = { name: string };

export interface QuestionnaireProps {
  questions: (AssessmentQuestion & { category: AssessmentCategory })[];
  onAnswered: () => Promise<void>;
  className?: string;
}

/**
 * Questionnaire
 * Renders a list of assessment questions and a button to simulate answering.
 */
const Questionnaire: React.FC<QuestionnaireProps> = ({ questions, onAnswered, className = '' }) => (
  <section className={`rounded-lg bg-white dark:bg-gray-900 shadow p-4 ${className}`} aria-label="Questionnaire">
    <h3 className="text-lg font-semibold mb-2">Questionnaire</h3>
    {questions.length === 0 ? (
      <p className="text-gray-500 dark:text-gray-300">No questions available.</p>
    ) : (
      <ul className="space-y-4">
        {questions.map((q) => (
          <li key={q.id} className="border-b pb-2">
            <div className="font-medium">{q.question_text}</div>
            <div className="text-sm text-muted-foreground">Category: {q.category?.name}</div>
            {/* Simulate answer button */}
            <button
              className="mt-2 px-3 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90"
              onClick={onAnswered}
            >
              Answer
            </button>
          </li>
        ))}
      </ul>
    )}
  </section>
);

export default Questionnaire; 