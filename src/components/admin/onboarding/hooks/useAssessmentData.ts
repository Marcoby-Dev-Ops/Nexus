import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/index';

interface AssessmentQuestion {
  id: string;
  prompt: string;
  offer?: {
    name: string;
    description: string;
  };
}

interface AssessmentResponse {
  id: string;
  question?: AssessmentQuestion;
  value: string;
  score: number;
}

interface CategoryScore {
  category_id: string;
  score: number;
}

interface AssessmentSummary {
  overall_score: number;
}

interface AssessmentData {
  summary?: AssessmentSummary;
  categoryScores: CategoryScore[];
  responses: AssessmentResponse[];
  questions: AssessmentQuestion[];
}

interface UseAssessmentDataReturn {
  data: AssessmentData | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export const useAssessmentData = (): UseAssessmentDataReturn => {
  const { user } = useAuth();
  const [data, setData] = useState<AssessmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAssessmentData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // TODO: Replace with actual assessment API call
      // For now, return mock data
      const mockData: AssessmentData = {
        summary: {
          overall_score: 75
        },
        categoryScores: [
          { category_id: 'Financial Health', score: 80 },
          { category_id: 'Operations', score: 70 },
          { category_id: 'Marketing', score: 65 },
          { category_id: 'Team', score: 85 }
        ],
        responses: [],
        questions: [
          {
            id: '1',
            prompt: 'How would you rate your current cash flow?',
            offer: {
              name: 'Cash Flow Optimization',
              description: 'Get expert guidance on improving your cash flow management.'
            }
          },
          {
            id: '2',
            prompt: 'What is your primary business challenge?',
            offer: {
              name: 'Strategic Consulting',
              description: 'Work with our experts to overcome your biggest challenges.'
            }
          }
        ]
      };
      
      setData(mockData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch assessment data'));
      console.error('Error fetching assessment data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchAssessmentData();
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  return {
    data,
    loading,
    error,
    refetch: fetchAssessmentData,
  };
}; 