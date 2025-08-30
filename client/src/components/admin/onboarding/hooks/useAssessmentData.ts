import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/index';
import { businessHealthService } from '@/core/services/BusinessHealthService';
import { analyticsService } from '@/services/core/AnalyticsService';
import { logger } from '@/shared/utils/logger';

export interface AssessmentData {
  summary: {
    overall_score: number;
  };
  categoryScores: Array<{
    category_id: string;
    score: number;
  }>;
  responses: any[];
  questions: Array<{
    id: string;
    prompt: string;
    offer: {
      name: string;
      description: string;
    };
  }>;
}

interface UseAssessmentDataReturn {
  data: AssessmentData | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
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
      
      if (!user?.id) {
        setLoading(false);
        return;
      }

      // Load real assessment data from business health service
      const healthResult = await businessHealthService.readLatest();
      const insightsResult = await analyticsService.getInsights({ user_id: user.id });

      if (healthResult.success && healthResult.data) {
        const healthData = healthResult.data;
        
        // Convert business health data to assessment format
        const realAssessmentData: AssessmentData = {
          summary: {
            overall_score: healthData.overall_score || 0
          },
          categoryScores: Object.entries(healthData.category_scores || {}).map(([category, score]) => ({
            category_id: category,
            score: score as number
          })),
          responses: [],
          questions: [
            {
              id: '1',
              prompt: 'How would you rate your current business health?',
              offer: {
                name: 'Business Health Optimization',
                description: `Your current score is ${healthData.overall_score}%. Get expert guidance on improving your business health.`
              }
            },
            {
              id: '2',
              prompt: 'What is your primary business challenge?',
              offer: {
                name: 'Strategic Consulting',
                description: 'Work with our experts to overcome your biggest challenges and improve performance.'
              }
            }
          ]
        };

        // Add insights-based questions if available
        if (insightsResult.success && insightsResult.data && insightsResult.data.length > 0) {
          const topInsight = insightsResult.data[0];
          realAssessmentData.questions.push({
            id: '3',
            prompt: 'Would you like to address this business insight?',
            offer: {
              name: 'Insight Action Plan',
              description: topInsight.title || 'Get a personalized action plan for this business insight.'
            }
          });
        }

        // Add completion-based question
        if (healthData.completion_percentage < 100) {
          realAssessmentData.questions.push({
            id: '4',
            prompt: 'Complete your business profile for better insights',
            offer: {
              name: 'Profile Completion',
              description: `Your profile is ${healthData.completion_percentage}% complete. Complete it for personalized recommendations.`
            }
          });
        }

        setData(realAssessmentData);
      } else {
        // Fallback to basic assessment data
        const fallbackData: AssessmentData = {
          summary: {
            overall_score: 50
          },
          categoryScores: [
            { category_id: 'Financial Health', score: 50 },
            { category_id: 'Operations', score: 50 },
            { category_id: 'Marketing', score: 50 },
            { category_id: 'Team', score: 50 }
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
        setData(fallbackData);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch assessment data');
      setError(error);
      logger.error('Error fetching assessment data', { error: err, userId: user?.id });
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
